import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';

function initials(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function AdminOrganizers() {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users/organizers')
      .then((res) => setOrganizers(res.data))
      .catch(() => setError('Could not load organizers. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-400">Loading organizers...</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Organizers</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Everyone approved to create and manage events on EventSphere.
        </p>
      </div>

      {organizers.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">No organizers yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {organizers.map((o) => (
          <Card key={o.id} className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              {initials(o.name)}
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{o.name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{o.email}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default AdminOrganizers;
