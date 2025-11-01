// ==UserScript==
// @name         YouTube Shorts to Watch Button
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Adds a button to convert YouTube Shorts URLs to Watch URLs, including SPA navigation
// @author
// @match        https://www.youtube.com/shorts/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const BTN_ID = 'tm-watch-btn';

    function addButton() {
        // Only on /shorts/ pages
        if (!location.pathname.startsWith('/shorts/')) return;
        // Prevent duplicate buttons
        if (document.getElementById(BTN_ID)) return;

        // Create the button
        const btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.textContent = '▶️ Watch';
        Object.assign(btn.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '10px 15px',
            backgroundColor: '#FF0000',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            zIndex: 10000,
            fontSize: '16px',
        });

        // Redirect handler
        btn.addEventListener('click', () => {
            const parts = location.pathname.split('/');
            const videoId = parts[2];
            const newUrl = `${location.origin}/watch?v=${videoId}${location.search}`;
            window.location.href = newUrl;
        });

        document.body.appendChild(btn);
    }

    // Hook history API to detect SPA navigation
    const origPush = history.pushState;
    history.pushState = function() {
        origPush.apply(this, arguments);
        setTimeout(addButton, 500);
    };

    const origReplace = history.replaceState;
    history.replaceState = function() {
        origReplace.apply(this, arguments);
        setTimeout(addButton, 500);
    };

    window.addEventListener('popstate', () => setTimeout(addButton, 500));

    // Initial run
    addButton();
})();
