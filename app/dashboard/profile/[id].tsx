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
import { useLocalSearchParams, useRouter } from "expo-router";
import { auth } from "../../../firebase";
import { addPet, deletePet, getPetById, updatePet } from "../../../services/petService";
import { Pet, PetFormData } from "../../../types/pet";

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

const PetProfileDetail = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [pet, setPet] = useState<Pet | null>(null);
  
  // State management
  const [formData, setFormData] = useState<PetFormData>({
    name: "",
    breed: "",
    age: "",
    weight: "",
    image: undefined
  });
  const [showEditForm, setShowEditForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [petType, setPetType] = useState<string>("dog");
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const [showPetTypeDropdown, setShowPetTypeDropdown] = useState(false);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(height))[0];

  const userId = auth.currentUser?.uid || "";
  const isNewPet = id === 'new';

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
    setShowEditForm(false);
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
      setShowEditForm(false);
    });
  }, [slideAnim, fadeAnim, height]);

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

  // Image picker functions - Fixed deprecation and permission issues
  const requestPermissions = async () => {
    try {
      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Camera permission is required to take photos.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Request media library permissions
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (mediaLibraryPermission.status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Photo library permission is required to select images.',
          [{ text: 'OK' }]
        );
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
        base64: false, // Don't include base64 to reduce memory usage
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
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
        base64: false, // Don't include base64 to reduce memory usage
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        updateFormField('image', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
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
        animateFormOut();
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

  if (!userId) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="person-off" size={48} color="#A8BBA3" />
        <Text style={styles.errorText}>Please log in to view pet profiles</Text>
      </View>
    );
  }

  // New pet form
  if (isNewPet) {
    return (
      <View style={styles.container}>
        {showEditForm && (
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
                <Text style={styles.formTitle}>Add New Pet</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
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
                  <Text style={styles.dropdownTextSelected}>
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
                    <Text style={styles.saveButtonText}>Save Pet</Text>
                  )}
                </TouchableOpacity>
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
  }

  // Loading state
  if (refreshing && !pet) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#5D688A" />
        <Text style={styles.loadingText}>Loading pet details...</Text>
      </View>
    );
  }

  // Pet not found
  if (!pet) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="pets" size={48} color="#A8BBA3" />
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
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadPet}
            colors={["#5D688A"]}
            tintColor="#5D688A"
          />
        }
      >
        {/* Pet Header */}
        <View style={styles.petHeader}>
          <View style={styles.petImageContainer}>
            {pet.image ? (
              <Image source={{ uri: pet.image }} style={styles.petHeaderImage} />
            ) : (
              <View style={styles.placeholderHeaderImage}>
                <MaterialIcons name="pets" size={48} color="rgba(255,255,255,0.8)" />
              </View>
            )}
          </View>
          
          <View style={styles.petHeaderInfo}>
            <Text style={styles.petHeaderName}>{pet.name}</Text>
            <Text style={styles.petHeaderBreed}>{pet.breed}</Text>
            <Text style={styles.petHeaderStats}>
              {pet.age} year{pet.age !== 1 ? 's' : ''} old • {pet.weight}kg
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            onPress={handleEditPet}
            style={[styles.editPetButton, loading && styles.disabledButton]}
            disabled={loading}
          >
            <MaterialIcons name="edit" size={20} color="white" />
            <Text style={styles.actionButtonText}>Edit Pet</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleDeletePet}
            style={[styles.deletePetButton, loading && styles.disabledButton]}
            disabled={loading}
          >
            <MaterialIcons name="delete" size={20} color="white" />
            <Text style={styles.actionButtonText}>Delete Pet</Text>
          </TouchableOpacity>
        </View>

        {/* Pet Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Pet Information</Text>
          
          <View style={styles.detailRow}>
            <MaterialIcons name="pets" size={20} color="#5D688A" />
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>{pet.name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialIcons name="category" size={20} color="#5D688A" />
            <Text style={styles.detailLabel}>Breed:</Text>
            <Text style={styles.detailValue}>{pet.breed}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialIcons name="cake" size={20} color="#5D688A" />
            <Text style={styles.detailLabel}>Age:</Text>
            <Text style={styles.detailValue}>
              {pet.age} year{pet.age !== 1 ? 's' : ''} old
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialIcons name="monitor-weight" size={20} color="#5D688A" />
            <Text style={styles.detailLabel}>Weight:</Text>
            <Text style={styles.detailValue}>{pet.weight} kg</Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Form Modal */}
      {showEditForm && (
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
              <Text style={styles.formTitle}>Edit Pet</Text>
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
                <Text style={styles.dropdownTextSelected}>
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
                  <Text style={styles.saveButtonText}>Update Pet</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={animateFormOut} 
                style={styles.cancelButton}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
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
    backgroundColor: "#F5F7F3",
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
  backButton: {
    marginTop: 20,
    backgroundColor: "#5D688A",
    padding: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  
  // Pet Header Styles
  petHeader: {
    backgroundColor: "#5D688A",
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  petImageContainer: {
    marginRight: 20,
  },
  petHeaderImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  placeholderHeaderImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  petHeaderInfo: {
    flex: 1,
  },
  petHeaderName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  petHeaderBreed: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 5,
  },
  petHeaderStats: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: "row",
    margin: 20,
    gap: 10,
  },
  editPetButton: {
    backgroundColor: "#A8BBA3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deletePetButton: {
    backgroundColor: "#896C6C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
  },

  // Details Card
  detailsCard: {
    backgroundColor: "white",
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    shadowColor: "#5D688A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5D688A",
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5D688A",
    marginLeft: 10,
    width: 80,
  },
  detailValue: {
    fontSize: 16,
    color: "#896C6C",
    flex: 1,
  },

  // Form Styles
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
  newPetFormContainer: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 20,
    padding: 20,
    maxHeight: height * 0.85,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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
  
  // Form Input Styles
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
  
  // Image Picker Styles
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
  
  // Action Button Styles
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
  disabledButton: {
    opacity: 0.6,
  },
  
  // Modal Styles
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

export default PetProfileDetail;