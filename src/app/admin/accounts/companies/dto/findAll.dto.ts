export class FindAllDto {
  skip?: number;
  take?: number;
  orderBy?:
    | 'legal_name'
    | 'fantasy_name'
    | 'tax_id'
    | 'headquarter_address'
    | 'email';
  sortOrder?: 'asc' | 'desc';
}
