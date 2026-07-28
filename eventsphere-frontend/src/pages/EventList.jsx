import { useState, useEffect } from 'react';
import api from '../services/api';

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

  if (loading) return <p>Loading events...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>All events</h2>
      {events.length === 0 && <p>No events yet.</p>}
      {events.map((event) => (
        <div key={event.id} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 8 }}>
          <h3>{event.title}</h3>
          <p>{event.location} — {new Date(event.date).toLocaleString()}</p>
          <p>Organized by {event.organizerName}</p>
        </div>
      ))}
    </div>
  );
}

export default EventList;
