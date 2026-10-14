import { describe, expect, it } from 'vitest';

import { findUnsafeInlineLinks, parseInline } from './inline-text.ts';

describe('parseInline', () => {
  it('splits plain text, bold and links', () => {
    expect(parseInline('Leia o **guia** em [este link](https://exemplo.com/guia).')).toEqual([
      { type: 'text', text: 'Leia o ' },
      { type: 'bold', text: 'guia' },
      { type: 'text', text: ' em ' },
      { type: 'link', text: 'este link', url: 'https://exemplo.com/guia' },
      { type: 'text', text: '.' },
    ]);
  });

  it('accepts files from public/ and keeps unsafe links as plain text', () => {
    expect(parseInline('[PDF](materiais/guia.pdf)')).toEqual([
      { type: 'link', text: 'PDF', url: 'materiais/guia.pdf' },
    ]);
    expect(parseInline('[x](javascript:alert(1))')[0]?.type).toBe('text');
    expect(parseInline('[x](http://inseguro.com)')[0]?.type).toBe('text');
  });

  it('reports unsafe links for content validation', () => {
    expect(findUnsafeInlineLinks('[a](https://ok.com) [b](http://nao.com)')).toEqual([
      'http://nao.com',
    ]);
  });
});
