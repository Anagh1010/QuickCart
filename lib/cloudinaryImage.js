const CLOUDINARY_UPLOAD_PATH = "/image/upload/";

export function getCloudinaryImageUrl(source, width) {
  if (!source.includes(CLOUDINARY_UPLOAD_PATH)) {
    return source;
  }

  const transformations = `f_auto,q_auto,w_${width}`;
  return source.replace(CLOUDINARY_UPLOAD_PATH, `${CLOUDINARY_UPLOAD_PATH}${transformations}/`);
}
