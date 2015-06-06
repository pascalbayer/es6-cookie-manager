var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/* Based on https://github.com/ScottHamper/Cookies, 1.2.1 */

var CookieManager = (function () {
    function CookieManager(key, value, options) {
        _classCallCheck(this, CookieManager);

        if (typeof window.document !== 'object') {
            throw new Error('CookieManager requires a `window` with a `document` object');
        }

        // Allows for setter injection in unit tests
        this._document = window.document;
        // Used to ensure cookie keys do not collide with built-in `Object` properties
        this._cacheKeyPrefix = 'cookie_manager.';
        this._maxExpireDate = new Date('Fri, 31 Dec 9999 23:59:59 UTC');
        this._defaults = {
            path: '/',
            secure: false
        };
    }

    _createClass(CookieManager, [{
        key: 'get',
        value: function get(key) {
            if (this._cachedDocumentCookie !== this._document.cookie) {
                this._renewCache();
            }

            return this._cache[this._cacheKeyPrefix + key];
        }
    }, {
        key: 'set',
        value: function set(key, value, options) {
            options = this._getExtendedOptions(options);
            options.expires = this._getExpiresDate(value === undefined ? -1 : options.expires);

            this._document.cookie = this._generateCookieString(key, value, options);

            return this;
        }
    }, {
        key: 'expire',
        value: function expire(key, options) {
            return this.set(key, undefined, options);
        }
    }, {
        key: 'setDefaults',
        value: function setDefaults(defaults) {
            this._extend(this._defaults, defaults);
        }
    }, {
        key: 'cookiesEnabled',
        value: function cookiesEnabled() {
            var testKey = 'cookie-manager.js';
            var areEnabled = this.set(testKey, 1).get(testKey) === '1';
            this.expire(testKey);
            return areEnabled;
        }
    }, {
        key: '_extend',
        value: function _extend(obj) {
            Array.prototype.slice.call(arguments, 1).forEach(function (source) {
                if (source) {
                    for (var prop in source) {
                        obj[prop] = source[prop];
                    }
                }
            });
            return obj;
        }
    }, {
        key: '_getExtendedOptions',
        value: function _getExtendedOptions(options) {
            return {
                path: options && options.path || this._defaults.path,
                domain: options && options.domain || this._defaults.domain,
                expires: options && options.expires || this._defaults.expires,
                secure: options && options.secure !== undefined ? options.secure : this._defaults.secure
            };
        }
    }, {
        key: '_isValidDate',
        value: function _isValidDate(date) {
            return Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date.getTime());
        }
    }, {
        key: '_getExpiresDate',
        value: function _getExpiresDate(expires, now) {
            now = now || new Date();

            if (typeof expires === 'number') {
                expires = expires === Infinity ? this._maxExpireDate : new Date(now.getTime() + expires * 1000);
            } else if (typeof expires === 'string') {
                expires = new Date(expires);
            }

            if (expires && !this._isValidDate(expires)) {
                throw new Error('`expires` parameter cannot be converted to a valid Date instance');
            }

            return expires;
        }
    }, {
        key: '_generateCookieString',
        value: function _generateCookieString(key, value, options) {
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
    }, {
        key: '_getCacheFromString',
        value: function _getCacheFromString(documentCookie) {
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
    }, {
        key: '_getKeyValuePairFromCookieString',
        value: function _getKeyValuePairFromCookieString(cookieString) {
            // "=" is a valid character in a cookie value according to RFC6265, so cannot `split('=')`
            var separatorIndex = cookieString.indexOf('=');

            // IE omits the "=" when the cookie value is an empty string
            separatorIndex = separatorIndex < 0 ? cookieString.length : separatorIndex;

            return {
                key: decodeURIComponent(cookieString.substr(0, separatorIndex)),
                value: decodeURIComponent(cookieString.substr(separatorIndex + 1))
            };
        }
    }, {
        key: '_renewCache',
        value: function _renewCache() {
            this._cache = this._getCacheFromString(this._document.cookie);
            this._cachedDocumentCookie = this._document.cookie;
        }
    }]);

    return CookieManager;
})();