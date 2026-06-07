import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateCefrAttemptDto {
  @IsString()
  mockId: string;

  @IsOptional()
  @IsObject()
  listeningAnswers?: any;

  @IsOptional()
  @IsObject()
  readingAnswers?: any;

  @IsOptional()
  @IsObject()
  writingAnswers?: any;

  @IsOptional()
  @IsObject()
  speakingAnswers?: any;
}

export class SubmitCefrAttemptDto {
  @IsString()
  attemptId: string;

  @IsObject()
  answers: any;
}
