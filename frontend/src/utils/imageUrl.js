export function getImageUrl(image, folder = "owners") {
  if (!image) return "";
  if (typeof image !== "string") return "";
  const trimmed = image.trim();
  if (!trimmed) return "";
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("/uploads/")) {
    return trimmed;
  }
  return `/uploads/${folder}/${trimmed}`;
}

