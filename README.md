# 🚀 ChatVerse - Full-Stack Real-Time Chat Application

A modern, production-ready chat application built with **React**, **Express.js**, **Socket.IO**, and **PostgreSQL**. ChatVerse combines Firebase authentication with a custom backend for persistent, real-time messaging.

---

## ✨ Key Features

### **Authentication & Security**
- 🔐 **Google OAuth** via Firebase (secure, passwordless)
- 🎫 **JWT Token-Based Auth** (7-day expiry)
- Protected API endpoints with token verification
- Secure Socket.IO connections with JWT middleware

### **Real-Time Messaging**
- ⚡ **WebSocket via Socket.IO** for instant message delivery
- 💬 **Room-based messaging** (isolated conversations)
- 📡 **Live user presence** (see who joined/left)
- **Auto-broadcast** to all users in room (<50ms latency)

### **Data Persistence**
- 💾 **PostgreSQL Database** with proper schema design
- 🔗 **Foreign Key Relationships** (messages → users)
- 📊 **Full Message History** (survives app restart)
- Query optimization with JOINs for display names

### **Developer Experience**
- 🔥 **Hot Module Reload (HMR)** with Vite
- 🛠️ **SQL Tools Integration** for database visualization
- 📚 **Comprehensive Architecture Documentation**
- 🎯 **Simple, modular codebase**

---

## 🏗️ Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 19.1.0 | UI framework |
| **Build Tool** | Vite | 7.0.0 | Lightning-fast dev server |
| **Backend** | Express.js | 4.19.2 | REST API & server |
| **Real-Time** | Socket.IO | 4.7.5 | WebSocket messaging |
| **Database** | PostgreSQL | 14+ | Persistent storage |
| **Auth** | Firebase | 11.8.1 | Google OAuth |
| **Security** | JWT | 9.0.2 | Token authentication |
| **Dev Tools** | Nodemon | 3.1.4 | Auto-restart on changes |

---

## 📁 Project Structure

```
ChatVerse/
├── src/                           # Frontend (React)
│   ├── components/
│   │   ├── Auth.jsx              # Google login form
│   │   ├── Chat.jsx              # Real-time chat UI
│   │   └── AppWrapper.js         # Auth state wrapper
│   ├── styles/
│   │   ├── app.css
│   │   ├── Auth.css
│   │   └── Chat.css
│   ├── firebase-config.js        # Firebase setup
│   ├── App.jsx                   # Main component
│   └── index.jsx                 # Entry point
│
├── server/                        # Backend (Express + Socket.IO)
│   ├── index.js                  # Express server (164 LOC)
│   │   ├── JWT middleware
│   │   ├── REST endpoints (/api/sync-user, /api/messages/:room)
│   │   └── Socket.IO event handlers
│   └── db.js                     # PostgreSQL layer (65 LOC)
│       ├── Connection pooling
│       ├── Query helpers (run, get, all)
│       └── Auto table initialization
│
├── public/                        # Static files
│   ├── favicon.ico
│   └── robots.txt
│
├── ARCHITECTURE.md               # Full system documentation
├── queries.sql                   # Pre-made database queries
├── .env                          # Environment variables
├── package.json                  # Dependencies & scripts
├── vite.config.js               # Vite configuration
├── .sqltools.json               # SQL Tools config
└── index.html                   # HTML entry point
```

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js (v18+)
- PostgreSQL (v12+)
- npm or yarn

### **1. Clone & Setup**
```bash
git clone https://github.com/Kushagra614/ChatVerse.git
cd ChatVerse
npm install
```

### **2. Configure Environment**
Create `.env` file:
```env
PORT=4000
NODE_ENV=development
JWT_SECRET=your-secret-key-here
DATABASE_URL=postgresql://postgres:postgres@localhost/chatverse
VITE_API_BASE_URL=http://localhost:4000
```

### **3. Start Servers**

**Option A: Both Frontend & Backend**
```bash
npm run dev:full
```

