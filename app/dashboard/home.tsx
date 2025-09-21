import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Image,
  Pressable,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pet, PetCreateData, PetUpdateData } from "@/types/pet";
import { auth } from "@/firebase";
import {
  getPetsByUser,
  addPet,
  updatePet,
  deletePet,
} from "@/services/petService";



const Home = () => {
  const router = useRouter();
  const user = auth.currentUser;
  const [pets, setPets] = useState<Pet[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch pets for current user
  const fetchPets = async () => {
    if (!user?.uid) return;
    try {
      const data = await getPetsByUser(user.uid);
      setPets(data);
    } catch (error) {
      console.error("Fetch pets error:", error);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  // Delete pet
  const handleDelete = async (id?: string) => {
    if (!id) return;
    Alert.alert("Delete Pet", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePet(id);
            setModalVisible(false);
            fetchPets();
          } catch (error) {
            console.error("Delete pet error:", error);
          }
        },
      },
    ]);
  };

  // Add pet
  const handleAdd = async (petData: PetCreateData) => {
    if (!user?.uid) return;
    try {
      await addPet({ ...petData, userId: user.uid });
      fetchPets();
    } catch (error) {
      console.error("Add pet error:", error);
    }
  };

  // Update pet
  const handleUpdate = async (petId: string, petData: PetUpdateData) => {
    try {
      await updatePet(petId, petData);
      fetchPets();
      setModalVisible(false);
    } catch (error) {
      console.error("Update pet error:", error);
    }
  };

  // Filter pets based on search
  const filteredPets = pets.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.breed.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Background GIF */}
      <Image
        source={require('../../assets/images/petgif.gif')}
        style={styles.bgGif}
        resizeMode="cover"
        blurRadius={20}
      />

      {/* Header */}
      <View className="flex-row justify-between items-center p-5 bg-black/80">
        <Text className="text-2xl font-bold text-white">My Pets</Text>
        <TouchableOpacity
          onPress={() => router.push("/dashboard/home/addPet")}
          className="bg-[#A8BBA3] p-3 rounded-full"
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="p-4">
        <TextInput
          className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-black shadow"
          placeholder="Search pets..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Pet List */}
      <FlatList
        data={filteredPets}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              setSelectedPet(item);
              setModalVisible(true);
            }}
            className="bg-white mx-4 my-2 rounded-xl shadow p-4 flex-row items-center"
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={{ width: 60, height: 60, borderRadius: 30 }}
              />
            ) : (
              <View className="bg-[#A8BBA3] w-[60px] h-[60px] rounded-full justify-center items-center">
                <Ionicons name="paw" size={28} color="white" />
              </View>
            )}
            <View className="ml-4 flex-1">
              <Text className="text-lg font-bold text-black">{item.name}</Text>
              <Text className="text-gray-600">
                {item.breed} • {item.age} yrs
              </Text>
            </View>

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() =>
                  router.push(`/dashboard/home/editPet/${item.id}`)
                }
              >
                <Ionicons name="create-outline" size={22} color="#A8BBA3" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={22} color="red" />
              </TouchableOpacity>
            </View>
          </Pressable>
        )}
      />

      {/* Modal */}
      <Modal transparent visible={modalVisible} animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="bg-white rounded-2xl w-11/12 p-6 shadow-lg">
            {selectedPet?.image && (
              <Image
                source={{ uri: selectedPet.image }}
                style={{ width: "100%", height: 200, borderRadius: 12 }}
              />
            )}
            <Text className="text-2xl font-bold text-black mt-4">
              {selectedPet?.name}
            </Text>
            <Text className="text-gray-700">
              {selectedPet?.breed} • {selectedPet?.age} yrs • {selectedPet?.weight}kg
            </Text>
            {selectedPet?.healthHistory && (
              <Text className="text-gray-600 mt-2">{selectedPet.healthHistory}</Text>
            )}

            <View className="flex-row justify-end mt-6 space-x-4">
              <TouchableOpacity
                onPress={() =>
                  router.push(`/dashboard/home/editPet/${selectedPet?.id}`)
                }
                className="px-4 py-2 rounded-xl bg-[#A8BBA3]"
              >
                <Text className="text-white font-semibold">Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(selectedPet?.id)}
                className="px-4 py-2 rounded-xl bg-red-500"
              >
                <Text className="text-white font-semibold">Delete</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="absolute top-4 right-4"
            >
              <Ionicons name="close" size={28} color="black" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  bgGif: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
  },
});

export default Home;
