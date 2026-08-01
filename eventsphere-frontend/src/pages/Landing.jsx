import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Logo from '../components/Logo';
import { CalendarIcon, TicketIcon, UsersIcon, ChatIcon } from '../components/icons';

const FEATURES = [
  { icon: CalendarIcon, title: 'Create & manage events', text: 'Spin up an event in minutes and track registrations as they come in.' },
  { icon: TicketIcon, title: 'QR ticketing', text: 'Every registration gets a scannable QR ticket for fast, contactless check-in.' },
  { icon: UsersIcon, title: 'Connect with attendees', text: 'Send connection requests and build your network at every event you attend.' },
  { icon: ChatIcon, title: 'Real-time chat', text: 'Message your connections instantly, right inside EventSphere.' },
];

function Landing() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('token')) navigate('/events');
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await api.post('/auth/login', loginForm);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      navigate('/events');
    } catch {
      setLoginError('Invalid email or password');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    setRegisterLoading(true);
    try {
      // Every self-registration is a participant — the backend enforces this
      // regardless of what's sent; organizer access comes only through an
      // approved organizer request (see ApplyOrganizer.jsx).
      await api.post('/auth/register', { ...registerForm, role: 'PARTICIPANT' });
      setRegisterSuccess('Account created — log in below to continue.');
      setLoginForm({ email: registerForm.email, password: '' });
      setTab('login');
    } catch (err) {
      setRegisterError(err.response?.data?.message || 'Registration failed. Try a different email.');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="relative isolate grid grid-cols-1 gap-10 overflow-hidden rounded-3xl p-6 sm:p-10 lg:grid-cols-2 lg:items-center lg:p-14 bg-[url('/hero-stage.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-slate-950/90 via-slate-950/75 to-violet-950/80" />

      {/* Hero + about */}
      <div>
        <Logo variant="light" className="mb-6" />
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Events, tickets, and networking — all in one place.
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          EventSphere helps you discover events, register for a QR ticket in seconds,
          connect with the people you meet there, and keep the conversation going with real-time chat.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-violet-300 backdrop-blur-sm">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-white">{title}</p>
                <p className="mt-0.5 text-sm text-slate-300">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auth card */}
      <Card className="p-6 shadow-xl sm:p-8">
        <div className="mb-6 flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === 'login'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === 'register'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Sign up
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {registerSuccess && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                {registerSuccess}
              </p>
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              required
            />
            {loginError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                {loginError}
              </p>
            )}
            <Button type="submit" disabled={loginLoading} className="mt-2 w-full">
              {loginLoading ? 'Logging in...' : 'Log in'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <Input
              label="Full name"
              placeholder="Jane Doe"
              value={registerForm.name}
              onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={registerForm.password}
              onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
              required
            />

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Everyone starts as a participant. You can apply for organizer access anytime after signing in.
            </p>

            {registerError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                {registerError}
              </p>
            )}

            <Button type="submit" disabled={registerLoading} className="mt-2 w-full">
              {registerLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

export default Landing;
