# node-watchtower
A docker image updater inspired by [v2tec/watchtower](https://github.com/v2tec/watchtower), implemented by Node.js.

## Features
- Periodically check if the image of each running container is updated.
- You decide whether to apply the updated image or not.
- Fall back to previous working version if the updated container is failed to start.
- Load local image from a gzipped tarball file or from a Readable stream.
- Push local image to the registry server.

## Usage
```
npm install node-watchtower
```

### Code
```js
import Watchtower from 'node-watchtower';

/* Create a watchtower instance */
const watchtower = new Watchtower({
  checkUpdateInterval: 180, /* 3 mins, set to 0 to disable polling update check */
  timeToWaitBeforeHealthyCheck: 10, /* 10 seconds to wait for the updated container to start */
});

/* Add your own private registry server if you want to pull/push images from it */
watchtower.addRegistryAuth('your.own.server:5000', {
  username: 'csy',
  password: 'chardi',
  auth: '',
  email: '',
});

/* Listen to updateFound event */
watchtower.on('updateFound', (containerInfo) => {
  /* Apply update immediately */
  watchtower.applyUpdate(containerInfo).then((updatedContainerInfo) => {
    console.log(`Container ${updatedContainerInfo.Name} is updated`);
  }).catch((error) => {
    console.log(`Container ${containerInfo.Name} update failed.`, error.message);
  });
});

/* Activate the watchtower. This will start checking updates every 3 mins */
watchtower.activate();

/* Load docker image from a file */
watchtower.load(`./test/images/alpine-3.5.tar.gz`).then((repoTags) => {
  console.log(`Image ${repoTags} loaded.`);
}).catch((error) => {
  console.log('Failed to load image.', error.message);
});

/* Push a image with repo:tag to the registry server */
watchtower.push('your.own.server:5000/alpine:3.5').then(() => {
  console.log('Image pushed');
}).catch((error) => {
  console.log('Image push failed.', error.message);
});

/* Inactivate the watchtower */
watchtower.inactivate().then(() => {
  console.log('Watchtower inactivated');
});

```

### Run watchtower container as a web server
Checkout [docker-watchtower](https://github.com/csy1983/docker-watchtower).

## TBD
- Push image to docker hub is not tested.
