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
  getFeedingSchedulesByPet,
  addFeedingSchedule,
  updateFeedingSchedule,
  deleteFeedingSchedule,
  getPetById,
} from "../../../services/feedingService";

const PetFeedingDetail = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [pet, setPet] = useState<Pet | null>(null);
  const [feedingRecords, setFeedingRecords] = useState<FeedingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingRecord, setAddingRecord] = useState(false);

  const today = new Date();
  const [newRecord, setNewRecord] = useState({
    food: "",
    quantity: "",
    date: today.toISOString().split("T")[0],
    time: today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    notes: "",
    repeat: "none" as "none" | "daily" | "weekly",
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Load pet and feeding records
  const loadPet = useCallback(async () => {
    if (!id || typeof id !== "string") {
      console.log("Invalid pet ID:", id);
      return;
    }

    try {
      const petData = await getPetById(id);
      if (petData) {
        setPet(petData);
      } else {
        Alert.alert("Error", "Pet not found");
      }
    } catch (error) {
      console.error("Error loading pet:", error);
      Alert.alert("Error", "Failed to load pet details");
    }
  }, [id]);

  const loadFeedingRecords = useCallback(async (showLoader = false) => {
    if (!id || typeof id !== "string") {
      console.log("Invalid pet ID for feeding records:", id);
      return;
    }

    try {
      if (showLoader) setRefreshing(true);
      const records = await getFeedingSchedulesByPet(id);
      setFeedingRecords(records);
    } catch (error) {
      console.error("Error loading feeding records:", error);
      Alert.alert("Error", "Failed to load feeding records");
      setFeedingRecords([]);
    } finally {
      if (showLoader) setRefreshing(false);
    }
  }, [id]);

  // Initial data loading
  useEffect(() => {
    const initializeData = async () => {
      if (!id) {
        console.log("No pet ID provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await Promise.all([loadPet(), loadFeedingRecords()]);
      } catch (error) {
        console.error("Error during initialization:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [id, loadPet, loadFeedingRecords]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await Promise.all([loadPet(), loadFeedingRecords(true)]);
  }, [loadPet, loadFeedingRecords]);

  // Reset form function
  const resetForm = useCallback(() => {
    setNewRecord({
      food: "",
      quantity: "",
      date: today.toISOString().split("T")[0],
      time: today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes: "",
      repeat: "none",
    });
  }, [today]);

  // Handle add record
  const handleAddRecord = async () => {
    if (!pet || !newRecord.food.trim() || !newRecord.quantity.trim()) {
      Alert.alert("Validation Error", "Please fill in all required fields");
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
        time: newRecord.time,
        notes: newRecord.notes.trim(),
        repeat: newRecord.repeat,
      };

      // Optimistically add to UI
      const optimisticRecord = { ...record, id: tempId };
      setFeedingRecords(prevRecords => [optimisticRecord, ...prevRecords]);
      
      setShowAddModal(false);
      resetForm();
      
      // Save to Firebase
      const result = await addFeedingSchedule(record, pet.name);
      
      if (result) {
        // Replace temporary record with real one
        setFeedingRecords(prevRecords => 
          prevRecords.map(r => 
            r.id === tempId ? { ...record, id: result } : r
          )
        );
        Alert.alert("Success", "Feeding schedule added successfully!");
      } else {
        throw new Error("Failed to save feeding schedule");
      }

    } catch (error) {
      console.error("Error adding record:", error);
      // Remove optimistic record on error
      setFeedingRecords(prevRecords => 
        prevRecords.filter(r => r.id !== tempId)
      );
      Alert.alert("Error", "Failed to add feeding schedule. Please try again.");
    } finally {
      setAddingRecord(false);
    }
  };

  // Handle delete record
  const handleDeleteRecord = async (recordId: string, recordFood: string) => {
    Alert.alert(
      "Delete Schedule", 
      `Are you sure you want to delete "${recordFood}" schedule?`, 
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const recordToDelete = feedingRecords.find(r => r.id === recordId);
            
            // Optimistically remove from UI
            setFeedingRecords(prevRecords => 
              prevRecords.filter(r => r.id !== recordId)
            );

            try {
              await deleteFeedingSchedule(recordId);
              Alert.alert("Success", "Feeding schedule deleted successfully");
            } catch (error) {
              console.error("Error deleting record:", error);
              // Rollback on error
              if (recordToDelete) {
                setFeedingRecords(prevRecords => [recordToDelete, ...prevRecords]);
              }
              Alert.alert("Error", "Failed to delete schedule. Please try again.");
            }
          },
        },
      ]
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
      }}>
        <ActivityIndicator size="large" color="#A8BBA3" />
        <MaterialIcons name="pets" size={48} color="#A8BBA3" style={{ marginTop: 20 }} />
        <Text style={{ marginTop: 10, color: "#666", fontSize: 16 }}>
          Loading feeding details...
        </Text>
      </View>
    );
  }

  // Error state
  if (!pet) {
    return (
      <View style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
      }}>
        <MaterialIcons name="error" size={48} color="#ff4444" />
        <Text style={{ marginTop: 10, color: "#ff4444", fontSize: 16 }}>
          Pet not found
        </Text>
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
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: "#f5f5f5" }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={["#A8BBA3"]}
          tintColor="#A8BBA3"
        />
      }
    >
      {/* Pet Header */}
      <View style={{
        backgroundColor: "#5D688A",
        padding: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      }}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 1,
            padding: 8,
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={{ 
          flexDirection: "row", 
          alignItems: "center", 
          marginBottom: 10,
          marginTop: 20
        }}>
          <MaterialIcons name="pets" size={32} color="white" />
          <Text style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "white",
            marginLeft: 10,
          }}>
            {pet.name}'s Feeding
          </Text>
        </View>
        <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
          {pet.breed} • {pet.age} years • {pet.weight} kg
        </Text>
      </View>

      {/* Feeding Records Counter */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: 20,
        marginBottom: 10,
      }}>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          color: '#000' 
        }}>
          Feeding Schedules
        </Text>
        <Text style={{ 
          fontSize: 14, 
          color: '#A8BBA3',
          fontWeight: '600'
        }}>
          {feedingRecords.length} schedule{feedingRecords.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Add Schedule Button */}
      <TouchableOpacity
        style={{
          backgroundColor: "#A8BBA3",
          margin: 20,
          marginTop: 10,
          padding: 15,
          borderRadius: 12,
          alignItems: "center",
          flexDirection: 'row',
          justifyContent: 'center',
        }}
        onPress={() => setShowAddModal(true)}
      >
        <MaterialIcons name="add" size={20} color="white" />
        <Text style={{ 
          color: "white", 
          fontWeight: "bold",
          marginLeft: 8
        }}>
          Add Feeding Schedule
        </Text>
      </TouchableOpacity>

      {/* Records List */}
      <View style={{ marginHorizontal: 20, marginBottom: 30 }}>
        {feedingRecords.length === 0 ? (
          <View style={{
            padding: 40,
            alignItems: "center",
            backgroundColor: "white",
            borderRadius: 12,
            elevation: 2,
          }}>
            <MaterialIcons name="restaurant" size={48} color="#A8BBA3" />
            <Text style={{ 
              marginTop: 15, 
              fontWeight: "bold", 
              color: "#896C6C",
              fontSize: 16 
            }}>
              No feeding schedules yet
            </Text>
            <Text style={{ 
              marginTop: 5, 
              color: "#999",
              textAlign: 'center',
              fontSize: 14
            }}>
              Add your pet's first feeding schedule to get started
            </Text>
          </View>
        ) : (
          feedingRecords.map((record, index) => (
            <View
              key={record.id || index}
              style={{
                backgroundColor: "white",
                padding: 15,
                borderRadius: 12,
                marginBottom: 12,
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
              }}
            >
              <View style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                    <MaterialIcons 
                      name="restaurant" 
                      size={18} 
                      color="#5D688A"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{ 
                      fontWeight: "bold", 
                      fontSize: 16, 
                      color: "#000",
                      flex: 1
                    }}>
                      {record.food} ({record.quantity})
                    </Text>
                  </View>
                  
                  <Text style={{ 
                    color: "#5D688A", 
                    fontSize: 12,
                    fontWeight: '600',
                    marginBottom: 3
                  }}>
                    {record.date} at {record.time}
                    {record.repeat !== "none" && ` • ${record.repeat}`}
                  </Text>
                  
                  {record.notes && record.notes.trim() && (
                    <Text style={{ 
                      color: "#666", 
                      fontSize: 12, 
                      marginTop: 5,
                      fontStyle: 'italic'
                    }}>
                      {record.notes}
                    </Text>
                  )}
                </View>

                <TouchableOpacity 
                  onPress={() => handleDeleteRecord(record.id!, record.food)}
                  style={{ padding: 8 }}
                >
                  <MaterialIcons name="delete" size={20} color="#FF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          padding: 20,
        }}>
          <View style={{ 
            backgroundColor: "white", 
            borderRadius: 12, 
            padding: 20,
            maxHeight: '85%'
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <Text style={{ 
                fontWeight: "bold", 
                fontSize: 18,
                color: '#000'
              }}>
                Add Feeding Schedule
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Food */}
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                color: '#000',
                marginBottom: 8
              }}>
                Food *
              </Text>
              <TextInput
                placeholder="Enter food name"
                value={newRecord.food}
                onChangeText={(t) => setNewRecord({ ...newRecord, food: t })}
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 15,
                  fontSize: 16,
                  backgroundColor: '#fafafa'
                }}
                maxLength={50}
              />

              {/* Quantity */}
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                color: '#000',
                marginBottom: 8
              }}>
                Quantity *
              </Text>
              <TextInput
                placeholder="Enter quantity (e.g., 1 cup, 200g)"
                value={newRecord.quantity}
                onChangeText={(t) => setNewRecord({ ...newRecord, quantity: t })}
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 15,
                  fontSize: 16,
                  backgroundColor: '#fafafa'
                }}
                maxLength={30}
              />

              {/* Date */}
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                color: '#000',
                marginBottom: 8
              }}>
                Date *
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 15,
                  backgroundColor: '#fafafa',
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <MaterialIcons name="calendar-today" size={20} color="#A8BBA3" />
                <Text style={{ marginLeft: 8, fontSize: 16, color: '#000' }}>
                  {new Date(newRecord.date).toLocaleDateString()}
                </Text>
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

              {/* Time */}
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                color: '#000',
                marginBottom: 8
              }}>
                Time *
              </Text>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 15,
                  backgroundColor: '#fafafa',
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <MaterialIcons name="access-time" size={20} color="#A8BBA3" />
                <Text style={{ marginLeft: 8, fontSize: 16, color: '#000' }}>
                  {newRecord.time}
                </Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={new Date(`${newRecord.date}T${newRecord.time}`)}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={(e, date) => {
                    setShowTimePicker(false);
                    if (date) {
                      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      setNewRecord({
                        ...newRecord,
                        time: timeStr,
                      });
                    }
                  }}
                />
              )}

              {/* Repeat */}
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                color: '#000',
                marginBottom: 8
              }}>
                Repeat
              </Text>
              <View style={{ 
                flexDirection: "row", 
                marginBottom: 15, 
                justifyContent: 'space-between'
              }}>
                {["none", "daily", "weekly"].map((repeatOption) => (
                  <TouchableOpacity
                    key={repeatOption}
                    onPress={() => setNewRecord({ ...newRecord, repeat: repeatOption as any })}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: newRecord.repeat === repeatOption ? "#A8BBA3" : "#f0f0f0",
                      minWidth: 80,
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{
                      color: newRecord.repeat === repeatOption ? "white" : "#666",
                      fontSize: 12,
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}>
                      {repeatOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Notes */}
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                color: '#000',
                marginBottom: 8
              }}>
                Notes
              </Text>
              <TextInput
                placeholder="Add any additional notes..."
                value={newRecord.notes}
                onChangeText={(t) => setNewRecord({ ...newRecord, notes: t })}
                multiline
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 20,
                  height: 80,
                  fontSize: 16,
                  backgroundColor: '#fafafa',
                  textAlignVertical: 'top'
                }}
                maxLength={200}
              />
            </ScrollView>

            <View style={{ 
              flexDirection: "row", 
              justifyContent: "space-between",
              marginTop: 10
            }}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                disabled={addingRecord}
                style={{
                  padding: 15,
                  backgroundColor: "#f0f0f0",
                  borderRadius: 8,
                  flex: 1,
                  marginRight: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: '#666', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddRecord}
                disabled={addingRecord}
                style={{
                  padding: 15,
                  backgroundColor: addingRecord ? "#ccc" : "#A8BBA3",
                  borderRadius: 8,
                  flex: 1,
                  marginLeft: 10,
                  alignItems: "center",
                }}
              >
                {addingRecord ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={{ color: "white", fontWeight: "bold" }}>Add Schedule</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default PetFeedingDetail;