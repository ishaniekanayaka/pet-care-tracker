import React, { useState, useEffect } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, Linking, Alert, RefreshControl, 
  TextInput, Modal, TouchableWithoutFeedback, StatusBar, StyleSheet
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { auth } from "@/firebase";
import { getVetsByDistrict, getAllVets, addVet } from "../../services/vetService";
import { useRouter } from "expo-router";

interface VetClinic {
  id?: string;
  name: string;
  address: string;
  phone?: string;
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
  const router = useRouter();
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

  // Check if user is admin
  const checkAdminStatus = () => {
    const user = auth.currentUser;
    const adminEmails = ['admin@pawpal.com', 'vet@admin.com'];
    setIsAdmin(user ? adminEmails.includes(user.email || '') : false);
  };

  const loadVets = async () => {
    setRefreshing(true);
    try {
      let vetsData: VetClinic[] = [];
      
      if (selectedDistrict) {
        const vetsRaw = await getVetsByDistrict(selectedDistrict);
        vetsData = vetsRaw.map(vet => ({
          ...vet,
          phone: vet.name || vet.contact || '',
        }));
      } else {
        vetsData = await getAllVets();
      }
      
      if (vetsData.length === 0) {
        vetsData = getSampleVets();
      }
      
      setVets(vetsData);
      setFilteredVets(vetsData);
    } catch (error) {
      console.error('Error loading vets:', error);
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
      loadVets();
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
    { key: 'all', label: 'All', icon: 'local-hospital', color: '#A8BBA3' },
    { key: 'clinic', label: 'Clinics', icon: 'medical-services', color: '#896C6C' },
    { key: 'emergency', label: 'Emergency', icon: 'emergency', color: '#5D688A' },
  ];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#A8BBA3" />
      <View style={styles.container}>
        {/* Header Gradient */}
        <LinearGradient
          colors={["#A8BBA3", "rgba(168, 187, 163, 0.1)"]}
          locations={[0, 1]}
          style={styles.headerGradient}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nearby Vets 🏥</Text>
          <View style={styles.headerRight}>
            {isAdmin && (
              <TouchableOpacity
                onPress={() => setShowAddVetModal(true)}
                style={styles.adminButton}
              >
                <MaterialIcons name="add" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadVets}
              colors={["#A8BBA3"]}
              tintColor="#A8BBA3"
              progressViewOffset={120}
            />
          }
        >
          {/* Search Section */}
          <View style={styles.searchSection}>
            {/* Search Bar */}
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={24} color="#A8BBA3" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search vets by name, address, or district"
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            {/* District Filter */}
            <TouchableOpacity
              onPress={() => setShowDistrictModal(true)}
              style={styles.districtFilter}
            >
              <View style={styles.districtFilterLeft}>
                <MaterialIcons name="location-city" size={24} color="#A8BBA3" />
                <Text style={[styles.districtText, selectedDistrict && styles.districtSelected]}>
                  {selectedDistrict || 'Select District (All Sri Lanka)'}
                </Text>
              </View>
              <MaterialIcons name="arrow-drop-down" size={24} color="#A8BBA3" />
            </TouchableOpacity>
          </View>

          {/* Emergency Button */}
          <TouchableOpacity
            onPress={() => callVet('+94771234568')}
            style={styles.emergencyButton}
          >
            <MaterialIcons name="emergency" size={24} color="white" />
            <Text style={styles.emergencyButtonText}>
              EMERGENCY CALL
            </Text>
          </TouchableOpacity>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <MaterialIcons name="local-hospital" size={24} color="#A8BBA3" />
              <Text style={styles.statNumber}>{filteredVets.length}</Text>
              <Text style={styles.statLabel}>Found Vets</Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialIcons name="emergency" size={24} color="#5D688A" />
              <Text style={styles.statNumber}>
                {filteredVets.filter(vet => vet.emergency).length}
              </Text>
              <Text style={styles.statLabel}>Emergency</Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialIcons name="location-city" size={24} color="#896C6C" />
              <Text style={styles.statNumber}>{selectedDistrict || 'All'}</Text>
              <Text style={styles.statLabel}>District</Text>
            </View>
          </View>

          {/* Category Filter */}
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>
              Categories:
            </Text>
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.key}
                  onPress={() => handleCategoryFilter(category.key as any)}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.key && { backgroundColor: category.color }
                  ]}
                >
                  <MaterialIcons 
                    name={category.icon as any} 
                    size={20} 
                    color={selectedCategory === category.key ? 'white' : category.color} 
                  />
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category.key && styles.categoryTextSelected
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Vets List */}
          <View style={styles.vetsSection}>
            <Text style={styles.sectionTitle}>
              Available Services ({filteredVets.length})
            </Text>
            
            {filteredVets.length === 0 ? (
              <View style={styles.noResultsContainer}>
                <MaterialIcons name="search-off" size={48} color="#A8BBA3" />
                <Text style={styles.noResultsTitle}>No vets found</Text>
                <Text style={styles.noResultsSubtitle}>
                  Try adjusting your search or select a different district
                </Text>
              </View>
            ) : (
              filteredVets.map((vet) => (
                <View key={vet.id} style={styles.vetCard}>
                  <View style={styles.vetCardHeader}>
                    <View style={styles.vetInfo}>
                      <View style={styles.vetNameContainer}>
                        <Text style={styles.vetName}>{vet.name}</Text>
                        {vet.emergency && (
                          <View style={styles.emergencyBadge}>
                            <Text style={styles.emergencyBadgeText}>24/7</Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.vetDetail}>
                        <MaterialIcons name="location-on" size={16} color="#A8BBA3" />
                        <Text style={styles.vetDetailText}>{vet.address}</Text>
                      </View>

                      <View style={styles.vetDetail}>
                        <MaterialIcons name="location-city" size={16} color="#896C6C" />
                        <Text style={styles.vetDetailText}>{vet.district}</Text>
                      </View>
                      
                      {vet.rating && (
                        <View style={styles.vetDetail}>
                          <MaterialIcons name="star" size={16} color="#FFD700" />
                          <Text style={styles.vetDetailText}>
                            {vet.rating} ⭐ {vet.distance && `• ${vet.distance} away`}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.vetActions}>
                    <TouchableOpacity
                      onPress={() => callVet(vet.contact)}
                      style={[styles.actionButton, styles.callButton]}
                    >
                      <MaterialIcons name="phone" size={16} color="white" />
                      <Text style={styles.actionButtonText}>Call</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => getDirections(vet.address)}
                      style={[styles.actionButton, styles.directionsButton]}
                    >
                      <MaterialIcons name="directions" size={16} color="white" />
                      <Text style={styles.actionButtonText}>Directions</Text>
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
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  Select District
                </Text>
                
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDistrict('');
                    setShowDistrictModal(false);
                  }}
                  style={[
                    styles.districtOption,
                    !selectedDistrict && styles.selectedDistrictOption
                  ]}
                >
                  <Text style={[
                    styles.districtOptionText,
                    !selectedDistrict && styles.selectedDistrictOptionText
                  ]}>
                    All Districts
                  </Text>
                </TouchableOpacity>

                <ScrollView style={styles.districtsList}>
                  {SRI_LANKAN_DISTRICTS.map((district) => (
                    <TouchableOpacity
                      key={district}
                      onPress={() => handleDistrictSelect(district)}
                      style={[
                        styles.districtOption,
                        selectedDistrict === district && styles.selectedDistrictOption
                      ]}
                    >
                      <Text style={[
                        styles.districtOptionText,
                        selectedDistrict === district && styles.selectedDistrictOptionText
                      ]}>
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
            <View style={styles.modalOverlay}>
              <View style={styles.addVetModal}>
                <Text style={styles.modalTitle}>
                  Add New Vet Clinic
                </Text>

                <ScrollView>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Clinic Name"
                    value={newVet.name}
                    onChangeText={(text) => setNewVet({...newVet, name: text})}
                  />

                  <TextInput
                    style={styles.modalInput}
                    placeholder="Address"
                    value={newVet.address}
                    onChangeText={(text) => setNewVet({...newVet, address: text})}
                    multiline
                  />

                  <TextInput
                    style={styles.modalInput}
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
                    style={styles.districtSelectButton}
                  >
                    <Text style={{ color: newVet.district ? '#896C6C' : '#999' }}>
                      {newVet.district || 'Select District'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      onPress={() => setShowAddVetModal(false)}
                      style={[styles.modalButton, styles.cancelButton]}
                    >
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleAddVet}
                      style={[styles.modalButton, styles.confirmButton]}
                    >
                      <Text style={styles.modalButtonText}>Add Vet</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  headerRight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  adminButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 120,
  },
  searchSection: {
    margin: 20,
    marginTop: -100,
    
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    shadowColor: '#A8BBA3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  districtFilter: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#A8BBA3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  districtFilterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  districtText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#999',
  },
  districtSelected: {
    color: '#A8BBA3',
  },
  emergencyButton: {
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
  },
  emergencyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 20,
    marginTop: 0,
  },
  statItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#A8BBA3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 80,
    flex: 1,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#896C6C',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  categorySection: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#896C6C',
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  categoryButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#A8BBA3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    color: '#333',
    fontWeight: 'bold',
    marginTop: 5,
    fontSize: 12,
  },
  categoryTextSelected: {
    color: 'white',
  },
  vetsSection: {
    margin: 20,
    marginTop: 0,
    paddingBottom: 20,
  },
  noResultsContainer: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#A8BBA3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#896C6C',
    marginTop: 10,
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  vetCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#A8BBA3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vetInfo: {
    flex: 1,
  },
  vetNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  vetName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    color: '#896C6C',
  },
  emergencyBadge: {
    backgroundColor: '#5D688A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emergencyBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  vetDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  vetDetailText: {
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  vetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  callButton: {
    backgroundColor: '#A8BBA3',
    marginRight: 5,
  },
  directionsButton: {
    backgroundColor: '#5D688A',
    marginLeft: 5,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#896C6C',
    textAlign: 'center',
  },
  districtOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedDistrictOption: {
    backgroundColor: '#F0F5ED',
  },
  districtOptionText: {
    fontSize: 16,
    color: '#896C6C',
  },
  selectedDistrictOptionText: {
    fontWeight: 'bold',
  },
  districtsList: {
    maxHeight: 300,
  },
  addVetModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  districtSelectButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    padding: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#896C6C',
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#A8BBA3',
    marginLeft: 10,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Vets;