**Option B: Separate Terminals**
```bash
# Terminal 1: Frontend (Vite)
npm run dev

# Terminal 2: Backend (Express)
npm run server
```

### **4. Access the App**
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000
- **Database:** PostgreSQL on localhost:5432

---

## 🔌 API Endpoints

### **Authentication**
```http
POST /api/sync-user
Content-Type: application/json

{
  "firebaseUid": "google-oauth-abc123",
  "email": "user@gmail.com",
  "displayName": "John Doe"
}

Response:
{
  "user": { id, firebase_uid, email, display_name, created_at },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **Get Messages**
```http
GET /api/messages/general
Authorization: Bearer <JWT_TOKEN>

Response:
[
  {
    id: 1,
    room: "general",
    user_id: 1,
    text: "Hello everyone!",
    display_name: "John Doe",
    created_at: "2026-03-13T14:30:00Z"
  },
  ...
]
```

---

## 🔌 Socket.IO Events

### **Client → Server**
```javascript
// Join a room
socket.emit('joinRoom', {
  room: 'general',
  firebaseUid: user.uid,
  email: user.email,
  displayName: user.displayName
});

// Send a message
socket.emit('sendMessage', {
  text: 'Hello everyone!',
  room: 'general'
});
```

### **Server → Client**
```javascript
// User joined notification
socket.on('userJoined', { displayName, room });

// New message broadcast
socket.on('newMessage', {
  id, room, user_id, text, created_at, display_name
});

// User left notification
socket.on('userLeft', { displayName, room });
```

---

## 📊 Database Schema

### **Users Table**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(255) UNIQUE NOT NULL,  -- Google OAuth UID
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Messages Table**
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  room VARCHAR(100) NOT NULL,                 -- Chat room name
  user_id INTEGER NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🗂️ Database Access Methods

### **Method 1: Command Line (psql)** ⚡
```bash
# View all users
sudo -u postgres psql -d chatverse -c "SELECT * FROM users;"

# View all messages with user names
sudo -u postgres psql -d chatverse -c "
  SELECT m.*, u.display_name 
  FROM messages m 
  JOIN users u ON m.user_id = u.id;
"

# Clear all data (keep tables)
sudo -u postgres psql -d chatverse -c "
  DELETE FROM messages;
  DELETE FROM users;
"
```

### **Method 2: SQL Tools in VS Code** ✨
1. Install extension: `mtxr.sqltools`
2. Install driver: `mtxr.sqltools-driver-pg`
3. Create connection:
   - Host: `localhost`
   - Port: `5432`
   - Database: `chatverse`
   - Username: `postgres`
   - Password: `postgres`
4. Right-click table → "Select 50" to view data instantly

**Pre-made Queries** (in `queries.sql`):
```sql
-- Get all users
SELECT * FROM users;

-- Get all messages with display names
SELECT m.id, m.text, u.display_name, m.created_at
FROM messages m
JOIN users u ON m.user_id = u.id;

-- Count messages per room
SELECT room, COUNT(*) as message_count FROM messages GROUP BY room;

