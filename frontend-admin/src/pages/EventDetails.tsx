import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { eventsApi } from '../services/api';
import './EventDetails.css';

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getById(id!),
  });

  const deleteMutation = useMutation({
    mutationFn: () => eventsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      navigate('/events');
    },
  });

  if (isLoading) return <Layout><div>Loading...</div></Layout>;

  if (!event) return <Layout><div>Event not found</div></Layout>;

  return (
    <Layout>
      <div className="event-details">
        <div className="event-header">
          <h1>{event.title}</h1>
          <div className="actions">
            <button onClick={() => navigate('/organizer-dashboard', { state: { editEventId: id } })}>Edit</button>
            <button onClick={() => deleteMutation.mutate()} className="delete-btn">
              Delete
            </button>
          </div>
        </div>

        <div className="event-info">
          <div className="info-section">
            <h3>Description</h3>
            <p>{event.description}</p>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <strong>Start Date:</strong>
              <p>{new Date(event.startDate).toLocaleString()}</p>
            </div>
            <div className="info-item">
              <strong>End Date:</strong>
              <p>{new Date(event.endDate).toLocaleString()}</p>
            </div>
            <div className="info-item">
              <strong>Location:</strong>
              <p>{event.location}</p>
            </div>
            <div className="info-item">
              <strong>Capacity:</strong>
              <p>{event.registeredCount} / {event.capacity}</p>
            </div>
            <div className="info-item">
              <strong>Status:</strong>
              <p className={event.isActive ? 'status-active' : 'status-inactive'}>
                {event.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className="info-item">
              <strong>Organizer:</strong>
              <p>{event.organizer?.name || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetails;

