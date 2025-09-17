import React, { useState, useEffect } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Notifications from 'expo-notifications';
import { auth } from "../../../firebase";
import { getPetsByUser } from "../../../services/petService";
import { Pet } from "../../../types/pet";
import { 
  getFeedingSchedulesByPet, 
  requestNotificationPermissions,
  getAllScheduledNotifications
} from "../../../services/feedingService";

const DietIndex = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [feedingCounts, setFeedingCounts] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const router = useRouter();
  const userId = auth.currentUser?.uid || "";

  // Setup notifications when component mounts
  useEffect(() => {
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
    try {
      // Request permissions
      const hasPermission = await requestNotificationPermissions();
      setNotificationPermission(hasPermission);

      // Set up notification response handler
      const subscription = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        if (data.type === 'feeding_reminder' && data.petId) {
          // Navigate to the specific pet's feeding schedule
          router.push(`/dashboard/feeding_shedule/${data.petId}` as any);
        }
      });

      // Set up foreground notification handler
      const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received in foreground:', notification);
      });

      // Cleanup subscriptions
      return () => {
        subscription.remove();
        foregroundSubscription.remove();
      };
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  // Load pets and their feeding schedule counts
  const loadPets = async (showLoader = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      if (showLoader) setLoading(true);
      setRefreshing(true);
      
      console.log('Loading pets for user:', userId);
      const data = await getPetsByUser(userId);
      console.log('Loaded pets:', data);
      setPets(data);

      // Get feeding schedule counts for each pet
      const counts: {[key: string]: number} = {};
      for (const pet of data) {
        if (pet.id) {
          try {
            const schedules = await getFeedingSchedulesByPet(pet.id);
            counts[pet.id] = schedules.length;
            console.log(`Pet ${pet.name} (${pet.id}) has ${schedules.length} schedules`);
          } catch (error) {
            console.error(`Error loading schedules for pet ${pet.id}:`, error);
            counts[pet.id] = 0;
          }
        }
      }
      setFeedingCounts(counts);
    } catch (error) {
      console.error('Error loading pets:', error);
      Alert.alert("Error", "Failed to load pets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPets(true);
  }, [userId]);

  const handlePetSelect = (pet: Pet) => {
    if (pet.id) {
      console.log('Navigating to pet diet detail with ID:', pet.id);
      console.log('Pet object:', pet);
      
      router.push(`/dashboard/feeding_shedule/${pet.id!}` as any);
    } else {
      console.error('Pet ID is missing:', pet);
      Alert.alert("Error", "Pet ID is missing. Please try refreshing the list.");
    }
  };

  const showNotificationSettings = () => {
    Alert.alert(
      "Notification Settings",
      `Notifications are ${notificationPermission ? 'enabled' : 'disabled'}.\n\n${
        notificationPermission 
          ? 'You will receive reminders for feeding times.' 
          : 'Enable notifications to get feeding reminders.'
      }`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: notificationPermission ? "View Scheduled" : "Enable",
          onPress: notificationPermission ? showScheduledNotifications : requestNotificationPermissions
        }
      ]
    );
  };

  const showScheduledNotifications = async () => {
    try {
      const notifications = await getAllScheduledNotifications();
      const feedingNotifications = notifications.filter(n => 
        n.content.data?.type === 'feeding_reminder'
      );
      
      Alert.alert(
        "Scheduled Reminders",
        `You have ${feedingNotifications.length} feeding reminders scheduled.\n\n${
          feedingNotifications.slice(0, 3).map(n => 
            `• ${n.content.title} - ${new Date(n.trigger.value).toLocaleString()}`
          ).join('\n')
        }${feedingNotifications.length > 3 ? '\n...and more' : ''}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      Alert.alert("Error", "Failed to load scheduled notifications");
    }
  };

  if (loading && pets.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <MaterialIcons name="restaurant" size={48} color="#A8BBA3" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading pets...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Sticky Header */}
      <View style={{
        backgroundColor: '#A8BBA3',
        padding: 20,
        paddingTop: 50,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
              Diet Tracker 🍽️
            </Text>
            <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 }}>
              Manage feeding schedules and diet plans
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={showNotificationSettings}
            style={{
              padding: 10,
              backgroundColor: notificationPermission ? 'rgba(255,255,255,0.2)' : 'rgba(255,0,0,0.2)',
              borderRadius: 25,
            }}
          >
            <MaterialIcons 
              name={notificationPermission ? "notifications-active" : "notifications-off"} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPets()}
            colors={["#A8BBA3"]}
            tintColor="#A8BBA3"
            progressViewOffset={120}
          />
        }
      >
        {/* Notification Status Banner */}
        {!notificationPermission && (
          <View style={{
            margin: 20,
            marginTop: 10,
            backgroundColor: '#FFF3CD',
            padding: 15,
            borderRadius: 10,
            borderLeftWidth: 4,
            borderLeftColor: '#FFC107',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="warning" size={20} color="#856404" />
              <Text style={{ color: '#856404', fontWeight: 'bold', marginLeft: 8 }}>
                Enable Notifications
              </Text>
            </View>
            <Text style={{ color: '#856404', fontSize: 14, marginTop: 5 }}>
              Get reminders for feeding times. Tap the notification icon above to enable.
            </Text>
          </View>
        )}

        {/* Pet List */}
        <View style={{ margin: 20, marginTop: notificationPermission ? 10 : 0 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#A8BBA3' }}>
            Select a Pet ({pets.length}):
          </Text>

          {pets.length === 0 ? (
            <View style={{
              backgroundColor: 'white',
              padding: 40,
              borderRadius: 15,
              alignItems: 'center',
              shadowColor: '#A8BBA3',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <MaterialIcons name="pets" size={48} color="#A8BBA3" />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#A8BBA3', marginTop: 10 }}>
                No pets found
              </Text>
              <Text style={{ fontSize: 14, color: '#666', marginTop: 5, textAlign: 'center' }}>
                Add some pets first to track their diet
              </Text>
            </View>
          ) : (
            pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                onPress={() => handlePetSelect(pet)}
                style={{
                  backgroundColor: 'white',
                  padding: 20,
                  borderRadius: 12,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                    <MaterialIcons name="pets" size={24} color="#A8BBA3" />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 10 }}>
                      {pet.name}
                    </Text>
                  </View>
                  
                  <Text style={{ color: '#666', fontSize: 14 }}>
                    {pet.breed} • {pet.age} years old • {pet.weight}kg
                  </Text>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <MaterialIcons name="restaurant" size={16} color="#896C6C" />
                    <Text style={{ color: '#896C6C', fontSize: 12, marginLeft: 4, fontWeight: '600' }}>
                      {feedingCounts[pet.id!] || 0} feeding schedule{feedingCounts[pet.id!] !== 1 ? 's' : ''}
                    </Text>
                    
                    {notificationPermission && feedingCounts[pet.id!] > 0 && (
                      <>
                        <MaterialIcons name="notifications-active" size={16} color="#4CAF50" style={{ marginLeft: 10 }} />
                        <Text style={{ color: '#4CAF50', fontSize: 12, marginLeft: 2, fontWeight: '600' }}>
                          Reminders on
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                <View style={{ alignItems: 'center' }}>
                  <MaterialIcons name="arrow-forward-ios" size={20} color="#ccc" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Stats */}
        {pets.length > 0 && (
          <View style={{ margin: 20, marginTop: 0, paddingBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#A8BBA3' }}>
              Quick Overview:
            </Text>
            
            <View style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 12,
              flexDirection: 'row',
              justifyContent: 'space-around',
              shadowColor: '#A8BBA3',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#A8BBA3' }}>
                  {pets.length}
                </Text>
                <Text style={{ color: '#666', fontSize: 12 }}>Total Pets</Text>
              </View>
              
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#896C6C' }}>
                  {Object.values(feedingCounts).reduce((sum, count) => sum + count, 0)}
                </Text>
                <Text style={{ color: '#666', fontSize: 12 }}>Total Schedules</Text>
              </View>
              
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#5D688A' }}>
                  {Object.values(feedingCounts).filter(count => count > 0).length}
                </Text>
                <Text style={{ color: '#666', fontSize: 12 }}>With Schedules</Text>
              </View>

              <View style={{ alignItems: 'center' }}>
                <MaterialIcons 
                  name={notificationPermission ? "notifications-active" : "notifications-off"} 
                  size={24} 
                  color={notificationPermission ? "#4CAF50" : "#FF6B6B"} 
                />
                <Text style={{ 
                  color: notificationPermission ? "#4CAF50" : "#FF6B6B", 
                  fontSize: 12,
                  textAlign: 'center'
                }}>
                  {notificationPermission ? 'Notifications\nEnabled' : 'Notifications\nDisabled'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default DietIndex;