import React, { useState, useEffect } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Image 
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { auth } from "../../../firebase";
import { getPetById } from "../../../services/petService";
import { Pet } from "../../../types/pet";

// Feeding service imports
import { 
  addFeedingSchedule as addScheduleToDB, 
  getFeedingSchedulesByPet, 
  deleteFeedingSchedule as deleteScheduleFromDB 
} from "../../../services/feedingService";

interface FeedingSchedule {
  id?: string;
  petId: string;
  foodType: string;
  amount: string;
  time: string;
  frequency: 'daily' | 'weekly' | 'monthly';
}

const PetDietDetail = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [pet, setPet] = useState<Pet | null>(null);
  const [feedingSchedules, setFeedingSchedules] = useState<FeedingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    foodType: '',
    amount: '',
    time: '',
    frequency: 'daily' as const,
  });

  const userId = auth.currentUser?.uid || "";

  // Load pet details
  const loadPet = async () => {
    if (!id || typeof id !== 'string') {
      console.log('Invalid pet ID:', id);
      setLoading(false);
      return;
    }
    
    try {
      console.log('Loading pet with ID:', id);
      const petData = await getPetById(id);
      console.log('Pet data loaded:', petData);
      setPet(petData);
      
      if (!petData) {
        Alert.alert("Error", "Pet not found");
      }
    } catch (error) {
      console.error('Error loading pet:', error);
      Alert.alert("Error", "Failed to load pet details");
    } finally {
      setLoading(false);
    }
  };

  // Load feeding schedules for this pet
  const loadFeedingSchedules = async () => {
    if (!id || typeof id !== 'string') return;
    
    try {
      console.log('Loading feeding schedules for pet:', id);
      const schedules = await getFeedingSchedulesByPet(id);
      console.log('Feeding schedules loaded:', schedules);
      setFeedingSchedules(schedules);
    } catch (error) {
      console.error('Error loading feeding schedules:', error);
      Alert.alert("Error", "Failed to load feeding schedules");
    }
  };

  // Add feeding schedule
  const addFeedingSchedule = async () => {
    if (!pet || !newSchedule.foodType || !newSchedule.amount || !newSchedule.time) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    try {
      const id = await addScheduleToDB({
        petId: pet.id!,
        ...newSchedule,
      });

      setFeedingSchedules([
        ...feedingSchedules,
        { id, petId: pet.id!, ...newSchedule },
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
    console.log('Pet ID from params:', id);
    if (id) {
      setLoading(true);
      loadPet();
      loadFeedingSchedules();
    }
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <MaterialIcons name="pets" size={48} color="#ccc" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading pet details...</Text>
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <MaterialIcons name="error" size={48} color="#ff4444" />
        <Text style={{ marginTop: 10, color: '#ff4444', fontSize: 16 }}>Pet not found</Text>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={{ marginTop: 20, backgroundColor: '#5D688A', padding: 12, borderRadius: 8 }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Pet Header with Image */}
      <View style={{
        backgroundColor: '#A8BBA3',
        padding: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
          {/* Pet Image */}
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 15,
            overflow: 'hidden',
          }}>
            {pet.image ? (
              <Image 
                source={{ uri: pet.image }} 
                style={{ width: 80, height: 80, borderRadius: 40 }}
                resizeMode="cover"
              />
            ) : (
              <MaterialIcons name="pets" size={40} color="rgba(255,255,255,0.8)" />
            )}
          </View>

          {/* Pet Info */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 5 }}>
              {pet.name}
            </Text>
            <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)' }}>
              {pet.breed}
            </Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
              {pet.age} years old • {pet.weight} kg
            </Text>
          </View>
        </View>
      </View>

      {/* Add Schedule Button */}
      <TouchableOpacity
        onPress={() => setShowAddModal(true)}
        style={{
          backgroundColor: '#896C6C',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 20,
          padding: 15,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <MaterialIcons name="add" size={24} color="white" />
        <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8 }}>
          Add Feeding Schedule
        </Text>
      </TouchableOpacity>

      {/* Feeding Schedules */}
      <View style={{ margin: 20, marginTop: 0 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
          Feeding Schedule for {pet.name} ({feedingSchedules.length})
        </Text>
        
        {feedingSchedules.length === 0 ? (
          <View style={{
            backgroundColor: 'white',
            padding: 30,
            borderRadius: 12,
            alignItems: 'center',
          }}>
            <MaterialIcons name="restaurant" size={48} color="#ccc" />
            <Text style={{ color: '#999', fontSize: 16, marginTop: 10 }}>
              No feeding schedules yet
            </Text>
            <Text style={{ color: '#999', fontSize: 14, textAlign: 'center', marginTop: 5 }}>
              Add a schedule to track your pet's feeding routine
            </Text>
          </View>
        ) : (
          feedingSchedules.map((schedule) => (
            <View key={schedule.id} style={{
              backgroundColor: 'white',
              padding: 15,
              borderRadius: 12,
              marginBottom: 10,
              borderLeftWidth: 4,
              borderLeftColor: '#A8BBA3',
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <MaterialIcons name="restaurant" size={20} color="#A8BBA3" />
                  <Text style={{ fontSize: 16, fontWeight: 'bold', marginLeft: 8, flex: 1 }}>
                    {schedule.foodType}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => deleteFeedingSchedule(schedule.id!)}
                  style={{ padding: 5 }}
                >
                  <MaterialIcons name="delete" size={20} color="#ff4444" />
                </TouchableOpacity>
              </View>
              
              <View style={{ backgroundColor: '#f8f9fa', padding: 10, borderRadius: 8 }}>
                <Text style={{ color: '#666', marginBottom: 4 }}>
                  🥄 Amount: {schedule.amount}
                </Text>
                <Text style={{ color: '#666', marginBottom: 4 }}>
                  ⏰ Time: {schedule.time}
                </Text>
                <Text style={{ color: '#5D688A', fontWeight: 'bold' }}>
                  📅 Frequency: {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

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
            maxHeight: '80%',
          }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>
                Add Feeding Schedule for {pet.name}
              </Text>

              <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Food Type *</Text>
              <TextInput
                placeholder="e.g., Dry Food, Wet Food, Treats"
                value={newSchedule.foodType}
                onChangeText={(text) => setNewSchedule({...newSchedule, foodType: text})}
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  padding: 12,
                  marginBottom: 15,
                  borderRadius: 8,
                }}
              />

              <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Amount *</Text>
              <TextInput
                placeholder="e.g., 1 cup, 200g, 2 pieces"
                value={newSchedule.amount}
                onChangeText={(text) => setNewSchedule({...newSchedule, amount: text})}
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  padding: 12,
                  marginBottom: 15,
                  borderRadius: 8,
                }}
              />

              <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Time *</Text>
              <TextInput
                placeholder="e.g., 08:00 AM, 6:30 PM"
                value={newSchedule.time}
                onChangeText={(text) => setNewSchedule({...newSchedule, time: text})}
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  padding: 12,
                  marginBottom: 15,
                  borderRadius: 8,
                }}
              />

              {/* Frequency Selector */}
              <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Frequency:</Text>
              <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                {['daily', 'weekly', 'monthly'].map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    onPress={() => setNewSchedule({...newSchedule, frequency: freq as any})}
                    style={{
                      backgroundColor: newSchedule.frequency === freq ? '#A8BBA3' : '#f0f0f0',
                      padding: 12,
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
                    padding: 15,
                    borderRadius: 8,
                    flex: 1,
                    marginRight: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={addFeedingSchedule}
                  style={{
                    backgroundColor: '#896C6C',
                    padding: 15,
                    borderRadius: 8,
                    flex: 1,
                    marginLeft: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Save Schedule</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default PetDietDetail;