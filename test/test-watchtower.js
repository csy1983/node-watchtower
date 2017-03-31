/* eslint-disable no-undef, prefer-arrow-callback, func-names, space-before-function-paren */
import debug from 'debug';
import Watchtower from '../src';

const TEST_IMAGE = 'alpine-3.5';
const dbg = debug('watchtower:test');
const testAuth = ['csy-mbp:5000', {
  username: 'csy',
  password: 'chardi',
  auth: '',
  email: '',
}];

describe('Watchtower', function() {
  let repoTags = [];
  const containersToUpdate = [];
  const watchtower = new Watchtower({
    checkUpdateInterval: 0,
    timeToWaitBeforeHealthyCheck: 10,
  });

  watchtower.on('updateFound', (containerInfo) => {
    containersToUpdate.push(containerInfo);
  });

  describe('#addRegistryAuth()', function() {
    it('should add docker registry auth info without error', function(done) {
      if (watchtower.addRegistryAuth(...testAuth)) done();
      else done('Failed to add registry auth info');
    });
  });

  describe('#activate()', function() {
    it('should activate watchtower without error', function(done) {
      watchtower.activate().then(done).catch(done);
    });
  });

  describe('#checkForUpdates()', function() {
    it('should check for update immediately', function(done) {
      this.timeout(60000);
      watchtower.checkForUpdates().then(done).catch(done);
    });
  });

  describe('#applyUpdate()', function() {
    it('should apply updates if any exists', function(done) {
      this.timeout(120000);
      if (containersToUpdate.length > 0) {
        let pUpdateAll = containersToUpdate.map((containerInfo) => {
          return watchtower.applyUpdate(containerInfo);
        });

        Promise.all(pUpdateAll).then((latestContainerInfo) => {
          dbg(`Applied container ID: ${latestContainerInfo.Id} Name: ${latestContainerInfo.Name}`);
          done();
        });
      } else {
        done();
      }
    });
  });

  describe('#load()', function() {
    it(`should load ${TEST_IMAGE} image`, function(done) {
      this.timeout(60000);

      watchtower.load(`./test/images/${TEST_IMAGE}.tar.gz`).then((result) => {
        repoTags = result;
        done();
      }).catch(done);
    });
  });

  describe('#push()', function() {
    it(`should push ${TEST_IMAGE} image to the registry`, function(done) {
      this.timeout(60000);
      if (repoTags.length > 0) {
        watchtower.push(repoTags[0]).then(done).catch(done);
      } else {
        done('No RepoTags found');
      }
    });
  });

  describe('#inactivate()', function() {
    it('should inactivate watchtower without error', function(done) {
      this.timeout(30000);
      watchtower.inactivate().then(done).catch(done);
    });
  });
});
