// ==UserScript==
// @downloadURL    https://thiendz.site/raw_script.php?id=5
// @updateURL      https://thiendz.site/meta_script.php?id=5
// @name           Auto Get Code By Thiên
// @namespace      http://tampermonkey.net/
// @version        11.0.0
// @description    AutoGetCode (Giao diện chuẩn Responsive, Kéo thả, Fix lỗi chạm Mobile)
// @author         Thiên
// @icon           https://thiendz.site/uploads/1/1784563166_Gemini_Generated_Image_ikwpibikwpibikwp.webp
// @match          *://*/*
// @grant          GM_setValue
// @grant          GM_getValue
// @grant          GM_setClipboard
// @grant          GM_openInTab
// @run-at         document-start
// @allFrames      true
// ==/UserScript==

(function() {
    'use strict';

    const currentUrl = window.location.href.toLowerCase();
    const currentHost = window.location.hostname.toLowerCase();
    const pageTitle = (document.title || "").toLowerCase();
    const isIframe = (window.self !== window.top);

    if (currentUrl.includes('cloudflare') || currentUrl.includes('challenges') || pageTitle.includes('just a moment')) return;
    if (currentHost.includes('facebook.com') || currentHost.includes('messenger.com') || currentUrl.includes('youtube.com') || currentHost.includes('zalo.me') || currentHost.includes('google.com')) return;

    window.hasTriggeredRedirect = false;

    // Ép trang web luôn ở trạng thái "đang được xem"
    Object.defineProperty(document, 'hidden', { value: false, writable: false });
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: false });
    Object.defineProperty(document, 'hasFocus', { value: function() { return true; }, writable: false });

    // ==========================================
    // 🔧 HÀM TIỆN ÍCH AUTOSCROLL
    // ==========================================
    function executeMicroWheelMovement(isUpward = false) {
        const step = isUpward ? -4 : 4;
        window.scrollBy(0, step);
        const wheelEvt = new WheelEvent('wheel', { bubbles: true, cancelable: true, view: window, deltaY: step, deltaMode: 0 });
        window.dispatchEvent(wheelEvt);
        if (document.documentElement) document.documentElement.dispatchEvent(wheelEvt);
    }

    function forceAbsoluteTargetScroll(isUpward) {
        let targetY = isUpward ? 0 : (Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) || 99999);
        window.scrollTo({ top: targetY, behavior: 'smooth' });
        if (document.documentElement) document.documentElement.scrollTop = targetY;
        if (document.body) document.body.scrollTop = targetY;
    }

    setTimeout(() => {
        const innerTextUpper = document.body.innerText ? document.body.innerText.toUpperCase() : "";
        const whatOnCodeEl = document.querySelector('.whatoncode');
        const hasScrollUpTrap = innerTextUpper.includes('KÉO LÊN CHẬM CHẬM') || innerTextUpper.includes('KÉO LÊN CHẬM') || (whatOnCodeEl && whatOnCodeEl.innerText.toUpperCase().includes('KÉO LÊN'));
        if (!hasScrollUpTrap) { forceAbsoluteTargetScroll(false); }
    }, 600);

    let hasCopiedCode = false;

    function removeCenterTimerOverlay() {
        const timerBox = document.getElementById('thien-center-timer');
        if (timerBox) timerBox.remove();
    }

    // =========================================================================
    // 🖥️ GIAO DIỆN MENU UI (SHADOW DOM + RESPONSIVE + KÉO THẢ)
    // =========================================================================
    window.addEventListener('DOMContentLoaded', function() {
        const isMainPage = (window.self === window.top);
        let uiCheckboxes = {}; let uiRows = {}; let uiLabels = {};
        let statusDiv = null; let logBoxDiv = null;

        function addLog(message, color = '#bdc3c7') {
            console.log(`[AutoCode Log] ${message}`);
            if (isIframe) { window.top.postMessage({ type: 'TM_AUTO_LOG', msg: message, clr: color }, '*'); return; }
            if (logBoxDiv) {
                const logItem = document.createElement('div');
                logItem.className = 'log-item';
                logItem.style.color = color;
                logItem.style.borderLeftColor = color;
                const now = new Date();
                logItem.innerText = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}] ${message}`;
                logBoxDiv.appendChild(logItem);
                logBoxDiv.scrollTop = logBoxDiv.scrollHeight;
                while (logBoxDiv.children.length > 25) { logBoxDiv.removeChild(logBoxDiv.firstChild); }
            }
        }

        if (isMainPage) {
            window.addEventListener('message', function(e) { if (e.data && e.data.type === 'TM_AUTO_LOG') addLog(e.data.msg, e.data.clr); });

            const shadowHost = document.createElement('div');
            shadowHost.id = 'thien-secure-shadow-host';
            // Vị trí mặc định
            let savedX = localStorage.getItem('thien_menu_x') || '20px';
            let savedY = localStorage.getItem('thien_menu_y') || '20px';
            
            shadowHost.style = `position: fixed !important; bottom: ${savedY}; right: ${savedX}; z-index: 2147483647 !important; transition: opacity 0.3s ease;`;
            document.documentElement.appendChild(shadowHost);
            const root = shadowHost.attachShadow({ mode: 'open' });

            const uiCss = `
                :host { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
                #tm-auto-menu {
                    background: rgba(30, 41, 59, 0.9);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    color: #fff;
                    padding: 15px;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1);
                    width: 280px;
                    box-sizing: border-box;
                    transition: width 0.3s, padding 0.3s, height 0.3s;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                #tm-auto-menu.minimized {
                    width: 130px;
                    padding: 8px 12px;
                }
                .header-drag {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 12px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    padding-bottom: 8px;
                    cursor: grab;
                }
                .header-drag:active { cursor: grabbing; }
                .title { font-weight: 600; font-size: 14px; color: #38bdf8; user-select: none; pointer-events: none;}
                .minimized .title { font-size: 13px; margin-right: 5px; }
                .btn-min {
                    background: rgba(255,255,255,0.1); border: none; color: #fff;
                    width: 24px; height: 24px; border-radius: 6px;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    font-weight: bold; transition: background 0.2s;
                }
                .btn-min:hover, .btn-min:active { background: rgba(255,255,255,0.2); }
                
                .content-area { display: block; }
                .minimized .content-area { display: none; }
                
                .row-item {
                    display: flex; align-items: center; margin-bottom: 8px;
                    background: rgba(255,255,255,0.05); padding: 6px 10px;
                    border-radius: 8px; transition: background 0.3s;
                }
                .row-item.active { background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.3); }
                .row-item input[type="checkbox"] {
                    margin-right: 10px; width: 16px; height: 16px; accent-color: #38bdf8;
                }
                .row-item label { flex-grow: 1; cursor: pointer; font-size: 13px; font-weight: 500; user-select: none;}

                .btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; }
                .btn-grid button {
                    background: rgba(255,255,255,0.1); color: #e2e8f0;
                    border: 1px solid rgba(255,255,255,0.1); padding: 8px 4px;
                    border-radius: 6px; font-size: 11px; font-weight: 600;
                    cursor: pointer; transition: all 0.2s;
                    touch-action: manipulation; /* Tối ưu chạm trên mobile */
                }
                .btn-grid button:active { background: #38bdf8; color: #fff; transform: scale(0.96); }

                .status-text { font-size: 11px; color: #94a3b8; margin-bottom: 6px; font-weight: 500; }
                
                .log-box {
                    background: rgba(0,0,0,0.3); border-radius: 6px; padding: 8px;
                    font-family: Consolas, monospace; font-size: 10px; color: #cbd5e1;
                    height: 100px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.05);
                }
                .log-item {
                    margin-bottom: 4px; line-height: 1.4; border-left: 2px solid; padding-left: 6px; word-wrap: break-word;
                }
                .log-box::-webkit-scrollbar { width: 4px; }
                .log-box::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }

                /* Mobile Responsive */
                @media (max-width: 600px) {
                    #tm-auto-menu { width: calc(100vw - 40px); max-width: 300px; padding: 12px; }
                    #tm-auto-menu.minimized { width: auto; max-width: 150px; }
                    .btn-grid button { padding: 10px 4px; font-size: 12px; } /* Nút to hơn trên đt */
                    .row-item { padding: 10px; }
                }
            `;

            root.innerHTML = `
                <style>${uiCss}</style>
                <div id="tm-auto-menu">
                    <div class="header-drag" id="drag-handle">
                        <div class="title" id="menu-title">Auto Code v11.0</div>
                        <button class="btn-min" id="btn-minimize">—</button>
                    </div>
                    <div class="content-area" id="content-area">
                        <div id="list-box"></div>
                        <div class="btn-grid">
                            <button id="btn-up">⬆️ Lên Đỉnh</button>
                            <button id="btn-down">⬇️ Xuống Đáy</button>
                            <button id="btn-scroll">⚡ Cuộn 350px</button>
                            <button id="btn-redirect">🔗 Chuyển Trang</button>
                        </div>
                        <div class="status-text" id="status-div">Trạng thái: Đang chờ...</div>
                        <div class="log-box" id="log-box"></div>
                    </div>
                </div>
            `;

            const menu = root.getElementById('tm-auto-menu');
            const dragHandle = root.getElementById('drag-handle');
            const btnMinimize = root.getElementById('btn-minimize');
            const menuTitle = root.getElementById('menu-title');
            const listBox = root.getElementById('list-box');
            statusDiv = root.getElementById('status-div');
            logBoxDiv = root.getElementById('log-box');

            // --- XỬ LÝ RENDER CHECKBOX ---
            const createMenuRow = (id, labelText, storageKey) => {
                const row = document.createElement('div');
                row.className = 'row-item';
                row.id = 'row-' + storageKey;
                
                const cb = document.createElement('input');
                cb.type = 'checkbox'; cb.id = id;
                cb.checked = GM_getValue(storageKey, false);
                cb.addEventListener('change', function() { GM_setValue(storageKey, this.checked); });
                
                const lbl = document.createElement('label');
                lbl.htmlFor = id; lbl.innerText = labelText;
                
                row.appendChild(cb); row.appendChild(lbl);
                
                uiCheckboxes[storageKey] = cb;
                uiRows[storageKey] = row;
                uiLabels[storageKey] = lbl;
                return row;
            };

            listBox.appendChild(createMenuRow('enable-link4m', 'Link4M', 'link4m_active'));
            listBox.appendChild(createMenuRow('enable-layma', 'LayMa', 'layma_active'));

            // --- XỬ LÝ CLICK/TOUCH NÚT BẤM (HỖ TRỢ MOBILE SIÊU NHẠY) ---
            const bindClickEvent = (elemId, callback) => {
                const el = root.getElementById(elemId);
                if(!el) return;
                // Dùng pointerdown để hỗ trợ tốt nhất trên mọi thiết bị cảm ứng / chuột
                el.addEventListener('pointerdown', (e) => {
                    e.preventDefault(); // Tránh dội sự kiện click
                    callback();
                });
                el.addEventListener('click', (e) => {
                    callback();
                });
            };

            bindClickEvent('btn-up', () => forceAbsoluteTargetScroll(true));
            bindClickEvent('btn-down', () => forceAbsoluteTargetScroll(false));
            bindClickEvent('btn-scroll', () => window.scrollBy({ top: 350, behavior: 'smooth' }));
            bindClickEvent('btn-redirect', () => clickInternalLinkOnce());

            // --- XỬ LÝ ẨN HIỆN MENU ---
            let isMinimized = localStorage.getItem('thien_panel_minimized') === 'true';
            const applyPanelState = () => {
                if (isMinimized) {
                    menu.classList.add('minimized');
                    menuTitle.innerText = '[Auto]';
                    btnMinimize.innerText = 'O';
                } else {
                    menu.classList.remove('minimized');
                    menuTitle.innerText = 'Auto Code v11.0 ✨';
                    btnMinimize.innerText = '—';
                }
            };
            applyPanelState();
            
            // Fix double toggle trên mobile
            btnMinimize.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); toggleMin(); });
            btnMinimize.addEventListener('click', (e) => { e.stopPropagation(); toggleMin(); });
            
            function toggleMin() {
                isMinimized = !isMinimized;
                localStorage.setItem('thien_panel_minimized', isMinimized);
                applyPanelState();
            }

            // --- TÍNH NĂNG KÉO THẢ (HỖ TRỢ CHUỘT & CẢM ỨNG) ---
            let isDragging = false, startX, startY, initialRight, initialBottom;

            const onDragStart = (e) => {
                if (e.target === btnMinimize) return; // Không kéo khi bấm nút ẩn
                isDragging = true;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                startX = clientX;
                startY = clientY;
                
                const rect = shadowHost.getBoundingClientRect();
                initialRight = window.innerWidth - rect.right;
                initialBottom = window.innerHeight - rect.bottom;
                
                menu.style.transition = 'none'; // Tắt hiệu ứng mượt khi đang kéo
            };

            const onDragMove = (e) => {
                if (!isDragging) return;
                e.preventDefault(); // Ngăn cuộn trang khi đang kéo menu trên đt
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                
                const dx = startX - clientX;
                const dy = startY - clientY;
                
                let newRight = initialRight + dx;
                let newBottom = initialBottom + dy;

                // Giới hạn không cho kéo ra ngoài màn hình
                newRight = Math.max(0, Math.min(newRight, window.innerWidth - shadowHost.offsetWidth));
                newBottom = Math.max(0, Math.min(newBottom, window.innerHeight - shadowHost.offsetHeight));

                shadowHost.style.right = `${newRight}px`;
                shadowHost.style.bottom = `${newBottom}px`;
            };

            const onDragEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                menu.style.transition = 'width 0.3s, padding 0.3s, height 0.3s';
                // Lưu vị trí
                localStorage.setItem('thien_menu_x', shadowHost.style.right);
                localStorage.setItem('thien_menu_y', shadowHost.style.bottom);
            };

            dragHandle.addEventListener('mousedown', onDragStart);
            document.addEventListener('mousemove', onDragMove, {passive: false});
            document.addEventListener('mouseup', onDragEnd);

            dragHandle.addEventListener('touchstart', onDragStart, {passive: true});
            document.addEventListener('touchmove', onDragMove, {passive: false});
            document.addEventListener('touchend', onDragEnd);

            // --- AUTO DETECT TÍCH XANH ---
            setInterval(() => {
                const availableList = scanAvailableProviders();
                for (let key in uiCheckboxes) {
                    if (availableList[key]) {
                        if (!uiCheckboxes[key].checked && !hasCopiedCode) {
                            uiCheckboxes[key].checked = true;
                            GM_setValue(key, true);
                            addLog(`⚡ Auto-Detect: Đã tự động bật ${uiLabels[key].innerText}!`, '#f59e0b');
                        }
                        uiRows[key].classList.add('active');
                    } else {
                        uiRows[key].classList.remove('active');
                    }
                }
            }, 1000);
        }

        function scanAvailableProviders() {
            const detected = {};
            if (document.querySelector('img[src*="icon-x64.png"]')) detected['link4m_active'] = true;

            const laymaSpans = document.querySelectorAll('span, div');
            for (let el of laymaSpans) {
                if (el.offsetWidth > 0) {
                    let compStyle = window.getComputedStyle(el);
                    let bgColor = compStyle.backgroundColor || "";
                    let styleAttr = (el.getAttribute('style') || "").toLowerCase();
                    if ((bgColor.includes('rgb(11, 244, 5)') || styleAttr.includes('rgb(11, 244, 5)')) && (el.innerText && el.innerText.toUpperCase().includes('LẤY MÃ'))) {
                        detected['layma_active'] = true;
                        break;
                    }
                }
            }
            return detected;
        }

        // ==========================================
        // 🎯 LỌC CHUẨN LINK BÀI VIẾT 
        // ==========================================
        function clickInternalLinkOnce() {
            if (window.hasTriggeredRedirect || sessionStorage.getItem('tm_internal_redirected') === 'true') return false;

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
                    // Update log (if ui available)
                    if(isMainPage && root) {
                         const lbl = shadowHost.shadowRoot.getElementById('status-div');
                         if(lbl) { lbl.innerText = 'Trạng thái: Đang chuyển hướng...'; lbl.style.color = '#38bdf8'; }
                    }
                    try { 
                        chosenLink.click();
                        // Kích hoạt thêm sự kiện touch nếu đang dùng mobile
                        chosenLink.dispatchEvent(new Event('touchstart', {bubbles: true})); 
                        chosenLink.dispatchEvent(new Event('touchend', {bubbles: true}));
                    } 
                    catch(e) { window.location.href = chosenLink.href; }
                    return true;
                }
            }
            return false;
        }

        // ==========================================
        // 📋 HỆ THỐNG AUTO COPY CHUYÊN SÂU
        // ==========================================
        let isFrozen = false;

        function autoCopyCodeEngine() {
            if (hasCopiedCode) return;
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
                if (isFrozen) {
                    let msgEl = document.getElementById('message');
                    if (msgEl && msgEl.innerText.includes('Mã Code:')) {
                        let match = msgEl.innerText.match(/Mã Code:\s*([a-zA-Z0-9]{5,15})/i);
                        if (match) codeFound = match[1];
                    }
                }
            }

            if (!codeFound) {
                let els = document.querySelectorAll('div, span, b, strong, p, h3, h4');
                for (let el of els) {
                    let text = el.innerText ? el.innerText.trim() : "";
                    if (text.includes('Mã KM:')) {
                        let match = text.match(/Mã KM:\s*([a-zA-Z0-9]{5,10})/i);
                        if (match && el.offsetWidth > 0) { codeFound = match[1]; break; }
                    }
                    if (text.length >= 5 && text.length <= 15 && /^[a-zA-Z0-9]+$/.test(text) && el.offsetWidth > 0) {
                        let styleAttr = (el.getAttribute('style') || "").toLowerCase();
                        let compStyle = window.getComputedStyle(el);
                        if (compStyle.backgroundColor === 'rgb(255, 102, 0)' || styleAttr.includes('rgb(255, 102, 0)')) {
                            codeFound = text; break;
                        }
                    }
                    if (text.length > 5 && text.length < 50 && el.offsetWidth > 0) {
                        let match = text.match(/(?:Mã Code|Mã KM|Mã giải nén|Mã của bạn là|Code)[:\s]+([a-zA-Z0-9]{5,15})/i);
                        if (match) { codeFound = match[1]; break; }
                    }
                }
            }

            if (codeFound && !codeFound.toLowerCase().includes('sunwin')) {
                GM_setClipboard(codeFound, 'text');
                hasCopiedCode = true;
                sessionStorage.removeItem('tm_internal_redirected');
                removeCenterTimerOverlay();
                
                if(isMainPage && statusDiv) {
                    statusDiv.innerText = `✅ Copy thành công: ${codeFound}`;
                    statusDiv.style.color = '#10b981';
                }
                
                ['link4m_active', 'layma_active'].forEach(key => {
                    if (uiCheckboxes[key] && uiCheckboxes[key].checked) {
                        uiCheckboxes[key].checked = false;
                        GM_setValue(key, false);
                    }
                });
            }
        }

        // ==========================================
        // 🛡️ HÀM KIỂM TRA CAPTCHA & OVERLAY
        // ==========================================
        function isCaptchaPresent() {
            const selectors = ['iframe[src*="recaptcha"]', 'iframe[src*="hcaptcha"]', 'iframe[src*="cloudflare"]', '#cf-turnstile', '.g-recaptcha', 'iframe[src*="captcha.la"]'];
            for (let s of selectors) {
                let els = document.querySelectorAll(s);
                for (let el of els) {
                    let style = window.getComputedStyle(el);
                    if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && el.offsetWidth > 10) return true;
                }
            }
            return false;
        }

        function createCenterTimerOverlay() {
            if (document.getElementById('thien-center-timer')) return;
            let savedTime = parseInt(GM_getValue('thien_layma_countdown', 45));

            const overlay = document.createElement('div');
            overlay.id = 'thien-center-timer';
            overlay.style = `
                position: fixed !important; top: 30px !important; left: 50% !important;
                transform: translateX(-50%) !important; z-index: 2147483647 !important;
                background: rgba(15, 23, 42, 0.9) !important; backdrop-filter: blur(10px) !important;
                color: #fff !important; padding: 15px 30px !important; border-radius: 20px !important;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(56, 189, 248, 0.5) !important;
                text-align: center !important; user-select: none !important; font-family: sans-serif !important;
            `;

            overlay.innerHTML = `
                <div style="font-size: 12px !important; color: #94a3b8; display: flex; align-items: center; justify-content: center; gap: 5px; margin-bottom: 5px;">
                    <span>THỜI GIAN CHỜ</span>
                    <span id="thien-edit-btn" style="cursor: pointer; padding: 2px;">✏️</span>
                </div>
                <div id="thien-timer-num" style="font-size: 32px !important; font-weight: bold; color: #38bdf8; text-shadow: 0 0 10px rgba(56,189,248,0.5);">${savedTime}s</div>
            `;
            document.body.appendChild(overlay);

            const editBtn = overlay.querySelector('#thien-edit-btn');
            // Hỗ trợ touch và click
            const handleEdit = (e) => {
                e.preventDefault(); e.stopPropagation();
                let currentSetting = GM_getValue('thien_layma_countdown', 45);
                let inputVal = prompt("Nhập số giây đếm ngược:", currentSetting);
                if (inputVal !== null) {
                    let parsed = parseInt(inputVal.trim());
                    if (!isNaN(parsed) && parsed > 0) { GM_setValue('thien_layma_countdown', parsed); alert("Lưu thành công!"); }
                }
            };
            editBtn.addEventListener('pointerdown', handleEdit);
            editBtn.addEventListener('click', handleEdit);
        }

        let isWheelUpwards = false;

        function doUnifiedAutomation() {
            const run4M = GM_getValue('link4m_active', false);
            const runLM = GM_getValue('layma_active', false);
            const redirectTime = parseInt(sessionStorage.getItem('thien_redirect_time') || "0");
            const isFreezeActive = redirectTime > 0 && (Date.now() - redirectTime < 800);

            if (run4M) {
                let pageText = document.body.innerText || "";
                if (pageText.includes('click vào link bất kỳ') || pageText.includes('click 1 lần bài viết')) {
                    if (clickInternalLinkOnce()) return;
                }
                if (pageText.includes('vui lòng chờ') || pageText.includes('hãy kéo lên thật chậm')) {
                    let maxScrollY = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
                    if (window.scrollY >= maxScrollY - 6) isWheelUpwards = true; else if (window.scrollY <= 6) isWheelUpwards = false;
                    executeMicroWheelMovement(isWheelUpwards);
                }

                let targetImg = document.querySelector('img[src*="icon-x64.png"]');
                if (targetImg) {
                    let btn = targetImg.closest('button') || targetImg.closest('a') || targetImg.parentElement;
                    if(btn) {
                        btn.click(); 
                        btn.dispatchEvent(new Event('touchstart', {bubbles: true}));
                        btn.dispatchEvent(new Event('touchend', {bubbles: true}));
                    }
                }
            }

            if (runLM) {
                let pageText = document.body.innerText || "";
                let msgEl = document.getElementById('message');
                let msgText = msgEl ? (msgEl.innerText || "") : "";

                if (pageText.includes('Vui lòng cuộn lên')) window.scrollTo({ top: 0, behavior: 'smooth' });
                if (pageText.includes('Vui lòng cuộn xuống')) window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

                if (msgText.includes('nhấn bài viết bất kỳ') || pageText.includes('Click vào liên kết bất kỳ')) {
                    if (clickInternalLinkOnce()) return;
                }

                const laymaSpans = document.querySelectorAll('span, div');
                for (let el of laymaSpans) {
                    if (el.offsetWidth > 0) {
                        let compStyle = window.getComputedStyle(el);
                        if ((compStyle.backgroundColor.includes('rgb(11, 244, 5)') || (el.getAttribute('style') || "").includes('rgb(11, 244, 5)')) && el.innerText.toUpperCase().includes('LẤY MÃ')) {
                            let btn = el.closest('button') || el;
                            if (btn && !isFreezeActive) {
                                btn.click();
                                btn.dispatchEvent(new Event('touchstart', {bubbles: true}));
                                btn.dispatchEvent(new Event('touchend', {bubbles: true}));
                            }
                            break;
                        }
                    }
                }
            }
        }

        let captchaWatchdog = setInterval(() => {
            const runLM = GM_getValue('layma_active', false);
            if (runLM && !isFrozen && isCaptchaPresent()) {
                isFrozen = true;
                clearInterval(captchaWatchdog);

                if (isMainPage) createCenterTimerOverlay();

                let secondsLeft = parseInt(GM_getValue('thien_layma_countdown', 45));
                if(statusDiv) { statusDiv.innerText = `Đếm ngược ${secondsLeft}s...`; statusDiv.style.color = '#f59e0b'; }

                let countdownTimer = setInterval(() => {
                    secondsLeft--;
                    const numEl = document.getElementById('thien-timer-num');
                    if (numEl) numEl.innerText = secondsLeft + 's';

                    if (secondsLeft <= 0) {
                        clearInterval(countdownTimer);
                        if(statusDiv) { statusDiv.innerText = "Hết giờ! Tự bấm lấy mã"; statusDiv.style.color = '#10b981'; }
                        const timerBox = document.getElementById('thien-center-timer');
                        if (timerBox) {
                            timerBox.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5), 0 0 0 2px rgba(16, 185, 129, 0.8)";
                            timerBox.innerHTML = `
                                <div style="font-size: 16px !important; font-weight: bold; color: #10b981;">Đã hết thời gian</div>
                                <div style="font-size: 11px !important; color: #cbd5e1; margin-top: 4px;">Hãy bấm XÁC THỰC VÀ LẤY MÃ</div>
                            `;
                        }
                    }
                }, 1000);
            }
        }, 100);

        setInterval(autoCopyCodeEngine, 500);
        setInterval(() => { if (!isFrozen) doUnifiedAutomation(); }, 1000);
    });
})();
