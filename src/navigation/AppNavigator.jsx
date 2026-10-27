import React from 'react';
import {
  ActivityIndicator,
  View,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import MemberProfileScreen from '../screens/profile/MemberProfileScreen';
import EditBasicScreen from '../screens/account/edit/EditBasicScreen';
import EditProfileScreen from '../screens/account/edit/EditProfileScreen';
import EditPersonalScreen from '../screens/account/edit/EditPersonalScreen';
import EditReligionScreen from '../screens/account/edit/EditReligionScreen';
import EditEducationCareerScreen from '../screens/account/edit/EditEducationCareerScreen';
import EditLocationScreen from '../screens/account/edit/EditLocationScreen';
import EditFamilyScreen from '../screens/account/edit/EditFamilyScreen';
import EditLifestyleScreen from '../screens/account/edit/EditLifestyleScreen';
import EditPartnerPreferencesScreen from '../screens/account/edit/EditPartnerPreferencesScreen';
import MyPhotosScreen from '../screens/account/MyPhotosScreen';
import ChangePasswordScreen from '../screens/account/settings/ChangePasswordScreen';
import ProfileVisibilityScreen from '../screens/account/settings/ProfileVisibilityScreen';
import DeleteAccountScreen from '../screens/account/settings/DeleteAccountScreen';
import MembershipScreen from '../screens/account/MembershipScreen';
import WalletScreen from '../screens/account/WalletScreen';
import WalletTransactionsScreen from '../screens/account/WalletTransactionsScreen';
import MainTabs from './MainTabs';
import MyProfileScreen from '../screens/account/MyProfileScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <ActivityIndicator size="large" color="#673DE6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="MemberProfile"
              component={MemberProfileScreen}
              options={{
                headerShown: true,
                title: 'Member Profile',
              }}
            />

            <Stack.Screen
              name="MyProfile"
              component={MyProfileScreen}
              options={{title: 'My Profile'}}
            />

            <Stack.Screen
              name="EditBasic"
              component={EditBasicScreen}
              options={{
                title: 'Edit Basic Details',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{
                title: 'Edit Profile',
                headerShown: true,
              }}
            />

            <Stack.Screen
              name="EditPersonal"
              component={EditPersonalScreen}
              options={{
                title: 'Personal Details',
                headerShown: true,
              }}
            />

            <Stack.Screen
              name="EditReligion"
              component={EditReligionScreen}
              options={{
                title: 'Religion & Community',
                headerShown: true,
              }}
            />

            <Stack.Screen
              name="EditEducationCareer"
              component={EditEducationCareerScreen}
              options={{
                title: 'Education & Career',
                headerShown: true,
              }}
            />

            <Stack.Screen
              name="EditLocation"
              component={EditLocationScreen}
              options={{
                title: 'Location Details',
                headerShown: true,
              }}
            />

            <Stack.Screen
              name="EditFamily"
              component={EditFamilyScreen}
              options={{
                title: 'Family Details',
                headerShown: true,
              }}
            />

            <Stack.Screen
              name="EditLifestyle"
              component={EditLifestyleScreen}
              options={{
                title: 'Lifestyle & About Me',
                headerShown: true,
              }}
            />

            <Stack.Screen
              name="EditPartnerPreferences"
              component={EditPartnerPreferencesScreen}
              options={{
                title: 'Partner Preferences',
                headerShown: true,
              }}
            />

            <Stack.Screen
              name="MyPhotos"
              component={MyPhotosScreen}
              options={{
                title: 'My Photos',
                headerShown: true,
              }}
            />

            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
              options={{
                title: 'Change Password',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="ProfileVisibility"
              component={ProfileVisibilityScreen}
              options={{
                title: 'Profile Visibility',
                headerShown: true,
              }}
            />

            <Stack.Screen
              name="DeleteAccount"
              component={DeleteAccountScreen}
              options={{
                title: 'Delete Account',
                headerShown: true,
              }}
            />

            <Stack.Screen
              name="Membership"
              component={MembershipScreen}
              options={{ title: 'Membership', headerShown: true }}
            />

            <Stack.Screen
              name="Wallet"
              component={WalletScreen}
              options={{ title: 'My Wallet', headerShown: true }}
            />

            <Stack.Screen
              name="WalletTransactions"
              component={WalletTransactionsScreen}
              options={{
                title: 'Wallet Transactions',
                headerShown: true,
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Create Account' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
