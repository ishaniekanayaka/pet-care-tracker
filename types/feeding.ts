export interface FeedingSchedule {
  id?: string;
  petId: string;
  foodType: string;
  amount: string;
  time: string; // Format: "HH:MM" (24-hour format)
  frequency: 'daily' | 'weekly' | 'monthly';
  notificationIds?: string[]; // Array of notification IDs for cancellation
  isActive?: boolean; // To enable/disable notifications without deleting
  notes?: string; // Optional notes about the feeding
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationData {
  scheduleId?: string;
  petId: string;
  type: 'feeding_reminder';
}