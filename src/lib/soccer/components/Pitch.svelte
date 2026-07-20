<script lang="ts">
	// Pure-CSS soccer pitch — a drop-in replacement for the soccer-field.svg
	// <img>. It renders the same markings the asset did, but as positioned
	// elements so the pitch fills whatever box the field-wrapper hands down
	// (like the football field) without the SVG-stretch quirks on Safari/iOS.
	//
	// Two-tier scaling strategy (see docs discussion): the *surface* — stripes,
	// boundary, penalty/goal boxes, halfway line — fills the box edge to edge, so
	// a slightly-wide pitch is imperceptible. The *free-floating curves* — centre
	// circle and the three spots — stay perfectly round via aspect-ratio:1, since
	// a squashed centre circle is the one thing that screams "wrong". The curves
	// that attach to rectangles — corner arcs and penalty D's — distort with the
	// surface so they stay glued to their boxes under any container ratio.
	//
	// All percentages below are derived from the original asset's coordinate
	// system: viewBox -212 -145 424 290, playing surface x=-190..190 (w 380),
	// y=-130..130 (h 260). Marking coords are expressed relative to the surface
	// (x% = (x+190)/380, y% = (y+130)/260) unless noted as board-level.
</script>

<div class="pitch" aria-hidden="true">
	<!-- Playing surface: mown stripes + boundary, holds all pitch markings. -->
	<div class="surface">
		<!-- Halfway line (x=0). -->
		<div class="halfway"></div>

		<!-- Centre circle (r=28) — true round, free-floating. -->
		<div class="centre-circle"></div>

		<!-- Penalty boxes (x -190..-110 / 110..190, y ±90). -->
		<div class="pbox left"></div>
		<div class="pbox right"></div>

		<!-- Goal boxes (x -190..-158.5 / 158.5..190, y ±30). -->
		<div class="gbox left"></div>
		<div class="gbox right"></div>

		<!-- Penalty arcs (the "D"): an ellipse centred beyond the penalty spot,
		     clipped by a wrapper whose edge rides the penalty-box line, so the
		     arc's ends stay welded to that line under any container ratio. -->
		<div class="parc left"><span class="arc"></span></div>
		<div class="parc right"><span class="arc"></span></div>

		<!-- Corner arcs (r=12.5) — quarter circles clipped by the surface. -->
		<div class="corner tl"></div>
		<div class="corner tr"></div>
		<div class="corner bl"></div>
		<div class="corner br"></div>

		<!-- Spots (centre + two penalty spots) — true round. -->
		<div class="spot centre"></div>
		<div class="spot pen left"></div>
		<div class="spot pen right"></div>
	</div>

	<!-- Goals: net-mesh pocket + frame + posts, board-level (in the surround). -->
	<div class="goal left">
		<span class="post top"></span>
		<span class="post bottom"></span>
	</div>
	<div class="goal right">
		<span class="post top"></span>
		<span class="post bottom"></span>
	</div>
</div>

