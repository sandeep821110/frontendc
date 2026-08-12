export const optimizeImage = (url, { width = 800, quality = "auto" } = {}) => {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) {
    return url;
  }
  const marker = "/image/upload/";
  const index = url.indexOf(marker);
  if (index === -1) return url;
  const base = url.slice(0, index + marker.length);
  const rest = url.slice(index + marker.length);
  return `${base}f_auto,q_${quality},w_${width}/${rest}`;
};
