import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { eventsApi } from '../services/api';
import './OrganizerDashboard.css';

const OrganizerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
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
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
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
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<any | null>(null);
  const [confirmCancelEvent, setConfirmCancelEvent] = useState<any | null>(null);

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
    queryKey: ['events'],
    queryFn: () => eventsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => eventsApi.create(data),
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
      alert('Event created successfully!');
    },
    onError: (error: any) => {
      console.error('Error creating event:', error);
      alert(error?.response?.data?.message || 'Failed to create event. Please try again.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      console.log('Updating event with ID:', id, 'Data:', data);
      return eventsApi.update(id, data);
    },
    onSuccess: async (response) => {
      console.log('Update successful, response:', response);
      const updatedEventId = String(response.id || editingEventId);
      // Update the cache directly with the updated event
      queryClient.setQueryData(['events'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((event: any) => 
          String(event.id) === updatedEventId ? response : event
        );
      });
      // Invalidate all event-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['events'], exact: false });
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
      navigate('/organizer-dashboard', { replace: true }); // Clear location state
      alert('Event updated successfully!');
    },
    onError: (error: any) => {
      console.error('Error updating event:', error);
      console.error('Error response:', error?.response);
      alert(error?.response?.data?.message || 'Failed to update event. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setConfirmDeleteEvent(null);
      // Reset to first page if we're on a page that might become empty
      setCurrentPage(1);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to delete event. Please try again.');
      console.error('Error deleting event:', error);
      setConfirmDeleteEvent(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => eventsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setConfirmCancelEvent(null);
      alert('Event cancelled successfully. All registered users have been notified via email.');
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Failed to cancel event. Please try again.');
      console.error('Error cancelling event:', error);
      setConfirmCancelEvent(null);
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

  // Check if event starts today
  const isEventToday = (event: any) => {
    if (!event || !event.startDate) return false;
    const eventDate = new Date(event.startDate);
    const today = new Date();
    return (
      eventDate.getFullYear() === today.getFullYear() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getDate() === today.getDate()
    );
  };

  const handleEdit = (event: any) => {
    setEditingEventId(event.id);
    setEditingEvent(event);
    // Split dates into date and time components using local time to avoid timezone conversion
    const startDateObj = new Date(event.startDate);
    const endDateObj = new Date(event.endDate);
    
    // Use local time methods instead of UTC to preserve the original time
    const startYear = startDateObj.getFullYear();
    const startMonth = String(startDateObj.getMonth() + 1).padStart(2, '0');
    const startDay = String(startDateObj.getDate()).padStart(2, '0');
    const startHours = String(startDateObj.getHours()).padStart(2, '0');
    const startMinutes = String(startDateObj.getMinutes()).padStart(2, '0');
    
    const endYear = endDateObj.getFullYear();
    const endMonth = String(endDateObj.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDateObj.getDate()).padStart(2, '0');
    const endHours = String(endDateObj.getHours()).padStart(2, '0');
    const endMinutes = String(endDateObj.getMinutes()).padStart(2, '0');
    
    const startDate = `${startYear}-${startMonth}-${startDay}`;
    const startTime = `${startHours}:${startMinutes}`;
    const endDate = `${endYear}-${endMonth}-${endDay}`;
    const endTime = `${endHours}:${endMinutes}`;
    
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

  // Check if we came from EventDetails page with editEventId
  useEffect(() => {
    const editEventId = (location.state as any)?.editEventId;
    if (editEventId && events && !editingEventId) {
      const eventToEdit = events.find((e: any) => e.id === editEventId);
      if (eventToEdit) {
        handleEdit(eventToEdit);
        // Clear location state after using it
        navigate('/organizer-dashboard', { replace: true, state: {} });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, events, navigate]);

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

  const validateDates = () => {
    const errors: typeof validationErrors = {};
    
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
    
    // Validate title length
    if (formData.title.trim().length < 3) {
      alert('Title must be at least 3 characters long');
      return;
    }
    if (formData.title.length > 50) {
      alert('Title cannot exceed 50 characters');
      return;
    }
    
    // Validate description length
    if (formData.description.trim().length < 10) {
      alert('Description must be at least 10 characters long');
      return;
    }
    if (formData.description.length > 1000) {
      alert('Description cannot exceed 1000 characters');
      return;
    }
    
    // Validate dates
    if (!validateDates()) {
      return;
    }
    
    // Combine date and time
    const startDateTime = combineDateTime(formData.startDate, formData.startTime);
    const endDateTime = combineDateTime(formData.endDate, formData.endTime);
    
    // Validate that dates are not empty
    if (!startDateTime || !endDateTime) {
      alert('Please fill in all date and time fields');
      return;
    }
    
    // Validate capacity
    const capacityNum = parseInt(formData.capacity);
    if (isNaN(capacityNum) || capacityNum < 1 || capacityNum > 5000) {
      alert('Please enter a valid capacity (between 1 and 5000)');
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
          // Image was removed
          submitData.imageUrl = '';
        }
      }
    } else {
      // When creating: only include if provided
      if (formData.imageUrl && formData.imageUrl.trim() !== '') {
        submitData.imageUrl = formData.imageUrl;
      }
    }
    
    console.log('Submitting event data:', submitData);
    console.log('Editing event ID:', editingEventId);
    
    if (editingEventId) {
      updateMutation.mutate({ id: String(editingEventId), data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <Layout>
      <div className="organizer-dashboard">
        <div className="page-header">
          <h1>Organizer Dashboard</h1>
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
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 50) {
                      setFormData({ ...formData, title: value });
                    }
                  }}
                  required
                  maxLength={50}
                  minLength={3}
                  disabled={editingEventId && editingEvent && isEventToday(editingEvent)}
                />
                <div className="character-count">
                  <span className={formData.title.length > 0 && formData.title.length < 3 ? 'character-count-warning' : ''}>
                    {formData.title.length} / 50 characters
                  </span>
                  {formData.title.length > 0 && formData.title.length < 3 && (
                    <span className="character-count-error"> (Minimum 3 characters required)</span>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  disabled={editingEventId && editingEvent && isEventToday(editingEvent)}
                />
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    setFormData({ ...formData, startDate: newStartDate });
                    // If end date is before new start date, update it to match start date
                    if (formData.endDate && newStartDate && formData.endDate < newStartDate) {
                      setFormData(prev => ({ ...prev, startDate: newStartDate, endDate: newStartDate }));
                    }
                  }}
                  min={getCurrentDate()}
                  required
                  disabled={(editingEventId && editingEvent && editingEvent.registeredCount > 0) || (editingEventId && editingEvent && isEventToday(editingEvent))}
                />
              </div>
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => {
                    const newStartTime = e.target.value;
                    setFormData({ ...formData, startTime: newStartTime });
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
                  disabled={(editingEventId && editingEvent && editingEvent.registeredCount > 0) || (editingEventId && editingEvent && isEventToday(editingEvent))}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={getMinEndDate()}
                  required
                  disabled={(editingEventId && editingEvent && editingEvent.registeredCount > 0) || (editingEventId && editingEvent && isEventToday(editingEvent))}
                />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  min={getMinEndTime()}
                  required
                  disabled={(editingEventId && editingEvent && editingEvent.registeredCount > 0) || (editingEventId && editingEvent && isEventToday(editingEvent))}
                />
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  required
                  min="1"
                  max="5000"
                  disabled={editingEventId && editingEvent && isEventToday(editingEvent)}
                />
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 1000) {
                      setFormData({ ...formData, description: value });
                    }
                  }}
                  required
                  rows={4}
                  maxLength={1000}
                  minLength={10}
                  disabled={editingEventId && editingEvent && isEventToday(editingEvent)}
                />
                <div className="character-count">
                  <span className={formData.description.length < 10 ? 'character-count-warning' : ''}>
                    {formData.description.length} / 1000 characters
                  </span>
                  {formData.description.length > 0 && formData.description.length < 10 && (
                    <span className="character-count-error"> (Minimum 10 characters required)</span>
                  )}
                </div>
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
                <div className="events-grid">
                  {currentEvents.length === 0 ? (
                    <div className="no-events">
                      <p>{searchQuery ? 'No events found matching your search.' : 'No events found.'}</p>
                    </div>
                  ) : (
                    currentEvents.map((event: any) => (
                      <div key={event.id} className="event-card">
                        <div className="event-card-content">
                          <div className="event-card-header">
                            <h3>{event.title}</h3>
                          </div>
                          <div className="event-card-details">
                            <div className="event-detail-item">
                              <div className="detail-content">
                                <span className="detail-label">Date</span>
                                <span className="detail-value">{new Date(event.startDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="event-detail-item">
                              <div className="detail-content">
                                <span className="detail-label">Location</span>
                                <span className="detail-value">{event.location}</span>
                              </div>
                            </div>
                            <div className="event-detail-item">
                              <div className="detail-content">
                                <span className="detail-label">Registration</span>
                                <span className="detail-value">Registered: {event.registeredCount} / {event.capacity}</span>
                              </div>
                            </div>
                            {event.organizer && (
                              <div className="event-detail-item">
                                <div className="detail-content">
                                  <span className="detail-label">Created By</span>
                                  <span className="detail-value">
                                    {event.organizer.role === 'admin' ? 'Admin' : event.organizer.role === 'organizer' ? 'Organizer' : event.organizer.role} - {event.organizer.name}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="event-card-actions">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(event);
                              }} 
                              className="btn-edit"
                            >
                              Edit
                            </button>
                            {event.registeredCount === 0 ? (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteEvent(event);
                                }} 
                                className="btn-delete"
                                disabled={deleteMutation.isPending}
                              >
                                Delete
                              </button>
                            ) : (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmCancelEvent(event);
                                }} 
                                className="btn-cancel"
                                disabled={cancelMutation.isPending}
                              >
                                Cancel
                              </button>
                            )}
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

        {/* Delete Confirmation Popup */}
        {confirmDeleteEvent && (
          <div className="confirm-popup-overlay" onClick={() => setConfirmDeleteEvent(null)}>
            <div className="confirm-popup-modal" onClick={(e) => e.stopPropagation()}>
              <div className="confirm-popup-content">
                <h3>Confirm Deletion</h3>
                <p>Are you sure you really want to delete "{confirmDeleteEvent.title}"?</p>
                <p className="confirm-warning">This action cannot be undone.</p>
                <div className="confirm-popup-actions">
                  <button
                    className="confirm-btn confirm-delete"
                    onClick={() => {
                      deleteMutation.mutate(confirmDeleteEvent.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    className="confirm-btn confirm-cancel"
                    onClick={() => setConfirmDeleteEvent(null)}
                    disabled={deleteMutation.isPending}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Popup */}
        {confirmCancelEvent && (
          <div className="confirm-popup-overlay" onClick={() => setConfirmCancelEvent(null)}>
            <div className="confirm-popup-modal" onClick={(e) => e.stopPropagation()}>
              <div className="confirm-popup-content">
                <h3>Cancel Event</h3>
                <p>Are you sure you really want to cancel "{confirmCancelEvent.title}"?</p>
                <p>This event has {confirmCancelEvent.registeredCount} registration(s). All registered users will be notified via email with an apology.</p>
                <p className="confirm-warning">This action cannot be undone.</p>
                <div className="confirm-popup-actions">
                  <button
                    className="confirm-btn confirm-cancel-action"
                    onClick={() => {
                      cancelMutation.mutate(confirmCancelEvent.id);
                    }}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel Event'}
                  </button>
                  <button
                    className="confirm-btn confirm-cancel"
                    onClick={() => setConfirmCancelEvent(null)}
                    disabled={cancelMutation.isPending}
                  >
                    No, Keep Event
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

export default OrganizerDashboard;

