import { db } from "../firebase";
import { collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";
import * as Notifications from "expo-notifications";
import { FeedingRecord } from "../types/feeding";
import { Pet } from "../types/pet";

const feedingCollection = collection(db, "feedingSchedules");

// Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestNotificationPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    alert("Push notifications not granted!");
    return false;
  }
  return true;
};

// Schedule notifications
export const scheduleFeedingNotifications = async (record: FeedingRecord, petName: string) => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return [];

    const [hours, minutes] = (record.time || "09:00").split(":").map(Number);
    const triggerDate = new Date(record.date);
    triggerDate.setHours(hours, minutes, 0, 0);

    // Fix: Use the correct type with explicit type property
    const trigger: Notifications.DateTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🍽️ Feeding Time for ${petName}`,
        body: `Time to feed ${petName}: ${record.food} (${record.quantity})`,
        data: { recordId: record.id, petId: record.petId, type: "feeding_reminder" },
        sound: "default",
      },
      trigger,
    });

    return [notificationId];
  } catch (error) {
    console.error("Error scheduling notifications:", error);
    return [];
  }
};

// Cancel notifications
export const cancelFeedingNotifications = async (notificationIds: string[]) => {
  try {
    for (const id of notificationIds) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  } catch (error) {
    console.error("Error cancelling notifications:", error);
  }
};

// Add feeding record
export const addFeedingSchedule = async (record: FeedingRecord, petName: string) => {
  const docRef = await addDoc(feedingCollection, { ...record, createdAt: new Date(), notificationIds: [] });
  const recordWithId: FeedingRecord = { ...record, id: docRef.id };
  const notificationIds = await scheduleFeedingNotifications(recordWithId, petName);

  if (notificationIds.length > 0) await updateDoc(docRef, { notificationIds });
  return docRef.id;
};

// Get feeding records by pet
export const getFeedingSchedulesByPet = async (petId: string) => {
  const q = query(feedingCollection, where("petId", "==", petId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FeedingRecord[];
};

// Update feeding record
export const updateFeedingSchedule = async (id: string, data: Partial<FeedingRecord>, petName: string) => {
  const docRef = doc(db, "feedingSchedules", id);
  const currentDoc = await getDoc(docRef);
  if (!currentDoc.exists()) throw new Error("Record not found");

  const currentData = currentDoc.data() as FeedingRecord;
  if (currentData.notificationIds) await cancelFeedingNotifications(currentData.notificationIds);

  await updateDoc(docRef, { ...data, updatedAt: new Date() });
  const updatedData = { ...(currentData as FeedingRecord), ...data };
  const notificationIds = await scheduleFeedingNotifications(updatedData, petName);

  if (notificationIds.length > 0) await updateDoc(docRef, { notificationIds });
};

// Delete feeding record
export const deleteFeedingSchedule = async (id: string) => {
  const docRef = doc(db, "feedingSchedules", id);
  const currentDoc = await getDoc(docRef);
  if (currentDoc.exists()) {
    const data = currentDoc.data() as FeedingRecord;
    if (data.notificationIds) await cancelFeedingNotifications(data.notificationIds);
  }
  await deleteDoc(docRef);
};

// Get pet by ID
export const getPetById = async (petId: string): Promise<Pet | null> => {
  try {
    const petDoc = await getDoc(doc(db, "pets", petId));
    if (petDoc.exists()) return { id: petDoc.id, ...petDoc.data() } as Pet;
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};