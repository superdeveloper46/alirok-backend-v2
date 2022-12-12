import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { CreateBookingCommentDTO, File } from './dto/booking-comments.dto';
import { Request } from 'express';
import { S3Service } from '../../vendors/s3/s3.service';

@Injectable()
export class BookingCommentsService {
  private BUCKET_NAME: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
  ) {
    this.BUCKET_NAME = configService.get<string>('BUCKET_NAME');
  }

  async uploadFile(
    file: File,
    parcel_booking_uuid: string,
    req: Request,
    comment_uuid: string,
  ) {
    let fileSignedRequest = '';
    let fileResultUrl = '';

    const filePath = `${req.hostname}/parcel`;
    const fileType = file.type;
    const fileExtension = file.type.match(/\/([a-z]{3,})$/);

    const fileExtensionFormatted = fileExtension ? fileExtension[1] : null;

    if (
      !fileExtensionFormatted ||
      (fileExtensionFormatted !== 'jpeg' &&
        fileExtensionFormatted !== 'jpg' &&
        fileExtensionFormatted !== 'png')
    ) {
      throw new BadRequestException('File type invalid!');
    }

    const fileName = `${filePath}/${parcel_booking_uuid}/${comment_uuid}.${fileExtensionFormatted}`;

    const s3 = this.s3Service.awsS3();

    const s3Params = {
      Bucket: this.BUCKET_NAME,
      Key: fileName,
      Expires: 60,
      ContentType: fileType,
      ACL: 'public-read',
    };

    fileSignedRequest = s3.getSignedUrl('putObject', s3Params);
    fileResultUrl = `https://${this.BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

    return { fileSignedRequest, fileResultUrl };
  }

  async createComment(payload: CreateBookingCommentDTO, req: Request) {
    const parcel_booking_uuid = payload.parcel_booking_uuid;

    let resultUrl = '';
    let signedRequest = '';
    try {
      if (!payload || !parcel_booking_uuid || !payload.author_user_uuid) {
        throw new BadRequestException('Missing information');
      }

      if (!payload.text && !payload.file) {
        throw new BadRequestException('Missing message');
      }

      const comment_uuid = uuidv4();
      const created_at = new Date();

      if (payload.file) {
        const { fileResultUrl, fileSignedRequest } = await this.uploadFile(
          payload.file,
          parcel_booking_uuid,
          req,
          comment_uuid,
        );

        resultUrl = fileResultUrl;
        signedRequest = fileSignedRequest;
      }

      const text = payload.text || '';

      const comment = await this.prisma.comments.create({
        data: {
          comment_uuid: comment_uuid,
          author_user_uuid: payload.author_user_uuid,
          text: text,
          file: resultUrl,
          created_at,
        },
      });

      await this.prisma.parcel_booking_comments.create({
        data: {
          parcel_booking_comment_uuid: uuidv4(),
          parcel_booking_uuid,
          comment_uuid: comment.comment_uuid,
        },
      });

      if (signedRequest) {
        return { ...comment, signedRequest };
      } else {
        return comment;
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
