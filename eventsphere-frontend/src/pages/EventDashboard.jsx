import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/ui/Card';
import { UsersIcon, CheckCircleIcon } from '../components/icons';

function initials(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function EventDashboard() {
  const { id } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/events/${id}/dashboard`)
      .then((res) => setDashboard(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load dashboard.'));
  }, [id]);

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!dashboard) return <p className="text-sm text-slate-500 dark:text-slate-400">Loading dashboard...</p>;

  const notYetCheckedIn = dashboard.totalRegistrations - dashboard.totalCheckedIn;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link to={`/events/${id}`} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          ← {dashboard.eventTitle}
        </Link>
        <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">Check-in dashboard</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
            <UsersIcon className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wide">Registered</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{dashboard.totalRegistrations}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircleIcon className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wide">Checked in</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{dashboard.totalCheckedIn}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
            <p className="text-xs font-medium uppercase tracking-wide">Not checked in</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{Math.max(notYetCheckedIn, 0)}</p>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white">Checked in</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Everyone who has scanned in at this event.
        </p>

        {dashboard.checkedInNames.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">No one has checked in yet.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {dashboard.checkedInNames.map((name, i) => (
              <div key={`${name}-${i}`} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  {initials(name)}
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{name}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default EventDashboard;
