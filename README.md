# Callscreen

Recruiter phone agent dashboard. Candidates apply, the agent screens the application, checks socials, calls them, and produces a final score. Recruiters watch the pipeline and take over any candidate.

## Stack

- Vite + React + TypeScript frontend in `src/`
- Convex backend in `convex/` (project `callscreen`, production only)
- Static design mock kept in `mock/index.html`

## Run

```
npm install
npm start          # http://localhost:5180, opens the browser
```

The frontend runs locally and talks to the production Convex deployment. `VITE_CONVEX_URL` lives in `.env`. There is no dev deployment and no hosted frontend.

## Demo and Live

The switch at the top right of the board picks the data source.

- **Live** reads and writes the Convex production deployment. Nothing moves unless a real event or a recruiter action moves it.
- **Demo** is UI only. It runs an in-memory copy with a simulation that adds applicants and moves people through stages. Nothing is sent to the backend. The choice is remembered per browser.

The data layer lives in `src/data/`: `convexData.ts` for live, `demoData.ts` for demo, both implementing `DataApi` from `src/types.ts`.

## Backend changes

```
npm run deploy     # push convex/ to production
npm run seed       # seed three sample roles into production (no-op if roles exist)
```

## Screenshots

```
npm run shot -- http://localhost:5180 out.png [clickSelector] [width] [height]
```
