// ==UserScript==
// @name            Auto Get Code LayMa
// @namespace       http://tampermonkey.net/
// @version         1.0.2
// @description     Công cụ tự động lấy mã LayMa 
// @author          Thiên Đz
// @icon            https://thiendz.site/uploads/1/1784563166_Gemini_Generated_Image_ikwpibikwpibikwp.webp
// @match           *://*/*
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_setClipboard
// @run-at          document-start
// @allFrames       true
// ==/UserScript==

(function() {
    'use strict';

    const currentUrl = window.location.href.toLowerCase();
    const currentHost = window.location.hostname.toLowerCase();
    const pageTitle = (document.title || "").toLowerCase();

    // 🛑 DANH SÁCH CHẶN (Không cho phép chạy)
    if (currentHost.includes('hanaminikata.com')) return;

    // Bỏ qua các trang hệ thống/mạng xã hội
    if (currentUrl.includes('cloudflare') || currentUrl.includes('challenges') || pageTitle.includes('just a moment')) return;
    if (currentHost.includes('facebook.com') || currentHost.includes('messenger.com') || currentUrl.includes('youtube.com') || currentHost.includes('zalo.me') || currentHost.includes('google.com')) return;

    window.hasTriggeredRedirect = false;

    // Ép trang web luôn ở trạng thái "active / visible"
    Object.defineProperty(document, 'hidden', { value: false, writable: false });
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: false });
    Object.defineProperty(document, 'hasFocus', { value: function() { return true; }, writable: false });

    // Cuộn trang tự động khi vào trang
    function forceAbsoluteTargetScroll(isUpward) {
        let targetY = isUpward ? 0 : (Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) || 99999);
        window.scrollTo({ top: targetY, behavior: 'auto' });
        if (document.documentElement) document.documentElement.scrollTop = targetY;
        if (document.body) document.body.scrollTop = targetY;
        window.dispatchEvent(new Event('scroll', { bubbles: true }));
    }

    setTimeout(() => {
        const innerTextUpper = document.body.innerText ? document.body.innerText.toUpperCase() : "";
        const whatOnCodeEl = document.querySelector('.whatoncode');
        const hasScrollUpTrap = innerTextUpper.includes('KÉO LÊN CHẬM CHẬM') || innerTextUpper.includes('KÉO LÊN CHẬM') || (whatOnCodeEl && whatOnCodeEl.innerText.toUpperCase().includes('KÉO LÊN'));
        if (!hasScrollUpTrap) { forceAbsoluteTargetScroll(false); }
    }, 600);

    let hasCopiedCode = false;
    let isFrozen = false;

    window.addEventListener('DOMContentLoaded', function() {
        const isMainPage = (window.self === window.top);

        // ==========================================
        // GIAO DIỆN SIÊU RÚT GỌN (CHỈ CÓ NÚT BẬT / TẮT)
        // ==========================================
        if (isMainPage) {
            const shadowHost = document.createElement('div');
            shadowHost.id = 'layma-toggle-shadow-host';
            shadowHost.style = 'position: fixed !important; bottom: 20px !important; right: 20px !important; z-index: 2147483647 !important;';
            document.documentElement.appendChild(shadowHost);

            const rootContainer = shadowHost.attachShadow({ mode: 'open' });

            const panel = document.createElement('div');
            panel.style = `
                background: #2c3e50 !important;
                color: #fff !important;
                padding: 8px 12px !important;
                border-radius: 8px !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
                font-family: Arial, sans-serif !important;
                font-size: 13px !important;
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                user-select: none !important;
            `;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = 'layma-switch';
            checkbox.style = 'cursor: pointer !important; width: 16px !important; height: 16px !important; accent-color: #2ecc71 !important;';
            checkbox.checked = GM_getValue('layma_active', true); // Mặc định bật

            const label = document.createElement('label');
            label.htmlFor = 'layma-switch';
            label.style = 'cursor: pointer !important; font-weight: bold !important; color: #ffffff !important;';
            label.innerText = checkbox.checked ? 'Auto LayMa: BẬT' : 'Auto LayMa: TẮT';

            checkbox.addEventListener('change', function() {
                GM_setValue('layma_active', this.checked);
                label.innerText = this.checked ? 'Auto LayMa: BẬT' : 'Auto LayMa: TẮT';
            });

            panel.appendChild(checkbox);
            panel.appendChild(label);
            rootContainer.appendChild(panel);
        }

        // ==========================================
        // TỰ ĐỘNG LỌC LINK NỘI BỘ VÀ CLICK 1 LẦN
        // ==========================================
        function clickInternalLinkOnce() {
            if (window.hasTriggeredRedirect || sessionStorage.getItem('tm_internal_redirected') === 'true') {
                return false;
            }

            const links = Array.from(document.querySelectorAll('a'));
            const localHost = window.location.hostname.replace('www.', '').toLowerCase();
            const currentFullUrl = window.location.href.toLowerCase().split('#')[0];

            const validArticleLinks = links.filter(link => {
                let hrefAttr = link.getAttribute('href');
                if (!hrefAttr) return false;
                hrefAttr = hrefAttr.trim().toLowerCase();

                if (hrefAttr.startsWith('javascript:') || hrefAttr.startsWith('#') || hrefAttr === '/' || hrefAttr === '') return false;

                try {
                    const linkObj = new URL(link.href, window.location.origin);
                    const linkHost = linkObj.hostname.replace('www.', '').toLowerCase();
                    const linkFull = linkObj.href.toLowerCase().split('#')[0];
                    const pathname = linkObj.pathname.toLowerCase();

                    if (linkHost !== localHost) return false;
                    if (pathname === '/' || pathname === '' || linkFull === currentFullUrl) return false;
                    if (pathname.includes('/login') || pathname.includes('/register') || pathname.includes('/category/') || pathname.includes('/tag/')) return false;

                    return link.offsetWidth > 0 && link.offsetHeight > 0;
                } catch (e) { return false; }
            });

            if (validArticleLinks.length > 0) {
                window.hasTriggeredRedirect = true;
                sessionStorage.setItem('tm_internal_redirected', 'true');
                sessionStorage.setItem('thien_redirect_time', String(Date.now()));

                let chosenLink = validArticleLinks.find(l => {
                    const parent = l.closest('ul, ol, .list, article, main, div');
                    const parentTxt = parent ? (parent.innerText || "").toUpperCase() : "";
                    return parentTxt.includes('BÀI VIẾT MỚI') || parentTxt.includes('TIN TỨC') || parentTxt.includes('MỚI NHẤT');
                });

                if (!chosenLink) {
                    chosenLink = validArticleLinks.sort((a, b) => (b.innerText || '').trim().length - (a.innerText || '').trim().length)[0];
                }

                if (chosenLink) {
                    try { chosenLink.click(); } catch(e) { window.location.href = chosenLink.href; }
                    return true;
                }
            }
            return false;
        }

        // ==========================================
        // AUTO COPY MÃ CODE LAYMA
        // ==========================================
        function autoCopyCodeEngine() {
            if (hasCopiedCode) return;
            let codeFound = null;

            if (isFrozen) {
                let msgEl = document.getElementById('message');
                if (msgEl && msgEl.innerText.includes('Mã Code:')) {
                    let match = msgEl.innerText.match(/Mã Code:\s*([a-zA-Z0-9]{5,15})/i);
                    if (match) codeFound = match[1];
                }
            }

            if (codeFound) {
                if (!codeFound.toLowerCase().includes('sunwin')) {
                    GM_setClipboard(codeFound, 'text');
                    hasCopiedCode = true;
                    sessionStorage.removeItem('tm_internal_redirected');
                    console.log(`[LayMa] Đã copy mã: ${codeFound}`);
                }
            }
        }

        // ==========================================
        // PHÁT HIỆN CAPTCHA DỪNG TỰ ĐỘNG
        // ==========================================
        function isCaptchaPresent() {
            const captchaSelectors = [
                'iframe[src*="recaptcha"]', 'iframe[src*="hcaptcha"]',
                'iframe[src*="cloudflare"]', '#cf-turnstile',
                '.g-recaptcha', 'iframe[src*="captcha.la"]', 'div[class*="captcha.la"]'
            ];

            for (let selector of captchaSelectors) {
                let els = document.querySelectorAll(selector);
                for (let el of els) {
                    let style = window.getComputedStyle(el);
                    if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && el.offsetWidth > 10 && el.offsetHeight > 10) {
                        return true;
                    }
                }
            }
            return false;
        }

        // ==========================================
        // TIẾN TRÌNH TỰ ĐỘNG CHÍNH DÀNH CHO LAYMA
        // ==========================================
        function doLaymaAutomation() {
            const runLM = GM_getValue('layma_active', true);
            if (!runLM) return;

            const redirectTime = parseInt(sessionStorage.getItem('thien_redirect_time') || "0");
            const isFreezeActive = redirectTime > 0 && (Date.now() - redirectTime < 800);

            let pageText = document.body.innerText || "";
            let msgEl = document.getElementById('message');
            let msgText = msgEl ? (msgEl.innerText || "") : "";

            if (pageText.includes('Vui lòng cuộn lên') || pageText.includes('cuộn lên để tiếp tục lấy mã')) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                if (document.documentElement) document.documentElement.scrollTop = 0;
            }
            if (pageText.includes('Vui lòng cuộn xuống') || pageText.includes('cuộn xuống dưới để tiếp tục')) {
                let maxScroll = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
                window.scrollTo({ top: maxScroll, behavior: 'smooth' });
                if (document.documentElement) document.documentElement.scrollTop = maxScroll;
            }

            const hasLaymaPopup = msgText.includes('nhấn bài viết bất kỳ') ||
                                  msgText.includes('bấm vào bài viết bất kỳ') ||
                                  msgText.includes('click 1 lần bài viết') ||
                                  pageText.includes('Click vào liên kết bất kỳ') ||
                                  pageText.includes('bài viết nội bộ khác') ||
                                  pageText.includes('bài viết bất kỳ');

            if (hasLaymaPopup) {
                if (clickInternalLinkOnce()) return;
            }

            let btnLM = null;
            const laymaSpans = document.querySelectorAll('span, div');
            for (let el of laymaSpans) {
                if (el.offsetWidth > 0) {
                    let compStyle = window.getComputedStyle(el);
                    let bgColor = compStyle.backgroundColor || "";
                    let styleAttr = (el.getAttribute('style') || "").toLowerCase();

                    if ((bgColor.includes('rgb(11, 244, 5)') || styleAttr.includes('rgb(11, 244, 5)')) && (el.innerText && el.innerText.toUpperCase().includes('LẤY MÃ'))) {
                        btnLM = el.closest('button') || el;
                        break;
                    }
                }
            }

            if (btnLM && !isFreezeActive) {
                btnLM.click();
                btnLM.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }
        }

        // Tự động tạm dừng (freeze) khi có Captcha
        let captchaWatchdog = setInterval(() => {
            const runLM = GM_getValue('layma_active', true);

            if (runLM && !isFrozen && isCaptchaPresent()) {
                isFrozen = true;
                clearInterval(captchaWatchdog);
            }
        }, 100);

        setInterval(() => {
            autoCopyCodeEngine();
        }, 500);

        setInterval(() => {
            if (isFrozen) return;
            doLaymaAutomation();
        }, 1000);

    });
})();
