const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbGet, dbRun } = require('./database');
const GameManager = require('./gameManager');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_number_duel';

// REST API for Authentication
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  try {
    const existing = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
    if (existing) return res.status(400).json({ error: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await dbRun(
      'INSERT INTO users (username, password, coins, matchesPlayed, matchesWon, matchesLost) VALUES (?, ?, 1000, 0, 0, 0)',
      [username, hashedPassword]
    );

    const user = { id: result.lastID, username, coins: 1000, pfp: 'default_avatar.png' };
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    // Don't send password hash to client
    delete user.password;
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware for token auth on API routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet('SELECT id, username, pfp, coins, matchesPlayed, matchesWon, matchesLost FROM users WHERE id = ?', [req.user.id]);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profile', authenticateToken, async (req, res) => {
  const { username, password, pfp } = req.body;
  try {
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);

    let newUsername = username || user.username;
    let newPfp = pfp || user.pfp;
    let newPassword = user.password;

    if (password) {
      newPassword = await bcrypt.hash(password, 10);
    }

    if (username && username !== user.username) {
      const existing = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
      if (existing) return res.status(400).json({ error: 'Username already taken' });
    }

    await dbRun(
      'UPDATE users SET username = ?, password = ?, pfp = ? WHERE id = ?',
      [newUsername, newPassword, newPfp, req.user.id]
    );

    const updatedUser = await dbGet('SELECT id, username, pfp, coins, matchesPlayed, matchesWon, matchesLost FROM users WHERE id = ?', [req.user.id]);
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const gameManager = new GameManager(io, JWT_SECRET);

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Authenticate socket connection
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await dbGet('SELECT id, username, pfp, coins, matchesPlayed, matchesWon, matchesLost FROM users WHERE id = ?', [decoded.id]);
      if (user) {
        await gameManager.registerPlayer(socket, user);
      } else {
        socket.emit('error_message', 'User not found in DB');
      }
    } catch (err) {
      socket.emit('auth_error', 'Invalid token');
    }
  });

  // Matchmaking (now accepts range)
  socket.on('join_queue', (range) => {
    gameManager.joinQueue(socket, range);
  });

  socket.on('leave_queue', () => {
    gameManager.leaveQueue(socket);
  });

  // Private Lobbies
  socket.on('create_private_room', (range) => {
    gameManager.createPrivateRoom(socket, range);
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
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
