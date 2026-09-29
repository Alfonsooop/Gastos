import { useEffect, useState } from 'react';

/**
 * Router mínimo basado en el hash (#/grupos/123). No necesita configuración de
 * servidor y alcanza para las pocas pantallas de la app.
 */
export type Route =
  | { name: 'home' }
  | { name: 'groups' }
  | { name: 'new-group' }
  | { name: 'group'; groupId: string; tab: GroupTab }
  | { name: 'new-expense'; groupId: string }
  | { name: 'expense'; groupId: string; expenseId: string }
  | { name: 'edit-expense'; groupId: string; expenseId: string }
  | { name: 'not-found' };

export type GroupTab = 'resumen' | 'gastos' | 'integrantes' | 'liquidacion';
const TABS: GroupTab[] = ['resumen', 'gastos', 'integrantes', 'liquidacion'];

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [a, b, c, d, e] = parts;
  if (!a) return { name: 'home' };
  if (a !== 'grupos') return { name: 'not-found' };
  if (!b) return { name: 'groups' };
  if (b === 'nuevo' && !c) return { name: 'new-group' };
  if (!c) return { name: 'group', groupId: b, tab: 'resumen' };
  if (TABS.includes(c as GroupTab) && !d) return { name: 'group', groupId: b, tab: c as GroupTab };
  if (c === 'gastos' && d === 'nuevo' && !e) return { name: 'new-expense', groupId: b };
  if (c === 'gastos' && d && !e) return { name: 'expense', groupId: b, expenseId: d };
  if (c === 'gastos' && d && e === 'editar') return { name: 'edit-expense', groupId: b, expenseId: d };
  return { name: 'not-found' };
}

export const paths = {
  home: () => '#/',
  groups: () => '#/grupos',
  newGroup: () => '#/grupos/nuevo',
  group: (groupId: string, tab: GroupTab = 'resumen') =>
    tab === 'resumen' ? `#/grupos/${groupId}` : `#/grupos/${groupId}/${tab}`,
  newExpense: (groupId: string) => `#/grupos/${groupId}/gastos/nuevo`,
  expense: (groupId: string, expenseId: string) => `#/grupos/${groupId}/gastos/${expenseId}`,
  editExpense: (groupId: string, expenseId: string) => `#/grupos/${groupId}/gastos/${expenseId}/editar`,
};

const NAVIGATE_EVENT = 'salda:navigate';

export function navigate(path: string, { replace = false } = {}): void {
  if (replace) window.location.replace(path);
  else window.location.hash = path;
  // hashchange es asíncrono: avisamos ya para que la ruta cambie en el mismo
  // render que la actualización de datos (evita parpadeos de "no encontrado").
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    let current = window.location.hash;
    const onChange = () => {
      if (window.location.hash === current) return;
      current = window.location.hash;
      setRoute(parseRoute(current));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    window.addEventListener(NAVIGATE_EVENT, onChange);
    return () => {
      window.removeEventListener('hashchange', onChange);
      window.removeEventListener(NAVIGATE_EVENT, onChange);
    };
  }, []);
  return route;
}
