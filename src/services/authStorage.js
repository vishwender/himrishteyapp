import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.himrishtey.auth';

export async function saveSession(token, member) {
  await Keychain.setGenericPassword(
    String(member.id),
    token,
    {service: SERVICE},
  );
}

export async function getSessionToken() {
  const credentials = await Keychain.getGenericPassword({
    service: SERVICE,
  });

  return credentials ? credentials.password : null;
}

export async function clearSession() {
  await Keychain.resetGenericPassword({
    service: SERVICE,
  });
}