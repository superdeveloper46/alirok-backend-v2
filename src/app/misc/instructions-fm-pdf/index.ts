import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

export async function getFirstMileInstructionsLabel() {
  const http = new HttpService();

  const response = await lastValueFrom(
    http.get(
      'https://static.alirok.io/collections/images/FM_Instructions.pdf',
      {
        responseType: 'arraybuffer',
      },
    ),
  );

  const base64File = Buffer.from(response.data, 'binary').toString('base64');

  return base64File;
}
