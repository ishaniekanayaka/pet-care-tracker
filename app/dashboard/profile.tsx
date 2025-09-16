import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text, 
  TextInput, 
  TouchableOpacity,
  View,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager,
  RefreshControl,
  Dimensions
} from "react-native";
import { auth } from "../../firebase";
import { addPet, deletePet, getPetsByUser, updatePet } from "../../services/petService";
import { Pet, PetFormData } from "../../types/pet";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// Get screen dimensions
const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;

// Breed options categorized by pet type
const BREED_OPTIONS = {
  dog: [
    "Labrador Retriever", "German Shepherd", "Golden Retriever", "Bulldog", 
    "Beagle", "Poodle", "Siberian Husky", "Boxer", "Dachshund", "Shih Tzu"
  ],
  cat: [
    "Siamese", "Persian", "Maine Coon", "Bengal", "Sphynx", 
    "British Shorthair", "Ragdoll", "Scottish Fold", "American Shorthair", "Russian Blue"
  ],
  bird: [
    "Parakeet", "Cockatiel", "Lovebird", "Canary", "Finch", 
    "Parrotlet", "Conure", "African Grey", "Macaw", "Cockatoo"
  ],
  other: [
    "Rabbit", "Hamster", "Guinea Pig", "Turtle", "Snake",
    "Lizard", "Fish", "Ferret", "Chinchilla", "Hedgehog"
  ]
};

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
  const [petType, setPetType] = useState<string>("dog");
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const [showPetTypeDropdown, setShowPetTypeDropdown] = useState(false);

  // Animation values - use transform instead of height
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(height))[0];

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
    setPetType("dog");
    setEditingPetId(null);
    setShowAddForm(false);
  }, []);

  const updateFormField = useCallback((field: keyof PetFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Animation functions
  const animateFormIn = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, [slideAnim, fadeAnim]);

  const animateFormOut = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (editingPetId) {
        resetForm();
      } else {
        setShowAddForm(false);
      }
    });
  }, [slideAnim, fadeAnim, editingPetId, resetForm, height]);

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

  // Image picker functions - fixed deprecation warning
  // Replace the existing pickImage and takePhoto functions with these:

const pickImage = async () => {
  try {
    // Request permissions first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      updateFormField('image', result.assets[0].uri);
    }
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert("Error", "Failed to pick image");
  }
};

