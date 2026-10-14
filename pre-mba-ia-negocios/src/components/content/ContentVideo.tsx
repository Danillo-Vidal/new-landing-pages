import { PLAYER_IFRAME_PROPS } from '@/components/lesson/video/player-iframe.ts';
import { uiText } from '@/content/ui-text.ts';
import type { VideoSource } from '@/domain/types.ts';
import { resolveContentUrl } from '@/lib/assets.ts';
import { buildVimeoEmbedUrl, buildYouTubeEmbedUrl } from '@/lib/video-providers.ts';

import { MEDIA_CLASS } from './content-styles.ts';

function embedUrlOf(video: Exclude<VideoSource, { provider: 'mp4' }>): string {
  switch (video.provider) {
    case 'youtube':
      return buildYouTubeEmbedUrl(video.videoId, window.location.origin);
    case 'vimeo':
      return buildVimeoEmbedUrl(video);
    case 'spalla':
      return video.embedUrl;
  }
}

/**
 * Complementary video inside a content page. It is NOT the lesson video: it does not count
 * watched time. Mounted only while the page is expanded, so it never loads in the background.
 */
export function ContentVideo({
  video,
  title,
}: {
  readonly video: VideoSource;
  readonly title: string;
}) {
  return (
    <figure className={MEDIA_CLASS.figure}>
      <div className={MEDIA_CLASS.video}>
        {video.provider === 'mp4' ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption -- captions are optional content (`captionsUrl`); the <track> below is rendered whenever it is provided.
          <video
            src={resolveContentUrl(video.url)}
            poster={video.thumbnail ? resolveContentUrl(video.thumbnail) : undefined}
            title={title}
            controls
            playsInline
            preload="metadata"
            className="absolute inset-0 size-full"
          >
            {video.captionsUrl && (
              <track
                kind="captions"
                src={resolveContentUrl(video.captionsUrl)}
                srcLang="pt-BR"
                label={uiText.video.captionsLabel}
                default
              />
            )}
          </video>
        ) : (
          <iframe src={embedUrlOf(video)} title={title} {...PLAYER_IFRAME_PROPS} />
        )}
      </div>
      <figcaption className={MEDIA_CLASS.caption}>{title}</figcaption>
    </figure>
  );
}
