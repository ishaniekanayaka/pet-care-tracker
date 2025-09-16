import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          title: 'Pet Profiles'
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          headerShown: true,
          title: 'Pet Profile Details',
          headerBackTitle: 'Back'
        }} 
      />
    </Stack>
  );
}