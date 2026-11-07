(function ($) {
    'use strict';

    /**
     * Floating Toast Notification
     */
    function showToast(message, isSuccess) {
        var $toast = $('#capms-toast');
        if (!$toast.length) {
            $toast = $('<div id="capms-toast" class="capms-toast"></div>').appendTo('body');
        }
        var icon = isSuccess ? '✓ ' : '✕ ';
        var $iconSpan = $('<span class="capms-toast-icon"></span>').text(icon);
        var $msgSpan  = $('<span class="capms-toast-msg"></span>').text(message);

        $toast.removeClass('capms-toast--error capms-toast--success')
              .addClass(isSuccess ? 'capms-toast--success' : 'capms-toast--error')
              .empty().append($iconSpan).append($msgSpan)
              .stop(true, true).fadeIn(180);

        clearTimeout($toast.data('timer'));
        var timer = setTimeout(function () {
            $toast.fadeOut(250);
        }, 3500);
        $toast.data('timer', timer);
    }

    /**
     * Find table cell / card by attachment ID in list or modal view
     */
    function findTargetCard(id) {
        var $cell = $('tr#post-' + id + ' .capms-list-cell');
        if ($cell.length) {
            return $cell;
        }
        var $byData = $('[data-capms-id="' + id + '"]').closest('.capms-list-cell, .capms-meta-box');
        if ($byData.length) {
            return $byData.first();
        }
        var $col = $('tr#post-' + id + ' .column-capms_status');
        if ($col.length) {
            return $col;
        }
        return null;
    }

    // Handle Live Quality Slider input (Modal Sidebar & Generic)
    $(document).on('input change', '.capms-quality-slider', function () {
        var $slider = $(this);
        var val = parseInt($slider.val(), 10) || 80;
        var globalVal = parseInt($slider.data('global'), 10) || 80;

        // If inside Quick Quality Modal
        if ($slider.hasClass('capms-modal-range')) {
            var $modal = $('#capms-quick-quality-modal');
            $('#capms-modal-q-val').text(val + '%');

            var $qTag = $('#capms-modal-q-tag');
            if (val === globalVal) {
                $qTag.removeClass('capms-tag-badge--custom').addClass('capms-tag-badge--global').text('Global');
            } else {
                $qTag.removeClass('capms-tag-badge--global').addClass('capms-tag-badge--custom').text('Custom');
            }

            // Update preset pills
            $('.capms-modal-presets .capms-preset-pill').each(function () {
                var $pill = $(this);
                var q = $pill.data('q');
                if (q === 'default' && val === globalVal) {
                    $pill.addClass('is-active');
                } else if (parseInt(q, 10) === val) {
                    $pill.addClass('is-active');
                } else {
                    $pill.removeClass('is-active');
                }
            });

            // Update Optimize button text
            var status = $modal.data('status');
            var actionVerb = (status === 'optimized') ? 'Save & Re-optimize at ' : 'Save & Optimize at ';
            $('#capms-modal-apply-optimize .capms-btn-label').text(actionVerb + val + '%');
            return;
        }

        // Standard attachment modal box
        var $box = $slider.closest('.capms-meta-quality-box');
        var $card = $slider.closest('.capms-meta-box');

        $box.find('.capms-quality-num').text(val + '%');
        $box.find('.capms-selected-quality').val(val);

        // Update tag badge
        var $tag = $box.find('.capms-tag-badge');
        if (val === globalVal) {
            $tag.removeClass('capms-tag-badge--custom').addClass('capms-tag-badge--global').text('Global');
        } else {
            $tag.removeClass('capms-tag-badge--global').addClass('capms-tag-badge--custom').text('Custom');
        }

        // Update active preset pill
        $box.find('.capms-preset-pill').each(function () {
            var $pill = $(this);
            var q = $pill.data('q');
            if (parseInt(q, 10) === val) {
                $pill.addClass('is-active');
            } else {
                $pill.removeClass('is-active');
            }
        });

        // Update Re-optimize button text
        var $reoptBtn = $card.find('.capms-btn-reoptimize .capms-btn-label');
        if ($reoptBtn.length) {
            if (val === globalVal) {
                $reoptBtn.text('Re-optimize');
            } else {
                $reoptBtn.text('Re-optimize at ' + val + '%');
            }
        }

        // Update Optimize Now button text
        var $optBtn = $card.find('.capms-btn-optimize .capms-btn-label');
        if ($optBtn.length) {
            if (val === globalVal) {
                $optBtn.text('Optimize Now');
            } else {
                $optBtn.text('Optimize Now at ' + val + '%');
            }
        }
    });

    // Handle Quick Preset Pills click
    $(document).on('click', '.capms-preset-pill', function (e) {
        e.preventDefault();
        var $pill = $(this);
        var q = $pill.data('q');

        // Modal presets
        if ($pill.closest('.capms-modal-presets').length) {
            var $modalSlider = $('#capms-modal-slider');
            var globalQ = parseInt($modalSlider.data('global'), 10) || 80;
            var targetQ = (q === 'default') ? globalQ : parseInt(q, 10);
            $modalSlider.val(targetQ).trigger('input');
            return;
        }

        // Standard attachment modal box
        var $box = $pill.closest('.capms-meta-quality-box');
        var globalVal = parseInt($box.find('.capms-quality-slider').data('global'), 10) || 80;
        var targetVal = (q === 'default') ? globalVal : parseInt(q, 10);

        $box.find('.capms-quality-slider').val(targetVal).trigger('input');
    });

    // ══════════════════════════════════════════════════════════════════
    // QUICK QUALITY MODAL OPEN & CLOSE HANDLERS
    // ══════════════════════════════════════════════════════════════════

    $(document).on('click', '.capms-open-quick-quality', function (e) {
        e.preventDefault();
        var $btn = $(this);
        var id = $btn.data('id');
        var title = $btn.data('title') || 'Image Attachment';
        var quality = parseInt($btn.data('quality'), 10) || 80;
        var globalQ = parseInt($btn.data('global'), 10) || 80;
        var status = $btn.data('status') || 'not_optimized';
        var saved = $btn.data('saved') || '';
        var thumb = $btn.data('thumb') || '';

        var $modal = $('#capms-quick-quality-modal');
        if (!$modal.length) {
            return;
        }

        // Store active data on modal
        $modal.data('id', id);
        $modal.data('title', title);
        $modal.data('status', status);

        // Populate Preview
        $('#capms-modal-filename').text(title);
        var $thumbImg = $('#capms-modal-thumb');
        if (thumb) {
            $thumbImg.attr('src', thumb).show();
            $('.capms-modal-thumb-wrap').show();
        } else {
            $thumbImg.hide();
            $('.capms-modal-thumb-wrap').hide();
        }

        // Status badge & saved text
        var $badge = $('#capms-modal-status-badge');
        var $savedText = $('#capms-modal-saved-text');
        $badge.removeClass('capms-badge--success capms-badge--warning capms-badge--danger capms-badge--neutral');

        if (status === 'optimized') {
            $badge.addClass('capms-badge--success').html('<span class="capms-badge-dot"></span> Optimized');
            $savedText.text(saved || '').show();
        } else if (status === 'failed') {
            $badge.addClass('capms-badge--danger').html('<span class="capms-badge-dot"></span> Failed');
            $savedText.hide();
        } else {
            $badge.addClass('capms-badge--neutral').html('<span class="capms-badge-dot"></span> Not Optimized');
            $savedText.hide();
        }

        // Setup slider & presets
        var $slider = $('#capms-modal-slider');
        $slider.data('global', globalQ).val(quality);
        $('#capms-modal-preset-default').text('Default (' + globalQ + '%)');

        // Trigger input to update labels & buttons
        $slider.trigger('input');

        // Reset button states
        $('#capms-modal-apply-optimize').prop('disabled', false).removeClass('is-busy');
        $('#capms-modal-save-only').prop('disabled', false).removeClass('is-busy').text('Save Quality Only');

        // Open modal
        $modal.fadeIn(150);
        $('body').addClass('capms-modal-open');
    });

    // Close Modal
    function closeModal() {
        var $modal = $('#capms-quick-quality-modal');
        if ($modal.is(':visible')) {
            $modal.fadeOut(130);
            $('body').removeClass('capms-modal-open');
        }
    }

    $(document).on('click', '.capms-modal-close, .capms-modal-btn-cancel', function (e) {
        e.preventDefault();
        closeModal();
    });

    $(document).on('click', '#capms-quick-quality-modal', function (e) {
        if ($(e.target).is('#capms-quick-quality-modal')) {
            closeModal();
        }
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            closeModal();
        }
    });

    // ══════════════════════════════════════════════════════════════════
    // MODAL ACTIONS: "Save & Optimize Now" and "Save Quality Only"
    // ══════════════════════════════════════════════════════════════════

    // 1. Save & Optimize Now
    $(document).on('click', '#capms-modal-apply-optimize', function (e) {
        e.preventDefault();
        var $btn = $(this);
        if ($btn.hasClass('is-busy')) {
            return;
        }

        var $modal = $('#capms-quick-quality-modal');
        var id = $modal.data('id');
        var title = $modal.data('title') || 'Image';
        var globalQ = parseInt($modal.data('global'), 10) || 82;
        var quality = parseInt($('#capms-modal-slider').val(), 10) || globalQ;
        var sendQuality = (quality === globalQ) ? 'default' : quality;

        if (!id) {
            return;
        }

        $btn.addClass('is-busy').prop('disabled', true);
        var origText = $btn.find('.capms-btn-label').text();
        $btn.find('.capms-btn-label').text('Optimizing at ' + quality + '%…');
        $('#capms-modal-save-only').prop('disabled', true);

        var ajaxUrl = (window.capms_media_vars && window.capms_media_vars.ajax_url)
            ? window.capms_media_vars.ajax_url
            : (window.ajaxurl || '/wp-admin/admin-ajax.php');
        var nonce = (window.capms_media_vars && window.capms_media_vars.nonce)
            ? window.capms_media_vars.nonce
            : '';

        $.ajax({
            url: ajaxUrl,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'capms_media_library_action',
                nonce: nonce,
                id: id,
                do: 'optimize',
                context: 'column',
                quality: sendQuality
            }
        }).done(function (res) {
            $btn.removeClass('is-busy').prop('disabled', false).find('.capms-btn-label').text(origText);
            $('#capms-modal-save-only').prop('disabled', false);

            if (res && res.success && res.data && res.data.html) {
                var $target = findTargetCard(id);
                if ($target && $target.length) {
                    $target.replaceWith($(res.data.html));
                }
                closeModal();
                showToast(title + ' optimized at ' + quality + '%!', true);
            } else {
                var err = (res && res.data && res.data.message) ? res.data.message : 'Optimization failed.';
                alert(err);
            }
        }).fail(function () {
            $btn.removeClass('is-busy').prop('disabled', false).find('.capms-btn-label').text(origText);
            $('#capms-modal-save-only').prop('disabled', false);
            alert('Server error occurred during optimization.');
        });
    });

    // 2. Save Quality Only
    $(document).on('click', '#capms-modal-save-only', function (e) {
        e.preventDefault();
        var $btn = $(this);
        if ($btn.hasClass('is-busy')) {
            return;
        }

        var $modal = $('#capms-quick-quality-modal');
        var id = $modal.data('id');
        var title = $modal.data('title') || 'Image';
        var globalQ = parseInt($modal.data('global'), 10) || 82;
        var quality = parseInt($('#capms-modal-slider').val(), 10) || globalQ;
        var sendQuality = (quality === globalQ) ? 'default' : quality;

        if (!id) {
            return;
        }

        $btn.addClass('is-busy').prop('disabled', true).text('Saving…');
        $('#capms-modal-apply-optimize').prop('disabled', true);

        var ajaxUrl = (window.capms_media_vars && window.capms_media_vars.ajax_url)
            ? window.capms_media_vars.ajax_url
            : (window.ajaxurl || '/wp-admin/admin-ajax.php');
        var nonce = (window.capms_media_vars && window.capms_media_vars.nonce)
            ? window.capms_media_vars.nonce
            : '';

        $.ajax({
            url: ajaxUrl,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'capms_media_library_action',
                nonce: nonce,
                id: id,
                do: 'save_quality',
                context: 'column',
                quality: sendQuality
            }
        }).done(function (res) {
            $btn.removeClass('is-busy').prop('disabled', false).text('Save Quality Only');
            $('#capms-modal-apply-optimize').prop('disabled', false);

            if (res && res.success && res.data && res.data.html) {
                var $target = findTargetCard(id);
                if ($target && $target.length) {
                    $target.replaceWith($(res.data.html));
                }
                closeModal();
                showToast('✓ Quality setting saved (' + quality + '%)!', true);
            } else {
                var err = (res && res.data && res.data.message) ? res.data.message : 'Save failed.';
                alert(err);
            }
        }).fail(function () {
            $btn.removeClass('is-busy').prop('disabled', false).text('Save Quality Only');
            $('#capms-modal-apply-optimize').prop('disabled', false);
            alert('Server error occurred while saving quality.');
        });
    });

    // ══════════════════════════════════════════════════════════════════
    // STANDARD ROW ACTIONS (Optimize / Restore inline clicks)
    // ══════════════════════════════════════════════════════════════════

    $(document).on('click', '[data-capms-action]', function (e) {
        var $el = $(this);
        var $card = $el.closest('.capms-list-cell, .capms-meta-box');
        var action = $el.data('capms-action');
        var id = $el.data('capms-id');
        var context = $el.data('context') || ($el.closest('.column-capms_status').length ? 'column' : 'modal');
        var customQuality = $card.find('.capms-selected-quality').val() || '';

        if (!action || !id) {
            return;
        }

        if (action === 'restore') {
            var msg = $el.data('confirm-msg') || 'Restore the original file? Optimized and WebP/AVIF/WebM versions will be removed.';
            if (!window.confirm(msg)) {
                e.preventDefault();
                return;
            }
        }

        e.preventDefault();

        if ($el.hasClass('is-busy')) {
            return;
        }

        $el.addClass('is-busy').prop('disabled', true);
        var originalHtml = $el.html();
        var loadingText = (action === 'restore') ? 'Restoring…' : 'Optimizing…';
        $el.html('<span class="capms-spinner"></span> ' + loadingText);
        $card.css('opacity', '0.6');

        var ajaxUrl = (window.capms_media_vars && window.capms_media_vars.ajax_url)
            ? window.capms_media_vars.ajax_url
            : (window.ajaxurl || '/wp-admin/admin-ajax.php');
        var nonce = (window.capms_media_vars && window.capms_media_vars.nonce)
            ? window.capms_media_vars.nonce
            : '';

        $.ajax({
            url: ajaxUrl,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'capms_media_library_action',
                nonce: nonce,
                id: id,
                do: action,
                context: context,
                quality: customQuality
            }
        }).done(function (res) {
            if (res && res.success && res.data && res.data.html) {
                var $newContent = $(res.data.html);
                $card.replaceWith($newContent);
                showToast(res.data.message || (action === 'restore' ? 'Original file restored.' : 'File optimized.'), true);

                if (window.wp && wp.media && wp.media.frame) {
                    var state = wp.media.frame.state();
                    if (state && state.get('selection')) {
                        var model = state.get('selection').get(id);
                        if (model && model.fetch) {
                            model.fetch();
                        }
                    }
                }
            } else {
                var err = (res && res.data && res.data.message) ? res.data.message : 'Action failed.';
                alert(err);
                $el.removeClass('is-busy').prop('disabled', false).html(originalHtml);
                $card.css('opacity', '1');
            }
        }).fail(function () {
            var href = $el.attr('href');
            if (href) {
                if (customQuality) {
                    href += (href.indexOf('?') >= 0 ? '&' : '?') + 'quality=' + encodeURIComponent(customQuality);
                }
                window.location.href = href;
            } else {
                $el.removeClass('is-busy').prop('disabled', false).html(originalHtml);
                $card.css('opacity', '1');
            }
        });
    });

    /* ══════════════════════════════════════════════════════════════════
       4. CLIENT-SIDE UPLOAD RESCUE & AUTO-COMPRESSION ASSISTANT
       ══════════════════════════════════════════════════════════════════ */

    var stashedFiles = {};

    // 1. Capture files from any file input selection safely
    $(document).on('change', 'input[type="file"]', function (e) {
        try {
            var files = e.target.files;
            if (files && files.length) {
                for (var i = 0; i < files.length; i++) {
                    if (files[i] && files[i].name) {
                        stashedFiles[files[i].name] = files[i];
                    }
                }
            }
        } catch (err) {}
    });

    // 2. Capture files from drag-and-drop safely (non-capturing phase, never prevents WP drop)
    window.addEventListener('drop', function (e) {
        try {
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
                for (var i = 0; i < e.dataTransfer.files.length; i++) {
                    var f = e.dataTransfer.files[i];
                    if (f && f.name) {
                        stashedFiles[f.name] = f;
                    }
                }
            }
        } catch (err) {}
    }, false);

    /**
     * Parse failed filenames from upload error elements
     */
    function getOversizedErrorFiles() {
        var failed = [];
        var maxBytes = (window.capms_media_vars && window.capms_media_vars.max_upload_size)
            ? parseInt(window.capms_media_vars.max_upload_size, 10)
            : 2097152;

        $('.upload-error, #media-upload-error, .media-upload-form .error').each(function () {
            var $err = $(this);
            var text = $err.text();
            var $fn = $err.find('.upload-error-filename');
            var name = $fn.length ? $.trim($fn.text()) : '';
            if (!name) {
                var match = text.match(/([^\s\r\n]+\.(png|jpe?g|webp|avif|gif))/i);
                if (match) name = match[1];
            }

            // Language-agnostic check: if name matches a stashed file that exceeds maxBytes
            var isOversized = false;
            if (name && stashedFiles[name] && stashedFiles[name].size > maxBytes) {
                isOversized = true;
            } else {
                for (var stashedName in stashedFiles) {
                    if (stashedFiles.hasOwnProperty(stashedName)) {
                        if (stashedFiles[stashedName].size > maxBytes && (text.indexOf(stashedName) !== -1 || name === stashedName)) {
                            name = stashedName;
                            isOversized = true;
                            break;
                        }
                    }
                }
            }

            if (isOversized || text.indexOf('maximum upload size') !== -1 || text.indexOf('exceeds') !== -1) {
                if (name && failed.indexOf(name) === -1) {
                    failed.push(name);
                }
            }
        });
        return failed;
    }

    /**
     * Check and inject the Media Shield Upload Assistant Bar
     */
    function checkAndInjectAssistant() {
        try {
            var failedFiles = getOversizedErrorFiles();
            if (!failedFiles.length) {
                $('#capms-upload-assistant-bar').remove();
                return;
            }

            if ($('#capms-upload-assistant-bar').length) {
                // Already injected, update count if not busy
                var $btn = $('#capms-btn-rescue-compress');
                if ($btn.length && !$btn.hasClass('is-busy')) {
                    $btn.find('.capms-rescue-txt').text('Auto-Compress & Upload (' + failedFiles.length + ' ' + (failedFiles.length === 1 ? 'File' : 'Files') + ')');
                }
                return;
            }

            var maxFormatted = (window.capms_media_vars && window.capms_media_vars.max_upload_formatted) ? window.capms_media_vars.max_upload_formatted : '2 MB';

            var barHtml = [
                '<div class="capms-upload-assistant-bar" id="capms-upload-assistant-bar">',
                    '<div class="capms-uab-main">',
                        '<div class="capms-uab-info">',
                            '<span class="capms-uab-brand">',
                                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
                                'Media Shield',
                            '</span>',
                            '<span class="capms-uab-text">',
                                '<strong>' + failedFiles.length + ' image(s) exceed ' + maxFormatted + ' server limit.</strong> ',
                                'Auto-compress & upload directly under ' + maxFormatted + ' without changing server settings.',
                            '</span>',
                        '</div>',
                        '<div class="capms-uab-actions">',
                            '<button type="button" class="button button-primary capms-btn-rescue-compress" id="capms-btn-rescue-compress">',
                                '<span class="capms-rescue-bolt">⚡</span> ',
                                '<span class="capms-rescue-txt">Auto-Compress & Upload (' + failedFiles.length + ' ' + (failedFiles.length === 1 ? 'File' : 'Files') + ')</span>',
                            '</button>',
                            '<button type="button" class="button button-secondary capms-btn-open-inc-modal" id="capms-btn-open-inc-modal">',
                                '<span class="dashicons dashicons-admin-generic"></span> ',
                                'Increase ' + maxFormatted + ' Limit',
                            '</button>',
                            '<input type="file" id="capms-rescue-file-fallback" multiple accept="image/*" style="display:none;" />',
                        '</div>',
                    '</div>',
                    '<div class="capms-rescue-status" id="capms-rescue-status" style="display:none;">',
                        '<div class="capms-rescue-pbar"><div class="capms-rescue-pbar-fill" id="capms-rescue-pbar-fill"></div></div>',
                        '<div class="capms-rescue-status-msg" id="capms-rescue-status-msg"></div>',
                    '</div>',
                '</div>'
            ].join('');

            // Look for mount point:
            var $mount = $('button.dismiss, .upload-errors button.dismiss, #media-items button.dismiss').last();
            if (!$mount.length) {
                $mount = $('#media-upload-error, .upload-errors, #media-items, .upload-error').last();
            }
            if ($mount.length) {
                $mount.after(barHtml);
            }
        } catch (e) {}
    }

    // Debounced observer to prevent layout thrashing
    var checkTimer = null;
    function scheduleCheck() {
        if (checkTimer) return;
        checkTimer = setTimeout(function () {
            checkTimer = null;
            checkAndInjectAssistant();
        }, 250);
    }

    if (window.MutationObserver) {
        var observer = new MutationObserver(scheduleCheck);
        var targetNode = document.getElementById('wpbody-content') || document.body;
        observer.observe(targetNode, { childList: true, subtree: true });
    }

    // Initial check on load
    $(document).ready(function () {
        scheduleCheck();
    });

    /**
     * Compress an image file using browser Canvas / WebP
     */
    function compressImageToLimit(file, maxBytes, callback) {
        if (!file) {
            callback(null, 'no_file');
            return;
        }

        // Animated GIF check: canvas flattens animated GIFs to a single static frame
        if (file.type === 'image/gif' || /\.gif$/i.test(file.name)) {
            callback(null, 'gif');
            return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                var width = img.naturalWidth || img.width;
                var height = img.naturalHeight || img.height;

                // Restrict extreme dimensions (max 2560px)
                var maxDim = 2560;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                var canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Target safe limit: 80% of server upload limit or at most 1.8 MB
                var targetBytes = Math.min(maxBytes * 0.85, 1850000);
                if (targetBytes < 200000) targetBytes = maxBytes * 0.9;

                var format = 'image/webp';
                var quality = 0.84;

                function testBlob(q, scale) {
                    var curCanvas = canvas;
                    if (scale < 1) {
                        var sW = Math.round(width * scale);
                        var sH = Math.round(height * scale);
                        var sCanvas = document.createElement('canvas');
                        sCanvas.width = sW;
                        sCanvas.height = sH;
                        sCanvas.getContext('2d').drawImage(img, 0, 0, sW, sH);
                        curCanvas = sCanvas;
                    }

                    if (typeof curCanvas.toBlob === 'function') {
                        curCanvas.toBlob(function (blob) {
                            if (!blob) {
                                // Fallback to JPEG
                                format = 'image/jpeg';
                                curCanvas.toBlob(function (jBlob) {
                                    if (jBlob && jBlob.size <= maxBytes) {
                                        callback(jBlob);
                                    } else {
                                        callback(null, 'too_large');
                                    }
                                }, format, 0.80);
                                return;
                            }
                            if (blob.size <= targetBytes) {
                                callback(blob);
                            } else if (q <= 0.45 && scale <= 0.35) {
                                if (blob.size <= maxBytes) {
                                    callback(blob);
                                } else {
                                    callback(null, 'too_large');
                                }
                            } else {
                                // Scale down further
                                testBlob(Math.max(0.40, q - 0.12), (blob.size > targetBytes * 1.3) ? scale * 0.75 : scale * 0.88);
                            }
                        }, format, q);
                    } else {
                        // Fallback for older browsers
                        callback(file);
                    }
                }

                testBlob(quality, 1.0);
            };
            img.onerror = function () {
                callback(null, 'load_error');
            };
            img.src = e.target.result;
        };
        reader.onerror = function () {
            callback(null, 'read_error');
        };
        reader.readAsDataURL(file);
    }

    /**
     * Upload compressed blob to WordPress via AJAX rescue endpoint
     */
    function uploadRescuedBlob(blob, originalName, onProgress, onDone, onError) {
        var formData = new FormData();
        formData.append('action', 'capms_upload_rescue');
        formData.append('nonce', window.capms_media_vars.upload_rescue_nonce);
        formData.append('name', originalName);
        formData.append('file', blob, originalName);

        var ajaxUrl = (window.capms_media_vars && window.capms_media_vars.ajax_url)
            ? window.capms_media_vars.ajax_url
            : (window.ajaxurl || '/wp-admin/admin-ajax.php');

        var xhr = new XMLHttpRequest();
        xhr.open('POST', ajaxUrl, true);

        if (xhr.upload && onProgress) {
            xhr.upload.onprogress = function (e) {
                if (e.lengthComputable) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            };
        }

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    if (res && res.success) {
                        onDone(res.data);
                    } else {
                        onError((res && res.data && res.data.message) ? res.data.message : 'Upload failed');
                    }
                } catch (e) {
                    onError('Invalid server response');
                }
            } else {
                onError('HTTP ' + xhr.status + ' upload error');
            }
        };

        xhr.onerror = function () {
            onError('Network connection error');
        };

        xhr.send(formData);
    }

    /**
     * Handle "Auto-Compress & Upload" button click
     */
    $(document).on('click', '#capms-btn-rescue-compress', function (e) {
        e.preventDefault();
        var $btn = $(this);
        if ($btn.hasClass('is-busy')) return;

        var failedFiles = getOversizedErrorFiles();
        if (!failedFiles.length) {
            alert('No oversized files detected.');
            return;
        }

        // Check if all failed files are in our stashed cache
        var missingFiles = [];
        for (var i = 0; i < failedFiles.length; i++) {
            if (!stashedFiles[failedFiles[i]]) {
                missingFiles.push(failedFiles[i]);
            }
        }

        if (missingFiles.length) {
            // Smoothly open file picker to let user select the oversized file
            $('#capms-rescue-file-fallback').trigger('click');
            return;
        }

        startRescueProcess(failedFiles);
    });

    // Handle fallback file selection
    $(document).on('change', '#capms-rescue-file-fallback', function (e) {
        var files = e.target.files;
        if (files && files.length) {
            var names = [];
            for (var i = 0; i < files.length; i++) {
                stashedFiles[files[i].name] = files[i];
                names.push(files[i].name);
            }
            startRescueProcess(names);
        }
    });

    /**
     * Sequentially compress and upload files
     */
    function startRescueProcess(fileNames) {
        var $btn = $('#capms-btn-rescue-compress');
        var $status = $('#capms-rescue-status');
        var $pbarFill = $('#capms-rescue-pbar-fill');
        var $msg = $('#capms-rescue-status-msg');

        $btn.addClass('is-busy').prop('disabled', true);
        $status.slideDown(180);

        var total = fileNames.length;
        var currentIndex = 0;
        var maxBytes = (window.capms_media_vars && window.capms_media_vars.max_upload_size)
            ? parseInt(window.capms_media_vars.max_upload_size, 10)
            : (2 * 1024 * 1024);

        function processNext() {
            if (currentIndex >= total) {
                // All finished!
                $pbarFill.css('width', '100%');
                $msg.html('<span class="capms-rescue-done-icon">✓</span> <strong>All ' + total + ' file(s) compressed and uploaded successfully!</strong> Refreshing Media Library…');
                showToast('All ' + total + ' file(s) compressed and uploaded successfully!', true);

                setTimeout(function () {
                    // Hide errors and reload
                    $('.upload-errors, #media-items .upload-error, #capms-upload-assistant-bar').fadeOut(250);
                    if (window.location.href.indexOf('upload.php') !== -1) {
                        window.location.reload();
                    }
                }, 1400);
                return;
            }

            var fileName = fileNames[currentIndex];
            var file = stashedFiles[fileName];
            var stepNum = currentIndex + 1;

            var basePct = Math.round((currentIndex / total) * 100);
            $pbarFill.css('width', basePct + '%');
            $msg.empty()
                .append($('<span class="capms-spinner"></span>'))
                .append(document.createTextNode(' ⚡ Compressing ' + stepNum + ' of ' + total + ': '))
                .append($('<code></code>').text(fileName))
                .append(document.createTextNode('…'));

            compressImageToLimit(file, maxBytes, function (compressedBlob, failReason) {
                if (!compressedBlob) {
                    var errorNotice = (failReason === 'gif')
                        ? 'Animated GIFs cannot be compressed without losing animation frames. Please use Server Limit Booster.'
                        : 'Could not compress file below upload limit.';
                    showToast(fileName + ': ' + errorNotice, false);
                    delete stashedFiles[fileName];
                    currentIndex++;
                    processNext();
                    return;
                }

                $msg.empty()
                    .append($('<span class="capms-spinner"></span>'))
                    .append(document.createTextNode(' 🚀 Uploading ' + stepNum + ' of ' + total + ' (' + Math.round(compressedBlob.size / 1024) + ' KB) to Media Library…'));

                uploadRescuedBlob(
                    compressedBlob,
                    fileName,
                    function (progressPct) {
                        var fileShare = 100 / total;
                        var totalProgress = basePct + Math.round((progressPct / 100) * fileShare);
                        $pbarFill.css('width', Math.min(totalProgress, 96) + '%');
                    },
                    function (resData) {
                        delete stashedFiles[fileName];
                        currentIndex++;
                        processNext();
                    },
                    function (errMsg) {
                        showToast('Upload failed for ' + fileName + ': ' + errMsg, false);
                        delete stashedFiles[fileName];
                        currentIndex++;
                        processNext();
                    }
                );
            });
        }

        processNext();
    }

    /* ══════════════════════════════════════════════════════════════════
       5. INCREASE UPLOAD LIMIT MODAL
       ══════════════════════════════════════════════════════════════════ */

    $(document).on('click', '#capms-btn-open-inc-modal', function (e) {
        e.preventDefault();
        $('#capms-increase-limit-modal').fadeIn(180);
    });

    $(document).on('click', '.capms-inc-close', function (e) {
        e.preventDefault();
        $('#capms-increase-limit-modal').fadeOut(180);
    });

    $(document).on('click', '#capms-increase-limit-modal', function (e) {
        if ($(e.target).is('#capms-increase-limit-modal')) {
            $(this).fadeOut(180);
        }
    });

    $(document).on('click', '#capms-btn-do-auto-increase', function (e) {
        e.preventDefault();
        var $btn = $(this);
        if ($btn.hasClass('is-busy')) return;

        var originalText = $btn.text();
        $btn.addClass('is-busy').prop('disabled', true).text('Testing & Updating…');
        var $feedback = $('#capms-inc-feedback').hide();

        var ajaxUrl = (window.capms_media_vars && window.capms_media_vars.ajax_url)
            ? window.capms_media_vars.ajax_url
            : (window.ajaxurl || '/wp-admin/admin-ajax.php');
        var nonce = (window.capms_media_vars && window.capms_media_vars.nonce)
            ? window.capms_media_vars.nonce
            : '';

        $.ajax({
            url: ajaxUrl,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'capms_increase_upload_limit',
                nonce: nonce
            }
        }).done(function (res) {
            $btn.removeClass('is-busy').prop('disabled', false).text(originalText);
            if (res && res.success) {
                $feedback.html('<div class="notice notice-success inline"><p><strong>✓ Success!</strong> ' + res.data.message + ' Refreshing…</p></div>').slideDown(180);
                setTimeout(function () {
                    window.location.reload();
                }, 1200);
            } else {
                var msg = (res && res.data && res.data.message) ? res.data.message : 'Could not automatically edit server files.';
                $feedback.html('<div class="notice notice-warning inline"><p>' + msg + '</p></div>').slideDown(180);
            }
        }).fail(function () {
            $btn.removeClass('is-busy').prop('disabled', false).text(originalText);
            $feedback.html('<div class="notice notice-error inline"><p>Request failed. Please use manual guide below.</p></div>').slideDown(180);
        });
    });

})(jQuery);
