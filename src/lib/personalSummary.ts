import type { Cents, MemberBalance, Settlement } from '../types';

export interface PersonalSummary {
  balance: Cents;
  /** Transferencias que esta persona tiene que hacer. */
  toPay: Settlement[];
  /** Transferencias que esta persona tiene que recibir. */
  toReceive: Settlement[];
}

/** Lo que le importa a una persona: cuánto debe / le deben y a quién. */
export function getPersonalSummary(
  memberId: string,
  balances: MemberBalance[],
  settlements: Settlement[],
): PersonalSummary {
  return {
    balance: balances.find((b) => b.memberId === memberId)?.balance ?? 0,
    toPay: settlements.filter((s) => s.from === memberId),
    toReceive: settlements.filter((s) => s.to === memberId),
  };
}
