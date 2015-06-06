describe('COOKIE MANAGER UNIT TESTS', function () {
    //import CookieManger from '../src/cookie-manager.js';

    var mockDocument;
    var cookieManager;

    beforeEach(() => {
        mockDocument = {};
        cookieManager = new CookieManager();
        cookieManager._document = mockDocument;
        cookieManager._cachedDocumentCookie = '';
    });

    describe('new CookieManager()', () => {
        it('returns instanceof `CookieManager`', function () {
            expect(cookieManager).toEqual(jasmine.any(CookieManager));
        });
    });

    describe('cookieManager.get(key)', function () {
        var key;

        beforeEach(function () {
            key = 'key';
            mockDocument.cookie = 'key=value';
        });

        it('returns `undefined` when `key` is undefined', function () {
            key = undefined;
            expect(cookieManager.get(key)).toBeUndefined();
        });

        it('returns `undefined` for a cookie key that does not exist', function () {
            key = 'undefined';
            expect(cookieManager.get(key)).toBeUndefined();
        });

        it('calls `cookieManager._renewCache()` when `document.cookie` does not equal `cookieManager._cachedDocumentCookie`', function () {
            cookieManager._cachedDocumentCookie = undefined;

            spyOn(cookieManager, '_renewCache').and.callThrough();;
            cookieManager.get(key);

            expect(cookieManager._renewCache).toHaveBeenCalled();
        });

        it('returns the value of the cookie when it exists', function () {
            expect(cookieManager.get(key)).toEqual('value');
        });

        it('returns the value of keys that are named the same as built-in `Object` properties', function () {
            key = 'constructor';
            mockDocument.cookie = 'constructor=value';

            expect(cookieManager.get(key)).toEqual('value');
        });
    });

    describe('cookieManager.set(key, value[, options])', function () {
        var key, value, options, originalDefaults;

        beforeEach(function () {
            key = 'key';
            value = 'value';
            options = undefined;

            originalDefaults = cookieManager._defaults;

            cookieManager.setDefaults({
                path: '/cookies',
                domain: 'www.cubesoft.org',
                expires: '01/01/2015',
                secure: false
            });
        });

        afterEach(function () {
            cookieManager.setDefaults(originalDefaults);
        });

        it('returns the `cookieManager` object', function () {
            expect(cookieManager.set(key, value, options)).toEqual(cookieManager);
        });

        it('calls `cookieManager._getExtendedOptions(options)`', function () {
            options = { path: '/' };

            spyOn(cookieManager, '_getExtendedOptions').and.callThrough();
            cookieManager.set(key, value, options);

            expect(cookieManager._getExtendedOptions).toHaveBeenCalledWith(options);
        });

        it('calls `cookieManager._getExpiresDate(options.expires)`', function () {
            options = { expires: '01/01/2013' };

            spyOn(cookieManager, '_getExpiresDate').and.callThrough();

            cookieManager.set(key, value, options);
            expect(cookieManager._getExpiresDate).toHaveBeenCalledWith(options.expires);

            cookieManager.set(key, 0, options);
            expect(cookieManager._getExpiresDate).toHaveBeenCalledWith(options.expires);
        });

        it('calls `cookieManager._getExpiresDate(-1)` when value is `undefined`', function () {
            options = { expires: '01/01/2015' };

            spyOn(cookieManager, '_getExpiresDate').and.callThrough();
            cookieManager.set(key, undefined, options);

            expect(cookieManager._getExpiresDate).toHaveBeenCalledWith(-1);
        });

        it('calls `cookieManager._generateCookieString(key, value, options)` with extended options and options.expires as a Date instance', function () {
            var extendedOptionsWithExpiresDate = {
                path: cookieManager._defaults.path,
                domain: cookieManager._defaults.domain,
                expires: new Date(cookieManager._defaults.expires),
                secure: cookieManager._defaults.secure
            };

            spyOn(cookieManager, '_generateCookieString').and.callThrough();
            cookieManager.set(key, value, options);

            expect(cookieManager._generateCookieString).toHaveBeenCalledWith(key, value, extendedOptionsWithExpiresDate);
        });

        it('sets `document.cookie` to the proper cookie string', function () {
            var expires = new Date(cookieManager._defaults.expires).toGMTString(); // IE appends "UTC" instead of "GMT", so I can't hard-code the value
            var expectedCookieString = 'key=value;path=/cookies;domain=www.cubesoft.org;expires=' + expires;
            cookieManager.set(key, value, options);

            expect(mockDocument.cookie).toEqual(expectedCookieString);
        });
    });

    describe('cookieManager.expire(key, options)', function () {
        var key = 'key';

        it('calls `cookieManager.set(key, undefined, options)`', function () {
            var options = undefined;

            spyOn(cookieManager, 'set');
            cookieManager.expire(key, options);

            expect(cookieManager.set).toHaveBeenCalledWith(key, undefined, options);
        });

        it('returns `cookieManager`', function () {
            expect(cookieManager.expire(key)).toEqual(cookieManager);
        });
    });

    describe('"PRIVATE" FUNCTIONS', function () {
        describe('cookieManager._getExtendedOptions(options)', function () {
            var originalDefaults;

            beforeEach(function () {
                originalDefaults = cookieManager._defaults;

                cookieManager.setDefaults({
                    path: '/cookies',
                    domain: 'www.cubesoft.org',
                    expires: '01/01/2015',
                    secure: false
                });
            });

            afterEach(function () {
                cookieManager.setDefaults(originalDefaults);
            });

            it('returns `cookieManager.defaults` when `options` is undefined', function () {
                expect(cookieManager._getExtendedOptions(undefined)).toEqual(cookieManager._defaults);
            });

            it('returns `options` when all properties are defined on `options`', function () {
                var options = {
                    path: '/pascalbayer',
                    domain: 'www.github.com',
                    expires: '02/02/2015',
                    secure: true
                };

                expect(cookieManager._getExtendedOptions(options)).toEqual(options);
            });

            it('returns `cookieManager._defaults` with an overridden `path` property when only `options.path` is specified', function () {
                var options = { path: '/pascalbayer' };

                expect(cookieManager._getExtendedOptions(options)).toEqual({
                    path: options.path,
                    domain: cookieManager._defaults.domain,
                    expires: cookieManager._defaults.expires,
                    secure: cookieManager._defaults.secure
                });
            });

            it('returns `cookieManager._defaults` with an overridden `domain` property when only `options.domain` is specified', function () {
                var options = { domain: 'www.github.com' };

                expect(cookieManager._getExtendedOptions(options)).toEqual({
                    path: cookieManager._defaults.path,
                    domain: options.domain,
                    expires: cookieManager._defaults.expires,
                    secure: cookieManager._defaults.secure
                });
            });

            it('returns `cookieManager._defaults` with an overridden `expires` property when only `options.expires` is specified', function () {
                var options = { expires: '01/01/2015' };

                expect(cookieManager._getExtendedOptions(options)).toEqual({
                    path: cookieManager._defaults.path,
                    domain: cookieManager._defaults.domain,
                    expires: options.expires,
                    secure: cookieManager._defaults.secure
                });
            });

            it('returns `cookieManger._defaults` with an overridden `secure` property when only `options.secure` is specified', function () {
                var options = { secure: true };

                expect(cookieManager._getExtendedOptions(options)).toEqual({
                    path: cookieManager._defaults.path,
                    domain: cookieManager._defaults.domain,
                    expires: cookieManager._defaults.expires,
                    secure: options.secure
                });
            });

            it('returns an object with `secure` set to `false`, when `options.secure` is `false` and `cookieManager._defaults.secure` is `true`', function () {
                var options = { secure: false };
                cookieManager.setDefaults({secure: true});
                expect(cookieManager._getExtendedOptions(options).secure).toBe(false);
            });

            it('does not modify `options`', function () {
                var options = {};
                cookieManager._getExtendedOptions(options);

                expect(options.path).toBeUndefined();
                expect(options.domain).toBeUndefined();
                expect(options.expires).toBeUndefined();
                expect(options.secure).toBeUndefined();
            });
        });

        describe('cookieManager._isValidDate(date)', function () {
            it('returns `false` when `date` is not a Date instance', function () {
                expect(cookieManager._isValidDate('cookies')).toBe(false);
                expect(cookieManager._isValidDate(1)).toBe(false);
                expect(cookieManager._isValidDate(['array'])).toBe(false);
                expect(cookieManager._isValidDate({ key: 'value' })).toBe(false);
                expect(cookieManager._isValidDate(/regex/)).toBe(false);
            });

            it('returns `false` when `date` is an invalid Date instance', function () {
                var date = new Date('cookies');
                expect(cookieManager._isValidDate(date)).toBe(false);
            });

            it('returns `true` when `date` is a valid Date instance', function () {
                var date = new Date();
                expect(cookieManager._isValidDate(date)).toBe(true);
            });
        });

        describe('cookieManager._getExpiresDate(expires)', function () {
            it('returns a Date object set to the current time plus <expires> seconds, when `expires` is a finite number', function () {
                var now = new Date('01/01/2015 00:00:00');
                var expires = 5;
                expect(cookieManager._getExpiresDate(expires, now)).toEqual(new Date('01/01/2015 00:00:05'));
            });

            it('returns `cookieManager._maxExpireDate` when `expires` is `Infinity`', function () {
                var expires = Infinity;
                expect(cookieManager._getExpiresDate(expires)).toEqual(cookieManager._maxExpireDate);
            });

            it('returns a Date object when `expires` is a valid Date parsable string', function () {
                var expires = '01/01/2015';
                expect(cookieManager._getExpiresDate(expires)).toEqual(new Date('01/01/2015'));
            });

            it('returns `expires` when `expires` is a Date object', function () {
                var expires = new Date();
                expect(cookieManager._getExpiresDate(expires)).toEqual(expires);
            });

            it('returns `undefined` when `expires` is undefined', function () {
                expect(cookieManager._getExpiresDate(undefined)).toBeUndefined();
            });

            it('throws Error when `expires` is not a number, string, or Date', function () {
                var expires = {};
                expect(function () { cookieManager._getExpiresDate(expires); }).toThrow();
            });

            it('throws Error when `expires` is a non-date string', function () {
                var expires = 'cookies';
                expect(function () { cookieManager._getExpiresDate(expires); }).toThrow();
            });
        });

        describe('cookieManager._generateCookieString(key, value[, options])', function () {
            var key, value;

            beforeEach(function () {
                key = 'key';
                value = 'value';
            });

            it('separates the `key` and `value` with an "=" character', function () {
                expect(cookieManager._generateCookieString(key, value)).toEqual('key=value');
            });

            it('converts a number `value` to a string', function () {
                value = 0;
                expect(cookieManager._generateCookieString(key, value)).toEqual('key=0');
            });

            it('URI encodes the `key`', function () {
                key = '\\",; ñâé';
                expect(cookieManager._generateCookieString(key, value)).toEqual('%5C%22%2C%3B%20%C3%B1%C3%A2%C3%A9=value');
            });

            it('does not URI encode characters in the `key` that are allowed by RFC6265, except for the "%" character', function () {
                key = '#$%&+^`|';
                expect(cookieManager._generateCookieString(key, value)).toEqual('#$%25&+^`|=value');
            });

            it('URI encodes characters in the `key` that are not allowed by RFC6265, but are not encoded by `encodeURIComponent`', function () {
                key = '()';
                expect(cookieManager._generateCookieString(key, value)).toEqual('%28%29=value');
            });

            it('URI encodes special characters in the `value`, as defined by RFC6265, as well as the "%" character', function () {
                value = '\\",; ñâé%';
                expect(cookieManager._generateCookieString(key, value)).toEqual('key=%5C%22%2C%3B%20%C3%B1%C3%A2%C3%A9%25');
            });

            it('does not URI encode characters in the `value` that are allowed by RFC6265, except for the "%" character', function () {
                value = '#$&+/:<=>?@[]^`{|}~%';
                expect(cookieManager._generateCookieString(key, value)).toEqual('key=#$&+/:<=>?@[]^`{|}~%25');
            });

            it('includes the path when `options.path` is defined', function () {
                var options = { path: '/' };
                expect(cookieManager._generateCookieString(key, value, options)).toEqual('key=value;path=/');
            });

            it('includes the domain when `options.domain` is defined', function () {
                var options = { domain: 'www.cubesoft.org' };
                expect(cookieManager._generateCookieString(key, value, options)).toEqual('key=value;domain=www.cubesoft.org');
            });

            it('includes the expiration date when `options.expires` is defined', function () {
                var options = { expires: new Date('01/01/2015 00:00:00 GMT') };
                var expected = 'key=value;expires=' + options.expires.toGMTString(); // IE appends "UTC" instead of "GMT", so I can't hard-code the value

                expect(cookieManager._generateCookieString(key, value, options)).toEqual(expected);
            });

            it('includes the secure flag when `options.secure` is true', function () {
                var options = { secure: true };
                expect(cookieManager._generateCookieString(key, value, options)).toEqual('key=value;secure');
            });
        });

        describe('cookieManager._getCacheFromString(documentCookie)', function () {
            it('returns an object of cookie key/value pairs', function () {
                var documentCookie = 'key=value; pascal=bayer';
                var expected = {};
                expected[cookieManager._cacheKeyPrefix + 'key'] = 'value';
                expected[cookieManager._cacheKeyPrefix + 'pascal'] = 'bayer';

                expect(cookieManager._getCacheFromString(documentCookie)).toEqual(expected);
            });

            it('returns an empty object if `documentCookie` is an empty string', function () {
                var documentCookie = '';
                expect(cookieManager._getCacheFromString(documentCookie)).toEqual({});
            });

            it('ignores duplicate cookie keys', function () {
                var documentCookie = 'key=value; key=scott';
                var expected = {};
                expected[cookieManager._cacheKeyPrefix + 'key'] = 'value';

                expect(cookieManager._getCacheFromString(documentCookie)).toEqual(expected);
            });
        });

        describe('cookieManager._getKeyValuePairFromCookieString(cookieString)', function () {
            it('URI decodes cookie keys', function () {
                var cookieString = '%5C%22%2C%3B%20%C3%B1%C3%A2%C3%A9=value';
                expect(cookieManager._getKeyValuePairFromCookieString(cookieString)).toEqual({
                    'key': '\\",; ñâé',
                    'value': 'value'
                });
            });

            it('URI decodes cookie values', function () {
                var cookieString = 'key=%5C%22%2C%3B%20%C3%B1%C3%A2%C3%A9';
                expect(cookieManager._getKeyValuePairFromCookieString(cookieString)).toEqual({
                    key: 'key',
                    value: '\\",; ñâé'
                });
            });

            it('parses cookie values containing an "=" character', function () {
                var cookieString = 'key=value=value';
                expect(cookieManager._getKeyValuePairFromCookieString(cookieString)).toEqual({
                    key: 'key',
                    value: 'value=value'
                });
            });

            it('parses cookies with an empty string for the value', function () {
                var cookieString = 'key=';
                var expected = { key: 'key', value: '' };

                expect(cookieManager._getKeyValuePairFromCookieString(cookieString)).toEqual(expected);

                cookieString = 'key'; // IE omits the "="
                expect(cookieManager._getKeyValuePairFromCookieString(cookieString)).toEqual(expected);
            });
        });

        describe('cookieManager._renewCache()', function () {
            it('sets `cookieManager._cache` to `cookieManger._getCacheFromString(document.cookie)`', function () {
                mockDocument.cookie = 'key=value';
                cookieManager._cache = undefined;

                spyOn(cookieManager, '_getCacheFromString').and.callThrough();
                cookieManager._renewCache();

                expect(cookieManager._getCacheFromString).toHaveBeenCalledWith(mockDocument.cookie);
                expect(cookieManager._cache).toEqual(cookieManager._getCacheFromString(mockDocument.cookie));
            });

            it('sets `cookieManager._cachedDocumentCookie` to `document.cookie`', function () {
                mockDocument.cookie = 'key=value';
                cookieManager._renewCache();
                expect(cookieManager._cachedDocumentCookie).toEqual(mockDocument.cookie);
            });
        });

        describe('cookieManager.cookiesEnabled()', function () {
            var key;

            beforeEach(function () {
                key = 'cookie-manager.js';
            });

            it('attempts to set and get a cookie with a key of `cookie-manager.js`', function () {
                var value = 1;
                var documentCookie = 'cookie-manager.js=1';

                spyOn(cookieManager, 'set').and.callThrough();
                spyOn(cookieManager, 'get').and.callThrough();
                cookieManager.cookiesEnabled();

                expect(cookieManager.set).toHaveBeenCalledWith(key, value);
                expect(cookieManager.get).toHaveBeenCalledWith(key);
            });

            it('expires the test cookie when done', function () {
                spyOn(cookieManager, 'expire').and.callThrough();

                cookieManager.cookiesEnabled();

                expect(cookieManager.expire).toHaveBeenCalledWith(key);
            });

            it('returns `true` if a cookie can be set and retrieved successfully', function () {
                spyOn(cookieManager, 'set').and.callFake(function () {
                    mockDocument.cookie = 'cookie-manager.js=1';
                    return cookieManager;
                });

                expect(cookieManager.cookiesEnabled()).toBe(true);
            });

            it('returns `false` if a cookie cannot be set and retrieved successfully', function () {
                mockDocument.cookie = '';
                expect(cookieManager.cookiesEnabled()).toBe(false);
            });
        });
    });
});

