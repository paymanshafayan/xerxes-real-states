# R2 setup for APK delivery

`Admin → App Downloads` uploads signed customer and staff APKs directly to Cloudflare R2. If R2 is not configured the admin panel falls back to **persistent local storage** on the server volume — see "Local storage fallback" below.

Set these production environment variables before uploading an APK:

Set these production environment variables before uploading an APK:

```dotenv
R2_ACCOUNT_ID=<Cloudflare account ID>
R2_ACCESS_KEY_ID=<R2 API token access key>
R2_SECRET_ACCESS_KEY=<R2 API token secret>
R2_BUCKET=<bucket name>
R2_PUBLIC_URL=https://cdn.example.com
```

## Bucket requirements

1. Create an R2 bucket and configure a public custom domain (recommended), such as `cdn.example.com`.
2. Set that public domain as `R2_PUBLIC_URL`; do not include a trailing slash.
3. Create an R2 API token with **Object Read & Write** access limited to this bucket.
4. Add the variables above to the hosting service and redeploy.

APK objects are written under `apps/client/` and `apps/staff/` with a content-disposition attachment header. Replacing or deleting an APK in the admin panel also removes its previous R2 object when its key is available.

The bucket's public domain is expected to serve APK files with the normal `application/vnd.android.package-archive` MIME type. If a CDN or WAF is placed in front of it, allow downloads for the `apps/` prefix.

## Local storage fallback (when R2 is not configured)

If the `R2_*` variables are missing (or `R2_PUBLIC_URL` is unset), APK uploads are written to the **server volume** at `public/downloads/apps/{client,staff}/` and served through the download route `GET /uploads/apps/<app>/<file>` (see `src/app/uploads/apps/[...path]/route.ts`).

Requirements so published links never break across redeploys:

1. Mount a **persistent volume** at `/app/public/downloads` (the Railway deploy workflow `.github/workflows/deploy.yml` creates and reuses this volume automatically).
2. The published URL scheme is always `/uploads/apps/<app>/<file>`, regardless of where the file physically lives, so links stored in the admin config keep working. The route also serves legacy files still present under `public/uploads/apps/`.

> Note: with R2 configured, the saved link points at your R2 public URL instead (e.g. `https://cdn.xerxes.com/apps/client/<file>.apk`); the local route is only used for volume-backed uploads.
