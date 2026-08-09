# R2 setup for APK delivery

`Admin → App Downloads` uploads signed customer and staff APKs directly to Cloudflare R2. There is intentionally **no local-filesystem fallback**: a deployment/redeploy must never make a published APK disappear.

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
