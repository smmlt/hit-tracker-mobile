// EN: Extracts YouTube video identifiers and derives safe thumbnail URLs for exercise and program previews.
// UK: Витягує YouTube video ID та формує безпечні thumbnail URL для preview вправ і програм.
/** EN: Extracts a YouTube video identifier from supported watch, embed, short, and shortened URL forms. UK: Витягує ідентифікатор відео YouTube із підтримуваних звичайних, вбудованих, коротких і скорочених адрес. */
export const getYouTubeVideoId = (url) =>
  url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/)?.[1] || null;

/** EN: Returns the standard YouTube preview image URL when a valid video identifier is present. UK: Повертає стандартну адресу зображення-попереднього перегляду YouTube, якщо знайдено коректний ідентифікатор відео. */
export const getYouTubeThumbnailUrl = (url) => {
  const id = getYouTubeVideoId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
};
