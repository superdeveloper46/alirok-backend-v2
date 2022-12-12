import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AddressModule } from '../../../misc/address/address.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [AddressModule],
})
export class UsersModule {}
