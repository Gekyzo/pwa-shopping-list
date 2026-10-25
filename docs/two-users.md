# Test between two users

A feature between two people, such as a share (`docs/spec/19-sharing.md`), needs two logged-in
users at the same time. `npm run pair` gives one browser two independent copies of the app on
the local stack.

## Start

1. Start the local stack of `pwa-server` (its `RUNBOOK.md`, "Local run"): PocketBase on
   `localhost:8090`, Mailpit on `localhost:8025`.
2. Make sure the dev superuser exists (`RUNBOOK.md`, "Dev superuser"). `npm run pair` logs in
   with it to create the users.
3. Run the pair:

   ```sh
   npm run pair              # creates the missing users; an existing user keeps its data
   npm run pair -- --reset   # deletes both users first, with their records and shares
   npm run pair -- --open    # also opens both copies in Chrome
   ```

| | URL | Login |
|---|---|---|
| User A | http://localhost:8081 | `usera@example.test` / `devpassword123` |
| User B | http://localhost:8082 | `userb@example.test` / `devpassword123` |
| Invite emails | http://localhost:8025 (Mailpit) | |

Ctrl-C stops both servers. Open each URL in its own tab, at a phone viewport.

## How it works

- Each port is its own origin, so each copy has its own `localStorage`: its session, its list
  and its sync state. One browser holds both users, with no second profile.
- `apiUrl` sends every `localhost` origin to the local PocketBase (ACC-12).
- PocketBase accepts only the origins in `PB_ORIGINS` of `pwa-server/dev.env`. That list holds
  `localhost:8080`, `localhost:8081` and `localhost:8082`. After a change to it, recreate the
  container:
  `docker compose -f docker-compose.yml -f compose.dev.yml --env-file dev.env up -d --force-recreate pocketbase`.
- Both users are approved and verified, so they log in at once (ACC-4).

`npm run pair` stops with a message when PocketBase does not answer, when it refuses one of the
two origins, or when the superuser cannot log in.

## Errors

| Message | Fix |
|---|---|
| `no PocketBase at http://localhost:8090` | Start the local stack. |
| `PocketBase refuses http://localhost:808x` | Add the origin to `PB_ORIGINS`, recreate the container. |
| `the superuser ... cannot log in` | Create the dev superuser, or set `PAIR_SU_EMAIL` and `PAIR_SU_PASSWORD`. |
| `the server of user X stopped (port ... in use?)` | Stop what listens on 8081 or 8082. |

## Check: separate shared lists (SHARE-5 to SHARE-15)

Start with `npm run pair -- --reset`, at a phone viewport (412 x 900). Set `Idioma` to `Español` on
both copies. Log in as A on 8081 and add `Pan A`. Log in as B on 8082 and add `Leche B`. Do the
tables in order: each starts from the state the table before leaves.

### Invite and accept (scope `Solo Compra`)

| # | Steps | Expected |
|---|---|---|
| 1 | A: `Ajustes` → `Compartir lista`. Leave the scope `Solo Compra`. Invite `userb@example.test`. | A's sheet lists B with `Invitación enviada` and `Comparte: Solo Compra`. |
| 2 | B: `Ver invitación`, `Aceptar`, confirm. | The sheet of B reads `Compartes la lista de usera@example.test.` B's `Compra` shows the chips `Todas 2`, `Mi lista 1` and `User A 1`. `Todas` shows `Leche B` with the tag `Mía` and `Pan A` with the tag `User A`. B's own list does not change. A's sheet shows `Comparte la lista`. |
| 3 | B: open `Mi lista`, then `User A`. | `Mi lista` shows `Leche B` only. `User A` shows `Pan A` only. These chips show no tag. |

### Add, tick and finish

