const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const GameManager = require('./gameManager');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const gameManager = new GameManager(io);

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Setup player profile
  socket.on('register', (data) => {
    gameManager.registerPlayer(socket, data);
  });

  // Matchmaking
  socket.on('join_queue', (tier) => {
    gameManager.joinQueue(socket, tier);
  });

  socket.on('leave_queue', () => {
    gameManager.leaveQueue(socket);
  });

  // Private Lobbies
  socket.on('create_private_room', (config) => {
    gameManager.createPrivateRoom(socket, config);
  });

  socket.on('join_private_room', (roomCode) => {
    gameManager.joinPrivateRoom(socket, roomCode);
  });

  // Game Setup (Target Selection)
  socket.on('set_target_number', (targetNumber) => {
    gameManager.setTargetNumber(socket, targetNumber);
  });

  // Gameplay
  socket.on('submit_guess', (guess) => {
    gameManager.handleGuess(socket, guess);
  });

  socket.on('leave_room', () => {
    gameManager.leaveRoom(socket);
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    gameManager.handleDisconnect(socket);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
