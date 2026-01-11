import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">Organizer Portal</div>
        <div className="nav-links">
          <Link to="/">Dashboard</Link>
          <Link to="/events">My Events</Link>
          <div className="user-info">
            <span>{user?.name}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;

