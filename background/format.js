/** @module format */
'use strict';

export const format = {
    /**
     * Get a path part.
     * @function _getPath
     * @param paths {String[]} Path parts in a URL.
     * @param i {Integer} Index in paths.
     * @return {String} Path part.
     * @throw {String} If path index is out of bounds.
     */
    _getPath(paths, i) {
        if (i >= paths.length)
            throw 'Path index out of bounds';
        return paths[i];
    },

    /**
     * Get query a parameter.
     * @function _getParam
     * @param params {Object} Query parameter map.
     * @param key {String} A key in query parameter map.
     * @return {String} Query parameter.
     * @throw {String} If key is not params.
     */
    _getParam(params, key) {
        if (!Object.prototype.hasOwnProperty.call(params, key))
            throw 'Non-existing query parameter';
        return params[key];
    },

    /**
     * Get capturing group's match.
     * @function _getGroup
     * @param enableURL {String}
     * @param url {String} URL to be redirected.
     * @param i {Integer} Index of captured group.
     * @return {String} Captured group's match.
     * @throw {String} If EnableURL doesn't match or there's no captured group by index i.
     */
    _getGroup(enableURL, url, i) {
        const m = url.match(enableURL);
        if (!m)
            throw 'Enable URL didn\'t match';
        else if (!m[i])
            throw `No matching captured group with index ${i}`;

        return m[i];
    },

    /**
     * Replace a regular expression format.
     * @function _replaceRegex
     * @param url {String} Page's or link's URL to be redirected.
     * @param regex {String} Regular expression from a regex format.
     * @return {String} Regex's match or matched groups concatenated or empty
     * string if there's no match.
     * @throw {String} If regex is invalid regular expression.
     */
    _replaceRegex(url, regex) {
        let m;
        // Right bracket in character classes must be escaped in the format.
        // Remove the backslash. E.g. '%r[[a-z\]+]' -> '%r[[a-z]+]'
        regex = regex.replace(/\\]/g, ']');
        try {
            const re = new RegExp(regex);
            m = url.match(re);
        }
        catch (e) {
            throw e.message;
        }

        if (!m)
            return '';
        // Return all groups concatenated.
        else if (m.length > 1) {
            m.shift();
            return m.join('');
        }
        return m[0];
    },

    /**
     * Get regular expression from regex format.
     * @function _getRegex
     * @param url {String} Redirection url from i'th index.
     * @param formatLetter {String}
     * @return {String|undefined} Regex without format characters
     * ('%r[' and ']') if there's a valid regex format in the beginning of url,
     * undefined or empty string otherwise.
     */
    _getRegex(url, formatLetter) {
        if (!url.startsWith(`%${formatLetter}[`) || url.length <= 3)
            return;
        url = url.substr(3);
        let re = '';
        for (let i = 0; i < url.length; i++) {
            if (url[i] !== ']' || (i > 0 && url[i - 1] === '\\'))
                re += url[i];
            else
                return re;
        }
    },

    /**
     * @function _replaceReplace
     * @param url {String} Page's or link's URL to be redirected.
     * @param regex {String} Regular expression from a replace format.
     * @return {String} Regex's match or matched groups concatenated or empty
     * string if there's no match.
     * @throw {String} If replace regex is invalid.
     */
    _replaceReplace(url, regex) {
        // Right bracket in character classes must be escaped in the format.
        // Remove the backslash. E.g. '%r[[a-z\]+]' -> '%r[[a-z]+]'
        regex = regex.replace(/\\]/g, ']');
        try {
            const m = regex.match(/^\/(?<regex>.*)(?<!\\)\/(?<replacement>.*)\/(?<flags>(g|i|v)+)?$/);
            if (!m)
                throw { message: 'Invalid regex', };
            const re = new RegExp(m.groups.regex, m.groups.flags);

            return url.replace(re, m.groups.replacement);
        }
        catch (e) {
            throw e.message;
        }
    },

    /**
     * Replace the formats in the redirect URL with parts from the link's URL. If
     * the redirect URL doesn't contain any format, the link's URL is appended to
     * the redirect URL.
     * @function replaceFormats
     * @param url {String} Redirect URL. Formats:
     * %u - entire URL
     * %s - scheme
     * %h - hostname
     * %p - path. Or %p[N], where N is index of the path part. e.g. in
     * http://example.com/a/b/c?param=1, %p[0] is a, %p[1] is b and %p[2] is c.
     * %q - query parameters. Or %q[KEY], where KEY is the name of the query
     * parameter. e.g. in http://example.com/?a=1&b=2 %q[a] is 1 and %q[b] is 2.
     * %f - fragment
     * %r - A regular expression. The regular expression is replaced with the
     * match, or if capture groups are used, their matches are concatenated or
     * empty string if there's no match. Right square brackets must be escaped,
     * e.g. https://%r[[a-z.\]+]/
     * @param linkUrl {String} Link's URL.
     * @param enableURL {String}
     * @return {String} URL with formats replaced.
     * @throw {String} If path index is out of bounds or if query parameter
     * doesn't exist.
     */
    replaceFormats(url, linkUrl, enableURL) {
        // TODO This can be removed and if after the loop the newUrl is the same
        // as redirect url.
        if (!/%(s|h|p|q|f|u|r|g|e)/.test(url))
            return url + linkUrl;

        const a = new URL(linkUrl);
        const scheme = a.protocol.replace(':', '');
        const paths = a.pathname.split('/').filter(p => p);
        const search = a.search.replace('?', '');
        const params = {};
        search.split('&').forEach(p => {
            const [ key, value ] = p.split('=');
            params[key] = value;
        });

        const pathRe = /^%p\[(\d+)\]/,
            paramRe = /^%q\[([^\]]+)\]/,
            regexFormatStartLength = 3,
            regexLastBracketLength = 1,
            groupRe = /^%g\[(\d+)\]/;
        let newUrl = '',
            res;
        for (let i = 0; i < url.length; i++) {
            if (i + 1 === url.length) {
                newUrl += url[i];
                break;
            }
            const nextTwoChars = url.substr(i, 2);
            const urlFromIthIndex = url.substr(i);
            // These two conditionals must come before the others, because these
            // can match longer than 2 characters.
            if ((res = pathRe.exec(urlFromIthIndex))) {
                const addToUrl = this._getPath(paths, res[1]);
                i += res[0].length - 1;
                // Check if replace format is next. In that case use this format's
                // output as input for replace format.
                if ((res = this._getRegex(url.substr(i), 'e'))) {
                    const formatReplace = this._replaceReplace(addToUrl, res);
                    i += regexFormatStartLength + res.length + regexLastBracketLength;
                    newUrl += formatReplace;
                }
                else
                    newUrl += addToUrl;
            }
            else if ((res = paramRe.exec(urlFromIthIndex))) {
                const addToUrl = this._getParam(params, res[1]);
                i += res[0].length - 1;
                if ((res = this._getRegex(url.substr(i), 'e'))) {
                    const formatReplace = this._replaceReplace(addToUrl, res);
                    i += regexFormatStartLength + res.length + regexLastBracketLength;
                    newUrl += formatReplace;
                }
                else
                    newUrl += addToUrl;
            }
            else if ((res = groupRe.exec(urlFromIthIndex))) {
                const addToUrl = this._getGroup(enableURL, linkUrl, res[1]);
                i += res[0].length - 1;
                if ((res = this._getRegex(url.substr(i), 'e'))) {
                    const formatReplace = this._replaceReplace(addToUrl, res);
                    i += regexFormatStartLength + res.length + regexLastBracketLength;
                    newUrl += formatReplace;
                }
                else
                    newUrl += addToUrl;
            }
            else if ((res = this._getRegex(urlFromIthIndex, 'r'))) {
                const addToUrl = this._replaceRegex(linkUrl, res);
                i += regexFormatStartLength + res.length;
                if ((res = this._getRegex(url.substr(i + 1), 'e'))) {
                    const formatReplace = this._replaceReplace(addToUrl, res);
                    i += regexFormatStartLength + res.length + regexLastBracketLength;
                    newUrl += formatReplace;
                }
                else
                    newUrl += addToUrl;
            }
            else if ((res = this._getRegex(urlFromIthIndex, 'e'))) {
                const addToUrl = this._replaceReplace(linkUrl, res);
                i += regexFormatStartLength + res.length;
                newUrl += addToUrl;
            }
            else if (nextTwoChars === '%s') {
                const addToUrl = scheme;
                ++i;
                if ((res = this._getRegex(url.substr(i + 1), 'e'))) {
                    const formatReplace = this._replaceReplace(addToUrl, res);
                    i += regexFormatStartLength + res.length + regexLastBracketLength;
                    newUrl += formatReplace;
                }
                else
                    newUrl += addToUrl;
            }
            else if (nextTwoChars === '%h') {
                const addToUrl = a.hostname;
                ++i;
                if ((res = this._getRegex(url.substr(i + 1), 'e'))) {
                    const formatReplace = this._replaceReplace(addToUrl, res);
                    i += regexFormatStartLength + res.length + regexLastBracketLength;
                    newUrl += formatReplace;
                }
                else
                    newUrl += addToUrl;
            }
            else if (nextTwoChars === '%f') {
                const addToUrl = a.hash;
                ++i;
                if ((res = this._getRegex(url.substr(i + 1), 'e'))) {
                    const formatReplace = this._replaceReplace(addToUrl, res);
                    i += regexFormatStartLength + res.length + regexLastBracketLength;
                    newUrl += formatReplace;
                }
                else
                    newUrl += addToUrl;
            }
            else if (nextTwoChars === '%u') {
                const addToUrl = linkUrl;
                ++i;
                if ((res = this._getRegex(url.substr(i + 1), 'e'))) {
                    const formatReplace = this._replaceReplace(addToUrl, res);
                    i += regexFormatStartLength + res.length + regexLastBracketLength;
                    newUrl += formatReplace;
                }
                else
                    newUrl += addToUrl;
            }
            else if (nextTwoChars === '%p') {
                const addToUrl = a.pathname.substr(1);
                ++i;
                if ((res = this._getRegex(url.substr(i + 1), 'e'))) {
                    const formatReplace = this._replaceReplace(addToUrl, res);
                    i += regexFormatStartLength + res.length + regexLastBracketLength;
                    newUrl += formatReplace;
                }
                else
                    newUrl += addToUrl;
            }
            else if (nextTwoChars === '%q') {
                const addToUrl = search;
                ++i;
                if ((res = this._getRegex(url.substr(i + 1), 'e'))) {
                    const formatReplace = this._replaceReplace(addToUrl, res);
                    i += regexFormatStartLength + res.length + regexLastBracketLength;
                    newUrl += formatReplace;
                }
                else
                    newUrl += addToUrl;
            }
            else
                newUrl += url[i];
        }
        // Add linkUrl to the end of redirect URL if a format really wasn't used.
        // This is more complete than the test in the beginning of the function.
        if (newUrl === url)
            return url + linkUrl;

        return newUrl;
    },
};

export default format;
