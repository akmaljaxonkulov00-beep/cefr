import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AiQuestionsService } from './ai-questions.service';

@Controller('ai-questions')
export class AiQuestionsController {
  constructor(private readonly aiQuestionsService: AiQuestionsService) {}

  // AI Speaking Questions
  @Get('speaking')
  async getSpeakingQuestions(
    @Query('part') part?: string,
    @Query('cefrLevel') cefrLevel?: string,
    @Query('isActive') isActive?: string,
  ) {
    const filters: any = {};
    if (part) filters.part = parseInt(part);
    if (cefrLevel) filters.cefrLevel = cefrLevel;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    return this.aiQuestionsService.getSpeakingQuestions(filters);
  }

  @Get('speaking/:id')
  async getSpeakingQuestionById(@Param('id') id: string) {
    return this.aiQuestionsService.getSpeakingQuestionById(id);
  }

  @Post('speaking')
  async createSpeakingQuestion(@Body() data: any) {
    return this.aiQuestionsService.createSpeakingQuestion(data);
  }

  @Put('speaking/:id')
  async updateSpeakingQuestion(@Param('id') id: string, @Body() data: any) {
    return this.aiQuestionsService.updateSpeakingQuestion(id, data);
  }

  @Delete('speaking/:id')
  async deleteSpeakingQuestion(@Param('id') id: string) {
    return this.aiQuestionsService.deleteSpeakingQuestion(id);
  }

  @Put('speaking/:id/toggle')
  async toggleSpeakingQuestionActive(@Param('id') id: string) {
    return this.aiQuestionsService.toggleSpeakingQuestionActive(id);
  }

  @Delete('speaking/bulk')
  async bulkDeleteSpeakingQuestions(@Body('ids') ids: string[]) {
    return this.aiQuestionsService.bulkDeleteSpeakingQuestions(ids);
  }

  // AI Writing Questions
  @Get('writing')
  async getWritingQuestions(
    @Query('task') task?: string,
    @Query('cefrLevel') cefrLevel?: string,
    @Query('isActive') isActive?: string,
  ) {
    const filters: any = {};
    if (task) filters.task = parseInt(task);
    if (cefrLevel) filters.cefrLevel = cefrLevel;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    return this.aiQuestionsService.getWritingQuestions(filters);
  }

  @Get('writing/:id')
  async getWritingQuestionById(@Param('id') id: string) {
    return this.aiQuestionsService.getWritingQuestionById(id);
  }

  @Post('writing')
  async createWritingQuestion(@Body() data: any) {
    return this.aiQuestionsService.createWritingQuestion(data);
  }

  @Put('writing/:id')
  async updateWritingQuestion(@Param('id') id: string, @Body() data: any) {
    return this.aiQuestionsService.updateWritingQuestion(id, data);
  }

  @Delete('writing/:id')
  async deleteWritingQuestion(@Param('id') id: string) {
    return this.aiQuestionsService.deleteWritingQuestion(id);
  }

  @Put('writing/:id/toggle')
  async toggleWritingQuestionActive(@Param('id') id: string) {
    return this.aiQuestionsService.toggleWritingQuestionActive(id);
  }

  @Delete('writing/bulk')
  async bulkDeleteWritingQuestions(@Body('ids') ids: string[]) {
    return this.aiQuestionsService.bulkDeleteWritingQuestions(ids);
  }
}
