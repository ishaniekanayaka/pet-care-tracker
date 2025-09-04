export interface HealthRecord {
  id?: string;
  petId: string;
  type: "vaccination" | "checkup" | "medication" | "treatment";
  title: string;
  date: string;       // YYYY-MM-DD
  nextDue?: string;   // optional
  notes?: string;     // optional
  createdAt?: Date;
}
