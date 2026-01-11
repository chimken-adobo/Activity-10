import { IsString, IsOptional, IsDateString, IsNumber, Min, Max, MaxLength, MinLength } from 'class-validator';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5000)
  capacity?: number;

  // For updates, allow null to remove image (empty string will be converted in controller)
  @IsOptional()
  @IsString()
  imageUrl?: string | null;
}

