import autobind from 'autobind-decorator';
import Docker from 'dockerode';
import debug from 'debug';
import EventEmitter from 'events';
import fs from 'fs';
import { Readable } from 'stream';
import url from 'url';
import zlib from 'zlib';
import ManifestExtractor from './extractor';

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
   *   checkUpdateInterval: Polling interval for checking images updates. Polling is disabled while setting to <= 0. [Default: 180][Unit: second]
   *   timeToWaitBeforeHealthyCheck: Time to wait for updated container to start before checking its healthy. [Default: 30][Unit: second]
   *   dockerOptions: Options for creating dockerode instance. [Default: undefined]
   * }
   */
  constructor(configs = {}) {
    super();
    this.configs = {
      checkUpdateInterval: configs.checkUpdateInterval || 180, /* in seconds */
      timeToWaitBeforeHealthyCheck: configs.timeToWaitBeforeHealthyCheck || 30, /* in seconds */
      dockerOptions: configs.dockerOptions,
    };
    this.docker = new Docker(this.configs.dockerOptions);
    this.manifestExtractor = new ManifestExtractor();
    this.registryAuths = {};
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
    this.clearBusy = () => { this.busy = false; };
    this.waitForBusy = () => {
      return new Promise((resolve) => {
        if (this.busy) {
          debug('watchtower:waitForBusy')('Wait for busy...');
          const waiter = setInterval(() => {
            if (!this.busy) {
              clearInterval(waiter);
              resolve();
            }
          });
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
   * Add docker registry authentication information.
   *
   * @param {String} server Registry server URL.
   * @param {Object} auth   Authentication information:
   * {
   *   username: Login user name
   *   password: Login password
   *   auth: Base64 encoded auth credentials (Optional)
   *   email: User email (Optional)
   * }
   * @return {Boolean}      Return true if success, false otherwise.
   */
  addRegistryAuth(server, auth) {
    if (!server || !auth) return false;
    if (!auth.username || !auth.password) return false;
    this.registryAuths[server] = auth;
    this.registryAuths[server].serveraddress = server;
    return true;
  }

  /**
   * Activate watchtower, if `checkUpdateInterval` is set, watchtower will start
   * polling for checking updates.
   */
  async activate() {
    process.on('SIGINT', this.terminate);
    process.on('SIGTERM', this.terminate);
    await this.watch();
  }

  /**
   * Inactivate watchtower. Watchtower will wait for busy before termination.
   */
  async inactivate() {
    clearTimeout(this.watcher);
    process.removeListener('SIGINT', this.terminate);
    process.removeListener('SIGTERM', this.terminate);
    await this.waitForBusy();
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
    await containers.filter((containerInfo) => {
      // Skip orphaned container (where image name equals to image ID)
      return (containerInfo.Image !== containerInfo.ImageID);
    }).reduce((curr, next, index, filteredContainers) => {
      return curr.then(() => this.checkout(filteredContainers[index]));
    }, Promise.resolve());

    await this.clearBusy();

    dbg('Update check finished');
  }

  /**
   * Checkout given container to see if there is any update. If yes, emit an
   * 'updateFound' event; if no, 'updateNotFound' event is emitted.
   *
   * @param {Object} containerInfo Container info object to be checked out.
   */
  async checkout(containerInfo) {
    const dbg = debug('watchtower:checkout');
    const { repo, tag } = this.parseImageName(containerInfo.Image);
    const container = await this.docker.getContainer(containerInfo.Id).inspect();

    /* Skip repo with reserved tags and containers which are not running */
    if (tag.match(/.*-wt-curr$/) ||
        tag.match(/.*-wt-next$/) ||
        tag.match(/.*-wt-prev$/) ||
        !container.State.Running) return;

    dbg(`1. Backup ${repo}:${tag} to ${repo}:${tag}-wt-curr`);
    await this.docker.getImage(`${repo}:${tag}`).tag({ repo, tag: `${tag}-wt-curr` });

    dbg(`2. Pull ${repo}:${tag}`);
    try {
      await this.pull(containerInfo.Image);
    } catch (error) {
      dbg(`2-1. Pull ${repo}:${tag} failed:`);
      dbg(error);
      dbg(`Restoring ${repo}:${tag} and skip this image`);
      await this.docker.getImage(`${repo}:${tag}-wt-curr`).tag({ repo, tag });
      await this.docker.getImage(`${repo}:${tag}-wt-curr`).remove();
      return;
    }

    dbg(`3. Tag ${repo}:${tag} to ${repo}:${tag}-wt-next`);
    try {
      dbg(`3-1. If tag ${repo}:${tag}-wt-next is already exists, then remove it first.`);
      await this.docker.getImage(`${repo}:${tag}-wt-next`).remove();
    } catch (error) {}
    await this.docker.getImage(`${repo}:${tag}`).tag({ repo, tag: `${tag}-wt-next` });

    dbg(`4. Restore ${repo}:${tag}-wt-curr back to ${repo}:${tag}`);
    await this.docker.getImage(`${repo}:${tag}-wt-curr`).tag({ repo, tag });

    dbg(`5. Remove ${repo}:${tag}-wt-curr which is temporarily created`);
    await this.docker.getImage(`${repo}:${tag}-wt-curr`).remove();

    dbg(`6. Compare creation date between ${repo}:${tag} and ${repo}:${tag}-wt-next`);
    const curr = await this.docker.getImage(`${repo}:${tag}`).inspect();
    const next = await this.docker.getImage(`${repo}:${tag}-wt-next`).inspect();

    dbg(`7. current = ${curr.Created}, next = ${next.Created}`);
    if (curr.Created < next.Created) {
      /**
       * 7-1. If yes, emit an 'updateFound' event with container info to client to
       *      notify that there is an new image to update, and keep 'repo:tag-wt-next'
       *      until client has decided to apply the update or not.
       */
      dbg(`7-1. Emit 'updateFound' event for ${repo}:${tag}`);
      this.emit('updateFound', containerInfo);
    } else {
      /**
       * 7-2. If no, current image is already latest version, emit an 'updateNotFound'
       *      event and remove 'repo:tag-wt-next' which is temporarily created.
       */
      dbg(`7-2. ${repo}:${tag} is already up-to-date, emit 'updateNotFound' event for ${repo}:${tag}`);
      this.emit('updateNotFound', containerInfo);
      await this.docker.getImage(`${repo}:${tag}-wt-next`).remove();
    }
  }

  /**
   * Apply update for given container.
   *
   * @param  {Object} containerInfo Container info object to be updated.
   * @return {Promise}              A promise with the result of the update.
   */
  async applyUpdate(containerInfo) {
    const dbg = debug('watchtower:applyUpdate');
    const { repo, tag } = this.parseImageName(containerInfo.Image);

    await this.setBusy();

    const container = await this.docker.getContainer(containerInfo.Id).inspect();
    const containerName = container.Name.replace(/^\//, '');

    try {
      dbg(`1. Stop container ${repo}:${tag} and rename it to avoid name conflict`);
      await this.docker.getContainer(containerInfo.Id).stop();
      await this.docker.getContainer(containerInfo.Id).rename({
        _query: { name: `${containerName}-${Date.now()}` },
      });

      dbg(`2. Tag old ${repo}:${tag} to ${repo}:${tag}-wt-prev`);
      await this.docker.getImage(`${repo}:${tag}`).tag({ repo, tag: `${tag}-wt-prev` });

      dbg(`3. Remove old ${repo}:${tag} image`);
      await this.docker.getImage(`${repo}:${tag}`).remove();

      dbg(`4. Tag image ${repo}:${tag}-wt-next to ${repo}:${tag}`);
      await this.docker.getImage(`${repo}:${tag}-wt-next`).tag({ repo, tag });

      dbg(`5. Update 'create options' of container ${repo}:${tag} with latest options`);
      const latestImage = await this.docker.getImage(`${repo}:${tag}-wt-next`).inspect();
      const createOptions = container.Config;
      createOptions._query = { name: containerName };
      createOptions.Env = latestImage.Config.Env;
      createOptions.Entrypoint = latestImage.Config.Entrypoint;
      createOptions.HostConfig = container.HostConfig;

      dbg(`6. Create latest container of ${repo}:${tag} image`);
      let latestContainer = await this.docker.createContainer(createOptions);

      dbg(`7. Start latest container of ${repo}:${tag} image`);
      latestContainer = await latestContainer.start();

      dbg(`8. Waiting ${this.configs.timeToWaitBeforeHealthyCheck} seconds for the container to start before healthy check`);
      await this.waitForDelay(this.configs.timeToWaitBeforeHealthyCheck);
      const lastestContainerInfo = await latestContainer.inspect();

      dbg(`9. ${repo}:${tag} healthy check result:\n${JSON.stringify(lastestContainerInfo.State, null, 2)}`);
      if (!lastestContainerInfo.State.Running) {
        dbg(`Remove failed ${repo}:${tag} container and its image`);
        await this.docker.getContainer(lastestContainerInfo.Id).remove();
        await this.docker.getImage(`${repo}:${tag}`).remove();
        await this.docker.getImage(`${repo}:${tag}-wt-next`).remove();

        throw new Error('Start container failed');
      } else {
        dbg(`9-1. Latest ${repo}:${tag} is up and running, remove temporary tags '${tag}-wt-next' and '${tag}-wt-prev'`);
        await this.docker.getImage(`${repo}:${tag}-wt-next`).remove();
        await this.docker.getImage(`${repo}:${tag}-wt-prev`).remove();

        dbg(`9-2. Remove previous ${repo}:${tag} container`);
        await this.docker.getContainer(containerInfo.Id).remove();

        dbg(`9-3. Update ${repo}:${tag} successfully`);
        await this.clearBusy();

        /* Apply successfully, return latest running container */
        return Promise.resolve(lastestContainerInfo);
      }
    } catch (error) {
      if (error.message !== 'Start container failed') {
        dbg('Unexpected error:');
        dbg(error);
      }

      try {
        dbg(`Latest ${repo}:${tag} failed to start, fall back to previous version`);
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
        container: containerInfo,
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
    const { host } = this.parseImageName(name);
    const options = { authconfig: this.registryAuths[host] };

    dbg(`Pulling ${name}`);

    let pullStream = await new Promise((resolve, reject) => {
      this.docker.pull(`${name}`, options, (error, stream) => {
        if (error) reject(error);
        else resolve(stream);
      });
    });
    await this.followProgress(pullStream);

    dbg(`Image ${name} pulled`);
  }

  /**
   * Push image to the registry serever.
   *
   * @param  {String} name Image name to push.
   * @return {Promise}     A promise with the result of push.
   */
  async push(name) {
    const dbg = debug('watchtower:push');
    const { host } = this.parseImageName(name);
    const options = { authconfig: this.registryAuths[host] };

    dbg(`Pushing image ${name}...`);

    await this.setBusy();
    let stream = await this.docker.getImage(`${name}`).push(options);
    await this.followProgress(stream);
    await this.clearBusy();

    dbg(`Image ${name} pushed`);
  }

  /**
   * Load image from a gzipped tarball file or a stream.
   *
   * @param  {String|Stream} src Image data source, can be path of a '.tar.gz' file or a Readable stream.
   * @return {Array}             Repo tags of the image.
   */
  async load(src) {
    const dbg = debug('watchtower:load');
    let extractor = new ManifestExtractor();
    let stream;
    let repoTags;

    if (typeof src === 'string') {
      extractor.on('manifests', (manifests) => {
        if (manifests.length > 0 && manifests[0].RepoTags) {
          repoTags = manifests[0].RepoTags;
          dbg('Found RepoTags:', repoTags);
        }
      });

      stream = fs.createReadStream(src)
                 .pipe(zlib.createGunzip())
                 .pipe(extractor);
    } else if (src instanceof Readable) {
      stream = src;
    } else {
      const error = 'Unsupported type of image source';
      dbg(error);
      extractor.removeAllListeners();
      return Promise.reject(error);
    }

    dbg(`Loading image ${stream.path || 'from Readable stream'}...`);

    await this.setBusy();
    await this.docker.loadImage(stream, {});
    extractor.removeAllListeners();
    await this.clearBusy();

    dbg(`Image ${stream.path || 'stream'} loaded`);

    if (!repoTags) return Promise.reject('No RepoTags found');
    return Promise.resolve(repoTags);
  }
}
