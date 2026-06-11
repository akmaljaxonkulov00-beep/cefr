import { IsString, IsOptional, IsInt, IsEnum, IsBoolean, IsNumber, IsObject } from 'class-validator';

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

  @IsOptional()
  @IsObject()
  sections?: {
    listening?: {
      title?: string;
      audioKey?: string;
      audioUrl?: string;
      duration?: number;
      parts?: any[];
    };
    reading?: {
      title?: string;
      pdfKey?: string;
      pdfUrl?: string;
      duration?: number;
      passages?: any[];
    };
    writing?: {
      title?: string;
      duration?: number;
      tasks?: any[];
    };
    speaking?: {
      title?: string;
      duration?: number;
      parts?: any[];
    };
  };
}
