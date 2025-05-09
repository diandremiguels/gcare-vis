(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ELK = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/*******************************************************************************
 * Copyright (c) 2017 Kiel University and others.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *******************************************************************************/
var ELK = exports["default"] = /*#__PURE__*/function () {
  function ELK() {
    var _this = this;
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$defaultLayoutOpt = _ref.defaultLayoutOptions,
      defaultLayoutOptions = _ref$defaultLayoutOpt === void 0 ? {} : _ref$defaultLayoutOpt,
      _ref$algorithms = _ref.algorithms,
      algorithms = _ref$algorithms === void 0 ? ['layered', 'stress', 'mrtree', 'radial', 'force', 'disco', 'sporeOverlap', 'sporeCompaction', 'rectpacking'] : _ref$algorithms,
      workerFactory = _ref.workerFactory,
      workerUrl = _ref.workerUrl;
    _classCallCheck(this, ELK);
    this.defaultLayoutOptions = defaultLayoutOptions;
    this.initialized = false;

    // check valid worker construction possible
    if (typeof workerUrl === 'undefined' && typeof workerFactory === 'undefined') {
      throw new Error("Cannot construct an ELK without both 'workerUrl' and 'workerFactory'.");
    }
    var factory = workerFactory;
    if (typeof workerUrl !== 'undefined' && typeof workerFactory === 'undefined') {
      // use default Web Worker
      factory = function factory(url) {
        return new Worker(url);
      };
    }

    // create the worker
    var worker = factory(workerUrl);
    if (typeof worker.postMessage !== 'function') {
      throw new TypeError("Created worker does not provide" + " the required 'postMessage' function.");
    }

    // wrap the worker to return promises
    this.worker = new PromisedWorker(worker);

    // initially register algorithms
    this.worker.postMessage({
      cmd: 'register',
      algorithms: algorithms
    }).then(function (r) {
      return _this.initialized = true;
    })["catch"](console.err);
  }
  return _createClass(ELK, [{
    key: "layout",
    value: function layout(graph) {
      var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref2$layoutOptions = _ref2.layoutOptions,
        layoutOptions = _ref2$layoutOptions === void 0 ? this.defaultLayoutOptions : _ref2$layoutOptions,
        _ref2$logging = _ref2.logging,
        logging = _ref2$logging === void 0 ? false : _ref2$logging,
        _ref2$measureExecutio = _ref2.measureExecutionTime,
        measureExecutionTime = _ref2$measureExecutio === void 0 ? false : _ref2$measureExecutio;
      if (!graph) {
        return Promise.reject(new Error("Missing mandatory parameter 'graph'."));
      }
      return this.worker.postMessage({
        cmd: 'layout',
        graph: graph,
        layoutOptions: layoutOptions,
        options: {
          logging: logging,
          measureExecutionTime: measureExecutionTime
        }
      });
    }
  }, {
    key: "knownLayoutAlgorithms",
    value: function knownLayoutAlgorithms() {
      return this.worker.postMessage({
        cmd: 'algorithms'
      });
    }
  }, {
    key: "knownLayoutOptions",
    value: function knownLayoutOptions() {
      return this.worker.postMessage({
        cmd: 'options'
      });
    }
  }, {
    key: "knownLayoutCategories",
    value: function knownLayoutCategories() {
      return this.worker.postMessage({
        cmd: 'categories'
      });
    }
  }, {
    key: "terminateWorker",
    value: function terminateWorker() {
      if (this.worker) this.worker.terminate();
    }
  }]);
}();
var PromisedWorker = /*#__PURE__*/function () {
  function PromisedWorker(worker) {
    var _this2 = this;
    _classCallCheck(this, PromisedWorker);
    if (worker === undefined) {
      throw new Error("Missing mandatory parameter 'worker'.");
    }
    this.resolvers = {};
    this.worker = worker;
    this.worker.onmessage = function (answer) {
      // why is this necessary?
      setTimeout(function () {
        _this2.receive(_this2, answer);
      }, 0);
    };
  }
  return _createClass(PromisedWorker, [{
    key: "postMessage",
    value: function postMessage(msg) {
      var id = this.id || 0;
      this.id = id + 1;
      msg.id = id;
      var self = this;
      return new Promise(function (resolve, reject) {
        // prepare the resolver
        self.resolvers[id] = function (err, res) {
          if (err) {
            self.convertGwtStyleError(err);
            reject(err);
          } else {
            resolve(res);
          }
        };
        // post the message
        self.worker.postMessage(msg);
      });
    }
  }, {
    key: "receive",
    value: function receive(self, answer) {
      var json = answer.data;
      var resolver = self.resolvers[json.id];
      if (resolver) {
        delete self.resolvers[json.id];
        if (json.error) {
          resolver(json.error);
        } else {
          resolver(null, json.data);
        }
      }
    }
  }, {
    key: "terminate",
    value: function terminate() {
      if (this.worker) {
        this.worker.terminate();
      }
    }
  }, {
    key: "convertGwtStyleError",
    value: function convertGwtStyleError(err) {
      if (!err) {
        return;
      }
      // Somewhat flatten the way GWT stores nested exception(s)
      var javaException = err['__java$exception'];
      if (javaException) {
        // Note that the property name of the nested exception is different
        // in the non-minified ('cause') and the minified (not deterministic) version.
        // Hence, the version below only works for the non-minified version.
        // However, as the minified stack trace is not of much use anyway, one
        // should switch the used version for debugging in such a case.
        if (javaException.cause && javaException.cause.backingJsObject) {
          err.cause = javaException.cause.backingJsObject;
          this.convertGwtStyleError(err.cause);
        }
        delete err['__java$exception'];
      }
    }
  }]);
}();
},{}],2:[function(require,module,exports){
"use strict";

/*******************************************************************************
 * Copyright (c) 2021 Kiel University and others.
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 * 
 * SPDX-License-Identifier: EPL-2.0
 *******************************************************************************/
var ELK = require('./elk-api.js')["default"];
Object.defineProperty(module.exports, "__esModule", {
  value: true
});
module.exports = ELK;
ELK["default"] = ELK;
},{"./elk-api.js":1}]},{},[2])(2)
});
