export class GetFeedbacksByCompanyAndServiceDTO {
  company_name: string;
  service_code: string;
}

export interface IFeedbackPayload {
  feedback_uuid: string;
  created_at: Date;
  message: string;
  rating: number;
  users: {
    photo: string;
    first_name: string;
  };
}
