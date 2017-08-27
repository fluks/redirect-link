'use strict';

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

    const rows = {
        'Google WebCache': { url: 'https://webcache.googleusercontent.com/search?q=cache:%u', enabled: true },
        'Wayback Machine': { url: 'https://web.archive.org/web/*/%u', enabled: true },
        'archive.is (search)': { url: 'https://archive.is/%u', enabled: true },
    };

    chrome.storage.local.set({
        rows: rows,
        'switch-to-opened-tab': false,
    });
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

loadRows();

chrome.runtime.onInstalled.addListener(setDefaultOptions);
chrome.storage.onChanged.addListener(updateContextMenus);
chrome.contextMenus.onClicked.addListener(openTab);
