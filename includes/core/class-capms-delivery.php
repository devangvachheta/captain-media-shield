<?php
/**
 * Front-end delivery of WebP/AVIF (.htaccess or <picture>) and WebM.
 *
 * @since      0.0.1
 *
 * @package    captain-media-shield
 * @subpackage captain-media-shield/includes/core
 */

/**
 * Exit if accessed directly.
 * */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capms_Delivery' ) ) {

	/**
	 * Capms_Delivery
	 *
	 * @since 0.0.1
	 */
	class Capms_Delivery {

		/**
		 * Marker used inside uploads/.htaccess.
		 *
		 * @var string
		 */
		const HTACCESS_MARKER = 'Captain Media Shield';

		/**
		 * Member Variable
		 *
		 * @var instance
		 */
		private static $instance;

		/**
		 * Uploads base URL / dir, resolved once per request.
		 *
		 * @var array|null
		 */
		private $uploads = null;

		/**
		 * Initiator
		 *
		 * @since 0.0.1
		 */
		public static function get_instance() {
			if ( ! isset( self::$instance ) ) {
				self::$instance = new self();
			}
			return self::$instance;
		}

		/**
		 * Hooks.
		 *
		 * @since 0.0.1
		 */
		public function __construct() {
			add_action( 'capms_settings_updated', array( __CLASS__, 'sync_htaccess' ), 10, 0 );

			if ( ! is_admin() && 'picture' === Capms_Settings::get( 'delivery_method' ) ) {
				add_filter( 'the_content', array( $this, 'capms_filter_html' ), 999 );
				add_filter( 'post_thumbnail_html', array( $this, 'capms_filter_html' ), 999 );
				add_filter( 'widget_text', array( $this, 'capms_filter_html' ), 999 );
				add_filter( 'widget_block_content', array( $this, 'capms_filter_html' ), 999 );
			}

			if ( ! is_admin() && ( Capms_Settings::get( 'webm_enabled' ) || Capms_Settings::get( 'video_poster' ) ) ) {
				add_filter( 'wp_video_shortcode', array( $this, 'capms_video_add_webm' ), 10, 2 );
				add_filter( 'render_block_core/video', array( $this, 'capms_video_block_add_webm' ), 10, 1 );
			}

			if ( ! is_admin() && Capms_Settings::get( 'gif_to_video' ) ) {
				add_filter( 'the_content', array( $this, 'capms_filter_gifs' ), 998 );
				add_filter( 'post_thumbnail_html', array( $this, 'capms_filter_gifs' ), 998 );
				add_filter( 'widget_text', array( $this, 'capms_filter_gifs' ), 998 );
				add_filter( 'widget_block_content', array( $this, 'capms_filter_gifs' ), 998 );
			}
		}

		/**
		 * Write or remove our block in uploads/.htaccess to match settings.
		 *
		 * @since 0.0.1
		 * @return bool
		 */
		public static function sync_htaccess() {
			$enabled = 'htaccess' === Capms_Settings::get( 'delivery_method' ) && ( Capms_Settings::get( 'webp_enabled' ) || Capms_Settings::get( 'avif_enabled' ) );
			return $enabled ? self::write_htaccess_rules() : self::remove_htaccess_rules();
		}

		/**
		 * uploads/.htaccess path.
		 *
		 * @since 0.0.1
		 * @return string
		 */
		private static function htaccess_path() {
			$uploads = wp_get_upload_dir();
			return trailingslashit( $uploads['basedir'] ) . '.htaccess';
		}

		/**
		 * Serve photo.jpg.avif / photo.jpg.webp in place of photo.jpg when
		 * the browser advertises support and the file exists. AVIF wins
		 * when both exist. Vary: Accept keeps CDNs/proxies from caching
		 * the wrong variant for other browsers.
		 *
		 * @since 0.0.1
		 * @return bool
		 */
		public static function write_htaccess_rules() {
			require_once ABSPATH . 'wp-admin/includes/misc.php';

			$rules = array(
				'<IfModule mod_rewrite.c>',
				'RewriteEngine On',
			);

			if ( Capms_Settings::get( 'avif_enabled' ) ) {
				$rules = array_merge(
					$rules,
					array(
						'RewriteCond %{HTTP_ACCEPT} image/avif',
						'RewriteCond %{REQUEST_FILENAME} \.(jpe?g|png)$ [NC]',
						'RewriteCond %{REQUEST_FILENAME}.avif -f',
						'RewriteRule ^(.+)\.(jpe?g|png)$ $1.$2.avif [NC,T=image/avif,E=capms_nextgen:1,L]',
					)
				);
			}

			if ( Capms_Settings::get( 'webp_enabled' ) ) {
				$rules = array_merge(
					$rules,
					array(
						'RewriteCond %{HTTP_ACCEPT} image/webp',
						'RewriteCond %{REQUEST_FILENAME} \.(jpe?g|png)$ [NC]',
						'RewriteCond %{REQUEST_FILENAME}.webp -f',
						'RewriteRule ^(.+)\.(jpe?g|png)$ $1.$2.webp [NC,T=image/webp,E=capms_nextgen:1,L]',
					)
				);
			}

			$rules = array_merge(
				$rules,
				array(
					'</IfModule>',
					'<IfModule mod_headers.c>',
					'Header append Vary Accept env=REDIRECT_capms_nextgen',
					'</IfModule>',
					'<IfModule mod_mime.c>',
					'AddType image/webp .webp',
					'AddType image/avif .avif',
					'AddType video/webm .webm',
					'</IfModule>',
				)
			);

			return (bool) insert_with_markers( self::htaccess_path(), self::HTACCESS_MARKER, $rules );
		}

		/**
		 * Remove our block from uploads/.htaccess.
		 *
		 * @since 0.0.1
		 * @return bool
		 */
		public static function remove_htaccess_rules() {
			$path = self::htaccess_path();
			if ( ! file_exists( $path ) ) {
				return true;
			}
			require_once ABSPATH . 'wp-admin/includes/misc.php';
			return (bool) insert_with_markers( $path, self::HTACCESS_MARKER, array() );
		}

		/**
		 * Are our rules currently present in uploads/.htaccess?
		 *
		 * @since 0.0.1
		 * @return bool
		 */
		public static function htaccess_active() {
			$path = self::htaccess_path();
			if ( ! file_exists( $path ) ) {
				return false;
			}
			$content = (string) file_get_contents( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			return false !== strpos( $content, '# BEGIN ' . self::HTACCESS_MARKER ) && false !== strpos( $content, 'RewriteRule' );
		}

		/**
		 * Wrap every <img> pointing into uploads in a <picture> with
		 * AVIF/WebP <source>s for whichever variants exist on disk.
		 *
		 * @since 0.0.1
		 * @param string $html HTML.
		 * @return string
		 */
		public function capms_filter_html( $html ) {
			if ( ! is_string( $html ) || false === stripos( $html, '<img' ) || is_feed() ) {
				return $html;
			}

			// Leave <img> already inside a <picture> alone.
			$parts = preg_split( '#(<picture\b.*?</picture>)#is', $html, -1, PREG_SPLIT_DELIM_CAPTURE );
			foreach ( $parts as $i => $part ) {
				if ( 0 === stripos( $part, '<picture' ) ) {
					continue;
				}
				$parts[ $i ] = preg_replace_callback( '#<img\b[^>]*>#i', array( $this, 'build_picture' ), $part );
			}

			return implode( '', $parts );
		}

		/**
		 * Build the <picture> for one <img>.
		 *
		 * @since 0.0.1
		 * @param array $match Regex match.
		 * @return string
		 */
		private function build_picture( $match ) {
			$img = $match[0];

			if ( false !== strpos( $img, 'data-capms-skip' ) ) {
				return $img;
			}

			$src    = $this->get_attr( $img, 'src' );
			$srcset = $this->get_attr( $img, 'srcset' );
			$sizes  = $this->get_attr( $img, 'sizes' );

			if ( ! $src || ! preg_match( '#\.(jpe?g|png)(\?.*)?$#i', $src ) ) {
				return $img;
			}

			$sources = '';
			$formats = array();
			if ( Capms_Settings::get( 'avif_enabled' ) ) {
				$formats['avif'] = 'image/avif';
			}
			if ( Capms_Settings::get( 'webp_enabled' ) ) {
				$formats['webp'] = 'image/webp';
			}

			foreach ( $formats as $ext => $type ) {
				$set = $this->map_srcset( $srcset ? $srcset : $src, $ext );
				if ( '' === $set ) {
					continue;
				}
				$sources .= sprintf(
					'<source type="%1$s" srcset="%2$s"%3$s>',
					esc_attr( $type ),
					esc_attr( $set ),
					$sizes ? ' sizes="' . esc_attr( $sizes ) . '"' : ''
				);
			}

			if ( '' === $sources ) {
				return $img;
			}

			return '<picture class="capms-picture">' . $sources . $img . '</picture>';
		}

		/**
		 * Map each URL in a srcset to its next-gen sibling. Candidates
		 * without a sibling on disk are dropped; if none have one, ''.
		 *
		 * @since 0.0.1
		 * @param string $srcset srcset (or single URL).
		 * @param string $ext    webp|avif.
		 * @return string
		 */
		private function map_srcset( $srcset, $ext ) {
			$out = array();
			foreach ( explode( ',', $srcset ) as $candidate ) {
				$candidate = trim( $candidate );
				if ( '' === $candidate ) {
					continue;
				}
				$pieces     = preg_split( '/\s+/', $candidate, 2 );
				$url        = $pieces[0];
				$descriptor = isset( $pieces[1] ) ? ' ' . $pieces[1] : '';

				$path = $this->url_to_path( $url );
				if ( $path && is_file( $path . '.' . $ext ) ) {
					$out[] = strtok( $url, '?' ) . '.' . $ext . $descriptor;
				}
			}
			return implode( ', ', $out );
		}

		/**
		 * Convert an uploads URL to an absolute path (false otherwise).
		 *
		 * @since 0.0.1
		 * @param string $url URL.
		 * @return string|false
		 */
		private function url_to_path( $url ) {
			if ( null === $this->uploads ) {
				$this->uploads = wp_get_upload_dir();
			}

			$url     = strtok( html_entity_decode( $url ), '?' );
			$baseurl = set_url_scheme( $this->uploads['baseurl'] );
			$url     = set_url_scheme( $url );

			if ( 0 === strpos( $url, '//' ) ) {
				$url = ( is_ssl() ? 'https:' : 'http:' ) . $url;
			}
			if ( 0 !== strpos( $url, $baseurl ) ) {
				return false;
			}

			$relative = rawurldecode( substr( $url, strlen( $baseurl ) ) );
			if ( false !== strpos( $relative, '..' ) ) {
				return false;
			}

			return untrailingslashit( $this->uploads['basedir'] ) . $relative;
		}

		/**
		 * Read one attribute value from a tag.
		 *
		 * @since 0.0.1
		 * @param string $tag  Tag HTML.
		 * @param string $attr Attribute.
		 * @return string
		 */
		private function get_attr( $tag, $attr ) {
			if ( preg_match( '#\s' . preg_quote( $attr, '#' ) . '\s*=\s*(["\'])(.*?)\1#is', $tag, $m ) ) {
				return $m[2];
			}
			return '';
		}

		/**
		 * Add the generated poster image to <video> tags that have none.
		 *
		 * @since 0.1.0
		 * @param string $html HTML.
		 * @return string
		 */
		private function inject_poster( $html ) {
			if ( ! Capms_Settings::get( 'video_poster' ) || ! is_string( $html ) || false === stripos( $html, '<video' ) ) {
				return $html;
			}

			return preg_replace_callback(
				'#<video\b[^>]*>#i',
				function ( $m ) use ( $html ) {
					$tag = $m[0];
					if ( preg_match( '#\sposter\s*=#i', $tag ) ) {
						return $tag;
					}

					$src = $this->get_attr( $tag, 'src' );
					if ( ! $src && preg_match( '#<source\b[^>]*src=(["\'])(.*?)\1#i', $html, $sm ) ) {
						$src = $sm[2];
					}
					if ( ! $src ) {
						return $tag;
					}

					$path = $this->url_to_path( $src );
					if ( ! $path || ! is_file( $path . '.poster.jpg' ) ) {
						return $tag;
					}

					return preg_replace( '#<video\b#i', '<video poster="' . esc_url( strtok( $src, '?' ) . '.poster.jpg' ) . '"', $tag, 1 );
				},
				$html
			);
		}

		/**
		 * Swap animated GIFs that have an MP4 / WebM companion for a muted,
		 * looping <video>. The original <img> stays inside as a fallback.
		 *
		 * @since 0.1.0
		 * @param string $html HTML.
		 * @return string
		 */
		public function capms_filter_gifs( $html ) {
			if ( ! is_string( $html ) || false === stripos( $html, '.gif' ) || false === stripos( $html, '<img' ) || is_feed() ) {
				return $html;
			}

			// Leave <img> already inside a <video> / <picture> alone.
			$parts = preg_split( '#(<video\b.*?</video>|<picture\b.*?</picture>)#is', $html, -1, PREG_SPLIT_DELIM_CAPTURE );
			foreach ( $parts as $i => $part ) {
				if ( 0 === stripos( $part, '<video' ) || 0 === stripos( $part, '<picture' ) ) {
					continue;
				}
				$parts[ $i ] = preg_replace_callback( '#<img\b[^>]*>#i', array( $this, 'build_gif_video' ), $part );
			}

			return implode( '', $parts );
		}

		/**
		 * Build the <video> for one GIF <img>.
		 *
		 * @since 0.1.0
		 * @param array $match Regex match.
		 * @return string
		 */
		private function build_gif_video( $match ) {
			$img = $match[0];

			if ( false !== strpos( $img, 'data-capms-skip' ) ) {
				return $img;
			}

			$src = $this->get_attr( $img, 'src' );
			if ( ! $src || ! preg_match( '#\.gif(\?.*)?$#i', $src ) ) {
				return $img;
			}

			$path = $this->url_to_path( $src );
			if ( ! $path || ! is_file( $path . '.mp4' ) ) {
				return $img;
			}

			$base    = strtok( $src, '?' );
			$sources = '';
			if ( is_file( $path . '.webm' ) ) {
				$sources .= '<source src="' . esc_url( $base . '.webm' ) . '" type="video/webm" />';
			}
			$sources .= '<source src="' . esc_url( $base . '.mp4' ) . '" type="video/mp4" />';

			$class = trim( 'capms-gif ' . $this->get_attr( $img, 'class' ) );
			$attrs = ' class="' . esc_attr( $class ) . '"';
			foreach ( array( 'width', 'height' ) as $dim ) {
				$value = $this->get_attr( $img, $dim );
				if ( '' !== $value ) {
					$attrs .= ' ' . $dim . '="' . esc_attr( $value ) . '"';
				}
			}
			$alt = $this->get_attr( $img, 'alt' );
			if ( '' !== $alt ) {
				$attrs .= ' role="img" aria-label="' . esc_attr( $alt ) . '"';
			}

			return '<video' . $attrs . ' autoplay loop muted playsinline preload="metadata">' . $sources . $img . '</video>';
		}

		/**
		 * Nginx rules for AVIF / WebP delivery (shown in the admin so
		 * people on Nginx get the same "same URL" delivery as .htaccess).
		 *
		 * @since 0.1.0
		 * @return string
		 */
		public static function get_nginx_snippet() {
			$avif = (bool) Capms_Settings::get( 'avif_enabled' );
			$webp = (bool) Capms_Settings::get( 'webp_enabled' );

			if ( ! $avif && ! $webp ) {
				return '# Turn on WebP and / or AVIF in Images & Formats to get Nginx rules.';
			}

			$uploads = wp_get_upload_dir();
			$path    = '/' . trim( (string) wp_parse_url( $uploads['baseurl'], PHP_URL_PATH ), '/' );
			$regex   = preg_quote( $path, '#' );

			$lines   = array();
			$lines[] = '# Captain Media Shield - serve AVIF / WebP from the same image URL.';
			$lines[] = '';
			$lines[] = '# 1) Add the map block(s) inside the http { } context';
			$lines[] = '#    (for example in /etc/nginx/conf.d/captain-media-shield.conf).';
			$try     = array();
			if ( $avif ) {
				$lines[] = 'map $http_accept $capms_avif {';
				$lines[] = '    default          ".capms-none";';
				$lines[] = '    "~*image/avif"   ".avif";';
				$lines[] = '}';
				$try[]   = '$uri$capms_avif';
			}
			if ( $webp ) {
				$lines[] = 'map $http_accept $capms_webp {';
				$lines[] = '    default          ".capms-none";';
				$lines[] = '    "~*image/webp"   ".webp";';
				$lines[] = '}';
				$try[]   = '$uri$capms_webp';
			}
			$lines[] = '';
			$lines[] = '# 2) Add this location block inside your server { } block, then reload Nginx.';
			$lines[] = '#    Make sure your mime.types file contains image/avif (avif) and image/webp (webp).';
			$lines[] = 'location ~* ^' . $regex . '/.+\.(jpe?g|png)$ {';
			$lines[] = '    add_header Vary Accept;';
			$lines[] = '    try_files ' . implode( ' ', $try ) . ' $uri =404;';
			$lines[] = '}';

			return implode( "\n", $lines );
		}

		/**
		 * [video] shortcode: offer the WebM copy first when it exists.
		 *
		 * @since 0.0.1
		 * @param string $output Shortcode HTML.
		 * @param array  $atts   Attributes.
		 * @return string
		 */
		public function capms_video_add_webm( $output, $atts ) {
			unset( $atts );
			return $this->inject_webm_sources( $this->inject_poster( $output ) );
		}

		/**
		 * core/video block: same as the shortcode.
		 *
		 * @since 0.0.1
		 * @param string $content Block HTML.
		 * @return string
		 */
		public function capms_video_block_add_webm( $content ) {
			return $this->inject_webm_sources( $this->inject_poster( $content ) );
		}

		/**
		 * Turn <video src="x.mp4"> / <source src="x.mp4"> into an extra
		 * <source type="video/webm" src="x.mp4.webm"> placed first.
		 *
		 * @since 0.0.1
		 * @param string $html HTML.
		 * @return string
		 */
		private function inject_webm_sources( $html ) {
			if ( ! Capms_Settings::get( 'webm_enabled' ) || ! is_string( $html ) || false === stripos( $html, '<video' ) || false !== stripos( $html, 'video/webm' ) ) {
				return $html;
			}

			return preg_replace_callback(
				'#(<video\b[^>]*>)#i',
				function ( $m ) use ( $html ) {
					$tag = $m[1];
					$src = $this->get_attr( $tag, 'src' );

					if ( ! $src && preg_match( '#<source\b[^>]*src=(["\'])(.*?)\1#i', $html, $sm ) ) {
						$src = $sm[2];
					}
					if ( ! $src ) {
						return $tag;
					}

					$path = $this->url_to_path( $src );
					if ( ! $path || ! is_file( $path . '.webm' ) ) {
						return $tag;
					}

					$webm = strtok( $src, '?' ) . '.webm';
					$out  = '<source type="video/webm" src="' . esc_url( $webm ) . '" />';

					// A src attribute on <video> wins over <source>, so move it
					// into a <source> after the WebM one.
					if ( $this->get_attr( $tag, 'src' ) ) {
						$tag  = preg_replace( '#\ssrc\s*=\s*(["\']).*?\1#i', '', $tag );
						$out .= '<source src="' . esc_url( $src ) . '" />';
					}

					return $tag . $out;
				},
				$html
			);
		}
	}

	Capms_Delivery::get_instance();
}
