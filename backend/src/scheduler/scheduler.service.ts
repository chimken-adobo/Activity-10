import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventsService } from '../events/events.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  constructor(private eventsService: EventsService) {}

  onModuleInit() {
    // Run cleanup every hour
    setInterval(async () => {
      try {
        const deletedCount = await this.eventsService.deleteCancelledEvents();
        if (deletedCount > 0) {
          console.log(`Deleted ${deletedCount} cancelled event(s) after 1 hour`);
        }
      } catch (error) {
        console.error('Error deleting cancelled events:', error);
      }
    }, 60 * 60 * 1000); // 1 hour in milliseconds

    // Run immediately on startup
    this.eventsService.deleteCancelledEvents().catch(error => {
      console.error('Error running initial cleanup:', error);
    });
  }
}
