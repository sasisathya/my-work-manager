/**
 * HTML Sanitization Utilities
 *
 * Prevents XSS attacks by:
 * 1. Removing dangerous HTML tags (script, iframe with allow-scripts, etc)
 * 2. Removing event handlers (onclick, onerror, etc)
 * 3. Removing dangerous attributes (src with javascript:, data:, etc)
 * 4. Whitelisting safe HTML tags
 *
 * Usage:
 * const safe = sanitizeHTML(userGeneratedHTML);
 * return <div dangerouslySetInnerHTML={{ __html: safe }} />;
 */

// Whitelist of safe HTML tags
const ALLOWED_TAGS = new Set([
  'a', 'abbr', 'address', 'article', 'aside', 'b', 'blockquote', 'br', 'caption',
  'code', 'col', 'colgroup', 'dd', 'del', 'details', 'dfn', 'div', 'dl', 'dt',
  'em', 'figcaption', 'figure', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'header', 'hr', 'i', 'img', 'ins', 'kbd', 'li', 'main', 'mark', 'nav', 'ol',
  'p', 'pre', 'q', 's', 'samp', 'section', 'small', 'strong', 'sub', 'summary',
  'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'time', 'tr', 'u', 'ul', 'var',
]);

// Whitelist of safe attributes
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'title', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  code: ['class'],
  pre: ['class'],
  div: ['class', 'id'],
  span: ['class', 'id'],
  table: ['class', 'id'],
  '*': ['class', 'id', 'style'], // Global attributes
};

// Dangerous protocols that should be removed
const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:'];

// Event handler attributes to remove
const EVENT_HANDLERS = [
  'onclick', 'onload', 'onerror', 'onchange', 'onsubmit', 'onmouseover',
  'onmouseout', 'onkeydown', 'onkeyup', 'onfocus', 'onblur', 'ondblclick',
  'onmouseenter', 'onmouseleave', 'ondrag', 'ondrop',
];

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - Raw HTML string
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Create a DOM parser to work with HTML safely
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Walk through all elements and remove unsafe ones
  const walker = doc.createTreeWalker(
    doc.body,
    NodeFilter.SHOW_ELEMENT,
    null
  );

  const nodesToRemove: Element[] = [];
  let node = walker.nextNode() as Element | null;

  while (node) {
    // Remove script tags and other dangerous tags
    if (!ALLOWED_TAGS.has(node.tagName.toLowerCase())) {
      nodesToRemove.push(node);
      node = walker.nextNode() as Element | null;
      continue;
    }

    // Remove all event handlers
    EVENT_HANDLERS.forEach((handler) => {
      if (node && node.hasAttribute(handler)) {
        node.removeAttribute(handler);
      }
    });

    // Remove dangerous attributes
    const attributesToRemove: string[] = [];
    const attrs = node.attributes || [];

    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      const attrName = attr.name.toLowerCase();

      // Check if attribute is allowed for this tag
      const allowed =
        ALLOWED_ATTRIBUTES['*']?.includes(attrName) ||
        ALLOWED_ATTRIBUTES[node.tagName.toLowerCase()]?.includes(attrName);

      if (!allowed) {
        attributesToRemove.push(attrName);
        continue;
      }

      // Check for dangerous URLs in href/src
      if ((attrName === 'href' || attrName === 'src') && attr.value) {
        const lowerValue = attr.value.toLowerCase().trim();
        const isDangerous = DANGEROUS_PROTOCOLS.some((protocol) =>
          lowerValue.startsWith(protocol)
        );

        if (isDangerous) {
          attributesToRemove.push(attrName);
        }
      }

      // Check style attribute for dangerous CSS
      if (attrName === 'style' && attr.value) {
        const sanitizedStyle = sanitizeCSS(attr.value);
        if (sanitizedStyle) {
          node.setAttribute('style', sanitizedStyle);
        } else {
          attributesToRemove.push(attrName);
        }
      }
    }

    // Remove flagged attributes
    attributesToRemove.forEach((attr) => {
      node!.removeAttribute(attr);
    });

    node = walker.nextNode() as Element | null;
  }

  // Remove flagged nodes
  nodesToRemove.forEach((n) => n.parentNode?.removeChild(n));

  // Return sanitized HTML
  return doc.body.innerHTML;
}

/**
 * Sanitize CSS to prevent JavaScript execution
 * @param css - CSS string (usually from style attribute)
 * @returns Safe CSS string
 */
export function sanitizeCSS(css: string): string {
  if (!css || typeof css !== 'string') {
    return '';
  }

  // Remove dangerous CSS that can execute JavaScript
  const dangerousPatterns = [
    /expression\s*\(/gi, // IE expressions
    /behavior\s*:/gi, // IE behaviors
    /import\s+['"]?(?!url)/gi, // @import without url()
  ];

  let sanitized = css;

  dangerousPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '');
  });

  return sanitized;
}

/**
 * Escape HTML special characters
 * @param text - Plain text
 * @returns Escaped HTML safe for text nodes
 */
export function escapeHTML(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

/**
 * Extract plain text from HTML (removes all tags)
 * @param html - HTML string
 * @returns Plain text content
 */
export function stripHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

/**
 * React hook to safely render HTML content
 * Usage:
 * <div dangerouslySetInnerHTML={{ __html: useSafeHTML(userContent) }} />
 */
export function useSafeHTML(html: string): string {
  return sanitizeHTML(html);
}
