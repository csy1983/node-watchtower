import express from 'express';
import fs from 'fs';
import http from 'http';
import Watchtower from './watchtower';

let app = express();
let config = {
  host: 'localhost',
  port: 5050,
};
let watchtower = new Watchtower({
  checkUpdateInterval: 3,
  timeToWaitBeforeHealthyCheck: 10,
});

watchtower.addRegistry('csy-mbp:5000', {
  username: 'csy',
  password: 'chardi',
  auth: '',
  email: '',
  serveraddress: 'csy-mbp:5000',
});

watchtower.on('updateFound', (containerInfo) => {
  watchtower.applyUpdate(containerInfo);
});

watchtower.on('updateApplied', (containerInfo) => {
  // console.log('Applied container', containerInfo);
});

watchtower.on('error', (error) => {
  // console.error(error.action, error.message);
});

watchtower.activate();

app.use(express.static(`${__dirname}/public`));
app.post('/config', (req, res) => {
  config = {
    host: req.params.host,
    port: req.params.port,
    ca: fs.readFileSync('ca.pem'),
    cert: fs.readFileSync('cert.pem'),
    key: fs.readFileSync('key.pem'),
  };
  res.sendStatus(200);
});

let force = false;
function terminate() {
  if (force) {
    process.exit(0);
  } else {
    force = true;
    watchtower.inactivate().then(() => {
      process.exit(0);
    });

    setTimeout(() => {
      console.log('Terminating watchtower...');
      console.log('Press Ctrl+C again to force terminate watchtower');
    }, 3000);
  }
}

process.on('SIGINT', terminate);
process.on('SIGTERM', terminate);
