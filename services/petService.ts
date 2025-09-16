// import { db } from "@/firebase";
// import { collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc } from "firebase/firestore";
// import { Pet } from "../types/pet";

// const petsCollection = collection(db, "pets");

// export const addPet = async (pet: Pet) => {
//   const docRef = await addDoc(petsCollection, {
//     ...pet,
//     createdAt: new Date(),
//   });
//   return docRef.id;
// };

// export const getPetsByUser = async (userId: string): Promise<Pet[]> => {
//   const q = query(petsCollection, where("userId", "==", userId));
//   const snapshot = await getDocs(q);
//   return snapshot.docs.map((doc) => ({
//     id: doc.id,
//     ...doc.data(),
//   })) as Pet[];
// };

// export const deletePet = async (petId: string) => {
//   if (!petId) throw new Error("Pet ID is required");
//   await deleteDoc(doc(db, "pets", petId));
// };

// // Update
// export const updatePet = async (petId: string, pet: Partial<Pet>) => {
//   if (!petId) throw new Error("Pet ID is required");
//   await updateDoc(doc(db, "pets", petId), {
//     ...pet,
//     updatedAt: new Date(),
//   });
// };
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
  DocumentData,
  QuerySnapshot, 
  getDoc
} from "firebase/firestore";
import { Pet } from "../types/pet";

// Constants
const COLLECTION_NAME = "pets";
const petsCollection = collection(db, COLLECTION_NAME);

// Error messages
const ERROR_MESSAGES = {
  INVALID_PET_ID: "Pet ID is required and must be a valid string",
  INVALID_USER_ID: "User ID is required and must be a valid string",
  INVALID_PET_DATA: "Pet data is required",
  DELETE_FAILED: "Failed to delete pet",
  UPDATE_FAILED: "Failed to update pet",
  FETCH_FAILED: "Failed to fetch pets",
  ADD_FAILED: "Failed to add pet"
} as const;

// Utility functions
const validatePetId = (petId: string | undefined): string => {
  if (!petId || typeof petId !== 'string' || petId.trim() === '') {
    throw new Error(ERROR_MESSAGES.INVALID_PET_ID);
  }
  return petId.trim();
};

const validateUserId = (userId: string): void => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error(ERROR_MESSAGES.INVALID_USER_ID);
  }
};

const validatePetData = (pet: Pet | Partial<Pet>): void => {
  if (!pet || typeof pet !== 'object') {
    throw new Error(ERROR_MESSAGES.INVALID_PET_DATA);
  }
};

const transformDocumentToPet = (doc: DocumentData): Pet => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    name: data.name,
    breed: data.breed,
    age: data.age,
    weight: data.weight,
    healthHistory: data.healthHistory,
    image: data.image,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate()
  } as Pet;
};

// Service functions
export const addPet = async (pet: Pet): Promise<string> => {
  try {
    validatePetData(pet);
    validateUserId(pet.userId);

    const petData = {
      ...pet,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(petsCollection, petData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding pet:", error);
    throw new Error(`${ERROR_MESSAGES.ADD_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getPetsByUser = async (userId: string): Promise<Pet[]> => {
  try {
    validateUserId(userId);

    const q = query(petsCollection, where("userId", "==", userId.trim()));
    const snapshot: QuerySnapshot = await getDocs(q);
    
    return snapshot.docs.map(transformDocumentToPet);
  } catch (error) {
    console.error("Error fetching pets:", error);
    throw new Error(`${ERROR_MESSAGES.FETCH_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deletePet = async (petId: string | undefined): Promise<void> => {
  try {
    const validatedPetId = validatePetId(petId);
    
    const petDocRef = doc(db, COLLECTION_NAME, validatedPetId);
    await deleteDoc(petDocRef);
    
    console.log(`Pet with ID ${validatedPetId} deleted successfully`);
  } catch (error) {
    console.error("Error deleting pet:", error);
    throw new Error(`${ERROR_MESSAGES.DELETE_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const updatePet = async (petId: string | undefined, petData: Partial<Pet>): Promise<void> => {
  try {
    const validatedPetId = validatePetId(petId);
    validatePetData(petData);

    // Remove undefined values and add updatedAt timestamp
    const cleanedData = Object.fromEntries(
      Object.entries(petData).filter(([_, value]) => value !== undefined)
    );

    const updateData = {
      ...cleanedData,
      updatedAt: new Date()
    };

    const petDocRef = doc(db, COLLECTION_NAME, validatedPetId);
    await updateDoc(petDocRef, updateData);
    
    console.log(`Pet with ID ${validatedPetId} updated successfully`);
  } catch (error) {
    console.error("Error updating pet:", error);
    throw new Error(`${ERROR_MESSAGES.UPDATE_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Additional utility functions for better UX
// export const getPetById = async (petId: string): Promise<Pet | null> => {
//   try {
//     const validatedPetId = validatePetId(petId);
//     const q = query(petsCollection, where("__name__", "==", validatedPetId));
//     const snapshot = await getDocs(q);
    
//     if (snapshot.empty) {
//       return null;
//     }
    
//     return transformDocumentToPet(snapshot.docs[0]);
//   } catch (error) {
//     console.error("Error fetching pet by ID:", error);
//     return null;
//   }
// };

export const batchDeletePets = async (petIds: string[]): Promise<{ success: string[], failed: string[] }> => {
  const results = { success: [] as string[], failed: [] as string[] };
  
  for (const petId of petIds) {
    try {
      await deletePet(petId);
      results.success.push(petId);
    } catch (error) {
      console.error(`Failed to delete pet ${petId}:`, error);
      results.failed.push(petId);
    }
  }
  
  return results;
};

// Get a single pet by ID with debug logging
export const getPetById = async (petId: string): Promise<Pet | null> => {
  try {
    console.log('🔍 getPetById called with ID:', petId);
    console.log('🔍 Document path:', `pets/${petId}`);
    
    const petDocRef = doc(db, "pets", petId);
    const petDoc = await getDoc(petDocRef);
    
    console.log('🔍 Document exists:', petDoc.exists());
    
    if (petDoc.exists()) {
      const data = petDoc.data();
      console.log('🔍 Raw document data:', data);
      
      const petData = {
        id: petDoc.id,
        ...data,
      } as Pet;
      
      console.log('🔍 Formatted pet data:', petData);
      return petData;
    } else {
      console.log('❌ No pet document found with ID:', petId);
      
      // Let's also check what pets exist in the collection
      const { collection, getDocs } = await import("firebase/firestore");
      const petsCollection = collection(db, "pets");
      const allPets = await getDocs(petsCollection);
      
      console.log('🔍 All pets in collection:');
      allPets.forEach(doc => {
        console.log(`  - ID: ${doc.id}, Data:`, doc.data());
      });
      
      return null;
    }
  } catch (error) {
    console.error("❌ Error in getPetById:", error);
    throw error;
  }
};