<style>
	.pitch {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		/* Grass surround (the board margin, #14532d). */
		background: var(--color-field-border);
		overflow: hidden;
	}

	/* Playing surface — inset from the board by the asset's margin
	   (x 22/424, y 15/290) and painted with 8 mown stripes. overflow:hidden
	   trims the corner arcs to quarter circles. */
	.surface {
		position: absolute;
		left: 5.1887%;
		top: 5.1724%;
		width: 89.6226%;
		height: 89.6552%;
		box-sizing: border-box;
		border: 3px solid var(--color-on-accent);
		overflow: hidden;
		/* Eight vertical bands: a,b repeated four times across the surface. */
		background-image: repeating-linear-gradient(
			90deg,
			var(--color-pitch-stripe-a) 0 12.5%,
			var(--color-pitch-stripe-b) 12.5% 25%
		);
	}

	/* Shared white line look for the drawn markings. */
	.halfway,
	.pbox,
	.gbox,
	.arc,
	.corner,
	.centre-circle {
		position: absolute;
		border-color: var(--color-on-accent);
		border-style: solid;
	}

	.halfway {
		left: 50%;
		top: 0;
		bottom: 0;
		border-width: 0 0 0 3px;
		transform: translateX(-50%);
	}

	/* Centre circle: diameter 56 as a share of surface *height* (56/260), with
	   aspect-ratio:1 so it renders as a true circle regardless of box shape. */
	.centre-circle {
		left: 50%;
		top: 50%;
		height: 21.538%;
		aspect-ratio: 1;
		border-width: 3px;
		border-radius: 50%;
		transform: translate(-50%, -50%);
	}

	/* Penalty box: right edge at x=-110 (80/380 wide), y ±90 (top 40/260,
	   height 180/260). The outer edge rides the boundary, so drop that border. */
	.pbox {
		top: 15.3846%;
		height: 69.2308%;
		width: 21.0526%;
		border-width: 3px;
	}
	.pbox.left {
		left: 0;
		border-left: none;
	}
	.pbox.right {
		right: 0;
		border-right: none;
	}

	/* Goal box: right edge at x=-158.5 (31.5/380 wide), y ±30. */
	.gbox {
		top: 38.4615%;
		height: 23.0769%;
		width: 8.2895%;
		border-width: 3px;
	}
	.gbox.left {
		left: 0;
		border-left: none;
	}
	.gbox.right {
		right: 0;
		border-right: none;
	}

	/* Penalty arc: a clip wrapper spanning the field side of the penalty-box
	   edge (x=-110 → 21.0526%), with overflow:hidden so its inner edge — the box
	   line — cuts the arc exactly there. The arc ends therefore stay welded to
	   the box under any container ratio. */
	.parc {
		position: absolute;
		top: 0;
		bottom: 0;
		overflow: hidden;
	}
	.parc.left {
		left: 21.0526%;
		right: 0;
	}
	.parc.right {
		left: 0;
		right: 21.0526%;
	}

	/* The arc itself: an ellipse fitted to the asset's D (centre x=-123.58,
	   r≈23.2 → surface 17.48%, w 12.211%, h 17.846%), re-expressed as shares of
	   the wrapper (which is 78.9474% of the surface wide, full height). Both axes
	   are sized so it distorts with the surface and stays glued to the box edge. */
	.arc {
		top: 50%;
		width: 15.468%;
		height: 17.846%;
		border-width: 3px;
		border-radius: 50%;
		transform: translate(-50%, -50%);
	}
	.parc.left .arc {
		left: -4.526%;
	}
	.parc.right .arc {
		left: 104.526%;
	}

	/* Corner arc: full circle (r=12.5 → 25/380 wide, 25/260 tall) centred on the
	   surface corner; overflow:hidden on .surface leaves the inner quarter. */
	.corner {
		width: 6.5789%;
		height: 9.6154%;
		border-width: 3px;
		border-radius: 50%;
	}
	.corner.tl {
		left: 0;
		top: 0;
		transform: translate(-50%, -50%);
	}
	.corner.tr {
		right: 0;
		top: 0;
		transform: translate(50%, -50%);
	}
	.corner.bl {
		left: 0;
		bottom: 0;
		transform: translate(-50%, 50%);
	}
	.corner.br {
		right: 0;
		bottom: 0;
		transform: translate(50%, 50%);
	}

	/* Spots — solid white, true round. Centre r=2, penalty r=1.8. */
	.spot {
		position: absolute;
		top: 50%;
		aspect-ratio: 1;
		border-radius: 50%;
		background: var(--color-on-accent);
		transform: translate(-50%, -50%);
	}
	.spot.centre {
		left: 50%;
		height: 1.5385%;
	}
	.spot.pen {
		height: 1.3846%;
	}
	.spot.pen.left {
		left: 13.9474%;
	}
	.spot.pen.right {
		left: 86.0526%;
	}

	/* Goals — board-level pockets behind each goal line (x -205..-190 in the
	   surround). Net mesh via a crosshatch gradient; frame open on the pitch
	   side; posts dot the goal-mouth corners. */
	.goal {
		position: absolute;
		top: 42.6655%;
		height: 14.669%;
		width: 3.5377%;
		box-sizing: border-box;
		background-image:
			repeating-linear-gradient(
				to right,
				oklch(1 0 0 / 0.55) 0 1px,
				transparent 1px 5px
			),
			repeating-linear-gradient(
				to bottom,
				oklch(1 0 0 / 0.55) 0 1px,
				transparent 1px 5px
			);
	}
	.goal.left {
		left: 1.6509%;
		border: 2px solid var(--color-on-accent);
		border-right: none;
	}
	.goal.right {
		right: 1.6509%;
		border: 2px solid var(--color-on-accent);
		border-left: none;
	}

	.post {
		position: absolute;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--color-on-accent);
		transform: translate(50%, -50%);
	}
	.goal.left .post {
		right: 0;
	}
	.goal.right .post {
		left: 0;
		transform: translate(-50%, -50%);
	}
	.post.top {
		top: 0;
	}
	.post.bottom {
		top: 100%;
	}
</style>
