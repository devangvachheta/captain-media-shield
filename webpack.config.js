const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

/**
 * src/router/routes.js splits every page except Dashboard into its own
 * React.lazy() chunk to keep the main index.js bundle under wp-scripts'
 * size warning threshold. By default, webpack/mini-css-extract-plugin
 * mirrors that JS split for CSS too -- giving each route its own
 * "<route>.css" / "<route>-rtl.css" pair (e.g. edit-feed.css, docs.css).
 *
 * That's a problem for RTL: WordPress only knows how to swap in an
 * "-rtl.css" file for stylesheets that are actually enqueued via
 * wp_enqueue_style() + wp_style_add_data(..., 'rtl', 'replace') (see
 * includes/admin/class-capms-menu.php). The per-route CSS chunks above
 * are injected directly by webpack's own runtime when a lazy chunk loads
 * -- they never pass through WP's style queue, so the RTL swap can never
 * reach them, and RTL site visitors would always get the LTR version of
 * every page except the Dashboard.
 *
 * The fix: keep the JS split (that's what actually fixes the size
 * warning), but force ALL stylesheets -- including ones only imported by
 * a lazy-loaded route -- back into the single main "index" CSS output.
 * That's the file WordPress enqueues and RTL-swaps, so RTL now works
 * everywhere again, exactly as it did before routes were split.
 */
module.exports = {
	...defaultConfig,
	optimization: {
		...defaultConfig.optimization,
		splitChunks: {
			...defaultConfig.optimization.splitChunks,
			cacheGroups: {
				...defaultConfig.optimization.splitChunks.cacheGroups,
				style: {
					type: 'css/mini-extract',
					// Broadened from wp-scripts' default (which only
					// matches Gutenberg's "style.scss" block convention)
					// to catch every stylesheet in the project.
					test: /\.(sc|sa|c)ss$/,
					chunks: 'all',
					enforce: true,
					name: 'index',
				},
				default: false,
			},
		},
	},
	performance: {
		// webpack's size-warning math adds index.css AND index-rtl.css
		// together as if a single page load downloads both - it never
		// does; a given request gets exactly one of the two depending on
		// site language direction. Excluding the RTL twin from the size
		// check reports the real per-request payload instead of double
		// counting an alternate variant that's never fetched alongside it.
		assetFilter: ( assetFilename ) => ! /-rtl\.css$/.test( assetFilename ),
	},
};
