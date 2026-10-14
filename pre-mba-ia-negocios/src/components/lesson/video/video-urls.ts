import type { VideoSource } from '@/domain/types.ts';
import { resolveContentUrl } from '@/lib/assets.ts';
import {
  buildVimeoWatchUrl,
  buildYouTubeThumbnailCandidates,
  buildYouTubeWatchUrl,
} from '@/lib/video-providers.ts';

/** Direct link used as fallback when the embedded player fails. */
export function buildVideoWatchUrl(video: VideoSource): string {
  switch (video.provider) {
    case 'youtube':
      return buildYouTubeWatchUrl(video.videoId);
    case 'vimeo':
      return buildVimeoWatchUrl(video);
    case 'mp4':
      return resolveContentUrl(video.url);
    case 'spalla':
      return video.embedUrl;
  }
}

/** Thumbnail URLs to try in order (custom first, then provider defaults). */
export function getThumbnailCandidates(video: VideoSource): string[] {
  const custom =
    video.provider !== 'spalla' && video.thumbnail ? [resolveContentUrl(video.thumbnail)] : [];
  const provider =
    video.provider === 'youtube' ? buildYouTubeThumbnailCandidates(video.videoId) : [];
  return [...custom, ...provider];
}
