import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl, TextInput, Modal, Dimensions, Image } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { auth } from "../../../firebase";
import { getPetsByUser } from "../../../services/petService";
import { Pet } from "../../../types/pet";
import { getFeedingSchedulesByPet } from "../../../services/feedingService";

const { width, height } = Dimensions.get("window");

const DietIndex = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [feedingCounts, setFeedingCounts] = useState<{ [key: string]: number }>({});
  const [upcomingFeedings, setUpcomingFeedings] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);

  const router = useRouter();
  const userId = auth.currentUser?.uid || "";

  const loadPets = async (showLoader = false) => {
    if (!userId) return;
    try {
      if (showLoader) setLoading(true);
      setRefreshing(true);

      const data = await getPetsByUser(userId);
      setPets(data);
      setFilteredPets(data);

      const counts: { [key: string]: number } = {};
      const upcoming: { [key: string]: number } = {};

      for (const pet of data) {
        if (pet.id) {
          const schedules = await getFeedingSchedulesByPet(pet.id);
          counts[pet.id] = schedules.length;

          const today = new Date();
          const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          upcoming[pet.id] = schedules.filter(s => {
            const feedingDate = new Date(s.date);
            return feedingDate >= today && feedingDate <= nextWeek;
          }).length;
        }
      }

      setFeedingCounts(counts);
      setUpcomingFeedings(upcoming);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load pets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadPets(true); }, [userId]);

  useEffect(() => {
    if (!searchQuery.trim()) setFilteredPets(pets);
    else setFilteredPets(pets.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.breed.toLowerCase().includes(searchQuery.toLowerCase())));
  }, [searchQuery, pets]);

  const handlePetSelect = (pet: Pet) => {
    if (pet.id) router.push(`/dashboard/feeding_shedule/${pet.id}`);
    else Alert.alert("Error", "Pet ID is missing");
  };

  const totalPets = pets.length;
  const totalFeedings = Object.values(feedingCounts).reduce((sum, c) => sum + c, 0);
  const totalUpcoming = Object.values(upcomingFeedings).reduce((sum, c) => sum + c, 0);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={{ backgroundColor: "#A8BBA3", paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ alignItems: "center" }}>
          <Image source={require("../../../assets/images/petgif.gif")} style={{ width: 80, height: 80 }} />
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#000" }}>Feeding Tracker 🍽️</Text>
          <Text style={{ fontSize: 14, color: "#000" }}>Track feeding schedules & reminders</Text>
        </View>
        <TouchableOpacity onPress={() => setShowSearchModal(true)} style={{ padding: 10 }}>
          <MaterialIcons name="search" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPets(true)} />}>
        {/* Stats */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
          <View style={{ backgroundColor: "#F0F0F0", flex: 1, marginRight: 5, padding: 10, borderRadius: 10, alignItems: "center" }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Total Pets</Text>
            <Text style={{ fontSize: 18 }}>{totalPets}</Text>
          </View>
          <View style={{ backgroundColor: "#F0F0F0", flex: 1, marginHorizontal: 5, padding: 10, borderRadius: 10, alignItems: "center" }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Feedings</Text>
            <Text style={{ fontSize: 18 }}>{totalFeedings}</Text>
          </View>
          <View style={{ backgroundColor: "#F0F0F0", flex: 1, marginLeft: 5, padding: 10, borderRadius: 10, alignItems: "center" }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Upcoming</Text>
            <Text style={{ fontSize: 18 }}>{totalUpcoming}</Text>
          </View>
        </View>

        {/* Pet List */}
        {filteredPets.map(pet => (
          <TouchableOpacity key={pet.id} onPress={() => handlePetSelect(pet)} style={{ flexDirection: "row", backgroundColor: "#fff", padding: 15, borderRadius: 15, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 }}>
            <Image source={{ uri: pet.image || "https://via.placeholder.com/80" }} style={{ width: 60, height: 60, borderRadius: 30, marginRight: 15 }} />
            <View style={{ justifyContent: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>{pet.name}</Text>
              <Text style={{ fontSize: 14, color: "#555" }}>{pet.breed}</Text>
              <Text style={{ fontSize: 12, color: "#999" }}>Feedings: {feedingCounts[pet.id || ""] || 0}, Upcoming: {upcomingFeedings[pet.id || ""] || 0}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search Modal */}
      <Modal visible={showSearchModal} animationType="slide">
        <View style={{ flex: 1, paddingTop: 50, paddingHorizontal: 20 }}>
          <TextInput placeholder="Search pets..." value={searchQuery} onChangeText={setSearchQuery} style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 10, marginBottom: 20 }} />
          <ScrollView>
            {filteredPets.map(pet => (
              <TouchableOpacity key={pet.id} onPress={() => { setShowSearchModal(false); handlePetSelect(pet); }} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: "#eee" }}>
                <Text style={{ fontSize: 16 }}>{pet.name} ({pet.breed})</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={() => setShowSearchModal(false)} style={{ marginTop: 20, alignItems: "center" }}>
            <Text style={{ color: "#A8BBA3", fontSize: 16, fontWeight: "bold" }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default DietIndex;
