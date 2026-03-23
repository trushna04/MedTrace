import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import AddMedicineScreen from '../screens/AddMedicineScreen';
import GuardianScreen from '../screens/GuardianScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size, focused }) => {
            let iconName: keyof typeof Ionicons.glyphMap;
            if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'Add Medicine') iconName = focused ? 'add-circle' : 'add-circle-outline';
            else iconName = focused ? 'heart' : 'heart-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#1D9E75',
          tabBarInactiveTintColor: '#9CA3AF',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Add Medicine" component={AddMedicineScreen} />
        <Tab.Screen name="Guardian" component={GuardianScreen} />
      </Tab.Navigator>
  );
}
