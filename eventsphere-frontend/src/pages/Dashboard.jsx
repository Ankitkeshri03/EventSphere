import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const registrationStatusTone = {
  CONFIRMED: 'success',
  CANCELLED: 'danger',
};

function Dashboard() {
  const [myId, setMyId] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fired together, not sequentially - the three requests happen in
    // parallel instead of waiting for each other to finish.
    Promise.all([
      api.get('/users/me'),
      api.get('/registrations/me'),
      api.get('/connections/me'),
    ])
      .then(([userRes, regRes, connRes]) => {
        setMyId(userRes.data.id);
        setRegistrations(regRes.data);
        setConnections(connRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading your dashboard...</p>;
  }

  const acceptedConnections = connections.filter((c) => c.status === 'ACCEPTED');
  const upcomingCount = registrations.filter((r) => r.status === 'CONFIRMED').length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Your dashboard</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Everything you're registered for, in one place.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500">REGISTERED EVENTS</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{upcomingCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500">CONNECTIONS</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{acceptedConnections.length}</div>
        </Card>
      </div>

      <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Your events</h3>
      {registrations.length === 0 && (
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">You haven't registered for any events yet.</p>
      )}
      <div className="mb-8 flex flex-col gap-3">
        {registrations.map((r) => (
          <Card key={r.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{r.eventTitle}</p>
              <Badge tone={registrationStatusTone[r.status] || 'neutral'} className="mt-1">{r.status}</Badge>
            </div>
            <Link to="/my-tickets">
              <Button size="sm" variant="outline">View ticket</Button>
            </Link>
          </Card>
        ))}
      </div>

      <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Your connections</h3>
      {acceptedConnections.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No connections yet — connect with people at events you attend.
        </p>
      )}
      <div className="flex flex-col gap-3">
        {acceptedConnections.map((c) => {
          const isSender = c.senderId === myId;
          const otherId = isSender ? c.receiverId : c.senderId;
          const otherName = isSender ? c.receiverName : c.senderName;

          return (
            <Card key={c.id} className="flex items-center justify-between gap-4 p-4">
              <span className="font-medium text-slate-900 dark:text-white">{otherName}</span>
              <Link to={`/chat/${otherId}`} state={{ name: otherName }}>
                <Button size="sm">Chat</Button>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;
