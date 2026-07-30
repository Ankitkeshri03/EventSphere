import { useState, useEffect } from 'react';
import api from '../services/api';

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

  if (!imageUrl) return <p>Loading QR code...</p>;
  return <img src={imageUrl} alt={`QR code ${qrCode}`} width={200} />;
}

function MyTickets() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/registrations/me')
      .then((res) => setRegistrations(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading your tickets...</p>;
  if (registrations.length === 0) return <p>You haven't registered for any events yet.</p>;

  return (
    <div style={{ maxWidth: 480, margin: '40px auto' }}>
      <h2>My tickets</h2>
      {registrations.map((r) => (
        <div key={r.id} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 16 }}>
          <h3>{r.eventTitle}</h3>
          <p>Status: {r.status}</p>
          <TicketQr qrCode={r.qrCode} />
        </div>
      ))}
    </div>
  );
}

export default MyTickets;
