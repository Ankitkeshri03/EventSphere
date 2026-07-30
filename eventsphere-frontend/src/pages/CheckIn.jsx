import { useState } from 'react';
import api from '../services/api';

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
    <div style={{ maxWidth: 480, margin: '40px auto' }}>
      <h2>Check in a ticket</h2>
      <form onSubmit={handleSubmit}>
        <input
          value={qrCode}
          onChange={(e) => setQrCode(e.target.value)}
          placeholder="Scan or paste ticket code"
          required
          autoFocus
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Checking in...' : 'Check in'}
        </button>
      </form>

      {result && (
        <div style={{ border: '1px solid green', padding: 12, marginTop: 16 }}>
          <p><strong>{result.participantName}</strong> checked in</p>
          <p>{result.eventTitle}</p>
          <p>{new Date(result.checkInTime).toLocaleTimeString()}</p>
        </div>
      )}

      {error && (
        <div style={{ border: '1px solid red', padding: 12, marginTop: 16, color: 'red' }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default CheckIn;
