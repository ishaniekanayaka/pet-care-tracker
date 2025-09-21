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
} from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { auth } from "../../../firebase";
import { getPetsByUser } from "../../../services/petService";
import { Pet } from "../../../types/pet";

const { width } = Dimensions.get("window");

const CARD_WIDTH = 180;

const ProfileIndex = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
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
    { id: "other", label: "Others", icon: "pets" },
  ];

  const loadPets = async (showLoader = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      if (showLoader) setLoading(true);
      const data = await getPetsByUser(userId);
      setPets(data);
      setFilteredPets(data);
    } catch (error) {
      console.error("Error loading pets:", error);
      Alert.alert("Error", "Failed to load pets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = pets;
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (pet) =>
          pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pet.breed.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedPetType !== "all") {
      filtered = filtered.filter(
        (pet) => pet.type?.toLowerCase() === selectedPetType
      );
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
      Alert.alert("Error", "Pet ID missing!");
    }
  };

  const handleAddNewPet = () => {
    router.push("/dashboard/profile/new" as any);
  };

  const petCount = pets.length;
  const avgAge =
    pets.length > 0
      ? (pets.reduce((sum, pet) => sum + pet.age, 0) / pets.length).toFixed(1)
      : 0;
  const totalWeight = pets
    .reduce((sum, pet) => sum + pet.weight, 0)
    .toFixed(1);

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

      {/* Gradient Header with GIF */}
      <LinearGradient
        colors={["#A8BBA3", "#ffffff"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Image
            source={require("../../../assets/images/petgif.gif")}
            style={styles.headerGif}
          />
          <Text style={styles.headerTitle}>Welcome Back 🐾</Text>
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
              <TouchableOpacity
                onPress={() => handlePetSelect(pet)}
                style={styles.petCardContent}
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
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Add Pet Button - Floating Circle */}
      <TouchableOpacity onPress={handleAddNewPet} style={styles.addPetButton}>
        <MaterialIcons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#A8BBA3", marginTop: 10 },
  headerGradient: { paddingVertical: 30, alignItems: "center" },
  headerContent: { alignItems: "center" },
  headerGif: { width: 120, height: 80, marginBottom: 10 }, // 🔹 reduced size
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "black" },
  headerSubtitle: { fontSize: 14, color: "#555" },
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
  filterButtonActive: {
    backgroundColor: "#A8BBA3",
  },
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
  },
  statNumber: { fontSize: 18, fontWeight: "bold", color: "#000" },
  statLabel: { fontSize: 12, color: "#777" },
  petCardsContainer: { paddingHorizontal: 15, paddingVertical: 20 },
  petCard: {
    width: CARD_WIDTH,
    marginRight: 20,
  },
  petCardContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    elevation: 4,
    alignItems: "center",
  },
  petImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#A8BBA3",
  },
  petImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  petInfo: { alignItems: "center" },
  petName: { fontSize: 16, fontWeight: "bold", color: "#000" },
  petBreed: { fontSize: 13, color: "#666" },
  petStat: { fontSize: 12, color: "#A8BBA3" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    width: width - 60,
    padding: 20,
  },
  emptyStateText: { marginTop: 10, fontSize: 16, color: "#777" },
  addPetButton: {
    backgroundColor: "#A8BBA3",
    width: 60,
    height: 60,
    borderRadius: 30,
    position: "absolute",
    bottom: 20,
    right: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
});

export default ProfileIndex;
