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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
        <View style={{
          backgroundColor: '#4ECDC4',
          padding: 20,
          borderRadius: 50,
          marginBottom: 16,
        }}>
          <MaterialIcons name="pets" size={48} color="white" />
        </View>
        <Text style={{ marginTop: 10, color: '#34495E', fontSize: 18, fontWeight: '600' }}>Loading pet details...</Text>
        <Text style={{ marginTop: 4, color: '#7F8C8D', fontSize: 14 }}>Please wait</Text>
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
        <View style={{
          backgroundColor: '#FF6B6B',
          padding: 20,
          borderRadius: 50,
          marginBottom: 16,
        }}>
          <MaterialIcons name="error" size={48} color="white" />
        </View>
        <Text style={{ marginTop: 10, color: '#E74C3C', fontSize: 18, fontWeight: '700' }}>Pet not found</Text>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={{ 
            marginTop: 20, 
            backgroundColor: '#4ECDC4', 
            paddingHorizontal: 24, 
            paddingVertical: 12, 
            borderRadius: 15,
            shadowColor: '#4ECDC4',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      {/* Pet Header with Image */}
      <View style={{
        backgroundColor: '#4ECDC4',
        padding: 24,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#4ECDC4',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
          {/* Pet Image */}
          <View style={{
            width: 85,
            height: 85,
            borderRadius: 42.5,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 18,
            overflow: 'hidden',
            borderWidth: 3,
            borderColor: 'rgba(255,255,255,0.2)',
          }}>
            {pet.image ? (
              <Image 
                source={{ uri: pet.image }} 
                style={{ width: 85, height: 85, borderRadius: 42.5 }}
                resizeMode="cover"
              />
            ) : (
              <MaterialIcons name="pets" size={42} color="rgba(255,255,255,0.9)" />
            )}
          </View>

          {/* Pet Info */}
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: 28, 
              fontWeight: 'bold', 
              color: 'white', 
              marginBottom: 6,
              textShadowColor: 'rgba(0,0,0,0.3)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}>
              {pet.name}
            </Text>
            <Text style={{ fontSize: 17, color: 'rgba(255,255,255,0.95)', fontWeight: '500' }}>
              {pet.breed}
            </Text>
            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
              {pet.age} years old • {pet.weight} kg
            </Text>
          </View>
        </View>
      </View>

      {/* Add Schedule Button */}
      <TouchableOpacity
        onPress={() => setShowAddModal(true)}
        style={{
          backgroundColor: '#FF6B6B',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 20,
          paddingVertical: 16,
          paddingHorizontal: 20,
          borderRadius: 20,
          shadowColor: '#FF6B6B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <MaterialIcons name="add" size={26} color="white" />
        <Text style={{ 
          color: 'white', 
          fontWeight: '700', 
          marginLeft: 10, 
          fontSize: 17 
        }}>
          Add Feeding Schedule
        </Text>
      </TouchableOpacity>

      {/* Feeding Schedules */}
      <View style={{ margin: 20, marginTop: 0 }}>
        <Text style={{ 
          fontSize: 22, 
          fontWeight: '700', 
          marginBottom: 18,
          color: '#2C3E50'
        }}>
          Feeding Schedule for {pet.name} ({feedingSchedules.length})
        </Text>
        
        {feedingSchedules.length === 0 ? (
          <View style={{
            backgroundColor: 'white',
            padding: 40,
            borderRadius: 16,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1,
            borderColor: '#f0f0f0',
          }}>
            <MaterialIcons name="restaurant" size={56} color="#e9ecef" />
            <Text style={{ 
              color: '#6c757d', 
              fontSize: 18, 
              marginTop: 16, 
              fontWeight: '600' 
            }}>
              No feeding schedules yet
            </Text>
            <Text style={{ 
              color: '#adb5bd', 
              fontSize: 15, 
              textAlign: 'center', 
              marginTop: 8,
              lineHeight: 22 
            }}>
              Add a schedule to track your pet's feeding routine
            </Text>
          </View>
        ) : (
          feedingSchedules.map((schedule) => (
            <View key={schedule.id} style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 16,
              marginBottom: 12,
              borderLeftWidth: 5,
              borderLeftColor: '#6B3F69',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 12 
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <MaterialIcons name="restaurant" size={22} color="#6B3F69" />
                  <Text style={{ 
                    fontSize: 18, 
                    fontWeight: '700', 
                    marginLeft: 10, 
                    flex: 1,
                    color: '#2c2c2c'
                  }}>
                    {schedule.foodType}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => deleteFeedingSchedule(schedule.id!)}
                  style={{ 
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: '#fff5f5'
                  }}
                >
                  <MaterialIcons name="delete" size={22} color="#dc3545" />
                </TouchableOpacity>
              </View>
              
              <View style={{ 
                backgroundColor: '#f8f9fa', 
                padding: 16, 
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e9ecef'
              }}>
                <Text style={{ color: '#495057', marginBottom: 8, fontSize: 15, fontWeight: '500' }}>
                  🥄 Amount: <Text style={{ color: '#6B3F69', fontWeight: '600' }}>{schedule.amount}</Text>
                </Text>
                <Text style={{ color: '#495057', marginBottom: 8, fontSize: 15, fontWeight: '500' }}>
                  ⏰ Time: <Text style={{ color: '#6B3F69', fontWeight: '600' }}>{schedule.time}</Text>
                </Text>
                <Text style={{ color: '#495057', fontSize: 15, fontWeight: '500' }}>
                  📅 Frequency: <Text style={{ color: '#6B3F69', fontWeight: '700' }}>
                    {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)}
                  </Text>
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
          backgroundColor: 'rgba(107, 63, 105, 0.4)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: 'white',
            margin: 20,
            padding: 24,
            borderRadius: 20,
            width: '90%',
            maxHeight: '85%',
            shadowColor: '#6B3F69',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 10,
          }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ 
                fontSize: 22, 
                fontWeight: '700', 
                marginBottom: 20, 
                textAlign: 'center',
                color: '#2c2c2c'
              }}>
                Add Feeding Schedule for {pet.name}
              </Text>

              <Text style={{ fontWeight: '600', marginBottom: 8, color: '#495057', fontSize: 16 }}>
                Food Type *
              </Text>
              <TextInput
                placeholder="e.g., Dry Food, Wet Food, Treats"
                placeholderTextColor="#adb5bd"
                value={newSchedule.foodType}
                onChangeText={(text) => setNewSchedule({...newSchedule, foodType: text})}
                style={{
                  borderWidth: 2,
                  borderColor: '#e9ecef',
                  padding: 16,
                  marginBottom: 18,
                  borderRadius: 12,
                  fontSize: 16,
                  backgroundColor: '#f8f9fa',
                  color: '#2c2c2c',
                }}
              />

              <Text style={{ fontWeight: '600', marginBottom: 8, color: '#495057', fontSize: 16 }}>
                Amount *
              </Text>
              <TextInput
                placeholder="e.g., 1 cup, 200g, 2 pieces"
                placeholderTextColor="#adb5bd"
                value={newSchedule.amount}
                onChangeText={(text) => setNewSchedule({...newSchedule, amount: text})}
                style={{
                  borderWidth: 2,
                  borderColor: '#e9ecef',
                  padding: 16,
                  marginBottom: 18,
                  borderRadius: 12,
                  fontSize: 16,
                  backgroundColor: '#f8f9fa',
                  color: '#2c2c2c',
                }}
              />

              <Text style={{ fontWeight: '600', marginBottom: 8, color: '#495057', fontSize: 16 }}>
                Time *
              </Text>
              <TextInput
                placeholder="e.g., 08:00 AM, 6:30 PM"
                placeholderTextColor="#adb5bd"
                value={newSchedule.time}
                onChangeText={(text) => setNewSchedule({...newSchedule, time: text})}
                style={{
                  borderWidth: 2,
                  borderColor: '#e9ecef',
                  padding: 16,
                  marginBottom: 18,
                  borderRadius: 12,
                  fontSize: 16,
                  backgroundColor: '#f8f9fa',
                  color: '#2c2c2c',
                }}
              />

              {/* Frequency Selector */}
              <Text style={{ fontWeight: '600', marginBottom: 12, color: '#495057', fontSize: 16 }}>
                Frequency:
              </Text>
              <View style={{ flexDirection: 'row', marginBottom: 24, gap: 8 }}>
                {['daily', 'weekly', 'monthly'].map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    onPress={() => setNewSchedule({...newSchedule, frequency: freq as any})}
                    style={{
                      backgroundColor: newSchedule.frequency === freq ? '#6B3F69' : '#f8f9fa',
                      borderWidth: 2,
                      borderColor: newSchedule.frequency === freq ? '#6B3F69' : '#e9ecef',
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      flex: 1,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{
                      color: newSchedule.frequency === freq ? 'white' : '#495057',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      fontSize: 15,
                    }}>
                      {freq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  style={{
                    backgroundColor: '#6c757d',
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    flex: 1,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={addFeedingSchedule}
                  style={{
                    backgroundColor: '#6B3F69',
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    flex: 1,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Save Schedule</Text>
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