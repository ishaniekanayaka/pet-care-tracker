import { Stack } from 'expo-router';

export default function DietLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          title: 'Diet Tracker'
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          headerShown: true,
          title: 'Pet Diet Details',
          headerBackTitle: 'Back'
        }} 
      />
    </Stack>
  );
}