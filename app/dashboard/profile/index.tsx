import React, { useState, useEffect } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, Alert, Image, RefreshControl, 
  TextInput, Animated, Dimensions, StyleSheet, StatusBar
} from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from "../../../firebase";
import { getPetsByUser } from "../../../services/petService";
import { Pet } from "../../../types/pet";

const { width, height } = Dimensions.get('window');

const ProfileIndex = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPetType, setSelectedPetType] = useState("all");
  const [scrollX] = useState(new Animated.Value(0));
  const router = useRouter();
  const userId = auth.currentUser?.uid || "";

  const petTypes = [
    { id: "all", label: "All", icon: "pets" },
    { id: "dog", label: "Dogs", icon: "pets" },
    { id: "cat", label: "Cats", icon: "pets" },
    { id: "bird", label: "Birds", icon: "pets" },
    { id: "other", label: "Others", icon: "pets" }
  ];

  // Load pets
  const loadPets = async (showLoader = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      if (showLoader) setLoading(true);
      setRefreshing(true);
      
      const data = await getPetsByUser(userId);
      setPets(data);
      setFilteredPets(data);
    } catch (error) {
      console.error('Error loading pets:', error);
      Alert.alert("Error", "Failed to load pets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter pets based on search and type
  useEffect(() => {
    let filtered = pets;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(pet => 
        pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.breed.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by pet type
    if (selectedPetType !== "all") {
      filtered = filtered.filter(pet => {
        const breed = pet.breed.toLowerCase();
        switch (selectedPetType) {
          case "dog":
            return ["labrador", "german shepherd", "golden retriever", "bulldog", "beagle", "poodle", "husky", "boxer", "dachshund", "shih tzu"].some(dogBreed => breed.includes(dogBreed));
          case "cat":
            return ["siamese", "persian", "maine coon", "bengal", "sphynx", "british shorthair", "ragdoll", "scottish fold", "american shorthair", "russian blue"].some(catBreed => breed.includes(catBreed));
          case "bird":
            return ["parakeet", "cockatiel", "lovebird", "canary", "finch", "parrotlet", "conure", "african grey", "macaw", "cockatoo"].some(birdBreed => breed.includes(birdBreed));
          case "other":
            return ["rabbit", "hamster", "guinea pig", "turtle", "snake", "lizard", "fish", "ferret", "chinchilla", "hedgehog"].some(otherBreed => breed.includes(otherBreed));
          default:
            return true;
        }
      });
    }

    setFilteredPets(filtered);
  }, [pets, searchQuery, selectedPetType]);

  useEffect(() => {
    loadPets(true);
  }, [userId]);

  const handlePetSelect = (pet: Pet) => {
    if (pet.id) {
      router.push(`/dashboard/profile/${pet.id}` as any);
    } else {
      Alert.alert("Error", "Pet ID is missing. Please try refreshing the list.");
    }
  };

  const handleAddNewPet = () => {
    router.push('/dashboard/profile/new' as any);
  };

  // Calculate stats
  const petCount = pets.length;
  const avgAge = pets.length > 0 ? (pets.reduce((sum, pet) => sum + pet.age, 0) / pets.length).toFixed(1) : 0;
  const totalWeight = pets.reduce((sum, pet) => sum + pet.weight, 0).toFixed(1);

  if (loading && pets.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="pets" size={48} color="#A376A2" />
        <Text style={styles.loadingText}>Loading your pets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#A376A2" />
      
      {/* Gradient Header */}
      <LinearGradient
        colors={['#A376A2', '#ffffff', '#ffffff']}
        locations={[0, 0.6, 1]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Hello! Welcome to PetCare</Text>
            <Text style={styles.welcomeSubtitle}>
              Manage your furry friends with love and care
            </Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#A376A2" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your pets..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialIcons name="clear" size={20} color="#A376A2" />
              </TouchableOpacity>
            )}
          </View>

          {/* Pet Type Filter Buttons */}
          <View style={styles.petTypeContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.petTypeScrollContent}
            >
              {petTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.petTypeButton,
                    selectedPetType === type.id && styles.petTypeButtonActive
                  ]}
                  onPress={() => setSelectedPetType(type.id)}
                >
                  <MaterialIcons 
                    name={type.icon as any} 
                    size={20} 
                    color={selectedPetType === type.id ? "white" : "#A376A2"} 
                  />
                  <Text style={[
                    styles.petTypeText,
                    selectedPetType === type.id && styles.petTypeTextActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </LinearGradient>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPets()}
            colors={["#A376A2"]}
            tintColor="#A376A2"
          />
        }
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialIcons name="pets" size={24} color="#A376A2" />
            <Text style={styles.statNumber}>{petCount}</Text>
            <Text style={styles.statLabel}>Pets</Text>
          </View>
          
          <View style={styles.statCard}>
            <MaterialIcons name="cake" size={24} color="#000" />
            <Text style={styles.statNumber}>{avgAge}</Text>
            <Text style={styles.statLabel}>Avg Age</Text>
          </View>
          
          <View style={styles.statCard}>
            <MaterialIcons name="monitor-weight" size={24} color="#A376A2" />
            <Text style={styles.statNumber}>{totalWeight}</Text>
            <Text style={styles.statLabel}>Total kg</Text>
          </View>
        </View>

        {/* Add Pet Button */}
        <TouchableOpacity onPress={handleAddNewPet} style={styles.addPetButton}>
          <MaterialIcons name="add" size={24} color="white" />
          <Text style={styles.addPetText}>Add New Pet</Text>
        </TouchableOpacity>

        {/* Pet Cards with Horizontal Scroll Animation */}
        <View style={styles.petsSection}>
          <Text style={styles.sectionTitle}>
            Your Pets ({filteredPets.length})
          </Text>

          {filteredPets.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="pets" size={48} color="#A376A2" />
              <Text style={styles.emptyStateTitle}>
                {searchQuery || selectedPetType !== "all" ? "No pets found" : "No pets added yet"}
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                {searchQuery || selectedPetType !== "all" 
                  ? "Try adjusting your search or filter" 
                  : "Add your first pet to get started!"
                }
              </Text>
            </View>
          ) : (
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.petCardsContainer}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
            >
              {filteredPets.map((pet, index) => (
                <Animated.View
                  key={pet.id}
                  style={[
                    styles.petCard,
                    {
                      transform: [
                        {
                          scale: scrollX.interpolate({
                            inputRange: [
                              (index - 1) * 280,
                              index * 280,
                              (index + 1) * 280,
                            ],
                            outputRange: [0.9, 1, 0.9],
                            extrapolate: 'clamp',
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => handlePetSelect(pet)}
                    style={styles.petCardContent}
                  >
                    {pet.image ? (
                      <Image source={{ uri: pet.image }} style={styles.petImage} />
                    ) : (
                      <View style={styles.petImagePlaceholder}>
                        <MaterialIcons name="pets" size={40} color="#A376A2" />
                      </View>
                    )}
                    
                    <View style={styles.petInfo}>
                      <Text style={styles.petName}>{pet.name}</Text>
                      <Text style={styles.petBreed}>{pet.breed}</Text>
                      <View style={styles.petStats}>
                        <Text style={styles.petStat}>
                          {pet.age} year{pet.age !== 1 ? 's' : ''}
                        </Text>
                        <Text style={styles.petStat}>•</Text>
                        <Text style={styles.petStat}>{pet.weight}kg</Text>
                      </View>
                    </View>
                    
                    <MaterialIcons name="arrow-forward-ios" size={16} color="#A376A2" />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </Animated.ScrollView>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 10,
    color: '#A376A2',
    fontSize: 16,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  welcomeSection: {
    marginBottom: 25,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  petTypeContainer: {
    marginBottom: 10,
  },
  petTypeScrollContent: {
    paddingHorizontal: 10,
  },
  petTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#A376A2',
  },
  petTypeButtonActive: {
    backgroundColor: '#A376A2',
    borderColor: '#A376A2',
  },
  petTypeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#A376A2',
  },
  petTypeTextActive: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 20,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
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
    fontWeight: 'bold',
    marginTop: 5,
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  addPetButton: {
    backgroundColor: '#A376A2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addPetText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  petsSection: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 10,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  petCardsContainer: {
    paddingLeft: 20,
  },
  petCard: {
    width: 260,
    marginRight: 20,
  },
  petCardContent: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#A376A2',
  },
  petImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#A376A2',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#000',
  },
  petBreed: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  petStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petStat: {
    fontSize: 12,
    color: '#A376A2',
    marginRight: 5,
  },
});

export default ProfileIndex;