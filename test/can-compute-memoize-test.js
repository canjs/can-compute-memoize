var DefineMap = require("can-define/map/map");
var QUinit = require('steal-qunit');
var sinon = require('sinon');

var memoize = require('../can-compute-memoize');

var sandbox = sinon.createSandbox();
var withArgs = sandbox.spy(function () {
	return arguments[arguments.length - 1].prop;
});
var withoutArgs = sandbox.spy(function () {
	return 'qux';
});
var concatArgs = sandbox.spy(function () {
	return toArray(arguments).join('');
});
var defineMap = new DefineMap({
	callWithArgs: function () {
		return memoize(this, 'withArgs', toArray(arguments), withArgs);
	},
	callWithoutArgs: function () {
		return memoize(this, 'withoutArgs', [], withoutArgs);
	},
	concatArgs: function () {
		return memoize(this, 'concatArgs', toArray(arguments), concatArgs);
	}
});
var foo = {
	prop: 'foo'
};
var bar = {
	prop: 'bar'
};

function toArray(arrayLike) {
	return Array.prototype.slice.call(arrayLike);
}

function loop(fn, count) {
	while (count--) {
		fn();
	}
}

QUinit.module('can-compute-memoize', {
	beforeEach: function () {
		memoize.clear();
		sandbox.reset();
	}
});

QUinit.test('should be called once for each set of matching args', function () {
	loop(function () {
		defineMap.callWithArgs(foo);
	}, 5);
	QUinit.equal(withArgs.callCount, 1);
	QUinit.equal(withArgs.returned('foo'), true);

	loop(function () {
		defineMap.callWithArgs(foo, bar);
	}, 5);
	QUinit.equal(withArgs.callCount, 2);
	QUinit.equal(withArgs.returned('bar'), true);
});

QUinit.test('should delete cache after removing all observations', function () {
	var cpt = defineMap.callWithArgs(foo);
	cpt.on('change', function () { });
	cpt.off('change');

	defineMap.callWithArgs(foo);
	QUinit.equal(withArgs.callCount, 2);
});

QUinit.test('should be called once with no arguments', function () {
	loop(defineMap.callWithoutArgs, 5);
	QUinit.equal(withoutArgs.callCount, 1);
});

QUinit.test('should work in browsers that do not support WeekMap', function () {
	var WM = WeakMap;
	WeakMap = undefined;
	memoize.clear();

	loop(function () {
		var c = defineMap.callWithArgs(foo);
		QUnit.equal(c(), 'foo');
	}, 5);
	QUinit.equal(withArgs.callCount, 5);

	WeakMap = WM;
});

QUinit.test('should not drop all cache on teardown', function () {
	defineMap.concatArgs(1, 2, 3);
	var c = defineMap.concatArgs(1, 'a', 'b');
	QUinit.equal(concatArgs.callCount, 2);
	c.on('change', function () { });
	c.off('change');
	defineMap.concatArgs(1, 2, 3);
	QUinit.equal(concatArgs.callCount, 2);
});

QUinit.test('should clean up cache tree on teardown', function () {
	defineMap.concatArgs(1, 2, 3);
	var c = defineMap.concatArgs(1, 'a', 'b');
	QUinit.equal(concatArgs.callCount, 2);
	c.on('change', function () { });
	c.off('change');
	var one = memoize.cache.get(defineMap).concatArgs.get(1);
	QUinit.equal(one.has('a'), false);
});
