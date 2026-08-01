import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { CalendarIcon, MapPinIcon, UsersIcon } from '../components/icons';
import { eventGradient, eventInitial } from '../utils/eventTheme';

const statusTone = { PUBLISHED: 'success', DRAFT: 'neutral', CANCELLED: 'danger' };

function initials(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [status, setStatus] = useState('');
  const [statusOk, setStatusOk] = useState(true);
  const [loading, setLoading] = useState(true);
  const [registeredCount, setRegisteredCount] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [me, setMe] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [connections, setConnections] = useState([]);
  const [connectingId, setConnectingId] = useState(null);
  const [attendeeErrors, setAttendeeErrors] = useState({});

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const canBrowseAttendees = token && (role === 'PARTICIPANT' || role === 'ORGANIZER' || role === 'ADMIN');
  const canConnect = role === 'PARTICIPANT' || role === 'ORGANIZER';

  useEffect(() => {
    api.get(`/events/${id}`)
      .then((res) => setEvent(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  // Organizers can see how many people have registered (reuses the existing,
  // ownership-checked dashboard endpoint — participants have no access to this).
  useEffect(() => {
    if (role !== 'ORGANIZER') return;
    api.get(`/events/${id}/dashboard`)
      .then((res) => setRegisteredCount(res.data.totalRegistrations))
      .catch(() => {});
  }, [id, role]);

  useEffect(() => {
    if (token) api.get('/users/me').then((res) => setMe(res.data));
  }, [token]);

  const loadAttendeesAndConnections = () => {
    Promise.all([
      api.get(`/events/${id}/attendees`),
      canConnect ? api.get('/connections/me') : Promise.resolve({ data: [] }),
    ]).then(([attendeesRes, connectionsRes]) => {
      setAttendees(attendeesRes.data);
      setConnections(connectionsRes.data);
    });
  };

  useEffect(() => {
    if (canBrowseAttendees) loadAttendeesAndConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, canBrowseAttendees]);

  const handleRegister = async () => {
    setStatus('');
    try {
      await api.post(`/events/${id}/register`);
      setStatusOk(true);
      setStatus('Registered! Check "My Tickets" for your QR code.');
    } catch (err) {
      setStatusOk(false);
      setStatus(err.response?.data?.message || 'Registration failed.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/events/${id}`);
      navigate('/events');
    } catch (err) {
      setDeleting(false);
      setStatusOk(false);
      setStatus(err.response?.data?.message || 'Failed to delete event.');
    }
  };

  const handleConnect = async (userId) => {
    setConnectingId(userId);
    setAttendeeErrors((prev) => ({ ...prev, [userId]: '' }));
    try {
      await api.post(`/connections/request/${userId}`);
      loadAttendeesAndConnections();
    } catch (err) {
      setAttendeeErrors((prev) => ({
        ...prev,
        [userId]: err.response?.data?.message || 'Could not send request.',
      }));
    } finally {
      setConnectingId(null);
    }
  };

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-400">Loading event...</p>;
  if (!event) return <p className="text-sm text-slate-500 dark:text-slate-400">Event not found.</p>;

  const isOwner = me && event.organizerId === me.id;

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="overflow-hidden p-0">
        <div className={`relative flex h-48 items-center justify-center bg-linear-to-br sm:h-64 ${eventGradient(event.id)}`}>
          <span className="text-7xl font-bold text-white/25">{eventInitial(event.title)}</span>
          {event.status && (
            <Badge tone={statusTone[event.status] || 'neutral'} className="absolute right-4 top-4 bg-white/90 dark:bg-slate-900/90">
              {event.status}
            </Badge>
          )}
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">{event.title}</h1>
            {isOwner && (
              <div className="flex shrink-0 gap-2">
                <Link to={`/events/${id}/edit`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
                <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2.5 text-sm text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-2">
              <CalendarIcon className="h-4.5 w-4.5 shrink-0 text-violet-500" />
              {new Date(event.date).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
            </span>
            {event.location && (
              <span className="flex items-center gap-2">
                <MapPinIcon className="h-4.5 w-4.5 shrink-0 text-violet-500" />
                {event.location}
              </span>
            )}
            {event.capacity != null && (
              <span className="flex items-center gap-2">
                <UsersIcon className="h-4.5 w-4.5 shrink-0 text-violet-500" />
                {registeredCount != null
                  ? `${registeredCount} / ${event.capacity} registered`
                  : `Capacity: ${event.capacity}`}
              </span>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3 border-y border-slate-100 py-4 dark:border-slate-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              {initials(event.organizerName)}
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Organized by</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{event.organizerName}</p>
            </div>
          </div>

          {event.description && (
            <p className="mt-5 text-sm leading-relaxed whitespace-pre-line text-slate-600 dark:text-slate-300">
              {event.description}
            </p>
          )}

          {!token && (
            <Link to="/">
              <Button className="mt-6">Log in to register</Button>
            </Link>
          )}
          {token && role === 'PARTICIPANT' && (
            <Button onClick={handleRegister} className="mt-6">
              Register for this event
            </Button>
          )}
          {token && role !== 'PARTICIPANT' && (
            <p className="mt-6 text-sm text-slate-400 dark:text-slate-500">
              Only participants can register for events.
            </p>
          )}

          {status && (
            <p
              className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                statusOk
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
              }`}
            >
              {status}
            </p>
          )}
        </div>
      </Card>

      {canBrowseAttendees && (attendees.length > 0 || role === 'ADMIN') && (
        <Card className="mt-6 p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {canConnect ? "Who's going" : 'Participants'}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {canConnect
              ? 'Connect with other people registered for this event.'
              : `Everyone registered for this event${attendees.length ? ` (${attendees.length})` : ''}.`}
          </p>

          {attendees.length === 0 && (
            <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">No one has registered yet.</p>
          )}

          <div className="mt-4 flex flex-col gap-3">
            {attendees
              .filter((a) => a.userId !== me?.id)
              .map((a) => {
                const conn = connections.find(
                  (c) => c.senderId === a.userId || c.receiverId === a.userId
                );

                return (
                  <div key={a.userId} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                      {initials(a.userName)}
                    </div>
                    <p className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">{a.userName}</p>

                    {canConnect && conn?.status === 'ACCEPTED' && (
                      <Link to={`/chat/${a.userId}`} state={{ name: a.userName }}>
                        <Button size="sm" variant="outline">Chat</Button>
                      </Link>
                    )}
                    {canConnect && conn?.status === 'PENDING' && <Badge tone="warning">Pending</Badge>}
                    {canConnect && conn?.status === 'REJECTED' && <Badge tone="neutral">Not connected</Badge>}
                    {canConnect && !conn && (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(a.userId)}
                        disabled={connectingId === a.userId}
                      >
                        {connectingId === a.userId ? 'Sending...' : 'Connect'}
                      </Button>
                    )}
                    {attendeeErrors[a.userId] && (
                      <p className="text-xs text-red-500">{attendeeErrors[a.userId]}</p>
                    )}
                  </div>
                );
              })}
          </div>
        </Card>
      )}
    </div>
  );
}

export default EventDetail;
