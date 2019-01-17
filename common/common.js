'use strict';

/**
 * Get the current browser.
 * @async
 * @return {Promise<String>} 'firefox', 'firefox_android', 'chrome' or
 * undefined if browser can't be determined.
 */
export const getBrowser = async () => {
    try {
        let b = await browser.runtime.getBrowserInfo();
        b = b.name.toLowerCase();
        if (b.includes('android'))
            return 'firefox_android';
        return 'firefox';
    }
    catch (e) { /* Ignore eslint empty block statement. */ }
    try {
        if (chrome) {
            return 'chrome';
        }
    }
    catch (e) { /* Ignore eslint empty block statement. */ }
};
