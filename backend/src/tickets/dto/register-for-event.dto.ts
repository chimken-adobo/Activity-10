import { IsString, IsNotEmpty } from 'class-validator';

export class RegisterForEventDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;
}

