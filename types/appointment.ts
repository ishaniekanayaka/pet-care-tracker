export interface Appointment {
  id?: string;
  userId: string;
  petId: string;
  vetName: string;
  location: string;
  date: Date;
  status: "upcoming" | "completed" | "canceled";
}
