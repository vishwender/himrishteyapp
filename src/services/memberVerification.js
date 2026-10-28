export function isVerifiedMember(member) {
  if (String(member?.member_type || '').trim().toLowerCase() === 'verified') {
    return true;
  }

  return [member?.is_verified, member?.verified, member?.profile_verified].some(
    value => value === true || value === 1 ||
      ['yes', '1', 'true'].includes(String(value).trim().toLowerCase()),
  );
}
