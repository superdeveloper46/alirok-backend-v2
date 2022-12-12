import { Body, Controller, Post, Req } from '@nestjs/common';
import { BookingCommentsService } from './booking-comments.service';
import { CreateBookingCommentDTO } from './dto/booking-comments.dto';
import { Request } from 'express';

@Controller('booking-comments')
export class BookingCommentsController {
  constructor(private readonly bookingCommentService: BookingCommentsService) {}

  @Post('')
  createComment(@Body() payload: CreateBookingCommentDTO, @Req() req: Request) {
    return this.bookingCommentService.createComment(payload, req);
  }
}
