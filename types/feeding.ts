export interface FeedingRecord {
  id?: string;
  petId: string;
  food: string;
  quantity: string;
  date: string;       // first feeding date YYYY-MM-DD
  time?: string;      // HH:mm
  repeat?: "none" | "daily" | "weekly"; // new field
  notes?: string;
  notificationIds?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
