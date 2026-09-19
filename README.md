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

## Backend changes

```
npm run deploy     # push convex/ to production
npm run seed       # seed demo roles and candidates (no-op if roles exist)
```

## Screenshots

```
npm run shot -- http://localhost:5180 out.png [clickSelector] [width] [height]
```
