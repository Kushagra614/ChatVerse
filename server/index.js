import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { run, all, get, initDb } from './db.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(cors());
app.use(express.json());

// Initialize database on startup
await initDb();

// JWT middleware to verify tokens
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Get or create user from Firebase UID
const getOrCreateUser = async (firebaseUid, email, displayName) => {
  let user = await get('SELECT * FROM users WHERE firebase_uid = $1', [firebaseUid]);
  if (!user) {
    const result = await run(
      'INSERT INTO users (firebase_uid, email, display_name) VALUES ($1, $2, $3) RETURNING *',
      [firebaseUid, email, displayName]
    );
    user = result.rows[0];
  }
  return user;
};

// REST endpoint to sync Firebase user to PostgreSQL and return JWT token
app.post('/api/sync-user', async (req, res) => {
  try {
    const { firebaseUid, email, displayName } = req.body;
    const user = await getOrCreateUser(firebaseUid, email, displayName);
    
    // Generate JWT token with user info
    const token = jwt.sign(
      { userId: user.id, firebaseUid: user.firebase_uid, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get messages for a room (protected with JWT)
app.get('/api/messages/:room', verifyToken, async (req, res) => {
  try {
    const messages = await all(
      `SELECT m.*, u.display_name FROM messages m 
       JOIN users u ON m.user_id = u.id 
       WHERE m.room = $1 
       ORDER BY m.created_at ASC`,
      [req.params.room]
    );
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.IO with JWT authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('No token provided'));
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.data.user = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', async (data) => {
    const { room, firebaseUid, email, displayName } = data;
    const user = await getOrCreateUser(firebaseUid, email, displayName);
    
    socket.join(room);
    socket.data.user = user;
    socket.data.room = room;
    
    console.log(`${displayName} joined ${room}`);
    io.to(room).emit('userJoined', { displayName, room });
  });

  socket.on('sendMessage', async (data) => {
    try {
      const { text } = data;
      const room = socket.data.room;
      const userId = socket.data.user.id;

      // Store in PostgreSQL
      const result = await run(
        'INSERT INTO messages (room, user_id, text) VALUES ($1, $2, $3) RETURNING *',
        [room, userId, text]
      );

      const message = result.rows[0];
      
      // Broadcast to room with user display name
      io.to(room).emit('newMessage', {
        ...message,
        display_name: socket.data.user.display_name,
      });
    } catch (err) {
      console.error('Send message error:', err);
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.data.user && socket.data.room) {
      io.to(socket.data.room).emit('userLeft', {
        displayName: socket.data.user.display_name,
      });
    }
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
  });
}

export default httpServer;
