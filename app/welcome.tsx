import { View, Text, TouchableOpacity, Dimensions, StatusBar, StyleSheet } from "react-native";
import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { STORAGE_KEYS } from "@/constants/keys";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const Welcome = () => {
  const router = useRouter();
  const { user } = useAuth();

  const handleContinue = async () => {
    const key = `${STORAGE_KEYS.ONBOARDED}:${user?.email}`;
    await AsyncStorage.setItem(key, "1");
    router.replace("/dashboard/profile");
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#A8BBA3" />
      <View style={styles.container}>
        {/* Gradient Background */}
        <LinearGradient
          colors={["#A8BBA3", "#ffffff", "#ffffff"]}
          locations={[0, 0.4, 1]}
          style={styles.gradientBackground}
        />

        {/* Main Content */}
        <View style={styles.content}>
          {/* Pet Care Icons */}
          <View style={styles.iconContainer}>
            <View style={styles.petsRow}>
              <View style={styles.petIconWrapper}>
                <MaterialIcons name="pets" size={32} color="#A8BBA3" />
              </View>
              <View style={[styles.petIconWrapper, styles.centerPet]}>
                <MaterialIcons name="favorite" size={40} color="#A8BBA3" />
              </View>
              <View style={styles.petIconWrapper}>
                <MaterialIcons name="pets" size={32} color="#A8BBA3" />
              </View>
            </View>
            <View style={styles.petsRowBottom}>
              <MaterialIcons
                name="pets"
                size={24}
                color="rgba(168, 187, 163, 0.6)"
              />
              <MaterialIcons
                name="pets"
                size={20}
                color="rgba(168, 187, 163, 0.4)"
              />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>PetCare</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Simple pet management for busy pet parents
          </Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <MaterialIcons name="schedule" size={32} color="#A8BBA3" />
              <Text style={styles.featureTitle}>Schedule</Text>
              <Text style={styles.featureDesc}>Track feeding & walks</Text>
            </View>

            <View style={styles.feature}>
              <MaterialIcons name="favorite" size={32} color="#A8BBA3" />
              <Text style={styles.featureTitle}>Health</Text>
              <Text style={styles.featureDesc}>Monitor wellness</Text>
            </View>

            <View style={styles.feature}>
              <MaterialIcons name="event" size={32} color="#A8BBA3" />
              <Text style={styles.featureTitle}>Reminders</Text>
              <Text style={styles.featureDesc}>Never miss appointments</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Keep your furry friends healthy and happy with simple tracking tools
            and smart reminders.
          </Text>

          {/* Get Started Button */}
          <TouchableOpacity
            onPress={handleContinue}
            style={styles.getStartedButton}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <MaterialIcons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>

          {/* Skip link */}
          <TouchableOpacity onPress={handleContinue} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom decoration */}
        <View style={styles.bottomDecoration}>
          <MaterialIcons
            name="pets"
            size={16}
            color="rgba(168, 187, 163, 0.3)"
          />
          <MaterialIcons
            name="pets"
            size={12}
            color="rgba(168, 187, 163, 0.2)"
          />
          <MaterialIcons
            name="pets"
            size={10}
            color="rgba(168, 187, 163, 0.1)"
          />
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    position: "relative",
  },
  gradientBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  iconContainer: {
    marginBottom: 40,
    alignItems: "center",
  },
  petsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  petIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 15,
    shadowColor: "#A8BBA3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  centerPet: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#A8BBA3",
    backgroundColor: "white",
    transform: [{ translateY: -10 }],
  },
  petsRowBottom: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 40,
    fontWeight: "400",
  },
  featuresContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  feature: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 10,
  },
  featureTitle: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 4,
  },
  featureDesc: {
    color: "#666666",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  description: {
    fontSize: 15,
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  getStartedButton: {
    backgroundColor: "#A8BBA3",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    minWidth: 160,
    justifyContent: "center",
    shadowColor: "#A8BBA3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipText: {
    color: "#999999",
    fontSize: 14,
    textAlign: "center",
  },
  bottomDecoration: {
    position: "absolute",
    bottom: 40,
    right: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});

export default Welcome;
