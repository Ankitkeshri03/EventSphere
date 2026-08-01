import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Badge from '../components/ui/Badge';
import { eventGradient } from '../utils/eventTheme';

function TicketQr({ qrCode }) {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    let objectUrl;
    api.get(`/tickets/${qrCode}/image`, { responseType: 'blob' })
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data);
        setImageUrl(objectUrl);
      });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [qrCode]);

  if (!imageUrl) {
    return <div className="h-28 w-28 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />;
  }
  return <img src={imageUrl} alt={`QR code ${qrCode}`} className="h-28 w-28 rounded-lg border border-slate-200 dark:border-slate-700" />;
}

const statusTone = {
  CONFIRMED: 'success',
  CANCELLED: 'danger',
};

function MyTickets() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/registrations/me')
      .then((res) => setRegistrations(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-400">Loading your tickets...</p>;
  if (registrations.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">You haven't registered for any events yet.</p>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">My tickets</h2>

      <div className="flex flex-col gap-5">
        {registrations.map((r) => (
          <div
            key={r.id}
            className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className={`w-2 shrink-0 bg-linear-to-b ${eventGradient(r.eventId)}`} />

            <Link to={`/events/${r.eventId}`} className="flex-1 p-5">
              <p className="text-xs font-medium tracking-wide text-slate-400 uppercase dark:text-slate-500">
                Admit One
              </p>
              <h3 className="mt-1 font-semibold text-slate-900 dark:text-white">{r.eventTitle}</h3>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Registered {new Date(r.registeredAt).toLocaleDateString()}
              </p>
              <Badge tone={statusTone[r.status] || 'neutral'} className="mt-3">
                {r.status}
              </Badge>
            </Link>

            {/* Perforation */}
            <div className="relative flex items-center">
              <div className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-slate-50 dark:bg-slate-950" />
              <div className="h-full border-l border-dashed border-slate-300 dark:border-slate-700" />
              <div className="absolute -bottom-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-slate-50 dark:bg-slate-950" />
            </div>

            <div className="flex shrink-0 items-center justify-center p-4">
              <TicketQr qrCode={r.qrCode} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyTickets;
