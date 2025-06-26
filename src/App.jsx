import React from 'react';
import { Chat } from './components/Chat.jsx';
import { Auth } from './components/Auth.jsx';
import Cookies from 'universal-cookie';
import './styles/app.css';

const cookies = new Cookies();

function ChatApp() {
  const [isAuth, setIsAuth] = React.useState(cookies.get('auth-token'));
  const [room, setRoom] = React.useState(null);
  const [roomInput, setRoomInput] = React.useState('');

  const handleJoinRoom = () => {
    if (roomInput.trim()) {
      setRoom(roomInput);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoinRoom();
    }
  };

  const handleBack = () => {
    setRoom(null);
    setRoomInput('');
  };

  const handleSignOut = () => {
    cookies.remove('auth-token');
    setIsAuth(null);
  };

  if (!isAuth) {
    return (
      <div className="app-container">
        <header className="app-header">
          <a href="/" className="app-title">
            <h1 className="app-logo">ChatVerse</h1>
            <span className="app-subtitle">Connect & Chat</span>
          </a>
        </header>
        <Auth setIsAuth={setIsAuth} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          {room && (
            <button className="back-button" onClick={handleBack}>
              <span>Back</span>
            </button>
          )}
          <a href="/" className="app-title">
            <h1 className="app-logo">ChatVerse</h1>
            <span className="app-subtitle">Connect & Chat</span>
          </a>
        </div>
        <div className="header-right">
          {room && (
            <div className="current-room">
              Room: <span className="room-name">{room}</span>
            </div>
          )}
          <button className="sign-out-button" onClick={handleSignOut}>
            <span>Sign Out</span>
          </button>
        </div>
      </header>
      {room ? (
        <Chat room={room} />
      ) : (
        <div className="room-center-wrapper">
          <div className="room">
            <h2>Welcome to ChatVerse! 🚀</h2>
            <p>Enter a room name to start chatting with others</p>
            <label htmlFor="room">Room Name</label>
            <input
              id="room"
              type="text"
              placeholder="Enter room name..."
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button 
              onClick={handleJoinRoom}
              disabled={!roomInput.trim()}
            >
              <span>Join Room</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatApp;
