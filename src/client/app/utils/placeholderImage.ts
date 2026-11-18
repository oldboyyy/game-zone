// Generate a placeholder image URL with random background color and text
export const generatePlaceholderImage = (
  text: string,
  size: number = 200
): string => {
  // Extract first letter of each word for initials
  const initials = Array.from(text
    .split(" ")
    .map((word) => (Array.from(word)[0] ?? "").toUpperCase())
    .join(""))
    .slice(0, 2).join("");

  // Random background colors
  const colors = [
    "#6366f1", // Indigo
    "#10b981", // Emerald
    "#3b82f6", // Blue
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Violet
    "#06b6d4", // Cyan
    "#84cc16", // Lime
  ];

  const colorIndex = Array.from(text).reduce((sum, character) => sum + character.codePointAt(0)!, 0);
  const randomColor = colors[colorIndex % colors.length];
  const escapedInitials = initials.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[character]!);

  // Create a simple SVG placeholder
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${randomColor}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${
        size * 0.3
      }" 
            fill="white" text-anchor="middle" dy="0.35em" font-weight="bold">
        ${escapedInitials}
      </text>
    </svg>
  `;

  // Convert SVG to data URL
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return dataUrl;
};

// Generate a placeholder image for products
export const generateProductPlaceholder = (productName: string): string => {
  return generatePlaceholderImage(productName, 400);
};

// Generate a placeholder avatar for users
export const generateUserAvatar = (userName: string): string => {
  return generatePlaceholderImage(userName, 200);
};
