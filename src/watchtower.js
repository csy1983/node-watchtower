import autobind from 'autobind-decorator';
import Docker from 'dockerode';
import debug from 'debug';
import EventEmitter from 'events';
import fs from 'fs';
import os from 'os';
import { Readable } from 'stream';
import url from 'url';
import zlib from 'zlib';
import ManifestExtractor from './extractor';

const DEFAULT_WATCHTOWER_LABEL = 'tw.chardi.watchtower';

/**
 * @class Watchtower
 * @constructor
 * @extends EventEmitter
 */
@autobind
export default class Watchtower extends EventEmitter {
  /**
   * Constructor
   * @param {Object} configs Watchtower configurations:
   * {
   *   checkUpdateInterval: {Number} [Default: 180][Unit: second]
   *     - Polling interval for checking images updates.
   *     - Polling is disabled while setting to <= 0.
   *   timeToWaitBeforeHealthyCheck: {Number} [Default: 30][Unit: second]
   *     - Time to wait for updated container to start before checking its healthy.
   *   pruneImages: {Boolean} [Default: false]
   *     - Delete unused images during activation.
   *   retireOldWatchtower: {Boolean} [Default: false]
   *     - Remove centurylink/watchtower container and image
   *   dockerOptions: {Object} [Default: undefined]
   *     - Options for creating dockerode instance.
   *     - Refer to https://github.com/apocas/dockerode
   *   label: {String}[Default: tw.chardi.watchtower]
   *     - Watchtower label of docker container.
   *     - Used to indicate that the container to be updated is watchtower itself. (see isWatchtower method).
   *     - We need this because the process of updating watchtower is different (see applyUpdate method).
   * }
   */
  constructor(configs = {}) {
    super();
    this.configs = Object.assign({
      /* Default configs */
      checkUpdateInterval: 180, /* in seconds */
      timeToWaitBeforeHealthyCheck: 30, /* in seconds */
      pruneImages: false,
      retireOldWatchtower: false,
      label: DEFAULT_WATCHTOWER_LABEL,
    }, configs);
    this.docker = new Docker(this.configs.dockerOptions);
    this.manifestExtractor = new ManifestExtractor();
    this.registryAuths = {};
    this.availableUpdates = {};
    this.busy = false;
    this.forceTerminate = false;

    this.watch = () => {
      if (this.configs.checkUpdateInterval > 0) {
        this.watcher = setTimeout(async () => {
          await this.checkForUpdates();
          this.watch();
        }, this.configs.checkUpdateInterval * 1000);
      }
    };

    this.unwatch = () => {
      clearTimeout(this.watcher);
    };

    this.parseImageName = (image) => {
      if (image.indexOf('/') < 0) image = `/${image}`;
      let comp = url.parse(`docker://${image}`);
      let host = comp.host;
      let fullname = comp.path.split('/')[1];
      let repo = fullname.split(':')[0];
      let tag = fullname.split(':')[1] || 'latest';
      if (host) repo = `${host}/${repo}`;
      return { host, repo, tag };
    };

    this.setBusy = async () => {
      await this.waitForBusy();
      this.busy = true;
    };

    this.clearBusy = () => {
      this.busy = false;
    };

    this.waitForBusy = () => {
      return new Promise((resolve) => {
        if (this.busy) {
          debug('watchtower:waitForBusy')('Wait for busy...');
          const waiter = setInterval(() => {
            if (!this.busy) {
              clearInterval(waiter);
              resolve();
            }
          }, 1000);
        } else {
          resolve();
        }
      });
    };

    this.waitForDelay = (delay) => {
      return new Promise((resolve) => {
        setTimeout(resolve, delay * 1000);
      });
    };

    this.followProgress = (stream) => {
      return new Promise((resolve, reject) => {
        const dbg = debug('watchtower:followProgress');
        let status;

        this.docker.modem.followProgress(stream, (progressError) => {
          /* onFinished */
          if (progressError) {
            reject(progressError);
          } else {
            resolve();
          }
        }, (event) => {
          /* onProgress */
          if (event.status && event.status !== status) {
            status = event.status;
            dbg(status);
          }
        });
      });
    };

    this.terminate = () => {
      if (this.forceTerminate) {
        process.exit(0);
      } else {
        this.forceTerminate = true;
        this.inactivate().then(() => {
          process.exit(0);
        });

        setTimeout(() => {
          console.log('Watchtower is currently busy, please wait...');
          console.log('[ Press ^C again to force shut me down (may cause problems). ]');
        }, 3000);
      }
    };
  }

