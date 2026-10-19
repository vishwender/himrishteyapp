import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {useAuth} from '../../context/AuthContext';

export default function AccountScreen() {
  const {user, signOut} = useAuth();
  const member = user?.member ?? user;

  return (
    <View style={{flex: 1, padding: 24}}>
      <Text style={{fontSize: 22, fontWeight: '700'}}>
        {member?.full_name || 'My Account'}
      </Text>

      <Text style={{marginTop: 8}}>
        {member?.profile_id}
      </Text>

      <TouchableOpacity
        onPress={signOut}
        style={{marginTop: 32, padding: 16, backgroundColor: '#673DE6', borderRadius: 12}}>
        <Text style={{color: '#fff', textAlign: 'center'}}>
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}