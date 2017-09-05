'use strict';

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
        'archive.is (save)': {
            url: 'https://archive.is/?run=1&url=%u',
            enabled: true,
         },
    },
    'switch-to-opened-tab': false,
};

/**
 * Create context menu items.
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
        }
    });
};

/**
 * Create context menu items when the addon is enabled.
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
 * @param details {Object} Details about installed addon.
 */
const setDefaultOptions = (details) => {
    if (details.reason !== 'install')
        return;

    chrome.storage.local.set(g_defaultOptions);
};

/**
 * Replace the formats in the redirect URL with parts from the link's URL. If
 * the redirect URL doesn't contain any format, the link's URL is appended to
 * the redirect URL.
 * @param url {String} Redirect URL. Formats:
 * %u - entire URL
 * %s - scheme
 * %h - hostname
 * %p - path
 * %q - query parameters
 * %f - fragment
 * @param linkUrl {String} Link's URL.
 * @return {String} URL with formats replaced.
 */
const replaceFormats = (url, linkUrl) => {
    const a = document.createElement('a');
    a.href = linkUrl;

    if (!/%(s|h|p|q|f|u)/.test(url))
        url += linkUrl;
    else {
        url = url.replace(new RegExp('%s', 'g'), a.protocol.replace(':', ''));
        url = url.replace(new RegExp('%h', 'g'), a.hostname);
        url = url.replace(new RegExp('%p', 'g'), a.pathname);
        url = url.replace(new RegExp('%q', 'g'), a.search.replace('?', ''));
        url = url.replace(new RegExp('%f', 'g'), a.hash);
        url = url.replace(new RegExp('%u', 'g'), linkUrl);
    }

    return url;
};

/**
 * Open and redirect the link in new tab.
 * @param info {OnClickData} Information about the item clicked and the context
 * where the click happened.
 * @param tab {chrome.tabs.Tab} The details of the tab where the click took
 * place.
 */
const openTab = (info, tab) => {
    chrome.storage.local.get(null, (options) => {
        let url = options.rows[info.menuItemId].url;
        url = replaceFormats(url, info.linkUrl);

        chrome.tabs.create({
            url: url, index: tab.index + 1,
            active: options['switch-to-opened-tab'],
        });
    });
};

chrome.runtime.onInstalled.addListener(setDefaultOptions);

setupContextMenus();

chrome.storage.onChanged.addListener(updateContextMenus);
chrome.contextMenus.onClicked.addListener(openTab);
