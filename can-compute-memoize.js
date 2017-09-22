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
