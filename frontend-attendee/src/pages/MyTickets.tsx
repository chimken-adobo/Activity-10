import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { ticketsApi } from '../services/api';
import './MyTickets.css';

const MyTickets = () => {
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => ticketsApi.getMyTickets(),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => ticketsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      alert('Ticket cancelled successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Cancellation failed');
    },
  });

  if (isLoading) return <Layout><div>Loading...</div></Layout>;

  return (
    <Layout>
      <div className="my-tickets">
        <div className="distorted-shape-1"></div>
        <div className="distorted-shape-2"></div>
        <div className="distorted-shape-3"></div>
        <div className="tickets-container">
          <h1>My Tickets</h1>
          <div className="tickets-grid">
            {tickets?.length === 0 ? (
              <p>You don't have any tickets yet. Browse events to register!</p>
            ) : (
              tickets?.map((ticket: any) => (
                <div key={ticket.id} className="ticket-card">
                  <div className="ticket-header">
                    <h3>{ticket.event?.title}</h3>
                    <span className={`status-badge status-${ticket.status}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="ticket-info">
                    <p><strong>Ticket ID:</strong> {ticket.ticketId}</p>
                    <p><strong>Date:</strong> {new Date(ticket.event?.startDate).toLocaleString()}</p>
                    <p><strong>Location:</strong> {ticket.event?.location}</p>
                  </div>
                  {ticket.status === 'confirmed' && (
                    <>
                      <div className="qr-section">
                        <img src={ticket.qrCode} alt="QR Code" className="qr-code" />
                        <p className="qr-note">Present this QR code at the venue for check-in</p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel this ticket?')) {
                            cancelMutation.mutate(ticket.id);
                          }
                        }}
                        className="btn-cancel"
                      >
                        Cancel Ticket
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MyTickets;

