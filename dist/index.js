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

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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
  // console.error(error.action, error.message);
});

watchtower.activate().then(function () {
  var stream = _fs2.default.createReadStream('./node-7.7.1.tar').on('error', function (error) {
    console.error(error);
  });

  stream.once('readable', _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return watchtower.loadImage(stream);

          case 2:
            _context.prev = 2;
            _context.next = 5;
            return watchtower.push('csy-mbp:5000/node:7.7.1');

          case 5:
            _context.next = 9;
            break;

          case 7:
            _context.prev = 7;
            _context.t0 = _context['catch'](2);

          case 9:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[2, 7]]);
  })));
});

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
      console.log('Watchtower is currently busy, please wait...');
      console.log('[ Press Ctrl+C again to force shut me down :\'( ]');
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

    _this.parseImageName = function (image) {
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
      _this.busy = true;
    };
    _this.clearBusy = function () {
      _this.busy = false;
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

    _this.waitForDelay = function (delay) {
      return new Promise(function (resolve) {
        setTimeout(resolve, delay * 1000);
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
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                this.warder = setInterval(this.checkForUpdates, this.config.checkUpdateInterval * 60000);
                _context2.next = 3;
                return this.checkForUpdates();

              case 3:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function activate() {
        return _ref2.apply(this, arguments);
      }

      return activate;
    }()
  }, {
    key: 'inactivate',
    value: function () {
      var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                clearInterval(this.warder);
                _context3.next = 3;
                return this.waitForBusy();

              case 3:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function inactivate() {
        return _ref3.apply(this, arguments);
      }

      return inactivate;
    }()
  }, {
    key: 'checkout',
    value: function () {
      var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(containerInfo) {
        var dbg, _parseImageName, host, repo, tag, container, curr, next;

        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                dbg = (0, _debug2.default)('watchtower:checkout');
                _parseImageName = this.parseImageName(containerInfo.Image), host = _parseImageName.host, repo = _parseImageName.repo, tag = _parseImageName.tag;
                _context4.next = 4;
                return this.docker.getContainer(containerInfo.Id).inspect();

              case 4:
                container = _context4.sent;

                if (!(tag.match(/.*-wt-curr$/) || tag.match(/.*-wt-next$/) || tag.match(/.*-wt-prev$/) || !container.State.Running)) {
                  _context4.next = 7;
                  break;
                }

                return _context4.abrupt('return');

              case 7:

                dbg('1. Backup ' + repo + ':' + tag + ' to ' + repo + ':' + tag + '-wt-curr');
                _context4.next = 10;
                return this.docker.getImage(repo + ':' + tag).tag({ repo: repo, tag: tag + '-wt-curr' });

              case 10:

                dbg('2. Pull ' + repo + ':' + tag);
                _context4.prev = 11;
                _context4.next = 14;
                return this.pull(host, repo, tag);

              case 14:
                _context4.next = 24;
                break;

              case 16:
                _context4.prev = 16;
                _context4.t0 = _context4['catch'](11);

                dbg('2-1. Pull ' + repo + ':' + tag + ' failed:');
                dbg(_context4.t0);
                dbg('Restoring ' + repo + ':' + tag + ' and skip this image');
                _context4.next = 23;
                return this.docker.getImage(repo + ':' + tag + '-wt-curr').tag({ repo: repo, tag: tag });

              case 23:
                return _context4.abrupt('return');

              case 24:

                dbg('3. Tag ' + repo + ':' + tag + ' to ' + repo + ':' + tag + '-wt-next');
                _context4.prev = 25;

                dbg('3-1. If tag ' + repo + ':' + tag + '-wt-next is already exists, then remove it first.');
                _context4.next = 29;
                return this.docker.getImage(repo + ':' + tag + '-wt-next').remove();

              case 29:
                _context4.next = 33;
                break;

              case 31:
                _context4.prev = 31;
                _context4.t1 = _context4['catch'](25);

              case 33:
                _context4.next = 35;
                return this.docker.getImage(repo + ':' + tag).tag({ repo: repo, tag: tag + '-wt-next' });

              case 35:

                dbg('4. Restore ' + repo + ':' + tag + '-wt-curr back to ' + repo + ':' + tag);
                _context4.next = 38;
                return this.docker.getImage(repo + ':' + tag + '-wt-curr').tag({ repo: repo, tag: tag });

              case 38:

                dbg('5. Remove ' + repo + ':' + tag + '-wt-curr  which is temporarily created');
                _context4.next = 41;
                return this.docker.getImage(repo + ':' + tag + '-wt-curr').remove();

              case 41:

                dbg('6. Compare creation date between ' + repo + ':' + tag + ' and ' + repo + ':' + tag + '-wt-next');
                _context4.next = 44;
                return this.docker.getImage(repo + ':' + tag).inspect();

              case 44:
                curr = _context4.sent;
                _context4.next = 47;
                return this.docker.getImage(repo + ':' + tag + '-wt-next').inspect();

              case 47:
                next = _context4.sent;


                dbg('7. current = ' + curr.Created + ', next = ' + next.Created);

                if (!(curr.Created < next.Created)) {
                  _context4.next = 54;
                  break;
                }

                /**
                 * 7-1. If yes, emit an 'updateFound' event with container info to client to
                 *      notify that there is an new image to update, and keep 'repo:tag-wt-next'
                 *      until client has decided to apply the update or not.
                 */
                dbg('7-1. Emit \'updateFound\' event for ' + repo + ':' + tag);
                this.emit('updateFound', containerInfo);
                _context4.next = 57;
                break;

              case 54:
                /**
                 * 7-2. If no, current image is already latest version, remove 'repo:tag-wt-next'
                 *      which is temporarily created.
                 */
                dbg('7-2. ' + repo + ':' + tag + ' is already up-to-date');
                _context4.next = 57;
                return this.docker.getImage(repo + ':' + tag + '-wt-next').remove();

              case 57:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[11, 16], [25, 31]]);
      }));

      function checkout(_x2) {
        return _ref4.apply(this, arguments);
      }

      return checkout;
    }()
  }, {
    key: 'applyUpdate',
    value: function () {
      var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(containerInfo) {
        var dbg, _parseImageName2, repo, tag, container, containerName, latestImage, createOptions, latestContainer, lastestContainerInfo;

        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                dbg = (0, _debug2.default)('watchtower:applyUpdate');
                _parseImageName2 = this.parseImageName(containerInfo.Image), repo = _parseImageName2.repo, tag = _parseImageName2.tag;

                if (!this.busy) {
                  _context5.next = 6;
                  break;
                }

                dbg('Wait for busy...');
                _context5.next = 6;
                return this.waitForBusy();

              case 6:
                _context5.next = 8;
                return this.docker.getContainer(containerInfo.Id).inspect();

              case 8:
                container = _context5.sent;
                containerName = container.Name.replace(/^\//, '');


                this.setBusy();

                _context5.prev = 11;

                dbg('1. Stop container ' + repo + ':' + tag + ' and rename it to avoid name conflict');
                _context5.next = 15;
                return this.docker.getContainer(containerInfo.Id).stop();

              case 15:
                _context5.next = 17;
                return this.docker.getContainer(containerInfo.Id).rename({
                  _query: { name: containerName + '-' + Date.now() }
                });

              case 17:

                dbg('2. Tag old ' + repo + ':' + tag + ' to ' + repo + ':' + tag + '-wt-prev');
                _context5.next = 20;
                return this.docker.getImage(repo + ':' + tag).tag({ repo: repo, tag: tag + '-wt-prev' });

              case 20:

                dbg('3. Remove old ' + repo + ':' + tag + ' image');
                _context5.next = 23;
                return this.docker.getImage(repo + ':' + tag).remove();

              case 23:

                dbg('4. Tag image ' + repo + ':' + tag + '-wt-next to ' + repo + ':' + tag);
                _context5.next = 26;
                return this.docker.getImage(repo + ':' + tag + '-wt-next').tag({ repo: repo, tag: tag });

              case 26:

                dbg('5. Update \'create options\' of container ' + repo + ':' + tag + ' with latest options');
                _context5.next = 29;
                return this.docker.getImage(repo + ':' + tag + '-wt-next').inspect();

              case 29:
                latestImage = _context5.sent;
                createOptions = container.Config;

                createOptions._query = { name: containerName };
                createOptions.Env = latestImage.Config.Env;
                createOptions.Entrypoint = latestImage.Config.Entrypoint;
                createOptions.HostConfig = container.HostConfig;

                dbg('6. Create latest container of ' + repo + ':' + tag + ' image');
                _context5.next = 38;
                return this.docker.createContainer(createOptions);

              case 38:
                latestContainer = _context5.sent;


                dbg('7. Start latest container of ' + repo + ':' + tag + ' image');
                _context5.next = 42;
                return latestContainer.start();

              case 42:
                latestContainer = _context5.sent;


                dbg('8. Waiting ' + this.config.timeToWaitBeforeHealthyCheck + ' seconds for the container to start before healthy check');
                _context5.next = 46;
                return this.waitForDelay(this.config.timeToWaitBeforeHealthyCheck);

              case 46:
                _context5.next = 48;
                return latestContainer.inspect();

              case 48:
                lastestContainerInfo = _context5.sent;


                dbg('9. ' + repo + ':' + tag + ' healthy check result:\n' + JSON.stringify(lastestContainerInfo.State, null, 2));

                if (!lastestContainerInfo.State.Running) {
                  _context5.next = 64;
                  break;
                }

                dbg('9-1. Latest ' + repo + ':' + tag + ' is up and running, remove temporary tags \'' + tag + '-wt-next\' and \'' + tag + '-wt-prev\'');
                _context5.next = 54;
                return this.docker.getImage(repo + ':' + tag + '-wt-next').remove();

              case 54:
                _context5.next = 56;
                return this.docker.getImage(repo + ':' + tag + '-wt-prev').remove();

              case 56:

                dbg('9-2. Remove previous ' + repo + ':' + tag + ' container');
                _context5.next = 59;
                return this.docker.getContainer(containerInfo.Id).remove();

              case 59:

                dbg('9-3. Update ' + repo + ':' + tag + ' successfully');
                this.clearBusy();

                /* Emit an 'updated' event with latest running container */
                this.emit('updateApplied', lastestContainerInfo);
                _context5.next = 72;
                break;

              case 64:
                dbg('Remove failed ' + repo + ':' + tag + ' container and its image');
                _context5.next = 67;
                return this.docker.getContainer(lastestContainerInfo.Id).remove();

              case 67:
                _context5.next = 69;
                return this.docker.getImage(repo + ':' + tag).remove();

              case 69:
                _context5.next = 71;
                return this.docker.getImage(repo + ':' + tag + '-wt-next').remove();

              case 71:
                throw new Error('Start container failed');

              case 72:
                _context5.next = 95;
                break;

              case 74:
                _context5.prev = 74;
                _context5.t0 = _context5['catch'](11);

                if (_context5.t0.message !== 'Start container failed') {
                  dbg('Unexpected error:');
                  dbg(_context5.t0);
                }

                _context5.prev = 77;

                dbg('Latest ' + repo + ':' + tag + ' failed to start, fall back to previous version');
                _context5.next = 81;
                return this.docker.getImage(repo + ':' + tag + '-wt-prev').tag({ repo: repo, tag: tag });

              case 81:
                _context5.next = 83;
                return this.docker.getImage(repo + ':' + tag + '-wt-prev').remove();

              case 83:
                _context5.next = 87;
                break;

              case 85:
                _context5.prev = 85;
                _context5.t1 = _context5['catch'](77);

              case 87:

                dbg('Restart previous working version of ' + repo + ':' + tag);
                _context5.next = 90;
                return this.docker.getContainer(containerInfo.Id).rename({ _query: { name: '' + containerName } });

              case 90:
                _context5.next = 92;
                return this.docker.getContainer(containerInfo.Id).start();

              case 92:

                dbg('Update ' + repo + ':' + tag + ' failed');

                this.clearBusy();
                this.emit('error', {
                  action: 'update',
                  message: _context5.t0.message,
                  container: containerInfo
                });

              case 95:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this, [[11, 74], [77, 85]]);
      }));

      function applyUpdate(_x3) {
        return _ref5.apply(this, arguments);
      }

      return applyUpdate;
    }()
  }, {
    key: 'pull',
    value: function pull(host, repo, tag) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        var dbg = (0, _debug2.default)('watchtower:pull');

        _this3.docker.pull(repo + ':' + tag, { authconfig: _this3.registries[host] }, function (pullError, stream) {
          dbg('Pulling ' + repo + ':' + tag);

          if (pullError) {
            dbg('Error occurred while pulling ' + repo + ':' + tag + ':');
            dbg(pullError);
            reject();
            return;
          }

          _this3.docker.modem.followProgress(stream, function (progressError) {
            /* onFinished */
            if (progressError) {
              dbg('Error occurred while pulling ' + repo + ':' + tag + ':');
              dbg(progressError);
              reject();
            } else {
              resolve();
            }
          }, function (event) {
            /* onProgress */
            if (event.status.startsWith('Status:')) {
              dbg(event.status);
            }
          });
        });
      });
    }
  }, {
    key: 'push',
    value: function () {
      var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(name) {
        var dbg, _parseImageName3, host, repo, tag, image;

        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                dbg = (0, _debug2.default)('watchtower:push');
                _parseImageName3 = this.parseImageName(name), host = _parseImageName3.host, repo = _parseImageName3.repo, tag = _parseImageName3.tag;
                _context6.next = 4;
                return this.docker.getImage(repo + ':' + tag);

              case 4:
                image = _context6.sent;


                dbg('Pushing image ' + name + '...');

                if (!this.busy) {
                  _context6.next = 10;
                  break;
                }

                dbg('Wait for busy...');
                _context6.next = 10;
                return this.waitForBusy();

              case 10:
                this.setBusy();
                _context6.next = 13;
                return image.push({ authconfig: this.registries[host] });

              case 13:
                this.clearBusy();

                dbg('Image ' + name + ' pushed');

              case 15:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function push(_x4) {
        return _ref6.apply(this, arguments);
      }

      return push;
    }()
  }, {
    key: 'loadImage',
    value: function () {
      var _ref7 = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(fileStream) {
        var dbg;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                dbg = (0, _debug2.default)('watchtower:loadImage');


                dbg('Loading image file ' + fileStream.path + '...');

                if (!this.busy) {
                  _context7.next = 6;
                  break;
                }

                dbg('Wait for busy...');
                _context7.next = 6;
                return this.waitForBusy();

              case 6:
                this.setBusy();
                _context7.next = 9;
                return this.docker.loadImage(fileStream, {});

              case 9:
                this.clearBusy();

                dbg('Image file ' + fileStream.path + ' loaded');

              case 11:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function loadImage(_x5) {
        return _ref7.apply(this, arguments);
      }

      return loadImage;
    }()
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