const YOUTUBE_HOST = /^(?:https?:\/\/)?(?:[\w-]+\.)?(?:youtube\.com|youtube-nocookie\.com|youtu\.be)(?:\/|$)/i;

/** true nếu URL thuộc YouTube (youtube.com, m.youtube.com, youtu.be, ...) */
export function isYouTubeUrl(url: string): boolean {
  return YOUTUBE_HOST.test((url ?? '').trim());
}

/**
 * Trích videoId (11 ký tự) từ các dạng URL YouTube:
 * - https://www.youtube.com/watch?v=ID
 * - https://youtu.be/ID
 * - https://www.youtube.com/embed/ID
 * - https://www.youtube.com/shorts/ID
 * Trả về null nếu không tìm được.
 */
export function extractYouTubeId(url: string): string | null {
  const value = (url ?? '').trim();
  if (!isYouTubeUrl(value)) return null;
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/, // watch?v=ID
    /youtu\.be\/([A-Za-z0-9_-]{11})/, // youtu.be/ID
    /\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/, // embed/ID, shorts/ID
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(value);
    if (match) return match[1];
  }
  return null;
}
