import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from "react-native";
import { auth } from "../../firebase";
import { addPet, deletePet, getPetsByUser, updatePet } from "../../services/petService";
import { Pet, PetFormData } from "../../types/pet";

const Profile = () => {
  // State management
  const [pets, setPets] = useState<Pet[]>([]);
  const [formData, setFormData] = useState<PetFormData>({
    name: "",
    breed: "",
    age: "",
    weight: "",
    image: undefined
  });
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const userId = auth.currentUser?.uid || "";

  // Form helpers
  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      breed: "",
      age: "",
      weight: "",
      image: undefined
    });
    setEditingPetId(null);
    setShowAddForm(false);
  }, []);

  const updateFormField = useCallback((field: keyof PetFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Data operations
  const loadPets = async (showLoader = false) => {
    if (!userId) return;
    
    try {
      if (showLoader) setLoading(true);
      setRefreshing(true);
      
      const data = await getPetsByUser(userId);
      setPets(data);
    } catch (error) {
      console.error("Error loading pets:", error);
      Alert.alert("Error", "Failed to load pets. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const validateForm = (): boolean => {
    const { name, breed, age, weight } = formData;
    
    if (!name.trim()) {
      Alert.alert("Validation Error", "Pet name is required");
      return false;
    }
    
    if (!breed.trim()) {
      Alert.alert("Validation Error", "Pet breed is required");
      return false;
    }
    
    const ageNum = Number(age);
    if (!age.trim() || isNaN(ageNum) || ageNum < 0 || ageNum > 30) {
      Alert.alert("Validation Error", "Please enter a valid age (0-30 years)");
      return false;
    }
    
    const weightNum = Number(weight);
    if (!weight.trim() || isNaN(weightNum) || weightNum <= 0 || weightNum > 200) {
      Alert.alert("Validation Error", "Please enter a valid weight (0.1-200 kg)");
      return false;
    }
    
    return true;
  };

  // Image picker functions
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        updateFormField('image', result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        updateFormField('image', result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo");
    }
  };

  // CRUD operations
  const handleAddOrUpdatePet = async () => {
    if (!userId) {
      Alert.alert("Authentication Error", "Please login first");
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    try {
      const petData: Partial<Pet> = {
        userId,
        name: formData.name.trim(),
        breed: formData.breed.trim(),
        age: Number(formData.age),
        weight: Number(formData.weight),
        image: formData.image || undefined,
      };

      if (editingPetId) {
        await updatePet(editingPetId, petData);
        Alert.alert("Success", "Pet updated successfully!");
      } else {
        await addPet(petData as Pet);
        Alert.alert("Success", "Pet added successfully!");
      }

      resetForm();
      await loadPets();
    } catch (error) {
      console.error("Pet operation error:", error);
      Alert.alert(
        "Error", 
        `Failed to ${editingPetId ? 'update' : 'add'} pet. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditPet = (pet: Pet) => {
    if (!pet.id) {
      Alert.alert("Error", "Cannot edit pet: Invalid pet data");
      return;
    }

    setEditingPetId(pet.id);
    setFormData({
      name: pet.name,
      breed: pet.breed,
      age: String(pet.age),
      weight: String(pet.weight),
      image: pet.image
    });
    setShowAddForm(true);
  };

  const handleDeletePet = (pet: Pet) => {
    if (!pet.id) {
      Alert.alert("Error", "Cannot delete pet: Invalid pet data");
      return;
    }

    Alert.alert(
      "Delete Pet",
      `Are you sure you want to delete ${pet.name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            setLoading(true);
            try {
              await deletePet(pet.id);
              await loadPets();
              Alert.alert("Success", `${pet.name} has been deleted successfully`);
            } catch (error) {
              console.error("Delete error:", error);
              Alert.alert("Error", "Failed to delete pet. Please try again.");
            } finally {
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  // Effects
  useEffect(() => {
    if (userId) {
      loadPets(true);
    }
  }, [userId]);

  // Calculated values
  const petCount = pets.length;
  const dueVaccines = 2; // Replace with actual logic
  const mealsToday = 3; // Replace with actual logic

  if (!userId) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="person-off" size={48} color="#ccc" />
        <Text style={styles.errorText}>Please log in to view your pets</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PawPal Dashboard 🐾</Text>
        <Text style={styles.headerSubtitle}>
          Welcome back! You have {petCount} pet{petCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialIcons name="pets" size={24} color="#007AFF" />
          <Text style={styles.statNumber}>{petCount}</Text>
          <Text style={styles.statLabel}>Pets</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="medical-services" size={24} color="#FF6B6B" />
          <Text style={styles.statNumber}>{dueVaccines}</Text>
          <Text style={styles.statLabel}>Due Vaccines</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="restaurant" size={24} color="#4ECDC4" />
          <Text style={styles.statNumber}>{mealsToday}</Text>
          <Text style={styles.statLabel}>Meals Today</Text>
        </View>
      </View>

      {/* Add Pet Button */}
      <TouchableOpacity
        style={[styles.addButton, loading && styles.disabledButton]}
        onPress={() => setShowAddForm(!showAddForm)}
        disabled={loading}
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
            value={formData.name}
            onChangeText={(value) => updateFormField('name', value)}
            style={styles.input}
            maxLength={50}
          />
          <TextInput
            placeholder="Breed"
            value={formData.breed}
            onChangeText={(value) => updateFormField('breed', value)}
            style={styles.input}
            maxLength={50}
          />
          <TextInput
            placeholder="Age (years)"
            value={formData.age}
            onChangeText={(value) => updateFormField('age', value)}
            keyboardType="numeric"
            style={styles.input}
            maxLength={2}
          />
          <TextInput
            placeholder="Weight (kg)"
            value={formData.weight}
            onChangeText={(value) => updateFormField('weight', value)}
            keyboardType="decimal-pad"
            style={styles.input}
            maxLength={5}
          />

          {/* Image Picker */}
          <View style={styles.imagePickerContainer}>
            <TouchableOpacity 
              onPress={pickImage} 
              style={styles.imageButton}
              disabled={loading}
            >
              <MaterialIcons name="photo-library" size={20} color="white" />
              <Text style={styles.imageButtonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={takePhoto} 
              style={styles.cameraButton}
              disabled={loading}
            >
              <MaterialIcons name="camera-alt" size={20} color="white" />
              <Text style={styles.imageButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>

          {formData.image && (
            <Image source={{ uri: formData.image }} style={styles.previewImage} />
          )}

          <TouchableOpacity
            onPress={handleAddOrUpdatePet}
            style={[styles.saveButton, loading && styles.disabledButton]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>
                {editingPetId ? "Update Pet" : "Save Pet"}
              </Text>
            )}
          </TouchableOpacity>

          {editingPetId && (
            <TouchableOpacity 
              onPress={resetForm} 
              style={styles.cancelButton}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Pets List */}
      <View style={styles.petsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Pets</Text>
          {refreshing && <ActivityIndicator size="small" color="#007AFF" />}
        </View>
        
        {loading && pets.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading your pets...</Text>
          </View>
        ) : pets.length === 0 ? (
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
                    {pet.age} year{pet.age !== 1 ? 's' : ''} • {pet.weight}kg
                  </Text>
                </View>
              </View>
              
              <View style={styles.petActions}>
                <TouchableOpacity
                  onPress={() => handleEditPet(pet)}
                  style={[styles.editButton, loading && styles.disabledButton]}
                  disabled={loading}
                >
                  <MaterialIcons name="edit" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeletePet(pet)}
                  style={[styles.deleteButton, loading && styles.disabledButton]}
                  disabled={loading}
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
  disabledButton: {
    opacity: 0.6,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  errorText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
    textAlign: "center",
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

export default Profile;