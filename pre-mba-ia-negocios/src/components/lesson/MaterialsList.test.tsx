// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MaterialsList } from './MaterialsList.tsx';

afterEach(cleanup);

describe('<MaterialsList />', () => {
  it('opens materials with a URL in a new tab and marks the others as "Em breve"', () => {
    render(
      <MaterialsList
        materials={[
          {
            id: 'slides',
            label: 'Slides',
            icon: 'slides',
            url: 'https://exemplo.com/slides.pdf',
            page: null,
          },
          { id: 'guia', label: 'Guia', icon: 'guide', url: null, page: null },
        ]}
      />,
    );

    const link = screen.getByRole('link', { name: /Slides/ });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.queryByRole('link', { name: /Guia/ })).toBeNull();
    expect(screen.getByText('Em breve')).toBeTruthy();
  });

  it('expands a material with a content page below the list, one at a time', () => {
    const page = {
      id: 'guia-de-abertura',
      intro: 'Comece por aqui.',
      tone: 'brand' as const,
      blocks: [
        { type: 'heading' as const, text: 'Bem-vindo', level: 2 as const },
        { type: 'text' as const, text: 'Leia o **guia**.' },
      ],
    };
    render(
      <MaterialsList
        materials={[{ id: 'guia', label: 'Guia de Abertura', icon: 'guide', url: null, page }]}
      />,
    );

    const toggle = screen.getByRole('button', { name: /Guia de Abertura/ });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Comece por aqui.')).toBeNull();

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('heading', { name: 'Bem-vindo' })).toBeTruthy();
    expect(screen.getByText('guia').tagName).toBe('STRONG');
    expect(screen.getByRole('region', { name: /Guia de Abertura/ })).toBeTruthy();

    fireEvent.click(toggle);
    expect(screen.queryByText('Comece por aqui.')).toBeNull();
  });
});