| # | Steps | Expected |
|---|---|---|
| 4 | B: in `Mi lista` add `Huevos B`. In `User A` add `Sal compartida`. In `Todas` add `Cafe todas`. | `Mi lista` holds `Leche B`, `Huevos B` and `Cafe todas`. `User A` holds `Pan A` and `Sal compartida`. `Todas` counts 5. |
| 5 | A: `Compra`. | A shows `Pan A` and `Sal compartida` only. A shows no chips and no tags. |
| 6 | B: in `Mi lista` add `Pan A`. | `Todas` shows two rows `Pan A`: one `Mía`, one `User A`. A still shows one `Pan A`. |
| 7 | B: tick `Sal compartida`. | Within a few seconds A shows `1 de 2 comprados` and `Comprados (1)`. |
| 8 | B: tick `Leche B`. Open `Opciones de la compra` → `Terminar compra`. | The sheet reads `2 comprados salen de la lista`. After `Terminar compra`, B shows no bought item. A shows `0 de 1 comprado`. |

### Scope

| # | Steps | Expected |
|---|---|---|
| 9 | A: `Recetas` → `+ Crear receta`, name `Pasta de A`, `Listo`. B: `Recetas`. | B shows `Aún no hay recetas`. |
| 10 | A: `Ajustes` → `Compartir lista`, tap `Comparte: Solo Compra` of B. | The scope of B reads `Comparte: Compra, Recetas y Menú`. Within a few seconds B's `Recetas` shows `Pasta de A` with the tag `User A`. |
| 11 | B: open `Pasta de A`, add the product `Tomate de receta`, `Listo`, then `Añadir a Compra`. | B's `Todas` shows `Tomate de receta` with the tag `User A`, and the `User A` chip counts it. A shows `Tomate de receta` in its list. |
| 12 | A: tap the scope of B again (back to `Solo Compra`). | Within a few seconds B's `Recetas` shows `Aún no hay recetas`. B's lists keep their items. No message appears when no change was waiting. |

### End of a share

| # | Steps | Expected |
|---|---|---|
| 13 | B: `Ajustes` → `Compartir lista` → `Dejar de compartir`. Wait 5 s. | A toast reads `Ya no compartes la lista de usera@example.test.` with `Deshacer`. After 5 s the chips and tags of B go; B shows its own items only (`Huevos B`, `Cafe todas`, `Pan A`). A's sheet shows B with `Cancelada`, `Invitar de nuevo` and ✕. |
| 14 | A: `Invitar de nuevo`. | A's sheet shows `Invitación enviada`. B shows the banner `Ver invitación`. |
| 15 | B: `Ver invitación`, `Rechazar`. Wait 5 s. | The banner of B goes away. A's sheet shows B with `Cancelada`. |
| 16 | A: `Invitar de nuevo`. B: `Ver invitación`, `Aceptar`, confirm. | B shows the chips again. B's own list is the same as in step 13. |
| 17 | A: ✕ next to B. Wait 5 s. | A's sheet loses the row of B at once, and shows no `Cancelada`. The chips of B go; B keeps its own list. |
| 18 | A: invite B again (the email field). B: accept. A: ✕, then `Deshacer` in the toast. Wait 8 s. | A's sheet still shows B with `Comparte la lista`. B's chips stay. |
| 19 | B: `Dejar de compartir`. Wait 8 s. A: ✕ next to B (`Cancelada`). Wait 8 s. | A's sheet loses the row of B. |

### Offline

Start from a share with B accepted (A invites, B accepts). Load the app of B once online.

| # | Steps | Expected |
|---|---|---|
| 20 | In `pwa-server`, stop PocketBase: `docker compose -f docker-compose.yml -f compose.dev.yml --env-file dev.env stop pocketbase`. B: tick a shared item (`Tomate de receta`) and an own item (`Huevos B`). | Both ticks show at once. `shopping.queue` and `shopping.shared.queue` of B each hold one change. |
| 21 | Start PocketBase again (`start pocketbase`). Wait 12 s. | Both queues of B are empty. In the API the shared item is `bought: true` in the space of A, and `Huevos B` is `bought: true` in the space of B only. A shows the shared tick. |

Last run: 2026-10-25, v1.5.0 plus `npm run pair`, in agent-browser at 412 x 900. Each step gave the
expected result. Screenshots of the run: `.superpowers/sdd/2026-10-25-separate-shared-lists/task-10-shots/`.
