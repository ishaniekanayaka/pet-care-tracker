import { db } from "@/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { HealthRecord } from "../types/health";
import { Pet } from "@/types/pet";

const healthCollection = collection(db, "healthRecords");

// Add a new health record
export const addHealthRecord = async (record: HealthRecord) => {
  try {
    const docRef = await addDoc(healthCollection, {
      ...record,
      createdAt: Timestamp.now(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding health record:", error);
    return { success: false, error };
  }
};

// Get records by Pet (with id included)
export const getHealthRecordsByPet = async (
  petId: string
): Promise<(HealthRecord & { id: string })[]> => {
  try {
    const q = query(healthCollection, where("petId", "==", petId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as HealthRecord),
    }));
  } catch (error) {
    console.error("Error fetching health records:", error);
    return [];
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
    throw error; // Re-throw to handle in component
  }
};

// Update record
export const updateHealthRecord = async (
  recordId: string, 
  data: Partial<HealthRecord>
) => {
  try {
    await updateDoc(doc(db, "healthRecords", recordId), {
      ...data,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating health record:", error);
    return { success: false, error };
  }
};

// Delete record
export const deleteHealthRecord = async (recordId: string) => {
  try {
    await deleteDoc(doc(db, "healthRecords", recordId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting health record:", error);
    return { success: false, error };
  }
};