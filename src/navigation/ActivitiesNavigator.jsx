import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ActivitiesScreen from '../screens/activities/ActivitiesScreen';
import ActivityProfilesScreen from '../screens/activities/ActivityProfilesScreen';
import InterestsScreen from '../screens/interests/InterestsScreen';
import LikesScreen from '../screens/activities/LikesScreen';
import colors from '../theme/colors';

const Stack = createNativeStackNavigator();
export default function ActivitiesNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.primary }}>
      <Stack.Screen
        name="ActivityOverview"
        component={ActivitiesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ActivityLikes"
        component={LikesScreen}
        options={{ title: 'Likes' }}
      />
      <Stack.Screen
        name="ActivityInterests"
        component={InterestsScreen}
        options={{ title: 'Interests' }}
      />
      <Stack.Screen
        name="ActivityProfiles"
        component={ActivityProfilesScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
    </Stack.Navigator>
  );
}
