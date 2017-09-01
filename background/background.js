'use strict';

/** Default options. */
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
    },
    'switch-to-opened-tab': false,
};

/**
 * @param rows {Object}
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
 */
const loadRows = () => {
    chrome.storage.local.get(null, (options) => {
        if (!options || Object.keys(options).length === 0)
            options = g_defaultOptions;
        addContextMenuItems(options.rows);
    });
};

/**
 * @param changes {}
 */
const updateContextMenus = (changes) => {
    chrome.contextMenus.removeAll(() => {
        addContextMenuItems(changes.rows.newValue);
    });
};

/**
 * @param details {}
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
 * @param info {}
 * @param tab {chrome.tabs.Tab}
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

loadRows();

chrome.storage.onChanged.addListener(updateContextMenus);
chrome.contextMenus.onClicked.addListener(openTab);