  /**
   * Check if given container is watchtower.
   * @param  {Object}  containerInfo Container info returned by container.inspect().
   * @return {Boolean}
   */
  isWatchtower(containerInfo) {
    return containerInfo.Config.Labels[this.configs.label];
  }

  /**
   * Retire my old friend centurylink/watchtower.
   */
  async retireOldWatchtower() {
    const dbg = debug('watchtower:retireOldWatchtower');
    let containers = await this.docker.listContainers();
    let oldFriend = containers.find((container) => {
      return container.Labels['com.centurylinklabs.watchtower'] &&
        !container.Labels[DEFAULT_WATCHTOWER_LABEL];
    });

    if (oldFriend) {
      dbg('Retiring old friend centurylink/watchtower');
      await this.docker.getContainer(oldFriend.Id).stop();
      await this.docker.getContainer(oldFriend.Id).remove();
      await this.docker.getImage(oldFriend.Image).remove();
    }
  }

  /**
   * Add docker registry authentication information.
   *
   * @param {Object} serverAuth Server authentication information:
   * {
   *   serveraddress: Server URL
   *   username: Login user name
   *   password: Login password
   *   auth: Base64 encoded auth credentials (Optional)
   *   email: User email (Optional)
   * }
   * @return {Boolean}          Return true if success, false otherwise.
   */
  addRegistryAuth(serverAuth) {
    if (!serverAuth || !serverAuth.serveraddress) return false;
    if (!serverAuth.auth && (!serverAuth.username || !serverAuth.password)) return false;
    this.registryAuths[serverAuth.serveraddress] = serverAuth;
    return true;
  }

  /**
   * Activate watchtower, if `checkUpdateInterval` is set, watchtower will start
   * polling for checking updates. This will also delete all unused images if
   * `pruneImages` is set.
   */
  async activate() {
    process.on('SIGINT', this.terminate);
    process.on('SIGTERM', this.terminate);
    if (this.configs.pruneImages) {
      await this.pruneImages();
    }
    if (this.configs.retireOldWatchtower) {
      await this.retireOldWatchtower();
    }
    await this.watch();
  }

  /**
   * Inactivate watchtower. Watchtower will wait for busy before termination.
   */
  async inactivate() {
    this.unwatch();
    process.removeListener('SIGINT', this.terminate);
    process.removeListener('SIGTERM', this.terminate);
    await this.waitForBusy();
  }

  /**
   * Update watchtower configs.
   *
   * @param {Object} configs Configuration object:
   * {
   *   checkUpdateInterval: {Number} [Default: 180][Unit: second]
   *   timeToWaitBeforeHealthyCheck: {Number} [Default: 30][Unit: second]
   * }
   * @return {Number}        Error number
   */
  updateConfig(configs) {
    const dbg = debug('watchtower:updateConfig');
    dbg(configs);

    if (configs.checkUpdateInterval) {
      if (isNaN(configs.checkUpdateInterval)) return -1;
      this.configs.checkUpdateInterval = configs.checkUpdateInterval;
    }

    if (configs.timeToWaitBeforeHealthyCheck) {
      if (isNaN(configs.timeToWaitBeforeHealthyCheck)) return -1;
      this.configs.timeToWaitBeforeHealthyCheck = configs.timeToWaitBeforeHealthyCheck;
    }

    this.unwatch();
    this.watch();

    return 0;
  }

  /**
   * Get available updates for given image name.
   *
   * @param  {String} image Image name
   * @return {Object}       Container info object
   */
  getAvailableUpdate(image) {
    if (!image) return null;
    return this.availableUpdates[image];
  }

