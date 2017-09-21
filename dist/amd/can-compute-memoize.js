/*can-compute-memoize@0.0.0-pre.0#can-compute-memoize*/
define([
    'require',
    'exports',
    'module',
    'can-compute'
], function (require, exports, module) {
    var compute = require('can-compute');
    function getWeakMap() {
        if (typeof WeakMap === 'function') {
            return new WeakMap();
        }
        console.warn('This browser does not support WeakMap, can-compute-memoize has been deoptimized.');
    }
    function createCompute(context, args, toValue) {
        return compute(function () {
            return toValue.apply(context, args);
        });
    }
    var memoizeCache = getWeakMap();
    module.exports = function (context, name, args, toValue) {
        var lastArg = args[args.length - 1];
        var cache;
        if (typeof memoizeCache !== 'undefined') {
            if (memoizeCache.has(context)) {
                cache = memoizeCache.get(context);
            } else {
                cache = {};
                memoizeCache.set(context, cache);
            }
            var memoizedArgs = cache[name];
            if (!memoizedArgs) {
                memoizedArgs = cache[name] = new Map();
            }
            for (var i = 0; i < args.length; i++) {
                var arg = args[i];
                if (memoizedArgs.has(arg)) {
                    memoizedArgs = memoizedArgs.get(arg);
                    continue;
                }
                var map = new Map();
                memoizedArgs.set(arg, map);
                memoizedArgs = map;
            }
            if (!memoizedArgs.has(lastArg)) {
                var c = createCompute(context, args, toValue);
                var eventTeardown = c.computeInstance._eventTeardown;
                c.computeInstance._eventTeardown = function () {
                    eventTeardown.call(c.computeInstance, arguments);
                    memoizedArgs.delete(lastArg);
                };
                compute.temporarilyBind(c);
                memoizedArgs.set(lastArg, c);
                return c;
            }
            return memoizedArgs.get(lastArg);
        } else {
            return createCompute(context, args, toValue);
        }
    };
    module.exports.clear = function () {
        memoizeCache = getWeakMap();
    };
});