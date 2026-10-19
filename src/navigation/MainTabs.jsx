import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';

import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/search/SearchScreen';
import InterestsScreen from '../screens/interests/InterestsScreen';
import AccountScreen from '../screens/account/AccountScreen';

const Tab = createBottomTabNavigator();

const icons = {
  Discover: '⌂',
  Search: '⌕',
  Interests: '♡',
  Account: '◯',
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: '#673DE6',
        tabBarInactiveTintColor: '#85858F',
        tabBarStyle: {
          height: 65,
          paddingTop: 6,
          paddingBottom: 8,
          borderTopColor: '#F0EDF7',
        },
        tabBarIcon: ({color}) => (
          <Text style={{fontSize: 26, color}}>
            {icons[route.name]}
          </Text>
        ),
      })}>
      <Tab.Screen name="Discover" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Interests" component={InterestsScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}