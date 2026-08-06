import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

function initials(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function AdminOrganizerRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const load = () => api.get('/organizer-requests').then((res) => setRequests(res.data));

  useEffect(() => {
    load()
      .catch(() => setError('Could not load organizer requests. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const respond = (id, action) => {
    setActionError('');
    api.post(`/organizer-requests/${id}/${action}`)
      .then(load)
      .catch((err) => setActionError(err.response?.data?.message || 'Could not respond to this request.'));
  };

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-400">Loading requests...</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Organizer requests</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pending applications to become an organizer.</p>
      </div>

      {actionError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {actionError}
        </p>
      )}

      {requests.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">No pending requests.</p>
      )}

      <div className="flex flex-col gap-3">
        {requests.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                {initials(r.userName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 dark:text-white">{r.userName}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{r.userEmail}</p>
                <p className="mt-2 text-sm whitespace-pre-line text-slate-600 dark:text-slate-300">{r.reason}</p>
                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                  Applied {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => respond(r.id, 'approve')}>Approve</Button>
              <Button size="sm" variant="outline" onClick={() => respond(r.id, 'reject')}>Reject</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default AdminOrganizerRequests;
