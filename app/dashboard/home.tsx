
import { 
  View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Image, StyleSheet 
} from "react-native";
import React, { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { addPet, getPetsByUser, deletePet, updatePet } from "../../services/petService";
import { Pet } from "../../types/pet";
import { auth } from "../../firebase";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const Home = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const userId = auth.currentUser?.uid || "";

  const loadPets = async () => {
    if (!userId) return;
    try {
      const data = await getPetsByUser(userId);
      setPets(data);
    } catch (error) {
      console.error("Error loading pets:", error);
    }
  };

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
      Alert.alert("Error", "Please login first");
      return;
    }

    if (!name || !breed || !age || !weight) {
      Alert.alert("Error", "Please fill all fields");
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
        Alert.alert("Success", "Pet updated successfully!");
        setEditingPetId(null);
      } else {
        await addPet(petData as Pet);
        Alert.alert("Success", "Pet added successfully!");
      }

      resetForm();
      loadPets();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save pet");
    }
  };

  const resetForm = () => {
    setName("");
    setBreed("");
    setAge("");
    setWeight("");
    setImageUri(null);
    setShowAddForm(false);
  };

  const handleEditPet = (pet: Pet) => {
    setEditingPetId(pet.id || null);
    setName(pet.name);
    setBreed(pet.breed);
    setAge(String(pet.age));
    setWeight(String(pet.weight));
    setImageUri(pet.image || null);
    setShowAddForm(true);
  };

  const handleDeletePet = (petId: string) => {
    Alert.alert(
      "Delete Pet",
      "Are you sure you want to delete this pet?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deletePet(petId);
              loadPets();
              Alert.alert("Success", "Pet deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete pet");
            }
          }
        },
      ]
    );
  };

  useEffect(() => {
    loadPets();
  }, [userId]);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PawPal Dashboard 🐾</Text>
        <Text style={styles.headerSubtitle}>
          Welcome back! You have {pets.length} pet{pets.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialIcons name="pets" size={24} color="#007AFF" />
          <Text style={styles.statNumber}>{pets.length}</Text>
          <Text style={styles.statLabel}>Pets</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="medical-services" size={24} color="#FF6B6B" />
          <Text style={styles.statNumber}>2</Text>
          <Text style={styles.statLabel}>Due Vaccines</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="restaurant" size={24} color="#4ECDC4" />
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Meals Today</Text>
        </View>
      </View>

      {/* Add Pet Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddForm(!showAddForm)}
      >
        <MaterialIcons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>
          {showAddForm ? "Cancel" : "Add New Pet"}
        </Text>
      </TouchableOpacity>

      {/* Add/Edit Pet Form */}
      {showAddForm && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {editingPetId ? "Edit Pet" : "Add New Pet"}
          </Text>
          
          <TextInput
            placeholder="Pet Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TextInput
            placeholder="Breed"
            value={breed}
            onChangeText={setBreed}
            style={styles.input}
          />
          <TextInput
            placeholder="Age (years)"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            placeholder="Weight (kg)"
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            style={styles.input}
          />

          {/* Image Picker */}
          <View style={styles.imagePickerContainer}>
            <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
              <MaterialIcons name="photo-library" size={20} color="white" />
              <Text style={styles.imageButtonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={takePhoto} style={styles.cameraButton}>
              <MaterialIcons name="camera-alt" size={20} color="white" />
              <Text style={styles.imageButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>

          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          )}

          <TouchableOpacity
            onPress={handleAddOrUpdatePet}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>
              {editingPetId ? "Update Pet" : "Save Pet"}
            </Text>
          </TouchableOpacity>

          {editingPetId && (
            <TouchableOpacity onPress={resetForm} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Pets List */}
      <View style={styles.petsSection}>
        <Text style={styles.sectionTitle}>Your Pets</Text>
        {pets.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="pets" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No pets added yet</Text>
            <Text style={styles.emptySubtext}>Add your first pet to get started!</Text>
          </View>
        ) : (
          pets.map((pet) => (
            <View key={pet.id} style={styles.petCard}>
              <View style={styles.petInfo}>
                {pet.image ? (
                  <Image source={{ uri: pet.image }} style={styles.petImage} />
                ) : (
                  <View style={styles.placeholderImage}>
                    <MaterialIcons name="pets" size={32} color="#ccc" />
                  </View>
                )}
                <View style={styles.petDetails}>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.petBreed}>{pet.breed}</Text>
                  <Text style={styles.petStats}>
                    {pet.age} years • {pet.weight}kg
                  </Text>
                </View>
              </View>
              
              <View style={styles.petActions}>
                <TouchableOpacity
                  onPress={() => handleEditPet(pet)}
                  style={styles.editButton}
                >
                  <MaterialIcons name="edit" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeletePet(pet.id!)}
                  style={styles.deleteButton}
                >
                  <MaterialIcons name="delete" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#007AFF",
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    margin: 20,
    marginTop: -30,
  },
  statCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  addButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 20,
    padding: 15,
    borderRadius: 12,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
  },
  formContainer: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  imagePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  imageButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
    justifyContent: "center",
  },
  cameraButton: {
    backgroundColor: "#FF9800",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
    justifyContent: "center",
  },
  imageButtonText: {
    color: "white",
    marginLeft: 5,
    fontWeight: "bold",
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#6c757d",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  petsSection: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "white",
    borderRadius: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
  },
  petCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  petInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  petDetails: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  petBreed: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  petStats: {
    fontSize: 12,
    color: "#999",
  },
  petActions: {
    flexDirection: "row",
  },
  editButton: {
    backgroundColor: "#FFA500",
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: "#FF4757",
    padding: 8,
    borderRadius: 8,
  },
});

export default Home;