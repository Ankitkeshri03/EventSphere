import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <nav style={{ display: 'flex', gap: 16, padding: 12, borderBottom: '1px solid #ccc' }}>
      <Link to="/events">Events</Link>
      <Link to="/create-event">Create event</Link>
      {token && <Link to="/my-tickets">My tickets</Link>}
      {token ? (
        <button onClick={handleLogout}>Log out</button>
      ) : (
        <Link to="/login">Log in</Link>
      )}
    </nav>
  );
}

export default Navbar;
