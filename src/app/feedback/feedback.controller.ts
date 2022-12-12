import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDTO } from './dto/createFeedback.dto';
import { UpdateFeedbackDTO } from './dto/updateFeedback.dto';
import { DeleteFeedbackByIdDTO } from './dto/deleteFeedbackById.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { FeedbackCarrierRatingsDTO } from './dto/carrierRatings.dto';

@Controller('feedbacks')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Roles('admin')
  @Put('/reprove/:id')
  reproveFeedback(@Param('id') feedback_uuid: string) {
    return this.feedbackService.reproveFeedback(feedback_uuid);
  }

  @Roles('admin')
  @Put('/approve/:id')
  approveFeedback(@Param('id') feedback_uuid: string) {
    return this.feedbackService.approveFeedback(feedback_uuid);
  }

  @Get('carrier-ratings')
  async feedbackCarrierRatings(
    @Query()
    body: FeedbackCarrierRatingsDTO,
  ) {
    return this.feedbackService.feedbackCarrierRatings(body);
  }

  @Roles('admin')
  @Get('/:approval')
  getFeedbacksByApproval(@Param('approval') approval: string) {
    return this.feedbackService.getFeedbacksByApproval(approval);
  }

  @Roles('user')
  @Get('/:company_name/:service_code')
  getFeedbacksByCompanyAndService(
    @Param('company_name') company_name: string,
    @Param('service_code') service_code: string,
  ) {
    return this.feedbackService.getFeedbacksByCompanyAndService({
      company_name,
      service_code,
    });
  }

  @Roles('user')
  @Get('/:feedback_uuid')
  getFeedbackById(@Param('feedback_uuid') feedback_uuid: string) {
    return this.feedbackService.getFeedbackById(feedback_uuid);
  }

  @Put()
  async updateFeedback(
    @Body()
    body: UpdateFeedbackDTO,
  ) {
    return this.feedbackService.updateFeedback(body);
  }

  @Post()
  async createFeedback(
    @Body()
    body: CreateFeedbackDTO,
  ) {
    return this.feedbackService.createFeedback(body);
  }

  @Roles('user')
  @Delete()
  async deleteFeedbackById(
    @Body()
    body: DeleteFeedbackByIdDTO,
  ) {
    return this.feedbackService.deleteFeedbackById(body);
  }
}