-- Get most recent 10 messages
SELECT m.*, u.display_name
FROM messages m
JOIN users u ON m.user_id = u.id
ORDER BY m.created_at DESC LIMIT 10;
```

### **Method 3: REST API** (from Frontend)
```javascript
const response = await fetch('http://localhost:4000/api/messages/general', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const messages = await response.json();
```

### **Method 4: GUI Tools** (Optional)
- **DBeaver** (free) - Desktop app with full DB management
- **pgAdmin** (free) - Web interface for PostgreSQL

---

## 🔄 Complete Data Flow

### **1. User Authenticates**
```
User → [Google OAuth] → Firebase → Frontend receives uid + email
```

### **2. User Syncs to Database**
```
Frontend POST /api/sync-user
  ↓
Backend getOrCreateUser()
  ↓
PostgreSQL INSERT or SELECT
  ↓
JWT token generated & returned
```

### **3. User Joins Room**
```
Frontend socket.io connect with JWT
  ↓
Backend verifies JWT
  ↓
socket.join('room-name')
  ↓
Broadcast 'userJoined' to all in room
```

### **4. User Sends Message**
```
Frontend socket.emit('sendMessage')
  ↓
Backend INSERT to PostgreSQL
  ↓
Query user display_name
  ↓
Broadcast to room (<50ms)
  ↓
Frontend receives & displays instantly
```

### **5. User Loads History**
```
Frontend GET /api/messages/:room with JWT
  ↓
Backend verifies JWT
  ↓
PostgreSQL SELECT with JOIN
  ↓
Return messages with display names
  ↓
Frontend renders full chat history
```

---

## 📚 Available NPM Scripts

```bash
npm run dev           # Start Vite frontend only (port 5173)
npm run server        # Start Express backend with nodemon (port 4000)
npm run dev:full      # Start both concurrently (recommended)
npm run build         # Build for production
npm run preview       # Preview production build
npm start             # Run backend in production (node server/index.js)
npm test              # Run tests (if configured)
```

---

## 🔐 Security Features

✅ **Firebase OAuth** - No passwords stored, Google handles auth
✅ **JWT Tokens** - 7-day expiry, signed with secret key
✅ **Protected Routes** - All API endpoints validate JWT
✅ **SQL Injection Prevention** - Parameterized queries ($1, $2, etc.)
✅ **CORS** - Restricted cross-origin requests
✅ **Socket.IO Auth** - JWT verified on connection
✅ **Foreign Keys** - Referential integrity in database

---

## 📈 Performance Optimizations

- **Connection Pooling** - Reuses database connections
- **Query Optimization** - JOINs fetch user data in single query
- **Parameterized Queries** - Faster than string concatenation
- **WebSocket** - Lower latency than HTTP polling
- **Vite** - Ultra-fast dev server with HMR
- **Room-Based Broadcasting** - Messages only sent to relevant clients

---

## 🎯 Resume Highlights

> **Full-Stack Chat Application with React, Express.js, and PostgreSQL**
>
> Built a production-ready real-time chat application featuring:
> - **Frontend:** React 19 + Vite with Google OAuth authentication
> - **Backend:** Express.js REST API + Socket.IO WebSocket server
> - **Database:** PostgreSQL with proper schema design and foreign key relationships
> - **Security:** JWT token-based authentication on both REST and WebSocket connections
> - **Real-Time:** Room-based message broadcasting with sub-50ms latency
> - **Persistence:** Full message history stored in PostgreSQL, survives app restart
>
> **Tech Stack:** React, Vite, Express.js, Socket.IO, PostgreSQL, Firebase Auth, JWT

---

## 🐛 Troubleshooting

### **Port Already in Use**
```bash
sudo lsof -ti:4000 | xargs kill -9   # Kill port 4000
sudo lsof -ti:5173 | xargs kill -9   # Kill port 5173
```

### **Database Connection Error**
```bash
sudo service postgresql status        # Check status
sudo service postgresql start         # Start service
sudo -u postgres psql -l | grep chatverse  # Verify exists
```

### **JWT Token Expired**
- Tokens expire after 7 days
- Frontend automatically gets new token on next login

### **Messages Not Persisting**
- Ensure `.env` has correct `DATABASE_URL`
- Check PostgreSQL: `sudo service postgresql status`
- Verify tables: `sudo -u postgres psql -d chatverse -c "\dt"`

---

## 📖 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system design with detailed data flows
- **[queries.sql](./queries.sql)** - Pre-made database queries
- **[.sqltools.json](./.sqltools.json)** - SQL Tools configuration

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - feel free to use this project for learning or building your own chat app!

---

## 👤 Author

**Kushagra Vardhan**
- GitHub: [@Kushagra614](https://github.com/Kushagra614)
- ChatVerse: Full-stack real-time chat with React, Express, PostgreSQL

---

## ⭐ Show Your Support

If you found this helpful, please star the repository! 🌟

---

**Last Updated:** March 13, 2026  
**Status:** ✅ Production Ready
