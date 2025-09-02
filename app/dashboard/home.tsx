import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import React, { useState, useEffect } from "react";
import { addPet, getPetsByUser } from "../../services/petService";
import { Pet } from "../../types/pet";
import { auth } from "../../firebase";

const Home = () => {
  const [pets, setPets] = useState<Pet[]>([]);

  const userId = auth.currentUser?.uid || "";

  const loadPets = async () => {
    if (!userId) return;
    const data = await getPetsByUser(userId);
    setPets(data);
  };

  const handleAddPet = async () => {
    if (!userId) {
      Alert.alert("Please login first");
      return;
    }
    try {
      const newPet: Pet = {
        userId,
        name: "Coco",
        breed: "Golden Retriever",
        age: 3,
        weight: 18,
      };
      await addPet(newPet);
      Alert.alert("Pet added!");
      loadPets();
    } catch (error) {
      console.error(error);
      Alert.alert("Error adding pet");
    }
  };

  useEffect(() => {
    loadPets();
  }, []);

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-4">Dashboard 🐾</Text>

      <TouchableOpacity
        onPress={handleAddPet}
        className="bg-blue-500 p-3 rounded-xl mb-4"
      >
        <Text className="text-white text-center font-semibold">
          + Add Pet
        </Text>
      </TouchableOpacity>

      {pets.map((pet) => (
        <View
          key={pet.id}
          className="bg-gray-100 p-4 rounded-xl mb-3"
        >
          <Text className="font-bold text-lg">{pet.name}</Text>
          <Text>{pet.breed} - {pet.age} years</Text>
          <Text>Weight: {pet.weight}kg</Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default Home;
