/** Todos los importes se guardan como centavos enteros (ej: $10.000,00 → 1000000). */
export type Cents = number;

export interface Member {
  id: string;
  name: string;
}

/** Un renglón del detalle opcional de lo que consumió una persona (ej: "Hamburguesa $3.000"). */
export interface ExpenseItem {
  id: string;
  description: string;
  amount: Cents;
}

export interface ExpenseParticipant {
  memberId: string;
  /** Lo que le corresponde pagar a esta persona, en centavos. */
  amount: Cents;
  /** true si el monto fue escrito a mano y debe respetarse en los recálculos. */
  isCustom: boolean;
  /**
   * Detalle opcional. Si tiene ítems, `amount` es su suma y el monto queda
   * personalizado (isCustom = true).
   */
  items?: ExpenseItem[];
}

export interface Expense {
  id: string;
  description: string;
  totalAmount: Cents;
  /** id del integrante que adelantó el dinero. */
  paidBy: string;
  participants: ExpenseParticipant[];
  /** Fecha ISO de creación. */
  date: string;
}

/**
 * Transferencia entre integrantes para saldar deudas.
 * - pending: quien pagó avisó, falta que quien cobra lo confirme (no cambia balances)
 * - confirmed: quien cobra lo confirmó (sí cambia balances)
 */
export interface Payment {
  id: string;
  from: string;
  to: string;
  amount: Cents;
  status: 'pending' | 'confirmed';
  /** Fecha ISO en que se avisó o registró. */
  date: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  members: Member[];
  expenses: Expense[];
  createdAt: string;
  /** Pagos entre integrantes (opcional: grupos viejos no lo tienen). */
  payments?: Payment[];
  /** Código corto para que otros se unan (ej: "K7P2QX"). Se asigna al invitar. */
  code?: string;
}

export interface MemberBalance {
  memberId: string;
  /** Lo que adelantó en gastos. */
  paid: Cents;
  /** Lo que le correspondía de los gastos. */
  owed: Cents;
  /** Transferencias confirmadas que hizo para saldar. */
  sent: Cents;
  /** Transferencias confirmadas que recibió. */
  received: Cents;
  /** paid - owed + sent - received. Positivo: recibe dinero. Negativo: debe pagar. */
  balance: Cents;
}

export interface Settlement {
  from: string;
  to: string;
  amount: Cents;
}
