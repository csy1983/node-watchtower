(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("babel-polyfill"), require("autobind-decorator"), require("debug"), require("dockerode"), require("events"), require("express"), require("fs"), require("http"), require("url"));
	else if(typeof define === 'function' && define.amd)
		define(["babel-polyfill", "autobind-decorator", "debug", "dockerode", "events", "express", "fs", "http", "url"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("babel-polyfill"), require("autobind-decorator"), require("debug"), require("dockerode"), require("events"), require("express"), require("fs"), require("http"), require("url")) : factory(root["babel-polyfill"], root["autobind-decorator"], root["debug"], root["dockerode"], root["events"], root["express"], root["fs"], root["http"], root["url"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_3__, __WEBPACK_EXTERNAL_MODULE_4__, __WEBPACK_EXTERNAL_MODULE_5__, __WEBPACK_EXTERNAL_MODULE_6__, __WEBPACK_EXTERNAL_MODULE_7__, __WEBPACK_EXTERNAL_MODULE_8__, __WEBPACK_EXTERNAL_MODULE_9__, __WEBPACK_EXTERNAL_MODULE_10__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 11);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(__dirname) {

var _express = __webpack_require__(7);

var _express2 = _interopRequireDefault(_express);

var _fs = __webpack_require__(8);

var _fs2 = _interopRequireDefault(_fs);

var _http = __webpack_require__(9);

var _http2 = _interopRequireDefault(_http);

var _watchtower = __webpack_require__(2);

var _watchtower2 = _interopRequireDefault(_watchtower);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();
var config = {
  host: 'localhost',
  port: 5050
};
var watchtower = new _watchtower2.default({
  checkUpdateInterval: 3,
  timeToWaitBeforeHealthyCheck: 10
});

watchtower.addRegistry('csy-mbp:5000', {
  username: 'csy',
  password: 'chardi',
  auth: '',
  email: '',
  serveraddress: 'csy-mbp:5000'
});

watchtower.on('updateFound', function (containerInfo) {
  watchtower.applyUpdate(containerInfo);
});

watchtower.on('updateApplied', function (containerInfo) {
  // console.log('Applied container', containerInfo);
});

watchtower.on('error', function (error) {
  console.error(error.action, error.container.Id, error.container.State);
});

watchtower.activate();

app.use(_express2.default.static(__dirname + '/public'));
app.post('/config', function (req, res) {
  config = {
    host: req.params.host,
    port: req.params.port,
    ca: _fs2.default.readFileSync('ca.pem'),
    cert: _fs2.default.readFileSync('cert.pem'),
    key: _fs2.default.readFileSync('key.pem')
  };
  res.sendStatus(200);
});

var force = false;
function terminate() {
  if (force) {
    process.exit(0);
  } else {
    force = true;
    watchtower.inactivate().then(function () {
      process.exit(0);
    });

    setTimeout(function () {
      console.log('Terminating watchtower...');
      console.log('Press Ctrl+C again to force terminate watchtower');
    }, 3000);
  }
}

process.on('SIGINT', terminate);
process.on('SIGTERM', terminate);
/* WEBPACK VAR INJECTION */}.call(exports, "/"))

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("babel-polyfill");

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _class;

var _autobindDecorator = __webpack_require__(3);

var _autobindDecorator2 = _interopRequireDefault(_autobindDecorator);

var _dockerode = __webpack_require__(5);

var _dockerode2 = _interopRequireDefault(_dockerode);

var _debug = __webpack_require__(4);

var _debug2 = _interopRequireDefault(_debug);

var _events = __webpack_require__(6);

var _events2 = _interopRequireDefault(_events);

var _url = __webpack_require__(10);

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Watchtower = (0, _autobindDecorator2.default)(_class = function (_EventEmitter) {
  _inherits(Watchtower, _EventEmitter);

  function Watchtower() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Watchtower);

    var _this = _possibleConstructorReturn(this, (Watchtower.__proto__ || Object.getPrototypeOf(Watchtower)).call(this));

    _this.busy = false;
    _this.config = {
      checkUpdateInterval: config.checkUpdateInterval || 3, /* in minutes */
      timeToWaitBeforeHealthyCheck: config.timeToWaitBeforeHealthyCheck || 30, /* in seconds */
      dockerOptions: config.dockerOptions
    };
    _this.docker = new _dockerode2.default(_this.config.dockerOptions);
    _this.registries = {};

    _this.getImageRepoTag = function (containerInfo) {
      var image = containerInfo.Image;
      if (image.indexOf('/') < 0) image = '/' + image;
      var comp = _url2.default.parse('docker://' + image);
      var host = comp.host;
      var fullname = comp.path.split('/')[1];
      var repo = fullname.split(':')[0];
      var tag = fullname.split(':')[1] || 'latest';
      if (host) repo = host + '/' + repo;
      return { host: host, repo: repo, tag: tag };
    };

    _this.setBusy = function () {
      return _this.busy = true;
    };
    _this.clearBusy = function () {
      return _this.busy = false;
    };
    _this.waitForBusy = function () {
      return new Promise(function (resolve) {
        var waiter = setInterval(function () {
          if (!_this.busy) {
            clearInterval(waiter);
            resolve();
          }
        });
      });
    };

    _this.waitForDelay = function (sec) {
      return new Promise(function (resolve) {
        setTimeout(resolve, sec * 1000);
      });
    };
    return _this;
  }

  _createClass(Watchtower, [{
    key: 'addRegistry',
    value: function addRegistry(name, auth) {
      if (!name || !auth) return false;
      if (!auth.serveraddress) return false;
      if (!auth.username || !auth.password) return false;
      this.registries[name] = auth;
      return true;
    }
  }, {
    key: 'checkForUpdates',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var _this2 = this;

        var containers;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(this.config.checkUpdateInterval < 0)) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt('return');

              case 2:
                if (!this.busy) {
                  _context.next = 4;
                  break;
                }

                return _context.abrupt('return');

              case 4:

                this.setBusy();
                _context.next = 7;
                return this.docker.listContainers();

              case 7:
                containers = _context.sent;
                _context.next = 10;
                return containers.filter(function (containerInfo) {
                  // Skip orphaned container (where image name equals to image ID)
                  return containerInfo.Image !== containerInfo.ImageID;
                }).reduce(function (curr, next, index, filteredContainers) {
                  return curr.then(function () {
                    return _this2.checkout(filteredContainers[index]);
                  });
                }, Promise.resolve());

              case 10:

                this.clearBusy();

              case 11:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function checkForUpdates() {
        return _ref.apply(this, arguments);
      }

      return checkForUpdates;
    }()
  }, {
    key: 'activate',
    value: function activate() {
      var _this3 = this;

      return new Promise(function (resolve) {
        _this3.warder = setInterval(_this3.checkForUpdates, _this3.config.checkUpdateInterval * 60000);
        _this3.checkForUpdates();
        resolve();
      });
    }
  }, {
    key: 'inactivate',
    value: function inactivate() {
      clearInterval(this.warder);
      return this.waitForBusy();
    }
  }, {
    key: 'checkout',
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(containerInfo) {
        var _getImageRepoTag, host, repo, tag, container, curr, next;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _getImageRepoTag = this.getImageRepoTag(containerInfo), host = _getImageRepoTag.host, repo = _getImageRepoTag.repo, tag = _getImageRepoTag.tag;
                _context2.next = 3;
                return this.docker.getContainer(containerInfo.Id).inspect();

              case 3:
                container = _context2.sent;

                if (!(tag.match(/.*-wt-curr$/) || tag.match(/.*-wt-next$/) || tag.match(/.*-wt-prev$/) || !container.State.Running)) {
                  _context2.next = 6;
                  break;
                }

                return _context2.abrupt('return');

              case 6:

                /* 1. Backup 'repo:tag' to 'repo:tag-wt-curr'. */
                (0, _debug2.default)('watchtower:checkout')('1. Backup ' + repo + ':' + tag + ' to ' + repo + ':' + tag + '-wt-curr');
                _context2.next = 9;
                return this.docker.getImage(repo + ':' + tag).tag({ repo: repo, tag: tag + '-wt-curr' });

              case 9:

                /* 2. Pull latest 'repo:tag' from the server. */
                (0, _debug2.default)('watchtower:checkout')('2. Pull ' + repo + ':' + tag);
                _context2.next = 12;
                return this.pull(host, repo, tag);

              case 12:

                /* 3. Tag 'repo:tag' to 'repo:tag-wt-next', if 'repo:tag-wt-next' exists then remove it first. */
                (0, _debug2.default)('watchtower:checkout')('3. Tag ' + repo + ':' + tag + ' to ' + repo + ':' + tag + '-wt-next');
                _context2.prev = 13;
                _context2.next = 16;
                return this.docker.getImage(repo + ':' + tag + '-wt-next').remove();

              case 16:
                _context2.next = 20;
                break;

              case 18:
                _context2.prev = 18;
                _context2.t0 = _context2['catch'](13);

              case 20:
                _context2.next = 22;
                return this.docker.getImage(repo + ':' + tag).tag({ repo: repo, tag: tag + '-wt-next' });

              case 22:

                /* 4. Restore 'repo:tag-wt-curr' back to 'repo:tag'. */
                (0, _debug2.default)('watchtower:checkout')('4. Restore ' + repo + ':' + tag + '-wt-curr back to ' + repo + ':' + tag);
                _context2.next = 25;
                return this.docker.getImage(repo + ':' + tag + '-wt-curr').tag({ repo: repo, tag: tag });

              case 25:

                /* 5. Remove 'repo:tag-wt-curr' which is temporarily created. */
                (0, _debug2.default)('watchtower:checkout')('5. Remove ' + repo + ':' + tag + '-wt-curr');
                _context2.next = 28;
                return this.docker.getImage(repo + ':' + tag + '-wt-curr').remove();

              case 28:

                /* 6. Inspect 'repo:tag' and 'repo:tag-wt-next' and compare their 'Created' date string. */
                (0, _debug2.default)('watchtower:checkout')('6. Compare ' + repo + ':' + tag + ' and ' + repo + ':' + tag + '-wt-next');
                _context2.next = 31;
                return this.docker.getImage(repo + ':' + tag).inspect();

              case 31:
                curr = _context2.sent;
                _context2.next = 34;
                return this.docker.getImage(repo + ':' + tag + '-wt-next').inspect();

              case 34:
                next = _context2.sent;

                if (!(curr.Created < next.Created)) {
                  _context2.next = 40;
                  break;
                }

                /**
                 * 7-1. If yes, emit an 'updateFound' event with container info to client to
                 *      notify that there is an new image to update, and keep 'repo:tag-wt-next'
                 *      until client has decided to apply the update or not.
                 */
                (0, _debug2.default)('watchtower:checkout')('7-1. Emit update event for ' + repo + ':' + tag);
                this.emit('updateFound', containerInfo);
                _context2.next = 43;
                break;

              case 40:
                /**
                 * 7-2. If no, current image is already latest version, remove 'repo:tag-wt-next'
                 *      which is temporarily created.
                 */
                (0, _debug2.default)('watchtower:checkout')('7-2. ' + repo + ':' + tag + ' is already up-to-date');
                _context2.next = 43;
                return this.docker.getImage(repo + ':' + tag + '-wt-next').remove();

              case 43:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[13, 18]]);
      }));

      function checkout(_x2) {
        return _ref2.apply(this, arguments);
      }

      return checkout;
    }()
  }, {
    key: 'applyUpdate',
    value: function () {
      var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(containerInfo) {
        var _getImageRepoTag2, repo, tag, container, containerName, latestImage, createOptions, latestContainer, lastestContainerInfo;

        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _getImageRepoTag2 = this.getImageRepoTag(containerInfo), repo = _getImageRepoTag2.repo, tag = _getImageRepoTag2.tag;

                if (!this.busy) {
                  _context3.next = 5;
                  break;
                }

                (0, _debug2.default)('watchtower:applyUpdate')('Wait for busy...');
                _context3.next = 5;
                return this.waitForBusy();

              case 5:

                this.busy = true;

                _context3.prev = 6;
                _context3.next = 9;
                return this.docker.getContainer(containerInfo.Id).inspect();

              case 9:
                container = _context3.sent;
                containerName = container.Name.replace(/^\//, '');
                // debug('watchtower:applyUpdate')(container);

                /* 1. Stop 'repo:tag' container and rename it to avoid name conflict. */

                (0, _debug2.default)('watchtower:applyUpdate')('1. Stop container ' + repo + ':' + tag + ' and rename it');
                _context3.next = 14;
                return this.docker.getContainer(containerInfo.Id).stop();

              case 14:
                _context3.next = 16;
                return this.docker.getContainer(containerInfo.Id).rename({
                  _query: { name: containerName + '-' + Date.now() }
                });

              case 16:

                /* 2. Tag old 'repo:tag' image to 'repo:tag-wt-prev'. */
                (0, _debug2.default)('watchtower:applyUpdate')('2. Tag old ' + repo + ':' + tag + ' to ' + repo + ':' + tag + '-wt-prev');
                _context3.next = 19;
                return this.docker.getImage(repo + ':' + tag).tag({ repo: repo, tag: tag + '-wt-prev' });

              case 19:

                /* 3. Remove old 'repo:tag' image. */
                (0, _debug2.default)('watchtower:applyUpdate')('3. Remove old ' + repo + ':' + tag);
                _context3.next = 22;
                return this.docker.getImage(repo + ':' + tag).remove();

              case 22:

                /* 4. Tag image 'repo:tag-wt-next' to 'repo:tag'. */
                (0, _debug2.default)('watchtower:applyUpdate')('4. Tag ' + repo + ':' + tag + '-wt-next to ' + repo + ':' + tag);
                _context3.next = 25;
                return this.docker.getImage(repo + ':' + tag + '-wt-next').tag({ repo: repo, tag: tag });

              case 25:
                _context3.next = 27;
                return this.docker.getImage(repo + ':' + tag + '-wt-next').inspect();

              case 27:
                latestImage = _context3.sent;
                createOptions = container.Config;

                createOptions._query = { name: containerName };
                createOptions.Env = latestImage.Config.Env;
                createOptions.Entrypoint = latestImage.Config.Entrypoint;
                createOptions.HostConfig = container.HostConfig;

                /* 5. Create latest container based on image 'repo:tag'. */
                (0, _debug2.default)('watchtower:applyUpdate')('5. Create and run latest ' + repo + ':' + tag + ' container');
                _context3.next = 36;
                return this.docker.createContainer(createOptions);

              case 36:
                latestContainer = _context3.sent;


                /* 6. Start latest container of 'repo:tag'. */
                (0, _debug2.default)('watchtower:applyUpdate')('6. Start latest ' + repo + ':' + tag);
                _context3.next = 40;
                return latestContainer.start();

              case 40:
                latestContainer = _context3.sent;


                /* 7. Wait a period of time in seconds before healthy check for new container */
                (0, _debug2.default)('watchtower:applyUpdate')('7. Waiting ' + this.config.timeToWaitBeforeHealthyCheck + ' seconds for healthy check');
                _context3.next = 44;
                return this.waitForDelay(this.config.timeToWaitBeforeHealthyCheck);

              case 44:
                _context3.next = 46;
                return latestContainer.inspect();

              case 46:
                lastestContainerInfo = _context3.sent;

                (0, _debug2.default)('watchtower:applyUpdate')(repo + ':' + tag + ' healthy check result:\n' + JSON.stringify(lastestContainerInfo.State, null, 2));

                if (!lastestContainerInfo.State.Running) {
                  _context3.next = 62;
                  break;
                }

                /* 7-1. If latest is running successfully... */
                /* 7-1-1. Remove 'repo:tag-wt-next' and 'repo:tag-wt-prev'. */
                (0, _debug2.default)('watchtower:applyUpdate')('7-1-1. Latest ' + repo + ':' + tag + ' is up and running, remove ' + tag + '-wt-next and ' + tag + '-wt-prev tag');
                _context3.next = 52;
                return this.docker.getImage(repo + ':' + tag + '-wt-next').remove();

              case 52:
                _context3.next = 54;
                return this.docker.getImage(repo + ':' + tag + '-wt-prev').remove();

              case 54:

                /* 7-1-2. Remove previous container. */
                (0, _debug2.default)('watchtower:applyUpdate')('7-1-2. Remove previous ' + repo + ':' + tag + ' container');
                _context3.next = 57;
                return this.docker.getContainer(containerInfo.Id).remove();

              case 57:

                (0, _debug2.default)('watchtower:applyUpdate')('7-1-3. Finish this round');
                this.busy = false;

                /* Emit an 'updated' event with latest running container */
                this.emit('updateApplied', lastestContainerInfo);
                _context3.next = 82;
                break;

              case 62:
                /* 7-2. If latest is failed... */
                /* 7-2-1. Remove failed container and its image. */
                (0, _debug2.default)('watchtower:applyUpdate')('7-2-1. Remove failed ' + repo + ':' + tag + ' container');
                _context3.next = 65;
                return this.docker.getContainer(lastestContainerInfo.Id).remove();

              case 65:
                _context3.next = 67;
                return this.docker.getImage(repo + ':' + tag).remove();

              case 67:
                _context3.next = 69;
                return this.docker.getImage(repo + ':' + tag + '-wt-next').remove();

              case 69:

                /* 7-2-2. Restore 'repo:tag-wt-prev' back to 'repo:tag'. */
                (0, _debug2.default)('watchtower:applyUpdate')('7-2-2. Latest ' + repo + ':' + tag + ' failed to start, fall back to previous version');
                _context3.next = 72;
                return this.docker.getImage(repo + ':' + tag + '-wt-prev').tag({ repo: repo, tag: tag });

              case 72:
                _context3.next = 74;
                return this.docker.getImage(repo + ':' + tag + '-wt-prev').remove();

              case 74:

                /* 7-2-3. Restart previous working version of 'repo:tag'. */
                (0, _debug2.default)('watchtower:applyUpdate')('7-2-3. Restart previous working version of ' + repo + ':' + tag);
                _context3.next = 77;
                return this.docker.getContainer(containerInfo.Id).rename({ _query: { name: '' + containerName } });

              case 77:
                _context3.next = 79;
                return this.docker.getContainer(containerInfo.Id).start();

              case 79:

                (0, _debug2.default)('watchtower:applyUpdate')('7-2-4. Finish this round');
                this.busy = false;

                this.emit('error', {
                  action: 'update',
                  container: lastestContainerInfo
                });

              case 82:
                _context3.next = 89;
                break;

              case 84:
                _context3.prev = 84;
                _context3.t0 = _context3['catch'](6);

                (0, _debug2.default)('watchtower:applyUpdate')('Unexpected error: ' + _context3.t0.message);
                /* TODO: Should fall back to previous working version */
                this.busy = false;
                this.emit('error', {
                  action: 'update',
                  container: containerInfo,
                  error: _context3.t0
                });

              case 89:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[6, 84]]);
      }));

      function applyUpdate(_x3) {
        return _ref3.apply(this, arguments);
      }

      return applyUpdate;
    }()
  }, {
    key: 'pull',
    value: function pull(host, repo, tag) {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        _this4.docker.pull(repo + ':' + tag, { authconfig: _this4.registries[host] }, function (error, stream) {
          if (error) {
            resolve();
            return;
          }

          _this4.docker.modem.followProgress(stream, function (error, output) {
            /* onFinished */
            if (error) console.error(error);
            resolve();
          }, function (event) {
            /* onProgress */
            //console.log(event);
          });
        });
      });
    }
  }, {
    key: 'push',
    value: function push(tag) {}
  }, {
    key: 'loadImage',
    value: function loadImage(file) {}
  }]);

  return Watchtower;
}(_events2.default)) || _class;

exports.default = Watchtower;

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("autobind-decorator");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("debug");

/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = require("dockerode");

/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = require("events");

/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = require("express");

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = require("http");

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = require("url");

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(1);
module.exports = __webpack_require__(0);


/***/ })
/******/ ]);
});