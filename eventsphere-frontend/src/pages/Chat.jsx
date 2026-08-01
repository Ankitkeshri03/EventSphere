import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { connectSocket, sendSocketMessage, disconnectSocket } from '../services/socket';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

function formatTime(value) {
  return new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function Chat() {
  const { userId } = useParams(); // the other person's ID, from the URL
  const location = useLocation();
  const [myId, setMyId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const otherName =
    location.state?.name || messages.find((m) => m.senderId !== myId)?.senderName || 'Chat';

  // Who am I, so we know which side to render each bubble on
  useEffect(() => {
    api.get('/users/me').then((res) => setMyId(res.data.id));
  }, []);

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
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-2">
        <Link to="/connections" className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          Connections
        </Link>
        <span className="text-slate-300 dark:text-slate-700">/</span>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{otherName}</h2>
      </div>

      <Card className="flex flex-col overflow-hidden">
        <div className="flex h-96 flex-col gap-2 overflow-y-auto p-4">
          {messages.map((m) => {
            const isMine = m.senderId === myId;
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    isMine
                      ? 'rounded-br-sm bg-violet-600 text-white'
                      : 'rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                  }`}
                >
                  {m.content}
                  <p className={`mt-1 text-[10px] ${isMine ? 'text-violet-200' : 'text-slate-400 dark:text-slate-500'}`}>
                    {formatTime(m.sentAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {error && (
          <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-950 dark:bg-red-950 dark:text-red-400">
            {error}
          </p>
        )}

        <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit">Send</Button>
        </form>
      </Card>
    </div>
  );
}

export default Chat;
