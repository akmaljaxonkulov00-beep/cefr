import { IsString, IsOptional, IsInt, IsEnum, IsBoolean, IsNumber } from 'class-validator';

export class CreateCefrMockDto {
  @IsString()
  title: string;

  @IsEnum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  duration?: number; // total duration in minutes

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}
