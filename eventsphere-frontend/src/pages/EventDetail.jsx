import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then((res) => setEvent(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRegister = async () => {
    setStatus('');
    try {
      await api.post(`/events/${id}/register`);
      setStatus('Registered! Check "My Tickets" for your QR code.');
    } catch (err) {
      setStatus(err.response?.data?.message || 'Registration failed.');
    }
  };

  if (loading) return <p>Loading event...</p>;
  if (!event) return <p>Event not found.</p>;

  return (
    <div style={{ maxWidth: 480, margin: '40px auto' }}>
      <h2>{event.title}</h2>
      <p>{event.description}</p>
      <p>{event.location} — {new Date(event.date).toLocaleString()}</p>
      <p>Organized by {event.organizerName}</p>

      <button onClick={handleRegister}>Register for this event</button>
      {status && <p>{status}</p>}
    </div>
  );
}

export default EventDetail;
