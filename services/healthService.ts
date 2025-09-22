// import { db } from "@/firebase";
// import {
//   addDoc,
//   collection,
//   deleteDoc,
//   doc,
//   getDocs,
//   query,
//   updateDoc,
//   where,
//   Timestamp,
//   getDoc,
// } from "firebase/firestore";
// import { HealthRecord } from "../types/health";
// import { Pet } from "@/types/pet";

// import { scheduleHealthReminder } from "./healthReminderService";
// const healthCollection = collection(db, "healthRecords");

// // Add a new health record
// // export const addHealthRecord = async (record: HealthRecord) => {
// //   try {
// //     const docRef = await addDoc(healthCollection, {
// //       ...record,
// //       createdAt: Timestamp.now(),
// //     });
// //     return { success: true, id: docRef.id };
// //   } catch (error) {
// //     console.error("Error adding health record:", error);
// //     return { success: false, error };
// //   }
// // };

// export const addHealthRecord = async (record: HealthRecord) => {
//   try {
//     const docRef = await addDoc(healthCollection, {
//       ...record,
//       createdAt: Timestamp.now(),
//     });

//     // 📌 Schedule reminder
//     const pet = await getPetById(record.petId);
//     if (pet && record.nextDue) {
//       await scheduleHealthReminder(pet.name, { ...record, id: docRef.id });
//     }

//     return { success: true, id: docRef.id };
//   } catch (error) {
//     console.error("Error adding health record:", error);
//     return { success: false, error };
//   }
// };


// // Get records by Pet (with id included)
// export const getHealthRecordsByPet = async (
//   petId: string
// ): Promise<(HealthRecord & { id: string })[]> => {
//   try {
//     const q = query(healthCollection, where("petId", "==", petId));
//     const snapshot = await getDocs(q);
//     return snapshot.docs.map((docSnap) => ({
//       id: docSnap.id,
//       ...(docSnap.data() as HealthRecord),
//     }));
//   } catch (error) {
//     console.error("Error fetching health records:", error);
//     return [];
//   }
// };

// export const getPetById = async (petId: string): Promise<Pet | null> => {
//   try {
//     console.log('Fetching pet with ID:', petId);
//     const petDoc = await getDoc(doc(db, "pets", petId));
    
//     if (petDoc.exists()) {
//       const petData = {
//         id: petDoc.id,
//         ...petDoc.data(),
//       } as Pet;
//       console.log('Pet found:', petData);
//       return petData;
//     } else {
//       console.log("No pet found with ID:", petId);
//       return null;
//     }
//   } catch (error) {
//     console.error("Error fetching pet by ID:", error);
//     throw error; // Re-throw to handle in component
//   }
// };

// // Update record
// export const updateHealthRecord = async (
//   recordId: string, 
//   data: Partial<HealthRecord>
// ) => {
//   try {
//     await updateDoc(doc(db, "healthRecords", recordId), {
//       ...data,
//       updatedAt: Timestamp.now(),
//     });
//     return { success: true };
//   } catch (error) {
//     console.error("Error updating health record:", error);
//     return { success: false, error };
//   }
// };

// // Delete record
// export const deleteHealthRecord = async (recordId: string) => {
//   try {
//     await deleteDoc(doc(db, "healthRecords", recordId));
//     return { success: true };
//   } catch (error) {
//     console.error("Error deleting health record:", error);
//     return { success: false, error };
//   }
// };

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

import { scheduleHealthReminder } from "./healthReminderService";

const healthCollection = collection(db, "healthRecords");

// Health guidelines data
export const healthGuidelines = [
  {
    category: "Vaccinations",
    icon: "vaccines",
    color: "#896C6C",
    webUrl: "https://www.avma.org/resources/pet-owners/petcare/vaccinations",
    tips: [
      "Core vaccines: DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza)",
      "Rabies vaccination required by law in most areas",
      "Annual boosters recommended for adult pets",
      "Puppies need series of vaccinations starting at 6-8 weeks",
      "Keep vaccination records up to date for boarding/travel"
    ]
  },
  {
    category: "Regular Checkups",
    icon: "medical-services",
    color: "#5D688A",
    webUrl: "https://www.aaha.org/your-pet/pet-owner-education/",
    tips: [
      "Annual wellness exams for healthy adult pets",
      "Senior pets (7+ years) need bi-annual checkups",
      "Early detection prevents serious health issues",
      "Dental examinations should be part of routine care",
      "Weight monitoring helps prevent obesity-related problems"
    ]
  },
  {
    category: "Preventive Care",
    icon: "health-and-safety",
    color: "#A8BBA3",
    webUrl: "https://www.petmd.com/dog/care",
    tips: [
      "Monthly flea and tick prevention year-round",
      "Regular deworming based on lifestyle and risk",
      "Heartworm prevention in mosquito-active areas",
      "Spaying/neutering prevents health and behavioral issues",
      "Regular grooming maintains skin and coat health"
    ]
  },
  {
    category: "Emergency Preparedness",
    icon: "emergency",
    color: "#FF6B6B",
    webUrl: "https://www.aspca.org/pet-care/general-pet-care/disaster-preparedness",
    tips: [
      "Know your nearest 24-hour emergency vet clinic",
      "Keep emergency contact numbers easily accessible",
      "Basic first aid kit for minor injuries",
      "Signs requiring immediate attention: difficulty breathing, seizures, bleeding",
      "Keep recent photos and medical records for identification"
    ]
  },
  {
    category: "Nutrition & Diet",
    icon: "restaurant",
    color: "#FF9800",
    webUrl: "https://www.petnutritionalliance.org/",
    tips: [
      "High-quality pet food appropriate for life stage",
      "Measure portions to prevent overfeeding",
      "Fresh water available at all times",
      "Avoid toxic foods: chocolate, grapes, onions, garlic",
      "Consult vet before changing diets or adding supplements"
    ]
  },
  {
    category: "Exercise & Mental Health",
    icon: "directions-run",
    color: "#4CAF50",
    webUrl: "https://www.akc.org/expert-advice/health/exercise-dogs-guide/",
    tips: [
      "Daily exercise requirements vary by breed and age",
      "Mental stimulation through training and puzzle toys",
      "Socialization with other pets and people",
      "Regular play sessions strengthen bonds",
      "Indoor cats need environmental enrichment"
    ]
  }
];

// Add a new health record
export const addHealthRecord = async (record: HealthRecord) => {
  try {
    const docRef = await addDoc(healthCollection, {
      ...record,
      createdAt: Timestamp.now(),
    });

    // 📌 Schedule reminder
    const pet = await getPetById(record.petId);
    if (pet && record.nextDue) {
      await scheduleHealthReminder(pet.name, { ...record, id: docRef.id });
    }

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