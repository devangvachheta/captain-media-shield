/**
 * Captain Media Shield - Frontend Admin Bar Image Inspector & 1-Click Optimizer
 */
(function() {
    'use strict';

    if (typeof window === 'undefined' || !document) return;

    var config = window.capms_admin_bar_vars || {};
    var i18n   = config.i18n || {};
    var mode   = config.inspector_mode || 'list';

    var isHighlightActive = false;
    var isListOpen        = false;
    var currentUnoptItems = [];

    function inspectPageMedia() {
        var topDot          = document.getElementById('capms-bar-top-dot');
        var cardBadge       = document.getElementById('capms-bar-card-badge');
        var statTotal       = document.getElementById('capms-bar-stat-total');
        var statNextGen     = document.getElementById('capms-bar-stat-nextgen');
        var statUnopt       = document.getElementById('capms-bar-stat-unoptimized');
        var descText        = document.getElementById('capms-bar-desc-text');
        var descIcon        = document.getElementById('capms-bar-desc-icon');
        var actionWrap      = document.getElementById('capms-bar-action-wrap');
        var btnAction       = document.getElementById('capms-bar-btn-action');
        var toolsRow        = document.getElementById('capms-bar-tools-row');
        var btnToggleList   = document.getElementById('capms-bar-btn-toggle-list');
        var toggleListLabel = document.getElementById('capms-bar-toggle-list-label');
        var btnHighlight    = document.getElementById('capms-bar-btn-highlight');
        var highlightLabel  = document.getElementById('capms-bar-highlight-label');
        var thumbListWrap   = document.getElementById('capms-bar-thumb-list-wrap');
        var thumbList       = document.getElementById('capms-bar-thumb-list');

        if (!topDot || !statTotal) return;

        var uploadsBase = config.uploads_baseurl || '/wp-content/uploads/';
        var rawImages   = Array.prototype.slice.call(document.querySelectorAll('img'));

        var totalCount     = 0;
        var nextGenCount   = 0;
        var unoptCount     = 0;
        var unoptIds       = [];
        var unoptUrls      = [];
        var unoptItems     = [];
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

            // Deduplicate same image URLs on the page for count and optimization
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

                var rawFilename = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1) || 'image';
                var filename    = decodeURIComponent(rawFilename);

                unoptItems.push({
                    element: img,
                    src: cleanUrl,
                    filename: filename,
                    id: id
                });
            }
        });

        currentUnoptItems = unoptItems;

        // Update Numbers
        statTotal.textContent   = totalCount;
        statNextGen.textContent = nextGenCount;
        statUnopt.textContent   = unoptCount;

        // Reset highlights if count is 0
        if (unoptCount === 0 && isHighlightActive) {
            document.querySelectorAll('img.capms-page-highlighted').forEach(function(el) {
                el.classList.remove('capms-page-highlighted');
            });
            isHighlightActive = false;
        }

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
            if (toolsRow) toolsRow.style.display = 'none';
            if (thumbListWrap) thumbListWrap.style.display = 'none';
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
            if (toolsRow) toolsRow.style.display = 'none';
            if (thumbListWrap) thumbListWrap.style.display = 'none';
        } else {
            if (topDot) {
                topDot.className = 'capms-bar-top-dot capms-bar-dot--amber';
                topDot.title = (i18n.needs_optimize_desc || '%d original image(s) on this page can be optimized.').replace('%d', unoptCount);
            }
            if (cardBadge) {
                cardBadge.className   = 'capms-bar-card-badge capms-bar-card-badge--amber';
                cardBadge.textContent = i18n.partially_optimized || 'Needs Optimization';
            }
            if (descIcon) descIcon.textContent = '⚡';
            var template = i18n.needs_optimize_desc || '%d original image(s) on this page can be optimized.';
            descText.textContent = template.replace('%d', unoptCount);

            // Handle Rewrite delivery (.htaccess / Nginx): verify if server serves Next-Gen under same URL
            if (config.delivery_method === 'htaccess' && unoptItems.length > 0) {
                var sampleUrl = unoptItems[0].src;
                fetch(sampleUrl, { method: 'HEAD' })
                    .then(function(res) {
                        var ct = res.headers.get('content-type') || '';
                        if (ct.indexOf('webp') !== -1 || ct.indexOf('avif') !== -1) {
                            statNextGen.textContent = totalCount;
                            statUnopt.textContent   = '0';
                            if (topDot) {
                                topDot.className = 'capms-bar-top-dot capms-bar-dot--green';
                                topDot.title = i18n.all_optimized_desc || 'All images are delivered in Next Gen format via server rewrite.';
                            }
                            if (cardBadge) {
                                cardBadge.className = 'capms-bar-card-badge capms-bar-card-badge--green';
                                cardBadge.textContent = 'Rewrite Active';
                            }
                            if (descIcon) descIcon.textContent = '⚡';
                            descText.textContent = i18n.rewrite_active_desc || 'Next-Gen delivery is active via server rewrite (.htaccess / Nginx). Images are served in WebP/AVIF automatically.';
                            actionWrap.style.display = 'none';
                            if (toolsRow) toolsRow.style.display = 'none';
                            if (thumbListWrap) thumbListWrap.style.display = 'none';
                        }
                    })
                    .catch(function() {});
            }

            // Configure Tools Row based on mode
            if (toolsRow) {
                toolsRow.style.display = 'flex';

                if (mode === 'highlight') {
                    if (btnToggleList) btnToggleList.style.display = 'none';
                    if (btnHighlight)  btnHighlight.style.display  = 'inline-flex';
                } else if (mode === 'both') {
                    if (btnToggleList) btnToggleList.style.display = 'inline-flex';
                    if (btnHighlight)  btnHighlight.style.display  = 'inline-flex';
                } else {
                    // Default 'list'
                    if (btnToggleList) btnToggleList.style.display = 'inline-flex';
                    if (btnHighlight)  btnHighlight.style.display  = 'inline-flex';
                }
            }

            // Update List Toggle Button Label
            if (toggleListLabel) {
                if (isListOpen) {
                    toggleListLabel.textContent = i18n.hide_unoptimized || 'Hide List';
                } else {
                    var listLabelTpl = i18n.view_unoptimized || 'View Images (%d)';
                    toggleListLabel.textContent = listLabelTpl.replace('%d', unoptCount);
                }
            }

            // Populate Thumbnails List
            if (thumbList) {
                thumbList.innerHTML = '';
                unoptItems.forEach(function(item) {
                    var row = document.createElement('div');
                    row.className = 'capms-bar-thumb-item';
                    row.setAttribute('role', 'button');
                    row.setAttribute('tabindex', '0');
                    row.title = (i18n.locate || 'Locate') + ' on page';

                    var imgEl = document.createElement('img');
                    imgEl.className = 'capms-bar-thumb-img';
                    imgEl.src = item.src;
                    imgEl.alt = item.filename;

                    var infoEl = document.createElement('div');
                    infoEl.className = 'capms-bar-thumb-info';

                    var nameEl = document.createElement('span');
                    nameEl.className = 'capms-bar-thumb-name';
                    nameEl.textContent = item.filename;

                    var ext = (item.filename.split('.').pop() || 'IMG').toUpperCase();
                    var metaEl = document.createElement('span');
                    metaEl.className = 'capms-bar-thumb-meta';
                    metaEl.textContent = ext + ' · ' + (i18n.locate || 'Locate');

                    infoEl.appendChild(nameEl);
                    infoEl.appendChild(metaEl);

                    var locateIcon = document.createElement('span');
                    locateIcon.className = 'capms-bar-thumb-locate-icon';
                    locateIcon.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>';

                    row.appendChild(imgEl);
                    row.appendChild(infoEl);
                    row.appendChild(locateIcon);

                    row.addEventListener('click', function(e) {
                        e.stopPropagation();
                        if (item.element) {
                            item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            item.element.classList.remove('capms-highlight-pulse');
                            void item.element.offsetWidth; // trigger reflow
                            item.element.classList.add('capms-highlight-pulse');
                            setTimeout(function() {
                                if (item.element) {
                                    item.element.classList.remove('capms-highlight-pulse');
                                }
                            }, 2500);
                        }
                    });

                    thumbList.appendChild(row);
                });
            }

            // Toggle List function
            function setListState(open) {
                isListOpen = open;
                if (!thumbListWrap) return;
                if (isListOpen) {
                    thumbListWrap.style.display = 'block';
                    if (btnToggleList) btnToggleList.classList.add('capms-tool-btn--active');
                    if (toggleListLabel) toggleListLabel.textContent = i18n.hide_unoptimized || 'Hide List';
                } else {
                    thumbListWrap.style.display = 'none';
                    if (btnToggleList) btnToggleList.classList.remove('capms-tool-btn--active');
                    if (toggleListLabel) {
                        var tpl = i18n.view_unoptimized || 'View Images (%d)';
                        toggleListLabel.textContent = tpl.replace('%d', unoptCount);
                    }
                }
            }

            if (btnToggleList) {
                btnToggleList.onclick = function(e) {
                    e.preventDefault();
                    setListState(!isListOpen);
                };
            }

            // Clicking on "Original" box in metrics also opens the list
            if (statUnopt && statUnopt.parentElement) {
                statUnopt.parentElement.style.cursor = 'pointer';
                statUnopt.parentElement.title = 'Click to view unoptimized images';
                statUnopt.parentElement.onclick = function() {
                    setListState(true);
                };
            }

            // Setup Highlight on Page Toggle
            if (btnHighlight) {
                btnHighlight.onclick = function(e) {
                    e.preventDefault();
                    isHighlightActive = !isHighlightActive;

                    currentUnoptItems.forEach(function(item) {
                        if (item.element) {
                            if (isHighlightActive) {
                                item.element.classList.add('capms-page-highlighted');
                            } else {
                                item.element.classList.remove('capms-page-highlighted');
                            }
                        }
                    });

                    if (isHighlightActive) {
                        btnHighlight.classList.add('capms-tool-btn--active');
                        if (highlightLabel) highlightLabel.textContent = i18n.highlights_active || 'Highlights Active';
                    } else {
                        btnHighlight.classList.remove('capms-tool-btn--active');
                        if (highlightLabel) highlightLabel.textContent = i18n.highlight_on_page || 'Highlight on Page';
                    }
                };
            }

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
                        if (json.data && json.data.optimized > 0) {
                            btnAction.textContent = i18n.done_btn || '✅ Done! Refreshing...';
                            setTimeout(function() {
                                window.location.reload();
                            }, 800);
                        } else {
                            btnAction.textContent = (json.data && json.data.message) ? json.data.message : (i18n.images_up_to_date || 'Images already up to date.');
                            btnAction.disabled    = false;
                        }
                    } else {
                        btnAction.textContent = (json && json.data && json.data.message) ? json.data.message : (i18n.opt_failed || 'Optimization failed.');
                        btnAction.disabled    = false;
                    }
                })
                .catch(function() {
                    btnAction.textContent = i18n.request_failed || 'Request failed. Check server.';
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
