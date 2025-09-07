import React, { useState, useEffect } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Modal 
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { auth } from "../../firebase";
import { getPetsByUser } from "../../services/petService";
import { Pet } from "../../types/pet";

// Feeding service imports
import { 
  addFeedingSchedule as addScheduleToDB, 
  getFeedingSchedulesByPet, 
  deleteFeedingSchedule as deleteScheduleFromDB 
} from "../../services/feedingService";

interface FeedingSchedule {
  id?: string;
  petId: string;
  foodType: string;
  amount: string;
  time: string;
  frequency: 'daily' | 'weekly' | 'monthly';
}

const Diet = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [feedingSchedules, setFeedingSchedules] = useState<FeedingSchedule[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    foodType: '',
    amount: '',
    time: '',
    frequency: 'daily' as const,
  });

  const userId = auth.currentUser?.uid || "";

  // Load pets
  const loadPets = async () => {
    if (!userId) return;
    const data = await getPetsByUser(userId);
    setPets(data);
    if (data.length > 0 && !selectedPet) {
      setSelectedPet(data[0]);
    }
  };

  // Load feeding schedules when pet changes
  useEffect(() => {
    const loadSchedules = async () => {
      if (selectedPet) {
        const schedules = await getFeedingSchedulesByPet(selectedPet.id!);
        setFeedingSchedules(schedules);
      }
    };
    loadSchedules();
  }, [selectedPet]);

  // Add feeding schedule
  const addFeedingSchedule = async () => {
    if (!selectedPet || !newSchedule.foodType || !newSchedule.amount || !newSchedule.time) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    try {
      const id = await addScheduleToDB({
        petId: selectedPet.id!,
        ...newSchedule,
      });

      setFeedingSchedules([
        ...feedingSchedules,
        { id, petId: selectedPet.id!, ...newSchedule },
      ]);

      setNewSchedule({ foodType: '', amount: '', time: '', frequency: 'daily' });
      setShowAddModal(false);
      Alert.alert("Success", "Feeding schedule added!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to add schedule.");
    }
  };

  // Delete feeding schedule
  const deleteFeedingSchedule = (scheduleId: string) => {
    Alert.alert(
      "Delete Schedule",
      "Are you sure you want to delete this feeding schedule?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteScheduleFromDB(scheduleId);
              setFeedingSchedules(feedingSchedules.filter(s => s.id !== scheduleId));
              Alert.alert("Success", "Schedule deleted");
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Failed to delete schedule.");
            }
          }
        },
      ]
    );
  };

  useEffect(() => {
    loadPets();
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <View style={{
        backgroundColor: '#4ECDC4',
        padding: 20,
        paddingTop: 50,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
          Diet Tracker 🍖
        </Text>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 }}>
          Manage feeding schedules and diet plans
        </Text>
      </View>

      {/* Pet Selector */}
      <View style={{ margin: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          Select Pet:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {pets.map((pet) => (
            <TouchableOpacity
              key={pet.id}
              onPress={() => setSelectedPet(pet)}
              style={{
                backgroundColor: selectedPet?.id === pet.id ? '#4ECDC4' : 'white',
                padding: 15,
                borderRadius: 12,
                marginRight: 10,
                minWidth: 100,
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: selectedPet?.id === pet.id ? 'white' : '#333',
                fontWeight: 'bold',
              }}>
                {pet.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedPet && (
        <>
          {/* Add Schedule Button */}
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={{
              backgroundColor: '#4ECDC4',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 20,
              padding: 15,
              borderRadius: 12,
            }}
          >
            <MaterialIcons name="add" size={24} color="white" />
            <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8 }}>
              Add Feeding Schedule
            </Text>
          </TouchableOpacity>

          {/* Feeding Schedules */}
          <View style={{ margin: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
              Feeding Schedule for {selectedPet.name}
            </Text>
            
            {feedingSchedules
              .filter(schedule => schedule.petId === selectedPet.id)
              .map((schedule) => (
                <View key={schedule.id} style={{
                  backgroundColor: 'white',
                  padding: 15,
                  borderRadius: 12,
                  marginBottom: 10,
                  borderLeftWidth: 4,
                  borderLeftColor: '#4ECDC4',
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>
                        {schedule.foodType}
                      </Text>
                      <Text style={{ color: '#666', marginBottom: 2 }}>
                        Amount: {schedule.amount}
                      </Text>
                      <Text style={{ color: '#666', marginBottom: 2 }}>
                        Time: {schedule.time}
                      </Text>
                      <Text style={{ color: '#666' }}>
                        Frequency: {schedule.frequency}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => deleteFeedingSchedule(schedule.id!)}
                      style={{
                        backgroundColor: '#FF4757',
                        padding: 8,
                        borderRadius: 8,
                      }}
                    >
                      <MaterialIcons name="delete" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

            {feedingSchedules.filter(s => s.petId === selectedPet.id).length === 0 && (
              <View style={{
                backgroundColor: 'white',
                padding: 40,
                borderRadius: 15,
                alignItems: 'center',
              }}>
                <MaterialIcons name="restaurant" size={48} color="#ccc" />
                <Text style={{ fontSize: 16, color: '#666', marginTop: 10 }}>
                  No feeding schedules yet
                </Text>
                <Text style={{ fontSize: 14, color: '#999', marginTop: 5 }}>
                  Add a schedule to get started!
                </Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* Add Schedule Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: 'white',
            margin: 20,
            padding: 20,
            borderRadius: 15,
            width: '90%',
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>
              Add Feeding Schedule
            </Text>

            <TextInput
              placeholder="Food Type (e.g., Dry Food, Wet Food)"
              value={newSchedule.foodType}
              onChangeText={(text) => setNewSchedule({...newSchedule, foodType: text})}
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                padding: 12,
                marginBottom: 12,
                borderRadius: 8,
              }}
            />

            <TextInput
              placeholder="Amount (e.g., 1 cup, 200g)"
              value={newSchedule.amount}
              onChangeText={(text) => setNewSchedule({...newSchedule, amount: text})}
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                padding: 12,
                marginBottom: 12,
                borderRadius: 8,
              }}
            />

            <TextInput
              placeholder="Time (e.g., 08:00 AM)"
              value={newSchedule.time}
              onChangeText={(text) => setNewSchedule({...newSchedule, time: text})}
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                padding: 12,
                marginBottom: 12,
                borderRadius: 8,
              }}
            />

            {/* Frequency Selector */}
            <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Frequency:</Text>
            <View style={{ flexDirection: 'row', marginBottom: 15 }}>
              {['daily', 'weekly', 'monthly'].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  onPress={() => setNewSchedule({...newSchedule, frequency: freq as any})}
                  style={{
                    backgroundColor: newSchedule.frequency === freq ? '#4ECDC4' : '#f0f0f0',
                    padding: 10,
                    borderRadius: 8,
                    marginRight: 10,
                    flex: 1,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    color: newSchedule.frequency === freq ? 'white' : '#666',
                    fontWeight: 'bold',
                    textTransform: 'capitalize',
                  }}>
                    {freq}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={{
                  backgroundColor: '#6c757d',
                  padding: 12,
                  borderRadius: 8,
                  flex: 1,
                  marginRight: 5,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={addFeedingSchedule}
                style={{
                  backgroundColor: '#4ECDC4',
                  padding: 12,
                  borderRadius: 8,
                  flex: 1,
                  marginLeft: 5,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default Diet;
