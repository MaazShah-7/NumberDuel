const { v4: uuidv4 } = require('uuid');

class GameManager {
  constructor(io) {
    this.io = io;
    this.players = new Map(); // socket.id -> { id, username, coins, status, roomId }
    this.rooms = new Map(); // roomId -> { id, players[], stakes, range, turn, status, state }
    this.queues = {
      1: [], // tier 1: e.g. 50 coins
      2: [], // tier 2: e.g. 500 coins
      3: []  // tier 3: e.g. 5000 coins
    };
    
    this.TIERS = {
      1: { cost: 50, range: 50 },
      2: { cost: 500, range: 500 },
      3: { cost: 5000, range: 5000 }
    };
  }

  registerPlayer(socket, data) {
    const { username } = data;
    this.players.set(socket.id, {
      id: socket.id,
      username: username || `Player_${socket.id.substring(0, 4)}`,
      coins: 1000, // Give starting coins
      status: 'idle',
      roomId: null
    });
    socket.emit('player_info', this.players.get(socket.id));
  }

  joinQueue(socket, tier) {
    const player = this.players.get(socket.id);
    if (!player) return;
    
    if (!this.TIERS[tier]) {
      socket.emit('error_message', 'Invalid tier');
      return;
    }

    if (player.coins < this.TIERS[tier].cost) {
      socket.emit('error_message', 'Not enough coins');
      return;
    }

    // Check if opponent is waiting
    if (this.queues[tier].length > 0) {
      const opponentId = this.queues[tier].shift();
      // Ensure opponent is still connected
      if (this.players.has(opponentId)) {
        this.createRoom([opponentId, socket.id], this.TIERS[tier]);
        return;
      }
    }

    // Otherwise join queue
    this.queues[tier].push(socket.id);
    player.status = 'queue';
    socket.emit('queue_joined', { tier });
  }

  leaveQueue(socket) {
    for (const tier in this.queues) {
      this.queues[tier] = this.queues[tier].filter(id => id !== socket.id);
    }
    const player = this.players.get(socket.id);
    if (player) {
      player.status = 'idle';
      socket.emit('queue_left');
    }
  }

  createPrivateRoom(socket, config) {
    const player = this.players.get(socket.id);
    if (!player) return;

    const stakes = parseInt(config.stakes) || 100;
    const range = parseInt(config.range) || 100;

    if (player.coins < stakes) {
      socket.emit('error_message', 'Not enough coins');
      return;
    }

    const roomCode = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit code
    
    const room = {
      id: roomCode,
      players: [socket.id],
      stakes,
      range,
      status: 'waiting',
      state: {},
      history: []
    };
    
    this.rooms.set(roomCode, room);
    player.roomId = roomCode;
    player.status = 'room';
    
    socket.join(roomCode);
    socket.emit('room_created', { roomCode, stakes, range });
  }

  joinPrivateRoom(socket, roomCode) {
    const player = this.players.get(socket.id);
    const room = this.rooms.get(roomCode);
    
    if (!player || !room) {
      socket.emit('error_message', 'Room not found');
      return;
    }
    
    if (room.players.length >= 2) {
      socket.emit('error_message', 'Room is full');
      return;
    }

    if (player.coins < room.stakes) {
      socket.emit('error_message', 'Not enough coins');
      return;
    }

    room.players.push(socket.id);
    player.roomId = roomCode;
    player.status = 'room';
    
    socket.join(roomCode);
    
    // Deduct coins and start setup
    this.initGame(room);
  }

  createRoom(playerIds, tierConfig) {
    const roomCode = uuidv4();
    const room = {
      id: roomCode,
      players: playerIds,
      stakes: tierConfig.cost,
      range: tierConfig.range,
      status: 'waiting',
      state: {},
      history: []
    };
    
    this.rooms.set(roomCode, room);

    playerIds.forEach(pid => {
      const p = this.players.get(pid);
      p.roomId = roomCode;
      p.status = 'room';
      const s = this.io.sockets.sockets.get(pid);
      if (s) s.join(roomCode);
    });

    this.initGame(room);
  }

