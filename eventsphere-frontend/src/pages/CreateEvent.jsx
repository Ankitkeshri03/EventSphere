import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function CreateEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    capacity: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/events', {
        ...form,
        capacity: Number(form.capacity),
      });
      navigate('/events');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: '40px auto' }}>
      <h2>Create event</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="title"
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          required
        />
        <input
          name="description"
          type="text"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />
        <input
          name="location"
          type="text"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
        />
        <input
          name="date"
          type="datetime-local"
          value={form.date}
          onChange={handleChange}
          required
        />
        <input
          name="capacity"
          type="number"
          placeholder="Capacity"
          value={form.capacity}
          onChange={handleChange}
          min="1"
          required
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create event'}
        </button>
      </form>
    </div>
  );
}

export default CreateEvent;
