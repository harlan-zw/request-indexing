# Article screenshots

Use real captures only when a visual helps the reader find or interpret a control.
This collection starts without article screenshots. Text-only articles remain valid when a screenshot adds no instruction.
No authenticated submission is authorized by this capture procedure.

## Capture

The collection coordinator owns the browser. Use `dev-browser --help` and a unique named page.
If DISPLAY is empty, use `dev-browser --headless`. Existing signed-in Chrome uses `--connect` after inspecting its tabs.
Open controls and cancel forms. Do not create Cloud projects, keys, owners, or indexing submissions for a screenshot.

Save private captures and editable manifests under `~/scratch/request-indexing-content-dogfood/`.
Publish only sanitized exports under `apps/marketing/public/images/guides/`, served as `/images/guides/` by the marketing layer.
Use native PNG capture at two source pixels per intended CSS pixel. Measure decoded dimensions against the CSS capture region.
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

Pending first justified capture. Do not copy gscdump renderer paths or invent a completed visual check.
The pilot explains supported use and ordinary-page alternatives; it needs no screenshot to establish that boundary.
A setup-guide control detail is the first candidate. Browser connection availability is checked before declaring that capture unavailable.

Availability check15September2026: `dev-browser --connect` failed to discover remote-debugging Chrome. Local unsigned rendering works. No authenticated Cloud setup capture is currently available.
