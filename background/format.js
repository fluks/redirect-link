/** @module format */
'use strict';

const format = {
    /**
     * Get a path part.
     * @function _getPath
     * @param paths {Array[String]} Path parts in a URL.
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
     * @param linkUrl {String} Link's URL.
     * @return {String} URL with formats replaced.
     * @throw {String} If path index is out of bounds or if query parameter
     * doesn't exist.
     */
    replaceFormats(url, linkUrl) {
        if (!/%(s|h|p|q|f|u)/.test(url))
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

        const pathRe = /^%p\[(\d+)\]/;
        const paramRe = /^%q\[([^\]]+)\]/;
        let newUrl = '',
            res;
        for (let i = 0; i < url.length; i++) {
            if (i + 1 === url.length) {
                newUrl += url[i];
                break;
            }
            const nextTwoChars = url.substr(i, 2);
            // These two conditionals must come before the others, because these
            // can match longer than 2 characters.
            if ((res = pathRe.exec(url.substr(i)))) {
                newUrl += this._getPath(paths, res[1]);
                i += res[0].length - 1;
            }
            else if ((res = paramRe.exec(url.substr(i)))) {
                newUrl += this._getParam(params, res[1]);
                i += res[0].length - 1;
            }
            else if (nextTwoChars === '%s') {
                newUrl += scheme;
                ++i;
            }
            else if (nextTwoChars === '%h') {
                newUrl += a.hostname;
                ++i;
            }
            else if (nextTwoChars === '%f') {
                newUrl += a.hash;
                ++i;
            }
            else if (nextTwoChars === '%u') {
                newUrl += linkUrl;
                ++i;
            }
            else if (nextTwoChars === '%p') {
                newUrl += a.pathname.substr(1);
                ++i;
            }
            else if (nextTwoChars === '%q') {
                newUrl += search;
                ++i;
            }
            else
                newUrl += url[i];
        }

        return newUrl;
    },
};
