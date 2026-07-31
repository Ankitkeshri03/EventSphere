import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Connections() {
  const [myId, setMyId] = useState(null);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadConnections = () => {
    return api.get('/connections/me').then((res) => setConnections(res.data));
  };

  useEffect(() => {
    Promise.all([
      api.get('/users/me').then((res) => setMyId(res.data.id)),
      loadConnections(),
    ]).finally(() => setLoading(false));
  }, []);

  const respond = (id, action) => {
    api.post(`/connections/${id}/${action}`).then(loadConnections);
  };

  if (loading) return <p>Loading connections...</p>;
  if (connections.length === 0) return <p>You have no connections yet.</p>;

  return (
    <div style={{ maxWidth: 480, margin: '40px auto' }}>
      <h2>Connections</h2>
      {connections.map((c) => {
        const isSender = c.senderId === myId;
        const otherId = isSender ? c.receiverId : c.senderId;
        const otherName = isSender ? c.receiverName : c.senderName;

        return (
          <div key={c.id} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 12 }}>
            <strong>{otherName}</strong>

            {c.status === 'ACCEPTED' && (
              <div style={{ marginTop: 8 }}>
                <Link to={`/chat/${otherId}`}>
                  <button>Chat</button>
                </Link>
              </div>
            )}

            {c.status === 'PENDING' && isSender && (
              <p style={{ color: '#888', margin: '8px 0 0' }}>Request pending...</p>
            )}

            {c.status === 'PENDING' && !isSender && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button onClick={() => respond(c.id, 'accept')}>Accept</button>
                <button onClick={() => respond(c.id, 'reject')}>Reject</button>
              </div>
            )}

            {c.status === 'REJECTED' && (
              <p style={{ color: '#888', margin: '8px 0 0' }}>Rejected</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Connections;
