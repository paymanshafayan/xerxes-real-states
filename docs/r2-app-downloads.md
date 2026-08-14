# R2 setup for APK delivery

`Admin → App Downloads` uploads signed customer and staff APKs with a resumable, sequential **8 MB chunked transport**. The server writes each chunk to a temporary session file and publishes the package with an atomic rename only after every byte arrives. This avoids the reverse-proxy/Cloudflare timeout that occurs when a 160 MB APK is sent as one request.

When R2 is configured, the completed file is streamed to Cloudflare R2. If R2 is unavailable, the upload automatically falls back to the persistent server volume. In both cases the admin panel stores the final public URL only after the package is complete.

Set these production environment variables before uploading an APK to R2:

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

## Upload API

The protected manager UI uses these endpoints:

- `POST /api/admin/app-downloads/upload/chunk?app=client|staff&sessionId=...&index=...&fileName=...&totalSize=...` — one raw binary chunk, at most 16 MB.
- `POST /api/admin/app-downloads/upload/finalize` — publishes a complete session.
- `DELETE /api/admin/app-downloads/upload/session?sessionId=...` — cancels a partial session.
- `POST /api/admin/app-downloads/upload` — legacy whole-file multipart/raw compatibility endpoint.

Chunks must arrive in order. Retrying an already received index is idempotent, and incomplete `.part` files are never used as the active download. A short private completion receipt makes a lost finalize response retryable; sessions and receipts expire after six hours.

## Local storage fallback (when R2 is not configured)

If the `R2_*` variables are missing (or `R2_PUBLIC_URL` is unset), APK uploads are written to the **server volume** at `public/downloads/apps/{client,staff}/` and served through:

- `GET /uploads/apps/<app>/<file>` — stable file URL.
- `GET /api/mobile-app/download` — current customer download endpoint; it checks the saved configuration on every request and streams the local file.

Requirements so published links never break across redeploys:

1. Mount a **persistent volume** at `/app/public/downloads` (the Railway deploy workflow `.github/workflows/deploy.yml` creates and reuses this volume automatically).
2. The published URL scheme is always `/uploads/apps/<app>/<file>`, regardless of where the file physically lives, so links stored in the admin config keep working. The route also serves legacy files still present under `public/uploads/apps/`.
3. Re-upload any APK that was uploaded before the persistent-volume implementation; old ephemeral files cannot be recovered after a redeploy.

> Note: with R2 configured, the saved link points at your R2 public URL instead (for example `https://cdn.xerxes.com/apps/client/<file>.apk`); the local route is only used for volume-backed uploads.
