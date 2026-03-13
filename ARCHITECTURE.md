# ChatVerse - Full-Stack Architecture & Database Design

## 🏗️ System Architecture

ChatVerse is a **hybrid full-stack application** combining Firebase authentication with a custom Express backend and PostgreSQL database for persistent real-time messaging.

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                      │
│                      http://localhost:5173                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Google Sign-In (Firebase Auth)                        │   │
│  │ • Real-time Chat UI (Socket.IO client)                 │   │
│  │ • Message Display & Input                              │   │
│  │ • Room Selection                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────┬──────────────────────────────┬──────────────────┘
               │                              │
        ┌──────▼───────────┐        ┌────────▼─────────┐
        │  Firebase Auth   │        │  Express Server  │
        │  (Google OAuth)  │        │ + Socket.IO      │
        │                  │        │                  │
        │  • Login         │        │ :4000            │
        │  • User Profile  │        │                  │
        └──────────────────┘        └────────┬─────────┘
                                             │
                                    ┌────────▼──────────┐
                                    │  PostgreSQL DB    │
                                    │                   │
                                    │ • users table     │
                                    │ • messages table  │
                                    │                   │
                                    └───────────────────┘
```

---

## 🗄️ Database Schema

### **Users Table**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(255) UNIQUE NOT NULL,  -- Firebase user ID from Google sign-in
  email VARCHAR(255) UNIQUE NOT NULL,         -- User's email from Firebase
  display_name VARCHAR(100),                   -- User's display name
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**What gets stored:**
- `firebase_uid` — Unique Firebase UID (from Google OAuth)
- `email` — Email extracted from Firebase Auth
- `display_name` — User's display name from Firebase profile
- `created_at` — When user first joined the app

**Example data:**
```
id | firebase_uid         | email              | display_name | created_at
1  | AbC123XyZ789...      | user1@gmail.com    | John Doe     | 2026-03-13 14:30:00
2  | DeF456UvW012...      | user2@gmail.com    | Jane Smith   | 2026-03-13 14:35:00
```

---

### **Messages Table**
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  room VARCHAR(100) NOT NULL,                 -- Chat room name (e.g., "general", "random")
  user_id INTEGER NOT NULL REFERENCES users(id),  -- Foreign key to users table
  text TEXT NOT NULL,                         -- Message content
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**What gets stored:**
- `room` — The chat room the message was sent to
- `user_id` — Reference to the user who sent it (links to users.id)
- `text` — The actual message content
- `created_at` — When the message was created

**Example data:**
```
id | room     | user_id | text                    | created_at
1  | general  | 1       | "Hello everyone!"       | 2026-03-13 14:32:00
2  | general  | 2       | "Hi John!"              | 2026-03-13 14:32:30
3  | random   | 1       | "Anyone here?"          | 2026-03-13 14:33:00
4  | general  | 2       | "How are you?"          | 2026-03-13 14:33:45
```

**Foreign Key Constraint:**
- `messages.user_id` → `users.id`
- This ensures every message is linked to a valid user
- If a user were deleted, their messages would be protected

---

## 🔄 Complete Data Flow: 5 Core Flows

### **FLOW 1: User Authentication with Google OAuth**

```
┌──────────────────────────────────────────────────────────────┐
│ FRONTEND (React) - Auth.jsx                                  │
└──────────────────────────────────────────────────────────────┘

Step 1: User clicks "Sign in with Google" button
   ↓
Step 2: Firebase OAuth popup opens (Google login)
   ↓
Step 3: User enters Gmail credentials
   ↓
Step 4: Google verifies & returns Auth Token
   ↓
Step 5: Firebase SDK extracts user data:
   ├─ uid: "google-oauth-abc123xyz789"
   ├─ email: "user@gmail.com"
   ├─ displayName: "John Doe"
   └─ photoURL: "https://..."
   ↓
Step 6: React receives user object → auth.currentUser set
   ├─ User data available in frontend
   └─ User can navigate to Chat.jsx
   ↓
✓ User authenticated in Firebase (not in DB yet)

