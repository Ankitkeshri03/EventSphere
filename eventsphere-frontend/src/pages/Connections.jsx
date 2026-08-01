import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

function initials(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?';
}

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

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-400">Loading connections...</p>;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Connections</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          People you've connected with at events, and requests awaiting your response.
        </p>
      </div>

      {connections.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">You have no connections yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {connections.map((c) => {
          const isSender = c.senderId === myId;
          const otherId = isSender ? c.receiverId : c.senderId;
          const otherName = isSender ? c.receiverName : c.senderName;

          return (
            <Card key={c.id} className="flex items-center gap-4 p-4 transition-shadow hover:shadow-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                {initials(otherName)}
              </div>

              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-white">{otherName}</p>

                {c.status === 'PENDING' && isSender && (
                  <Badge tone="warning" className="mt-1">Request pending</Badge>
                )}
                {c.status === 'REJECTED' && (
                  <Badge tone="danger" className="mt-1">Rejected</Badge>
                )}
              </div>

              {c.status === 'ACCEPTED' && (
                <Link to={`/chat/${otherId}`} state={{ name: otherName }}>
                  <Button size="sm">Chat</Button>
                </Link>
              )}

              {c.status === 'PENDING' && !isSender && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => respond(c.id, 'accept')}>Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => respond(c.id, 'reject')}>Reject</Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default Connections;
