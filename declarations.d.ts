import { users } from '@generated/client';

declare global {
  namespace Express {
    export interface Request {
      user?: users | null;
    }
  }

  interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
  }
}
