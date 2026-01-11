import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { usersApi } from '../services/api';
import './AllAttendees.css';

const AllAttendees = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: attendees, isLoading } = useQuery({
    queryKey: ['attendees'],
    queryFn: () => usersApi.getAllAttendees(),
  });

  // Filter attendees based on search query (by name or email)
  const filteredAttendees = attendees?.filter((attendee: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      attendee.name?.toLowerCase().includes(query) ||
      attendee.email?.toLowerCase().includes(query)
    );
  }) || [];

  const exportToCSV = () => {
    if (!filteredAttendees || filteredAttendees.length === 0) return;

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      // Format as readable text that Excel will display correctly
      // Using format: "01/15/2024" which should display properly
      return `${month}/${day}/${year}`;
    };

    const headers = ['ID', 'Name', 'Email', 'Company', 'Status', 'Registered Date'];
    const rows = filteredAttendees.map((attendee: any) => [
      attendee.id,
      attendee.name || 'N/A',
      attendee.email || 'N/A',
      attendee.company || 'N/A',
      attendee.isActive ? 'Active' : 'Inactive',
      attendee.createdAt ? formatDate(attendee.createdAt) : 'N/A',
    ]);

    // Format CSV - add tab character before date to force Excel to treat as text
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => 
        row.map((cell, index) => {
          // For date column (index 5), prefix with tab to force text format in Excel
          if (index === 5 && cell !== 'N/A') {
            return `"\t${String(cell)}"`;
          }
          return `"${String(cell)}"`;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="all-attendees">
        <div className="page-header">
          <h1>All Attendees</h1>
          <button onClick={exportToCSV} className="btn-export">
            Export to CSV
          </button>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {isLoading ? (
          <div className="loading-message">Loading attendees...</div>
        ) : (
          <div className="attendees-table-container">
            <table className="attendees-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Registered Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="no-data">
                      {searchQuery ? 'No attendees found matching your search.' : 'No attendees found.'}
                    </td>
                  </tr>
                ) : (
                  filteredAttendees.map((attendee: any) => (
                    <tr key={attendee.id}>
                      <td>{attendee.id}</td>
                      <td>{attendee.name}</td>
                      <td>{attendee.email}</td>
                      <td>{attendee.company || 'N/A'}</td>
                      <td>
                        <span className={`status-badge status-${attendee.isActive ? 'active' : 'inactive'}`}>
                          {attendee.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {attendee.createdAt
                          ? new Date(attendee.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AllAttendees;