  initGame(room) {
    room.status = 'setup';
    room.players.forEach(pid => {
      const p = this.players.get(pid);
      p.coins -= room.stakes; // Deduct entry fee
      const s = this.io.sockets.sockets.get(pid);
      if(s) s.emit('player_info', p);
    });

    this.io.to(room.id).emit('game_started', {
      roomId: room.id,
      stakes: room.stakes,
      range: room.range,
      players: room.players.map(pid => ({ id: pid, username: this.players.get(pid).username }))
    });
  }

  setTargetNumber(socket, targetNumber) {
    const player = this.players.get(socket.id);
    if (!player || !player.roomId) return;
    
    const room = this.rooms.get(player.roomId);
    if (!room || room.status !== 'setup') return;

    const num = parseInt(targetNumber);
    if (isNaN(num) || num < 1 || num > room.range) {
      socket.emit('error_message', 'Invalid target number');
      return;
    }

    room.state[socket.id] = { target: num };
    socket.emit('target_set_success');

    // Check if both players have set target
    if (Object.keys(room.state).length === 2) {
      this.startBattle(room);
    } else {
      this.io.to(room.id).emit('waiting_for_opponent');
    }
  }

  startBattle(room) {
    room.status = 'battle';
    // Randomly pick who goes first
    room.turn = room.players[Math.floor(Math.random() * room.players.length)];
    
    this.io.to(room.id).emit('battle_started', {
      turn: room.turn,
      range: room.range
    });
  }

  handleGuess(socket, guessNum) {
    const player = this.players.get(socket.id);
    if (!player || !player.roomId) return;
    
    const room = this.rooms.get(player.roomId);
    if (!room || room.status !== 'battle' || room.turn !== socket.id) return;

    const guess = parseInt(guessNum);
    const opponentId = room.players.find(id => id !== socket.id);
    const opponentTarget = room.state[opponentId].target;

    let result = '';
    if (guess === opponentTarget) {
      result = 'Correct';
    } else if (guess < opponentTarget) {
      result = 'Higher';
    } else {
      result = 'Lower';
    }

    const moveInfo = {
      guesser: socket.id,
      guesserName: player.username,
      guess: guess,
      result: result
    };
    room.history.push(moveInfo);

    this.io.to(room.id).emit('guess_result', moveInfo);

    if (result === 'Correct') {
      this.endGame(room, socket.id, opponentId);
    } else {
      // Switch turn
      room.turn = opponentId;
      this.io.to(room.id).emit('turn_changed', { turn: room.turn });
    }
  }

  endGame(room, winnerId, loserId) {
    room.status = 'finished';
    const pot = room.stakes * 2;
    
    const winner = this.players.get(winnerId);
    if (winner) {
      winner.coins += pot;
      const ws = this.io.sockets.sockets.get(winnerId);
      if(ws) ws.emit('player_info', winner);
    }

    this.io.to(room.id).emit('game_over', {
      winner: winnerId,
      winnerName: winner ? winner.username : 'Opponent',
      pot: pot,
      history: room.history
    });

    this.cleanupRoom(room.id);
  }

  leaveRoom(socket) {
    const player = this.players.get(socket.id);
    if (!player || !player.roomId) return;
    
    const room = this.rooms.get(player.roomId);
    if (room) {
      const opponentId = room.players.find(id => id !== socket.id);
      if (opponentId) {
        // Opponent wins by default
        this.io.to(room.id).emit('opponent_left');
        this.endGame(room, opponentId, socket.id);
      } else {
        this.cleanupRoom(room.id);
      }
    }
    
    if (player) {
      player.roomId = null;
      player.status = 'idle';
    }
  }

  handleDisconnect(socket) {
    this.leaveQueue(socket);
    this.leaveRoom(socket);
    this.players.delete(socket.id);
  }

  cleanupRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.players.forEach(pid => {
        const p = this.players.get(pid);
        if (p) {
          p.roomId = null;
          p.status = 'idle';
        }
      });
      this.rooms.delete(roomId);
    }
  }
}

module.exports = GameManager;
