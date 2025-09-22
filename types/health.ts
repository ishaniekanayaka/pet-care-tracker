// types/health.ts
export type HealthRecordType = "vaccination" | "checkup" | "medication" | "treatment";

export interface HealthRecord {
  id?: string;
  petId: string;
  type: HealthRecordType;
  title: string;
  date: string;
  nextDue?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  reminderSent?: boolean;
  reminderDays?: number;
}

export interface HealthRecordFormData {
  type: HealthRecordType;
  title: string;
  date: string;
  nextDue?: string;
  notes?: string;
}
