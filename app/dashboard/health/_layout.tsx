import { Stack } from 'expo-router';

export default function HealthLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          title: 'Health Records'
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          headerShown: true,
          title: 'Pet Health Details',
          headerBackTitle: 'Back'
        }} 
      />
    </Stack>
  );
}