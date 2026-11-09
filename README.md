# TripWise India

TripWise India is an Angular 20 travel-planning frontend backed by the existing Spring Boot REST API. Destination, plan and cost data are fetched from the backend; the frontend does not contain destination or price fixtures.

## Run locally

Start the Spring Boot API on `http://localhost:8080`, then run:

```bash
npm start
```

Open `http://localhost:4200/`. Angular's development proxy forwards `/api` requests to `http://localhost:8080`, avoiding a browser cross-origin request.

## Routes and data

- `/` loads destinations and category values from `GET /api/destinations`.
- `/destinations/:id` loads destination overview information from `GET /api/destinations/{id}`.
- `/destinations/:id/plans` loads available plans from `GET /api/destinations/{destinationId}/plans`.
- `/trips/compare` submits the selected values and displays the response from `POST /api/destinations/{destinationId}/plans/calculate`.
- The request body includes `startingCity`, `destinationId`, `planType` and `travellers`.

The running API's OpenAPI specification does not expose the supplied `/api/trips/calculate` path. Its actual calculation operation is `/api/destinations/{destinationId}/plans/calculate`, which the frontend uses.

The API base URL is configured in `src/environments/environment.ts` and `src/environments/environment.production.ts`. Both default to `/api`; local development resolves this through `proxy.conf.json`. Production deployments should route `/api` to the Spring Boot service through their reverse proxy or update the production environment URL.

Optional destination image, Do/Don't and helpline fields are rendered only when the backend returns values for them.

## Build and tests

```bash
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```
