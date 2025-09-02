import { 
  View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Image 
} from "react-native";
import React, { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { addPet, getPetsByUser, deletePet, updatePet } from "../../services/petService";
import { Pet } from "../../types/pet";
import { auth } from "../../firebase";

const Home = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);

  const userId = auth.currentUser?.uid || "";

  const loadPets = async () => {
    if (!userId) return;
    const data = await getPetsByUser(userId);
    setPets(data);
  };

  // Pick image from gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleAddOrUpdatePet = async () => {
    if (!userId) {
      Alert.alert("Please login first");
      return;
    }

    if (!name || !breed || !age || !weight) {
      Alert.alert("Please fill all fields");
      return;
    }

    try {
      const petData: Partial<Pet> = {
        userId,
        name,
        breed,
        age: Number(age),
        weight: Number(weight),
        image: imageUri || undefined,
      };

      if (editingPetId) {
        await updatePet(editingPetId, petData);
        Alert.alert("Pet updated!");
        setEditingPetId(null);
      } else {
        await addPet(petData as Pet);
        Alert.alert("Pet added!");
      }

      // Reset form
      setName(""); setBreed(""); setAge(""); setWeight(""); setImageUri(null);
      loadPets();
    } catch (error) {
      console.error(error);
      Alert.alert("Error saving pet");
    }
  };

  const handleEditPet = (pet: Pet) => {
    setEditingPetId(pet.id || null);
    setName(pet.name);
    setBreed(pet.breed);
    setAge(String(pet.age));
    setWeight(String(pet.weight));
    setImageUri(pet.image || null);
  };

  const handleDeletePet = (petId: string) => {
    Alert.alert(
      "Delete Pet",
      "Are you sure you want to delete this pet?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
          await deletePet(petId);
          loadPets();
        }},
      ]
    );
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

      {/* Image Picker */}
      <View className="flex-row justify-between mb-4">
        <TouchableOpacity
          onPress={pickImage}
          className="bg-green-500 p-2 rounded flex-1 mr-2"
        >
          <Text className="text-white text-center">Select from Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={takePhoto}
          className="bg-orange-500 p-2 rounded flex-1 ml-2"
        >
          <Text className="text-white text-center">Take Photo</Text>
        </TouchableOpacity>
      </View>

      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          className="w-32 h-32 mb-4 rounded"
          resizeMode="cover"
        />
      )}

      <TouchableOpacity
        onPress={handleAddOrUpdatePet}
        className="bg-blue-500 p-3 rounded-xl mb-4"
      >
        <Text className="text-white text-center font-semibold">
          {editingPetId ? "Update Pet" : "+ Add Pet"}
        </Text>
      </TouchableOpacity>

      {/* Pets List */}
      {pets.map((pet) => (
        <View key={pet.id} className="bg-gray-100 p-4 rounded-xl mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            {pet.image && (
              <Image
                source={{ uri: pet.image }}
                className="w-16 h-16 rounded mr-4"
                resizeMode="cover"
              />
            )}
            <View>
              <Text className="font-bold text-lg">{pet.name}</Text>
              <Text>{pet.breed} - {pet.age} years</Text>
              <Text>Weight: {pet.weight}kg</Text>
            </View>
          </View>

          {/* Edit & Delete Buttons */}
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => handleEditPet(pet)}
              className="bg-yellow-500 p-2 rounded mr-2"
            >
              <Text className="text-white">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeletePet(pet.id!)}
              className="bg-red-500 p-2 rounded"
            >
              <Text className="text-white">Delete</Text>
            </TouchableOpacity>

          </View>
        </View>
      ))}
    </ScrollView>
  );
};

export default Home;
