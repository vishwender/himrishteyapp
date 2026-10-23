// Normalize the session shapes already consumed by the app.
export function getSessionMember(payload) {
  const data = payload?.data ?? payload;
  return data?.member ?? data?.user ?? data ?? {};
}

export function normalizeSessionMember(profile, fallback = null) {
  const member = getSessionMember(profile);
  const previous = getSessionMember(fallback);
  const sameMember =
    member.id != null &&
    previous.id != null &&
    String(member.id) === String(previous.id);

  // Never replace an explicit server value or copy status across accounts.
  if (member.active === undefined && sameMember && previous.active !== undefined) {
    return {...member, active: previous.active};
  }

  return member;
}

export function isSessionMemberActive(payload) {
  return String(getSessionMember(payload).active ?? '').trim().toLowerCase() === 'yes';
}
