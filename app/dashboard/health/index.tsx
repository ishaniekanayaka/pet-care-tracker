import React, { useState, useEffect } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { auth } from "../../../firebase";
import { getPetsByUser } from "../../../services/petService";
import { Pet } from "../../../types/pet";
import { getHealthRecordsByPet } from "../../../services/healthService";

const HealthIndex = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [healthCounts, setHealthCounts] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

      // Get health record counts for each pet
      const counts: {[key: string]: number} = {};
      for (const pet of data) {
        if (pet.id) {
          const records = await getHealthRecordsByPet(pet.id);
          counts[pet.id] = records.length;
        }
      }
      setHealthCounts(counts);
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
  const petsWithRecords = Object.values(healthCounts).filter(count => count > 0).length;

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
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
          Health Tracker 🏥
        </Text>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 }}>
          Keep track of your pet's health records
        </Text>
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
        {/* Pet Selection Section */}
        <View style={{ margin: 20, marginTop: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#896C6C' }}>
            Select a Pet ({pets.length})
          </Text>

          {pets.length === 0 ? (
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
                    <MaterialIcons name="pets" size={24} color="#896C6C" />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 10 }}>
                      {pet.name}
                    </Text>
                  </View>
                  
                  <Text style={{ color: '#666', fontSize: 14 }}>
                    {pet.breed} • {pet.age} years old
                  </Text>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <MaterialIcons name="medical-services" size={16} color="#A8BBA3" />
                    <Text style={{ color: '#A8BBA3', fontSize: 12, marginLeft: 4 }}>
                      {healthCounts[pet.id!] || 0} health records
                    </Text>
                  </View>
                </View>

                <View style={{ alignItems: 'center' }}>
                  <MaterialIcons name="arrow-forward-ios" size={20} color="#ccc" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Stats at Bottom */}
        {pets.length > 0 && (
          <View style={{ margin: 20, marginTop: 0, paddingBottom: 20 }}>
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
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#5D688A' }}>
                  {petsWithRecords}
                </Text>
                <Text style={{ color: '#666', fontSize: 12 }}>With Records</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default HealthIndex;