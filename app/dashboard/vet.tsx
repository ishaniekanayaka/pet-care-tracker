import React, { useState, useEffect } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, Linking, Alert, RefreshControl, 
  TextInput, Modal, TouchableWithoutFeedback 
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { auth } from "@/firebase";
import { getVetsByDistrict, getAllVets, addVet } from "../../services/vetService";

interface VetClinic {
  id?: string;
  name: string;
  address: string;
  phone: string;
  rating?: number;
  distance?: string;
  emergency?: boolean;
  district: string;
  contact: string;
}

// Sri Lankan districts for search
const SRI_LANKAN_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Moneragala', 'Ratnapura', 'Kegalle'
];

const Vets = () => {
  const [vets, setVets] = useState<VetClinic[]>([]);
  const [filteredVets, setFilteredVets] = useState<VetClinic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'emergency' | 'clinic'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  
  // Admin functionality
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddVetModal, setShowAddVetModal] = useState(false);
  const [newVet, setNewVet] = useState({
    name: "",
    address: "",
    contact: "",
    district: "",
    emergency: false
  });

  // Check if user is admin (you can modify this logic)
  const checkAdminStatus = () => {
    const user = auth.currentUser;
    // Example: Check if user email is admin email
    const adminEmails = ['admin@pawpal.com', 'vet@admin.com']; // Add your admin emails
    setIsAdmin(user ? adminEmails.includes(user.email || '') : false);
  };

  const loadVets = async () => {
    setRefreshing(true);
    try {
      let vetsData: VetClinic[] = [];
      
      if (selectedDistrict) {
        // Load vets from specific district
        vetsData = await getVetsByDistrict(selectedDistrict);
      } else {
        // Load all vets
        vetsData = await getAllVets();
      }
      
      // Add sample data for demonstration if no data from Firebase
      if (vetsData.length === 0) {
        vetsData = getSampleVets();
      }
      
      setVets(vetsData);
      setFilteredVets(vetsData);
    } catch (error) {
      console.error('Error loading vets:', error);
      // Fallback to sample data
      const sampleData = getSampleVets();
      setVets(sampleData);
      setFilteredVets(sampleData);
    } finally {
      setRefreshing(false);
    }
  };

  const getSampleVets = (): VetClinic[] => [
    {
      id: '1',
      name: 'Pet Care Veterinary Clinic',
      address: '123 Main Street, Negombo',
      phone: '+94771234567',
      contact: '+94771234567',
      rating: 4.5,
      distance: '2.3 km',
      emergency: false,
      district: 'Gampaha'
    },
    {
      id: '2',
      name: '24/7 Emergency Pet Hospital',
      address: '456 Hospital Road, Colombo',
      phone: '+94771234568',
      contact: '+94771234568',
      rating: 4.8,
      distance: '3.1 km',
      emergency: true,
      district: 'Colombo'
    },
    {
      id: '3',
      name: 'Loving Paws Animal Clinic',
      address: '789 Galle Road, Galle',
      phone: '+94771234569',
      contact: '+94771234569',
      rating: 4.2,
      distance: '1.8 km',
      emergency: false,
      district: 'Galle'
    },
    {
      id: '4',
      name: 'Quick Vet Emergency Service',
      address: '321 Beach Road, Kandy',
      phone: '+94771234570',
      contact: '+94771234570',
      rating: 4.6,
      distance: '4.2 km',
      emergency: true,
      district: 'Kandy'
    }
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredVets(vets);
      return;
    }

    const filtered = vets.filter(vet =>
      vet.name.toLowerCase().includes(query.toLowerCase()) ||
      vet.address.toLowerCase().includes(query.toLowerCase()) ||
      vet.district.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredVets(filtered);
  };

  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district);
    setShowDistrictModal(false);
    // Reload vets for selected district
    loadVets();
  };

  const handleCategoryFilter = (category: 'all' | 'emergency' | 'clinic') => {
    setSelectedCategory(category);
    let filtered = searchQuery ? 
      vets.filter(vet =>
        vet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vet.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vet.district.toLowerCase().includes(searchQuery.toLowerCase())
      ) : vets;

    if (category === 'emergency') {
      filtered = filtered.filter(vet => vet.emergency);
    } else if (category === 'clinic') {
      filtered = filtered.filter(vet => !vet.emergency);
    }
    
    setFilteredVets(filtered);
  };

  const handleAddVet = async () => {
    if (!newVet.name || !newVet.address || !newVet.contact || !newVet.district) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      await addVet({
        name: newVet.name,
        address: newVet.address,
        contact: newVet.contact,
        district: newVet.district
      });
      
      Alert.alert("Success", "Vet clinic added successfully!");
      setShowAddVetModal(false);
      setNewVet({ name: "", address: "", contact: "", district: "", emergency: false });
      loadVets(); // Refresh the list
    } catch (error) {
      console.error('Error adding vet:', error);
      Alert.alert("Error", "Failed to add vet clinic");
    }
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

  useEffect(() => {
    checkAdminStatus();
    loadVets();
  }, [selectedDistrict]);

  useEffect(() => {
    handleCategoryFilter(selectedCategory);
  }, [vets, searchQuery]);

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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
              Nearby Vets 🏥
            </Text>
            <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 }}>
              Find veterinary services near you
            </Text>
          </View>
          {isAdmin && (
            <TouchableOpacity
              onPress={() => setShowAddVetModal(true)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: 10,
                borderRadius: 10,
              }}
            >
              <MaterialIcons name="add" size={24} color="white" />
            </TouchableOpacity>
          )}
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
            onRefresh={loadVets}
            colors={["#896C6C"]}
            tintColor="#896C6C"
            progressViewOffset={120}
          />
        }
      >
        {/* Search Section */}
        <View style={{ margin: 20, marginTop: 10 }}>
          {/* Search Bar */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 12,
            marginBottom: 15,
            shadowColor: '#896C6C',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}>
            <MaterialIcons name="search" size={24} color="#896C6C" />
            <TextInput
              style={{ flex: 1, marginLeft: 10, fontSize: 16 }}
              placeholder="Search vets by name, address, or district"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

          {/* District Filter */}
          <TouchableOpacity
            onPress={() => setShowDistrictModal(true)}
            style={{
              flexDirection: 'row',
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 12,
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: '#896C6C',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="location-city" size={24} color="#896C6C" />
              <Text style={{ marginLeft: 10, fontSize: 16, color: selectedDistrict ? '#896C6C' : '#999' }}>
                {selectedDistrict || 'Select District (All Sri Lanka)'}
              </Text>
            </View>
            <MaterialIcons name="arrow-drop-down" size={24} color="#896C6C" />
          </TouchableOpacity>
        </View>

        {/* Emergency Button */}
        <TouchableOpacity
          onPress={() => callVet('+94771234568')}
          style={{
            backgroundColor: '#5D688A',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 20,
            marginTop: 0,
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
              {filteredVets.length}
            </Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 2, textAlign: 'center' }}>
              Found Vets
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
              {filteredVets.filter(vet => vet.emergency).length}
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
            <MaterialIcons name="location-city" size={24} color="#A8BBA3" />
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 5, color: '#896C6C' }}>
              {selectedDistrict || 'All'}
            </Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 2, textAlign: 'center' }}>
              District
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
                onPress={() => handleCategoryFilter(category.key as any)}
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
          
          {filteredVets.length === 0 ? (
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
                No vets found
              </Text>
              <Text style={{ fontSize: 14, color: '#666', marginTop: 5, textAlign: 'center' }}>
                Try adjusting your search or select a different district
              </Text>
            </View>
          ) : (
            filteredVets.map((vet) => (
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
                      <MaterialIcons name="location-city" size={16} color="#896C6C" />
                      <Text style={{ color: '#666', marginLeft: 4 }}>
                        {vet.district}
                      </Text>
                    </View>
                    
                    {vet.rating && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                        <MaterialIcons name="star" size={16} color="#FFD700" />
                        <Text style={{ color: '#666', marginLeft: 4 }}>
                          {vet.rating} ⭐ {vet.distance && `• ${vet.distance} away`}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                  <TouchableOpacity
                    onPress={() => callVet(vet.contact)}
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
            ))
          )}
        </View>
      </ScrollView>

      {/* District Selection Modal */}
      <Modal
        visible={showDistrictModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDistrictModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDistrictModal(false)}>
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              width: '80%',
              maxHeight: '60%',
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                marginBottom: 12,
                color: '#896C6C',
                textAlign: 'center',
              }}>
                Select District
              </Text>
              
              <TouchableOpacity
                onPress={() => {
                  setSelectedDistrict('');
                  setShowDistrictModal(false);
                }}
                style={{
                  padding: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F0F0F0',
                  backgroundColor: !selectedDistrict ? '#F0F5ED' : 'transparent',
                }}
              >
                <Text style={{
                  fontSize: 16,
                  color: '#896C6C',
                  fontWeight: !selectedDistrict ? 'bold' : 'normal',
                }}>
                  All Districts
                </Text>
              </TouchableOpacity>

              <ScrollView style={{ maxHeight: 300 }}>
                {SRI_LANKAN_DISTRICTS.map((district) => (
                  <TouchableOpacity
                    key={district}
                    onPress={() => handleDistrictSelect(district)}
                    style={{
                      padding: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: '#F0F0F0',
                      backgroundColor: selectedDistrict === district ? '#F0F5ED' : 'transparent',
                    }}
                  >
                    <Text style={{
                      fontSize: 16,
                      color: '#896C6C',
                      fontWeight: selectedDistrict === district ? 'bold' : 'normal',
                    }}>
                      {district}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Add Vet Modal (Admin Only) */}
      {isAdmin && (
        <Modal
          visible={showAddVetModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAddVetModal(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 20,
              width: '90%',
              maxHeight: '80%',
            }}>
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                marginBottom: 20,
                color: '#896C6C',
                textAlign: 'center',
              }}>
                Add New Vet Clinic
              </Text>

              <ScrollView>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    padding: 12,
                    marginBottom: 15,
                    borderRadius: 8,
                    backgroundColor: '#F9F9F9',
                  }}
                  placeholder="Clinic Name"
                  value={newVet.name}
                  onChangeText={(text) => setNewVet({...newVet, name: text})}
                />

                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    padding: 12,
                    marginBottom: 15,
                    borderRadius: 8,
                    backgroundColor: '#F9F9F9',
                  }}
                  placeholder="Address"
                  value={newVet.address}
                  onChangeText={(text) => setNewVet({...newVet, address: text})}
                  multiline
                />

                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    padding: 12,
                    marginBottom: 15,
                    borderRadius: 8,
                    backgroundColor: '#F9F9F9',
                  }}
                  placeholder="Contact Number"
                  value={newVet.contact}
                  onChangeText={(text) => setNewVet({...newVet, contact: text})}
                  keyboardType="phone-pad"
                />

                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      "Select District",
                      "Choose the district for this vet clinic",
                      SRI_LANKAN_DISTRICTS.map(district => ({
                        text: district,
                        onPress: () => setNewVet({...newVet, district})
                      }))
                    );
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    padding: 12,
                    marginBottom: 15,
                    borderRadius: 8,
                    backgroundColor: '#F9F9F9',
                  }}
                >
                  <Text style={{ color: newVet.district ? '#896C6C' : '#999' }}>
                    {newVet.district || 'Select District'}
                  </Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                  <TouchableOpacity
                    onPress={() => setShowAddVetModal(false)}
                    style={{
                      backgroundColor: '#896C6C',
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
                    onPress={handleAddVet}
                    style={{
                      backgroundColor: '#A8BBA3',
                      padding: 15,
                      borderRadius: 8,
                      flex: 1,
                      marginLeft: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Add Vet</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default Vets;