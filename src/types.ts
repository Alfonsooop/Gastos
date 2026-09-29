/** Todos los importes se guardan como centavos enteros (ej: $10.000,00 → 1000000). */
export type Cents = number;

export interface Member {
  id: string;
  name: string;
}

export interface ExpenseParticipant {
  memberId: string;
  /** Lo que le corresponde pagar a esta persona, en centavos. */
  amount: Cents;
  /** true si el monto fue escrito a mano y debe respetarse en los recálculos. */
  isCustom: boolean;
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

export interface Group {
  id: string;
  name: string;
  description: string;
  members: Member[];
  expenses: Expense[];
  createdAt: string;
}

export interface MemberBalance {
  memberId: string;
  paid: Cents;
  owed: Cents;
  /** paid - owed. Positivo: recibe dinero. Negativo: debe pagar. */
  balance: Cents;
}

export interface Settlement {
  from: string;
  to: string;
  amount: Cents;
}
