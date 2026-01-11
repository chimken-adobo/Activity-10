import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { eventsApi, ticketsApi } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.getAll({ isActive: true }),
  });

  const { data: tickets } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => ticketsApi.getAll(),
  });

  const allUpcomingEvents = events?.filter(
    (event: any) => new Date(event.startDate) > new Date()
  ) || [];

  // Calculate pagination
  const totalPages = Math.ceil(allUpcomingEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const upcomingEvents = allUpcomingEvents.slice(startIndex, endIndex);

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
            <p className="stat-number">{allUpcomingEvents.length}</p>
          </div>
        </div>

        <div className="section">
          <h2>Upcoming Events</h2>
          <div className="events-list">
            {upcomingEvents.length === 0 ? (
              <div className="no-events">No upcoming events found.</div>
            ) : (
              upcomingEvents.map((event: any) => (
                <div key={event.id} className="event-card">
                  <div className="event-card-header">
                    <h3>{event.title}</h3>
                  </div>
                  <div className="event-card-details">
                    <div className="event-detail-item">
                      <span className="detail-icon">📅</span>
                      <div className="detail-content">
                        <span className="detail-label">Date</span>
                        <span className="detail-value">{new Date(event.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="event-detail-item">
                      <span className="detail-icon">📍</span>
                      <div className="detail-content">
                        <span className="detail-label">Location</span>
                        <span className="detail-value">{event.location}</span>
                      </div>
                    </div>
                    <div className="event-detail-item">
                      <span className="detail-icon">👥</span>
                      <div className="detail-content">
                        <span className="detail-label">Registration</span>
                        <span className="detail-value">Registered: {event.registeredCount} / {event.capacity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <div className="pagination-info">
                <span>Page {currentPage} of {totalPages}</span>
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

