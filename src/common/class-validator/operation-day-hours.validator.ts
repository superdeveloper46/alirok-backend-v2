import { enum_days_name_short } from '@generated/client';
import { format, differenceInMinutes } from 'date-fns';
import {
  registerDecorator,
  ValidationOptions,
  IsEnum,
  IsNotEmpty,
  IsMilitaryTime,
  IsBoolean,
} from 'class-validator';

export class OperationalHours {
  @IsEnum(enum_days_name_short)
  day_name: enum_days_name_short;

  @IsNotEmpty()
  @IsMilitaryTime()
  opening_time: string;

  @IsNotEmpty()
  @IsMilitaryTime()
  closing_time: string;

  @IsBoolean()
  @IsNotEmpty()
  closed: boolean;
}

export function IsValidOperationDays(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(data: OperationalHours[]) {
          // Validate if duplicate days found
          const uniqueDays =
            data
              .map((row) => row.day_name)
              .filter((x, i, a) => a.indexOf(x) == i).length < 7;

          if (uniqueDays) {
            return false;
            // return new Promise((resolve) => resolve(false)); // Promise reject
          }

          // All Good
          return true;
        },
      },
    });
  };
}

export function IsValidOperationHours(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(data: OperationalHours[]) {
          const fullDate = format(new Date(), 'yyyy-MM-dd');

          // Validate if operation time is valid for each days
          for (const items of data) {
            const diffMin = differenceInMinutes(
              new Date(`${fullDate}T${items.closing_time}:00Z`),
              new Date(`${fullDate}T${items.opening_time}:00Z`),
            );

            if (diffMin <= 0 && items.closed === false) {
              return false;
            }
          }

          // All Good
          return true;
        },
      },
    });
  };
}
