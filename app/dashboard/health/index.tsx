import React, { useState, useEffect } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, Alert 
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
  const router = useRouter();
  const userId = auth.currentUser?.uid || "";

  // Load pets and their health record counts
  const loadPets = async () => {
    if (!userId) return;
    
    try {
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
    }
  };

  useEffect(() => {
    loadPets();
  }, []);

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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <View style={{
        backgroundColor: '#FF6B6B',
        padding: 20,
        paddingTop: 50,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
          Health Tracker 🏥
        </Text>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 }}>
          Keep track of your pet's health records
        </Text>
      </View>

      {/* Pet List */}
      <View style={{ margin: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
          Select a Pet:
        </Text>

        {pets.length === 0 ? (
          <View style={{
            backgroundColor: 'white',
            padding: 30,
            borderRadius: 12,
            alignItems: 'center',
          }}>
            <MaterialIcons name="pets" size={48} color="#ccc" />
            <Text style={{ color: '#999', fontSize: 16, marginTop: 10 }}>
              No pets found
            </Text>
            <Text style={{ color: '#999', fontSize: 14, textAlign: 'center', marginTop: 5 }}>
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
                  <MaterialIcons name="pets" size={24} color="#FF6B6B" />
                  <Text style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 10 }}>
                    {pet.name}
                  </Text>
                </View>
                
                <Text style={{ color: '#666', fontSize: 14 }}>
                  {pet.breed} • {pet.age} years old
                </Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <MaterialIcons name="medical-services" size={16} color="#4CAF50" />
                  <Text style={{ color: '#4CAF50', fontSize: 12, marginLeft: 4 }}>
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

      {/* Quick Stats */}
      {pets.length > 0 && (
        <View style={{ margin: 20, marginTop: 0 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            Quick Overview:
          </Text>
          
          <View style={{
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 12,
            flexDirection: 'row',
            justifyContent: 'space-around',
          }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FF6B6B' }}>
                {pets.length}
              </Text>
              <Text style={{ color: '#666', fontSize: 12 }}>Total Pets</Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#4CAF50' }}>
                {Object.values(healthCounts).reduce((sum, count) => sum + count, 0)}
              </Text>
              <Text style={{ color: '#666', fontSize: 12 }}>Health Records</Text>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#2196F3' }}>
                {Object.values(healthCounts).filter(count => count > 0).length}
              </Text>
              <Text style={{ color: '#666', fontSize: 12 }}>With Records</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default HealthIndex;