import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { EventsService } from '../events/events.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { RegisterForEventDto } from './dto/register-for-event.dto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
    private eventsService: EventsService,
    private usersService: UsersService,
    private emailService: EmailService,
  ) {}

  async registerForEvent(
    registerDto: RegisterForEventDto,
    attendeeId: string,
  ): Promise<Ticket> {
    const event = await this.eventsService.findOne(registerDto.eventId);

    // Check if event is active
    if (!event.isActive) {
      throw new BadRequestException('Event is not active');
    }

    // Check capacity
    if (event.registeredCount >= event.capacity) {
      throw new BadRequestException('Event is at full capacity');
    }

    // Check for duplicate registration
    const existingTicket = await this.ticketsRepository.findOne({
      where: {
        eventId: registerDto.eventId,
        attendeeId: attendeeId,
        status: TicketStatus.CONFIRMED,
      },
    });

    if (existingTicket) {
      throw new BadRequestException('You are already registered for this event');
    }

    // Generate unique ticket ID
    const ticketId = `TICKET-${uuidv4().toUpperCase().substring(0, 8)}`;

    // Generate QR code
    const qrCodeData = JSON.stringify({
      ticketId,
      eventId: event.id,
      attendeeId,
    });
    const qrCode = await QRCode.toDataURL(qrCodeData);

    // Create ticket
    const ticket = this.ticketsRepository.create({
      ticketId,
      qrCode,
      eventId: registerDto.eventId,
      attendeeId,
      status: TicketStatus.CONFIRMED,
    });

    const savedTicket = await this.ticketsRepository.save(ticket);

    // Increment registered count
    await this.eventsService.incrementRegisteredCount(event.id);

    // Get attendee info for email
    const attendee = await this.usersService.findOne(attendeeId);

    // Send confirmation email
    await this.emailService.sendTicketConfirmation(
      attendee.email,
      attendee.name,
      event,
      savedTicket,
    );

    return this.findOne(savedTicket.id);
  }

  async findAll(filters?: {
    eventId?: string;
    attendeeId?: string;
    status?: TicketStatus;
  }): Promise<Ticket[]> {
    const query = this.ticketsRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.event', 'event')
      .leftJoinAndSelect('ticket.attendee', 'attendee');

    if (filters?.eventId) {
      query.andWhere('ticket.eventId = :eventId', { eventId: filters.eventId });
    }

    if (filters?.attendeeId) {
      query.andWhere('ticket.attendeeId = :attendeeId', {
        attendeeId: filters.attendeeId,
      });
    }

    if (filters?.status) {
      query.andWhere('ticket.status = :status', { status: filters.status });
    }

    query.orderBy('ticket.createdAt', 'DESC');

    return query.getMany();
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ['event', 'attendee'],
    });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  async findByTicketId(ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { ticketId },
      relations: ['event', 'attendee'],
    });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  async verifyTicket(ticketId: string): Promise<Ticket> {
    const ticket = await this.findByTicketId(ticketId);

    if (ticket.status === TicketStatus.CANCELLED) {
      throw new BadRequestException('Ticket has been cancelled');
    }

    if (ticket.status === TicketStatus.CHECKED_IN) {
      throw new BadRequestException('Ticket has already been checked in');
    }

    ticket.status = TicketStatus.CHECKED_IN;
    ticket.checkedInAt = new Date();

    return this.ticketsRepository.save(ticket);
  }

  async cancelTicket(id: string, attendeeId: string): Promise<Ticket> {
    const ticket = await this.findOne(id);

    if (ticket.attendeeId !== attendeeId) {
      throw new BadRequestException('You can only cancel your own tickets');
    }

    if (ticket.status === TicketStatus.CHECKED_IN) {
      throw new BadRequestException('Cannot cancel a checked-in ticket');
    }

    if (ticket.status === TicketStatus.CANCELLED) {
      throw new BadRequestException('Ticket is already cancelled');
    }

    ticket.status = TicketStatus.CANCELLED;

    const savedTicket = await this.ticketsRepository.save(ticket);

    // Decrement registered count
    await this.eventsService.decrementRegisteredCount(ticket.eventId);

    return savedTicket;
  }

  async updateTicket(id: string, updateData: Partial<Ticket>): Promise<Ticket> {
    await this.ticketsRepository.update(id, updateData);
    return this.findOne(id);
  }
}

