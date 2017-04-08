/* eslint-disable no-undef, prefer-arrow-callback, func-names, space-before-function-paren */
import debug from 'debug';
import Docker from 'dockerode';
import Watchtower from '../src';

const dbg = debug('watchtower:test');
const docker = new Docker();
const testAuth = ['csy-mbp:5000', {
  username: 'csy',
  password: 'chardi',
  auth: '',
  email: '',
}];

const TEST_REPO_LATEST = 'alpine';
const TEST_REPO_OLD = 'alpine:3.4';
const TEST_PRIVATE_IMAGE = 'alpine-3.5';
const TEST_PRIVATE_IMAGE_REPO = 'csy-mbp:5000/alpine';

describe('Prepare Test', function() {
  this.timeout(60000);

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
});

describe('Watchtower', function() {
  let repoTags = [];
  const watchtower = new Watchtower({
    checkUpdateInterval: 0,
    timeToWaitBeforeHealthyCheck: 10,
  });

  watchtower.on('updateFound', (image) => {
    describe('[Event] updateFound', function() {
      it('should receive an event with containerInfo', function(done) {
        if (image) done();
        else done('Got \'updateFound\' event but no image name');
      });
    });
  });

  describe('[Method] addRegistryAuth()', function() {
    it('should add docker registry auth info without error', function(done) {
      if (watchtower.addRegistryAuth(...testAuth)) done();
      else done('Failed to add registry auth info');
    });
  });

  describe('[Method] activate()', function() {
    it('should activate watchtower without error', function(done) {
      watchtower.activate().then(done).catch(done);
    });
  });

  describe('[Method] checkForUpdates()', function() {
    it('should check for update immediately', function(done) {
      this.timeout(60000);
      watchtower.checkForUpdates().then(done).catch(done);
    });
  });

  describe('[Method] applyUpdate()', function() {
    it('should apply updates if any exists', function(done) {
      this.timeout(120000);
      let containerInfo = watchtower.getAvailableUpdates(TEST_REPO_LATEST);
      if (containerInfo) {
        watchtower.applyUpdate(containerInfo).then((latestContainerInfo) => {
          dbg(`Applied container ID: ${latestContainerInfo.Id} Name: ${latestContainerInfo.Name}`);
          done();
        });
      } else {
        dbg('No update found');
        done();
      }
    });
  });

  describe('[Method] load()', function() {
    it(`should load ${TEST_PRIVATE_IMAGE} image`, function(done) {
      this.timeout(60000);

      watchtower.load(`./test/images/${TEST_PRIVATE_IMAGE}.tar.gz`, { tagToLatest: true })
        .then((result) => {
          repoTags = result;
          done();
        })
        .catch(done);
    });
  });

  describe('[Method] push()', function() {
    it(`should push ${TEST_PRIVATE_IMAGE} image to the registry`, function(done) {
      this.timeout(60000);
      if (repoTags.length > 0) {
        watchtower.push(repoTags[0]).then(done).catch(done);
      } else {
        done('No RepoTags found');
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
    docker.listContainers().then((containers) => {
      let testContainers = containers.filter(container => container.Image === TEST_REPO_LATEST);
      if (testContainers.length > 0) {
        docker.getContainer(testContainers[0].Id).stop()
          .then(() => docker.getContainer(testContainers[0].Id).remove())
          .then(done)
          .catch(done);
      } else {
        done('No test container found');
      }
    });
  });

  it('should remove test images', function(done) {
    docker.getImage(TEST_REPO_LATEST).remove()
      .then(() => docker.getImage(TEST_REPO_OLD).remove())
      .then(() => docker.getImage(TEST_PRIVATE_IMAGE_REPO).remove())
      .then(() => done())
      .catch(done);
  });
});
