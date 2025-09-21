// export interface HealthRecord {
//   id?: string;
//   petId: string;
//   type: "vaccination" | "checkup" | "medication" | "treatment";
//   title: string;
//   date: string;       // YYYY-MM-DD
//   nextDue?: string;   // optional
//   notes?: string;     // optional
//   createdAt?: Date;
// }
export interface HealthRecord {
  id?: string;
  petId: string;
  type: "vaccination" | "checkup" | "medication" | "treatment";
  title: string;
  date: string;       // YYYY-MM-DD format
  nextDue?: string;   // YYYY-MM-DD format - optional reminder date
  notes?: string;     // optional additional details
  createdAt?: Date;
  updatedAt?: Date;   // for tracking updates
  reminderSent?: boolean; // to track if reminder notification was sent
  reminderDays?: number;  // days before nextDue to send reminder (default 7)
}

export interface HealthRecordFormData {
  type: "vaccination" | "checkup" | "medication" | "treatment";
  title: string;
  date: string;
  nextDue?: string;
  notes?: string;
}

export interface HealthStats {
  totalRecords: number;
  upcomingReminders: number;
  overdueReminders: number;
  recordsByType: {
    vaccination: number;
    checkup: number;
    medication: number;
    treatment: number;
  };
}

export interface ReminderData {
  recordId: string;
  petId: string;
  petName: string;
  recordTitle: string;
  recordType: string;
  dueDate: string;
  daysUntil: number;
  isOverdue: boolean;
}