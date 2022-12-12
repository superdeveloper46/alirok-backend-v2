import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { error } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../prisma/prisma.service';

import { CreateFeedbackDTO } from './dto/createFeedback.dto';
import { UpdateFeedbackDTO } from './dto/updateFeedback.dto';
import { DeleteFeedbackByIdDTO } from './dto/deleteFeedbackById.dto';
import { GetFeedbacksByCompanyAndServiceDTO } from './dto/getFeedbacksByCompanyAndService.dto';
import { FeedbackCarrierRatingsDTO } from './dto/carrierRatings.dto';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  public async reproveFeedback(feedback_uuid: string) {
    try {
      const feedback = await this.prisma.feedbacks.update({
        data: {
          approval: 'reproved',
        },
        where: {
          feedback_uuid,
        },
      });

      return { id: feedback.feedback_uuid };
    } catch (error) {
      return error;
    }
  }

  public async approveFeedback(feedback_uuid: string) {
    try {
      const feedback = await this.prisma.feedbacks.update({
        data: {
          approval: 'approved',
        },
        where: {
          feedback_uuid,
        },
      });

      return { id: feedback.feedback_uuid };
    } catch (error) {
      return error;
    }
  }

  public async getFeedbacksByApproval(approval: string) {
    try {
      const feedbacks = await this.prisma.feedbacks.findMany({
        select: {
          feedback_uuid: true,
          created_at: true,
          message: true,
          rating: true,
          approval: true,
          users: {
            select: {
              photo: true,
              first_name: true,
              user_uuid: true,
            },
          },
        },
        where: {
          approval,
        },
      });

      return feedbacks;
    } catch (error) {
      return error;
    }
  }

  public async deleteFeedbackById({
    feedback_uuid,
    user_uuid,
  }: DeleteFeedbackByIdDTO) {
    if (!feedback_uuid) {
      throw new BadRequestException('Feedback id should be passed.');
    }

    try {
      const feedback = await this.prisma.feedbacks.findUnique({
        where: {
          feedback_uuid,
        },
      });

      if (!feedback || feedback?.user_uuid !== user_uuid) {
        throw new ForbiddenException('User not allowed to this action.');
      }

      const feedbackDeleted = await this.prisma.feedbacks.delete({
        select: {
          feedback_uuid: true,
          message: true,
          rating: true,
        },
        where: {
          feedback_uuid,
        },
      });

      return feedbackDeleted;
    } catch (err) {
      return error;
    }
  }

  public async feedbackCarrierRatings({
    source,
    service,
  }: FeedbackCarrierRatingsDTO) {
    try {
      const companyName = await this.prisma.parcel_rate_sources.findUnique({
        select: {
          name: true,
        },
        where: {
          parcel_rate_source_uuid: source,
        },
      });
      const feedbacks = await this.prisma.feedbacks.findMany({
        select: {
          feedback_uuid: true,
          rating: true,
          message: true,
          tracking_code_id: true,
          users: {
            select: {
              first_name: true,
              photo: true,
              user_uuid: true,
            },
          },
        },
        where: {
          parcel_rate_source_uuid: source,
          service_code: service,
          approval: 'approved',
        },
        orderBy: {
          created_at: 'desc',
        },
      });
      return {
        companyName: companyName.name,
        feedbacks: feedbacks,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  public async getFeedbacksByCompanyAndService(
    query: GetFeedbacksByCompanyAndServiceDTO,
  ) {
    try {
      const feedbacks = this.prisma.feedbacks.findMany({
        select: {
          feedback_uuid: true,
          created_at: true,
          message: true,
          rating: true,
          users: {
            select: {
              photo: true,
              first_name: true,
              user_uuid: true,
            },
          },
        },
        where: {
          service_code: query.service_code,
          company_name: query.company_name,
          approval: {
            equals: 'approved',
          },
        },
      });

      return feedbacks;
    } catch (error) {
      return error;
    }
  }

  public async getFeedbackById(feedback_uuid: string) {
    try {
      const feedback = await this.prisma.feedbacks.findUnique({
        where: {
          feedback_uuid,
        },
      });

      return feedback;
    } catch (error) {
      return error;
    }
  }

  public async updateFeedback({
    rating,
    message,
    feedback_uuid,
    tracking_code,
    user_uuid,
  }: UpdateFeedbackDTO) {
    try {
      // Find Booking if exists
      const parcelBooking = await this.prisma.parcel_bookings.findFirst({
        select: {
          user_uuid: true,
          parcel_booking_uuid: true,
        },
        where: {
          tracking_code_id: tracking_code,
        },
      });

      if (!parcelBooking) {
        throw new BadRequestException('Booking with tracking code not found');
      }

      // Check user exist
      if (user_uuid) {
        const existUser = await this.prisma.users.count({
          where: {
            user_uuid: user_uuid,
          },
        });

        if (existUser === 0) {
          throw new BadRequestException('User does not found');
        }
      }

      const feedbackExists = await this.prisma.feedbacks.findUnique({
        where: {
          feedback_uuid,
        },
      });

      if (!feedbackExists) {
        throw new ForbiddenException('Feedback not found');
      }

      await this.prisma.feedbacks.update({
        where: {
          feedback_uuid,
        },
        data: {
          message,
          rating,
          user_uuid: user_uuid || parcelBooking.user_uuid,
          approval: 'pending',
        },
      });

      return {
        submitted: true,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  public async createFeedback({
    user_uuid,
    rating,
    message,
    service_code,
    tracking_code,
    parcel_rate_source_uuid,
  }: CreateFeedbackDTO) {
    try {
      // Check tracking code
      const existFeedback = await this.prisma.feedbacks.count({
        where: {
          tracking_code_id: tracking_code,
        },
      });

      if (existFeedback > 0) {
        throw new BadRequestException('Feedback already exists');
      }

      // Check user exist
      if (user_uuid) {
        const existUser = await this.prisma.users.count({
          where: {
            user_uuid: user_uuid,
          },
        });

        if (existUser === 0) {
          throw new BadRequestException('User does not found');
        }
      }

      // Find Booking if exists
      const parcelBooking = await this.prisma.parcel_bookings.findFirst({
        select: {
          user_uuid: true,
        },
        where: {
          tracking_code_id: tracking_code,
        },
      });

      if (!parcelBooking) {
        throw new BadRequestException('Booking with tracking code not found');
      }

      const parcelRateSource = await this.prisma.parcel_rate_sources.findFirst({
        select: {
          name: true,
        },
        where: {
          parcel_rate_source_uuid,
        },
      });

      if (!parcelRateSource) {
        throw new BadRequestException('Parcel rate source not found');
      }

      const companyName = (parcelRateSource.name || '').toUpperCase();

      await this.prisma.feedbacks.create({
        data: {
          feedback_uuid: uuidv4(),
          message,
          rating,
          user_uuid: user_uuid || parcelBooking.user_uuid,
          service_code,
          parcel_rate_source_uuid,
          company_name: companyName,
          approval: 'pending',
          tracking_code_id: tracking_code,
          created_at: new Date().toISOString(),
        },
      });

      return {
        submitted: true,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
