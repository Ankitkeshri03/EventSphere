import { NavLink, useNavigate } from 'react-router-dom';
import Button from './ui/Button';
import Logo from './Logo';
import NotificationBell from './NotificationBell';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
  }`;

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const isOrganizer = role === 'ORGANIZER';
  const isAdmin = role === 'ADMIN';
  const isParticipant = role === 'PARTICIPANT';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <NavLink to={token ? '/events' : '/'}>
          <Logo />
        </NavLink>

        <div className="flex flex-wrap items-center gap-1">
          <NavLink to="/events" className={linkClass}>Events</NavLink>
          {token && isOrganizer && <NavLink to="/my-events" className={linkClass}>My events</NavLink>}
          {token && isOrganizer && <NavLink to="/create-event" className={linkClass}>Create event</NavLink>}
          {token && isParticipant && <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>}
          {token && isParticipant && <NavLink to="/my-tickets" className={linkClass}>My tickets</NavLink>}
          {token && !isAdmin && <NavLink to="/connections" className={linkClass}>Connections</NavLink>}
          {token && isOrganizer && <NavLink to="/check-in" className={linkClass}>Check in</NavLink>}
          {token && isParticipant && <NavLink to="/apply-organizer" className={linkClass}>Become an organizer</NavLink>}
          {token && isAdmin && <NavLink to="/admin/organizer-requests" className={linkClass}>Organizer requests</NavLink>}
          {token && isAdmin && <NavLink to="/admin/participants" className={linkClass}>Participants</NavLink>}
          {token && isAdmin && <NavLink to="/admin/organizers" className={linkClass}>Organizers</NavLink>}
          {token && isAdmin && <NavLink to="/admin/events" className={linkClass}>All events</NavLink>}
          {token && <NavLink to="/profile" className={linkClass}>Profile</NavLink>}
        </div>

        {token ? (
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="outline" size="sm" onClick={handleLogout}>Log out</Button>
          </div>
        ) : (
          <NavLink to="/">
            <Button variant="primary" size="sm">Log in</Button>
          </NavLink>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
