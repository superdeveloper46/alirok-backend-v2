import { Module } from '@nestjs/common';
import { CompanyRelationshipsController } from './company-relationships.controller';
import { CompanyRelationshipsService } from './company-relationships.service';
import { SendgridModule } from '../../vendors/sendgrid/sendgrid.module';

@Module({
  controllers: [CompanyRelationshipsController],
  providers: [CompanyRelationshipsService],
  imports: [SendgridModule],
})
export class CompanyRelationshipsModule {}
