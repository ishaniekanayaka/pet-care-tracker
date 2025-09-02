import { db } from "@/firebase";
import { collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Pet } from "../types/pet";

const petsCollection = collection(db, "pets");

export const addPet = async (pet: Pet) => {
  const docRef = await addDoc(petsCollection, {
    ...pet,
    createdAt: new Date(),
  });
  return docRef.id;
};

export const getPetsByUser = async (userId: string): Promise<Pet[]> => {
  const q = query(petsCollection, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Pet[];
};

export const deletePet = async (petId: string) => {
  if (!petId) throw new Error("Pet ID is required");
  await deleteDoc(doc(db, "pets", petId));
};

// Update
export const updatePet = async (petId: string, pet: Partial<Pet>) => {
  if (!petId) throw new Error("Pet ID is required");
  await updateDoc(doc(db, "pets", petId), {
    ...pet,
    updatedAt: new Date(),
  });
};