describe('COOKIE MANAGER INTEGRATION TESTS', function () {
    var key = 'key';
    var value = 'value';
    var cookieManager;

    beforeEach(function () {
        cookieManager = new CookieManager();
        cookieManager._document = window.document;
    });

    describe('cookieManager.cookiesEnabled()', function () {
        // Cookies have to be enabled in order to do any integration tests
        it('is true', function () {
            expect(cookieManager.cookiesEnabled()).toBe(true);
        });
    });

    describe('cookieManager.set(key, value[, options])', function () {
        afterEach(function () {
            document.cookie = 'key=value;path=/;expires=' + new Date('01/01/2000').toGMTString();
        });

        it('sets a cookie', function () {
            cookieManager.set(key, value);
            expect(document.cookie).toContain('key=value');
        });

        it('expires a cookie when `value` is `undefined`', function () {
            cookieManager.set(key, value);
            cookieManager.set(key, undefined);
            expect(document.cookie).not.toContain('key=');
        });
    });

    describe('cookieManager.get(key)', function () {
        beforeEach(function () {
            cookieManager.set(key, value);
        });

        afterEach(function () {
            cookieManager.expire(key);
        });

        it('returns the value of a cookie', function () {
            expect(cookieManager.get(key)).toEqual(value);
        });
    });
});