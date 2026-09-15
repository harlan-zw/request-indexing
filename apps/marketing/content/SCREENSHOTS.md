# Article screenshots

Use real captures only when a visual helps the reader find or interpret a control.
The setup tutorial includes real Cloud and Search Console screenshots. Text-only articles remain valid when no visual is needed.
Required captures stay outstanding if browser access fails; record the next action.
No authenticated submission is authorized by this capture procedure. A later user instruction may authorize a specific temporary resource.

## Capture

The collection coordinator owns the browser. Check the user-selected Chrome connection first, including Codex browser tools.
If that connection is unavailable, use `dev-browser --help` and a unique named page. Recheck after browser restarts.
If DISPLAY is empty, use `dev-browser --headless`. Existing signed-in Chrome uses `--connect` after inspecting its tabs.
Open controls and cancel forms. Do not create Cloud projects, keys, owners, or indexing submissions for a screenshot.

Save private captures and editable manifests under `~/scratch/request-indexing-content-dogfood/`.
Publish only sanitized exports under `apps/marketing/public/images/guides/`, served as `/images/guides/` by the marketing layer.
Use native PNG capture at least two source pixels per intended CSS pixel. Measure decoded dimensions against the CSS capture region.
Do not upscale, sharpen, or reconstruct blurry UI. Recapture it.

## Annotation and privacy

Use a deterministic lossless compositor only after inspecting available tools.
Record source size, crop, density, display cap, offsets, and markers in the private manifest.
Allow numbers, arrows, and outlines only. Keep explanations in visible HTML text.
Crop account identifiers away or flatten opaque redactions into the exported pixels.
Check source format and inspect account names, URLs, avatars, metrics, and metadata.
Compare untouched pixels with the source after annotation.

## Integration

Use native figure, img, and figcaption after confirming the Comark renderer supports them.
Center images and captions. Start captions at 14px using a readable muted grey in both themes.
Provide dimensions, responsive width caps, concise state-specific alt text, capture date, and any redaction context.
The task must remain possible without seeing the image.
Check loading, sharpness at display width, mobile overflow, and keyboard access to any full-size link.
Close named task pages. Never run `dev-browser stop`.

## Verified examples

Five setup and inspection control captures are integrated in the setup tutorial. Do not infer live API success from these views.
The pilot explains supported use and ordinary-page alternatives; it needs no screenshot to establish that boundary.
A setup-guide control detail is the first candidate. Browser connection availability is checked before declaring that capture unavailable.

Initial check on 15 September 2026: Chrome discovery failed. The connection later recovered, and all three planned captures are complete.

## Capture followup, 15 September 2026

Codex Chrome control returned `CUA_REPL_ENABLED_SURFACES is required`. After the user restarted, dev-browser connected to signed-in Chrome.
Cloud API details and the empty service-account form were captured at 1200×900 CSS with 2×device density. Native PNGs are 2400×1800.
Exports: API status 1300×460, display cap 650×230; service-account form 1260×1050, cap 630×525.
The account header was cropped out. The project email preview received an opaque pixel redaction. No account or key was created.
Private raw files, geometry manifest, redaction and lossless overlay scripts: `~/scratch/request-indexing-screenshots-20260915/`.
The setup form was cancelled. The Cloud service was already enabled; capture did not enable it.

The Search Console connection recovered using a dedicated `dev-browser --browser request-indexing-chrome --connect` session.
The Add user dialog shows a blank email field and Owner selected. The dialog was cancelled without granting access.
The native source is 3320×1834. Its 540×301 CSS dialog crop exports 2160×1204, preserving four source pixels per display pixel.
Browser zoom and device density interact. Measure the actual source against element bounds before choosing crop density.
The crop excludes the account header, property details, and user table. All three planned captures are complete.

Final checks: all three exports preserve sampled source text pixels and contain no EXIF. Build, typecheck, and ESLint pass.
The tutorial renders at 390px without overflow. Full-size links work by keyboard. Captions are 14px and readable in both themes.
The unsigned local preview reports missing production credentials. Live API authorization and notification tests remain outside this capture check.

## Additional captures, 15 September 2026

URL Inspection status and Request indexing are captured for the ordinary-page guide.
The inspected documentation page was already indexed. No request or live test was submitted.
Source3360×1874; crop780×174CSS at4×density; export3120×696. Account and URL details are excluded.
The user authorized a temporary service account after five inspected projects showed no accounts.
A temporary account was created in Nuxt SEO without roles. The JSON key dialog was captured and cancelled.
No key was created. The temporary account was deleted; a reloaded service-account list confirmed no rows.
Key source3360×1874; crop560×359CSS at2×density; export1120×718. Only the dialog is published.
Both additional captures are complete.

Both additional figures passed independent factual, privacy, and rendered review at 95/100, accepted by root.
