import { IsString, IsNotEmpty, IsDateString, IsNumber, Min, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  @Min(1)
  capacity: number;

  @Transform(({ value }) => {
    if (value === '' || value === null) {
      return undefined;
    }
    return value;
  })
  @ValidateIf((o) => o.imageUrl !== undefined)
  @IsString()
  @IsNotEmpty()
  imageUrl?: string;
}

