import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  location: string;

  @Column('datetime')
  startDate: Date;

  @Column('datetime')
  endDate: Date;

  @Column({ default: 0 })
  capacity: number;

  @Column({ default: 0 })
  registeredCount: number;

  @Column({
    type: 'integer',
    default: 1,
    transformer: {
      to: (value: boolean) => value ? 1 : 0,
      from: (value: number) => value === 1,
    },
  })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  imageUrl: string;

  @Column({ type: 'datetime', nullable: true })
  cancelledAt: Date;

  @ManyToOne(() => User, (user) => user.events)
  @JoinColumn({ name: 'organizerId' })
  organizer: User;

  @Column()
  organizerId: number;

  @OneToMany(() => Ticket, (ticket) => ticket.event)
  tickets: Ticket[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

