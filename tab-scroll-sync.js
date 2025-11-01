// ==UserScript==
// @name         Edge 탭 스크롤 동기화
// @namespace    http://tampermonkey.net/
// @version      1.4.5
// @description  두 개의 Edge 브라우저 탭 간 스크롤 동기화 (자동 동기화, 고정된 메뉴 순서, 전체 동기화 해제 기능 추가)
// @author       Your Name
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @noframes
// ==/UserScript==

(function() {
    'use strict';

    let syncEnabled = false;
    let targetTabId = null;
    const syncListKey = 'syncList';
    const currentTabId = getCurrentTabId();
    const menuIds = {
        toggleSync: null,
        slot1: null,
        slot2: null,
        clearSync: null
    };

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function getCurrentTabId() {
        if (!window.name) {
            window.name = generateUUID();
        }
        return window.name;
    }

    function onWheel(event) {
        if (!syncEnabled || !targetTabId) return;
        const scrollDelta = event.deltaY;
        GM_setValue('scrollDelta_' + currentTabId, scrollDelta);
        GM_setValue('scroll_trigger', currentTabId);
    }

    function applyScrollDelta(delta) {
        window.scrollBy(0, delta);
    }

    function enableSync() {
        if (!syncEnabled) {
            syncEnabled = true;
            console.log('Synchronization enabled.');
        }
    }

    function disableSync() {
        if (syncEnabled) {
            syncEnabled = false;
            console.log('Synchronization disabled.');
        }
    }

    function removeFromSyncList() {
        const syncList = GM_getValue(syncListKey, [null, null]);
        const index = syncList.indexOf(currentTabId);
        if (index !== -1) {
            syncList[index] = null;
            GM_setValue(syncListKey, syncList);
            console.log('Current tab ID removed from sync list: ' + currentTabId);
        }
        targetTabId = null;
        disableSync();
        updateMenu();
    }

    function addToSyncList() {
        const syncList = GM_getValue(syncListKey, [null, null]);
        if (syncList.includes(currentTabId)) {
            console.log('Current tab ID is already in the sync list: ' + currentTabId);
            return;
        }
        const emptyIndex = syncList.indexOf(null);
        if (emptyIndex !== -1) {
            syncList[emptyIndex] = currentTabId;
            GM_setValue(syncListKey, syncList);
            console.log('Current tab ID added to sync list: ' + currentTabId);
            const otherTabId = syncList[1 - emptyIndex];
            if (otherTabId) {
                console.log('Other tab ID: ' + otherTabId);
                targetTabId = otherTabId;
                enableSync();
            }
        } else {
            console.log('Sync list is full.');
        }
        updateMenu();
    }

    function clearSyncList() {
        const syncList = GM_getValue(syncListKey, [null, null]);
        syncList.forEach(tabId => {
            if (tabId && tabId !== currentTabId) {
                //GM_setValue('syncEnabled_' + tabId, false);
                console.log('Sync disabled for tab ID: ' + tabId);
            }
        });
        GM_setValue(syncListKey, [null, null]);
        targetTabId = null;
        disableSync();
        console.log('Sync list cleared.');
        updateMenu();
    }

    function updateMenu() {
        for (const key in menuIds) {
            if (menuIds[key] !== null) {
                GM_unregisterMenuCommand(menuIds[key]);
            }
        }

        const syncList = GM_getValue(syncListKey, [null, null]);

        const isInSyncList = syncList.includes(currentTabId);
        const toggleLabel = isInSyncList ? 'Remove from Sync List' : 'Add to Sync List';
        menuIds.toggleSync = GM_registerMenuCommand(toggleLabel, isInSyncList ? removeFromSyncList : addToSyncList);

        const slot1Title = syncList[0] ? GM_getValue('tabTitle_' + syncList[0], 'Unknown Title') : 'null';
        const slot1Label = `Slot 1: ${slot1Title}`;
        menuIds.slot1 = GM_registerMenuCommand(slot1Label, () => {});

        const slot2Title = syncList[1] ? GM_getValue('tabTitle_' + syncList[1], 'Unknown Title') : 'null';
        const slot2Label = `Slot 2: ${slot2Title}`;
        menuIds.slot2 = GM_registerMenuCommand(slot2Label, () => {});

        menuIds.clearSync = GM_registerMenuCommand('Clear Sync List', clearSyncList);
    }

    GM_setValue('tabTitle_' + currentTabId, document.title);

    window.addEventListener('wheel', onWheel, { passive: false });

    setInterval(() => {
        if (!syncEnabled || !targetTabId) return;
        const trigger = GM_getValue('scroll_trigger', null);
        if (trigger && trigger !== currentTabId) {
            const scrollDelta = GM_getValue('scrollDelta_' + targetTabId, null);
            if (scrollDelta !== null) {
                applyScrollDelta(scrollDelta);
                GM_setValue('scroll_trigger', null);
            }
        }
    }, 10);

    GM_addValueChangeListener(syncListKey, function(name, old_value, new_value, remote) {
        if (remote) {
            const syncList = new_value;
            if (syncList.includes(currentTabId)) {
                const otherTabId = syncList.find(id => id !== currentTabId && id !== null);
                targetTabId = otherTabId || null;
                if (targetTabId) {
                    console.log('Target tab ID set to: ' + targetTabId);
                    enableSync();
                } else {
                    console.log('No target tab ID found.');
                    disableSync();
                }
            } else {
                targetTabId = null;
                disableSync();
            }
            updateMenu();
        }
    });

    window.addEventListener('beforeunload', () => {
        removeFromSyncList();/*
        const syncList = GM_getValue(syncListKey, [null, null]);
        const otherTabId = syncList.find(id => id !== currentTabId && id !== null);
        if (otherTabId) {
            //GM_setValue('syncEnabled_' + otherTabId, false);
            alert('The synchronized tab has been closed or refreshed. Synchronization has been disabled.');
        }*/
    });

    updateMenu();
})();