  /**
   * Check for updates.
   */
  async checkForUpdates() {
    const dbg = debug('watchtower:checkForUpdates');
    if (this.configs.checkUpdateInterval < 0) return;
    if (this.busy) return;

    dbg('Checking for updates...');

    await this.setBusy();

    let containers = await this.docker.listContainers();
    await containers.filter((containerBrief) => {
      // Skip orphaned container who's image name equals to image ID
      return (containerBrief.Image !== containerBrief.ImageID);
    }).reduce((curr, next, index, filteredContainers) => {
      return curr.then(() => this.checkout(filteredContainers[index]));
    }, Promise.resolve());

    await this.clearBusy();

    dbg('Update check finished');
  }

  /**
   * Checkout given container to see if there is any update.
   * If yes, emit an 'updateFound' event;
   * Otherwise, 'updateNotFound' event is emitted.
   *
   * @param {Object} containerBrief Container brief object returned by listContainers().
   */
  async checkout(containerBrief) {
    const dbg = debug('watchtower:checkout');
    const { repo, tag } = this.parseImageName(containerBrief.Image);
    const containerInfo = await this.docker.getContainer(containerBrief.Id).inspect();

    /* Skip repo with reserved tags and containers which are not running */
    if (tag.match(/.*-wt-(curr|next|prev)$/) || !containerInfo.State.Running) {
      return;
    }

    dbg(`Backup ${repo}:${tag} to ${repo}:${tag}-wt-curr`);
    await this.docker.getImage(`${repo}:${tag}`).tag({ repo, tag: `${tag}-wt-curr` });

    dbg(`Pull ${repo}:${tag}`);
    try {
      await this.pull(containerInfo.Config.Image);
    } catch (error) {
      dbg(`Pull ${repo}:${tag} failed:`);
      dbg(error);
      dbg(`Restoring ${repo}:${tag} and skip this image`);
      await this.docker.getImage(`${repo}:${tag}-wt-curr`).tag({ repo, tag });
      await this.docker.getImage(`${repo}:${tag}-wt-curr`).remove();
      return;
    }

    dbg(`Tag ${repo}:${tag} to ${repo}:${tag}-wt-next`);
    try {
      dbg(`If tag ${repo}:${tag}-wt-next is already exists, then remove it first.`);
      await this.docker.getImage(`${repo}:${tag}-wt-next`).remove();
    } catch (error) {}
    await this.docker.getImage(`${repo}:${tag}`).tag({ repo, tag: `${tag}-wt-next` });

    dbg(`Restore ${repo}:${tag}-wt-curr back to ${repo}:${tag}`);
    await this.docker.getImage(`${repo}:${tag}-wt-curr`).tag({ repo, tag });

    dbg(`Remove ${repo}:${tag}-wt-curr which is temporarily created`);
    await this.docker.getImage(`${repo}:${tag}-wt-curr`).remove();

    dbg(`Compare creation date between ${repo}:${tag} and ${repo}:${tag}-wt-next`);
    const curr = await this.docker.getImage(`${repo}:${tag}`).inspect();
    const next = await this.docker.getImage(`${repo}:${tag}-wt-next`).inspect();

    dbg(`current = ${curr.Created}, next = ${next.Created}`);
    if (curr.Created < next.Created) {
      try {
        /* Check if this image is failed to apply before, if yes then skip it. */
        const fail = await this.docker.getImage(`${repo}:${tag}-wt-fail`).inspect();
        if (fail && (fail.Id === next.Id)) {
          dbg('This image had failed before, skip it');
          return;
        } else if (fail) {
          /* We have a new image to update, remove old failed one */
          await this.docker.getImage(`${repo}:${tag}-wt-fail`).remove();
        }
      } catch (skip) {}

      /**
       * Save the container info to availableUpdates object and emit an
       * 'updateFound' event with the container info to client to notify
       * users that there is an image update, and keep 'repo:tag-wt-next'
       * until client has decided to apply the update or not.
       */
      dbg(`Emit 'updateFound' event for ${containerInfo.Config.Image}`);
      this.availableUpdates[containerInfo.Config.Image] = containerInfo;
      this.emit('updateFound', containerInfo.Config.Image);
    } else {
      /**
       * Current image is already latest version, emit an 'updateNotFound' event
       * and remove 'repo:tag-wt-next' which is temporarily created.
       */
      dbg(`${repo}:${tag} is already up-to-date, emit 'updateNotFound' event for ${containerInfo.Config.Image}`);
      if (this.availableUpdates[containerInfo.Config.Image]) {
        delete this.availableUpdates[containerInfo.Config.Image];
      }
      this.emit('updateNotFound', containerInfo.Config.Image);
      await this.docker.getImage(`${repo}:${tag}-wt-next`).remove();
    }
  }

