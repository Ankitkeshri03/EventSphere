import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Card from '../components/ui/Card';

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
  const [generating, setGenerating] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGenerateDescription = async () => {
    if (!form.title) {
      alert('Enter a title or some keywords first');
      return;
    }
    setGenerating(true);
    try {
      const res = await api.post('/ai/generate-description', { keywords: form.title });
      setForm({ ...form, description: res.data.description });
    } catch (err) {
      console.error(err);
      alert('Could not generate description');
    } finally {
      setGenerating(false);
    }
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
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Create event</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Fill in the details below — you can always edit them later.
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Event title"
            name="title"
            type="text"
            placeholder="e.g. Product Design Meetup"
            value={form.title}
            onChange={handleChange}
            required
          />

          <div>
            <Textarea
              label="Description"
              name="description"
              rows={4}
              placeholder="What's this event about? Who should come?"
              value={form.description}
              onChange={handleChange}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleGenerateDescription}
              disabled={generating}
              className="mt-2 px-0!"
            >
              {generating ? 'Generating…' : '✨ Generate with AI'}
            </Button>
          </div>

          <Input
            label="Location"
            name="location"
            type="text"
            placeholder="Venue or address"
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
              placeholder="e.g. 100"
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
            {loading ? 'Creating...' : 'Create event'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default CreateEvent;
