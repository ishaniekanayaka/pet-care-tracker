import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Pet } from "../../../types/pet";
import { FeedingRecord } from "../../../types/feeding";
import {
  addFeedingSchedule,
  getFeedingSchedulesByPet,
  deleteFeedingSchedule,
  scheduleFeedingNotifications,
  cancelFeedingNotifications,
  getPetById,
} from "../../../services/feedingService";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";

const PetFeedingDetail = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [pet, setPet] = useState<Pet | null>(null);
  const [feedingRecords, setFeedingRecords] = useState<(FeedingRecord & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addingRecord, setAddingRecord] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const [newRecord, setNewRecord] = useState({
    food: "",
    quantity: "",
    date: today,
    time: "09:00",
    notes: "",
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Load pet
  const loadPet = useCallback(async () => {
    if (!id || typeof id !== "string") return;
    try {
      const petData = await getPetById(id);
      if (petData) setPet(petData);
      else Alert.alert("Error", "Pet not found");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load pet");
    }
  }, [id]);

  // Load feeding records
  const loadFeedingRecords = useCallback(async (showLoader = false) => {
    if (!id || typeof id !== "string") return;
    try {
      if (showLoader) setRefreshing(true);
      const records = await getFeedingSchedulesByPet(id);
      setFeedingRecords(records);
    } catch (error) {
      console.error(error);
      setFeedingRecords([]);
    } finally {
      if (showLoader) setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([loadPet(), loadFeedingRecords()]);
      setLoading(false);
    };
    initialize();
  }, [loadPet, loadFeedingRecords]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadPet(), loadFeedingRecords(true)]);
  }, [loadPet, loadFeedingRecords]);

  const resetForm = useCallback(() => {
    setNewRecord({ food: "", quantity: "", date: today, time: "09:00", notes: "" });
  }, [today]);

  // Add feeding record
  const handleAddRecord = async () => {
    if (!pet || !newRecord.food.trim() || !newRecord.quantity.trim()) {
      Alert.alert("Validation Error", "Please fill in food and quantity");
      return;
    }

    setAddingRecord(true);
    const tempId = `temp_${Date.now()}`;
    try {
      const record: FeedingRecord = {
        petId: pet.id!,
        food: newRecord.food.trim(),
        quantity: newRecord.quantity.trim(),
        date: newRecord.date,
        notes: newRecord.notes.trim(),
        notificationIds: [],
        createdAt: new Date(),
      };

      // Optimistic UI
      setFeedingRecords(prev => [{ ...record, id: tempId }, ...prev]);
      setShowAddModal(false);
      resetForm();

      // Save to Firestore
      const recordId = await addFeedingSchedule(record, pet.name);

      // Schedule notifications
      const scheduleWithId = { ...record, id: recordId, time: newRecord.time };
      const notificationIds = await scheduleFeedingNotifications(scheduleWithId, pet.name);

      // Update record with notification IDs
      if (notificationIds.length > 0) {
        await updateDoc(doc(db, "feedingSchedules", recordId), { notificationIds });
        setFeedingRecords(prev =>
          prev.map(r => r.id === tempId ? { ...record, id: recordId, notificationIds } : r)
        );
      } else {
        setFeedingRecords(prev =>
          prev.map(r => r.id === tempId ? { ...record, id: recordId } : r)
        );
      }

      Alert.alert("Success", "Feeding record added!");
    } catch (error) {
      console.error(error);
      setFeedingRecords(prev => prev.filter(r => r.id !== tempId));
      Alert.alert("Error", "Failed to add feeding record");
    } finally {
      setAddingRecord(false);
    }
  };

  // Delete feeding record
  const handleDeleteRecord = async (recordId: string, food: string) => {
    Alert.alert("Delete Record", `Delete feeding record "${food}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const recordToDelete = feedingRecords.find(r => r.id === recordId);
          setFeedingRecords(prev => prev.filter(r => r.id !== recordId));
          try {
            if (recordToDelete?.notificationIds?.length) {
              await cancelFeedingNotifications(recordToDelete.notificationIds);
            }
            await deleteFeedingSchedule(recordId);
          } catch (error) {
            console.error(error);
            if (recordToDelete) setFeedingRecords(prev => [recordToDelete, ...prev]);
            Alert.alert("Error", "Failed to delete record");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" }}>
        <ActivityIndicator size="large" color="#A8BBA3" />
        <MaterialIcons name="pets" size={48} color="#A8BBA3" style={{ marginTop: 20 }} />
        <Text style={{ marginTop: 10, color: "#666", fontSize: 16 }}>Loading pet details...</Text>
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" }}>
        <MaterialIcons name="error" size={48} color="#ff4444" />
        <Text style={{ marginTop: 10, color: "#ff4444", fontSize: 16 }}>Pet not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 20, backgroundColor: "#5D688A", padding: 12, borderRadius: 8 }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f5f5f5" }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#A8BBA3"]} tintColor="#A8BBA3" />}
    >
      {/* Pet Header */}
      <View style={{ backgroundColor: "#A8BBA3", padding: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', top: 20, left: 20, zIndex: 1, padding: 8 }}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, marginTop: 20 }}>
          <MaterialIcons name="pets" size={32} color="white" />
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "white", marginLeft: 10 }}>{pet.name}'s Feeding</Text>
        </View>
        <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
          {pet.breed} • {pet.age} years • {pet.weight} kg
        </Text>
      </View>

      {/* Records Counter */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', margin: 20, marginBottom: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>Feeding Records</Text>
        <Text style={{ fontSize: 14, color: '#A8BBA3', fontWeight: '600' }}>{feedingRecords.length} record{feedingRecords.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Add Record Button */}
      <TouchableOpacity
        style={{ backgroundColor: "#A8BBA3", margin: 20, marginTop: 10, padding: 15, borderRadius: 12, alignItems: "center", flexDirection: 'row', justifyContent: 'center' }}
        onPress={() => setShowAddModal(true)}
      >
        <MaterialIcons name="add" size={20} color="white" style={{ marginRight: 6 }} />
        <Text style={{ color: "white", fontWeight: "bold" }}>Add Feeding</Text>
      </TouchableOpacity>

      {/* Records List */}
      <View style={{ marginHorizontal: 20, marginBottom: 30 }}>
        {feedingRecords.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#888", marginTop: 20 }}>No feeding records yet</Text>
        ) : (
          feedingRecords.map(record => (
            <View key={record.id} style={{ backgroundColor: "#fff", padding: 15, marginBottom: 12, borderRadius: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: "bold", color: "#333" }}>{record.food}</Text>
                <Text style={{ color: "#666", marginTop: 2 }}>{record.quantity} • {record.date}</Text>
                {record.notes ? <Text style={{ color: "#999", marginTop: 2 }}>{record.notes}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => handleDeleteRecord(record.id, record.food)}>
                <MaterialIcons name="delete" size={24} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Add Feeding Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View style={{ backgroundColor: "white", margin: 20, borderRadius: 12, padding: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 15 }}>Add Feeding</Text>

            <TextInput
              placeholder="Food"
              value={newRecord.food}
              onChangeText={text => setNewRecord(prev => ({ ...prev, food: text }))}
              style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 10 }}
            />

            <TextInput
              placeholder="Quantity"
              value={newRecord.quantity}
              onChangeText={text => setNewRecord(prev => ({ ...prev, quantity: text }))}
              style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 10 }}
            />

            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ padding: 10, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, marginBottom: 10 }}>
              <Text>{newRecord.date}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={new Date(newRecord.date)}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setNewRecord(prev => ({ ...prev, date: selectedDate.toISOString().split("T")[0] }));
                }}
              />
            )}

            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={{ padding: 10, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, marginBottom: 10 }}>
              <Text>Time: {newRecord.time}</Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) {
                    const hours = selectedTime.getHours().toString().padStart(2, '0');
                    const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
                    setNewRecord(prev => ({ ...prev, time: `${hours}:${minutes}` }));
                  }
                }}
              />
            )}

            <TextInput
              placeholder="Notes (optional)"
              value={newRecord.notes}
              onChangeText={text => setNewRecord(prev => ({ ...prev, notes: text }))}
              style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 10 }}
            />

            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }} style={{ marginRight: 10 }}>
                <Text style={{ color: "#888" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddRecord} disabled={addingRecord}>
                <Text style={{ color: "#A8BBA3", fontWeight: "bold" }}>{addingRecord ? "Adding..." : "Add"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default PetFeedingDetail;
