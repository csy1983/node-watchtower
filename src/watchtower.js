import autobind from 'autobind-decorator';
import Docker from 'dockerode';
import debug from 'debug';
import EventEmitter from 'events';
import url from 'url';

@autobind
export default class Watchtower extends EventEmitter {
  constructor(config = {}) {
    super();
    this.busy = false;
    this.config = {
      checkUpdateInterval: config.checkUpdateInterval || 3, /* in minutes */
      timeToWaitBeforeHealthyCheck: config.timeToWaitBeforeHealthyCheck || 30, /* in seconds */
      dockerOptions: config.dockerOptions,
    };
    this.docker = new Docker(this.config.dockerOptions);
    this.registries = {};

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

    this.setBusy = () => { this.busy = true; };
    this.clearBusy = () => { this.busy = false; };
    this.waitForBusy = () => {
      return new Promise((resolve) => {
        const waiter = setInterval(() => {
          if (!this.busy) {
            clearInterval(waiter);
            resolve();
          }
        });
      });
    };

    this.waitForDelay = (delay) => {
      return new Promise((resolve) => {
        setTimeout(resolve, delay * 1000);
      });
    };
  }

  addRegistry(name, auth) {
    if (!name || !auth) return false;
    if (!auth.serveraddress) return false;
    if (!auth.username || !auth.password) return false;
    this.registries[name] = auth;
    return true;
  }

  async checkForUpdates() {
    if (this.config.checkUpdateInterval < 0) return;
    if (this.busy) return;

    this.setBusy();
    let containers = await this.docker.listContainers();
    await containers.filter((containerInfo) => {
      // Skip orphaned container (where image name equals to image ID)
      return (containerInfo.Image !== containerInfo.ImageID);
    }).reduce((curr, next, index, filteredContainers) => {
      return curr.then(() => this.checkout(filteredContainers[index]));
    }, Promise.resolve());

    this.clearBusy();
  }

  async activate() {
    this.warder = setInterval(this.checkForUpdates, this.config.checkUpdateInterval * 60000);
    await this.checkForUpdates();
  }

  async inactivate() {
    clearInterval(this.warder);
    await this.waitForBusy();
  }

  async checkout(containerInfo) {
    const dbg = debug('watchtower:checkout');
    const { host, repo, tag } = this.parseImageName(containerInfo.Image);
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
      await this.pull(host, repo, tag);
    } catch (error) {
      dbg(`2-1. Pull ${repo}:${tag} failed:`);
      dbg(error);
      dbg(`Restoring ${repo}:${tag} and skip this image`);
      await this.docker.getImage(`${repo}:${tag}-wt-curr`).tag({ repo, tag });
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

    dbg(`5. Remove ${repo}:${tag}-wt-curr  which is temporarily created`);
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
       * 7-2. If no, current image is already latest version, remove 'repo:tag-wt-next'
       *      which is temporarily created.
       */
      dbg(`7-2. ${repo}:${tag} is already up-to-date`);
      await this.docker.getImage(`${repo}:${tag}-wt-next`).remove();
    }
  }

  async applyUpdate(containerInfo) {
    const dbg = debug('watchtower:applyUpdate');
    const { repo, tag } = this.parseImageName(containerInfo.Image);

    if (this.busy) {
      dbg('Wait for busy...');
      await this.waitForBusy();
    }

    const container = await this.docker.getContainer(containerInfo.Id).inspect();
    const containerName = container.Name.replace(/^\//, '');

    this.setBusy();

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

      dbg(`8. Waiting ${this.config.timeToWaitBeforeHealthyCheck} seconds for the container to start before healthy check`);
      await this.waitForDelay(this.config.timeToWaitBeforeHealthyCheck);
      const lastestContainerInfo = await latestContainer.inspect();

      dbg(`9. ${repo}:${tag} healthy check result:\n${JSON.stringify(lastestContainerInfo.State, null, 2)}`);
      if (lastestContainerInfo.State.Running) {
        dbg(`9-1. Latest ${repo}:${tag} is up and running, remove temporary tags '${tag}-wt-next' and '${tag}-wt-prev'`);
        await this.docker.getImage(`${repo}:${tag}-wt-next`).remove();
        await this.docker.getImage(`${repo}:${tag}-wt-prev`).remove();

        dbg(`9-2. Remove previous ${repo}:${tag} container`);
        await this.docker.getContainer(containerInfo.Id).remove();

        dbg(`9-3. Update ${repo}:${tag} successfully`);
        this.clearBusy();

        /* Emit an 'updated' event with latest running container */
        this.emit('updateApplied', lastestContainerInfo);
      } else {
        dbg(`Remove failed ${repo}:${tag} container and its image`);
        await this.docker.getContainer(lastestContainerInfo.Id).remove();
        await this.docker.getImage(`${repo}:${tag}`).remove();
        await this.docker.getImage(`${repo}:${tag}-wt-next`).remove();

        throw new Error('Start container failed');
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

      this.clearBusy();
      this.emit('error', {
        action: 'update',
        message: error.message,
        container: containerInfo,
      });
    }
  }

  pull(host, repo, tag) {
    return new Promise((resolve, reject) => {
      const dbg = debug('watchtower:pull');

      this.docker.pull(`${repo}:${tag}`, { authconfig: this.registries[host] }, (pullError, stream) => {
        dbg(`Pulling ${repo}:${tag}`);

        if (pullError) {
          dbg(`Error occurred while pulling ${repo}:${tag}:`);
          dbg(pullError);
          reject();
          return;
        }

        this.docker.modem.followProgress(stream, (progressError) => {
          /* onFinished */
          if (progressError) {
            dbg(`Error occurred while pulling ${repo}:${tag}:`);
            dbg(progressError);
            reject();
          } else {
            resolve();
          }
        }, (event) => {
          /* onProgress */
          if (event.status.startsWith('Status:')) {
            dbg(event.status);
          }
        });
      });
    });
  }

  async push(name) {
    const dbg = debug('watchtower:push');
    const { host, repo, tag } = this.parseImageName(name);
    const image = await this.docker.getImage(`${repo}:${tag}`);

    dbg(`Pushing image ${name}...`);

    if (this.busy) {
      dbg('Wait for busy...');
      await this.waitForBusy();
    }
    this.setBusy();
    await image.push({ authconfig: this.registries[host] });
    this.clearBusy();

    dbg(`Image ${name} pushed`);
  }

  async loadImage(fileStream) {
    const dbg = debug('watchtower:loadImage');

    dbg(`Loading image file ${fileStream.path}...`);

    if (this.busy) {
      dbg('Wait for busy...');
      await this.waitForBusy();
    }
    this.setBusy();
    await this.docker.loadImage(fileStream, {});
    this.clearBusy();

    dbg(`Image file ${fileStream.path} loaded`);
  }
}
