import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebase-config";
import {
  collection,
  addDoc,
  where,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

import '../styles/Chat.css';

export const Chat = ({ room }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesRef = collection(db, "messages");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const queryMessages = query(
      messagesRef,
      where("room", "==", room)
    );
    
    const unsuscribe = onSnapshot(queryMessages, (snapshot) => {
      let messages = [];
      snapshot.forEach((doc) => {
        messages.push({ ...doc.data(), id: doc.id });
      });
      // Sort messages by timestamp after receiving them
      messages.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return a.createdAt.toDate() - b.createdAt.toDate();
        }
        return 0;
      });
      setMessages(messages);
    });

    return () => unsuscribe();
  }, [room]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (newMessage === "") return;
    await addDoc(messagesRef, {
      text: newMessage,
      createdAt: serverTimestamp(),
      user: auth.currentUser.displayName,
      room,
    });

    setNewMessage("");
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
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
              className={`message ${message.user === auth.currentUser?.displayName ? 'sent' : 'received'}`}
            >
              <div className="message-header">
                <span className="user">{message.user}</span>
              </div>
              <div className="message-content">
                {message.text}
                <span className="message-time">{formatTime(message.createdAt)}</span>
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
