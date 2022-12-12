import { Injectable } from '@nestjs/common';

@Injectable()
export class ObjectHelperService {
  public removeUndefinedFields(object: Object) {
    return JSON.parse(JSON.stringify(object));
  }
}
