import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { CalendarIcon, MapPinIcon } from '../components/icons';
import { eventGradient, eventInitial } from '../utils/eventTheme';

const statusTone = { PUBLISHED: 'success', DRAFT: 'neutral', CANCELLED: 'danger' };

function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/events')
      .then((res) => {
        setEvents(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load events');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">All events</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Browse upcoming events and register in a click.</p>
      </div>

      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading events...</p>}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}

      {!loading && !error && events.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">No events yet.</p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Link key={event.id} to={`/events/${event.id}`} className="group block">
            <Card className="h-full overflow-hidden p-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg">
              <div className={`relative flex h-28 items-center justify-center bg-linear-to-br ${eventGradient(event.id)}`}>
                <span className="text-4xl font-bold text-white/25">{eventInitial(event.title)}</span>
                {event.status && event.status !== 'PUBLISHED' && (
                  <Badge tone={statusTone[event.status] || 'neutral'} className="absolute right-3 top-3 bg-white/90 dark:bg-slate-900/90">
                    {event.status}
                  </Badge>
                )}
              </div>

              <div className="p-5">
                <h3 className="font-semibold text-slate-900 dark:text-white">{event.title}</h3>
                <div className="mt-2.5 flex flex-col gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4 shrink-0" />
                    {new Date(event.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPinIcon className="h-4 w-4 shrink-0" />
                      {event.location}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                  Organized by {event.organizerName}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default EventList;
