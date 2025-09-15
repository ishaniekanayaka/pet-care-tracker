import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { getPetsByUser, deletePet } from "../../../services/petService";
import { Pet } from "../../../types/pet";
import { auth } from "../../../firebase";
import PetCard from "./components/PetCard";
import PetForm from "./components/PetForm";

const Home = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [showForm, setShowForm] = useState(false);

  const slideAnimation = useRef(new Animated.Value(0)).current;
  const userId = auth.currentUser?.uid || "";

  const loadPets = async () => {
    if (!userId) return;
    const data = await getPetsByUser(userId);
    setPets(data);
  };

  const toggleForm = (open: boolean) => {
    setShowForm(open);
    Animated.timing(slideAnimation, {
      toValue: open ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleDeletePet = async (petId: string) => {
    await deletePet(petId);
    loadPets();
  };

  useEffect(() => {
    loadPets();
  }, [userId]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Your Pets 🐾</Text>

        {pets.length === 0 ? (
          <Text style={styles.empty}>No pets yet. Add your first one!</Text>
        ) : (
          pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onEdit={() => {
                setEditingPet(pet);
                toggleForm(true);
              }}
              onDelete={() => handleDeletePet(pet.id!)}
            />
          ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setEditingPet(null);
          toggleForm(true);
        }}
      >
        <MaterialIcons name="add" size={28} color="white" />
      </TouchableOpacity>

      {showForm && (
        <PetForm
          editingPet={editingPet}
          onSuccess={() => {
            loadPets();
            toggleForm(false);
          }}
          onCancel={() => toggleForm(false)}
          slideAnimation={slideAnimation}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scroll: { padding: 20 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  empty: { fontSize: 16, color: "#666", textAlign: "center", marginTop: 50 },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#007AFF",
    padding: 18,
    borderRadius: 50,
    elevation: 5,
  },
});

export default Home;
