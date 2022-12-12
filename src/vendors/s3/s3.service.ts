import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as aws from 'aws-sdk';

@Injectable()
export class S3Service {
  private BUCKET_NAME: string;
  private ACCESS_KEY_ID: string;
  private SECRET_ACCESS_KEY: string;
  private DEFAULT_REGION: string;

  private s3: aws.S3;
  constructor(private readonly configService: ConfigService) {
    this.ACCESS_KEY_ID = configService.get<string>('ACCESS_KEY_ID');
    this.SECRET_ACCESS_KEY = configService.get<string>('SECRET_ACCESS_KEY');
    this.DEFAULT_REGION = configService.get<string>('DEFAULT_REGION');
    this.BUCKET_NAME = configService.get<string>('BUCKET_NAME');

    aws.config.update({
      accessKeyId: this.ACCESS_KEY_ID,
      secretAccessKey: this.SECRET_ACCESS_KEY,
      region: this.DEFAULT_REGION,
    });

    this.s3 = new aws.S3();
  }

  public async generateUrl(key) {
    return this.s3.getSignedUrl('getObject', {
      Bucket: this.BUCKET_NAME,
      Key: key,
    });
  }

  public awsS3() {
    return this.s3;
  }

  public async put({ file, folder, name, contentType }) {
    if (!file) {
      throw new Error('Missing file on S3');
    }

    if (!name) {
      throw new Error('Missing file name on S3');
    }

    const key = folder ? `${folder}/${name}` : name;

    await this.s3
      .putObject({
        Bucket: this.BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
      })
      .promise();

    return this.generateUrl(key);
  }
}
