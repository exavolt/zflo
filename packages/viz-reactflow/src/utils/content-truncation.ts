/**
 * Truncates content to keep node sizes consistent
 */
export function truncateContent(
  content: string | undefined,
  maxLength: number = 100
): string {
  if (!content) return '';

  if (content.length <= maxLength) {
    return content;
  }

  // Try to break at word boundaries
  const truncated = content.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  if (lastSpaceIndex > maxLength * 0.7) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }

  return truncated + '...';
}

/**
 * Estimates the display width of text for consistent node sizing
 */
export function estimateTextWidth(text: string): number {
  // Rough estimation: average character width in pixels
  const avgCharWidth = 8;
  const lines = text.split('\n');
  const maxLineLength = Math.max(...lines.map((line) => line.length));
  return maxLineLength * avgCharWidth;
}

/**
 * Calculates optimal node dimensions based on content
 */
export function calculateNodeDimensions(
  content: string,
  minWidth: number = 200,
  minHeight: number = 80,
  maxWidth: number = 300
): { width: number; height: number } {
  const lines = content.split('\n');
  const lineHeight = 20;
  const padding = 32; // Total horizontal padding

  const contentWidth = Math.max(
    ...lines.map((line) => estimateTextWidth(line))
  );
  const width = Math.min(Math.max(contentWidth + padding, minWidth), maxWidth);
  const height = Math.max(lines.length * lineHeight + padding, minHeight);

  return { width, height };
}
