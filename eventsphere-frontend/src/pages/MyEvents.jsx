import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { CalendarIcon, MapPinIcon } from '../components/icons';
import { eventGradient, eventInitial } from '../utils/eventTheme';

const statusTone = { PUBLISHED: 'success', DRAFT: 'neutral', CANCELLED: 'danger' };

function MyEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const load = () => api.get('/events/mine').then((res) => setEvents(res.data));

  useEffect(() => {
    load()
      .catch(() => setError('Could not load your events. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    setDeleteError('');
    setDeletingId(id);
    try {
      await api.delete(`/events/${id}`);
      await load();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Could not delete this event.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-400">Loading your events...</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">My events</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Events you're organizing.</p>
        </div>
        <Button size="sm" onClick={() => navigate('/create-event')}>Create event</Button>
      </div>

      {deleteError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {deleteError}
        </p>
      )}

      {events.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">You haven't created any events yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {events.map((e) => (
          <Card key={e.id} className="flex items-center gap-4 p-4">
            <Link to={`/events/${e.id}`} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-sm font-bold text-white/80 ${eventGradient(e.id)}`}>
              {eventInitial(e.title)}
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link to={`/events/${e.id}`} className="truncate font-medium text-slate-900 hover:underline dark:text-white">
                  {e.title}
                </Link>
                <Badge tone={statusTone[e.status] || 'neutral'}>{e.status}</Badge>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {new Date(e.date).toLocaleDateString()}
                </span>
                {e.location && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="h-3.5 w-3.5" />
                    {e.location}
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <Link to={`/events/${e.id}/dashboard`}>
                <Button size="sm" variant="outline">Dashboard</Button>
              </Link>
              <Link to={`/events/${e.id}/edit`}>
                <Button size="sm" variant="outline">Edit</Button>
              </Link>
              <Button size="sm" variant="danger" onClick={() => handleDelete(e.id)} disabled={deletingId === e.id}>
                {deletingId === e.id ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default MyEvents;
