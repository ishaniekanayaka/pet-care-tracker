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
const CARD_WIDTH = 160;
const CARD_HEIGHT = 220;

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
  const [cardAnimations] = useState(() => 
    Array.from({ length: 10 }, () => ({
      scale: new Animated.Value(0.9),
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(50),
      rotate: new Animated.Value(0),
    }))
  );
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
      animateCardsIn(petsData.length);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load pets");
    } finally {
      setLoading(false);
    }
  };

  const animateCardsIn = (cardCount: number) => {
    // Reset all animations first
    cardAnimations.slice(0, cardCount).forEach((anim) => {
      anim.scale.setValue(0.5);
      anim.opacity.setValue(0);
      anim.translateY.setValue(100);
      anim.rotate.setValue(-10);
    });

    // Animate cards in with stagger effect
    const animations = cardAnimations.slice(0, cardCount).map((anim, index) => 
      Animated.parallel([
        Animated.timing(anim.scale, {
          toValue: 1,
          duration: 600,
          delay: index * 150,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 400,
          delay: index * 150,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: 700,
          delay: index * 150,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: 0,
          duration: 800,
          delay: index * 150,
          useNativeDriver: true,
        }),
      ])
    );
    
    Animated.stagger(100, animations).start();
  };

  const animateCardPress = (index: number) => {
    const anim = cardAnimations[index];
    if (!anim) return;

    Animated.sequence([
      Animated.timing(anim.scale, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(anim.scale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
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

  const handlePetSelect = (pet: Pet, index: number) => {
    animateCardPress(index);
    setTimeout(() => {
      if (pet.id) router.push(`/dashboard/profile/${pet.id}` as any);
      else Alert.alert("Error", "Pet ID missing!");
    }, 200);
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

      {/* Compact Header */}
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

      {/* Compact Search */}
      <View style={styles.compactSection}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={18} color="#A8BBA3" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your pets..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcons name="clear" size={18} color="#A8BBA3" />
            </TouchableOpacity>
          )}
        </View>

        {/* Compact Filter */}
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
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={type.icon as any}
                size={14}
                color={selectedPetType === type.id ? "#fff" : "#A8BBA3"}
              />
              <Text
                style={[
                  styles.filterText,
                  selectedPetType === type.id && styles.filterTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Compact Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialIcons name="pets" size={16} color="#A8BBA3" />
          <Text style={styles.statNumber}>{petCount}</Text>
          <Text style={styles.statLabel}>Pets</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="cake" size={16} color="#000" />
          <Text style={styles.statNumber}>{avgAge}</Text>
          <Text style={styles.statLabel}>Avg Age</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="monitor-weight" size={16} color="#A8BBA3" />
          <Text style={styles.statNumber}>{totalWeight}</Text>
          <Text style={styles.statLabel}>Total kg</Text>
        </View>
      </View>

      {/* Pet Cards with Enhanced Animations */}
      <View style={styles.cardsSection}>
        {filteredPets.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="pets" size={48} color="#A8BBA3" />
            <Text style={styles.emptyStateText}>No pets found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? "Try adjusting your search" : "Add your first pet"}
            </Text>
          </View>
        ) : (
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.petCardsContainer}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH + 15}
            snapToAlignment="start"
          >
            {filteredPets.map((pet, index) => {
              const inputRange = [
                (index - 1) * (CARD_WIDTH + 15),
                index * (CARD_WIDTH + 15),
                (index + 1) * (CARD_WIDTH + 15),
              ];

              const scrollScale = scrollX.interpolate({
                inputRange,
                outputRange: [0.9, 1, 0.9],
                extrapolate: 'clamp',
              });

              const scrollOpacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.7, 1, 0.7],
                extrapolate: 'clamp',
              });

              const scrollTranslateY = scrollX.interpolate({
                inputRange,
                outputRange: [10, 0, 10],
                extrapolate: 'clamp',
              });

              const borderColor = scrollX.interpolate({
                inputRange,
                outputRange: ['#e9ecef', '#A8BBA3', '#e9ecef'],
                extrapolate: 'clamp',
              });

              const cardAnim = cardAnimations[index];
              const rotateValue = cardAnim?.rotate?.interpolate({
                inputRange: [-10, 0],
                outputRange: ['-10deg', '0deg'],
                extrapolate: 'clamp',
              }) || '0deg';

              return (
                <Animated.View
                  key={pet.id}
                  style={[
                    styles.petCard,
                    {
                      transform: [
                        { scale: Animated.multiply(scrollScale, cardAnim?.scale || 1) },
                        { translateY: Animated.add(scrollTranslateY, cardAnim?.translateY || 0) },
                        { rotate: rotateValue },
                      ],
                      opacity: Animated.multiply(scrollOpacity, cardAnim?.opacity || 1),
                    },
                  ]}
                >
                  <Animated.View 
                    style={[
                      styles.petCardContent,
                      { borderColor }
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => handlePetSelect(pet, index)}
                      style={styles.petMainContent}
                      activeOpacity={0.9}
                    >
                      <View style={styles.imageContainer}>
                        {pet.image ? (
                          <Image source={{ uri: pet.image }} style={styles.petImage} />
                        ) : (
                          <View style={styles.petImagePlaceholder}>
                            <MaterialIcons name="pets" size={32} color="#A8BBA3" />
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.petInfo}>
                        <Text style={styles.petName} numberOfLines={1}>{pet.name}</Text>
                        <Text style={styles.petBreed} numberOfLines={1}>{pet.breed}</Text>
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
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="edit" size={14} color="#A8BBA3" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.deleteCardButton}
                        onPress={() => handleDeletePet(pet)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="delete" size={14} color="#ff6b6b" />
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                </Animated.View>
              );
            })}
            <View style={{ width: 15 }} />
          </Animated.ScrollView>
        )}
      </View>

      {/* Add Pet Button */}
      <TouchableOpacity 
        onPress={handleAddNewPet} 
        style={styles.addPetButton}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={20} color="white" />
      </TouchableOpacity>

      {/* Edit Modal */}
      {renderEditModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "white" 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  loadingText: { 
    color: "#A8BBA3", 
    marginTop: 10,
    fontSize: 16 
  },
  headerGradient: { 
    paddingVertical: 15, 
    alignItems: "center" 
  },
  headerContent: { 
    alignItems: "center", 
    marginTop: -10 
  },
  headerGif: { 
    width: 120, 
    height: 90, 
    marginBottom: -10, 
    marginTop: 40
  },
  headerTitle: { 
    fontSize: 34, 
    fontWeight: "bold", 
    color: "black" 
  },
  headerSubtitle: { 
    fontSize: 12, 
    color: "#555", 
    marginBottom: 5
  },
  compactSection: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 15,
  },
  searchInput: { 
    flex: 1, 
    fontSize: 14, 
    color: "#000",
    marginHorizontal: 8
  },
  filterScroll: { 
    marginBottom: 15 
  },
  filterContainer: { 
    alignItems: 'center'
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    minWidth: 60,
    justifyContent: 'center',
  },
  filterButtonActive: { 
    backgroundColor: "#A8BBA3",
    borderColor: "#A8BBA3" 
  },
  filterText: { 
    marginLeft: 4, 
    color: "#555", 
    fontSize: 11,
    fontWeight: "500" 
  },
  filterTextActive: {
    color: "#fff"
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 15,
    marginBottom: 15,
  },
  statCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flex: 1,
    marginHorizontal: 3,
  },
  statNumber: { 
    fontSize: 14, 
    fontWeight: "bold", 
    color: "#000",
    marginTop: 2 
  },
  statLabel: { 
    fontSize: 10, 
    color: "#777",
    marginTop: 1 
  },
  cardsSection: {
    flex: 1,
    paddingVertical: 5,
  },
  petCardsContainer: { 
    paddingHorizontal: 15,
    alignItems: 'center'
  },
  petCard: { 
    width: CARD_WIDTH, 
    marginRight: 15,
    height: CARD_HEIGHT
  },
  petCardContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: "hidden",
    height: '100%',
    borderWidth: 2,
  },
  petMainContent: {
    flex: 1,
    padding: 15,
    alignItems: "center",
    justifyContent: 'center'
  },
  imageContainer: {
    marginBottom: 10,
  },
  petImage: { 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    borderWidth: 2, 
    borderColor: "#A8BBA3" 
  },
  petImagePlaceholder: { 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    backgroundColor: "#f5f7fa", 
    justifyContent: "center", 
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e9ecef" 
  },
  petInfo: { 
    alignItems: "center",
  },
  petName: { 
    fontSize: 15, 
    fontWeight: "bold", 
    color: "#000",
    textAlign: "center",
    marginBottom: 3
  },
  petBreed: { 
    fontSize: 12, 
    color: "#666",
    textAlign: "center",
    marginBottom: 4
  },
  petStat: { 
    fontSize: 11, 
    color: "#A8BBA3",
    textAlign: "center",
    fontWeight: '500'
  },
  cardActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  editCardButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "rgba(168,187,163,0.1)",
  },
  deleteCardButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "rgba(255,107,107,0.1)",
    borderLeftWidth: 1,
    borderLeftColor: "#f0f0f0",
  },
  emptyState: { 
    alignItems: "center", 
    justifyContent: "center", 
    flex: 1,
    paddingHorizontal: 40
  },
  emptyStateText: { 
    marginTop: 15, 
    fontSize: 16, 
    color: "#666",
    fontWeight: "600" 
  },
  emptyStateSubtext: {
    marginTop: 5,
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
  addPetButton: { 
    backgroundColor: "#A8BBA3", 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    position: "absolute", 
    bottom: 15, 
    right: 15, 
    justifyContent: "center", 
    alignItems: "center", 
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
    backgroundColor: "#fafafa",
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