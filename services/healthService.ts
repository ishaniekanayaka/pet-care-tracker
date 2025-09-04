import { db } from "@/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { HealthRecord } from "../types/health";

const healthCollection = collection(db, "healthRecords");

// Add a new health record
export const addHealthRecord = async (record: HealthRecord) => {
  const docRef = await addDoc(healthCollection, {
    ...record,
    createdAt: new Date(),
  });
  return docRef.id;
};

// Get records by Pet
export const getHealthRecordsByPet = async (petId: string): Promise<HealthRecord[]> => {
  const q = query(healthCollection, where("petId", "==", petId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as HealthRecord[];
};

// Update record
export const updateHealthRecord = async (recordId: string, data: Partial<HealthRecord>) => {
  await updateDoc(doc(db, "healthRecords", recordId), {
    ...data,
    updatedAt: new Date(),
  });
};

// Delete record
export const deleteHealthRecord = async (recordId: string) => {
  await deleteDoc(doc(db, "healthRecords", recordId));
};
