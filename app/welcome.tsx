import { View, Text, TouchableOpacity, Dimensions, Animated, StatusBar, StyleSheet } from "react-native";
import React, { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { STORAGE_KEYS } from "@/constants/keys";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const { width, height } = Dimensions.get('window');

const Welcome = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleContinue = async () => {
    const key = `${STORAGE_KEYS.ONBOARDED}:${user?.email}`;
    await AsyncStorage.setItem(key, "1");
    router.replace("/dashboard/profile");
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#8D5F8C" />
      <View style={styles.container}>
        {/* Background Gradient */}
        <View style={styles.backgroundGradient}>
          {/* Decorative circles */}
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>

        {/* Main Content */}
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          {/* Pet Care Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <MaterialIcons name="pets" size={80} color="#8D5F8C" />
            </View>
            
            {/* Floating hearts animation */}
            <View style={styles.floatingIcon1}>
              <MaterialIcons name="favorite" size={20} color="#FF6B9D" />
            </View>
            <View style={styles.floatingIcon2}>
              <MaterialIcons name="favorite" size={16} color="#FFB3D1" />
            </View>
            <View style={styles.floatingIcon3}>
              <MaterialIcons name="favorite" size={12} color="#FF8FAB" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            Welcome to PawPal
          </Text>
          
          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Your pet's health & happiness companion
          </Text>

          {/* Feature highlights */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <MaterialIcons name="schedule" size={24} color="#8D5F8C" />
              <Text style={styles.featureText}>Feeding Schedule</Text>
            </View>
            <View style={styles.feature}>
              <MaterialIcons name="medical-services" size={24} color="#8D5F8C" />
              <Text style={styles.featureText}>Health Tracking</Text>
            </View>
            <View style={styles.feature}>
              <MaterialIcons name="event" size={24} color="#8D5F8C" />
              <Text style={styles.featureText}>Vet Appointments</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Track vaccinations, feeding times, vet visits, and create a complete health profile for your furry friends.
          </Text>

          {/* Get Started Button */}
          <TouchableOpacity
            onPress={handleContinue}
            style={styles.getStartedButton}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <MaterialIcons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
          </TouchableOpacity>

          {/* Skip link */}
          <TouchableOpacity onPress={handleContinue} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip Introduction</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom decoration */}
        <View style={styles.bottomDecoration}>
          <MaterialIcons name="pets" size={20} color="rgba(255,255,255,0.3)" />
          <MaterialIcons name="pets" size={16} color="rgba(255,255,255,0.2)" />
          <MaterialIcons name="pets" size={12} color="rgba(255,255,255,0.1)" />
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8D5F8C',
    position: 'relative',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#8D5F8C',
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 200,
    height: 200,
    top: -100,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: 100,
    left: -75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  circle3: {
    width: 100,
    height: 100,
    top: height * 0.3,
    left: -20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  iconBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  floatingIcon1: {
    position: 'absolute',
    top: 20,
    right: 10,
    opacity: 0.8,
  },
  floatingIcon2: {
    position: 'absolute',
    top: 60,
    right: -10,
    opacity: 0.6,
  },
  floatingIcon3: {
    position: 'absolute',
    bottom: 30,
    left: 10,
    opacity: 0.7,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  feature: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 15,
    minWidth: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureText: {
    color: 'white',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 50,
    paddingHorizontal: 10,
  },
  getStartedButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: '#8D5F8C',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 5,
    color: '#8D5F8C',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

export default Welcome;