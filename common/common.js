/** @module common */

'use strict';

/**
 * Check is enable URL feature supported.
 * @function isSupportedEnableURL
 * @async
 * @return {Promise<Bool>} True if enable URL is supported, false otherwise.
 */
export const isSupportedEnableURL = async () => {
    try {
        const b = await browser.runtime.getBrowserInfo();

        // menus.onShown is supported only in Firefox.
        // visible property for menus.update() is supported only in Firefox >=63.
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus/create
        return b.name === 'Firefox' &&
            (parseFloat(b.version)) - 63.0 >= -Number.EPSILON;
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
    try {
        const b = await browser.runtime.getBrowserInfo();
        return /firefox/i.test(b.name);
    }
    catch (e) {
        return false;
    }
};

/**
 * Check are context menus supported. They are not on mobile.
 * @function isSupportedMenus
 * @async
 * @return {Promise<Bool>}
 */
export const isSupportedMenus = async () => {
    try {
        const b = await browser.runtime.getBrowserInfo();
        return /firefox/i.test(b.name);
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
