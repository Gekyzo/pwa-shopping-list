# Arrival toast — design

## Context

The user wants a reminder of the list on arrival at the supermarket (Carrer de Pere Caffaro, 11,
Palma). A PWA gets a position only while it is open and visible, so the app cannot detect the
arrival by itself.

Decisions taken in the brainstorm:

| Topic | Decision |
|---|---|
| Detection | An Android automation app owns the geofence. The app has no geolocation code |
| Link | The automation opens the app URL with the query `?arrival` |
| Toast content | The count of the items of `Actual` that are not ticked |
| Empty `Actual` | No toast |

## Behaviour

- The app starts with `arrival` in the query of its URL: it shows the toast
  `N artículos por comprar en Actual.` (`1 artículo por comprar en Actual.` for one item).
- No item of `Actual` is left to buy: no toast.
- The toast stays 10 seconds, because the app opens without a tap of the user. It has no
  `Deshacer`.
- The app then removes the query from the address with `history.replaceState`, so a reload does
  not show the toast again.
- The app shows the `Actual` screen, which is the start screen already.
- An installed app that is open already: Android gives the new URL to the app, the page loads
  again, and the toast shows.

## Design

- `src/store.js`: `arrivalMessage(state)` returns the text, or `null` when nothing is left. It
  uses `tripSummary(state).left`.
- `src/app.js`: `showToast` takes an optional `ms`. At the start, after `render()`, the app reads
  `location.search`, shows the message and cleans the address. The storage warning keeps priority:
  it shows last.
- `sw.js`: no change. `respond` matches the cache with `ignoreSearch: true`, so `./?arrival`
  loads offline.
- `README.md`: the URL and the automation setup.

## Limits

- The reminder depends on the automation app: its geofence accuracy, its battery permission and
  an unlocked phone. The app cannot check them.
- The coordinates of the address live in the automation app, not in this repository.

## Out of scope

Geolocation in the app, system notifications, more than one place, a setting to turn the toast
off.
