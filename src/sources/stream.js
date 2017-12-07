import openSocket from 'socket.io-client';

const  socket = openSocket('http://localhost:3000');

function subscribeToTwitter(cb) {
  socket.on('twitter', (tweet) => {
    console.log(tweet);
    cb(tweet);
  });
//   socket.emit('subscribeToTimer', 1000);

}

export { subscribeToTwitter };