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
},
g_currentTabIdSuffix = '-current';

/**
 * Create context menu items.
 * @function addContextMenuItems
 * @param rows {Object} Redirect options.
 */
const addContextMenuItems = (rows) => {
    Object.keys(rows).forEach(title => {
        const row = rows[title];

        if (row && row.enabled) {
            chrome.contextMenus.create({
                id: title,
                contexts: [ 'link' ],
                title: title,
            });

            chrome.contextMenus.create({
                id: title + g_currentTabIdSuffix,
                contexts: [ 'page' ],
                title: title,
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
    if (changes.hasOwnProperty('rows')) {
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
    if (details.reason === 'install')
        chrome.storage.local.set(g_defaultOptions);
    else if (details.reason === 'update') {
        chrome.storage.local.get(null, (opts) => {
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
                if (!opts.rows.hasOwnProperty(k))
                    opts.rows[k] = updateRows[k];
            });

            if (!opts.hasOwnProperty('open-in-container'))
                opts['open-in-container'] = true;

            chrome.storage.local.set(opts);
        });
    }
};

/**
 * Replace a path format string.
 * @function replacePath
 * @param format {String} Path format string.
 * @param paths {String[]} All the path parts in an array.
 * @param path {String} Whole path in one string.
 * @return {String} The replacement string for the path format.
 * @throw {String} If path format has an index that is greater or equal than
 * the path has path parts.
 */
const replacePath = (format, paths, path) => {
    if (format === '%p') {
        // Remove the first slash, it will always be there, even if there's no path in the URL.
        return path.slice(1);
    }
    const m = format.match(/\[(\d+)\]/);
    if (m[1] >= paths.length)
        throw 'Path index out of bounds';
    return paths[m[1]];
};

/**
 * Replace a query parametformat string.
 * @function replaceParam
 * @param format {String} Query parameter format string.
 * @param params {Object} All the query parameters in an object.
 * @param param {String} All the query parameters in one string.
 * @return {String} The replacement string for the query parameter format.
 * @throw {String} If query parameter format has a key that doesn't exist in
 * query parameters.
 */
const replaceParam = (format, params, param) => {
    if (format === '%q')
        return param;
    const m = format.match(/\[([^\]]+)\]/);
    if (!params.hasOwnProperty(m[1]))
        throw 'Non-existing query parameter';
    return params[m[1]];
};

/**
 * Replace the formats in the redirect URL with parts from the link's URL. If
 * the redirect URL doesn't contain any format, the link's URL is appended to
 * the redirect URL.
 * @function replaceFormats
 * @param url {String} Redirect URL. Formats:
 * %u - entire URL
 * %s - scheme
 * %h - hostname
 * %p - path. Or %p[N], where N is index of the path part. e.g. in
 * http://example.com/a/b/c?param=1, %p[0] is a, %p[1] is b and %p[2] is c.
 * %q - query parameters. Or %q[KEY], where KEY is the name of the query
 * parameter. e.g. in http://example.com/?a=1&b=2 %q[a] is 1 and %q[b] is 2.
 * %f - fragment
 * @param linkUrl {String} Link's URL.
 * @return {String} URL with formats replaced.
 * @throw {String} If path index is out of bounds or if query parameter
 * doesn't exist.
 */
const replaceFormats = (url, linkUrl) => {
    const a = document.createElement('a');
    a.href = linkUrl;

    if (!/%(s|h|p|q|f|u)/.test(url))
        return url + linkUrl;

    const paths = a.pathname.split('/').filter(p => p);
    url = url.replace(/%p(\[\d+\])?/g, (s) => replacePath(s, paths, a.pathname));

    const search = a.search.replace('?', '');
    const params = {};
    search.split('&').forEach(p => {
        const [ key, value ] = p.split('=');
        params[key] = value;
    });
    url = url.replace(/%q(\[[^\]]+\])?/g, (s) => replaceParam(s, params, search));

    const scheme = a.protocol.replace(':', '');
    url = url.replace(new RegExp('%s', 'g'), scheme);
    url = url.replace(new RegExp('%h', 'g'), a.hostname);
    url = url.replace(new RegExp('%f', 'g'), a.hash);
    url = url.replace(new RegExp('%u', 'g'), linkUrl);

    return url;
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
 */
const redirect = (info, tab, url) => {
    chrome.storage.local.get(null, async (options) => {
        let targetUrl = '',
            menuItemId = '',
            redirectUrl = '';

        // Browser action.
        if (info === null) {
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
            redirectUrl = replaceFormats(redirectUrl, targetUrl);
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
        chrome.tabs.create(args);
    });
};

/**
 * Hide redirects which have an enableURL setting set and doesn't match the
 * link's or page's URL.
 * <all_urls> permission is needed for many of info's properties, @see
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus/onShown.
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

chrome.runtime.onInstalled.addListener(setDefaultOptions);

setupContextMenus();

chrome.storage.onChanged.addListener(updateContextMenus);
chrome.contextMenus.onClicked.addListener(redirect);
(async function () {
if (await common.isSupportedEnableURL())
    chrome.contextMenus.onShown.addListener(hideRedirects);
})();
chrome.runtime.onMessage.addListener((request) => {
    if (request.name === 'redirect')
        redirect(null, request.tab, request.redirectUrl);
});
