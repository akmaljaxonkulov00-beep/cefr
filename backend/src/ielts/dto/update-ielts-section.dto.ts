import { IsOptional, IsObject, IsInt, IsArray } from 'class-validator';

export class UpdateListeningSectionDto {
  @IsOptional()
  @IsInt()
  duration?: number;

  @IsOptional()
  @IsArray()
  sections?: any[];
}

export class UpdateReadingSectionDto {
  @IsOptional()
  @IsInt()
  duration?: number;

  @IsOptional()
  @IsArray()
  passages?: any[];
}

export class UpdateWritingSectionDto {
  @IsOptional()
  @IsInt()
  duration?: number;

  @IsOptional()
  @IsObject()
  task1?: any;

  @IsOptional()
  @IsObject()
  task2?: any;

  @IsOptional()
  @IsObject()
  aiWeights?: any;
}

export class UpdateSpeakingSectionDto {
  @IsOptional()
  @IsObject()
  part1?: any;

  @IsOptional()
  @IsObject()
  part2?: any;

  @IsOptional()
  @IsObject()
  part3?: any;
}
