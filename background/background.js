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
    const title = 'Google WebCache';
    const url = 'https://webcache.googleusercontent.com/search?q=cache:';

    rows[title] = {
        url: url,
    };

    const opt = {};
    opt[title] = {
        enabled: true,
        url: url,
    };
    chrome.storage.local.set(opt);
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
