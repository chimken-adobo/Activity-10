import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('organizerId') organizerId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.eventsService.findAll({
      search,
      organizerId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  async create(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() user: any,
  ) {
    return this.eventsService.create(createEventDto, user.id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(@Param('id') id: string, @CurrentUser() user: any) {
    await this.eventsService.cancel(id, user.id, user.role);
    return { message: 'Event cancelled and deleted successfully' };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: any,
  ) {
    console.log('Received update request:', { id, updateEventDto });
    
    // Convert empty string to null for imageUrl to allow image removal
    if (updateEventDto.imageUrl === '') {
      updateEventDto.imageUrl = null;
    }
    // Remove empty strings to avoid validation issues
    if (updateEventDto.title === '') {
      delete updateEventDto.title;
    }
    if (updateEventDto.description === '') {
      delete updateEventDto.description;
    }
    if (updateEventDto.location === '') {
      delete updateEventDto.location;
    }
    if (updateEventDto.startDate === '') {
      delete updateEventDto.startDate;
    }
    if (updateEventDto.endDate === '') {
      delete updateEventDto.endDate;
    }
    if (updateEventDto.capacity === null || updateEventDto.capacity === undefined) {
      delete updateEventDto.capacity;
    }
    
    console.log('Processed update DTO:', updateEventDto);
    return this.eventsService.update(id, updateEventDto, user.id, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.eventsService.remove(id, user.id, user.role);
  }
}

