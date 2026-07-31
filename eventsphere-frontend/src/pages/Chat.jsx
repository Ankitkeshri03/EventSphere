import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { connectSocket, sendSocketMessage, disconnectSocket } from '../services/socket';

function Chat() {
  const { userId } = useParams(); // the other person's ID, from the URL
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  // Load past history once, on page load
  useEffect(() => {
    api.get(`/chat/messages/${userId}`).then((res) => setMessages(res.data));
  }, [userId]);

  // Connect to the live socket once, on page load
  useEffect(() => {
    connectSocket(
      (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
      },
      (errMsg) => {
        setError(errMsg);
        setTimeout(() => setError(''), 4000);
      }
    );

    return () => disconnectSocket();
  }, []);

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendSocketMessage(userId, input);
    setInput('');
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto' }}>
      <h2>Chat</h2>

      <div style={{ border: '1px solid #ccc', height: 320, overflowY: 'auto', padding: 12 }}>
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 8 }}>
            <strong>{m.senderName}:</strong> {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1 }}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default Chat;
