import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { eventsApi } from '../services/api';
import './EventsList.css';

const EventsList = () => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const { data: events, isLoading } = useQuery({
    queryKey: ['events', search],
    queryFn: () => eventsApi.getAll({ search }),
  });

  // Filter events based on search query
  const filteredEvents = events?.filter((event: any) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
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
      <div className="events-list-page">
        <div className="page-header">
          <h1>Events</h1>
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            className="search-input"
          />
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <>
            <div className="events-grid">
              {currentEvents.length === 0 ? (
                <div className="no-events">No events found.</div>
              ) : (
                currentEvents.map((event: any) => (
                  <Link key={event.id} to={`/events/${event.id}`} className="event-card">
                    <div className="event-card-image">
                      {event.imageUrl && event.imageUrl.trim() !== '' ? (
                        <img 
                          src={event.imageUrl} 
                          alt={event.title}
                          onError={(e) => {
                            // Hide broken images and show placeholder
                            const img = e.currentTarget;
                            img.style.display = 'none';
                            const container = img.parentElement;
                            if (container) {
                              const placeholder = document.createElement('div');
                              placeholder.className = 'no-image-placeholder';
                              placeholder.textContent = 'No image attached';
                              container.appendChild(placeholder);
                            }
                          }}
                        />
                      ) : (
                        <div className="no-image-placeholder">No image attached</div>
                      )}
                    </div>
                    <div className="event-card-content">
                      <h3>{event.title}</h3>
                      <div className="event-details">
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
                            <span className="detail-label">Capacity</span>
                            <span className="detail-value">{event.registeredCount} / {event.capacity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
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
          </>
        )}
      </div>
    </Layout>
  );
};

export default EventsList;

