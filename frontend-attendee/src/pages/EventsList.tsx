import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { eventsApi } from '../services/api';
import './EventsList.css';

const EventsList = () => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  const { data: events, isLoading } = useQuery({
    queryKey: ['events', search],
    queryFn: () => eventsApi.getAll({ search, isActive: true }),
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
        <div className="distorted-shape-1"></div>
        <div className="distorted-shape-2"></div>
        <div className="distorted-shape-3"></div>
        <div className="events-container">
          <div className="page-header">
            <h1>Discover Events</h1>
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
                  <div className="no-events">
                    <p>{search ? 'No events found matching your search.' : 'No events found.'}</p>
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
                  <Link key={event.id} to={`/events/${event.id}`} className="event-card">
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
                    <div className="event-card-content">
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
                            <span className="detail-label">Availability</span>
                            <div className="registration-info">
                              <span className="detail-value">
                                {availableSpots > 0 ? `${availableSpots} spots available` : 'Fully booked'}
                              </span>
                              <span className="registration-count">
                                {event.registeredCount} / {event.capacity} registered
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
                    </div>
                  </Link>
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
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EventsList;

