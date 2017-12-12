import openSocket from 'socket.io-client';
const socket = openSocket('http://localhost:3000');

function subscribeToTwitter(cb) {
  socket.on('twitter', (tweet) => {
    cb(tweet);
  });
}

function subscribeToDeviceOrientation(cb) {
  socket.on('orientation', (orientation) => {
    cb(orientation);
  });
}

export { subscribeToTwitter, subscribeToDeviceOrientation };
