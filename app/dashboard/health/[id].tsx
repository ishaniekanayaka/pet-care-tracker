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
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingRecord, setAddingRecord] = useState(false);

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
    { value: "treatment", label: "Treatment", icon: "healing", color: "#FF6B6B" },
  ];

  // Optimized pet loading function
  const loadPet = useCallback(async () => {
    if (!id || typeof id !== "string") {
      console.log("Invalid pet ID:", id);
      return;
    }

    try {
      console.log("Loading pet with ID:", id);
      const petData = await getPetById(id);
      if (petData) {
        setPet(petData);
        console.log("Pet loaded successfully:", petData.name);
      } else {
        console.log("Pet not found");
        Alert.alert("Error", "Pet not found");
      }
    } catch (error) {
      console.error("Error loading pet:", error);
      Alert.alert("Error", "Failed to load pet details");
    }
  }, [id]);

  // Optimized health records loading function
  const loadHealthRecords = useCallback(async (showLoader = false) => {
    if (!id || typeof id !== "string") {
      console.log("Invalid pet ID for health records:", id);
      return;
    }

    try {
      if (showLoader) setRefreshing(true);
      
      console.log("Loading health records for pet:", id);
      const records = await getHealthRecordsByPet(id);
      console.log("Health records loaded:", records.length);
      
      // Update state with loaded records
      setHealthRecords(records);
      
      // If no records found, show helpful message
      if (records.length === 0) {
        console.log("No health records found - user can add new ones");
      }

    } catch (error) {
      console.error("Error loading health records:", error);
      Alert.alert("Error", "Failed to load health records");
      setHealthRecords([]); // Set to empty array on error
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

      console.log("Initializing pet health detail for ID:", id);
      setLoading(true);

      try {
        // Load pet and health records in parallel
        await Promise.all([
          loadPet(),
          loadHealthRecords()
        ]);

        // Setup notifications
        await registerHealthNotifications();
        console.log("Notifications registered successfully");

      } catch (error) {
        console.error("Error during initialization:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [id, loadPet, loadHealthRecords]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    console.log("Refreshing pet health data...");
    await Promise.all([
      loadPet(),
      loadHealthRecords(true)
    ]);
  }, [loadPet, loadHealthRecords]);

  // Reset form function
  const resetForm = useCallback(() => {
    setNewRecord({
      type: "vaccination",
      title: "",
      date: today,
      nextDue: "",
      notes: "",
    });
  }, [today]);

  // Handle add record with immediate UI update
  const handleAddRecord = async () => {
    if (!pet || !newRecord.title.trim() || !newRecord.date) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    setAddingRecord(true);
    const tempId = `temp_${Date.now()}`;

    try {
      console.log("Adding new health record...");
      
      // Create the record object
      const record: HealthRecord = { 
        petId: pet.id!, 
        type: newRecord.type,
        title: newRecord.title.trim(),
        date: newRecord.date,
        nextDue: newRecord.nextDue,
        notes: newRecord.notes.trim()
      };

      // Optimistically add to UI immediately
      const optimisticRecord = { ...record, id: tempId };
      setHealthRecords(prevRecords => [optimisticRecord, ...prevRecords]);
      
      // Close modal and reset form immediately
      setShowAddModal(false);
      resetForm();
      
      // Try to save to Firebase
      const result = await addHealthRecord(record);
      
      if (result.success) {
        console.log("Health record saved successfully with ID:", result.id);
        
        // Replace the temporary record with the real one
        setHealthRecords(prevRecords => 
          prevRecords.map(r => 
            r.id === tempId 
              ? { ...record, id: result.id! }
              : r
          )
        );
        
        Alert.alert("Success", "Health record added successfully!");
        
        // Set reminder if next due date exists
        if (record.nextDue && pet) {
          try {
            await scheduleHealthReminder(pet.name, { ...record, id: result.id! }, 3);
          } catch (reminderError) {
            console.log("Failed to set reminder:", reminderError);
          }
        }

      } else {
        console.error("Failed to save health record:", result.error);
        
        // Remove the optimistic record on failure
        setHealthRecords(prevRecords => 
          prevRecords.filter(r => r.id !== tempId)
        );
        
        Alert.alert("Error", "Failed to save health record. Please try again.");
      }

    } catch (error) {
      console.error("Error adding record:", error);
      
      // Remove the optimistic record on error
      setHealthRecords(prevRecords => 
        prevRecords.filter(r => r.id !== tempId)
      );
      
      Alert.alert("Error", "Failed to add health record. Please try again.");
    } finally {
      setAddingRecord(false);
    }
  };

  // Handle delete record with immediate UI update
  const handleDeleteRecord = async (recordId: string, recordTitle: string) => {
    Alert.alert(
      "Delete Record", 
      `Are you sure you want to delete "${recordTitle}"?`, 
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            console.log("Deleting record:", recordId);
            
            // Store the record for potential rollback
            const recordToDelete = healthRecords.find(r => r.id === recordId);
            
            // Optimistically remove from UI
            setHealthRecords(prevRecords => 
              prevRecords.filter(r => r.id !== recordId)
            );

            try {
              await deleteHealthRecord(recordId);
              console.log("Record deleted successfully");
              Alert.alert("Success", "Health record deleted successfully");
              
            } catch (error) {
              console.error("Error deleting record:", error);
              
              // Rollback on error - add the record back
              if (recordToDelete) {
                setHealthRecords(prevRecords => [recordToDelete, ...prevRecords]);
              }
              
              Alert.alert("Error", "Failed to delete record. Please try again.");
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
          Loading pet details...
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
        backgroundColor: "#FF6B6B",
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
            {pet.name}'s Health
          </Text>
        </View>
        <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>
          {pet.breed} • {pet.age} years • {pet.weight} kg
        </Text>
      </View>

      {/* Health Records Counter */}
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
          Health Records
        </Text>
        <Text style={{ 
          fontSize: 14, 
          color: '#A8BBA3',
          fontWeight: '600'
        }}>
          {healthRecords.length} record{healthRecords.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Add Record Button */}
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
          Add Health Record
        </Text>
      </TouchableOpacity>

      {/* Records List */}
      <View style={{ marginHorizontal: 20, marginBottom: 30 }}>
        {healthRecords.length === 0 ? (
          <View style={{
            padding: 40,
            alignItems: "center",
            backgroundColor: "white",
            borderRadius: 12,
            elevation: 2,
          }}>
            <MaterialIcons name="medical-services" size={48} color="#A8BBA3" />
            <Text style={{ 
              marginTop: 15, 
              fontWeight: "bold", 
              color: "#896C6C",
              fontSize: 16 
            }}>
              No health records yet
            </Text>
            <Text style={{ 
              marginTop: 5, 
              color: "#999",
              textAlign: 'center',
              fontSize: 14
            }}>
              Add your pet's first health record to get started
            </Text>
          </View>
        ) : (
          healthRecords.map((record, index) => {
            const recordType = recordTypes.find(rt => rt.value === record.type) || recordTypes[0];
            
            return (
              <View
                key={record.id}
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
                        name={recordType.icon as any} 
                        size={18} 
                        color={recordType.color}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={{ 
                        fontWeight: "bold", 
                        fontSize: 16, 
                        color: "#000",
                        flex: 1
                      }}>
                        {record.title}
                      </Text>
                    </View>
                    
                    <Text style={{ 
                      color: recordType.color, 
                      fontSize: 11,
                      textTransform: 'uppercase',
                      fontWeight: '600',
                      marginBottom: 3
                    }}>
                      {recordType.label}
                    </Text>
                    
                    <Text style={{ color: "#666", fontSize: 12 }}>
                      {new Date(record.date).toLocaleDateString()}
                      {record.nextDue && (
                        <Text style={{ color: '#A8BBA3', fontWeight: '500' }}>
                          {" • Next: " + new Date(record.nextDue).toLocaleDateString()}
                        </Text>
                      )}
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

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {/* Bell Icon for reminders */}
                    {record.nextDue && (
                      <TouchableOpacity
                        onPress={() => {
                          scheduleHealthReminder(pet.name, record, 3);
                          Alert.alert(
                            "Reminder Set",
                            `Reminder scheduled 3 days before ${new Date(record.nextDue).toLocaleDateString()}`
                          );
                        }}
                        style={{ 
                          marginRight: 10,
                          padding: 8
                        }}
                      >
                        <MaterialIcons
                          name="notifications"
                          size={20}
                          color="#4CAF50"
                        />
                      </TouchableOpacity>
                    )}

                    {/* Delete button */}
                    <TouchableOpacity 
                      onPress={() => handleDeleteRecord(record.id, record.title)}
                      style={{ padding: 8 }}
                    >
                      <MaterialIcons name="delete" size={20} color="#FF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
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
                Add Health Record
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
              {/* Record Type */}
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                color: '#000',
                marginBottom: 10
              }}>
                Record Type
              </Text>
              <View style={{ 
                flexDirection: "row", 
                marginBottom: 15, 
                flexWrap: "wrap" 
              }}>
                {recordTypes.map((rt) => (
                  <TouchableOpacity
                    key={rt.value}
                    onPress={() => setNewRecord({ ...newRecord, type: rt.value })}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      marginRight: 8,
                      marginBottom: 8,
                      borderRadius: 20,
                      backgroundColor: newRecord.type === rt.value ? rt.color : "#f0f0f0",
                    }}
                  >
                    <MaterialIcons 
                      name={rt.icon as any} 
                      size={16} 
                      color={newRecord.type === rt.value ? "white" : "#666"} 
                    />
                    <Text style={{
                      marginLeft: 4,
                      color: newRecord.type === rt.value ? "white" : "#666",
                      fontSize: 12,
                      fontWeight: '500'
                    }}>
                      {rt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Title */}
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                color: '#000',
                marginBottom: 8
              }}>
                Title *
              </Text>
              <TextInput
                placeholder="Enter record title (e.g., Annual Vaccination)"
                value={newRecord.title}
                onChangeText={(t) => setNewRecord({ ...newRecord, title: t })}
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
                  maximumDate={new Date()}
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
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                color: '#000',
                marginBottom: 8
              }}>
                Next Due Date (Optional)
              </Text>
              <TouchableOpacity
                onPress={() => setShowNextDuePicker(true)}
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 15,
                  backgroundColor: '#fafafa',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <MaterialIcons name="event" size={20} color="#A8BBA3" />
                  <Text style={{ marginLeft: 8, fontSize: 16, color: '#000' }}>
                    {newRecord.nextDue ? 
                      new Date(newRecord.nextDue).toLocaleDateString() : 
                      "Select next due date"
                    }
                  </Text>
                </View>
                {newRecord.nextDue && (
                  <TouchableOpacity
                    onPress={() => setNewRecord({ ...newRecord, nextDue: "" })}
                    style={{ padding: 4 }}
                  >
                    <MaterialIcons name="clear" size={16} color="#666" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              {showNextDuePicker && (
                <DateTimePicker
                  value={newRecord.nextDue ? new Date(newRecord.nextDue) : new Date()}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
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
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                color: '#000',
                marginBottom: 8
              }}>
                Notes
              </Text>
              <TextInput
                placeholder="Add any additional notes or observations..."
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
                  <Text style={{ color: "white", fontWeight: "bold" }}>Add Record</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default PetHealthDetail;