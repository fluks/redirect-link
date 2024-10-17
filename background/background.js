/** @module background */

'use strict';

import * as common from '../common/common.js';
import {format} from './format.js';

// Default options.
const G_DEFAULT_OPTIONS = {
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
G_CURRENT_TAB_ID_SUFFIX = '-current';

/**
 * Create context menu items.
 * @function addContextMenuItems
 * @param rows {Object} Redirect options.
 */
const addContextMenuItems = (rows) => {
    Object.keys(rows)
        .sort((title1, title2) =>
            common.compareRowIndices(rows, title1, title2))
        .forEach(async title => {
            const row = rows[title];

            if (row && row.enabled && !row.redirectAlways) {
                const options = {
                    id: title,
                    contexts: [ 'link' ],
                    title: title,
                };
                if (await common.detectBrowser() === common.FIREFOX) {
                    if (row.favicon)
                        options.icons = { '16': row.favicon['16'], '32': row.favicon['32'], };
                }
                chrome.contextMenus.create(options);

                options.id = title + G_CURRENT_TAB_ID_SUFFIX;
                options.contexts = [ 'page' ];
                chrome.contextMenus.create(options);
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
            options = G_DEFAULT_OPTIONS;
        chrome.contextMenus.removeAll(() => addContextMenuItems(options.rows));
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
        chrome.storage.local.set(G_DEFAULT_OPTIONS);
    }
    else if (details.reason === 'update') {
        chrome.storage.local.get(null, async (opts) => {
            // Add new options here.
            // These are new redirections from G_DEFAULT_OPTIONS between start
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

            // There used to be only one sized favicon. Use old for both sizes.
            Object.keys(opts.rows).forEach(name => {
                if (opts.rows[name].favicon && typeof opts.rows[name].favicon !== 'object') {
                    opts.rows[name].favicon = {
                        '16': opts.rows[name].favicon,
                        '32': opts.rows[name].favicon,
                    };
                }
            });

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
        else if (info.menuItemId.endsWith(G_CURRENT_TAB_ID_SUFFIX)) {
            menuItemId = info.menuItemId.split(G_CURRENT_TAB_ID_SUFFIX, 1)[0];
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
                chrome.contextMenus.update(i + G_CURRENT_TAB_ID_SUFFIX, prop);
            }
        });
        chrome.contextMenus.refresh();
    });
};

/**
 * @function makeAlwaysRules
 * @param newRules {Array.Object} Redirect rows.
 * @return {Array.Rule} New rules.
 */
const makeAlwaysRules = newRules => {
    return newRules.map((redirect, i) => {
        return {
            id: i + 1,
            priority: 1,
            action: {
                type: 'redirect',
                redirect: {
                    regexSubstitution: redirect.url,
                },
            },
            condition: {
                regexFilter: redirect.enableURL,
                resourceTypes: [ 'main_frame', ],
            },
        };
    });
};

/**
 * @function updateAlwaysRedirects
 * @async
 */
const updateAlwaysRedirects = async () => {
    chrome.storage.local.get('rows', async (options) => {
        if (!options || !options.rows) {
            return;
        }

        const newRules = Object.values(options.rows).filter(row => {
            return row.enabled && row.redirectAlways && row.enableURL
        });
        const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
        const oldRuleIds = oldRules.map(rule => rule.id);
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: oldRuleIds,
            addRules: makeAlwaysRules(newRules),
        });
    });
};

chrome.runtime.onInstalled.addListener(setDefaultOptions);
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'update') {
        updateAlwaysRedirects();
    }
});
if (chrome.contextMenus) {
    setupContextMenus();
    chrome.storage.onChanged.addListener(updateContextMenus);
    chrome.contextMenus.onClicked.addListener(redirect);
    if (chrome.contextMenus.onShown) {
        chrome.contextMenus.onShown.addListener(hideRedirects);
    }
}
chrome.runtime.onMessage.addListener((request) => {
    if (request.name === 'redirect') {
        redirect(request.info, request.tab, request.redirectUrl, true);
    }
});
updateAlwaysRedirects();
chrome.storage.onChanged.addListener(updateAlwaysRedirects);
