const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origins: ['http://localhost:4200'],
  },
});
app.get('/', (req, res) => {
  res.send('<h1>Hey Socket.io</h1>');
});
io.on('connection', (socket) => {
  socket.join('game');
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('ping', (data) => {
    console.log(data.msg);
    io.emit('pong', {
      msg: data.msg,
    });
  });

  socket.on('call', (data) => {
    socket.broadcast.to('game').emit('message', {
      msg: data.msg,
    });
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
