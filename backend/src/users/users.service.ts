import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Event } from '../events/entities/event.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    // Check if user already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Note: Password should already be hashed when passed from auth service
    // Only hash if it's a plain text password (check if it's already hashed)
    if (userData.password && !userData.password.startsWith('$2b$') && !userData.password.startsWith('$2a$')) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    // Set default values
    const user = this.usersRepository.create({
      ...userData,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
    });
    return this.usersRepository.save(user);
  }

  async findAll(role?: UserRole): Promise<any[]> {
    let users: User[];
    if (role) {
      users = await this.usersRepository.find({ where: { role } });
    } else {
      users = await this.usersRepository.find();
    }
    
    // Add event and ticket counts for each user
    return Promise.all(users.map(async (user) => {
      const eventCount = await this.eventsRepository.count({ where: { organizerId: user.id } });
      const ticketCount = await this.ticketsRepository.count({ where: { attendeeId: user.id } });
      return {
        ...user,
        eventCount,
        ticketCount,
      };
    }));
  }

  async findOne(id: string | number): Promise<User> {
    const userId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(userId)) {
      throw new NotFoundException('Invalid user ID');
    }
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string | number, userData: Partial<User>): Promise<User> {
    const userId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(userId)) {
      throw new NotFoundException('Invalid user ID');
    }
    await this.usersRepository.update(userId, userData);
    return this.findOne(userId);
  }

  async remove(id: string | number): Promise<void> {
    const userId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(userId)) {
      throw new NotFoundException('Invalid user ID');
    }
    const result = await this.usersRepository.delete(userId);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async toggleActive(id: string | number): Promise<User> {
    const user = await this.findOne(id);
    
    // Only allow toggle for Attendee and Organizer roles
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot activate/deactivate admin users');
    }
    
    // Check if trying to deactivate
    if (user.isActive) {
      if (user.role === UserRole.ORGANIZER) {
        // Check if organizer has any events
        const eventCount = await this.eventsRepository.count({ where: { organizerId: user.id } });
        if (eventCount > 0) {
          throw new BadRequestException(`Cannot deactivate organizer with ${eventCount} posted event(s)`);
        }
      } else if (user.role === UserRole.ATTENDEE) {
        // Check if attendee has any registered events (tickets)
        const ticketCount = await this.ticketsRepository.count({ where: { attendeeId: user.id } });
        if (ticketCount > 0) {
          throw new BadRequestException(`Cannot deactivate attendee with ${ticketCount} registered event(s)`);
        }
      }
    }
    
    user.isActive = !user.isActive;
    return this.usersRepository.save(user);
  }
}

