import { Module } from '@nestjs/common';
import { S3Module } from 'src/vendors/s3/s3.module';
import { BookingCommentsController } from './booking-comments.controller';
import { BookingCommentsService } from './booking-comments.service';

@Module({
  controllers: [BookingCommentsController],
  providers: [BookingCommentsService],
  imports: [S3Module],
})
export class BookingCommentsModule {}
