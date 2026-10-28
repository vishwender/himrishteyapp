import AppIcon from '../components/AppIcon';
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/search/SearchScreen';
import ActivitiesNavigator from './ActivitiesNavigator';
import AccountScreen from '../screens/account/AccountScreen';

const Tab = createBottomTabNavigator();

const icons = {
  Discover: 'home',
  Search: 'search',
  Activities: 'activities',
  Account: 'user',
};

const tabIcons = Object.fromEntries(
  Object.entries(icons).map(([route, name]) => [
    route,
    ({color, size}) => <AppIcon name={name} size={size} color={color} />,
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
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          height: 65,
          paddingTop: 6,
          paddingBottom: 8,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIcon: tabIcons[route.name],
      })}>
      <Tab.Screen name="Discover" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Activities" component={ActivitiesNavigator} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}
