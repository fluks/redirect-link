'use strict';

let rows = {};

/**
 */
const loadRows = () => {
    browser.storage.local.get(null).then((options) => {
        Object.keys(options).forEach(title => {
            const opt = options[title];
            if (opt.enabled) {
                browser.contextMenus.create({
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
    browser.contextMenus.removeAll().then(() => {
        rows = {};
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
    browser.storage.local.set(opt);
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

loadRows();

browser.runtime.onInstalled.addListener(setDefaultRows);
browser.storage.onChanged.addListener(updateContextMenus);
browser.contextMenus.onClicked.addListener(openTab);
