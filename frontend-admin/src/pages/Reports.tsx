import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { eventsApi, ticketsApi } from '../services/api';
import './Reports.css';

const Reports = () => {
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.getAll(),
  });

  const { data: tickets } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => ticketsApi.getAll(),
  });

  const exportToCSV = () => {
    if (!tickets) return;

    const headers = ['Ticket ID', 'Event', 'Attendee', 'Status', 'Created At'];
    const rows = tickets.map((ticket: any) => [
      ticket.ticketId,
      ticket.event?.title || 'N/A',
      ticket.attendee?.name || 'N/A',
      ticket.status,
      new Date(ticket.createdAt).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickets-${new Date().toISOString()}.csv`;
    a.click();
  };

  const stats = {
    totalEvents: events?.length || 0,
    totalTickets: tickets?.length || 0,
    checkedIn: tickets?.filter((t: any) => t.status === 'checked_in').length || 0,
    confirmed: tickets?.filter((t: any) => t.status === 'confirmed').length || 0,
    cancelled: tickets?.filter((t: any) => t.status === 'cancelled').length || 0,
  };

  return (
    <Layout>
      <div className="reports">
        <div className="reports-header">
          <h1>Reports & Analytics</h1>
          <button onClick={exportToCSV} className="btn-export">
            Export to CSV
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Events</h3>
            <p className="stat-number">{stats.totalEvents}</p>
          </div>
          <div className="stat-card">
            <h3>Total Tickets</h3>
            <p className="stat-number">{stats.totalTickets}</p>
          </div>
          <div className="stat-card">
            <h3>Checked In</h3>
            <p className="stat-number">{stats.checkedIn}</p>
          </div>
          <div className="stat-card">
            <h3>Confirmed</h3>
            <p className="stat-number">{stats.confirmed}</p>
          </div>
          <div className="stat-card">
            <h3>Cancelled</h3>
            <p className="stat-number">{stats.cancelled}</p>
          </div>
          <div className="stat-card">
            <h3>Check-in Rate</h3>
            <p className="stat-number">
              {stats.totalTickets > 0
                ? ((stats.checkedIn / stats.totalTickets) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;

