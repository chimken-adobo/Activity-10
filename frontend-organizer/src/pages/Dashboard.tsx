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
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
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
              currentEvents.map((event: any) => {
                const startDate = new Date(event.startDate);
                const endDate = new Date(event.endDate);
                const isPast = endDate < new Date();
                const registrationPercentage = event.capacity > 0 
                  ? Math.round((event.registeredCount / event.capacity) * 100) 
                  : 0;
                const availableSpots = event.capacity - event.registeredCount;

                return (
                  <div 
                    key={event.id} 
                    className="event-card"
                    onClick={() => setSelectedEvent(event)}
                    style={{ cursor: 'pointer' }}
                  >
                    {event.imageUrl && event.imageUrl.trim() !== '' && (
                      <div className="event-card-image">
                        <img 
                          src={event.imageUrl} 
                          alt={event.title}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="event-card-body">
                      <div className="event-card-header">
                        <h3 title={event.title}>
                          {event.title.length > 20 ? `${event.title.substring(0, 20)}...` : event.title}
                        </h3>
                        {isPast && <span className="event-status-badge past">Past Event</span>}
                        {!isPast && <span className="event-status-badge upcoming">Upcoming</span>}
                      </div>
                      
                      <div className="event-details">
                        <div className="event-detail-item">
                          <span className="detail-icon">📅</span>
                          <div className="detail-content">
                            <span className="detail-label">Date & Time</span>
                            <span className="detail-value">
                              {startDate.toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                              {' • '}
                              {startDate.toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                              {endDate.getTime() !== startDate.getTime() && (
                                <>
                                  {' - '}
                                  {endDate.toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}
                                </>
                              )}
                            </span>
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
                            <div className="registration-info">
                              <span className="detail-value">
                                {event.registeredCount} / {event.capacity} registered
                              </span>
                              <span className="available-spots">
                                {availableSpots > 0 ? `${availableSpots} spots available` : 'Fully booked'}
                              </span>
                            </div>
                            <div className="registration-progress">
                              <div 
                                className="progress-bar" 
                                style={{ width: `${Math.min(registrationPercentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                        <Link to={`/attendees/${event.id}`} className="btn">
                          View Attendees
                        </Link>
                        <Link to={`/scanner/${event.id}`} className="btn btn-primary">
                          QR Scanner
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
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

      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedEvent.title}</h2>
              <button className="modal-close" onClick={() => setSelectedEvent(null)}>×</button>
            </div>
            <div className="modal-body">
              {selectedEvent.imageUrl && selectedEvent.imageUrl.trim() !== '' && (
                <div className="modal-image">
                  <img 
                    src={selectedEvent.imageUrl} 
                    alt={selectedEvent.title}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              {selectedEvent.description && (
                <div className="modal-description">
                  <h3>Description</h3>
                  <p>{selectedEvent.description}</p>
                </div>
              )}

              <div className="modal-details-grid">
                <div className="modal-detail-item">
                  <span className="detail-icon">📅</span>
                  <div className="detail-content">
                    <span className="detail-label">Start Date & Time</span>
                    <span className="detail-value">
                      {new Date(selectedEvent.startDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                      {' • '}
                      {new Date(selectedEvent.startDate).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </span>
                  </div>
                </div>

                <div className="modal-detail-item">
                  <span className="detail-icon">📅</span>
                  <div className="detail-content">
                    <span className="detail-label">End Date & Time</span>
                    <span className="detail-value">
                      {new Date(selectedEvent.endDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                      {' • '}
                      {new Date(selectedEvent.endDate).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </span>
                  </div>
                </div>

                <div className="modal-detail-item">
                  <span className="detail-icon">📍</span>
                  <div className="detail-content">
                    <span className="detail-label">Location</span>
                    <span className="detail-value">{selectedEvent.location}</span>
                  </div>
                </div>

                <div className="modal-detail-item">
                  <span className="detail-icon">👥</span>
                  <div className="detail-content">
                    <span className="detail-label">Registration</span>
                    <span className="detail-value">
                      {selectedEvent.registeredCount} / {selectedEvent.capacity} registered
                    </span>
                    <span className="available-spots">
                      {selectedEvent.capacity - selectedEvent.registeredCount > 0 
                        ? `${selectedEvent.capacity - selectedEvent.registeredCount} spots available` 
                        : 'Fully booked'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;

