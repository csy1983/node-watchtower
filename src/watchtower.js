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

    this.getImageRepoTag = (containerInfo) => {
      let image = containerInfo.Image;
      if (image.indexOf('/') < 0) image = `/${image}`;
      let comp = url.parse(`docker://${image}`);
      let host = comp.host;
      let fullname = comp.path.split('/')[1];
      let repo = fullname.split(':')[0];
      let tag = fullname.split(':')[1] || 'latest';
      if (host) repo = `${host}/${repo}`;
      return { host, repo, tag };
    };

    this.setBusy = () => this.busy = true;
    this.clearBusy = () => this.busy = false;
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

    this.waitForDelay = (sec) => {
      return new Promise((resolve) => {
        setTimeout(resolve, sec * 1000);
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

  activate() {
    return new Promise((resolve) => {
      this.warder = setInterval(this.checkForUpdates, this.config.checkUpdateInterval * 60000);
      this.checkForUpdates();
      resolve();
    });
  }

  inactivate() {
    clearInterval(this.warder);
    return this.waitForBusy();
  }

  async checkout(containerInfo) {
    const { host, repo, tag } = this.getImageRepoTag(containerInfo);
    const container = await this.docker.getContainer(containerInfo.Id).inspect();

    /* 0. Skip repo with reserved tags and containers which are not running */
    if (tag.match(/.*-wt-curr$/) ||
        tag.match(/.*-wt-next$/) ||
        tag.match(/.*-wt-prev$/) ||
        !container.State.Running) return;

    /* 1. Backup 'repo:tag' to 'repo:tag-wt-curr'. */
    debug('watchtower:checkout')(`1. Backup ${repo}:${tag} to ${repo}:${tag}-wt-curr`);
    await this.docker.getImage(`${repo}:${tag}`).tag({ repo, tag: `${tag}-wt-curr` });

    /* 2. Pull latest 'repo:tag' from the server. */
    debug('watchtower:checkout')(`2. Pull ${repo}:${tag}`);
    await this.pull(host, repo, tag);

    /* 3. Tag 'repo:tag' to 'repo:tag-wt-next', if 'repo:tag-wt-next' exists then remove it first. */
    debug('watchtower:checkout')(`3. Tag ${repo}:${tag} to ${repo}:${tag}-wt-next`);
    try {
      await this.docker.getImage(`${repo}:${tag}-wt-next`).remove();
    } catch (error) {}
    await this.docker.getImage(`${repo}:${tag}`).tag({ repo, tag: `${tag}-wt-next` });

    /* 4. Restore 'repo:tag-wt-curr' back to 'repo:tag'. */
    debug('watchtower:checkout')(`4. Restore ${repo}:${tag}-wt-curr back to ${repo}:${tag}`);
    await this.docker.getImage(`${repo}:${tag}-wt-curr`).tag({ repo, tag });

    /* 5. Remove 'repo:tag-wt-curr' which is temporarily created. */
    debug('watchtower:checkout')(`5. Remove ${repo}:${tag}-wt-curr`);
    await this.docker.getImage(`${repo}:${tag}-wt-curr`).remove();

    /* 6. Inspect 'repo:tag' and 'repo:tag-wt-next' and compare their 'Created' date string. */
    debug('watchtower:checkout')(`6. Compare ${repo}:${tag} and ${repo}:${tag}-wt-next`);
    const curr = await this.docker.getImage(`${repo}:${tag}`).inspect();
    const next = await this.docker.getImage(`${repo}:${tag}-wt-next`).inspect();

    /* 7. Check if current image is order then server's. */
    if (curr.Created < next.Created) {
      /**
       * 7-1. If yes, emit an 'updateFound' event with container info to client to
       *      notify that there is an new image to update, and keep 'repo:tag-wt-next'
       *      until client has decided to apply the update or not.
       */
      debug('watchtower:checkout')(`7-1. Emit update event for ${repo}:${tag}`);
      this.emit('updateFound', containerInfo);
    } else {
      /**
       * 7-2. If no, current image is already latest version, remove 'repo:tag-wt-next'
       *      which is temporarily created.
       */
      debug('watchtower:checkout')(`7-2. ${repo}:${tag} is already up-to-date`);
      await this.docker.getImage(`${repo}:${tag}-wt-next`).remove();
    }
  }

  async applyUpdate(containerInfo) {
    const { repo, tag } = this.getImageRepoTag(containerInfo);

    if (this.busy) {
      debug('watchtower:applyUpdate')('Wait for busy...');
      await this.waitForBusy();
    }

    this.setBusy();

    try {
      /* 0. Save create options of container 'repo:tag'. */
      const container = await this.docker.getContainer(containerInfo.Id).inspect();
      const containerName = container.Name.replace(/^\//, '');
      // debug('watchtower:applyUpdate')(container);

      /* 1. Stop 'repo:tag' container and rename it to avoid name conflict. */
      debug('watchtower:applyUpdate')(`1. Stop container ${repo}:${tag} and rename it`);
      await this.docker.getContainer(containerInfo.Id).stop();
      await this.docker.getContainer(containerInfo.Id).rename({
        _query: { name: `${containerName}-${Date.now()}` },
      });

      /* 2. Tag old 'repo:tag' image to 'repo:tag-wt-prev'. */
      debug('watchtower:applyUpdate')(`2. Tag old ${repo}:${tag} to ${repo}:${tag}-wt-prev`);
      await this.docker.getImage(`${repo}:${tag}`).tag({ repo, tag: `${tag}-wt-prev` });

      /* 3. Remove old 'repo:tag' image. */
      debug('watchtower:applyUpdate')(`3. Remove old ${repo}:${tag}`);
      await this.docker.getImage(`${repo}:${tag}`).remove();

      /* 4. Tag image 'repo:tag-wt-next' to 'repo:tag'. */
      debug('watchtower:applyUpdate')(`4. Tag ${repo}:${tag}-wt-next to ${repo}:${tag}`);
      await this.docker.getImage(`${repo}:${tag}-wt-next`).tag({ repo, tag });

      const latestImage = await this.docker.getImage(`${repo}:${tag}-wt-next`).inspect();
      const createOptions = container.Config;
      createOptions._query = { name: containerName };
      createOptions.Env = latestImage.Config.Env;
      createOptions.Entrypoint = latestImage.Config.Entrypoint;
      createOptions.HostConfig = container.HostConfig;

      /* 5. Create latest container based on image 'repo:tag'. */
      debug('watchtower:applyUpdate')(`5. Create and run latest ${repo}:${tag} container`);
      let latestContainer = await this.docker.createContainer(createOptions);

      /* 6. Start latest container of 'repo:tag'. */
      debug('watchtower:applyUpdate')(`6. Start latest ${repo}:${tag}`);
      latestContainer = await latestContainer.start();

      /* 7. Wait a period of time in seconds before healthy check for new container */
      debug('watchtower:applyUpdate')(`7. Waiting ${this.config.timeToWaitBeforeHealthyCheck} seconds for healthy check`);
      await this.waitForDelay(this.config.timeToWaitBeforeHealthyCheck);
      const lastestContainerInfo = await latestContainer.inspect();
      debug('watchtower:applyUpdate')(`${repo}:${tag} healthy check result:\n${JSON.stringify(lastestContainerInfo.State, null, 2)}`);

      if (lastestContainerInfo.State.Running) {
        /* 7-1. If latest is running successfully... */
        /* 7-1-1. Remove 'repo:tag-wt-next' and 'repo:tag-wt-prev'. */
        debug('watchtower:applyUpdate')(`7-1-1. Latest ${repo}:${tag} is up and running, remove ${tag}-wt-next and ${tag}-wt-prev tag`);
        await this.docker.getImage(`${repo}:${tag}-wt-next`).remove();
        await this.docker.getImage(`${repo}:${tag}-wt-prev`).remove();

        /* 7-1-2. Remove previous container. */
        debug('watchtower:applyUpdate')(`7-1-2. Remove previous ${repo}:${tag} container`);
        await this.docker.getContainer(containerInfo.Id).remove();

        debug('watchtower:applyUpdate')('7-1-3. Finish this round');
        this.clearBusy();

        /* Emit an 'updated' event with latest running container */
        this.emit('updateApplied', lastestContainerInfo);
      } else {
        /* 7-2. If latest is failed... */
        /* 7-2-1. Remove failed container and its image. */
        debug('watchtower:applyUpdate')(`7-2-1. Remove failed ${repo}:${tag} container`);
        await this.docker.getContainer(lastestContainerInfo.Id).remove();
        await this.docker.getImage(`${repo}:${tag}`).remove();
        await this.docker.getImage(`${repo}:${tag}-wt-next`).remove();

        /* 7-2-2. Restore 'repo:tag-wt-prev' back to 'repo:tag'. */
        debug('watchtower:applyUpdate')(`7-2-2. Latest ${repo}:${tag} failed to start, fall back to previous version`);
        await this.docker.getImage(`${repo}:${tag}-wt-prev`).tag({ repo, tag });
        await this.docker.getImage(`${repo}:${tag}-wt-prev`).remove();

        /* 7-2-3. Restart previous working version of 'repo:tag'. */
        debug('watchtower:applyUpdate')(`7-2-3. Restart previous working version of ${repo}:${tag}`);
        await this.docker.getContainer(containerInfo.Id).rename({ _query: { name: `${containerName}` } });
        await this.docker.getContainer(containerInfo.Id).start();

        debug('watchtower:applyUpdate')('7-2-4. Finish this round');
        this.clearBusy();

        this.emit('error', {
          action: 'update',
          container: lastestContainerInfo,
        });
      }
    } catch (error) {
      debug('watchtower:applyUpdate')(`Unexpected error: ${error.message}`);
      /* TODO: Should fall back to previous working version */
      this.clearBusy();
      this.emit('error', {
        action: 'update',
        container: containerInfo,
        error,
      });
    }
  }

  pull(host, repo, tag) {
    return new Promise((resolve, reject) => {
      this.docker.pull(`${repo}:${tag}`, { authconfig: this.registries[host] }, (error, stream) => {
        if (error) {
          resolve();
          return;
        }

        this.docker.modem.followProgress(stream, (error, output) => {
          /* onFinished */
          if (error) console.error(error);
          resolve();
        }, (event) => {
          /* onProgress */
          //console.log(event);
        });
      });
    });
  }

  push(tag) {

  }

  loadImage(file) {

  }
}
