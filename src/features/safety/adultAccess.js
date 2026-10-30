import {getSessionMember} from '../../services/sessionMember';

export const ADULT_ACCESS_MESSAGE = 'HimShaadi is for adults aged 18 and over. The person using the account and the person represented by the profile must both be at least 18.';

// Compare calendar dates, not elapsed milliseconds or timezone-parsed birthdays.
export function isAdultBirthDate(value, today = new Date()) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|[ T])/.exec(value);
  if (!match || Number.isNaN(today.getTime())) return false;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  if (year < 1900 || date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return false;
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month ||
      (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1;
  return age >= 18;
}

export function assertAdultMember(payload) {
  if (!isAdultBirthDate(getSessionMember(payload).birth_date_time)) {
    const error = new Error(`${ADULT_ACCESS_MESSAGE} If your date of birth is missing or incorrect, contact support to correct it.`);
    error.code = 'ADULT_ACCESS_REQUIRED';
    throw error;
  }
}

export function isAdultAccessError(error) {
  return error?.code === 'ADULT_ACCESS_REQUIRED' ||
    error?.response?.data?.code === 'ADULT_ACCESS_REQUIRED';
}
