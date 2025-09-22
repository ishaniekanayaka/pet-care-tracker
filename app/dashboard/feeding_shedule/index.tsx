import React, { useState, useEffect, useRef } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl, TextInput, 
  Modal, Dimensions, Image, Animated, StatusBar, ActivityIndicator, StyleSheet,
  Linking, Platform
} from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { auth } from "../../../firebase";
import { getPetsByUser } from "../../../services/petService";
import { Pet } from "../../../types/pet";
import { getFeedingSchedulesByPet } from "../../../services/feedingService";

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width > 400 ? 170 : 160;
const CARD_HEIGHT = width > 400 ? 220 : 200;

const FeedingIndex = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [feedingCounts, setFeedingCounts] = useState<{[key: string]: number}>({});
  const [upcomingFeedings, setUpcomingFeedings] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [selectedGuidelineIndex, setSelectedGuidelineIndex] = useState<number | null>(null);
  const [scrollX] = useState(new Animated.Value(0));
  const [cardAnimations] = useState(() => 
    Array.from({ length: 10 }, () => ({
      scale: new Animated.Value(0.9),
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(50),
      rotate: new Animated.Value(0),
    }))
  );
  const router = useRouter();
  const userId = auth.currentUser?.uid || "";

  // Enhanced feeding guidelines with web sources
  const feedingGuidelines = [
    {
      category: "Feeding Schedule",
      icon: "schedule",
      color: "#896C6C",
      webUrl: "https://www.akc.org/expert-advice/nutrition/how-much-should-i-feed-my-dog/",
      tips: [
        "Puppies need 3-4 meals per day until 6 months old",
        "Adult dogs typically do well with 2 meals per day",
        "Senior dogs may need smaller, more frequent meals",
        "Cats prefer multiple small meals throughout the day",
        "Consistent feeding times help regulate digestion"
      ]
    },
    {
      category: "Portion Control",
      icon: "scale",
      color: "#5D688A",
      webUrl: "https://www.petmd.com/dog/nutrition/evr_dg_how-much-should-you-feed-your-dog",
      tips: [
        "Follow package guidelines based on weight and activity level",
        "Adjust portions based on your pet's body condition",
        "Use measuring cups for accuracy",
        "Treats should not exceed 10% of daily calories",
        "Monitor weight monthly and adjust as needed"
      ]
    },
    {
      category: "Food Types",
      icon: "restaurant",
      color: "#A8BBA3",
      webUrl: "https://www.petnutritionalliance.org/",
      tips: [
        "Choose age-appropriate food (puppy, adult, senior)",
        "High-quality protein should be first ingredient",
        "Avoid artificial preservatives and fillers",
        "Consider breed-specific formulations",
        "Gradual transitions when changing foods (7-10 days)"
      ]
    },
    {
      category: "Hydration",
      icon: "local-drink",
      color: "#2196F3",
      webUrl: "https://www.vet.cornell.edu/departments-centers-and-institutes/riney-canine-health-center/health-info/water-your-dogs-health",
      tips: [
        "Fresh water should always be available",
        "Clean water bowls daily to prevent bacteria",
        "Dogs need approximately 1 ounce per pound daily",
        "Cats prefer wide, shallow bowls (whisker stress)",
        "Monitor water intake - changes may indicate health issues"
      ]
    },
    {
      category: "Special Diets",
      icon: "healing",
      color: "#FF9800",
      webUrl: "https://www.vetmed.wisc.edu/pet-food-and-treat-recalls/",
      tips: [
        "Prescription diets for specific health conditions",
        "Grain-free options only if recommended by vet",
        "Limited ingredient diets for allergies",
        "Homemade diets require veterinary nutritionist guidance",
        "Raw diets carry bacterial risks - handle with care"
      ]
    },
    {
      category: "Feeding Safety",
      icon: "security",
      color: "#FF6B6B",
      webUrl: "https://www.aspca.org/pet-care/animal-poison-control",
      tips: [
        "Avoid toxic foods: chocolate, grapes, onions, garlic",
        "No cooked bones - they can splinter and cause injury",
        "Supervise meals to prevent choking",
        "Store food in airtight containers to maintain freshness",
        "Check expiration dates and recall notices regularly"
      ]
    }
  ];

  const animateCardsIn = (cardCount: number) => {
    cardAnimations.slice(0, cardCount).forEach((anim) => {
      anim.scale.setValue(0.5);
      anim.opacity.setValue(0);
      anim.translateY.setValue(100);
      anim.rotate.setValue(-10);
    });

    const animations = cardAnimations.slice(0, cardCount).map((anim, index) => 
      Animated.parallel([
        Animated.timing(anim.scale, {
          toValue: 1,
          duration: 600,
          delay: index * 150,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 400,
          delay: index * 150,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: 700,
          delay: index * 150,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: 0,
          duration: 800,
          delay: index * 150,
          useNativeDriver: true,
        }),
      ])
    );
    
    Animated.stagger(100, animations).start();
  };

  const animateCardPress = (index: number) => {
    const anim = cardAnimations[index];
    if (!anim) return;

    Animated.sequence([
      Animated.timing(anim.scale, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(anim.scale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

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
      const upcoming: {[key: string]: number} = {};
      
      for (const pet of data) {
        if (pet.id) {
          const schedules = await getFeedingSchedulesByPet(pet.id);
          counts[pet.id] = schedules.length;
          
          const today = new Date();
          const nextWeek = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
          const upcomingCount = schedules.filter(schedule => {
            const scheduleDate = new Date(schedule.date);
            return scheduleDate >= today && scheduleDate <= nextWeek;
          }).length;
          
          upcoming[pet.id] = upcomingCount;
        }
      }
      setFeedingCounts(counts);
      setUpcomingFeedings(upcoming);
      animateCardsIn(data.length);
    } catch (error) {
      console.error('Error loading pets:', error);
      Alert.alert("Error", "Failed to load pets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to open web guidelines
  const openWebGuideline = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Unable to open web browser");
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert("Error", "Unable to open the guideline webpage");
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) setFilteredPets(pets);
    else setFilteredPets(pets.filter(pet => 
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  }, [searchQuery, pets]);

  useEffect(() => { 
    loadPets(true); 
  }, [userId]);

  const handlePetSelect = (pet: Pet, index: number) => {
    animateCardPress(index);
    setTimeout(() => {
      if (pet.id) router.push(`/dashboard/feeding_shedule/${pet.id}`);
      else Alert.alert("Error", "Pet ID is missing");
    }, 200);
  };

  const handleGuidelineSelect = (index: number) => {
    setSelectedGuidelineIndex(index);
    setShowGuidelinesModal(true);
  };

  const totalPets = pets.length;
  const totalFeedings = Object.values(feedingCounts).reduce((sum, c) => sum + c, 0);
  const totalUpcoming = Object.values(upcomingFeedings).reduce((sum, c) => sum + c, 0);

  const renderSearchModal = () => (
    <Modal visible={showSearchModal} transparent animationType="slide" onRequestClose={() => setShowSearchModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.searchModal}>
          <View style={styles.searchModalHeader}>
            <MaterialIcons name="search" size={24} color="#A8BBA3"/>
            <TextInput 
              style={styles.searchModalInput} 
              placeholder="Search pets..." 
              value={searchQuery} 
              onChangeText={setSearchQuery} 
              autoFocus
            />
            <TouchableOpacity onPress={()=>setShowSearchModal(false)}>
              <MaterialIcons name="close" size={24} color="#000"/>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: height*0.6 }}>
            {filteredPets.map((pet, index) => (
              <TouchableOpacity 
                key={pet.id} 
                onPress={() => {
                  handlePetSelect(pet, index); 
                  setShowSearchModal(false);
                }}
                style={styles.searchResultItem}
              >
                <MaterialIcons name="pets" size={20} color="#A8BBA3"/>
                <View style={styles.searchResultText}>
                  <Text style={styles.searchResultName}>{pet.name}</Text>
                  <Text style={styles.searchResultBreed}>{pet.breed} • {pet.age} yrs</Text>
                  <Text style={styles.searchResultStats}>
                    {feedingCounts[pet.id!]||0} schedules • {upcomingFeedings[pet.id!]||0} upcoming
                  </Text>
                </View>
                <MaterialIcons name="arrow-forward-ios" size={16} color="#000"/>
              </TouchableOpacity>
            ))}
            {filteredPets.length===0 && searchQuery && (
              <View style={styles.emptySearchState}>
                <MaterialIcons name="search-off" size={48} color="#A8BBA3"/>
                <Text style={styles.emptySearchText}>No pets found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderGuidelinesModal = () => {
    const selectedGuideline = selectedGuidelineIndex !== null ? feedingGuidelines[selectedGuidelineIndex] : null;
    
    return (
      <Modal visible={showGuidelinesModal} transparent animationType="slide" onRequestClose={() => {
        setShowGuidelinesModal(false);
        setSelectedGuidelineIndex(null);
      }}>
        <View style={styles.modalOverlay}>
          <View style={styles.guidelinesModal}>
            <View style={[styles.guidelinesHeader, selectedGuideline && { backgroundColor: selectedGuideline.color + '15' }]}>
              <MaterialIcons 
                name={selectedGuideline ? selectedGuideline.icon as any : "restaurant"} 
                size={24} 
                color={selectedGuideline ? selectedGuideline.color : "#A8BBA3"}
              />
              <Text style={[styles.guidelinesTitle, selectedGuideline && { color: selectedGuideline.color }]}>
                {selectedGuideline ? selectedGuideline.category : "Feeding Guidelines"}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowGuidelinesModal(false);
                setSelectedGuidelineIndex(null);
              }}>
                <MaterialIcons name="close" size={24} color="#666"/>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.guidelinesContent} showsVerticalScrollIndicator={false}>
              {selectedGuideline ? (
                // Show specific guideline
                <View>
                  <Text style={[styles.specificGuidelineIntro, { color: selectedGuideline.color }]}>
                    Professional tips for {selectedGuideline.category.toLowerCase()}
                  </Text>
                  
                  <View style={[styles.specificGuidelineCard, { borderLeftColor: selectedGuideline.color }]}>
                    {selectedGuideline.tips.map((tip, tipIndex) => (
                      <View key={tipIndex} style={styles.tipContainer}>
                        <View style={[styles.tipBullet, { backgroundColor: selectedGuideline.color }]} />
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Web resource button */}
                  <TouchableOpacity 
                    style={[styles.webResourceButton, { backgroundColor: selectedGuideline.color }]}
                    onPress={() => openWebGuideline(selectedGuideline.webUrl)}
                  >
                    <MaterialIcons name="language" size={16} color="white" />
                    <Text style={styles.webResourceText}>View Online Resources</Text>
                    <MaterialIcons name="open-in-new" size={14} color="white" />
                  </TouchableOpacity>

                  {/* Back to all guidelines button */}
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => setSelectedGuidelineIndex(null)}
                  >
                    <MaterialIcons name="arrow-back" size={16} color="#A8BBA3" />
                    <Text style={styles.backButtonText}>View All Guidelines</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Show all guidelines overview
                <View>
                  <Text style={styles.guidelinesIntro}>
                    Ensure proper nutrition with these professional feeding guidelines and best practices.
                  </Text>
                  
                  {feedingGuidelines.map((guideline, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedGuidelineIndex(index)}
                      style={[styles.guidelineCard, { borderLeftColor: guideline.color }]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.guidelineHeader}>
                        <MaterialIcons name={guideline.icon as any} size={20} color={guideline.color} />
                        <Text style={[styles.guidelineCategory, { color: guideline.color }]}>
                          {guideline.category}
                        </Text>
                        <MaterialIcons name="arrow-forward-ios" size={16} color={guideline.color} style={{ marginLeft: 'auto' }} />
                      </View>
                      
                      <Text style={styles.guidelinePreview}>
                        {guideline.tips.length} professional tips • Tap to view details
                      </Text>

                      <View style={styles.webIndicator}>
                        <MaterialIcons name="language" size={12} color="#666" />
                        <Text style={styles.webIndicatorText}>Web resources available</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              <View style={styles.disclaimerCard}>
                <MaterialIcons name="info" size={20} color="#FF9800" />
                <Text style={styles.disclaimerText}>
                  These guidelines are for general information only. Always consult with a qualified veterinarian for your pet's specific nutritional needs.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if(loading && pets.length===0) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#A8BBA3" style={{ marginBottom: 20 }} />
      <MaterialIcons name="restaurant" size={48} color="#A8BBA3"/>
      <Text style={styles.loadingText}>Loading feeding data...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#A8BBA3" />

      {/* Header with enhanced mobile layout */}
      <LinearGradient colors={["#A8BBA3", "#fff"]} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <MaterialIcons name="restaurant" size={width > 400 ? 60 : 50} color="rgba(0,0,0,0.1)" style={{ marginBottom: 10 }} />
          <Text style={[styles.headerTitle, { fontSize: width > 400 ? 32 : 28 }]}>Feeding Center</Text>
          <Text style={styles.headerSubtitle}>Professional pet nutrition management</Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => {
              setSelectedGuidelineIndex(null);
              setShowGuidelinesModal(true);
            }} 
            style={[styles.actionButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          >
            <MaterialIcons name="menu-book" size={20} color="#000"/>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setShowSearchModal(true)} 
            style={[styles.actionButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          >
            <MaterialIcons name="search" size={20} color="#000"/>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={()=>loadPets()} 
            colors={["#A8BBA3"]} 
          />
        }
      >
        {/* Enhanced Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#A8BBA3' }]}>
            <MaterialIcons name="pets" size={18} color="white" />
            <Text style={[styles.statNumber, { color: 'white' }]}>{totalPets}</Text>
            <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.8)' }]}>Total Pets</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="schedule" size={18} color="#5D688A" />
            <Text style={[styles.statNumber, { color: '#5D688A' }]}>{totalFeedings}</Text>
            <Text style={styles.statLabel}>Feeding Schedules</Text>
          </View>
          <View style={[styles.statCard, totalUpcoming > 0 && { backgroundColor: '#E3F2FD' }]}>
            <MaterialIcons name="notifications" size={18} color={totalUpcoming > 0 ? "#2196F3" : "#A8BBA3"} />
            <Text style={[styles.statNumber, { color: totalUpcoming > 0 ? "#2196F3" : "#000" }]}>
              {totalUpcoming}
            </Text>
            <Text style={[styles.statLabel, totalUpcoming > 0 && { color: '#2196F3' }]}>Upcoming</Text>
          </View>
        </View>

        {/* Enhanced Feeding Guidelines Preview */}
        <View style={styles.guidelinesPreview}>
          <View style={styles.previewHeader}>
            <MaterialIcons name="menu-book" size={18} color="#A8BBA3" />
            <Text style={styles.previewTitle}>Quick Guidelines</Text>
            <TouchableOpacity onPress={() => {
              setSelectedGuidelineIndex(null);
              setShowGuidelinesModal(true);
            }}>
              <Text style={styles.previewAction}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.guidelinesScroll}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {feedingGuidelines.map((guideline, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleGuidelineSelect(index)}
                style={[styles.guidelinePreviewCard, { borderTopColor: guideline.color }]}
                activeOpacity={0.7}
              >
                <MaterialIcons name={guideline.icon as any} size={20} color={guideline.color} />
                <Text style={styles.previewCardTitle}>{guideline.category}</Text>
                <Text style={styles.previewCardSubtitle}>{guideline.tips.length} tips</Text>
                <View style={styles.webBadge}>
                  <MaterialIcons name="language" size={10} color="white" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Enhanced Pet Cards Section */}
        <View style={styles.cardsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Pets</Text>
            {pets.length > 0 && (
              <Text style={styles.sectionSubtitle}>Tap a pet to manage their feeding schedules</Text>
            )}
          </View>
          
          {filteredPets.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="restaurant" size={64} color="#A8BBA3" />
              <Text style={styles.emptyStateText}>No pets found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery ? "Try adjusting your search" : "Add your first pet to get started"}
              </Text>
              {!searchQuery && (
                <TouchableOpacity 
                  style={styles.addPetButton}
                  onPress={() => router.push('/dashboard/profile')}
                >
                  <MaterialIcons name="add" size={20} color="white" />
                  <Text style={styles.addPetText}>Add Pet</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.petCardsContainer}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false }
              )}
              scrollEventThrottle={16}
              decelerationRate="fast"
              snapToInterval={CARD_WIDTH + 15}
              snapToAlignment="start"
            >
              {filteredPets.map((pet, index) => {
                const inputRange = [
                  (index - 1) * (CARD_WIDTH + 15),
                  index * (CARD_WIDTH + 15),
                  (index + 1) * (CARD_WIDTH + 15),
                ];

                const scrollScale = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.9, 1, 0.9],
                  extrapolate: 'clamp',
                });

                const scrollOpacity = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.7, 1, 0.7],
                  extrapolate: 'clamp',
                });

                const scrollTranslateY = scrollX.interpolate({
                  inputRange,
                  outputRange: [10, 0, 10],
                  extrapolate: 'clamp',
                });

                const borderColor = scrollX.interpolate({
                  inputRange,
                  outputRange: ['#e9ecef', '#A8BBA3', '#e9ecef'],
                  extrapolate: 'clamp',
                });

                const cardAnim = cardAnimations[index];
                const rotateValue = cardAnim?.rotate?.interpolate({
                  inputRange: [-10, 0],
                  outputRange: ['-10deg', '0deg'],
                  extrapolate: 'clamp',
                }) || '0deg';

                return (
                  <Animated.View
                    key={pet.id}
                    style={[
                      styles.healthCard,
                      {
                        transform: [
                          { scale: Animated.multiply(scrollScale, cardAnim?.scale || 1) },
                          { translateY: Animated.add(scrollTranslateY, cardAnim?.translateY || 0) },
                          { rotate: rotateValue },
                        ],
                        opacity: Animated.multiply(scrollOpacity, cardAnim?.opacity || 1),
                      },
                    ]}
                  >
                    <Animated.View 
                      style={[
                        styles.healthCardContent,
                        { borderColor }
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => handlePetSelect(pet, index)}
                        style={styles.cardTouchable}
                        activeOpacity={0.8}
                      >
                        <View style={styles.healthImageContainer}>
                          {pet.image ? (
                            <Image source={{ uri: pet.image }} style={styles.healthPetImage} />
                          ) : (
                            <View style={styles.healthImagePlaceholder}>
                              <MaterialIcons name="pets" size={32} color="#A8BBA3" />
                            </View>
                          )}
                        </View>
                        
                        <View style={styles.healthPetInfo}>
                          <Text style={styles.healthPetName} numberOfLines={1}>{pet.name}</Text>
                          <Text style={styles.healthPetBreed} numberOfLines={1}>{pet.breed}</Text>
                          <Text style={styles.healthPetStats}>
                            {feedingCounts[pet.id!]||0} schedules
                          </Text>
                          {upcomingFeedings[pet.id!] > 0 && (
                            <View style={[styles.reminderBadge, { backgroundColor: "#2196F3" }]}>
                              <MaterialIcons name="notifications" size={12} color="#fff" />
                              <Text style={styles.reminderText}>
                                {upcomingFeedings[pet.id!]} upcoming
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  </Animated.View>
                );
              })}
              <View style={{ width: 15 }} />
            </Animated.ScrollView>
          )}
        </View>
      </ScrollView>

      {renderSearchModal()}
      {renderGuidelinesModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa" 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#f8f9fa" 
  },
  loadingText: { 
    color: "#A8BBA3", 
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500'
  },
  headerGradient: { 
    paddingVertical: Platform.OS === 'android' ? 20 : 15, 
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === 'android' ? 40 : 15,
  },
  headerContent: { 
    alignItems: "center", 
    marginTop: -10,
    flex: 1
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: "bold", 
    color: "black" 
  },
  headerSubtitle: { 
    fontSize: 12, 
    color: "#555", 
    marginBottom: 5,
    textAlign: 'center'
  },
  headerActions: {
    position: "absolute",
    top: Platform.OS === 'android' ? 50 : 45,
    right: 20,
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 12,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: 20, 
    paddingBottom: 40
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 15,
    marginBottom: 25,
  },
  statCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flex: 1,
    marginHorizontal: 4,
    minHeight: 80,
  },
  statNumber: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#000",
    marginTop: 6 
  },
  statLabel: { 
    fontSize: 12, 
    color: "#777",
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500'
  },
  
  // Enhanced Guidelines Preview Section
  guidelinesPreview: {
    marginHorizontal: 15,
    marginBottom: 25,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    marginLeft: 8,
  },
  previewAction: {
    color: '#A8BBA3',
    fontWeight: '600',
    fontSize: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  guidelinesScroll: {
    marginLeft: -5,
  },
  guidelinePreviewCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginRight: 10,
    width: width > 400 ? 110 : 100,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderTopWidth: 4,
    position: 'relative',
    minHeight: 90,
  },
  previewCardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    lineHeight: 14,
  },
  previewCardSubtitle: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  webBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#A8BBA3',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Section Headers
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#666',
    lineHeight: 20,
  },
  
  cardsSection: {
    flex: 1,
    paddingVertical: 5,
  },
  petCardsContainer: { 
    paddingHorizontal: 15,
    alignItems: 'center'
  },
  healthCard: { 
    width: CARD_WIDTH, 
    marginRight: 15,
    height: CARD_HEIGHT
  },
  healthCardContent: {
    backgroundColor: "#fff",
    borderRadius: 18,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: "hidden",
    height: '100%',
    borderWidth: 2,
  },
  cardTouchable: {
    flex: 1,
    padding: 15,
    alignItems: "center",
    justifyContent: 'center'
  },
  healthImageContainer: {
    marginBottom: 12,
  },
  healthPetImage: { 
    width: 75, 
    height: 75, 
    borderRadius: 37.5, 
    borderWidth: 3, 
    borderColor: "#A8BBA3" 
  },
  healthImagePlaceholder: { 
    width: 75, 
    height: 75, 
    borderRadius: 37.5, 
    backgroundColor: "#f5f7fa", 
    justifyContent: "center", 
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#e9ecef" 
  },
  healthPetInfo: { 
    alignItems: "center",
    flex: 1,
  },
  healthPetName: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#000",
    textAlign: "center",
    marginBottom: 4
  },
  healthPetBreed: { 
    fontSize: 13, 
    color: "#666",
    textAlign: "center",
    marginBottom: 6
  },
  healthPetStats: { 
    fontSize: 12, 
    color: "#A8BBA3",
    textAlign: "center",
    fontWeight: '600'
  },
  reminderBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
  },
  reminderText: {
    fontSize: 10,
    color: "#fff",
    marginLeft: 3,
    fontWeight: "bold"
  },
  emptyState: { 
    alignItems: "center", 
    justifyContent: "center", 
    flex: 1,
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateText: { 
    marginTop: 15, 
    fontSize: 20, 
    color: "#666",
    fontWeight: "600" 
  },
  emptyStateSubtext: {
    marginTop: 10,
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    lineHeight: 22,
  },
  addPetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A8BBA3',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addPetText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 15,
  },
  
  // Enhanced Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchModal: {
    width: "92%",
    maxHeight: "85%",
    backgroundColor: "white",
    borderRadius: 18,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  searchModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#f8f9fa",
  },
  searchModalInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: "#000",
    paddingVertical: 8,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0"
  },
  searchResultText: {
    flex: 1,
    marginLeft: 15
  },
  searchResultName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 2,
  },
  searchResultBreed: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  searchResultStats: {
    fontSize: 12,
    color: "#A8BBA3",
    fontWeight: '500'
  },
  emptySearchState: {
    padding: 50,
    alignItems: "center"
  },
  emptySearchText: {
    color: "#666",
    marginTop: 15,
    fontSize: 18,
    fontWeight: '500'
  },
  
  // Enhanced Guidelines Modal
  guidelinesModal: {
    width: "95%",
    maxHeight: "92%",
    backgroundColor: "white",
    borderRadius: 18,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  guidelinesHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#f8f9fa",
  },
  guidelinesTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginLeft: 12,
  },
  guidelinesContent: {
    flex: 1,
    padding: 20,
  },
  guidelinesIntro: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    marginBottom: 25,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  specificGuidelineIntro: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  specificGuidelineCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  guidelineCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 18,
    marginBottom: 16,
    borderLeftWidth: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  guidelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  guidelineCategory: {
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
  },
  guidelinePreview: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  webIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  webIndicatorText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  webResourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  webResourceText: {
    color: 'white',
    fontWeight: 'bold',
    marginHorizontal: 8,
    fontSize: 15,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#A8BBA3',
  },
  backButtonText: {
    color: '#A8BBA3',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 15,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingLeft: 4,
  },
  tipBullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 7,
    marginRight: 15,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
  },
  disclaimerCard: {
    backgroundColor: "#FFF8E1",
    borderRadius: 15,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 15,
    marginBottom: 25,
    borderLeftWidth: 5,
    borderLeftColor: "#FF9800",
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    color: "#F57C00",
    lineHeight: 18,
    marginLeft: 12,
    fontStyle: 'italic',
  },
});

export default FeedingIndex;