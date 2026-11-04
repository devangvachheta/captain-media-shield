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
        $toast.removeClass('capms-toast--error capms-toast--success')
              .addClass(isSuccess ? 'capms-toast--success' : 'capms-toast--error')
              .html('<span class="capms-toast-icon">' + icon + '</span><span class="capms-toast-msg">' + message + '</span>')
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
        var quality = parseInt($('#capms-modal-slider').val(), 10) || 80;

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
                quality: quality
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
                showToast('✓ ' + title + ' optimized at ' + quality + '%!', true);
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
        var quality = parseInt($('#capms-modal-slider').val(), 10) || 80;

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
                quality: quality
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
})(jQuery);
