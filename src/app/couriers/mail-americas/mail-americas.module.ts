import { Module } from '@nestjs/common';
import { MailAmericasService } from './mail-americas.service';
import { MailAmericasHelperModule } from './mail-americas-helper/mail-americas-helper.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { S3Module } from 'src/vendors/s3/s3.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  providers: [MailAmericasService],
  imports: [
    MailAmericasHelperModule,
    HttpModule,
    ConfigModule,
    S3Module,
    PrismaModule,
  ],
  exports: [MailAmericasService],
})
export class MailAmericasModule {}
