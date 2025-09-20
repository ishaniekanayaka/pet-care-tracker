import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
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
  Dimensions,
  StyleSheet
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { auth } from "../../../firebase";
import { addPet, deletePet, getPetById, updatePet } from "../../../services/petService";
import { Pet, PetFormData } from "../../../types/pet";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');

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

// Custom hook for form management
const usePetForm = (initialPet?: Pet | null) => {
  const [formData, setFormData] = useState<PetFormData>({
    name: initialPet?.name || "",
    breed: initialPet?.breed || "",
    age: initialPet?.age?.toString() || "",
    weight: initialPet?.weight?.toString() || "",
    image: initialPet?.image || undefined
  });
  const [petType, setPetType] = useState<string>("dog");

  const updateFormField = useCallback((field: keyof PetFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      breed: "",
      age: "",
      weight: "",
      image: undefined
    });
    setPetType("dog");
  }, []);

  return { formData, petType, setPetType, updateFormField, resetForm };
};

// Custom hook for animations
const usePetFormAnimations = () => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));
  const [scrollY] = useState(new Animated.Value(0));

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
    ]).start();
  }, [slideAnim, fadeAnim, height]);

  return { fadeAnim, slideAnim, scrollY, animateFormIn, animateFormOut };
};

const PetProfileDetail = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [pet, setPet] = useState<Pet | null>(null);
  
  // State management
  const [showEditForm, setShowEditForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const [showPetTypeDropdown, setShowPetTypeDropdown] = useState(false);

  // Custom hooks
  const { formData, petType, setPetType, updateFormField, resetForm } = usePetForm(pet);
  const { fadeAnim, slideAnim, scrollY, animateFormIn, animateFormOut } = usePetFormAnimations();

  const userId = auth.currentUser?.uid || "";
  const isNewPet = id === 'new';

  // Form validation
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
  const requestPermissions = async () => {
    try {
      const [cameraPermission, mediaLibraryPermission] = await Promise.all([
        ImagePicker.requestCameraPermissionsAsync(),
        ImagePicker.requestMediaLibraryPermissionsAsync()
      ]);

      if (cameraPermission.status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos.');
        return false;
      }

      if (mediaLibraryPermission.status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library permission is required to select images.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Permission error:', error);
      Alert.alert("Error", "Failed to request permissions");
      return false;
    }
  };

  const pickImage = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length) {
        updateFormField('image', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const takePhoto = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length) {
        updateFormField('image', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  // Data operations
  const loadPet = async () => {
    if (!id || typeof id !== 'string' || isNewPet) return;
    
    try {
      setRefreshing(true);
      const data = await getPetById(id);
      setPet(data);
      
      if (!data) {
        Alert.alert("Error", "Pet not found");
        router.back();
      }
    } catch (error) {
      console.error("Error loading pet:", error);
      Alert.alert("Error", "Failed to load pet details. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  // CRUD operations
  const handleSavePet = async () => {
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

      if (isNewPet) {
        await addPet(petData as Pet);
        Alert.alert("Success", "Pet added successfully!", [
          { text: "OK", onPress: () => router.back() }
        ]);
      } else if (pet?.id) {
        await updatePet(pet.id, petData);
        setPet({ ...pet, ...petData } as Pet);
        Alert.alert("Success", "Pet updated successfully!");
        setShowEditForm(false);
      }

      resetForm();
    } catch (error) {
      console.error("Pet operation error:", error);
      Alert.alert(
        "Error", 
        `Failed to ${isNewPet ? 'add' : 'update'} pet. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditPet = () => {
    if (!pet) return;

    // Try to determine pet type from breed
    const foundType = Object.entries(BREED_OPTIONS).find(([type, breeds]) => 
      breeds.includes(pet.breed)
    );
    if (foundType) {
      setPetType(foundType[0]);
    }
    
    setShowEditForm(true);
  };

  const handleDeletePet = () => {
    if (!pet?.id) {
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
              await deletePet(pet.id!);
              Alert.alert("Success", `${pet.name} has been deleted successfully`, [
                { text: "OK", onPress: () => router.back() }
              ]);
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
    if (isNewPet) {
      setShowEditForm(true);
    } else {
      loadPet();
    }
  }, [id]);

  useEffect(() => {
    if (showEditForm) {
      animateFormIn();
    }
  }, [showEditForm, animateFormIn]);

  // Header animation
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [140, 100],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  // Render components
  const renderDropdownModal = (type: 'petType' | 'breed') => {
    const isPetType = type === 'petType';
    const visible = isPetType ? showPetTypeDropdown : showBreedDropdown;
    const setVisible = isPetType ? setShowPetTypeDropdown : setShowBreedDropdown;
    const title = isPetType ? 'Select Pet Type' : 'Select Breed';
    const data = isPetType ? Object.keys(BREED_OPTIONS) : BREED_OPTIONS[petType as keyof typeof BREED_OPTIONS];
    const onSelect = isPetType ? selectPetType : selectBreed;
    const selectedValue = isPetType ? petType : formData.breed;

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.dropdownModal, !isPetType && { maxHeight: height * 0.6 }]}>
              <Text style={styles.dropdownTitle}>{title}</Text>
              {!isPetType && (
                <ScrollView>
                  {data.map((item: string) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.dropdownItem,
                        selectedValue === item && styles.dropdownItemSelected
                      ]}
                      onPress={() => onSelect(item)}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        selectedValue === item && styles.dropdownItemTextSelected
                      ]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {isPetType && data.map((item: string) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.dropdownItem,
                    selectedValue === item && styles.dropdownItemSelected
                  ]}
                  onPress={() => onSelect(item)}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedValue === item && styles.dropdownItemTextSelected
                  ]}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const renderEditForm = () => (
    <View style={styles.formOverlay}>
      <Animated.View 
        style={[
          styles.newPetFormContainer, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>{isNewPet ? 'Add New Pet' : 'Edit Pet'}</Text>
          <TouchableOpacity 
            onPress={isNewPet ? () => router.back() : () => setShowEditForm(false)} 
            style={styles.closeButton}
          >
            <MaterialIcons name="close" size={24} color="#000" />
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
            <Text style={styles.dropdownTextSelected}>
              {petType.charAt(0).toUpperCase() + petType.slice(1)}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#000" />
          </TouchableOpacity>
          
          {/* Breed Selector */}
          <TouchableOpacity 
            style={styles.dropdownSelector}
            onPress={() => setShowBreedDropdown(true)}
          >
            <Text style={formData.breed ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
              {formData.breed || "Select Breed"}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#000" />
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
            onPress={handleSavePet}
            style={[styles.saveButton, loading && styles.disabledButton]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>{isNewPet ? 'Save Pet' : 'Update Pet'}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );

  if (!userId) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="person-off" size={48} color="#A376A2" />
        <Text style={styles.errorText}>Please log in to view pet profiles</Text>
      </View>
    );
  }

  // New pet form
  if (isNewPet) {
    return (
      <View style={styles.container}>
        {showEditForm && renderEditForm()}
        {renderDropdownModal('petType')}
        {renderDropdownModal('breed')}
      </View>
    );
  }

  // Loading state
  if (refreshing && !pet) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#A376A2" />
        <Text style={styles.loadingText}>Loading pet details...</Text>
      </View>
    );
  }

  // Pet not found
  if (!pet) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="pets" size={48} color="#A376A2" />
        <Text style={styles.errorText}>Pet not found</Text>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Pet details view
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            height: headerHeight,
            opacity: headerOpacity,
          }
        ]}
      >
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButtonHeader}
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pet.name}</Text>
        <Text style={styles.headerSubtitle}>{pet.breed}</Text>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadPet}
            colors={["#A376A2"]}
            tintColor="#A376A2"
          />
        }
      >
        {/* Pet Image */}
        <View style={styles.imageContainer}>
          {pet.image ? (
            <Image source={{ uri: pet.image }} style={styles.petImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <MaterialIcons name="pets" size={60} color="#A376A2" />
            </View>
          )}
        </View>

        {/* Pet Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <MaterialIcons name="pets" size={24} color="#A376A2" />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>{pet.name}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="category" size={24} color="#A376A2" />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Breed</Text>
              <Text style={styles.detailValue}>{pet.breed}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="cake" size={24} color="#A376A2" />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Age</Text>
              <Text style={styles.detailValue}>{pet.age} years</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="fitness-center" size={24} color="#A376A2" />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Weight</Text>
              <Text style={styles.detailValue}>{pet.weight} kg</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            onPress={handleEditPet}
            style={styles.editButton}
          >
            <MaterialIcons name="edit" size={20} color="white" />
            <Text style={styles.editButtonText}>Edit Pet</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleDeletePet}
            style={styles.deleteButton}
          >
            <MaterialIcons name="delete" size={20} color="white" />
            <Text style={styles.deleteButtonText}>Delete Pet</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>

      {/* Edit Form Modal */}
      {showEditForm && renderEditForm()}

      {/* Dropdown Modals */}
      {renderDropdownModal('petType')}
      {renderDropdownModal('breed')}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#A376A2',
    marginTop: 16,
  },
  backButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#A376A2',
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#000',
    paddingTop: 50,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonHeader: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  petImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailTextContainer: {
    marginLeft: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A376A2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff3b30',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  formOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  newPetFormContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  formScrollView: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  dropdownSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dropdownTextSelected: {
    fontSize: 16,
    color: '#333',
  },
  dropdownTextPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  imagePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A376A2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5e5e5e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  imageButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  saveButton: {
    backgroundColor: '#A376A2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    maxHeight: height * 0.7,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#f0e6f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownItemTextSelected: {
    color: '#A376A2',
    fontWeight: '600',
  },
});

export default PetProfileDetail;