import api from './client';
import policies from '../content/policies.json';

export const INFORMATION_PAGES = {
  about: {title: 'About Application', path: '/about-us', icon: 'heart'},
  privacy: {title: 'Privacy Policy', path: '/privacy-policy', icon: 'lock'},
  terms: {title: 'Terms of Use', path: '/terms-and-conditions', icon: 'activities'},
  refund: {title: 'Refund & Cancellation', path: '/refund-cancellation', icon: 'credit'},
  childSafety: {title: 'Child Safety Standards', icon: 'verified', url: 'https://himshaadi.in/child-safety-standars.html'},
};

// Present CMS HTML as readable native text without executing embedded markup.
export function contentToText(content) {
  const entities = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“',
    rdquo: '”', bull: '•', copy: '©', hellip: '…',
  };
  return content
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<!--[^]*?-->/g, '')
    .replace(/<a\b[^>]*href=["'](https?:\/\/[^"']+|mailto:[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<li\b[^>]*>/gi, '\n• ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|ul|ol|li|section|tr)>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
      if (entity[0] !== '#') return entities[entity.toLowerCase()] ?? match;
      const value = entity[1].toLowerCase() === 'x'
        ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return value > 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff)
        ? String.fromCodePoint(value) : '';
    })
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function getInformationPage(key, signal) {
  const page = INFORMATION_PAGES[key];
  if (!page) throw new Error('This information page is unavailable.');
  if (Object.prototype.hasOwnProperty.call(policies, key)) return {content: policies[key]};
  if (key === 'childSafety') return {content: CHILD_SAFETY_STANDARDS};
  const {data} = await api.get(page.path, {signal});
  if (data?.success !== true || !data.data ||
      (data.data.content !== null && typeof data.data.content !== 'string')) {
    throw new Error('Unable to load this page. Please try again.');
  }
  return {content: contentToText(data.data.content || '')};
}

// Bundled so these standards remain available without a connection or sign-in.
const CHILD_SAFETY_STANDARDS = `HimShaadi Child Safety Standards

Adults only
HimShaadi is a matrimonial service for adults aged 18 and over. Children must not create accounts, be represented by matrimonial profiles, or use the service. Do not misrepresent your age or create a profile for a child.

Zero tolerance for child sexual abuse and exploitation
Child sexual abuse and exploitation (CSAE) is prohibited on HimShaadi. Never create, upload, share, request, promote or link to child sexual abuse material (CSAM), including generated or manipulated material. Sexualisation of children, grooming, sexual solicitation, sextortion, trafficking and any other exploitation of children are prohibited. These rules apply to profiles, photos and all interactions through the service.

Report a concern
Open the member’s profile and tap the report flag. Choose “Child safety or exploitation” or “Suspected underage member”, describe the concern and submit the report to support. Include the profile ID and relevant facts. Do not upload, copy, download or forward suspected abuse material, or include explicit material in your report.

If a child is in immediate danger, contact local emergency services or the appropriate child protection authority. An in-app report is not an emergency service.

Enforcement
Child safety violations are grounds for removal of content and suspension or termination of accounts. Suspected child sexual abuse material must be referred to the appropriate authorities in accordance with applicable law. Do not attempt to investigate or contact a suspected offender yourself.

Protect children’s privacy
Do not share a child’s private photos, contact details, school, location or other identifying information. Report suspected underage profiles even if no abusive content is visible.`;
