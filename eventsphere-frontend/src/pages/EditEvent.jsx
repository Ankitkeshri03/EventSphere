import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Card from '../components/ui/Card';

// LocalDateTime from the backend (e.g. "2026-08-15T18:00:00") needs trimming
// to "yyyy-MM-ddTHH:mm" for a native datetime-local input's value.
function toDateTimeLocal(value) {
  return value ? value.slice(0, 16) : '';
}

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then((res) => {
        const event = res.data;
        setForm({
          title: event.title || '',
          description: event.description || '',
          location: event.location || '',
          date: toDateTimeLocal(event.date),
          capacity: event.capacity ?? '',
        });
      })
      .catch((err) => setLoadError(err.response?.data?.message || 'Could not load this event.'));
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.put(`/events/${id}`, {
        ...form,
        capacity: Number(form.capacity),
      });
      navigate(`/events/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  if (loadError) return <p className="text-sm text-red-500">{loadError}</p>;
  if (!form) return <p className="text-sm text-slate-500 dark:text-slate-400">Loading event...</p>;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Edit event</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Update the details below.</p>
      </div>

      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Event title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            required
          />

          <Textarea
            label="Description"
            name="description"
            rows={4}
            value={form.description}
            onChange={handleChange}
          />

          <Input
            label="Location"
            name="location"
            type="text"
            value={form.location}
            onChange={handleChange}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Date & time"
              name="date"
              type="datetime-local"
              value={form.date}
              onChange={handleChange}
              required
            />
            <Input
              label="Capacity"
              name="capacity"
              type="number"
              value={form.capacity}
              onChange={handleChange}
              min="1"
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="mt-1 w-full" size="lg">
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default EditEvent;
