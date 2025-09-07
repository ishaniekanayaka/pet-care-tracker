import { db } from "../firebase";
import { collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { FeedingSchedule } from "../types/feeding";

const feedingCollection = collection(db, "feedingSchedules");

// Add a new feeding schedule
export const addFeedingSchedule = async (schedule: FeedingSchedule) => {
  const docRef = await addDoc(feedingCollection, {
    ...schedule,
    createdAt: new Date(),
  });
  return docRef.id;
};

// Get feeding schedules for a pet
export const getFeedingSchedulesByPet = async (petId: string): Promise<FeedingSchedule[]> => {
  const q = query(feedingCollection, where("petId", "==", petId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FeedingSchedule[];
};

// Update a feeding schedule
export const updateFeedingSchedule = async (id: string, data: Partial<FeedingSchedule>) => {
  await updateDoc(doc(db, "feedingSchedules", id), { ...data });
};

// Delete a feeding schedule
export const deleteFeedingSchedule = async (id: string) => {
  await deleteDoc(doc(db, "feedingSchedules", id));
};
