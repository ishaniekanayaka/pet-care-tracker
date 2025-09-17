import React, { useState, useEffect } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, Linking, Alert, RefreshControl 
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface VetClinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  rating: number;
  distance: string;
  emergency: boolean;
}

const Vets = () => {
  const [vets, setVets] = useState<VetClinic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'emergency' | 'clinic'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Sample data - In real app, this would come from an API
  const sampleVets: VetClinic[] = [
    {
      id: '1',
      name: 'Pet Care Veterinary Clinic',
      address: '123 Main Street, Negombo',
      phone: '+94771234567',
      rating: 4.5,
      distance: '2.3 km',
      emergency: false,
    },
    {
      id: '2',
      name: '24/7 Emergency Pet Hospital',
      address: '456 Hospital Road, Negombo',
      phone: '+94771234568',
      rating: 4.8,
      distance: '3.1 km',
      emergency: true,
    },
    {
      id: '3',
      name: 'Loving Paws Animal Clinic',
      address: '789 Galle Road, Negombo',
      phone: '+94771234569',
      rating: 4.2,
      distance: '1.8 km',
      emergency: false,
    },
    {
      id: '4',
      name: 'Quick Vet Emergency Service',
      address: '321 Beach Road, Negombo',
      phone: '+94771234570',
      rating: 4.6,
      distance: '4.2 km',
      emergency: true,
    },
  ];

  const loadVets = async () => {
    setRefreshing(true);
    // Simulate API call delay
    setTimeout(() => {
      setVets(sampleVets);
      setRefreshing(false);
    }, 1000);
  };

  const callVet = (phone: string) => {
    Alert.alert(
      "Call Vet",
      `Do you want to call ${phone}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call", onPress: () => Linking.openURL(`tel:${phone}`) },
      ]
    );
  };

  const getDirections = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const filteredVets = vets.filter(vet => {
    if (selectedCategory === 'emergency') return vet.emergency;
    if (selectedCategory === 'clinic') return !vet.emergency;
    return true;
  });

  useEffect(() => {
    loadVets();
  }, []);

  const categories = [
    { key: 'all', label: 'All', icon: 'local-hospital', color: '#896C6C' },
    { key: 'clinic', label: 'Clinics', icon: 'medical-services', color: '#A8BBA3' },
    { key: 'emergency', label: 'Emergency', icon: 'emergency', color: '#5D688A' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7F3' }}>
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
          Nearby Vets 🏥
        </Text>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 }}>
          Find veterinary services near you
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
            onRefresh={loadVets}
            colors={["#896C6C"]}
            tintColor="#896C6C"
            progressViewOffset={120}
          />
        }
      >
        {/* Emergency Button */}
        <TouchableOpacity
          onPress={() => callVet('+94771234568')}
          style={{
            backgroundColor: '#5D688A',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 20,
            marginTop: 10,
            padding: 15,
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <MaterialIcons name="emergency" size={24} color="white" />
          <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 16 }}>
            EMERGENCY CALL
          </Text>
        </TouchableOpacity>

        {/* Quick Stats */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          margin: 20,
          marginTop: 0,
        }}>
          <View style={{
            backgroundColor: 'white',
            padding: 15,
            borderRadius: 15,
            alignItems: 'center',
            shadowColor: '#896C6C',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
            minWidth: 80,
            flex: 1,
            marginHorizontal: 5,
          }}>
            <MaterialIcons name="local-hospital" size={24} color="#896C6C" />
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 5, color: '#896C6C' }}>
              {vets.length}
            </Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 2, textAlign: 'center' }}>
              Total Vets
            </Text>
          </View>
          
          <View style={{
            backgroundColor: 'white',
            padding: 15,
            borderRadius: 15,
            alignItems: 'center',
            shadowColor: '#896C6C',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
            minWidth: 80,
            flex: 1,
            marginHorizontal: 5,
          }}>
            <MaterialIcons name="emergency" size={24} color="#5D688A" />
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 5, color: '#896C6C' }}>
              {vets.filter(vet => vet.emergency).length}
            </Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 2, textAlign: 'center' }}>
              Emergency
            </Text>
          </View>
          
          <View style={{
            backgroundColor: 'white',
            padding: 15,
            borderRadius: 15,
            alignItems: 'center',
            shadowColor: '#896C6C',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
            minWidth: 80,
            flex: 1,
            marginHorizontal: 5,
          }}>
            <MaterialIcons name="medical-services" size={24} color="#A8BBA3" />
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 5, color: '#896C6C' }}>
              {vets.filter(vet => !vet.emergency).length}
            </Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 2, textAlign: 'center' }}>
              Clinics
            </Text>
          </View>
        </View>

        {/* Category Filter */}
        <View style={{ margin: 20, marginTop: 0 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#896C6C' }}>
            Categories:
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                onPress={() => setSelectedCategory(category.key as any)}
                style={{
                  backgroundColor: selectedCategory === category.key ? category.color : 'white',
                  padding: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  flex: 1,
                  marginHorizontal: 5,
                  shadowColor: '#896C6C',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <MaterialIcons 
                  name={category.icon as any} 
                  size={20} 
                  color={selectedCategory === category.key ? 'white' : category.color} 
                />
                <Text style={{
                  color: selectedCategory === category.key ? 'white' : '#333',
                  fontWeight: 'bold',
                  marginTop: 5,
                  fontSize: 12,
                }}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Vets List */}
        <View style={{ margin: 20, marginTop: 0, paddingBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#896C6C' }}>
            Available Services ({filteredVets.length})
          </Text>
          
          {filteredVets.map((vet) => (
            <View key={vet.id} style={{
              backgroundColor: 'white',
              padding: 15,
              borderRadius: 15,
              marginBottom: 12,
              shadowColor: '#896C6C',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', marginRight: 8, color: '#896C6C' }}>
                      {vet.name}
                    </Text>
                    {vet.emergency && (
                      <View style={{
                        backgroundColor: '#5D688A',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}>
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                          24/7
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                    <MaterialIcons name="location-on" size={16} color="#A8BBA3" />
                    <Text style={{ color: '#666', marginLeft: 4, flex: 1 }}>
                      {vet.address}
                    </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                    <MaterialIcons name="star" size={16} color="#FFD700" />
                    <Text style={{ color: '#666', marginLeft: 4 }}>
                      {vet.rating} ⭐ • {vet.distance} away
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => callVet(vet.phone)}
                  style={{
                    backgroundColor: '#A8BBA3',
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 10,
                    borderRadius: 8,
                    flex: 1,
                    marginRight: 5,
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="phone" size={16} color="white" />
                  <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 5 }}>
                    Call
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => getDirections(vet.address)}
                  style={{
                    backgroundColor: '#5D688A',
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 10,
                    borderRadius: 8,
                    flex: 1,
                    marginLeft: 5,
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="directions" size={16} color="white" />
                  <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 5 }}>
                    Directions
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default Vets;