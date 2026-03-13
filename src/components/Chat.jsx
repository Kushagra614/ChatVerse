import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { auth } from "../firebase-config";
import '../styles/Chat.css';

export const Chat = ({ room }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [token, setToken] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    // Sync user with backend and get JWT token
    const syncUser = async () => {
      if (!currentUser) return;
      
      try {
        const response = await fetch('http://localhost:4000/api/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseUid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
          }),
        });
        const data = await response.json();
        setToken(data.token);
      } catch (err) {
        console.error('Failed to sync user:', err);
      }
    };

    syncUser();
  }, [currentUser]);

  useEffect(() => {
    if (!token) return;

    // Connect to Socket.IO server with JWT token
    socketRef.current = io('http://localhost:4000', {
      reconnection: true,
      auth: { token },
    });

    // Join room with Firebase user info
    if (currentUser) {
      socketRef.current.emit('joinRoom', {
        room,
        firebaseUid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
      });
    }

    // Fetch existing messages with JWT token
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/messages/${room}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const msgs = await response.json();
        setMessages(msgs);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };
    fetchMessages();

    // Listen for new messages
    socketRef.current.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on('userJoined', (data) => {
      console.log(`${data.displayName} joined ${data.room}`);
    });

    socketRef.current.on('userLeft', (data) => {
      console.log(`${data.displayName} left the room`);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [room, currentUser, token]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (newMessage.trim() === "") return;
    
    // Send message via Socket.IO
    socketRef.current.emit('sendMessage', {
      text: newMessage,
      room,
    });

    setNewMessage("");
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="chat-app">
      <div className="header">
        <h1>Room: {room}</h1>
      </div>
      <div className="messages">
        {messages.length === 0 ? (
          <div className="no-messages">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.display_name === currentUser?.displayName ? 'sent' : 'received'}`}
            >
              <div className="message-header">
                <span className="user">{message.display_name}</span>
              </div>
              <div className="message-content">
                {message.text}
                <span className="message-time">{formatTime(message.created_at)}</span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="new-message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(event) => setNewMessage(event.target.value)}
          className="new-message-input"
          placeholder="Type your message here..."
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={!newMessage.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};
