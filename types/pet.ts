export interface Pet {
  id?: string;
  userId: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  healthHistory?: string;
  createdAt?: Date;
}
