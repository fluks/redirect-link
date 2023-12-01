/** @module background */

'use strict';

import * as common from '../common/common.js';

// Default options.
const g_defaultOptions = {
    rows: {
        'Google WebCache': {
            url: 'https://webcache.googleusercontent.com/search?q=cache:%u',
            enabled: true,
        },
        'Wayback Machine (search)': {
            url: 'https://web.archive.org/web/*/%u',
            enabled: true,
        },
        'Wayback Machine (save)': {
            url: 'https://web.archive.org/save/%u',
            enabled: true,
        },
        'archive.is (search)': {
            url: 'https://archive.is/%u',
            enabled: true,
        },
        // Start update rows.
        // Add these also in setDefaultOptions if the reason is update.
        'archive.is (save)': {
            url: 'https://archive.is/?run=1&url=%u',
            enabled: true,
        },
        // End update rows.
    },
    'switch-to-opened-tab': false,
    'open-in-container': true,
    'open-to-new-tab': false,
},
g_currentTabIdSuffix = '-current';
let g_alwaysRedirects = [];

/**
 * Create context menu items.
 * @function addContextMenuItems
 * @param rows {Object} Redirect options.
 */
const addContextMenuItems = (rows) => {
    Object.keys(rows)
        .sort((title1, title2) =>
            common.compareRowIndices(rows, title1, title2))
        .forEach(title => {
            const row = rows[title];

            if (row && row.enabled && !row.redirectAlways) {
                chrome.contextMenus.create({
                    id: title,
                    contexts: [ 'link' ],
                    title: title,
                    icons: { 32: row.favicon },
                });

                chrome.contextMenus.create({
                    id: title + g_currentTabIdSuffix,
                    contexts: [ 'page' ],
                    title: title,
                    icons: { 32: row.favicon },
                });
            }
        });
};

/**
 * Create context menu items when the addon is enabled.
 * @function setupContextMenus
 */
const setupContextMenus = () => {
    chrome.storage.local.get(null, (options) => {
        if (!options || Object.keys(options).length === 0)
            options = g_defaultOptions;
        addContextMenuItems(options.rows);
    });
};

/**
 * Create context menu items when options are changed. 
 * @function updateContextMenus
 * @param changes {Object} Options that changed.
 */
const updateContextMenus = (changes) => {
    if (Object.prototype.hasOwnProperty.call(changes, 'rows')) {
        chrome.contextMenus.removeAll(() => {
            addContextMenuItems(changes.rows.newValue);
        });
    }
};

/**
 * Save default options on addon install.
 * @function setDefaultOptions
 * @param details {Object} Details about installed addon.
 */
const setDefaultOptions = (details) => {
    if (details.reason === 'install') {
        chrome.storage.local.set(g_defaultOptions);
    }
    else if (details.reason === 'update') {
        chrome.storage.local.get(null, async (opts) => {
            // Add new options here.
            // These are new redirections from g_defaultOptions between start
            // update rows and end update rows.
            const updateRows = {
                'archive.is (save)': {
                    url: 'https://archive.is/?run=1&url=%u',
                    enabled: true,
                },
            };
            Object.keys(updateRows).forEach(k => {
                if (!Object.prototype.hasOwnProperty.call(opts.rows, k))
                    opts.rows[k] = updateRows[k];
            });

            if (!Object.prototype.hasOwnProperty.call(opts, 'open-in-container'))
                opts['open-in-container'] = true;

            if (!Object.prototype.hasOwnProperty.call(opts, 'open-to-new-tab') ||
                    (await common.detectBrowser() !== common.CHROME)) {
                opts['open-to-new-tab'] = false;
            }

            chrome.storage.local.set(opts);
        });
    }
};

/**
 * Redirect the current tab or link to new tab. If replaceFormats throws an
 * error, redirection doesn't happen.
 * @function redirect
 * @param info {?OnClickData} Information about the item clicked and the context
 * where the click happened, null if browser action is used.
 * @param tab {chrome.tabs.Tab} The details of the tab where the click took
 * place.
 * @param url {String|undefined} Redirect URL when browser action is used,
 * undefined otherwise.
 * @param isPopup {Boolean} True if user used browser action popup, false
 * otherwise.
 */
