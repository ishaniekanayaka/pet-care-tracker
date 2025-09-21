import React, { useState, useEffect } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl, TextInput, Modal, Dimensions, Image
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

      const counts: {[key: string]: number} = {};
      const reminders: {[key: string]: number} = {};
      
      for (const pet of data) {
        if (pet.id) {
          const records = await getHealthRecordsByPet(pet.id);
          counts[pet.id] = records.length;
          
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

  useEffect(() => {
    if (!searchQuery.trim()) setFilteredPets(pets);
    else setFilteredPets(pets.filter(pet => 
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  }, [searchQuery, pets]);

  useEffect(() => { loadPets(true); }, [userId]);

  const handlePetSelect = (pet: Pet) => {
    if (pet.id) router.push(`/dashboard/health/${pet.id}`);
    else Alert.alert("Error", "Pet ID is missing");
  };

  const totalPets = pets.length;
  const totalHealthRecords = Object.values(healthCounts).reduce((sum, c) => sum + c, 0);
  const totalUpcomingReminders = Object.values(upcomingReminders).reduce((sum, c) => sum + c, 0);

  const renderSearchModal = () => (
    <Modal visible={showSearchModal} transparent animationType="slide" onRequestClose={() => setShowSearchModal(false)}>
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center' }}>
        <View style={{ width:'90%', maxHeight:'80%', backgroundColor:'white', borderRadius:15, overflow:'hidden' }}>
          <View style={{ flexDirection:'row', alignItems:'center', padding:20, borderBottomWidth:1, borderBottomColor:'#f0f0f0' }}>
            <MaterialIcons name="search" size={24} color="#A8BBA3"/>
            <TextInput style={{ flex:1, fontSize:16, marginLeft:10, color:'#000' }} placeholder="Search pets..." value={searchQuery} onChangeText={setSearchQuery} autoFocus/>
            <TouchableOpacity onPress={()=>setShowSearchModal(false)}>
              <MaterialIcons name="close" size={24} color="#000"/>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: height*0.6 }}>
            {filteredPets.map(pet=>(

              <TouchableOpacity key={pet.id} onPress={()=>{handlePetSelect(pet); setShowSearchModal(false);}}
                style={{ flexDirection:'row', alignItems:'center', padding:15, borderBottomWidth:1, borderBottomColor:'#f0f0f0' }}>
                <MaterialIcons name="pets" size={20} color="#A8BBA3"/>
                <View style={{ flex:1, marginLeft:12 }}>
                  <Text style={{ fontSize:16, fontWeight:'bold', color:'#000' }}>{pet.name}</Text>
                  <Text style={{ fontSize:12, color:'#000' }}>{pet.breed} • {pet.age} yrs</Text>
                  <Text style={{ fontSize:11, color:'#A8BBA3' }}>{healthCounts[pet.id!]||0} records • {upcomingReminders[pet.id!]||0} due soon</Text>
                </View>
                <MaterialIcons name="arrow-forward-ios" size={16} color="#000"/>
              </TouchableOpacity>
            ))}
            {filteredPets.length===0 && searchQuery && (
              <View style={{ padding:40, alignItems:'center' }}>
                <MaterialIcons name="search-off" size={48} color="#A8BBA3"/>
                <Text style={{ color:'#000', marginTop:10 }}>No pets found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if(loading && pets.length===0) return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#fff' }}>
      <MaterialIcons name="medical-services" size={48} color="#A8BBA3"/>
      <Text style={{ marginTop:10, color:'#A8BBA3' }}>Loading health data...</Text>
    </View>
  );

  return (
    <View style={{ flex:1, backgroundColor:'#fff' }}>
      {/* Header with GIF and search icon */}
      <View style={{ backgroundColor:'#A8BBA3', paddingTop:50, paddingBottom:20, paddingHorizontal:20, borderBottomLeftRadius:20, borderBottomRightRadius:20, flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
        <View style={{ alignItems:'center' }}>
          <Image source={require('../../../assets/images/petgif.gif')} style={{ width:80, height:80 }}/>
          <Text style={{ fontSize:20, fontWeight:'bold', color:'#000' }}>Health Tracker 🏥</Text>
          <Text style={{ fontSize:14, color:'#000' }}>Track health records & reminders</Text>
        </View>
        <TouchableOpacity onPress={()=>setShowSearchModal(true)} style={{ padding:10 }}>
          <MaterialIcons name="search" size={28} color="#000"/>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingTop:20, paddingBottom:40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadPets} colors={["#A8BBA3"]} />}>
        {/* Quick Stats */}
        <View style={{ margin:20 }}>
          <Text style={{ fontSize:16, fontWeight:'bold', marginBottom:10, color:'#A8BBA3' }}>Quick Overview:</Text>
          <View style={{ backgroundColor:'#fff', padding:20, borderRadius:12, flexDirection:'row', justifyContent:'space-around', elevation:3 }}>
            <View style={{ alignItems:'center' }}>
              <Text style={{ fontSize:24, fontWeight:'bold', color:'#A8BBA3' }}>{totalPets}</Text>
              <Text style={{ fontSize:12, color:'#000' }}>Total Pets</Text>
            </View>
            <View style={{ alignItems:'center' }}>
              <Text style={{ fontSize:24, fontWeight:'bold', color:'#000' }}>{totalHealthRecords}</Text>
              <Text style={{ fontSize:12, color:'#000' }}>Health Records</Text>
            </View>
            <View style={{ alignItems:'center' }}>
              <Text style={{ fontSize:24, fontWeight:'bold', color:'#000' }}>{totalUpcomingReminders}</Text>
              <Text style={{ fontSize:12, color:'#000' }}>Due Soon</Text>
            </View>
          </View>
        </View>

        {/* Pet List */}
        <View style={{ marginHorizontal:20 }}>
          {filteredPets.map(pet=>(
            <TouchableOpacity key={pet.id} onPress={()=>handlePetSelect(pet)}
              style={{ backgroundColor:'#fff', padding:15, borderRadius:12, marginBottom:12, flexDirection:'row', justifyContent:'space-between', alignItems:'center', elevation:2 }}>
              <View>
                <Text style={{ fontSize:18, fontWeight:'bold', color:'#000' }}>{pet.name}</Text>
                <Text style={{ fontSize:14, color:'#000' }}>{pet.breed} • {pet.age} yrs</Text>
                <Text style={{ fontSize:12, color:'#A8BBA3' }}>{healthCounts[pet.id!]||0} records • {upcomingReminders[pet.id!]||0} due soon</Text>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={20} color="#000"/>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {renderSearchModal()}
    </View>
  );
};

export default HealthIndex;
