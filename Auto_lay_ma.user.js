// ==UserScript==
// @name           LayMa Tool Auto
// @namespace      http://tampermonkey.net/
// @version        1.0.0
// @description    Tự chuyển bài, bấm nút LayMa & copy mã trên Mobile/PC - Không tự kéo trang, Không UI.
// @author         Thiên
// @match          *://*/*
// @grant          GM_setValue
// @grant          GM_getValue
// @grant          GM_setClipboard
// @run-at         document-start
// @allFrames      true
// @icon          https://thiendz.site/uploads/1/1784563166_Gemini_Generated_Image_ikwpibikwpibikwp.webp
// ==/UserScript==

(function() {
    'use strict';

    const currentUrl = window.location.href.toLowerCase();
    const currentHost = window.location.hostname.toLowerCase();
    const pageTitle = (document.title || "").toLowerCase();

    // Bỏ qua các trang hệ thống, mạng xã hội
    if (currentUrl.includes('cloudflare') || currentUrl.includes('challenges') || pageTitle.includes('just a moment')) return;
    if (currentHost.includes('facebook.com') || currentHost.includes('messenger.com') || currentUrl.includes('youtube.com') || currentHost.includes('zalo.me') || currentHost.includes('google.com')) return;

    let hasRedirected = sessionStorage.getItem('tm_internal_redirected') === 'true';
    window.hasTriggeredRedirect = false;

    // Ép trình duyệt luôn giữ trạng thái Active/Visible
    Object.defineProperty(document, 'hidden', { value: false, writable: false });
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: false });
    Object.defineProperty(document, 'hasFocus', { value: function() { return true; }, writable: false });

    // =========================================================================
    // 1. TRIGGER CLICK ĐA NĂNG (GIẢI QUYẾT VẤN ĐỀ CHẠM MÀN HÌNH TRÊN MOBILE)
    // =========================================================================
    function triggerUniversalClick(element) {
        if (!element) return;

        // Gọi trực tiếp onclick nếu có
        if (typeof element.onclick === 'function') {
            try { element.onclick(); } catch(e) {}
        }

        // Tạo sự kiện Touch cho điện thoại
        try {
            const rect = element.getBoundingClientRect();
            const touchObj = new Touch({
                identifier: Date.now(),
                target: element,
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2,
                radiusX: 2.5, radiusY: 2.5, rotationAngle: 0, force: 0.5,
            });

            const touchStart = new TouchEvent('touchstart', { cancelable: true, bubbles: true, touches: [touchObj], targetTouches: [touchObj], changedTouches: [touchObj] });
            const touchEnd = new TouchEvent('touchend', { cancelable: true, bubbles: true, touches: [], targetTouches: [], changedTouches: [touchObj] });
            element.dispatchEvent(touchStart);
            element.dispatchEvent(touchEnd);
        } catch (e) {}

        // Tạo sự kiện Mouse/Pointer cho PC & Mobile
        const opts = { bubbles: true, cancelable: true, view: window };
        element.dispatchEvent(new PointerEvent('pointerdown', opts));
        element.dispatchEvent(new MouseEvent('mousedown', opts));
        element.dispatchEvent(new PointerEvent('pointerup', opts));
        element.dispatchEvent(new MouseEvent('mouseup', opts));
        element.dispatchEvent(new MouseEvent('click', opts));

        if (typeof element.click === 'function') {
            element.click();
        }
    }

    // =========================================================================
    // 2. TỰ ĐỘNG CHUYỂN BÀI VIẾT NỘI BỘ
    // =========================================================================
    function clickInternalLinkOnce() {
        if (window.hasTriggeredRedirect || hasRedirected) return true;

        const links = Array.from(document.querySelectorAll('a'));
        const localHost = window.location.hostname.replace('www.', '').toLowerCase();

        const internalLinks = links.filter(link => {
            let href = link.getAttribute('href'); if (!href) return false;
            href = href.trim().toLowerCase();
            if (href.startsWith('javascript:') || href.startsWith('#') || href === '/' || href === '') return false;
            try {
                const linkHost = new URL(link.href, window.location.origin).hostname.replace('www.', '').toLowerCase();
                return (linkHost === localHost || href.startsWith('/')) && !href.includes('/login') && !href.includes('/register') && link.offsetWidth > 0;
            } catch (e) { return false; }
        });

        if (internalLinks.length > 0) {
            window.hasTriggeredRedirect = true;
            sessionStorage.setItem('tm_internal_redirected', 'true');
            sessionStorage.setItem('thien_redirect_time', String(Date.now()));
            const sortedLinks = internalLinks.sort((a, b) => (b.innerText || '').length - (a.innerText || '').length);

            triggerUniversalClick(sortedLinks[0]);
            return true;
        }
        return false;
    }

    // =========================================================================
    // 3. BỘ TỰ ĐỘNG BẮT VÀ COPY MÃ MỚI
    // =========================================================================
    let hasCopiedCode = false;

    function autoCopyCodeEngine() {
        if (hasCopiedCode) return;
        let codeFound = null;

        let msgEl = document.getElementById('message');
        if (msgEl && msgEl.innerText.includes('Mã Code:')) {
            let match = msgEl.innerText.match(/Mã Code:\s*([a-zA-Z0-9]{5,15})/i);
            if (match) codeFound = match[1];
        }

        if (!codeFound) {
            let allElements = document.querySelectorAll('div, span, b, strong');
            for (let el of allElements) {
                if (el.innerText && el.innerText.includes('Mã KM:')) {
                    let match = el.innerText.match(/Mã KM:\s*([a-zA-Z0-9]{5,10})/i);
                    if (match && el.offsetWidth > 0) { codeFound = match[1]; break; }
                }
            }
        }

        if (!codeFound) {
            let els = document.querySelectorAll('div, span, p, b, strong, h3, h4');
            for (let el of els) {
                let text = el.innerText.trim();
                if (text.length > 5 && text.length < 50 && el.offsetWidth > 0) {
                    let match = text.match(/(?:Mã Code|Mã KM|Mã giải nén|Mã của bạn là|Code)[:\s]+([a-zA-Z0-9]{5,15})/i);
                    if (match) { codeFound = match[1]; break; }
                }
            }
        }

        if (codeFound && !codeFound.toLowerCase().includes('sunwin')) {
            GM_setClipboard(codeFound, 'text');
            hasCopiedCode = true;
            console.log(`[AutoCode] ✅ ĐÃ TỰ ĐỘNG COPY MÃ: ${codeFound}`);
        }
    }

    // =========================================================================
    // 4. QUY TRÌNH XỬ LÝ LẤY MÃ
    // =========================================================================
    function doLayMaAutomation() {
        if (hasCopiedCode) return;

        let pageText = document.body ? (document.body.innerText || "") : "";

        // Tự động chuyển trang khi thấy thông báo yêu cầu
        if ((pageText.includes('Click vào liên kết bất kỳ') ||
             pageText.includes('bài viết nội bộ khác') ||
             pageText.includes('bài viết bất kỳ') ||
             pageText.includes('Vui lòng nhấn bài viết bất kỳ') ||
             pageText.includes('click 1 lần bài viết')) && !hasRedirected) {
            if (clickInternalLinkOnce()) return;
        }

        // Rà soát và bấm nút LẤY MÃ
        let btnLM = null;
        const laymaSpans = document.querySelectorAll('span, div, button, a');
        for (let el of laymaSpans) {
            if (el.offsetWidth > 0 || el.offsetHeight > 0) {
                let compStyle = window.getComputedStyle(el);
                let bgColor = compStyle.backgroundColor || "";
                let styleAttr = (el.getAttribute('style') || "").toLowerCase();

                if ((bgColor.includes('rgb(11, 244, 5)') || styleAttr.includes('rgb(11, 244, 5)')) && (el.innerText && el.innerText.toUpperCase().includes('LẤY MÃ'))) {
                    btnLM = el.closest('button') || el.closest('a') || el;
                    break;
                }
            }
        }

        const redirectTime = parseInt(sessionStorage.getItem('thien_redirect_time') || "0");
        const isFreezeActive = redirectTime > 0 && (Date.now() - redirectTime < 800);

        if (btnLM && !isFreezeActive) {
            triggerUniversalClick(btnLM);
        }
    }

    // Kích hoạt tiến trình
    window.addEventListener('DOMContentLoaded', function() {
        setInterval(doLayMaAutomation, 800);
        setInterval(autoCopyCodeEngine, 500);
    });
})();
