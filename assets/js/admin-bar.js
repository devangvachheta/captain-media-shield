/**
 * Captain Media Shield - Frontend Admin Bar Image Inspector & 1-Click Optimizer
 */
(function() {
    'use strict';

    if (typeof window === 'undefined' || !document) return;

    var config = window.capms_admin_bar_vars || {};
    var i18n   = config.i18n || {};

    function inspectPageMedia() {
        var topDot     = document.getElementById('capms-bar-top-dot');
        var cardBadge  = document.getElementById('capms-bar-card-badge');
        var statTotal  = document.getElementById('capms-bar-stat-total');
        var statNextGen = document.getElementById('capms-bar-stat-nextgen');
        var statUnopt  = document.getElementById('capms-bar-stat-unoptimized');
        var descText   = document.getElementById('capms-bar-desc-text');
        var descIcon   = document.getElementById('capms-bar-desc-icon');
        var actionWrap = document.getElementById('capms-bar-action-wrap');
        var btnAction  = document.getElementById('capms-bar-btn-action');

        if (!topDot || !statTotal) return;

        var uploadsBase = config.uploads_baseurl || '/wp-content/uploads/';
        var rawImages   = Array.prototype.slice.call(document.querySelectorAll('img'));

        var totalCount     = 0;
        var nextGenCount   = 0;
        var unoptCount     = 0;
        var unoptIds       = [];
        var unoptUrls      = [];
        var seenUrls       = {};

        rawImages.forEach(function(img) {
            // Exclude admin bar itself (e.g. user avatars)
            if (img.closest('#wpadminbar')) return;

            var src = img.currentSrc || img.getAttribute('src') || '';
            if (!src || src.indexOf('data:') === 0) return;

            // Only inspect images located in WordPress uploads folder
            if (src.indexOf(uploadsBase) === -1 && src.indexOf('/wp-content/uploads/') === -1) {
                return;
            }

            // Deduplicate same image URLs on the page
            var cleanUrl = src.split('?')[0];
            if (seenUrls[cleanUrl]) return;
            seenUrls[cleanUrl] = true;

            totalCount++;

            // Detect if image is served in WebP or AVIF
            var isNextGen = false;
            if (/\.(webp|avif)$/i.test(cleanUrl)) {
                isNextGen = true;
            } else {
                // Check if parent <picture> element has a WebP/AVIF source
                var picture = img.closest('picture');
                if (picture) {
                    var sources = picture.querySelectorAll('source');
                    for (var s = 0; s < sources.length; s++) {
                        var type = sources[s].getAttribute('type') || '';
                        if (type.indexOf('webp') !== -1 || type.indexOf('avif') !== -1) {
                            isNextGen = true;
                            break;
                        }
                    }
                }
            }

            if (isNextGen) {
                nextGenCount++;
            } else {
                unoptCount++;

                // Extract attachment ID if present (wp-image-{ID} or data-id)
                var id = null;
                var classMatch = (img.className || '').match(/\bwp-image-(\d+)\b/);
                if (classMatch && classMatch[1]) {
                    id = parseInt(classMatch[1], 10);
                } else if (img.getAttribute('data-id')) {
                    id = parseInt(img.getAttribute('data-id'), 10);
                }

                if (id && unoptIds.indexOf(id) === -1) {
                    unoptIds.push(id);
                } else if (!id && unoptUrls.indexOf(cleanUrl) === -1) {
                    unoptUrls.push(cleanUrl);
                }
            }
        });

        // Update Numbers
        statTotal.textContent   = totalCount;
        statNextGen.textContent = nextGenCount;
        statUnopt.textContent   = unoptCount;

        // Update Status & Badge
        if (totalCount === 0) {
            if (topDot) {
                topDot.className = 'capms-bar-top-dot capms-bar-dot--idle';
                topDot.title = i18n.no_images_desc || 'No uploaded media images found on this page.';
            }
            if (cardBadge) {
                cardBadge.className   = 'capms-bar-card-badge capms-bar-card-badge--idle';
                cardBadge.textContent = 'No Media';
            }
            if (descIcon) descIcon.textContent = '📷';
            descText.textContent   = i18n.no_images_desc || 'No uploaded media images found on this page.';
            actionWrap.style.display = 'none';
        } else if (unoptCount === 0) {
            if (topDot) {
                topDot.className = 'capms-bar-top-dot capms-bar-dot--green';
                topDot.title = i18n.all_optimized_desc || 'All images on this page are delivered in Next Generation formats.';
            }
            if (cardBadge) {
                cardBadge.className   = 'capms-bar-card-badge capms-bar-card-badge--green';
                cardBadge.textContent = i18n.webp_active || 'WebP Active';
            }
            if (descIcon) descIcon.textContent = '✨';
            descText.textContent   = i18n.all_optimized_desc || 'All images on this page are delivered in Next Generation formats.';
            actionWrap.style.display = 'none';
        } else {
            if (topDot) {
                topDot.className = 'capms-bar-top-dot capms-bar-dot--amber';
                topDot.title = (i18n.needs_optimize_desc || '%d original image(s) on this page can be optimized.').replace('%d', unoptCount);
            }
            if (cardBadge) {
                cardBadge.className   = 'capms-bar-card-badge capms-bar-card-badge--amber';
                cardBadge.textContent = unoptCount + ' Unoptimized';
            }
            if (descIcon) descIcon.textContent = '⚡';
            var template = i18n.needs_optimize_desc || '%d original image(s) on this page can be optimized.';
            descText.textContent   = template.replace('%d', unoptCount);

            // Enable 1-Click Action Button
            actionWrap.style.display = 'block';
            var btnTemplate = i18n.optimize_btn || '⚡ Optimize Page Images (%d)';
            btnAction.textContent  = btnTemplate.replace('%d', unoptCount);
            btnAction.disabled     = false;

            // Bind click handler once
            btnAction.onclick = function(e) {
                e.preventDefault();
                btnAction.disabled    = true;
                btnAction.textContent = i18n.optimizing_btn || '⏳ Optimizing Images...';

                var formData = new FormData();
                formData.append('action', 'capms_admin_bar_optimize_page');
                formData.append('nonce', config.nonce || '');

                unoptIds.forEach(function(val) {
                    formData.append('attachment_ids[]', val);
                });
                unoptUrls.forEach(function(val) {
                    formData.append('image_urls[]', val);
                });

                fetch(config.ajax_url, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                })
                .then(function(res) { return res.json(); })
                .then(function(json) {
                    if (json && json.success) {
                        btnAction.textContent = i18n.done_btn || '✅ Done! Refreshing...';
                        setTimeout(function() {
                            window.location.reload();
                        }, 800);
                    } else {
                        btnAction.textContent = (json && json.data && json.data.message) ? json.data.message : 'Optimization failed.';
                        btnAction.disabled    = false;
                    }
                })
                .catch(function() {
                    btnAction.textContent = 'Request failed. Check server.';
                    btnAction.disabled    = false;
                });
            };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inspectPageMedia);
    } else {
        inspectPageMedia();
    }

    // Re-check after 1.5s for lazy-loaded and builder-inserted images
    window.addEventListener('load', function() {
        setTimeout(inspectPageMedia, 1500);
    });
})();
