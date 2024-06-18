/** @module common */

'use strict';

export const
    MIDDLE_MOUSE_BUTTON = 1,
    FIREFOX = 1,
    FIREFOX_FOR_ANDROID = 2,
    CHROME = 3;

/**
 * Detect the browser.
 * @function detectBrowser
 * @async
 * @return {Promise<Int>} FIREFOX if the browser is Firefox, FIREFOX_FOR_ANDROID
 * if it's Firefox for Android and CHROME for Chromium based.
 */
export const detectBrowser = async () => {
    try {
        const info = await browser.runtime.getBrowserInfo();
        if (/fennec/i.test(info.name))
            return FIREFOX_FOR_ANDROID;
        return FIREFOX;
    }
    catch (error) {
        return CHROME;
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
    return (await detectBrowser()) === FIREFOX;
};

/**
 * Check are context menus supported. They are not on mobile.
 * @function isSupportedMenus
 * @async
 * @return {Promise<Bool>}
 */
export const isSupportedMenus = async () => {
    return (await detectBrowser()) !== FIREFOX_FOR_ANDROID;
};

/**
 * Check is the client a mobile client. Only Firefox for Android.
 * @function isMobile
 * @async
 * @return {Promise<Bool>}
 */
export const isMobile = async () => {
    return (await detectBrowser()) === FIREFOX_FOR_ANDROID;
};

/**
 * Check is contextMenus.onShown supported by the browser.
 * @function isSupportedMenuOnShown
 * @async
 * @return {Promise<Bool>}
 */
export const isSupportedMenuOnShown = async () => {
    return (await detectBrowser()) === FIREFOX;
};

/**
 * Compare indices of rows for sorting them.
 * @function compareRowIndices
 * @param obj {Object} Redirection rows.
 * @param title1 {String} Title of the row.
 * @param title2 {String} Title of next row.
 * @return {Integer} -1 if row with title1 comes before row with title2, 0 if
 * they have the same index and +1 if row with title2 comes before row with
 * title1.
 */
export const compareRowIndices = (obj, title1, title2) => {
    const index1 = obj[title1].index || 0;
    const index2 = obj[title2].index || 0;
    return index1 - index2;
};

/** @function resizeFavicon
 * @param img {HTMLImageElement} Favicon's image element to draw.
 * @param size {Int} Size in pixels..
 * @return {String} Resized favicon's data URL.
 */
export const resizeFavicon = (img, size) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    const dataURL = canvas.toDataURL();
    canvas.remove();

    return dataURL;
};
