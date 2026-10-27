import AppIcon from '../components/AppIcon';
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/search/SearchScreen';
import InterestsScreen from '../screens/interests/InterestsScreen';
import AccountScreen from '../screens/account/AccountScreen';

const Tab = createBottomTabNavigator();

const icons = {
  Discover: 'home',
  Search: 'search',
  Interests: 'heart',
  Account: 'user',
};

const tabIcons = Object.fromEntries(
  Object.entries(icons).map(([route, name]) => [
    route,
    ({color, size, focused}) => <AppIcon name={name} size={size} color={color} filled={focused} />,
  ]),
);

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: '#673DE6',
        tabBarInactiveTintColor: '#85858F',
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'rgba(255, 255, 255, 0.84)',
          height: 65,
          paddingTop: 6,
          paddingBottom: 8,
          borderTopColor: '#F0EDF7',
        },
        tabBarIcon: tabIcons[route.name],
      })}>
      <Tab.Screen name="Discover" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Interests" component={InterestsScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}
