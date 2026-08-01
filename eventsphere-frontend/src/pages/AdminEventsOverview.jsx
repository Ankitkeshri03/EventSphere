import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { CalendarIcon, UsersIcon } from '../components/icons';
import { eventGradient, eventInitial } from '../utils/eventTheme';

const statusTone = { PUBLISHED: 'success', DRAFT: 'neutral', CANCELLED: 'danger' };

function AdminEventsOverview() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events/overview')
      .then((res) => setEvents(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-400">Loading events...</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">All events</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Every event on EventSphere, across every organizer.
        </p>
      </div>

      {events.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">No events yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {events.map((e) => (
          <Link key={e.id} to={`/events/${e.id}`} className="block">
            <Card className="flex items-center gap-4 p-4 transition-shadow hover:shadow-md">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-sm font-bold text-white/80 ${eventGradient(e.id)}`}>
                {eventInitial(e.title)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-slate-900 dark:text-white">{e.title}</p>
                  <Badge tone={statusTone[e.status] || 'neutral'}>{e.status}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  Organized by {e.organizerName}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {new Date(e.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <UsersIcon className="h-3.5 w-3.5" />
                    {e.registrationCount}{e.capacity != null ? ` / ${e.capacity}` : ''} registered
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default AdminEventsOverview;
