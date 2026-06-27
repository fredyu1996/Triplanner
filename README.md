# 🗺️ Triplanner

Plan trips and itineraries on a map. Drop checkpoints along your route, tick them
off as you go, jot down what to order at each restaurant, and list things to do
around the area.

Everything runs in the browser and saves to `localStorage` — no account, no
backend, no API keys.

## Features

- **Trips** — create as many trips as you like and switch between them.
- **Map route** — click anywhere on the map to drop a checkpoint. Checkpoints are
  auto-connected into an ordered route line. Drag a pin to reposition it.
- **Checkpoints** — each stop is a *Place*, *Restaurant*, or *Activity*, with notes
  and a **Visited** checkbox to tick off as you travel.
- **What to order** — give any restaurant a checklist of dishes to try, each with an
  optional note (price, "must try", dietary info) and an *ordered* tick.
- **Things to do nearby** — attach a checklist of activities to any checkpoint.
- **Itinerary** — a numbered, reorderable list of every stop with live
  visited progress.

The map uses [OpenStreetMap](https://www.openstreetmap.org/) tiles via
[Leaflet](https://leafletjs.com/) — free and key-free, but it needs an internet
connection to load the map tiles.

## Tech stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for dev/build
- [React Leaflet](https://react-leaflet.js.org/) for the map

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default <http://localhost:5173>).

A sample "Weekend in Kyoto" trip is seeded on first run so you can see how things
fit together — delete it any time.

## Other scripts

```bash
npm run build    # type-check and build for production into dist/
npm run preview  # serve the production build locally
npm run lint     # type-check only (tsc --noEmit)
```

## Data & privacy

All data lives in your browser's `localStorage` under the key
`triplanner.state.v1`. Clearing site data wipes your trips. Nothing is sent
anywhere except the requests Leaflet makes to fetch map tiles.
