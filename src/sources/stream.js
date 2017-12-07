import openSocket from 'socket.io-client';
const socket = openSocket('http://localhost:3000');

function subscribeToTwitter(cb) {
  socket.on('twitter', (tweet) => {
    cb(tweet);
  });
}

export { subscribeToTwitter };
