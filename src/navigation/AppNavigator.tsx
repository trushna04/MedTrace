import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import AddMedicineScreen from '../screens/AddMedicineScreen';
import GuardianScreen from '../screens/GuardianScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;
            if (route.name === 'Home') iconName = 'home';
            else if (route.name === 'Add Medicine') iconName = 'add-circle';
            else iconName = 'heart';
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
    </NavigationContainer>
  );
}
