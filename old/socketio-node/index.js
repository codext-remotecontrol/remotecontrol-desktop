const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origins: '*',
  },
});
app.get('/', (req, res) => {
  res.send(' ');
});
io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('join', (room) => {
    console.log('join', room);
    socket.join(room);
    socket.on('remoteData', (data) => {
      socket.broadcast.to(room).emit('remoteData', data.data);
    });

    socket.on('disconnect', (data) => {
      console.log('user disconnected', data);
      socket.broadcast.to(room).emit('disconnected');
    });
  });
  socket.on('remoteData', (data) => {
    socket.broadcast.to(data.room).emit('remoteData', data.data);
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
