import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openLoginModal = () => {
    setAuthModalTab('login');
    setAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalTab('register');
    setAuthModalOpen(true);
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">RegiHub</div>
        <div className="nav-links">
          {isAuthenticated ? (
            <>
              <Link to="/">Home</Link>
              <Link to="/events">Events</Link>
              <Link to="/my-tickets">My Tickets</Link>
              <div className="user-info">
                <span>{user?.name}</span>
                <button onClick={handleLogout}>Logout</button>
              </div>
            </>
          ) : (
            <>
              <Link to="/">Home</Link>
              <button className="nav-button nav-button-secondary" onClick={openLoginModal}>
                Login
              </button>
              <button className="nav-button nav-button-primary" onClick={openRegisterModal}>
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>
      <main className="main-content">{children}</main>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
      />
    </div>
  );
};

export default Layout;

