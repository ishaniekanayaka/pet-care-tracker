import React, { useState, useEffect } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl, TextInput, Modal, Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { auth } from "../../../firebase";
import { getPetsByUser } from "../../../services/petService";
import { Pet } from "../../../types/pet";
import { getHealthRecordsByPet } from "../../../services/healthService";

const { width, height } = Dimensions.get('window');

const HealthIndex = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [healthCounts, setHealthCounts] = useState<{[key: string]: number}>({});
  const [upcomingReminders, setUpcomingReminders] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const router = useRouter();
  const userId = auth.currentUser?.uid || "";

  // Load pets and their health record counts
  const loadPets = async (showLoader = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      if (showLoader) setLoading(true);
      setRefreshing(true);
      
      const data = await getPetsByUser(userId);
      setPets(data);
      setFilteredPets(data);

      // Get health record counts and upcoming reminders for each pet
      const counts: {[key: string]: number} = {};
      const reminders: {[key: string]: number} = {};
      
      for (const pet of data) {
        if (pet.id) {
          const records = await getHealthRecordsByPet(pet.id);
          counts[pet.id] = records.length;
          
          // Calculate upcoming reminders (due within 30 days)
          const today = new Date();
          const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
          
          const upcomingCount = records.filter(record => {
            if (!record.nextDue) return false;
            const dueDate = new Date(record.nextDue);
            return dueDate >= today && dueDate <= thirtyDaysFromNow;
          }).length;
          
          reminders[pet.id] = upcomingCount;
        }
      }
      setHealthCounts(counts);
      setUpcomingReminders(reminders);
    } catch (error) {
      console.error('Error loading pets:', error);
      Alert.alert("Error", "Failed to load pets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter pets based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPets(pets);
    } else {
      const filtered = pets.filter(pet => 
        pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.breed.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPets(filtered);
    }
  }, [searchQuery, pets]);

  useEffect(() => {
    loadPets(true);
  }, [userId]);

  const handlePetSelect = (pet: Pet) => {
    console.log('🔍 Selected pet object:', JSON.stringify(pet, null, 2));
    console.log('🔍 Pet ID being passed:', pet.id);
    
    if (pet.id) {
      console.log('🔍 Navigating to:', `/(dashboard)/health/${pet.id}`);
      router.push(`/dashboard/health/${pet.id}`);
    } else {
      console.log('❌ Pet ID is missing!');
      Alert.alert("Error", "Pet ID is missing");
    }
  };

  // Calculate stats
  const totalPets = pets.length;
  const totalHealthRecords = Object.values(healthCounts).reduce((sum, count) => sum + count, 0);
  const totalUpcomingReminders = Object.values(upcomingReminders).reduce((sum, count) => sum + count, 0);
  const petsWithRecords = Object.values(healthCounts).filter(count => count > 0).length;

  // Render search modal
  const renderSearchModal = () => (
    <Modal
      visible={showSearchModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowSearchModal(false)}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View style={{
          width: '90%',
          maxHeight: '80%',
          backgroundColor: 'white',
          borderRadius: 15,
          overflow: 'hidden',
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#f0f0f0',
          }}>
            <MaterialIcons name="search" size={24} color="#896C6C" />
            <TextInput
              style={{
                flex: 1,
                fontSize: 16,
                marginLeft: 10,
                color: '#000',
              }}
              placeholder="Search pets by name or breed..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={{ maxHeight: height * 0.6 }}>
            {filteredPets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                onPress={() => {
                  handlePetSelect(pet);
                  setShowSearchModal(false);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 15,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f0f0f0',
                }}
              >
                <MaterialIcons name="pets" size={20} color="#896C6C" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{pet.name}</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>{pet.breed} • {pet.age} years</Text>
                  <Text style={{ fontSize: 11, color: '#A8BBA3' }}>
                    {healthCounts[pet.id!] || 0} records • {upcomingReminders[pet.id!] || 0} due soon
                  </Text>
                </View>
                <MaterialIcons name="arrow-forward-ios" size={16} color="#ccc" />
              </TouchableOpacity>
            ))}
            {filteredPets.length === 0 && searchQuery && (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <MaterialIcons name="search-off" size={48} color="#ccc" />
                <Text style={{ color: '#666', marginTop: 10 }}>No pets found</Text>
                <Text style={{ color: '#999', fontSize: 12 }}>Try a different search term</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading && pets.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <MaterialIcons name="medical-services" size={48} color="#896C6C" />
        <Text style={{ marginTop: 10, color: '#896C6C' }}>Loading health data...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Sticky Header */}
      <View style={{
        backgroundColor: '#896C6C',
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
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
              Health Tracker 🏥
            </Text>
            <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 }}>
              Track health records & reminders
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowSearchModal(true)}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: 10,
              borderRadius: 20,
            }}
          >
            <MaterialIcons name="search" size={24} color="white" />
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
            colors={["#896C6C"]}
            tintColor="#896C6C"
            progressViewOffset={120}
          />
        }
      >
        {/* Quick Stats */}
        <View style={{ margin: 20, marginTop: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#896C6C' }}>
            Quick Overview:
          </Text>
          
          <View style={{
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 12,
            flexDirection: 'row',
            justifyContent: 'space-around',
            shadowColor: '#896C6C',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            marginBottom: 20,
          }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#896C6C' }}>
                {totalPets}
              </Text>
              <Text style={{ color: '#666', fontSize: 12 }}>Total Pets</Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#A8BBA3' }}>
                {totalHealthRecords}
              </Text>
              <Text style={{ color: '#666', fontSize: 12 }}>Health Records</Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: totalUpcomingReminders > 0 ? '#ff6b6b' : '#5D688A' }}>
                {totalUpcomingReminders}
              </Text>
              <Text style={{ color: '#666', fontSize: 12 }}>Due Soon</Text>
            </View>
          </View>
        </View>

        {/* Upcoming Reminders Alert */}
        {totalUpcomingReminders > 0 && (
          <View style={{ margin: 20, marginTop: 0 }}>
            <View style={{
              backgroundColor: '#ff6b6b',
              padding: 15,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <MaterialIcons name="notification-important" size={24} color="white" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                  {totalUpcomingReminders} Reminder{totalUpcomingReminders > 1 ? 's' : ''} Due Soon!
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                  Check your pets' health records for upcoming vaccinations or treatments
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Pet Selection Section */}
        <View style={{ margin: 20, marginTop: 0 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#896C6C' }}>
            Select a Pet ({filteredPets.length})
          </Text>

          {filteredPets.length === 0 && !searchQuery ? (
            <View style={{
              backgroundColor: 'white',
              padding: 40,
              borderRadius: 15,
              alignItems: 'center',
              shadowColor: '#896C6C',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <MaterialIcons name="pets" size={48} color="#A8BBA3" />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#896C6C', marginTop: 10 }}>
                No pets found
              </Text>
              <Text style={{ fontSize: 14, color: '#666', marginTop: 5, textAlign: 'center' }}>
                Add some pets first to track their health records
              </Text>
            </View>
          ) : filteredPets.length === 0 && searchQuery ? (
            <View style={{
              backgroundColor: 'white',
              padding: 40,
              borderRadius: 15,
              alignItems: 'center',
              shadowColor: '#896C6C',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <MaterialIcons name="search-off" size={48} color="#A8BBA3" />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#896C6C', marginTop: 10 }}>
                No matches found
              </Text>
              <Text style={{ fontSize: 14, color: '#666', marginTop: 5, textAlign: 'center' }}>
                No pets match "{searchQuery}"
              </Text>
            </View>
          ) : (
            filteredPets.map((pet) => (
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
                  borderLeftWidth: upcomingReminders[pet.id!] > 0 ? 4 : 0,
                  borderLeftColor: '#ff6b6b',
                }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                    <MaterialIcons name="pets" size={24} color="#896C6C" />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 10 }}>
                      {pet.name}
                    </Text>
                    {upcomingReminders[pet.id!] > 0 && (
                      <View style={{
                        backgroundColor: '#ff6b6b',
                        borderRadius: 10,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        marginLeft: 8,
                      }}>
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                          {upcomingReminders[pet.id!]} DUE
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={{ color: '#666', fontSize: 14 }}>
                    {pet.breed} • {pet.age} years old
                  </Text>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <MaterialIcons name="medical-services" size={16} color="#A8BBA3" />
                    <Text style={{ color: '#A8BBA3', fontSize: 12, marginLeft: 4 }}>
                      {healthCounts[pet.id!] || 0} health records
                    </Text>
                    {upcomingReminders[pet.id!] > 0 && (
                      <>
                        <Text style={{ color: '#ccc', marginHorizontal: 8 }}>•</Text>
                        <MaterialIcons name="schedule" size={16} color="#ff6b6b" />
                        <Text style={{ color: '#ff6b6b', fontSize: 12, marginLeft: 4 }}>
                          {upcomingReminders[pet.id!]} due soon
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
      </ScrollView>

      {/* Search Modal */}
      {renderSearchModal()}
    </View>
  );
};

export default HealthIndex;