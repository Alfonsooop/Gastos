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
- **Detalle opcional por persona**: con la flecha ▸ se anota qué consumió cada uno (ej. Hamburguesa $3.000 + Cerveza $2.000); su parte pasa a ser la suma y el resto se reparte solo. En el detalle del gasto se despliega con la misma flecha.
- **Indicador de asignación** siempre visible (`Asignado: $60.000,00 / $60.000,00 ✓`) con avisos de faltantes o excesos. No se puede guardar hasta que cuadre.
- **Resumen**: pagó / le corresponde / balance por persona, con colores.
- **Liquidación**: las transferencias para dejar a todos en $0, con botón para copiar el texto y mandarlo al grupo.
- **Grupos compartidos en la nube** (Firebase Firestore): tocás **Invitar** y compartís el **código del grupo** (ej. `K7P2QX`) o el link. Tus amigos entran con **Unirme con un código** y todos ven y cargan gastos en el mismo grupo, sincronizado en vivo.
- **¿Quién sos?**: al entrar a un grupo compartido cada uno elige su nombre (o se agrega) y ve arriba de todo cuánto tiene que transferir y a quién. Las ediciones usan transacciones, así dos personas guardando a la vez no se pisan.
- **Sin configurar Firebase** la app funciona igual, guardando todo en el navegador (`localStorage`). Al activar la nube, los grupos locales se suben solos.
- **Grupo de ejemplo** cargable desde la Home para probar la app en un clic.
- **Acceso directo en el celular**: mini tutorial con los pasos para iPhone o Android (se detecta solo) y botón **Instalar** en un toque cuando Chrome lo permite. Con el `manifest.webmanifest` y los íconos, se abre a pantalla completa como una app.
- Diseño mobile-first, pensado para usar desde el teléfono en plena juntada.

## Stack

- [React 19](https://react.dev) + TypeScript
- [Vite](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Vitest](https://vitest.dev) para los tests
- [Firebase Firestore](https://firebase.google.com/docs/firestore) (opcional) como base de datos compartida, plan gratuito
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
├── firebase/config.ts        # Config de Firebase desde variables VITE_FIREBASE_*
├── storage/
│   ├── GroupStore.ts         # Interfaz común: watch / create / update / remove
│   ├── localGroupStore.ts    # Implementación con localStorage
│   ├── firestoreGroupStore.ts# Implementación con Firestore (tiempo real + transacciones)
│   ├── createGroupStore.ts   # Elige Firestore si está configurado, si no localStorage
│   └── groupsStorage.ts      # localStorage: grupos locales y lista de "mis grupos"
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

## Grupos compartidos con Firebase (gratis)

Sin esta configuración la app guarda los grupos sólo en el navegador de cada persona. Para compartirlos:

1. Entrá a https://console.firebase.google.com y creá un proyecto (podés desactivar Google Analytics).
2. En **Compilación → Firestore Database** tocá **Crear base de datos**, elegí una ubicación (ej. `southamerica-east1`) y modo **producción**.
3. En la pestaña **Reglas**, pegá el contenido de [`firestore.rules`](firestore.rules) y tocá **Publicar**.
4. En **Configuración del proyecto → Tus apps**, agregá una app **Web** (`</>`). Firebase te muestra un objeto `firebaseConfig`.
5. Copiá `.env.example` como `.env` y completá los valores con ese `firebaseConfig`. Estos datos **no son secretos** (quedan visibles en cualquier app web con Firebase); la seguridad la dan las reglas. Por eso `.env` se sube al repo y GitHub Pages lo usa al compilar.

**Cómo funciona el acceso:** cada grupo es un documento de Firestore identificado por un UUID imposible de adivinar, y tiene además un código corto de 6 caracteres (colección `codes`) para unirse escribiéndolo. Las reglas permiten leer y editar un grupo a quien conoce su id (es decir, a quien tiene el link), pero no permiten listar grupos, así que nadie puede ver los grupos de otros. Es el mismo modelo que "cualquiera con el link" de Google Docs. "Mis grupos" es la lista de grupos que cada navegador creó o abrió.

**Probar localmente con el emulador** (requiere Java):

```bash
npx firebase-tools emulators:start --only firestore --project demo-salda
# en otra terminal, con VITE_FIREBASE_PROJECT_ID=demo-salda y
# VITE_FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 en .env.local:
npm run dev
```

## Publicación en GitHub Pages

El workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) corre los tests, compila y publica en `https://<usuario>.github.io/Gastos/` en cada push a `main`. Hay que activarlo una vez en **Settings → Pages → Source: GitHub Actions**.

## Tests

```bash
npm test
```

Cubren la lógica matemática: división equitativa ($30.000 / 3), centavos ($100 / 3), uno y varios montos personalizados, personalizados que superan el total, agregar/quitar participantes, balances que suman 0, liquidaciones que dejan a todos en 0 (incluyendo casos aleatorios), los dos escenarios completos (bar/cine/taxi y la cena de $63.000), formato/parseo de dinero y validaciones.
