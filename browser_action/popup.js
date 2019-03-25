/** @module popup */

'use strict';

const g_rowsDiv = document.querySelector('#redirections');

/**
 * Redirect current tab.
 * @function redirect
 * @param redirectUrl {String} Redirect URL.
 * @param tab {tabs.Tab} Information about the current tab.
 */
const redirect = (redirectUrl, tab) => {
    chrome.runtime.sendMessage({
        name: 'redirect',
        redirectUrl: redirectUrl,
        tab: tab,
    });
    window.close();
};

/**
 * Create redirection buttons for redirections which are enabled and their
 * enable URL matches the current URL, if they have one.
 * @function loadRows
 * @param options {Object} 'rows' property of options, all redirections.
 */
const loadRows = (options) => {
    const tabs = browser.tabs.query({ active: true, currentWindow: true });

    Object.keys(options.rows).forEach(async (key) => {
        const row = options.rows[key];
        // No need to check is enableURL supported.
        if (row.enabled && (!row.enableURL ||
                (new RegExp(row.enableURL)).test((await tabs)[0].url))) {
            const div = document.createElement('div');
            const button = document.createElement('button');
            button.textContent = key;
            const tab = (await tabs)[0];
            button.addEventListener('click', () => redirect(row.url, tab));
            div.appendChild(button);
            g_rowsDiv.appendChild(div);
        }
    });
};

chrome.storage.local.get([ 'rows' ], loadRows);
