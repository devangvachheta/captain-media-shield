const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

/**
 * Captain Media Shield Webpack Configuration.
 * Bundles all JavaScript into build/index.js and ensures all styling
 * is extracted into a single index.css and index-rtl.css pair enqueued by WordPress.
 */
module.exports = {
	...defaultConfig,
	output: {
		...defaultConfig.output,
		clean: false,
	},
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
