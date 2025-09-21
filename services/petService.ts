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
  getDoc,
  Timestamp
} from "firebase/firestore";
import { Pet, PetCreateData, PetUpdateData, PetServiceResponse } from "../types/pet";

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
  ADD_FAILED: "Failed to add pet",
  PET_NOT_FOUND: "Pet not found"
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

// Service functions with enhanced error handling and response structure
export const addPet = async (petData: PetCreateData): Promise<string> => {
  try {
    validatePetData(petData);
    validateUserId(petData.userId);

    const petWithTimestamps = {
      ...petData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    console.log('Adding pet:', petWithTimestamps);
    const docRef = await addDoc(petsCollection, petWithTimestamps);
    console.log('Pet added successfully with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error("Error adding pet:", error);
    throw new Error(`${ERROR_MESSAGES.ADD_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getPetsByUser = async (userId: string): Promise<Pet[]> => {
  try {
    validateUserId(userId);

    console.log('Fetching pets for user:', userId);
    
    // Removed orderBy to avoid index requirement - we'll sort in memory instead
    const q = query(
      petsCollection, 
      where("userId", "==", userId.trim())
    );
    
    const snapshot: QuerySnapshot = await getDocs(q);
    const pets = snapshot.docs.map(transformDocumentToPet);
    
    // Sort pets by creation date in memory (newest first)
    const sortedPets = pets.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    console.log(`Found ${sortedPets.length} pets for user ${userId}`);
    return sortedPets;
  } catch (error) {
    console.error("Error fetching pets:", error);
    throw new Error(`${ERROR_MESSAGES.FETCH_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getPetById = async (petId: string): Promise<Pet | null> => {
  try {
    console.log('Fetching pet by ID:', petId);
    const validatedPetId = validatePetId(petId);
    
    const petDocRef = doc(db, COLLECTION_NAME, validatedPetId);
    const petDoc = await getDoc(petDocRef);
    
    if (petDoc.exists()) {
      const petData = transformDocumentToPet(petDoc);
      console.log('Pet found:', petData);
      return petData;
    } else {
      console.log('Pet not found with ID:', validatedPetId);
      return null;
    }
  } catch (error) {
    console.error("Error fetching pet by ID:", error);
    throw new Error(`${ERROR_MESSAGES.FETCH_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const updatePet = async (petId: string | undefined, petData: PetUpdateData): Promise<void> => {
  try {
    const validatedPetId = validatePetId(petId);
    validatePetData(petData);

    // Remove undefined values and add updatedAt timestamp
    const cleanedData = Object.fromEntries(
      Object.entries(petData).filter(([_, value]) => value !== undefined && value !== null)
    );

    const updateData = {
      ...cleanedData,
      updatedAt: Timestamp.now()
    };

    console.log('Updating pet:', validatedPetId, updateData);
    const petDocRef = doc(db, COLLECTION_NAME, validatedPetId);
    await updateDoc(petDocRef, updateData);
    
    console.log(`Pet with ID ${validatedPetId} updated successfully`);
  } catch (error) {
    console.error("Error updating pet:", error);
    throw new Error(`${ERROR_MESSAGES.UPDATE_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deletePet = async (petId: string | undefined): Promise<void> => {
  try {
    const validatedPetId = validatePetId(petId);
    
    console.log('Deleting pet:', validatedPetId);
    const petDocRef = doc(db, COLLECTION_NAME, validatedPetId);
    await deleteDoc(petDocRef);
    
    console.log(`Pet with ID ${validatedPetId} deleted successfully`);
  } catch (error) {
    console.error("Error deleting pet:", error);
    throw new Error(`${ERROR_MESSAGES.DELETE_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Enhanced utility functions
export const batchDeletePets = async (petIds: string[]): Promise<{ success: string[], failed: string[] }> => {
  const results = { success: [] as string[], failed: [] as string[] };
  
  console.log('Batch deleting pets:', petIds);
  
  for (const petId of petIds) {
    try {
      await deletePet(petId);
      results.success.push(petId);
    } catch (error) {
      console.error(`Failed to delete pet ${petId}:`, error);
      results.failed.push(petId);
    }
  }
  
  console.log('Batch delete results:', results);
  return results;
};

export const searchPets = async (userId: string, searchTerm: string): Promise<Pet[]> => {
  try {
    validateUserId(userId);
    
    if (!searchTerm || searchTerm.trim() === '') {
      return await getPetsByUser(userId);
    }
    
    console.log('Searching pets for user:', userId, 'with term:', searchTerm);
    
    const pets = await getPetsByUser(userId);
    const filteredPets = pets.filter(pet => 
      pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log(`Found ${filteredPets.length} pets matching "${searchTerm}"`);
    return filteredPets;
  } catch (error) {
    console.error("Error searching pets:", error);
    throw new Error(`${ERROR_MESSAGES.FETCH_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getPetsByType = async (userId: string, petType: string): Promise<Pet[]> => {
  try {
    validateUserId(userId);
    
    console.log('Fetching pets by type:', petType, 'for user:', userId);
    
    const pets = await getPetsByUser(userId);
    
    if (petType === 'all') {
      return pets;
    }
    
    const filteredPets = pets.filter(pet => {
      const breed = pet.breed.toLowerCase();
      switch (petType.toLowerCase()) {
        case 'dog':
          return ['labrador', 'german shepherd', 'golden retriever', 'bulldog', 'beagle', 'poodle', 'husky', 'boxer', 'dachshund', 'shih tzu'].some(dogBreed => breed.includes(dogBreed.toLowerCase()));
        case 'cat':
          return ['siamese', 'persian', 'maine coon', 'bengal', 'sphynx', 'british shorthair', 'ragdoll', 'scottish fold', 'american shorthair', 'russian blue'].some(catBreed => breed.includes(catBreed.toLowerCase()));
        case 'bird':
          return ['parakeet', 'cockatiel', 'lovebird', 'canary', 'finch', 'parrotlet', 'conure', 'african grey', 'macaw', 'cockatoo'].some(birdBreed => breed.includes(birdBreed.toLowerCase()));
        case 'other':
          return ['rabbit', 'hamster', 'guinea pig', 'turtle', 'snake', 'lizard', 'fish', 'ferret', 'chinchilla', 'hedgehog'].some(otherBreed => breed.includes(otherBreed.toLowerCase()));
        default:
          return true;
      }
    });
    
    console.log(`Found ${filteredPets.length} pets of type "${petType}"`);
    return filteredPets;
  } catch (error) {
    console.error("Error fetching pets by type:", error);
    throw new Error(`${ERROR_MESSAGES.FETCH_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Service response wrapper functions (optional - for better API consistency)
export const addPetWithResponse = async (petData: PetCreateData): Promise<PetServiceResponse<string>> => {
  try {
    const petId = await addPet(petData);
    return {
      success: true,
      data: petId,
      message: "Pet added successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const getPetsByUserWithResponse = async (userId: string): Promise<PetServiceResponse<Pet[]>> => {
  try {
    const pets = await getPetsByUser(userId);
    return {
      success: true,
      data: pets,
      message: `Found ${pets.length} pets`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const updatePetWithResponse = async (petId: string, petData: PetUpdateData): Promise<PetServiceResponse<void>> => {
  try {
    await updatePet(petId, petData);
    return {
      success: true,
      message: "Pet updated successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const deletePetWithResponse = async (petId: string): Promise<PetServiceResponse<void>> => {
  try {
    await deletePet(petId);
    return {
      success: true,
      message: "Pet deleted successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Pet statistics helper functions
export const getPetStatistics = async (userId: string) => {
  try {
    const pets = await getPetsByUser(userId);
    
    const stats = {
      totalPets: pets.length,
      averageAge: pets.length > 0 ? pets.reduce((sum, pet) => sum + pet.age, 0) / pets.length : 0,
      totalWeight: pets.reduce((sum, pet) => sum + pet.weight, 0),
      oldestPet: pets.length > 0 ? Math.max(...pets.map(pet => pet.age)) : 0,
      heaviestPet: pets.length > 0 ? Math.max(...pets.map(pet => pet.weight)) : 0,
      petTypes: pets.reduce((acc, pet) => {
        const breed = pet.breed.toLowerCase();
        let type = 'other';
        
        if (['labrador', 'german shepherd', 'golden retriever', 'bulldog', 'beagle', 'poodle', 'husky', 'boxer', 'dachshund', 'shih tzu'].some(dogBreed => breed.includes(dogBreed.toLowerCase()))) {
          type = 'dog';
        } else if (['siamese', 'persian', 'maine coon', 'bengal', 'sphynx', 'british shorthair', 'ragdoll', 'scottish fold', 'american shorthair', 'russian blue'].some(catBreed => breed.includes(catBreed.toLowerCase()))) {
          type = 'cat';
        } else if (['parakeet', 'cockatiel', 'lovebird', 'canary', 'finch', 'parrotlet', 'conure', 'african grey', 'macaw', 'cockatoo'].some(birdBreed => breed.includes(birdBreed.toLowerCase()))) {
          type = 'bird';
        }
        
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
    
    return stats;
  } catch (error) {
    console.error("Error calculating pet statistics:", error);
    throw error;
  }
};