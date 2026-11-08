# Northwind Payments — Merchant Console

The internal tool support and ops staff use to look up a payment, refund it, work the dispute queue, and issue virtual cards.

Northwind Payments is fictional. Every merchant, cardholder, amount, and card in this app is generated.

## Run it

```bash
npm install
npm run dev
```

No database, no seed step, no Docker.

## Data lives in memory

Seed data is generated at boot by `src/data/generate.ts` (merchants come from `src/data/merchants.ts`) and held in `src/data/store.ts` on `globalThis`, so dev-server reloads don't reset it. There are no seed JSON files. Route handlers read and write that store.

- Writes last for the life of the dev server and vanish on restart. That is expected.
- Persistence is tracked separately as NWP-203. **Do not add a database, an ORM, or migrations.**
- If you need more seed data, extend the generator. Never edit seed data to make a failing case disappear.

## Commands

| | |
| --- | --- |
| `npm run dev` | Dev server (store resets on restart) |
| `npm test` | Vitest, Node environment, no jsdom; picks up `src/**/*.test.ts` only |
| `npx vitest run src/lib/money.test.ts` | One test file |
| `npx vitest run -t "<name>"` | Tests matching a name |
| `npm run lint` | `next lint` |
| `npx tsc --noEmit` | Typecheck (no script for it) |

Tests run in Node without a DOM. A `.test.tsx` or a component test won't be picked up unless `vitest.config.ts` changes.

## Where the rest of the context lives

This file loads every session, so it stays short. Detail that only matters once you open a particular kind of file lives in `.claude/rules/` and loads when you do:

| Rule | Applies to |
| --- | --- |
| `money.md` | `src/lib/`, `src/app/api/`, `src/data/` |
| `api-routes.md` | `src/app/api/` |
| `cards.md` | anything card-related |
| `components.md` | `src/components/`, `src/app/` |

## Conventions

These four explain most of the code, and breaking them is how bugs get in here.

1. **Money is integer minor units.** `$250.00` is `25000`. No floats, no strings with currency symbols. Format once, at the edge, next to its currency code.
2. **Storage and bucketing are UTC.** Display converts to the merchant's timezone. Nothing else does.
3. **One query builder.** `src/data/queries.ts` (`parseFilters`, `filterPayments`, `queryPayments`, `paginate`) backs `GET /api/payments` and every list, export, and metric. A second implementation is a bug, not a shortcut.
4. **Validate on the server.** Anything from the client — column names, currencies, limits, statuses — is checked against an allowlist before it reaches a query, a filename, or the store.

## Card rules

- Generated numbers use the `4242` test BIN and a valid Luhn check digit. Nothing here may resemble a real PAN.
- The full number is returned exactly once, in the creation response. After that, last four only.
- Status is a state machine: `active ⇄ frozen`, either to `cancelled`, and `cancelled` is terminal.

## Layout

| Path | What lives there |
| --- | --- |
| `src/app/` | Console routes: overview, payments, disputes, payouts. Cards is NWP-201 and does not exist yet |
| `src/app/api/` | Route handlers |
| `src/data/` | Seed generator, the in-memory store, the query builder, and types |
| `src/components/` | Tremor-based primitives and the console's own components |
| `src/lib/` | Money, date, and CSV helpers, each with a `.test.ts` beside it. Read these before touching an amount |

## Before you push

Run `npm test`, then `/ship-ready`. The skill checks the rules above, not just formatting.
