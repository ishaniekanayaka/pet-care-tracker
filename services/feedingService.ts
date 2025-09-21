import { db } from "../firebase";
import { collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";
import * as Notifications from 'expo-notifications';
import { FeedingSchedule } from "../types/feeding";
import { Pet } from "@/types/pet";

const feedingCollection = collection(db, "feedingSchedules");

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Request notification permissions
export const requestNotificationPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Failed to get push token for push notification!');
    return false;
  }
  return true;
};

// Calculate next notification times based on frequency
const calculateNotificationTimes = (time: string, frequency: 'daily' | 'weekly' | 'monthly') => {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const scheduleTimes: Date[] = [];

  for (let i = 0; i < 30; i++) { // Schedule for next 30 occurrences
    const scheduleDate = new Date();
    scheduleDate.setHours(hours, minutes, 0, 0);

    switch (frequency) {
      case 'daily':
        scheduleDate.setDate(now.getDate() + i);
        break;
      case 'weekly':
        scheduleDate.setDate(now.getDate() + (i * 7));
        break;
      case 'monthly':
        scheduleDate.setMonth(now.getMonth() + i);
        break;
    }

    // Only add future times
    if (scheduleDate > now) {
      scheduleTimes.push(scheduleDate);
    }
  }

  return scheduleTimes;
};

// Schedule notifications for feeding time
export const scheduleFeedingNotifications = async (schedule: FeedingSchedule, petName: string) => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return [];

    const notificationTimes = calculateNotificationTimes(schedule.time, schedule.frequency);
    const notificationIds: string[] = [];

    for (const notificationTime of notificationTimes) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🍽️ Feeding Time for ${petName}!`,
          body: `Time to feed ${petName} with ${schedule.foodType} (${schedule.amount})`,
          data: { 
            scheduleId: schedule.id,
            petId: schedule.petId,
            type: 'feeding_reminder'
          },
          sound: 'default',
        },
        trigger: {
          type: 'date',
          date: notificationTime,
        },
      });
      notificationIds.push(notificationId);
    }

    console.log(`Scheduled ${notificationIds.length} notifications for ${petName}`);
    return notificationIds;
  } catch (error) {
    console.error('Error scheduling notifications:', error);
    return [];
  }
};

// Cancel scheduled notifications
export const cancelFeedingNotifications = async (notificationIds: string[]) => {
  try {
    for (const id of notificationIds) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
    console.log(`Cancelled ${notificationIds.length} notifications`);
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
};

// Add a new feeding schedule with notifications
export const addFeedingSchedule = async (schedule: FeedingSchedule, petName: string = 'Your Pet') => {
  try {
    const docRef = await addDoc(feedingCollection, {
      ...schedule,
      createdAt: new Date(),
      notificationIds: [], // Will be updated after scheduling
    });

    // Schedule notifications
    const scheduleWithId = { ...schedule, id: docRef.id };
    const notificationIds = await scheduleFeedingNotifications(scheduleWithId, petName);

    // Update document with notification IDs
    if (notificationIds.length > 0) {
      await updateDoc(docRef, { notificationIds });
    }

    return docRef.id;
  } catch (error) {
    console.error('Error adding feeding schedule:', error);
    throw error;
  }
};

export const getPetById = async (petId: string): Promise<Pet | null> => {
  try {
    console.log('Fetching pet with ID:', petId);
    const petDoc = await getDoc(doc(db, "pets", petId));
    
    if (petDoc.exists()) {
      const petData = {
        id: petDoc.id,
        ...petDoc.data(),
      } as Pet;
      console.log('Pet found:', petData);
      return petData;
    } else {
      console.log("No pet found with ID:", petId);
      return null;
    }
  } catch (error) {
    console.error("Error fetching pet by ID:", error);
    throw error;
  }
};

// Get feeding schedules for a pet
export const getFeedingSchedulesByPet = async (petId: string): Promise<FeedingSchedule[]> => {
  try {
    const q = query(feedingCollection, where("petId", "==", petId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FeedingSchedule[];
  } catch (error) {
    console.error('Error fetching feeding schedules:', error);
    throw error;
  }
};

// Update a feeding schedule with new notifications
export const updateFeedingSchedule = async (
  id: string, 
  data: Partial<FeedingSchedule>, 
  petName: string = 'Your Pet'
) => {
  try {
    // Get current schedule to cancel old notifications
    const currentDoc = await getDoc(doc(db, "feedingSchedules", id));
    if (currentDoc.exists()) {
      const currentData = currentDoc.data();
      if (currentData.notificationIds) {
        await cancelFeedingNotifications(currentData.notificationIds);
      }
    }

    // Update the document
    await updateDoc(doc(db, "feedingSchedules", id), { ...data });

    // If time or frequency changed, reschedule notifications
    if (data.time || data.frequency) {
      const updatedDoc = await getDoc(doc(db, "feedingSchedules", id));
      if (updatedDoc.exists()) {
        const updatedSchedule = { id: updatedDoc.id, ...updatedDoc.data() } as FeedingSchedule;
        const notificationIds = await scheduleFeedingNotifications(updatedSchedule, petName);
        
        if (notificationIds.length > 0) {
          await updateDoc(doc(db, "feedingSchedules", id), { notificationIds });
        }
      }
    }
  } catch (error) {
    console.error('Error updating feeding schedule:', error);
    throw error;
  }
};

// Delete a feeding schedule and cancel notifications
export const deleteFeedingSchedule = async (id: string) => {
  try {
    // Get current schedule to cancel notifications
    const currentDoc = await getDoc(doc(db, "feedingSchedules", id));
    if (currentDoc.exists()) {
      const currentData = currentDoc.data();
      if (currentData.notificationIds) {
        await cancelFeedingNotifications(currentData.notificationIds);
      }
    }

    // Delete the document
    await deleteDoc(doc(db, "feedingSchedules", id));
  } catch (error) {
    console.error('Error deleting feeding schedule:', error);
    throw error;
  }
};

// Get all upcoming notifications for debugging
export const getAllScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('All scheduled notifications:', notifications);
    return notifications;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

