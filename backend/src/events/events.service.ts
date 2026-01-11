import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
    private emailService: EmailService,
  ) {}

  async create(createEventDto: CreateEventDto, organizerId: string | number): Promise<Event> {
    const orgId = typeof organizerId === 'string' ? parseInt(organizerId, 10) : organizerId;
    if (isNaN(orgId)) {
      throw new BadRequestException('Invalid organizer ID');
    }
    const event = this.eventsRepository.create({
      ...createEventDto,
      organizerId: orgId,
      isActive: true, // Explicitly set to true so events show up on attendee side
    });
    return this.eventsRepository.save(event);
  }

  async findAll(filters?: {
    search?: string;
    organizerId?: string | number;
    isActive?: boolean;
  }): Promise<Event[]> {
    const query = this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .leftJoinAndSelect('event.tickets', 'tickets');

    if (filters?.search) {
      query.where(
        '(event.title LIKE :search OR event.description LIKE :search OR event.location LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.organizerId) {
      const orgId = typeof filters.organizerId === 'string' ? parseInt(filters.organizerId, 10) : filters.organizerId;
      if (!isNaN(orgId)) {
        query.andWhere('event.organizerId = :organizerId', {
          organizerId: orgId,
        });
      }
    }

    if (filters?.isActive !== undefined) {
      query.andWhere('event.isActive = :isActive', {
        isActive: filters.isActive ? 1 : 0,
      });
    }

    query.orderBy('event.startDate', 'ASC');

    return query.getMany();
  }

  async findOne(id: string | number): Promise<Event> {
    const eventId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(eventId)) {
      throw new NotFoundException('Invalid event ID');
    }
    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
      relations: ['organizer', 'tickets', 'tickets.attendee'],
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async update(id: string | number, updateEventDto: UpdateEventDto, userId: string | number, userRole: string): Promise<Event> {
    const event = await this.findOne(id);
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    // Only organizer or admin can update
    if (userRole !== 'admin' && event.organizerId !== userIdNum) {
      throw new BadRequestException('You do not have permission to update this event');
    }

    const hasRegistrations = event.registeredCount > 0;

    // Constraint: Event date is editable only before first registration
    if (hasRegistrations && (updateEventDto.startDate || updateEventDto.endDate)) {
      throw new BadRequestException('Event date cannot be changed after registrations have been made');
    }

    // Constraint: Event location is editable before registration
    if (hasRegistrations && updateEventDto.location) {
      throw new BadRequestException('Event location cannot be changed after registrations have been made');
    }

    // Store original values for comparison
    const originalTitle = event.title;
    const originalDescription = event.description;
    const originalLocation = event.location;
    const originalStartDate = event.startDate;
    const originalEndDate = event.endDate;
    const originalCapacity = event.capacity;
    const originalImageUrl = event.imageUrl;

    // Update event fields - update if provided (even if empty string for strings, but not for dates)
    if (updateEventDto.title !== undefined) {
      event.title = updateEventDto.title.trim();
    }
    if (updateEventDto.description !== undefined) {
      event.description = updateEventDto.description.trim();
    }
    if (updateEventDto.location !== undefined) {
      event.location = updateEventDto.location.trim();
    }
    if (updateEventDto.startDate !== undefined && updateEventDto.startDate !== '') {
      event.startDate = new Date(updateEventDto.startDate);
    }
    if (updateEventDto.endDate !== undefined && updateEventDto.endDate !== '') {
      event.endDate = new Date(updateEventDto.endDate);
    }
    if (updateEventDto.capacity !== undefined && updateEventDto.capacity !== null && !isNaN(updateEventDto.capacity)) {
      event.capacity = updateEventDto.capacity;
    }
    // imageUrl can be null (to remove image) or a string (to set image) or undefined (to keep existing)
    if (updateEventDto.imageUrl !== undefined) {
      event.imageUrl = updateEventDto.imageUrl;
    }

    // Log changes for debugging
    console.log('Updating event:', {
      id: event.id,
      changes: {
        title: originalTitle !== event.title ? `${originalTitle} -> ${event.title}` : 'unchanged',
        description: originalDescription !== event.description ? 'changed' : 'unchanged',
        location: originalLocation !== event.location ? `${originalLocation} -> ${event.location}` : 'unchanged',
        startDate: originalStartDate.toISOString() !== event.startDate.toISOString() ? 'changed' : 'unchanged',
        endDate: originalEndDate.toISOString() !== event.endDate.toISOString() ? 'changed' : 'unchanged',
        capacity: originalCapacity !== event.capacity ? `${originalCapacity} -> ${event.capacity}` : 'unchanged',
        imageUrl: originalImageUrl !== event.imageUrl ? 'changed' : 'unchanged',
      },
      updateDto: updateEventDto,
    });

    const savedEvent = await this.eventsRepository.save(event);
    console.log('Event saved successfully:', savedEvent.id);
    return savedEvent;
  }

  async remove(id: string | number, userId: string | number, userRole: string): Promise<void> {
    const event = await this.findOne(id);
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    // Only organizer or admin can delete
    if (userRole !== 'admin' && event.organizerId !== userIdNum) {
      throw new BadRequestException('You do not have permission to delete this event');
    }

    // Prevent deletion if event has registrations
    if (event.registeredCount > 0) {
      throw new BadRequestException('Cannot delete event with registrations. Please cancel the event instead.');
    }

    await this.eventsRepository.remove(event);
  }

  async cancel(id: string | number, userId: string | number, userRole: string): Promise<void> {
    const event = await this.findOne(id);
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    // Only organizer or admin can cancel
    if (userRole !== 'admin' && event.organizerId !== userIdNum) {
      throw new BadRequestException('You do not have permission to cancel this event');
    }

    // Send cancellation emails to all registered users before deleting
    if (event.registeredCount > 0) {
      const eventIdNum = typeof id === 'string' ? parseInt(id, 10) : id;
      const tickets = await this.ticketsRepository
        .createQueryBuilder('ticket')
        .leftJoinAndSelect('ticket.attendee', 'attendee')
        .where('ticket.eventId = :eventId', { eventId: eventIdNum })
        .getMany();

      const attendeeEmails = tickets
        .map(ticket => ticket.attendee?.email)
        .filter(email => email) as string[];

      if (attendeeEmails.length > 0) {
        try {
          await this.emailService.sendEventCancellation(
            attendeeEmails,
            event.title,
            event.startDate,
            event.location,
          );
        } catch (error) {
          console.error('Error sending cancellation emails:', error);
          // Don't throw - deletion should still proceed even if emails fail
        }
      }
    }

    // Delete tickets first
    await this.ticketsRepository.delete({ eventId: event.id });
    
    // Delete the event
    await this.eventsRepository.remove(event);
  }

  async deleteCancelledEvents(): Promise<number> {
    // Find events cancelled more than 1 hour ago
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const cancelledEvents = await this.eventsRepository
      .createQueryBuilder('event')
      .where('event.cancelledAt IS NOT NULL')
      .andWhere('event.cancelledAt < :cutoff', { cutoff: oneHourAgo })
      .getMany();

    if (cancelledEvents.length === 0) {
      return 0;
    }

    // Delete tickets first
    for (const event of cancelledEvents) {
      await this.ticketsRepository.delete({ eventId: event.id });
    }

    // Delete events
    const result = await this.eventsRepository.delete(
      cancelledEvents.map(e => e.id),
    );

    return result.affected || 0;
  }

  async incrementRegisteredCount(eventId: string | number): Promise<void> {
    const id = typeof eventId === 'string' ? parseInt(eventId, 10) : eventId;
    if (isNaN(id)) {
      throw new BadRequestException('Invalid event ID');
    }
    await this.eventsRepository.increment({ id }, 'registeredCount', 1);
  }

  async decrementRegisteredCount(eventId: string | number): Promise<void> {
    const id = typeof eventId === 'string' ? parseInt(eventId, 10) : eventId;
    if (isNaN(id)) {
      throw new BadRequestException('Invalid event ID');
    }
    await this.eventsRepository.decrement({ id }, 'registeredCount', 1);
  }
}

