import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { eventsApi, ticketsApi } from '../services/api';
import './EventDetails.css';

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getById(id!),
  });

  const registerMutation = useMutation({
    mutationFn: () => ticketsApi.register(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      alert('Successfully registered! Check your email for the ticket.');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Registration failed');
    },
  });


  if (isLoading) return <Layout><div>Loading...</div></Layout>;

  if (!event) return <Layout><div>Event not found</div></Layout>;

  const isFull = event.registeredCount >= event.capacity;
  const isPast = new Date(event.endDate) < new Date();

  return (
    <Layout>
      <div className="event-details">
        <div className="event-header">
          <h1>{event.title}</h1>
        </div>

        <div className="event-info">
          {event.imageUrl && event.imageUrl.trim() !== '' ? (
            <div className="event-image">
              <img src={event.imageUrl} alt={event.title} />
            </div>
          ) : (
            <div className="event-image no-image">
              <div className="no-image-placeholder">No image attached</div>
            </div>
          )}
          <div className="info-section">
            <h3>Description</h3>
            <p>{event.description}</p>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <div className="info-item-header">
                <span className="info-icon">📅</span>
                <strong>Start Date</strong>
              </div>
              <p>{new Date(event.startDate).toLocaleString()}</p>
            </div>
            <div className="info-item">
              <div className="info-item-header">
                <span className="info-icon">📅</span>
                <strong>End Date</strong>
              </div>
              <p>{new Date(event.endDate).toLocaleString()}</p>
            </div>
            <div className="info-item">
              <div className="info-item-header">
                <span className="info-icon">📍</span>
                <strong>Location</strong>
              </div>
              <p>{event.location}</p>
            </div>
            <div className="info-item">
              <div className="info-item-header">
                <span className="info-icon">👥</span>
                <strong>Capacity</strong>
              </div>
              <p>{event.registeredCount} / {event.capacity}</p>
            </div>
            <div className="info-item">
              <div className="info-item-header">
                <span className="info-icon">👤</span>
                <strong>Organizer</strong>
              </div>
              <p>{event.organizer?.name || 'N/A'}</p>
            </div>
          </div>

          {!isPast && !isFull && event.isActive && (
            <button
              onClick={() => registerMutation.mutate()}
              className="btn-register"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Registering...' : 'Register for Event'}
            </button>
          )}

          {isFull && <p className="error-message">Event is at full capacity</p>}
          {isPast && <p className="error-message">Event has already passed</p>}
          {!event.isActive && <p className="error-message">Event is not active</p>}
        </div>
      </div>
    </Layout>
  );
};

export default EventDetails;

