// ==UserScript==
// @name            Auto Get Code LayMa (Smart Detect & Dual Scroll)
// @namespace       http://tampermonkey.net/
// @version         16.0.0
// @description     Tự cuộn lên / cuộn xuống khi có yêu cầu, Speedrun x100, tự reload khi kẹt, hỗ trợ Mobile/PC, chỉ chạy khi có nút LayMa.
// @author          Thiên
// @match           *://*/*
// @exclude         *://*.google.com/recaptcha/*
// @exclude         *://*.recaptcha.net/*
// @exclude         *://*.hcaptcha.com/*
// @exclude         *://challenges.cloudflare.com/*
// @exclude         *://*.turnstile.cloudflare.com/*
// @exclude         *://*.captcha.la/*
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

    if (currentUrl.includes('cloudflare') || currentUrl.includes('challenges') || pageTitle.includes('just a moment')) return;
    if (currentHost.includes('facebook.com') || currentHost.includes('messenger.com') || currentUrl.includes('youtube.com') || currentHost.includes('zalo.me') || currentHost.includes('google.com')) return;

    let isMasterEnabled = GM_getValue('thien_master_enabled', true);
    let isLayMaSiteDetected = false;
    let speedrunInjected = false;

    // --- 1. HÀM KIỂM TRA DẤU HIỆU TRANG CÓ NÚT LẤY MÃ ---
    function detectLayMaPresence() {
        const msgEl = document.getElementById('message');
        if (msgEl) {
            const txt = (msgEl.innerText || "").toLowerCase();
            if (txt.includes('lấy mã') || txt.includes('cuộn lên') || txt.includes('cuộn xuống') || txt.includes('bài viết bất kỳ') || txt.includes('mã code')) {
                return true;
            }
        }

        const elements = document.querySelectorAll('button, a, span, div');
        for (let el of elements) {
            if (el.offsetWidth > 0 && el.offsetHeight > 0) {
                const text = (el.innerText || "").toUpperCase();
                if (text.includes('LẤY MÃ') || text.includes('LAY MA') || text.includes('XÁC THỰC VÀ LẤY MÃ')) {
                    return true;
                }
                const compStyle = window.getComputedStyle(el);
                const bg = compStyle.backgroundColor || "";
                const styleAttr = (el.getAttribute('style') || "").toLowerCase();
                if ((bg.includes('rgb(11, 244, 5)') || styleAttr.includes('rgb(11, 244, 5)')) && text.includes('MÃ')) {
                    return true;
                }
            }
        }

        if (sessionStorage.getItem('tm_internal_redirected') === 'true') {
            return true;
        }

        return false;
    }

    // --- 2. TIÊM CODE SPEEDRUN KHI XÁC NHẬN CÓ LẤY MÃ ---
    function injectSpeedrun() {
        if (speedrunInjected) return;
        speedrunInjected = true;

        const injectScript = document.createElement('script');
        injectScript.textContent = `
        (function() {
            if (window.__thienSpeedrunInjected) return;
            window.__thienSpeedrunInjected = true;

            const SPEED = 100;
            const _st = window.setTimeout;
            const _si = window.setInterval;
            const _now = Date.now;
            const _perfNow = performance.now.bind(performance);

            const startRealTime = _now.call(Date);
            const startPerfTime = _perfNow();

            let speedActive = true;

            window.setTimeout = function(fn, delay, ...args) {
                if (speedActive && typeof delay === 'number') delay = delay / SPEED;
                return _st.call(window, fn, delay, ...args);
            };

            window.setInterval = function(fn, delay, ...args) {
                if (speedActive && typeof delay === 'number') delay = delay / SPEED;
                return _si.call(window, fn, delay, ...args);
            };

            Date.now = function() {
                if (!speedActive) return _now.call(Date);
                const realElapsed = _now.call(Date) - startRealTime;
                return startRealTime + (realElapsed * SPEED);
            };

            performance.now = function() {
                if (!speedActive) return _perfNow();
                const realElapsed = _perfNow() - startPerfTime;
                return startPerfTime + (realElapsed * SPEED);
            };

            window.addEventListener('__disable_thien_speedrun__', function() {
                speedActive = false;
                window.setTimeout = _st;
                window.setInterval = _si;
                Date.now = _now;
                performance.now = _perfNow;
            });

            window.addEventListener('__toggle_thien_speedrun__', function(e) {
                speedActive = e.detail;
            });
        })();
        `;
        (document.head || document.documentElement).appendChild(injectScript);
        injectScript.remove();
    }

    // Ép trang web luôn Active
    Object.defineProperty(document, 'hidden', { value: false, writable: false });
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: false });
    Object.defineProperty(document, 'hasFocus', { value: function() { return true; }, writable: false });

    window.hasTriggeredRedirect = false;
    let hasCopiedCode = false;
    let isFrozen = false;
    let isScrollingTriggered = false;
    let isReloading = false;

    // --- 3. HÀM CLICK CHO CẢ MOBILE & PC ---
    function triggerUniversalClick(el) {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;

        try {
            if (typeof Touch !== 'undefined' && typeof TouchEvent !== 'undefined') {
                const touchObj = new Touch({
                    identifier: Date.now(),
                    target: el,
                    clientX: clientX,
                    clientY: clientY,
                    radiusX: 2.5,
                    radiusY: 2.5,
                    rotationAngle: 10,
                    force: 0.5
                });
                const touchInit = {
                    bubbles: true,
                    cancelable: true,
                    touches: [touchObj],
                    targetTouches: [touchObj],
                    changedTouches: [touchObj]
                };
                el.dispatchEvent(new TouchEvent('touchstart', touchInit));
                el.dispatchEvent(new TouchEvent('touchend', touchInit));
            }
        } catch (e) {}

        try {
            const mouseOpts = { bubbles: true, cancelable: true, view: window, clientX: clientX, clientY: clientY };
            el.dispatchEvent(new MouseEvent('mousedown', mouseOpts));
            el.dispatchEvent(new MouseEvent('mouseup', mouseOpts));
            el.dispatchEvent(new MouseEvent('click', mouseOpts));
        } catch (e) {}

        if (typeof el.click === 'function') {
            try { el.click(); } catch (e) {}
        }
    }

    // --- 4. TẠO NÚT BẬT / TẮT TRÊN MÀN HÌNH ---
    function createMasterToggleButton() {
        if (document.getElementById('thien-master-switch-btn')) return;

        const btn = document.createElement('div');
        btn.id = 'thien-master-switch-btn';
        
        const updateStyle = () => {
            btn.style = `
                position: fixed !important;
                bottom: 25px !important;
                right: 20px !important;
                z-index: 2147483647 !important;
                background: ${isMasterEnabled ? 'linear-gradient(135deg, #2ecc71, #27ae60)' : 'linear-gradient(135deg, #7f8c8d, #95a5a6)'} !important;
                color: #ffffff !important;
                padding: 10px 16px !important;
                border-radius: 30px !important;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
                font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif !important;
                font-size: 13px !important;
                font-weight: bold !important;
                cursor: pointer !important;
                user-select: none !important;
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
                border: 2px solid #ffffff !important;
                transition: transform 0.2s, background 0.3s !important;
            `;
            btn.innerHTML = `<span>⚡ Tool:</span> <span>${isMasterEnabled ? 'BẬT' : 'TẮT'}</span>`;
        };

        updateStyle();

        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            isMasterEnabled = !isMasterEnabled;
            GM_setValue('thien_master_enabled', isMasterEnabled);
            updateStyle();

            window.dispatchEvent(new CustomEvent('__toggle_thien_speedrun__', { detail: isMasterEnabled }));

            if (!isMasterEnabled) {
                removeCenterTimerOverlay();
            }
        });

        document.body.appendChild(btn);
    }

    // --- 5. OVERLAY ĐỒNG HỒ ĐẾM NGƯỢC ---
    function removeCenterTimerOverlay() {
        const timerBox = document.getElementById('thien-center-timer');
        if (timerBox) timerBox.remove();
    }

    function createCenterTimerOverlay() {
        if (!isMasterEnabled || document.getElementById('thien-center-timer')) return document.getElementById('thien-center-timer');

        let savedTime = parseInt(GM_getValue('thien_layma_countdown', 45));

        const overlay = document.createElement('div');
        overlay.id = 'thien-center-timer';
        overlay.style = `
            position: fixed !important;
            top: 20px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            z-index: 2147483646 !important;
            background: rgba(44, 62, 80, 0.95) !important;
            color: #ffffff !important;
            padding: 10px 22px !important;
            border-radius: 50px !important;
            box-shadow: 0 8px 25px rgba(0,0,0,0.5) !important;
            border: 2px solid #3498db !important;
            font-family: Arial, sans-serif !important;
            text-align: center !important;
            user-select: none !important;
        `;

        overlay.innerHTML = `
            <div style="font-size: 11px !important; text-transform: uppercase; letter-spacing: 1px; color: #bdc3c7; display: flex; align-items: center; justify-content: center; gap: 5px;">
                <span>THỜI GIAN CHỜ</span>
                <span id="thien-edit-time-btn" title="Sửa thời gian" style="cursor: pointer; font-size: 12px; opacity: 0.8;">✏️</span>
            </div>
            <div id="thien-timer-num" style="font-size: 26px !important; font-weight: bold; color: #f1c40f; line-height: 1.2;">${savedTime}s</div>
        `;

        document.body.appendChild(overlay);

        const editBtn = overlay.querySelector('#thien-edit-time-btn');
        if (editBtn) {
            editBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                let currentSetting = GM_getValue('thien_layma_countdown', 45);
                let inputVal = prompt("Nhập số giây đếm ngược mới:", currentSetting);
                if (inputVal !== null) {
                    let parsed = parseInt(inputVal.trim());
                    if (!isNaN(parsed) && parsed > 0) {
                        GM_setValue('thien_layma_countdown', parsed);
                        alert(`✅ Đã lưu: ${parsed}s!`);
                    }
                }
            });
        }
        return overlay;
    }

    // --- 6. KIỂM TRA CAPTCHA ---
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
                if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && el.offsetWidth > 5 && el.offsetHeight > 5) {
                    window.dispatchEvent(new CustomEvent('__disable_thien_speedrun__'));
                    return true;
                }
            }
        }
        return false;
    }

    window.addEventListener('DOMContentLoaded', function() {

        // Chuyển hướng link bài viết nội bộ
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
                    try {
                        triggerUniversalClick(chosenLink);
                        setTimeout(() => {
                            if (window.location.href.toLowerCase().split('#')[0] === currentFullUrl) {
                                window.location.href = chosenLink.href;
                            }
                        }, 300);
                    } catch(e) {
                        window.location.href = chosenLink.href;
                    }
                    return true;
                }
            }
            return false;
        }

        // Tự copy code
        function autoCopyCodeEngine() {
            if (hasCopiedCode || !isMasterEnabled || !isLayMaSiteDetected) return;
            let codeFound = null;

            let isLayMaSite = false;
            const laymaSpans = document.querySelectorAll('span, div');
            for (let el of laymaSpans) {
                if (el.offsetWidth > 0) {
                    let compStyle = window.getComputedStyle(el);
                    let bgColor = compStyle.backgroundColor || "";
                    let styleAttr = (el.getAttribute('style') || "").toLowerCase();
                    if ((bgColor.includes('rgb(11, 244, 5)') || styleAttr.includes('rgb(11, 244, 5)')) && (el.innerText && el.innerText.toUpperCase().includes('LẤY MÃ'))) {
                        isLayMaSite = true;
                        break;
                    }
                }
            }

            if (isLayMaSite) {
                let msgEl = document.getElementById('message');
                if (msgEl && msgEl.innerText.includes('Mã Code:')) {
                    let match = msgEl.innerText.match(/Mã Code:\s*([a-zA-Z0-9]{5,15})/i);
                    if (match) codeFound = match[1];
                }

                if (codeFound) {
                    if (codeFound.toLowerCase().includes('sunwin')) {
                        codeFound = null;
                    } else {
                        GM_setClipboard(codeFound, 'text');
                        hasCopiedCode = true;
                        sessionStorage.removeItem('tm_internal_redirected');
                        removeCenterTimerOverlay();
                    }
                }
                return;
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
                let allElements = document.querySelectorAll('div, span');
                for (let el of allElements) {
                    let text = el.innerText.trim();
                    if (text.length >= 5 && text.length <= 15 && /^[a-zA-Z0-9]+$/.test(text) && el.offsetWidth > 0) {
                        let styleAttr = (el.getAttribute('style') || "").toLowerCase();
                        let compStyle = window.getComputedStyle(el);
                        if (compStyle.backgroundColor === 'rgb(255, 102, 0)' || styleAttr.includes('rgb(255, 102, 0)')) {
                            codeFound = text;
                            break;
                        }
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

            if (codeFound) {
                if (codeFound.toLowerCase().includes('sunwin')) {
                    codeFound = null;
                } else {
                    GM_setClipboard(codeFound, 'text');
                    hasCopiedCode = true;
                    sessionStorage.removeItem('tm_internal_redirected');
                    removeCenterTimerOverlay();
                }
            }
        }

        // Tự động xử lý cả hai chiều cuộn (Cuộn lên & Cuộn xuống)
        function handleAutoScrollPrompt() {
            if (!isMasterEnabled || !isLayMaSiteDetected) return;
            let msgEl = document.getElementById('message');
            if (msgEl) {
                let content = (msgEl.innerText || "").toLowerCase();

                // 1. Trường hợp yêu cầu "cuộn lên"
                if (content.includes('cuộn lên để tiếp tục lấy mã') || content.includes('vui lòng cuộn lên')) {
                    if (!isScrollingTriggered) {
                        isScrollingTriggered = true;

                        // Cuộn nhích xuống 10px tạo trigger
                        window.scrollBy({ top: 10, left: 0, behavior: 'instant' });

                        setTimeout(() => {
                            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                            setTimeout(() => {
                                isScrollingTriggered = false;
                            }, 2000);
                        }, 100);
                    }
                }

                // 2. Trường hợp yêu cầu "cuộn xuống"
                else if (content.includes('cuộn xuống để tiếp tục lấy mã') || content.includes('vui lòng cuộn xuống')) {
                    if (!isScrollingTriggered) {
                        isScrollingTriggered = true;

                        // Cuộn nhích lên 10px tạo trigger
                        window.scrollBy({ top: -10, left: 0, behavior: 'instant' });

                        setTimeout(() => {
                            const bottomPos = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
                            window.scrollTo({ top: bottomPos, left: 0, behavior: 'smooth' });
                            setTimeout(() => {
                                isScrollingTriggered = false;
                            }, 2000);
                        }, 100);
                    }
                }
            }
        }

        // Thực thi quy trình Lấy mã
        function doLayMaAutomation() {
            if (!isMasterEnabled || !isLayMaSiteDetected) return;

            let pageText = document.body.innerText || "";
            let msgEl = document.getElementById('message');
            let msgText = msgEl ? (msgEl.innerText || "") : "";

            const hasLaymaPopup = msgText.includes('nhấn bài viết bất kỳ') ||
                                 msgText.includes('bấm vào bài viết bất kỳ') ||
                                 msgText.includes('click 1 lần bài viết') ||
                                 pageText.includes('Click vào liên kết bất kỳ') ||
                                 pageText.includes('bài viết nội bộ khác') ||
                                 pageText.includes('bài viết bất kỳ');

            if (hasLaymaPopup) {
                const redirected = clickInternalLinkOnce();
                if (!redirected && !isReloading) {
                    isReloading = true;
                    setTimeout(() => {
                        window.location.reload();
                    }, 1200);
                }
                return;
            }

            const redirectTime = parseInt(sessionStorage.getItem('thien_redirect_time') || "0");
            const isFreezeActive = redirectTime > 0 && (Date.now() - redirectTime < 800);

            let btnLM = null;
            const laymaSpans = document.querySelectorAll('span, div, button, a');
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
                triggerUniversalClick(btnLM);
            }
        }

        // Quét nhận diện sự xuất hiện của nút Lấy mã
        let scanForLayMaInterval = setInterval(() => {
            if (!isLayMaSiteDetected && detectLayMaPresence()) {
                isLayMaSiteDetected = true;
                clearInterval(scanForLayMaInterval);

                createMasterToggleButton();
                injectSpeedrun();
            }
        }, 300);

        // Theo dõi CAPTCHA
        let captchaWatchdog = setInterval(() => {
            if (!isMasterEnabled || !isLayMaSiteDetected) return;
            if (!isFrozen && isCaptchaPresent()) {
                isFrozen = true;
                clearInterval(captchaWatchdog);

                createCenterTimerOverlay();

                let secondsLeft = parseInt(GM_getValue('thien_layma_countdown', 45));
                let countdownTimer = setInterval(() => {
                    secondsLeft--;

                    const numEl = document.getElementById('thien-timer-num');
                    if (numEl) {
                        numEl.innerText = secondsLeft + 's';
                    }

                    if (secondsLeft <= 0) {
                        clearInterval(countdownTimer);
                        const timerBox = document.getElementById('thien-center-timer');
                        if (timerBox) {
                            timerBox.style.border = "2px solid #2ecc71";
                            timerBox.style.background = "rgba(46, 204, 113, 0.95)";
                            timerBox.innerHTML = `
                                <div style="font-size: 15px !important; font-weight: bold; color: #ffffff;">Đã hết thời gian chờ</div>
                                <div style="font-size: 11px !important; color: #ffffff; margin-top: 2px;">Hãy bấm 'XÁC THỰC VÀ LẤY MÃ'</div>
                            `;
                        }
                    }
                }, 1000);
            }
        }, 150);

        setInterval(handleAutoScrollPrompt, 300);
        setInterval(autoCopyCodeEngine, 500);
        setInterval(() => {
            if (isFrozen) return;
            doLayMaAutomation();
        }, 1000);
    });
})();
