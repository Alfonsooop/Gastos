# Salda

**Organizá los gastos de tu grupo y olvidate de hacer cuentas.**

Salda es una app web para dividir los gastos de una juntada, cena, salida o viaje. Anotás quién pagó cada cosa y quiénes participaron; la app reparte el gasto, calcula los balances y te dice exactamente **quién le tiene que transferir cuánto a quién**.

## El problema

En un grupo, distintas personas pagan distintas cosas (el bar, el cine, el taxi), no todos participan de todo y, aunque participen, no siempre les corresponde lo mismo. Al final es difícil saber cuánto debía poner cada uno, cuánto puso realmente, y cómo saldar las cuentas con la menor cantidad de transferencias.

## Funcionalidades

- **Grupos**: crear, listar (con integrantes y total gastado) y eliminar con confirmación.
- **Integrantes**: agregar y eliminar. Si la persona participa de gastos se muestra una advertencia y su parte se redistribuye; si pagó algún gasto no se puede eliminar hasta cambiar quién pagó (así no se pierde plata en las cuentas).
- **Gastos**: descripción, monto, quién pagó y quiénes participaron. Se pueden ver, editar y eliminar.
- **División automática en partes iguales** apenas elegís participantes.
- **Montos personalizados tipo planilla**: tocás un monto, lo escribís, queda fijado (🔒) y el resto se reparte solo. Tocando 🔒 vuelve a automático. Botón **Restablecer división equitativa**.
- **Indicador de asignación** siempre visible (`Asignado: $60.000,00 / $60.000,00 ✓`) con avisos de faltantes o excesos. No se puede guardar hasta que cuadre.
- **Resumen**: pagó / le corresponde / balance por persona, con colores.
- **Liquidación**: las transferencias para dejar a todos en $0, con botón para copiar el texto y mandarlo al grupo.
- **Persistencia** en `localStorage`: todo sigue ahí al cerrar y volver a abrir el navegador.
- **Grupo de ejemplo** cargable desde la Home para probar la app en un clic.
- Diseño mobile-first, pensado para usar desde el teléfono en plena juntada.

## Stack

- [React 19](https://react.dev) + TypeScript
- [Vite](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Vitest](https://vitest.dev) para los tests
- Sin backend y sin dependencias de runtime extra (router propio basado en `#hash`).

## Estructura del proyecto

```text
src/
├── types.ts                  # Group, Member, Expense, ExpenseParticipant, ...
├── lib/                      # Lógica de negocio pura (sin React) + tests
│   ├── money.ts              # Centavos, formato $1.250,50 y parseo de inputs
│   ├── distribution.ts       # calculateExpenseDistribution, splitEvenly, calculateTotalAssigned
│   ├── balances.ts           # calculateBalances, calculateSettlements, calculateGroupTotal
│   ├── groupOperations.ts    # Crear grupo, agregar/quitar integrantes y gastos (inmutable)
│   ├── validation.ts         # Validaciones con mensajes por campo
│   ├── expenseEmoji.ts       # 🍻 🎬 🚕 según la descripción
│   ├── sampleData.ts         # Grupo de ejemplo
│   └── *.test.ts
├── storage/
│   └── groupsStorage.ts      # Lectura/escritura en localStorage
├── state/
│   ├── GroupsContext.tsx     # Estado global de grupos (persistido)
│   ├── useExpenseForm.ts     # Estado del formulario de gasto
│   └── router.ts             # Rutas por hash
├── components/               # UI reutilizable (Button, MoneyInput, DistributionEditor, ...)
└── pages/                    # Home, Mis grupos, Nuevo grupo, Grupo, Gasto (detalle/formulario)
```

## Cómo funciona

**Dinero en centavos.** Todos los importes se guardan como enteros en centavos (`$10.000,00` → `1000000`), así no hay errores de punto flotante.

**División equitativa** (`splitEvenly`). Cada persona recibe el importe redondeado al centavo más cercano y los centavos que sobran o faltan se ajustan, de a uno, en los últimos participantes. La suma siempre da el total exacto y nadie difiere en más de un centavo:
`$100 / 3 → 33,33 · 33,33 · 33,34` y `$20.000 / 3 → 6.666,67 · 6.666,67 · 6.666,66`.

**Montos personalizados** (`calculateExpenseDistribution`). Cada participante tiene `isCustom`. Los personalizados se respetan tal cual; el resto (`total − personalizados`) se divide en partes iguales entre los automáticos. Si los personalizados superan el total, no se tocan: se devuelve un error para que el usuario corrija. El formulario sólo guarda *quién participa* y *qué montos se fijaron*; los automáticos se recalculan en cada render, por eso cambiar el total o agregar/quitar gente actualiza todo al instante.

**Balances** (`calculateBalances`). Para cada persona: `balance = total pagado − total que le corresponde`. Positivo: recibe; negativo: debe pagar. La suma de todos los balances es siempre $0.

**Liquidación** (`calculateSettlements`). Primero se emparejan deudores y acreedores con exactamente el mismo importe (una transferencia salda a los dos). Después, el que más debe le paga al que más tiene que recibir, por el mínimo de ambos, hasta que todos quedan en $0. Nunca hay más de `n − 1` transferencias.

## Instalación y uso

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abrí la URL que muestra Vite (por defecto http://localhost:5173).

Otros comandos:

```bash
npm run build      # typecheck + build de producción en dist/
npm run preview    # sirve el build
```

## Tests

```bash
npm test
```

Cubren la lógica matemática: división equitativa ($30.000 / 3), centavos ($100 / 3), uno y varios montos personalizados, personalizados que superan el total, agregar/quitar participantes, balances que suman 0, liquidaciones que dejan a todos en 0 (incluyendo casos aleatorios), los dos escenarios completos (bar/cine/taxi y la cena de $63.000), formato/parseo de dinero y validaciones.
