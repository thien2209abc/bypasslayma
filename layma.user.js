// ==UserScript==
// @name         Speedrun tốc độ lấy mã by Thiên
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Tự động chạy tool Thiên Bypass
// @author       Thiên
// @match        *://www.57plus.com.co/*
// @match        *://gurbakshboutique.in.net/*
// @match        *://baovengayvademtaybacsg.com/*
// @match        *://fun88bch.eu.com/*
// @match        *://dacsanquangninh.net/*
// @match        *://keonhacai.sale/*
// @match        *://nullsbrawl.it.com/*
// @match        *://sunwinbc.com/*
// @match        *://alfredosuarez.com.mx/*
// @match        *://kubetchuan.com/*
// @match        *://webhd.vn/*
// @match        *://skcakesayjk.in.net/*
// @match        *://skcakesayjk.in.net*
// @match        *://thanhtamplastic.com.vn/*
// @match        *://thaimarket.vn/*
// @match        *://footpassion.co/*
// @match        *://klussenbedrijfhengelo.nl/*
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *
// @match        *:// *

// @grant        none
// @run-at       document-start
// @icon         https://thiendz.site/uploads/1/1776774558_7713a1f433d9fd660d7059e5e38237bd_2876629715095874007.webp
// ==/UserScript==

(function() {
    'use strict';

    // Đảm bảo script chỉ chạy 1 lần
    if (window.thienFinalScriptLoaded) return;
    window.thienFinalScriptLoaded = true;

    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;

    // Kích hoạt Bypass: Tua nhanh thời gian
    (function initSpeedrun() {
        console.log("[Thiên Bypass] Giám sát viên đang được triển khai...");
        const speedMultiplier = 100; // Tốc độ x100
        const applySpeedhack = () => {
            window.setTimeout = (fn, delay) => originalSetTimeout(fn, delay / speedMultiplier);
            window.setInterval = (fn, delay) => originalSetInterval(fn, delay / speedMultiplier);
        };
        applySpeedhack();
        originalSetInterval(applySpeedhack, 100);
    }());

    // Tạo giao diện thông báo
    function showNotification() {
        const notifId = 'thien-bypass-notification';
        if (document.getElementById(notifId)) return;

        const container = document.createElement('div');
        container.id = notifId;

        // Đã cập nhật nội dung thành "Thiên"
        container.innerHTML = `
            <div class="thien-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.829 15.632l-1.98-1.144c-.23-.132-.383-.377-.383-.644v-2.288c0-1.851-1.202-3.436-2.92-3.992.052-.224.079-.456.079-.691 0-.968-.38-1.851-.989-2.497l-.001-.001c-.61-.647-1.488-1.03-2.45-1.03s-1.841.383-2.451 1.031c-.609.646-.989 1.529-.989 2.497 0 .235.027.467.079.691-1.718.556-2.92 2.141-2.92 3.992v2.288c0 .267-.153.512-.383.644l-1.98 1.144c-.293.17-.411.536-.296.861.115.324.418.536.759.536h14.9c.341 0 .644-.212.759-.536.115-.325-.003-.691-.296-.861zM12 22c1.105 0 2-.895 2-2h-4c0 1.105.895 2 2 2z"/>
                </svg>
            </div>
            <div class="thien-content">
                <div class="thien-title">Thiên Bypass Đã Kích Hoạt</div>
                <div class="thien-message">Cảm ơn bạn đã sử dụng code by Thiên.</div>
            </div>
            <div class="thien-close" title="Đóng">&times;</div>
        `;

        const style = document.createElement('style');
        style.innerHTML = `
            #${notifId} {
                position: fixed; top: 25px; right: 25px;
                background-color: rgba(30, 35, 50, 0.7); color: #e0e0e0;
                padding: 12px 18px; border-radius: 12px; z-index: 2147483647;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
                font-family: 'Segoe UI', 'Roboto', sans-serif;
                backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.18);
                display: flex; align-items: center; gap: 15px;
                opacity: 0; transform: translateX(120%);
                transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
            }
            #${notifId}.visible {
                opacity: 1; transform: translateX(0);
            }
            .thien-icon { width: 24px; height: 24px; color: #a955ff; }
            .thien-content { display: flex; flex-direction: column; }
            .thien-title { font-size: 15px; font-weight: 600; color: #ffffff; }
            .thien-message { font-size: 13px; color: #c0c0c0; }
            .thien-close {
                font-size: 24px; color: #aaa; cursor: pointer;
                padding: 0 5px; margin-left: 10px; font-weight: 300; transition: color 0.2s ease;
            }
            .thien-close:hover { color: #fff; }
        `;

        document.head.appendChild(style);
        document.body.appendChild(container);

        // Hiệu ứng đóng thông báo
        const closeNotif = () => {
            container.classList.remove('visible');
            originalSetTimeout(() => {
                container.remove();
                style.remove();
            }, 250);
        };

        container.querySelector('.thien-close').addEventListener('click', closeNotif);

        // Hiển thị và tự động ẩn sau 5 giây
        originalSetTimeout(() => { container.classList.add('visible'); }, 100);
        originalSetTimeout(closeNotif, 5000);

        console.log("[Thiên Bypass] Thông báo đã được hiển thị.");
    }

    // Chờ cho body xuất hiện rồi mới chèn UI vào
    function waitForBody() {
        if (document.body) {
            showNotification();
        } else {
            originalSetTimeout(waitForBody, 100);
        }
    }
    waitForBody();

})();
