// export interface Pet {
//   id?: string;
//   userId: string;
//   name: string;
//   breed: string;
//   age: number;
//   weight: number;
//   healthHistory?: string;
//   createdAt?: Date;
//   image?: string;
// }

export interface Pet {
  id?: string;
  userId: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  healthHistory?: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Additional types for better type safety
export interface PetFormData {
  name: string;
  breed: string;
  age: string; // String for form inputs
  weight: string; // String for form inputs
  image?: string;
}

export interface PetCreateData extends Omit<Pet, 'id' | 'createdAt' | 'updatedAt'> {
  // Ensures all required fields are present when creating
}

export interface PetUpdateData extends Partial<Omit<Pet, 'id' | 'userId' | 'createdAt'>> {
  // Allows partial updates but prevents changing id, userId, or createdAt
}

// Validation schemas (optional - for runtime validation)
export const PetValidation = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z\s\-']+$/
  },
  breed: {
    required: true,
    minLength: 1,
    maxLength: 50
  },
  age: {
    required: true,
    min: 0,
    max: 30
  },
  weight: {
    required: true,
    min: 0.1,
    max: 200
  },
  healthHistory: {
    required: false,
    maxLength: 500
  }
} as const;

// Utility type for API responses
export interface PetServiceResponse<T = Pet> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}