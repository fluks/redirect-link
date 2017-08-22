'use strict';

let rows = null;

/**
 * @param changes {}
 */
const updateContextMenus = (changes) => {
    const remove = browser.contextMenus.removeAll();
    rows = {};
    remove.then(() => {
        Object.keys(changes).forEach(title => {
            const options = changes[title].newValue;

            if (options && options.enabled) {
                browser.contextMenus.create({
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
    browser.storage.local.set({
        'Google WebCache': {
            enabled: true,
            url: 'https://webcache.googleusercontent.com/search?q=cache:', 
        },
    });
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

    browser.tabs.create({ url: url, index: tab.index + 1 });
};

browser.storage.onChanged.addListener(updateContextMenus);
browser.runtime.onInstalled.addListener(setDefaultRows);
browser.contextMenus.onClicked.addListener(openTab);

