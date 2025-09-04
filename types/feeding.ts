export interface FeedingSchedule {
  id?: string;
  petId: string;
  foodType: string;
  amount: string;
  time: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  createdAt?: Date;
}
