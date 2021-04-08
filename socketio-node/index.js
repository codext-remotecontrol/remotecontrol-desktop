const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origins: '*',
  },
});
app.get('/', (req, res) => {
  res.send('<h1>Hey Socket.io</h1>');
});
io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', (data) => {
    console.log('user disconnected', data);
    socket.broadcast.emit('disconnected');
  });

  /*socket.on('remoteData', (data) => {
    socket.broadcast.to('game').emit('remoteData', data);
  });*/

  /*socket.on('join', (room) => {
    console.log('signaling', room);
    socket.join(room);
  });

  socket.on('signaling', (data) => {
    console.log('signaling', data.room);
    socket.to(data.room).emit('signaling', data.data);
  });*/

  socket.on('join', (room) => {
    console.log('join', room);
    socket.join(room);
    socket.on('remoteData', (data) => {
      socket.broadcast.to(room).emit('remoteData', data.data);
    });
  });
  socket.on('remoteData', (data) => {
    socket.broadcast.to(data.room).emit('remoteData', data.data);
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
