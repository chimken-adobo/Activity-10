import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { eventsApi } from '../services/api';
import './EventsList.css';

const EventsList = () => {
  const [search, setSearch] = useState('');
  const { data: events, isLoading } = useQuery({
    queryKey: ['events', search],
    queryFn: () => eventsApi.getAll({ search }),
  });

  return (
    <Layout>
      <div className="events-list-page">
        <div className="page-header">
          <h1>Events</h1>
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="events-grid">
            {events?.map((event: any) => (
              <Link key={event.id} to={`/events/${event.id}`} className="event-card">
                {event.imageUrl && event.imageUrl.trim() !== '' && (
                  <div className="event-card-image">
                    <img 
                      src={event.imageUrl} 
                      alt={event.title}
                      onError={(e) => {
                        // Hide broken images
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="event-card-content">
                  <h3>{event.title}</h3>
                  <p className="event-description">{event.description}</p>
                  <div className="event-details">
                    <p>
                      <strong>Date:</strong> {new Date(event.startDate).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Location:</strong> {event.location}
                    </p>
                    <p>
                      <strong>Capacity:</strong> {event.registeredCount} / {event.capacity}
                    </p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span className={event.isActive ? 'status-active' : 'status-inactive'}>
                        {event.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EventsList;

