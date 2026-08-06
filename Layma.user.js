// ==UserScript==
// @name         Layma điều khiển
// @namespace    http://tampermonkey.net/
// @version      1.00
// @description  Thiendz - Tối ưu Auto Skip, Random thời gian, Giao diện tối ưu di động & Cảm ứng
// @author       Thiên
// @match        *://layma.net/*
// @match        *://*.layma.net/*
// @match        *://www.google.com/*
// @match        *://www.google.com.vn/*
// @icon         https://thiendz.site/uploads/1/1784563166_Gemini_Generated_Image_ikwpibikwpibikwp.webp
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_openInTab
// ==/UserScript==

(function() {
    'use strict';

    // =================================================================
    // 👁️ PHẦN 1: MẮT THẦN GOOGLE (Dùng khi nhiệm vụ là Từ Khóa)
    // =================================================================
    const isGoogle = window.location.hostname.includes('google.com');
    if (isGoogle) {
        let urlParams = new URLSearchParams(window.location.search);
        let q = urlParams.get('q') || "";
        let targetDomain = GM_getValue('layma_target_domain', '');

        if (!targetDomain && q.includes('site:')) {
            let match = q.match(/site:([^\s]+)/i);
            if (match) {
                targetDomain = match[1].replace('https://', '').replace('http://', '').split('/')[0].trim().toLowerCase();
            }
        }

        if (targetDomain) {
            console.log("🔥 Layma Auto-Clicker đang soi link cho:", targetDomain);
            const checkAndClick = () => {
                const allLinks = document.querySelectorAll('a');
                let clicked = false;
                for (let link of allLinks) {
                    const href = link.href || "";
                    const innerHTML = link.innerHTML || "";
                    const innerText = link.innerText || "";

                    const matchHref = href.toLowerCase().includes(targetDomain);
                    const matchHTML = innerHTML.toLowerCase().includes(targetDomain);
                    const matchText = innerText.toLowerCase().includes(targetDomain);
                    const notGoogle = !href.includes('google.com') && !href.includes('webcache.googleusercontent.com');

                    if ((matchHref || matchHTML || matchText) && notGoogle && link.offsetWidth > 0) {
                        GM_setValue('layma_target_domain', '');
                        link.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => { link.click(); }, 800);
                        clicked = true;
                        break;
                    }
                }
                if (!clicked) setTimeout(checkAndClick, 500);
            };
            checkAndClick();
        }
        return;
    }

    // ==========================================
    // ⚙️ CẤU HÌNH HỆ THỐNG & RANDOM THỜI GIAN
    // ==========================================
    const GLOBAL_TIMER_KEY = 'layma_global_start_time';
    const GLOBAL_TOTAL_TIME_KEY = 'layma_global_total_time';

    function getCalculatedWaitTime() {
        const isRandom = GM_getValue('thien_enable_random_timer', true);
        if (isRandom) {
            const minSec = parseInt(GM_getValue('thien_random_min', 105)); // 1p45s = 105s
            const maxSec = parseInt(GM_getValue('thien_random_max', 130)); // 2p10s = 130s
            const actualMin = Math.min(minSec, maxSec);
            const actualMax = Math.max(minSec, maxSec);
            return Math.floor(Math.random() * (actualMax - actualMin + 1)) + actualMin;
        }
        return parseInt(GM_getValue('thien_fixed_timer', 105));
    }

    let TOTAL_WAIT_TIME = getCalculatedWaitTime();
    let currentRemainingTime = TOTAL_WAIT_TIME;
    let timerInterval;
    let isCopied = false;
    let isSkipping = false;

    // ==========================================
    // 🎨 CSS DÀNH RIÊNG CHO DI ĐỘNG & DESKTOP
    // ==========================================
    if (typeof GM_addStyle !== 'undefined') {
        GM_addStyle(`
            #thien-layma-body::-webkit-scrollbar { width: 4px; }
            #thien-layma-body::-webkit-scrollbar-thumb { background: rgba(71, 85, 105, 0.8); border-radius: 4px; }
            #thien-layma-body::-webkit-scrollbar-track { background: transparent; }

            .thien-radio-label { display: flex; align-items: center; gap: 10px; cursor: pointer; margin-bottom: 10px; font-size: 13px; line-height: 1.4; }
            .thien-radio-label input[type="radio"], .thien-radio-label input[type="checkbox"] {
                cursor: pointer; width: 18px; height: 18px; accent-color: #38bdf8; flex-shrink: 0; margin: 0;
            }
            .thien-input-number {
                width: 60px; height: 32px; background: #0f172a; border: 1px solid #475569;
                color: #38bdf8; border-radius: 6px; text-align: center; font-weight: bold; font-size: 16px;
            }
        `);
    }

    // ==========================================
    // 🖥️ XÂY DỰNG ĐỒNG HỒ TO TRÊN CÙNG MÀN HÌNH
    // ==========================================
    const bigTimerDiv = document.createElement('div');
    bigTimerDiv.id = 'thien-big-timer';
    bigTimerDiv.style.cssText = "position: fixed; top: 10px; left: 50%; transform: translateX(-50%); width: 90vw; max-width: 380px; background: rgba(15, 23, 42, 0.95); color: #38bdf8; padding: 10px 14px; border-radius: 10px; font-weight: bold; font-size: 14px; text-align: center; z-index: 999999; box-shadow: 0 4px 20px rgba(0,0,0,0.7); border: 1.5px solid #38bdf8; font-family: monospace; backdrop-filter: blur(8px); pointer-events: none; transition: all 0.3s ease; display: none; box-sizing: border-box;";
    document.body.appendChild(bigTimerDiv);

    // ==========================================
    // 🖥️ XÂY DỰNG PANEL ĐIỀU KHIỂN MOBILE
    // ==========================================
    const savedLeft = localStorage.getItem('thien_layma_x') || '10px';
    const savedTop = localStorage.getItem('thien_layma_y') || '60px';

    const panel = document.createElement('div');
    panel.style.cssText = `
        position: fixed; top: ${savedTop}; left: ${savedLeft};
        width: min(320px, 92vw); max-height: 85vh;
        background: rgba(15, 23, 42, 0.92); border: 1px solid rgba(59, 130, 246, 0.5); border-radius: 14px;
        z-index: 999998; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-shadow: 0 12px 32px rgba(0,0,0,0.6);
        backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        display: flex; flex-direction: column; overflow: hidden;
        transition: width 0.3s ease; box-sizing: border-box; touch-action: none;
    `;

    // 1. HEADER
    const header = document.createElement('div');
    header.style.cssText = `
        background: linear-gradient(90deg, rgba(29, 78, 216, 0.95), rgba(59, 130, 246, 0.95)); color: white; padding: 10px 14px;
        cursor: move; display: flex; justify-content: space-between; align-items: center;
        user-select: none; border-bottom: 1px solid rgba(37, 99, 235, 0.5); z-index: 10; flex-shrink: 0; touch-action: none;
    `;

    const titleBox = document.createElement('div');
    titleBox.style.cssText = "display: flex; align-items: center; gap: 8px; font-weight: bold;";

    const timeDisplay = document.createElement('span');
    timeDisplay.id = 'lm-timer';
    timeDisplay.style.cssText = "display: none;";

    const toolTitle = document.createElement('span');
    toolTitle.innerText = "Layma Auto ⚡";
    toolTitle.style.cssText = "color: #38bdf8; font-size: 15px; letter-spacing: 0.5px; text-shadow: 0 0 5px rgba(56, 189, 248, 0.4);";

    const editBtn = document.createElement('span');
    editBtn.innerText = '✏️';
    editBtn.style.cssText = "cursor: pointer; font-size: 16px; padding: 4px; transition: 0.2s;";
    editBtn.title = "Chỉnh sửa thời gian";
    editBtn.onclick = () => {
        if (GM_getValue('thien_disable_timer', true)) {
            alert("⚠️ Đếm ngược đang bị tắt trong cài đặt!");
            return;
        }
        let newVal = prompt("Nhập số giây bạn muốn đếm ngược:", currentRemainingTime);
        if (newVal !== null && !isNaN(newVal) && newVal > 0) {
            let parsedVal = parseInt(newVal);
            TOTAL_WAIT_TIME = parsedVal;
            if (GM_getValue('thien_global_timer', true)) {
                let newStartTime = Date.now();
                sessionStorage.setItem(GLOBAL_TIMER_KEY, newStartTime);
                sessionStorage.setItem(GLOBAL_TOTAL_TIME_KEY, parsedVal);
            } else {
                currentRemainingTime = parsedVal;
            }
            startTimer();
        }
    };

    const settingBtn = document.createElement('span');
    settingBtn.innerText = '⚙️';
    settingBtn.style.cssText = "cursor: pointer; font-size: 16px; padding: 4px; transition: 0.2s; margin-left: 2px;";
    settingBtn.title = "Cài đặt tính năng";

    titleBox.appendChild(timeDisplay);
    titleBox.appendChild(toolTitle);
    titleBox.appendChild(editBtn);
    titleBox.appendChild(settingBtn);

    const minimizeBtn = document.createElement('span');
    minimizeBtn.innerText = '—';
    minimizeBtn.style.cssText = "cursor: pointer; font-weight: bold; font-size: 18px; padding: 2px 8px; min-width: 24px; text-align: center;";

    header.appendChild(titleBox);
    header.appendChild(minimizeBtn);
    panel.appendChild(header);

    // 2. BODY
    const body = document.createElement('div');
    body.id = 'thien-layma-body';
    body.style.cssText = `
        padding: 12px; display: flex; flex-direction: column; gap: 10px;
        max-height: calc(85vh - 45px); overflow-y: auto; overflow-x: hidden;
    `;

    // 2.1 BẢNG CÀI ĐẶT
    const settingsDiv = document.createElement('div');
    settingsDiv.style.cssText = "display: none; background: rgba(30, 41, 59, 0.95); padding: 12px; border-radius: 10px; border: 1px dashed rgba(71, 85, 105, 0.8); font-size: 13px; color: #cbd5e1;";

    const modeLabel = document.createElement('div');
    modeLabel.innerText = "Hành động khi có Web/Từ khóa:";
    modeLabel.style.cssText = "font-weight: bold; margin-bottom: 8px; color: #94a3b8;";
    settingsDiv.appendChild(modeLabel);

    const mode1Label = document.createElement('label');
    mode1Label.className = 'thien-radio-label';
    const mode1Radio = document.createElement('input');
    mode1Radio.type = 'radio';
    mode1Radio.name = 'thien_auto_mode';
    mode1Radio.value = 'copy_only';

    const mode2Label = document.createElement('label');
    mode2Label.className = 'thien-radio-label';
    mode2Label.style.marginBottom = '0';
    const mode2Radio = document.createElement('input');
    mode2Radio.type = 'radio';
    mode2Radio.name = 'thien_auto_mode';
    mode2Radio.value = 'tab_only';

    const currentMode = GM_getValue('thien_auto_mode', 'tab_only');
    if (currentMode === 'copy_only') mode1Radio.checked = true;
    else mode2Radio.checked = true;

    mode1Radio.onchange = () => GM_setValue('thien_auto_mode', 'copy_only');
    mode2Radio.onchange = () => GM_setValue('thien_auto_mode', 'tab_only');

    mode1Label.appendChild(mode1Radio);
    mode1Label.appendChild(document.createTextNode("Chỉ copy vào Khay nhớ tạm"));

    mode2Label.appendChild(mode2Radio);
    mode2Label.appendChild(document.createTextNode("Mở Tab (Vào thẳng Link / GG Search)"));

    // TÍNH NĂNG RANDOM THỜI GIAN
    const randomTimerGroup = document.createElement('div');
    randomTimerGroup.style.cssText = 'margin-top: 10px; padding-top: 10px; border-top: 1px dashed rgba(71, 85, 105, 0.8);';

    const randomTimerLabel = document.createElement('label');
    randomTimerLabel.className = 'thien-radio-label';
    randomTimerLabel.style.cssText = 'color: #f59e0b; font-weight: bold; margin-bottom: 8px;';

    const randomTimerCheckbox = document.createElement('input');
    randomTimerCheckbox.type = 'checkbox';
    randomTimerCheckbox.checked = GM_getValue('thien_enable_random_timer', true);
    randomTimerCheckbox.onchange = () => {
        GM_setValue('thien_enable_random_timer', randomTimerCheckbox.checked);
        randomInputsDiv.style.display = randomTimerCheckbox.checked ? 'flex' : 'none';
        sessionStorage.removeItem(GLOBAL_TIMER_KEY);
        sessionStorage.removeItem(GLOBAL_TOTAL_TIME_KEY);
        TOTAL_WAIT_TIME = getCalculatedWaitTime();
        startTimer();
    };

    randomTimerLabel.appendChild(randomTimerCheckbox);
    randomTimerLabel.appendChild(document.createTextNode("Random thời gian (1p45s - 2p10s)"));

    const randomInputsDiv = document.createElement('div');
    randomInputsDiv.style.cssText = `display: ${randomTimerCheckbox.checked ? 'flex' : 'none'}; align-items: center; gap: 6px; font-size: 13px; color: #94a3b8; margin-left: 28px; margin-bottom: 8px;`;

    const inputMin = document.createElement('input');
    inputMin.type = 'number';
    inputMin.className = 'thien-input-number';
    inputMin.value = GM_getValue('thien_random_min', 105);
    inputMin.onchange = () => GM_setValue('thien_random_min', parseInt(inputMin.value) || 105);

    const inputMax = document.createElement('input');
    inputMax.type = 'number';
    inputMax.className = 'thien-input-number';
    inputMax.value = GM_getValue('thien_random_max', 130);
    inputMax.onchange = () => GM_setValue('thien_random_max', parseInt(inputMax.value) || 130);

    randomInputsDiv.appendChild(document.createTextNode("Từ:"));
    randomInputsDiv.appendChild(inputMin);
    randomInputsDiv.appendChild(document.createTextNode("s đến:"));
    randomInputsDiv.appendChild(inputMax);
    randomInputsDiv.appendChild(document.createTextNode("s"));

    randomTimerGroup.appendChild(randomTimerLabel);
    randomTimerGroup.appendChild(randomInputsDiv);

    // TÍNH NĂNG TẮT ĐẾM NGƯỢC THỜI GIAN
    const disableTimerLabel = document.createElement('label');
    disableTimerLabel.className = 'thien-radio-label';
    disableTimerLabel.style.cssText = 'margin-top: 8px; color: #f87171; font-weight: bold;';

    const disableTimerCheckbox = document.createElement('input');
    disableTimerCheckbox.type = 'checkbox';
    disableTimerCheckbox.checked = GM_getValue('thien_disable_timer', true);
    disableTimerCheckbox.onchange = () => {
        GM_setValue('thien_disable_timer', disableTimerCheckbox.checked);
        startTimer();
    };

    disableTimerLabel.appendChild(disableTimerCheckbox);
    disableTimerLabel.appendChild(document.createTextNode("Tắt đếm ngược (Tắt tự bấm)"));

    // TÍNH NĂNG TỰ ĐỘNG DÁN MÃ
    const autoPasteLabel = document.createElement('label');
    autoPasteLabel.className = 'thien-radio-label';
    autoPasteLabel.style.cssText = 'margin-top: 8px; color: #6ee7b7; font-weight: bold;';

    const autoPasteCheckbox = document.createElement('input');
    autoPasteCheckbox.type = 'checkbox';
    autoPasteCheckbox.checked = GM_getValue('thien_auto_paste', false);
    autoPasteCheckbox.onchange = () => GM_setValue('thien_auto_paste', autoPasteCheckbox.checked);

    autoPasteLabel.appendChild(autoPasteCheckbox);
    autoPasteLabel.appendChild(document.createTextNode("Tự động Dán mã & Chờ Submit"));

    // TÍNH NĂNG ĐỔI NHIỆM VỤ
    const autoSkipLabel = document.createElement('label');
    autoSkipLabel.className = 'thien-radio-label';
    autoSkipLabel.style.cssText = 'color: #fca5a5; font-weight: bold; margin-top: 4px;';

    const autoSkipCheckbox = document.createElement('input');
    autoSkipCheckbox.type = 'checkbox';
    autoSkipCheckbox.checked = GM_getValue('thien_skip_keyword', false);
    autoSkipCheckbox.onchange = () => GM_setValue('thien_skip_keyword', autoSkipCheckbox.checked);

    autoSkipLabel.appendChild(autoSkipCheckbox);
    autoSkipLabel.appendChild(document.createTextNode("Tự Đổi NV nếu là Từ khóa (Chỉ làm Link)"));

    // TÍNH NĂNG DÙNG THỜI GIAN THỰC
    const globalTimerLabel = document.createElement('label');
    globalTimerLabel.className = 'thien-radio-label';
    globalTimerLabel.style.cssText = 'margin-top: 10px; padding-top: 10px; border-top: 1px dashed rgba(71, 85, 105, 0.8); color: #38bdf8; font-weight: bold;';

    const globalTimerCheckbox = document.createElement('input');
    globalTimerCheckbox.type = 'checkbox';
    globalTimerCheckbox.checked = GM_getValue('thien_global_timer', true);
    globalTimerCheckbox.onchange = () => {
        GM_setValue('thien_global_timer', globalTimerCheckbox.checked);
        if (globalTimerCheckbox.checked) {
            sessionStorage.setItem(GLOBAL_TIMER_KEY, Date.now());
            sessionStorage.setItem(GLOBAL_TOTAL_TIME_KEY, TOTAL_WAIT_TIME);
        } else {
            sessionStorage.removeItem(GLOBAL_TIMER_KEY);
            sessionStorage.removeItem(GLOBAL_TOTAL_TIME_KEY);
        }
    };

    globalTimerLabel.appendChild(globalTimerCheckbox);
    globalTimerLabel.appendChild(document.createTextNode("Dùng thời gian thực (Đếm xuyên trang)"));

    settingsDiv.appendChild(mode1Label);
    settingsDiv.appendChild(mode2Label);
    settingsDiv.appendChild(randomTimerGroup);
    settingsDiv.appendChild(disableTimerLabel);
    settingsDiv.appendChild(autoPasteLabel);
    settingsDiv.appendChild(autoSkipLabel);
    settingsDiv.appendChild(globalTimerLabel);
    body.appendChild(settingsDiv);

    settingBtn.onclick = () => {
        settingsDiv.style.display = settingsDiv.style.display === 'none' ? 'block' : 'none';
    };

    const btnDoiNV = document.createElement('button');
    btnDoiNV.innerText = '⚡ Auto Đổi NV Lỗi / FB';
    btnDoiNV.style.cssText = `
        background: linear-gradient(to right, #10b981, #059669); color: white;
        border: none; padding: 12px; border-radius: 10px; cursor: pointer;
        font-weight: bold; font-size: 14px; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4);
        transition: all 0.2s; flex-shrink: 0; width: 100%; box-sizing: border-box; min-height: 44px;
    `;
    body.appendChild(btnDoiNV);

    panel.appendChild(body);
    document.body.appendChild(panel);

    // ==========================================
    // 🖱️ LOGIC KÉO THẢ TƯƠNG THÍCH CẢM ỨNG DI ĐỘNG
    // ==========================================
    let isDragging = false, startX, startY, initialX, initialY;

    let isMinimized = localStorage.getItem('thien_layma_minimized') === 'true';
    if (isMinimized) {
        body.style.display = 'none';
        minimizeBtn.innerText = '□';
    }

    const onDragStart = (e) => {
        if (e.target === editBtn || e.target === settingBtn || e.target === minimizeBtn) return;
        isDragging = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        startX = clientX;
        startY = clientY;
        const rect = panel.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
    };

    const onDragMove = (e) => {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        let newX = initialX + (clientX - startX);
        let newY = initialY + (clientY - startY);

        // Giới hạn trong màn hình điện thoại
        newX = Math.max(5, Math.min(newX, window.innerWidth - panel.offsetWidth - 5));
        newY = Math.max(5, Math.min(newY, window.innerHeight - panel.offsetHeight - 5));

        panel.style.left = `${newX}px`;
        panel.style.top = `${newY}px`;
    };

    const onDragEnd = () => {
        if (isDragging) {
            isDragging = false;
            localStorage.setItem('thien_layma_x', panel.style.left);
            localStorage.setItem('thien_layma_y', panel.style.top);
        }
    };

    // Chuột (Desktop)
    header.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);

    // Cảm ứng (Di động)
    header.addEventListener('touchstart', onDragStart, { passive: true });
    document.addEventListener('touchmove', onDragMove, { passive: true });
    document.addEventListener('touchend', onDragEnd);

    minimizeBtn.addEventListener('click', () => {
        isMinimized = !isMinimized;
        localStorage.setItem('thien_layma_minimized', isMinimized);

        body.style.display = isMinimized ? 'none' : 'flex';
        minimizeBtn.innerText = isMinimized ? '□' : '—';
    });

    // ==========================================
    // ⚙️ LOGIC XỬ LÝ CHỨC NĂNG CỐT LÕI
    // ==========================================

    btnDoiNV.onclick = () => {
        if (isSkipping) return;
        isSkipping = true;

        btnDoiNV.innerText = '⏳ Đang xử lý...';
        btnDoiNV.style.background = '#f59e0b';

        let btnBaoLoi = document.getElementById('btn-baoloi');
        if (btnBaoLoi) { btnBaoLoi.click(); }

        let btn2 = document.querySelector('[onclick*="doiNhiemVu"]');
        if (btn2) { btn2.click(); }

        try { if (typeof clickDoiNhiemVu === 'function') clickDoiNhiemVu(); } catch(e){}

        setTimeout(() => {
            let btnXacNhan = document.querySelector('button[onclick="doiNhiemVu();"]');
            if (btnXacNhan) { btnXacNhan.click(); }
            else { try { if (typeof doiNhiemVu === 'function') doiNhiemVu(); } catch(e){} }

            btnDoiNV.innerText = '✅ Thành công!';
            btnDoiNV.style.background = '#3b82f6';
            setTimeout(() => {
                btnDoiNV.innerText = '⚡ Auto Đổi NV Lỗi / FB';
                btnDoiNV.style.background = 'linear-gradient(to right, #10b981, #059669)';
                isSkipping = false;
            }, 1500);
        }, 600);
    };

    function updateDisplay() {
        if (GM_getValue('thien_disable_timer', true)) {
            timeDisplay.innerText = "TẮT";
            if (bigTimerDiv) {
                bigTimerDiv.style.display = "none";
            }
            return;
        }

        let m = Math.floor(currentRemainingTime / 60);
        let s = currentRemainingTime % 60;
        let formattedTime = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

        timeDisplay.innerText = formattedTime;

        if (bigTimerDiv) {
            bigTimerDiv.style.display = "block";
            bigTimerDiv.innerText = `⏳ CHỜ XÁC NHẬN SAU: ${formattedTime}`;
            bigTimerDiv.style.background = "rgba(15, 23, 42, 0.95)";
            bigTimerDiv.style.color = "#38bdf8";
            bigTimerDiv.style.borderColor = "#38bdf8";
        }
    }

    function executeClick() {
        if (GM_getValue('thien_disable_timer', true)) return;

        let codeInput = document.getElementById('codeInput') || document.querySelector('input[name="code"]');
        if (!codeInput) {
            const allInputs = document.querySelectorAll('input[type="text"]');
            for (let input of allInputs) {
                if (!input.readOnly && !input.disabled) {
                    codeInput = input;
                    break;
                }
            }
        }

        if (!codeInput || codeInput.value.trim() === '') {
            if (bigTimerDiv) {
                bigTimerDiv.style.display = "block";
                bigTimerDiv.innerText = "⚠️ CHƯA ĐIỀN MÃ! Đang chờ bạn nhập...";
                bigTimerDiv.style.background = "#f59e0b";
                bigTimerDiv.style.color = "#000";
                bigTimerDiv.style.borderColor = "#fff";
            }

            const checkFilledInterval = setInterval(() => {
                if (GM_getValue('thien_disable_timer', true)) {
                    clearInterval(checkFilledInterval);
                    return;
                }
                let codeInputNow = document.getElementById('codeInput') || document.querySelector('input[name="code"]') || codeInput;
                if (codeInputNow && codeInputNow.value.trim() !== '') {
                    clearInterval(checkFilledInterval);
                    executeClick();
                }
            }, 500);
            return;
        }

        timeDisplay.innerText = "BẤM...";

        if (bigTimerDiv) {
            bigTimerDiv.style.display = "block";
            bigTimerDiv.innerText = "✅ ĐÃ CÓ MÃ! Đang bấm xác nhận...";
            bigTimerDiv.style.background = "#22c55e";
            bigTimerDiv.style.color = "#fff";
            bigTimerDiv.style.borderColor = "#fff";
        }

        let btn = document.getElementById('btn-xac-nhan');
        if (btn) {
            btn.click();
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            try { if (typeof confirm1 === "function") confirm1(); } catch(e) {}
        } else {
            if (bigTimerDiv) {
                bigTimerDiv.style.display = "block";
                bigTimerDiv.innerText = "❌ KHÔNG TÌM THẤY NÚT XÁC NHẬN!";
                bigTimerDiv.style.background = "#ef4444";
            }
        }

        setTimeout(() => { if (bigTimerDiv) bigTimerDiv.remove(); }, 3000);
    }

    function startTimer() {
        clearInterval(timerInterval);

        if (GM_getValue('thien_disable_timer', true)) {
            updateDisplay();
            return;
        }

        if (GM_getValue('thien_global_timer', true)) {
            let st = sessionStorage.getItem(GLOBAL_TIMER_KEY);
            let savedTotal = sessionStorage.getItem(GLOBAL_TOTAL_TIME_KEY);
            if (!st || !savedTotal) {
                st = Date.now();
                TOTAL_WAIT_TIME = getCalculatedWaitTime();
                sessionStorage.setItem(GLOBAL_TIMER_KEY, st);
                sessionStorage.setItem(GLOBAL_TOTAL_TIME_KEY, TOTAL_WAIT_TIME);
            } else {
                TOTAL_WAIT_TIME = parseInt(savedTotal);
            }
        } else {
            TOTAL_WAIT_TIME = getCalculatedWaitTime();
        }

        updateDisplay();

        timerInterval = setInterval(() => {
            if (GM_getValue('thien_disable_timer', true)) {
                clearInterval(timerInterval);
                updateDisplay();
                return;
            }

            if (GM_getValue('thien_global_timer', true)) {
                let st = sessionStorage.getItem(GLOBAL_TIMER_KEY);
                let savedTotal = sessionStorage.getItem(GLOBAL_TOTAL_TIME_KEY);
                if (!st || !savedTotal) {
                    st = Date.now();
                    TOTAL_WAIT_TIME = getCalculatedWaitTime();
                    sessionStorage.setItem(GLOBAL_TIMER_KEY, st);
                    sessionStorage.setItem(GLOBAL_TOTAL_TIME_KEY, TOTAL_WAIT_TIME);
                } else {
                    TOTAL_WAIT_TIME = parseInt(savedTotal);
                }
                let elapsed = Math.floor((Date.now() - parseInt(st)) / 1000);
                currentRemainingTime = Math.max(0, TOTAL_WAIT_TIME - elapsed);
            } else {
                currentRemainingTime--;
            }

            updateDisplay();

            if (currentRemainingTime <= 0) {
                clearInterval(timerInterval);
                sessionStorage.removeItem(GLOBAL_TIMER_KEY);
                sessionStorage.removeItem(GLOBAL_TOTAL_TIME_KEY);
                executeClick();
            }
        }, 1000);
    }

    startTimer();

    // ==========================================
    // 🧠 MẮT THẦN ĐỌC NHIỆM VỤ
    // ==========================================
    const watchDogInterval = setInterval(() => {
        if (isSkipping) return;

        const linkFB = document.getElementById('linkFB');
        if (linkFB) {
            clearInterval(watchDogInterval);
            btnDoiNV.click();
            return;
        }

        const pageText = document.body.innerText || "";
        const isKeywordTask = pageText.includes('Gõ từ khóa trên vào tìm kiếm Google') || pageText.includes('tìm kiếm Google');

        if (isKeywordTask && GM_getValue('thien_skip_keyword', false)) {
            console.log("⏭️ Phát hiện NV Từ khóa qua Text HTML, đang tự động Đổi NV mới...");
            btnDoiNV.click();
            return;
        }

        if (isCopied) return;

        const linkElement = document.getElementById('linkWeb');
        if (linkElement && linkElement.innerText.trim() !== '') {
            const tuKhoa = linkElement.innerText.trim();
            isCopied = true;

            const isUrl = tuKhoa.startsWith('http://') || tuKhoa.startsWith('https://');
            const isDomain = tuKhoa.includes('.') && !tuKhoa.includes(' ') && !tuKhoa.includes(':');

            if (!isUrl && !isDomain && GM_getValue('thien_skip_keyword', false)) {
                btnDoiNV.click();
                return;
            }

            const currentMode = GM_getValue('thien_auto_mode', 'tab_only');

            if (currentMode === 'copy_only') {
                GM_setClipboard(tuKhoa, 'text');
            } else {
                if (isUrl) {
                    GM_openInTab(tuKhoa, { active: true });
                } else if (isDomain && !isKeywordTask) {
                    GM_openInTab(`https://${tuKhoa}`, { active: true });
                } else {
                    let domain = tuKhoa.replace('site:', '').split('/')[0].trim().toLowerCase();
                    GM_setValue('layma_target_domain', domain);
                    let searchStr = tuKhoa.toLowerCase().startsWith('site:') ? tuKhoa : `site:${tuKhoa}`;
                    GM_openInTab(`https://www.google.com/search?q=${encodeURIComponent(searchStr)}`, { active: true });
                }
            }
        }
    }, 500);

    // ==========================================
    // ⚡ AUTO PASTE MỚI (Chỉ dán mã 5-10 ký tự)
    // ==========================================
    async function xuLyDanMa() {
        if (!GM_getValue('thien_auto_paste', false)) return;

        try {
            const clipText = await navigator.clipboard.readText();
            const cleanText = clipText.trim();

            const isLaymaCode = /^[a-zA-Z0-9]{5,10}$/.test(cleanText);

            if (cleanText && isLaymaCode) {
                let codeInput = document.getElementById('codeInput') || document.querySelector('input[name="code"]');

                if (!codeInput) {
                     const allInputs = document.querySelectorAll('input[type="text"]');
                     for (let input of allInputs) {
                         if (!input.readOnly && !input.disabled) codeInput = input;
                     }
                }

                if (codeInput && codeInput.value !== cleanText) {
                    codeInput.value = cleanText;
                    console.log("🔥 Đã tự động dán chuẩn xác MÃ LAYMA:", cleanText);

                    codeInput.dispatchEvent(new Event('input', { bubbles: true }));
                    codeInput.dispatchEvent(new Event('change', { bubbles: true }));

                    codeInput.style.backgroundColor = "#dcfce3";
                    codeInput.style.border = "2px solid #22c55e";
                }
            }
        } catch (err) {
        }
    }

    window.addEventListener('focus', xuLyDanMa);
    window.addEventListener('click', xuLyDanMa);

})();
