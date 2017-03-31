// docker run -d --name node-checker -v "$PWD":/usr/src/app -w /usr/src/app csy-mbp:5000/node node node-checker.js

setInterval(() => {
  console.log(`I'm running on Node.js ${process.version}!`);
}, 5000);
