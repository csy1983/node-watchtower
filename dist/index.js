!function(e,t){if("object"==typeof exports&&"object"==typeof module)module.exports=t(require("stream"),require("babel-polyfill"),require("autobind-decorator"),require("concat-stream"),require("debug"),require("dockerode"),require("events"),require("fs"),require("tar-stream"),require("url"),require("zlib"));else if("function"==typeof define&&define.amd)define(["stream","babel-polyfill","autobind-decorator","concat-stream","debug","dockerode","events","fs","tar-stream","url","zlib"],t);else{var r="object"==typeof exports?t(require("stream"),require("babel-polyfill"),require("autobind-decorator"),require("concat-stream"),require("debug"),require("dockerode"),require("events"),require("fs"),require("tar-stream"),require("url"),require("zlib")):t(e.stream,e["babel-polyfill"],e["autobind-decorator"],e["concat-stream"],e.debug,e.dockerode,e.events,e.fs,e["tar-stream"],e.url,e.zlib);for(var n in r)("object"==typeof exports?exports:e)[n]=r[n]}}(this,function(e,t,r,n,a,o,i,s,u,c,f){return function(e){function t(n){if(r[n])return r[n].exports;var a=r[n]={i:n,l:!1,exports:{}};return e[n].call(a.exports,a,a.exports,t),a.l=!0,a.exports}var r={};return t.m=e,t.c=r,t.i=function(e){return e},t.d=function(e,r,n){t.o(e,r)||Object.defineProperty(e,r,{configurable:!1,enumerable:!0,get:n})},t.n=function(e){var r=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(r,"a",r),r},t.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},t.p="",t(t.s=14)}([function(e,t){e.exports=require("stream")},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var n=r(4),a=function(e){return e&&e.__esModule?e:{default:e}}(n);t.default=a.default},function(e,t){e.exports=require("babel-polyfill")},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function a(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function i(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var s=function(){function e(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,r,n){return r&&e(t.prototype,r),n&&e(t,n),t}}(),u=r(11),c=n(u),f=r(6),p=n(f),l=r(0),d=function(e){function t(e){a(this,t);var r=o(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return r.extract=c.default.extract(),r.extract.on("entry",function(e,t,n){t.pipe((0,p.default)(function(t){if("manifest.json"===e.name){var a=JSON.parse(t.toString());r.emit("manifests",a)}n()}))}),r.extract.on("finish",function(){r.emit("finish")}),r._transform=r._transform.bind(r),r._flush=r._flush.bind(r),r}return i(t,e),s(t,[{key:"_transform",value:function(e,t,r){this.extract.write(e),this.push(e),r()}},{key:"_flush",value:function(e){this.extract.end(),this.push(),e()}}]),t}(l.Transform);t.default=d},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function a(e){return function(){var t=e.apply(this,arguments);return new Promise(function(e,r){function n(a,o){try{var i=t[a](o),s=i.value}catch(e){return void r(e)}if(!i.done)return Promise.resolve(s).then(function(e){n("next",e)},function(e){n("throw",e)});e(s)}return n("next")})}}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function i(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function s(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var u,c=function(){function e(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}return function(t,r,n){return r&&e(t.prototype,r),n&&e(t,n),t}}(),f=r(5),p=n(f),l=r(8),d=n(l),h=r(7),m=n(h),g=r(9),v=n(g),w=r(10),x=n(w),y=r(0),b=r(12),k=n(b),I=r(13),R=n(I),_=r(3),q=n(_),P="tw.chardi.watchtower",C=(0,p.default)(u=function(e){function t(){var e=this,r=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};o(this,t);var n=i(this,(t.__proto__||Object.getPrototypeOf(t)).call(this));return n.configs={checkUpdateInterval:r.checkUpdateInterval||180,timeToWaitBeforeHealthyCheck:r.timeToWaitBeforeHealthyCheck||30,dockerOptions:r.dockerOptions},n.docker=new d.default(n.configs.dockerOptions),n.manifestExtractor=new q.default,n.label=n.configs.label||P,n.registryAuths={},n.busy=!1,n.forceTerminate=!1,n.watch=function(){n.configs.checkUpdateInterval>0&&(n.watcher=setTimeout(a(regeneratorRuntime.mark(function t(){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,n.checkForUpdates();case 2:n.watch();case 3:case"end":return e.stop()}},t,e)})),1e3*n.configs.checkUpdateInterval))},n.unwatch=function(){clearTimeout(n.watcher)},n.parseImageName=function(e){e.indexOf("/")<0&&(e="/"+e);var t=k.default.parse("docker://"+e),r=t.host,n=t.path.split("/")[1],a=n.split(":")[0],o=n.split(":")[1]||"latest";return r&&(a=r+"/"+a),{host:r,repo:a,tag:o}},n.setBusy=a(regeneratorRuntime.mark(function t(){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,n.waitForBusy();case 2:n.busy=!0;case 3:case"end":return e.stop()}},t,e)})),n.clearBusy=function(){n.busy=!1},n.waitForBusy=function(){return new Promise(function(e){if(n.busy){(0,m.default)("watchtower:waitForBusy")("Wait for busy...");var t=setInterval(function(){n.busy||(clearInterval(t),e())},1e3)}else e()})},n.waitForDelay=function(e){return new Promise(function(t){setTimeout(t,1e3*e)})},n.followProgress=function(e){return new Promise(function(t,r){var a=(0,m.default)("watchtower:followProgress"),o=void 0;n.docker.modem.followProgress(e,function(e){e?r(e):t()},function(e){e.status&&e.status!==o&&(o=e.status,a(o))})})},n.terminate=function(){n.forceTerminate?process.exit(0):(n.forceTerminate=!0,n.inactivate().then(function(){process.exit(0)}),setTimeout(function(){console.log("Watchtower is currently busy, please wait..."),console.log("[ Press ^C again to force shut me down (may cause problems). ]")},3e3))},n}return s(t,e),c(t,[{key:"isWatchtower",value:function(e){return e.Config.Labels[this.label]}},{key:"addRegistryAuth",value:function(e,t){return!(!e||!t)&&(!(!t.username||!t.password)&&(this.registryAuths[e]=t,this.registryAuths[e].serveraddress=e,!0))}},{key:"activate",value:function(){function e(){return t.apply(this,arguments)}var t=a(regeneratorRuntime.mark(function e(){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return process.on("SIGINT",this.terminate),process.on("SIGTERM",this.terminate),e.next=4,this.watch();case 4:case"end":return e.stop()}},e,this)}));return e}()},{key:"inactivate",value:function(){function e(){return t.apply(this,arguments)}var t=a(regeneratorRuntime.mark(function e(){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return this.unwatch(),process.removeListener("SIGINT",this.terminate),process.removeListener("SIGTERM",this.terminate),e.next=5,this.waitForBusy();case 5:case"end":return e.stop()}},e,this)}));return e}()},{key:"setCheckUpdateInterval",value:function(e){this.configs.checkUpdateInterval=e,this.unwatch(),this.watch()}},{key:"checkForUpdates",value:function(){function e(){return t.apply(this,arguments)}var t=a(regeneratorRuntime.mark(function e(){var t,r,n=this;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(t=(0,m.default)("watchtower:checkForUpdates"),!(this.configs.checkUpdateInterval<0)){e.next=3;break}return e.abrupt("return");case 3:if(!this.busy){e.next=5;break}return e.abrupt("return");case 5:return t("Checking for updates..."),e.next=8,this.setBusy();case 8:return e.next=10,this.docker.listContainers();case 10:return r=e.sent,e.next=13,r.filter(function(e){return e.Image!==e.ImageID}).reduce(function(e,t,r,a){return e.then(function(){return n.checkout(a[r])})},Promise.resolve());case 13:return e.next=15,this.clearBusy();case 15:t("Update check finished");case 16:case"end":return e.stop()}},e,this)}));return e}()},{key:"checkout",value:function(){function e(e){return t.apply(this,arguments)}var t=a(regeneratorRuntime.mark(function e(t){var r,n,a,o,i,s,u;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return r=(0,m.default)("watchtower:checkout"),n=this.parseImageName(t.Image),a=n.repo,o=n.tag,e.next=4,this.docker.getContainer(t.Id).inspect();case 4:if(i=e.sent,!o.match(/.*-wt-(curr|next|prev)$/)&&i.State.Running){e.next=7;break}return e.abrupt("return");case 7:return r("1. Backup "+a+":"+o+" to "+a+":"+o+"-wt-curr"),e.next=10,this.docker.getImage(a+":"+o).tag({repo:a,tag:o+"-wt-curr"});case 10:return r("2. Pull "+a+":"+o),e.prev=11,e.next=14,this.pull(i.Config.Image);case 14:e.next=26;break;case 16:return e.prev=16,e.t0=e.catch(11),r("2-1. Pull "+a+":"+o+" failed:"),r(e.t0),r("Restoring "+a+":"+o+" and skip this image"),e.next=23,this.docker.getImage(a+":"+o+"-wt-curr").tag({repo:a,tag:o});case 23:return e.next=25,this.docker.getImage(a+":"+o+"-wt-curr").remove();case 25:return e.abrupt("return");case 26:return r("3. Tag "+a+":"+o+" to "+a+":"+o+"-wt-next"),e.prev=27,r("3-1. If tag "+a+":"+o+"-wt-next is already exists, then remove it first."),e.next=31,this.docker.getImage(a+":"+o+"-wt-next").remove();case 31:e.next=35;break;case 33:e.prev=33,e.t1=e.catch(27);case 35:return e.next=37,this.docker.getImage(a+":"+o).tag({repo:a,tag:o+"-wt-next"});case 37:return r("4. Restore "+a+":"+o+"-wt-curr back to "+a+":"+o),e.next=40,this.docker.getImage(a+":"+o+"-wt-curr").tag({repo:a,tag:o});case 40:return r("5. Remove "+a+":"+o+"-wt-curr which is temporarily created"),e.next=43,this.docker.getImage(a+":"+o+"-wt-curr").remove();case 43:return r("6. Compare creation date between "+a+":"+o+" and "+a+":"+o+"-wt-next"),e.next=46,this.docker.getImage(a+":"+o).inspect();case 46:return s=e.sent,e.next=49,this.docker.getImage(a+":"+o+"-wt-next").inspect();case 49:if(u=e.sent,r("7. current = "+s.Created+", next = "+u.Created),!(s.Created<u.Created)){e.next=56;break}r("7-1. Emit 'updateFound' event for "+a+":"+o),this.emit("updateFound",i),e.next=60;break;case 56:return r("7-2. "+a+":"+o+" is already up-to-date, emit 'updateNotFound' event for "+a+":"+o),this.emit("updateNotFound",i),e.next=60,this.docker.getImage(a+":"+o+"-wt-next").remove();case 60:case"end":return e.stop()}},e,this,[[11,16],[27,33]])}));return e}()},{key:"applyUpdate",value:function(){function e(e){return t.apply(this,arguments)}var t=a(regeneratorRuntime.mark(function e(t){var r,n,a,o,i,s,u,c,f;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return r=(0,m.default)("watchtower:applyUpdate"),n=this.parseImageName(t.Config.Image),a=n.repo,o=n.tag,i=t.Name.replace(/^\//,""),e.next=5,this.setBusy();case 5:return e.prev=5,r("1. Rename "+a+":"+o+" container to avoid name conflict"),e.next=9,this.docker.getContainer(t.Id).rename({_query:{name:i+"-"+Date.now()}});case 9:if(this.isWatchtower(t)){e.next=15;break}return r("1.1 Stop "+a+":"+o+" container"),e.next=13,this.docker.getContainer(t.Id).stop();case 13:e.next=17;break;case 15:r("1.2 "+a+":"+o+" is a watchtower container, I'm going to update myself"),r("But I won't stop and will keep working until the new one is up and running");case 17:return r("2. Backup old "+a+":"+o+" to "+a+":"+o+"-wt-prev"),e.next=20,this.docker.getImage(a+":"+o).tag({repo:a,tag:o+"-wt-prev"});case 20:return r("3. Remove old "+a+":"+o+" image"),e.next=23,this.docker.getImage(a+":"+o).remove();case 23:return r("4. Tag image "+a+":"+o+"-wt-next to "+a+":"+o),e.next=26,this.docker.getImage(a+":"+o+"-wt-next").tag({repo:a,tag:o});case 26:return r("5. Update 'create options' of container "+a+":"+o+" with new options"),e.next=29,this.docker.getImage(a+":"+o+"-wt-next").inspect();case 29:return s=e.sent,u=t.Config,u._query={name:i},u.Env=s.Config.Env,u.Entrypoint=s.Config.Entrypoint,u.HostConfig=t.HostConfig,r("6. Create updated container of "+a+":"+o+" image"),e.next=38,this.docker.createContainer(u);case 38:return c=e.sent,r("7. Start updated container of "+a+":"+o+" image"),e.next=42,c.start();case 42:return c=e.sent,r("8. Waiting "+this.configs.timeToWaitBeforeHealthyCheck+" seconds for the container to start before healthy check"),e.next=46,this.waitForDelay(this.configs.timeToWaitBeforeHealthyCheck);case 46:return e.next=48,c.inspect();case 48:if(f=e.sent,r("9. "+a+":"+o+" healthy check result:\n"+JSON.stringify(f.State,null,2)),f.State.Running){e.next=61;break}return r("Remove failed "+a+":"+o+" container and its image"),e.next=54,this.docker.getContainer(f.Id).remove();case 54:return e.next=56,this.docker.getImage(a+":"+o).remove();case 56:return e.next=58,this.docker.getImage(a+":"+o+"-wt-next").remove();case 58:throw new Error("Start container failed");case 61:return r("9-1. Updated container of "+a+":"+o+" is up and running, remove temporary tags '"+o+"-wt-next' and '"+o+"-wt-prev'"),e.next=64,this.docker.getImage(a+":"+o+"-wt-next").remove();case 64:return e.next=66,this.docker.getImage(a+":"+o+"-wt-prev").remove();case 66:if(!this.isWatchtower(t)){e.next=70;break}return r("9-2. We are going to apply updated watchtower container, stop the old one"),e.next=70,this.docker.getContainer(t.Id).stop();case 70:return r("9-3. Remove previous "+a+":"+o+" container"),e.next=73,this.docker.getContainer(t.Id).remove();case 73:return r("9-4. Update "+a+":"+o+" successfully"),e.next=76,this.clearBusy();case 76:return e.abrupt("return",Promise.resolve(f));case 77:e.next=101;break;case 79:return e.prev=79,e.t0=e.catch(5),"Start container failed"!==e.t0.message&&(r("Unexpected error:"),r(e.t0)),e.prev=82,r("Failed to start updated container of "+a+":"+o+", fall back to previous version"),e.next=86,this.docker.getImage(a+":"+o+"-wt-prev").tag({repo:a,tag:o});case 86:return e.next=88,this.docker.getImage(a+":"+o+"-wt-prev").remove();case 88:e.next=92;break;case 90:e.prev=90,e.t1=e.catch(82);case 92:return r("Restart previous working version of "+a+":"+o),e.next=95,this.docker.getContainer(t.Id).rename({_query:{name:""+i}});case 95:return e.next=97,this.docker.getContainer(t.Id).start();case 97:return r("Update "+a+":"+o+" failed"),e.next=100,this.clearBusy();case 100:return e.abrupt("return",Promise.reject({message:e.t0.message,containerInfo:t}));case 101:case"end":return e.stop()}},e,this,[[5,79],[82,90]])}));return e}()},{key:"pull",value:function(){function e(e){return t.apply(this,arguments)}var t=a(regeneratorRuntime.mark(function e(t){var r,n,a,o,i,s=this;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return r=(0,m.default)("watchtower:pull"),n=this.parseImageName(t),a=n.host,o={authconfig:this.registryAuths[a]},r("Pulling "+t),e.next=6,new Promise(function(e,r){s.docker.pull(""+t,o,function(t,n){t?r(t):e(n)})});case 6:return i=e.sent,e.next=9,this.followProgress(i);case 9:r("Image "+t+" pulled");case 10:case"end":return e.stop()}},e,this)}));return e}()},{key:"push",value:function(){function e(e){return t.apply(this,arguments)}var t=a(regeneratorRuntime.mark(function e(t){var r,n,a,o,i;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return r=(0,m.default)("watchtower:push"),n=this.parseImageName(t),a=n.host,o={authconfig:this.registryAuths[a]},r("Pushing image "+t+"..."),e.next=6,this.setBusy();case 6:return e.next=8,this.docker.getImage(""+t).push(o);case 8:return i=e.sent,e.next=11,this.followProgress(i);case 11:return e.next=13,this.clearBusy();case 13:r("Image "+t+" pushed");case 14:case"end":return e.stop()}},e,this)}));return e}()},{key:"load",value:function(){function e(e){return t.apply(this,arguments)}var t=a(regeneratorRuntime.mark(function e(t){var r,n,a,o,i;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(r=(0,m.default)("watchtower:load"),n=new q.default,a=void 0,o=void 0,"string"!=typeof t){e.next=9;break}n.on("manifests",function(e){e.length>0&&e[0].RepoTags&&(o=e[0].RepoTags,r("Found RepoTags:",o))}),a=x.default.createReadStream(t).pipe(R.default.createGunzip()).pipe(n),e.next=17;break;case 9:if(!(t instanceof y.Readable)){e.next=13;break}a=t,e.next=17;break;case 13:return i="Unsupported type of image source",r(i),n.removeAllListeners(),e.abrupt("return",Promise.reject(i));case 17:return r("Loading image "+(a.path||"from Readable stream")+"..."),e.next=20,this.setBusy();case 20:return e.next=22,this.docker.loadImage(a,{});case 22:return n.removeAllListeners(),e.next=25,this.clearBusy();case 25:if(r("Image "+(a.path||"stream")+" loaded"),o){e.next=28;break}return e.abrupt("return",Promise.reject("No RepoTags found"));case 28:return e.abrupt("return",Promise.resolve(o));case 29:case"end":return e.stop()}},e,this)}));return e}()}]),t}(v.default))||u;t.default=C},function(e,t){e.exports=require("autobind-decorator")},function(e,t){e.exports=require("concat-stream")},function(e,t){e.exports=require("debug")},function(e,t){e.exports=require("dockerode")},function(e,t){e.exports=require("events")},function(e,t){e.exports=require("fs")},function(e,t){e.exports=require("tar-stream")},function(e,t){e.exports=require("url")},function(e,t){e.exports=require("zlib")},function(e,t,r){r(2),e.exports=r(1)}])});