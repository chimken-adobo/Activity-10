import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { RegisterForEventDto } from './dto/register-for-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TicketStatus } from './entities/ticket.entity';
import { UserRole } from '../users/entities/user.entity';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterForEventDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.registerForEvent(registerDto, user.id);
  }

  @Get()
  async findAll(
    @Query('eventId') eventId?: string,
    @Query('attendeeId') attendeeId?: string,
    @Query('status') status?: TicketStatus,
    @CurrentUser() user?: any,
  ) {
    // If not admin/organizer, only show own tickets
    if (user.role === UserRole.ATTENDEE) {
      return this.ticketsService.findAll({
        attendeeId: user.id,
        status,
      });
    }

    return this.ticketsService.findAll({
      eventId,
      attendeeId,
      status,
    });
  }

  @Get('my-tickets')
  async getMyTickets(@CurrentUser() user: any) {
    return this.ticketsService.findAll({
      attendeeId: user.id,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Post('verify/:ticketId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  async verifyTicket(@Param('ticketId') ticketId: string) {
    return this.ticketsService.verifyTicket(ticketId);
  }

  @Patch(':id/cancel')
  async cancelTicket(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ticketsService.cancelTicket(id, user.id);
  }
}

