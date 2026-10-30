import api from './client';

export const INFORMATION_PAGES = {
  about: {title: 'About Application', path: '/about-us', icon: 'heart'},
  privacy: {title: 'Privacy Policy', path: '/privacy-policy', icon: 'lock'},
  terms: {title: 'Terms of Use', path: '/terms-and-conditions', icon: 'activities'},
  refund: {title: 'Refund & Cancellation', path: '/refund-cancellation', icon: 'credit'},
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
  const {data} = await api.get(page.path, {signal});
  if (data?.success !== true || !data.data ||
      (data.data.content !== null && typeof data.data.content !== 'string')) {
    throw new Error('Unable to load this page. Please try again.');
  }
  return {content: contentToText(data.data.content || '')};
}
