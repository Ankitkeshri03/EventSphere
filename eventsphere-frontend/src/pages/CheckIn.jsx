import { useState } from 'react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { QrIcon, CheckCircleIcon, XCircleIcon } from '../components/icons';

function CheckIn() {
  const [qrCode, setQrCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const res = await api.post('/attendance/check-in', { qrCode });
      setResult(res.data);
      setQrCode('');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Check-in failed — invalid code or already checked in.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Check in a ticket</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Scan a guest's QR ticket, or paste the code below.
        </p>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
            <QrIcon className="h-8 w-8" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            placeholder="Scan or paste ticket code"
            required
            autoFocus
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Checking...' : 'Check in'}
          </Button>
        </form>
      </Card>

      {result && (
        <Card className="mt-4 flex items-start gap-3 border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
          <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="font-medium text-emerald-800 dark:text-emerald-300">
              {result.participantName} checked in
            </p>
            <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">{result.eventTitle}</p>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-500">
              {new Date(result.checkInTime).toLocaleTimeString()}
            </p>
          </div>
        </Card>
      )}

      {error && (
        <Card className="mt-4 flex items-start gap-3 border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <XCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </Card>
      )}
    </div>
  );
}

export default CheckIn;
