/** @module popup */

'use strict';

import * as common from '../common/common.js';

const g_rowsDiv = document.querySelector('#redirections');

/**
 * Redirect current tab.
 * @function redirect
 * @param redirectUrl {String} Redirect URL.
 * @param tab {tabs.Tab} Information about the current tab.
 */
const redirect = (redirectUrl, tab, e) => {
    chrome.runtime.sendMessage({
        name: 'redirect',
        redirectUrl: redirectUrl,
        tab: tab,
        info: { button: e.button, },
    });
    window.close();
};

/**
 * Create redirection buttons for redirections which are enabled and their
 * enable URL matches the current URL, if they have one.
 * @function loadRows
 * @async
 * @param options {Object} 'rows' property of options, all redirections.
 */
const loadRows = async (options) => {
    const tab = (await browser.tabs.query({
        active: true,
        currentWindow: true,
    }))[0];

    Object.keys(options.rows)
        .sort((title1, title2) =>
            common.compareRowIndices(options.rows, title1, title2))
        .forEach((title) => {
            const row = options.rows[title];
            // No need to check is enableURL supported.
            if (row.enabled && (!row.enableURL ||
                    (new RegExp(row.enableURL)).test(tab.url))) {
                const div = document.createElement('div');
                const button = document.createElement('button');
                button.textContent = title;
                button.addEventListener('click', (e) => redirect(row.url, tab, e));
                button.addEventListener('auxclick', (e) => redirect(row.url, tab, e));
                button.addEventListener('contextmenu', (e) =>
                    redirect(row.url, tab, { button: common.MIDDLE_MOUSE_BUTTON, }));
                div.appendChild(button);
                g_rowsDiv.appendChild(div);
            }
        });
};

/**
 * Add class to an HTML element if we're on mobile, so that CSS can take that
 * into account.
 * @function addMobileClass
 * @async
 */
const addMobileClass = async () => {
    if (await common.isMobile()) {
        document.body.classList.add('mobile');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    addMobileClass();
    chrome.storage.local.get([ 'rows' ], loadRows);
});
