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
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from "../../../firebase";
import { addPet, deletePet, getPetById, updatePet } from "../../../services/petService";
import { Pet, PetFormData } from "../../../types/pet";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');

// Pet type categories for buttons
const PET_TYPES = [
  { id: "dog", label: "Dog", icon: "pets", breeds: ["Labrador Retriever", "German Shepherd", "Golden Retriever", "Bulldog", "Beagle", "Poodle", "Siberian Husky", "Boxer", "Dachshund", "Shih Tzu"] },
  { id: "cat", label: "Cat", icon: "pets", breeds: ["Siamese", "Persian", "Maine Coon", "Bengal", "Sphynx", "British Shorthair", "Ragdoll", "Scottish Fold", "American Shorthair", "Russian Blue"] },
  { id: "bird", label: "Bird", icon: "pets", breeds: ["Parakeet", "Cockatiel", "Lovebird", "Canary", "Finch", "Parrotlet", "Conure", "African Grey", "Macaw", "Cockatoo"] },
  { id: "other", label: "Other", icon: "pets", breeds: ["Rabbit", "Hamster", "Guinea Pig", "Turtle", "Snake", "Lizard", "Fish", "Ferret", "Chinchilla", "Hedgehog"] }
];

const PetProfileDetail = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [pet, setPet] = useState<Pet | null>(null);
  
  // State management
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const [selectedPetType, setSelectedPetType] = useState<string>("dog");

  // Form state
  const [formData, setFormData] = useState<PetFormData>({
    name: "",
    breed: "",
    age: "",
    weight: "",
    image: undefined
  });

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
        setFormData(prev => ({ ...prev, image: result.assets[0].uri }));
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
        setFormData(prev => ({ ...prev, image: result.assets[0].uri }));
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
      }
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

  // Select pet type
  const selectPetType = (type: string) => {
    setSelectedPetType(type);
    setFormData(prev => ({ ...prev, breed: '' })); // Reset breed when type changes
  };

  // Select breed from dropdown
  const selectBreed = (breed: string) => {
    setFormData(prev => ({ ...prev, breed }));
    setShowBreedDropdown(false);
  };

  // Effects
  useEffect(() => {
    if (isNewPet) {
      // Initialize form for new pet
      setFormData({
        name: "",
        breed: "",
        age: "",
        weight: "",
        image: undefined
      });
    } else {
      loadPet();
    }
  }, [id]);

  useEffect(() => {
    if (pet && !isNewPet) {
      // Populate form when editing existing pet
      setFormData({
        name: pet.name,
        breed: pet.breed,
        age: pet.age.toString(),
        weight: pet.weight.toString(),
        image: pet.image
      });

      // Try to determine pet type from breed
      const foundType = PET_TYPES.find(type => 
        type.breeds.some(breed => breed.toLowerCase().includes(pet.breed.toLowerCase()))
      );
      if (foundType) {
        setSelectedPetType(foundType.id);
      }
    }
  }, [pet, isNewPet]);

  // Update form field
  const updateFormField = (field: keyof PetFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Render components
  const renderBreedDropdown = () => {
    const selectedType = PET_TYPES.find(type => type.id === selectedPetType);
    if (!selectedType) return null;

    return (
      <Modal
        visible={showBreedDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBreedDropdown(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowBreedDropdown(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.dropdownModal, { maxHeight: height * 0.6 }]}>
              <Text style={styles.dropdownTitle}>Select {selectedType.label} Breed</Text>
              <ScrollView>
                {selectedType.breeds.map((breed: string) => (
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
    );
  };

  if (!userId) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="person-off" size={48} color="#A8BBA3" />
        <Text style={styles.errorText}>Please log in to view pet profiles</Text>
      </View>
    );
  }

  // New pet form or existing pet edit/view
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#A8BBA3" />
      
      {/* Header */}
      <LinearGradient colors={["#A8BBA3", "#fff"]} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isNewPet ? "Add New Pet" : pet ? `${pet.name}` : "Pet Details"}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          !isNewPet ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadPet}
              colors={["#A8BBA3"]}
              tintColor="#A8BBA3"
            />
          ) : undefined
        }
      >
        {/* Form Content */}
        <View style={styles.formContainer}>
          {/* Pet Image */}
          <View style={styles.imageSection}>
            {formData.image ? (
              <Image source={{ uri: formData.image }} style={styles.petImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <MaterialIcons name="pets" size={60} color="#A8BBA3" />
              </View>
            )}
            
            <View style={styles.imageButtons}>
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
          </View>

          {/* Form Fields */}
          <View style={styles.formFields}>
            <Text style={styles.inputLabel}>Pet Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter pet name"
              value={formData.name}
              onChangeText={(value) => updateFormField('name', value)}
              maxLength={50}
            />
            
            {/* Pet Type Selector */}
            <Text style={styles.inputLabel}>Pet Type</Text>
            <View style={styles.petTypeButtons}>
              {PET_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.petTypeButton,
                    selectedPetType === type.id && styles.petTypeButtonActive
                  ]}
                  onPress={() => selectPetType(type.id)}
                >
                  <MaterialIcons 
                    name={type.icon as any} 
                    size={16} 
                    color={selectedPetType === type.id ? "white" : "#A8BBA3"} 
                  />
                  <Text style={[
                    styles.petTypeButtonText,
                    selectedPetType === type.id && styles.petTypeButtonTextActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Breed Selector */}
            <Text style={styles.inputLabel}>Breed</Text>
            <TouchableOpacity 
              style={styles.breedSelector}
              onPress={() => setShowBreedDropdown(true)}
            >
              <Text style={formData.breed ? styles.breedText : styles.breedPlaceholder}>
                {formData.breed || `Select ${PET_TYPES.find(t => t.id === selectedPetType)?.label} Breed`}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#A8BBA3" />
            </TouchableOpacity>
            
            <Text style={styles.inputLabel}>Age (years)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter age"
              value={formData.age}
              onChangeText={(value) => updateFormField('age', value)}
              keyboardType="numeric"
              maxLength={2}
            />
            
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter weight"
              value={formData.weight}
              onChangeText={(value) => updateFormField('weight', value)}
              keyboardType="decimal-pad"
              maxLength={5}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={handleSavePet}
              style={[styles.saveButton, loading && styles.disabledButton]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialIcons 
                    name={isNewPet ? "save" : "update"} 
                    size={20} 
                    color="white" 
                  />
                  <Text style={styles.saveButtonText}>
                    {isNewPet ? 'Save Pet' : 'Update Pet'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {!isNewPet && pet && (
              <TouchableOpacity
                onPress={handleDeletePet}
                style={styles.deleteButton}
                disabled={loading}
              >
                <MaterialIcons name="delete" size={20} color="white" />
                <Text style={styles.deleteButtonText}>Delete Pet</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Breed Dropdown Modal */}
      {renderBreedDropdown()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  headerGradient: {
    paddingVertical: 20,
    paddingTop: 50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  formContainer: {
    padding: 20,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  petImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#A8BBA3',
  },
  placeholderImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A8BBA3',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  imageButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  formFields: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fafafa',
  },
  petTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  petTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#A8BBA3',
    width: '48%',
    justifyContent: 'center',
  },
  petTypeButtonActive: {
    backgroundColor: '#A8BBA3',
    borderColor: '#A8BBA3',
  },
  petTypeButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#A8BBA3',
  },
  petTypeButtonTextActive: {
    color: 'white',
  },
  breedSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#fafafa',
  },
  breedText: {
    fontSize: 16,
    color: '#000',
  },
  breedPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  actionButtons: {
    gap: 15,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A8BBA3',
    padding: 18,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: 18,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  
  // Modal styles
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
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#A8BBA3',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000',
  },
  dropdownItemTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
});

export default PetProfileDetail;