const takePhoto = async () => {
  try {
    // Request permissions first
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow camera access');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      updateFormField('image', result.assets[0].uri);
    }
  } catch (error) {
    console.error('Error taking photo:', error);
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
    
    // Try to determine pet type from breed
    const foundType = Object.entries(BREED_OPTIONS).find(([type, breeds]) => 
      breeds.includes(pet.breed)
    );
    if (foundType) {
      setPetType(foundType[0]);
    }
    
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

  // Select breed from dropdown
  const selectBreed = (breed: string) => {
    updateFormField('breed', breed);
    setShowBreedDropdown(false);
  };

  // Select pet type from dropdown
  const selectPetType = (type: string) => {
    setPetType(type);
    setShowPetTypeDropdown(false);
    updateFormField('breed', ''); // Reset breed when type changes
  };

  // Effects
  useEffect(() => {
    if (userId) {
      loadPets(true);
    }
  }, [userId]);

  useEffect(() => {
    if (showAddForm) {
      animateFormIn();
    }
  }, [showAddForm, animateFormIn]);

  // Calculated values
  const petCount = pets.length;
  const dueVaccines = pets.filter(pet => pet.age && pet.age < 2).length;
  const mealsToday = pets.reduce((total, pet) => total + (pet.weight > 10 ? 2 : 3), 0);

  if (!userId) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="person-off" size={48} color="#A8BBA3" />
        <Text style={styles.errorText}>Please log in to view your pets</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPets()}
            colors={["#5D688A"]}
            tintColor="#5D688A"
          />
        }
      >
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
            <MaterialIcons name="pets" size={isSmallScreen ? 20 : 24} color="#5D688A" />
            <Text style={styles.statNumber}>{petCount}</Text>
            <Text style={styles.statLabel}>Pets</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="medical-services" size={isSmallScreen ? 20 : 24} color="#896C6C" />
            <Text style={styles.statNumber}>{dueVaccines}</Text>
            <Text style={styles.statLabel}>Due Vaccines</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="restaurant" size={isSmallScreen ? 20 : 24} color="#A8BBA3" />
            <Text style={styles.statNumber}>{mealsToday}</Text>
            <Text style={styles.statLabel}>Meals Today</Text>
          </View>
        </View>

        {/* Add Pet Button */}
        <TouchableOpacity
          style={[styles.addButton, loading && styles.disabledButton]}
          onPress={() => {
            if (showAddForm) {
              animateFormOut();
            } else {
              setShowAddForm(true);
            }
          }}
          disabled={loading}
        >
          <MaterialIcons 
            name={showAddForm ? "close" : "add"} 
            size={isSmallScreen ? 20 : 24} 
            color="white" 
          />
          <Text style={styles.addButtonText}>
            {showAddForm ? "Cancel" : "Add New Pet"}
          </Text>
        </TouchableOpacity>

        {/* Pets List */}
        <View style={styles.petsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Pets</Text>
            {refreshing && <ActivityIndicator size="small" color="#5D688A" />}
          </View>
          
          {loading && pets.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#5D688A" />
              <Text style={styles.loadingText}>Loading your pets...</Text>
            </View>
          ) : pets.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="pets" size={48} color="#A8BBA3" />
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
                      <MaterialIcons name="pets" size={32} color="#A8BBA3" />
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
                    <MaterialIcons name="edit" size={isSmallScreen ? 16 : 20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeletePet(pet)}
                    style={[styles.deleteButton, loading && styles.disabledButton]}
                    disabled={loading}
                  >
                    <MaterialIcons name="delete" size={isSmallScreen ? 16 : 20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Pet Form - Fixed as overlay */}
      {showAddForm && (
        <View style={styles.formOverlay}>
          <TouchableWithoutFeedback onPress={animateFormOut}>
            <View style={styles.formBackdrop} />
          </TouchableWithoutFeedback>
          
          <Animated.View 
            style={[
              styles.formContainer, 
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {editingPetId ? "Edit Pet" : "Add New Pet"}
              </Text>
              <TouchableOpacity onPress={animateFormOut} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#5D688A" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={false}>
              <TextInput
                placeholder="Pet Name"
                value={formData.name}
                onChangeText={(value) => updateFormField('name', value)}
                style={styles.input}
                maxLength={50}
              />
              
              {/* Pet Type Selector */}
              <TouchableOpacity 
                style={styles.dropdownSelector}
                onPress={() => setShowPetTypeDropdown(true)}
              >
                <Text style={formData.breed ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                  {petType.charAt(0).toUpperCase() + petType.slice(1)}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#5D688A" />
              </TouchableOpacity>
              
              {/* Breed Selector */}
              <TouchableOpacity 
                style={styles.dropdownSelector}
                onPress={() => setShowBreedDropdown(true)}
              >
                <Text style={formData.breed ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                  {formData.breed || "Select Breed"}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#5D688A" />
              </TouchableOpacity>
              
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
                  <MaterialIcons name="photo-library" size={isSmallScreen ? 16 : 20} color="white" />
                  <Text style={styles.imageButtonText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={takePhoto} 
                  style={styles.cameraButton}
                  disabled={loading}
                >
                  <MaterialIcons name="camera-alt" size={isSmallScreen ? 16 : 20} color="white" />
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
                  onPress={() => animateFormOut()} 
                  style={styles.cancelButton}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel Edit</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      )}

      {/* Pet Type Dropdown Modal */}
      <Modal
        visible={showPetTypeDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPetTypeDropdown(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPetTypeDropdown(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.dropdownModal}>
              <Text style={styles.dropdownTitle}>Select Pet Type</Text>
              {Object.keys(BREED_OPTIONS).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.dropdownItem,
                    petType === type && styles.dropdownItemSelected
                  ]}
                  onPress={() => selectPetType(type)}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    petType === type && styles.dropdownItemTextSelected
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Breed Dropdown Modal */}
      <Modal
        visible={showBreedDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBreedDropdown(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowBreedDropdown(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.dropdownModal, { maxHeight: height * 0.6 }]}>
              <Text style={styles.dropdownTitle}>Select Breed</Text>
              <ScrollView>
                {BREED_OPTIONS[petType as keyof typeof BREED_OPTIONS].map((breed) => (
                  <TouchableOpacity
                    key={breed}
                    style={[
                      styles.dropdownItem,
                      formData.breed === breed && styles.dropdownItemSelected
                    ]}
                    onPress={() => selectBreed(breed)}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      formData.breed === breed && styles.dropdownItemTextSelected
                    ]}>
                      {breed}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F3",
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    backgroundColor: "#5D688A",
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
    shadowColor: "#5D688A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 80,
    flex: 1,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 5,
    color: "#5D688A",
  },
  statLabel: {
    fontSize: 12,
    color: "#896C6C",
    marginTop: 2,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: "#A8BBA3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 20,
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
  formOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  formBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  formContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.85,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#5D688A",
  },
  closeButton: {
    padding: 5,
  },
  formScrollView: {
    maxHeight: height * 0.7,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: "#F9F9F9",
  },
  dropdownSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  dropdownTextSelected: {
    fontSize: 16,
    color: '#5D688A',
  },
  dropdownTextPlaceholder: {
    fontSize: 16,
    color: '#9E9E9E',
  },
  imagePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  imageButton: {
    backgroundColor: "#5D688A",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
    justifyContent: "center",
  },
  cameraButton: {
    backgroundColor: "#896C6C",
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
    fontSize: 14,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#A8BBA3",
  },
  saveButton: {
    backgroundColor: "#5D688A",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 10,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#896C6C",
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
    marginBottom: 100, // Extra space for bottom navigation
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
    color: "#5D688A",
  },
  loadingText: {
    marginTop: 10,
    color: "#896C6C",
    fontSize: 16,
  },
  errorText: {
    marginTop: 10,
    color: "#896C6C",
    fontSize: 16,
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "white",
    borderRadius: 15,
    shadowColor: "#5D688A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5D688A",
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#896C6C",
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
    shadowColor: "#5D688A",
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
    borderWidth: 2,
    borderColor: "#A8BBA3",
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F0F5ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#A8BBA3",
  },
  petDetails: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
    color: "#5D688A",
  },
  petBreed: {
    fontSize: 14,
    color: "#896C6C",
    marginBottom: 2,
  },
  petStats: {
    fontSize: 12,
    color: "#A8BBA3",
  },
  petActions: {
    flexDirection: "row",
  },
  editButton: {
    backgroundColor: "#5D688A",
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: "#896C6C",
    padding: 8,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxHeight: '60%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#5D688A',
    textAlign: 'center',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemSelected: {
    backgroundColor: '#F0F5ED',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#5D688A',
  },
  dropdownItemTextSelected: {
    fontWeight: 'bold',
    color: '#5D688A',
  },
});

export default Profile;