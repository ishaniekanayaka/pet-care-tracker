// import { Tabs } from "expo-router";
// import MaterialIcons from "@expo/vector-icons/MaterialIcons";
// import React from "react";

// const tabs = [
//   { label: "Home", name: "home", icon: "home-filled" },
//   { label: "Profile", name: "profile", icon: "person" },
//   { label: "Setting", name: "settings", icon: "settings" },
// ];

// const DashboardLayout = () => {
//   return (
//     <Tabs
//       screenOptions={{
//         tabBarActiveTintColor: "#007AFF",
//         tabBarInactiveTintColor: "#999",
//         headerShown: false,
//         tabBarStyle: {
//           backgroundColor: "#f8f8f8",
//         },
//       }}
//     >
//       {tabs.map(({ name, icon, label }) => (
//         <Tabs.Screen
//           key={name}
//           name={name}
//           options={{
//             title: label,
//             tabBarIcon: ({ color, size }) => (
//               <MaterialIcons name={icon as any} color={color} size={size} />
//             ),
//           }}
//         />
//       ))}
//     </Tabs>
//   );
// };

// export default DashboardLayout;
import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";

const tabs = [
  { label: "Home", name: "index", icon: "home" },
  { label: "Health", name: "health", icon: "medical-services" },
  { label: "Diet", name: "diet", icon: "restaurant" },
  { label: "Vets", name: "vets", icon: "local-hospital" },
  { label: "Profile", name: "profile", icon: "person" },
];

const DashboardLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#999",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#f8f8f8",
          paddingBottom: 5,
          height: 60,
        },
      }}
    >
      {tabs.map(({ name, icon, label }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: label,
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name={icon as any} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
};

export default DashboardLayout;