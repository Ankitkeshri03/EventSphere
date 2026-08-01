import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { BriefcaseIcon } from '../components/icons';

function ApplyOrganizer() {
  const [reason, setReason] = useState('');
  const [latestRequest, setLatestRequest] = useState(undefined); // undefined = loading, null = none yet
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/organizer-requests/me')
      .then((res) => setLatestRequest(res.data[0] || null))
      .catch(() => setLatestRequest(null));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/organizer-requests', { reason });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit request.');
    } finally {
      setLoading(false);
    }
  };

  if (latestRequest === undefined) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>;
  }

  const isPending = !submitted && latestRequest?.status === 'PENDING';

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
          <BriefcaseIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Become an organizer</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create and manage your own events.</p>
        </div>
      </div>

      {(submitted || isPending) && (
        <Card className="p-6">
          <Badge tone="warning">Pending review</Badge>
          <h3 className="mt-3 font-medium text-slate-900 dark:text-white">Request submitted</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            An admin will review your request. You'll be able to create events once approved.
          </p>
        </Card>
      )}

      {!submitted && !isPending && (
        <Card className="p-6 sm:p-8">
          {latestRequest?.status === 'REJECTED' && (
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              Your previous request wasn't approved. You're welcome to apply again.
            </p>
          )}

          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Tell us a bit about what you'd like to organize. An admin will review your request.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Textarea
              label="Why do you want to organize events?"
              rows={5}
              placeholder="e.g. I want to run a monthly React meetup for my local dev community..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Submitting...' : 'Submit request'}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}

export default ApplyOrganizer;