const redirect = (info, tab, url, isPopup) => {
    chrome.storage.local.get(null, async (options) => {
        let targetUrl = '',
            menuItemId = '',
            redirectUrl = '';

        // Browser action.
        if (isPopup) {
            targetUrl = tab.url;
            redirectUrl = url;
        }
        // Redirect current tab.
        else if (info.menuItemId.endsWith(g_currentTabIdSuffix)) {
            menuItemId = info.menuItemId.split(g_currentTabIdSuffix, 1)[0];
            redirectUrl = options.rows[menuItemId].url;
            targetUrl = tab.url;
        }
        // Redirect link.
        else {
            menuItemId = info.menuItemId;
            redirectUrl = options.rows[menuItemId].url;
            targetUrl = info.linkUrl;
        }

        try {
            redirectUrl = format.replaceFormats(redirectUrl, targetUrl);
        }
        catch (error) {
            console.log(error);
            return;
        }

        const args = {
            url: redirectUrl, index: tab.index + 1,
            active: options['switch-to-opened-tab'],
        };
        if (await common.isSupportedContainer() && options['open-in-container'])
            args.cookieStoreId = tab.cookieStoreId;

        const browser = await common.detectBrowser();
        if ((options['open-to-new-tab'] && browser !== common.FIREFOX_FOR_ANDROID) ||
                (!options['open-to-new-tab'] && browser === common.FIREFOX && info.button === common.MIDDLE_MOUSE_BUTTON)) {
            chrome.tabs.create(args);
        }
        else
            chrome.tabs.update({ url: redirectUrl, });
    });
};

/**
 * Hide redirects which have an enableURL setting set and doesn't match the
 * link's or page's URL.
 * <all_urls> permission is needed for many of info's properties, @see
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus/onShown.
 * Not needed on Chromium because it doesn't have necessary APIs.
 * @param info {Object} OnClickData and contexts and menuIds.
 */
const hideRedirects = (info) => {
    if (!info.contexts.some(c => [ 'page', 'link' ].includes(c)))
        return;

    const url = info.linkUrl || info.pageUrl;
    chrome.storage.local.get([ 'rows' ], (rows) => {
        Object.keys(rows.rows).forEach(i => {
            const enablePattern = rows.rows[i].enableURL;
            if (rows.rows[i].enabled && enablePattern) {
                const regex = new RegExp(enablePattern);
                const prop = { visible: regex.test(url) };
                chrome.contextMenus.update(i, prop);
                chrome.contextMenus.update(i + g_currentTabIdSuffix, prop);
            }
        });
        chrome.contextMenus.refresh();
    });
};

/**
 * Redirect always redirected URLs.
 * @function redirectWebRequest
 * @param details {Object} Details about the request.
 * @return {Object|undefined} Undefined if no redirection is made or on error, Object otherwise.
 */
const redirectWebRequest = (details) => {
    const redirect = g_alwaysRedirects.find(r => (new RegExp(r.enableURL)).test(details.url));
    if (!redirect)
        return;
    try {
        return { redirectUrl: format.replaceFormats(redirect.url, details.url), };
    }
    catch (error) {
        console.log(error);
        return;
    }
};

/**
 * Update global variable that has always redirected URLs on change of settings.
 * @function updateAlwaysRedirects
 */
const updateAlwaysRedirects = () => {
    chrome.storage.local.get('rows', (options) => {
        g_alwaysRedirects = [];
        Object.values(options.rows).forEach(row => {
            if (row.enabled && row.redirectAlways && row.enableURL)
                g_alwaysRedirects.push(row);
        });
    });
};

chrome.runtime.onInstalled.addListener(setDefaultOptions);

// TODO This uses contextMenus API, move it to the below the isSupportedMenus
// check.
setupContextMenus();

(async () => {
    if (await common.isSupportedMenus()) {
        chrome.storage.onChanged.addListener(updateContextMenus);
        chrome.contextMenus.onClicked.addListener(redirect);
        if (await common.isSupportedMenuOnShown()) {
            chrome.contextMenus.onShown.addListener(hideRedirects);
        }
    }
})();
chrome.runtime.onMessage.addListener((request) => {
    if (request.name === 'redirect') {
        redirect(request.info, request.tab, request.redirectUrl, true);
    }
});
updateAlwaysRedirects();
chrome.storage.onChanged.addListener(updateAlwaysRedirects);
chrome.webRequest.onBeforeRequest.addListener(redirectWebRequest, {
    urls: [ '<all_urls>' ], types: [ 'main_frame' ],
}, [ 'blocking' ]);
