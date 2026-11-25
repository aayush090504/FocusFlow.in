import React, { useEffect } from 'react';

export interface SEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  ogImageAlt?: string;
  robots?: string;
  schemaJson?: Record<string, unknown> | Record<string, unknown>[];
  keywords?: string[];
}

export const SEOHead: React.FC<SEOProps> = ({
  title,
  description,
  canonicalUrl = 'https://focusflow.in/',
  ogType = 'website',
  ogImage = 'https://focusflow.in/assets/og-preview.png',
  ogImageAlt,
  robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  schemaJson,
  keywords = [
    'free pomodoro timer',
    'free study planner',
    'student productivity app',
    'study workspace',
    'online study timer',
    'productivity tools for students',
    'free student planner',
    'focus timer for studying'
  ]
}) => {
  const keywordsStr = keywords.join(', ');
  const schemaStr = schemaJson ? JSON.stringify(schemaJson) : '';
  const resolvedImageAlt = ogImageAlt || `${title} — Focus Flow`;

  useEffect(() => {
    document.title = title;

    const setMetaTag = (attrName: 'name' | 'property', attrVal: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard Meta Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywordsStr);
    setMetaTag('name', 'robots', robots);

    // Canonical Link (remove on noindex pages to avoid conflicting signals, otherwise sync)
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (robots.startsWith('noindex')) {
      if (canonicalLink) {
        canonicalLink.remove();
      }
    } else {
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonicalUrl);
    }

    // OpenGraph Tags
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:site_name', 'Focus Flow');
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:image:alt', resolvedImageAlt);
    setMetaTag('property', 'og:locale', 'en_US');

    // Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage);
    setMetaTag('name', 'twitter:image:alt', resolvedImageAlt);
    setMetaTag('name', 'twitter:site', '@focusflow_in');

    // Schema.org JSON-LD Structured Data
    const existingScript = document.getElementById('schema-json-ld');
    if (existingScript) {
      existingScript.remove();
    }

    if (schemaStr) {
      const script = document.createElement('script');
      script.id = 'schema-json-ld';
      script.type = 'application/ld+json';
      script.text = schemaStr;
      document.head.appendChild(script);
    }

    return () => {
      const s = document.getElementById('schema-json-ld');
      if (s) s.remove();
    };
  }, [title, description, canonicalUrl, ogType, ogImage, resolvedImageAlt, robots, schemaStr, keywordsStr]);

  return null;
};
