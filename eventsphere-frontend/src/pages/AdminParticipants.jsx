import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';

function initials(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function AdminParticipants() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users/participants')
      .then((res) => setParticipants(res.data))
      .catch(() => setError('Could not load participants. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-400">Loading participants...</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Participants</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Everyone registered on EventSphere as a participant.
        </p>
      </div>

      {participants.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">No participants yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {participants.map((p) => (
          <Card key={p.id} className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              {initials(p.name)}
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{p.email}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default AdminParticipants;
