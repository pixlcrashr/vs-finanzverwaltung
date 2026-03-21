export interface Report {
  id: string;
  name: string;
  createdAt: Date;
  templateId: string;
  templateName: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  createdAt: Date;
  updatedAt: Date;
}
