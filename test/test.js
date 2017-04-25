/* eslint-disable no-undef, prefer-arrow-callback, func-names, space-before-function-paren */
import debug from 'debug';
import Docker from 'dockerode';
import Watchtower from '../src';

const DEBUG = debug('watchtower:test');
const docker = new Docker();
const testAuth = {
  serveraddress: 'csy-mbp:5000',
  username: 'csy',
  password: 'chardi',
  auth: '',
  email: '',
};

const TEST_REPO_LATEST = 'alpine';
const TEST_REPO_OLD = 'alpine:3.4';
const TEST_PRIVATE_IMAGE = 'alpine-3.5';
const TEST_PRIVATE_REPO = 'csy-mbp:5000/alpine';

describe('Prepare Test', function() {
  this.timeout(60000);

  it('should clean previous test environment', function(done) {
    docker.listContainers({ all: true }).then((containers) => {
      let testContainers = containers.filter(container => (
        container.Image === TEST_REPO_LATEST || container.Image === TEST_PRIVATE_REPO
      ));
      Promise.all(testContainers.map((container) => {
        return docker.getContainer(container.Id).stop()
          .then(() => docker.getContainer(container.Id).remove())
          .catch(() => docker.getContainer(container.Id).remove());
      })).then(() => done()).catch(done);
    });
  });

  it('should remove test images', function(done) {
    docker.getImage(TEST_REPO_LATEST).remove()
      .then(() => docker.getImage(TEST_REPO_OLD).remove())
      .then(() => docker.getImage(TEST_PRIVATE_REPO).remove())
      .then(() => done())
      .catch(() => done());
  });

  it(`should pull ${TEST_REPO_OLD}`, function(done) {
    docker.pull(`${TEST_REPO_OLD}`, (error, stream) => {
      if (error) {
        done(error);
        return;
      }

      docker.modem.followProgress(stream, (progressError) => {
        done(progressError);
      });
    });
  });

  it(`should tag ${TEST_REPO_OLD} to ${TEST_REPO_LATEST}`, function(done) {
    docker.getImage(TEST_REPO_OLD).tag({ repo: TEST_REPO_LATEST, tag: 'latest' })
      .then(() => done())
      .catch(error => done(error));
  });

  it(`should run ${TEST_REPO_LATEST} in detach mode`, function(done) {
    docker.createContainer({
      _query: { name: 'alpine-for-test' },
      Image: TEST_REPO_LATEST,
      Cmd: ['/bin/ping', 'www.google.com'],
    }).then((container) => {
      container.start().then(() => done()).catch(error => done(error));
    }).catch(done);
  });

  it(`should tag ${TEST_REPO_OLD} to ${TEST_PRIVATE_REPO}`, function(done) {
    docker.getImage(TEST_REPO_OLD).tag({ repo: TEST_PRIVATE_REPO, tag: 'latest' })
      .then(() => done())
      .catch(error => done(error));
  });

  it(`should run ${TEST_PRIVATE_REPO} in detach mode`, function(done) {
    docker.createContainer({
      _query: { name: 'private-alpine-for-test' },
      Image: TEST_PRIVATE_REPO,
      Cmd: ['/bin/ping', 'www.google.com'],
    })
    .then(container => container.start())
    .then(() => done())
    .catch(done);
  });
});

describe('Watchtower', function() {
  const watchtower = new Watchtower({
    checkUpdateInterval: 0,
    timeToWaitBeforeHealthyCheck: 10,
  });

  watchtower.on('updateFound', (image) => {
    describe(`[Event] updateFound: ${image}`, function() {
      it('should receive an event with image tag', function(done) {
        if (image) done();
        else done('Got \'updateFound\' event but no image name');
      });
    });
  });

  describe('[Method] addRegistryAuth()', function() {
    it('should add docker registry auth info without error', function(done) {
      if (watchtower.addRegistryAuth(testAuth)) done();
      else done('Failed to add registry auth info');
    });
  });

  describe('[Method] activate()', function() {
    it('should activate watchtower without error', function(done) {
      watchtower.activate().then(done).catch(done);
    });
  });

  describe('[Method] upload()', function() {
    it(`should upload ${TEST_PRIVATE_IMAGE} image`, function(done) {
      this.timeout(60000);

      watchtower.upload(`./test/images/${TEST_PRIVATE_IMAGE}.tar.gz`, { tagToLatest: true })
        .then((repoTag) => {
          DEBUG(`${repoTag} uploaded`);
          done();
        })
        .catch(done);
    });
  });

  describe('[Method] checkForUpdates()', function() {
    it('should check for update immediately', function(done) {
      this.timeout(60000);
      watchtower.checkForUpdates().then(done).catch(done);
    });
  });

  describe('[Method] applyUpdate()', function() {
    it(`should apply update for ${TEST_REPO_LATEST}`, function(done) {
      this.timeout(120000);
      let containerInfo = watchtower.getAvailableUpdate(TEST_REPO_LATEST);
      if (containerInfo) {
        watchtower.applyUpdate(containerInfo).then((latestContainerInfo) => {
          DEBUG(`Applied container ID: ${latestContainerInfo.Id} Name: ${latestContainerInfo.Name}`);
          done();
        }).catch(done);
      } else {
        done('No update found');
      }
    });

    it(`should apply update for ${TEST_PRIVATE_REPO} and verify new configs for the container`, function(done) {
      this.timeout(120000);
      let containerInfo = watchtower.getAvailableUpdate(TEST_PRIVATE_REPO);
      if (containerInfo) {
        watchtower.applyUpdate(containerInfo).then((latestContainerInfo) => {
          DEBUG(`Applied container ID: ${latestContainerInfo.Id} Name: ${latestContainerInfo.Name}`);
          docker.getContainer(latestContainerInfo.Id).inspect().then((info) => {
            if (info.Config.Cmd.join(' ') !== 'ping www.yahoo.com') {
              done(`Unexpected Cmd: ${info.Config.Cmd}`);
            } else if (!info.HostConfig.Binds || !info.HostConfig.Binds.includes('/tmp:/tmp')) {
              done(`Unexpected Binds: ${info.HostConfig.Binds}`);
            } else if (info.HostConfig.NetworkMode !== 'host') {
              done(`Unexpected NetworkMode: ${info.HostConfig.NetworkMode}`);
            } else if (!info.HostConfig.Privileged) {
              done(`Unexpected Privileged: ${info.HostConfig.Privileged}`);
            } else {
              done();
            }
          });
        }).catch(done);
      } else {
        done('No update found');
      }
    });
  });

  describe('[Method] inactivate()', function() {
    it('should inactivate watchtower without error', function(done) {
      this.timeout(30000);
      watchtower.inactivate().then(done).catch(done);
    });
  });
});

describe('Cleanup Test', function() {
  this.timeout(30000);
  it('should stop and remove test container', function(done) {
    docker.listContainers({ all: true }).then((containers) => {
      let testContainers = containers.filter(container => (
        container.Image === TEST_REPO_LATEST || container.Image === TEST_PRIVATE_REPO
      ));
      Promise.all(testContainers.map((container) => {
        return docker.getContainer(container.Id).stop()
          .then(() => docker.getContainer(container.Id).remove())
          .catch(() => docker.getContainer(container.Id).remove());
      })).then(() => done()).catch(done);
    });
  });

  it('should remove test images', function(done) {
    docker.getImage(TEST_REPO_LATEST).remove()
      .then(() => docker.getImage(TEST_REPO_OLD).remove())
      .then(() => docker.getImage(TEST_PRIVATE_REPO).remove())
      .then(() => done())
      .catch(done);
  });
});
