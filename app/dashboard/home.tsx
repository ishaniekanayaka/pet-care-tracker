import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import React, { useState, useEffect } from "react";
import { addPet, getPetsByUser } from "../../services/petService";
import { Pet } from "../../types/pet";
import { auth } from "../../firebase";

const Home = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");

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

    if (!name || !breed || !age || !weight) {
      Alert.alert("Please fill all fields");
      return;
    }

    try {
      const newPet: Pet = {
        userId,
        name,
        breed,
        age: Number(age),
        weight: Number(weight),
      };
      await addPet(newPet);
      Alert.alert("Pet added!");
      setName(""); setBreed(""); setAge(""); setWeight(""); // reset form
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

      {/* Pet Form */}
      <TextInput
        placeholder="Pet Name"
        value={name}
        onChangeText={setName}
        className="border p-2 mb-2 rounded"
      />
      <TextInput
        placeholder="Breed"
        value={breed}
        onChangeText={setBreed}
        className="border p-2 mb-2 rounded"
      />
      <TextInput
        placeholder="Age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
        className="border p-2 mb-2 rounded"
      />
      <TextInput
        placeholder="Weight (kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
        className="border p-2 mb-2 rounded"
      />

      <TouchableOpacity
        onPress={handleAddPet}
        className="bg-blue-500 p-3 rounded-xl mb-4"
      >
        <Text className="text-white text-center font-semibold">
          + Add Pet
        </Text>
      </TouchableOpacity>

      {/* Pets List */}
      {pets.map((pet) => (
        <View key={pet.id} className="bg-gray-100 p-4 rounded-xl mb-3">
          <Text className="font-bold text-lg">{pet.name}</Text>
          <Text>{pet.breed} - {pet.age} years</Text>
          <Text>Weight: {pet.weight}kg</Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default Home;
