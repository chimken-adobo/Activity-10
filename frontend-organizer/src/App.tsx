import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EventManagement from './pages/EventManagement';
import AttendeesList from './pages/AttendeesList';
import QRScanner from './pages/QRScanner';
import PrivateRoute from './components/PrivateRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/events"
              element={
                <PrivateRoute>
                  <EventManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/attendees/:eventId"
              element={
                <PrivateRoute>
                  <AttendeesList />
                </PrivateRoute>
              }
            />
            <Route
              path="/scanner/:eventId"
              element={
                <PrivateRoute>
                  <QRScanner />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

