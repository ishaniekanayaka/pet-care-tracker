import React, { useState } from "react";
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Pet } from "../../../../types/pet";
import { savePet, updatePet } from "../../../../services/petService";
import { auth } from "../../../../firebase";

interface Props {
  editingPet: Pet | null;
  onSuccess: () => void;
  onCancel: () => void;
  slideAnimation: Animated.Value;
}

const PetForm: React.FC<Props> = ({ editingPet, onSuccess, onCancel, slideAnimation }) => {
  const [name, setName] = useState(editingPet?.name || "");
  const [type, setType] = useState(editingPet?.type || "");
  const [breed, setBreed] = useState(editingPet?.breed || "");
  const userId = auth.currentUser?.uid || "";

  const handleSubmit = async () => {
    if (editingPet) {
      await updatePet(editingPet.id!, { name, type, breed });
    } else {
      await savePet({ name, type, breed, userId });
    }
    onSuccess();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              translateY: slideAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [600, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.header}>{editingPet ? "Edit Pet" : "Add Pet"}</Text>

      <TextInput
        style={styles.input}
        placeholder="Pet Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Pet Type (Dog, Cat...)"
        value={type}
        onChangeText={setType}
      />
      <TextInput
        style={styles.input}
        placeholder="Breed"
        value={breed}
        onChangeText={setBreed}
      />

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.cancel]} onPress={onCancel}>
          <Text style={styles.btnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.save]} onPress={handleSubmit}>
          <Text style={styles.btnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
  },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  button: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  cancel: { backgroundColor: "#ccc" },
  save: { backgroundColor: "#007AFF" },
  btnText: { color: "white", fontWeight: "600" },
});

export default PetForm;
