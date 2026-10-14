import { Volume2, VolumeX } from 'lucide-react';

import { Button } from '@/components/ui/button.tsx';
import { uiText } from '@/content/ui-text.ts';

interface SoundToggleProps {
  readonly isEnabled: boolean;
  readonly onToggle: () => void;
}

/** "Som das conquistas": plays the unlock chime when on. */
export function SoundToggle({ isEnabled, onToggle }: SoundToggleProps) {
  const Icon = isEnabled ? Volume2 : VolumeX;
  return (
    <Button variant="ghost" size="sm" aria-pressed={isEnabled} onClick={onToggle}>
      <Icon aria-hidden="true" />
      {uiText.journey.soundToggle}
    </Button>
  );
}
