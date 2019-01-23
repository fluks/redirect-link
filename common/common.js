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
