// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { LessonState } from '@/domain/types.ts';
import { at, createLesson, SAO_PAULO } from '@/test/fixtures.ts';

import { LessonCard } from './LessonCard.tsx';

afterEach(cleanup);

function renderCard(state: LessonState, { isSelected = false, isPreviousOpen = false } = {}) {
  const onSelect = vi.fn();
  const onUnlock = vi.fn();
  render(
    <LessonCard
      state={state}
      isSelected={isSelected}
      isPreviousOpen={isPreviousOpen}
      isHighlighted={false}
      timeZone={SAO_PAULO}
      trigger="play"
      panelId="panel"
      onSelect={onSelect}
      onUnlock={onUnlock}
      onHighlightEnd={vi.fn()}
    />,
  );
  return { onSelect, onUnlock, card: screen.getByRole('button') };
}

const sequential = createLesson({ id: 'aula-2', order: 2, release: { type: 'sequential' } });

describe('<LessonCard />', () => {
  it('locked by date: shows the release date, is aria-disabled and cannot be selected', () => {
    const lesson = createLesson({ id: 'aula-3', order: 3 });
    const { card, onSelect } = renderCard({
      lesson,
      status: 'locked',
      releaseAt: at('2026-10-27'),
      lockReason: 'awaiting_release_date',
    });

    expect(card.getAttribute('aria-disabled')).toBe('true');
    expect(card.textContent).toContain('Liberação: 27 de out. de 2026');
    expect(card.textContent).toContain('Bloqueado');
    fireEvent.click(card);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('locked in sequence: tells what to do in the previous lesson', () => {
    const { card } = renderCard(
      {
        lesson: sequential,
        status: 'locked',
        releaseAt: null,
        lockReason: 'awaiting_previous_lesson',
      },
      { isPreviousOpen: true },
    );
    expect(card.textContent).toContain('Dê play na aula anterior');
  });

  it('ready: "Liberar aula" unlocks instead of selecting', () => {
    const { card, onSelect, onUnlock } = renderCard({
      lesson: sequential,
      status: 'ready',
      releaseAt: null,
      lockReason: null,
    });

    expect(card.textContent).toContain('Liberar aula');
    fireEvent.click(card);
    expect(onUnlock).toHaveBeenCalledWith('aula-2');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('available: "Ver conteúdo" selects the lesson; selected shows "Visualizando a aula"', () => {
    const state: LessonState = {
      lesson: sequential,
      status: 'available',
      releaseAt: null,
      lockReason: null,
    };
    const { card, onSelect } = renderCard(state);

    expect(card.getAttribute('aria-disabled')).toBeNull();
    expect(card.textContent).toContain('Ver conteúdo');
    fireEvent.click(card);
    expect(onSelect).toHaveBeenCalledWith('aula-2');

    cleanup();
    expect(renderCard(state, { isSelected: true }).card.textContent).toContain(
      'Visualizando a aula',
    );
  });

  it('completed: keeps "Assistido" even when selected', () => {
    const { card } = renderCard(
      { lesson: sequential, status: 'completed', releaseAt: null, lockReason: null },
      { isSelected: true },
    );
    expect(card.textContent).toContain('Assistido');
    expect(card.getAttribute('aria-current')).toBe('true');
  });
});
