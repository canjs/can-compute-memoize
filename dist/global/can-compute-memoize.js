/*[global-shim-start]*/
(function(exports, global, doEval) {
	// jshint ignore:line
	var origDefine = global.define;

	var get = function(name) {
		var parts = name.split("."),
			cur = global,
			i;
		for (i = 0; i < parts.length; i++) {
			if (!cur) {
				break;
			}
			cur = cur[parts[i]];
		}
		return cur;
	};
	var set = function(name, val) {
		var parts = name.split("."),
			cur = global,
			i,
			part,
			next;
		for (i = 0; i < parts.length - 1; i++) {
			part = parts[i];
			next = cur[part];
			if (!next) {
				next = cur[part] = {};
			}
			cur = next;
		}
		part = parts[parts.length - 1];
		cur[part] = val;
	};
	var useDefault = function(mod) {
		if (!mod || !mod.__esModule) return false;
		var esProps = { __esModule: true, default: true };
		for (var p in mod) {
			if (!esProps[p]) return false;
		}
		return true;
	};

	var hasCjsDependencies = function(deps) {
		return (
			deps[0] === "require" && deps[1] === "exports" && deps[2] === "module"
		);
	};

	var modules =
		(global.define && global.define.modules) ||
		(global._define && global._define.modules) ||
		{};
	var ourDefine = (global.define = function(moduleName, deps, callback) {
		var module;
		if (typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for (i = 0; i < deps.length; i++) {
			args.push(
				exports[deps[i]]
					? get(exports[deps[i]])
					: modules[deps[i]] || get(deps[i])
			);
		}
		// CJS has no dependencies but 3 callback arguments
		if (hasCjsDependencies(deps) || (!deps.length && callback.length)) {
			module = { exports: {} };
			args[0] = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args[1] = module.exports;
			args[2] = module;
		} else if (!args[0] && deps[0] === "exports") {
			// Babel uses the exports and module object.
			module = { exports: {} };
			args[0] = module.exports;
			if (deps[1] === "module") {
				args[1] = module;
			}
		} else if (!args[0] && deps[0] === "module") {
			args[0] = { id: moduleName };
		}

		global.define = origDefine;
		var result = callback ? callback.apply(null, args) : undefined;
		global.define = ourDefine;

		// Favor CJS module.exports over the return value
		result = module && module.exports ? module.exports : result;
		modules[moduleName] = result;

		// Set global exports
		var globalExport = exports[moduleName];
		if (globalExport && !get(globalExport)) {
			if (useDefault(result)) {
				result = result["default"];
			}
			set(globalExport, result);
		}
	});
	global.define.orig = origDefine;
	global.define.modules = modules;
	global.define.amd = true;
	ourDefine("@loader", [], function() {
		// shim for @@global-helpers
		var noop = function() {};
		return {
			get: function() {
				return { prepareGlobal: noop, retrieveGlobal: noop };
			},
			global: global,
			__exec: function(__load) {
				doEval(__load.source, global);
			}
		};
	});
})(
	{},
	typeof self == "object" && self.Object == Object ? self : window,
	function(__$source__, __$global__) {
		// jshint ignore:line
		eval("(function() { " + __$source__ + " \n }).call(__$global__);");
	}
);

/*can-compute-memoize@0.0.0#can-compute-memoize*/
define('can-compute-memoize', [
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
    function memoize(context, name, args, toValue) {
        var lastArg = args[args.length - 1];
        var treePath = [];
        var currentCacheBranch;
        if (typeof memoize.cache !== 'undefined') {
            if (memoize.cache.has(context)) {
                currentCacheBranch = memoize.cache.get(context);
            } else {
                currentCacheBranch = {};
                memoize.cache.set(context, currentCacheBranch);
            }
            var memoizedArgs = currentCacheBranch[name];
            if (!memoizedArgs) {
                memoizedArgs = currentCacheBranch[name] = new Map();
            }
            for (var i = 0; i < args.length; i++) {
                var arg = args[i];
                if (memoizedArgs.has(arg)) {
                    memoizedArgs = memoizedArgs.get(arg);
                } else {
                    var map = new Map();
                    memoizedArgs.set(arg, map);
                    memoizedArgs = map;
                }
                treePath.push(memoizedArgs);
            }
            if (!memoizedArgs.has(lastArg)) {
                var c = createCompute(context, args, toValue);
                var eventTeardown = c.computeInstance._eventTeardown;
                c.computeInstance._eventTeardown = function () {
                    eventTeardown.call(c.computeInstance, arguments);
                    memoizedArgs.delete(lastArg);
                    for (var i = treePath.length - 1; i >= 0; i--) {
                        if (treePath[i].size === 0) {
                            var parent = treePath[i - 1];
                            if (parent) {
                                var arg = args[i];
                                parent.delete(arg);
                            }
                        }
                    }
                };
                compute.temporarilyBind(c);
                memoizedArgs.set(lastArg, c);
                return c;
            }
            return memoizedArgs.get(lastArg);
        } else {
            return createCompute(context, args, toValue);
        }
    }
    memoize.clear = function () {
        memoize.cache = getWeakMap();
    };
    memoize.cache = getWeakMap();
    module.exports = memoize;
});
/*[global-shim-end]*/
(function(global) { // jshint ignore:line
	global._define = global.define;
	global.define = global.define.orig;
}
)(typeof self == "object" && self.Object == Object ? self : window);