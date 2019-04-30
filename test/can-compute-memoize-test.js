var DefineMap = require("can-define/map/map");
var QUnit = require('steal-qunit');
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

QUnit.module('can-compute-memoize', {
	beforeEach: function () {
		memoize.clear();
		sandbox.reset();
	}
});

QUnit.test('should be called once for each set of matching args', function (assert) {
	loop(function () {
		defineMap.callWithArgs(foo);
	}, 5);
	assert.equal(withArgs.callCount, 1);
	assert.equal(withArgs.returned('foo'), true);

	loop(function () {
		defineMap.callWithArgs(foo, bar);
	}, 5);
	assert.equal(withArgs.callCount, 2);
	assert.equal(withArgs.returned('bar'), true);
});

QUnit.test('should delete cache after removing all observations', function (assert) {
	var cpt = defineMap.callWithArgs(foo);
	cpt.on('change', function () { });
	cpt.off('change');

	defineMap.callWithArgs(foo);
	assert.equal(withArgs.callCount, 2);
});

QUnit.test('should be called once with no arguments', function (assert) {
	loop(defineMap.callWithoutArgs, 5);
	assert.equal(withoutArgs.callCount, 1);
});

QUnit.test('should work in browsers that do not support WeekMap', function (assert) {
	var WM = WeakMap;
	WeakMap = undefined;
	memoize.clear();

	loop(function () {
		var c = defineMap.callWithArgs(foo);
		assert.equal(c(), 'foo');
	}, 5);
	assert.equal(withArgs.callCount, 5);

	WeakMap = WM;
});

QUnit.test('should not drop all cache on teardown', function (assert) {
	defineMap.concatArgs(1, 2, 3);
	var c = defineMap.concatArgs(1, 'a', 'b');
	assert.equal(concatArgs.callCount, 2);
	c.on('change', function () { });
	c.off('change');
	defineMap.concatArgs(1, 2, 3);
	assert.equal(concatArgs.callCount, 2);
});

QUnit.test('should clean up cache tree on teardown', function (assert) {
	defineMap.concatArgs(1, 2, 3);
	var c = defineMap.concatArgs(1, 'a', 'b');
	assert.equal(concatArgs.callCount, 2);
	c.on('change', function () { });
	c.off('change');
	var one = memoize.cache.get(defineMap).concatArgs.get(1);
	assert.equal(one.has('a'), false);
});