  /**
   * Apply update for given container.
   *
   * @param  {Object} containerInfo Container object to be updated returned by inspect().
   * @return {Promise}              A promise with the result of the update.
   */
  async applyUpdate(containerInfo) {
    const dbg = debug('watchtower:applyUpdate');
    const { repo, tag } = this.parseImageName(containerInfo.Config.Image);
    const containerName = containerInfo.Name.replace(/^\//, '');

    await this.setBusy();

    try {
      dbg(`Rename ${repo}:${tag} container to avoid name conflict`);
      await this.docker.getContainer(containerInfo.Id).rename({
        _query: { name: `${containerName}-${Date.now()}` },
      });

      if (!this.isWatchtower(containerInfo)) {
        dbg(`Stop ${repo}:${tag} container`);
        await this.docker.getContainer(containerInfo.Id).stop();
      } else {
        dbg(`${repo}:${tag} is a watchtower container, I'm going to update myself`);
        dbg('But I won\'t stop and will keep working until the new one is up and running');
      }

      dbg(`Backup old ${repo}:${tag} to ${repo}:${tag}-wt-prev`);
      await this.docker.getImage(`${repo}:${tag}`).tag({ repo, tag: `${tag}-wt-prev` });

      dbg(`Remove old ${repo}:${tag} image`);
      await this.docker.getImage(`${repo}:${tag}`).remove();

      dbg(`Tag image ${repo}:${tag}-wt-next to ${repo}:${tag}`);
      await this.docker.getImage(`${repo}:${tag}-wt-next`).tag({ repo, tag });

      dbg(`Update 'create options' of container ${repo}:${tag} with new options`);
      const updatedImage = await this.docker.getImage(`${repo}:${tag}-wt-next`).inspect();
      const createOptions = containerInfo.Config;
      createOptions.HostConfig = containerInfo.HostConfig;
      createOptions._query = { name: containerName };
      createOptions.Env = updatedImage.Config.Env;
      createOptions.Entrypoint = updatedImage.Config.Entrypoint;

      /* Overwrite container configs from docker-compose service config */
      try {
        const configData = updatedImage.Config.Labels['com.docker.compose.service-config'];
        if (configData) {
          const composeConfig = JSON.parse(configData);

          if (composeConfig.container_name) {
            createOptions._query = { name: composeConfig.container_name };
          }

          if (composeConfig.network_mode) {
            createOptions.HostConfig.NetworkMode = composeConfig.network_mode;
          }

          if (composeConfig.privileged) {
            createOptions.HostConfig.Privileged = true;
          }

          if (composeConfig.environment) {
            /* Reset default environments */
            createOptions.Env = [];

            /* Set environments */
            for (let i = 0; i < Object.keys(composeConfig.environment).length; i++) {
              let key = Object.keys(composeConfig.environment)[i];
              let value = composeConfig.environment(key);
              createOptions.Env.push(`${key}=${value}`);
            }
          }

          if (composeConfig.command) {
            createOptions.Cmd = composeConfig.command.split(' ');
          }

          if (composeConfig.entrypoint) {
            if (typeof composeConfig.entrypoint === 'string') {
              createOptions.Entrypoint = composeConfig.entrypoint.split(' ');
            } else if (Array.isArray(composeConfig.entrypoint)) {
              createOptions.Entrypoint = composeConfig.entrypoint;
            }
          }

          if (composeConfig.volumes && composeConfig.volumes.length > 0) {
            /* Reset default volumes */
            createOptions.Volumes = {};
            createOptions.HostConfig.Binds = [];

            /* Specify volumes from docker-compose config */
            for (let i = 0; i < composeConfig.volumes.length; i++) {
              let volume = composeConfig.volumes[i];
              if (typeof volume === 'string') {
                if (volume.includes(':')) {
                  createOptions.HostConfig.Binds.push(composeConfig.volumes[i]);
                } else {
                  createOptions.Volumes[volume] = {};
                }
              } else if (typeof volume === 'object') {
                /* TODO: To support long syntax volumes */
              }
            }
          }
        }
      } catch (e) {}

      dbg(`Create updated container of ${repo}:${tag} image`);
      let updatedContainer = await this.docker.createContainer(createOptions);

      dbg(`Start updated container of ${repo}:${tag} image`);
      updatedContainer = await updatedContainer.start();

      dbg(`Waiting ${this.configs.timeToWaitBeforeHealthyCheck} seconds for the container to start before healthy check`);
      await this.waitForDelay(this.configs.timeToWaitBeforeHealthyCheck);

      const updatedContainerInfo = await updatedContainer.inspect();
      dbg(`${repo}:${tag} healthy check result:\n${JSON.stringify(updatedContainerInfo.State, null, 2)}`);
      if (updatedContainerInfo.State.Running) {
        dbg(`Updated container of ${repo}:${tag} is up and running, remove temporary tags '${tag}-wt-next' and '${tag}-wt-prev'`);
        await this.docker.getImage(`${repo}:${tag}-wt-next`).remove();
        await this.docker.getImage(`${repo}:${tag}-wt-prev`).remove();
        delete this.availableUpdates[containerInfo.Config.Image];

        if (this.isWatchtower(containerInfo)) {
          dbg('We are going to apply updated watchtower container, stop the old one');
          await this.docker.getContainer(containerInfo.Id).stop();
        }

        dbg(`Remove previous ${repo}:${tag} container`);
        await this.docker.getContainer(containerInfo.Id).remove();

        dbg(`Update ${repo}:${tag} successfully`);
        await this.clearBusy();

        /* Apply successfully, return updated container info */
        return Promise.resolve(updatedContainerInfo);
      }

      /* Apply failed, clean the mess up and throw an error to fall back */
      dbg(`Tag failed ${repo}:${tag} image with '-wt-fail' postfix`);
      try {
        await this.docker.getImage(`${repo}:${tag}-wt-fail`).remove();
      } catch (skip) {}
      await this.docker.getImage(`${repo}:${tag}`).tag({ repo, tag: `${tag}-wt-fail` });

      dbg(`Remove failed ${repo}:${tag} container and its image`);
      await this.docker.getContainer(updatedContainerInfo.Id).remove();
      await this.docker.getImage(`${repo}:${tag}`).remove();
      await this.docker.getImage(`${repo}:${tag}-wt-next`).remove();

      throw new Error('Start container failed');
    } catch (error) {
      if (error.message !== 'Start container failed') {
        dbg('Unexpected error:');
        dbg(error);
      }

      try {
        dbg(`Failed to start updated container of ${repo}:${tag}, fall back to previous version`);
        await this.docker.getImage(`${repo}:${tag}-wt-prev`).tag({ repo, tag });
        await this.docker.getImage(`${repo}:${tag}-wt-prev`).remove();
      } catch (skip) {}

      dbg(`Restart previous working version of ${repo}:${tag}`);
      await this.docker.getContainer(containerInfo.Id).rename({ _query: { name: `${containerName}` } });
      await this.docker.getContainer(containerInfo.Id).start();

      dbg(`Update ${repo}:${tag} failed`);

      await this.clearBusy();

      return Promise.reject({
        message: error.message,
        containerInfo,
      });
    }
  }

  /**
   * Pull latest image with given name.
   *
   * @param  {String} name Image name to pull.
   * @return {Promise}     A promise with the result of pull.
   */
  async pull(name) {
    const dbg = debug('watchtower:pull');
    const { host, repo, tag } = this.parseImageName(name);
    const options = { authconfig: this.registryAuths[host] };

    dbg(`Pulling ${name}`);

    let pullStream = await new Promise((resolve, reject) => {
      this.docker.pull(`${repo}:${tag}`, options, (error, stream) => {
        if (error) reject(error);
        else resolve(stream);
      });
    });
    await this.followProgress(pullStream);

    dbg(`Image ${name} pulled`);
  }

  /**
   * Upoad a gzipped tarball image to the registry server.
   *
   * @param  {String|Stream} src     Image data source, can be path of a '.tar.gz' file or a Readable stream.
   * @param  {Object}        options Options available:
   * {
   *   tagToLatest: {Boolean} [Default: false] Tag image to latest and remove original tag.
   * }
   * @return {Array}                 Repo tags of the image.
   */
  async upload(src, options = {}) {
    const dbg = debug('watchtower:load');
    let extractor = new ManifestExtractor();
    let tarpath = `${os.tmpdir()}/${Date.now()}.tar`;
    let stream;
    let repoTags;
    let backupRunningRepoTag;

    if (typeof src === 'string') {
      extractor.on('manifests', (manifests) => {
        if (manifests.length > 0 && manifests[0].RepoTags) {
          repoTags = manifests[0].RepoTags;
          dbg('Found RepoTags:', repoTags);
        }
      });

      stream = fs.createReadStream(src)
        .pipe(zlib.createGunzip())
        .pipe(extractor)
        .pipe(fs.createWriteStream(tarpath));
    } else if (src instanceof Readable) {
      stream = src;
      if (options.repoTag) {
        repoTags = [options.repoTag];
      } else {
        return Promise.reject('You have to set options.repoTag when image source is a stream');
      }
    } else {
      const error = 'Unsupported type of image source';
      dbg(error);
      extractor.removeAllListeners();
      return Promise.reject(error);
    }

    await this.waitForDelay(3);

    if (!repoTags) {
      return Promise.reject('No RepoTags found');
    }

    dbg(`Uploading image ${stream.path || 'from Readable stream'}...`);

    /* Backup image who is used by running containers */
    let containers = await this.docker.listContainers();
    containers.forEach((container) => {
      for (let i = 0; i < repoTags.length; i++) {
        let { repo, tag } = this.parseImageName(repoTags[i]);
        let repoTag;

        if (options.tagToLatest || tag === 'latest') {
          repoTag = `${repo}`;
        } else {
          repoTag = `${repo}:${tag}`;
        }
        dbg(`Compare ${container.Image} to ${repoTag}`);
        if (repoTag === container.Image) {
          backupRunningRepoTag = repoTag;
          break;
        }
      }
    });

    if (backupRunningRepoTag) {
      dbg(`Backup running RepoTag: ${backupRunningRepoTag}`);
      let { repo, tag } = this.parseImageName(backupRunningRepoTag);
      await this.docker.getImage(backupRunningRepoTag).tag({ repo, tag: `${tag}-wt-backup` });
    }

    dbg('Loading image...');
    await this.setBusy();
    await this.docker.loadImage(fs.createReadStream(tarpath, {}));
    extractor.removeAllListeners();
    fs.unlink(tarpath);

    if (options.tagToLatest) {
      let { repo } = this.parseImageName(repoTags[0]);
      dbg(`Tag uploaded image ${repoTags[0]} to ${repo}:latest`);
      await this.docker.getImage(repoTags[0]).tag({ repo, tag: 'latest' });
      dbg(`Remove image tag ${repoTags[0]}`);
      await this.docker.getImage(repoTags[0]).remove();
      dbg(`Add RepoTag ${repo}:latest`);
      repoTags.unshift(`${repo}:latest`);
    }

    /* Push uploaded image */
    let repoTag = backupRunningRepoTag || repoTags[0];
    let { host } = this.parseImageName(repoTag);
    let pushOptions = { authconfig: this.registryAuths[host] };

    dbg(`Pushing image ${repoTag}...`);

    let pushStream = await this.docker.getImage(repoTag).push(pushOptions);
    await this.followProgress(pushStream);

    dbg(`Image ${repoTag} pushed`);

    /* Revert back image who is used by running container */
    if (backupRunningRepoTag) {
      dbg(`Revert running RepoTag: ${backupRunningRepoTag}`);
      let { repo, tag } = this.parseImageName(backupRunningRepoTag);
      await this.docker.getImage(`${repo}:${tag}-wt-backup`).tag({ repo, tag });
      await this.docker.getImage(`${repo}:${tag}-wt-backup`).remove();
    }

    await this.clearBusy();

    dbg(`Image ${stream.path || 'stream'} loaded`);

    return Promise.resolve(repoTag);
  }

  /**
   * Delete unused images.
   */
  async pruneImages() {
    const dbg = debug('watchtower:pruneImages');
    const result = await this.docker.pruneImages();
    dbg(result);
  }
}
