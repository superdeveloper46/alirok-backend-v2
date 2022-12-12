import { Transform } from 'class-transformer';

const ToDate = () => {
  const toPlain = Transform(
    ({ value }) => {
      return value;
    },
    {
      toPlainOnly: true,
    },
  );
  const toClass = (target: any, key: string) => {
    return Transform(
      ({ obj }) => {
        return valueToDate(obj[key]);
      },
      {
        toClassOnly: true,
      },
    )(target, key);
  };
  return function (target: any, key: string) {
    toPlain(target, key);
    toClass(target, key);
  };
};

const valueToDate = (value: any) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  const date = new Date(value);

  if (date instanceof Date && !isNaN(date.valueOf())) {
    return date;
  }

  return undefined;
};

export { ToDate };
