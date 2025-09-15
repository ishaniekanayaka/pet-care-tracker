export interface Reminder {
  id?: string;
  userId: string;
  petId: string;
  type: "vaccination" | "medication" | "feeding" | "appointment";
  title: string;
  date: Date;
  isCompleted: boolean;
}
