import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { eventsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './EventManagement.css';

const EventManagement = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    capacity: '',
    imageUrl: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null); // Track original image when editing
  const [editingEvent, setEditingEvent] = useState<any | null>(null); // Store full event data when editing
  const [fileInputKey, setFileInputKey] = useState(0); // For resetting file input
  const [validationErrors, setValidationErrors] = useState<{
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
  }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const queryClient = useQueryClient();

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get current time in HH:mm format
  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Get min date for end date (either start date or current date, whichever is later)
  const getMinEndDate = () => {
    if (formData.startDate) {
      const startDateObj = new Date(formData.startDate);
      const currentDateObj = new Date(getCurrentDate());
      // If start date is today or in the future, use start date; otherwise use current date
      if (startDateObj >= currentDateObj) {
        return formData.startDate;
      }
    }
    return getCurrentDate();
  };

  // Get min time for end time based on dates
  const getMinEndTime = () => {
    if (formData.startDate && formData.endDate && formData.startDate === formData.endDate) {
      // If same date, end time must be after start time
      return formData.startTime || undefined;
    }
    return undefined;
  };

  // Combine date and time into ISO string for submission
  const combineDateTime = (date: string, time: string) => {
    if (!date || !time) return '';
    return `${date}T${time}:00`;
  };

  const { data: events } = useQuery({
    queryKey: ['events', user?.id],
    queryFn: () => eventsApi.getAll({ organizerId: user?.id }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => eventsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowForm(false);
      setEditingEventId(null);
      setFormData({
        title: '',
        description: '',
        location: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        capacity: '',
        imageUrl: '',
      });
      setImagePreview(null);
      setOriginalImageUrl(null);
      setEditingEvent(null);
      setFileInputKey(prev => prev + 1); // Reset file input
      alert('Event created successfully!');
    },
    onError: (error: any) => {
      console.error('Error creating event:', error);
      alert(error?.response?.data?.message || 'Failed to create event. Please try again.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => eventsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowForm(false);
      setEditingEventId(null);
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        location: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        capacity: '',
        imageUrl: '',
      });
      setImagePreview(null);
      setOriginalImageUrl(null);
      setFileInputKey(prev => prev + 1); // Reset file input
      alert('Event updated successfully!');
    },
    onError: (error: any) => {
      console.error('Error updating event:', error);
      alert(error?.response?.data?.message || 'Failed to update event. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      // Reset to first page if we're on a page that might become empty
      setCurrentPage(1);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to delete event. Please try again.');
      console.error('Error deleting event:', error);
    },
  });

  const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      try {
        // Compress image before converting to base64
        const compressedBase64 = await compressImage(file);
        
        // Check compressed size (max 2MB after compression)
        const base64Size = (compressedBase64.length * 3) / 4;
        if (base64Size > 2 * 1024 * 1024) {
          alert('Image is too large even after compression. Please use a smaller image.');
          return;
        }

        setFormData((prev) => ({ ...prev, imageUrl: compressedBase64 }));
        setImagePreview(compressedBase64);
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Failed to process image. Please try again.');
      }
    }
  };

  const handleEdit = (event: any) => {
    setEditingEventId(event.id);
    setEditingEvent(event); // Store full event data to check registrations
    // Split dates into date and time components
    const startDateObj = new Date(event.startDate);
    const endDateObj = new Date(event.endDate);
    
    const startDate = startDateObj.toISOString().slice(0, 10); // YYYY-MM-DD
    const startTime = startDateObj.toISOString().slice(11, 16); // HH:mm
    const endDate = endDateObj.toISOString().slice(0, 10); // YYYY-MM-DD
    const endTime = endDateObj.toISOString().slice(11, 16); // HH:mm
    
    const eventImageUrl = event.imageUrl || '';
    
    setFormData({
      title: event.title || '',
      description: event.description || '',
      location: event.location || '',
      startDate: startDate,
      startTime: startTime,
      endDate: endDate,
      endTime: endTime,
      capacity: event.capacity?.toString() || '',
      imageUrl: eventImageUrl,
    });
    
    // Store original image URL to track changes
    setOriginalImageUrl(eventImageUrl && eventImageUrl.trim() !== '' ? eventImageUrl : null);
    
    // Set preview if event has an image
    if (eventImageUrl && eventImageUrl.trim() !== '') {
      setImagePreview(eventImageUrl);
    } else {
      setImagePreview(null);
    }
    
    setShowForm(true);
    // Scroll to form
    setTimeout(() => {
      const formElement = document.querySelector('.event-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCancel = () => {
    setValidationErrors({});
    setShowForm(false);
    setEditingEventId(null);
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      location: '',
      startDate: '',
      endDate: '',
      capacity: '',
      imageUrl: '',
    });
    setImagePreview(null);
    setOriginalImageUrl(null);
    setFileInputKey(prev => prev + 1);
  };

  const validateDates = () => {
    const errors: typeof validationErrors = {};
    
    // Only validate if dates are not disabled (i.e., when creating or editing events with no registrations)
    if (editingEventId && editingEvent?.registeredCount > 0) {
      setValidationErrors({});
      return true; // Skip validation for disabled fields
    }
    
    // Combine date and time
    const startDateTime = combineDateTime(formData.startDate, formData.startTime);
    const endDateTime = combineDateTime(formData.endDate, formData.endTime);
    
    if (!formData.startDate || !formData.startTime) {
      errors.startDate = 'Please fill in start date and time';
    } else {
      // Validate start date/time is not in the past
      const now = new Date();
      const startDate = new Date(startDateTime);
      
      if (startDate < now) {
        errors.startDate = 'Start date and time cannot be in the past';
        errors.startTime = 'Start date and time cannot be in the past';
      }
    }
    
    if (!formData.endDate || !formData.endTime) {
      errors.endDate = 'Please fill in end date and time';
    } else if (startDateTime) {
      // Validate end date/time is after start
      const startDate = new Date(startDateTime);
      const endDate = new Date(endDateTime);
      
      if (endDate <= startDate) {
        errors.endDate = 'End date and time must be after start date and time';
        errors.endTime = 'End date and time must be after start date and time';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setValidationErrors({});
    
    // Validate dates
    if (!validateDates()) {
      return;
    }
    
    // Combine date and time
    const startDateTime = combineDateTime(formData.startDate, formData.startTime);
    const endDateTime = combineDateTime(formData.endDate, formData.endTime);
    
    // Validate capacity
    const capacityNum = parseInt(formData.capacity);
    if (isNaN(capacityNum) || capacityNum < 1) {
      alert('Please enter a valid capacity (minimum 1)');
      return;
    }
    
    // Prepare data
    const submitData: any = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),
      startDate: startDateTime,
      endDate: endDateTime,
      capacity: capacityNum,
    };
    
    // Handle imageUrl
    if (editingEventId) {
      // When editing: only send imageUrl if it has changed
      const currentImageUrl = formData.imageUrl && formData.imageUrl.trim() !== '' ? formData.imageUrl : null;
      
      if (currentImageUrl !== originalImageUrl) {
        // Image has changed
        if (currentImageUrl) {
          // New image uploaded
          submitData.imageUrl = currentImageUrl;
        } else {
          // Image was removed (user clicked remove or cleared it)
          submitData.imageUrl = ''; // Backend will convert empty string to null to remove image
        }
      }
      // If imageUrl hasn't changed, don't include it in submitData (keeps existing image)
    } else {
      // When creating: only include if provided
      if (formData.imageUrl && formData.imageUrl.trim() !== '') {
        submitData.imageUrl = formData.imageUrl;
      }
    }
    
    if (editingEventId) {
      updateMutation.mutate({ id: editingEventId, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <Layout>
      <div className="event-management">
        <div className="page-header">
          <h1>Event Management</h1>
          <button 
            onClick={() => {
              if (showForm) {
                handleCancel();
              } else {
                setShowForm(true);
              }
            }} 
            className="btn-primary"
          >
            {showForm ? 'Cancel' : 'Create Event'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="event-form">
            <h2>{editingEventId ? 'Edit Event' : 'Create New Event'}</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location {editingEventId && editingEvent?.registeredCount > 0 && <span style={{ color: '#e74c3c' }}>*</span>}</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  disabled={editingEventId && editingEvent?.registeredCount > 0}
                />
                {editingEventId && editingEvent?.registeredCount > 0 && (
                  <p style={{ fontSize: '0.85rem', color: '#e74c3c', marginTop: '0.25rem', marginBottom: 0 }}>
                    Cannot be changed after registrations have been made
                  </p>
                )}
              </div>
              <div className="form-group">
                <label>Start Date {editingEventId && editingEvent?.registeredCount > 0 && <span style={{ color: '#e74c3c' }}>*</span>}</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    setFormData({ ...formData, startDate: newStartDate });
                    setValidationErrors(prev => ({ ...prev, startDate: undefined, startTime: undefined }));
                    // If end date is before new start date, update it to match start date
                    if (formData.endDate && newStartDate && formData.endDate < newStartDate) {
                      setFormData(prev => ({ ...prev, startDate: newStartDate, endDate: newStartDate }));
                    }
                  }}
                  min={getCurrentDate()}
                  required
                  disabled={editingEventId && editingEvent?.registeredCount > 0}
                  className={validationErrors.startDate ? 'input-error' : ''}
                />
                {editingEventId && editingEvent?.registeredCount > 0 && (
                  <p style={{ fontSize: '0.85rem', color: '#e74c3c', marginTop: '0.25rem', marginBottom: 0 }}>
                    Date cannot be changed after registrations have been made
                  </p>
                )}
                {validationErrors.startDate && (
                  <p style={{ fontSize: '0.85rem', color: '#e74c3c', marginTop: '0.25rem', marginBottom: 0 }}>
                    {validationErrors.startDate}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label>Start Time {editingEventId && editingEvent?.registeredCount > 0 && <span style={{ color: '#f39c12' }}>⚠️</span>}</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => {
                    const newStartTime = e.target.value;
                    setFormData({ ...formData, startTime: newStartTime });
                    setValidationErrors(prev => ({ ...prev, startDate: undefined, startTime: undefined }));
                    // If same date and end time is before new start time, update end time
                    if (formData.startDate && formData.endDate && formData.startDate === formData.endDate && 
                        formData.endTime && newStartTime && formData.endTime <= newStartTime) {
                      // Set end time to be 1 hour after start time
                      const [hours, minutes] = newStartTime.split(':');
                      const endTimeDate = new Date();
                      endTimeDate.setHours(parseInt(hours) + 1, parseInt(minutes));
                      const newEndTime = `${String(endTimeDate.getHours()).padStart(2, '0')}:${String(endTimeDate.getMinutes()).padStart(2, '0')}`;
                      setFormData(prev => ({ ...prev, startTime: newStartTime, endTime: newEndTime }));
                    }
                  }}
                  required
                  disabled={editingEventId && editingEvent?.registeredCount > 0}
                  className={validationErrors.startTime ? 'input-error' : ''}
                />
                {editingEventId && editingEvent?.registeredCount > 0 && (
                  <p style={{ fontSize: '0.85rem', color: '#f39c12', marginTop: '0.25rem', marginBottom: 0, fontStyle: 'italic' }}>
                    ⚠️ Changing the time may affect registered attendees
                  </p>
                )}
                {validationErrors.startTime && (
                  <p style={{ fontSize: '0.85rem', color: '#e74c3c', marginTop: '0.25rem', marginBottom: 0 }}>
                    {validationErrors.startTime}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label>End Date {editingEventId && editingEvent?.registeredCount > 0 && <span style={{ color: '#e74c3c' }}>*</span>}</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => {
                    setFormData({ ...formData, endDate: e.target.value });
                    setValidationErrors(prev => ({ ...prev, endDate: undefined, endTime: undefined }));
                  }}
                  min={getMinEndDate()}
                  required
                  disabled={editingEventId && editingEvent?.registeredCount > 0}
                  className={validationErrors.endDate ? 'input-error' : ''}
                />
                {editingEventId && editingEvent?.registeredCount > 0 && (
                  <p style={{ fontSize: '0.85rem', color: '#e74c3c', marginTop: '0.25rem', marginBottom: 0 }}>
                    Date cannot be changed after registrations have been made
                  </p>
                )}
                {validationErrors.endDate && (
                  <p style={{ fontSize: '0.85rem', color: '#e74c3c', marginTop: '0.25rem', marginBottom: 0 }}>
                    {validationErrors.endDate}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label>End Time {editingEventId && editingEvent?.registeredCount > 0 && <span style={{ color: '#f39c12' }}>⚠️</span>}</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => {
                    setFormData({ ...formData, endTime: e.target.value });
                    setValidationErrors(prev => ({ ...prev, endDate: undefined, endTime: undefined }));
                  }}
                  min={getMinEndTime()}
                  required
                  disabled={editingEventId && editingEvent?.registeredCount > 0}
                  className={validationErrors.endTime ? 'input-error' : ''}
                />
                {editingEventId && editingEvent?.registeredCount > 0 && (
                  <p style={{ fontSize: '0.85rem', color: '#f39c12', marginTop: '0.25rem', marginBottom: 0, fontStyle: 'italic' }}>
                    ⚠️ Changing the time may affect registered attendees
                  </p>
                )}
                {validationErrors.endTime && (
                  <p style={{ fontSize: '0.85rem', color: '#e74c3c', marginTop: '0.25rem', marginBottom: 0 }}>
                    {validationErrors.endTime}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  required
                  min="1"
                />
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                />
              </div>
              <div className="form-group full-width">
                <label>Event Image (Optional)</label>
                <input
                  key={fileInputKey}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input"
                />
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData((prev) => ({ ...prev, imageUrl: '' }));
                        setFileInputKey(prev => prev + 1); // Reset file input
                        // When removing image during edit, also clear originalImageUrl tracking
                        if (editingEventId) {
                          setOriginalImageUrl(null);
                        }
                      }}
                      className="btn-remove-image"
                    >
                      Remove Image
                    </button>
                  </div>
                )}
                <p className="image-help">Max file size: 10MB (will be compressed automatically). Supported formats: JPG, PNG, GIF</p>
              </div>
            </div>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? (editingEventId ? 'Updating...' : 'Creating...')
                : (editingEventId ? 'Update Event' : 'Create Event')}
            </button>
          </form>
        )}

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

          {(() => {
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
              <>
                <div className="events-list">
                  {currentEvents.length === 0 ? (
                    <div className="no-events">
                      <p>{searchQuery ? 'No events found matching your search.' : 'No events found.'}</p>
                    </div>
                  ) : (
                    currentEvents.map((event: any) => (
                      <div key={event.id} className="event-item">
                        {event.imageUrl && event.imageUrl.trim() !== '' && (
                          <div className="event-item-image">
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
                        <div className="event-item-content">
                          <h3>{event.title}</h3>
                          <p>{event.description}</p>
                          <p>{new Date(event.startDate).toLocaleString()}</p>
                          <p>{event.location}</p>
                          <p>Registered: {event.registeredCount} / {event.capacity}</p>
                          <div className="event-item-actions">
                            <button 
                              onClick={() => handleEdit(event)} 
                              className="btn-edit"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete "${event.title}"? This action cannot be undone.`)) {
                                  deleteMutation.mutate(event.id);
                                }
                              }} 
                              className="btn-delete"
                              disabled={deleteMutation.isPending}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
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
            );
          })()}
        </div>
      </div>
    </Layout>
  );
};

export default EventManagement;

