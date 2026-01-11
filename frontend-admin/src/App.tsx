import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EventsList from './pages/EventsList';
import EventDetails from './pages/EventDetails';
import OrganizerDashboard from './pages/OrganizerDashboard';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';
import MyTickets from './pages/MyTickets';
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
                  <EventsList />
                </PrivateRoute>
              }
            />
            <Route
              path="/events/:id"
              element={
                <PrivateRoute>
                  <EventDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/organizer-dashboard"
              element={
                <PrivateRoute>
                  <OrganizerDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/users"
              element={
                <PrivateRoute>
                  <UserManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <PrivateRoute>
                  <Reports />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-tickets"
              element={
                <PrivateRoute>
                  <MyTickets />
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

