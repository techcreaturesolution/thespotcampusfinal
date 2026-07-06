import { useEffect } from "react";

/**
 * Reusable SEO component for dynamic meta tags in React SPA.
 * Directly updates document title, description, keywords, canonical link,
 * and social share metadata (Open Graph and Twitter Cards) on mount/update.
 */
const SEO = ({ title, description, keywords, ogImage, ogUrl, canonical }) => {
  useEffect(() => {
    const defaultTitle = "The Spot Campus - AI Powered Campus Placement Platform";
    const defaultDesc = "The Spot Campus is an AI-powered campus placement and proctored examination platform designed for students, recruiters, college admins, and TPOs.";
    const defaultKeywords = "campus placement, proctored exam, recruitment drive, TPO, college placement, job interview, AI proctoring";
    const defaultImage = "https://thespotcampus.com/logo_TSC.webp";
    
    const currentUrl = ogUrl || window.location.href;

    // 1. Update Document Title
    document.title = title ? `${title} | The Spot Campus` : defaultTitle;

    // 2. Helper to get or create a meta tag
    const setMetaTag = (attrName, attrValue, content) => {
      let tag = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attrName, attrValue);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content || "");
    };

    // 3. Update Description & Keywords
    setMetaTag("name", "description", description || defaultDesc);
    setMetaTag("name", "keywords", keywords || defaultKeywords);

    // 4. Update Canonical Link URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonical || currentUrl);

    // 5. Update Open Graph (OG) Tags
    setMetaTag("property", "og:title", title ? `${title} | The Spot Campus` : defaultTitle);
    setMetaTag("property", "og:description", description || defaultDesc);
    setMetaTag("property", "og:image", ogImage || defaultImage);
    setMetaTag("property", "og:url", currentUrl);
    setMetaTag("property", "og:type", "website");

    // 6. Update Twitter Card Tags
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", title ? `${title} | The Spot Campus` : defaultTitle);
    setMetaTag("name", "twitter:description", description || defaultDesc);
    setMetaTag("name", "twitter:image", ogImage || defaultImage);
    setMetaTag("name", "twitter:url", currentUrl);

  }, [title, description, keywords, ogImage, ogUrl, canonical]);

  return null;
};

export default SEO;
