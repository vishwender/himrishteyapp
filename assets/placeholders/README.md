# Profile placeholders


## Square-bottom variants — 2026-10-29

Active assets: `profile-male-square.png` and `profile-female-square.png`. Built-in image_gen edits extend clothing to straight lower canvas edges while preserving transparent upper backgrounds. Earlier variants retained.

Prompts:

Edit target: supplied transparent male illustrated portrait. Extend the purple shirt, white T-shirt and shoulders naturally downwards and sideways so the portrait is cropped by a perfectly straight horizontal bottom edge and straight left/right canvas edges in the lower portion. Fill both bottom corners with clothing; remove the circular/oval cutout silhouette entirely. Square canvas. Keep transparent background around the hair and upper shoulders, with true alpha. Preserve face, hairstyle, expression, colors, proportions and illustration style. No circle, no rounded bottom, no background or shadow. This is a square-cropped bust portrait, not a circular avatar.

Precise edit to supplied male portrait: fill the entire bottommost 40-pixel strip with the natural continuation of the purple shirt and white T-shirt immediately above it. Remove every transparent gap, blue/white artifact and uneven edge in that strip. Clothing must extend solidly through both bottom corners and all the way to the straight bottom canvas boundary. Keep all other pixels, face, hair, illustration, framing and transparent background around upper body unchanged. No rounded lower silhouette. Output transparent PNG.

Edit target: supplied transparent female illustrated portrait. Extend the lavender clothing, long hair where appropriate and shoulders naturally downwards and sideways so the bust is cropped by a perfectly straight horizontal bottom edge at the canvas boundary and straight left/right canvas edges in the lower portion. Fill both bottom corners fully with clothing/hair; remove the circular/oval cutout silhouette entirely. Square canvas. Keep transparent background around the hair and upper shoulders, true alpha. Preserve face, hairstyle, expression, earrings, bindi, clothing colors/pattern, proportions and illustration style. No circle, no rounded bottom, no shadow or background. Clean solid clothing reaching the bottommost pixel row, no transparent strip or ragged cutout along bottom. Square-cropped bust portrait, not circular avatar.


User-supplied artwork added on 2026-10-29, copied without image editing:

- `profile-male.png`: ChatGPT Image Oct 29, 2026, 05_08_07 PM-1.png
- `profile-female.png`: ChatGPT Image Oct 29, 2026, 05_08_09 PM-2.png

Used for explicitly male/female profiles with missing or failed photos. Unknown gender retains a neutral icon. Placeholder images are identified as placeholders for accessibility and are not uploaded as member photos.
## Transparent variants — 2026-10-29

Active assets: `profile-male-transparent.png` and `profile-female-transparent.png`. Created with the built-in image_gen tool via the imagegen skill; original supplied PNGs retained. Both outputs are 1254 × 1254 PNGs with alpha.

Male edit prompt:

Use case: background-extraction. Edit target: the attached male illustrated profile portrait. Remove only the entire background, including the lavender circle and pale outer square, replacing all background pixels with true transparent alpha. Preserve the man's face, hair, ears, neck, purple shirt, white T-shirt, colors, illustration style, pose, proportions and existing rounded bottom portrait silhouette. No redraw, no new objects, no shadow or halo. Output a clean transparent PNG portrait cutout for a profile placeholder.

Female edit prompt:

Use case: background-extraction. Edit target: the attached female illustrated profile portrait. Remove only the entire background, including the lavender circle and white outer square, replacing all background pixels with true transparent alpha. Preserve the woman's face, hair and fine strands, ears, earrings, bindi, neck, lavender clothing, colors, illustration style, pose, proportions and existing rounded bottom portrait silhouette. No redraw, no new objects, no shadow or halo. Output a clean transparent PNG portrait cutout for a profile placeholder.
