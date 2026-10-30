import {ADULT_ACCESS_MESSAGE, isAdultBirthDate} from '../safety/adultAccess';

const HEIGHTS = Array.from({ length: 37 }, (_, index) => {
  const inches = 48 + index;
  return `${Math.floor(inches / 12)} ft ${inches % 12} in`;
});
const INCOMES = [
  ...Array.from(
    { length: 49 },
    (_, index) => `${index + 1} ${index === 0 ? 'lakh' : 'lakhs'}`,
  ),
  'More than 50 lakhs',
];

export const REGISTRATION_STEPS = [
  {
    title: 'Who are you creating this profile for?',
    fields: [
      {
        key: 'profile_created_for',
        label: 'Profile created for',
        choices: ['myself', 'son', 'daughter', 'brother', 'sister', 'friend'],
        max: 100,
      },
    ],
  },
  {
    title: 'Select gender',
    fields: [
      {
        key: 'gender',
        label: 'Gender',
        max: 50,
        choices: ['male', 'female', 'other'],
      },
    ],
  },
  {
    title: 'Add your account details',
    fields: [
      { key: 'full_name', label: 'Full name' },
      { key: 'email', label: 'Email', keyboard: 'email-address' },
      {
        key: 'mobile_number',
        label: 'Phone number',
        keyboard: 'phone-pad',
        max: 30,
      },
      { key: 'birth_date_time', label: 'Date of birth', picker: 'date' },
      { key: 'password', label: 'Password', secret: true },
    ],
  },
  {
    title: 'Birth & location details',
    fields: [
      { key: 'birth_time', label: 'Birth time', picker: 'time' },
      { key: 'height', label: 'Height', options: HEIGHTS },
      { key: 'country_living_in', label: 'Country' },
      { key: 'state_living_in', label: 'State' },
      { key: 'city_living_in', label: 'City' },
    ],
  },
  {
    title: 'Education & career',
    fields: [
      { key: 'education', label: 'Education' },
      {
        key: 'employed_in',
        label: 'Employed in',
        options: [
          'Private',
          'Bussiness',
          'Defence',
          'Govt Job',
          'Not employed',
          'Self employed',
        ],
      },
      { key: 'occupation', label: 'Occupation' },
      { key: 'annual_income', label: 'Annual income', options: INCOMES },
    ],
  },
  {
    title: 'Community details',
    fields: [
      {
        key: 'marital_status',
        label: 'Marital status',
        options: ['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce'],
      },
      {
        key: 'mother_tongue',
        label: 'Mother tongue',
        options: ['Hindi', 'Himachali/pahari', 'Punjabi'],
      },
      {
        key: 'religion',
        label: 'Religion',
        options: ['Hindu', 'Muslim', 'Sikh', 'Chirstian'],
      },
      { key: 'cast', label: 'Caste' },
      { key: 'manglik', label: 'Manglik', options: ['Yes', 'No'] },
      {
        key: 'horoscope_needed',
        label: 'Horoscope needed',
        max: 136,
        options: ['Yes', 'No'],
      },
    ],
  },
  { title: 'Add your photo', fields: [] },
];

export function validateRegistrationStep(step, values) {
  const errors = {};
  REGISTRATION_STEPS[step - 1].fields.forEach(field => {
    const value = values[field.key] || '';
    if (!value.trim()) errors[field.key] = `${field.label} is required.`;
    else if (!field.secret && value.trim().length > (field.max || 255)) {
      errors[field.key] = `${field.label} is too long.`;
    } else if (
      (field.choices || field.options) &&
      !(field.choices || field.options).includes(value)
    ) {
      errors[field.key] = `Select ${field.label.toLowerCase()}.`;
    }
  });
  if (step === 3) {
    if (
      values.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
    ) {
      errors.email = 'Enter a valid email address.';
    }
    if (values.password && values.password.length < 8)
      errors.password = 'Use at least 8 characters.';
    const date = values.birth_date_time || '';
    const parsed = new Date(`${date}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date ||
      parsed > new Date()
    ) {
      errors.birth_date_time = 'Enter a valid date of birth.';
    } else if (!isAdultBirthDate(date)) {
      errors.birth_date_time = ADULT_ACCESS_MESSAGE;
    }
    if (values.agreed_to_terms !== true)
      errors.agreed_to_terms = 'Please agree to the Terms and Conditions.';
  }
  if (
    step === 4 &&
    !/^(0[1-9]|1[0-2]):[0-5]\d (AM|PM)$/.test(values.birth_time || '')
  ) {
    errors.birth_time = 'Select a valid birth time.';
  }
  return errors;
}

// First three UI screens map to API step 1. Later UI screens map to API 2–4.
// Consent gates creation locally; the current backend has no consent field.
export function registrationPayload(values, apiStep = 1) {
  const fields =
    apiStep === 1
      ? REGISTRATION_STEPS.slice(0, 3).flatMap(step => step.fields)
      : REGISTRATION_STEPS[apiStep + 1].fields;
  return Object.fromEntries(
    fields.map(field => {
      const value = field.secret ? values[field.key] : values[field.key].trim();
      if (field.key === 'height') {
        // Legacy feet.inches string, not decimal feet: preserve 5.10 / 5.11.
        const match = /^(\d+) ft (\d+) in$/.exec(value);
        if (!match || !field.options.includes(value))
          throw new Error('Select a valid height.');
        return [field.key, `${match[1]}.${match[2]}`];
      }
      return [field.key, value];
    }),
  );
}
