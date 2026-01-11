import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { ticketsApi, eventsApi } from '../services/api';
import './AttendeesList.css';

const AttendeesList = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.getById(eventId!),
  });

  const { data: tickets } = useQuery({
    queryKey: ['tickets', eventId],
    queryFn: () => ticketsApi.getAll({ eventId }),
  });

  const exportToCSV = () => {
    if (!tickets) return;

    const headers = ['Ticket ID', 'Attendee Name', 'Email', 'Status', 'Checked In At'];
    const rows = tickets.map((ticket: any) => [
      ticket.ticketId,
      ticket.attendee?.name || 'N/A',
      ticket.attendee?.email || 'N/A',
      ticket.status,
      ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleString() : 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees-${eventId}-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <Layout>
      <div className="attendees-list">
        <div className="page-header">
          <h1>Attendees - {event?.title}</h1>
          <button onClick={exportToCSV} className="btn-export">
            Export CSV
          </button>
        </div>

        <div className="attendees-table">
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Checked In At</th>
              </tr>
            </thead>
            <tbody>
              {tickets?.map((ticket: any) => (
                <tr key={ticket.id}>
                  <td>{ticket.ticketId}</td>
                  <td>{ticket.attendee?.name || 'N/A'}</td>
                  <td>{ticket.attendee?.email || 'N/A'}</td>
                  <td>
                    <span className={`status-badge status-${ticket.status}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {ticket.checkedInAt
                      ? new Date(ticket.checkedInAt).toLocaleString()
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default AttendeesList;