Time: ~500-1000ms | Storage: Firebase Auth
```

---

### **FLOW 2: User Syncs to PostgreSQL + Gets JWT Token**

```
Frontend: POST /api/sync-user with (firebaseUid, email, displayName)
   ↓
Backend: Calls getOrCreateUser()
   ↓
Database: SELECT * FROM users WHERE firebase_uid = $1
   ├─ If EXISTS: Returns user row
   └─ If NOT EXISTS: 
      └─ INSERT new user → auto-generates id & created_at
   ↓
Backend: Generates JWT token (7-day expiry)
   Token payload: { userId, firebaseUid, email }
   ↓
Backend: Returns HTTP 200 with:
   { user: {...}, token: "eyJhbGci..." }
   ↓
Frontend: Stores token in React state → Ready for API calls

✓ User synced to database | ✓ JWT token obtained

Time: ~100-200ms | DB Change: 1 new row in users table
```

---

### **FLOW 3: User Joins Chat Room via Socket.IO**

```
Frontend: socket.io('http://localhost:4000', { auth: { token } })
   ├─ Establishes WebSocket connection with JWT
   └─ Backend validates JWT → Connection accepted

Frontend: socket.emit('joinRoom', {
  room: 'general',
  firebaseUid, email, displayName
})
   ↓
Backend: Receives joinRoom event
   ├─ Calls getOrCreateUser() (idempotent)
   ├─ socket.join("general")
   ├─ Stores user in socket.data
   └─ io.to("general").emit('userJoined', {...})
   ↓
Frontend: Receives 'userJoined' event
   ├─ Logs: "User joined room"
   └─ Ready to send/receive messages

✓ Socket.IO room joined | ✓ Real-time messaging enabled

Time: ~50-100ms | Database Change: NONE (user already exists)
```

---

### **FLOW 4: User Sends Message (Socket.IO → Database → Broadcast)**

```
Frontend: User types message → socket.emit('sendMessage', {
  text: 'Hello everyone!',
  room: 'general'
})
   ↓
