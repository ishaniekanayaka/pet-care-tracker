import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";

import { Pet } from "../../../types/pet";
import { FeedingRecord } from "../../../types/feeding";
import {
  getPetById,
  getFeedingSchedulesByPet,
  addFeedingSchedule,
  updateFeedingSchedule,
  deleteFeedingSchedule,
} from "../../../services/feedingService";

const PetFeedingDetail = () => {
  const { id: petId } = useLocalSearchParams<{ id: string }>();

  const [pet, setPet] = useState<Pet | null>(null);
  const [feedingRecords, setFeedingRecords] = useState<FeedingRecord[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FeedingRecord | null>(null);

  // Form state
  const [food, setFood] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly">("none");
  const [dateObj, setDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Load data
  const loadData = async () => {
    if (!petId) return;
    try {
      const petData = await getPetById(petId);
      setPet(petData);

      const feedingData = await getFeedingSchedulesByPet(petId);
      setFeedingRecords(
        feedingData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load data");
    }
  };

  useEffect(() => {
    loadData();
  }, [petId]);

  // Open modal
  const openAddModal = () => {
    setEditingRecord(null);
    setFood("");
    setQuantity("");
    setNotes("");
    setRepeat("none");
    setDateObj(new Date());
    setModalVisible(true);
  };

  const openEditModal = (record: FeedingRecord) => {
    setEditingRecord(record);
    setFood(record.food);
    setQuantity(record.quantity);
    setNotes(record.notes || "");
    setRepeat(record.repeat || "none");

    const [hours, minutes] = (record.time || "09:00").split(":").map(Number);
    const d = new Date(record.date);
    d.setHours(hours, minutes, 0, 0);
    setDateObj(d);

    setModalVisible(true);
  };

  // Save record
  const saveRecord = async () => {
    if (!food || !quantity) {
      Alert.alert("Error", "Food and quantity are required");
      return;
    }
    if (!pet) return;

    const dateStr = dateObj.toISOString().split("T")[0];
    const timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newRecord: FeedingRecord = {
      petId,
      food,
      quantity,
      date: dateStr,
      time: timeStr,
      notes,
      repeat,
    };

    try {
      if (editingRecord) {
        await updateFeedingSchedule(editingRecord.id!, newRecord, pet.name);
        Alert.alert("Success", "Feeding record updated");
      } else {
        await addFeedingSchedule(newRecord, pet.name);
        Alert.alert("Success", "Feeding record added");
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save record");
    }
  };

  const handleDelete = async (record: FeedingRecord) => {
    Alert.alert("Confirm", "Are you sure you want to delete this record?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteFeedingSchedule(record.id!);
            loadData();
          } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to delete record");
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {pet && (
          <View style={{ marginBottom: 20, alignItems: "center" }}>
            <Text style={{ fontSize: 22, fontWeight: "bold" }}>{pet.name}</Text>
            <Text style={{ fontSize: 16, color: "#555" }}>{pet.breed}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={openAddModal}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#A8BBA3",
            padding: 10,
            borderRadius: 10,
            marginBottom: 15,
          }}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "bold", marginLeft: 10 }}>
            Add Feeding Record
          </Text>
        </TouchableOpacity>

        {feedingRecords.map((record) => (
          <View
            key={record.id}
            style={{ padding: 15, backgroundColor: "#F0F0F0", borderRadius: 10, marginBottom: 10 }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
              {record.food} ({record.quantity})
            </Text>
            <Text style={{ fontSize: 14 }}>
              Date: {record.date} {record.time ? `- ${record.time}` : ""}{" "}
              {record.repeat && record.repeat !== "none" ? `(${record.repeat})` : ""}
            </Text>
            {record.notes ? <Text style={{ fontSize: 12, color: "#555" }}>Notes: {record.notes}</Text> : null}
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10 }}>
              <TouchableOpacity onPress={() => openEditModal(record)} style={{ marginRight: 15 }}>
                <MaterialIcons name="edit" size={22} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(record)}>
                <MaterialIcons name="delete" size={22} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={{ flex: 1, padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 15 }}>
            {editingRecord ? "Edit Feeding" : "Add Feeding"}
          </Text>

          <TextInput placeholder="Food" value={food} onChangeText={setFood} style={styles.input} />
          <TextInput placeholder="Quantity" value={quantity} onChangeText={setQuantity} style={styles.input} />
          <TextInput placeholder="Notes" value={notes} onChangeText={setNotes} style={styles.input} />

          {/* Date picker */}
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
            <Text>{dateObj.toDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dateObj}
              mode="date"
              display="default"
              onChange={(e, selected) => {
                setShowDatePicker(false);
                if (selected) setDateObj(selected);
              }}
            />
          )}

          {/* Time picker */}
          <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.input}>
            <Text>{dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={dateObj}
              mode="time"
              is24Hour
              display="default"
              onChange={(e, selected) => {
                setShowTimePicker(false);
                if (selected) setDateObj(selected);
              }}
            />
          )}

          {/* Repeat buttons */}
          <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 10 }}>
            {["none", "daily", "weekly"].map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRepeat(r as any)}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: repeat === r ? "#A8BBA3" : "#ccc",
                }}
              >
                <Text style={{ color: repeat === r ? "#fff" : "#000", fontWeight: "bold" }}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.button, { backgroundColor: "#ccc" }]}>
              <Text style={{ color: "#000" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={saveRecord} style={[styles.button, { backgroundColor: "#A8BBA3" }]}>
              <Text style={{ color: "#fff" }}>{editingRecord ? "Update" : "Add"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PetFeedingDetail;

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, marginBottom: 15 },
  button: { padding: 12, borderRadius: 10, flex: 1, alignItems: "center", marginHorizontal: 5 },
});
