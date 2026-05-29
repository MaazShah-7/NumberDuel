const { v4: uuidv4 } = require('uuid');
const { dbRun } = require('./database');

class GameManager {
  constructor(io, jwtSecret) {
    this.io = io;
    this.jwtSecret = jwtSecret;
    this.players = new Map(); // socket.id -> { id, username, totalScore, status, roomId, pfp, dbId }
    this.rooms = new Map(); // roomId -> { id, players[], range, turn, status, state }
    this.queues = {}; // range -> [{ id: socket.id, totalScore }]
  }

  async registerPlayer(socket, dbUser) {
    this.players.set(socket.id, {
      id: socket.id,
      dbId: dbUser.id,
      username: dbUser.username,
      totalScore: dbUser.totalScore,
      pfp: dbUser.pfp,
      status: 'idle',
      roomId: null
    });
    socket.emit('player_info', this.players.get(socket.id));
  }

  joinQueue(socket, range) {
    const player = this.players.get(socket.id);
    if (!player) return;
    
    if (!this.queues[range]) {
      this.queues[range] = [];
    }

    this.queues[range].push({ id: socket.id, totalScore: player.totalScore });

    // Matchmaking logic: Sort by totalScore and pair adjacent players
    if (this.queues[range].length >= 2) {
      this.queues[range].sort((a, b) => a.totalScore - b.totalScore);
      const myIndex = this.queues[range].findIndex(p => p.id === socket.id);
      
      const opponentIndex = myIndex > 0 ? myIndex - 1 : myIndex + 1;
      const opponentId = this.queues[range][opponentIndex].id;

      if (this.players.has(opponentId)) {
        // Remove both from queue
        this.queues[range] = this.queues[range].filter((_, idx) => idx !== myIndex && idx !== opponentIndex);
        this.createRoom([opponentId, socket.id], range);
        return;
      }
    }

    player.status = 'queue';
    socket.emit('queue_joined', { range });
  }

  leaveQueue(socket) {
    for (const range in this.queues) {
      this.queues[range] = this.queues[range].filter(p => p.id !== socket.id);
    }
    const player = this.players.get(socket.id);
    if (player) {
      player.status = 'idle';
      socket.emit('queue_left');
    }
  }

  createPrivateRoom(socket, range) {
    const player = this.players.get(socket.id);
    if (!player) return;

    // Generate 7-digit code
    const roomCode = Math.floor(1000000 + Math.random() * 9000000).toString();
    
    const room = {
      id: roomCode,
      players: [socket.id],
      range: parseInt(range) || 100,
      status: 'waiting',
      state: {},
      history: []
    };
    
    this.rooms.set(roomCode, room);
    player.roomId = roomCode;
    player.status = 'room';
    
    socket.join(roomCode);
    socket.emit('room_created', { roomCode, range: room.range });
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
    
    this.initGame(room);
  }

  createRoom(playerIds, range) {
    const roomCode = uuidv4();
    const room = {
      id: roomCode,
      players: playerIds,
      range: parseInt(range) || 100,
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

  async initGame(room) {
    room.status = 'setup';
    
    // Increment matchesPlayed in DB for both
    for (const pid of room.players) {
      const p = this.players.get(pid);
      
      try {
        await dbRun('UPDATE users SET matchesPlayed = matchesPlayed + 1 WHERE id = ?', [p.dbId]);
      } catch (err) {
        console.error('Error updating DB on game start', err);
      }

      const s = this.io.sockets.sockets.get(pid);
      if(s) s.emit('player_info', p);
    }

    this.io.to(room.id).emit('game_started', {
      roomId: room.id,
      range: room.range,
      players: room.players.map(pid => ({ id: pid, username: this.players.get(pid).username, pfp: this.players.get(pid).pfp }))
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

  async endGame(room, winnerId, loserId) {
    room.status = 'finished';
    
    const winner = this.players.get(winnerId);
    const loser = this.players.get(loserId);

    // Update DB
    if (winner) {
      winner.totalScore += 50;
      try {
        await dbRun('UPDATE users SET totalScore = totalScore + 50, matchesWon = matchesWon + 1 WHERE id = ?', [winner.dbId]);
      } catch(e) { console.error(e); }
      const ws = this.io.sockets.sockets.get(winnerId);
      if(ws) ws.emit('player_info', winner);
    }

    if (loser) {
      loser.totalScore += 10;
      try {
        await dbRun('UPDATE users SET totalScore = totalScore + 10, matchesLost = matchesLost + 1 WHERE id = ?', [loser.dbId]);
      } catch(e) { console.error(e); }
      const ls = this.io.sockets.sockets.get(loserId);
      if(ls) ls.emit('player_info', loser);
    }

    this.io.to(room.id).emit('game_over', {
      winner: winnerId,
      winnerName: winner ? winner.username : 'Opponent',
      scoreEarned: winnerId === room.players[0] ? 50 : 10, // Not super useful for both, frontend can calculate. We'll pass points.
      history: room.history,
      targets: {
        [room.players[0]]: room.state[room.players[0]]?.target,
        [room.players[1]]: room.state[room.players[1]]?.target
      }
    });

    this.cleanupRoom(room.id);
  }

  leaveRoom(socket) {
    const player = this.players.get(socket.id);
    if (!player || !player.roomId) return;
    
    const room = this.rooms.get(player.roomId);
    if (room && room.status !== 'finished') {
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
