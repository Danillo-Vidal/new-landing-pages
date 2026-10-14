import { uiText } from '@/content/ui-text.ts';
import { resolveContentUrl } from '@/lib/assets.ts';
import { parseInline } from '@/lib/inline-text.ts';

import { TEXT_CLASS } from './content-styles.ts';

/** Renders `**negrito**` and `[texto](link)` as React nodes (never as raw HTML). */
export function InlineText({ text }: { readonly text: string }) {
  return parseInline(text).map((token, index) => {
    switch (token.type) {
      case 'text':
        return token.text;
      case 'bold':
        return (
          <strong key={index} className={TEXT_CLASS.bold}>
            {token.text}
          </strong>
        );
      case 'link':
        return (
          <a
            key={index}
            href={resolveContentUrl(token.url)}
            target="_blank"
            rel="noopener noreferrer"
            className={TEXT_CLASS.link}
          >
            {token.text}
            <span className="sr-only"> {uiText.materials.opensInNewTab}</span>
          </a>
        );
    }
  });
}
