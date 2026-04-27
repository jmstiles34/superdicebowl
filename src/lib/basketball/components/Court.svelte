<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		className?: string;
		homeLogo?: string;
		homeColor?: string;
		homeSecondaryColor?: string;
		possession?: string;
		svgOverlay?: Snippet;
	};

	let { className = '', homeLogo, homeColor, homeSecondaryColor, possession, svgOverlay }: Props =
		$props();

	// Away attacks the right hoop, Home attacks the left hoop
	const leftActive = $derived(possession === 'Home');
	const rightActive = $derived(possession === 'Away');
</script>

<div class={`basketball-court-svg ${className}`}>
	<svg 
		viewBox="0 0 1600 900" 
		xmlns="http://www.w3.org/2000/svg"
		role="img"
		aria-label="Retro basketball court"
	>
		<defs>
			<!-- Court floor gradient -->
			<linearGradient id="courtFloor" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="#E67E22"/>
				<stop offset="100%" stop-color="#D35400"/>
			</linearGradient>

			<!-- Wooden floorboard pattern -->
			<pattern id="woodenFloor" x="0" y="0" width="200" height="60" patternUnits="userSpaceOnUse">
				<!-- Base floor color (light maple) -->
				<rect x="0" y="0" width="200" height="60" fill="#F5DEB3"/>
				
				<!-- Individual horizontal wooden planks running left-to-right -->
				<rect x="0" y="0" width="200" height="20" fill="#F5DEB3" stroke="#E6C2A6" stroke-width="0.5"/>
				<rect x="0" y="20" width="200" height="20" fill="#E6C2A6" stroke="#E6C2A6" stroke-width="0.5"/>
				<rect x="0" y="40" width="200" height="20" fill="#DEB887" stroke="#E6C2A6" stroke-width="0.5"/>
				
				<!-- Horizontal wood grain running the length of each plank -->
				<g stroke="#D4A574" stroke-width="0.3" opacity="0.4">
					<!-- First plank - grain runs horizontally -->
					<line x1="0" y1="4" x2="200" y2="4"/>
					<line x1="0" y1="8" x2="200" y2="8"/>
					<line x1="0" y1="12" x2="200" y2="12"/>
					<line x1="0" y1="16" x2="200" y2="16"/>
					
					<!-- Second plank - grain runs horizontally -->
					<line x1="0" y1="24" x2="200" y2="24"/>
					<line x1="0" y1="28" x2="200" y2="28"/>
					<line x1="0" y1="32" x2="200" y2="32"/>
					<line x1="0" y1="36" x2="200" y2="36"/>
					
					<!-- Third plank - grain runs horizontally -->
					<line x1="0" y1="44" x2="200" y2="44"/>
					<line x1="0" y1="48" x2="200" y2="48"/>
					<line x1="0" y1="52" x2="200" y2="52"/>
					<line x1="0" y1="56" x2="200" y2="56"/>
				</g>
				
				<!-- Wood knots (small oval shapes) -->
				<g fill="#C8A882" opacity="0.5">
					<ellipse cx="50" cy="10" rx="6" ry="1.5"/>
					<ellipse cx="130" cy="30" rx="8" ry="2"/>
					<ellipse cx="180" cy="50" rx="5" ry="1.5"/>
					<ellipse cx="25" cy="25" rx="4" ry="1"/>
					<ellipse cx="170" cy="45" rx="7" ry="2"/>
				</g>
				
				<!-- Plank end joints (staggered) -->
				<g stroke="#C8A882" stroke-width="0.8" opacity="0.6">
					<line x1="80" y1="0" x2="80" y2="20"/>
					<line x1="140" y1="20" x2="140" y2="40"/>
					<line x1="60" y1="40" x2="60" y2="60"/>
					<line x1="180" y1="0" x2="180" y2="20"/>
					<line x1="20" y1="20" x2="20" y2="40"/>
				</g>
				
				<!-- Subtle wood finish highlights -->
				<g stroke="#F8F4E6" stroke-width="0.2" opacity="0.3">
					<line x1="0" y1="2" x2="200" y2="2"/>
					<line x1="0" y1="22" x2="200" y2="22"/>
					<line x1="0" y1="42" x2="200" y2="42"/>
				</g>
				
				<!-- Plank separation shadows -->
				<g fill="#C8A882" opacity="0.3">
					<rect x="0" y="19.5" width="200" height="1"/>
					<rect x="0" y="39.5" width="200" height="1"/>
					<rect x="0" y="59.5" width="200" height="1"/>
				</g>
			</pattern>
 
			<!-- Paint area gradient -->
			<linearGradient id="paintArea" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0%" stop-color="#2ECC71"/>
				<stop offset="100%" stop-color="#27AE60"/>
			</linearGradient>
 
			<!-- Backboard gradient -->
			<linearGradient id="backboard" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="#E8E8E8"/>
				<stop offset="50%" stop-color="#CCCCCC"/>
				<stop offset="100%" stop-color="#E8E8E8"/>
			</linearGradient>
 
			<!-- Rim glow filter -->
			<filter id="rimGlow" x="-50%" y="-50%" width="200%" height="200%">
				<feGaussianBlur stdDeviation="8" result="coloredBlur"/>
				<feMerge> 
					<feMergeNode in="coloredBlur"/>
					<feMergeNode in="SourceGraphic"/>
				</feMerge>
			</filter>
 
			<!-- Net pattern -->
			<pattern id="netPattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
				<!-- Vertical net lines -->
				<line x1="2" y1="0" x2="2" y2="10" stroke="#FFFFFF" stroke-width="0.5" opacity="0.7"/>
				<line x1="4" y1="0" x2="4" y2="10" stroke="#FFFFFF" stroke-width="0.5" opacity="0.6"/>
				<line x1="6" y1="0" x2="6" y2="10" stroke="#FFFFFF" stroke-width="0.5" opacity="0.7"/>
				<line x1="8" y1="0" x2="8" y2="10" stroke="#FFFFFF" stroke-width="0.5" opacity="0.6"/>
				
				<!-- Horizontal net lines -->
				<line x1="0" y1="2" x2="10" y2="2" stroke="#FFFFFF" stroke-width="0.5" opacity="0.6"/>
				<line x1="0" y1="4" x2="10" y2="4" stroke="#FFFFFF" stroke-width="0.5" opacity="0.7"/>
				<line x1="0" y1="6" x2="10" y2="6" stroke="#FFFFFF" stroke-width="0.5" opacity="0.6"/>
				<line x1="0" y1="8" x2="10" y2="8" stroke="#FFFFFF" stroke-width="0.5" opacity="0.7"/>
				
				<!-- Net weave intersections (thicker points) -->
				<g fill="#FFFFFF" opacity="0.8">
					<circle cx="2" cy="2" r="0.3"/>
					<circle cx="4" cy="4" r="0.3"/>
					<circle cx="6" cy="6" r="0.3"/>
					<circle cx="8" cy="8" r="0.3"/>
					<circle cx="2" cy="8" r="0.3"/>
					<circle cx="8" cy="2" r="0.3"/>
				</g>
			</pattern>
		</defs>
  
		<!-- Court outer border (brown wood frame) -->
		<rect
			id="court-frame"
			x="40" y="40"
			width="1520" height="820"
			fill={homeColor ?? '#8B4513'}
			stroke={homeSecondaryColor ?? '#654321'}
			stroke-width="4"
		/>
 
		<!-- Main court surface -->
		<rect 
			id="court-floor"
      x="80" y="80" 
			width="1440" height="740" 
			fill="url(#woodenFloor)" 
			stroke="#FFFFFF" 
			stroke-width="8"
		/>
 
		<!-- Center line -->
		<line 
			id="center-line"
      x1="800" y1="80" 
			x2="800" y2="820" 
			stroke="#FFFFFF" 
			stroke-width="8"
		/>
 
		<!-- LEFT HALF COURT -->
		<g id="leftHalf">
			<!-- Three-point arc -->
			<path 
        id="left-three-point-arc"
				d="M 80 150 
				   Q 600 140 600 450 
				   Q 600 760 80 750"
				fill="none" 
				stroke="#FFFFFF" 
				stroke-width="8"
			/>
 
			<!-- Paint area (the key) -->
			<rect
				id="left-paint-area"
				x="80" y="320"
				width="340" height="260"
				fill={homeColor ?? 'url(#paintArea)'}
				stroke="#FFFFFF"
				stroke-width="8"
				opacity="0.8"
			/>
 
			<!-- Free throw line -->
			<line 
        id="left-free-throw-line"
				x1="420" y1="320" 
				x2="420" y2="580" 
				stroke="#FFFFFF" 
				stroke-width="8"
			/>
 
			<!-- Free throw circle - half dashed (in paint), half solid (outside paint) -->
			<!-- Left half (inside paint) - dashed -->
			<path 
				d="M 420 370 A 80 80 0 0 0 420 530" 
				fill="none" 
				stroke="#FFFFFF" 
				stroke-width="8"
				stroke-dasharray="20 15"
			/>
			<!-- Right half (outside paint) - solid -->
			<path 
				d="M 420 370 A 80 80 0 0 1 420 530" 
				fill="none" 
				stroke="#FFFFFF" 
				stroke-width="8"
			/>

			<!-- Hoop arc - solid -->
			<path 
				d="M 180 400 A 45 50 0 0 1 180 500" 
				fill="none" 
				stroke="#FFFFFF" 
				stroke-width="8"
			/>
 
			<!-- Lane hash marks -->
			<g stroke="#FFFFFF" stroke-width="6">
				<line x1="360" y1="300" x2="360" y2="320"/>
				<line x1="320" y1="300" x2="320" y2="320"/>
				<line x1="250" y1="300" x2="250" y2="320"/>
				<line x1="230" y1="300" x2="230" y2="320"/>
              
              <line x1="360" y1="580" x2="360" y2="600"/>
				<line x1="320" y1="580" x2="320" y2="600"/>
				<line x1="250" y1="580" x2="250" y2="600"/>
				<line x1="230" y1="580" x2="230" y2="600"/>
			</g>
 
			<!-- Three-point corner lines -->
			<line x1="580" y1="80" x2="580" y2="150" stroke="#FFFFFF" stroke-width="8"/>
			<line x1="580" y1="750" x2="580" y2="820" stroke="#FFFFFF" stroke-width="8"/>
		</g>
 
		<!-- RIGHT HALF COURT (mirrored) -->
		<g id="rightHalf">
			<!-- Three-point arc -->
			<path 
        id="right-three-point-arc"
				d="M 1520 150 
				  Q 1000 140 1000 450 
				  Q 1000 760 1520 750"
				fill="none" 
				stroke="#FFFFFF" 
				stroke-width="8"
			/>
 
			<!-- Paint area (the key) -->
			<rect
				id="right-paint-area"
				x="1180" y="320"
				width="340" height="260"
				fill={homeColor ?? 'url(#paintArea)'}
				stroke="#FFFFFF"
				stroke-width="8"
				opacity="0.8"
			/>
 
			<!-- Free throw line -->
			<line 
        id="right-free-throw-line"
				x1="1180" y1="320" 
				x2="1180" y2="580" 
				stroke="#FFFFFF" 
				stroke-width="8"
			/>

			<!-- Free throw circle - half dashed (in paint), half solid (outside paint) -->
			<!-- Right half (inside paint) - dashed -->
			<path 
				d="M 1180 370 A 80 80 0 0 1 1180 530" 
				fill="none" 
				stroke="#FFFFFF" 
				stroke-width="8"
				stroke-dasharray="20 15"
			/>
			<!-- Left half (outside paint) - solid -->
			<path 
				d="M 1180 370 A 80 80 0 0 0 1180 530" 
				fill="none" 
				stroke="#FFFFFF" 
				stroke-width="8"
			/>

			<!-- Hoop arc - solid -->
			<path 
				d="M 1420 400 A 45 50 0 0 0 1420 500" 
				fill="none" 
				stroke="#FFFFFF" 
				stroke-width="8"
			/>
 
			<!-- Lane hash marks -->
			<g stroke="#FFFFFF" stroke-width="6">
				<line x1="1260" y1="300" x2="1260" y2="320"/>
				<line x1="1300" y1="300" x2="1300" y2="320"/>
				<line x1="1370" y1="300" x2="1370" y2="320"/>
				<line x1="1390" y1="300" x2="1390" y2="320"/>
              
              <line x1="1260" y1="580" x2="1260" y2="600"/>
				<line x1="1300" y1="580" x2="1300" y2="600"/>
				<line x1="1370" y1="580" x2="1370" y2="600"/>
				<line x1="1390" y1="580" x2="1390" y2="600"/>
			</g>
 
			<!-- Three-point corner lines -->
			<line x1="1020" y1="80" x2="1020" y2="150" stroke="#FFFFFF" stroke-width="8"/>
			<line x1="1020" y1="750" x2="1020" y2="820" stroke="#FFFFFF" stroke-width="8"/>
		</g>
 
		<!-- Center circle -->
		<circle
			cx="800" cy="450"
			r="100"
			fill="none"
			stroke="#FFFFFF"
			stroke-width="8"
		/>

		<!-- Center court logo -->
		{#if homeLogo}
			<image
				href={homeLogo}
				x="710" y="360"
				width="180" height="180"
				opacity="0.7"
				preserveAspectRatio="xMidYMid meet"
			/>
		{/if}
 
		<!-- BASKETBALL HOOPS -->
		<!-- Left hoop -->
			<g id="leftHoop">
				<!-- Backboard -->
				<rect
          id="left-backboard"
					x="60" y="360" 
					width="20" height="180" 
					fill="url(#backboard)" 
					stroke="#999999" 
					stroke-width="2"
					rx="4"
				/>
 
				<!-- Rim -->
				<circle
					id="left-hoop"
					cx="110" cy="450"
					r="40"
					fill="rgba(0,0,0,0.6)"
					stroke="#FF6B35"
					stroke-width="6"
					filter={leftActive ? 'url(#rimGlow)' : undefined}
				>
					{#if leftActive}
						<animate attributeName="r" values="38;42;38" dur="3s" repeatCount="indefinite"/>
						<animateColor attributeName="stroke" values="#FF6B35;#FF8F55;#FF6B35" dur="3s" repeatCount="indefinite"/>
					{/if}
				</circle>

				<!-- Net -->
				<circle
					id="left-net"
					cx="110" cy="450"
					r="30"
					fill="url(#netPattern)"
					opacity="0.6"
				>
					{#if leftActive}
						<animateTransform
							attributeName="transform"
							type="rotate"
							values="0 110 450;5 110 450;0 110 450"
							dur="4s"
							repeatCount="indefinite"
						/>
					{/if}
				</circle>

				<!-- Net Hole -->
				<circle
				id="left-net-hole" 
					cx="110" cy="450" 
					r="19" 
					fill={homeColor ?? 'url(#paintArea)'}
					stroke="#FFFFFF"
					stroke-width="1.5"
					stroke-dasharray="2 1.5"
					stroke-opacity="0.4" 
					opacity="0.8"
				>
					{#if leftActive}
					<animateTransform 
						attributeName="transform" 
						type="rotate" 
						values="0 110 450;2 110 450;0 110 450" 
						dur="4s" 
						repeatCount="indefinite"
					/>
					{/if}
				</circle>
			</g>
 
			<!-- Right hoop -->
			<g id="rightHoop">
				<!-- Backboard -->
				<rect
          id="right-backboard"
					x="1520" y="360" 
					width="20" height="180" 
					fill="url(#backboard)" 
					stroke="#999999" 
					stroke-width="2"
					rx="4"
				/>
 
				<!-- Rim -->
				<circle
					id="right-hoop"
					cx="1490" cy="450"
					r="40"
					fill="rgba(0,0,0,0.6)"
					stroke="#FF6B35"
					stroke-width="6"
					filter={rightActive ? 'url(#rimGlow)' : undefined}
				>
					{#if rightActive}
						<animate attributeName="r" values="38;42;38" dur="3s" repeatCount="indefinite"/>
						<animateColor attributeName="stroke" values="#FF6B35;#FF8F55;#FF6B35" dur="3s" repeatCount="indefinite"/>
					{/if}
				</circle>
 
				<!-- Net -->
				<circle
					id="right-net"
					cx="1490" cy="450"
					r="30"
					fill="url(#netPattern)"
					opacity="0.6"
				>
					{#if rightActive}
						<animateTransform
							attributeName="transform"
							type="rotate"
							values="0 1490 450;-5 1490 450;0 1490 450"
							dur="4s"
							repeatCount="indefinite"
						/>
					{/if}
				</circle>

				<!-- Net Hole -->
				<circle
					id="right-net-hole"
					cx="1490" cy="450"
					r="19"
					fill={homeColor ?? 'url(#paintArea)'}
					stroke="#FFFFFF"
					stroke-width="1.5"
					stroke-dasharray="2 1.5"
					stroke-opacity="0.4" 
					opacity="0.8"
				>
					{#if rightActive}
						<animateTransform
							attributeName="transform"
							type="rotate"
							values="0 1490 450;-2 1490 450;0 1490 450"
							dur="4s"
							repeatCount="indefinite"
						/>
					{/if}
				</circle>
			</g>

		{#if svgOverlay}{@render svgOverlay()}{/if}
	</svg>
</div>

<style>
	.basketball-court-svg {
		width: 100%;
	}

	.basketball-court-svg svg {
		width: 100%;
		height: auto;
		display: block;
	}
</style>
