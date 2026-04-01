import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

const SITE_NAME = 'ScoreX';
const BASE_URL  = 'https://scorex-live.vercel.app';
const DEFAULT_DESC = 'Live cricket scoring and tournament management platform for clubs, academies, and organizers.';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

/**
 * useSEO — call at the top of any page component to set per-route meta tags.
 *
 * @example
 * useSEO({
 *   title: 'Live Matches',
 *   description: 'Watch cricket matches being scored live.',
 * });
 */
export function useSEO({ title, description, canonical, ogImage, noIndex = false }: SEOProps = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – Live Cricket Scoring & Tournament Management`;
    const desc      = description ?? DEFAULT_DESC;
    const image     = ogImage ?? DEFAULT_IMAGE;
    const url       = canonical ? `${BASE_URL}${canonical}` : window.location.href;

    // Title
    document.title = fullTitle;

    // Helper: upsert a <meta> tag
    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    // Helper: upsert a <link> tag
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.rel = rel;
        document.head.appendChild(el);
      }
      el.href = href;
    };

    // Primary meta
    setMeta('meta[name="description"]',   'content', desc);
    setMeta('meta[name="robots"]',        'content', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Canonical
    setLink('canonical', url);

    // Open Graph
    setMeta('meta[property="og:title"]',       'content', fullTitle);
    setMeta('meta[property="og:description"]', 'content', desc);
    setMeta('meta[property="og:url"]',         'content', url);
    setMeta('meta[property="og:image"]',       'content', image);

    // Twitter Card
    setMeta('meta[name="twitter:title"]',       'content', fullTitle);
    setMeta('meta[name="twitter:description"]', 'content', desc);
    setMeta('meta[name="twitter:image"]',       'content', image);

    // Cleanup on unmount — restore defaults
    return () => {
      document.title = `${SITE_NAME} – Live Cricket Scoring & Tournament Management`;
    };
  }, [title, description, canonical, ogImage, noIndex]);
}
