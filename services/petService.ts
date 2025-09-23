import axios from 'axios';
import { db } from "@/firebase";
import { 
  collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc,
  DocumentData, QuerySnapshot, getDoc, Timestamp
} from "firebase/firestore";
import { Pet, PetCreateData, PetUpdateData, PetServiceResponse } from "../types/pet";

// === Cloudinary Config ===
const CLOUD_NAME = 'dwcvrttrd';
const UPLOAD_PRESET = 'pet_care';

export const uploadImageToCloudinary = async (imageUri: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await axios.post<{ secure_url: string }>(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return response.data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

// === Firebase Pet Service ===
const COLLECTION_NAME = "pets";
const petsCollection = collection(db, COLLECTION_NAME);

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

const validatePetId = (petId?: string): string => {
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
    image: data.image, // already a Cloudinary URL
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate()
  } as Pet;
};


// === CRUD Functions with Cloudinary ===
export const addPet = async (petData: PetCreateData): Promise<string> => {
  validatePetData(petData);
  validateUserId(petData.userId);

  let imageUrl = petData.image;
  if (petData.image && petData.image.startsWith('file://')) {
    // local file -> upload to Cloudinary
    imageUrl = await uploadImageToCloudinary(petData.image);
  }

  const docRef = await addDoc(petsCollection, {
    ...petData,
    image: imageUrl,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });

  return docRef.id;
};
export const getPetsByUser = async (userId: string): Promise<Pet[]> => {
  validateUserId(userId);
  const q = query(petsCollection, where("userId", "==", userId.trim()));
  const snapshot: QuerySnapshot = await getDocs(q);
  return snapshot.docs.map(transformDocumentToPet)
    .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
};

export const getPetById = async (petId: string): Promise<Pet | null> => {
  const validatedPetId = validatePetId(petId);
  const petDocRef = doc(db, COLLECTION_NAME, validatedPetId);
  const petDoc = await getDoc(petDocRef);
  return petDoc.exists() ? transformDocumentToPet(petDoc) : null;
};

export const updatePet = async (petId: string | undefined, petData: PetUpdateData): Promise<void> => {
  const validatedPetId = validatePetId(petId);
  validatePetData(petData);

  let imageUrl = petData.image;
  if (petData.image && petData.image.startsWith('file://')) {
    imageUrl = await uploadImageToCloudinary(petData.image);
  }

  const cleanedData = Object.fromEntries(
    Object.entries({ ...petData, image: imageUrl }).filter(([_, value]) => value !== undefined && value !== null)
  );

  await updateDoc(doc(db, COLLECTION_NAME, validatedPetId), { ...cleanedData, updatedAt: Timestamp.now() });
};

export const deletePet = async (petId?: string): Promise<void> => {
  const validatedPetId = validatePetId(petId);
  await deleteDoc(doc(db, COLLECTION_NAME, validatedPetId));
};

// === Optional Service Wrappers ===
export const addPetWithResponse = async (petData: PetCreateData): Promise<PetServiceResponse<string>> => {
  try { return { success: true, data: await addPet(petData), message: "Pet added successfully" }; }
  catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }; }
};

export const getPetsByUserWithResponse = async (userId: string): Promise<PetServiceResponse<Pet[]>> => {
  try { return { success: true, data: await getPetsByUser(userId), message: "Fetched pets successfully" }; }
  catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }; }
};

// === NEW: getPetsByType function ===
export const getPetsByType = async (userId: string, petType: string): Promise<Pet[]> => {
  const pets = await getPetsByUser(userId);
  if (petType === 'all') return pets;

  return pets.filter(pet => {
    const breed = pet.breed.toLowerCase();
    switch (petType.toLowerCase()) {
      case 'dog':
        return ['labrador','german shepherd','golden retriever','bulldog','beagle','poodle','husky','boxer','dachshund','shih tzu'].some(d => breed.includes(d));
      case 'cat':
        return ['siamese','persian','maine coon','bengal','sphynx','british shorthair','ragdoll','scottish fold','american shorthair','russian blue'].some(c => breed.includes(c));
      case 'bird':
        return ['parakeet','cockatiel','lovebird','canary','finch','parrotlet','conure','african grey','macaw','cockatoo'].some(b => breed.includes(b));
      case 'other':
        return ['rabbit','hamster','guinea pig','turtle','snake','lizard','fish','ferret','chinchilla','hedgehog'].some(o => breed.includes(o));
      default: return true;
    }
  });
};
