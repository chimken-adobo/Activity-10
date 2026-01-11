import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
  ) {}

  async create(createEventDto: CreateEventDto, organizerId: string): Promise<Event> {
    const event = this.eventsRepository.create({
      ...createEventDto,
      organizerId,
    });
    return this.eventsRepository.save(event);
  }

  async findAll(filters?: {
    search?: string;
    organizerId?: string;
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
      query.andWhere('event.organizerId = :organizerId', {
        organizerId: filters.organizerId,
      });
    }

    if (filters?.isActive !== undefined) {
      query.andWhere('event.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    query.orderBy('event.startDate', 'ASC');

    return query.getMany();
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: ['organizer', 'tickets', 'tickets.attendee'],
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto, userId: string, userRole: string): Promise<Event> {
    const event = await this.findOne(id);
    
    // Only organizer or admin can update
    if (userRole !== 'admin' && event.organizerId !== userId) {
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

    Object.assign(event, updateEventDto);
    return this.eventsRepository.save(event);
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const event = await this.findOne(id);
    
    // Only organizer or admin can delete
    if (userRole !== 'admin' && event.organizerId !== userId) {
      throw new BadRequestException('You do not have permission to delete this event');
    }

    await this.eventsRepository.remove(event);
  }

  async incrementRegisteredCount(eventId: string): Promise<void> {
    await this.eventsRepository.increment({ id: eventId }, 'registeredCount', 1);
  }

  async decrementRegisteredCount(eventId: string): Promise<void> {
    await this.eventsRepository.decrement({ id: eventId }, 'registeredCount', 1);
  }
}

