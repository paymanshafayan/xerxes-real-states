/**
 * Cloudflare's Email Address Obfuscation (Scrape Shield) rewrites every
 * visible email address in the HTML and injects a **parser-blocking** loader
 * for `/cdn-cgi/scripts/…/email-decode.min.js` wherever one appears.
 * Lighthouse flags that blocking request in the critical request chain
 * (~0.5 s on xerxes.biz) and it delays first paint for every visitor.
 *
 * Cloudflare's official opt-out is to wrap email addresses in
 * `<!--email_off--> … <!--/email_off-->` HTML comments — the content is then
 * passed through untouched and no decoder script is injected. React cannot
 * emit raw HTML comments from JSX, hence the hidden spans with
 * dangerouslySetInnerHTML (the comments sit in the HTML stream around the
 * email, which is all the Cloudflare rewriter looks at; the spans themselves
 * render nothing).
 *
 * Docs: Cloudflare → Scrape Shield → Email Address Obfuscation.
 */
export default function EmailOff({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span
        hidden
        dangerouslySetInnerHTML={{ __html: "<!--email_off-->" }}
      />
      {children}
      <span
        hidden
        dangerouslySetInnerHTML={{ __html: "<!--/email_off-->" }}
      />
    </>
  );
}
