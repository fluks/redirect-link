'use strict';

let g_rows = {};

/**
 */
const loadRows = () => {
    chrome.storage.local.get(null, (options) => {
        Object.keys(options.rows).forEach(title => {
            const row = options.rows[title];
            if (row.enabled) {
                chrome.contextMenus.create({
                    id: title,
                    contexts: [ 'link' ],
                    title: title,
                });
                g_rows[title] = {
                    url: row.url,
                };
            }
        });
    });
};

/**
 * @param changes {}
 */
const updateContextMenus = (changes) => {
    chrome.contextMenus.removeAll(() => {
        g_rows = {};
        const newRows = changes.rows.newValue;
        Object.keys(newRows).forEach(title => {
            const row = newRows[title];

            if (row && row.enabled) {
                chrome.contextMenus.create({
                    id: title,
                    contexts: [ 'link' ],
                    title: title,
                });
                g_rows[title] = {
                    url: row.url,
                };
            }
        });
    });
};

/**
 * @param details {}
 */
const setDefaultOptions = (details) => {
    if (details.reason !== 'install')
        return;

    g_rows = {
        'Google WebCache': { url: 'https://webcache.googleusercontent.com/search?q=cache:%u', enabled: true },
        'Wayback Machine': { url: 'https://web.archive.org/web/*/%u', enabled: true },
        'archive.is (search)': { url: 'https://archive.is/%u', enabled: true },
    };

    chrome.storage.local.set({
        rows: g_rows,
        'switch-to-opened-tab': false,
    });
};

/**
 * @param info {}
 * @param tab {chrome.tabs.Tab}
 */
const openTab = (info, tab) => {
    let url = g_rows[info.menuItemId].url;
    if (url.includes('%u'))
        url = url.replace('%u', info.linkUrl);
    else
        url += info.linkUrl;

    chrome.storage.local.get('switch-to-opened-tab', (option) => {
        chrome.tabs.create({
            url: url, index: tab.index + 1,
            active: option['switch-to-opened-tab'],
        });
    });
};

loadRows();

chrome.runtime.onInstalled.addListener(setDefaultOptions);
chrome.storage.onChanged.addListener(updateContextMenus);
chrome.contextMenus.onClicked.addListener(openTab);
