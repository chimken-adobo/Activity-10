import { IsString, IsNotEmpty, IsDateString, IsNumber, Min, Max, ValidateIf, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
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
  @Max(5000)
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

