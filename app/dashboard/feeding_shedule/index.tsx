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

  // Pet card colors array
  const petCardColors = [
    { bg: '#FF8A65', accent: '#FF5722' }, // Coral Orange
    { bg: '#81C784', accent: '#4CAF50' }, // Green
    { bg: '#64B5F6', accent: '#2196F3' }, // Blue
    { bg: '#BA68C8', accent: '#9C27B0' }, // Purple
    { bg: '#FFB74D', accent: '#FF9800' }, // Orange
    { bg: '#4DB6AC', accent: '#009688' }, // Teal
    { bg: '#F06292', accent: '#E91E63' }, // Pink
    { bg: '#9575CD', accent: '#673AB7' }, // Deep Purple
  ];

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
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#F5F7FA'
      }}>
        <View style={{
          backgroundColor: '#4ECDC4',
          padding: 20,
          borderRadius: 50,
          marginBottom: 20,
        }}>
          <MaterialIcons name="restaurant" size={48} color="white" />
        </View>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: '600', 
          color: '#34495E',
          marginBottom: 8
        }}>
          Loading your pets...
        </Text>
        <Text style={{ 
          fontSize: 14, 
          color: '#7F8C8D',
          textAlign: 'center'
        }}>
          Please wait while we fetch your pet data
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      {/* Gradient Header */}
      <View style={{
        backgroundColor: '#4ECDC4',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: 50,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#4ECDC4',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: 28, 
              fontWeight: '800', 
              color: 'white',
              marginBottom: 4
            }}>
              Pet Care Tracker 🐾
            </Text>
            <Text style={{ 
              fontSize: 16, 
              color: 'rgba(255,255,255,0.9)', 
              fontWeight: '500'
            }}>
              Keep your furry friends healthy & happy
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={showNotificationSettings}
            style={{
              padding: 12,
              backgroundColor: notificationPermission 
                ? 'rgba(255,255,255,0.2)' 
                : 'rgba(255,107,107,0.3)',
              borderRadius: 15,
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.3)',
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
        contentContainerStyle={{ paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPets()}
            colors={["#4ECDC4"]}
            tintColor="#4ECDC4"
          />
        }
      >
        {/* Notification Status Banner */}
        {!notificationPermission && (
          <View style={{
            margin: 20,
            backgroundColor: '#FFF3E0',
            padding: 18,
            borderRadius: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#FF9800',
            shadowColor: '#FF9800',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="notifications_none" size={22} color="#F57C00" />
              <Text style={{ 
                color: '#E65100', 
                fontWeight: '700', 
                marginLeft: 10,
                fontSize: 16
              }}>
                Enable Notifications
              </Text>
            </View>
            <Text style={{ 
              color: '#F57C00', 
              fontSize: 14, 
              marginTop: 6,
              lineHeight: 20
            }}>
              Get feeding reminders to keep your pets on schedule! Tap the bell icon above.
            </Text>
          </View>
        )}

        {/* Horizontal Pet Cards */}
        <View style={{ marginTop: notificationPermission ? 20 : 0 }}>
          <Text style={{ 
            fontSize: 22, 
            fontWeight: '700', 
            marginBottom: 16, 
            color: '#2C3E50',
            marginLeft: 20
          }}>
            Your Pets ({pets.length}) 🏠
          </Text>

          {pets.length === 0 ? (
            <View style={{
              backgroundColor: 'white',
              margin: 20,
              padding: 40,
              borderRadius: 20,
              alignItems: 'center',
              shadowColor: '#34495E',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 6,
            }}>
              <View style={{
                backgroundColor: '#E8F5E8',
                padding: 20,
                borderRadius: 50,
                marginBottom: 16,
              }}>
                <MaterialIcons name="pets" size={48} color="#4CAF50" />
              </View>
              <Text style={{ 
                fontSize: 20, 
                fontWeight: '700', 
                color: '#34495E', 
                marginBottom: 8 
              }}>
                No pets added yet
              </Text>
              <Text style={{ 
                fontSize: 15, 
                color: '#7F8C8D', 
                textAlign: 'center',
                lineHeight: 22 
              }}>
                Start by adding your furry friends to track their feeding schedules
              </Text>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {pets.map((pet, index) => {
                const colors = petCardColors[index % petCardColors.length];
                return (
                  <TouchableOpacity
                    key={pet.id}
                    onPress={() => handlePetSelect(pet)}
                    style={{
                      backgroundColor: colors.bg,
                      width: 160,
                      padding: 16,
                      borderRadius: 20,
                      marginRight: 16,
                      shadowColor: colors.accent,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 6,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Pet Icon Background */}
                    <View style={{
                      position: 'absolute',
                      top: -10,
                      right: -10,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: 50,
                      padding: 20,
                    }}>
                      <MaterialIcons name="pets" size={40} color="rgba(255,255,255,0.3)" />
                    </View>

                    {/* Pet Info */}
                    <View style={{ flex: 1, justifyContent: 'space-between', minHeight: 120 }}>
                      <View>
                        <Text style={{ 
                          fontSize: 18, 
                          fontWeight: '800',
                          color: 'white',
                          marginBottom: 4,
                          textShadowColor: 'rgba(0,0,0,0.3)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 2,
                        }}>
                          {pet.name}
                        </Text>
                        
                        <Text style={{ 
                          color: 'rgba(255,255,255,0.9)', 
                          fontSize: 13,
                          fontWeight: '600',
                          marginBottom: 2
                        }}>
                          {pet.breed}
                        </Text>
                        
                        <Text style={{ 
                          color: 'rgba(255,255,255,0.8)', 
                          fontSize: 12,
                          fontWeight: '500'
                        }}>
                          {pet.age} years • {pet.weight}kg
                        </Text>
                      </View>

                      {/* Bottom Info */}
                      <View style={{ marginTop: 12 }}>
                        <View style={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                          alignSelf: 'flex-start',
                          marginBottom: 6,
                        }}>
                          <Text style={{ 
                            color: 'white', 
                            fontSize: 11, 
                            fontWeight: '700'
                          }}>
                            🍽️ {feedingCounts[pet.id!] || 0} schedules
                          </Text>
                        </View>
                        
                        {notificationPermission && feedingCounts[pet.id!] > 0 && (
                          <View style={{
                            backgroundColor: 'rgba(76,175,80,0.9)',
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 10,
                            alignSelf: 'flex-start',
                          }}>
                            <Text style={{ 
                              color: 'white', 
                              fontSize: 10, 
                              fontWeight: '600'
                            }}>
                              🔔 Active
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Quick Stats Dashboard */}
        {pets.length > 0 && (
          <View style={{ margin: 20, marginTop: 30 }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: '700', 
              marginBottom: 16, 
              color: '#2C3E50'
            }}>
              Dashboard Overview 📊
            </Text>
            
            <View style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 20,
              shadowColor: '#34495E',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 6,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {/* Total Pets */}
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{
                    backgroundColor: '#E8F5E8',
                    padding: 12,
                    borderRadius: 50,
                    marginBottom: 8,
                  }}>
                    <MaterialIcons name="pets" size={20} color="#4CAF50" />
                  </View>
                  <Text style={{ 
                    fontSize: 24, 
                    fontWeight: 'bold', 
                    color: '#4CAF50',
                    marginBottom: 2
                  }}>
                    {pets.length}
                  </Text>
                  <Text style={{ 
                    color: '#7F8C8D', 
                    fontSize: 12, 
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    Total Pets
                  </Text>
                </View>
                
                {/* Total Schedules */}
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{
                    backgroundColor: '#E3F2FD',
                    padding: 12,
                    borderRadius: 50,
                    marginBottom: 8,
                  }}>
                    <MaterialIcons name="restaurant" size={20} color="#2196F3" />
                  </View>
                  <Text style={{ 
                    fontSize: 24, 
                    fontWeight: 'bold', 
                    color: '#2196F3',
                    marginBottom: 2
                  }}>
                    {Object.values(feedingCounts).reduce((sum, count) => sum + count, 0)}
                  </Text>
                  <Text style={{ 
                    color: '#7F8C8D', 
                    fontSize: 12, 
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    Schedules
                  </Text>
                </View>
                
                {/* Active Pets */}
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{
                    backgroundColor: '#FFF3E0',
                    padding: 12,
                    borderRadius: 50,
                    marginBottom: 8,
                  }}>
                    <MaterialIcons name="schedule" size={20} color="#FF9800" />
                  </View>
                  <Text style={{ 
                    fontSize: 24, 
                    fontWeight: 'bold', 
                    color: '#FF9800',
                    marginBottom: 2
                  }}>
                    {Object.values(feedingCounts).filter(count => count > 0).length}
                  </Text>
                  <Text style={{ 
                    color: '#7F8C8D', 
                    fontSize: 12, 
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    Active Pets
                  </Text>
                </View>

                {/* Notifications */}
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{
                    backgroundColor: notificationPermission ? '#E8F5E8' : '#FFEBEE',
                    padding: 12,
                    borderRadius: 50,
                    marginBottom: 8,
                  }}>
                    <MaterialIcons 
                      name={notificationPermission ? "notifications_active" : "notifications_off"} 
                      size={20} 
                      color={notificationPermission ? "#4CAF50" : "#F44336"}
                    />
                  </View>
                  <Text style={{ 
                    fontSize: 14, 
                    fontWeight: 'bold',
                    color: notificationPermission ? '#4CAF50' : '#F44336',
                    marginBottom: 2
                  }}>
                    {notificationPermission ? 'ON' : 'OFF'}
                  </Text>
                  <Text style={{ 
                    color: '#7F8C8D', 
                    fontSize: 12,
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    Alerts
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

export default DietIndex;