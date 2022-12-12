/**
 * Matches a JSON object.
 * Unlike `JsonObject`, this type allows undefined and read-only properties.
 */
export type InputJsonObject = {
  readonly [Key in string]?: InputJsonValue | null;
};

/**
 * Matches a JSON array.
 * Unlike `JsonArray`, readonly arrays are assignable to this type.
 */
export type InputJsonArray = ReadonlyArray<InputJsonValue | null>;

/**
 * Matches any valid value that can be used as an input for operations like
 * create and update as the value of a JSON field. Unlike `JsonValue`, this
 * type allows read-only arrays and read-only object properties and disallows
 * `null` at the top level.
 *
 * `null` cannot be used as the value of a JSON field because its meaning
 * would be ambiguous. Use `Prisma.JsonNull` to store the JSON null value or
 * `Prisma.DbNull` to clear the JSON value and set the field to the database
 * NULL value instead.
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-by-null-values
 */
export type InputJsonValue =
  | string
  | number
  | boolean
  | InputJsonObject
  | InputJsonArray;

export interface CreateLocation {
  country: string;
  state: string;
  city: string;
  postal_code: string;
  address: string;
  street: string;
  street_number: string;
  complement_address?: string;
  address_type?: 'RESIDENTIAL' | 'COMMERCIAL';
  raw_address?: InputJsonValue;
}
