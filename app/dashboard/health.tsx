import React, { useState, useEffect } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Modal 
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { auth } from "../../firebase";
import { getPetsByUser } from "../../services/petService";
import { Pet } from "../../types/pet";

interface HealthRecord {
  id: string;
  petId: string;
  type: 'vaccination' | 'checkup' | 'medication' | 'treatment';
  title: string;
  date: string;
  nextDue?: string;
  notes?: string;
}

const Health = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    type: 'vaccination' as const,
    title: '',
    date: '',
    nextDue: '',
    notes: '',
  });

  const userId = auth.currentUser?.uid || "";

  const loadPets = async () => {
    if (!userId) return;
    const data = await getPetsByUser(userId);
    setPets(data);
    if (data.length > 0 && !selectedPet) {
      setSelectedPet(data[0]);
    }
  };

  const addHealthRecord = () => {
    if (!selectedPet || !newRecord.title || !newRecord.date) {
      Alert.alert("Error", "Please fill required fields");
      return;
    }

    const record: HealthRecord = {
      id: Date.now().toString(),
      petId: selectedPet.id!,
      ...newRecord,
    };

    setHealthRecords([...healthRecords, record]);
    setNewRecord({ type: 'vaccination', title: '', date: '', nextDue: '', notes: '' });
    setShowAddModal(false);
    Alert.alert("Success", "Health record added!");
  };

  useEffect(() => {
    loadPets();
  }, []);

  const recordTypes = [
    { value: 'vaccination', label: 'Vaccination', icon: 'vaccines', color: '#4CAF50' },
    { value: 'checkup', label: 'Checkup', icon: 'medical-services', color: '#2196F3' },
    { value: 'medication', label: 'Medication', icon: 'medication', color: '#FF9800' },
    { value: 'treatment', label: 'Treatment', icon: 'healing', color: '#9C27B0' },
  ];

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

      {/* Pet Selector */}
      <View style={{ margin: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          Select Pet:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {pets.map((pet) => (
            <TouchableOpacity
              key={pet.id}
              onPress={() => setSelectedPet(pet)}
              style={{
                backgroundColor: selectedPet?.id === pet.id ? '#FF6B6B' : 'white',
                padding: 15,
                borderRadius: 12,
                marginRight: 10,
                minWidth: 100,
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: selectedPet?.id === pet.id ? 'white' : '#333',
                fontWeight: 'bold',
              }}>
                {pet.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedPet && (
        <>
          {/* Add Record Button */}
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={{
              backgroundColor: '#FF6B6B',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 20,
              padding: 15,
              borderRadius: 12,
            }}
          >
            <MaterialIcons name="add" size={24} color="white" />
            <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8 }}>
              Add Health Record
            </Text>
          </TouchableOpacity>

          {/* Health Records */}
          <View style={{ margin: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
              Health Records for {selectedPet.name}
            </Text>
            
            {healthRecords
              .filter(record => record.petId === selectedPet.id)
              .map((record) => {
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <MaterialIcons 
                        name={recordType?.icon as any} 
                        size={20} 
                        color={recordType?.color} 
                      />
                      <Text style={{ fontSize: 16, fontWeight: 'bold', marginLeft: 8 }}>
                        {record.title}
                      </Text>
                    </View>
                    <Text style={{ color: '#666', marginBottom: 4 }}>
                      Date: {record.date}
                    </Text>
                    {record.nextDue && (
                      <Text style={{ color: '#FF6B6B', marginBottom: 4 }}>
                        Next Due: {record.nextDue}
                      </Text>
                    )}
                    {record.notes && (
                      <Text style={{ color: '#666', fontStyle: 'italic' }}>
                        Notes: {record.notes}
                      </Text>
                    )}
                  </View>
                );
              })}
          </View>
        </>
      )}

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
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>
              Add Health Record
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
                    padding: 10,
                    borderRadius: 8,
                    margin: 5,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <MaterialIcons 
                    name={type.icon as any} 
                    size={16} 
                    color={newRecord.type === type.value ? 'white' : '#666'} 
                  />
                  <Text style={{
                    marginLeft: 5,
                    color: newRecord.type === type.value ? 'white' : '#666',
                    fontWeight: 'bold',
                  }}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              placeholder="Title (e.g., Rabies Vaccine)"
              value={newRecord.title}
              onChangeText={(text) => setNewRecord({...newRecord, title: text})}
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                padding: 12,
                marginBottom: 12,
                borderRadius: 8,
              }}
            />

            <TextInput
              placeholder="Date (YYYY-MM-DD)"
              value={newRecord.date}
              onChangeText={(text) => setNewRecord({...newRecord, date: text})}
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                padding: 12,
                marginBottom: 12,
                borderRadius: 8,
              }}
            />

            <TextInput
              placeholder="Next Due Date (Optional)"
              value={newRecord.nextDue}
              onChangeText={(text) => setNewRecord({...newRecord, nextDue: text})}
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                padding: 12,
                marginBottom: 12,
                borderRadius: 8,
              }}
            />

            <TextInput
              placeholder="Notes (Optional)"
              value={newRecord.notes}
              onChangeText={(text) => setNewRecord({...newRecord, notes: text})}
              multiline
              numberOfLines={3}
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                padding: 12,
                marginBottom: 15,
                borderRadius: 8,
                textAlignVertical: 'top',
              }}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={{
                  backgroundColor: '#6c757d',
                  padding: 12,
                  borderRadius: 8,
                  flex: 1,
                  marginRight: 5,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={addHealthRecord}
                style={{
                  backgroundColor: '#FF6B6B',
                  padding: 12,
                  borderRadius: 8,
                  flex: 1,
                  marginLeft: 5,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default Health;