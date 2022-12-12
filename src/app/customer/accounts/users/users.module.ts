import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AddressModule } from '../../../misc/address/address.module';
import { S3Module } from '../../../../vendors/s3/s3.module';
import { SendgridModule } from 'src/vendors/sendgrid/sendgrid.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [AddressModule, S3Module, SendgridModule],
})
export class UsersModule {}
