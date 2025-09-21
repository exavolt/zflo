/**
 * Truncates text content to a specified maximum length
 * @param content - The content to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to append when truncated (default: '...')
 * @returns Truncated content
 */
export function truncateContent(
  content: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (!content || content.length <= maxLength) {
    return content;
  }

  return content.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Truncates content at word boundaries to avoid cutting words in half
 * @param content - The content to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to append when truncated (default: '...')
 * @returns Truncated content at word boundary
 */
export function truncateContentAtWord(
  content: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (!content || content.length <= maxLength) {
    return content;
  }

  const truncated = content.slice(0, maxLength - suffix.length);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  // If no space found or it's too close to the beginning, use regular truncation
  if (lastSpaceIndex === -1 || lastSpaceIndex < maxLength * 0.5) {
    return truncateContent(content, maxLength, suffix);
  }

  return truncated.slice(0, lastSpaceIndex) + suffix;
}

/**
 * Sanitizes content for safe display in HTML contexts
 * @param content - The content to sanitize
 * @returns Sanitized content
 */
export function sanitizeContent(content: string): string {
  if (!content) return content;

  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats content for display, combining truncation and sanitization
 * @param content - The content to format
 * @param maxLength - Maximum length before truncation (optional)
 * @param sanitize - Whether to sanitize HTML (default: true)
 * @returns Formatted content
 */
export function formatDisplayContent(
  content: string,
  maxLength?: number,
  sanitize: boolean = true
): string {
  if (!content) return content;

  let formatted = content;

  if (maxLength && maxLength > 0) {
    formatted = truncateContentAtWord(formatted, maxLength);
  }

  if (sanitize) {
    formatted = sanitizeContent(formatted);
  }

  return formatted;
}
