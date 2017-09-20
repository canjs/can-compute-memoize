var DefineMap = require("can-define/map/map");
var qunit = require('steal-qunit');
var sinon = require('sinon');

var memoize = require('../can-compute-memoize');

var sandbox = sinon.createSandbox();
var withArgs = sandbox.spy(function () {
	return arguments[arguments.length - 1].prop;
});
var withoutArgs = sandbox.spy(function () {
	return 'qux'
});
var defineMap = new DefineMap({
	callWithArgs: function () {
		var args = Array.prototype.slice.call(arguments);
		var fn = memoize(this, 'withArgs', args, withArgs);
		return fn;
	},
	callWithoutArgs: function () {
		return memoize(this, 'withoutArgs', [], withoutArgs);
	}
});
var foo = {
	prop: 'foo'
};
var bar = {
	prop: 'bar'
};

function loop(fn, count) {
	while (count--) {
		fn();
	}
}

qunit.module('can-compute-memoize', {
	beforeEach: function () {
		memoize.clear();
		sandbox.reset();
	}
});

qunit.test('should be called once for each set of matching args', function () {
	loop(function () {
		defineMap.callWithArgs(foo);
	}, 5);
	qunit.equal(withArgs.callCount, 1);
	qunit.ok(withArgs.returned('foo'));

	loop(function () {
		defineMap.callWithArgs(foo, bar);
	}, 5);
	qunit.equal(withArgs.callCount, 2);
	qunit.ok(withArgs.returned('bar'));
});

qunit.test('should delete cache after removing all observations', function () {
	var cpt = defineMap.callWithArgs(foo);
	var handler = function () { };
	cpt.on('change', handler);
	cpt.off('change');
	defineMap.callWithArgs(foo);
	qunit.equal(withArgs.callCount, 2);
});

qunit.test('should be called once with no arguments', function () {
	loop(defineMap.callWithoutArgs, 5);
	qunit.equal(withoutArgs.callCount, 1);
});
