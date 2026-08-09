export const PLATFORMS = [
  {
    key: 'twitter',
    name: 'Twitter / X',
    color: '#000000',
    buildUrl: ({ url, title }) => {
      const p = new URLSearchParams({
        text: title,
        url,
        hashtags: 'NexaSphere,GLBajaj,TechCommunity',
      });
      return `https://twitter.com/intent/tweet?${p}`;
    },
  },
  {
    key: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    buildUrl: ({ url }) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    key: 'whatsapp',
    name: 'WhatsApp',
    color: '#25D366',
    buildUrl: ({ url, title }) => `https://wa.me/?text=${encodeURIComponent(title + '\n' + url)}`,
  },
  {
    key: 'telegram',
    name: 'Telegram',
    color: '#2AABEE',
    buildUrl: ({ url, title }) => {
      const p = new URLSearchParams({ url, text: title });
      return `https://t.me/share/url?${p}`;
    },
  },
  {
    key: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    buildUrl: ({ url }) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
];

export function addUtmParams(baseUrl, source) {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('utm_source', source);
    url.searchParams.set('utm_medium', 'social');
    url.searchParams.set('utm_campaign', 'nexasphere-share');
    return url.toString();
  } catch {
    return baseUrl;
  }
}

export function getQRUrl(text) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
}

/* eslint-disable no-control-regex */

/**
 * Copies text to the clipboard with security sanitization.
 *
 * Prevents pastejacking/clipboard attacks by removing dangerous control characters
 * (including carriage returns \r) before copying.
 *
 * @param {string} text - The text to copy to the clipboard.
 * @returns {Promise<boolean>} True if the copy operation succeeded, false otherwise.
 */
export async function copyToClipboard(text) {
  // Prevent pastejacking/clipboard attacks by removing dangerous control characters (including carriage returns \r)
  const sanitizedText = String(text || '').replace(
     
    /[\x00-\x08\x0B\x0C\x0D\x0E-\x1F\x7F-\x9F]/g,
    ''
  );
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(sanitizedText);
    return true;
  }
  const el = document.createElement('textarea');
  el.value = sanitizedText;
  el.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(el);
  el.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(el);
  return ok;
}
/* eslint-enable no-control-regex */
