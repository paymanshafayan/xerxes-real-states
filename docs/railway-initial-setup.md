# Railway initial setup

The first-run page at `/setup` can store the PostgreSQL connection string without
requiring a Railway Variable. This requires a **Railway Volume** because the
application filesystem is replaced on deploys.

1. In the Railway service, add a Volume and mount it at `/app/data`.
2. Set the service variable `APP_CONFIG_DIR=/app/data` (this is optional when
   using the default mount path, but makes the configuration explicit).
3. Deploy the application and visit its public URL. A new installation redirects
   to `/setup`.
4. Copy the `DATABASE_URL` from the Railway PostgreSQL service and paste it into
   the setup form, then create the first manager account.

The setup process tests the connection, writes it to
`/app/data/xerxes-bootstrap.json` with owner-only permissions, generates a
random 384-bit JWT secret, and stores that secret in PostgreSQL. The connection
string and secret are never returned to the browser.

Do not delete the Volume. Deleting it removes the saved connection string; the
application will return to the setup flow on its next deployment. For managed
or multi-instance production installations, Railway Variables remain a valid
alternative: `DATABASE_URL` takes precedence over the Volume configuration.

## Database Schema & Migrations on Railway

When deploying to Railway with a PostgreSQL database attached via `DATABASE_URL`:
- The schema is defined in `src/db/schema.ts` (including tables like `page_views`, `properties`, `staff`, etc.).
- On startup (`npm start`) or during build/postinstall, the application executes `drizzle-kit push --force` (via `npm run db:push` or `npm run db:migrate`) using `drizzle.config.ts`.
- `drizzle-kit push --force` inspects `src/db/schema.ts`, connects to Railway's PostgreSQL database (`DATABASE_URL`), and automatically creates all missing tables and columns.
- If you ever need to manually synchronize the schema via Railway CLI or in a custom Deploy Command, run:
  ```bash
  npm run db:push
  ```
  or:
  ```bash
  npx drizzle-kit push --force
  ```
