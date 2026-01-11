import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';

export enum TicketStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  CANCELLED = 'cancelled',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  ticketId: string;

  @Column('text')
  qrCode: string;

  @Column({
    type: 'varchar',
    default: TicketStatus.CONFIRMED,
  })
  status: TicketStatus;

  @ManyToOne(() => User, (user) => user.tickets)
  @JoinColumn({ name: 'attendeeId' })
  attendee: User;

  @Column()
  attendeeId: number;

  @ManyToOne(() => Event, (event) => event.tickets)
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column()
  eventId: number;

  @Column({ nullable: true })
  checkedInAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

