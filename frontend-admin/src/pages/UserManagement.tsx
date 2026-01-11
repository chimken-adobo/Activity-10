import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { usersApi } from '../services/api';
import './UserManagement.css';

const UserManagement = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirmUserId, setDeleteConfirmUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    company: '',
    role: 'attendee' as 'organizer' | 'attendee',
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowForm(false);
      setFormData({
        email: '',
        password: '',
        name: '',
        company: '',
        role: 'attendee',
      });
      alert('User created successfully!');
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to create user');
    },
  });


  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteConfirmUserId(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => usersApi.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to toggle user status');
    },
  });

  const handleDeleteClick = (userId: string) => {
    setDeleteConfirmUserId(userId);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmUserId) {
      deleteMutation.mutate(deleteConfirmUserId);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmUserId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      company: formData.company || undefined,
    });
  };

  if (isLoading) return <Layout><div>Loading...</div></Layout>;

  return (
    <Layout>
      <div className="user-management">
        <div className="user-management-header">
          <h1>User Management</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-create">
            {showForm ? 'Cancel' : 'Create User'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="create-form">
            <h2>Create New User</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'organizer' | 'attendee' })}
                  required
                >
                  <option value="attendee">Attendee</option>
                  <option value="organizer">Organizer</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create User'}
            </button>
          </form>
        )}

        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Company</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user: any) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.company || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      {(user.role === 'attendee' || user.role === 'organizer') && (
                        <button
                          onClick={() => toggleActiveMutation.mutate(user.id)}
                          className={user.isActive ? 'btn-deactivate' : 'btn-activate'}
                          disabled={
                            toggleActiveMutation.isPending ||
                            (user.isActive && (
                              (user.role === 'organizer' && (user.eventCount || 0) > 0) ||
                              (user.role === 'attendee' && (user.ticketCount || 0) > 0)
                            ))
                          }
                          title={
                            user.isActive && (
                              (user.role === 'organizer' && (user.eventCount || 0) > 0) ||
                              (user.role === 'attendee' && (user.ticketCount || 0) > 0)
                            )
                              ? `Cannot deactivate ${user.role} with ${user.role === 'organizer' ? (user.eventCount || 0) : (user.ticketCount || 0)} ${user.role === 'organizer' ? 'event(s)' : 'registration(s)'}`
                              : ''
                          }
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                      {user.role === 'admin' || user.role === 'organizer' ? (
                        <span className="cannot-delete-text">This can't be deleted</span>
                      ) : (
                        <button
                          onClick={() => handleDeleteClick(user.id)}
                          className="btn-delete"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {deleteConfirmUserId && (
          <div className="delete-confirm-overlay" onClick={handleDeleteCancel}>
            <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="delete-confirm-content">
                <h3>Confirm Delete</h3>
                <p>Are you sure you really want to delete this user? This action cannot be undone.</p>
                <div className="delete-confirm-actions">
                  <button onClick={handleDeleteCancel} className="btn-cancel">
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="btn-confirm-delete"
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserManagement;

