import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';
import { IsString, IsOptional, ValidateIf } from 'class-validator';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  // For updates, allow null to remove image (empty string will be converted in controller)
  @ValidateIf((o) => o.imageUrl !== undefined && o.imageUrl !== null && o.imageUrl !== '')
  @IsOptional()
  @IsString()
  imageUrl?: string | null;
}

