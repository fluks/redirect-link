'use strict';

let rows = {};

/**
 */
const loadRows = () => {
    chrome.storage.local.get(null, (options) => {
        Object.keys(options).forEach(title => {
            const opt = options[title];
            if (opt.enabled) {
                chrome.contextMenus.create({
                    id: title,
                    contexts: [ 'link' ],
                    title: title,
                });
                rows[title] = {
                    url: opt.url,
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
        rows = {};
        Object.keys(changes).forEach(title => {
            const options = changes[title].newValue;

            if (options && options.enabled) {
                chrome.contextMenus.create({
                    id: title,
                    contexts: [ 'link' ],
                    title: title,
                });
                rows[title] = {
                    url: options.url,    
                };
            }
        });
    });
};

/**
 * @param details {}
 */
const setDefaultRows = (details) => {
    if (details.reason !== 'install')
        return;

    rows = {
        'Google WebCache': { url: 'https://webcache.googleusercontent.com/search?q=cache:%u', enabled: true },
        'Wayback Machine': { url: 'https://web.archive.org/web/*/%u', enabled: true },
        'archive.is (search)': { url: 'https://archive.is/%u', enabled: true },
    };

    chrome.storage.local.set(rows);
};

/**
 * @param info {}
 * @param tab {}
 */
const openTab = (info, tab) => {
    let url = rows[info.menuItemId].url;
    if (url.includes('%u'))
        url = url.replace('%u', info.linkUrl);
    else
        url += info.linkUrl;

    chrome.tabs.create({ url: url, index: tab.index + 1 });
};

loadRows();

chrome.runtime.onInstalled.addListener(setDefaultRows);
chrome.storage.onChanged.addListener(updateContextMenus);
chrome.contextMenus.onClicked.addListener(openTab);
