import AppError from "../errors/AppError";

const slugify = (text: string): string => {
  if (!text) {
    throw new AppError(400, "A name must be provided to slugify");
  }
  return text
    .toLowerCase()
    .trim()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s-]/gu, "") // Preserve names in Russian and other languages
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, ""); // Remove duplicate hyphens
};

export default slugify;
