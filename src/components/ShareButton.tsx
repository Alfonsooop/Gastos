import { useState } from 'react';
import type { Group } from '../types';
import { paths } from '../state/router';
import { Button } from './Button';

/** Comparte el link del grupo: quien lo abre puede verlo y cargar gastos. */
export function ShareButton({ group }: { group: Group }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}${paths.group(group.id)}`;
    const text = `Sumate a "${group.name}" en Salda para dividir los gastos:`;
    if (navigator.share) {
      try {
        await navigator.share({ title: group.name, text, url });
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copiá este link y compartilo:', url);
    }
  };

  return (
    <Button variant="accent" size="sm" onClick={share}>
      {copied ? '¡Link copiado! ✓' : 'Invitar'}
    </Button>
  );
}
