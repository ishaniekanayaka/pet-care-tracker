import React, { useState, useEffect } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, Alert, Image, RefreshControl 
} from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { auth } from "../../../firebase";
import { getPetsByUser } from "../../../services/petService";
import { Pet } from "../../../types/pet";

const ProfileIndex = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const userId = auth.currentUser?.uid || "";

  // Load pets
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
      console.log('Navigating to pet profile with ID:', pet.id);
      router.push(`/dashboard/profile/${pet.id}` as any);
    } else {
      console.error('Pet ID is missing:', pet);
      Alert.alert("Error", "Pet ID is missing. Please try refreshing the list.");
    }
  };

  const handleAddNewPet = () => {
    router.push('/dashboard/profile/new' as any);
  };

  // Calculate stats
  const petCount = pets.length;
  const avgAge = pets.length > 0 ? (pets.reduce((sum, pet) => sum + pet.age, 0) / pets.length).toFixed(1) : 0;
  const totalWeight = pets.reduce((sum, pet) => sum + pet.weight, 0).toFixed(1);

  if (loading && pets.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7F3' }}>
        <MaterialIcons name="pets" size={48} color="#A8BBA3" />
        <Text style={{ marginTop: 10, color: '#896C6C' }}>Loading your pets...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7F3' }}>
      {/* Sticky Header */}
      <View style={{
        backgroundColor: '#5D688A',
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
          PawPal Dashboard 🐾
        </Text>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 }}>
          Welcome back! You have {petCount} pet{petCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 120 }} // Add padding to account for sticky header
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPets()}
            colors={["#5D688A"]}
            tintColor="#5D688A"
            progressViewOffset={120} // Adjust refresh control position
          />
        }
      >
        {/* Quick Stats */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          margin: 20,
          marginTop: 10, // Reduced top margin since header is sticky
        }}>
          <View style={{
            backgroundColor: 'white',
            padding: 15,
            borderRadius: 15,
            alignItems: 'center',
            shadowColor: '#5D688A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
            minWidth: 80,
            flex: 1,
            marginHorizontal: 5,
          }}>
            <MaterialIcons name="pets" size={24} color="#5D688A" />
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 5, color: '#5D688A' }}>
              {petCount}
            </Text>
            <Text style={{ fontSize: 12, color: '#896C6C', marginTop: 2, textAlign: 'center' }}>
              Pets
            </Text>
          </View>
          
          <View style={{
            backgroundColor: 'white',
            padding: 15,
            borderRadius: 15,
            alignItems: 'center',
            shadowColor: '#5D688A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
            minWidth: 80,
            flex: 1,
            marginHorizontal: 5,
          }}>
            <MaterialIcons name="cake" size={24} color="#896C6C" />
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 5, color: '#5D688A' }}>
              {avgAge}
            </Text>
            <Text style={{ fontSize: 12, color: '#896C6C', marginTop: 2, textAlign: 'center' }}>
              Avg Age
            </Text>
          </View>
          
          <View style={{
            backgroundColor: 'white',
            padding: 15,
            borderRadius: 15,
            alignItems: 'center',
            shadowColor: '#5D688A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
            minWidth: 80,
            flex: 1,
            marginHorizontal: 5,
          }}>
            <MaterialIcons name="monitor-weight" size={24} color="#A8BBA3" />
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 5, color: '#5D688A' }}>
              {totalWeight}
            </Text>
            <Text style={{ fontSize: 12, color: '#896C6C', marginTop: 2, textAlign: 'center' }}>
              Total kg
            </Text>
          </View>
        </View>

        {/* Add Pet Button */}
        <TouchableOpacity
          onPress={handleAddNewPet}
          style={{
            backgroundColor: '#A8BBA3',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 20,
            padding: 15,
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <MaterialIcons name="add" size={24} color="white" />
          <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 16 }}>
            Add New Pet
          </Text>
        </TouchableOpacity>

        {/* Pet List */}
        <View style={{ margin: 20, marginTop: 0, paddingBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#5D688A' }}>
            Your Pets ({pets.length})
          </Text>

          {pets.length === 0 ? (
            <View style={{
              backgroundColor: 'white',
              padding: 40,
              borderRadius: 15,
              alignItems: 'center',
              shadowColor: '#5D688A',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <MaterialIcons name="pets" size={48} color="#A8BBA3" />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#5D688A', marginTop: 10 }}>
                No pets added yet
              </Text>
              <Text style={{ fontSize: 14, color: '#896C6C', marginTop: 5 }}>
                Add your first pet to get started!
              </Text>
            </View>
          ) : (
            pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                onPress={() => handlePetSelect(pet)}
                style={{
                  backgroundColor: 'white',
                  padding: 15,
                  borderRadius: 15,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  shadowColor: '#5D688A',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  {pet.image ? (
                    <Image 
                      source={{ uri: pet.image }} 
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        marginRight: 15,
                        borderWidth: 2,
                        borderColor: '#A8BBA3',
                      }}
                    />
                  ) : (
                    <View style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: '#F0F5ED',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 15,
                      borderWidth: 2,
                      borderColor: '#A8BBA3',
                    }}>
                      <MaterialIcons name="pets" size={32} color="#A8BBA3" />
                    </View>
                  )}
                  
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      marginBottom: 2,
                      color: '#5D688A',
                    }}>
                      {pet.name}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: '#896C6C',
                      marginBottom: 2,
                    }}>
                      {pet.breed}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      color: '#A8BBA3',
                    }}>
                      {pet.age} year{pet.age !== 1 ? 's' : ''} • {pet.weight}kg
                    </Text>
                  </View>
                </View>
                
                <MaterialIcons name="arrow-forward-ios" size={20} color="#A8BBA3" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileIndex;