import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateIeltsAttemptDto {
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

export class SubmitIeltsAttemptDto {
  @IsString()
  attemptId: string;

  @IsObject()
  answers: any;
}
