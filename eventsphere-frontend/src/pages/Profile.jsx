import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { TicketIcon, UsersIcon, CalendarIcon, BriefcaseIcon } from '../components/icons';

const roleTone = { ADMIN: 'info', ORGANIZER: 'success', PARTICIPANT: 'neutral' };

function initials(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function StatTile({ icon: Icon, label, value }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-violet-500">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
    </Card>
  );
}

function Profile() {
  const [me, setMe] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/users/me').then((res) => setMe(res.data));
  }, []);

  useEffect(() => {
    if (!me) return;

    if (me.role === 'PARTICIPANT') {
      Promise.all([api.get('/registrations/me'), api.get('/connections/me')]).then(
        ([registrations, connections]) => {
          setStats({
            tickets: registrations.data.length,
            connections: connections.data.filter((c) => c.status === 'ACCEPTED').length,
          });
        }
      );
    } else if (me.role === 'ORGANIZER') {
      Promise.all([api.get('/events/mine'), api.get('/connections/me')]).then(
        ([events, connections]) => {
          setStats({
            events: events.data.length,
            connections: connections.data.filter((c) => c.status === 'ACCEPTED').length,
          });
        }
      );
    } else if (me.role === 'ADMIN') {
      Promise.all([
        api.get('/organizer-requests'),
        api.get('/users/participants'),
        api.get('/users/organizers'),
      ]).then(([pending, participants, organizers]) => {
        setStats({
          pending: pending.data.length,
          participants: participants.data.length,
          organizers: organizers.data.length,
        });
      });
    }
  }, [me]);

  if (!me) return <p className="text-sm text-slate-500 dark:text-slate-400">Loading profile...</p>;

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Profile</h2>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
            {initials(me.name)}
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{me.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{me.email}</p>
            <Badge tone={roleTone[me.role] || 'neutral'} className="mt-1.5">{me.role}</Badge>
          </div>
        </div>

        <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
          Member since {new Date(me.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
        </p>
      </Card>

      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          {me.role === 'PARTICIPANT' && (
            <>
              <StatTile icon={TicketIcon} label="Tickets" value={stats.tickets} />
              <StatTile icon={UsersIcon} label="Connections" value={stats.connections} />
            </>
          )}
          {me.role === 'ORGANIZER' && (
            <>
              <StatTile icon={CalendarIcon} label="Events organized" value={stats.events} />
              <StatTile icon={UsersIcon} label="Connections" value={stats.connections} />
            </>
          )}
          {me.role === 'ADMIN' && (
            <>
              <StatTile icon={BriefcaseIcon} label="Pending requests" value={stats.pending} />
              <StatTile icon={UsersIcon} label="Participants" value={stats.participants} />
              <StatTile icon={BriefcaseIcon} label="Organizers" value={stats.organizers} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Profile;