Backend: socket.on('sendMessage', async (data) => {
   ├─ Gets: text, room
   ├─ Gets user_id from socket.data.user.id
   └─ Validates all data
   ↓
   Backend: INSERT INTO messages (room, user_id, text)
   VALUES ('general', 42, 'Hello everyone!')
   RETURNING *
   ↓
Database: 
   ├─ Validates foreign key (user_id 42 exists)
   ├─ Generates id: 1001
   ├─ Auto-sets created_at: "2026-03-13T14:35:22.000Z"
   └─ Returns: { id, room, user_id, text, created_at }
   ↓
Backend:
   ├─ JOINs with users table to get display_name
   ├─ Broadcasts to room:
   │  io.to("general").emit('newMessage', {
   │    id: 1001,
   │    text, room, user_id,
   │    created_at, display_name: "John Doe"
   │  })
   └─ All clients in room receive message immediately
   ↓
Frontend: socket.on('newMessage', (msg) => {
   ├─ Updates state: setMessages([...prev, msg])
   ├─ React re-renders
   └─ Message appears in UI instantly
   
✓ Message persisted in database
✓ Broadcasted to all room users in real-time
✓ Survives app restart (in PostgreSQL)

Time: ~20-50ms | DB Change: 1 new row in messages table
```

---

### **FLOW 5: User Loads Message History (GET Request with JWT)**

```
Frontend: fetch('http://localhost:4000/api/messages/general', {
  headers: { 'Authorization': 'Bearer eyJhbGci...' }
})
   ↓
Backend: GET /api/messages/general (protected route)
   ├─ JWT middleware checks Authorization header
   ├─ Verifies token signature with JWT_SECRET
   └─ If valid: proceeds; If invalid: 403 error
   ↓
Backend: Builds parameterized query:
   SELECT m.*, u.display_name
   FROM messages m
   JOIN users u ON m.user_id = u.id
   WHERE m.room = $1
   ORDER BY m.created_at ASC
   
   Parameter: $1 = "general"
   ↓
Database: Executes SELECT with JOIN
   ├─ Scans messages table (filters by room)
   ├─ For each message, JOINs with users table
   ├─ Extracts user display_name for each message
   └─ Returns array of complete message objects
   ↓
Backend: Sends HTTP 200 response:
   [
     { id, room, user_id, text, created_at, display_name: "John Doe" },
     { id, room, user_id, text, created_at, display_name: "Jane Smith" },
     ...
   ]
   ↓
Frontend:
   ├─ Parses JSON response
   ├─ Updates state: setMessages(msgs)
   ├─ React renders all messages with display names
   └─ Chat history fully loaded

✓ Full message history loaded from database
✓ Sorted chronologically (oldest → newest)
✓ User display names visible (from JOIN)

Time: ~50-150ms | Query: SELECT with JOIN | Rows: All in room
```

---

## 📋 Simple Data Flow Summary

### **1. User Authentication (Firebase)**
```
User clicks "Sign in with Google"
    ↓
Firebase handles OAuth with Google
    ↓
Frontend receives: { uid, email, displayName, photoURL }
    ↓
User authenticated ✓
```

### **2. User Joins Room (Socket.IO)**
```
User selects a chat room on frontend
    ↓
Frontend emits: socket.emit('joinRoom', {
  room: 'general',
  firebaseUid: user.uid,
  email: user.email,
  displayName: user.displayName
})
    ↓
Backend receives joinRoom event
    ↓
Backend calls: getOrCreateUser(firebaseUid, email, displayName)
    ↓
INSERT or SELECT user from PostgreSQL users table
    ↓
Backend stores user in socket.data (in-memory)
    ↓
socket.join(room)  // Add socket to Socket.IO room
    ↓
io.to(room).emit('userJoined', { displayName, room })
    ↓
All users in room notified user joined ✓
```

### **3. User Sends Message (Socket.IO + PostgreSQL)**
```
User types message and clicks Send
    ↓
Frontend emits: socket.emit('sendMessage', {
  text: 'Hello everyone!',
  room: 'general'
})
    ↓
Backend receives sendMessage event
    ↓
Backend INSERT message to PostgreSQL:
  INSERT INTO messages (room, user_id, text)
  VALUES ('general', 1, 'Hello everyone!')
  RETURNING *
    ↓
Message stored in database with id, created_at
    ↓
Backend broadcasts to all users in room:
  io.to(room).emit('newMessage', {
    id: 42,
    room: 'general',
    user_id: 1,
    text: 'Hello everyone!',
    display_name: 'John Doe',
    created_at: '2026-03-13T14:32:00Z'
  })
    ↓
All clients in room receive message in real-time ✓
Message persisted in database ✓
```

### **4. User Loads Room (Fetch History)**
```
User opens chat or switches room
    ↓
Frontend fetches: GET /api/messages/general
    ↓
Backend queries PostgreSQL:
  SELECT m.*, u.display_name 
  FROM messages m 
  JOIN users u ON m.user_id = u.id 
  WHERE m.room = 'general' 
  ORDER BY m.created_at ASC
    ↓
Database returns all messages with user display names
    ↓
Frontend receives message history and displays
    ↓
User sees entire conversation history ✓
```

---

## 🛠️ Backend Components

### **server/index.js** (Express + Socket.IO)

**Key Functions:**

1. **getOrCreateUser(firebaseUid, email, displayName)**
   - Checks if user exists in PostgreSQL using firebase_uid
   - If exists: returns existing user
   - If not: creates new user and returns it
   - Links Firebase identity to PostgreSQL database

2. **Socket Events:**
   - `joinRoom` — User joins a chat room
   - `sendMessage` — User sends a message (INSERT to DB, broadcast to room)
   - `disconnect` — User disconnects (logs out)

3. **REST Endpoints:**
   - `POST /api/sync-user` — Manually sync Firebase user to DB
   - `GET /api/messages/:room` — Fetch message history with JOIN to get display names

**Why this matters for your resume:**
- ✅ RESTful API design with proper status codes
- ✅ WebSocket real-time messaging (Socket.IO)
- ✅ Database relationships (FOREIGN KEY)
- ✅ Async/await error handling
- ✅ Room-based event broadcasting

### **server/db.js** (PostgreSQL Connection Layer)

**Exports:**
- `run(sql, params)` — Execute any SQL query
- `get(sql, params)` — Get single row
- `all(sql, params)` — Get multiple rows
- `initDb()` — Create tables on startup
- `closeDb()` — Close pool on shutdown

**Why this matters:**
- ✅ Connection pooling (efficient database resource management)
- ✅ Parameterized queries (SQL injection protection)
- ✅ Separation of concerns (database logic isolated)

---

## 📊 What's Actually Stored in PostgreSQL

### **After a user logs in and sends a message:**

**users table:**
```
id=1, firebase_uid='google-oauth-12345', email='user@gmail.com', 
display_name='John Doe', created_at='2026-03-13 14:30:00'
```

**messages table:**
```
id=1, room='general', user_id=1, 
text='Hello everyone!', created_at='2026-03-13 14:32:00'
```

### **When frontend requests message history:**
```
GET /api/messages/general
↓
Backend query:
SELECT m.id, m.room, m.user_id, m.text, m.created_at, u.display_name
FROM messages m
JOIN users u ON m.user_id = u.id
WHERE m.room = 'general'
↓
Returns to frontend:
[
  {
    id: 1,
    room: 'general',
    user_id: 1,
    text: 'Hello everyone!',
    display_name: 'John Doe',
    created_at: '2026-03-13T14:32:00Z'
  }
]
```

---

## 🔐 Security & Integrity

1. **Firebase handles authentication** — No passwords stored in your DB
2. **Foreign Key constraints** — Messages can only reference existing users
3. **Parameterized queries** — SQL injection protection
4. **Email/Firebase UID unique constraints** — Prevents duplicate accounts
5. **Socket.IO connection** — Real-time without exposed credentials

---

## 📈 Why This Architecture is Production-Ready

### **For Your Resume:**
- ✅ **Full-stack** — React frontend, Express backend, PostgreSQL database
- ✅ **Real-time messaging** — Socket.IO WebSocket connections
- ✅ **Persistent storage** — Messages survive app restarts
- ✅ **Authentication** — Firebase OAuth integration
- ✅ **Database design** — Proper schema with relationships and constraints
- ✅ **API design** — RESTful endpoints with proper error handling
- ✅ **Connection pooling** — Efficient database resource management
- ✅ **Room-based routing** — Messages broadcast only to relevant users

### **What Interviewers Will See:**
1. You understand **database normalization** (separate users/messages tables)
2. You know **foreign keys & relationships** (user_id links to users table)
3. You can build **real-time systems** (Socket.IO)
4. You practice **secure coding** (parameterized queries, authentication)
5. You separate **concerns properly** (frontend/backend/database)

---

## 🚀 Testing the Full Flow

1. **Login with Google** — Creates entry in users table
2. **Join a room** — Socket.IO connects, getOrCreateUser called
3. **Send a message** — INSERT to messages table, broadcast via Socket.IO
4. **Refresh page** — GET /api/messages/:room fetches from PostgreSQL
5. **Message persists** — Data survives app restart

---

## 📝 Summary for Resume

> **ChatVerse - Real-Time Chat Application**
>
> Built full-stack chat application with React frontend, Express.js backend, and PostgreSQL database.
> Implemented Firebase OAuth for authentication and Socket.IO for real-time messaging. Messages are
> persisted in PostgreSQL with proper schema design using foreign key relationships. Backend provides
> RESTful API endpoints for message history and user management. Connection pooling and parameterized
> queries ensure efficient and secure database operations.
>
> **Tech Stack:** React 19, Express.js, Socket.IO, PostgreSQL, Firebase Auth, Vite
>
> **Key Features:**
> - Google OAuth authentication via Firebase
> - Real-time messaging using Socket.IO WebSockets
> - Persistent message storage in PostgreSQL
> - Room-based message routing and broadcasting
> - Proper database schema with foreign key constraints

---

**Status:** ✅ Backend fully functional, database operational, data persisting correctly
