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
        if (!options)
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
 * @param info {}
 * @param tab {chrome.tabs.Tab}
 */
const openTab = (info, tab) => {
    chrome.storage.local.get(null, (options) => {
        let url = options.rows[info.menuItemId].url;
        if (url.includes('%u'))
            url = url.replace('%u', info.linkUrl);
        else
            url += info.linkUrl;

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
