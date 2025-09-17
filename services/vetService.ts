// services/vetService.ts
import { db } from "../firebase"; 
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy 
} from "firebase/firestore";

export interface Vet {
  id?: string;
  name: string;
  address: string;
  contact: string;
  district: string;
  emergency?: boolean;
  rating?: number;
  distance?: string;
  createdAt?: any;
  updatedAt?: any;
}

const vetsCollection = collection(db, "vets");

/**
 * Get vets filtered by district
 */
export const getVetsByDistrict = async (district: string): Promise<Vet[]> => {
  try {
    const q = query(
      vetsCollection, 
      where("district", "==", district),
      orderBy("name", "asc")
    );
    const querySnapshot = await getDocs(q);
    const vets: Vet[] = [];
    querySnapshot.forEach((doc) => {
      vets.push({ id: doc.id, ...(doc.data() as Vet) });
    });
    return vets;
  } catch (error) {
    console.error("Error fetching vets by district:", error);
    return [];
  }
};

/**
 * Get all vets without filtering
 */
export const getAllVets = async (): Promise<Vet[]> => {
  try {
    const q = query(vetsCollection, orderBy("district", "asc"), orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    const vets: Vet[] = [];
    querySnapshot.forEach((doc) => {
      vets.push({ id: doc.id, ...(doc.data() as Vet) });
    });
    return vets;
  } catch (error) {
    console.error("Error fetching all vets:", error);
    return [];
  }
};

/**
 * Get emergency vets only
 */
export const getEmergencyVets = async (): Promise<Vet[]> => {
  try {
    const q = query(
      vetsCollection, 
      where("emergency", "==", true),
      orderBy("name", "asc")
    );
    const querySnapshot = await getDocs(q);
    const vets: Vet[] = [];
    querySnapshot.forEach((doc) => {
      vets.push({ id: doc.id, ...(doc.data() as Vet) });
    });
    return vets;
  } catch (error) {
    console.error("Error fetching emergency vets:", error);
    return [];
  }
};

/**
 * Add a new vet clinic
 */
export const addVet = async (vetData: Omit<Vet, 'id'>): Promise<string> => {
  try {
    const newVet = {
      ...vetData,
      emergency: vetData.emergency || false,
      rating: vetData.rating || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const docRef = await addDoc(vetsCollection, newVet);
    console.log("Vet added with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding vet:", error);
    throw error;
  }
};

/**
 * Update an existing vet clinic
 */
export const updateVet = async (vetId: string, updates: Partial<Vet>): Promise<void> => {
  try {
    const vetRef = doc(db, "vets", vetId);
    await updateDoc(vetRef, {
      ...updates,
      updatedAt: new Date(),
    });
    console.log("Vet updated successfully");
  } catch (error) {
    console.error("Error updating vet:", error);
    throw error;
  }
};

/**
 * Delete a vet clinic
 */
export const deleteVet = async (vetId: string): Promise<void> => {
  try {
    const vetRef = doc(db, "vets", vetId);
    await deleteDoc(vetRef);
    console.log("Vet deleted successfully");
  } catch (error) {
    console.error("Error deleting vet:", error);
    throw error;
  }
};

/**
 * Search vets by name, address, or district
 */
export const searchVets = async (searchTerm: string): Promise<Vet[]> => {
  try {
    // Firestore doesn't support full-text search, so we get all vets and filter client-side
    // For production, consider using Algolia or similar for better search
    const allVets = await getAllVets();
    
    const filteredVets = allVets.filter(vet => 
      vet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vet.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vet.district.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filteredVets;
  } catch (error) {
    console.error("Error searching vets:", error);
    return [];
  }
};

/**
 * Get vets by multiple districts
 */
export const getVetsByDistricts = async (districts: string[]): Promise<Vet[]> => {
  try {
    if (districts.length === 0) return [];
    
    const promises = districts.map(district => getVetsByDistrict(district));
    const results = await Promise.all(promises);
    
    // Flatten and remove duplicates
    const allVets = results.flat();
    const uniqueVets = allVets.filter((vet, index, self) => 
      index === self.findIndex(v => v.id === vet.id)
    );
    
    return uniqueVets.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching vets by districts:", error);
    return [];
  }
};

/**
 * Get vet statistics
 */
export const getVetStats = async () => {
  try {
    const allVets = await getAllVets();
    
    const stats = {
      total: allVets.length,
      emergency: allVets.filter(vet => vet.emergency).length,
      clinics: allVets.filter(vet => !vet.emergency).length,
      districts: [...new Set(allVets.map(vet => vet.district))].length,
      districtBreakdown: allVets.reduce((acc, vet) => {
        acc[vet.district] = (acc[vet.district] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
    
    return stats;
  } catch (error) {
    console.error("Error getting vet statistics:", error);
    return {
      total: 0,
      emergency: 0,
      clinics: 0,
      districts: 0,
      districtBreakdown: {}
    };
  }
};

// Sample data seeder function for initial setup
export const seedSampleVets = async (): Promise<void> => {
  try {
    const sampleVets: Omit<Vet, 'id'>[] = [
      {
        name: 'Colombo Pet Hospital',
        address: '123 Galle Road, Colombo 03',
        contact: '+94112345678',
        district: 'Colombo',
        emergency: true,
        rating: 4.8
      },
      {
        name: 'Kandy Animal Clinic',
        address: '456 Peradeniya Road, Kandy',
        contact: '+94812345678',
        district: 'Kandy',
        emergency: false,
        rating: 4.5
      },
      {
        name: 'Galle Veterinary Center',
        address: '789 Main Street, Galle',
        contact: '+94912345678',
        district: 'Galle',
        emergency: false,
        rating: 4.2
      },
      {
        name: '24/7 Pet Emergency Negombo',
        address: '321 Beach Road, Negombo',
        contact: '+94312345678',
        district: 'Gampaha',
        emergency: true,
        rating: 4.6
      },
      {
        name: 'Jaffna Animal Hospital',
        address: '654 Hospital Road, Jaffna',
        contact: '+94212345678',
        district: 'Jaffna',
        emergency: true,
        rating: 4.4
      }
    ];

    // Check if vets already exist to avoid duplicates
    const existingVets = await getAllVets();
    if (existingVets.length === 0) {
      const promises = sampleVets.map(vet => addVet(vet));
      await Promise.all(promises);
      console.log('Sample vets added successfully');
    } else {
      console.log('Vets already exist, skipping seed');
    }
  } catch (error) {
    console.error("Error seeding sample vets:", error);
  }
};