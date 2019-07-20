/** @module common */

'use strict';

/**
 * Check whether the browser is Chromium based.
 * @function isChromium
 * @return {Bool} Return true if browser is Chromium based, false otherwise.
 */
const isChromium = () => {
    return !!window.chrome &&
        (!!window.chrome.webstore || !!window.chrome.runtime);
};

/**
 * Check whether the browser is desktop Firefox.
 * @function isFirefox
 * @async
 * @return {Promise<Bool>} Return true if browser is desktop Firefox, false otherwise.
 */
const isFirefox = async () => {
    try {
        const b = await browser.runtime.getBrowserInfo();
        return /firefox/i.test(b.name);
    }
    catch (e) {
        return false;
    }
};

/**
 * Check whether containers can be supported. This doesn't mean containers are
 * enabled, only loosely that it's possible.
 * @function isSupportedContainer
 * @async
 * @return {Promise<Bool>} True if containers are supported, false otherwise.
 */
export const isSupportedContainer = async () => {
    return isFirefox();
};

/**
 * Check are context menus supported. They are not on mobile.
 * @function isSupportedMenus
 * @async
 * @return {Promise<Bool>}
 */
export const isSupportedMenus = async () => {
    try {
        return isChromium() ||
            /firefox/i.test((await browser.runtime.getBrowserInfo()).name);
    }
    catch (e) {
        return false;
    }
};

/**
 * Check is the client a mobile client. Only Firefox for Android.
 * @function isMobile
 * @async
 * @return {Promise<Bool>}
 */
export const isMobile = async () => {
    try {
        const b = await browser.runtime.getBrowserInfo();
        return /fennec/i.test(b.name);
    }
    catch (e) {
        return false;
    }
};

/**
 * Check is contextMenus.onShown supported by the browser.
 * @function isSupportedMenuOnShown
 * @async
 * @return {Promise<Bool>}
 */
export const isSupportedMenuOnShown = async () => {
    return isFirefox();
};
