import { db } from "@/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
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
