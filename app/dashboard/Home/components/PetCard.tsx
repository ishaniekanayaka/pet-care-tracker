import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pet } from "../../../../types/pet";

interface Props {
  pet: Pet;
  onEdit: () => void;
  onDelete: () => void;
}

const PetCard: React.FC<Props> = ({ pet, onEdit, onDelete }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{pet.name}</Text>
      <Text style={styles.details}>
        {pet.type} • {pet.breed}
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity onPress={onEdit}>
          <MaterialIcons name="edit" size={22} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete}>
          <MaterialIcons name="delete" size={22} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  },
  name: { fontSize: 18, fontWeight: "600" },
  details: { fontSize: 14, color: "#555" },
  actions: { flexDirection: "row", gap: 15 },
});

export default PetCard;
