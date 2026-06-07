import { IsInt, IsOptional, IsObject, IsArray } from 'class-validator';

export class UpdateListeningSectionDto {
  @IsInt()
  @IsOptional()
  duration?: number;

  @IsArray()
  @IsOptional()
  sections?: any[];
}

export class UpdateReadingSectionDto {
  @IsInt()
  @IsOptional()
  duration?: number;

  @IsArray()
  @IsOptional()
  passages?: any[];
}

export class UpdateWritingSectionDto {
  @IsInt()
  @IsOptional()
  duration?: number;

  @IsObject()
  @IsOptional()
  task11?: any;

  @IsObject()
  @IsOptional()
  task12?: any;

  @IsObject()
  @IsOptional()
  task2?: any;

  @IsObject()
  @IsOptional()
  aiWeights?: any;
}

export class UpdateSpeakingSectionDto {
  @IsObject()
  @IsOptional()
  task1?: any;

  @IsObject()
  @IsOptional()
  task2?: any;

  @IsObject()
  @IsOptional()
  task3?: any;
}
