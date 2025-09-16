import React, { useState, useEffect } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Image 
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { auth } from "../../../firebase";
// Import getPetById from healthService instead
// import { getPetById } from "../../../services/petService";
import { Pet } from "../../../types/pet";
import { HealthRecord } from "../../../types/health";
import { 
  addHealthRecord, 
  getHealthRecordsByPet, 
  deleteHealthRecord,
  getPetById
} from "../../../services/healthService";

const PetHealthDetail = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [pet, setPet] = useState<Pet | null>(null);
  const [healthRecords, setHealthRecords] = useState<(HealthRecord & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    type: 'vaccination' as const,
    title: '',
    date: '',
    nextDue: '',
    notes: '',
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

  // Load health records for this pet
  const loadHealthRecords = async () => {
    if (!id || typeof id !== 'string') return;
    
    try {
      console.log('Loading health records for pet:', id);
      const records = await getHealthRecordsByPet(id);
      console.log('Health records loaded:', records);
      setHealthRecords(records);
    } catch (error) {
      console.error('Error loading health records:', error);
      Alert.alert("Error", "Failed to load health records");
    }
  };

  const handleAddRecord = async () => {
    if (!pet || !newRecord.title || !newRecord.date) {
      Alert.alert("Error", "Please fill required fields");
      return;
    }

    try {
      const record: HealthRecord = {
        petId: pet.id!,
        ...newRecord,
      };

      const result = await addHealthRecord(record);
      if (result.success) {
        setShowAddModal(false);
        setNewRecord({ type: 'vaccination', title: '', date: '', nextDue: '', notes: '' });
        loadHealthRecords();
        Alert.alert("Success", "Health record added!");
      } else {
        Alert.alert("Error", "Failed to save health record");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save health record");
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    Alert.alert(
      "Delete Record",
      "Are you sure you want to delete this health record?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const result = await deleteHealthRecord(recordId);
              if (result.success) {
                loadHealthRecords();
                Alert.alert("Success", "Health record deleted");
              } else {
                Alert.alert("Error", "Failed to delete record");
              }
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Failed to delete record");
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    console.log('Pet ID from params:', id);
    if (id) {
      setLoading(true);
      loadPet();
      loadHealthRecords();
    }
  }, [id]);

  const recordTypes = [
    { value: 'vaccination', label: 'Vaccination', icon: 'vaccines', color: '#896C6C' },
    { value: 'checkup', label: 'Checkup', icon: 'medical-services', color: '#5D688A' },
    { value: 'medication', label: 'Medication', icon: 'medication', color: '#A8BBA3' },
    { value: 'treatment', label: 'Treatment', icon: 'healing', color: '#896C6C' },
  ];

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
      {/* Pet Header */}
      <View style={{
        backgroundColor: '#FF6B6B',
        padding: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <MaterialIcons name="pets" size={32} color="white" />
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', marginLeft: 10 }}>
            {pet.name}
          </Text>
        </View>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }}>
          {pet.breed} • {pet.age} years old • {pet.breed}
        </Text>
      </View>

      {/* Add Record Button */}
      <TouchableOpacity
        onPress={() => setShowAddModal(true)}
        style={{
          backgroundColor: '#5D688A',
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
          Add Health Record
        </Text>
      </TouchableOpacity>

      {/* Health Records */}
      <View style={{ margin: 20, marginTop: 0 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
          Health Records ({healthRecords.length})
        </Text>
        
        {healthRecords.length === 0 ? (
          <View style={{
            backgroundColor: 'white',
            padding: 30,
            borderRadius: 12,
            alignItems: 'center',
          }}>
            <MaterialIcons name="medical-services" size={48} color="#ccc" />
            <Text style={{ color: '#999', fontSize: 16, marginTop: 10 }}>
              No health records yet
            </Text>
            <Text style={{ color: '#999', fontSize: 14, textAlign: 'center', marginTop: 5 }}>
              Add vaccination records, checkups, medications, and treatments
            </Text>
          </View>
        ) : (
          healthRecords.map((record) => {
            const recordType = recordTypes.find(t => t.value === record.type);
            return (
              <View key={record.id} style={{
                backgroundColor: 'white',
                padding: 15,
                borderRadius: 12,
                marginBottom: 10,
                borderLeftWidth: 4,
                borderLeftColor: recordType?.color,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <MaterialIcons 
                      name={recordType?.icon as any} 
                      size={20} 
                      color={recordType?.color} 
                    />
                    <Text style={{ fontSize: 16, fontWeight: 'bold', marginLeft: 8, flex: 1 }}>
                      {record.title}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => handleDeleteRecord(record.id)} 
                    style={{ padding: 5 }}
                  >
                    <MaterialIcons name="delete" size={20} color="#ff4444" />
                  </TouchableOpacity>
                </View>
                
                <View style={{ backgroundColor: '#f8f9fa', padding: 10, borderRadius: 8 }}>
                  <Text style={{ color: '#666', marginBottom: 4 }}>
                    📅 Date: {record.date}
                  </Text>
                  {record.nextDue && (
                    <Text style={{ color: '#5D688A', marginBottom: 4 }}>
                      🔔 Next Due: {record.nextDue}
                    </Text>
                  )}
                  {record.notes && (
                    <Text style={{ color: '#666', fontStyle: 'italic', marginTop: 8 }}>
                      💬 {record.notes}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Add Record Modal */}
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
                Add Health Record for {pet.name}
              </Text>

              {/* Record Type Selector */}
              <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Type:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 }}>
                {recordTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => setNewRecord({...newRecord, type: type.value as any})}
                    style={{
                      backgroundColor: newRecord.type === type.value ? type.color : '#f0f0f0',
                      padding: 12,
                      borderRadius: 8,
                      margin: 5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      flex: 1,
                      minWidth: '45%',
                    }}
                  >
                    <MaterialIcons 
                      name={type.icon as any} 
                      size={16} 
                      color={newRecord.type === type.value ? 'white' : '#666'} 
                    />
                    <Text style={{
                      marginLeft: 8,
                      color: newRecord.type === type.value ? 'white' : '#666',
                      fontWeight: 'bold',
                    }}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Title *</Text>
              <TextInput
                placeholder="e.g., Rabies Vaccine, Annual Checkup"
                value={newRecord.title}
                onChangeText={(text) => setNewRecord({...newRecord, title: text})}
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  padding: 12,
                  marginBottom: 15,
                  borderRadius: 8,
                }}
              />

              <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Date *</Text>
              <TextInput
                placeholder="YYYY-MM-DD"
                value={newRecord.date}
                onChangeText={(text) => setNewRecord({...newRecord, date: text})}
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  padding: 12,
                  marginBottom: 15,
                  borderRadius: 8,
                }}
              />

              <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Next Due Date (Optional)</Text>
              <TextInput
                placeholder="YYYY-MM-DD"
                value={newRecord.nextDue}
                onChangeText={(text) => setNewRecord({...newRecord, nextDue: text})}
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  padding: 12,
                  marginBottom: 15,
                  borderRadius: 8,
                }}
              />

              <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Notes (Optional)</Text>
              <TextInput
                placeholder="Additional details, dosage, vet name, etc."
                value={newRecord.notes}
                onChangeText={(text) => setNewRecord({...newRecord, notes: text})}
                multiline
                numberOfLines={4}
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  padding: 12,
                  marginBottom: 20,
                  borderRadius: 8,
                  textAlignVertical: 'top',
                }}
              />

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
                  onPress={handleAddRecord}
                  style={{
                    backgroundColor: '#5D688A',
                    padding: 15,
                    borderRadius: 8,
                    flex: 1,
                    marginLeft: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Save Record</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default PetHealthDetail;