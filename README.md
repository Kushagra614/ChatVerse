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
✅ **SQL Injection Prevention** - Parameterized queries 
✅ **CORS** - Restricted cross-origin requests
✅ **Socket.IO Auth** - JWT verified on connection
✅ **Foreign Keys** - Referential integrity in database

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

---

## 👤 Author

**Kushagra Vardhan**
- GitHub: [@Kushagra614](https://github.com/Kushagra614)
- ChatVerse: Full-stack real-time chat with React, Express, PostgreSQL

---

## ⭐ Show Your Support

If you found this helpful, please star the repository! 🌟

---

