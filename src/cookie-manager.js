/* Based on https://github.com/ScottHamper/Cookies, 1.2.1 */

export class CookieManager {
    constructor(key, value, options) {
        if (typeof window.document !== 'object') {
            throw new Error('CookieManager requires a `window` with a `document` object');
        }

        // Allows for setter injection in unit tests
        this._document = window.document;
        // Used to ensure cookie keys do not collide with built-in `Object` properties
        this._cacheKeyPrefix = 'cookie_manager';
        this._maxExpireDate = new Date('Fri, 31 Dec 9999 23:59:59 UTC');
        this._defaults = {
            path: '/',
            secure: false
        };

        return arguments.length === 1 ? this.get(key) : arguments.length === 0 ? this : this.set(key, value, options);
    }

    get (key) {
        if (this._cachedDocumentCookie !== this._document.cookie) {
            this._renewCache();
        }

        return this._cache[this._cacheKeyPrefix + key];
    }

    set (key, value, options) {
        options = this._getExtendedOptions(options);
        options.expires = this._getExpiresDate(value === undefined ? -1 : options.expires);

        this._document.cookie = this._generateCookieString(key, value, options);

        return this;
    }

    expire (key, options) {
        return this.set(key, undefined, options);
    }

    setDefaults (defaults) {
        this._extend(this._defaults, defaults);
    }

    cookiesEnabled () {
        var testKey = 'cookie-manager.js';
        var areEnabled = this.set(testKey, 1).get(testKey) === '1';
        this.expire(testKey);
        return areEnabled;
    }

    _extend (obj) {
        Array.prototype.slice.call(arguments, 1).forEach(function(source) {
            if (source) {
                for (var prop in source) {
                    obj[prop] = source[prop];
                }
            }
        });
        return obj;
    }

    _getExtendedOptions (options) {
        return {
            path: options && options.path || this._defaults.path,
            domain: options && options.domain || this._defaults.domain,
            expires: options && options.expires || this._defaults.expires,
            secure: options && options.secure !== undefined ? options.secure : this._defaults.secure
        }
    }

    _isValidDate (date) {
        return Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date.getTime());
    }

    _getExpiresDate (expires, now) {
        now = now || new Date();

        if (typeof expires === 'number') {
            expires = expires === Infinity ?
                this._maxExpireDate : new Date(now.getTime() + expires * 1000);
        } else if (typeof expires === 'string') {
            expires = new Date(expires);
        }

        if (expires && !this._isValidDate(expires)) {
            throw new Error('`expires` parameter cannot be converted to a valid Date instance');
        }

        return expires;
    }

    _generateCookieString (key, value, options) {
        key = key.replace(/[^#$&+\^`|]/g, encodeURIComponent);
        key = key.replace(/\(/g, '%28').replace(/\)/g, '%29');
        value = (value + '').replace(/[^!#$&-+\--:<-\[\]-~]/g, encodeURIComponent);
        options = options || {};

        var cookieString = key + '=' + value;
        cookieString += options.path ? ';path=' + options.path : '';
        cookieString += options.domain ? ';domain=' + options.domain : '';
        cookieString += options.expires ? ';expires=' + options.expires.toUTCString() : '';
        cookieString += options.secure ? ';secure' : '';

        return cookieString;
    }

    _getCacheFromString (documentCookie) {
        var cookieCache = {};
        var cookiesArray = documentCookie ? documentCookie.split('; ') : [];

        for (var i = 0; i < cookiesArray.length; i++) {
            var cookieKvp = this._getKeyValuePairFromCookieString(cookiesArray[i]);

            if (cookieCache[this._cacheKeyPrefix + cookieKvp.key] === undefined) {
                cookieCache[this._cacheKeyPrefix + cookieKvp.key] = cookieKvp.value;
            }
        }

        return cookieCache;
    }

    _getKeyValuePairFromCookieString (cookieString) {
        // "=" is a valid character in a cookie value according to RFC6265, so cannot `split('=')`
        var separatorIndex = cookieString.indexOf('=');

        // IE omits the "=" when the cookie value is an empty string
        separatorIndex = separatorIndex < 0 ? cookieString.length : separatorIndex;

        return {
            key: decodeURIComponent(cookieString.substr(0, separatorIndex)),
            value: decodeURIComponent(cookieString.substr(separatorIndex + 1))
        };
    }

    _renewCache () {
        this._cache = this._getCacheFromString(this._document.cookie);
        this._cachedDocumentCookie = this._document.cookie;
    }
}