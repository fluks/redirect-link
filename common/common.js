/** @module common */

'use strict';

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
