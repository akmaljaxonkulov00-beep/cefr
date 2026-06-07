import { IsString, IsOptional, IsInt, IsEnum, IsBoolean, IsNumber } from 'class-validator';

export class CreateIeltsMockDto {
  @IsString()
  title: string;

  @IsEnum(['Academic', 'General'])
  type: 'Academic' | 'General';

  @IsEnum(['B1', 'B2', 'C1', 'C2'])
  level: 'B1' | 'B2' | 'C1' | 'C2';

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  duration: number; // total duration in minutes

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}
