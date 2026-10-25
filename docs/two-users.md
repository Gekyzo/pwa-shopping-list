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

## Check: un-share (SHARE-8)

Start with `npm run pair -- --reset`. Log in as A on 8081 and add `Pan A`. Log in as B on 8082
and add `Leche B`.

| # | Steps | Expected |
|---|---|---|
| 1 | A: `Ajustes` → `Compartir lista`, invite `userb@example.test`. | A's sheet lists B with `Invitación enviada` and ✕. |
| 2 | B: `Ver invitación` on the banner, `Aceptar`, confirm. | B's list shows `Pan A`, not `Leche B`. A's sheet shows `Comparte la lista`. |
| 3 | A: ✕ next to B. | B leaves A's sheet at once, with a `Deshacer` of 5 s. |
| 4 | Wait 5 s. Look at B with no reload. | Within a few seconds, B's list shows `Leche B` again (realtime, SHARE-6). B's sheet shows the owner case. |
| 5 | Invite and accept again (1, 2). B: `Dejar de compartir`. Wait 5 s. | B's list shows `Leche B`. A's sheet lists nobody. A's list keeps `Pan A`. |
| 6 | Invite again (1). B: `Ver invitación`, `Rechazar`. Wait 5 s. | The banner of B goes away. A's sheet lists nobody. |
| 7 | Invite and accept again (1, 2). A: ✕, then `Deshacer` in the toast. | After 5 s, A's sheet still shows B with `Comparte la lista`. B's list still shows `Pan A`. |

Last run: 2026-10-25, v1.5.0 plus `npm run pair`. Each step gave the expected result.
