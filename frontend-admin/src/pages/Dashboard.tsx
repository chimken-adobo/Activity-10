import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { eventsApi, ticketsApi } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.getAll({ isActive: true }),
  });

  const { data: tickets } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => ticketsApi.getAll(),
  });

  const upcomingEvents = events?.filter(
    (event: any) => new Date(event.startDate) > new Date()
  ).slice(0, 5) || [];

  const checkedInTickets = tickets?.filter(
    (ticket: any) => ticket.status === 'checked_in'
  ).length || 0;

  const totalTickets = tickets?.length || 0;

  return (
    <Layout>
      <div className="dashboard">
        <h1>Admin Dashboard</h1>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Events</h3>
            <p className="stat-number">{events?.length || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Total Tickets</h3>
            <p className="stat-number">{totalTickets}</p>
          </div>
          <div className="stat-card">
            <h3>Checked In</h3>
            <p className="stat-number">{checkedInTickets}</p>
          </div>
          <div className="stat-card">
            <h3>Upcoming Events</h3>
            <p className="stat-number">{upcomingEvents.length}</p>
          </div>
        </div>

        <div className="section">
          <h2>Upcoming Events</h2>
          <div className="events-list">
            {upcomingEvents.map((event: any) => (
              <div key={event.id} className="event-card">
                <h3>{event.title}</h3>
                <p>{new Date(event.startDate).toLocaleDateString()}</p>
                <p>{event.location}</p>
                <p>Registered: {event.registeredCount} / {event.capacity}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

