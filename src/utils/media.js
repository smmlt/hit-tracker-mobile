export const getYouTubeVideoId = (url) =>
  url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/)?.[1] || null;

export const getYouTubeThumbnailUrl = (url) => {
  const id = getYouTubeVideoId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
};
