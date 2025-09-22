// services/healthReminderService.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { HealthRecord } from "@/types/health";

/** Setup notification channel */
export async function registerHealthNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("health", {
      name: "Health Reminders",
      importance: Notifications.AndroidImportance.MAX,
    });
  }
}

/** Schedule reminder for one health record */
export async function scheduleHealthReminder(
  petName: string,
  record: HealthRecord,
  reminderDays: number = 3 // default: 3 days before
) {
  if (!record.nextDue) return;

  const dueDate = new Date(record.nextDue);

  // Reminder date (before due date)
  let reminderDate = new Date(dueDate);
  reminderDate.setDate(dueDate.getDate() - reminderDays);

  // Prevent scheduling past dates
  if (reminderDate <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
  content: {
    title: "🏥 Health Reminder",
    body: `${petName} has a ${record.type} - "${record.title}" due on ${record.nextDue}`,
    sound: true,
  },
  trigger: { date: reminderDate } as Notifications.NotificationTriggerInput,
});

}

/** Cancel all scheduled reminders */
export async function cancelAllHealthReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
