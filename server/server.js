const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketio = require('socket.io');
const Document = require('./models/Document');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: '*' } });

mongoose.connect(process.env.MONGO_URI);

io.on('connection', socket => {
  socket.on('get-document', async docId => {
    const document = await Document.findById(docId) || await Document.create({ _id: docId, content: '' });
    socket.join(docId);
    socket.emit('load-document', document.content);

    socket.on('send-changes', delta => {
      socket.broadcast.to(docId).emit('receive-changes', delta);
    });

    socket.on('save-document', async data => {
      await Document.findByIdAndUpdate(docId, { content: data });
    });
  });
});

server.listen(4000, () => console.log('Server on port 4000'));
