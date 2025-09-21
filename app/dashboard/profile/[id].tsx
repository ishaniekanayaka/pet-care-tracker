import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Animated,
  Dimensions,
  StyleSheet,
  StatusBar,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { auth } from "../../../firebase";
import { Pet, PetUpdateData } from "../../../types/pet";
import { getPetsByType, getPetsByUser, updatePet, deletePet } from "../../../services/petService";

const { width } = Dimensions.get("window");
const CARD_WIDTH = 180;

const ProfileIndex = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPetType, setSelectedPetType] = useState("all");
  const [scrollX] = useState(new Animated.Value(0));
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    breed: "",
    age: "",
    weight: "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const router = useRouter();
  const userId = auth.currentUser?.uid || "";

  const petTypes = [
    { id: "all", label: "All", icon: "pets" },
    { id: "dog", label: "Dogs", icon: "pets" },
    { id: "cat", label: "Cats", icon: "pets" },
    { id: "bird", label: "Birds", icon: "pets" },
    { id: "other", label: "Others", icon: "pets" },
  ];

  const loadPets = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      let petsData: Pet[] = [];
      if (selectedPetType === "all") {
        petsData = await getPetsByUser(userId);
      } else {
        petsData = await getPetsByType(userId, selectedPetType);
      }
      setPets(petsData);
      setFilteredPets(petsData);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load pets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPets();
  }, [userId, selectedPetType]);

  useEffect(() => {
    let filtered = pets;
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (pet) =>
          pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pet.breed.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredPets(filtered);
  }, [searchQuery, pets]);

  const handlePetSelect = (pet: Pet) => {
    if (pet.id) router.push(`/dashboard/profile/${pet.id}` as any);
    else Alert.alert("Error", "Pet ID missing!");
  };

  const handleAddNewPet = () => {
    router.push("/dashboard/profile/new" as any);
  };

  const handleEditPet = (pet: Pet) => {
    setEditingPet(pet);
    setEditFormData({
      name: pet.name,
      breed: pet.breed,
      age: pet.age.toString(),
      weight: pet.weight.toString(),
    });
  };

  const handleUpdatePet = async () => {
    if (!editingPet || !editingPet.id) return;

    // Validation
    if (!editFormData.name.trim()) {
      Alert.alert("Validation Error", "Pet name is required");
      return;
    }

    const ageNum = Number(editFormData.age);
    if (!editFormData.age.trim() || isNaN(ageNum) || ageNum < 0 || ageNum > 30) {
      Alert.alert("Validation Error", "Please enter a valid age (0-30 years)");
      return;
    }

    const weightNum = Number(editFormData.weight);
    if (!editFormData.weight.trim() || isNaN(weightNum) || weightNum <= 0 || weightNum > 200) {
      Alert.alert("Validation Error", "Please enter a valid weight (0.1-200 kg)");
      return;
    }

    setUpdateLoading(true);
    try {
      const updateData: PetUpdateData = {
        name: editFormData.name.trim(),
        breed: editFormData.breed.trim(),
        age: ageNum,
        weight: weightNum,
      };

      await updatePet(editingPet.id, updateData);
      
      // Update local state
      const updatedPets = pets.map(pet => 
        pet.id === editingPet.id 
          ? { ...pet, ...updateData }
          : pet
      );
      setPets(updatedPets);
      setFilteredPets(updatedPets.filter(pet => {
        if (!searchQuery.trim()) return true;
        return pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               pet.breed.toLowerCase().includes(searchQuery.toLowerCase());
      }));

      setEditingPet(null);
      Alert.alert("Success", "Pet updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Error", "Failed to update pet. Please try again.");
    } finally {
      setUpdateLoading(false);
    }
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
            try {
              await deletePet(pet.id!);
              const updatedPets = pets.filter(p => p.id !== pet.id);
              setPets(updatedPets);
              setFilteredPets(updatedPets);
              Alert.alert("Success", `${pet.name} has been deleted successfully`);
            } catch (error) {
              console.error("Delete error:", error);
              Alert.alert("Error", "Failed to delete pet. Please try again.");
            }
          }
        },
      ]
    );
  };

  const petCount = pets.length;
  const avgAge =
    pets.length > 0
      ? (pets.reduce((sum, pet) => sum + pet.age, 0) / pets.length).toFixed(1)
      : 0;
  const totalWeight = pets
    .reduce((sum, pet) => sum + pet.weight, 0)
    .toFixed(1);

  const renderEditModal = () => (
    <Modal
      visible={editingPet !== null}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setEditingPet(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.editModal}>
          <View style={styles.editModalHeader}>
            <Text style={styles.editModalTitle}>Edit {editingPet?.name}</Text>
            <TouchableOpacity onPress={() => setEditingPet(null)}>
              <MaterialIcons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.editModalContent}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.editInput}
              value={editFormData.name}
              onChangeText={(text) => setEditFormData({...editFormData, name: text})}
              placeholder="Pet name"
              maxLength={50}
            />

            <Text style={styles.inputLabel}>Breed</Text>
            <TextInput
              style={styles.editInput}
              value={editFormData.breed}
              onChangeText={(text) => setEditFormData({...editFormData, breed: text})}
              placeholder="Pet breed"
              maxLength={50}
            />

            <Text style={styles.inputLabel}>Age (years)</Text>
            <TextInput
              style={styles.editInput}
              value={editFormData.age}
              onChangeText={(text) => setEditFormData({...editFormData, age: text})}
              placeholder="Age"
              keyboardType="numeric"
              maxLength={2}
            />

            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.editInput}
              value={editFormData.weight}
              onChangeText={(text) => setEditFormData({...editFormData, weight: text})}
              placeholder="Weight"
              keyboardType="decimal-pad"
              maxLength={5}
            />
          </ScrollView>

          <View style={styles.editModalActions}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setEditingPet(null)}
              disabled={updateLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveButton, updateLoading && styles.disabledButton]} 
              onPress={handleUpdatePet}
              disabled={updateLoading}
            >
              {updateLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && pets.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="pets" size={48} color="#A8BBA3" />
        <Text style={styles.loadingText}>Loading your pets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#A8BBA3" />

      {/* Header */}
      <LinearGradient colors={["#A8BBA3", "#fff"]} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <Image
            source={require("../../../assets/images/petgif.gif")}
            style={styles.headerGif}
          />
          <Text style={styles.headerTitle}>Welcome Back</Text>
          <Text style={styles.headerSubtitle}>Your PetCare Dashboard</Text>
        </View>
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialIcons
          name="search"
          size={20}
          color="#A8BBA3"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your pets..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <MaterialIcons name="clear" size={20} color="#A8BBA3" />
          </TouchableOpacity>
        )}
      </View>

      {/* Pet Type Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {petTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.filterButton,
              selectedPetType === type.id && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedPetType(type.id)}
          >
            <MaterialIcons
              name={type.icon as any}
              size={18}
              color={selectedPetType === type.id ? "#fff" : "#A8BBA3"}
            />
            <Text
              style={[
                styles.filterText,
                selectedPetType === type.id && { color: "#fff" },
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialIcons name="pets" size={24} color="#A8BBA3" />
          <Text style={styles.statNumber}>{petCount}</Text>
          <Text style={styles.statLabel}>Pets</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="cake" size={24} color="#000" />
          <Text style={styles.statNumber}>{avgAge}</Text>
          <Text style={styles.statLabel}>Avg Age</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="monitor-weight" size={24} color="#A8BBA3" />
          <Text style={styles.statNumber}>{totalWeight}</Text>
          <Text style={styles.statLabel}>Total kg</Text>
        </View>
      </View>

      {/* Pet Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.petCardsContainer}
      >
        {filteredPets.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="pets" size={48} color="#A8BBA3" />
            <Text style={styles.emptyStateText}>No pets found</Text>
          </View>
        ) : (
          filteredPets.map((pet, index) => (
            <Animated.View
              key={pet.id}
              style={[
                styles.petCard,
                {
                  transform: [
                    {
                      scale: scrollX.interpolate({
                        inputRange: [
                          (index - 1) * CARD_WIDTH,
                          index * CARD_WIDTH,
                          (index + 1) * CARD_WIDTH,
                        ],
                        outputRange: [0.9, 1, 0.9],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.petCardContent}>
                <TouchableOpacity
                  onPress={() => handlePetSelect(pet)}
                  style={styles.petMainContent}
                >
                  {pet.image ? (
                    <Image source={{ uri: pet.image }} style={styles.petImage} />
                  ) : (
                    <View style={styles.petImagePlaceholder}>
                      <MaterialIcons name="pets" size={40} color="#A8BBA3" />
                    </View>
                  )}
                  <View style={styles.petInfo}>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petBreed}>{pet.breed}</Text>
                    <Text style={styles.petStat}>
                      {pet.age} yrs • {pet.weight} kg
                    </Text>
                  </View>
                </TouchableOpacity>
                
                {/* Action Buttons */}
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.editCardButton}
                    onPress={() => handleEditPet(pet)}
                  >
                    <MaterialIcons name="edit" size={16} color="#A8BBA3" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteCardButton}
                    onPress={() => handleDeletePet(pet)}
                  >
                    <MaterialIcons name="delete" size={16} color="#ff4757" />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Add Pet Button */}
      <TouchableOpacity onPress={handleAddNewPet} style={styles.addPetButton}>
        <MaterialIcons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Edit Modal */}
      {renderEditModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#A8BBA3", marginTop: 10 },
  headerGradient: { paddingVertical: 30, alignItems: "center" },
  headerContent: { alignItems: "center", marginTop: -20 },
  headerGif: { width: 180, height: 150, marginBottom: -20 },
  headerTitle: { fontSize: 34, fontWeight: "bold", color: "black" },
  headerSubtitle: { fontSize: 14, color: "#555", marginBottom: -20 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 15,
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 15,
    elevation: 4,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: "#000" },
  filterScroll: { marginTop: 5, marginBottom: 10 },
  filterContainer: { paddingHorizontal: 10 },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
  },
  filterButtonActive: { backgroundColor: "#A8BBA3" },
  filterText: { marginLeft: 5, color: "#555", fontSize: 13 },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 15,
  },
  statCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    elevation: 4,
    width: 100,
    marginBottom: -20
  },
  statNumber: { fontSize: 18, fontWeight: "bold", color: "#000" },
  statLabel: { fontSize: 12, color: "#777" },
  petCardsContainer: { paddingHorizontal: 15, paddingVertical: 20 },
  petCard: { width: CARD_WIDTH, marginRight: 20 },
  petCardContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    elevation: 4,
    overflow: "hidden",
  },
  petMainContent: {
    padding: 20,
    alignItems: "center",
  },
  petImage: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    marginBottom: 10, 
    borderWidth: 2, 
    borderColor: "#A8BBA3" 
  },
  petImagePlaceholder: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: "#f0f0f0", 
    justifyContent: "center", 
    alignItems: "center", 
    marginBottom: 10 
  },
  petInfo: { alignItems: "center" },
  petName: { fontSize: 16, fontWeight: "bold", color: "#000" },
  petBreed: { fontSize: 13, color: "#666" },
  petStat: { fontSize: 12, color: "#A8BBA3" },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  editCardButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
  },
  deleteCardButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
  },
  emptyState: { 
    alignItems: "center", 
    justifyContent: "center", 
    width: width - 60, 
    padding: 20 
  },
  emptyStateText: { marginTop: 10, fontSize: 16, color: "#777" },
  addPetButton: { 
    backgroundColor: "#A8BBA3", 
    width: 50, 
    height: 50, 
    borderRadius: 30, 
    position: "absolute", 
    bottom: 10, 
    right: 10, 
    justifyContent: "center", 
    alignItems: "center", 
    elevation: 6 
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  editModal: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 15,
    overflow: "hidden",
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  editModalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
    marginTop: 12,
  },
  editInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#000",
  },
  editModalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    padding: 15,
    marginLeft: 10,
    borderRadius: 8,
    backgroundColor: "#A8BBA3",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default ProfileIndex;