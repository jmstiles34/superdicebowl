<script lang="ts">
// ── FieldSVG.svelte ──────────────────────────────────────────────────────────
// Renders the baseball field from an external SVG image.
// The parent page owns the <svg> wrapper so animation child components
// can be composed as siblings in the same SVG namespace.

	import fieldSvg from '$lib/images/field.svg';
</script>

<image href={fieldSvg} x="0" y="0" width="1200" height="630" />
