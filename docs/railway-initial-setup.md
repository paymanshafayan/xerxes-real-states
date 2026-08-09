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
