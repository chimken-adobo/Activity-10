import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { eventsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { data: events } = useQuery({
    queryKey: ['events', user?.id],
    queryFn: () => eventsApi.getAll({ organizerId: user?.id }),
  });

  // Filter events based on search query
  const filteredEvents = events?.filter((event: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      event.title?.toLowerCase().includes(query) ||
      event.description?.toLowerCase().includes(query) ||
      event.location?.toLowerCase().includes(query)
    );
  }) || [];

  // Calculate pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, endIndex);

  return (
    <Layout>
      <div className="dashboard">
        <h1>Organizer Dashboard</h1>
        <div className="events-section">
          <div className="events-header">
            <h2>My Events</h2>
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="search-input"
            />
          </div>
          
          <div className="events-grid">
            {currentEvents.length === 0 ? (
              <div className="no-events">
                <p>{searchQuery ? 'No events found matching your search.' : 'No events found.'}</p>
              </div>
            ) : (
              currentEvents.map((event: any) => (
                <div key={event.id} className="event-card">
                  <h3>{event.title}</h3>
                  <p>{new Date(event.startDate).toLocaleDateString()}</p>
                  <p>{event.location}</p>
                  <p>Registered: {event.registeredCount} / {event.capacity}</p>
                  <div className="card-actions">
                    <Link to={`/attendees/${event.id}`} className="btn">
                      View Attendees
                    </Link>
                    <Link to={`/scanner/${event.id}`} className="btn btn-primary">
                      QR Scanner
                    </Link>
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

