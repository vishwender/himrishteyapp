export const HEIGHT_OPTIONS = Array.from(
  { length: 37 },
  (_, i) => `${Math.floor((48 + i) / 12)} ft ${(48 + i) % 12} in`,
);
export const EMPLOYMENT_OPTIONS = [
  'Private',
  'Bussiness',
  'Defence',
  'Govt Job',
  'Not employed',
  'Self employed',
];
export const INCOME_OPTIONS = [
  ...Array.from(
    { length: 49 },
    (_, i) => `${i + 1} ${i === 0 ? 'lakh' : 'lakhs'}`,
  ),
  'More than 50 lakhs',
];
export const RELIGION_OPTIONS = ['Hindu', 'Muslim', 'Sikh', 'Christian'];
export const MOTHER_TONGUE_OPTIONS = ['Hindi', 'Himachali/Pahari', 'Punjabi'];
export const LOOKING_FOR_OPTIONS = [
  'Any',
  'Never Married',
  'Divorcee',
  'Widowed',
  'Separated',
];
export const SIBLING_OPTIONS = ['0', '1', '2', '3', '4', '5'];
export function heightLabel(value) {
  const text = String(value ?? '').trim();
  let match = /^(\d+)\.(\d+)$/.exec(text);
  if (!match) match = /^(\d+)\s*ft\s*(\d+)\s*in$/i.exec(text);
  if (match) return `${match[1]} ft ${Number(match[2])} in`;
  if (/^[4-7]$/.test(text)) return `${text} ft 0 in`;
  return text;
}
export function heightValue(label) {
  if (!HEIGHT_OPTIONS.includes(label))
    throw new Error('Select a height from 4 ft to 7 ft.');
  const match = /^(\d+) ft (\d+) in$/.exec(label);
  return `${match[1]}.${match[2]}`;
}
export function inchesLabel(inches) {
  return `${Math.floor(inches / 12)} ft ${inches % 12} in`;
}
export function partnerHeightInches(value) {
  const text = String(value ?? '').trim();
  if (!text || text === '0') return '';
  const match = /^(\d+)\s*ft\s*(\d+)\s*in$/i.exec(text);
  if (match) return String(Number(match[1]) * 12 + Number(match[2]));
  // API partner-height updates accept numeric feet.inches in the 3–8 range.
  // Whole-foot values must round-trip as feet, not website slider positions.
  if (/^[4-7](?:\.0)?$/.test(text)) return String(Number(text) * 12);
  // Existing website encodes partner height slider positions 1–28 from 4 ft 6 in.
  if (/^\d+$/.test(text) && Number(text) >= 1 && Number(text) <= 28)
    return String(53 + Number(text));
  const legacy = /^(\d+)\.(\d+)$/.exec(text);
  return legacy ? String(Number(legacy[1]) * 12 + Number(legacy[2])) : '';
}
