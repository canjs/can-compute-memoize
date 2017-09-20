var compute = require('can-compute');
var weakMap = new WeakMap();

module.exports = function (context, name, args, toValue) {
	var lastArg = args[args.length - 1];
	var cache;

	if (weakMap.has(context)) {
		cache = weakMap.get(context);
	} else {
		cache = {};
		weakMap.set(context, cache);
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
		var c = compute(function () {
			return toValue.apply(context, args);
		});
		var eventTeardown = c.computeInstance._eventTeardown;
		c.computeInstance._eventTeardown = function () {
			eventTeardown.call(c.computeInstance);
			delete cache[name];
			if (!Object.keys(cache).length) {
				weakMap.delete(context);
			}
		};
		compute.temporarilyBind(c);
		memoizedArgs.set(lastArg, c);
	}

	return memoizedArgs.get(lastArg);
};

module.exports.clear = function () {
	weakMap = new WeakMap();
};
