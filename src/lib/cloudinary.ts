const cloudName =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export function getCloudinaryImageUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (!cloudName) {
    return null;
  }

  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_320,h_240,c_fill/${value}`;
}
