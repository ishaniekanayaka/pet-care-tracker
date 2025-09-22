import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Pet } from "../../../types/pet";
import { HealthRecord } from "../../../types/health";
import {
  addHealthRecord,
  getHealthRecordsByPet,
  deleteHealthRecord,
  getPetById,
} from "../../../services/healthService";
import {
  registerHealthNotifications,
  scheduleHealthReminder,
} from "../../../services/healthReminderService";

const PetHealthDetail = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [pet, setPet] = useState<Pet | null>(null);
  const [healthRecords, setHealthRecords] = useState<
    (HealthRecord & { id: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const [newRecord, setNewRecord] = useState({
    type: "vaccination" as const,
    title: "",
    date: today,
    nextDue: "",
    notes: "",
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNextDuePicker, setShowNextDuePicker] = useState(false);

  const recordTypes = [
    {
      value: "vaccination",
      label: "Vaccination",
      icon: "vaccines",
      color: "#896C6C",
    },
    {
      value: "checkup",
      label: "Checkup",
      icon: "medical-services",
      color: "#5D688A",
    },
    {
      value: "medication",
      label: "Medication",
      icon: "medication",
      color: "#A8BBA3",
    },
    { value: "treatment", label: "Treatment", icon: "healing", color: "#896C6C" },
  ];

  const loadPet = async () => {
    if (!id || typeof id !== "string") return;
    try {
      const petData = await getPetById(id);
      setPet(petData);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load pet");
    } finally {
      setLoading(false);
    }
  };

  const loadHealthRecords = async () => {
    if (!id || typeof id !== "string") return;
    try {
      const records = await getHealthRecordsByPet(id);
      setHealthRecords(records);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load health records");
    }
  };

  useEffect(() => {
    loadPet();
    loadHealthRecords();
    registerHealthNotifications(); // 📌 setup notification channel
  }, [id]);

  const handleAddRecord = async () => {
    if (!pet || !newRecord.title || !newRecord.date)
      return Alert.alert("Error", "Fill required fields");

    try {
      const record: HealthRecord = { petId: pet.id!, ...newRecord };
      const result = await addHealthRecord(record);
      if (result.success) {
        setShowAddModal(false);
        setNewRecord({
          type: "vaccination",
          title: "",
          date: today,
          nextDue: "",
          notes: "",
        });
        loadHealthRecords();
        Alert.alert("Success", "Health record added!");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to add record");
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    Alert.alert("Delete Record", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteHealthRecord(recordId);
            loadHealthRecords();
          } catch (e) {
            console.error(e);
            Alert.alert("Error", "Delete failed");
          }
        },
      },
    ]);
  };

  if (loading)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <MaterialIcons name="pets" size={48} color="#ccc" />
        <Text style={{ marginTop: 10, color: "#666" }}>
          Loading pet details...
        </Text>
      </View>
    );

  if (!pet)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <MaterialIcons name="error" size={48} color="#ff4444" />
        <Text style={{ marginTop: 10, color: "#ff4444" }}>Pet not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 20,
            backgroundColor: "#5D688A",
            padding: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      {/* Pet Header */}
      <View
        style={{
          backgroundColor: "#FF6B6B",
          padding: 20,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        }}
      >
        <View
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
        >
          <MaterialIcons name="pets" size={32} color="white" />
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "white",
              marginLeft: 10,
            }}
          >
            {pet.name}
          </Text>
        </View>
        <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
          {pet.breed} • {pet.age} years
        </Text>
      </View>

      {/* Add Record Button */}
      <TouchableOpacity
        style={{
          backgroundColor: "#A8BBA3",
          margin: 20,
          padding: 15,
          borderRadius: 12,
          alignItems: "center",
        }}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          + Add Health Record
        </Text>
      </TouchableOpacity>

      {/* Records List */}
      <View style={{ marginHorizontal: 20 }}>
        {healthRecords.length === 0 ? (
          <View
            style={{
              padding: 40,
              alignItems: "center",
              backgroundColor: "white",
              borderRadius: 12,
            }}
          >
            <MaterialIcons name="medical-services" size={48} color="#A8BBA3" />
            <Text
              style={{ marginTop: 10, fontWeight: "bold", color: "#896C6C" }}
            >
              No records yet
            </Text>
          </View>
        ) : (
          healthRecords.map((record) => (
            <View
              key={record.id}
              style={{
                backgroundColor: "white",
                padding: 15,
                borderRadius: 12,
                marginBottom: 12,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "bold", fontSize: 16, color: "#000" }}>
                  {record.title}
                </Text>
                <Text style={{ color: "#666", fontSize: 12 }}>
                  {record.date}{" "}
                  {record.nextDue ? `• Next: ${record.nextDue}` : ""}
                </Text>
              </View>

              {/* 🔔 Bell Icon */}
              {record.nextDue && (
                <TouchableOpacity
                  onPress={() => {
                    scheduleHealthReminder(pet.name, record, 3); // 3 days before
                    Alert.alert(
                      "Reminder Set",
                      `Reminder scheduled 3 days before ${record.nextDue}`
                    );
                  }}
                  style={{ marginRight: 15 }}
                >
                  <MaterialIcons
                    name="notifications"
                    size={24}
                    color="#4CAF50"
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => handleDeleteRecord(record.id)}>
                <MaterialIcons name="delete" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{ backgroundColor: "white", borderRadius: 12, padding: 20 }}
          >
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 15 }}>
              Add Health Record
            </Text>

            {/* Record Type */}
            <View style={{ flexDirection: "row", marginBottom: 10, flexWrap: "wrap" }}>
              {recordTypes.map((rt) => (
                <TouchableOpacity
                  key={rt.value}
                  onPress={() => setNewRecord({ ...newRecord, type: rt.value })}
                  style={{
                    padding: 10,
                    marginRight: 10,
                    marginBottom: 10,
                    borderRadius: 8,
                    backgroundColor:
                      newRecord.type === rt.value ? rt.color : "#eee",
                  }}
                >
                  <Text
                    style={{
                      color: newRecord.type === rt.value ? "white" : "#333",
                    }}
                  >
                    {rt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Title */}
            <TextInput
              placeholder="Title"
              value={newRecord.title}
              onChangeText={(t) => setNewRecord({ ...newRecord, title: t })}
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                padding: 10,
                borderRadius: 8,
                marginBottom: 10,
              }}
            />

            {/* Date Picker */}
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                padding: 10,
                borderRadius: 8,
                marginBottom: 10,
              }}
            >
              <Text>{newRecord.date}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={new Date(newRecord.date)}
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setShowDatePicker(false);
                  if (date)
                    setNewRecord({
                      ...newRecord,
                      date: date.toISOString().split("T")[0],
                    });
                }}
              />
            )}

            {/* Next Due */}
            <TouchableOpacity
              onPress={() => setShowNextDuePicker(true)}
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                padding: 10,
                borderRadius: 8,
                marginBottom: 10,
              }}
            >
              <Text>{newRecord.nextDue || "Select Next Due (optional)"}</Text>
            </TouchableOpacity>
            {showNextDuePicker && (
              <DateTimePicker
                value={
                  newRecord.nextDue ? new Date(newRecord.nextDue) : new Date()
                }
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setShowNextDuePicker(false);
                  if (date)
                    setNewRecord({
                      ...newRecord,
                      nextDue: date.toISOString().split("T")[0],
                    });
                }}
              />
            )}

            {/* Notes */}
            <TextInput
              placeholder="Notes"
              value={newRecord.notes}
              onChangeText={(t) => setNewRecord({ ...newRecord, notes: t })}
              multiline
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                padding: 10,
                borderRadius: 8,
                marginBottom: 15,
                height: 80,
              }}
            />

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={{
                  padding: 12,
                  backgroundColor: "#ccc",
                  borderRadius: 8,
                  flex: 1,
                  marginRight: 5,
                  alignItems: "center",
                }}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddRecord}
                style={{
                  padding: 12,
                  backgroundColor: "#A8BBA3",
                  borderRadius: 8,
                  flex: 1,
                  marginLeft: 5,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default PetHealthDetail;
