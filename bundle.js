var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/binary-search-bounds/search-bounds.js
var require_search_bounds = __commonJS({
  "node_modules/binary-search-bounds/search-bounds.js"(exports, module) {
    "use strict";
    function ge(a, y, c, l, h) {
      var i = h + 1;
      while (l <= h) {
        var m = l + h >>> 1, x = a[m];
        var p = c !== void 0 ? c(x, y) : x - y;
        if (p >= 0) {
          i = m;
          h = m - 1;
        } else {
          l = m + 1;
        }
      }
      return i;
    }
    function gt(a, y, c, l, h) {
      var i = h + 1;
      while (l <= h) {
        var m = l + h >>> 1, x = a[m];
        var p = c !== void 0 ? c(x, y) : x - y;
        if (p > 0) {
          i = m;
          h = m - 1;
        } else {
          l = m + 1;
        }
      }
      return i;
    }
    function lt(a, y, c, l, h) {
      var i = l - 1;
      while (l <= h) {
        var m = l + h >>> 1, x = a[m];
        var p = c !== void 0 ? c(x, y) : x - y;
        if (p < 0) {
          i = m;
          l = m + 1;
        } else {
          h = m - 1;
        }
      }
      return i;
    }
    function le(a, y, c, l, h) {
      var i = l - 1;
      while (l <= h) {
        var m = l + h >>> 1, x = a[m];
        var p = c !== void 0 ? c(x, y) : x - y;
        if (p <= 0) {
          i = m;
          l = m + 1;
        } else {
          h = m - 1;
        }
      }
      return i;
    }
    function eq(a, y, c, l, h) {
      while (l <= h) {
        var m = l + h >>> 1, x = a[m];
        var p = c !== void 0 ? c(x, y) : x - y;
        if (p === 0) {
          return m;
        }
        if (p <= 0) {
          l = m + 1;
        } else {
          h = m - 1;
        }
      }
      return -1;
    }
    function norm(a, y, c, l, h, f) {
      if (typeof c === "function") {
        return f(a, y, c, l === void 0 ? 0 : l | 0, h === void 0 ? a.length - 1 : h | 0);
      }
      return f(a, y, void 0, c === void 0 ? 0 : c | 0, l === void 0 ? a.length - 1 : l | 0);
    }
    module.exports = {
      ge: function(a, y, c, l, h) {
        return norm(a, y, c, l, h, ge);
      },
      gt: function(a, y, c, l, h) {
        return norm(a, y, c, l, h, gt);
      },
      lt: function(a, y, c, l, h) {
        return norm(a, y, c, l, h, lt);
      },
      le: function(a, y, c, l, h) {
        return norm(a, y, c, l, h, le);
      },
      eq: function(a, y, c, l, h) {
        return norm(a, y, c, l, h, eq);
      }
    };
  }
});

// node_modules/two-product/two-product.js
var require_two_product = __commonJS({
  "node_modules/two-product/two-product.js"(exports, module) {
    "use strict";
    module.exports = twoProduct;
    var SPLITTER = +(Math.pow(2, 27) + 1);
    function twoProduct(a, b, result) {
      var x = a * b;
      var c = SPLITTER * a;
      var abig = c - a;
      var ahi = c - abig;
      var alo = a - ahi;
      var d = SPLITTER * b;
      var bbig = d - b;
      var bhi = d - bbig;
      var blo = b - bhi;
      var err1 = x - ahi * bhi;
      var err2 = err1 - alo * bhi;
      var err3 = err2 - ahi * blo;
      var y = alo * blo - err3;
      if (result) {
        result[0] = y;
        result[1] = x;
        return result;
      }
      return [y, x];
    }
  }
});

// node_modules/robust-sum/robust-sum.js
var require_robust_sum = __commonJS({
  "node_modules/robust-sum/robust-sum.js"(exports, module) {
    "use strict";
    module.exports = linearExpansionSum;
    function scalarScalar(a, b) {
      var x = a + b;
      var bv = x - a;
      var av = x - bv;
      var br = b - bv;
      var ar = a - av;
      var y = ar + br;
      if (y) {
        return [y, x];
      }
      return [x];
    }
    function linearExpansionSum(e, f) {
      var ne = e.length | 0;
      var nf = f.length | 0;
      if (ne === 1 && nf === 1) {
        return scalarScalar(e[0], f[0]);
      }
      var n = ne + nf;
      var g = new Array(n);
      var count = 0;
      var eptr = 0;
      var fptr = 0;
      var abs = Math.abs;
      var ei = e[eptr];
      var ea = abs(ei);
      var fi = f[fptr];
      var fa = abs(fi);
      var a, b;
      if (ea < fa) {
        b = ei;
        eptr += 1;
        if (eptr < ne) {
          ei = e[eptr];
          ea = abs(ei);
        }
      } else {
        b = fi;
        fptr += 1;
        if (fptr < nf) {
          fi = f[fptr];
          fa = abs(fi);
        }
      }
      if (eptr < ne && ea < fa || fptr >= nf) {
        a = ei;
        eptr += 1;
        if (eptr < ne) {
          ei = e[eptr];
          ea = abs(ei);
        }
      } else {
        a = fi;
        fptr += 1;
        if (fptr < nf) {
          fi = f[fptr];
          fa = abs(fi);
        }
      }
      var x = a + b;
      var bv = x - a;
      var y = b - bv;
      var q0 = y;
      var q1 = x;
      var _x, _bv, _av, _br, _ar;
      while (eptr < ne && fptr < nf) {
        if (ea < fa) {
          a = ei;
          eptr += 1;
          if (eptr < ne) {
            ei = e[eptr];
            ea = abs(ei);
          }
        } else {
          a = fi;
          fptr += 1;
          if (fptr < nf) {
            fi = f[fptr];
            fa = abs(fi);
          }
        }
        b = q0;
        x = a + b;
        bv = x - a;
        y = b - bv;
        if (y) {
          g[count++] = y;
        }
        _x = q1 + x;
        _bv = _x - q1;
        _av = _x - _bv;
        _br = x - _bv;
        _ar = q1 - _av;
        q0 = _ar + _br;
        q1 = _x;
      }
      while (eptr < ne) {
        a = ei;
        b = q0;
        x = a + b;
        bv = x - a;
        y = b - bv;
        if (y) {
          g[count++] = y;
        }
        _x = q1 + x;
        _bv = _x - q1;
        _av = _x - _bv;
        _br = x - _bv;
        _ar = q1 - _av;
        q0 = _ar + _br;
        q1 = _x;
        eptr += 1;
        if (eptr < ne) {
          ei = e[eptr];
        }
      }
      while (fptr < nf) {
        a = fi;
        b = q0;
        x = a + b;
        bv = x - a;
        y = b - bv;
        if (y) {
          g[count++] = y;
        }
        _x = q1 + x;
        _bv = _x - q1;
        _av = _x - _bv;
        _br = x - _bv;
        _ar = q1 - _av;
        q0 = _ar + _br;
        q1 = _x;
        fptr += 1;
        if (fptr < nf) {
          fi = f[fptr];
        }
      }
      if (q0) {
        g[count++] = q0;
      }
      if (q1) {
        g[count++] = q1;
      }
      if (!count) {
        g[count++] = 0;
      }
      g.length = count;
      return g;
    }
  }
});

// node_modules/two-sum/two-sum.js
var require_two_sum = __commonJS({
  "node_modules/two-sum/two-sum.js"(exports, module) {
    "use strict";
    module.exports = fastTwoSum;
    function fastTwoSum(a, b, result) {
      var x = a + b;
      var bv = x - a;
      var av = x - bv;
      var br = b - bv;
      var ar = a - av;
      if (result) {
        result[0] = ar + br;
        result[1] = x;
        return result;
      }
      return [ar + br, x];
    }
  }
});

// node_modules/robust-scale/robust-scale.js
var require_robust_scale = __commonJS({
  "node_modules/robust-scale/robust-scale.js"(exports, module) {
    "use strict";
    var twoProduct = require_two_product();
    var twoSum = require_two_sum();
    module.exports = scaleLinearExpansion;
    function scaleLinearExpansion(e, scale) {
      var n = e.length;
      if (n === 1) {
        var ts = twoProduct(e[0], scale);
        if (ts[0]) {
          return ts;
        }
        return [ts[1]];
      }
      var g = new Array(2 * n);
      var q = [0.1, 0.1];
      var t = [0.1, 0.1];
      var count = 0;
      twoProduct(e[0], scale, q);
      if (q[0]) {
        g[count++] = q[0];
      }
      for (var i = 1; i < n; ++i) {
        twoProduct(e[i], scale, t);
        var pq = q[1];
        twoSum(pq, t[0], q);
        if (q[0]) {
          g[count++] = q[0];
        }
        var a = t[1];
        var b = q[1];
        var x = a + b;
        var bv = x - a;
        var y = b - bv;
        q[1] = x;
        if (y) {
          g[count++] = y;
        }
      }
      if (q[1]) {
        g[count++] = q[1];
      }
      if (count === 0) {
        g[count++] = 0;
      }
      g.length = count;
      return g;
    }
  }
});

// node_modules/robust-subtract/robust-diff.js
var require_robust_diff = __commonJS({
  "node_modules/robust-subtract/robust-diff.js"(exports, module) {
    "use strict";
    module.exports = robustSubtract;
    function scalarScalar(a, b) {
      var x = a + b;
      var bv = x - a;
      var av = x - bv;
      var br = b - bv;
      var ar = a - av;
      var y = ar + br;
      if (y) {
        return [y, x];
      }
      return [x];
    }
    function robustSubtract(e, f) {
      var ne = e.length | 0;
      var nf = f.length | 0;
      if (ne === 1 && nf === 1) {
        return scalarScalar(e[0], -f[0]);
      }
      var n = ne + nf;
      var g = new Array(n);
      var count = 0;
      var eptr = 0;
      var fptr = 0;
      var abs = Math.abs;
      var ei = e[eptr];
      var ea = abs(ei);
      var fi = -f[fptr];
      var fa = abs(fi);
      var a, b;
      if (ea < fa) {
        b = ei;
        eptr += 1;
        if (eptr < ne) {
          ei = e[eptr];
          ea = abs(ei);
        }
      } else {
        b = fi;
        fptr += 1;
        if (fptr < nf) {
          fi = -f[fptr];
          fa = abs(fi);
        }
      }
      if (eptr < ne && ea < fa || fptr >= nf) {
        a = ei;
        eptr += 1;
        if (eptr < ne) {
          ei = e[eptr];
          ea = abs(ei);
        }
      } else {
        a = fi;
        fptr += 1;
        if (fptr < nf) {
          fi = -f[fptr];
          fa = abs(fi);
        }
      }
      var x = a + b;
      var bv = x - a;
      var y = b - bv;
      var q0 = y;
      var q1 = x;
      var _x, _bv, _av, _br, _ar;
      while (eptr < ne && fptr < nf) {
        if (ea < fa) {
          a = ei;
          eptr += 1;
          if (eptr < ne) {
            ei = e[eptr];
            ea = abs(ei);
          }
        } else {
          a = fi;
          fptr += 1;
          if (fptr < nf) {
            fi = -f[fptr];
            fa = abs(fi);
          }
        }
        b = q0;
        x = a + b;
        bv = x - a;
        y = b - bv;
        if (y) {
          g[count++] = y;
        }
        _x = q1 + x;
        _bv = _x - q1;
        _av = _x - _bv;
        _br = x - _bv;
        _ar = q1 - _av;
        q0 = _ar + _br;
        q1 = _x;
      }
      while (eptr < ne) {
        a = ei;
        b = q0;
        x = a + b;
        bv = x - a;
        y = b - bv;
        if (y) {
          g[count++] = y;
        }
        _x = q1 + x;
        _bv = _x - q1;
        _av = _x - _bv;
        _br = x - _bv;
        _ar = q1 - _av;
        q0 = _ar + _br;
        q1 = _x;
        eptr += 1;
        if (eptr < ne) {
          ei = e[eptr];
        }
      }
      while (fptr < nf) {
        a = fi;
        b = q0;
        x = a + b;
        bv = x - a;
        y = b - bv;
        if (y) {
          g[count++] = y;
        }
        _x = q1 + x;
        _bv = _x - q1;
        _av = _x - _bv;
        _br = x - _bv;
        _ar = q1 - _av;
        q0 = _ar + _br;
        q1 = _x;
        fptr += 1;
        if (fptr < nf) {
          fi = -f[fptr];
        }
      }
      if (q0) {
        g[count++] = q0;
      }
      if (q1) {
        g[count++] = q1;
      }
      if (!count) {
        g[count++] = 0;
      }
      g.length = count;
      return g;
    }
  }
});

// node_modules/robust-orientation/orientation.js
var require_orientation = __commonJS({
  "node_modules/robust-orientation/orientation.js"(exports, module) {
    "use strict";
    var twoProduct = require_two_product();
    var robustSum = require_robust_sum();
    var robustScale = require_robust_scale();
    var robustSubtract = require_robust_diff();
    var NUM_EXPAND = 5;
    var EPSILON2 = 11102230246251565e-32;
    var ERRBOUND3 = (3 + 16 * EPSILON2) * EPSILON2;
    var ERRBOUND4 = (7 + 56 * EPSILON2) * EPSILON2;
    function orientation_3(sum, prod, scale, sub) {
      return function orientation3Exact2(m0, m1, m2) {
        var p = sum(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])));
        var n = sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0]));
        var d = sub(p, n);
        return d[d.length - 1];
      };
    }
    function orientation_4(sum, prod, scale, sub) {
      return function orientation4Exact2(m0, m1, m2, m3) {
        var p = sum(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m1[2]), sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), -m2[2]), scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m3[2]))), sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m3[2]))));
        var n = sum(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m2[2]), scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m3[2]))), sum(scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m2[2]))));
        var d = sub(p, n);
        return d[d.length - 1];
      };
    }
    function orientation_5(sum, prod, scale, sub) {
      return function orientation5Exact(m0, m1, m2, m3, m4) {
        var p = sum(sum(sum(scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m2[2]), sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), -m3[2]), scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m4[2]))), m1[3]), sum(scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m1[2]), sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), -m3[2]), scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m4[2]))), -m2[3]), scale(sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), m1[2]), sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), -m2[2]), scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m4[2]))), m3[3]))), sum(scale(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m1[2]), sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), -m2[2]), scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m3[2]))), -m4[3]), sum(scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m1[2]), sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), -m3[2]), scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m4[2]))), m0[3]), scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m3[2]), scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), m4[2]))), -m1[3])))), sum(sum(scale(sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m4[2]))), m3[3]), sum(scale(sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m3[2]))), -m4[3]), scale(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m1[2]), sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), -m2[2]), scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m3[2]))), m0[3]))), sum(scale(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m2[2]), scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m3[2]))), -m1[3]), sum(scale(sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m3[2]))), m2[3]), scale(sum(scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m2[2]))), -m3[3])))));
        var n = sum(sum(sum(scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m2[2]), sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), -m3[2]), scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m4[2]))), m0[3]), scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m3[2]), scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), m4[2]))), -m2[3])), sum(scale(sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m2[2]), scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m4[2]))), m3[3]), scale(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m2[2]), scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m3[2]))), -m4[3]))), sum(sum(scale(sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), m1[2]), sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), -m2[2]), scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m4[2]))), m0[3]), scale(sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m2[2]), scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m4[2]))), -m1[3])), sum(scale(sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m4[2]))), m2[3]), scale(sum(scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m2[2]))), -m4[3]))));
        var d = sub(p, n);
        return d[d.length - 1];
      };
    }
    function orientation(n) {
      var fn = n === 3 ? orientation_3 : n === 4 ? orientation_4 : orientation_5;
      return fn(robustSum, twoProduct, robustScale, robustSubtract);
    }
    var orientation3Exact = orientation(3);
    var orientation4Exact = orientation(4);
    var CACHED = [
      function orientation0() {
        return 0;
      },
      function orientation1() {
        return 0;
      },
      function orientation2(a, b) {
        return b[0] - a[0];
      },
      function orientation3(a, b, c) {
        var l = (a[1] - c[1]) * (b[0] - c[0]);
        var r = (a[0] - c[0]) * (b[1] - c[1]);
        var det = l - r;
        var s;
        if (l > 0) {
          if (r <= 0) {
            return det;
          } else {
            s = l + r;
          }
        } else if (l < 0) {
          if (r >= 0) {
            return det;
          } else {
            s = -(l + r);
          }
        } else {
          return det;
        }
        var tol = ERRBOUND3 * s;
        if (det >= tol || det <= -tol) {
          return det;
        }
        return orientation3Exact(a, b, c);
      },
      function orientation4(a, b, c, d) {
        var adx = a[0] - d[0];
        var bdx = b[0] - d[0];
        var cdx = c[0] - d[0];
        var ady = a[1] - d[1];
        var bdy = b[1] - d[1];
        var cdy = c[1] - d[1];
        var adz = a[2] - d[2];
        var bdz = b[2] - d[2];
        var cdz = c[2] - d[2];
        var bdxcdy = bdx * cdy;
        var cdxbdy = cdx * bdy;
        var cdxady = cdx * ady;
        var adxcdy = adx * cdy;
        var adxbdy = adx * bdy;
        var bdxady = bdx * ady;
        var det = adz * (bdxcdy - cdxbdy) + bdz * (cdxady - adxcdy) + cdz * (adxbdy - bdxady);
        var permanent = (Math.abs(bdxcdy) + Math.abs(cdxbdy)) * Math.abs(adz) + (Math.abs(cdxady) + Math.abs(adxcdy)) * Math.abs(bdz) + (Math.abs(adxbdy) + Math.abs(bdxady)) * Math.abs(cdz);
        var tol = ERRBOUND4 * permanent;
        if (det > tol || -det > tol) {
          return det;
        }
        return orientation4Exact(a, b, c, d);
      }
    ];
    function slowOrient(args) {
      var proc2 = CACHED[args.length];
      if (!proc2) {
        proc2 = CACHED[args.length] = orientation(args.length);
      }
      return proc2.apply(void 0, args);
    }
    function proc(slow, o0, o1, o2, o3, o4, o5) {
      return function getOrientation(a0, a1, a2, a3, a4) {
        switch (arguments.length) {
          case 0:
          case 1:
            return 0;
          case 2:
            return o2(a0, a1);
          case 3:
            return o3(a0, a1, a2);
          case 4:
            return o4(a0, a1, a2, a3);
          case 5:
            return o5(a0, a1, a2, a3, a4);
        }
        var s = new Array(arguments.length);
        for (var i = 0; i < arguments.length; ++i) {
          s[i] = arguments[i];
        }
        return slow(s);
      };
    }
    function generateOrientationProc() {
      while (CACHED.length <= NUM_EXPAND) {
        CACHED.push(orientation(CACHED.length));
      }
      module.exports = proc.apply(void 0, [slowOrient].concat(CACHED));
      for (var i = 0; i <= NUM_EXPAND; ++i) {
        module.exports[i] = CACHED[i];
      }
    }
    generateOrientationProc();
  }
});

// node_modules/cdt2d/lib/monotone.js
var require_monotone = __commonJS({
  "node_modules/cdt2d/lib/monotone.js"(exports, module) {
    "use strict";
    var bsearch = require_search_bounds();
    var orient = require_orientation()[3];
    var EVENT_POINT = 0;
    var EVENT_END = 1;
    var EVENT_START = 2;
    module.exports = monotoneTriangulate;
    function PartialHull(a, b, idx, lowerIds, upperIds) {
      this.a = a;
      this.b = b;
      this.idx = idx;
      this.lowerIds = lowerIds;
      this.upperIds = upperIds;
    }
    function Event(a, b, type, idx) {
      this.a = a;
      this.b = b;
      this.type = type;
      this.idx = idx;
    }
    function compareEvent(a, b) {
      var d = a.a[0] - b.a[0] || a.a[1] - b.a[1] || a.type - b.type;
      if (d) {
        return d;
      }
      if (a.type !== EVENT_POINT) {
        d = orient(a.a, a.b, b.b);
        if (d) {
          return d;
        }
      }
      return a.idx - b.idx;
    }
    function testPoint(hull, p) {
      return orient(hull.a, hull.b, p);
    }
    function addPoint(cells, hulls, points, p, idx) {
      var lo = bsearch.lt(hulls, p, testPoint);
      var hi = bsearch.gt(hulls, p, testPoint);
      for (var i = lo; i < hi; ++i) {
        var hull = hulls[i];
        var lowerIds = hull.lowerIds;
        var m = lowerIds.length;
        while (m > 1 && orient(
          points[lowerIds[m - 2]],
          points[lowerIds[m - 1]],
          p
        ) > 0) {
          cells.push(
            [
              lowerIds[m - 1],
              lowerIds[m - 2],
              idx
            ]
          );
          m -= 1;
        }
        lowerIds.length = m;
        lowerIds.push(idx);
        var upperIds = hull.upperIds;
        var m = upperIds.length;
        while (m > 1 && orient(
          points[upperIds[m - 2]],
          points[upperIds[m - 1]],
          p
        ) < 0) {
          cells.push(
            [
              upperIds[m - 2],
              upperIds[m - 1],
              idx
            ]
          );
          m -= 1;
        }
        upperIds.length = m;
        upperIds.push(idx);
      }
    }
    function findSplit(hull, edge) {
      var d;
      if (hull.a[0] < edge.a[0]) {
        d = orient(hull.a, hull.b, edge.a);
      } else {
        d = orient(edge.b, edge.a, hull.a);
      }
      if (d) {
        return d;
      }
      if (edge.b[0] < hull.b[0]) {
        d = orient(hull.a, hull.b, edge.b);
      } else {
        d = orient(edge.b, edge.a, hull.b);
      }
      return d || hull.idx - edge.idx;
    }
    function splitHulls(hulls, points, event) {
      var splitIdx = bsearch.le(hulls, event, findSplit);
      var hull = hulls[splitIdx];
      var upperIds = hull.upperIds;
      var x = upperIds[upperIds.length - 1];
      hull.upperIds = [x];
      hulls.splice(
        splitIdx + 1,
        0,
        new PartialHull(event.a, event.b, event.idx, [x], upperIds)
      );
    }
    function mergeHulls(hulls, points, event) {
      var tmp = event.a;
      event.a = event.b;
      event.b = tmp;
      var mergeIdx = bsearch.eq(hulls, event, findSplit);
      var upper = hulls[mergeIdx];
      var lower = hulls[mergeIdx - 1];
      lower.upperIds = upper.upperIds;
      hulls.splice(mergeIdx, 1);
    }
    function monotoneTriangulate(points, edges) {
      var numPoints = points.length;
      var numEdges = edges.length;
      var events = [];
      for (var i = 0; i < numPoints; ++i) {
        events.push(new Event(
          points[i],
          null,
          EVENT_POINT,
          i
        ));
      }
      for (var i = 0; i < numEdges; ++i) {
        var e = edges[i];
        var a = points[e[0]];
        var b = points[e[1]];
        if (a[0] < b[0]) {
          events.push(
            new Event(a, b, EVENT_START, i),
            new Event(b, a, EVENT_END, i)
          );
        } else if (a[0] > b[0]) {
          events.push(
            new Event(b, a, EVENT_START, i),
            new Event(a, b, EVENT_END, i)
          );
        }
      }
      events.sort(compareEvent);
      var minX = events[0].a[0] - (1 + Math.abs(events[0].a[0])) * Math.pow(2, -52);
      var hull = [new PartialHull([minX, 1], [minX, 0], -1, [], [], [], [])];
      var cells = [];
      for (var i = 0, numEvents = events.length; i < numEvents; ++i) {
        var event = events[i];
        var type = event.type;
        if (type === EVENT_POINT) {
          addPoint(cells, hull, points, event.a, event.idx);
        } else if (type === EVENT_START) {
          splitHulls(hull, points, event);
        } else {
          mergeHulls(hull, points, event);
        }
      }
      return cells;
    }
  }
});

// node_modules/cdt2d/lib/triangulation.js
var require_triangulation = __commonJS({
  "node_modules/cdt2d/lib/triangulation.js"(exports, module) {
    "use strict";
    var bsearch = require_search_bounds();
    module.exports = createTriangulation;
    function Triangulation(stars, edges) {
      this.stars = stars;
      this.edges = edges;
    }
    var proto = Triangulation.prototype;
    function removePair(list, j, k) {
      for (var i = 1, n = list.length; i < n; i += 2) {
        if (list[i - 1] === j && list[i] === k) {
          list[i - 1] = list[n - 2];
          list[i] = list[n - 1];
          list.length = n - 2;
          return;
        }
      }
    }
    proto.isConstraint = /* @__PURE__ */ (function() {
      var e = [0, 0];
      function compareLex(a, b) {
        return a[0] - b[0] || a[1] - b[1];
      }
      return function(i, j) {
        e[0] = Math.min(i, j);
        e[1] = Math.max(i, j);
        return bsearch.eq(this.edges, e, compareLex) >= 0;
      };
    })();
    proto.removeTriangle = function(i, j, k) {
      var stars = this.stars;
      removePair(stars[i], j, k);
      removePair(stars[j], k, i);
      removePair(stars[k], i, j);
    };
    proto.addTriangle = function(i, j, k) {
      var stars = this.stars;
      stars[i].push(j, k);
      stars[j].push(k, i);
      stars[k].push(i, j);
    };
    proto.opposite = function(j, i) {
      var list = this.stars[i];
      for (var k = 1, n = list.length; k < n; k += 2) {
        if (list[k] === j) {
          return list[k - 1];
        }
      }
      return -1;
    };
    proto.flip = function(i, j) {
      var a = this.opposite(i, j);
      var b = this.opposite(j, i);
      this.removeTriangle(i, j, a);
      this.removeTriangle(j, i, b);
      this.addTriangle(i, b, a);
      this.addTriangle(j, a, b);
    };
    proto.edges = function() {
      var stars = this.stars;
      var result = [];
      for (var i = 0, n = stars.length; i < n; ++i) {
        var list = stars[i];
        for (var j = 0, m = list.length; j < m; j += 2) {
          result.push([list[j], list[j + 1]]);
        }
      }
      return result;
    };
    proto.cells = function() {
      var stars = this.stars;
      var result = [];
      for (var i = 0, n = stars.length; i < n; ++i) {
        var list = stars[i];
        for (var j = 0, m = list.length; j < m; j += 2) {
          var s = list[j];
          var t = list[j + 1];
          if (i < Math.min(s, t)) {
            result.push([i, s, t]);
          }
        }
      }
      return result;
    };
    function createTriangulation(numVerts, edges) {
      var stars = new Array(numVerts);
      for (var i = 0; i < numVerts; ++i) {
        stars[i] = [];
      }
      return new Triangulation(stars, edges);
    }
  }
});

// node_modules/robust-in-sphere/in-sphere.js
var require_in_sphere = __commonJS({
  "node_modules/robust-in-sphere/in-sphere.js"(exports, module) {
    "use strict";
    var twoProduct = require_two_product();
    var robustSum = require_robust_sum();
    var robustDiff = require_robust_diff();
    var robustScale = require_robust_scale();
    var NUM_EXPAND = 6;
    function orientation(n) {
      var fn = n === 3 ? inSphere3 : n === 4 ? inSphere4 : n === 5 ? inSphere5 : inSphere6;
      return fn(robustSum, robustDiff, twoProduct, robustScale);
    }
    function inSphere0() {
      return 0;
    }
    function inSphere1() {
      return 0;
    }
    function inSphere2() {
      return 0;
    }
    function inSphere3(sum, diff, prod, scale) {
      function exactInSphere3(m0, m1, m2) {
        var w0 = prod(m0[0], m0[0]);
        var w0m1 = scale(w0, m1[0]);
        var w0m2 = scale(w0, m2[0]);
        var w1 = prod(m1[0], m1[0]);
        var w1m0 = scale(w1, m0[0]);
        var w1m2 = scale(w1, m2[0]);
        var w2 = prod(m2[0], m2[0]);
        var w2m0 = scale(w2, m0[0]);
        var w2m1 = scale(w2, m1[0]);
        var p = sum(diff(w2m1, w1m2), diff(w1m0, w0m1));
        var n = diff(w2m0, w0m2);
        var d = diff(p, n);
        return d[d.length - 1];
      }
      return exactInSphere3;
    }
    function inSphere4(sum, diff, prod, scale) {
      function exactInSphere4(m0, m1, m2, m3) {
        var w0 = sum(prod(m0[0], m0[0]), prod(m0[1], m0[1]));
        var w0m1 = scale(w0, m1[0]);
        var w0m2 = scale(w0, m2[0]);
        var w0m3 = scale(w0, m3[0]);
        var w1 = sum(prod(m1[0], m1[0]), prod(m1[1], m1[1]));
        var w1m0 = scale(w1, m0[0]);
        var w1m2 = scale(w1, m2[0]);
        var w1m3 = scale(w1, m3[0]);
        var w2 = sum(prod(m2[0], m2[0]), prod(m2[1], m2[1]));
        var w2m0 = scale(w2, m0[0]);
        var w2m1 = scale(w2, m1[0]);
        var w2m3 = scale(w2, m3[0]);
        var w3 = sum(prod(m3[0], m3[0]), prod(m3[1], m3[1]));
        var w3m0 = scale(w3, m0[0]);
        var w3m1 = scale(w3, m1[0]);
        var w3m2 = scale(w3, m2[0]);
        var p = sum(sum(scale(diff(w3m2, w2m3), m1[1]), sum(scale(diff(w3m1, w1m3), -m2[1]), scale(diff(w2m1, w1m2), m3[1]))), sum(scale(diff(w3m1, w1m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m1[1]), scale(diff(w1m0, w0m1), m3[1]))));
        var n = sum(sum(scale(diff(w3m2, w2m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m2[1]), scale(diff(w2m0, w0m2), m3[1]))), sum(scale(diff(w2m1, w1m2), m0[1]), sum(scale(diff(w2m0, w0m2), -m1[1]), scale(diff(w1m0, w0m1), m2[1]))));
        var d = diff(p, n);
        return d[d.length - 1];
      }
      return exactInSphere4;
    }
    function inSphere5(sum, diff, prod, scale) {
      function exactInSphere5(m0, m1, m2, m3, m4) {
        var w0 = sum(prod(m0[0], m0[0]), sum(prod(m0[1], m0[1]), prod(m0[2], m0[2])));
        var w0m1 = scale(w0, m1[0]);
        var w0m2 = scale(w0, m2[0]);
        var w0m3 = scale(w0, m3[0]);
        var w0m4 = scale(w0, m4[0]);
        var w1 = sum(prod(m1[0], m1[0]), sum(prod(m1[1], m1[1]), prod(m1[2], m1[2])));
        var w1m0 = scale(w1, m0[0]);
        var w1m2 = scale(w1, m2[0]);
        var w1m3 = scale(w1, m3[0]);
        var w1m4 = scale(w1, m4[0]);
        var w2 = sum(prod(m2[0], m2[0]), sum(prod(m2[1], m2[1]), prod(m2[2], m2[2])));
        var w2m0 = scale(w2, m0[0]);
        var w2m1 = scale(w2, m1[0]);
        var w2m3 = scale(w2, m3[0]);
        var w2m4 = scale(w2, m4[0]);
        var w3 = sum(prod(m3[0], m3[0]), sum(prod(m3[1], m3[1]), prod(m3[2], m3[2])));
        var w3m0 = scale(w3, m0[0]);
        var w3m1 = scale(w3, m1[0]);
        var w3m2 = scale(w3, m2[0]);
        var w3m4 = scale(w3, m4[0]);
        var w4 = sum(prod(m4[0], m4[0]), sum(prod(m4[1], m4[1]), prod(m4[2], m4[2])));
        var w4m0 = scale(w4, m0[0]);
        var w4m1 = scale(w4, m1[0]);
        var w4m2 = scale(w4, m2[0]);
        var w4m3 = scale(w4, m3[0]);
        var p = sum(sum(sum(scale(sum(scale(diff(w4m3, w3m4), m2[1]), sum(scale(diff(w4m2, w2m4), -m3[1]), scale(diff(w3m2, w2m3), m4[1]))), m1[2]), sum(scale(sum(scale(diff(w4m3, w3m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m3[1]), scale(diff(w3m1, w1m3), m4[1]))), -m2[2]), scale(sum(scale(diff(w4m2, w2m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m2[1]), scale(diff(w2m1, w1m2), m4[1]))), m3[2]))), sum(scale(sum(scale(diff(w3m2, w2m3), m1[1]), sum(scale(diff(w3m1, w1m3), -m2[1]), scale(diff(w2m1, w1m2), m3[1]))), -m4[2]), sum(scale(sum(scale(diff(w4m3, w3m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m3[1]), scale(diff(w3m1, w1m3), m4[1]))), m0[2]), scale(sum(scale(diff(w4m3, w3m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m3[1]), scale(diff(w3m0, w0m3), m4[1]))), -m1[2])))), sum(sum(scale(sum(scale(diff(w4m1, w1m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m1[1]), scale(diff(w1m0, w0m1), m4[1]))), m3[2]), sum(scale(sum(scale(diff(w3m1, w1m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m1[1]), scale(diff(w1m0, w0m1), m3[1]))), -m4[2]), scale(sum(scale(diff(w3m2, w2m3), m1[1]), sum(scale(diff(w3m1, w1m3), -m2[1]), scale(diff(w2m1, w1m2), m3[1]))), m0[2]))), sum(scale(sum(scale(diff(w3m2, w2m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m2[1]), scale(diff(w2m0, w0m2), m3[1]))), -m1[2]), sum(scale(sum(scale(diff(w3m1, w1m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m1[1]), scale(diff(w1m0, w0m1), m3[1]))), m2[2]), scale(sum(scale(diff(w2m1, w1m2), m0[1]), sum(scale(diff(w2m0, w0m2), -m1[1]), scale(diff(w1m0, w0m1), m2[1]))), -m3[2])))));
        var n = sum(sum(sum(scale(sum(scale(diff(w4m3, w3m4), m2[1]), sum(scale(diff(w4m2, w2m4), -m3[1]), scale(diff(w3m2, w2m3), m4[1]))), m0[2]), scale(sum(scale(diff(w4m3, w3m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m3[1]), scale(diff(w3m0, w0m3), m4[1]))), -m2[2])), sum(scale(sum(scale(diff(w4m2, w2m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m2[1]), scale(diff(w2m0, w0m2), m4[1]))), m3[2]), scale(sum(scale(diff(w3m2, w2m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m2[1]), scale(diff(w2m0, w0m2), m3[1]))), -m4[2]))), sum(sum(scale(sum(scale(diff(w4m2, w2m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m2[1]), scale(diff(w2m1, w1m2), m4[1]))), m0[2]), scale(sum(scale(diff(w4m2, w2m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m2[1]), scale(diff(w2m0, w0m2), m4[1]))), -m1[2])), sum(scale(sum(scale(diff(w4m1, w1m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m1[1]), scale(diff(w1m0, w0m1), m4[1]))), m2[2]), scale(sum(scale(diff(w2m1, w1m2), m0[1]), sum(scale(diff(w2m0, w0m2), -m1[1]), scale(diff(w1m0, w0m1), m2[1]))), -m4[2]))));
        var d = diff(p, n);
        return d[d.length - 1];
      }
      return exactInSphere5;
    }
    function inSphere6(sum, diff, prod, scale) {
      function exactInSphere6(m0, m1, m2, m3, m4, m5) {
        var w0 = sum(sum(prod(m0[0], m0[0]), prod(m0[1], m0[1])), sum(prod(m0[2], m0[2]), prod(m0[3], m0[3])));
        var w0m1 = scale(w0, m1[0]);
        var w0m2 = scale(w0, m2[0]);
        var w0m3 = scale(w0, m3[0]);
        var w0m4 = scale(w0, m4[0]);
        var w0m5 = scale(w0, m5[0]);
        var w1 = sum(sum(prod(m1[0], m1[0]), prod(m1[1], m1[1])), sum(prod(m1[2], m1[2]), prod(m1[3], m1[3])));
        var w1m0 = scale(w1, m0[0]);
        var w1m2 = scale(w1, m2[0]);
        var w1m3 = scale(w1, m3[0]);
        var w1m4 = scale(w1, m4[0]);
        var w1m5 = scale(w1, m5[0]);
        var w2 = sum(sum(prod(m2[0], m2[0]), prod(m2[1], m2[1])), sum(prod(m2[2], m2[2]), prod(m2[3], m2[3])));
        var w2m0 = scale(w2, m0[0]);
        var w2m1 = scale(w2, m1[0]);
        var w2m3 = scale(w2, m3[0]);
        var w2m4 = scale(w2, m4[0]);
        var w2m5 = scale(w2, m5[0]);
        var w3 = sum(sum(prod(m3[0], m3[0]), prod(m3[1], m3[1])), sum(prod(m3[2], m3[2]), prod(m3[3], m3[3])));
        var w3m0 = scale(w3, m0[0]);
        var w3m1 = scale(w3, m1[0]);
        var w3m2 = scale(w3, m2[0]);
        var w3m4 = scale(w3, m4[0]);
        var w3m5 = scale(w3, m5[0]);
        var w4 = sum(sum(prod(m4[0], m4[0]), prod(m4[1], m4[1])), sum(prod(m4[2], m4[2]), prod(m4[3], m4[3])));
        var w4m0 = scale(w4, m0[0]);
        var w4m1 = scale(w4, m1[0]);
        var w4m2 = scale(w4, m2[0]);
        var w4m3 = scale(w4, m3[0]);
        var w4m5 = scale(w4, m5[0]);
        var w5 = sum(sum(prod(m5[0], m5[0]), prod(m5[1], m5[1])), sum(prod(m5[2], m5[2]), prod(m5[3], m5[3])));
        var w5m0 = scale(w5, m0[0]);
        var w5m1 = scale(w5, m1[0]);
        var w5m2 = scale(w5, m2[0]);
        var w5m3 = scale(w5, m3[0]);
        var w5m4 = scale(w5, m4[0]);
        var p = sum(sum(sum(scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m3[1]), sum(scale(diff(w5m3, w3m5), -m4[1]), scale(diff(w4m3, w3m4), m5[1]))), m2[2]), scale(sum(scale(diff(w5m4, w4m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m4[1]), scale(diff(w4m2, w2m4), m5[1]))), -m3[2])), sum(scale(sum(scale(diff(w5m3, w3m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m3[1]), scale(diff(w3m2, w2m3), m5[1]))), m4[2]), scale(sum(scale(diff(w4m3, w3m4), m2[1]), sum(scale(diff(w4m2, w2m4), -m3[1]), scale(diff(w3m2, w2m3), m4[1]))), -m5[2]))), m1[3]), sum(scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m3[1]), sum(scale(diff(w5m3, w3m5), -m4[1]), scale(diff(w4m3, w3m4), m5[1]))), m1[2]), scale(sum(scale(diff(w5m4, w4m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m4[1]), scale(diff(w4m1, w1m4), m5[1]))), -m3[2])), sum(scale(sum(scale(diff(w5m3, w3m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m3[1]), scale(diff(w3m1, w1m3), m5[1]))), m4[2]), scale(sum(scale(diff(w4m3, w3m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m3[1]), scale(diff(w3m1, w1m3), m4[1]))), -m5[2]))), -m2[3]), scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m4[1]), scale(diff(w4m2, w2m4), m5[1]))), m1[2]), scale(sum(scale(diff(w5m4, w4m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m4[1]), scale(diff(w4m1, w1m4), m5[1]))), -m2[2])), sum(scale(sum(scale(diff(w5m2, w2m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m2[1]), scale(diff(w2m1, w1m2), m5[1]))), m4[2]), scale(sum(scale(diff(w4m2, w2m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m2[1]), scale(diff(w2m1, w1m2), m4[1]))), -m5[2]))), m3[3]))), sum(sum(scale(sum(sum(scale(sum(scale(diff(w5m3, w3m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m3[1]), scale(diff(w3m2, w2m3), m5[1]))), m1[2]), scale(sum(scale(diff(w5m3, w3m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m3[1]), scale(diff(w3m1, w1m3), m5[1]))), -m2[2])), sum(scale(sum(scale(diff(w5m2, w2m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m2[1]), scale(diff(w2m1, w1m2), m5[1]))), m3[2]), scale(sum(scale(diff(w3m2, w2m3), m1[1]), sum(scale(diff(w3m1, w1m3), -m2[1]), scale(diff(w2m1, w1m2), m3[1]))), -m5[2]))), -m4[3]), scale(sum(sum(scale(sum(scale(diff(w4m3, w3m4), m2[1]), sum(scale(diff(w4m2, w2m4), -m3[1]), scale(diff(w3m2, w2m3), m4[1]))), m1[2]), scale(sum(scale(diff(w4m3, w3m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m3[1]), scale(diff(w3m1, w1m3), m4[1]))), -m2[2])), sum(scale(sum(scale(diff(w4m2, w2m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m2[1]), scale(diff(w2m1, w1m2), m4[1]))), m3[2]), scale(sum(scale(diff(w3m2, w2m3), m1[1]), sum(scale(diff(w3m1, w1m3), -m2[1]), scale(diff(w2m1, w1m2), m3[1]))), -m4[2]))), m5[3])), sum(scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m3[1]), sum(scale(diff(w5m3, w3m5), -m4[1]), scale(diff(w4m3, w3m4), m5[1]))), m1[2]), scale(sum(scale(diff(w5m4, w4m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m4[1]), scale(diff(w4m1, w1m4), m5[1]))), -m3[2])), sum(scale(sum(scale(diff(w5m3, w3m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m3[1]), scale(diff(w3m1, w1m3), m5[1]))), m4[2]), scale(sum(scale(diff(w4m3, w3m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m3[1]), scale(diff(w3m1, w1m3), m4[1]))), -m5[2]))), m0[3]), scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m3[1]), sum(scale(diff(w5m3, w3m5), -m4[1]), scale(diff(w4m3, w3m4), m5[1]))), m0[2]), scale(sum(scale(diff(w5m4, w4m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m4[1]), scale(diff(w4m0, w0m4), m5[1]))), -m3[2])), sum(scale(sum(scale(diff(w5m3, w3m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m3[1]), scale(diff(w3m0, w0m3), m5[1]))), m4[2]), scale(sum(scale(diff(w4m3, w3m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m3[1]), scale(diff(w3m0, w0m3), m4[1]))), -m5[2]))), -m1[3])))), sum(sum(sum(scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m4[1]), scale(diff(w4m1, w1m4), m5[1]))), m0[2]), scale(sum(scale(diff(w5m4, w4m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m4[1]), scale(diff(w4m0, w0m4), m5[1]))), -m1[2])), sum(scale(sum(scale(diff(w5m1, w1m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m1[1]), scale(diff(w1m0, w0m1), m5[1]))), m4[2]), scale(sum(scale(diff(w4m1, w1m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m1[1]), scale(diff(w1m0, w0m1), m4[1]))), -m5[2]))), m3[3]), scale(sum(sum(scale(sum(scale(diff(w5m3, w3m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m3[1]), scale(diff(w3m1, w1m3), m5[1]))), m0[2]), scale(sum(scale(diff(w5m3, w3m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m3[1]), scale(diff(w3m0, w0m3), m5[1]))), -m1[2])), sum(scale(sum(scale(diff(w5m1, w1m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m1[1]), scale(diff(w1m0, w0m1), m5[1]))), m3[2]), scale(sum(scale(diff(w3m1, w1m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m1[1]), scale(diff(w1m0, w0m1), m3[1]))), -m5[2]))), -m4[3])), sum(scale(sum(sum(scale(sum(scale(diff(w4m3, w3m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m3[1]), scale(diff(w3m1, w1m3), m4[1]))), m0[2]), scale(sum(scale(diff(w4m3, w3m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m3[1]), scale(diff(w3m0, w0m3), m4[1]))), -m1[2])), sum(scale(sum(scale(diff(w4m1, w1m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m1[1]), scale(diff(w1m0, w0m1), m4[1]))), m3[2]), scale(sum(scale(diff(w3m1, w1m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m1[1]), scale(diff(w1m0, w0m1), m3[1]))), -m4[2]))), m5[3]), scale(sum(sum(scale(sum(scale(diff(w5m3, w3m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m3[1]), scale(diff(w3m2, w2m3), m5[1]))), m1[2]), scale(sum(scale(diff(w5m3, w3m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m3[1]), scale(diff(w3m1, w1m3), m5[1]))), -m2[2])), sum(scale(sum(scale(diff(w5m2, w2m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m2[1]), scale(diff(w2m1, w1m2), m5[1]))), m3[2]), scale(sum(scale(diff(w3m2, w2m3), m1[1]), sum(scale(diff(w3m1, w1m3), -m2[1]), scale(diff(w2m1, w1m2), m3[1]))), -m5[2]))), m0[3]))), sum(sum(scale(sum(sum(scale(sum(scale(diff(w5m3, w3m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m3[1]), scale(diff(w3m2, w2m3), m5[1]))), m0[2]), scale(sum(scale(diff(w5m3, w3m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m3[1]), scale(diff(w3m0, w0m3), m5[1]))), -m2[2])), sum(scale(sum(scale(diff(w5m2, w2m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m2[1]), scale(diff(w2m0, w0m2), m5[1]))), m3[2]), scale(sum(scale(diff(w3m2, w2m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m2[1]), scale(diff(w2m0, w0m2), m3[1]))), -m5[2]))), -m1[3]), scale(sum(sum(scale(sum(scale(diff(w5m3, w3m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m3[1]), scale(diff(w3m1, w1m3), m5[1]))), m0[2]), scale(sum(scale(diff(w5m3, w3m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m3[1]), scale(diff(w3m0, w0m3), m5[1]))), -m1[2])), sum(scale(sum(scale(diff(w5m1, w1m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m1[1]), scale(diff(w1m0, w0m1), m5[1]))), m3[2]), scale(sum(scale(diff(w3m1, w1m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m1[1]), scale(diff(w1m0, w0m1), m3[1]))), -m5[2]))), m2[3])), sum(scale(sum(sum(scale(sum(scale(diff(w5m2, w2m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m2[1]), scale(diff(w2m1, w1m2), m5[1]))), m0[2]), scale(sum(scale(diff(w5m2, w2m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m2[1]), scale(diff(w2m0, w0m2), m5[1]))), -m1[2])), sum(scale(sum(scale(diff(w5m1, w1m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m1[1]), scale(diff(w1m0, w0m1), m5[1]))), m2[2]), scale(sum(scale(diff(w2m1, w1m2), m0[1]), sum(scale(diff(w2m0, w0m2), -m1[1]), scale(diff(w1m0, w0m1), m2[1]))), -m5[2]))), -m3[3]), scale(sum(sum(scale(sum(scale(diff(w3m2, w2m3), m1[1]), sum(scale(diff(w3m1, w1m3), -m2[1]), scale(diff(w2m1, w1m2), m3[1]))), m0[2]), scale(sum(scale(diff(w3m2, w2m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m2[1]), scale(diff(w2m0, w0m2), m3[1]))), -m1[2])), sum(scale(sum(scale(diff(w3m1, w1m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m1[1]), scale(diff(w1m0, w0m1), m3[1]))), m2[2]), scale(sum(scale(diff(w2m1, w1m2), m0[1]), sum(scale(diff(w2m0, w0m2), -m1[1]), scale(diff(w1m0, w0m1), m2[1]))), -m3[2]))), m5[3])))));
        var n = sum(sum(sum(scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m3[1]), sum(scale(diff(w5m3, w3m5), -m4[1]), scale(diff(w4m3, w3m4), m5[1]))), m2[2]), scale(sum(scale(diff(w5m4, w4m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m4[1]), scale(diff(w4m2, w2m4), m5[1]))), -m3[2])), sum(scale(sum(scale(diff(w5m3, w3m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m3[1]), scale(diff(w3m2, w2m3), m5[1]))), m4[2]), scale(sum(scale(diff(w4m3, w3m4), m2[1]), sum(scale(diff(w4m2, w2m4), -m3[1]), scale(diff(w3m2, w2m3), m4[1]))), -m5[2]))), m0[3]), sum(scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m3[1]), sum(scale(diff(w5m3, w3m5), -m4[1]), scale(diff(w4m3, w3m4), m5[1]))), m0[2]), scale(sum(scale(diff(w5m4, w4m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m4[1]), scale(diff(w4m0, w0m4), m5[1]))), -m3[2])), sum(scale(sum(scale(diff(w5m3, w3m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m3[1]), scale(diff(w3m0, w0m3), m5[1]))), m4[2]), scale(sum(scale(diff(w4m3, w3m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m3[1]), scale(diff(w3m0, w0m3), m4[1]))), -m5[2]))), -m2[3]), scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m4[1]), scale(diff(w4m2, w2m4), m5[1]))), m0[2]), scale(sum(scale(diff(w5m4, w4m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m4[1]), scale(diff(w4m0, w0m4), m5[1]))), -m2[2])), sum(scale(sum(scale(diff(w5m2, w2m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m2[1]), scale(diff(w2m0, w0m2), m5[1]))), m4[2]), scale(sum(scale(diff(w4m2, w2m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m2[1]), scale(diff(w2m0, w0m2), m4[1]))), -m5[2]))), m3[3]))), sum(sum(scale(sum(sum(scale(sum(scale(diff(w5m3, w3m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m3[1]), scale(diff(w3m2, w2m3), m5[1]))), m0[2]), scale(sum(scale(diff(w5m3, w3m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m3[1]), scale(diff(w3m0, w0m3), m5[1]))), -m2[2])), sum(scale(sum(scale(diff(w5m2, w2m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m2[1]), scale(diff(w2m0, w0m2), m5[1]))), m3[2]), scale(sum(scale(diff(w3m2, w2m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m2[1]), scale(diff(w2m0, w0m2), m3[1]))), -m5[2]))), -m4[3]), scale(sum(sum(scale(sum(scale(diff(w4m3, w3m4), m2[1]), sum(scale(diff(w4m2, w2m4), -m3[1]), scale(diff(w3m2, w2m3), m4[1]))), m0[2]), scale(sum(scale(diff(w4m3, w3m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m3[1]), scale(diff(w3m0, w0m3), m4[1]))), -m2[2])), sum(scale(sum(scale(diff(w4m2, w2m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m2[1]), scale(diff(w2m0, w0m2), m4[1]))), m3[2]), scale(sum(scale(diff(w3m2, w2m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m2[1]), scale(diff(w2m0, w0m2), m3[1]))), -m4[2]))), m5[3])), sum(scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m4[1]), scale(diff(w4m2, w2m4), m5[1]))), m1[2]), scale(sum(scale(diff(w5m4, w4m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m4[1]), scale(diff(w4m1, w1m4), m5[1]))), -m2[2])), sum(scale(sum(scale(diff(w5m2, w2m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m2[1]), scale(diff(w2m1, w1m2), m5[1]))), m4[2]), scale(sum(scale(diff(w4m2, w2m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m2[1]), scale(diff(w2m1, w1m2), m4[1]))), -m5[2]))), m0[3]), scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m4[1]), scale(diff(w4m2, w2m4), m5[1]))), m0[2]), scale(sum(scale(diff(w5m4, w4m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m4[1]), scale(diff(w4m0, w0m4), m5[1]))), -m2[2])), sum(scale(sum(scale(diff(w5m2, w2m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m2[1]), scale(diff(w2m0, w0m2), m5[1]))), m4[2]), scale(sum(scale(diff(w4m2, w2m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m2[1]), scale(diff(w2m0, w0m2), m4[1]))), -m5[2]))), -m1[3])))), sum(sum(sum(scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m4[1]), scale(diff(w4m1, w1m4), m5[1]))), m0[2]), scale(sum(scale(diff(w5m4, w4m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m4[1]), scale(diff(w4m0, w0m4), m5[1]))), -m1[2])), sum(scale(sum(scale(diff(w5m1, w1m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m1[1]), scale(diff(w1m0, w0m1), m5[1]))), m4[2]), scale(sum(scale(diff(w4m1, w1m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m1[1]), scale(diff(w1m0, w0m1), m4[1]))), -m5[2]))), m2[3]), scale(sum(sum(scale(sum(scale(diff(w5m2, w2m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m2[1]), scale(diff(w2m1, w1m2), m5[1]))), m0[2]), scale(sum(scale(diff(w5m2, w2m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m2[1]), scale(diff(w2m0, w0m2), m5[1]))), -m1[2])), sum(scale(sum(scale(diff(w5m1, w1m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m1[1]), scale(diff(w1m0, w0m1), m5[1]))), m2[2]), scale(sum(scale(diff(w2m1, w1m2), m0[1]), sum(scale(diff(w2m0, w0m2), -m1[1]), scale(diff(w1m0, w0m1), m2[1]))), -m5[2]))), -m4[3])), sum(scale(sum(sum(scale(sum(scale(diff(w4m2, w2m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m2[1]), scale(diff(w2m1, w1m2), m4[1]))), m0[2]), scale(sum(scale(diff(w4m2, w2m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m2[1]), scale(diff(w2m0, w0m2), m4[1]))), -m1[2])), sum(scale(sum(scale(diff(w4m1, w1m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m1[1]), scale(diff(w1m0, w0m1), m4[1]))), m2[2]), scale(sum(scale(diff(w2m1, w1m2), m0[1]), sum(scale(diff(w2m0, w0m2), -m1[1]), scale(diff(w1m0, w0m1), m2[1]))), -m4[2]))), m5[3]), scale(sum(sum(scale(sum(scale(diff(w4m3, w3m4), m2[1]), sum(scale(diff(w4m2, w2m4), -m3[1]), scale(diff(w3m2, w2m3), m4[1]))), m1[2]), scale(sum(scale(diff(w4m3, w3m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m3[1]), scale(diff(w3m1, w1m3), m4[1]))), -m2[2])), sum(scale(sum(scale(diff(w4m2, w2m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m2[1]), scale(diff(w2m1, w1m2), m4[1]))), m3[2]), scale(sum(scale(diff(w3m2, w2m3), m1[1]), sum(scale(diff(w3m1, w1m3), -m2[1]), scale(diff(w2m1, w1m2), m3[1]))), -m4[2]))), m0[3]))), sum(sum(scale(sum(sum(scale(sum(scale(diff(w4m3, w3m4), m2[1]), sum(scale(diff(w4m2, w2m4), -m3[1]), scale(diff(w3m2, w2m3), m4[1]))), m0[2]), scale(sum(scale(diff(w4m3, w3m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m3[1]), scale(diff(w3m0, w0m3), m4[1]))), -m2[2])), sum(scale(sum(scale(diff(w4m2, w2m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m2[1]), scale(diff(w2m0, w0m2), m4[1]))), m3[2]), scale(sum(scale(diff(w3m2, w2m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m2[1]), scale(diff(w2m0, w0m2), m3[1]))), -m4[2]))), -m1[3]), scale(sum(sum(scale(sum(scale(diff(w4m3, w3m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m3[1]), scale(diff(w3m1, w1m3), m4[1]))), m0[2]), scale(sum(scale(diff(w4m3, w3m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m3[1]), scale(diff(w3m0, w0m3), m4[1]))), -m1[2])), sum(scale(sum(scale(diff(w4m1, w1m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m1[1]), scale(diff(w1m0, w0m1), m4[1]))), m3[2]), scale(sum(scale(diff(w3m1, w1m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m1[1]), scale(diff(w1m0, w0m1), m3[1]))), -m4[2]))), m2[3])), sum(scale(sum(sum(scale(sum(scale(diff(w4m2, w2m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m2[1]), scale(diff(w2m1, w1m2), m4[1]))), m0[2]), scale(sum(scale(diff(w4m2, w2m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m2[1]), scale(diff(w2m0, w0m2), m4[1]))), -m1[2])), sum(scale(sum(scale(diff(w4m1, w1m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m1[1]), scale(diff(w1m0, w0m1), m4[1]))), m2[2]), scale(sum(scale(diff(w2m1, w1m2), m0[1]), sum(scale(diff(w2m0, w0m2), -m1[1]), scale(diff(w1m0, w0m1), m2[1]))), -m4[2]))), -m3[3]), scale(sum(sum(scale(sum(scale(diff(w3m2, w2m3), m1[1]), sum(scale(diff(w3m1, w1m3), -m2[1]), scale(diff(w2m1, w1m2), m3[1]))), m0[2]), scale(sum(scale(diff(w3m2, w2m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m2[1]), scale(diff(w2m0, w0m2), m3[1]))), -m1[2])), sum(scale(sum(scale(diff(w3m1, w1m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m1[1]), scale(diff(w1m0, w0m1), m3[1]))), m2[2]), scale(sum(scale(diff(w2m1, w1m2), m0[1]), sum(scale(diff(w2m0, w0m2), -m1[1]), scale(diff(w1m0, w0m1), m2[1]))), -m3[2]))), m4[3])))));
        var d = diff(p, n);
        return d[d.length - 1];
      }
      return exactInSphere6;
    }
    var CACHED = [
      inSphere0,
      inSphere1,
      inSphere2
    ];
    function slowInSphere(args) {
      var proc2 = CACHED[args.length];
      if (!proc2) {
        proc2 = CACHED[args.length] = orientation(args.length);
      }
      return proc2.apply(void 0, args);
    }
    function proc(slow, o0, o1, o2, o3, o4, o5, o6) {
      function testInSphere(a0, a1, a2, a3, a4, a5) {
        switch (arguments.length) {
          case 0:
          case 1:
            return 0;
          case 2:
            return o2(a0, a1);
          case 3:
            return o3(a0, a1, a2);
          case 4:
            return o4(a0, a1, a2, a3);
          case 5:
            return o5(a0, a1, a2, a3, a4);
          case 6:
            return o6(a0, a1, a2, a3, a4, a5);
        }
        var s = new Array(arguments.length);
        for (var i = 0; i < arguments.length; ++i) {
          s[i] = arguments[i];
        }
        return slow(s);
      }
      return testInSphere;
    }
    function generateInSphereTest() {
      while (CACHED.length <= NUM_EXPAND) {
        CACHED.push(orientation(CACHED.length));
      }
      module.exports = proc.apply(void 0, [slowInSphere].concat(CACHED));
      for (var i = 0; i <= NUM_EXPAND; ++i) {
        module.exports[i] = CACHED[i];
      }
    }
    generateInSphereTest();
  }
});

// node_modules/cdt2d/lib/delaunay.js
var require_delaunay = __commonJS({
  "node_modules/cdt2d/lib/delaunay.js"(exports, module) {
    "use strict";
    var inCircle = require_in_sphere()[4];
    var bsearch = require_search_bounds();
    module.exports = delaunayRefine;
    function testFlip(points, triangulation, stack, a, b, x) {
      var y = triangulation.opposite(a, b);
      if (y < 0) {
        return;
      }
      if (b < a) {
        var tmp = a;
        a = b;
        b = tmp;
        tmp = x;
        x = y;
        y = tmp;
      }
      if (triangulation.isConstraint(a, b)) {
        return;
      }
      if (inCircle(points[a], points[b], points[x], points[y]) < 0) {
        stack.push(a, b);
      }
    }
    function delaunayRefine(points, triangulation) {
      var stack = [];
      var numPoints = points.length;
      var stars = triangulation.stars;
      for (var a = 0; a < numPoints; ++a) {
        var star = stars[a];
        for (var j = 1; j < star.length; j += 2) {
          var b = star[j];
          if (b < a) {
            continue;
          }
          if (triangulation.isConstraint(a, b)) {
            continue;
          }
          var x = star[j - 1], y = -1;
          for (var k = 1; k < star.length; k += 2) {
            if (star[k - 1] === b) {
              y = star[k];
              break;
            }
          }
          if (y < 0) {
            continue;
          }
          if (inCircle(points[a], points[b], points[x], points[y]) < 0) {
            stack.push(a, b);
          }
        }
      }
      while (stack.length > 0) {
        var b = stack.pop();
        var a = stack.pop();
        var x = -1, y = -1;
        var star = stars[a];
        for (var i = 1; i < star.length; i += 2) {
          var s = star[i - 1];
          var t = star[i];
          if (s === b) {
            y = t;
          } else if (t === b) {
            x = s;
          }
        }
        if (x < 0 || y < 0) {
          continue;
        }
        if (inCircle(points[a], points[b], points[x], points[y]) >= 0) {
          continue;
        }
        triangulation.flip(a, b);
        testFlip(points, triangulation, stack, x, a, y);
        testFlip(points, triangulation, stack, a, y, x);
        testFlip(points, triangulation, stack, y, b, x);
        testFlip(points, triangulation, stack, b, x, y);
      }
    }
  }
});

// node_modules/cdt2d/lib/filter.js
var require_filter = __commonJS({
  "node_modules/cdt2d/lib/filter.js"(exports, module) {
    "use strict";
    var bsearch = require_search_bounds();
    module.exports = classifyFaces;
    function FaceIndex(cells, neighbor, constraint, flags, active, next, boundary) {
      this.cells = cells;
      this.neighbor = neighbor;
      this.flags = flags;
      this.constraint = constraint;
      this.active = active;
      this.next = next;
      this.boundary = boundary;
    }
    var proto = FaceIndex.prototype;
    function compareCell(a, b) {
      return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
    }
    proto.locate = /* @__PURE__ */ (function() {
      var key = [0, 0, 0];
      return function(a, b, c) {
        var x = a, y = b, z = c;
        if (b < c) {
          if (b < a) {
            x = b;
            y = c;
            z = a;
          }
        } else if (c < a) {
          x = c;
          y = a;
          z = b;
        }
        if (x < 0) {
          return -1;
        }
        key[0] = x;
        key[1] = y;
        key[2] = z;
        return bsearch.eq(this.cells, key, compareCell);
      };
    })();
    function indexCells(triangulation, infinity) {
      var cells = triangulation.cells();
      var nc = cells.length;
      for (var i = 0; i < nc; ++i) {
        var c = cells[i];
        var x = c[0], y = c[1], z = c[2];
        if (y < z) {
          if (y < x) {
            c[0] = y;
            c[1] = z;
            c[2] = x;
          }
        } else if (z < x) {
          c[0] = z;
          c[1] = x;
          c[2] = y;
        }
      }
      cells.sort(compareCell);
      var flags = new Array(nc);
      for (var i = 0; i < flags.length; ++i) {
        flags[i] = 0;
      }
      var active = [];
      var next = [];
      var neighbor = new Array(3 * nc);
      var constraint = new Array(3 * nc);
      var boundary = null;
      if (infinity) {
        boundary = [];
      }
      var index = new FaceIndex(
        cells,
        neighbor,
        constraint,
        flags,
        active,
        next,
        boundary
      );
      for (var i = 0; i < nc; ++i) {
        var c = cells[i];
        for (var j = 0; j < 3; ++j) {
          var x = c[j], y = c[(j + 1) % 3];
          var a = neighbor[3 * i + j] = index.locate(y, x, triangulation.opposite(y, x));
          var b = constraint[3 * i + j] = triangulation.isConstraint(x, y);
          if (a < 0) {
            if (b) {
              next.push(i);
            } else {
              active.push(i);
              flags[i] = 1;
            }
            if (infinity) {
              boundary.push([y, x, -1]);
            }
          }
        }
      }
      return index;
    }
    function filterCells(cells, flags, target) {
      var ptr = 0;
      for (var i = 0; i < cells.length; ++i) {
        if (flags[i] === target) {
          cells[ptr++] = cells[i];
        }
      }
      cells.length = ptr;
      return cells;
    }
    function classifyFaces(triangulation, target, infinity) {
      var index = indexCells(triangulation, infinity);
      if (target === 0) {
        if (infinity) {
          return index.cells.concat(index.boundary);
        } else {
          return index.cells;
        }
      }
      var side = 1;
      var active = index.active;
      var next = index.next;
      var flags = index.flags;
      var cells = index.cells;
      var constraint = index.constraint;
      var neighbor = index.neighbor;
      while (active.length > 0 || next.length > 0) {
        while (active.length > 0) {
          var t = active.pop();
          if (flags[t] === -side) {
            continue;
          }
          flags[t] = side;
          var c = cells[t];
          for (var j = 0; j < 3; ++j) {
            var f = neighbor[3 * t + j];
            if (f >= 0 && flags[f] === 0) {
              if (constraint[3 * t + j]) {
                next.push(f);
              } else {
                active.push(f);
                flags[f] = side;
              }
            }
          }
        }
        var tmp = next;
        next = active;
        active = tmp;
        next.length = 0;
        side = -side;
      }
      var result = filterCells(cells, flags, target);
      if (infinity) {
        return result.concat(index.boundary);
      }
      return result;
    }
  }
});

// node_modules/cdt2d/cdt2d.js
var require_cdt2d = __commonJS({
  "node_modules/cdt2d/cdt2d.js"(exports, module) {
    "use strict";
    var monotoneTriangulate = require_monotone();
    var makeIndex = require_triangulation();
    var delaunayFlip = require_delaunay();
    var filterTriangulation = require_filter();
    module.exports = cdt2d2;
    function canonicalizeEdge(e) {
      return [Math.min(e[0], e[1]), Math.max(e[0], e[1])];
    }
    function compareEdge(a, b) {
      return a[0] - b[0] || a[1] - b[1];
    }
    function canonicalizeEdges(edges) {
      return edges.map(canonicalizeEdge).sort(compareEdge);
    }
    function getDefault(options, property, dflt) {
      if (property in options) {
        return options[property];
      }
      return dflt;
    }
    function cdt2d2(points, edges, options) {
      if (!Array.isArray(edges)) {
        options = edges || {};
        edges = [];
      } else {
        options = options || {};
        edges = edges || [];
      }
      var delaunay = !!getDefault(options, "delaunay", true);
      var interior = !!getDefault(options, "interior", true);
      var exterior = !!getDefault(options, "exterior", true);
      var infinity = !!getDefault(options, "infinity", false);
      if (!interior && !exterior || points.length === 0) {
        return [];
      }
      var cells = monotoneTriangulate(points, edges);
      if (delaunay || interior !== exterior || infinity) {
        var triangulation = makeIndex(points.length, canonicalizeEdges(edges));
        for (var i = 0; i < cells.length; ++i) {
          var f = cells[i];
          triangulation.addTriangle(f[0], f[1], f[2]);
        }
        if (delaunay) {
          delaunayFlip(points, triangulation);
        }
        if (!exterior) {
          return filterTriangulation(triangulation, -1);
        } else if (!interior) {
          return filterTriangulation(triangulation, 1, infinity);
        } else if (infinity) {
          return filterTriangulation(triangulation, 0, infinity);
        } else {
          return triangulation.cells();
        }
      } else {
        return cells;
      }
    }
  }
});

// node_modules/union-find/index.js
var require_union_find = __commonJS({
  "node_modules/union-find/index.js"(exports, module) {
    "use strict";
    "use restrict";
    module.exports = UnionFind;
    function UnionFind(count) {
      this.roots = new Array(count);
      this.ranks = new Array(count);
      for (var i = 0; i < count; ++i) {
        this.roots[i] = i;
        this.ranks[i] = 0;
      }
    }
    var proto = UnionFind.prototype;
    Object.defineProperty(proto, "length", {
      "get": function() {
        return this.roots.length;
      }
    });
    proto.makeSet = function() {
      var n = this.roots.length;
      this.roots.push(n);
      this.ranks.push(0);
      return n;
    };
    proto.find = function(x) {
      var x0 = x;
      var roots = this.roots;
      while (roots[x] !== x) {
        x = roots[x];
      }
      while (roots[x0] !== x) {
        var y = roots[x0];
        roots[x0] = x;
        x0 = y;
      }
      return x;
    };
    proto.link = function(x, y) {
      var xr = this.find(x), yr = this.find(y);
      if (xr === yr) {
        return;
      }
      var ranks = this.ranks, roots = this.roots, xd = ranks[xr], yd = ranks[yr];
      if (xd < yd) {
        roots[xr] = yr;
      } else if (yd < xd) {
        roots[yr] = xr;
      } else {
        roots[yr] = xr;
        ++ranks[xr];
      }
    };
  }
});

// node_modules/bit-twiddle/twiddle.js
var require_twiddle = __commonJS({
  "node_modules/bit-twiddle/twiddle.js"(exports) {
    "use strict";
    "use restrict";
    var INT_BITS = 32;
    exports.INT_BITS = INT_BITS;
    exports.INT_MAX = 2147483647;
    exports.INT_MIN = -1 << INT_BITS - 1;
    exports.sign = function(v) {
      return (v > 0) - (v < 0);
    };
    exports.abs = function(v) {
      var mask = v >> INT_BITS - 1;
      return (v ^ mask) - mask;
    };
    exports.min = function(x, y) {
      return y ^ (x ^ y) & -(x < y);
    };
    exports.max = function(x, y) {
      return x ^ (x ^ y) & -(x < y);
    };
    exports.isPow2 = function(v) {
      return !(v & v - 1) && !!v;
    };
    exports.log2 = function(v) {
      var r, shift;
      r = (v > 65535) << 4;
      v >>>= r;
      shift = (v > 255) << 3;
      v >>>= shift;
      r |= shift;
      shift = (v > 15) << 2;
      v >>>= shift;
      r |= shift;
      shift = (v > 3) << 1;
      v >>>= shift;
      r |= shift;
      return r | v >> 1;
    };
    exports.log10 = function(v) {
      return v >= 1e9 ? 9 : v >= 1e8 ? 8 : v >= 1e7 ? 7 : v >= 1e6 ? 6 : v >= 1e5 ? 5 : v >= 1e4 ? 4 : v >= 1e3 ? 3 : v >= 100 ? 2 : v >= 10 ? 1 : 0;
    };
    exports.popCount = function(v) {
      v = v - (v >>> 1 & 1431655765);
      v = (v & 858993459) + (v >>> 2 & 858993459);
      return (v + (v >>> 4) & 252645135) * 16843009 >>> 24;
    };
    function countTrailingZeros(v) {
      var c = 32;
      v &= -v;
      if (v) c--;
      if (v & 65535) c -= 16;
      if (v & 16711935) c -= 8;
      if (v & 252645135) c -= 4;
      if (v & 858993459) c -= 2;
      if (v & 1431655765) c -= 1;
      return c;
    }
    exports.countTrailingZeros = countTrailingZeros;
    exports.nextPow2 = function(v) {
      v += v === 0;
      --v;
      v |= v >>> 1;
      v |= v >>> 2;
      v |= v >>> 4;
      v |= v >>> 8;
      v |= v >>> 16;
      return v + 1;
    };
    exports.prevPow2 = function(v) {
      v |= v >>> 1;
      v |= v >>> 2;
      v |= v >>> 4;
      v |= v >>> 8;
      v |= v >>> 16;
      return v - (v >>> 1);
    };
    exports.parity = function(v) {
      v ^= v >>> 16;
      v ^= v >>> 8;
      v ^= v >>> 4;
      v &= 15;
      return 27030 >>> v & 1;
    };
    var REVERSE_TABLE = new Array(256);
    (function(tab) {
      for (var i = 0; i < 256; ++i) {
        var v = i, r = i, s = 7;
        for (v >>>= 1; v; v >>>= 1) {
          r <<= 1;
          r |= v & 1;
          --s;
        }
        tab[i] = r << s & 255;
      }
    })(REVERSE_TABLE);
    exports.reverse = function(v) {
      return REVERSE_TABLE[v & 255] << 24 | REVERSE_TABLE[v >>> 8 & 255] << 16 | REVERSE_TABLE[v >>> 16 & 255] << 8 | REVERSE_TABLE[v >>> 24 & 255];
    };
    exports.interleave2 = function(x, y) {
      x &= 65535;
      x = (x | x << 8) & 16711935;
      x = (x | x << 4) & 252645135;
      x = (x | x << 2) & 858993459;
      x = (x | x << 1) & 1431655765;
      y &= 65535;
      y = (y | y << 8) & 16711935;
      y = (y | y << 4) & 252645135;
      y = (y | y << 2) & 858993459;
      y = (y | y << 1) & 1431655765;
      return x | y << 1;
    };
    exports.deinterleave2 = function(v, n) {
      v = v >>> n & 1431655765;
      v = (v | v >>> 1) & 858993459;
      v = (v | v >>> 2) & 252645135;
      v = (v | v >>> 4) & 16711935;
      v = (v | v >>> 16) & 65535;
      return v << 16 >> 16;
    };
    exports.interleave3 = function(x, y, z) {
      x &= 1023;
      x = (x | x << 16) & 4278190335;
      x = (x | x << 8) & 251719695;
      x = (x | x << 4) & 3272356035;
      x = (x | x << 2) & 1227133513;
      y &= 1023;
      y = (y | y << 16) & 4278190335;
      y = (y | y << 8) & 251719695;
      y = (y | y << 4) & 3272356035;
      y = (y | y << 2) & 1227133513;
      x |= y << 1;
      z &= 1023;
      z = (z | z << 16) & 4278190335;
      z = (z | z << 8) & 251719695;
      z = (z | z << 4) & 3272356035;
      z = (z | z << 2) & 1227133513;
      return x | z << 2;
    };
    exports.deinterleave3 = function(v, n) {
      v = v >>> n & 1227133513;
      v = (v | v >>> 2) & 3272356035;
      v = (v | v >>> 4) & 251719695;
      v = (v | v >>> 8) & 4278190335;
      v = (v | v >>> 16) & 1023;
      return v << 22 >> 22;
    };
    exports.nextCombination = function(v) {
      var t = v | v - 1;
      return t + 1 | (~t & -~t) - 1 >>> countTrailingZeros(v) + 1;
    };
  }
});

// node_modules/dup/dup.js
var require_dup = __commonJS({
  "node_modules/dup/dup.js"(exports, module) {
    "use strict";
    function dupe_array(count, value, i) {
      var c = count[i] | 0;
      if (c <= 0) {
        return [];
      }
      var result = new Array(c), j;
      if (i === count.length - 1) {
        for (j = 0; j < c; ++j) {
          result[j] = value;
        }
      } else {
        for (j = 0; j < c; ++j) {
          result[j] = dupe_array(count, value, i + 1);
        }
      }
      return result;
    }
    function dupe_number(count, value) {
      var result, i;
      result = new Array(count);
      for (i = 0; i < count; ++i) {
        result[i] = value;
      }
      return result;
    }
    function dupe(count, value) {
      if (typeof value === "undefined") {
        value = 0;
      }
      switch (typeof count) {
        case "number":
          if (count > 0) {
            return dupe_number(count | 0, value);
          }
          break;
        case "object":
          if (typeof count.length === "number") {
            return dupe_array(count, value, 0);
          }
          break;
      }
      return [];
    }
    module.exports = dupe;
  }
});

// packages/typedarray-pool/pool.js
var require_pool = __commonJS({
  "packages/typedarray-pool/pool.js"(exports) {
    "use strict";
    var bits = require_twiddle();
    var dup = require_dup();
    if (!globalThis.__TYPEDARRAY_POOL) {
      globalThis.__TYPEDARRAY_POOL = {
        UINT8: dup([32, 0]),
        UINT16: dup([32, 0]),
        UINT32: dup([32, 0]),
        BIGUINT64: dup([32, 0]),
        INT8: dup([32, 0]),
        INT16: dup([32, 0]),
        INT32: dup([32, 0]),
        BIGINT64: dup([32, 0]),
        FLOAT: dup([32, 0]),
        DOUBLE: dup([32, 0]),
        DATA: dup([32, 0]),
        UINT8C: dup([32, 0])
      };
    }
    var hasUint8C = typeof Uint8ClampedArray !== "undefined";
    var hasBigUint64 = typeof BigUint64Array !== "undefined";
    var hasBigInt64 = typeof BigInt64Array !== "undefined";
    var POOL = globalThis.__TYPEDARRAY_POOL;
    if (!POOL.UINT8C) {
      POOL.UINT8C = dup([32, 0]);
    }
    if (!POOL.BIGUINT64) {
      POOL.BIGUINT64 = dup([32, 0]);
    }
    if (!POOL.BIGINT64) {
      POOL.BIGINT64 = dup([32, 0]);
    }
    var DATA = POOL.DATA;
    exports.free = function free(array) {
      if (Object.prototype.toString.call(array) !== "[object ArrayBuffer]") {
        array = array.buffer;
      }
      if (!array) {
        return;
      }
      var n = array.length || array.byteLength;
      var log_n = bits.log2(n) | 0;
      DATA[log_n].push(array);
    };
    function freeArrayBuffer(buffer) {
      if (!buffer) {
        return;
      }
      var n = buffer.length || buffer.byteLength;
      var log_n = bits.log2(n);
      DATA[log_n].push(buffer);
    }
    function freeTypedArray(array) {
      freeArrayBuffer(array.buffer);
    }
    exports.freeUint8 = exports.freeUint16 = exports.freeUint32 = exports.freeBigUint64 = exports.freeInt8 = exports.freeInt16 = exports.freeInt32 = exports.freeBigInt64 = exports.freeFloat32 = exports.freeFloat = exports.freeFloat64 = exports.freeDouble = exports.freeUint8Clamped = exports.freeDataView = freeTypedArray;
    exports.freeArrayBuffer = freeArrayBuffer;
    exports.malloc = function malloc(n, dtype) {
      if (dtype === void 0 || dtype === "arraybuffer") {
        return mallocArrayBuffer(n);
      } else {
        switch (dtype) {
          case "uint8":
            return mallocUint8(n);
          case "uint16":
            return mallocUint16(n);
          case "uint32":
            return mallocUint32(n);
          case "int8":
            return mallocInt8(n);
          case "int16":
            return mallocInt16(n);
          case "int32":
            return mallocInt32(n);
          case "float":
          case "float32":
            return mallocFloat(n);
          case "double":
          case "float64":
            return mallocDouble(n);
          case "uint8_clamped":
            return mallocUint8Clamped(n);
          case "bigint64":
            return mallocBigInt64(n);
          case "biguint64":
            return mallocBigUint64(n);
          case "data":
          case "dataview":
            return mallocDataView(n);
          default:
            return null;
        }
      }
      return null;
    };
    function mallocArrayBuffer(n) {
      var n = bits.nextPow2(n);
      var log_n = bits.log2(n);
      var d = DATA[log_n];
      if (d.length > 0) {
        return d.pop();
      }
      return new ArrayBuffer(n);
    }
    exports.mallocArrayBuffer = mallocArrayBuffer;
    function mallocUint8(n) {
      return new Uint8Array(mallocArrayBuffer(n), 0, n);
    }
    exports.mallocUint8 = mallocUint8;
    function mallocUint16(n) {
      return new Uint16Array(mallocArrayBuffer(2 * n), 0, n);
    }
    exports.mallocUint16 = mallocUint16;
    function mallocUint32(n) {
      return new Uint32Array(mallocArrayBuffer(4 * n), 0, n);
    }
    exports.mallocUint32 = mallocUint32;
    function mallocInt8(n) {
      return new Int8Array(mallocArrayBuffer(n), 0, n);
    }
    exports.mallocInt8 = mallocInt8;
    function mallocInt16(n) {
      return new Int16Array(mallocArrayBuffer(2 * n), 0, n);
    }
    exports.mallocInt16 = mallocInt16;
    function mallocInt32(n) {
      return new Int32Array(mallocArrayBuffer(4 * n), 0, n);
    }
    exports.mallocInt32 = mallocInt32;
    function mallocFloat(n) {
      return new Float32Array(mallocArrayBuffer(4 * n), 0, n);
    }
    exports.mallocFloat32 = exports.mallocFloat = mallocFloat;
    function mallocDouble(n) {
      return new Float64Array(mallocArrayBuffer(8 * n), 0, n);
    }
    exports.mallocFloat64 = exports.mallocDouble = mallocDouble;
    function mallocUint8Clamped(n) {
      if (hasUint8C) {
        return new Uint8ClampedArray(mallocArrayBuffer(n), 0, n);
      } else {
        return mallocUint8(n);
      }
    }
    exports.mallocUint8Clamped = mallocUint8Clamped;
    function mallocBigUint64(n) {
      if (hasBigUint64) {
        return new BigUint64Array(mallocArrayBuffer(8 * n), 0, n);
      } else {
        return null;
      }
    }
    exports.mallocBigUint64 = mallocBigUint64;
    function mallocBigInt64(n) {
      if (hasBigInt64) {
        return new BigInt64Array(mallocArrayBuffer(8 * n), 0, n);
      } else {
        return null;
      }
    }
    exports.mallocBigInt64 = mallocBigInt64;
    function mallocDataView(n) {
      return new DataView(mallocArrayBuffer(n), 0, n);
    }
    exports.mallocDataView = mallocDataView;
    exports.clearCache = function clearCache() {
      for (var i = 0; i < 32; ++i) {
        POOL.UINT8[i].length = 0;
        POOL.UINT16[i].length = 0;
        POOL.UINT32[i].length = 0;
        POOL.INT8[i].length = 0;
        POOL.INT16[i].length = 0;
        POOL.INT32[i].length = 0;
        POOL.FLOAT[i].length = 0;
        POOL.DOUBLE[i].length = 0;
        POOL.BIGUINT64[i].length = 0;
        POOL.BIGINT64[i].length = 0;
        POOL.UINT8C[i].length = 0;
        DATA[i].length = 0;
      }
    };
  }
});

// packages/box-intersect/lib/sort.js
var require_sort = __commonJS({
  "packages/box-intersect/lib/sort.js"(exports, module) {
    "use strict";
    module.exports = wrapper;
    var INSERT_SORT_CUTOFF = 32;
    function wrapper(data2, n0) {
      if (n0 <= 4 * INSERT_SORT_CUTOFF) {
        insertionSort(0, n0 - 1, data2);
      } else {
        quickSort(0, n0 - 1, data2);
      }
    }
    function insertionSort(left, right, data2) {
      var ptr = 2 * (left + 1);
      for (var i = left + 1; i <= right; ++i) {
        var a = data2[ptr++];
        var b = data2[ptr++];
        var j = i;
        var jptr = ptr - 2;
        while (j-- > left) {
          var x = data2[jptr - 2];
          var y = data2[jptr - 1];
          if (x < a) {
            break;
          } else if (x === a && y < b) {
            break;
          }
          data2[jptr] = x;
          data2[jptr + 1] = y;
          jptr -= 2;
        }
        data2[jptr] = a;
        data2[jptr + 1] = b;
      }
    }
    function swap(i, j, data2) {
      i *= 2;
      j *= 2;
      var x = data2[i];
      var y = data2[i + 1];
      data2[i] = data2[j];
      data2[i + 1] = data2[j + 1];
      data2[j] = x;
      data2[j + 1] = y;
    }
    function move(i, j, data2) {
      i *= 2;
      j *= 2;
      data2[i] = data2[j];
      data2[i + 1] = data2[j + 1];
    }
    function rotate(i, j, k, data2) {
      i *= 2;
      j *= 2;
      k *= 2;
      var x = data2[i];
      var y = data2[i + 1];
      data2[i] = data2[j];
      data2[i + 1] = data2[j + 1];
      data2[j] = data2[k];
      data2[j + 1] = data2[k + 1];
      data2[k] = x;
      data2[k + 1] = y;
    }
    function shufflePivot(i, j, px, py, data2) {
      i *= 2;
      j *= 2;
      data2[i] = data2[j];
      data2[j] = px;
      data2[i + 1] = data2[j + 1];
      data2[j + 1] = py;
    }
    function compare(i, j, data2) {
      i *= 2;
      j *= 2;
      var x = data2[i], y = data2[j];
      if (x < y) {
        return false;
      } else if (x === y) {
        return data2[i + 1] > data2[j + 1];
      }
      return true;
    }
    function comparePivot(i, y, b, data2) {
      i *= 2;
      var x = data2[i];
      if (x < y) {
        return true;
      } else if (x === y) {
        return data2[i + 1] < b;
      }
      return false;
    }
    function quickSort(left, right, data2) {
      var sixth = (right - left + 1) / 6 | 0, index1 = left + sixth, index5 = right - sixth, index3 = left + right >> 1, index2 = index3 - sixth, index4 = index3 + sixth, el1 = index1, el2 = index2, el3 = index3, el4 = index4, el5 = index5, less = left + 1, great = right - 1, tmp = 0;
      if (compare(el1, el2, data2)) {
        tmp = el1;
        el1 = el2;
        el2 = tmp;
      }
      if (compare(el4, el5, data2)) {
        tmp = el4;
        el4 = el5;
        el5 = tmp;
      }
      if (compare(el1, el3, data2)) {
        tmp = el1;
        el1 = el3;
        el3 = tmp;
      }
      if (compare(el2, el3, data2)) {
        tmp = el2;
        el2 = el3;
        el3 = tmp;
      }
      if (compare(el1, el4, data2)) {
        tmp = el1;
        el1 = el4;
        el4 = tmp;
      }
      if (compare(el3, el4, data2)) {
        tmp = el3;
        el3 = el4;
        el4 = tmp;
      }
      if (compare(el2, el5, data2)) {
        tmp = el2;
        el2 = el5;
        el5 = tmp;
      }
      if (compare(el2, el3, data2)) {
        tmp = el2;
        el2 = el3;
        el3 = tmp;
      }
      if (compare(el4, el5, data2)) {
        tmp = el4;
        el4 = el5;
        el5 = tmp;
      }
      var pivot1X = data2[2 * el2];
      var pivot1Y = data2[2 * el2 + 1];
      var pivot2X = data2[2 * el4];
      var pivot2Y = data2[2 * el4 + 1];
      var ptr0 = 2 * el1;
      var ptr2 = 2 * el3;
      var ptr4 = 2 * el5;
      var ptr5 = 2 * index1;
      var ptr6 = 2 * index3;
      var ptr7 = 2 * index5;
      for (var i1 = 0; i1 < 2; ++i1) {
        var x = data2[ptr0 + i1];
        var y = data2[ptr2 + i1];
        var z = data2[ptr4 + i1];
        data2[ptr5 + i1] = x;
        data2[ptr6 + i1] = y;
        data2[ptr7 + i1] = z;
      }
      move(index2, left, data2);
      move(index4, right, data2);
      for (var k = less; k <= great; ++k) {
        if (comparePivot(k, pivot1X, pivot1Y, data2)) {
          if (k !== less) {
            swap(k, less, data2);
          }
          ++less;
        } else {
          if (!comparePivot(k, pivot2X, pivot2Y, data2)) {
            while (true) {
              if (!comparePivot(great, pivot2X, pivot2Y, data2)) {
                if (--great < k) {
                  break;
                }
                continue;
              } else {
                if (comparePivot(great, pivot1X, pivot1Y, data2)) {
                  rotate(k, less, great, data2);
                  ++less;
                  --great;
                } else {
                  swap(k, great, data2);
                  --great;
                }
                break;
              }
            }
          }
        }
      }
      shufflePivot(left, less - 1, pivot1X, pivot1Y, data2);
      shufflePivot(right, great + 1, pivot2X, pivot2Y, data2);
      if (less - 2 - left <= INSERT_SORT_CUTOFF) {
        insertionSort(left, less - 2, data2);
      } else {
        quickSort(left, less - 2, data2);
      }
      if (right - (great + 2) <= INSERT_SORT_CUTOFF) {
        insertionSort(great + 2, right, data2);
      } else {
        quickSort(great + 2, right, data2);
      }
      if (great - less <= INSERT_SORT_CUTOFF) {
        insertionSort(less, great, data2);
      } else {
        quickSort(less, great, data2);
      }
    }
  }
});

// packages/box-intersect/lib/sweep.js
var require_sweep = __commonJS({
  "packages/box-intersect/lib/sweep.js"(exports, module) {
    "use strict";
    module.exports = {
      init: sqInit,
      sweepBipartite,
      sweepComplete,
      scanBipartite,
      scanComplete
    };
    var pool = require_pool();
    var bits = require_twiddle();
    var isort = require_sort();
    var BLUE_FLAG = 1 << 28;
    var INIT_CAPACITY = 1024;
    var RED_SWEEP_QUEUE = pool.mallocInt32(INIT_CAPACITY);
    var RED_SWEEP_INDEX = pool.mallocInt32(INIT_CAPACITY);
    var BLUE_SWEEP_QUEUE = pool.mallocInt32(INIT_CAPACITY);
    var BLUE_SWEEP_INDEX = pool.mallocInt32(INIT_CAPACITY);
    var COMMON_SWEEP_QUEUE = pool.mallocInt32(INIT_CAPACITY);
    var COMMON_SWEEP_INDEX = pool.mallocInt32(INIT_CAPACITY);
    var SWEEP_EVENTS = pool.mallocDouble(INIT_CAPACITY * 8);
    function sqInit(count) {
      var rcount = bits.nextPow2(count);
      if (RED_SWEEP_QUEUE.length < rcount) {
        pool.free(RED_SWEEP_QUEUE);
        RED_SWEEP_QUEUE = pool.mallocInt32(rcount);
      }
      if (RED_SWEEP_INDEX.length < rcount) {
        pool.free(RED_SWEEP_INDEX);
        RED_SWEEP_INDEX = pool.mallocInt32(rcount);
      }
      if (BLUE_SWEEP_QUEUE.length < rcount) {
        pool.free(BLUE_SWEEP_QUEUE);
        BLUE_SWEEP_QUEUE = pool.mallocInt32(rcount);
      }
      if (BLUE_SWEEP_INDEX.length < rcount) {
        pool.free(BLUE_SWEEP_INDEX);
        BLUE_SWEEP_INDEX = pool.mallocInt32(rcount);
      }
      if (COMMON_SWEEP_QUEUE.length < rcount) {
        pool.free(COMMON_SWEEP_QUEUE);
        COMMON_SWEEP_QUEUE = pool.mallocInt32(rcount);
      }
      if (COMMON_SWEEP_INDEX.length < rcount) {
        pool.free(COMMON_SWEEP_INDEX);
        COMMON_SWEEP_INDEX = pool.mallocInt32(rcount);
      }
      var eventLength = 8 * rcount;
      if (SWEEP_EVENTS.length < eventLength) {
        pool.free(SWEEP_EVENTS);
        SWEEP_EVENTS = pool.mallocDouble(eventLength);
      }
    }
    function sqPop(queue, index, count, item) {
      var idx = index[item];
      var top = queue[count - 1];
      queue[idx] = top;
      index[top] = idx;
    }
    function sqPush(queue, index, count, item) {
      queue[count] = item;
      index[item] = count;
    }
    function sweepBipartite(d, visit, redStart, redEnd, red, redIndex, blueStart, blueEnd, blue, blueIndex) {
      var ptr = 0;
      var elemSize = 2 * d;
      var istart = d - 1;
      var iend = elemSize - 1;
      for (var i = redStart; i < redEnd; ++i) {
        var idx = redIndex[i];
        var redOffset = elemSize * i;
        SWEEP_EVENTS[ptr++] = red[redOffset + istart];
        SWEEP_EVENTS[ptr++] = -(idx + 1);
        SWEEP_EVENTS[ptr++] = red[redOffset + iend];
        SWEEP_EVENTS[ptr++] = idx;
      }
      for (var i = blueStart; i < blueEnd; ++i) {
        var idx = blueIndex[i] + BLUE_FLAG;
        var blueOffset = elemSize * i;
        SWEEP_EVENTS[ptr++] = blue[blueOffset + istart];
        SWEEP_EVENTS[ptr++] = -idx;
        SWEEP_EVENTS[ptr++] = blue[blueOffset + iend];
        SWEEP_EVENTS[ptr++] = idx;
      }
      var n = ptr >>> 1;
      isort(SWEEP_EVENTS, n);
      var redActive = 0;
      var blueActive = 0;
      for (var i = 0; i < n; ++i) {
        var e = SWEEP_EVENTS[2 * i + 1] | 0;
        if (e >= BLUE_FLAG) {
          e = e - BLUE_FLAG | 0;
          sqPop(BLUE_SWEEP_QUEUE, BLUE_SWEEP_INDEX, blueActive--, e);
        } else if (e >= 0) {
          sqPop(RED_SWEEP_QUEUE, RED_SWEEP_INDEX, redActive--, e);
        } else if (e <= -BLUE_FLAG) {
          e = -e - BLUE_FLAG | 0;
          for (var j = 0; j < redActive; ++j) {
            var retval = visit(RED_SWEEP_QUEUE[j], e);
            if (retval !== void 0) {
              return retval;
            }
          }
          sqPush(BLUE_SWEEP_QUEUE, BLUE_SWEEP_INDEX, blueActive++, e);
        } else {
          e = -e - 1 | 0;
          for (var j = 0; j < blueActive; ++j) {
            var retval = visit(e, BLUE_SWEEP_QUEUE[j]);
            if (retval !== void 0) {
              return retval;
            }
          }
          sqPush(RED_SWEEP_QUEUE, RED_SWEEP_INDEX, redActive++, e);
        }
      }
    }
    function sweepComplete(d, visit, redStart, redEnd, red, redIndex, blueStart, blueEnd, blue, blueIndex) {
      var ptr = 0;
      var elemSize = 2 * d;
      var istart = d - 1;
      var iend = elemSize - 1;
      for (var i = redStart; i < redEnd; ++i) {
        var idx = redIndex[i] + 1 << 1;
        var redOffset = elemSize * i;
        SWEEP_EVENTS[ptr++] = red[redOffset + istart];
        SWEEP_EVENTS[ptr++] = -idx;
        SWEEP_EVENTS[ptr++] = red[redOffset + iend];
        SWEEP_EVENTS[ptr++] = idx;
      }
      for (var i = blueStart; i < blueEnd; ++i) {
        var idx = blueIndex[i] + 1 << 1;
        var blueOffset = elemSize * i;
        SWEEP_EVENTS[ptr++] = blue[blueOffset + istart];
        SWEEP_EVENTS[ptr++] = -idx | 1;
        SWEEP_EVENTS[ptr++] = blue[blueOffset + iend];
        SWEEP_EVENTS[ptr++] = idx | 1;
      }
      var n = ptr >>> 1;
      isort(SWEEP_EVENTS, n);
      var redActive = 0;
      var blueActive = 0;
      var commonActive = 0;
      for (var i = 0; i < n; ++i) {
        var e = SWEEP_EVENTS[2 * i + 1] | 0;
        var color = e & 1;
        if (i < n - 1 && e >> 1 === SWEEP_EVENTS[2 * i + 3] >> 1) {
          color = 2;
          i += 1;
        }
        if (e < 0) {
          var id = -(e >> 1) - 1;
          for (var j = 0; j < commonActive; ++j) {
            var retval = visit(COMMON_SWEEP_QUEUE[j], id);
            if (retval !== void 0) {
              return retval;
            }
          }
          if (color !== 0) {
            for (var j = 0; j < redActive; ++j) {
              var retval = visit(RED_SWEEP_QUEUE[j], id);
              if (retval !== void 0) {
                return retval;
              }
            }
          }
          if (color !== 1) {
            for (var j = 0; j < blueActive; ++j) {
              var retval = visit(BLUE_SWEEP_QUEUE[j], id);
              if (retval !== void 0) {
                return retval;
              }
            }
          }
          if (color === 0) {
            sqPush(RED_SWEEP_QUEUE, RED_SWEEP_INDEX, redActive++, id);
          } else if (color === 1) {
            sqPush(BLUE_SWEEP_QUEUE, BLUE_SWEEP_INDEX, blueActive++, id);
          } else if (color === 2) {
            sqPush(COMMON_SWEEP_QUEUE, COMMON_SWEEP_INDEX, commonActive++, id);
          }
        } else {
          var id = (e >> 1) - 1;
          if (color === 0) {
            sqPop(RED_SWEEP_QUEUE, RED_SWEEP_INDEX, redActive--, id);
          } else if (color === 1) {
            sqPop(BLUE_SWEEP_QUEUE, BLUE_SWEEP_INDEX, blueActive--, id);
          } else if (color === 2) {
            sqPop(COMMON_SWEEP_QUEUE, COMMON_SWEEP_INDEX, commonActive--, id);
          }
        }
      }
    }
    function scanBipartite(d, axis, visit, flip, redStart, redEnd, red, redIndex, blueStart, blueEnd, blue, blueIndex) {
      var ptr = 0;
      var elemSize = 2 * d;
      var istart = axis;
      var iend = axis + d;
      var redShift = 1;
      var blueShift = 1;
      if (flip) {
        blueShift = BLUE_FLAG;
      } else {
        redShift = BLUE_FLAG;
      }
      for (var i = redStart; i < redEnd; ++i) {
        var idx = i + redShift;
        var redOffset = elemSize * i;
        SWEEP_EVENTS[ptr++] = red[redOffset + istart];
        SWEEP_EVENTS[ptr++] = -idx;
        SWEEP_EVENTS[ptr++] = red[redOffset + iend];
        SWEEP_EVENTS[ptr++] = idx;
      }
      for (var i = blueStart; i < blueEnd; ++i) {
        var idx = i + blueShift;
        var blueOffset = elemSize * i;
        SWEEP_EVENTS[ptr++] = blue[blueOffset + istart];
        SWEEP_EVENTS[ptr++] = -idx;
      }
      var n = ptr >>> 1;
      isort(SWEEP_EVENTS, n);
      var redActive = 0;
      for (var i = 0; i < n; ++i) {
        var e = SWEEP_EVENTS[2 * i + 1] | 0;
        if (e < 0) {
          var idx = -e;
          var isRed = false;
          if (idx >= BLUE_FLAG) {
            isRed = !flip;
            idx -= BLUE_FLAG;
          } else {
            isRed = !!flip;
            idx -= 1;
          }
          if (isRed) {
            sqPush(RED_SWEEP_QUEUE, RED_SWEEP_INDEX, redActive++, idx);
          } else {
            var blueId = blueIndex[idx];
            var bluePtr = elemSize * idx;
            var b0 = blue[bluePtr + axis + 1];
            var b1 = blue[bluePtr + axis + 1 + d];
            red_loop:
              for (var j = 0; j < redActive; ++j) {
                var oidx = RED_SWEEP_QUEUE[j];
                var redPtr = elemSize * oidx;
                if (b1 < red[redPtr + axis + 1] || red[redPtr + axis + 1 + d] < b0) {
                  continue;
                }
                for (var k = axis + 2; k < d; ++k) {
                  if (blue[bluePtr + k + d] < red[redPtr + k] || red[redPtr + k + d] < blue[bluePtr + k]) {
                    continue red_loop;
                  }
                }
                var redId = redIndex[oidx];
                var retval;
                if (flip) {
                  retval = visit(blueId, redId);
                } else {
                  retval = visit(redId, blueId);
                }
                if (retval !== void 0) {
                  return retval;
                }
              }
          }
        } else {
          sqPop(RED_SWEEP_QUEUE, RED_SWEEP_INDEX, redActive--, e - redShift);
        }
      }
    }
    function scanComplete(d, axis, visit, redStart, redEnd, red, redIndex, blueStart, blueEnd, blue, blueIndex) {
      var ptr = 0;
      var elemSize = 2 * d;
      var istart = axis;
      var iend = axis + d;
      for (var i = redStart; i < redEnd; ++i) {
        var idx = i + BLUE_FLAG;
        var redOffset = elemSize * i;
        SWEEP_EVENTS[ptr++] = red[redOffset + istart];
        SWEEP_EVENTS[ptr++] = -idx;
        SWEEP_EVENTS[ptr++] = red[redOffset + iend];
        SWEEP_EVENTS[ptr++] = idx;
      }
      for (var i = blueStart; i < blueEnd; ++i) {
        var idx = i + 1;
        var blueOffset = elemSize * i;
        SWEEP_EVENTS[ptr++] = blue[blueOffset + istart];
        SWEEP_EVENTS[ptr++] = -idx;
      }
      var n = ptr >>> 1;
      isort(SWEEP_EVENTS, n);
      var redActive = 0;
      for (var i = 0; i < n; ++i) {
        var e = SWEEP_EVENTS[2 * i + 1] | 0;
        if (e < 0) {
          var idx = -e;
          if (idx >= BLUE_FLAG) {
            RED_SWEEP_QUEUE[redActive++] = idx - BLUE_FLAG;
          } else {
            idx -= 1;
            var blueId = blueIndex[idx];
            var bluePtr = elemSize * idx;
            var b0 = blue[bluePtr + axis + 1];
            var b1 = blue[bluePtr + axis + 1 + d];
            red_loop:
              for (var j = 0; j < redActive; ++j) {
                var oidx = RED_SWEEP_QUEUE[j];
                var redId = redIndex[oidx];
                if (redId === blueId) {
                  break;
                }
                var redPtr = elemSize * oidx;
                if (b1 < red[redPtr + axis + 1] || red[redPtr + axis + 1 + d] < b0) {
                  continue;
                }
                for (var k = axis + 2; k < d; ++k) {
                  if (blue[bluePtr + k + d] < red[redPtr + k] || red[redPtr + k + d] < blue[bluePtr + k]) {
                    continue red_loop;
                  }
                }
                var retval = visit(redId, blueId);
                if (retval !== void 0) {
                  return retval;
                }
              }
          }
        } else {
          var idx = e - BLUE_FLAG;
          for (var j = redActive - 1; j >= 0; --j) {
            if (RED_SWEEP_QUEUE[j] === idx) {
              for (var k = j + 1; k < redActive; ++k) {
                RED_SWEEP_QUEUE[k - 1] = RED_SWEEP_QUEUE[k];
              }
              break;
            }
          }
          --redActive;
        }
      }
    }
  }
});

// packages/box-intersect/lib/brute.js
var require_brute = __commonJS({
  "packages/box-intersect/lib/brute.js"(exports) {
    "use strict";
    var DIMENSION = "d";
    var AXIS = "ax";
    var VISIT = "vv";
    var FLIP = "fp";
    var ELEM_SIZE = "es";
    var RED_START = "rs";
    var RED_END = "re";
    var RED_BOXES = "rb";
    var RED_INDEX = "ri";
    var RED_PTR = "rp";
    var BLUE_START = "bs";
    var BLUE_END = "be";
    var BLUE_BOXES = "bb";
    var BLUE_INDEX = "bi";
    var BLUE_PTR = "bp";
    var RETVAL = "rv";
    var INNER_LABEL = "Q";
    var ARGS = [
      DIMENSION,
      AXIS,
      VISIT,
      RED_START,
      RED_END,
      RED_BOXES,
      RED_INDEX,
      BLUE_START,
      BLUE_END,
      BLUE_BOXES,
      BLUE_INDEX
    ];
    function generateBruteForce(redMajor, flip, full) {
      var funcName = "bruteForce" + (redMajor ? "Red" : "Blue") + (flip ? "Flip" : "") + (full ? "Full" : "");
      var code = [
        "function ",
        funcName,
        "(",
        ARGS.join(),
        "){",
        "var ",
        ELEM_SIZE,
        "=2*",
        DIMENSION,
        ";"
      ];
      var redLoop = "for(var i=" + RED_START + "," + RED_PTR + "=" + ELEM_SIZE + "*" + RED_START + ";i<" + RED_END + ";++i," + RED_PTR + "+=" + ELEM_SIZE + "){var x0=" + RED_BOXES + "[" + AXIS + "+" + RED_PTR + "],x1=" + RED_BOXES + "[" + AXIS + "+" + RED_PTR + "+" + DIMENSION + "],xi=" + RED_INDEX + "[i];";
      var blueLoop = "for(var j=" + BLUE_START + "," + BLUE_PTR + "=" + ELEM_SIZE + "*" + BLUE_START + ";j<" + BLUE_END + ";++j," + BLUE_PTR + "+=" + ELEM_SIZE + "){var y0=" + BLUE_BOXES + "[" + AXIS + "+" + BLUE_PTR + "]," + (full ? "y1=" + BLUE_BOXES + "[" + AXIS + "+" + BLUE_PTR + "+" + DIMENSION + "]," : "") + "yi=" + BLUE_INDEX + "[j];";
      if (redMajor) {
        code.push(redLoop, INNER_LABEL, ":", blueLoop);
      } else {
        code.push(blueLoop, INNER_LABEL, ":", redLoop);
      }
      if (full) {
        code.push("if(y1<x0||x1<y0)continue;");
      } else if (flip) {
        code.push("if(y0<=x0||x1<y0)continue;");
      } else {
        code.push("if(y0<x0||x1<y0)continue;");
      }
      code.push("for(var k=" + AXIS + "+1;k<" + DIMENSION + ";++k){var r0=" + RED_BOXES + "[k+" + RED_PTR + "],r1=" + RED_BOXES + "[k+" + DIMENSION + "+" + RED_PTR + "],b0=" + BLUE_BOXES + "[k+" + BLUE_PTR + "],b1=" + BLUE_BOXES + "[k+" + DIMENSION + "+" + BLUE_PTR + "];if(r1<b0||b1<r0)continue " + INNER_LABEL + ";}var " + RETVAL + "=" + VISIT + "(");
      if (flip) {
        code.push("yi,xi");
      } else {
        code.push("xi,yi");
      }
      code.push(");if(" + RETVAL + "!==void 0)return " + RETVAL + ";}}}");
      return {
        name: funcName,
        code: code.join("")
      };
    }
    function bruteForcePlanner(full) {
      var funcName = "bruteForce" + (full ? "Full" : "Partial");
      var prefix = [];
      var fargs = ARGS.slice();
      if (!full) {
        fargs.splice(3, 0, FLIP);
      }
      var code = ["function " + funcName + "(" + fargs.join() + "){"];
      function invoke(redMajor, flip) {
        var res = generateBruteForce(redMajor, flip, full);
        prefix.push(res.code);
        code.push("return " + res.name + "(" + ARGS.join() + ");");
      }
      code.push("if(" + RED_END + "-" + RED_START + ">" + BLUE_END + "-" + BLUE_START + "){");
      if (full) {
        invoke(true, false);
        code.push("}else{");
        invoke(false, false);
      } else {
        code.push("if(" + FLIP + "){");
        invoke(true, true);
        code.push("}else{");
        invoke(true, false);
        code.push("}}else{if(" + FLIP + "){");
        invoke(false, true);
        code.push("}else{");
        invoke(false, false);
        code.push("}");
      }
      code.push("}}return " + funcName);
      var codeStr = prefix.join("") + code.join("");
      var proc = new Function(codeStr);
      return proc();
    }
    exports.partial = bruteForcePlanner(false);
    exports.full = bruteForcePlanner(true);
  }
});

// packages/box-intersect/lib/partition.js
var require_partition = __commonJS({
  "packages/box-intersect/lib/partition.js"(exports, module) {
    "use strict";
    module.exports = genPartition;
    var code = "for(var j=2*a,k=j*c,l=k,m=c,n=b,o=a+b,p=c;d>p;++p,k+=j){var _;if($)if(m===p)m+=1,l+=j;else{for(var s=0;j>s;++s){var t=e[k+s];e[k+s]=e[l],e[l++]=t}var u=f[p];f[p]=f[m],f[m++]=u}}return m";
    function genPartition(predicate, args) {
      var fargs = "abcdef".split("").concat(args);
      var reads = [];
      if (predicate.indexOf("lo") >= 0) {
        reads.push("lo=e[k+n]");
      }
      if (predicate.indexOf("hi") >= 0) {
        reads.push("hi=e[k+o]");
      }
      fargs.push(
        code.replace("_", reads.join()).replace("$", predicate)
      );
      return Function.apply(void 0, fargs);
    }
  }
});

// packages/box-intersect/lib/median.js
var require_median = __commonJS({
  "packages/box-intersect/lib/median.js"(exports, module) {
    "use strict";
    module.exports = findMedian;
    var genPartition = require_partition();
    var partitionStartLessThan = genPartition("lo<p0", ["p0"]);
    var PARTITION_THRESHOLD = 8;
    function insertionSort(d, axis, start, end, boxes, ids) {
      var elemSize = 2 * d;
      var boxPtr = elemSize * (start + 1) + axis;
      for (var i = start + 1; i < end; ++i, boxPtr += elemSize) {
        var x = boxes[boxPtr];
        for (var j = i, ptr = elemSize * (i - 1); j > start && boxes[ptr + axis] > x; --j, ptr -= elemSize) {
          var aPtr = ptr;
          var bPtr = ptr + elemSize;
          for (var k = 0; k < elemSize; ++k, ++aPtr, ++bPtr) {
            var y = boxes[aPtr];
            boxes[aPtr] = boxes[bPtr];
            boxes[bPtr] = y;
          }
          var tmp = ids[j];
          ids[j] = ids[j - 1];
          ids[j - 1] = tmp;
        }
      }
    }
    function findMedian(d, axis, start, end, boxes, ids) {
      if (end <= start + 1) {
        return start;
      }
      var lo = start;
      var hi = end;
      var mid = end + start >>> 1;
      var elemSize = 2 * d;
      var pivot = mid;
      var value = boxes[elemSize * mid + axis];
      while (lo < hi) {
        if (hi - lo < PARTITION_THRESHOLD) {
          insertionSort(d, axis, lo, hi, boxes, ids);
          value = boxes[elemSize * mid + axis];
          break;
        }
        var count = hi - lo;
        var pivot0 = Math.random() * count + lo | 0;
        var value0 = boxes[elemSize * pivot0 + axis];
        var pivot1 = Math.random() * count + lo | 0;
        var value1 = boxes[elemSize * pivot1 + axis];
        var pivot2 = Math.random() * count + lo | 0;
        var value2 = boxes[elemSize * pivot2 + axis];
        if (value0 <= value1) {
          if (value2 >= value1) {
            pivot = pivot1;
            value = value1;
          } else if (value0 >= value2) {
            pivot = pivot0;
            value = value0;
          } else {
            pivot = pivot2;
            value = value2;
          }
        } else {
          if (value1 >= value2) {
            pivot = pivot1;
            value = value1;
          } else if (value2 >= value0) {
            pivot = pivot0;
            value = value0;
          } else {
            pivot = pivot2;
            value = value2;
          }
        }
        var aPtr = elemSize * (hi - 1);
        var bPtr = elemSize * pivot;
        for (var i = 0; i < elemSize; ++i, ++aPtr, ++bPtr) {
          var x = boxes[aPtr];
          boxes[aPtr] = boxes[bPtr];
          boxes[bPtr] = x;
        }
        var y = ids[hi - 1];
        ids[hi - 1] = ids[pivot];
        ids[pivot] = y;
        pivot = partitionStartLessThan(
          d,
          axis,
          lo,
          hi - 1,
          boxes,
          ids,
          value
        );
        var aPtr = elemSize * (hi - 1);
        var bPtr = elemSize * pivot;
        for (var i = 0; i < elemSize; ++i, ++aPtr, ++bPtr) {
          var x = boxes[aPtr];
          boxes[aPtr] = boxes[bPtr];
          boxes[bPtr] = x;
        }
        var y = ids[hi - 1];
        ids[hi - 1] = ids[pivot];
        ids[pivot] = y;
        if (mid < pivot) {
          hi = pivot - 1;
          while (lo < hi && boxes[elemSize * (hi - 1) + axis] === value) {
            hi -= 1;
          }
          hi += 1;
        } else if (pivot < mid) {
          lo = pivot + 1;
          while (lo < hi && boxes[elemSize * lo + axis] === value) {
            lo += 1;
          }
        } else {
          break;
        }
      }
      return partitionStartLessThan(
        d,
        axis,
        start,
        mid,
        boxes,
        ids,
        boxes[elemSize * mid + axis]
      );
    }
  }
});

// packages/box-intersect/lib/intersect.js
var require_intersect = __commonJS({
  "packages/box-intersect/lib/intersect.js"(exports, module) {
    "use strict";
    module.exports = boxIntersectIter;
    var pool = require_pool();
    var bits = require_twiddle();
    var bruteForce = require_brute();
    var bruteForcePartial = bruteForce.partial;
    var bruteForceFull = bruteForce.full;
    var sweep = require_sweep();
    var findMedian = require_median();
    var genPartition = require_partition();
    var BRUTE_FORCE_CUTOFF = 128;
    var SCAN_CUTOFF = 1 << 22;
    var SCAN_COMPLETE_CUTOFF = 1 << 22;
    var partitionInteriorContainsInterval = genPartition(
      "!(lo>=p0)&&!(p1>=hi)",
      ["p0", "p1"]
    );
    var partitionStartEqual = genPartition(
      "lo===p0",
      ["p0"]
    );
    var partitionStartLessThan = genPartition(
      "lo<p0",
      ["p0"]
    );
    var partitionEndLessThanEqual = genPartition(
      "hi<=p0",
      ["p0"]
    );
    var partitionContainsPoint = genPartition(
      "lo<=p0&&p0<=hi",
      ["p0"]
    );
    var partitionContainsPointProper = genPartition(
      "lo<p0&&p0<=hi",
      ["p0"]
    );
    var IFRAME_SIZE = 6;
    var DFRAME_SIZE = 2;
    var INIT_CAPACITY = 1024;
    var BOX_ISTACK = pool.mallocInt32(INIT_CAPACITY);
    var BOX_DSTACK = pool.mallocDouble(INIT_CAPACITY);
    function iterInit(d, count) {
      var levels = 8 * bits.log2(count + 1) * (d + 1) | 0;
      var maxInts = bits.nextPow2(IFRAME_SIZE * levels);
      if (BOX_ISTACK.length < maxInts) {
        pool.free(BOX_ISTACK);
        BOX_ISTACK = pool.mallocInt32(maxInts);
      }
      var maxDoubles = bits.nextPow2(DFRAME_SIZE * levels);
      if (BOX_DSTACK.length < maxDoubles) {
        pool.free(BOX_DSTACK);
        BOX_DSTACK = pool.mallocDouble(maxDoubles);
      }
    }
    function iterPush(ptr, axis, redStart, redEnd, blueStart, blueEnd, state, lo, hi) {
      var iptr = IFRAME_SIZE * ptr;
      BOX_ISTACK[iptr] = axis;
      BOX_ISTACK[iptr + 1] = redStart;
      BOX_ISTACK[iptr + 2] = redEnd;
      BOX_ISTACK[iptr + 3] = blueStart;
      BOX_ISTACK[iptr + 4] = blueEnd;
      BOX_ISTACK[iptr + 5] = state;
      var dptr = DFRAME_SIZE * ptr;
      BOX_DSTACK[dptr] = lo;
      BOX_DSTACK[dptr + 1] = hi;
    }
    function onePointPartial(d, axis, visit, flip, redStart, redEnd, red, redIndex, blueOffset, blue, blueId) {
      var elemSize = 2 * d;
      var bluePtr = blueOffset * elemSize;
      var blueX = blue[bluePtr + axis];
      red_loop:
        for (var i = redStart, redPtr = redStart * elemSize; i < redEnd; ++i, redPtr += elemSize) {
          var r0 = red[redPtr + axis];
          var r1 = red[redPtr + axis + d];
          if (blueX < r0 || r1 < blueX) {
            continue;
          }
          if (flip && blueX === r0) {
            continue;
          }
          var redId = redIndex[i];
          for (var j = axis + 1; j < d; ++j) {
            var r0 = red[redPtr + j];
            var r1 = red[redPtr + j + d];
            var b0 = blue[bluePtr + j];
            var b1 = blue[bluePtr + j + d];
            if (r1 < b0 || b1 < r0) {
              continue red_loop;
            }
          }
          var retval;
          if (flip) {
            retval = visit(blueId, redId);
          } else {
            retval = visit(redId, blueId);
          }
          if (retval !== void 0) {
            return retval;
          }
        }
    }
    function onePointFull(d, axis, visit, redStart, redEnd, red, redIndex, blueOffset, blue, blueId) {
      var elemSize = 2 * d;
      var bluePtr = blueOffset * elemSize;
      var blueX = blue[bluePtr + axis];
      red_loop:
        for (var i = redStart, redPtr = redStart * elemSize; i < redEnd; ++i, redPtr += elemSize) {
          var redId = redIndex[i];
          if (redId === blueId) {
            continue;
          }
          var r0 = red[redPtr + axis];
          var r1 = red[redPtr + axis + d];
          if (blueX < r0 || r1 < blueX) {
            continue;
          }
          for (var j = axis + 1; j < d; ++j) {
            var r0 = red[redPtr + j];
            var r1 = red[redPtr + j + d];
            var b0 = blue[bluePtr + j];
            var b1 = blue[bluePtr + j + d];
            if (r1 < b0 || b1 < r0) {
              continue red_loop;
            }
          }
          var retval = visit(redId, blueId);
          if (retval !== void 0) {
            return retval;
          }
        }
    }
    function boxIntersectIter(d, visit, initFull, xSize, xBoxes, xIndex, ySize, yBoxes, yIndex) {
      iterInit(d, xSize + ySize);
      var top = 0;
      var elemSize = 2 * d;
      var retval;
      iterPush(
        top++,
        0,
        0,
        xSize,
        0,
        ySize,
        initFull ? 16 : 0,
        -Infinity,
        Infinity
      );
      if (!initFull) {
        iterPush(
          top++,
          0,
          0,
          ySize,
          0,
          xSize,
          1,
          -Infinity,
          Infinity
        );
      }
      while (top > 0) {
        top -= 1;
        var iptr = top * IFRAME_SIZE;
        var axis = BOX_ISTACK[iptr];
        var redStart = BOX_ISTACK[iptr + 1];
        var redEnd = BOX_ISTACK[iptr + 2];
        var blueStart = BOX_ISTACK[iptr + 3];
        var blueEnd = BOX_ISTACK[iptr + 4];
        var state = BOX_ISTACK[iptr + 5];
        var dptr = top * DFRAME_SIZE;
        var lo = BOX_DSTACK[dptr];
        var hi = BOX_DSTACK[dptr + 1];
        var flip = state & 1;
        var full = !!(state & 16);
        var red = xBoxes;
        var redIndex = xIndex;
        var blue = yBoxes;
        var blueIndex = yIndex;
        if (flip) {
          red = yBoxes;
          redIndex = yIndex;
          blue = xBoxes;
          blueIndex = xIndex;
        }
        if (state & 2) {
          redEnd = partitionStartLessThan(
            d,
            axis,
            redStart,
            redEnd,
            red,
            redIndex,
            hi
          );
          if (redStart >= redEnd) {
            continue;
          }
        }
        if (state & 4) {
          redStart = partitionEndLessThanEqual(
            d,
            axis,
            redStart,
            redEnd,
            red,
            redIndex,
            lo
          );
          if (redStart >= redEnd) {
            continue;
          }
        }
        var redCount = redEnd - redStart;
        var blueCount = blueEnd - blueStart;
        if (full) {
          if (d * redCount * (redCount + blueCount) < SCAN_COMPLETE_CUTOFF) {
            retval = sweep.scanComplete(
              d,
              axis,
              visit,
              redStart,
              redEnd,
              red,
              redIndex,
              blueStart,
              blueEnd,
              blue,
              blueIndex
            );
            if (retval !== void 0) {
              return retval;
            }
            continue;
          }
        } else {
          if (d * Math.min(redCount, blueCount) < BRUTE_FORCE_CUTOFF) {
            retval = bruteForcePartial(
              d,
              axis,
              visit,
              flip,
              redStart,
              redEnd,
              red,
              redIndex,
              blueStart,
              blueEnd,
              blue,
              blueIndex
            );
            if (retval !== void 0) {
              return retval;
            }
            continue;
          } else if (d * redCount * blueCount < SCAN_CUTOFF) {
            retval = sweep.scanBipartite(
              d,
              axis,
              visit,
              flip,
              redStart,
              redEnd,
              red,
              redIndex,
              blueStart,
              blueEnd,
              blue,
              blueIndex
            );
            if (retval !== void 0) {
              return retval;
            }
            continue;
          }
        }
        var red0 = partitionInteriorContainsInterval(
          d,
          axis,
          redStart,
          redEnd,
          red,
          redIndex,
          lo,
          hi
        );
        if (redStart < red0) {
          if (d * (red0 - redStart) < BRUTE_FORCE_CUTOFF) {
            retval = bruteForceFull(
              d,
              axis + 1,
              visit,
              redStart,
              red0,
              red,
              redIndex,
              blueStart,
              blueEnd,
              blue,
              blueIndex
            );
            if (retval !== void 0) {
              return retval;
            }
          } else if (axis === d - 2) {
            if (flip) {
              retval = sweep.sweepBipartite(
                d,
                visit,
                blueStart,
                blueEnd,
                blue,
                blueIndex,
                redStart,
                red0,
                red,
                redIndex
              );
            } else {
              retval = sweep.sweepBipartite(
                d,
                visit,
                redStart,
                red0,
                red,
                redIndex,
                blueStart,
                blueEnd,
                blue,
                blueIndex
              );
            }
            if (retval !== void 0) {
              return retval;
            }
          } else {
            iterPush(
              top++,
              axis + 1,
              redStart,
              red0,
              blueStart,
              blueEnd,
              flip,
              -Infinity,
              Infinity
            );
            iterPush(
              top++,
              axis + 1,
              blueStart,
              blueEnd,
              redStart,
              red0,
              flip ^ 1,
              -Infinity,
              Infinity
            );
          }
        }
        if (red0 < redEnd) {
          var blue0 = findMedian(
            d,
            axis,
            blueStart,
            blueEnd,
            blue,
            blueIndex
          );
          var mid = blue[elemSize * blue0 + axis];
          var blue1 = partitionStartEqual(
            d,
            axis,
            blue0,
            blueEnd,
            blue,
            blueIndex,
            mid
          );
          if (blue1 < blueEnd) {
            iterPush(
              top++,
              axis,
              red0,
              redEnd,
              blue1,
              blueEnd,
              (flip | 4) + (full ? 16 : 0),
              mid,
              hi
            );
          }
          if (blueStart < blue0) {
            iterPush(
              top++,
              axis,
              red0,
              redEnd,
              blueStart,
              blue0,
              (flip | 2) + (full ? 16 : 0),
              lo,
              mid
            );
          }
          if (blue0 + 1 === blue1) {
            if (full) {
              retval = onePointFull(
                d,
                axis,
                visit,
                red0,
                redEnd,
                red,
                redIndex,
                blue0,
                blue,
                blueIndex[blue0]
              );
            } else {
              retval = onePointPartial(
                d,
                axis,
                visit,
                flip,
                red0,
                redEnd,
                red,
                redIndex,
                blue0,
                blue,
                blueIndex[blue0]
              );
            }
            if (retval !== void 0) {
              return retval;
            }
          } else if (blue0 < blue1) {
            var red1;
            if (full) {
              red1 = partitionContainsPoint(
                d,
                axis,
                red0,
                redEnd,
                red,
                redIndex,
                mid
              );
              if (red0 < red1) {
                var redX = partitionStartEqual(
                  d,
                  axis,
                  red0,
                  red1,
                  red,
                  redIndex,
                  mid
                );
                if (axis === d - 2) {
                  if (red0 < redX) {
                    retval = sweep.sweepComplete(
                      d,
                      visit,
                      red0,
                      redX,
                      red,
                      redIndex,
                      blue0,
                      blue1,
                      blue,
                      blueIndex
                    );
                    if (retval !== void 0) {
                      return retval;
                    }
                  }
                  if (redX < red1) {
                    retval = sweep.sweepBipartite(
                      d,
                      visit,
                      redX,
                      red1,
                      red,
                      redIndex,
                      blue0,
                      blue1,
                      blue,
                      blueIndex
                    );
                    if (retval !== void 0) {
                      return retval;
                    }
                  }
                } else {
                  if (red0 < redX) {
                    iterPush(
                      top++,
                      axis + 1,
                      red0,
                      redX,
                      blue0,
                      blue1,
                      16,
                      -Infinity,
                      Infinity
                    );
                  }
                  if (redX < red1) {
                    iterPush(
                      top++,
                      axis + 1,
                      redX,
                      red1,
                      blue0,
                      blue1,
                      0,
                      -Infinity,
                      Infinity
                    );
                    iterPush(
                      top++,
                      axis + 1,
                      blue0,
                      blue1,
                      redX,
                      red1,
                      1,
                      -Infinity,
                      Infinity
                    );
                  }
                }
              }
            } else {
              if (flip) {
                red1 = partitionContainsPointProper(
                  d,
                  axis,
                  red0,
                  redEnd,
                  red,
                  redIndex,
                  mid
                );
              } else {
                red1 = partitionContainsPoint(
                  d,
                  axis,
                  red0,
                  redEnd,
                  red,
                  redIndex,
                  mid
                );
              }
              if (red0 < red1) {
                if (axis === d - 2) {
                  if (flip) {
                    retval = sweep.sweepBipartite(
                      d,
                      visit,
                      blue0,
                      blue1,
                      blue,
                      blueIndex,
                      red0,
                      red1,
                      red,
                      redIndex
                    );
                  } else {
                    retval = sweep.sweepBipartite(
                      d,
                      visit,
                      red0,
                      red1,
                      red,
                      redIndex,
                      blue0,
                      blue1,
                      blue,
                      blueIndex
                    );
                  }
                } else {
                  iterPush(
                    top++,
                    axis + 1,
                    red0,
                    red1,
                    blue0,
                    blue1,
                    flip,
                    -Infinity,
                    Infinity
                  );
                  iterPush(
                    top++,
                    axis + 1,
                    blue0,
                    blue1,
                    red0,
                    red1,
                    flip ^ 1,
                    -Infinity,
                    Infinity
                  );
                }
              }
            }
          }
        }
      }
    }
  }
});

// packages/box-intersect/index.js
var require_box_intersect = __commonJS({
  "packages/box-intersect/index.js"(exports, module) {
    "use strict";
    module.exports = boxIntersectWrapper;
    var pool = require_pool();
    var sweep = require_sweep();
    var boxIntersectIter = require_intersect();
    function boxEmpty(d, box) {
      for (var j = 0; j < d; ++j) {
        if (!(box[j] <= box[j + d])) {
          return true;
        }
      }
      return false;
    }
    function convertBoxes(boxes, d, data2, ids) {
      var ptr = 0;
      var count = 0;
      for (var i = 0, n = boxes.length; i < n; ++i) {
        var b = boxes[i];
        if (boxEmpty(d, b)) {
          continue;
        }
        for (var j = 0; j < 2 * d; ++j) {
          data2[ptr++] = b[j];
        }
        ids[count++] = i;
      }
      return count;
    }
    function boxIntersect(red, blue, visit, full) {
      var n = red.length;
      var m = blue.length;
      if (n <= 0 || m <= 0) {
        return;
      }
      var d = red[0].length >>> 1;
      if (d <= 0) {
        return;
      }
      var retval;
      var redList = pool.mallocDouble(2 * d * n);
      var redIds = pool.mallocInt32(n);
      n = convertBoxes(red, d, redList, redIds);
      if (n > 0) {
        if (d === 1 && full) {
          sweep.init(n);
          retval = sweep.sweepComplete(
            d,
            visit,
            0,
            n,
            redList,
            redIds,
            0,
            n,
            redList,
            redIds
          );
        } else {
          var blueList = pool.mallocDouble(2 * d * m);
          var blueIds = pool.mallocInt32(m);
          m = convertBoxes(blue, d, blueList, blueIds);
          if (m > 0) {
            sweep.init(n + m);
            if (d === 1) {
              retval = sweep.sweepBipartite(
                d,
                visit,
                0,
                n,
                redList,
                redIds,
                0,
                m,
                blueList,
                blueIds
              );
            } else {
              retval = boxIntersectIter(
                d,
                visit,
                full,
                n,
                redList,
                redIds,
                m,
                blueList,
                blueIds
              );
            }
            pool.free(blueList);
            pool.free(blueIds);
          }
        }
        pool.free(redList);
        pool.free(redIds);
      }
      return retval;
    }
    var RESULT;
    function appendItem(i, j) {
      RESULT.push([i, j]);
    }
    function intersectFullArray(x) {
      RESULT = [];
      boxIntersect(x, x, appendItem, true);
      return RESULT;
    }
    function intersectBipartiteArray(x, y) {
      RESULT = [];
      boxIntersect(x, y, appendItem, false);
      return RESULT;
    }
    function boxIntersectWrapper(arg0, arg1, arg2) {
      var result;
      switch (arguments.length) {
        case 1:
          return intersectFullArray(arg0);
        case 2:
          if (typeof arg1 === "function") {
            return boxIntersect(arg0, arg0, arg1, true);
          } else {
            return intersectBipartiteArray(arg0, arg1);
          }
        case 3:
          return boxIntersect(arg0, arg1, arg2, false);
        default:
          throw new Error("box-intersect: Invalid arguments");
      }
    }
  }
});

// node_modules/robust-segment-intersect/segseg.js
var require_segseg = __commonJS({
  "node_modules/robust-segment-intersect/segseg.js"(exports, module) {
    "use strict";
    module.exports = segmentsIntersect;
    var orient = require_orientation()[3];
    function checkCollinear(a0, a1, b0, b1) {
      for (var d = 0; d < 2; ++d) {
        var x0 = a0[d];
        var y0 = a1[d];
        var l0 = Math.min(x0, y0);
        var h0 = Math.max(x0, y0);
        var x1 = b0[d];
        var y1 = b1[d];
        var l1 = Math.min(x1, y1);
        var h1 = Math.max(x1, y1);
        if (h1 < l0 || h0 < l1) {
          return false;
        }
      }
      return true;
    }
    function segmentsIntersect(a0, a1, b0, b1) {
      var x0 = orient(a0, b0, b1);
      var y0 = orient(a1, b0, b1);
      if (x0 > 0 && y0 > 0 || x0 < 0 && y0 < 0) {
        return false;
      }
      var x1 = orient(b0, a0, a1);
      var y1 = orient(b1, a0, a1);
      if (x1 > 0 && y1 > 0 || x1 < 0 && y1 < 0) {
        return false;
      }
      if (x0 === 0 && y0 === 0 && x1 === 0 && y1 === 0) {
        return checkCollinear(a0, a1, b0, b1);
      }
      return true;
    }
  }
});

// (disabled):buffer
var require_buffer = __commonJS({
  "(disabled):buffer"() {
  }
});

// node_modules/bn.js/lib/bn.js
var require_bn = __commonJS({
  "node_modules/bn.js/lib/bn.js"(exports, module) {
    (function(module2, exports2) {
      "use strict";
      function assert(val, msg) {
        if (!val) throw new Error(msg || "Assertion failed");
      }
      function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;
        var TempCtor = function() {
        };
        TempCtor.prototype = superCtor.prototype;
        ctor.prototype = new TempCtor();
        ctor.prototype.constructor = ctor;
      }
      function BN(number, base, endian) {
        if (BN.isBN(number)) {
          return number;
        }
        this.negative = 0;
        this.words = null;
        this.length = 0;
        this.red = null;
        if (number !== null) {
          if (base === "le" || base === "be") {
            endian = base;
            base = 10;
          }
          this._init(number || 0, base || 10, endian || "be");
        }
      }
      if (typeof module2 === "object") {
        module2.exports = BN;
      } else {
        exports2.BN = BN;
      }
      BN.BN = BN;
      BN.wordSize = 26;
      var Buffer2;
      try {
        if (typeof window !== "undefined" && typeof window.Buffer !== "undefined") {
          Buffer2 = window.Buffer;
        } else {
          Buffer2 = require_buffer().Buffer;
        }
      } catch (e) {
      }
      BN.isBN = function isBN(num) {
        if (num instanceof BN) {
          return true;
        }
        return num !== null && typeof num === "object" && num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
      };
      BN.max = function max(left, right) {
        if (left.cmp(right) > 0) return left;
        return right;
      };
      BN.min = function min(left, right) {
        if (left.cmp(right) < 0) return left;
        return right;
      };
      BN.prototype._init = function init15(number, base, endian) {
        if (typeof number === "number") {
          return this._initNumber(number, base, endian);
        }
        if (typeof number === "object") {
          return this._initArray(number, base, endian);
        }
        if (base === "hex") {
          base = 16;
        }
        assert(base === (base | 0) && base >= 2 && base <= 36);
        number = number.toString().replace(/\s+/g, "");
        var start = 0;
        if (number[0] === "-") {
          start++;
          this.negative = 1;
        }
        if (start < number.length) {
          if (base === 16) {
            this._parseHex(number, start, endian);
          } else {
            this._parseBase(number, base, start);
            if (endian === "le") {
              this._initArray(this.toArray(), base, endian);
            }
          }
        }
      };
      BN.prototype._initNumber = function _initNumber(number, base, endian) {
        if (number < 0) {
          this.negative = 1;
          number = -number;
        }
        if (number < 67108864) {
          this.words = [number & 67108863];
          this.length = 1;
        } else if (number < 4503599627370496) {
          this.words = [
            number & 67108863,
            number / 67108864 & 67108863
          ];
          this.length = 2;
        } else {
          assert(number < 9007199254740992);
          this.words = [
            number & 67108863,
            number / 67108864 & 67108863,
            1
          ];
          this.length = 3;
        }
        if (endian !== "le") return;
        this._initArray(this.toArray(), base, endian);
      };
      BN.prototype._initArray = function _initArray(number, base, endian) {
        assert(typeof number.length === "number");
        if (number.length <= 0) {
          this.words = [0];
          this.length = 1;
          return this;
        }
        this.length = Math.ceil(number.length / 3);
        this.words = new Array(this.length);
        for (var i = 0; i < this.length; i++) {
          this.words[i] = 0;
        }
        var j, w;
        var off = 0;
        if (endian === "be") {
          for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
            w = number[i] | number[i - 1] << 8 | number[i - 2] << 16;
            this.words[j] |= w << off & 67108863;
            this.words[j + 1] = w >>> 26 - off & 67108863;
            off += 24;
            if (off >= 26) {
              off -= 26;
              j++;
            }
          }
        } else if (endian === "le") {
          for (i = 0, j = 0; i < number.length; i += 3) {
            w = number[i] | number[i + 1] << 8 | number[i + 2] << 16;
            this.words[j] |= w << off & 67108863;
            this.words[j + 1] = w >>> 26 - off & 67108863;
            off += 24;
            if (off >= 26) {
              off -= 26;
              j++;
            }
          }
        }
        return this.strip();
      };
      function parseHex4Bits(string, index) {
        var c = string.charCodeAt(index);
        if (c >= 65 && c <= 70) {
          return c - 55;
        } else if (c >= 97 && c <= 102) {
          return c - 87;
        } else {
          return c - 48 & 15;
        }
      }
      function parseHexByte(string, lowerBound, index) {
        var r = parseHex4Bits(string, index);
        if (index - 1 >= lowerBound) {
          r |= parseHex4Bits(string, index - 1) << 4;
        }
        return r;
      }
      BN.prototype._parseHex = function _parseHex(number, start, endian) {
        this.length = Math.ceil((number.length - start) / 6);
        this.words = new Array(this.length);
        for (var i = 0; i < this.length; i++) {
          this.words[i] = 0;
        }
        var off = 0;
        var j = 0;
        var w;
        if (endian === "be") {
          for (i = number.length - 1; i >= start; i -= 2) {
            w = parseHexByte(number, start, i) << off;
            this.words[j] |= w & 67108863;
            if (off >= 18) {
              off -= 18;
              j += 1;
              this.words[j] |= w >>> 26;
            } else {
              off += 8;
            }
          }
        } else {
          var parseLength = number.length - start;
          for (i = parseLength % 2 === 0 ? start + 1 : start; i < number.length; i += 2) {
            w = parseHexByte(number, start, i) << off;
            this.words[j] |= w & 67108863;
            if (off >= 18) {
              off -= 18;
              j += 1;
              this.words[j] |= w >>> 26;
            } else {
              off += 8;
            }
          }
        }
        this.strip();
      };
      function parseBase(str, start, end, mul) {
        var r = 0;
        var len = Math.min(str.length, end);
        for (var i = start; i < len; i++) {
          var c = str.charCodeAt(i) - 48;
          r *= mul;
          if (c >= 49) {
            r += c - 49 + 10;
          } else if (c >= 17) {
            r += c - 17 + 10;
          } else {
            r += c;
          }
        }
        return r;
      }
      BN.prototype._parseBase = function _parseBase(number, base, start) {
        this.words = [0];
        this.length = 1;
        for (var limbLen = 0, limbPow = 1; limbPow <= 67108863; limbPow *= base) {
          limbLen++;
        }
        limbLen--;
        limbPow = limbPow / base | 0;
        var total = number.length - start;
        var mod = total % limbLen;
        var end = Math.min(total, total - mod) + start;
        var word = 0;
        for (var i = start; i < end; i += limbLen) {
          word = parseBase(number, i, i + limbLen, base);
          this.imuln(limbPow);
          if (this.words[0] + word < 67108864) {
            this.words[0] += word;
          } else {
            this._iaddn(word);
          }
        }
        if (mod !== 0) {
          var pow = 1;
          word = parseBase(number, i, number.length, base);
          for (i = 0; i < mod; i++) {
            pow *= base;
          }
          this.imuln(pow);
          if (this.words[0] + word < 67108864) {
            this.words[0] += word;
          } else {
            this._iaddn(word);
          }
        }
        this.strip();
      };
      BN.prototype.copy = function copy(dest) {
        dest.words = new Array(this.length);
        for (var i = 0; i < this.length; i++) {
          dest.words[i] = this.words[i];
        }
        dest.length = this.length;
        dest.negative = this.negative;
        dest.red = this.red;
      };
      BN.prototype.clone = function clone() {
        var r = new BN(null);
        this.copy(r);
        return r;
      };
      BN.prototype._expand = function _expand(size) {
        while (this.length < size) {
          this.words[this.length++] = 0;
        }
        return this;
      };
      BN.prototype.strip = function strip() {
        while (this.length > 1 && this.words[this.length - 1] === 0) {
          this.length--;
        }
        return this._normSign();
      };
      BN.prototype._normSign = function _normSign() {
        if (this.length === 1 && this.words[0] === 0) {
          this.negative = 0;
        }
        return this;
      };
      BN.prototype.inspect = function inspect() {
        return (this.red ? "<BN-R: " : "<BN: ") + this.toString(16) + ">";
      };
      var zeros = [
        "",
        "0",
        "00",
        "000",
        "0000",
        "00000",
        "000000",
        "0000000",
        "00000000",
        "000000000",
        "0000000000",
        "00000000000",
        "000000000000",
        "0000000000000",
        "00000000000000",
        "000000000000000",
        "0000000000000000",
        "00000000000000000",
        "000000000000000000",
        "0000000000000000000",
        "00000000000000000000",
        "000000000000000000000",
        "0000000000000000000000",
        "00000000000000000000000",
        "000000000000000000000000",
        "0000000000000000000000000"
      ];
      var groupSizes = [
        0,
        0,
        25,
        16,
        12,
        11,
        10,
        9,
        8,
        8,
        7,
        7,
        7,
        7,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5
      ];
      var groupBases = [
        0,
        0,
        33554432,
        43046721,
        16777216,
        48828125,
        60466176,
        40353607,
        16777216,
        43046721,
        1e7,
        19487171,
        35831808,
        62748517,
        7529536,
        11390625,
        16777216,
        24137569,
        34012224,
        47045881,
        64e6,
        4084101,
        5153632,
        6436343,
        7962624,
        9765625,
        11881376,
        14348907,
        17210368,
        20511149,
        243e5,
        28629151,
        33554432,
        39135393,
        45435424,
        52521875,
        60466176
      ];
      BN.prototype.toString = function toString(base, padding) {
        base = base || 10;
        padding = padding | 0 || 1;
        var out;
        if (base === 16 || base === "hex") {
          out = "";
          var off = 0;
          var carry = 0;
          for (var i = 0; i < this.length; i++) {
            var w = this.words[i];
            var word = ((w << off | carry) & 16777215).toString(16);
            carry = w >>> 24 - off & 16777215;
            off += 2;
            if (off >= 26) {
              off -= 26;
              i--;
            }
            if (carry !== 0 || i !== this.length - 1) {
              out = zeros[6 - word.length] + word + out;
            } else {
              out = word + out;
            }
          }
          if (carry !== 0) {
            out = carry.toString(16) + out;
          }
          while (out.length % padding !== 0) {
            out = "0" + out;
          }
          if (this.negative !== 0) {
            out = "-" + out;
          }
          return out;
        }
        if (base === (base | 0) && base >= 2 && base <= 36) {
          var groupSize = groupSizes[base];
          var groupBase = groupBases[base];
          out = "";
          var c = this.clone();
          c.negative = 0;
          while (!c.isZero()) {
            var r = c.modn(groupBase).toString(base);
            c = c.idivn(groupBase);
            if (!c.isZero()) {
              out = zeros[groupSize - r.length] + r + out;
            } else {
              out = r + out;
            }
          }
          if (this.isZero()) {
            out = "0" + out;
          }
          while (out.length % padding !== 0) {
            out = "0" + out;
          }
          if (this.negative !== 0) {
            out = "-" + out;
          }
          return out;
        }
        assert(false, "Base should be between 2 and 36");
      };
      BN.prototype.toNumber = function toNumber() {
        var ret = this.words[0];
        if (this.length === 2) {
          ret += this.words[1] * 67108864;
        } else if (this.length === 3 && this.words[2] === 1) {
          ret += 4503599627370496 + this.words[1] * 67108864;
        } else if (this.length > 2) {
          assert(false, "Number can only safely store up to 53 bits");
        }
        return this.negative !== 0 ? -ret : ret;
      };
      BN.prototype.toJSON = function toJSON() {
        return this.toString(16);
      };
      BN.prototype.toBuffer = function toBuffer(endian, length) {
        assert(typeof Buffer2 !== "undefined");
        return this.toArrayLike(Buffer2, endian, length);
      };
      BN.prototype.toArray = function toArray(endian, length) {
        return this.toArrayLike(Array, endian, length);
      };
      BN.prototype.toArrayLike = function toArrayLike(ArrayType, endian, length) {
        var byteLength = this.byteLength();
        var reqLength = length || Math.max(1, byteLength);
        assert(byteLength <= reqLength, "byte array longer than desired length");
        assert(reqLength > 0, "Requested array length <= 0");
        this.strip();
        var littleEndian = endian === "le";
        var res = new ArrayType(reqLength);
        var b, i;
        var q = this.clone();
        if (!littleEndian) {
          for (i = 0; i < reqLength - byteLength; i++) {
            res[i] = 0;
          }
          for (i = 0; !q.isZero(); i++) {
            b = q.andln(255);
            q.iushrn(8);
            res[reqLength - i - 1] = b;
          }
        } else {
          for (i = 0; !q.isZero(); i++) {
            b = q.andln(255);
            q.iushrn(8);
            res[i] = b;
          }
          for (; i < reqLength; i++) {
            res[i] = 0;
          }
        }
        return res;
      };
      if (Math.clz32) {
        BN.prototype._countBits = function _countBits(w) {
          return 32 - Math.clz32(w);
        };
      } else {
        BN.prototype._countBits = function _countBits(w) {
          var t = w;
          var r = 0;
          if (t >= 4096) {
            r += 13;
            t >>>= 13;
          }
          if (t >= 64) {
            r += 7;
            t >>>= 7;
          }
          if (t >= 8) {
            r += 4;
            t >>>= 4;
          }
          if (t >= 2) {
            r += 2;
            t >>>= 2;
          }
          return r + t;
        };
      }
      BN.prototype._zeroBits = function _zeroBits(w) {
        if (w === 0) return 26;
        var t = w;
        var r = 0;
        if ((t & 8191) === 0) {
          r += 13;
          t >>>= 13;
        }
        if ((t & 127) === 0) {
          r += 7;
          t >>>= 7;
        }
        if ((t & 15) === 0) {
          r += 4;
          t >>>= 4;
        }
        if ((t & 3) === 0) {
          r += 2;
          t >>>= 2;
        }
        if ((t & 1) === 0) {
          r++;
        }
        return r;
      };
      BN.prototype.bitLength = function bitLength() {
        var w = this.words[this.length - 1];
        var hi = this._countBits(w);
        return (this.length - 1) * 26 + hi;
      };
      function toBitArray(num) {
        var w = new Array(num.bitLength());
        for (var bit = 0; bit < w.length; bit++) {
          var off = bit / 26 | 0;
          var wbit = bit % 26;
          w[bit] = (num.words[off] & 1 << wbit) >>> wbit;
        }
        return w;
      }
      BN.prototype.zeroBits = function zeroBits() {
        if (this.isZero()) return 0;
        var r = 0;
        for (var i = 0; i < this.length; i++) {
          var b = this._zeroBits(this.words[i]);
          r += b;
          if (b !== 26) break;
        }
        return r;
      };
      BN.prototype.byteLength = function byteLength() {
        return Math.ceil(this.bitLength() / 8);
      };
      BN.prototype.toTwos = function toTwos(width) {
        if (this.negative !== 0) {
          return this.abs().inotn(width).iaddn(1);
        }
        return this.clone();
      };
      BN.prototype.fromTwos = function fromTwos(width) {
        if (this.testn(width - 1)) {
          return this.notn(width).iaddn(1).ineg();
        }
        return this.clone();
      };
      BN.prototype.isNeg = function isNeg() {
        return this.negative !== 0;
      };
      BN.prototype.neg = function neg() {
        return this.clone().ineg();
      };
      BN.prototype.ineg = function ineg() {
        if (!this.isZero()) {
          this.negative ^= 1;
        }
        return this;
      };
      BN.prototype.iuor = function iuor(num) {
        while (this.length < num.length) {
          this.words[this.length++] = 0;
        }
        for (var i = 0; i < num.length; i++) {
          this.words[i] = this.words[i] | num.words[i];
        }
        return this.strip();
      };
      BN.prototype.ior = function ior(num) {
        assert((this.negative | num.negative) === 0);
        return this.iuor(num);
      };
      BN.prototype.or = function or(num) {
        if (this.length > num.length) return this.clone().ior(num);
        return num.clone().ior(this);
      };
      BN.prototype.uor = function uor(num) {
        if (this.length > num.length) return this.clone().iuor(num);
        return num.clone().iuor(this);
      };
      BN.prototype.iuand = function iuand(num) {
        var b;
        if (this.length > num.length) {
          b = num;
        } else {
          b = this;
        }
        for (var i = 0; i < b.length; i++) {
          this.words[i] = this.words[i] & num.words[i];
        }
        this.length = b.length;
        return this.strip();
      };
      BN.prototype.iand = function iand(num) {
        assert((this.negative | num.negative) === 0);
        return this.iuand(num);
      };
      BN.prototype.and = function and(num) {
        if (this.length > num.length) return this.clone().iand(num);
        return num.clone().iand(this);
      };
      BN.prototype.uand = function uand(num) {
        if (this.length > num.length) return this.clone().iuand(num);
        return num.clone().iuand(this);
      };
      BN.prototype.iuxor = function iuxor(num) {
        var a;
        var b;
        if (this.length > num.length) {
          a = this;
          b = num;
        } else {
          a = num;
          b = this;
        }
        for (var i = 0; i < b.length; i++) {
          this.words[i] = a.words[i] ^ b.words[i];
        }
        if (this !== a) {
          for (; i < a.length; i++) {
            this.words[i] = a.words[i];
          }
        }
        this.length = a.length;
        return this.strip();
      };
      BN.prototype.ixor = function ixor(num) {
        assert((this.negative | num.negative) === 0);
        return this.iuxor(num);
      };
      BN.prototype.xor = function xor(num) {
        if (this.length > num.length) return this.clone().ixor(num);
        return num.clone().ixor(this);
      };
      BN.prototype.uxor = function uxor(num) {
        if (this.length > num.length) return this.clone().iuxor(num);
        return num.clone().iuxor(this);
      };
      BN.prototype.inotn = function inotn(width) {
        assert(typeof width === "number" && width >= 0);
        var bytesNeeded = Math.ceil(width / 26) | 0;
        var bitsLeft = width % 26;
        this._expand(bytesNeeded);
        if (bitsLeft > 0) {
          bytesNeeded--;
        }
        for (var i = 0; i < bytesNeeded; i++) {
          this.words[i] = ~this.words[i] & 67108863;
        }
        if (bitsLeft > 0) {
          this.words[i] = ~this.words[i] & 67108863 >> 26 - bitsLeft;
        }
        return this.strip();
      };
      BN.prototype.notn = function notn(width) {
        return this.clone().inotn(width);
      };
      BN.prototype.setn = function setn(bit, val) {
        assert(typeof bit === "number" && bit >= 0);
        var off = bit / 26 | 0;
        var wbit = bit % 26;
        this._expand(off + 1);
        if (val) {
          this.words[off] = this.words[off] | 1 << wbit;
        } else {
          this.words[off] = this.words[off] & ~(1 << wbit);
        }
        return this.strip();
      };
      BN.prototype.iadd = function iadd(num) {
        var r;
        if (this.negative !== 0 && num.negative === 0) {
          this.negative = 0;
          r = this.isub(num);
          this.negative ^= 1;
          return this._normSign();
        } else if (this.negative === 0 && num.negative !== 0) {
          num.negative = 0;
          r = this.isub(num);
          num.negative = 1;
          return r._normSign();
        }
        var a, b;
        if (this.length > num.length) {
          a = this;
          b = num;
        } else {
          a = num;
          b = this;
        }
        var carry = 0;
        for (var i = 0; i < b.length; i++) {
          r = (a.words[i] | 0) + (b.words[i] | 0) + carry;
          this.words[i] = r & 67108863;
          carry = r >>> 26;
        }
        for (; carry !== 0 && i < a.length; i++) {
          r = (a.words[i] | 0) + carry;
          this.words[i] = r & 67108863;
          carry = r >>> 26;
        }
        this.length = a.length;
        if (carry !== 0) {
          this.words[this.length] = carry;
          this.length++;
        } else if (a !== this) {
          for (; i < a.length; i++) {
            this.words[i] = a.words[i];
          }
        }
        return this;
      };
      BN.prototype.add = function add(num) {
        var res;
        if (num.negative !== 0 && this.negative === 0) {
          num.negative = 0;
          res = this.sub(num);
          num.negative ^= 1;
          return res;
        } else if (num.negative === 0 && this.negative !== 0) {
          this.negative = 0;
          res = num.sub(this);
          this.negative = 1;
          return res;
        }
        if (this.length > num.length) return this.clone().iadd(num);
        return num.clone().iadd(this);
      };
      BN.prototype.isub = function isub(num) {
        if (num.negative !== 0) {
          num.negative = 0;
          var r = this.iadd(num);
          num.negative = 1;
          return r._normSign();
        } else if (this.negative !== 0) {
          this.negative = 0;
          this.iadd(num);
          this.negative = 1;
          return this._normSign();
        }
        var cmp = this.cmp(num);
        if (cmp === 0) {
          this.negative = 0;
          this.length = 1;
          this.words[0] = 0;
          return this;
        }
        var a, b;
        if (cmp > 0) {
          a = this;
          b = num;
        } else {
          a = num;
          b = this;
        }
        var carry = 0;
        for (var i = 0; i < b.length; i++) {
          r = (a.words[i] | 0) - (b.words[i] | 0) + carry;
          carry = r >> 26;
          this.words[i] = r & 67108863;
        }
        for (; carry !== 0 && i < a.length; i++) {
          r = (a.words[i] | 0) + carry;
          carry = r >> 26;
          this.words[i] = r & 67108863;
        }
        if (carry === 0 && i < a.length && a !== this) {
          for (; i < a.length; i++) {
            this.words[i] = a.words[i];
          }
        }
        this.length = Math.max(this.length, i);
        if (a !== this) {
          this.negative = 1;
        }
        return this.strip();
      };
      BN.prototype.sub = function sub(num) {
        return this.clone().isub(num);
      };
      function smallMulTo(self, num, out) {
        out.negative = num.negative ^ self.negative;
        var len = self.length + num.length | 0;
        out.length = len;
        len = len - 1 | 0;
        var a = self.words[0] | 0;
        var b = num.words[0] | 0;
        var r = a * b;
        var lo = r & 67108863;
        var carry = r / 67108864 | 0;
        out.words[0] = lo;
        for (var k = 1; k < len; k++) {
          var ncarry = carry >>> 26;
          var rword = carry & 67108863;
          var maxJ = Math.min(k, num.length - 1);
          for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
            var i = k - j | 0;
            a = self.words[i] | 0;
            b = num.words[j] | 0;
            r = a * b + rword;
            ncarry += r / 67108864 | 0;
            rword = r & 67108863;
          }
          out.words[k] = rword | 0;
          carry = ncarry | 0;
        }
        if (carry !== 0) {
          out.words[k] = carry | 0;
        } else {
          out.length--;
        }
        return out.strip();
      }
      var comb10MulTo = function comb10MulTo2(self, num, out) {
        var a = self.words;
        var b = num.words;
        var o = out.words;
        var c = 0;
        var lo;
        var mid;
        var hi;
        var a0 = a[0] | 0;
        var al0 = a0 & 8191;
        var ah0 = a0 >>> 13;
        var a1 = a[1] | 0;
        var al1 = a1 & 8191;
        var ah1 = a1 >>> 13;
        var a2 = a[2] | 0;
        var al2 = a2 & 8191;
        var ah2 = a2 >>> 13;
        var a3 = a[3] | 0;
        var al3 = a3 & 8191;
        var ah3 = a3 >>> 13;
        var a4 = a[4] | 0;
        var al4 = a4 & 8191;
        var ah4 = a4 >>> 13;
        var a5 = a[5] | 0;
        var al5 = a5 & 8191;
        var ah5 = a5 >>> 13;
        var a6 = a[6] | 0;
        var al6 = a6 & 8191;
        var ah6 = a6 >>> 13;
        var a7 = a[7] | 0;
        var al7 = a7 & 8191;
        var ah7 = a7 >>> 13;
        var a8 = a[8] | 0;
        var al8 = a8 & 8191;
        var ah8 = a8 >>> 13;
        var a9 = a[9] | 0;
        var al9 = a9 & 8191;
        var ah9 = a9 >>> 13;
        var b0 = b[0] | 0;
        var bl0 = b0 & 8191;
        var bh0 = b0 >>> 13;
        var b1 = b[1] | 0;
        var bl1 = b1 & 8191;
        var bh1 = b1 >>> 13;
        var b2 = b[2] | 0;
        var bl2 = b2 & 8191;
        var bh2 = b2 >>> 13;
        var b3 = b[3] | 0;
        var bl3 = b3 & 8191;
        var bh3 = b3 >>> 13;
        var b4 = b[4] | 0;
        var bl4 = b4 & 8191;
        var bh4 = b4 >>> 13;
        var b5 = b[5] | 0;
        var bl5 = b5 & 8191;
        var bh5 = b5 >>> 13;
        var b6 = b[6] | 0;
        var bl6 = b6 & 8191;
        var bh6 = b6 >>> 13;
        var b7 = b[7] | 0;
        var bl7 = b7 & 8191;
        var bh7 = b7 >>> 13;
        var b8 = b[8] | 0;
        var bl8 = b8 & 8191;
        var bh8 = b8 >>> 13;
        var b9 = b[9] | 0;
        var bl9 = b9 & 8191;
        var bh9 = b9 >>> 13;
        out.negative = self.negative ^ num.negative;
        out.length = 19;
        lo = Math.imul(al0, bl0);
        mid = Math.imul(al0, bh0);
        mid = mid + Math.imul(ah0, bl0) | 0;
        hi = Math.imul(ah0, bh0);
        var w0 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w0 >>> 26) | 0;
        w0 &= 67108863;
        lo = Math.imul(al1, bl0);
        mid = Math.imul(al1, bh0);
        mid = mid + Math.imul(ah1, bl0) | 0;
        hi = Math.imul(ah1, bh0);
        lo = lo + Math.imul(al0, bl1) | 0;
        mid = mid + Math.imul(al0, bh1) | 0;
        mid = mid + Math.imul(ah0, bl1) | 0;
        hi = hi + Math.imul(ah0, bh1) | 0;
        var w1 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w1 >>> 26) | 0;
        w1 &= 67108863;
        lo = Math.imul(al2, bl0);
        mid = Math.imul(al2, bh0);
        mid = mid + Math.imul(ah2, bl0) | 0;
        hi = Math.imul(ah2, bh0);
        lo = lo + Math.imul(al1, bl1) | 0;
        mid = mid + Math.imul(al1, bh1) | 0;
        mid = mid + Math.imul(ah1, bl1) | 0;
        hi = hi + Math.imul(ah1, bh1) | 0;
        lo = lo + Math.imul(al0, bl2) | 0;
        mid = mid + Math.imul(al0, bh2) | 0;
        mid = mid + Math.imul(ah0, bl2) | 0;
        hi = hi + Math.imul(ah0, bh2) | 0;
        var w2 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w2 >>> 26) | 0;
        w2 &= 67108863;
        lo = Math.imul(al3, bl0);
        mid = Math.imul(al3, bh0);
        mid = mid + Math.imul(ah3, bl0) | 0;
        hi = Math.imul(ah3, bh0);
        lo = lo + Math.imul(al2, bl1) | 0;
        mid = mid + Math.imul(al2, bh1) | 0;
        mid = mid + Math.imul(ah2, bl1) | 0;
        hi = hi + Math.imul(ah2, bh1) | 0;
        lo = lo + Math.imul(al1, bl2) | 0;
        mid = mid + Math.imul(al1, bh2) | 0;
        mid = mid + Math.imul(ah1, bl2) | 0;
        hi = hi + Math.imul(ah1, bh2) | 0;
        lo = lo + Math.imul(al0, bl3) | 0;
        mid = mid + Math.imul(al0, bh3) | 0;
        mid = mid + Math.imul(ah0, bl3) | 0;
        hi = hi + Math.imul(ah0, bh3) | 0;
        var w3 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w3 >>> 26) | 0;
        w3 &= 67108863;
        lo = Math.imul(al4, bl0);
        mid = Math.imul(al4, bh0);
        mid = mid + Math.imul(ah4, bl0) | 0;
        hi = Math.imul(ah4, bh0);
        lo = lo + Math.imul(al3, bl1) | 0;
        mid = mid + Math.imul(al3, bh1) | 0;
        mid = mid + Math.imul(ah3, bl1) | 0;
        hi = hi + Math.imul(ah3, bh1) | 0;
        lo = lo + Math.imul(al2, bl2) | 0;
        mid = mid + Math.imul(al2, bh2) | 0;
        mid = mid + Math.imul(ah2, bl2) | 0;
        hi = hi + Math.imul(ah2, bh2) | 0;
        lo = lo + Math.imul(al1, bl3) | 0;
        mid = mid + Math.imul(al1, bh3) | 0;
        mid = mid + Math.imul(ah1, bl3) | 0;
        hi = hi + Math.imul(ah1, bh3) | 0;
        lo = lo + Math.imul(al0, bl4) | 0;
        mid = mid + Math.imul(al0, bh4) | 0;
        mid = mid + Math.imul(ah0, bl4) | 0;
        hi = hi + Math.imul(ah0, bh4) | 0;
        var w4 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w4 >>> 26) | 0;
        w4 &= 67108863;
        lo = Math.imul(al5, bl0);
        mid = Math.imul(al5, bh0);
        mid = mid + Math.imul(ah5, bl0) | 0;
        hi = Math.imul(ah5, bh0);
        lo = lo + Math.imul(al4, bl1) | 0;
        mid = mid + Math.imul(al4, bh1) | 0;
        mid = mid + Math.imul(ah4, bl1) | 0;
        hi = hi + Math.imul(ah4, bh1) | 0;
        lo = lo + Math.imul(al3, bl2) | 0;
        mid = mid + Math.imul(al3, bh2) | 0;
        mid = mid + Math.imul(ah3, bl2) | 0;
        hi = hi + Math.imul(ah3, bh2) | 0;
        lo = lo + Math.imul(al2, bl3) | 0;
        mid = mid + Math.imul(al2, bh3) | 0;
        mid = mid + Math.imul(ah2, bl3) | 0;
        hi = hi + Math.imul(ah2, bh3) | 0;
        lo = lo + Math.imul(al1, bl4) | 0;
        mid = mid + Math.imul(al1, bh4) | 0;
        mid = mid + Math.imul(ah1, bl4) | 0;
        hi = hi + Math.imul(ah1, bh4) | 0;
        lo = lo + Math.imul(al0, bl5) | 0;
        mid = mid + Math.imul(al0, bh5) | 0;
        mid = mid + Math.imul(ah0, bl5) | 0;
        hi = hi + Math.imul(ah0, bh5) | 0;
        var w5 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w5 >>> 26) | 0;
        w5 &= 67108863;
        lo = Math.imul(al6, bl0);
        mid = Math.imul(al6, bh0);
        mid = mid + Math.imul(ah6, bl0) | 0;
        hi = Math.imul(ah6, bh0);
        lo = lo + Math.imul(al5, bl1) | 0;
        mid = mid + Math.imul(al5, bh1) | 0;
        mid = mid + Math.imul(ah5, bl1) | 0;
        hi = hi + Math.imul(ah5, bh1) | 0;
        lo = lo + Math.imul(al4, bl2) | 0;
        mid = mid + Math.imul(al4, bh2) | 0;
        mid = mid + Math.imul(ah4, bl2) | 0;
        hi = hi + Math.imul(ah4, bh2) | 0;
        lo = lo + Math.imul(al3, bl3) | 0;
        mid = mid + Math.imul(al3, bh3) | 0;
        mid = mid + Math.imul(ah3, bl3) | 0;
        hi = hi + Math.imul(ah3, bh3) | 0;
        lo = lo + Math.imul(al2, bl4) | 0;
        mid = mid + Math.imul(al2, bh4) | 0;
        mid = mid + Math.imul(ah2, bl4) | 0;
        hi = hi + Math.imul(ah2, bh4) | 0;
        lo = lo + Math.imul(al1, bl5) | 0;
        mid = mid + Math.imul(al1, bh5) | 0;
        mid = mid + Math.imul(ah1, bl5) | 0;
        hi = hi + Math.imul(ah1, bh5) | 0;
        lo = lo + Math.imul(al0, bl6) | 0;
        mid = mid + Math.imul(al0, bh6) | 0;
        mid = mid + Math.imul(ah0, bl6) | 0;
        hi = hi + Math.imul(ah0, bh6) | 0;
        var w6 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w6 >>> 26) | 0;
        w6 &= 67108863;
        lo = Math.imul(al7, bl0);
        mid = Math.imul(al7, bh0);
        mid = mid + Math.imul(ah7, bl0) | 0;
        hi = Math.imul(ah7, bh0);
        lo = lo + Math.imul(al6, bl1) | 0;
        mid = mid + Math.imul(al6, bh1) | 0;
        mid = mid + Math.imul(ah6, bl1) | 0;
        hi = hi + Math.imul(ah6, bh1) | 0;
        lo = lo + Math.imul(al5, bl2) | 0;
        mid = mid + Math.imul(al5, bh2) | 0;
        mid = mid + Math.imul(ah5, bl2) | 0;
        hi = hi + Math.imul(ah5, bh2) | 0;
        lo = lo + Math.imul(al4, bl3) | 0;
        mid = mid + Math.imul(al4, bh3) | 0;
        mid = mid + Math.imul(ah4, bl3) | 0;
        hi = hi + Math.imul(ah4, bh3) | 0;
        lo = lo + Math.imul(al3, bl4) | 0;
        mid = mid + Math.imul(al3, bh4) | 0;
        mid = mid + Math.imul(ah3, bl4) | 0;
        hi = hi + Math.imul(ah3, bh4) | 0;
        lo = lo + Math.imul(al2, bl5) | 0;
        mid = mid + Math.imul(al2, bh5) | 0;
        mid = mid + Math.imul(ah2, bl5) | 0;
        hi = hi + Math.imul(ah2, bh5) | 0;
        lo = lo + Math.imul(al1, bl6) | 0;
        mid = mid + Math.imul(al1, bh6) | 0;
        mid = mid + Math.imul(ah1, bl6) | 0;
        hi = hi + Math.imul(ah1, bh6) | 0;
        lo = lo + Math.imul(al0, bl7) | 0;
        mid = mid + Math.imul(al0, bh7) | 0;
        mid = mid + Math.imul(ah0, bl7) | 0;
        hi = hi + Math.imul(ah0, bh7) | 0;
        var w7 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w7 >>> 26) | 0;
        w7 &= 67108863;
        lo = Math.imul(al8, bl0);
        mid = Math.imul(al8, bh0);
        mid = mid + Math.imul(ah8, bl0) | 0;
        hi = Math.imul(ah8, bh0);
        lo = lo + Math.imul(al7, bl1) | 0;
        mid = mid + Math.imul(al7, bh1) | 0;
        mid = mid + Math.imul(ah7, bl1) | 0;
        hi = hi + Math.imul(ah7, bh1) | 0;
        lo = lo + Math.imul(al6, bl2) | 0;
        mid = mid + Math.imul(al6, bh2) | 0;
        mid = mid + Math.imul(ah6, bl2) | 0;
        hi = hi + Math.imul(ah6, bh2) | 0;
        lo = lo + Math.imul(al5, bl3) | 0;
        mid = mid + Math.imul(al5, bh3) | 0;
        mid = mid + Math.imul(ah5, bl3) | 0;
        hi = hi + Math.imul(ah5, bh3) | 0;
        lo = lo + Math.imul(al4, bl4) | 0;
        mid = mid + Math.imul(al4, bh4) | 0;
        mid = mid + Math.imul(ah4, bl4) | 0;
        hi = hi + Math.imul(ah4, bh4) | 0;
        lo = lo + Math.imul(al3, bl5) | 0;
        mid = mid + Math.imul(al3, bh5) | 0;
        mid = mid + Math.imul(ah3, bl5) | 0;
        hi = hi + Math.imul(ah3, bh5) | 0;
        lo = lo + Math.imul(al2, bl6) | 0;
        mid = mid + Math.imul(al2, bh6) | 0;
        mid = mid + Math.imul(ah2, bl6) | 0;
        hi = hi + Math.imul(ah2, bh6) | 0;
        lo = lo + Math.imul(al1, bl7) | 0;
        mid = mid + Math.imul(al1, bh7) | 0;
        mid = mid + Math.imul(ah1, bl7) | 0;
        hi = hi + Math.imul(ah1, bh7) | 0;
        lo = lo + Math.imul(al0, bl8) | 0;
        mid = mid + Math.imul(al0, bh8) | 0;
        mid = mid + Math.imul(ah0, bl8) | 0;
        hi = hi + Math.imul(ah0, bh8) | 0;
        var w8 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w8 >>> 26) | 0;
        w8 &= 67108863;
        lo = Math.imul(al9, bl0);
        mid = Math.imul(al9, bh0);
        mid = mid + Math.imul(ah9, bl0) | 0;
        hi = Math.imul(ah9, bh0);
        lo = lo + Math.imul(al8, bl1) | 0;
        mid = mid + Math.imul(al8, bh1) | 0;
        mid = mid + Math.imul(ah8, bl1) | 0;
        hi = hi + Math.imul(ah8, bh1) | 0;
        lo = lo + Math.imul(al7, bl2) | 0;
        mid = mid + Math.imul(al7, bh2) | 0;
        mid = mid + Math.imul(ah7, bl2) | 0;
        hi = hi + Math.imul(ah7, bh2) | 0;
        lo = lo + Math.imul(al6, bl3) | 0;
        mid = mid + Math.imul(al6, bh3) | 0;
        mid = mid + Math.imul(ah6, bl3) | 0;
        hi = hi + Math.imul(ah6, bh3) | 0;
        lo = lo + Math.imul(al5, bl4) | 0;
        mid = mid + Math.imul(al5, bh4) | 0;
        mid = mid + Math.imul(ah5, bl4) | 0;
        hi = hi + Math.imul(ah5, bh4) | 0;
        lo = lo + Math.imul(al4, bl5) | 0;
        mid = mid + Math.imul(al4, bh5) | 0;
        mid = mid + Math.imul(ah4, bl5) | 0;
        hi = hi + Math.imul(ah4, bh5) | 0;
        lo = lo + Math.imul(al3, bl6) | 0;
        mid = mid + Math.imul(al3, bh6) | 0;
        mid = mid + Math.imul(ah3, bl6) | 0;
        hi = hi + Math.imul(ah3, bh6) | 0;
        lo = lo + Math.imul(al2, bl7) | 0;
        mid = mid + Math.imul(al2, bh7) | 0;
        mid = mid + Math.imul(ah2, bl7) | 0;
        hi = hi + Math.imul(ah2, bh7) | 0;
        lo = lo + Math.imul(al1, bl8) | 0;
        mid = mid + Math.imul(al1, bh8) | 0;
        mid = mid + Math.imul(ah1, bl8) | 0;
        hi = hi + Math.imul(ah1, bh8) | 0;
        lo = lo + Math.imul(al0, bl9) | 0;
        mid = mid + Math.imul(al0, bh9) | 0;
        mid = mid + Math.imul(ah0, bl9) | 0;
        hi = hi + Math.imul(ah0, bh9) | 0;
        var w9 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w9 >>> 26) | 0;
        w9 &= 67108863;
        lo = Math.imul(al9, bl1);
        mid = Math.imul(al9, bh1);
        mid = mid + Math.imul(ah9, bl1) | 0;
        hi = Math.imul(ah9, bh1);
        lo = lo + Math.imul(al8, bl2) | 0;
        mid = mid + Math.imul(al8, bh2) | 0;
        mid = mid + Math.imul(ah8, bl2) | 0;
        hi = hi + Math.imul(ah8, bh2) | 0;
        lo = lo + Math.imul(al7, bl3) | 0;
        mid = mid + Math.imul(al7, bh3) | 0;
        mid = mid + Math.imul(ah7, bl3) | 0;
        hi = hi + Math.imul(ah7, bh3) | 0;
        lo = lo + Math.imul(al6, bl4) | 0;
        mid = mid + Math.imul(al6, bh4) | 0;
        mid = mid + Math.imul(ah6, bl4) | 0;
        hi = hi + Math.imul(ah6, bh4) | 0;
        lo = lo + Math.imul(al5, bl5) | 0;
        mid = mid + Math.imul(al5, bh5) | 0;
        mid = mid + Math.imul(ah5, bl5) | 0;
        hi = hi + Math.imul(ah5, bh5) | 0;
        lo = lo + Math.imul(al4, bl6) | 0;
        mid = mid + Math.imul(al4, bh6) | 0;
        mid = mid + Math.imul(ah4, bl6) | 0;
        hi = hi + Math.imul(ah4, bh6) | 0;
        lo = lo + Math.imul(al3, bl7) | 0;
        mid = mid + Math.imul(al3, bh7) | 0;
        mid = mid + Math.imul(ah3, bl7) | 0;
        hi = hi + Math.imul(ah3, bh7) | 0;
        lo = lo + Math.imul(al2, bl8) | 0;
        mid = mid + Math.imul(al2, bh8) | 0;
        mid = mid + Math.imul(ah2, bl8) | 0;
        hi = hi + Math.imul(ah2, bh8) | 0;
        lo = lo + Math.imul(al1, bl9) | 0;
        mid = mid + Math.imul(al1, bh9) | 0;
        mid = mid + Math.imul(ah1, bl9) | 0;
        hi = hi + Math.imul(ah1, bh9) | 0;
        var w10 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w10 >>> 26) | 0;
        w10 &= 67108863;
        lo = Math.imul(al9, bl2);
        mid = Math.imul(al9, bh2);
        mid = mid + Math.imul(ah9, bl2) | 0;
        hi = Math.imul(ah9, bh2);
        lo = lo + Math.imul(al8, bl3) | 0;
        mid = mid + Math.imul(al8, bh3) | 0;
        mid = mid + Math.imul(ah8, bl3) | 0;
        hi = hi + Math.imul(ah8, bh3) | 0;
        lo = lo + Math.imul(al7, bl4) | 0;
        mid = mid + Math.imul(al7, bh4) | 0;
        mid = mid + Math.imul(ah7, bl4) | 0;
        hi = hi + Math.imul(ah7, bh4) | 0;
        lo = lo + Math.imul(al6, bl5) | 0;
        mid = mid + Math.imul(al6, bh5) | 0;
        mid = mid + Math.imul(ah6, bl5) | 0;
        hi = hi + Math.imul(ah6, bh5) | 0;
        lo = lo + Math.imul(al5, bl6) | 0;
        mid = mid + Math.imul(al5, bh6) | 0;
        mid = mid + Math.imul(ah5, bl6) | 0;
        hi = hi + Math.imul(ah5, bh6) | 0;
        lo = lo + Math.imul(al4, bl7) | 0;
        mid = mid + Math.imul(al4, bh7) | 0;
        mid = mid + Math.imul(ah4, bl7) | 0;
        hi = hi + Math.imul(ah4, bh7) | 0;
        lo = lo + Math.imul(al3, bl8) | 0;
        mid = mid + Math.imul(al3, bh8) | 0;
        mid = mid + Math.imul(ah3, bl8) | 0;
        hi = hi + Math.imul(ah3, bh8) | 0;
        lo = lo + Math.imul(al2, bl9) | 0;
        mid = mid + Math.imul(al2, bh9) | 0;
        mid = mid + Math.imul(ah2, bl9) | 0;
        hi = hi + Math.imul(ah2, bh9) | 0;
        var w11 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w11 >>> 26) | 0;
        w11 &= 67108863;
        lo = Math.imul(al9, bl3);
        mid = Math.imul(al9, bh3);
        mid = mid + Math.imul(ah9, bl3) | 0;
        hi = Math.imul(ah9, bh3);
        lo = lo + Math.imul(al8, bl4) | 0;
        mid = mid + Math.imul(al8, bh4) | 0;
        mid = mid + Math.imul(ah8, bl4) | 0;
        hi = hi + Math.imul(ah8, bh4) | 0;
        lo = lo + Math.imul(al7, bl5) | 0;
        mid = mid + Math.imul(al7, bh5) | 0;
        mid = mid + Math.imul(ah7, bl5) | 0;
        hi = hi + Math.imul(ah7, bh5) | 0;
        lo = lo + Math.imul(al6, bl6) | 0;
        mid = mid + Math.imul(al6, bh6) | 0;
        mid = mid + Math.imul(ah6, bl6) | 0;
        hi = hi + Math.imul(ah6, bh6) | 0;
        lo = lo + Math.imul(al5, bl7) | 0;
        mid = mid + Math.imul(al5, bh7) | 0;
        mid = mid + Math.imul(ah5, bl7) | 0;
        hi = hi + Math.imul(ah5, bh7) | 0;
        lo = lo + Math.imul(al4, bl8) | 0;
        mid = mid + Math.imul(al4, bh8) | 0;
        mid = mid + Math.imul(ah4, bl8) | 0;
        hi = hi + Math.imul(ah4, bh8) | 0;
        lo = lo + Math.imul(al3, bl9) | 0;
        mid = mid + Math.imul(al3, bh9) | 0;
        mid = mid + Math.imul(ah3, bl9) | 0;
        hi = hi + Math.imul(ah3, bh9) | 0;
        var w12 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w12 >>> 26) | 0;
        w12 &= 67108863;
        lo = Math.imul(al9, bl4);
        mid = Math.imul(al9, bh4);
        mid = mid + Math.imul(ah9, bl4) | 0;
        hi = Math.imul(ah9, bh4);
        lo = lo + Math.imul(al8, bl5) | 0;
        mid = mid + Math.imul(al8, bh5) | 0;
        mid = mid + Math.imul(ah8, bl5) | 0;
        hi = hi + Math.imul(ah8, bh5) | 0;
        lo = lo + Math.imul(al7, bl6) | 0;
        mid = mid + Math.imul(al7, bh6) | 0;
        mid = mid + Math.imul(ah7, bl6) | 0;
        hi = hi + Math.imul(ah7, bh6) | 0;
        lo = lo + Math.imul(al6, bl7) | 0;
        mid = mid + Math.imul(al6, bh7) | 0;
        mid = mid + Math.imul(ah6, bl7) | 0;
        hi = hi + Math.imul(ah6, bh7) | 0;
        lo = lo + Math.imul(al5, bl8) | 0;
        mid = mid + Math.imul(al5, bh8) | 0;
        mid = mid + Math.imul(ah5, bl8) | 0;
        hi = hi + Math.imul(ah5, bh8) | 0;
        lo = lo + Math.imul(al4, bl9) | 0;
        mid = mid + Math.imul(al4, bh9) | 0;
        mid = mid + Math.imul(ah4, bl9) | 0;
        hi = hi + Math.imul(ah4, bh9) | 0;
        var w13 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w13 >>> 26) | 0;
        w13 &= 67108863;
        lo = Math.imul(al9, bl5);
        mid = Math.imul(al9, bh5);
        mid = mid + Math.imul(ah9, bl5) | 0;
        hi = Math.imul(ah9, bh5);
        lo = lo + Math.imul(al8, bl6) | 0;
        mid = mid + Math.imul(al8, bh6) | 0;
        mid = mid + Math.imul(ah8, bl6) | 0;
        hi = hi + Math.imul(ah8, bh6) | 0;
        lo = lo + Math.imul(al7, bl7) | 0;
        mid = mid + Math.imul(al7, bh7) | 0;
        mid = mid + Math.imul(ah7, bl7) | 0;
        hi = hi + Math.imul(ah7, bh7) | 0;
        lo = lo + Math.imul(al6, bl8) | 0;
        mid = mid + Math.imul(al6, bh8) | 0;
        mid = mid + Math.imul(ah6, bl8) | 0;
        hi = hi + Math.imul(ah6, bh8) | 0;
        lo = lo + Math.imul(al5, bl9) | 0;
        mid = mid + Math.imul(al5, bh9) | 0;
        mid = mid + Math.imul(ah5, bl9) | 0;
        hi = hi + Math.imul(ah5, bh9) | 0;
        var w14 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w14 >>> 26) | 0;
        w14 &= 67108863;
        lo = Math.imul(al9, bl6);
        mid = Math.imul(al9, bh6);
        mid = mid + Math.imul(ah9, bl6) | 0;
        hi = Math.imul(ah9, bh6);
        lo = lo + Math.imul(al8, bl7) | 0;
        mid = mid + Math.imul(al8, bh7) | 0;
        mid = mid + Math.imul(ah8, bl7) | 0;
        hi = hi + Math.imul(ah8, bh7) | 0;
        lo = lo + Math.imul(al7, bl8) | 0;
        mid = mid + Math.imul(al7, bh8) | 0;
        mid = mid + Math.imul(ah7, bl8) | 0;
        hi = hi + Math.imul(ah7, bh8) | 0;
        lo = lo + Math.imul(al6, bl9) | 0;
        mid = mid + Math.imul(al6, bh9) | 0;
        mid = mid + Math.imul(ah6, bl9) | 0;
        hi = hi + Math.imul(ah6, bh9) | 0;
        var w15 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w15 >>> 26) | 0;
        w15 &= 67108863;
        lo = Math.imul(al9, bl7);
        mid = Math.imul(al9, bh7);
        mid = mid + Math.imul(ah9, bl7) | 0;
        hi = Math.imul(ah9, bh7);
        lo = lo + Math.imul(al8, bl8) | 0;
        mid = mid + Math.imul(al8, bh8) | 0;
        mid = mid + Math.imul(ah8, bl8) | 0;
        hi = hi + Math.imul(ah8, bh8) | 0;
        lo = lo + Math.imul(al7, bl9) | 0;
        mid = mid + Math.imul(al7, bh9) | 0;
        mid = mid + Math.imul(ah7, bl9) | 0;
        hi = hi + Math.imul(ah7, bh9) | 0;
        var w16 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w16 >>> 26) | 0;
        w16 &= 67108863;
        lo = Math.imul(al9, bl8);
        mid = Math.imul(al9, bh8);
        mid = mid + Math.imul(ah9, bl8) | 0;
        hi = Math.imul(ah9, bh8);
        lo = lo + Math.imul(al8, bl9) | 0;
        mid = mid + Math.imul(al8, bh9) | 0;
        mid = mid + Math.imul(ah8, bl9) | 0;
        hi = hi + Math.imul(ah8, bh9) | 0;
        var w17 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w17 >>> 26) | 0;
        w17 &= 67108863;
        lo = Math.imul(al9, bl9);
        mid = Math.imul(al9, bh9);
        mid = mid + Math.imul(ah9, bl9) | 0;
        hi = Math.imul(ah9, bh9);
        var w18 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w18 >>> 26) | 0;
        w18 &= 67108863;
        o[0] = w0;
        o[1] = w1;
        o[2] = w2;
        o[3] = w3;
        o[4] = w4;
        o[5] = w5;
        o[6] = w6;
        o[7] = w7;
        o[8] = w8;
        o[9] = w9;
        o[10] = w10;
        o[11] = w11;
        o[12] = w12;
        o[13] = w13;
        o[14] = w14;
        o[15] = w15;
        o[16] = w16;
        o[17] = w17;
        o[18] = w18;
        if (c !== 0) {
          o[19] = c;
          out.length++;
        }
        return out;
      };
      if (!Math.imul) {
        comb10MulTo = smallMulTo;
      }
      function bigMulTo(self, num, out) {
        out.negative = num.negative ^ self.negative;
        out.length = self.length + num.length;
        var carry = 0;
        var hncarry = 0;
        for (var k = 0; k < out.length - 1; k++) {
          var ncarry = hncarry;
          hncarry = 0;
          var rword = carry & 67108863;
          var maxJ = Math.min(k, num.length - 1);
          for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
            var i = k - j;
            var a = self.words[i] | 0;
            var b = num.words[j] | 0;
            var r = a * b;
            var lo = r & 67108863;
            ncarry = ncarry + (r / 67108864 | 0) | 0;
            lo = lo + rword | 0;
            rword = lo & 67108863;
            ncarry = ncarry + (lo >>> 26) | 0;
            hncarry += ncarry >>> 26;
            ncarry &= 67108863;
          }
          out.words[k] = rword;
          carry = ncarry;
          ncarry = hncarry;
        }
        if (carry !== 0) {
          out.words[k] = carry;
        } else {
          out.length--;
        }
        return out.strip();
      }
      function jumboMulTo(self, num, out) {
        var fftm = new FFTM();
        return fftm.mulp(self, num, out);
      }
      BN.prototype.mulTo = function mulTo(num, out) {
        var res;
        var len = this.length + num.length;
        if (this.length === 10 && num.length === 10) {
          res = comb10MulTo(this, num, out);
        } else if (len < 63) {
          res = smallMulTo(this, num, out);
        } else if (len < 1024) {
          res = bigMulTo(this, num, out);
        } else {
          res = jumboMulTo(this, num, out);
        }
        return res;
      };
      function FFTM(x, y) {
        this.x = x;
        this.y = y;
      }
      FFTM.prototype.makeRBT = function makeRBT(N) {
        var t = new Array(N);
        var l = BN.prototype._countBits(N) - 1;
        for (var i = 0; i < N; i++) {
          t[i] = this.revBin(i, l, N);
        }
        return t;
      };
      FFTM.prototype.revBin = function revBin(x, l, N) {
        if (x === 0 || x === N - 1) return x;
        var rb = 0;
        for (var i = 0; i < l; i++) {
          rb |= (x & 1) << l - i - 1;
          x >>= 1;
        }
        return rb;
      };
      FFTM.prototype.permute = function permute(rbt, rws, iws, rtws, itws, N) {
        for (var i = 0; i < N; i++) {
          rtws[i] = rws[rbt[i]];
          itws[i] = iws[rbt[i]];
        }
      };
      FFTM.prototype.transform = function transform(rws, iws, rtws, itws, N, rbt) {
        this.permute(rbt, rws, iws, rtws, itws, N);
        for (var s = 1; s < N; s <<= 1) {
          var l = s << 1;
          var rtwdf = Math.cos(2 * Math.PI / l);
          var itwdf = Math.sin(2 * Math.PI / l);
          for (var p = 0; p < N; p += l) {
            var rtwdf_ = rtwdf;
            var itwdf_ = itwdf;
            for (var j = 0; j < s; j++) {
              var re = rtws[p + j];
              var ie = itws[p + j];
              var ro = rtws[p + j + s];
              var io = itws[p + j + s];
              var rx = rtwdf_ * ro - itwdf_ * io;
              io = rtwdf_ * io + itwdf_ * ro;
              ro = rx;
              rtws[p + j] = re + ro;
              itws[p + j] = ie + io;
              rtws[p + j + s] = re - ro;
              itws[p + j + s] = ie - io;
              if (j !== l) {
                rx = rtwdf * rtwdf_ - itwdf * itwdf_;
                itwdf_ = rtwdf * itwdf_ + itwdf * rtwdf_;
                rtwdf_ = rx;
              }
            }
          }
        }
      };
      FFTM.prototype.guessLen13b = function guessLen13b(n, m) {
        var N = Math.max(m, n) | 1;
        var odd = N & 1;
        var i = 0;
        for (N = N / 2 | 0; N; N = N >>> 1) {
          i++;
        }
        return 1 << i + 1 + odd;
      };
      FFTM.prototype.conjugate = function conjugate(rws, iws, N) {
        if (N <= 1) return;
        for (var i = 0; i < N / 2; i++) {
          var t = rws[i];
          rws[i] = rws[N - i - 1];
          rws[N - i - 1] = t;
          t = iws[i];
          iws[i] = -iws[N - i - 1];
          iws[N - i - 1] = -t;
        }
      };
      FFTM.prototype.normalize13b = function normalize13b(ws, N) {
        var carry = 0;
        for (var i = 0; i < N / 2; i++) {
          var w = Math.round(ws[2 * i + 1] / N) * 8192 + Math.round(ws[2 * i] / N) + carry;
          ws[i] = w & 67108863;
          if (w < 67108864) {
            carry = 0;
          } else {
            carry = w / 67108864 | 0;
          }
        }
        return ws;
      };
      FFTM.prototype.convert13b = function convert13b(ws, len, rws, N) {
        var carry = 0;
        for (var i = 0; i < len; i++) {
          carry = carry + (ws[i] | 0);
          rws[2 * i] = carry & 8191;
          carry = carry >>> 13;
          rws[2 * i + 1] = carry & 8191;
          carry = carry >>> 13;
        }
        for (i = 2 * len; i < N; ++i) {
          rws[i] = 0;
        }
        assert(carry === 0);
        assert((carry & ~8191) === 0);
      };
      FFTM.prototype.stub = function stub(N) {
        var ph = new Array(N);
        for (var i = 0; i < N; i++) {
          ph[i] = 0;
        }
        return ph;
      };
      FFTM.prototype.mulp = function mulp(x, y, out) {
        var N = 2 * this.guessLen13b(x.length, y.length);
        var rbt = this.makeRBT(N);
        var _ = this.stub(N);
        var rws = new Array(N);
        var rwst = new Array(N);
        var iwst = new Array(N);
        var nrws = new Array(N);
        var nrwst = new Array(N);
        var niwst = new Array(N);
        var rmws = out.words;
        rmws.length = N;
        this.convert13b(x.words, x.length, rws, N);
        this.convert13b(y.words, y.length, nrws, N);
        this.transform(rws, _, rwst, iwst, N, rbt);
        this.transform(nrws, _, nrwst, niwst, N, rbt);
        for (var i = 0; i < N; i++) {
          var rx = rwst[i] * nrwst[i] - iwst[i] * niwst[i];
          iwst[i] = rwst[i] * niwst[i] + iwst[i] * nrwst[i];
          rwst[i] = rx;
        }
        this.conjugate(rwst, iwst, N);
        this.transform(rwst, iwst, rmws, _, N, rbt);
        this.conjugate(rmws, _, N);
        this.normalize13b(rmws, N);
        out.negative = x.negative ^ y.negative;
        out.length = x.length + y.length;
        return out.strip();
      };
      BN.prototype.mul = function mul(num) {
        var out = new BN(null);
        out.words = new Array(this.length + num.length);
        return this.mulTo(num, out);
      };
      BN.prototype.mulf = function mulf(num) {
        var out = new BN(null);
        out.words = new Array(this.length + num.length);
        return jumboMulTo(this, num, out);
      };
      BN.prototype.imul = function imul(num) {
        return this.clone().mulTo(num, this);
      };
      BN.prototype.imuln = function imuln(num) {
        assert(typeof num === "number");
        assert(num < 67108864);
        var carry = 0;
        for (var i = 0; i < this.length; i++) {
          var w = (this.words[i] | 0) * num;
          var lo = (w & 67108863) + (carry & 67108863);
          carry >>= 26;
          carry += w / 67108864 | 0;
          carry += lo >>> 26;
          this.words[i] = lo & 67108863;
        }
        if (carry !== 0) {
          this.words[i] = carry;
          this.length++;
        }
        this.length = num === 0 ? 1 : this.length;
        return this;
      };
      BN.prototype.muln = function muln(num) {
        return this.clone().imuln(num);
      };
      BN.prototype.sqr = function sqr() {
        return this.mul(this);
      };
      BN.prototype.isqr = function isqr() {
        return this.imul(this.clone());
      };
      BN.prototype.pow = function pow(num) {
        var w = toBitArray(num);
        if (w.length === 0) return new BN(1);
        var res = this;
        for (var i = 0; i < w.length; i++, res = res.sqr()) {
          if (w[i] !== 0) break;
        }
        if (++i < w.length) {
          for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
            if (w[i] === 0) continue;
            res = res.mul(q);
          }
        }
        return res;
      };
      BN.prototype.iushln = function iushln(bits) {
        assert(typeof bits === "number" && bits >= 0);
        var r = bits % 26;
        var s = (bits - r) / 26;
        var carryMask = 67108863 >>> 26 - r << 26 - r;
        var i;
        if (r !== 0) {
          var carry = 0;
          for (i = 0; i < this.length; i++) {
            var newCarry = this.words[i] & carryMask;
            var c = (this.words[i] | 0) - newCarry << r;
            this.words[i] = c | carry;
            carry = newCarry >>> 26 - r;
          }
          if (carry) {
            this.words[i] = carry;
            this.length++;
          }
        }
        if (s !== 0) {
          for (i = this.length - 1; i >= 0; i--) {
            this.words[i + s] = this.words[i];
          }
          for (i = 0; i < s; i++) {
            this.words[i] = 0;
          }
          this.length += s;
        }
        return this.strip();
      };
      BN.prototype.ishln = function ishln(bits) {
        assert(this.negative === 0);
        return this.iushln(bits);
      };
      BN.prototype.iushrn = function iushrn(bits, hint, extended) {
        assert(typeof bits === "number" && bits >= 0);
        var h;
        if (hint) {
          h = (hint - hint % 26) / 26;
        } else {
          h = 0;
        }
        var r = bits % 26;
        var s = Math.min((bits - r) / 26, this.length);
        var mask = 67108863 ^ 67108863 >>> r << r;
        var maskedWords = extended;
        h -= s;
        h = Math.max(0, h);
        if (maskedWords) {
          for (var i = 0; i < s; i++) {
            maskedWords.words[i] = this.words[i];
          }
          maskedWords.length = s;
        }
        if (s === 0) {
        } else if (this.length > s) {
          this.length -= s;
          for (i = 0; i < this.length; i++) {
            this.words[i] = this.words[i + s];
          }
        } else {
          this.words[0] = 0;
          this.length = 1;
        }
        var carry = 0;
        for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
          var word = this.words[i] | 0;
          this.words[i] = carry << 26 - r | word >>> r;
          carry = word & mask;
        }
        if (maskedWords && carry !== 0) {
          maskedWords.words[maskedWords.length++] = carry;
        }
        if (this.length === 0) {
          this.words[0] = 0;
          this.length = 1;
        }
        return this.strip();
      };
      BN.prototype.ishrn = function ishrn(bits, hint, extended) {
        assert(this.negative === 0);
        return this.iushrn(bits, hint, extended);
      };
      BN.prototype.shln = function shln(bits) {
        return this.clone().ishln(bits);
      };
      BN.prototype.ushln = function ushln(bits) {
        return this.clone().iushln(bits);
      };
      BN.prototype.shrn = function shrn(bits) {
        return this.clone().ishrn(bits);
      };
      BN.prototype.ushrn = function ushrn(bits) {
        return this.clone().iushrn(bits);
      };
      BN.prototype.testn = function testn(bit) {
        assert(typeof bit === "number" && bit >= 0);
        var r = bit % 26;
        var s = (bit - r) / 26;
        var q = 1 << r;
        if (this.length <= s) return false;
        var w = this.words[s];
        return !!(w & q);
      };
      BN.prototype.imaskn = function imaskn(bits) {
        assert(typeof bits === "number" && bits >= 0);
        var r = bits % 26;
        var s = (bits - r) / 26;
        assert(this.negative === 0, "imaskn works only with positive numbers");
        if (this.length <= s) {
          return this;
        }
        if (r !== 0) {
          s++;
        }
        this.length = Math.min(s, this.length);
        if (r !== 0) {
          var mask = 67108863 ^ 67108863 >>> r << r;
          this.words[this.length - 1] &= mask;
        }
        return this.strip();
      };
      BN.prototype.maskn = function maskn(bits) {
        return this.clone().imaskn(bits);
      };
      BN.prototype.iaddn = function iaddn(num) {
        assert(typeof num === "number");
        assert(num < 67108864);
        if (num < 0) return this.isubn(-num);
        if (this.negative !== 0) {
          if (this.length === 1 && (this.words[0] | 0) < num) {
            this.words[0] = num - (this.words[0] | 0);
            this.negative = 0;
            return this;
          }
          this.negative = 0;
          this.isubn(num);
          this.negative = 1;
          return this;
        }
        return this._iaddn(num);
      };
      BN.prototype._iaddn = function _iaddn(num) {
        this.words[0] += num;
        for (var i = 0; i < this.length && this.words[i] >= 67108864; i++) {
          this.words[i] -= 67108864;
          if (i === this.length - 1) {
            this.words[i + 1] = 1;
          } else {
            this.words[i + 1]++;
          }
        }
        this.length = Math.max(this.length, i + 1);
        return this;
      };
      BN.prototype.isubn = function isubn(num) {
        assert(typeof num === "number");
        assert(num < 67108864);
        if (num < 0) return this.iaddn(-num);
        if (this.negative !== 0) {
          this.negative = 0;
          this.iaddn(num);
          this.negative = 1;
          return this;
        }
        this.words[0] -= num;
        if (this.length === 1 && this.words[0] < 0) {
          this.words[0] = -this.words[0];
          this.negative = 1;
        } else {
          for (var i = 0; i < this.length && this.words[i] < 0; i++) {
            this.words[i] += 67108864;
            this.words[i + 1] -= 1;
          }
        }
        return this.strip();
      };
      BN.prototype.addn = function addn(num) {
        return this.clone().iaddn(num);
      };
      BN.prototype.subn = function subn(num) {
        return this.clone().isubn(num);
      };
      BN.prototype.iabs = function iabs() {
        this.negative = 0;
        return this;
      };
      BN.prototype.abs = function abs() {
        return this.clone().iabs();
      };
      BN.prototype._ishlnsubmul = function _ishlnsubmul(num, mul, shift) {
        var len = num.length + shift;
        var i;
        this._expand(len);
        var w;
        var carry = 0;
        for (i = 0; i < num.length; i++) {
          w = (this.words[i + shift] | 0) + carry;
          var right = (num.words[i] | 0) * mul;
          w -= right & 67108863;
          carry = (w >> 26) - (right / 67108864 | 0);
          this.words[i + shift] = w & 67108863;
        }
        for (; i < this.length - shift; i++) {
          w = (this.words[i + shift] | 0) + carry;
          carry = w >> 26;
          this.words[i + shift] = w & 67108863;
        }
        if (carry === 0) return this.strip();
        assert(carry === -1);
        carry = 0;
        for (i = 0; i < this.length; i++) {
          w = -(this.words[i] | 0) + carry;
          carry = w >> 26;
          this.words[i] = w & 67108863;
        }
        this.negative = 1;
        return this.strip();
      };
      BN.prototype._wordDiv = function _wordDiv(num, mode) {
        var shift = this.length - num.length;
        var a = this.clone();
        var b = num;
        var bhi = b.words[b.length - 1] | 0;
        var bhiBits = this._countBits(bhi);
        shift = 26 - bhiBits;
        if (shift !== 0) {
          b = b.ushln(shift);
          a.iushln(shift);
          bhi = b.words[b.length - 1] | 0;
        }
        var m = a.length - b.length;
        var q;
        if (mode !== "mod") {
          q = new BN(null);
          q.length = m + 1;
          q.words = new Array(q.length);
          for (var i = 0; i < q.length; i++) {
            q.words[i] = 0;
          }
        }
        var diff = a.clone()._ishlnsubmul(b, 1, m);
        if (diff.negative === 0) {
          a = diff;
          if (q) {
            q.words[m] = 1;
          }
        }
        for (var j = m - 1; j >= 0; j--) {
          var qj = (a.words[b.length + j] | 0) * 67108864 + (a.words[b.length + j - 1] | 0);
          qj = Math.min(qj / bhi | 0, 67108863);
          a._ishlnsubmul(b, qj, j);
          while (a.negative !== 0) {
            qj--;
            a.negative = 0;
            a._ishlnsubmul(b, 1, j);
            if (!a.isZero()) {
              a.negative ^= 1;
            }
          }
          if (q) {
            q.words[j] = qj;
          }
        }
        if (q) {
          q.strip();
        }
        a.strip();
        if (mode !== "div" && shift !== 0) {
          a.iushrn(shift);
        }
        return {
          div: q || null,
          mod: a
        };
      };
      BN.prototype.divmod = function divmod(num, mode, positive) {
        assert(!num.isZero());
        if (this.isZero()) {
          return {
            div: new BN(0),
            mod: new BN(0)
          };
        }
        var div, mod, res;
        if (this.negative !== 0 && num.negative === 0) {
          res = this.neg().divmod(num, mode);
          if (mode !== "mod") {
            div = res.div.neg();
          }
          if (mode !== "div") {
            mod = res.mod.neg();
            if (positive && mod.negative !== 0) {
              mod.iadd(num);
            }
          }
          return {
            div,
            mod
          };
        }
        if (this.negative === 0 && num.negative !== 0) {
          res = this.divmod(num.neg(), mode);
          if (mode !== "mod") {
            div = res.div.neg();
          }
          return {
            div,
            mod: res.mod
          };
        }
        if ((this.negative & num.negative) !== 0) {
          res = this.neg().divmod(num.neg(), mode);
          if (mode !== "div") {
            mod = res.mod.neg();
            if (positive && mod.negative !== 0) {
              mod.isub(num);
            }
          }
          return {
            div: res.div,
            mod
          };
        }
        if (num.length > this.length || this.cmp(num) < 0) {
          return {
            div: new BN(0),
            mod: this
          };
        }
        if (num.length === 1) {
          if (mode === "div") {
            return {
              div: this.divn(num.words[0]),
              mod: null
            };
          }
          if (mode === "mod") {
            return {
              div: null,
              mod: new BN(this.modn(num.words[0]))
            };
          }
          return {
            div: this.divn(num.words[0]),
            mod: new BN(this.modn(num.words[0]))
          };
        }
        return this._wordDiv(num, mode);
      };
      BN.prototype.div = function div(num) {
        return this.divmod(num, "div", false).div;
      };
      BN.prototype.mod = function mod(num) {
        return this.divmod(num, "mod", false).mod;
      };
      BN.prototype.umod = function umod(num) {
        return this.divmod(num, "mod", true).mod;
      };
      BN.prototype.divRound = function divRound(num) {
        var dm = this.divmod(num);
        if (dm.mod.isZero()) return dm.div;
        var mod = dm.div.negative !== 0 ? dm.mod.isub(num) : dm.mod;
        var half = num.ushrn(1);
        var r2 = num.andln(1);
        var cmp = mod.cmp(half);
        if (cmp < 0 || r2 === 1 && cmp === 0) return dm.div;
        return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
      };
      BN.prototype.modn = function modn(num) {
        assert(num <= 67108863);
        var p = (1 << 26) % num;
        var acc = 0;
        for (var i = this.length - 1; i >= 0; i--) {
          acc = (p * acc + (this.words[i] | 0)) % num;
        }
        return acc;
      };
      BN.prototype.idivn = function idivn(num) {
        assert(num <= 67108863);
        var carry = 0;
        for (var i = this.length - 1; i >= 0; i--) {
          var w = (this.words[i] | 0) + carry * 67108864;
          this.words[i] = w / num | 0;
          carry = w % num;
        }
        return this.strip();
      };
      BN.prototype.divn = function divn(num) {
        return this.clone().idivn(num);
      };
      BN.prototype.egcd = function egcd(p) {
        assert(p.negative === 0);
        assert(!p.isZero());
        var x = this;
        var y = p.clone();
        if (x.negative !== 0) {
          x = x.umod(p);
        } else {
          x = x.clone();
        }
        var A = new BN(1);
        var B = new BN(0);
        var C = new BN(0);
        var D = new BN(1);
        var g = 0;
        while (x.isEven() && y.isEven()) {
          x.iushrn(1);
          y.iushrn(1);
          ++g;
        }
        var yp = y.clone();
        var xp = x.clone();
        while (!x.isZero()) {
          for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1) ;
          if (i > 0) {
            x.iushrn(i);
            while (i-- > 0) {
              if (A.isOdd() || B.isOdd()) {
                A.iadd(yp);
                B.isub(xp);
              }
              A.iushrn(1);
              B.iushrn(1);
            }
          }
          for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1) ;
          if (j > 0) {
            y.iushrn(j);
            while (j-- > 0) {
              if (C.isOdd() || D.isOdd()) {
                C.iadd(yp);
                D.isub(xp);
              }
              C.iushrn(1);
              D.iushrn(1);
            }
          }
          if (x.cmp(y) >= 0) {
            x.isub(y);
            A.isub(C);
            B.isub(D);
          } else {
            y.isub(x);
            C.isub(A);
            D.isub(B);
          }
        }
        return {
          a: C,
          b: D,
          gcd: y.iushln(g)
        };
      };
      BN.prototype._invmp = function _invmp(p) {
        assert(p.negative === 0);
        assert(!p.isZero());
        var a = this;
        var b = p.clone();
        if (a.negative !== 0) {
          a = a.umod(p);
        } else {
          a = a.clone();
        }
        var x1 = new BN(1);
        var x2 = new BN(0);
        var delta = b.clone();
        while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
          for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1) ;
          if (i > 0) {
            a.iushrn(i);
            while (i-- > 0) {
              if (x1.isOdd()) {
                x1.iadd(delta);
              }
              x1.iushrn(1);
            }
          }
          for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1) ;
          if (j > 0) {
            b.iushrn(j);
            while (j-- > 0) {
              if (x2.isOdd()) {
                x2.iadd(delta);
              }
              x2.iushrn(1);
            }
          }
          if (a.cmp(b) >= 0) {
            a.isub(b);
            x1.isub(x2);
          } else {
            b.isub(a);
            x2.isub(x1);
          }
        }
        var res;
        if (a.cmpn(1) === 0) {
          res = x1;
        } else {
          res = x2;
        }
        if (res.cmpn(0) < 0) {
          res.iadd(p);
        }
        return res;
      };
      BN.prototype.gcd = function gcd(num) {
        if (this.isZero()) return num.abs();
        if (num.isZero()) return this.abs();
        var a = this.clone();
        var b = num.clone();
        a.negative = 0;
        b.negative = 0;
        for (var shift = 0; a.isEven() && b.isEven(); shift++) {
          a.iushrn(1);
          b.iushrn(1);
        }
        do {
          while (a.isEven()) {
            a.iushrn(1);
          }
          while (b.isEven()) {
            b.iushrn(1);
          }
          var r = a.cmp(b);
          if (r < 0) {
            var t = a;
            a = b;
            b = t;
          } else if (r === 0 || b.cmpn(1) === 0) {
            break;
          }
          a.isub(b);
        } while (true);
        return b.iushln(shift);
      };
      BN.prototype.invm = function invm(num) {
        return this.egcd(num).a.umod(num);
      };
      BN.prototype.isEven = function isEven() {
        return (this.words[0] & 1) === 0;
      };
      BN.prototype.isOdd = function isOdd() {
        return (this.words[0] & 1) === 1;
      };
      BN.prototype.andln = function andln(num) {
        return this.words[0] & num;
      };
      BN.prototype.bincn = function bincn(bit) {
        assert(typeof bit === "number");
        var r = bit % 26;
        var s = (bit - r) / 26;
        var q = 1 << r;
        if (this.length <= s) {
          this._expand(s + 1);
          this.words[s] |= q;
          return this;
        }
        var carry = q;
        for (var i = s; carry !== 0 && i < this.length; i++) {
          var w = this.words[i] | 0;
          w += carry;
          carry = w >>> 26;
          w &= 67108863;
          this.words[i] = w;
        }
        if (carry !== 0) {
          this.words[i] = carry;
          this.length++;
        }
        return this;
      };
      BN.prototype.isZero = function isZero() {
        return this.length === 1 && this.words[0] === 0;
      };
      BN.prototype.cmpn = function cmpn(num) {
        var negative = num < 0;
        if (this.negative !== 0 && !negative) return -1;
        if (this.negative === 0 && negative) return 1;
        this.strip();
        var res;
        if (this.length > 1) {
          res = 1;
        } else {
          if (negative) {
            num = -num;
          }
          assert(num <= 67108863, "Number is too big");
          var w = this.words[0] | 0;
          res = w === num ? 0 : w < num ? -1 : 1;
        }
        if (this.negative !== 0) return -res | 0;
        return res;
      };
      BN.prototype.cmp = function cmp(num) {
        if (this.negative !== 0 && num.negative === 0) return -1;
        if (this.negative === 0 && num.negative !== 0) return 1;
        var res = this.ucmp(num);
        if (this.negative !== 0) return -res | 0;
        return res;
      };
      BN.prototype.ucmp = function ucmp(num) {
        if (this.length > num.length) return 1;
        if (this.length < num.length) return -1;
        var res = 0;
        for (var i = this.length - 1; i >= 0; i--) {
          var a = this.words[i] | 0;
          var b = num.words[i] | 0;
          if (a === b) continue;
          if (a < b) {
            res = -1;
          } else if (a > b) {
            res = 1;
          }
          break;
        }
        return res;
      };
      BN.prototype.gtn = function gtn(num) {
        return this.cmpn(num) === 1;
      };
      BN.prototype.gt = function gt(num) {
        return this.cmp(num) === 1;
      };
      BN.prototype.gten = function gten(num) {
        return this.cmpn(num) >= 0;
      };
      BN.prototype.gte = function gte(num) {
        return this.cmp(num) >= 0;
      };
      BN.prototype.ltn = function ltn(num) {
        return this.cmpn(num) === -1;
      };
      BN.prototype.lt = function lt(num) {
        return this.cmp(num) === -1;
      };
      BN.prototype.lten = function lten(num) {
        return this.cmpn(num) <= 0;
      };
      BN.prototype.lte = function lte(num) {
        return this.cmp(num) <= 0;
      };
      BN.prototype.eqn = function eqn(num) {
        return this.cmpn(num) === 0;
      };
      BN.prototype.eq = function eq(num) {
        return this.cmp(num) === 0;
      };
      BN.red = function red(num) {
        return new Red(num);
      };
      BN.prototype.toRed = function toRed(ctx) {
        assert(!this.red, "Already a number in reduction context");
        assert(this.negative === 0, "red works only with positives");
        return ctx.convertTo(this)._forceRed(ctx);
      };
      BN.prototype.fromRed = function fromRed() {
        assert(this.red, "fromRed works only with numbers in reduction context");
        return this.red.convertFrom(this);
      };
      BN.prototype._forceRed = function _forceRed(ctx) {
        this.red = ctx;
        return this;
      };
      BN.prototype.forceRed = function forceRed(ctx) {
        assert(!this.red, "Already a number in reduction context");
        return this._forceRed(ctx);
      };
      BN.prototype.redAdd = function redAdd(num) {
        assert(this.red, "redAdd works only with red numbers");
        return this.red.add(this, num);
      };
      BN.prototype.redIAdd = function redIAdd(num) {
        assert(this.red, "redIAdd works only with red numbers");
        return this.red.iadd(this, num);
      };
      BN.prototype.redSub = function redSub(num) {
        assert(this.red, "redSub works only with red numbers");
        return this.red.sub(this, num);
      };
      BN.prototype.redISub = function redISub(num) {
        assert(this.red, "redISub works only with red numbers");
        return this.red.isub(this, num);
      };
      BN.prototype.redShl = function redShl(num) {
        assert(this.red, "redShl works only with red numbers");
        return this.red.shl(this, num);
      };
      BN.prototype.redMul = function redMul(num) {
        assert(this.red, "redMul works only with red numbers");
        this.red._verify2(this, num);
        return this.red.mul(this, num);
      };
      BN.prototype.redIMul = function redIMul(num) {
        assert(this.red, "redMul works only with red numbers");
        this.red._verify2(this, num);
        return this.red.imul(this, num);
      };
      BN.prototype.redSqr = function redSqr() {
        assert(this.red, "redSqr works only with red numbers");
        this.red._verify1(this);
        return this.red.sqr(this);
      };
      BN.prototype.redISqr = function redISqr() {
        assert(this.red, "redISqr works only with red numbers");
        this.red._verify1(this);
        return this.red.isqr(this);
      };
      BN.prototype.redSqrt = function redSqrt() {
        assert(this.red, "redSqrt works only with red numbers");
        this.red._verify1(this);
        return this.red.sqrt(this);
      };
      BN.prototype.redInvm = function redInvm() {
        assert(this.red, "redInvm works only with red numbers");
        this.red._verify1(this);
        return this.red.invm(this);
      };
      BN.prototype.redNeg = function redNeg() {
        assert(this.red, "redNeg works only with red numbers");
        this.red._verify1(this);
        return this.red.neg(this);
      };
      BN.prototype.redPow = function redPow(num) {
        assert(this.red && !num.red, "redPow(normalNum)");
        this.red._verify1(this);
        return this.red.pow(this, num);
      };
      var primes = {
        k256: null,
        p224: null,
        p192: null,
        p25519: null
      };
      function MPrime(name, p) {
        this.name = name;
        this.p = new BN(p, 16);
        this.n = this.p.bitLength();
        this.k = new BN(1).iushln(this.n).isub(this.p);
        this.tmp = this._tmp();
      }
      MPrime.prototype._tmp = function _tmp() {
        var tmp = new BN(null);
        tmp.words = new Array(Math.ceil(this.n / 13));
        return tmp;
      };
      MPrime.prototype.ireduce = function ireduce(num) {
        var r = num;
        var rlen;
        do {
          this.split(r, this.tmp);
          r = this.imulK(r);
          r = r.iadd(this.tmp);
          rlen = r.bitLength();
        } while (rlen > this.n);
        var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
        if (cmp === 0) {
          r.words[0] = 0;
          r.length = 1;
        } else if (cmp > 0) {
          r.isub(this.p);
        } else {
          if (r.strip !== void 0) {
            r.strip();
          } else {
            r._strip();
          }
        }
        return r;
      };
      MPrime.prototype.split = function split(input, out) {
        input.iushrn(this.n, 0, out);
      };
      MPrime.prototype.imulK = function imulK(num) {
        return num.imul(this.k);
      };
      function K256() {
        MPrime.call(
          this,
          "k256",
          "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f"
        );
      }
      inherits(K256, MPrime);
      K256.prototype.split = function split(input, output) {
        var mask = 4194303;
        var outLen = Math.min(input.length, 9);
        for (var i = 0; i < outLen; i++) {
          output.words[i] = input.words[i];
        }
        output.length = outLen;
        if (input.length <= 9) {
          input.words[0] = 0;
          input.length = 1;
          return;
        }
        var prev = input.words[9];
        output.words[output.length++] = prev & mask;
        for (i = 10; i < input.length; i++) {
          var next = input.words[i] | 0;
          input.words[i - 10] = (next & mask) << 4 | prev >>> 22;
          prev = next;
        }
        prev >>>= 22;
        input.words[i - 10] = prev;
        if (prev === 0 && input.length > 10) {
          input.length -= 10;
        } else {
          input.length -= 9;
        }
      };
      K256.prototype.imulK = function imulK(num) {
        num.words[num.length] = 0;
        num.words[num.length + 1] = 0;
        num.length += 2;
        var lo = 0;
        for (var i = 0; i < num.length; i++) {
          var w = num.words[i] | 0;
          lo += w * 977;
          num.words[i] = lo & 67108863;
          lo = w * 64 + (lo / 67108864 | 0);
        }
        if (num.words[num.length - 1] === 0) {
          num.length--;
          if (num.words[num.length - 1] === 0) {
            num.length--;
          }
        }
        return num;
      };
      function P224() {
        MPrime.call(
          this,
          "p224",
          "ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001"
        );
      }
      inherits(P224, MPrime);
      function P192() {
        MPrime.call(
          this,
          "p192",
          "ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff"
        );
      }
      inherits(P192, MPrime);
      function P25519() {
        MPrime.call(
          this,
          "25519",
          "7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed"
        );
      }
      inherits(P25519, MPrime);
      P25519.prototype.imulK = function imulK(num) {
        var carry = 0;
        for (var i = 0; i < num.length; i++) {
          var hi = (num.words[i] | 0) * 19 + carry;
          var lo = hi & 67108863;
          hi >>>= 26;
          num.words[i] = lo;
          carry = hi;
        }
        if (carry !== 0) {
          num.words[num.length++] = carry;
        }
        return num;
      };
      BN._prime = function prime(name) {
        if (primes[name]) return primes[name];
        var prime2;
        if (name === "k256") {
          prime2 = new K256();
        } else if (name === "p224") {
          prime2 = new P224();
        } else if (name === "p192") {
          prime2 = new P192();
        } else if (name === "p25519") {
          prime2 = new P25519();
        } else {
          throw new Error("Unknown prime " + name);
        }
        primes[name] = prime2;
        return prime2;
      };
      function Red(m) {
        if (typeof m === "string") {
          var prime = BN._prime(m);
          this.m = prime.p;
          this.prime = prime;
        } else {
          assert(m.gtn(1), "modulus must be greater than 1");
          this.m = m;
          this.prime = null;
        }
      }
      Red.prototype._verify1 = function _verify1(a) {
        assert(a.negative === 0, "red works only with positives");
        assert(a.red, "red works only with red numbers");
      };
      Red.prototype._verify2 = function _verify2(a, b) {
        assert((a.negative | b.negative) === 0, "red works only with positives");
        assert(
          a.red && a.red === b.red,
          "red works only with red numbers"
        );
      };
      Red.prototype.imod = function imod(a) {
        if (this.prime) return this.prime.ireduce(a)._forceRed(this);
        return a.umod(this.m)._forceRed(this);
      };
      Red.prototype.neg = function neg(a) {
        if (a.isZero()) {
          return a.clone();
        }
        return this.m.sub(a)._forceRed(this);
      };
      Red.prototype.add = function add(a, b) {
        this._verify2(a, b);
        var res = a.add(b);
        if (res.cmp(this.m) >= 0) {
          res.isub(this.m);
        }
        return res._forceRed(this);
      };
      Red.prototype.iadd = function iadd(a, b) {
        this._verify2(a, b);
        var res = a.iadd(b);
        if (res.cmp(this.m) >= 0) {
          res.isub(this.m);
        }
        return res;
      };
      Red.prototype.sub = function sub(a, b) {
        this._verify2(a, b);
        var res = a.sub(b);
        if (res.cmpn(0) < 0) {
          res.iadd(this.m);
        }
        return res._forceRed(this);
      };
      Red.prototype.isub = function isub(a, b) {
        this._verify2(a, b);
        var res = a.isub(b);
        if (res.cmpn(0) < 0) {
          res.iadd(this.m);
        }
        return res;
      };
      Red.prototype.shl = function shl(a, num) {
        this._verify1(a);
        return this.imod(a.ushln(num));
      };
      Red.prototype.imul = function imul(a, b) {
        this._verify2(a, b);
        return this.imod(a.imul(b));
      };
      Red.prototype.mul = function mul(a, b) {
        this._verify2(a, b);
        return this.imod(a.mul(b));
      };
      Red.prototype.isqr = function isqr(a) {
        return this.imul(a, a.clone());
      };
      Red.prototype.sqr = function sqr(a) {
        return this.mul(a, a);
      };
      Red.prototype.sqrt = function sqrt(a) {
        if (a.isZero()) return a.clone();
        var mod3 = this.m.andln(3);
        assert(mod3 % 2 === 1);
        if (mod3 === 3) {
          var pow = this.m.add(new BN(1)).iushrn(2);
          return this.pow(a, pow);
        }
        var q = this.m.subn(1);
        var s = 0;
        while (!q.isZero() && q.andln(1) === 0) {
          s++;
          q.iushrn(1);
        }
        assert(!q.isZero());
        var one = new BN(1).toRed(this);
        var nOne = one.redNeg();
        var lpow = this.m.subn(1).iushrn(1);
        var z = this.m.bitLength();
        z = new BN(2 * z * z).toRed(this);
        while (this.pow(z, lpow).cmp(nOne) !== 0) {
          z.redIAdd(nOne);
        }
        var c = this.pow(z, q);
        var r = this.pow(a, q.addn(1).iushrn(1));
        var t = this.pow(a, q);
        var m = s;
        while (t.cmp(one) !== 0) {
          var tmp = t;
          for (var i = 0; tmp.cmp(one) !== 0; i++) {
            tmp = tmp.redSqr();
          }
          assert(i < m);
          var b = this.pow(c, new BN(1).iushln(m - i - 1));
          r = r.redMul(b);
          c = b.redSqr();
          t = t.redMul(c);
          m = i;
        }
        return r;
      };
      Red.prototype.invm = function invm(a) {
        var inv = a._invmp(this.m);
        if (inv.negative !== 0) {
          inv.negative = 0;
          return this.imod(inv).redNeg();
        } else {
          return this.imod(inv);
        }
      };
      Red.prototype.pow = function pow(a, num) {
        if (num.isZero()) return new BN(1).toRed(this);
        if (num.cmpn(1) === 0) return a.clone();
        var windowSize = 4;
        var wnd = new Array(1 << windowSize);
        wnd[0] = new BN(1).toRed(this);
        wnd[1] = a;
        for (var i = 2; i < wnd.length; i++) {
          wnd[i] = this.mul(wnd[i - 1], a);
        }
        var res = wnd[0];
        var current = 0;
        var currentLen = 0;
        var start = num.bitLength() % 26;
        if (start === 0) {
          start = 26;
        }
        for (i = num.length - 1; i >= 0; i--) {
          var word = num.words[i];
          for (var j = start - 1; j >= 0; j--) {
            var bit = word >> j & 1;
            if (res !== wnd[0]) {
              res = this.sqr(res);
            }
            if (bit === 0 && current === 0) {
              currentLen = 0;
              continue;
            }
            current <<= 1;
            current |= bit;
            currentLen++;
            if (currentLen !== windowSize && (i !== 0 || j !== 0)) continue;
            res = this.mul(res, wnd[current]);
            currentLen = 0;
            current = 0;
          }
          start = 26;
        }
        return res;
      };
      Red.prototype.convertTo = function convertTo(num) {
        var r = num.umod(this.m);
        return r === num ? r.clone() : r;
      };
      Red.prototype.convertFrom = function convertFrom(num) {
        var res = num.clone();
        res.red = null;
        return res;
      };
      BN.mont = function mont(num) {
        return new Mont(num);
      };
      function Mont(m) {
        Red.call(this, m);
        this.shift = this.m.bitLength();
        if (this.shift % 26 !== 0) {
          this.shift += 26 - this.shift % 26;
        }
        this.r = new BN(1).iushln(this.shift);
        this.r2 = this.imod(this.r.sqr());
        this.rinv = this.r._invmp(this.m);
        this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
        this.minv = this.minv.umod(this.r);
        this.minv = this.r.sub(this.minv);
      }
      inherits(Mont, Red);
      Mont.prototype.convertTo = function convertTo(num) {
        return this.imod(num.ushln(this.shift));
      };
      Mont.prototype.convertFrom = function convertFrom(num) {
        var r = this.imod(num.mul(this.rinv));
        r.red = null;
        return r;
      };
      Mont.prototype.imul = function imul(a, b) {
        if (a.isZero() || b.isZero()) {
          a.words[0] = 0;
          a.length = 1;
          return a;
        }
        var t = a.imul(b);
        var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
        var u = t.isub(c).iushrn(this.shift);
        var res = u;
        if (u.cmp(this.m) >= 0) {
          res = u.isub(this.m);
        } else if (u.cmpn(0) < 0) {
          res = u.iadd(this.m);
        }
        return res._forceRed(this);
      };
      Mont.prototype.mul = function mul(a, b) {
        if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);
        var t = a.mul(b);
        var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
        var u = t.isub(c).iushrn(this.shift);
        var res = u;
        if (u.cmp(this.m) >= 0) {
          res = u.isub(this.m);
        } else if (u.cmpn(0) < 0) {
          res = u.iadd(this.m);
        }
        return res._forceRed(this);
      };
      Mont.prototype.invm = function invm(a) {
        var res = this.imod(a._invmp(this.m).mul(this.r2));
        return res._forceRed(this);
      };
    })(typeof module === "undefined" || module, exports);
  }
});

// node_modules/big-rat/lib/is-bn.js
var require_is_bn = __commonJS({
  "node_modules/big-rat/lib/is-bn.js"(exports, module) {
    "use strict";
    var BN = require_bn();
    module.exports = isBN;
    function isBN(x) {
      return x && typeof x === "object" && Boolean(x.words);
    }
  }
});

// node_modules/big-rat/is-rat.js
var require_is_rat = __commonJS({
  "node_modules/big-rat/is-rat.js"(exports, module) {
    "use strict";
    var isBN = require_is_bn();
    module.exports = isRat;
    function isRat(x) {
      return Array.isArray(x) && x.length === 2 && isBN(x[0]) && isBN(x[1]);
    }
  }
});

// node_modules/double-bits/double.js
var require_double = __commonJS({
  "node_modules/double-bits/double.js"(exports, module) {
    var hasTypedArrays = false;
    if (typeof Float64Array !== "undefined") {
      DOUBLE_VIEW = new Float64Array(1), UINT_VIEW = new Uint32Array(DOUBLE_VIEW.buffer);
      DOUBLE_VIEW[0] = 1;
      hasTypedArrays = true;
      if (UINT_VIEW[1] === 1072693248) {
        let toDoubleLE2 = function(lo, hi) {
          UINT_VIEW[0] = lo;
          UINT_VIEW[1] = hi;
          return DOUBLE_VIEW[0];
        }, lowUintLE2 = function(n) {
          DOUBLE_VIEW[0] = n;
          return UINT_VIEW[0];
        }, highUintLE2 = function(n) {
          DOUBLE_VIEW[0] = n;
          return UINT_VIEW[1];
        };
        toDoubleLE = toDoubleLE2, lowUintLE = lowUintLE2, highUintLE = highUintLE2;
        module.exports = function doubleBitsLE(n) {
          DOUBLE_VIEW[0] = n;
          return [UINT_VIEW[0], UINT_VIEW[1]];
        };
        module.exports.pack = toDoubleLE2;
        module.exports.lo = lowUintLE2;
        module.exports.hi = highUintLE2;
      } else if (UINT_VIEW[0] === 1072693248) {
        let toDoubleBE2 = function(lo, hi) {
          UINT_VIEW[1] = lo;
          UINT_VIEW[0] = hi;
          return DOUBLE_VIEW[0];
        }, lowUintBE2 = function(n) {
          DOUBLE_VIEW[0] = n;
          return UINT_VIEW[1];
        }, highUintBE2 = function(n) {
          DOUBLE_VIEW[0] = n;
          return UINT_VIEW[0];
        };
        toDoubleBE = toDoubleBE2, lowUintBE = lowUintBE2, highUintBE = highUintBE2;
        module.exports = function doubleBitsBE(n) {
          DOUBLE_VIEW[0] = n;
          return [UINT_VIEW[1], UINT_VIEW[0]];
        };
        module.exports.pack = toDoubleBE2;
        module.exports.lo = lowUintBE2;
        module.exports.hi = highUintBE2;
      } else {
        hasTypedArrays = false;
      }
    }
    var DOUBLE_VIEW;
    var UINT_VIEW;
    var toDoubleLE;
    var lowUintLE;
    var highUintLE;
    var toDoubleBE;
    var lowUintBE;
    var highUintBE;
    if (!hasTypedArrays) {
      let toDouble2 = function(lo, hi) {
        buffer.writeUInt32LE(lo, 0, true);
        buffer.writeUInt32LE(hi, 4, true);
        return buffer.readDoubleLE(0, true);
      }, lowUint2 = function(n) {
        buffer.writeDoubleLE(n, 0, true);
        return buffer.readUInt32LE(0, true);
      }, highUint2 = function(n) {
        buffer.writeDoubleLE(n, 0, true);
        return buffer.readUInt32LE(4, true);
      };
      toDouble = toDouble2, lowUint = lowUint2, highUint = highUint2;
      buffer = new Buffer(8);
      module.exports = function doubleBits(n) {
        buffer.writeDoubleLE(n, 0, true);
        return [buffer.readUInt32LE(0, true), buffer.readUInt32LE(4, true)];
      };
      module.exports.pack = toDouble2;
      module.exports.lo = lowUint2;
      module.exports.hi = highUint2;
    }
    var buffer;
    var toDouble;
    var lowUint;
    var highUint;
    module.exports.sign = function(n) {
      return module.exports.hi(n) >>> 31;
    };
    module.exports.exponent = function(n) {
      var b = module.exports.hi(n);
      return (b << 1 >>> 21) - 1023;
    };
    module.exports.fraction = function(n) {
      var lo = module.exports.lo(n);
      var hi = module.exports.hi(n);
      var b = hi & (1 << 20) - 1;
      if (hi & 2146435072) {
        b += 1 << 20;
      }
      return [lo, b];
    };
    module.exports.denormalized = function(n) {
      var hi = module.exports.hi(n);
      return !(hi & 2146435072);
    };
  }
});

// node_modules/big-rat/lib/num-to-bn.js
var require_num_to_bn = __commonJS({
  "node_modules/big-rat/lib/num-to-bn.js"(exports, module) {
    "use strict";
    var BN = require_bn();
    var db = require_double();
    module.exports = num2bn;
    function num2bn(x) {
      var e = db.exponent(x);
      if (e < 52) {
        return new BN(x);
      } else {
        return new BN(x * Math.pow(2, 52 - e)).ushln(e - 52);
      }
    }
  }
});

// node_modules/big-rat/lib/str-to-bn.js
var require_str_to_bn = __commonJS({
  "node_modules/big-rat/lib/str-to-bn.js"(exports, module) {
    "use strict";
    var BN = require_bn();
    module.exports = str2BN;
    function str2BN(x) {
      return new BN(x);
    }
  }
});

// node_modules/big-rat/lib/bn-sign.js
var require_bn_sign = __commonJS({
  "node_modules/big-rat/lib/bn-sign.js"(exports, module) {
    "use strict";
    var BN = require_bn();
    module.exports = sign;
    function sign(x) {
      return x.cmp(new BN(0));
    }
  }
});

// node_modules/big-rat/lib/rationalize.js
var require_rationalize = __commonJS({
  "node_modules/big-rat/lib/rationalize.js"(exports, module) {
    "use strict";
    var num2bn = require_num_to_bn();
    var sign = require_bn_sign();
    module.exports = rationalize;
    function rationalize(numer, denom) {
      var snumer = sign(numer);
      var sdenom = sign(denom);
      if (snumer === 0) {
        return [num2bn(0), num2bn(1)];
      }
      if (sdenom === 0) {
        return [num2bn(0), num2bn(0)];
      }
      if (sdenom < 0) {
        numer = numer.neg();
        denom = denom.neg();
      }
      var d = numer.gcd(denom);
      if (d.cmpn(1)) {
        return [numer.div(d), denom.div(d)];
      }
      return [numer, denom];
    }
  }
});

// node_modules/big-rat/div.js
var require_div = __commonJS({
  "node_modules/big-rat/div.js"(exports, module) {
    "use strict";
    var rationalize = require_rationalize();
    module.exports = div;
    function div(a, b) {
      return rationalize(a[0].mul(b[1]), a[1].mul(b[0]));
    }
  }
});

// node_modules/big-rat/index.js
var require_big_rat = __commonJS({
  "node_modules/big-rat/index.js"(exports, module) {
    "use strict";
    var isRat = require_is_rat();
    var isBN = require_is_bn();
    var num2bn = require_num_to_bn();
    var str2bn = require_str_to_bn();
    var rationalize = require_rationalize();
    var div = require_div();
    module.exports = makeRational;
    function makeRational(numer, denom) {
      if (isRat(numer)) {
        if (denom) {
          return div(numer, makeRational(denom));
        }
        return [numer[0].clone(), numer[1].clone()];
      }
      var shift = 0;
      var a, b;
      if (isBN(numer)) {
        a = numer.clone();
      } else if (typeof numer === "string") {
        a = str2bn(numer);
      } else if (numer === 0) {
        return [num2bn(0), num2bn(1)];
      } else if (numer === Math.floor(numer)) {
        a = num2bn(numer);
      } else {
        while (numer !== Math.floor(numer)) {
          numer = numer * Math.pow(2, 256);
          shift -= 256;
        }
        a = num2bn(numer);
      }
      if (isRat(denom)) {
        a.mul(denom[1]);
        b = denom[0].clone();
      } else if (isBN(denom)) {
        b = denom.clone();
      } else if (typeof denom === "string") {
        b = str2bn(denom);
      } else if (!denom) {
        b = num2bn(1);
      } else if (denom === Math.floor(denom)) {
        b = num2bn(denom);
      } else {
        while (denom !== Math.floor(denom)) {
          denom = denom * Math.pow(2, 256);
          shift += 256;
        }
        b = num2bn(denom);
      }
      if (shift > 0) {
        a = a.ushln(shift);
      } else if (shift < 0) {
        b = b.ushln(-shift);
      }
      return rationalize(a, b);
    }
  }
});

// node_modules/big-rat/cmp.js
var require_cmp = __commonJS({
  "node_modules/big-rat/cmp.js"(exports, module) {
    "use strict";
    module.exports = cmp;
    function cmp(a, b) {
      return a[0].mul(b[1]).cmp(b[0].mul(a[1]));
    }
  }
});

// node_modules/big-rat/lib/bn-to-num.js
var require_bn_to_num = __commonJS({
  "node_modules/big-rat/lib/bn-to-num.js"(exports, module) {
    "use strict";
    var sign = require_bn_sign();
    module.exports = bn2num;
    function bn2num(b) {
      var l = b.length;
      var words = b.words;
      var out = 0;
      if (l === 1) {
        out = words[0];
      } else if (l === 2) {
        out = words[0] + words[1] * 67108864;
      } else {
        for (var i = 0; i < l; i++) {
          var w = words[i];
          out += w * Math.pow(67108864, i);
        }
      }
      return sign(b) * out;
    }
  }
});

// node_modules/big-rat/lib/ctz.js
var require_ctz = __commonJS({
  "node_modules/big-rat/lib/ctz.js"(exports, module) {
    "use strict";
    var db = require_double();
    var ctz = require_twiddle().countTrailingZeros;
    module.exports = ctzNumber;
    function ctzNumber(x) {
      var l = ctz(db.lo(x));
      if (l < 32) {
        return l;
      }
      var h = ctz(db.hi(x));
      if (h > 20) {
        return 52;
      }
      return h + 32;
    }
  }
});

// node_modules/big-rat/to-float.js
var require_to_float = __commonJS({
  "node_modules/big-rat/to-float.js"(exports, module) {
    "use strict";
    var bn2num = require_bn_to_num();
    var ctz = require_ctz();
    module.exports = roundRat;
    function roundRat(f) {
      var a = f[0];
      var b = f[1];
      if (a.cmpn(0) === 0) {
        return 0;
      }
      var h = a.abs().divmod(b.abs());
      var iv = h.div;
      var x = bn2num(iv);
      var ir = h.mod;
      var sgn = a.negative !== b.negative ? -1 : 1;
      if (ir.cmpn(0) === 0) {
        return sgn * x;
      }
      if (x) {
        var s = ctz(x) + 4;
        var y = bn2num(ir.ushln(s).divRound(b));
        return sgn * (x + y * Math.pow(2, -s));
      } else {
        var ybits = b.bitLength() - ir.bitLength() + 53;
        var y = bn2num(ir.ushln(ybits).divRound(b));
        if (ybits < 1023) {
          return sgn * y * Math.pow(2, -ybits);
        }
        y *= Math.pow(2, -1023);
        return sgn * y * Math.pow(2, 1023 - ybits);
      }
    }
  }
});

// node_modules/rat-vec/index.js
var require_rat_vec = __commonJS({
  "node_modules/rat-vec/index.js"(exports, module) {
    "use strict";
    module.exports = float2rat;
    var rat = require_big_rat();
    function float2rat(v) {
      var result = new Array(v.length);
      for (var i = 0; i < v.length; ++i) {
        result[i] = rat(v[i]);
      }
      return result;
    }
  }
});

// node_modules/nextafter/nextafter.js
var require_nextafter = __commonJS({
  "node_modules/nextafter/nextafter.js"(exports, module) {
    "use strict";
    var doubleBits = require_double();
    var SMALLEST_DENORM = Math.pow(2, -1074);
    var UINT_MAX = -1 >>> 0;
    module.exports = nextafter;
    function nextafter(x, y) {
      if (isNaN(x) || isNaN(y)) {
        return NaN;
      }
      if (x === y) {
        return x;
      }
      if (x === 0) {
        if (y < 0) {
          return -SMALLEST_DENORM;
        } else {
          return SMALLEST_DENORM;
        }
      }
      var hi = doubleBits.hi(x);
      var lo = doubleBits.lo(x);
      if (y > x === x > 0) {
        if (lo === UINT_MAX) {
          hi += 1;
          lo = 0;
        } else {
          lo += 1;
        }
      } else {
        if (lo === 0) {
          lo = UINT_MAX;
          hi -= 1;
        } else {
          lo -= 1;
        }
      }
      return doubleBits.pack(lo, hi);
    }
  }
});

// node_modules/big-rat/mul.js
var require_mul = __commonJS({
  "node_modules/big-rat/mul.js"(exports, module) {
    "use strict";
    var rationalize = require_rationalize();
    module.exports = mul;
    function mul(a, b) {
      return rationalize(a[0].mul(b[0]), a[1].mul(b[1]));
    }
  }
});

// node_modules/big-rat/sub.js
var require_sub = __commonJS({
  "node_modules/big-rat/sub.js"(exports, module) {
    "use strict";
    var rationalize = require_rationalize();
    module.exports = sub;
    function sub(a, b) {
      return rationalize(a[0].mul(b[1]).sub(a[1].mul(b[0])), a[1].mul(b[1]));
    }
  }
});

// node_modules/big-rat/sign.js
var require_sign = __commonJS({
  "node_modules/big-rat/sign.js"(exports, module) {
    "use strict";
    var bnsign = require_bn_sign();
    module.exports = sign;
    function sign(x) {
      return bnsign(x[0]) * bnsign(x[1]);
    }
  }
});

// node_modules/rat-vec/sub.js
var require_sub2 = __commonJS({
  "node_modules/rat-vec/sub.js"(exports, module) {
    "use strict";
    var bnsub = require_sub();
    module.exports = sub;
    function sub(a, b) {
      var n = a.length;
      var r = new Array(n);
      for (var i = 0; i < n; ++i) {
        r[i] = bnsub(a[i], b[i]);
      }
      return r;
    }
  }
});

// node_modules/big-rat/add.js
var require_add = __commonJS({
  "node_modules/big-rat/add.js"(exports, module) {
    "use strict";
    var rationalize = require_rationalize();
    module.exports = add;
    function add(a, b) {
      return rationalize(
        a[0].mul(b[1]).add(b[0].mul(a[1])),
        a[1].mul(b[1])
      );
    }
  }
});

// node_modules/rat-vec/add.js
var require_add2 = __commonJS({
  "node_modules/rat-vec/add.js"(exports, module) {
    "use strict";
    var bnadd = require_add();
    module.exports = add;
    function add(a, b) {
      var n = a.length;
      var r = new Array(n);
      for (var i = 0; i < n; ++i) {
        r[i] = bnadd(a[i], b[i]);
      }
      return r;
    }
  }
});

// node_modules/rat-vec/muls.js
var require_muls = __commonJS({
  "node_modules/rat-vec/muls.js"(exports, module) {
    "use strict";
    var rat = require_big_rat();
    var mul = require_mul();
    module.exports = muls;
    function muls(a, x) {
      var s = rat(x);
      var n = a.length;
      var r = new Array(n);
      for (var i = 0; i < n; ++i) {
        r[i] = mul(a[i], s);
      }
      return r;
    }
  }
});

// packages/clean-pslg/lib/rat-seg-intersect.js
var require_rat_seg_intersect = __commonJS({
  "packages/clean-pslg/lib/rat-seg-intersect.js"(exports, module) {
    "use strict";
    module.exports = solveIntersection;
    var ratMul = require_mul();
    var ratDiv = require_div();
    var ratSub = require_sub();
    var ratSign = require_sign();
    var rvSub = require_sub2();
    var rvAdd = require_add2();
    var rvMuls = require_muls();
    function ratPerp(a, b) {
      return ratSub(ratMul(a[0], b[1]), ratMul(a[1], b[0]));
    }
    function solveIntersection(a, b, c, d) {
      var ba = rvSub(b, a);
      var dc = rvSub(d, c);
      var baXdc = ratPerp(ba, dc);
      if (ratSign(baXdc) === 0) {
        return null;
      }
      var ac = rvSub(a, c);
      var dcXac = ratPerp(dc, ac);
      var t = ratDiv(dcXac, baXdc);
      var s = rvMuls(ba, t);
      var r = rvAdd(a, s);
      return r;
    }
  }
});

// packages/clean-pslg/clean-pslg.js
var require_clean_pslg = __commonJS({
  "packages/clean-pslg/clean-pslg.js"(exports, module) {
    "use strict";
    module.exports = cleanPSLG2;
    var UnionFind = require_union_find();
    var boxIntersect = require_box_intersect();
    var segseg = require_segseg();
    var rat = require_big_rat();
    var ratCmp = require_cmp();
    var ratToFloat = require_to_float();
    var ratVec = require_rat_vec();
    var nextafter = require_nextafter();
    var solveIntersection = require_rat_seg_intersect();
    function boundRat(r) {
      var f = ratToFloat(r);
      return [
        nextafter(f, -Infinity),
        nextafter(f, Infinity)
      ];
    }
    function boundEdges(points, edges) {
      var bounds = new Array(edges.length);
      for (var i = 0; i < edges.length; ++i) {
        var e = edges[i];
        var a = points[e[0]];
        var b = points[e[1]];
        bounds[i] = [
          nextafter(Math.min(a[0], b[0]), -Infinity),
          nextafter(Math.min(a[1], b[1]), -Infinity),
          nextafter(Math.max(a[0], b[0]), Infinity),
          nextafter(Math.max(a[1], b[1]), Infinity)
        ];
      }
      return bounds;
    }
    function boundPoints(points) {
      var bounds = new Array(points.length);
      for (var i = 0; i < points.length; ++i) {
        var p = points[i];
        bounds[i] = [
          nextafter(p[0], -Infinity),
          nextafter(p[1], -Infinity),
          nextafter(p[0], Infinity),
          nextafter(p[1], Infinity)
        ];
      }
      return bounds;
    }
    function getCrossings(points, edges, edgeBounds) {
      var result = [];
      boxIntersect(edgeBounds, function(i, j) {
        var e = edges[i];
        var f = edges[j];
        if (e[0] === f[0] || e[0] === f[1] || e[1] === f[0] || e[1] === f[1]) {
          return;
        }
        var a = points[e[0]];
        var b = points[e[1]];
        var c = points[f[0]];
        var d = points[f[1]];
        if (segseg(a, b, c, d)) {
          result.push([i, j]);
        }
      });
      return result;
    }
    function getTJunctions(points, edges, edgeBounds, vertBounds) {
      var result = [];
      boxIntersect(edgeBounds, vertBounds, function(i, v) {
        var e = edges[i];
        if (e[0] === v || e[1] === v) {
          return;
        }
        var p = points[v];
        var a = points[e[0]];
        var b = points[e[1]];
        if (segseg(a, b, p, p)) {
          result.push([i, v]);
        }
      });
      return result;
    }
    function cutEdges(floatPoints, edges, crossings, junctions, useColor) {
      var i, e;
      var ratPoints = floatPoints.map(function(p) {
        return [
          rat(p[0]),
          rat(p[1])
        ];
      });
      for (i = 0; i < crossings.length; ++i) {
        var crossing = crossings[i];
        e = crossing[0];
        var f = crossing[1];
        var ee = edges[e];
        var ef = edges[f];
        var x = solveIntersection(
          ratVec(floatPoints[ee[0]]),
          ratVec(floatPoints[ee[1]]),
          ratVec(floatPoints[ef[0]]),
          ratVec(floatPoints[ef[1]])
        );
        if (!x) {
          continue;
        }
        var idx = floatPoints.length;
        floatPoints.push([ratToFloat(x[0]), ratToFloat(x[1])]);
        ratPoints.push(x);
        junctions.push([e, idx], [f, idx]);
      }
      junctions.sort(function(a2, b2) {
        if (a2[0] !== b2[0]) {
          return a2[0] - b2[0];
        }
        var u = ratPoints[a2[1]];
        var v = ratPoints[b2[1]];
        return ratCmp(u[0], v[0]) || ratCmp(u[1], v[1]);
      });
      for (i = junctions.length - 1; i >= 0; --i) {
        var junction = junctions[i];
        e = junction[0];
        var edge = edges[e];
        var s = edge[0];
        var t = edge[1];
        var a = floatPoints[s];
        var b = floatPoints[t];
        if ((a[0] - b[0] || a[1] - b[1]) < 0) {
          var tmp = s;
          s = t;
          t = tmp;
        }
        edge[0] = s;
        var last = edge[1] = junction[1];
        var color;
        if (useColor) {
          color = edge[2];
        }
        while (i > 0 && junctions[i - 1][0] === e) {
          var junction = junctions[--i];
          var next = junction[1];
          if (useColor) {
            edges.push([last, next, color]);
          } else {
            edges.push([last, next]);
          }
          last = next;
        }
        if (useColor) {
          edges.push([last, t, color]);
        } else {
          edges.push([last, t]);
        }
      }
      return ratPoints;
    }
    function dedupPoints(floatPoints, ratPoints, floatBounds) {
      var numPoints = ratPoints.length;
      var uf = new UnionFind(numPoints);
      var bounds = [];
      for (var i = 0; i < ratPoints.length; ++i) {
        var p = ratPoints[i];
        var xb = boundRat(p[0]);
        var yb = boundRat(p[1]);
        bounds.push([
          nextafter(xb[0], -Infinity),
          nextafter(yb[0], -Infinity),
          nextafter(xb[1], Infinity),
          nextafter(yb[1], Infinity)
        ]);
      }
      boxIntersect(bounds, function(i2, j2) {
        uf.link(i2, j2);
      });
      var noDupes = true;
      var labels = new Array(numPoints);
      for (var i = 0; i < numPoints; ++i) {
        var j = uf.find(i);
        if (j !== i) {
          noDupes = false;
          floatPoints[j] = [
            Math.min(floatPoints[i][0], floatPoints[j][0]),
            Math.min(floatPoints[i][1], floatPoints[j][1])
          ];
        }
      }
      if (noDupes) {
        return null;
      }
      var ptr = 0;
      for (var i = 0; i < numPoints; ++i) {
        var j = uf.find(i);
        if (j === i) {
          labels[i] = ptr;
          floatPoints[ptr++] = floatPoints[i];
        } else {
          labels[i] = -1;
        }
      }
      floatPoints.length = ptr;
      for (var i = 0; i < numPoints; ++i) {
        if (labels[i] < 0) {
          labels[i] = labels[uf.find(i)];
        }
      }
      return labels;
    }
    function compareLex2(a, b) {
      return a[0] - b[0] || a[1] - b[1];
    }
    function compareLex3(a, b) {
      var d = a[0] - b[0] || a[1] - b[1];
      if (d) {
        return d;
      }
      if (a[2] < b[2]) {
        return -1;
      } else if (a[2] > b[2]) {
        return 1;
      }
      return 0;
    }
    function dedupEdges(edges, labels, useColor) {
      if (edges.length === 0) {
        return;
      }
      if (labels) {
        for (var i = 0; i < edges.length; ++i) {
          var e = edges[i];
          var a = labels[e[0]];
          var b = labels[e[1]];
          e[0] = Math.min(a, b);
          e[1] = Math.max(a, b);
        }
      } else {
        for (var i = 0; i < edges.length; ++i) {
          var e = edges[i];
          var a = e[0];
          var b = e[1];
          e[0] = Math.min(a, b);
          e[1] = Math.max(a, b);
        }
      }
      if (useColor) {
        edges.sort(compareLex3);
      } else {
        edges.sort(compareLex2);
      }
      var ptr = 1;
      for (var i = 1; i < edges.length; ++i) {
        var prev = edges[i - 1];
        var next = edges[i];
        if (next[0] === prev[0] && next[1] === prev[1] && (!useColor || next[2] === prev[2])) {
          continue;
        }
        edges[ptr++] = next;
      }
      edges.length = ptr;
    }
    function preRound(points, edges, useColor) {
      var labels = dedupPoints(points, [], boundPoints(points));
      dedupEdges(edges, labels, useColor);
      return !!labels;
    }
    function snapRound(points, edges, useColor) {
      var edgeBounds = boundEdges(points, edges);
      var crossings = getCrossings(points, edges, edgeBounds);
      var vertBounds = boundPoints(points);
      var tjunctions = getTJunctions(points, edges, edgeBounds, vertBounds);
      var ratPoints = cutEdges(points, edges, crossings, tjunctions, useColor);
      var labels = dedupPoints(points, ratPoints, vertBounds);
      dedupEdges(edges, labels, useColor);
      if (!labels) {
        return crossings.length > 0 || tjunctions.length > 0;
      }
      return true;
    }
    function cleanPSLG2(points, edges, colors) {
      var prevEdges;
      if (colors) {
        prevEdges = edges;
        var augEdges = new Array(edges.length);
        for (var i = 0; i < edges.length; ++i) {
          var e = edges[i];
          augEdges[i] = [e[0], e[1], colors[i]];
        }
        edges = augEdges;
      }
      var modified = preRound(points, edges, !!colors);
      while (snapRound(points, edges, !!colors)) {
        modified = true;
      }
      if (!!colors && modified) {
        prevEdges.length = 0;
        colors.length = 0;
        for (var i = 0; i < edges.length; ++i) {
          var e = edges[i];
          prevEdges.push([e[0], e[1]]);
          colors.push(e[2]);
        }
      }
      return modified;
    }
  }
});

// src/create-texture.js
function createTexture(device, label, width, height, mip_count, format, usage) {
  const texture = device.createTexture({
    label,
    size: { width, height },
    format,
    usage,
    mipLevelCount: mip_count,
    sampleCount: 1,
    dimension: "2d"
  });
  const view = texture.createView();
  const mip_view = [];
  for (let i = 0; i < mip_count; i++)
    mip_view.push(texture.createView({
      label,
      format,
      dimension: "2d",
      aspect: "all",
      baseMipLevel: i,
      mipLevelCount: 1,
      baseArrayLayer: 0,
      arrayLayerCount: 1
    }));
  const sampler = device.createSampler({
    label: `${label} sampler`,
    addressModeU: "clamp-to-edge",
    addressModeV: "clamp-to-edge",
    addressModeW: "clamp-to-edge",
    magFilter: "linear",
    minFilter: "linear",
    mipmapFilter: "linear"
  });
  return {
    size: { width, height },
    texture,
    view,
    mip_view,
    sampler
  };
}

// src/get-preferred-format.js
function getPreferredFormat(cobalt) {
  if (cobalt.canvas)
    return navigator.gpu?.getPreferredCanvasFormat();
  else
    return cobalt.context.getPreferredFormat();
}

// src/create-texture-from-url.js
async function createTextureFromUrl(c, label, url, format) {
  const response = await fetch(url);
  const blob = await response.blob();
  format = format || getPreferredFormat(c);
  const imageData = await createImageBitmap(
    blob
    /*, { premultiplyAlpha: 'none', resizeQuality: 'pixelated' }*/
  );
  const usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT;
  const mip_count = 1;
  const t = createTexture(c.device, label, imageData.width, imageData.height, mip_count, format, usage);
  c.device.queue.copyExternalImageToTexture(
    { source: imageData },
    { texture: t.texture },
    {
      width: imageData.width,
      height: imageData.height
    }
  );
  const samplerDescriptor = {
    addressModeU: "repeat",
    // repeat | clamp-to-edge
    addressModeV: "repeat",
    // repeat | clamp-to-edge
    magFilter: "nearest",
    minFilter: "nearest",
    mipmapFilter: "nearest",
    maxAnisotropy: 1
  };
  t.sampler = c.device.createSampler(samplerDescriptor);
  return t;
}

// src/create-texture-from-buffer.js
function createTextureFromBuffer(c, label, image, format) {
  format = format || getPreferredFormat(c);
  const usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT;
  const mip_count = 1;
  const t = createTexture(c.device, label, image.width, image.height, mip_count, format, usage);
  c.device.queue.writeTexture(
    { texture: t.texture },
    image.data,
    { bytesPerRow: 4 * image.width },
    { width: image.width, height: image.height }
  );
  const samplerDescriptor = {
    addressModeU: "repeat",
    // repeat | clamp-to-edge
    addressModeV: "repeat",
    // repeat | clamp-to-edge
    magFilter: "nearest",
    minFilter: "nearest",
    mipmapFilter: "nearest",
    maxAnisotropy: 1
  };
  t.sampler = c.device.createSampler(samplerDescriptor);
  return t;
}

// src/bloom/bloom.wgsl
var bloom_default = `const BLOOM_MIP_COUNT:i32=7;const MODE_PREFILTER:u32=0u;const MODE_DOWNSAMPLE:u32=1u;const MODE_UPSAMPLE_FIRST:u32=2u;const MODE_UPSAMPLE:u32=3u;const EPSILON:f32=1.0e-4;struct bloom_param{parameters:vec4<f32>,combine_constant:f32,doop:u32,ferp:u32,}struct mode_lod_param{mode_lod:u32,}@group(0)@binding(0)var output_texture:texture_storage_2d<rgba16float,write>;@group(0)@binding(1)var input_texture:texture_2d<f32>;@group(0)@binding(2)var bloom_texture:texture_2d<f32>;@group(0)@binding(3)var samp:sampler;@group(0)@binding(4)var<uniform> param:bloom_param;@group(0)@binding(5)var<uniform> pc:mode_lod_param;fn QuadraticThreshold(color:vec4<f32>,threshold:f32,curve:vec3<f32>)->vec4<f32>{let brightness=max(max(color.r,color.g),color.b);var rq:f32=clamp(brightness-curve.x,0.0,curve.y);rq=curve.z*(rq*rq);let ret_color=color*max(rq,brightness-threshold)/max(brightness,EPSILON);return ret_color;}fn Prefilter(color:vec4<f32>,uv:vec2<f32>)->vec4<f32>{let clamp_value=20.0;var c=min(vec4<f32>(clamp_value),color);c=QuadraticThreshold(color,param.parameters.x,param.parameters.yzw);return c;}fn DownsampleBox13(tex:texture_2d<f32>,lod:f32,uv:vec2<f32>,tex_size:vec2<f32>)->vec3<f32>{let A=textureSampleLevel(tex,samp,uv,lod).rgb;let texel_size=tex_size*0.5;let B=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(-1.0,-1.0),lod).rgb;let C=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(-1.0,1.0),lod).rgb;let D=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(1.0,1.0),lod).rgb;let E=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(1.0,-1.0),lod).rgb;let F=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(-2.0,-2.0),lod).rgb;let G=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(-2.0,0.0),lod).rgb;let H=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(0.0,2.0),lod).rgb;let I=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(2.0,2.0),lod).rgb;let J=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(2.0,2.0),lod).rgb;let K=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(2.0,0.0),lod).rgb;let L=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(-2.0,-2.0),lod).rgb;let M=textureSampleLevel(tex,samp,uv+texel_size*vec2<f32>(0.0,-2.0),lod).rgb;var result:vec3<f32>=vec3<f32>(0.0);result=result+(B+C+D+E)*0.5;result=result+(F+G+A+M)*0.125;result=result+(G+H+I+A)*0.125;result=result+(A+I+J+K)*0.125;result=result+(M+A+K+L)*0.125;result=result*0.25;return result;}fn UpsampleTent9(tex:texture_2d<f32>,lod:f32,uv:vec2<f32>,texel_size:vec2<f32>,radius:f32)->vec3<f32>{let offset=texel_size.xyxy*vec4<f32>(1.0,1.0,-1.0,0.0)*radius;var result:vec3<f32>=textureSampleLevel(tex,samp,uv,lod).rgb*4.0;result=result+textureSampleLevel(tex,samp,uv-offset.xy,lod).rgb;result=result+textureSampleLevel(tex,samp,uv-offset.wy,lod).rgb*2.0;result=result+textureSampleLevel(tex,samp,uv-offset.zy,lod).rgb;result=result+textureSampleLevel(tex,samp,uv+offset.zw,lod).rgb*2.0;result=result+textureSampleLevel(tex,samp,uv+offset.xw,lod).rgb*2.0;result=result+textureSampleLevel(tex,samp,uv+offset.zy,lod).rgb;result=result+textureSampleLevel(tex,samp,uv+offset.wy,lod).rgb*2.0;result=result+textureSampleLevel(tex,samp,uv+offset.xy,lod).rgb;return result*(1.0/16.0);}fn combine(ex_color:vec3<f32>,color_to_add:vec3<f32>,combine_constant:f32)->vec3<f32>{let existing_color=ex_color+(-color_to_add);let blended_color=(combine_constant*existing_color)+color_to_add;return blended_color;}@compute @workgroup_size(8,4,1)fn cs_main(@builtin(global_invocation_id)global_invocation_id:vec3<u32>){let mode=pc.mode_lod>>16u;let lod=pc.mode_lod&65535u;let imgSize=textureDimensions(output_texture);if(global_invocation_id.x<u32(imgSize.x)&&global_invocation_id.y<u32(imgSize.y)){var texCoords:vec2<f32>=vec2<f32>(f32(global_invocation_id.x)/f32(imgSize.x),f32(global_invocation_id.y)/f32(imgSize.y));texCoords=texCoords+(1.0/vec2<f32>(imgSize))*0.5;let texSize=vec2<f32>(textureDimensions(input_texture,i32(lod)));var color:vec4<f32>=vec4<f32>(1.0);if(mode==MODE_PREFILTER){color=vec4<f32>(DownsampleBox13(input_texture,f32(lod),texCoords,1.0/texSize),1.0);color=Prefilter(color,texCoords);}else if(mode==MODE_DOWNSAMPLE){color=vec4<f32>(DownsampleBox13(input_texture,f32(lod),texCoords,1.0/texSize),1.0);}else if(mode==MODE_UPSAMPLE_FIRST){let bloomTexSize=textureDimensions(input_texture,i32(lod)+1);let sampleScale=1.0;let upsampledTexture=UpsampleTent9(input_texture,f32(lod)+1.0,texCoords,1.0/vec2<f32>(bloomTexSize),sampleScale);let existing=textureSampleLevel(input_texture,samp,texCoords,f32(lod)).rgb;color=vec4<f32>(combine(existing,upsampledTexture,param.combine_constant),1.0);}else if(mode==MODE_UPSAMPLE){let bloomTexSize=textureDimensions(bloom_texture,i32(lod)+1);let sampleScale=1.0;let upsampledTexture=UpsampleTent9(bloom_texture,f32(lod)+1.0,texCoords,1.0/vec2<f32>(bloomTexSize),sampleScale);let existing=textureSampleLevel(input_texture,samp,texCoords,f32(lod)).rgb;color=vec4<f32>(combine(existing,upsampledTexture,param.combine_constant),1.0);}textureStore(output_texture,vec2<i32>(global_invocation_id.xy),color);}}`;

// src/bloom/bloom.js
var BLOOM_MIP_COUNT = 7;
var MODE_PREFILTER = 0;
var MODE_DOWNSAMPLE = 1;
var MODE_UPSAMPLE_FIRST = 2;
var MODE_UPSAMPLE = 3;
var bloom_default2 = {
  type: "cobalt:bloom",
  refs: [
    { name: "emissive", type: "textureView", format: "rgba16", access: "read" },
    { name: "hdr", type: "textureView", format: "rgba16", access: "read" },
    { name: "bloom", type: "textureView", format: "rgba16", access: "readwrite" }
  ],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
    draw(cobalt, node.data, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, node) {
    destroy(node);
  },
  onResize: function(cobalt, node) {
    resize(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
  }
};
function init(cobalt, nodeData) {
  const { device } = cobalt;
  const viewportWidth = cobalt.viewport.width;
  const viewportHeight = cobalt.viewport.height;
  const bloom_mat = {
    compute_pipeline: null,
    bind_group: [],
    bind_group_layout: [],
    bind_groups_textures: [],
    buffers: []
    // buffers that we should destroy when cleaning up
  };
  const layout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        storageTexture: {
          access: "write-only",
          format: "rgba16float",
          viewDimension: "2d"
        }
      },
      {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        texture: {
          sampleType: "float",
          viewDimension: "2d",
          multisampled: false
        }
      },
      {
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        texture: {
          sampleType: "float",
          viewDimension: "2d",
          multisampled: false
        }
      },
      {
        binding: 3,
        visibility: GPUShaderStage.COMPUTE,
        sampler: {}
      },
      {
        binding: 4,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "uniform"
          //minBindingSize: 24 // sizeOf(BloomParam)
        }
      },
      {
        binding: 5,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "uniform"
          //minBindingSize: 4 // sizeOf(lode_mode Param)
        }
      }
    ]
  });
  bloom_mat.bind_group_layout.push(layout);
  bloom_mat.bind_groups_textures.push(createTexture(
    device,
    "bloom downsampler image 0",
    viewportWidth / 2,
    viewportHeight / 2,
    BLOOM_MIP_COUNT,
    "rgba16float",
    GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
  ));
  bloom_mat.bind_groups_textures.push(createTexture(
    device,
    "bloom downsampler image 1",
    viewportWidth / 2,
    viewportHeight / 2,
    BLOOM_MIP_COUNT,
    "rgba16float",
    GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
  ));
  bloom_mat.bind_groups_textures.push(nodeData.refs.bloom.data);
  const compute_pipeline_layout = device.createPipelineLayout({
    bindGroupLayouts: bloom_mat.bind_group_layout
  });
  const compute_pipeline = device.createComputePipeline({
    layout: compute_pipeline_layout,
    compute: {
      module: device.createShaderModule({
        code: bloom_default
      }),
      entryPoint: "cs_main"
    }
  });
  set_all_bind_group(cobalt, bloom_mat, nodeData);
  bloom_mat.compute_pipeline = compute_pipeline;
  return bloom_mat;
}
function set_all_bind_group(cobalt, bloom_mat, node) {
  const { refs } = node;
  const { device } = cobalt;
  const bloom_threshold = node.options.bloom_threshold ?? 0.1;
  const bloom_knee = node.options.bloom_knee ?? 0.2;
  const combine_constant = node.options.bloom_combine_constant ?? 0.68;
  const dat = new Float32Array([
    bloom_threshold,
    bloom_threshold - bloom_knee,
    bloom_knee * 2,
    0.25 / bloom_knee,
    combine_constant,
    // required byte alignment bs
    0,
    0,
    0
  ]);
  const params_buf = device.createBuffer({
    label: "bloom static parameters buffer",
    size: dat.byteLength,
    // vec4<f32> and f32 and u32 with 4 bytes per float32 and 4 bytes per u32
    mappedAtCreation: true,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  bloom_mat.buffers.push(params_buf);
  new Float32Array(params_buf.getMappedRange()).set(dat);
  params_buf.unmap();
  bloom_mat.bind_group.length = 0;
  bloom_mat.params_buf = params_buf;
  bloom_mat.bind_group.push(create_bloom_bind_group(
    device,
    bloom_mat,
    bloom_mat.bind_groups_textures[0].mip_view[0],
    refs.emissive.data.view,
    refs.hdr.data.view,
    // unused here, only for upsample passes
    refs.hdr.data.sampler,
    params_buf,
    MODE_PREFILTER << 16 | 0
    // mode_lod value
  ));
  for (let i = 1; i < BLOOM_MIP_COUNT; i++) {
    bloom_mat.bind_group.push(create_bloom_bind_group(
      device,
      bloom_mat,
      bloom_mat.bind_groups_textures[1].mip_view[i],
      bloom_mat.bind_groups_textures[0].view,
      refs.hdr.data.view,
      // unused here, only for upsample passes
      refs.hdr.data.sampler,
      params_buf,
      MODE_DOWNSAMPLE << 16 | i - 1
      // mode_lod value
    ));
    bloom_mat.bind_group.push(create_bloom_bind_group(
      device,
      bloom_mat,
      bloom_mat.bind_groups_textures[0].mip_view[i],
      bloom_mat.bind_groups_textures[1].view,
      refs.hdr.data.view,
      // unused here, only for upsample passes
      refs.hdr.data.sampler,
      params_buf,
      MODE_DOWNSAMPLE << 16 | i
      // mode_lod value
    ));
  }
  bloom_mat.bind_group.push(create_bloom_bind_group(
    device,
    bloom_mat,
    bloom_mat.bind_groups_textures[2].mip_view[BLOOM_MIP_COUNT - 1],
    bloom_mat.bind_groups_textures[0].view,
    refs.hdr.data.view,
    // unused here, only for upsample passes
    refs.hdr.data.sampler,
    params_buf,
    MODE_UPSAMPLE_FIRST << 16 | BLOOM_MIP_COUNT - 2
    // mode_lod value
  ));
  let o = true;
  for (let i = BLOOM_MIP_COUNT - 2; i >= 0; i--) {
    if (o) {
      bloom_mat.bind_group.push(create_bloom_bind_group(
        device,
        bloom_mat,
        bloom_mat.bind_groups_textures[1].mip_view[i],
        bloom_mat.bind_groups_textures[0].view,
        bloom_mat.bind_groups_textures[2].view,
        refs.hdr.data.sampler,
        params_buf,
        MODE_UPSAMPLE << 16 | i
        // mode_lod value
      ));
      o = false;
    } else {
      bloom_mat.bind_group.push(create_bloom_bind_group(
        device,
        bloom_mat,
        bloom_mat.bind_groups_textures[2].mip_view[i],
        bloom_mat.bind_groups_textures[0].view,
        bloom_mat.bind_groups_textures[1].view,
        refs.hdr.data.sampler,
        params_buf,
        MODE_UPSAMPLE << 16 | i
        // mode_lod value
      ));
      o = true;
    }
  }
}
function create_bloom_bind_group(device, bloom_mat, output_image, input_image, bloom_image, sampler, params_buf, mode_lod) {
  const dat2 = new Uint32Array([mode_lod]);
  const lod_buf = device.createBuffer({
    label: "bloom static mode_lod buffer",
    size: dat2.byteLength,
    mappedAtCreation: true,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  bloom_mat.buffers.push(lod_buf);
  new Uint32Array(lod_buf.getMappedRange()).set(dat2);
  lod_buf.unmap();
  return device.createBindGroup({
    label: "bloom bind group layout",
    layout: bloom_mat.bind_group_layout[0],
    entries: [
      {
        binding: 0,
        resource: output_image
      },
      {
        binding: 1,
        resource: input_image
      },
      {
        binding: 2,
        resource: bloom_image
      },
      {
        binding: 3,
        resource: sampler
      },
      {
        binding: 4,
        resource: {
          buffer: params_buf
        }
      },
      {
        binding: 5,
        resource: {
          buffer: lod_buf
        }
      }
    ]
  });
}
function draw(cobalt, bloom_mat, commandEncoder) {
  const MODE_PREFILTER2 = 0;
  const MODE_DOWNSAMPLE2 = 1;
  const MODE_UPSAMPLE_FIRST2 = 2;
  const MODE_UPSAMPLE2 = 3;
  let bind_group_index = 0;
  const compute_pass = commandEncoder.beginComputePass({
    label: "bloom Compute Pass"
  });
  compute_pass.setPipeline(bloom_mat.compute_pipeline);
  compute_pass.setBindGroup(0, bloom_mat.bind_group[bind_group_index]);
  bind_group_index += 1;
  let mip_size = get_mip_size(0, bloom_mat.bind_groups_textures[0]);
  compute_pass.dispatchWorkgroups(mip_size.width / 8 + 1, mip_size.height / 4 + 1, 1);
  for (let i = 1; i < BLOOM_MIP_COUNT; i++) {
    mip_size = get_mip_size(i, bloom_mat.bind_groups_textures[0]);
    compute_pass.setBindGroup(0, bloom_mat.bind_group[bind_group_index]);
    bind_group_index += 1;
    compute_pass.dispatchWorkgroups(mip_size.width / 8 + 1, mip_size.height / 4 + 1, 1);
    compute_pass.setBindGroup(0, bloom_mat.bind_group[bind_group_index]);
    bind_group_index += 1;
    compute_pass.dispatchWorkgroups(mip_size.width / 8 + 1, mip_size.height / 4 + 1, 1);
  }
  compute_pass.setBindGroup(0, bloom_mat.bind_group[bind_group_index]);
  bind_group_index += 1;
  mip_size = get_mip_size(BLOOM_MIP_COUNT - 1, bloom_mat.bind_groups_textures[2]);
  compute_pass.dispatchWorkgroups(mip_size.width / 8 + 1, mip_size.height / 4 + 1, 1);
  for (let i = BLOOM_MIP_COUNT - 2; i >= 0; i--) {
    mip_size = get_mip_size(i, bloom_mat.bind_groups_textures[2]);
    compute_pass.setBindGroup(0, bloom_mat.bind_group[bind_group_index]);
    bind_group_index += 1;
    compute_pass.dispatchWorkgroups(mip_size.width / 8 + 1, mip_size.height / 4 + 1, 1);
  }
  compute_pass.end();
}
function get_mip_size(current_mip, texture) {
  let width = texture.size.width;
  let height = texture.size.height;
  for (let i = 0; i < current_mip; i++) {
    width /= 2;
    height /= 2;
  }
  return { width, height, depthOrArrayLayers: 1 };
}
function resize(cobalt, nodeData) {
  const { device } = cobalt;
  const bloom_mat = nodeData.data;
  destroy(bloom_mat);
  bloom_mat.bind_groups_textures.push(createTexture(
    device,
    "bloom downsampler image 0",
    cobalt.viewport.width / 2,
    cobalt.viewport.height / 2,
    BLOOM_MIP_COUNT,
    "rgba16float",
    GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
  ));
  bloom_mat.bind_groups_textures.push(createTexture(
    device,
    "bloom downsampler image 1",
    cobalt.viewport.width / 2,
    cobalt.viewport.height / 2,
    BLOOM_MIP_COUNT,
    "rgba16float",
    GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
  ));
  bloom_mat.bind_groups_textures.push(nodeData.refs.bloom.data);
  set_all_bind_group(cobalt, bloom_mat, nodeData);
}
function destroy(bloom_mat) {
  for (const t of bloom_mat.bind_groups_textures)
    t.texture.destroy();
  for (const b of bloom_mat.buffers)
    b.destroy();
  bloom_mat.buffers.length = 0;
  bloom_mat.bind_groups_textures.length = 0;
}

// src/scene-composite/scene-composite.wgsl
var scene_composite_default = `struct BloomComposite{bloom_intensity:f32,bloom_combine_constant:f32,}@group(0)@binding(0)var mySampler:sampler;@group(0)@binding(1)var colorTexture:texture_2d<f32>;@group(0)@binding(2)var emissiveTexture:texture_2d<f32>;@group(0)@binding(3)var<uniform> composite_parameter:BloomComposite;struct VertexOutput{@builtin(position)Position:vec4<f32>,@location(0)fragUV:vec2<f32>,}const positions=array<vec2<f32>,3>(vec2<f32>(-1.0,-3.0),vec2<f32>(3.0,1.0),vec2<f32>(-1.0,1.0));const uvs=array<vec2<f32>,3>(vec2<f32>(0.0,2.0),vec2<f32>(2.0,0.0),vec2<f32>(0.0,0.0));@vertex fn vert_main(@builtin(vertex_index)VertexIndex:u32)->VertexOutput{var output:VertexOutput;output.Position=vec4<f32>(positions[VertexIndex],0.0,1.0);output.fragUV=vec2<f32>(uvs[VertexIndex]);return output;}fn GTTonemap_point(x:f32)->f32{let m:f32=0.22;let a:f32=1.0;let c:f32=1.33;let P:f32=1.0;let l:f32=0.4;let l0:f32=((P-m)*l)/a;let S0:f32=m+l0;let S1:f32=m+a*l0;let C2:f32=(a*P)/(P-S1);let L:f32=m+a*(x-m);let T:f32=m*pow(x/m,c);let S:f32=P-(P-S1)*exp(-C2*(x-S0)/P);let w0:f32=1.0-smoothstep(0.0,m,x);var w2:f32=1.0;if(x<m+l){w2=0.0;}let w1:f32=1.0-w0-w2;return f32(T*w0+L*w1+S*w2);}fn GTTonemap(x:vec3<f32>)->vec3<f32>{return vec3<f32>(GTTonemap_point(x.r),GTTonemap_point(x.g),GTTonemap_point(x.b));}fn aces(x:vec3<f32>)->vec3<f32>{let a:f32=2.51;let b:f32=0.03;let c:f32=2.43;let d:f32=0.59;let e:f32=0.14;return clamp((x*(a*x+b))/(x*(c*x+d)+e),vec3<f32>(0.0),vec3<f32>(1.0));}@fragment fn frag_main(@location(0)fragUV:vec2<f32>)->@location(0)vec4<f32>{let hdr_color=textureSample(colorTexture,mySampler,fragUV);let bloom_color=textureSample(emissiveTexture,mySampler,fragUV);let combined_color=((bloom_color*composite_parameter.bloom_intensity)*composite_parameter.bloom_combine_constant);let mapped_color=GTTonemap(combined_color.rgb);let gamma_corrected_color=pow(mapped_color,vec3<f32>(1.0/2.2));return vec4<f32>(gamma_corrected_color+hdr_color.rgb,1.0);}`;

// src/scene-composite/scene-composite.js
var scene_composite_default2 = {
  type: "cobalt:bloom",
  refs: [
    { name: "hdr", type: "textureView", format: "rgba16", access: "read" },
    { name: "bloom", type: "textureView", format: "rgba16", access: "read" },
    { name: "combined", type: "textureView", format: "PREFERRED_TEXTURE_FORMAT", access: "write" }
  ],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init2(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
    draw2(cobalt, node, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, node) {
  },
  onResize: function(cobalt, node) {
    resize2(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
  }
};
function init2(cobalt, node) {
  const { options, refs } = node;
  const { device } = cobalt;
  const format = getPreferredFormat(cobalt);
  const bloom_intensity = options.bloom_intensity ?? 40;
  const bloom_combine_constant = options.bloom_combine_constant ?? 0.68;
  const dat = new Float32Array([bloom_intensity, bloom_combine_constant]);
  const params_buf = device.createBuffer({
    label: "scene composite params buffer",
    size: dat.byteLength,
    // vec4<f32> and f32 and u32 with 4 bytes per float32 and 4 bytes per u32
    mappedAtCreation: true,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  new Float32Array(params_buf.getMappedRange()).set(dat);
  params_buf.unmap();
  const pipeline = device.createRenderPipeline({
    label: "scenecomposite",
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        code: scene_composite_default
      }),
      entryPoint: "vert_main"
    },
    fragment: {
      module: device.createShaderModule({
        code: scene_composite_default
      }),
      entryPoint: "frag_main",
      targets: [
        {
          format
        }
      ]
    },
    primitive: {
      topology: "triangle-list"
    }
  });
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: refs.hdr.data.sampler
      },
      // color
      {
        binding: 1,
        resource: refs.hdr.data.view
      },
      // emissive
      {
        binding: 2,
        resource: refs.bloom.data.mip_view[0]
      },
      {
        binding: 3,
        resource: {
          buffer: params_buf
        }
      }
    ]
  });
  return {
    bindGroup,
    pipeline,
    params_buf
  };
}
function draw2(cobalt, node, commandEncoder) {
  const passEncoder = commandEncoder.beginRenderPass({
    label: "scene-composite",
    colorAttachments: [
      {
        view: node.refs.combined.data.view,
        //getCurrentTextureView(cobalt)
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        loadOp: "clear",
        storeOp: "store"
      }
    ]
  });
  const { pipeline, bindGroup } = node.data;
  passEncoder.setPipeline(pipeline);
  passEncoder.setBindGroup(0, bindGroup);
  passEncoder.draw(3);
  passEncoder.end();
}
function resize2(cobalt, node) {
  const { pipeline, params_buf } = node.data;
  const { device } = cobalt;
  node.data.bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: node.refs.hdr.data.sampler
      },
      // color
      {
        binding: 1,
        resource: node.refs.hdr.data.view
      },
      // emissive
      {
        binding: 2,
        resource: node.refs.bloom.data.mip_view[0]
        //bloom_mat.bind_groups_textures[2].mip_view[0],
      },
      {
        binding: 3,
        resource: {
          buffer: params_buf
        }
      }
    ]
  });
}

// src/sprite/public-api.js
var public_api_exports = {};
__export(public_api_exports, {
  addSprite: () => addSprite,
  clear: () => clear,
  removeSprite: () => removeSprite,
  setSprite: () => setSprite,
  setSpriteName: () => setSpriteName,
  setSpriteOpacity: () => setSpriteOpacity,
  setSpritePosition: () => setSpritePosition,
  setSpriteRotation: () => setSpriteRotation,
  setSpriteScale: () => setSpriteScale,
  setSpriteTint: () => setSpriteTint
});

// src/sprite/constants.js
var FLOAT32S_PER_SPRITE = 12;

// src/sprite/sorted-binary-insert.js
function sortedBinaryInsert(spriteZIndex, spriteType, renderPass) {
  if (renderPass.spriteCount === 0)
    return 0;
  let low = 0;
  let high = renderPass.spriteCount - 1;
  const order = spriteZIndex << 16 & 16711680 | spriteType & 65535;
  while (low <= high) {
    const lowOrder = renderPass.spriteData[low * FLOAT32S_PER_SPRITE + 11];
    if (order <= lowOrder)
      return low;
    const highOrder = renderPass.spriteData[high * FLOAT32S_PER_SPRITE + 11];
    if (order >= highOrder)
      return high + 1;
    const mid = Math.floor((low + high) / 2);
    const midOrder = renderPass.spriteData[mid * FLOAT32S_PER_SPRITE + 11];
    if (order === midOrder)
      return mid + 1;
    if (order > midOrder)
      low = mid + 1;
    else
      high = mid - 1;
  }
  return low;
}

// src/uuid.js
function _uuid() {
  return Math.ceil(Math.random() * (Number.MAX_SAFE_INTEGER - 10));
}

// src/sprite/public-api.js
function addSprite(cobalt, renderPass, name, position, scale, tint, opacity, rotation, zIndex) {
  const spritesheet = renderPass.refs.spritesheet.data.spritesheet;
  renderPass = renderPass.data;
  const spriteType = spritesheet.locations.indexOf(name);
  const insertIdx = sortedBinaryInsert(zIndex, spriteType, renderPass);
  const offset = (insertIdx + 1) * FLOAT32S_PER_SPRITE;
  renderPass.spriteData.set(
    renderPass.spriteData.subarray(insertIdx * FLOAT32S_PER_SPRITE, renderPass.spriteCount * FLOAT32S_PER_SPRITE),
    offset
  );
  copySpriteDataToBuffer(renderPass, spritesheet, insertIdx, name, position, scale, tint, opacity, rotation, zIndex);
  for (const [spriteId2, idx] of renderPass.spriteIndices)
    if (idx >= insertIdx)
      renderPass.spriteIndices.set(spriteId2, idx + 1);
  const spriteId = _uuid();
  renderPass.spriteIndices.set(spriteId, insertIdx);
  renderPass.spriteCount++;
  renderPass.dirty = true;
  return spriteId;
}
function removeSprite(cobalt, renderPass, spriteId) {
  renderPass = renderPass.data;
  const removeIdx = renderPass.spriteIndices.get(spriteId);
  for (const [spriteId2, idx] of renderPass.spriteIndices)
    if (idx > removeIdx)
      renderPass.spriteIndices.set(spriteId2, idx - 1);
  let offset = removeIdx * FLOAT32S_PER_SPRITE;
  renderPass.spriteData.set(
    renderPass.spriteData.subarray((removeIdx + 1) * FLOAT32S_PER_SPRITE, renderPass.spriteCount * FLOAT32S_PER_SPRITE),
    offset
  );
  renderPass.spriteIndices.delete(spriteId);
  renderPass.spriteCount--;
  renderPass.dirty = true;
}
function clear(cobalt, renderPass) {
  renderPass = renderPass.data;
  renderPass.spriteIndices.clear();
  renderPass.spriteCount = 0;
  renderPass.instancedDrawCallCount = 0;
  renderPass.dirty = true;
}
function setSpriteName(cobalt, renderPass, spriteId, name, scale) {
  const spritesheet = renderPass.refs.spritesheet.data.spritesheet;
  renderPass = renderPass.data;
  const spriteType = spritesheet.locations.indexOf(name);
  const SPRITE_WIDTH = spritesheet.spriteMeta[name].w;
  const SPRITE_HEIGHT = spritesheet.spriteMeta[name].h;
  const spriteIdx = renderPass.spriteIndices.get(spriteId);
  const offset = spriteIdx * FLOAT32S_PER_SPRITE;
  renderPass.spriteData[offset + 2] = SPRITE_WIDTH * scale[0];
  renderPass.spriteData[offset + 3] = SPRITE_HEIGHT * scale[1];
  const zIndex = renderPass.spriteData[offset + 11] >> 16 & 255;
  const sortValue = zIndex << 16 & 16711680 | spriteType & 65535;
  renderPass.spriteData[offset + 11] = sortValue;
  renderPass.dirty = true;
}
function setSpritePosition(cobalt, renderPass, spriteId, position) {
  renderPass = renderPass.data;
  const spriteIdx = renderPass.spriteIndices.get(spriteId);
  const offset = spriteIdx * FLOAT32S_PER_SPRITE;
  renderPass.spriteData[offset] = position[0];
  renderPass.spriteData[offset + 1] = position[1];
  renderPass.dirty = true;
}
function setSpriteTint(cobalt, renderPass, spriteId, tint) {
  renderPass = renderPass.data;
  const spriteIdx = renderPass.spriteIndices.get(spriteId);
  const offset = spriteIdx * FLOAT32S_PER_SPRITE;
  renderPass.spriteData[offset + 4] = tint[0];
  renderPass.spriteData[offset + 5] = tint[1];
  renderPass.spriteData[offset + 6] = tint[2];
  renderPass.spriteData[offset + 7] = tint[3];
  renderPass.dirty = true;
}
function setSpriteOpacity(cobalt, renderPass, spriteId, opacity) {
  renderPass = renderPass.data;
  const spriteIdx = renderPass.spriteIndices.get(spriteId);
  const offset = spriteIdx * FLOAT32S_PER_SPRITE;
  renderPass.spriteData[offset + 8] = opacity;
  renderPass.dirty = true;
}
function setSpriteRotation(cobalt, renderPass, spriteId, rotation) {
  renderPass = renderPass.data;
  const spriteIdx = renderPass.spriteIndices.get(spriteId);
  const offset = spriteIdx * FLOAT32S_PER_SPRITE;
  renderPass.spriteData[offset + 9] = rotation;
  renderPass.dirty = true;
}
function setSpriteScale(cobalt, renderPass, spriteId, name, scale) {
  const spritesheet = renderPass.refs.spritesheet.data.spritesheet;
  renderPass = renderPass.data;
  const spriteIdx = renderPass.spriteIndices.get(spriteId);
  const offset = spriteIdx * FLOAT32S_PER_SPRITE;
  const SPRITE_WIDTH = spritesheet.spriteMeta[name].w;
  const SPRITE_HEIGHT = spritesheet.spriteMeta[name].h;
  renderPass.spriteData[offset + 2] = SPRITE_WIDTH * scale[0];
  renderPass.spriteData[offset + 3] = SPRITE_HEIGHT * scale[1];
  renderPass.dirty = true;
}
function setSprite(cobalt, renderPass, spriteId, name, position, scale, tint, opacity, rotation, zIndex) {
  const spritesheet = renderPass.refs.spritesheet.data.spritesheet;
  renderPass = renderPass.data;
  const spriteIdx = renderPass.spriteIndices.get(spriteId);
  copySpriteDataToBuffer(renderPass, spritesheet, spriteIdx, name, position, scale, tint, opacity, rotation, zIndex);
  renderPass.dirty = true;
}
function copySpriteDataToBuffer(renderPass, spritesheet, insertIdx, name, position, scale, tint, opacity, rotation, zIndex) {
  if (!spritesheet.spriteMeta[name])
    throw new Error(`Sprite name ${name} could not be found in the spritesheet metaData`);
  const offset = insertIdx * FLOAT32S_PER_SPRITE;
  const SPRITE_WIDTH = spritesheet.spriteMeta[name].w;
  const SPRITE_HEIGHT = spritesheet.spriteMeta[name].h;
  const spriteType = spritesheet.locations.indexOf(name);
  const sortValue = zIndex << 16 & 16711680 | spriteType & 65535;
  renderPass.spriteData[offset] = position[0];
  renderPass.spriteData[offset + 1] = position[1];
  renderPass.spriteData[offset + 2] = SPRITE_WIDTH * scale[0];
  renderPass.spriteData[offset + 3] = SPRITE_HEIGHT * scale[1];
  renderPass.spriteData[offset + 4] = tint[0];
  renderPass.spriteData[offset + 5] = tint[1];
  renderPass.spriteData[offset + 6] = tint[2];
  renderPass.spriteData[offset + 7] = tint[3];
  renderPass.spriteData[offset + 8] = opacity;
  renderPass.spriteData[offset + 9] = rotation;
  renderPass.spriteData[offset + 11] = sortValue;
}

// src/sprite/sprite.js
var sprite_default = {
  type: "cobalt:sprite",
  refs: [
    { name: "spritesheet", type: "customResource", access: "read" },
    { name: "hdr", type: "textureView", format: "rgba16float", access: "write" },
    { name: "emissive", type: "textureView", format: "rgba16float", access: "write" }
  ],
  // cobalt event handling functions
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init3(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
    draw3(cobalt, node, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, node) {
    destroy2(node);
  },
  onResize: function(cobalt, node) {
  },
  onViewportPosition: function(cobalt, node) {
  },
  // optional
  customFunctions: {
    ...public_api_exports
  }
};
async function init3(cobalt, nodeData) {
  const { device } = cobalt;
  const MAX_SPRITE_COUNT = 16192;
  const numInstances = MAX_SPRITE_COUNT;
  const translateFloatCount = 2;
  const translateSize = Float32Array.BYTES_PER_ELEMENT * translateFloatCount;
  const scaleFloatCount = 2;
  const scaleSize = Float32Array.BYTES_PER_ELEMENT * scaleFloatCount;
  const tintFloatCount = 4;
  const tintSize = Float32Array.BYTES_PER_ELEMENT * tintFloatCount;
  const opacityFloatCount = 4;
  const opacitySize = Float32Array.BYTES_PER_ELEMENT * opacityFloatCount;
  const spriteBuffer = device.createBuffer({
    size: (translateSize + scaleSize + tintSize + opacitySize) * numInstances,
    // 4x4 matrix with 4 bytes per float32, per instance
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    //mappedAtCreation: true,
  });
  const spritesheet = nodeData.refs.spritesheet.data;
  const bindGroup = device.createBindGroup({
    layout: nodeData.refs.spritesheet.data.bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: spritesheet.uniformBuffer
        }
      },
      {
        binding: 1,
        resource: spritesheet.colorTexture.view
      },
      {
        binding: 2,
        resource: spritesheet.colorTexture.sampler
      },
      {
        binding: 3,
        resource: {
          buffer: spriteBuffer
        }
      },
      {
        binding: 4,
        resource: spritesheet.emissiveTexture.view
      }
    ]
  });
  return {
    // instancedDrawCalls is used to actually perform draw calls within the render pass
    // layout is interleaved with baseVtxIdx (the sprite type), and instanceCount (how many sprites)
    // [
    //    baseVtxIdx0, instanceCount0,
    //    baseVtxIdx1, instanceCount1,
    //    ...
    // ]
    instancedDrawCalls: new Uint32Array(MAX_SPRITE_COUNT * 2),
    instancedDrawCallCount: 0,
    bindGroup,
    spriteBuffer,
    // actual sprite instance data. ordered by layer, then sprite type
    // this is used to update the spriteBuffer.
    spriteData: new Float32Array(MAX_SPRITE_COUNT * FLOAT32S_PER_SPRITE),
    spriteCount: 0,
    spriteIndices: /* @__PURE__ */ new Map(),
    // key is spriteId, value is insert index of the sprite. e.g., 0 means 1st sprite , 1 means 2nd sprite, etc.
    // when a sprite is changed the renderpass is dirty, and should have it's instance data copied to the gpu
    dirty: false
  };
}
function draw3(cobalt, node, commandEncoder) {
  const { device } = cobalt;
  const loadOp = node.options.loadOp || "load";
  if (node.data.dirty) {
    _rebuildSpriteDrawCalls(node.data);
    node.data.dirty = false;
  }
  if (node.data.spriteCount > 0) {
    const writeLength = node.data.spriteCount * FLOAT32S_PER_SPRITE * Float32Array.BYTES_PER_ELEMENT;
    device.queue.writeBuffer(node.data.spriteBuffer, 0, node.data.spriteData.buffer, 0, writeLength);
  }
  const renderpass = commandEncoder.beginRenderPass({
    label: "sprite",
    colorAttachments: [
      // color
      {
        view: node.refs.hdr.data.view,
        clearValue: cobalt.clearValue,
        loadOp,
        storeOp: "store"
      },
      // emissive
      {
        view: node.refs.emissive.data.view,
        clearValue: cobalt.clearValue,
        loadOp: "clear",
        storeOp: "store"
      }
    ]
  });
  renderpass.setPipeline(node.refs.spritesheet.data.pipeline);
  renderpass.setBindGroup(0, node.data.bindGroup);
  renderpass.setVertexBuffer(0, node.refs.spritesheet.data.quads.buffer);
  const vertexCount = 6;
  let baseInstanceIdx = 0;
  for (let i = 0; i < node.data.instancedDrawCallCount; i++) {
    const baseVertexIdx = node.data.instancedDrawCalls[i * 2] * vertexCount;
    const instanceCount = node.data.instancedDrawCalls[i * 2 + 1];
    renderpass.draw(vertexCount, instanceCount, baseVertexIdx, baseInstanceIdx);
    baseInstanceIdx += instanceCount;
  }
  renderpass.end();
}
function _rebuildSpriteDrawCalls(renderPass) {
  let currentSpriteType = -1;
  let instanceCount = 0;
  renderPass.instancedDrawCallCount = 0;
  for (let i = 0; i < renderPass.spriteCount; i++) {
    const spriteType = renderPass.spriteData[i * FLOAT32S_PER_SPRITE + 11] & 65535;
    if (spriteType !== currentSpriteType) {
      if (instanceCount > 0) {
        renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2] = currentSpriteType;
        renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2 + 1] = instanceCount;
        renderPass.instancedDrawCallCount++;
      }
      currentSpriteType = spriteType;
      instanceCount = 0;
    }
    instanceCount++;
  }
  if (instanceCount > 0) {
    renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2] = currentSpriteType;
    renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2 + 1] = instanceCount;
    renderPass.instancedDrawCallCount++;
  }
}
function destroy2(node) {
  node.data.instancedDrawCalls = null;
  node.data.bindGroup = null;
  node.data.spriteBuffer.destroy();
  node.data.spriteBuffer = null;
  node.data.spriteData = null;
  node.data.spriteIndices.clear();
  node.data.spriteIndices = null;
}

// src/tile/tile.js
var tile_default = {
  type: "cobalt:tile",
  refs: [
    { name: "tileAtlas", type: "textureView", format: "rgba8unorm", access: "write" }
  ],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init4(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
    draw4(cobalt, node, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, node) {
    destroy3(node);
  },
  onResize: function(cobalt, node) {
  },
  onViewportPosition: function(cobalt, node) {
  },
  // optional
  customFunctions: {
    setTexture: async function(cobalt, node, texture) {
      const { canvas, device } = cobalt;
      destroy3(node);
      const format = node.options.format || "rgba8unorm";
      let material;
      if (canvas) {
        node.options.textureUrl = texture;
        material = await createTextureFromUrl(cobalt, "tile map", texture, format);
      } else {
        material = await createTextureFromBuffer(cobalt, "tile map", texture, format);
      }
      const bindGroup = device.createBindGroup({
        layout: node.refs.tileAtlas.data.tileBindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: node.data.uniformBuffer
            }
          },
          {
            binding: 1,
            resource: material.view
          },
          {
            binding: 2,
            resource: material.sampler
          }
        ]
      });
      node.data.bindGroup = bindGroup;
      node.data.material = material;
    }
  }
};
async function init4(cobalt, nodeData) {
  const { canvas, device } = cobalt;
  let material;
  const format = nodeData.options.format || "rgba8unorm";
  if (canvas) {
    material = await createTextureFromUrl(cobalt, "tile map", nodeData.options.textureUrl, format);
  } else {
    material = await createTextureFromBuffer(cobalt, "tile map", nodeData.options.texture, format);
  }
  const dat = new Float32Array([nodeData.options.scrollScale, nodeData.options.scrollScale]);
  const usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
  const descriptor = {
    size: dat.byteLength,
    usage,
    // make this memory space accessible from the CPU (host visible)
    mappedAtCreation: true
  };
  const uniformBuffer = device.createBuffer(descriptor);
  new Float32Array(uniformBuffer.getMappedRange()).set(dat);
  uniformBuffer.unmap();
  const bindGroup = device.createBindGroup({
    layout: nodeData.refs.tileAtlas.data.tileBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer
        }
      },
      {
        binding: 1,
        resource: material.view
      },
      {
        binding: 2,
        resource: material.sampler
      }
    ]
  });
  return {
    bindGroup,
    material,
    uniformBuffer,
    scrollScale: nodeData.options.scrollScale
  };
}
function draw4(cobalt, nodeData, commandEncoder) {
  if (!nodeData.data.material.texture)
    return;
  const { device } = cobalt;
  const loadOp = nodeData.options.loadOp || "load";
  const renderpass = commandEncoder.beginRenderPass({
    label: "tile",
    colorAttachments: [
      {
        view: nodeData.refs.hdr.data.view,
        clearValue: cobalt.clearValue,
        loadOp,
        storeOp: "store"
      }
    ]
  });
  const tileAtlas = nodeData.refs.tileAtlas.data;
  renderpass.setPipeline(tileAtlas.pipeline);
  renderpass.setBindGroup(0, nodeData.data.bindGroup);
  renderpass.setBindGroup(1, tileAtlas.atlasBindGroup);
  renderpass.draw(3);
  renderpass.end();
}
function destroy3(nodeData) {
  nodeData.data.material.texture.destroy();
  nodeData.data.material.texture = void 0;
}

// src/displacement/triangles-buffer.ts
var TrianglesBuffer = class {
  device;
  floatsPerSprite = 6;
  // vec2(translate) + vec2(scale) + rotation + opacity 
  bufferGpu;
  bufferNeedsUpdate = false;
  sprites = /* @__PURE__ */ new Map();
  get spriteCount() {
    return this.sprites.size;
  }
  constructor(params) {
    this.device = params.device;
    this.bufferGpu = this.device.createBuffer({
      size: params.maxSpriteCount * this.floatsPerSprite * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
  }
  destroy() {
    this.bufferGpu.destroy;
  }
  update() {
    if (this.bufferNeedsUpdate) {
      const bufferData = [];
      for (const sprite of this.sprites.values()) {
        bufferData.push(...sprite);
      }
      ;
      const buffer = new Float32Array(bufferData);
      this.device.queue.writeBuffer(this.bufferGpu, 0, buffer);
    }
  }
  addTriangle(triangleVertices) {
    const triangleId = _uuid();
    if (this.sprites.has(triangleId)) {
      throw new Error(`Duplicate triangle "${triangleId}".`);
    }
    const triangleData = this.buildTriangleData(triangleVertices);
    this.sprites.set(triangleId, triangleData);
    this.bufferNeedsUpdate = true;
    return triangleId;
  }
  removeTriangle(triangleId) {
    if (!this.sprites.has(triangleId)) {
      throw new Error(`Unknown triangle "${triangleId}".`);
    }
    this.sprites.delete(triangleId);
    this.bufferNeedsUpdate = true;
  }
  setTriangle(triangleId, triangleVertices) {
    if (!this.sprites.has(triangleId)) {
      throw new Error(`Unknown triangle "${triangleId}".`);
    }
    const triangleData = this.buildTriangleData(triangleVertices);
    this.sprites.set(triangleId, triangleData);
    this.bufferNeedsUpdate = true;
  }
  buildTriangleData(triangleVertices) {
    return [
      triangleVertices[0][0],
      triangleVertices[0][1],
      triangleVertices[1][0],
      triangleVertices[1][1],
      triangleVertices[2][0],
      triangleVertices[2][1]
    ];
  }
};

// src/displacement/displacement-parameters-buffer.ts
var DisplacementParametersBuffer = class {
  device;
  bufferGpu;
  needsUpdate = true;
  constructor(params) {
    this.device = params.device;
    this.bufferGpu = this.device.createBuffer({
      label: "DisplacementParametersBuffer buffer",
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.setParameters(params.initialParameters);
  }
  setParameters(params) {
    this.device.queue.writeBuffer(this.bufferGpu, 0, new Float32Array([params.offsetX, params.offsetY, params.scale]));
  }
  destroy() {
    this.bufferGpu.destroy();
  }
};

// src/displacement/composition.wgsl
var composition_default = `struct DisplacementParameters{offset:vec2<f32>,scale:f32,};@group(0)@binding(0)var<uniform> uniforms:DisplacementParameters;@group(0)@binding(1)var colorTexture:texture_2d<f32>;@group(0)@binding(2)var colorSampler:sampler;@group(0)@binding(3)var noiseTexture:texture_2d<f32>;@group(0)@binding(4)var noiseSampler:sampler;@group(0)@binding(5)var displacementTexture:texture_2d<f32>;struct VertexIn{@builtin(vertex_index)vertexIndex:u32,};struct VertexOut{@builtin(position)position:vec4<f32>,@location(0)uv:vec2<f32>,};@vertex fn main_vertex(in:VertexIn)->VertexOut{const corners=array<vec2<f32>,4>(vec2<f32>(-1,-1),vec2<f32>(1,-1),vec2<f32>(-1,1),vec2<f32>(1,1),);let screenPosition=corners[in.vertexIndex];var out:VertexOut;out.position=vec4<f32>(screenPosition,0,1);out.uv=(0.5+0.5*screenPosition*vec2<f32>(1,-1));return out;}struct FragmentOut{@location(0)color:vec4<f32>,};@fragment fn main_fragment(in:VertexOut)->FragmentOut{let noiseTextureDimensions=vec2<f32>(textureDimensions(noiseTexture,0));let noiseUv=in.uv+uniforms.offset/noiseTextureDimensions;var noise=textureSample(noiseTexture,noiseSampler,noiseUv).rg;noise-=0.5;noise*=uniforms.scale/noiseTextureDimensions;let displacement=textureSample(displacementTexture,colorSampler,in.uv).r;noise*=displacement;let colorUv=in.uv+noise;var out:FragmentOut;out.color=textureSample(colorTexture,colorSampler,colorUv);return out;}`;

// src/displacement/displacement-composition.ts
var DisplacementComposition = class {
  device;
  targetFormat;
  renderPipeline;
  colorSampler;
  noiseSampler;
  displacementParametersBuffer;
  renderBundle = null;
  colorTextureView;
  noiseMapTextureView;
  displacementTextureView;
  constructor(params) {
    this.device = params.device;
    this.targetFormat = params.targetFormat;
    this.colorTextureView = params.colorTextureView;
    this.noiseMapTextureView = params.noiseMapTextureView;
    this.displacementTextureView = params.displacementTextureView;
    this.displacementParametersBuffer = params.displacementParametersBuffer;
    const shaderModule = this.device.createShaderModule({
      label: "DisplacementComposition shader module",
      code: composition_default
    });
    this.renderPipeline = this.device.createRenderPipeline({
      label: "DisplacementComposition renderpipeline",
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "main_vertex"
      },
      fragment: {
        module: shaderModule,
        entryPoint: "main_fragment",
        targets: [{
          format: params.targetFormat
        }]
      },
      primitive: {
        cullMode: "none",
        topology: "triangle-strip"
      }
    });
    this.noiseSampler = this.device.createSampler({
      label: "DisplacementComposition noisesampler",
      addressModeU: "repeat",
      addressModeV: "repeat",
      addressModeW: "repeat",
      magFilter: "linear",
      minFilter: "linear",
      mipmapFilter: "linear"
    });
    this.colorSampler = this.device.createSampler({
      label: "DisplacementComposition colorSampler",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
      addressModeW: "clamp-to-edge",
      magFilter: "linear",
      minFilter: "linear",
      mipmapFilter: "linear"
    });
  }
  getRenderBundle() {
    if (!this.renderBundle) {
      this.renderBundle = this.buildRenderBundle();
    }
    return this.renderBundle;
  }
  destroy() {
  }
  setColorTextureView(textureView) {
    this.colorTextureView = textureView;
    this.renderBundle = null;
  }
  setNoiseMapTextureView(textureView) {
    this.noiseMapTextureView = textureView;
    this.renderBundle = null;
  }
  setDisplacementTextureView(textureView) {
    this.displacementTextureView = textureView;
    this.renderBundle = null;
  }
  buildRenderBundle() {
    const bindgroup = this.device.createBindGroup({
      label: "DisplacementComposition bindgroup 0",
      layout: this.renderPipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.displacementParametersBuffer.bufferGpu }
        },
        {
          binding: 1,
          resource: this.colorTextureView
        },
        {
          binding: 2,
          resource: this.colorSampler
        },
        {
          binding: 3,
          resource: this.noiseMapTextureView
        },
        {
          binding: 4,
          resource: this.noiseSampler
        },
        {
          binding: 5,
          resource: this.displacementTextureView
        }
      ]
    });
    const renderBundleEncoder = this.device.createRenderBundleEncoder({
      label: "DisplacementComposition renderbundle encoder",
      colorFormats: [this.targetFormat]
    });
    renderBundleEncoder.setPipeline(this.renderPipeline);
    renderBundleEncoder.setBindGroup(0, bindgroup);
    renderBundleEncoder.draw(4);
    return renderBundleEncoder.finish({ label: "DisplacementComposition renderbundle" });
  }
};

// src/displacement/displacement.wgsl
var displacement_default = `struct TransformData{mvpMatrix:mat4x4<f32>,};@group(0)@binding(0)var<uniform> transformUBO:TransformData;struct VertexIn{@location(0)position:vec2<f32>,};struct VertexOut{@builtin(position)position:vec4<f32>,};@vertex fn main_vertex(in:VertexIn)->VertexOut{var output:VertexOut;output.position=transformUBO.mvpMatrix*vec4<f32>(in.position,0.0,1.0);return output;}struct FragmentOut{@location(0)color:vec4<f32>,};@fragment fn main_fragment()->FragmentOut{var out:FragmentOut;out.color=vec4<f32>(1.0,1.0,1.0,1.0);return out;}`;

// node_modules/wgpu-matrix/dist/3.x/wgpu-matrix.module.js
function wrapConstructor(OriginalConstructor, modifier) {
  return class extends OriginalConstructor {
    constructor(...args) {
      super(...args);
      modifier(this);
    }
  };
}
var ZeroArray = wrapConstructor(Array, (a) => a.fill(0));
var EPSILON = 1e-6;
function getAPIImpl$5(Ctor) {
  function create(x = 0, y = 0) {
    const newDst = new Ctor(2);
    if (x !== void 0) {
      newDst[0] = x;
      if (y !== void 0) {
        newDst[1] = y;
      }
    }
    return newDst;
  }
  const fromValues = create;
  function set(x, y, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = x;
    newDst[1] = y;
    return newDst;
  }
  function ceil(v, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = Math.ceil(v[0]);
    newDst[1] = Math.ceil(v[1]);
    return newDst;
  }
  function floor(v, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = Math.floor(v[0]);
    newDst[1] = Math.floor(v[1]);
    return newDst;
  }
  function round2(v, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = Math.round(v[0]);
    newDst[1] = Math.round(v[1]);
    return newDst;
  }
  function clamp(v, min2 = 0, max2 = 1, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = Math.min(max2, Math.max(min2, v[0]));
    newDst[1] = Math.min(max2, Math.max(min2, v[1]));
    return newDst;
  }
  function add(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] + b[0];
    newDst[1] = a[1] + b[1];
    return newDst;
  }
  function addScaled(a, b, scale2, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] + b[0] * scale2;
    newDst[1] = a[1] + b[1] * scale2;
    return newDst;
  }
  function angle(a, b) {
    const ax = a[0];
    const ay = a[1];
    const bx = b[0];
    const by = b[1];
    const mag1 = Math.sqrt(ax * ax + ay * ay);
    const mag2 = Math.sqrt(bx * bx + by * by);
    const mag = mag1 * mag2;
    const cosine = mag && dot(a, b) / mag;
    return Math.acos(cosine);
  }
  function subtract(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] - b[0];
    newDst[1] = a[1] - b[1];
    return newDst;
  }
  const sub = subtract;
  function equalsApproximately(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON;
  }
  function equals(a, b) {
    return a[0] === b[0] && a[1] === b[1];
  }
  function lerp(a, b, t, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] + t * (b[0] - a[0]);
    newDst[1] = a[1] + t * (b[1] - a[1]);
    return newDst;
  }
  function lerpV(a, b, t, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] + t[0] * (b[0] - a[0]);
    newDst[1] = a[1] + t[1] * (b[1] - a[1]);
    return newDst;
  }
  function max(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = Math.max(a[0], b[0]);
    newDst[1] = Math.max(a[1], b[1]);
    return newDst;
  }
  function min(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = Math.min(a[0], b[0]);
    newDst[1] = Math.min(a[1], b[1]);
    return newDst;
  }
  function mulScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = v[0] * k;
    newDst[1] = v[1] * k;
    return newDst;
  }
  const scale = mulScalar;
  function divScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = v[0] / k;
    newDst[1] = v[1] / k;
    return newDst;
  }
  function inverse(v, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = 1 / v[0];
    newDst[1] = 1 / v[1];
    return newDst;
  }
  const invert = inverse;
  function cross(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    const z = a[0] * b[1] - a[1] * b[0];
    newDst[0] = 0;
    newDst[1] = 0;
    newDst[2] = z;
    return newDst;
  }
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }
  function length(v) {
    const v0 = v[0];
    const v1 = v[1];
    return Math.sqrt(v0 * v0 + v1 * v1);
  }
  const len = length;
  function lengthSq(v) {
    const v0 = v[0];
    const v1 = v[1];
    return v0 * v0 + v1 * v1;
  }
  const lenSq = lengthSq;
  function distance(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
  }
  const dist = distance;
  function distanceSq(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return dx * dx + dy * dy;
  }
  const distSq = distanceSq;
  function normalize(v, dst) {
    const newDst = dst ?? new Ctor(2);
    const v0 = v[0];
    const v1 = v[1];
    const len2 = Math.sqrt(v0 * v0 + v1 * v1);
    if (len2 > 1e-5) {
      newDst[0] = v0 / len2;
      newDst[1] = v1 / len2;
    } else {
      newDst[0] = 0;
      newDst[1] = 0;
    }
    return newDst;
  }
  function negate(v, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = -v[0];
    newDst[1] = -v[1];
    return newDst;
  }
  function copy(v, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = v[0];
    newDst[1] = v[1];
    return newDst;
  }
  const clone = copy;
  function multiply(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] * b[0];
    newDst[1] = a[1] * b[1];
    return newDst;
  }
  const mul = multiply;
  function divide(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = a[0] / b[0];
    newDst[1] = a[1] / b[1];
    return newDst;
  }
  const div = divide;
  function random(scale2 = 1, dst) {
    const newDst = dst ?? new Ctor(2);
    const angle2 = Math.random() * 2 * Math.PI;
    newDst[0] = Math.cos(angle2) * scale2;
    newDst[1] = Math.sin(angle2) * scale2;
    return newDst;
  }
  function zero(dst) {
    const newDst = dst ?? new Ctor(2);
    newDst[0] = 0;
    newDst[1] = 0;
    return newDst;
  }
  function transformMat4(v, m, dst) {
    const newDst = dst ?? new Ctor(2);
    const x = v[0];
    const y = v[1];
    newDst[0] = x * m[0] + y * m[4] + m[12];
    newDst[1] = x * m[1] + y * m[5] + m[13];
    return newDst;
  }
  function transformMat3(v, m, dst) {
    const newDst = dst ?? new Ctor(2);
    const x = v[0];
    const y = v[1];
    newDst[0] = m[0] * x + m[4] * y + m[8];
    newDst[1] = m[1] * x + m[5] * y + m[9];
    return newDst;
  }
  function rotate(a, b, rad, dst) {
    const newDst = dst ?? new Ctor(2);
    const p0 = a[0] - b[0];
    const p1 = a[1] - b[1];
    const sinC = Math.sin(rad);
    const cosC = Math.cos(rad);
    newDst[0] = p0 * cosC - p1 * sinC + b[0];
    newDst[1] = p0 * sinC + p1 * cosC + b[1];
    return newDst;
  }
  function setLength(a, len2, dst) {
    const newDst = dst ?? new Ctor(2);
    normalize(a, newDst);
    return mulScalar(newDst, len2, newDst);
  }
  function truncate(a, maxLen, dst) {
    const newDst = dst ?? new Ctor(2);
    if (length(a) > maxLen) {
      return setLength(a, maxLen, newDst);
    }
    return copy(a, newDst);
  }
  function midpoint(a, b, dst) {
    const newDst = dst ?? new Ctor(2);
    return lerp(a, b, 0.5, newDst);
  }
  return {
    create,
    fromValues,
    set,
    ceil,
    floor,
    round: round2,
    clamp,
    add,
    addScaled,
    angle,
    subtract,
    sub,
    equalsApproximately,
    equals,
    lerp,
    lerpV,
    max,
    min,
    mulScalar,
    scale,
    divScalar,
    inverse,
    invert,
    cross,
    dot,
    length,
    len,
    lengthSq,
    lenSq,
    distance,
    dist,
    distanceSq,
    distSq,
    normalize,
    negate,
    copy,
    clone,
    multiply,
    mul,
    divide,
    div,
    random,
    zero,
    transformMat4,
    transformMat3,
    rotate,
    setLength,
    truncate,
    midpoint
  };
}
var cache$5 = /* @__PURE__ */ new Map();
function getAPI$5(Ctor) {
  let api = cache$5.get(Ctor);
  if (!api) {
    api = getAPIImpl$5(Ctor);
    cache$5.set(Ctor, api);
  }
  return api;
}
function getAPIImpl$4(Ctor) {
  function create(x, y, z) {
    const newDst = new Ctor(3);
    if (x !== void 0) {
      newDst[0] = x;
      if (y !== void 0) {
        newDst[1] = y;
        if (z !== void 0) {
          newDst[2] = z;
        }
      }
    }
    return newDst;
  }
  const fromValues = create;
  function set(x, y, z, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = x;
    newDst[1] = y;
    newDst[2] = z;
    return newDst;
  }
  function ceil(v, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = Math.ceil(v[0]);
    newDst[1] = Math.ceil(v[1]);
    newDst[2] = Math.ceil(v[2]);
    return newDst;
  }
  function floor(v, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = Math.floor(v[0]);
    newDst[1] = Math.floor(v[1]);
    newDst[2] = Math.floor(v[2]);
    return newDst;
  }
  function round2(v, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = Math.round(v[0]);
    newDst[1] = Math.round(v[1]);
    newDst[2] = Math.round(v[2]);
    return newDst;
  }
  function clamp(v, min2 = 0, max2 = 1, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = Math.min(max2, Math.max(min2, v[0]));
    newDst[1] = Math.min(max2, Math.max(min2, v[1]));
    newDst[2] = Math.min(max2, Math.max(min2, v[2]));
    return newDst;
  }
  function add(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] + b[0];
    newDst[1] = a[1] + b[1];
    newDst[2] = a[2] + b[2];
    return newDst;
  }
  function addScaled(a, b, scale2, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] + b[0] * scale2;
    newDst[1] = a[1] + b[1] * scale2;
    newDst[2] = a[2] + b[2] * scale2;
    return newDst;
  }
  function angle(a, b) {
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const bx = b[0];
    const by = b[1];
    const bz = b[2];
    const mag1 = Math.sqrt(ax * ax + ay * ay + az * az);
    const mag2 = Math.sqrt(bx * bx + by * by + bz * bz);
    const mag = mag1 * mag2;
    const cosine = mag && dot(a, b) / mag;
    return Math.acos(cosine);
  }
  function subtract(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] - b[0];
    newDst[1] = a[1] - b[1];
    newDst[2] = a[2] - b[2];
    return newDst;
  }
  const sub = subtract;
  function equalsApproximately(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON;
  }
  function equals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  }
  function lerp(a, b, t, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] + t * (b[0] - a[0]);
    newDst[1] = a[1] + t * (b[1] - a[1]);
    newDst[2] = a[2] + t * (b[2] - a[2]);
    return newDst;
  }
  function lerpV(a, b, t, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] + t[0] * (b[0] - a[0]);
    newDst[1] = a[1] + t[1] * (b[1] - a[1]);
    newDst[2] = a[2] + t[2] * (b[2] - a[2]);
    return newDst;
  }
  function max(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = Math.max(a[0], b[0]);
    newDst[1] = Math.max(a[1], b[1]);
    newDst[2] = Math.max(a[2], b[2]);
    return newDst;
  }
  function min(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = Math.min(a[0], b[0]);
    newDst[1] = Math.min(a[1], b[1]);
    newDst[2] = Math.min(a[2], b[2]);
    return newDst;
  }
  function mulScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = v[0] * k;
    newDst[1] = v[1] * k;
    newDst[2] = v[2] * k;
    return newDst;
  }
  const scale = mulScalar;
  function divScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = v[0] / k;
    newDst[1] = v[1] / k;
    newDst[2] = v[2] / k;
    return newDst;
  }
  function inverse(v, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = 1 / v[0];
    newDst[1] = 1 / v[1];
    newDst[2] = 1 / v[2];
    return newDst;
  }
  const invert = inverse;
  function cross(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    const t1 = a[2] * b[0] - a[0] * b[2];
    const t2 = a[0] * b[1] - a[1] * b[0];
    newDst[0] = a[1] * b[2] - a[2] * b[1];
    newDst[1] = t1;
    newDst[2] = t2;
    return newDst;
  }
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function length(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
  }
  const len = length;
  function lengthSq(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    return v0 * v0 + v1 * v1 + v2 * v2;
  }
  const lenSq = lengthSq;
  function distance(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  const dist = distance;
  function distanceSq(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    return dx * dx + dy * dy + dz * dz;
  }
  const distSq = distanceSq;
  function normalize(v, dst) {
    const newDst = dst ?? new Ctor(3);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const len2 = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
    if (len2 > 1e-5) {
      newDst[0] = v0 / len2;
      newDst[1] = v1 / len2;
      newDst[2] = v2 / len2;
    } else {
      newDst[0] = 0;
      newDst[1] = 0;
      newDst[2] = 0;
    }
    return newDst;
  }
  function negate(v, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = -v[0];
    newDst[1] = -v[1];
    newDst[2] = -v[2];
    return newDst;
  }
  function copy(v, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = v[0];
    newDst[1] = v[1];
    newDst[2] = v[2];
    return newDst;
  }
  const clone = copy;
  function multiply(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] * b[0];
    newDst[1] = a[1] * b[1];
    newDst[2] = a[2] * b[2];
    return newDst;
  }
  const mul = multiply;
  function divide(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = a[0] / b[0];
    newDst[1] = a[1] / b[1];
    newDst[2] = a[2] / b[2];
    return newDst;
  }
  const div = divide;
  function random(scale2 = 1, dst) {
    const newDst = dst ?? new Ctor(3);
    const angle2 = Math.random() * 2 * Math.PI;
    const z = Math.random() * 2 - 1;
    const zScale = Math.sqrt(1 - z * z) * scale2;
    newDst[0] = Math.cos(angle2) * zScale;
    newDst[1] = Math.sin(angle2) * zScale;
    newDst[2] = z * scale2;
    return newDst;
  }
  function zero(dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = 0;
    newDst[1] = 0;
    newDst[2] = 0;
    return newDst;
  }
  function transformMat4(v, m, dst) {
    const newDst = dst ?? new Ctor(3);
    const x = v[0];
    const y = v[1];
    const z = v[2];
    const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1;
    newDst[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    newDst[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    newDst[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    return newDst;
  }
  function transformMat4Upper3x3(v, m, dst) {
    const newDst = dst ?? new Ctor(3);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    newDst[0] = v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0];
    newDst[1] = v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1];
    newDst[2] = v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2];
    return newDst;
  }
  function transformMat3(v, m, dst) {
    const newDst = dst ?? new Ctor(3);
    const x = v[0];
    const y = v[1];
    const z = v[2];
    newDst[0] = x * m[0] + y * m[4] + z * m[8];
    newDst[1] = x * m[1] + y * m[5] + z * m[9];
    newDst[2] = x * m[2] + y * m[6] + z * m[10];
    return newDst;
  }
  function transformQuat(v, q, dst) {
    const newDst = dst ?? new Ctor(3);
    const qx = q[0];
    const qy = q[1];
    const qz = q[2];
    const w2 = q[3] * 2;
    const x = v[0];
    const y = v[1];
    const z = v[2];
    const uvX = qy * z - qz * y;
    const uvY = qz * x - qx * z;
    const uvZ = qx * y - qy * x;
    newDst[0] = x + uvX * w2 + (qy * uvZ - qz * uvY) * 2;
    newDst[1] = y + uvY * w2 + (qz * uvX - qx * uvZ) * 2;
    newDst[2] = z + uvZ * w2 + (qx * uvY - qy * uvX) * 2;
    return newDst;
  }
  function getTranslation(m, dst) {
    const newDst = dst ?? new Ctor(3);
    newDst[0] = m[12];
    newDst[1] = m[13];
    newDst[2] = m[14];
    return newDst;
  }
  function getAxis(m, axis, dst) {
    const newDst = dst ?? new Ctor(3);
    const off = axis * 4;
    newDst[0] = m[off + 0];
    newDst[1] = m[off + 1];
    newDst[2] = m[off + 2];
    return newDst;
  }
  function getScaling(m, dst) {
    const newDst = dst ?? new Ctor(3);
    const xx = m[0];
    const xy = m[1];
    const xz = m[2];
    const yx = m[4];
    const yy = m[5];
    const yz = m[6];
    const zx = m[8];
    const zy = m[9];
    const zz = m[10];
    newDst[0] = Math.sqrt(xx * xx + xy * xy + xz * xz);
    newDst[1] = Math.sqrt(yx * yx + yy * yy + yz * yz);
    newDst[2] = Math.sqrt(zx * zx + zy * zy + zz * zz);
    return newDst;
  }
  function rotateX(a, b, rad, dst) {
    const newDst = dst ?? new Ctor(3);
    const p = [];
    const r = [];
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];
    r[0] = p[0];
    r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
    r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad);
    newDst[0] = r[0] + b[0];
    newDst[1] = r[1] + b[1];
    newDst[2] = r[2] + b[2];
    return newDst;
  }
  function rotateY(a, b, rad, dst) {
    const newDst = dst ?? new Ctor(3);
    const p = [];
    const r = [];
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];
    r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
    r[1] = p[1];
    r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad);
    newDst[0] = r[0] + b[0];
    newDst[1] = r[1] + b[1];
    newDst[2] = r[2] + b[2];
    return newDst;
  }
  function rotateZ(a, b, rad, dst) {
    const newDst = dst ?? new Ctor(3);
    const p = [];
    const r = [];
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];
    r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
    r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
    r[2] = p[2];
    newDst[0] = r[0] + b[0];
    newDst[1] = r[1] + b[1];
    newDst[2] = r[2] + b[2];
    return newDst;
  }
  function setLength(a, len2, dst) {
    const newDst = dst ?? new Ctor(3);
    normalize(a, newDst);
    return mulScalar(newDst, len2, newDst);
  }
  function truncate(a, maxLen, dst) {
    const newDst = dst ?? new Ctor(3);
    if (length(a) > maxLen) {
      return setLength(a, maxLen, newDst);
    }
    return copy(a, newDst);
  }
  function midpoint(a, b, dst) {
    const newDst = dst ?? new Ctor(3);
    return lerp(a, b, 0.5, newDst);
  }
  return {
    create,
    fromValues,
    set,
    ceil,
    floor,
    round: round2,
    clamp,
    add,
    addScaled,
    angle,
    subtract,
    sub,
    equalsApproximately,
    equals,
    lerp,
    lerpV,
    max,
    min,
    mulScalar,
    scale,
    divScalar,
    inverse,
    invert,
    cross,
    dot,
    length,
    len,
    lengthSq,
    lenSq,
    distance,
    dist,
    distanceSq,
    distSq,
    normalize,
    negate,
    copy,
    clone,
    multiply,
    mul,
    divide,
    div,
    random,
    zero,
    transformMat4,
    transformMat4Upper3x3,
    transformMat3,
    transformQuat,
    getTranslation,
    getAxis,
    getScaling,
    rotateX,
    rotateY,
    rotateZ,
    setLength,
    truncate,
    midpoint
  };
}
var cache$4 = /* @__PURE__ */ new Map();
function getAPI$4(Ctor) {
  let api = cache$4.get(Ctor);
  if (!api) {
    api = getAPIImpl$4(Ctor);
    cache$4.set(Ctor, api);
  }
  return api;
}
function getAPIImpl$3(Ctor) {
  const vec23 = getAPI$5(Ctor);
  const vec32 = getAPI$4(Ctor);
  function create(v0, v1, v2, v3, v4, v5, v6, v7, v8) {
    const newDst = new Ctor(12);
    newDst[3] = 0;
    newDst[7] = 0;
    newDst[11] = 0;
    if (v0 !== void 0) {
      newDst[0] = v0;
      if (v1 !== void 0) {
        newDst[1] = v1;
        if (v2 !== void 0) {
          newDst[2] = v2;
          if (v3 !== void 0) {
            newDst[4] = v3;
            if (v4 !== void 0) {
              newDst[5] = v4;
              if (v5 !== void 0) {
                newDst[6] = v5;
                if (v6 !== void 0) {
                  newDst[8] = v6;
                  if (v7 !== void 0) {
                    newDst[9] = v7;
                    if (v8 !== void 0) {
                      newDst[10] = v8;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return newDst;
  }
  function set(v0, v1, v2, v3, v4, v5, v6, v7, v8, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = v0;
    newDst[1] = v1;
    newDst[2] = v2;
    newDst[3] = 0;
    newDst[4] = v3;
    newDst[5] = v4;
    newDst[6] = v5;
    newDst[7] = 0;
    newDst[8] = v6;
    newDst[9] = v7;
    newDst[10] = v8;
    newDst[11] = 0;
    return newDst;
  }
  function fromMat4(m4, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = m4[0];
    newDst[1] = m4[1];
    newDst[2] = m4[2];
    newDst[3] = 0;
    newDst[4] = m4[4];
    newDst[5] = m4[5];
    newDst[6] = m4[6];
    newDst[7] = 0;
    newDst[8] = m4[8];
    newDst[9] = m4[9];
    newDst[10] = m4[10];
    newDst[11] = 0;
    return newDst;
  }
  function fromQuat(q, dst) {
    const newDst = dst ?? new Ctor(12);
    const x = q[0];
    const y = q[1];
    const z = q[2];
    const w = q[3];
    const x2 = x + x;
    const y2 = y + y;
    const z2 = z + z;
    const xx = x * x2;
    const yx = y * x2;
    const yy = y * y2;
    const zx = z * x2;
    const zy = z * y2;
    const zz = z * z2;
    const wx = w * x2;
    const wy = w * y2;
    const wz = w * z2;
    newDst[0] = 1 - yy - zz;
    newDst[1] = yx + wz;
    newDst[2] = zx - wy;
    newDst[3] = 0;
    newDst[4] = yx - wz;
    newDst[5] = 1 - xx - zz;
    newDst[6] = zy + wx;
    newDst[7] = 0;
    newDst[8] = zx + wy;
    newDst[9] = zy - wx;
    newDst[10] = 1 - xx - yy;
    newDst[11] = 0;
    return newDst;
  }
  function negate(m, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = -m[0];
    newDst[1] = -m[1];
    newDst[2] = -m[2];
    newDst[4] = -m[4];
    newDst[5] = -m[5];
    newDst[6] = -m[6];
    newDst[8] = -m[8];
    newDst[9] = -m[9];
    newDst[10] = -m[10];
    return newDst;
  }
  function multiplyScalar(m, s, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = m[0] * s;
    newDst[1] = m[1] * s;
    newDst[2] = m[2] * s;
    newDst[4] = m[4] * s;
    newDst[5] = m[5] * s;
    newDst[6] = m[6] * s;
    newDst[8] = m[8] * s;
    newDst[9] = m[9] * s;
    newDst[10] = m[10] * s;
    return newDst;
  }
  const mulScalar = multiplyScalar;
  function add(a, b, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = a[0] + b[0];
    newDst[1] = a[1] + b[1];
    newDst[2] = a[2] + b[2];
    newDst[4] = a[4] + b[4];
    newDst[5] = a[5] + b[5];
    newDst[6] = a[6] + b[6];
    newDst[8] = a[8] + b[8];
    newDst[9] = a[9] + b[9];
    newDst[10] = a[10] + b[10];
    return newDst;
  }
  function copy(m, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = m[0];
    newDst[1] = m[1];
    newDst[2] = m[2];
    newDst[4] = m[4];
    newDst[5] = m[5];
    newDst[6] = m[6];
    newDst[8] = m[8];
    newDst[9] = m[9];
    newDst[10] = m[10];
    return newDst;
  }
  const clone = copy;
  function equalsApproximately(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[4] - b[4]) < EPSILON && Math.abs(a[5] - b[5]) < EPSILON && Math.abs(a[6] - b[6]) < EPSILON && Math.abs(a[8] - b[8]) < EPSILON && Math.abs(a[9] - b[9]) < EPSILON && Math.abs(a[10] - b[10]) < EPSILON;
  }
  function equals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10];
  }
  function identity(dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = 1;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[4] = 0;
    newDst[5] = 1;
    newDst[6] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    return newDst;
  }
  function transpose(m, dst) {
    const newDst = dst ?? new Ctor(12);
    if (newDst === m) {
      let t;
      t = m[1];
      m[1] = m[4];
      m[4] = t;
      t = m[2];
      m[2] = m[8];
      m[8] = t;
      t = m[6];
      m[6] = m[9];
      m[9] = t;
      return newDst;
    }
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    newDst[0] = m00;
    newDst[1] = m10;
    newDst[2] = m20;
    newDst[4] = m01;
    newDst[5] = m11;
    newDst[6] = m21;
    newDst[8] = m02;
    newDst[9] = m12;
    newDst[10] = m22;
    return newDst;
  }
  function inverse(m, dst) {
    const newDst = dst ?? new Ctor(12);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const b01 = m22 * m11 - m12 * m21;
    const b11 = -m22 * m10 + m12 * m20;
    const b21 = m21 * m10 - m11 * m20;
    const invDet = 1 / (m00 * b01 + m01 * b11 + m02 * b21);
    newDst[0] = b01 * invDet;
    newDst[1] = (-m22 * m01 + m02 * m21) * invDet;
    newDst[2] = (m12 * m01 - m02 * m11) * invDet;
    newDst[4] = b11 * invDet;
    newDst[5] = (m22 * m00 - m02 * m20) * invDet;
    newDst[6] = (-m12 * m00 + m02 * m10) * invDet;
    newDst[8] = b21 * invDet;
    newDst[9] = (-m21 * m00 + m01 * m20) * invDet;
    newDst[10] = (m11 * m00 - m01 * m10) * invDet;
    return newDst;
  }
  function determinant(m) {
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    return m00 * (m11 * m22 - m21 * m12) - m10 * (m01 * m22 - m21 * m02) + m20 * (m01 * m12 - m11 * m02);
  }
  const invert = inverse;
  function multiply(a, b, dst) {
    const newDst = dst ?? new Ctor(12);
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a10 = a[4 + 0];
    const a11 = a[4 + 1];
    const a12 = a[4 + 2];
    const a20 = a[8 + 0];
    const a21 = a[8 + 1];
    const a22 = a[8 + 2];
    const b00 = b[0];
    const b01 = b[1];
    const b02 = b[2];
    const b10 = b[4 + 0];
    const b11 = b[4 + 1];
    const b12 = b[4 + 2];
    const b20 = b[8 + 0];
    const b21 = b[8 + 1];
    const b22 = b[8 + 2];
    newDst[0] = a00 * b00 + a10 * b01 + a20 * b02;
    newDst[1] = a01 * b00 + a11 * b01 + a21 * b02;
    newDst[2] = a02 * b00 + a12 * b01 + a22 * b02;
    newDst[4] = a00 * b10 + a10 * b11 + a20 * b12;
    newDst[5] = a01 * b10 + a11 * b11 + a21 * b12;
    newDst[6] = a02 * b10 + a12 * b11 + a22 * b12;
    newDst[8] = a00 * b20 + a10 * b21 + a20 * b22;
    newDst[9] = a01 * b20 + a11 * b21 + a21 * b22;
    newDst[10] = a02 * b20 + a12 * b21 + a22 * b22;
    return newDst;
  }
  const mul = multiply;
  function setTranslation(a, v, dst) {
    const newDst = dst ?? identity();
    if (a !== newDst) {
      newDst[0] = a[0];
      newDst[1] = a[1];
      newDst[2] = a[2];
      newDst[4] = a[4];
      newDst[5] = a[5];
      newDst[6] = a[6];
    }
    newDst[8] = v[0];
    newDst[9] = v[1];
    newDst[10] = 1;
    return newDst;
  }
  function getTranslation(m, dst) {
    const newDst = dst ?? vec23.create();
    newDst[0] = m[8];
    newDst[1] = m[9];
    return newDst;
  }
  function getAxis(m, axis, dst) {
    const newDst = dst ?? vec23.create();
    const off = axis * 4;
    newDst[0] = m[off + 0];
    newDst[1] = m[off + 1];
    return newDst;
  }
  function setAxis(m, v, axis, dst) {
    const newDst = dst === m ? m : copy(m, dst);
    const off = axis * 4;
    newDst[off + 0] = v[0];
    newDst[off + 1] = v[1];
    return newDst;
  }
  function getScaling(m, dst) {
    const newDst = dst ?? vec23.create();
    const xx = m[0];
    const xy = m[1];
    const yx = m[4];
    const yy = m[5];
    newDst[0] = Math.sqrt(xx * xx + xy * xy);
    newDst[1] = Math.sqrt(yx * yx + yy * yy);
    return newDst;
  }
  function get3DScaling(m, dst) {
    const newDst = dst ?? vec32.create();
    const xx = m[0];
    const xy = m[1];
    const xz = m[2];
    const yx = m[4];
    const yy = m[5];
    const yz = m[6];
    const zx = m[8];
    const zy = m[9];
    const zz = m[10];
    newDst[0] = Math.sqrt(xx * xx + xy * xy + xz * xz);
    newDst[1] = Math.sqrt(yx * yx + yy * yy + yz * yz);
    newDst[2] = Math.sqrt(zx * zx + zy * zy + zz * zz);
    return newDst;
  }
  function translation(v, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = 1;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[4] = 0;
    newDst[5] = 1;
    newDst[6] = 0;
    newDst[8] = v[0];
    newDst[9] = v[1];
    newDst[10] = 1;
    return newDst;
  }
  function translate(m, v, dst) {
    const newDst = dst ?? new Ctor(12);
    const v0 = v[0];
    const v1 = v[1];
    const m00 = m[0];
    const m01 = m[1];
    const m02 = m[2];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    if (m !== newDst) {
      newDst[0] = m00;
      newDst[1] = m01;
      newDst[2] = m02;
      newDst[4] = m10;
      newDst[5] = m11;
      newDst[6] = m12;
    }
    newDst[8] = m00 * v0 + m10 * v1 + m20;
    newDst[9] = m01 * v0 + m11 * v1 + m21;
    newDst[10] = m02 * v0 + m12 * v1 + m22;
    return newDst;
  }
  function rotation(angleInRadians, dst) {
    const newDst = dst ?? new Ctor(12);
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = c;
    newDst[1] = s;
    newDst[2] = 0;
    newDst[4] = -s;
    newDst[5] = c;
    newDst[6] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    return newDst;
  }
  function rotate(m, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(12);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = c * m00 + s * m10;
    newDst[1] = c * m01 + s * m11;
    newDst[2] = c * m02 + s * m12;
    newDst[4] = c * m10 - s * m00;
    newDst[5] = c * m11 - s * m01;
    newDst[6] = c * m12 - s * m02;
    if (m !== newDst) {
      newDst[8] = m[8];
      newDst[9] = m[9];
      newDst[10] = m[10];
    }
    return newDst;
  }
  function rotationX(angleInRadians, dst) {
    const newDst = dst ?? new Ctor(12);
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = 1;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[4] = 0;
    newDst[5] = c;
    newDst[6] = s;
    newDst[8] = 0;
    newDst[9] = -s;
    newDst[10] = c;
    return newDst;
  }
  function rotateX(m, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(12);
    const m10 = m[4];
    const m11 = m[5];
    const m12 = m[6];
    const m20 = m[8];
    const m21 = m[9];
    const m22 = m[10];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[4] = c * m10 + s * m20;
    newDst[5] = c * m11 + s * m21;
    newDst[6] = c * m12 + s * m22;
    newDst[8] = c * m20 - s * m10;
    newDst[9] = c * m21 - s * m11;
    newDst[10] = c * m22 - s * m12;
    if (m !== newDst) {
      newDst[0] = m[0];
      newDst[1] = m[1];
      newDst[2] = m[2];
    }
    return newDst;
  }
  function rotationY(angleInRadians, dst) {
    const newDst = dst ?? new Ctor(12);
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = c;
    newDst[1] = 0;
    newDst[2] = -s;
    newDst[4] = 0;
    newDst[5] = 1;
    newDst[6] = 0;
    newDst[8] = s;
    newDst[9] = 0;
    newDst[10] = c;
    return newDst;
  }
  function rotateY(m, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(12);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = c * m00 - s * m20;
    newDst[1] = c * m01 - s * m21;
    newDst[2] = c * m02 - s * m22;
    newDst[8] = c * m20 + s * m00;
    newDst[9] = c * m21 + s * m01;
    newDst[10] = c * m22 + s * m02;
    if (m !== newDst) {
      newDst[4] = m[4];
      newDst[5] = m[5];
      newDst[6] = m[6];
    }
    return newDst;
  }
  const rotationZ = rotation;
  const rotateZ = rotate;
  function scaling(v, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = v[0];
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[4] = 0;
    newDst[5] = v[1];
    newDst[6] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    return newDst;
  }
  function scale(m, v, dst) {
    const newDst = dst ?? new Ctor(12);
    const v0 = v[0];
    const v1 = v[1];
    newDst[0] = v0 * m[0 * 4 + 0];
    newDst[1] = v0 * m[0 * 4 + 1];
    newDst[2] = v0 * m[0 * 4 + 2];
    newDst[4] = v1 * m[1 * 4 + 0];
    newDst[5] = v1 * m[1 * 4 + 1];
    newDst[6] = v1 * m[1 * 4 + 2];
    if (m !== newDst) {
      newDst[8] = m[8];
      newDst[9] = m[9];
      newDst[10] = m[10];
    }
    return newDst;
  }
  function scaling3D(v, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = v[0];
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[4] = 0;
    newDst[5] = v[1];
    newDst[6] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = v[2];
    return newDst;
  }
  function scale3D(m, v, dst) {
    const newDst = dst ?? new Ctor(12);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    newDst[0] = v0 * m[0 * 4 + 0];
    newDst[1] = v0 * m[0 * 4 + 1];
    newDst[2] = v0 * m[0 * 4 + 2];
    newDst[4] = v1 * m[1 * 4 + 0];
    newDst[5] = v1 * m[1 * 4 + 1];
    newDst[6] = v1 * m[1 * 4 + 2];
    newDst[8] = v2 * m[2 * 4 + 0];
    newDst[9] = v2 * m[2 * 4 + 1];
    newDst[10] = v2 * m[2 * 4 + 2];
    return newDst;
  }
  function uniformScaling(s, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = s;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[4] = 0;
    newDst[5] = s;
    newDst[6] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    return newDst;
  }
  function uniformScale(m, s, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = s * m[0 * 4 + 0];
    newDst[1] = s * m[0 * 4 + 1];
    newDst[2] = s * m[0 * 4 + 2];
    newDst[4] = s * m[1 * 4 + 0];
    newDst[5] = s * m[1 * 4 + 1];
    newDst[6] = s * m[1 * 4 + 2];
    if (m !== newDst) {
      newDst[8] = m[8];
      newDst[9] = m[9];
      newDst[10] = m[10];
    }
    return newDst;
  }
  function uniformScaling3D(s, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = s;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[4] = 0;
    newDst[5] = s;
    newDst[6] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = s;
    return newDst;
  }
  function uniformScale3D(m, s, dst) {
    const newDst = dst ?? new Ctor(12);
    newDst[0] = s * m[0 * 4 + 0];
    newDst[1] = s * m[0 * 4 + 1];
    newDst[2] = s * m[0 * 4 + 2];
    newDst[4] = s * m[1 * 4 + 0];
    newDst[5] = s * m[1 * 4 + 1];
    newDst[6] = s * m[1 * 4 + 2];
    newDst[8] = s * m[2 * 4 + 0];
    newDst[9] = s * m[2 * 4 + 1];
    newDst[10] = s * m[2 * 4 + 2];
    return newDst;
  }
  return {
    add,
    clone,
    copy,
    create,
    determinant,
    equals,
    equalsApproximately,
    fromMat4,
    fromQuat,
    get3DScaling,
    getAxis,
    getScaling,
    getTranslation,
    identity,
    inverse,
    invert,
    mul,
    mulScalar,
    multiply,
    multiplyScalar,
    negate,
    rotate,
    rotateX,
    rotateY,
    rotateZ,
    rotation,
    rotationX,
    rotationY,
    rotationZ,
    scale,
    scale3D,
    scaling,
    scaling3D,
    set,
    setAxis,
    setTranslation,
    translate,
    translation,
    transpose,
    uniformScale,
    uniformScale3D,
    uniformScaling,
    uniformScaling3D
  };
}
var cache$3 = /* @__PURE__ */ new Map();
function getAPI$3(Ctor) {
  let api = cache$3.get(Ctor);
  if (!api) {
    api = getAPIImpl$3(Ctor);
    cache$3.set(Ctor, api);
  }
  return api;
}
function getAPIImpl$2(Ctor) {
  const vec32 = getAPI$4(Ctor);
  function create(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
    const newDst = new Ctor(16);
    if (v0 !== void 0) {
      newDst[0] = v0;
      if (v1 !== void 0) {
        newDst[1] = v1;
        if (v2 !== void 0) {
          newDst[2] = v2;
          if (v3 !== void 0) {
            newDst[3] = v3;
            if (v4 !== void 0) {
              newDst[4] = v4;
              if (v5 !== void 0) {
                newDst[5] = v5;
                if (v6 !== void 0) {
                  newDst[6] = v6;
                  if (v7 !== void 0) {
                    newDst[7] = v7;
                    if (v8 !== void 0) {
                      newDst[8] = v8;
                      if (v9 !== void 0) {
                        newDst[9] = v9;
                        if (v10 !== void 0) {
                          newDst[10] = v10;
                          if (v11 !== void 0) {
                            newDst[11] = v11;
                            if (v12 !== void 0) {
                              newDst[12] = v12;
                              if (v13 !== void 0) {
                                newDst[13] = v13;
                                if (v14 !== void 0) {
                                  newDst[14] = v14;
                                  if (v15 !== void 0) {
                                    newDst[15] = v15;
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return newDst;
  }
  function set(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = v0;
    newDst[1] = v1;
    newDst[2] = v2;
    newDst[3] = v3;
    newDst[4] = v4;
    newDst[5] = v5;
    newDst[6] = v6;
    newDst[7] = v7;
    newDst[8] = v8;
    newDst[9] = v9;
    newDst[10] = v10;
    newDst[11] = v11;
    newDst[12] = v12;
    newDst[13] = v13;
    newDst[14] = v14;
    newDst[15] = v15;
    return newDst;
  }
  function fromMat3(m3, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = m3[0];
    newDst[1] = m3[1];
    newDst[2] = m3[2];
    newDst[3] = 0;
    newDst[4] = m3[4];
    newDst[5] = m3[5];
    newDst[6] = m3[6];
    newDst[7] = 0;
    newDst[8] = m3[8];
    newDst[9] = m3[9];
    newDst[10] = m3[10];
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function fromQuat(q, dst) {
    const newDst = dst ?? new Ctor(16);
    const x = q[0];
    const y = q[1];
    const z = q[2];
    const w = q[3];
    const x2 = x + x;
    const y2 = y + y;
    const z2 = z + z;
    const xx = x * x2;
    const yx = y * x2;
    const yy = y * y2;
    const zx = z * x2;
    const zy = z * y2;
    const zz = z * z2;
    const wx = w * x2;
    const wy = w * y2;
    const wz = w * z2;
    newDst[0] = 1 - yy - zz;
    newDst[1] = yx + wz;
    newDst[2] = zx - wy;
    newDst[3] = 0;
    newDst[4] = yx - wz;
    newDst[5] = 1 - xx - zz;
    newDst[6] = zy + wx;
    newDst[7] = 0;
    newDst[8] = zx + wy;
    newDst[9] = zy - wx;
    newDst[10] = 1 - xx - yy;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function negate(m, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = -m[0];
    newDst[1] = -m[1];
    newDst[2] = -m[2];
    newDst[3] = -m[3];
    newDst[4] = -m[4];
    newDst[5] = -m[5];
    newDst[6] = -m[6];
    newDst[7] = -m[7];
    newDst[8] = -m[8];
    newDst[9] = -m[9];
    newDst[10] = -m[10];
    newDst[11] = -m[11];
    newDst[12] = -m[12];
    newDst[13] = -m[13];
    newDst[14] = -m[14];
    newDst[15] = -m[15];
    return newDst;
  }
  function add(a, b, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = a[0] + b[0];
    newDst[1] = a[1] + b[1];
    newDst[2] = a[2] + b[2];
    newDst[3] = a[3] + b[3];
    newDst[4] = a[4] + b[4];
    newDst[5] = a[5] + b[5];
    newDst[6] = a[6] + b[6];
    newDst[7] = a[7] + b[7];
    newDst[8] = a[8] + b[8];
    newDst[9] = a[9] + b[9];
    newDst[10] = a[10] + b[10];
    newDst[11] = a[11] + b[11];
    newDst[12] = a[12] + b[12];
    newDst[13] = a[13] + b[13];
    newDst[14] = a[14] + b[14];
    newDst[15] = a[15] + b[15];
    return newDst;
  }
  function multiplyScalar(m, s, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = m[0] * s;
    newDst[1] = m[1] * s;
    newDst[2] = m[2] * s;
    newDst[3] = m[3] * s;
    newDst[4] = m[4] * s;
    newDst[5] = m[5] * s;
    newDst[6] = m[6] * s;
    newDst[7] = m[7] * s;
    newDst[8] = m[8] * s;
    newDst[9] = m[9] * s;
    newDst[10] = m[10] * s;
    newDst[11] = m[11] * s;
    newDst[12] = m[12] * s;
    newDst[13] = m[13] * s;
    newDst[14] = m[14] * s;
    newDst[15] = m[15] * s;
    return newDst;
  }
  const mulScalar = multiplyScalar;
  function copy(m, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = m[0];
    newDst[1] = m[1];
    newDst[2] = m[2];
    newDst[3] = m[3];
    newDst[4] = m[4];
    newDst[5] = m[5];
    newDst[6] = m[6];
    newDst[7] = m[7];
    newDst[8] = m[8];
    newDst[9] = m[9];
    newDst[10] = m[10];
    newDst[11] = m[11];
    newDst[12] = m[12];
    newDst[13] = m[13];
    newDst[14] = m[14];
    newDst[15] = m[15];
    return newDst;
  }
  const clone = copy;
  function equalsApproximately(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[3] - b[3]) < EPSILON && Math.abs(a[4] - b[4]) < EPSILON && Math.abs(a[5] - b[5]) < EPSILON && Math.abs(a[6] - b[6]) < EPSILON && Math.abs(a[7] - b[7]) < EPSILON && Math.abs(a[8] - b[8]) < EPSILON && Math.abs(a[9] - b[9]) < EPSILON && Math.abs(a[10] - b[10]) < EPSILON && Math.abs(a[11] - b[11]) < EPSILON && Math.abs(a[12] - b[12]) < EPSILON && Math.abs(a[13] - b[13]) < EPSILON && Math.abs(a[14] - b[14]) < EPSILON && Math.abs(a[15] - b[15]) < EPSILON;
  }
  function equals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
  }
  function identity(dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = 1;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = 1;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function transpose(m, dst) {
    const newDst = dst ?? new Ctor(16);
    if (newDst === m) {
      let t;
      t = m[1];
      m[1] = m[4];
      m[4] = t;
      t = m[2];
      m[2] = m[8];
      m[8] = t;
      t = m[3];
      m[3] = m[12];
      m[12] = t;
      t = m[6];
      m[6] = m[9];
      m[9] = t;
      t = m[7];
      m[7] = m[13];
      m[13] = t;
      t = m[11];
      m[11] = m[14];
      m[14] = t;
      return newDst;
    }
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    newDst[0] = m00;
    newDst[1] = m10;
    newDst[2] = m20;
    newDst[3] = m30;
    newDst[4] = m01;
    newDst[5] = m11;
    newDst[6] = m21;
    newDst[7] = m31;
    newDst[8] = m02;
    newDst[9] = m12;
    newDst[10] = m22;
    newDst[11] = m32;
    newDst[12] = m03;
    newDst[13] = m13;
    newDst[14] = m23;
    newDst[15] = m33;
    return newDst;
  }
  function inverse(m, dst) {
    const newDst = dst ?? new Ctor(16);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    const tmp0 = m22 * m33;
    const tmp1 = m32 * m23;
    const tmp2 = m12 * m33;
    const tmp3 = m32 * m13;
    const tmp4 = m12 * m23;
    const tmp5 = m22 * m13;
    const tmp6 = m02 * m33;
    const tmp7 = m32 * m03;
    const tmp8 = m02 * m23;
    const tmp9 = m22 * m03;
    const tmp10 = m02 * m13;
    const tmp11 = m12 * m03;
    const tmp12 = m20 * m31;
    const tmp13 = m30 * m21;
    const tmp14 = m10 * m31;
    const tmp15 = m30 * m11;
    const tmp16 = m10 * m21;
    const tmp17 = m20 * m11;
    const tmp18 = m00 * m31;
    const tmp19 = m30 * m01;
    const tmp20 = m00 * m21;
    const tmp21 = m20 * m01;
    const tmp22 = m00 * m11;
    const tmp23 = m10 * m01;
    const t0 = tmp0 * m11 + tmp3 * m21 + tmp4 * m31 - (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
    const t1 = tmp1 * m01 + tmp6 * m21 + tmp9 * m31 - (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
    const t2 = tmp2 * m01 + tmp7 * m11 + tmp10 * m31 - (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
    const t3 = tmp5 * m01 + tmp8 * m11 + tmp11 * m21 - (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);
    const d = 1 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
    newDst[0] = d * t0;
    newDst[1] = d * t1;
    newDst[2] = d * t2;
    newDst[3] = d * t3;
    newDst[4] = d * (tmp1 * m10 + tmp2 * m20 + tmp5 * m30 - (tmp0 * m10 + tmp3 * m20 + tmp4 * m30));
    newDst[5] = d * (tmp0 * m00 + tmp7 * m20 + tmp8 * m30 - (tmp1 * m00 + tmp6 * m20 + tmp9 * m30));
    newDst[6] = d * (tmp3 * m00 + tmp6 * m10 + tmp11 * m30 - (tmp2 * m00 + tmp7 * m10 + tmp10 * m30));
    newDst[7] = d * (tmp4 * m00 + tmp9 * m10 + tmp10 * m20 - (tmp5 * m00 + tmp8 * m10 + tmp11 * m20));
    newDst[8] = d * (tmp12 * m13 + tmp15 * m23 + tmp16 * m33 - (tmp13 * m13 + tmp14 * m23 + tmp17 * m33));
    newDst[9] = d * (tmp13 * m03 + tmp18 * m23 + tmp21 * m33 - (tmp12 * m03 + tmp19 * m23 + tmp20 * m33));
    newDst[10] = d * (tmp14 * m03 + tmp19 * m13 + tmp22 * m33 - (tmp15 * m03 + tmp18 * m13 + tmp23 * m33));
    newDst[11] = d * (tmp17 * m03 + tmp20 * m13 + tmp23 * m23 - (tmp16 * m03 + tmp21 * m13 + tmp22 * m23));
    newDst[12] = d * (tmp14 * m22 + tmp17 * m32 + tmp13 * m12 - (tmp16 * m32 + tmp12 * m12 + tmp15 * m22));
    newDst[13] = d * (tmp20 * m32 + tmp12 * m02 + tmp19 * m22 - (tmp18 * m22 + tmp21 * m32 + tmp13 * m02));
    newDst[14] = d * (tmp18 * m12 + tmp23 * m32 + tmp15 * m02 - (tmp22 * m32 + tmp14 * m02 + tmp19 * m12));
    newDst[15] = d * (tmp22 * m22 + tmp16 * m02 + tmp21 * m12 - (tmp20 * m12 + tmp23 * m22 + tmp17 * m02));
    return newDst;
  }
  function determinant(m) {
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    const tmp0 = m22 * m33;
    const tmp1 = m32 * m23;
    const tmp2 = m12 * m33;
    const tmp3 = m32 * m13;
    const tmp4 = m12 * m23;
    const tmp5 = m22 * m13;
    const tmp6 = m02 * m33;
    const tmp7 = m32 * m03;
    const tmp8 = m02 * m23;
    const tmp9 = m22 * m03;
    const tmp10 = m02 * m13;
    const tmp11 = m12 * m03;
    const t0 = tmp0 * m11 + tmp3 * m21 + tmp4 * m31 - (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
    const t1 = tmp1 * m01 + tmp6 * m21 + tmp9 * m31 - (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
    const t2 = tmp2 * m01 + tmp7 * m11 + tmp10 * m31 - (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
    const t3 = tmp5 * m01 + tmp8 * m11 + tmp11 * m21 - (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);
    return m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3;
  }
  const invert = inverse;
  function multiply(a, b, dst) {
    const newDst = dst ?? new Ctor(16);
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a03 = a[3];
    const a10 = a[4 + 0];
    const a11 = a[4 + 1];
    const a12 = a[4 + 2];
    const a13 = a[4 + 3];
    const a20 = a[8 + 0];
    const a21 = a[8 + 1];
    const a22 = a[8 + 2];
    const a23 = a[8 + 3];
    const a30 = a[12 + 0];
    const a31 = a[12 + 1];
    const a32 = a[12 + 2];
    const a33 = a[12 + 3];
    const b00 = b[0];
    const b01 = b[1];
    const b02 = b[2];
    const b03 = b[3];
    const b10 = b[4 + 0];
    const b11 = b[4 + 1];
    const b12 = b[4 + 2];
    const b13 = b[4 + 3];
    const b20 = b[8 + 0];
    const b21 = b[8 + 1];
    const b22 = b[8 + 2];
    const b23 = b[8 + 3];
    const b30 = b[12 + 0];
    const b31 = b[12 + 1];
    const b32 = b[12 + 2];
    const b33 = b[12 + 3];
    newDst[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
    newDst[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
    newDst[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
    newDst[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
    newDst[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
    newDst[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
    newDst[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
    newDst[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
    newDst[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
    newDst[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
    newDst[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
    newDst[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
    newDst[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
    newDst[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
    newDst[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
    newDst[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
    return newDst;
  }
  const mul = multiply;
  function setTranslation(a, v, dst) {
    const newDst = dst ?? identity();
    if (a !== newDst) {
      newDst[0] = a[0];
      newDst[1] = a[1];
      newDst[2] = a[2];
      newDst[3] = a[3];
      newDst[4] = a[4];
      newDst[5] = a[5];
      newDst[6] = a[6];
      newDst[7] = a[7];
      newDst[8] = a[8];
      newDst[9] = a[9];
      newDst[10] = a[10];
      newDst[11] = a[11];
    }
    newDst[12] = v[0];
    newDst[13] = v[1];
    newDst[14] = v[2];
    newDst[15] = 1;
    return newDst;
  }
  function getTranslation(m, dst) {
    const newDst = dst ?? vec32.create();
    newDst[0] = m[12];
    newDst[1] = m[13];
    newDst[2] = m[14];
    return newDst;
  }
  function getAxis(m, axis, dst) {
    const newDst = dst ?? vec32.create();
    const off = axis * 4;
    newDst[0] = m[off + 0];
    newDst[1] = m[off + 1];
    newDst[2] = m[off + 2];
    return newDst;
  }
  function setAxis(m, v, axis, dst) {
    const newDst = dst === m ? dst : copy(m, dst);
    const off = axis * 4;
    newDst[off + 0] = v[0];
    newDst[off + 1] = v[1];
    newDst[off + 2] = v[2];
    return newDst;
  }
  function getScaling(m, dst) {
    const newDst = dst ?? vec32.create();
    const xx = m[0];
    const xy = m[1];
    const xz = m[2];
    const yx = m[4];
    const yy = m[5];
    const yz = m[6];
    const zx = m[8];
    const zy = m[9];
    const zz = m[10];
    newDst[0] = Math.sqrt(xx * xx + xy * xy + xz * xz);
    newDst[1] = Math.sqrt(yx * yx + yy * yy + yz * yz);
    newDst[2] = Math.sqrt(zx * zx + zy * zy + zz * zz);
    return newDst;
  }
  function perspective(fieldOfViewYInRadians, aspect, zNear, zFar, dst) {
    const newDst = dst ?? new Ctor(16);
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewYInRadians);
    newDst[0] = f / aspect;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = f;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[11] = -1;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[15] = 0;
    if (Number.isFinite(zFar)) {
      const rangeInv = 1 / (zNear - zFar);
      newDst[10] = zFar * rangeInv;
      newDst[14] = zFar * zNear * rangeInv;
    } else {
      newDst[10] = -1;
      newDst[14] = -zNear;
    }
    return newDst;
  }
  function perspectiveReverseZ(fieldOfViewYInRadians, aspect, zNear, zFar = Infinity, dst) {
    const newDst = dst ?? new Ctor(16);
    const f = 1 / Math.tan(fieldOfViewYInRadians * 0.5);
    newDst[0] = f / aspect;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = f;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[11] = -1;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[15] = 0;
    if (zFar === Infinity) {
      newDst[10] = 0;
      newDst[14] = zNear;
    } else {
      const rangeInv = 1 / (zFar - zNear);
      newDst[10] = zNear * rangeInv;
      newDst[14] = zFar * zNear * rangeInv;
    }
    return newDst;
  }
  function ortho(left, right, bottom, top, near, far, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = 2 / (right - left);
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = 2 / (top - bottom);
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1 / (near - far);
    newDst[11] = 0;
    newDst[12] = (right + left) / (left - right);
    newDst[13] = (top + bottom) / (bottom - top);
    newDst[14] = near / (near - far);
    newDst[15] = 1;
    return newDst;
  }
  function frustum(left, right, bottom, top, near, far, dst) {
    const newDst = dst ?? new Ctor(16);
    const dx = right - left;
    const dy = top - bottom;
    const dz = near - far;
    newDst[0] = 2 * near / dx;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = 2 * near / dy;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = (left + right) / dx;
    newDst[9] = (top + bottom) / dy;
    newDst[10] = far / dz;
    newDst[11] = -1;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = near * far / dz;
    newDst[15] = 0;
    return newDst;
  }
  function frustumReverseZ(left, right, bottom, top, near, far = Infinity, dst) {
    const newDst = dst ?? new Ctor(16);
    const dx = right - left;
    const dy = top - bottom;
    newDst[0] = 2 * near / dx;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = 2 * near / dy;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = (left + right) / dx;
    newDst[9] = (top + bottom) / dy;
    newDst[11] = -1;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[15] = 0;
    if (far === Infinity) {
      newDst[10] = 0;
      newDst[14] = near;
    } else {
      const rangeInv = 1 / (far - near);
      newDst[10] = near * rangeInv;
      newDst[14] = far * near * rangeInv;
    }
    return newDst;
  }
  const xAxis = vec32.create();
  const yAxis = vec32.create();
  const zAxis = vec32.create();
  function aim(position, target, up, dst) {
    const newDst = dst ?? new Ctor(16);
    vec32.normalize(vec32.subtract(target, position, zAxis), zAxis);
    vec32.normalize(vec32.cross(up, zAxis, xAxis), xAxis);
    vec32.normalize(vec32.cross(zAxis, xAxis, yAxis), yAxis);
    newDst[0] = xAxis[0];
    newDst[1] = xAxis[1];
    newDst[2] = xAxis[2];
    newDst[3] = 0;
    newDst[4] = yAxis[0];
    newDst[5] = yAxis[1];
    newDst[6] = yAxis[2];
    newDst[7] = 0;
    newDst[8] = zAxis[0];
    newDst[9] = zAxis[1];
    newDst[10] = zAxis[2];
    newDst[11] = 0;
    newDst[12] = position[0];
    newDst[13] = position[1];
    newDst[14] = position[2];
    newDst[15] = 1;
    return newDst;
  }
  function cameraAim(eye, target, up, dst) {
    const newDst = dst ?? new Ctor(16);
    vec32.normalize(vec32.subtract(eye, target, zAxis), zAxis);
    vec32.normalize(vec32.cross(up, zAxis, xAxis), xAxis);
    vec32.normalize(vec32.cross(zAxis, xAxis, yAxis), yAxis);
    newDst[0] = xAxis[0];
    newDst[1] = xAxis[1];
    newDst[2] = xAxis[2];
    newDst[3] = 0;
    newDst[4] = yAxis[0];
    newDst[5] = yAxis[1];
    newDst[6] = yAxis[2];
    newDst[7] = 0;
    newDst[8] = zAxis[0];
    newDst[9] = zAxis[1];
    newDst[10] = zAxis[2];
    newDst[11] = 0;
    newDst[12] = eye[0];
    newDst[13] = eye[1];
    newDst[14] = eye[2];
    newDst[15] = 1;
    return newDst;
  }
  function lookAt(eye, target, up, dst) {
    const newDst = dst ?? new Ctor(16);
    vec32.normalize(vec32.subtract(eye, target, zAxis), zAxis);
    vec32.normalize(vec32.cross(up, zAxis, xAxis), xAxis);
    vec32.normalize(vec32.cross(zAxis, xAxis, yAxis), yAxis);
    newDst[0] = xAxis[0];
    newDst[1] = yAxis[0];
    newDst[2] = zAxis[0];
    newDst[3] = 0;
    newDst[4] = xAxis[1];
    newDst[5] = yAxis[1];
    newDst[6] = zAxis[1];
    newDst[7] = 0;
    newDst[8] = xAxis[2];
    newDst[9] = yAxis[2];
    newDst[10] = zAxis[2];
    newDst[11] = 0;
    newDst[12] = -(xAxis[0] * eye[0] + xAxis[1] * eye[1] + xAxis[2] * eye[2]);
    newDst[13] = -(yAxis[0] * eye[0] + yAxis[1] * eye[1] + yAxis[2] * eye[2]);
    newDst[14] = -(zAxis[0] * eye[0] + zAxis[1] * eye[1] + zAxis[2] * eye[2]);
    newDst[15] = 1;
    return newDst;
  }
  function translation(v, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = 1;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = 1;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    newDst[11] = 0;
    newDst[12] = v[0];
    newDst[13] = v[1];
    newDst[14] = v[2];
    newDst[15] = 1;
    return newDst;
  }
  function translate(m, v, dst) {
    const newDst = dst ?? new Ctor(16);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const m00 = m[0];
    const m01 = m[1];
    const m02 = m[2];
    const m03 = m[3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    if (m !== newDst) {
      newDst[0] = m00;
      newDst[1] = m01;
      newDst[2] = m02;
      newDst[3] = m03;
      newDst[4] = m10;
      newDst[5] = m11;
      newDst[6] = m12;
      newDst[7] = m13;
      newDst[8] = m20;
      newDst[9] = m21;
      newDst[10] = m22;
      newDst[11] = m23;
    }
    newDst[12] = m00 * v0 + m10 * v1 + m20 * v2 + m30;
    newDst[13] = m01 * v0 + m11 * v1 + m21 * v2 + m31;
    newDst[14] = m02 * v0 + m12 * v1 + m22 * v2 + m32;
    newDst[15] = m03 * v0 + m13 * v1 + m23 * v2 + m33;
    return newDst;
  }
  function rotationX(angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = 1;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = c;
    newDst[6] = s;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = -s;
    newDst[10] = c;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function rotateX(m, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    const m10 = m[4];
    const m11 = m[5];
    const m12 = m[6];
    const m13 = m[7];
    const m20 = m[8];
    const m21 = m[9];
    const m22 = m[10];
    const m23 = m[11];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[4] = c * m10 + s * m20;
    newDst[5] = c * m11 + s * m21;
    newDst[6] = c * m12 + s * m22;
    newDst[7] = c * m13 + s * m23;
    newDst[8] = c * m20 - s * m10;
    newDst[9] = c * m21 - s * m11;
    newDst[10] = c * m22 - s * m12;
    newDst[11] = c * m23 - s * m13;
    if (m !== newDst) {
      newDst[0] = m[0];
      newDst[1] = m[1];
      newDst[2] = m[2];
      newDst[3] = m[3];
      newDst[12] = m[12];
      newDst[13] = m[13];
      newDst[14] = m[14];
      newDst[15] = m[15];
    }
    return newDst;
  }
  function rotationY(angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = c;
    newDst[1] = 0;
    newDst[2] = -s;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = 1;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = s;
    newDst[9] = 0;
    newDst[10] = c;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function rotateY(m, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = c * m00 - s * m20;
    newDst[1] = c * m01 - s * m21;
    newDst[2] = c * m02 - s * m22;
    newDst[3] = c * m03 - s * m23;
    newDst[8] = c * m20 + s * m00;
    newDst[9] = c * m21 + s * m01;
    newDst[10] = c * m22 + s * m02;
    newDst[11] = c * m23 + s * m03;
    if (m !== newDst) {
      newDst[4] = m[4];
      newDst[5] = m[5];
      newDst[6] = m[6];
      newDst[7] = m[7];
      newDst[12] = m[12];
      newDst[13] = m[13];
      newDst[14] = m[14];
      newDst[15] = m[15];
    }
    return newDst;
  }
  function rotationZ(angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = c;
    newDst[1] = s;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = -s;
    newDst[5] = c;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = 1;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function rotateZ(m, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    newDst[0] = c * m00 + s * m10;
    newDst[1] = c * m01 + s * m11;
    newDst[2] = c * m02 + s * m12;
    newDst[3] = c * m03 + s * m13;
    newDst[4] = c * m10 - s * m00;
    newDst[5] = c * m11 - s * m01;
    newDst[6] = c * m12 - s * m02;
    newDst[7] = c * m13 - s * m03;
    if (m !== newDst) {
      newDst[8] = m[8];
      newDst[9] = m[9];
      newDst[10] = m[10];
      newDst[11] = m[11];
      newDst[12] = m[12];
      newDst[13] = m[13];
      newDst[14] = m[14];
      newDst[15] = m[15];
    }
    return newDst;
  }
  function axisRotation(axis, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    let x = axis[0];
    let y = axis[1];
    let z = axis[2];
    const n = Math.sqrt(x * x + y * y + z * z);
    x /= n;
    y /= n;
    z /= n;
    const xx = x * x;
    const yy = y * y;
    const zz = z * z;
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    const oneMinusCosine = 1 - c;
    newDst[0] = xx + (1 - xx) * c;
    newDst[1] = x * y * oneMinusCosine + z * s;
    newDst[2] = x * z * oneMinusCosine - y * s;
    newDst[3] = 0;
    newDst[4] = x * y * oneMinusCosine - z * s;
    newDst[5] = yy + (1 - yy) * c;
    newDst[6] = y * z * oneMinusCosine + x * s;
    newDst[7] = 0;
    newDst[8] = x * z * oneMinusCosine + y * s;
    newDst[9] = y * z * oneMinusCosine - x * s;
    newDst[10] = zz + (1 - zz) * c;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  const rotation = axisRotation;
  function axisRotate(m, axis, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(16);
    let x = axis[0];
    let y = axis[1];
    let z = axis[2];
    const n = Math.sqrt(x * x + y * y + z * z);
    x /= n;
    y /= n;
    z /= n;
    const xx = x * x;
    const yy = y * y;
    const zz = z * z;
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    const oneMinusCosine = 1 - c;
    const r00 = xx + (1 - xx) * c;
    const r01 = x * y * oneMinusCosine + z * s;
    const r02 = x * z * oneMinusCosine - y * s;
    const r10 = x * y * oneMinusCosine - z * s;
    const r11 = yy + (1 - yy) * c;
    const r12 = y * z * oneMinusCosine + x * s;
    const r20 = x * z * oneMinusCosine + y * s;
    const r21 = y * z * oneMinusCosine - x * s;
    const r22 = zz + (1 - zz) * c;
    const m00 = m[0];
    const m01 = m[1];
    const m02 = m[2];
    const m03 = m[3];
    const m10 = m[4];
    const m11 = m[5];
    const m12 = m[6];
    const m13 = m[7];
    const m20 = m[8];
    const m21 = m[9];
    const m22 = m[10];
    const m23 = m[11];
    newDst[0] = r00 * m00 + r01 * m10 + r02 * m20;
    newDst[1] = r00 * m01 + r01 * m11 + r02 * m21;
    newDst[2] = r00 * m02 + r01 * m12 + r02 * m22;
    newDst[3] = r00 * m03 + r01 * m13 + r02 * m23;
    newDst[4] = r10 * m00 + r11 * m10 + r12 * m20;
    newDst[5] = r10 * m01 + r11 * m11 + r12 * m21;
    newDst[6] = r10 * m02 + r11 * m12 + r12 * m22;
    newDst[7] = r10 * m03 + r11 * m13 + r12 * m23;
    newDst[8] = r20 * m00 + r21 * m10 + r22 * m20;
    newDst[9] = r20 * m01 + r21 * m11 + r22 * m21;
    newDst[10] = r20 * m02 + r21 * m12 + r22 * m22;
    newDst[11] = r20 * m03 + r21 * m13 + r22 * m23;
    if (m !== newDst) {
      newDst[12] = m[12];
      newDst[13] = m[13];
      newDst[14] = m[14];
      newDst[15] = m[15];
    }
    return newDst;
  }
  const rotate = axisRotate;
  function scaling(v, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = v[0];
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = v[1];
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = v[2];
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function scale(m, v, dst) {
    const newDst = dst ?? new Ctor(16);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    newDst[0] = v0 * m[0 * 4 + 0];
    newDst[1] = v0 * m[0 * 4 + 1];
    newDst[2] = v0 * m[0 * 4 + 2];
    newDst[3] = v0 * m[0 * 4 + 3];
    newDst[4] = v1 * m[1 * 4 + 0];
    newDst[5] = v1 * m[1 * 4 + 1];
    newDst[6] = v1 * m[1 * 4 + 2];
    newDst[7] = v1 * m[1 * 4 + 3];
    newDst[8] = v2 * m[2 * 4 + 0];
    newDst[9] = v2 * m[2 * 4 + 1];
    newDst[10] = v2 * m[2 * 4 + 2];
    newDst[11] = v2 * m[2 * 4 + 3];
    if (m !== newDst) {
      newDst[12] = m[12];
      newDst[13] = m[13];
      newDst[14] = m[14];
      newDst[15] = m[15];
    }
    return newDst;
  }
  function uniformScaling(s, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = s;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    newDst[4] = 0;
    newDst[5] = s;
    newDst[6] = 0;
    newDst[7] = 0;
    newDst[8] = 0;
    newDst[9] = 0;
    newDst[10] = s;
    newDst[11] = 0;
    newDst[12] = 0;
    newDst[13] = 0;
    newDst[14] = 0;
    newDst[15] = 1;
    return newDst;
  }
  function uniformScale(m, s, dst) {
    const newDst = dst ?? new Ctor(16);
    newDst[0] = s * m[0 * 4 + 0];
    newDst[1] = s * m[0 * 4 + 1];
    newDst[2] = s * m[0 * 4 + 2];
    newDst[3] = s * m[0 * 4 + 3];
    newDst[4] = s * m[1 * 4 + 0];
    newDst[5] = s * m[1 * 4 + 1];
    newDst[6] = s * m[1 * 4 + 2];
    newDst[7] = s * m[1 * 4 + 3];
    newDst[8] = s * m[2 * 4 + 0];
    newDst[9] = s * m[2 * 4 + 1];
    newDst[10] = s * m[2 * 4 + 2];
    newDst[11] = s * m[2 * 4 + 3];
    if (m !== newDst) {
      newDst[12] = m[12];
      newDst[13] = m[13];
      newDst[14] = m[14];
      newDst[15] = m[15];
    }
    return newDst;
  }
  return {
    add,
    aim,
    axisRotate,
    axisRotation,
    cameraAim,
    clone,
    copy,
    create,
    determinant,
    equals,
    equalsApproximately,
    fromMat3,
    fromQuat,
    frustum,
    frustumReverseZ,
    getAxis,
    getScaling,
    getTranslation,
    identity,
    inverse,
    invert,
    lookAt,
    mul,
    mulScalar,
    multiply,
    multiplyScalar,
    negate,
    ortho,
    perspective,
    perspectiveReverseZ,
    rotate,
    rotateX,
    rotateY,
    rotateZ,
    rotation,
    rotationX,
    rotationY,
    rotationZ,
    scale,
    scaling,
    set,
    setAxis,
    setTranslation,
    translate,
    translation,
    transpose,
    uniformScale,
    uniformScaling
  };
}
var cache$2 = /* @__PURE__ */ new Map();
function getAPI$2(Ctor) {
  let api = cache$2.get(Ctor);
  if (!api) {
    api = getAPIImpl$2(Ctor);
    cache$2.set(Ctor, api);
  }
  return api;
}
function getAPIImpl$1(Ctor) {
  const vec32 = getAPI$4(Ctor);
  function create(x, y, z, w) {
    const newDst = new Ctor(4);
    if (x !== void 0) {
      newDst[0] = x;
      if (y !== void 0) {
        newDst[1] = y;
        if (z !== void 0) {
          newDst[2] = z;
          if (w !== void 0) {
            newDst[3] = w;
          }
        }
      }
    }
    return newDst;
  }
  const fromValues = create;
  function set(x, y, z, w, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = x;
    newDst[1] = y;
    newDst[2] = z;
    newDst[3] = w;
    return newDst;
  }
  function fromAxisAngle(axis, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(4);
    const halfAngle = angleInRadians * 0.5;
    const s = Math.sin(halfAngle);
    newDst[0] = s * axis[0];
    newDst[1] = s * axis[1];
    newDst[2] = s * axis[2];
    newDst[3] = Math.cos(halfAngle);
    return newDst;
  }
  function toAxisAngle(q, dst) {
    const newDst = dst ?? vec32.create(3);
    const angle2 = Math.acos(q[3]) * 2;
    const s = Math.sin(angle2 * 0.5);
    if (s > EPSILON) {
      newDst[0] = q[0] / s;
      newDst[1] = q[1] / s;
      newDst[2] = q[2] / s;
    } else {
      newDst[0] = 1;
      newDst[1] = 0;
      newDst[2] = 0;
    }
    return { angle: angle2, axis: newDst };
  }
  function angle(a, b) {
    const d = dot(a, b);
    return Math.acos(2 * d * d - 1);
  }
  function multiply(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const aw = a[3];
    const bx = b[0];
    const by = b[1];
    const bz = b[2];
    const bw = b[3];
    newDst[0] = ax * bw + aw * bx + ay * bz - az * by;
    newDst[1] = ay * bw + aw * by + az * bx - ax * bz;
    newDst[2] = az * bw + aw * bz + ax * by - ay * bx;
    newDst[3] = aw * bw - ax * bx - ay * by - az * bz;
    return newDst;
  }
  const mul = multiply;
  function rotateX(q, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(4);
    const halfAngle = angleInRadians * 0.5;
    const qx = q[0];
    const qy = q[1];
    const qz = q[2];
    const qw = q[3];
    const bx = Math.sin(halfAngle);
    const bw = Math.cos(halfAngle);
    newDst[0] = qx * bw + qw * bx;
    newDst[1] = qy * bw + qz * bx;
    newDst[2] = qz * bw - qy * bx;
    newDst[3] = qw * bw - qx * bx;
    return newDst;
  }
  function rotateY(q, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(4);
    const halfAngle = angleInRadians * 0.5;
    const qx = q[0];
    const qy = q[1];
    const qz = q[2];
    const qw = q[3];
    const by = Math.sin(halfAngle);
    const bw = Math.cos(halfAngle);
    newDst[0] = qx * bw - qz * by;
    newDst[1] = qy * bw + qw * by;
    newDst[2] = qz * bw + qx * by;
    newDst[3] = qw * bw - qy * by;
    return newDst;
  }
  function rotateZ(q, angleInRadians, dst) {
    const newDst = dst ?? new Ctor(4);
    const halfAngle = angleInRadians * 0.5;
    const qx = q[0];
    const qy = q[1];
    const qz = q[2];
    const qw = q[3];
    const bz = Math.sin(halfAngle);
    const bw = Math.cos(halfAngle);
    newDst[0] = qx * bw + qy * bz;
    newDst[1] = qy * bw - qx * bz;
    newDst[2] = qz * bw + qw * bz;
    newDst[3] = qw * bw - qz * bz;
    return newDst;
  }
  function slerp(a, b, t, dst) {
    const newDst = dst ?? new Ctor(4);
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const aw = a[3];
    let bx = b[0];
    let by = b[1];
    let bz = b[2];
    let bw = b[3];
    let cosOmega = ax * bx + ay * by + az * bz + aw * bw;
    if (cosOmega < 0) {
      cosOmega = -cosOmega;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    }
    let scale0;
    let scale1;
    if (1 - cosOmega > EPSILON) {
      const omega = Math.acos(cosOmega);
      const sinOmega = Math.sin(omega);
      scale0 = Math.sin((1 - t) * omega) / sinOmega;
      scale1 = Math.sin(t * omega) / sinOmega;
    } else {
      scale0 = 1 - t;
      scale1 = t;
    }
    newDst[0] = scale0 * ax + scale1 * bx;
    newDst[1] = scale0 * ay + scale1 * by;
    newDst[2] = scale0 * az + scale1 * bz;
    newDst[3] = scale0 * aw + scale1 * bw;
    return newDst;
  }
  function inverse(q, dst) {
    const newDst = dst ?? new Ctor(4);
    const a0 = q[0];
    const a1 = q[1];
    const a2 = q[2];
    const a3 = q[3];
    const dot2 = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
    const invDot = dot2 ? 1 / dot2 : 0;
    newDst[0] = -a0 * invDot;
    newDst[1] = -a1 * invDot;
    newDst[2] = -a2 * invDot;
    newDst[3] = a3 * invDot;
    return newDst;
  }
  function conjugate(q, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = -q[0];
    newDst[1] = -q[1];
    newDst[2] = -q[2];
    newDst[3] = q[3];
    return newDst;
  }
  function fromMat(m, dst) {
    const newDst = dst ?? new Ctor(4);
    const trace = m[0] + m[5] + m[10];
    if (trace > 0) {
      const root = Math.sqrt(trace + 1);
      newDst[3] = 0.5 * root;
      const invRoot = 0.5 / root;
      newDst[0] = (m[6] - m[9]) * invRoot;
      newDst[1] = (m[8] - m[2]) * invRoot;
      newDst[2] = (m[1] - m[4]) * invRoot;
    } else {
      let i = 0;
      if (m[5] > m[0]) {
        i = 1;
      }
      if (m[10] > m[i * 4 + i]) {
        i = 2;
      }
      const j = (i + 1) % 3;
      const k = (i + 2) % 3;
      const root = Math.sqrt(m[i * 4 + i] - m[j * 4 + j] - m[k * 4 + k] + 1);
      newDst[i] = 0.5 * root;
      const invRoot = 0.5 / root;
      newDst[3] = (m[j * 4 + k] - m[k * 4 + j]) * invRoot;
      newDst[j] = (m[j * 4 + i] + m[i * 4 + j]) * invRoot;
      newDst[k] = (m[k * 4 + i] + m[i * 4 + k]) * invRoot;
    }
    return newDst;
  }
  function fromEuler(xAngleInRadians, yAngleInRadians, zAngleInRadians, order, dst) {
    const newDst = dst ?? new Ctor(4);
    const xHalfAngle = xAngleInRadians * 0.5;
    const yHalfAngle = yAngleInRadians * 0.5;
    const zHalfAngle = zAngleInRadians * 0.5;
    const sx = Math.sin(xHalfAngle);
    const cx = Math.cos(xHalfAngle);
    const sy = Math.sin(yHalfAngle);
    const cy = Math.cos(yHalfAngle);
    const sz = Math.sin(zHalfAngle);
    const cz = Math.cos(zHalfAngle);
    switch (order) {
      case "xyz":
        newDst[0] = sx * cy * cz + cx * sy * sz;
        newDst[1] = cx * sy * cz - sx * cy * sz;
        newDst[2] = cx * cy * sz + sx * sy * cz;
        newDst[3] = cx * cy * cz - sx * sy * sz;
        break;
      case "xzy":
        newDst[0] = sx * cy * cz - cx * sy * sz;
        newDst[1] = cx * sy * cz - sx * cy * sz;
        newDst[2] = cx * cy * sz + sx * sy * cz;
        newDst[3] = cx * cy * cz + sx * sy * sz;
        break;
      case "yxz":
        newDst[0] = sx * cy * cz + cx * sy * sz;
        newDst[1] = cx * sy * cz - sx * cy * sz;
        newDst[2] = cx * cy * sz - sx * sy * cz;
        newDst[3] = cx * cy * cz + sx * sy * sz;
        break;
      case "yzx":
        newDst[0] = sx * cy * cz + cx * sy * sz;
        newDst[1] = cx * sy * cz + sx * cy * sz;
        newDst[2] = cx * cy * sz - sx * sy * cz;
        newDst[3] = cx * cy * cz - sx * sy * sz;
        break;
      case "zxy":
        newDst[0] = sx * cy * cz - cx * sy * sz;
        newDst[1] = cx * sy * cz + sx * cy * sz;
        newDst[2] = cx * cy * sz + sx * sy * cz;
        newDst[3] = cx * cy * cz - sx * sy * sz;
        break;
      case "zyx":
        newDst[0] = sx * cy * cz - cx * sy * sz;
        newDst[1] = cx * sy * cz + sx * cy * sz;
        newDst[2] = cx * cy * sz - sx * sy * cz;
        newDst[3] = cx * cy * cz + sx * sy * sz;
        break;
      default:
        throw new Error(`Unknown rotation order: ${order}`);
    }
    return newDst;
  }
  function copy(q, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = q[0];
    newDst[1] = q[1];
    newDst[2] = q[2];
    newDst[3] = q[3];
    return newDst;
  }
  const clone = copy;
  function add(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] + b[0];
    newDst[1] = a[1] + b[1];
    newDst[2] = a[2] + b[2];
    newDst[3] = a[3] + b[3];
    return newDst;
  }
  function subtract(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] - b[0];
    newDst[1] = a[1] - b[1];
    newDst[2] = a[2] - b[2];
    newDst[3] = a[3] - b[3];
    return newDst;
  }
  const sub = subtract;
  function mulScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = v[0] * k;
    newDst[1] = v[1] * k;
    newDst[2] = v[2] * k;
    newDst[3] = v[3] * k;
    return newDst;
  }
  const scale = mulScalar;
  function divScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = v[0] / k;
    newDst[1] = v[1] / k;
    newDst[2] = v[2] / k;
    newDst[3] = v[3] / k;
    return newDst;
  }
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }
  function lerp(a, b, t, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] + t * (b[0] - a[0]);
    newDst[1] = a[1] + t * (b[1] - a[1]);
    newDst[2] = a[2] + t * (b[2] - a[2]);
    newDst[3] = a[3] + t * (b[3] - a[3]);
    return newDst;
  }
  function length(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
  }
  const len = length;
  function lengthSq(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    return v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3;
  }
  const lenSq = lengthSq;
  function normalize(v, dst) {
    const newDst = dst ?? new Ctor(4);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    const len2 = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
    if (len2 > 1e-5) {
      newDst[0] = v0 / len2;
      newDst[1] = v1 / len2;
      newDst[2] = v2 / len2;
      newDst[3] = v3 / len2;
    } else {
      newDst[0] = 0;
      newDst[1] = 0;
      newDst[2] = 0;
      newDst[3] = 1;
    }
    return newDst;
  }
  function equalsApproximately(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[3] - b[3]) < EPSILON;
  }
  function equals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }
  function identity(dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = 0;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 1;
    return newDst;
  }
  const tempVec3 = vec32.create();
  const xUnitVec3 = vec32.create();
  const yUnitVec3 = vec32.create();
  function rotationTo(aUnit, bUnit, dst) {
    const newDst = dst ?? new Ctor(4);
    const dot2 = vec32.dot(aUnit, bUnit);
    if (dot2 < -0.999999) {
      vec32.cross(xUnitVec3, aUnit, tempVec3);
      if (vec32.len(tempVec3) < 1e-6) {
        vec32.cross(yUnitVec3, aUnit, tempVec3);
      }
      vec32.normalize(tempVec3, tempVec3);
      fromAxisAngle(tempVec3, Math.PI, newDst);
      return newDst;
    } else if (dot2 > 0.999999) {
      newDst[0] = 0;
      newDst[1] = 0;
      newDst[2] = 0;
      newDst[3] = 1;
      return newDst;
    } else {
      vec32.cross(aUnit, bUnit, tempVec3);
      newDst[0] = tempVec3[0];
      newDst[1] = tempVec3[1];
      newDst[2] = tempVec3[2];
      newDst[3] = 1 + dot2;
      return normalize(newDst, newDst);
    }
  }
  const tempQuat1 = new Ctor(4);
  const tempQuat2 = new Ctor(4);
  function sqlerp(a, b, c, d, t, dst) {
    const newDst = dst ?? new Ctor(4);
    slerp(a, d, t, tempQuat1);
    slerp(b, c, t, tempQuat2);
    slerp(tempQuat1, tempQuat2, 2 * t * (1 - t), newDst);
    return newDst;
  }
  return {
    create,
    fromValues,
    set,
    fromAxisAngle,
    toAxisAngle,
    angle,
    multiply,
    mul,
    rotateX,
    rotateY,
    rotateZ,
    slerp,
    inverse,
    conjugate,
    fromMat,
    fromEuler,
    copy,
    clone,
    add,
    subtract,
    sub,
    mulScalar,
    scale,
    divScalar,
    dot,
    lerp,
    length,
    len,
    lengthSq,
    lenSq,
    normalize,
    equalsApproximately,
    equals,
    identity,
    rotationTo,
    sqlerp
  };
}
var cache$1 = /* @__PURE__ */ new Map();
function getAPI$1(Ctor) {
  let api = cache$1.get(Ctor);
  if (!api) {
    api = getAPIImpl$1(Ctor);
    cache$1.set(Ctor, api);
  }
  return api;
}
function getAPIImpl(Ctor) {
  function create(x, y, z, w) {
    const newDst = new Ctor(4);
    if (x !== void 0) {
      newDst[0] = x;
      if (y !== void 0) {
        newDst[1] = y;
        if (z !== void 0) {
          newDst[2] = z;
          if (w !== void 0) {
            newDst[3] = w;
          }
        }
      }
    }
    return newDst;
  }
  const fromValues = create;
  function set(x, y, z, w, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = x;
    newDst[1] = y;
    newDst[2] = z;
    newDst[3] = w;
    return newDst;
  }
  function ceil(v, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = Math.ceil(v[0]);
    newDst[1] = Math.ceil(v[1]);
    newDst[2] = Math.ceil(v[2]);
    newDst[3] = Math.ceil(v[3]);
    return newDst;
  }
  function floor(v, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = Math.floor(v[0]);
    newDst[1] = Math.floor(v[1]);
    newDst[2] = Math.floor(v[2]);
    newDst[3] = Math.floor(v[3]);
    return newDst;
  }
  function round2(v, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = Math.round(v[0]);
    newDst[1] = Math.round(v[1]);
    newDst[2] = Math.round(v[2]);
    newDst[3] = Math.round(v[3]);
    return newDst;
  }
  function clamp(v, min2 = 0, max2 = 1, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = Math.min(max2, Math.max(min2, v[0]));
    newDst[1] = Math.min(max2, Math.max(min2, v[1]));
    newDst[2] = Math.min(max2, Math.max(min2, v[2]));
    newDst[3] = Math.min(max2, Math.max(min2, v[3]));
    return newDst;
  }
  function add(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] + b[0];
    newDst[1] = a[1] + b[1];
    newDst[2] = a[2] + b[2];
    newDst[3] = a[3] + b[3];
    return newDst;
  }
  function addScaled(a, b, scale2, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] + b[0] * scale2;
    newDst[1] = a[1] + b[1] * scale2;
    newDst[2] = a[2] + b[2] * scale2;
    newDst[3] = a[3] + b[3] * scale2;
    return newDst;
  }
  function subtract(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] - b[0];
    newDst[1] = a[1] - b[1];
    newDst[2] = a[2] - b[2];
    newDst[3] = a[3] - b[3];
    return newDst;
  }
  const sub = subtract;
  function equalsApproximately(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[3] - b[3]) < EPSILON;
  }
  function equals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }
  function lerp(a, b, t, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] + t * (b[0] - a[0]);
    newDst[1] = a[1] + t * (b[1] - a[1]);
    newDst[2] = a[2] + t * (b[2] - a[2]);
    newDst[3] = a[3] + t * (b[3] - a[3]);
    return newDst;
  }
  function lerpV(a, b, t, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] + t[0] * (b[0] - a[0]);
    newDst[1] = a[1] + t[1] * (b[1] - a[1]);
    newDst[2] = a[2] + t[2] * (b[2] - a[2]);
    newDst[3] = a[3] + t[3] * (b[3] - a[3]);
    return newDst;
  }
  function max(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = Math.max(a[0], b[0]);
    newDst[1] = Math.max(a[1], b[1]);
    newDst[2] = Math.max(a[2], b[2]);
    newDst[3] = Math.max(a[3], b[3]);
    return newDst;
  }
  function min(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = Math.min(a[0], b[0]);
    newDst[1] = Math.min(a[1], b[1]);
    newDst[2] = Math.min(a[2], b[2]);
    newDst[3] = Math.min(a[3], b[3]);
    return newDst;
  }
  function mulScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = v[0] * k;
    newDst[1] = v[1] * k;
    newDst[2] = v[2] * k;
    newDst[3] = v[3] * k;
    return newDst;
  }
  const scale = mulScalar;
  function divScalar(v, k, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = v[0] / k;
    newDst[1] = v[1] / k;
    newDst[2] = v[2] / k;
    newDst[3] = v[3] / k;
    return newDst;
  }
  function inverse(v, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = 1 / v[0];
    newDst[1] = 1 / v[1];
    newDst[2] = 1 / v[2];
    newDst[3] = 1 / v[3];
    return newDst;
  }
  const invert = inverse;
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }
  function length(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
  }
  const len = length;
  function lengthSq(v) {
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    return v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3;
  }
  const lenSq = lengthSq;
  function distance(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    const dw = a[3] - b[3];
    return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
  }
  const dist = distance;
  function distanceSq(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    const dw = a[3] - b[3];
    return dx * dx + dy * dy + dz * dz + dw * dw;
  }
  const distSq = distanceSq;
  function normalize(v, dst) {
    const newDst = dst ?? new Ctor(4);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const v3 = v[3];
    const len2 = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
    if (len2 > 1e-5) {
      newDst[0] = v0 / len2;
      newDst[1] = v1 / len2;
      newDst[2] = v2 / len2;
      newDst[3] = v3 / len2;
    } else {
      newDst[0] = 0;
      newDst[1] = 0;
      newDst[2] = 0;
      newDst[3] = 0;
    }
    return newDst;
  }
  function negate(v, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = -v[0];
    newDst[1] = -v[1];
    newDst[2] = -v[2];
    newDst[3] = -v[3];
    return newDst;
  }
  function copy(v, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = v[0];
    newDst[1] = v[1];
    newDst[2] = v[2];
    newDst[3] = v[3];
    return newDst;
  }
  const clone = copy;
  function multiply(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] * b[0];
    newDst[1] = a[1] * b[1];
    newDst[2] = a[2] * b[2];
    newDst[3] = a[3] * b[3];
    return newDst;
  }
  const mul = multiply;
  function divide(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = a[0] / b[0];
    newDst[1] = a[1] / b[1];
    newDst[2] = a[2] / b[2];
    newDst[3] = a[3] / b[3];
    return newDst;
  }
  const div = divide;
  function zero(dst) {
    const newDst = dst ?? new Ctor(4);
    newDst[0] = 0;
    newDst[1] = 0;
    newDst[2] = 0;
    newDst[3] = 0;
    return newDst;
  }
  function transformMat4(v, m, dst) {
    const newDst = dst ?? new Ctor(4);
    const x = v[0];
    const y = v[1];
    const z = v[2];
    const w = v[3];
    newDst[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    newDst[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    newDst[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    newDst[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return newDst;
  }
  function setLength(a, len2, dst) {
    const newDst = dst ?? new Ctor(4);
    normalize(a, newDst);
    return mulScalar(newDst, len2, newDst);
  }
  function truncate(a, maxLen, dst) {
    const newDst = dst ?? new Ctor(4);
    if (length(a) > maxLen) {
      return setLength(a, maxLen, newDst);
    }
    return copy(a, newDst);
  }
  function midpoint(a, b, dst) {
    const newDst = dst ?? new Ctor(4);
    return lerp(a, b, 0.5, newDst);
  }
  return {
    create,
    fromValues,
    set,
    ceil,
    floor,
    round: round2,
    clamp,
    add,
    addScaled,
    subtract,
    sub,
    equalsApproximately,
    equals,
    lerp,
    lerpV,
    max,
    min,
    mulScalar,
    scale,
    divScalar,
    inverse,
    invert,
    dot,
    length,
    len,
    lengthSq,
    lenSq,
    distance,
    dist,
    distanceSq,
    distSq,
    normalize,
    negate,
    copy,
    clone,
    multiply,
    mul,
    divide,
    div,
    zero,
    transformMat4,
    setLength,
    truncate,
    midpoint
  };
}
var cache = /* @__PURE__ */ new Map();
function getAPI(Ctor) {
  let api = cache.get(Ctor);
  if (!api) {
    api = getAPIImpl(Ctor);
    cache.set(Ctor, api);
  }
  return api;
}
function wgpuMatrixAPI(Mat3Ctor, Mat4Ctor, QuatCtor, Vec2Ctor, Vec3Ctor, Vec4Ctor) {
  return {
    /** @namespace mat3 */
    mat3: getAPI$3(Mat3Ctor),
    /** @namespace mat4 */
    mat4: getAPI$2(Mat4Ctor),
    /** @namespace quat */
    quat: getAPI$1(QuatCtor),
    /** @namespace vec2 */
    vec2: getAPI$5(Vec2Ctor),
    /** @namespace vec3 */
    vec3: getAPI$4(Vec3Ctor),
    /** @namespace vec4 */
    vec4: getAPI(Vec4Ctor)
  };
}
var {
  /**
   * 3x3 Matrix functions that default to returning `Float32Array`
   * @namespace
   */
  mat3,
  /**
   * 4x4 Matrix functions that default to returning `Float32Array`
   * @namespace
   */
  mat4,
  /**
   * Quaternion functions that default to returning `Float32Array`
   * @namespace
   */
  quat,
  /**
   * Vec2 functions that default to returning `Float32Array`
   * @namespace
   */
  vec2: vec22,
  /**
   * Vec3 functions that default to returning `Float32Array`
   * @namespace
   */
  vec3,
  /**
   * Vec3 functions that default to returning `Float32Array`
   * @namespace
   */
  vec4
} = wgpuMatrixAPI(Float32Array, Float32Array, Float32Array, Float32Array, Float32Array, Float32Array);
var {
  /**
   * 3x3 Matrix functions that default to returning `Float64Array`
   * @namespace
   */
  mat3: mat3d,
  /**
   * 4x4 Matrix functions that default to returning `Float64Array`
   * @namespace
   */
  mat4: mat4d,
  /**
   * Quaternion functions that default to returning `Float64Array`
   * @namespace
   */
  quat: quatd,
  /**
   * Vec2 functions that default to returning `Float64Array`
   * @namespace
   */
  vec2: vec2d,
  /**
   * Vec3 functions that default to returning `Float64Array`
   * @namespace
   */
  vec3: vec3d,
  /**
   * Vec3 functions that default to returning `Float64Array`
   * @namespace
   */
  vec4: vec4d
} = wgpuMatrixAPI(Float64Array, Float64Array, Float64Array, Float64Array, Float64Array, Float64Array);
var {
  /**
   * 3x3 Matrix functions that default to returning `number[]`
   * @namespace
   */
  mat3: mat3n,
  /**
   * 4x4 Matrix functions that default to returning `number[]`
   * @namespace
   */
  mat4: mat4n,
  /**
   * Quaternion functions that default to returning `number[]`
   * @namespace
   */
  quat: quatn,
  /**
   * Vec2 functions that default to returning `number[]`
   * @namespace
   */
  vec2: vec2n,
  /**
   * Vec3 functions that default to returning `number[]`
   * @namespace
   */
  vec3: vec3n,
  /**
   * Vec3 functions that default to returning `number[]`
   * @namespace
   */
  vec4: vec4n
} = wgpuMatrixAPI(ZeroArray, Array, Array, Array, Array, Array);

// src/displacement/displacement-texture.ts
var DisplacementTexture = class {
  device;
  format = "r8unorm";
  downsizeFactor;
  multisample;
  textureSimple;
  textureMultisampled = null;
  renderPipeline;
  bindgroup;
  uniformsBuffer;
  trianglesBuffer;
  constructor(params) {
    this.device = params.device;
    this.downsizeFactor = params.blurFactor;
    this.multisample = this.downsizeFactor > 1 ? 4 : 1;
    [this.textureSimple, this.textureMultisampled] = this.createTextures(params.width, params.height);
    this.trianglesBuffer = params.trianglesBuffer;
    const shaderModule = this.device.createShaderModule({
      label: "DisplacementTexture shader module",
      code: displacement_default
    });
    this.renderPipeline = this.device.createRenderPipeline({
      label: "DisplacementTexture renderpipeline",
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "main_vertex",
        buffers: [
          {
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: "float32x2"
              }
            ],
            arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
            stepMode: "vertex"
          }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "main_fragment",
        targets: [{
          format: this.format
        }]
      },
      primitive: {
        cullMode: "none",
        topology: "triangle-list"
      },
      multisample: {
        count: this.multisample
      }
    });
    this.uniformsBuffer = this.device.createBuffer({
      label: "DisplacementTexture uniforms buffer",
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.bindgroup = this.device.createBindGroup({
      label: "DisplacementTexture bindgroup",
      layout: this.renderPipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.uniformsBuffer }
        }
      ]
    });
  }
  update(commandEncoder) {
    const targetTexture = this.textureMultisampled ?? this.textureSimple;
    const textureRenderpassColorAttachment = {
      view: targetTexture.view,
      clearValue: [0, 0, 0, 1],
      loadOp: "clear",
      storeOp: "store"
    };
    if (this.textureMultisampled) {
      textureRenderpassColorAttachment.resolveTarget = this.textureSimple.view;
    }
    const renderpassEncoder = commandEncoder.beginRenderPass({
      label: "DisplacementTexture render to texture renderpass",
      colorAttachments: [textureRenderpassColorAttachment]
    });
    const [textureWidth, textureHeight] = [targetTexture.texture.width, targetTexture.texture.height];
    renderpassEncoder.setViewport(0, 0, textureWidth, textureHeight, 0, 1);
    renderpassEncoder.setScissorRect(0, 0, textureWidth, textureHeight);
    renderpassEncoder.setPipeline(this.renderPipeline);
    renderpassEncoder.setBindGroup(0, this.bindgroup);
    renderpassEncoder.setVertexBuffer(0, this.trianglesBuffer.bufferGpu);
    renderpassEncoder.draw(3 * this.trianglesBuffer.spriteCount);
    renderpassEncoder.end();
  }
  resize(width, height) {
    this.textureSimple.texture.destroy();
    this.textureMultisampled?.texture.destroy();
    [this.textureSimple, this.textureMultisampled] = this.createTextures(width, height);
  }
  setViewport(viewport) {
    const scaling = [1, 1, 1];
    const rotation = 0;
    const translation = [1, 1, 0];
    const modelMatrix = mat4.identity();
    mat4.multiply(mat4.scaling(scaling), modelMatrix, modelMatrix);
    mat4.multiply(mat4.rotationZ(rotation), modelMatrix, modelMatrix);
    mat4.multiply(mat4.translation(translation), modelMatrix, modelMatrix);
    const viewMatrix = mat4.translation([-viewport.position[0], -viewport.position[1], 0]);
    const gameWidth = viewport.width / viewport.zoom;
    const gameHeight = viewport.height / viewport.zoom;
    const projectionMatrix = mat4.ortho(0, gameWidth, gameHeight, 0, -10, 10);
    const mvpMatrix = mat4.identity();
    mat4.multiply(viewMatrix, modelMatrix, mvpMatrix);
    mat4.multiply(projectionMatrix, mvpMatrix, mvpMatrix);
    this.device.queue.writeBuffer(this.uniformsBuffer, 0, mvpMatrix);
  }
  getView() {
    return this.textureSimple.view;
  }
  destroy() {
    this.textureSimple.texture.destroy();
    this.textureMultisampled?.texture.destroy();
    this.uniformsBuffer.destroy();
  }
  createTextures(width, height) {
    const texture = this.device.createTexture({
      label: "DisplacementTexture texture",
      size: [
        Math.ceil(width / this.downsizeFactor),
        Math.ceil(height / this.downsizeFactor)
      ],
      format: this.format,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT
    });
    const textureSimple = {
      texture,
      view: texture.createView({ label: "DisplacementTexture texture view" })
    };
    let textureMultisampled = null;
    if (this.multisample > 1) {
      const textureMulti = this.device.createTexture({
        label: "DisplacementTexture texture multisampled",
        size: [texture.width, texture.height],
        format: texture.format,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
        sampleCount: this.multisample
      });
      textureMultisampled = {
        texture: textureMulti,
        view: textureMulti.createView({ label: "DisplacementTexture texture multisampled view" })
      };
    }
    return [textureSimple, textureMultisampled];
  }
};

// src/displacement/displacement.js
var displacement_default2 = {
  type: "cobalt:displacement",
  refs: [
    // input framebuffer texture with the scene drawn
    { name: "color", type: "textureView", format: "bgra8unorm", access: "read" },
    // displacement map (perlin noise texture works well here)
    { name: "map", type: "cobaltTexture", format: "bgra8unorm", access: "read" },
    // result we're writing to
    { name: "out", type: "textureView", format: "bgra8unorm", access: "write" }
  ],
  // cobalt event handling functions
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init5(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
    draw5(cobalt, node, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, node) {
    destroy4(node);
  },
  onResize: function(cobalt, node) {
    node.data.displacementTexture.resize(cobalt.viewport.width, cobalt.viewport.height);
    node.data.displacementComposition.setColorTextureView(node.refs.color.data.view);
    node.data.displacementComposition.setNoiseMapTextureView(node.refs.map.view);
    node.data.displacementComposition.setDisplacementTextureView(node.data.displacementTexture.getView());
  },
  onViewportPosition: function(cobalt, node) {
    node.data.displacementTexture.setViewport(cobalt.viewport);
  },
  // optional
  customFunctions: {
    addTriangle: function(cobalt, node, triangleVertices) {
      return node.data.trianglesBuffer.addTriangle(triangleVertices);
    },
    removeTriangle: function(cobalt, node, triangleId) {
      node.data.trianglesBuffer.removeTriangle(triangleId);
    },
    setPosition: function(cobalt, node, triangleId, triangleVertices) {
      node.data.trianglesBuffer.setTriangle(triangleId, triangleVertices);
    }
  }
};
async function init5(cobalt, node) {
  const { device } = cobalt;
  const displacementParameters = new DisplacementParametersBuffer({
    device,
    initialParameters: {
      offsetX: node.options.offseyX ?? 0,
      offsetY: node.options.offseyY ?? 0,
      scale: node.options.scale ?? 20
    }
  });
  const MAX_SPRITE_COUNT = 256;
  const trianglesBuffer = new TrianglesBuffer({
    device,
    maxSpriteCount: MAX_SPRITE_COUNT
  });
  const displacementTexture = new DisplacementTexture({
    device,
    width: cobalt.viewport.width,
    height: cobalt.viewport.height,
    blurFactor: 8,
    trianglesBuffer
  });
  const displacementComposition = new DisplacementComposition({
    device,
    targetFormat: getPreferredFormat(cobalt),
    colorTextureView: node.refs.color.data.view,
    noiseMapTextureView: node.refs.map.view,
    displacementTextureView: displacementTexture.getView(),
    displacementParametersBuffer: displacementParameters
  });
  return {
    displacementParameters,
    displacementTexture,
    displacementComposition,
    trianglesBuffer
  };
}
function draw5(cobalt, node, commandEncoder) {
  const spriteCount = node.data.trianglesBuffer.spriteCount;
  if (spriteCount === 0)
    return;
  node.data.trianglesBuffer.update();
  node.data.displacementTexture.update(commandEncoder);
  const renderpass = commandEncoder.beginRenderPass({
    label: "displacement",
    colorAttachments: [
      {
        view: node.refs.out,
        clearValue: cobalt.clearValue,
        loadOp: "load",
        storeOp: "store"
      }
    ]
  });
  renderpass.executeBundles([node.data.displacementComposition.getRenderBundle()]);
  renderpass.end();
}
function destroy4(node) {
  node.data.trianglesBuffer.destroy();
  node.data.trianglesBuffer = null;
  node.data.displacementParameters.destroy();
  node.data.displacementParameters = null;
  node.data.displacementTexture.destroy();
  node.data.displacementTexture = null;
  node.data.displacementComposition.destroy();
  node.data.displacementComposition = null;
}

// src/sprite/create-sprite-quads.js
function createSpriteQuads(device, spritesheet) {
  const vertices = spritesheet.vertices;
  const usage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
  const descriptor = {
    size: vertices.byteLength,
    usage,
    // make this memory space accessible from the CPU (host visible)
    mappedAtCreation: true
  };
  const buffer = device.createBuffer(descriptor);
  new Float32Array(buffer.getMappedRange()).set(vertices);
  buffer.unmap();
  const bufferLayout = {
    arrayStride: 16,
    stepMode: "vertex",
    attributes: [
      // position
      {
        shaderLocation: 0,
        format: "float32x2",
        offset: 0
      },
      // uv
      {
        shaderLocation: 1,
        format: "float32x2",
        offset: 8
      }
    ]
  };
  return {
    buffer,
    bufferLayout
  };
}

// src/overlay/overlay.wgsl
var overlay_default = `struct TransformData{view:mat4x4<f32>,projection:mat4x4<f32>};struct Sprite{translate:vec2<f32>,scale:vec2<f32>,tint:vec4<f32>,opacity:f32,rotation:f32,};struct SpritesBuffer{models:array<Sprite>,};@binding(0)@group(0)var<uniform> transformUBO:TransformData;@binding(1)@group(0)var myTexture:texture_2d<f32>;@binding(2)@group(0)var mySampler:sampler;@binding(3)@group(0)var<storage,read>sprites:SpritesBuffer;struct Fragment{@builtin(position)Position:vec4<f32>,@location(0)TexCoord:vec2<f32>,@location(1)Tint:vec4<f32>,@location(2)Opacity:f32,};@vertex fn vs_main(@builtin(instance_index)i_id:u32,@location(0)vertexPosition:vec2<f32>,@location(1)vertexTexCoord:vec2<f32>)->Fragment{var output:Fragment;var sx:f32=sprites.models[i_id].scale.x;var sy:f32=sprites.models[i_id].scale.y;var sz:f32=1.0;var rot:f32=sprites.models[i_id].rotation;var tx:f32=sprites.models[i_id].translate.x;var ty:f32=sprites.models[i_id].translate.y;var tz:f32=0;var s=sin(rot);var c=cos(rot);var scaleM:mat4x4<f32>=mat4x4<f32>(sx,0.0,0.0,0.0,0.0,sy,0.0,0.0,0.0,0.0,sz,0.0,0,0,0,1.0);var modelM:mat4x4<f32>=mat4x4<f32>(c,s,0.0,0.0,-s,c,0.0,0.0,0.0,0.0,1.0,0.0,tx,ty,tz,1.0)*scaleM;output.Position=transformUBO.projection*transformUBO.view*modelM*vec4<f32>(vertexPosition,0.0,1.0);output.TexCoord=vertexTexCoord;output.Tint=sprites.models[i_id].tint;output.Opacity=sprites.models[i_id].opacity;return output;}@fragment fn fs_main(@location(0)TexCoord:vec2<f32>,@location(1)Tint:vec4<f32>,@location(2)Opacity:f32)->@location(0)vec4<f32>{var outColor:vec4<f32>=textureSample(myTexture,mySampler,TexCoord);var output=vec4<f32>(outColor.rgb*(1.0-Tint.a)+(Tint.rgb*Tint.a),outColor.a*Opacity);return output;}`;

// src/overlay/constants.js
var FLOAT32S_PER_SPRITE2 = 12;

// src/overlay/overlay.js
var _tmpVec4 = vec4.create();
var _tmpVec3 = vec3.create();
var overlay_default2 = {
  type: "cobalt:overlay",
  refs: [
    { name: "spritesheet", type: "customResource", access: "read" },
    { name: "color", type: "textView", format: "rgba8unorm", access: "write" }
  ],
  // cobalt event handling functions
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init6(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
    draw6(cobalt, node, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, node) {
    destroy5(node);
  },
  onResize: function(cobalt, node) {
    _writeOverlayBuffer(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
    _writeOverlayBuffer(cobalt, node);
  },
  // optional
  customFunctions: { ...public_api_exports }
};
async function init6(cobalt, nodeData) {
  const { device } = cobalt;
  const MAX_SPRITE_COUNT = 16192;
  const numInstances = MAX_SPRITE_COUNT;
  const translateFloatCount = 2;
  const translateSize = Float32Array.BYTES_PER_ELEMENT * translateFloatCount;
  const scaleFloatCount = 2;
  const scaleSize = Float32Array.BYTES_PER_ELEMENT * scaleFloatCount;
  const tintFloatCount = 4;
  const tintSize = Float32Array.BYTES_PER_ELEMENT * tintFloatCount;
  const opacityFloatCount = 4;
  const opacitySize = Float32Array.BYTES_PER_ELEMENT * opacityFloatCount;
  const spriteBuffer = device.createBuffer({
    size: (translateSize + scaleSize + tintSize + opacitySize) * numInstances,
    // 4x4 matrix with 4 bytes per float32, per instance
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });
  const uniformBuffer = device.createBuffer({
    size: 64 * 2,
    // 4x4 matrix with 4 bytes per float32, times 2 matrices (view, projection)
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: {}
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {}
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {}
      },
      {
        binding: 3,
        visibility: GPUShaderStage.VERTEX,
        buffer: {
          type: "read-only-storage"
        }
      }
    ]
  });
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer
        }
      },
      {
        binding: 1,
        resource: nodeData.refs.spritesheet.data.colorTexture.view
      },
      {
        binding: 2,
        resource: nodeData.refs.spritesheet.data.colorTexture.sampler
      },
      {
        binding: 3,
        resource: {
          buffer: spriteBuffer
        }
      }
    ]
  });
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
  });
  const pipeline = device.createRenderPipeline({
    label: "overlaysprite",
    vertex: {
      module: device.createShaderModule({
        code: overlay_default
      }),
      entryPoint: "vs_main",
      buffers: [nodeData.refs.spritesheet.data.quads.bufferLayout]
    },
    fragment: {
      module: device.createShaderModule({
        code: overlay_default
      }),
      entryPoint: "fs_main",
      targets: [
        // color
        {
          format: getPreferredFormat(cobalt),
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha"
            },
            alpha: {
              srcFactor: "zero",
              dstFactor: "one"
            }
          }
        }
      ]
    },
    primitive: {
      topology: "triangle-list"
    },
    layout: pipelineLayout
  });
  return {
    // instancedDrawCalls is used to actually perform draw calls within the render pass
    // layout is interleaved with baseVtxIdx (the sprite type), and instanceCount (how many sprites)
    // [
    //    baseVtxIdx0, instanceCount0,
    //    baseVtxIdx1, instanceCount1,
    //    ...
    // ]
    instancedDrawCalls: new Uint32Array(MAX_SPRITE_COUNT * 2),
    instancedDrawCallCount: 0,
    spriteBuffer,
    uniformBuffer,
    pipeline,
    bindGroupLayout,
    bindGroup,
    // actual sprite instance data. ordered by layer, then sprite type
    // this is used to update the spriteBuffer.
    spriteData: new Float32Array(MAX_SPRITE_COUNT * FLOAT32S_PER_SPRITE2),
    spriteCount: 0,
    spriteIndices: /* @__PURE__ */ new Map(),
    // key is spriteId, value is insert index of the sprite. e.g., 0 means 1st sprite , 1 means 2nd sprite, etc.
    // when a sprite is changed the renderpass is dirty, and should have it's instance data copied to the gpu
    dirty: false
  };
}
function draw6(cobalt, node, commandEncoder) {
  const { device } = cobalt;
  const loadOp = node.options.loadOp || "load";
  if (node.data.dirty) {
    _rebuildSpriteDrawCalls2(node.data);
    node.data.dirty = false;
  }
  if (node.data.spriteCount > 0) {
    const writeLength = node.data.spriteCount * FLOAT32S_PER_SPRITE2 * Float32Array.BYTES_PER_ELEMENT;
    device.queue.writeBuffer(node.data.spriteBuffer, 0, node.data.spriteData.buffer, 0, writeLength);
  }
  const renderpass = commandEncoder.beginRenderPass({
    label: "overlay",
    colorAttachments: [
      // color
      {
        view: node.refs.color,
        clearValue: cobalt.clearValue,
        loadOp,
        storeOp: "store"
      }
    ]
  });
  renderpass.setPipeline(node.data.pipeline);
  renderpass.setBindGroup(0, node.data.bindGroup);
  renderpass.setVertexBuffer(0, node.refs.spritesheet.data.quads.buffer);
  const vertexCount = 6;
  let baseInstanceIdx = 0;
  for (let i = 0; i < node.data.instancedDrawCallCount; i++) {
    const baseVertexIdx = node.data.instancedDrawCalls[i * 2] * vertexCount;
    const instanceCount = node.data.instancedDrawCalls[i * 2 + 1];
    renderpass.draw(vertexCount, instanceCount, baseVertexIdx, baseInstanceIdx);
    baseInstanceIdx += instanceCount;
  }
  renderpass.end();
}
function _rebuildSpriteDrawCalls2(renderPass) {
  let currentSpriteType = -1;
  let instanceCount = 0;
  renderPass.instancedDrawCallCount = 0;
  for (let i = 0; i < renderPass.spriteCount; i++) {
    const spriteType = renderPass.spriteData[i * FLOAT32S_PER_SPRITE2 + 11] & 65535;
    if (spriteType !== currentSpriteType) {
      if (instanceCount > 0) {
        renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2] = currentSpriteType;
        renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2 + 1] = instanceCount;
        renderPass.instancedDrawCallCount++;
      }
      currentSpriteType = spriteType;
      instanceCount = 0;
    }
    instanceCount++;
  }
  if (instanceCount > 0) {
    renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2] = currentSpriteType;
    renderPass.instancedDrawCalls[renderPass.instancedDrawCallCount * 2 + 1] = instanceCount;
    renderPass.instancedDrawCallCount++;
  }
}
function _writeOverlayBuffer(cobalt, nodeData) {
  const zoom = 1;
  const GAME_WIDTH = Math.round(cobalt.viewport.width / zoom);
  const GAME_HEIGHT = Math.round(cobalt.viewport.height / zoom);
  const projection = mat4.ortho(0, GAME_WIDTH, GAME_HEIGHT, 0, -10, 10);
  vec3.set(0, 0, 0, _tmpVec3);
  const view = mat4.translation(_tmpVec3);
  cobalt.device.queue.writeBuffer(nodeData.data.uniformBuffer, 0, view.buffer);
  cobalt.device.queue.writeBuffer(nodeData.data.uniformBuffer, 64, projection.buffer);
}
function destroy5(nodeData) {
  nodeData.data.instancedDrawCalls = null;
  nodeData.data.bindGroup = null;
  nodeData.data.spriteBuffer.destroy();
  nodeData.data.spriteBuffer = null;
  nodeData.data.uniformBuffer.destroy();
  nodeData.data.uniformBuffer = null;
  nodeData.data.spriteData = null;
  nodeData.data.spriteIndices.clear();
  nodeData.data.spriteIndices = null;
}

// src/fb-blit/fb-blit.wgsl
var fb_blit_default = `@binding(0)@group(0)var tileTexture:texture_2d<f32>;@binding(1)@group(0)var tileSampler:sampler;struct Fragment{@builtin(position)Position:vec4<f32>,@location(0)TexCoord:vec2<f32>};const positions=array<vec2<f32>,3>(vec2<f32>(-1.0,-3.0),vec2<f32>(3.0,1.0),vec2<f32>(-1.0,1.0));const uvs=array<vec2<f32>,3>(vec2<f32>(0.0,2.0),vec2<f32>(2.0,0.0),vec2<f32>(0.0,0.0));@vertex fn vs_main(@builtin(vertex_index)VertexIndex:u32)->Fragment{var output:Fragment;output.Position=vec4<f32>(positions[VertexIndex],0.0,1.0);output.TexCoord=vec2<f32>(uvs[VertexIndex]);return output;}@fragment fn fs_main(@location(0)TexCoord:vec2<f32>)->@location(0)vec4<f32>{var col=textureSample(tileTexture,tileSampler,TexCoord);return vec4<f32>(col.rgb,1.0);}`;

// src/fb-blit/fb-blit.js
var fb_blit_default2 = {
  type: "cobalt:fbBlit",
  refs: [
    { name: "in", type: "cobaltTexture", format: "PREFERRED_TEXTURE_FORMAT", access: "read" },
    { name: "out", type: "cobaltTexture", format: "PREFERRED_TEXTURE_FORMAT", access: "write" }
  ],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init7(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
    draw7(cobalt, node, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, node) {
  },
  onResize: function(cobalt, node) {
    resize3(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
  }
};
async function init7(cobalt, node) {
  const { device } = cobalt;
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {}
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {}
      }
    ]
  });
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: node.refs.in.data.view
      },
      {
        binding: 1,
        resource: node.refs.in.data.sampler
      }
    ]
  });
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
  });
  const pipeline = device.createRenderPipeline({
    label: "fb-blit",
    vertex: {
      module: device.createShaderModule({
        code: fb_blit_default
      }),
      entryPoint: "vs_main",
      buffers: [
        /*quad.bufferLayout*/
      ]
    },
    fragment: {
      module: device.createShaderModule({
        code: fb_blit_default
      }),
      entryPoint: "fs_main",
      targets: [
        {
          format: getPreferredFormat(cobalt),
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha"
            },
            alpha: {
              srcFactor: "zero",
              dstFactor: "one"
            }
          }
        }
      ]
    },
    primitive: {
      topology: "triangle-list"
    },
    layout: pipelineLayout
  });
  return {
    bindGroupLayout,
    bindGroup,
    pipeline
  };
}
function draw7(cobalt, node, commandEncoder) {
  const { device } = cobalt;
  const renderpass = commandEncoder.beginRenderPass({
    label: "fb-blit",
    colorAttachments: [
      {
        view: node.refs.out,
        clearValue: cobalt.clearValue,
        loadOp: "load",
        storeOp: "store"
      }
    ]
  });
  renderpass.setPipeline(node.data.pipeline);
  renderpass.setBindGroup(0, node.data.bindGroup);
  renderpass.draw(3);
  renderpass.end();
}
function resize3(cobalt, node) {
  const { device } = cobalt;
  node.data.bindGroup = device.createBindGroup({
    layout: node.data.bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: node.refs.in.data.view
      },
      {
        binding: 1,
        resource: node.refs.in.data.sampler
      }
    ]
  });
}

// src/primitives/primitives.wgsl
var primitives_default = `struct TransformData{view:mat4x4<f32>,projection:mat4x4<f32>};@binding(0)@group(0)var<uniform> transformUBO:TransformData;struct Fragment{@builtin(position)Position:vec4<f32>,@location(0)Color:vec4<f32>,};@vertex fn vs_main(@location(0)vertexPosition:vec2<f32>,@location(1)vertexColor:vec4<f32>)->Fragment{var sx:f32=1.0;var sy:f32=1.0;var sz:f32=1.0;var rot:f32=0.0;var tx:f32=1.0;var ty:f32=1.0;var tz:f32=0;var s=sin(rot);var c=cos(rot);var scaleM:mat4x4<f32>=mat4x4<f32>(sx,0.0,0.0,0.0,0.0,sy,0.0,0.0,0.0,0.0,sz,0.0,0,0,0,1.0);var modelM:mat4x4<f32>=mat4x4<f32>(c,s,0.0,0.0,-s,c,0.0,0.0,0.0,0.0,1.0,0.0,tx,ty,tz,1.0)*scaleM;var output:Fragment;output.Position=transformUBO.projection*transformUBO.view*modelM*vec4<f32>(vertexPosition,0.0,1.0);output.Color=vertexColor;return output;}@fragment fn fs_main(@location(0)Color:vec4<f32>)->@location(0)vec4<f32>{return Color;}`;

// src/primitives/public-api.js
var import_cdt2d = __toESM(require_cdt2d(), 1);

// packages/poly-to-pslg/poly-to-pslg.js
var import_clean_pslg = __toESM(require_clean_pslg(), 1);
function polygonToPSLG(loops, options) {
  if (!Array.isArray(loops)) {
    throw new Error("poly-to-pslg: Error, invalid polygon");
  }
  if (loops.length === 0) {
    return {
      points: [],
      edges: []
    };
  }
  options = options || {};
  var nested = true;
  if ("nested" in options) {
    nested = !!options.nested;
  } else if (loops[0].length === 2 && typeof loops[0][0] === "number") {
    nested = false;
  }
  if (!nested) {
    loops = [loops];
  }
  var points = [];
  var edges = [];
  for (var i = 0; i < loops.length; ++i) {
    var loop = loops[i];
    var offset = points.length;
    for (var j = 0; j < loop.length; ++j) {
      points.push(loop[j]);
      edges.push([offset + j, offset + (j + 1) % loop.length]);
    }
  }
  var clean = "clean" in options ? true : !!options.clean;
  if (clean) {
    (0, import_clean_pslg.default)(points, edges);
  }
  return {
    points,
    edges
  };
}

// src/primitives/public-api.js
var public_api_default = {
  line,
  save: function(cobalt, node) {
    node.data.transforms.push(mat3.clone(node.data.transforms.at(-1)));
  },
  restore: function(cobalt, node) {
    if (node.data.transforms.length > 1)
      node.data.transforms.pop();
  },
  translate: function(cobalt, node, translation) {
    const m = node.data.transforms.at(-1);
    mat3.translate(m, translation, m);
  },
  rotate: function(cobalt, node, radians) {
    const m = node.data.transforms.at(-1);
    mat3.rotate(m, radians, m);
  },
  scale: function(cobalt, node, scale) {
    const m = node.data.transforms.at(-1);
    mat3.scale(m, scale, m);
  },
  strokePath: function(cobalt, node, segments, color, lineWidth = 1) {
    for (const s of segments)
      line(cobalt, node, s[0], s[1], color, lineWidth);
  },
  filledPath: function(cobalt, node, points, color) {
    const pslg = polygonToPSLG(points);
    const triangles = (0, import_cdt2d.default)(pslg.points, pslg.edges, { exterior: false });
    const m = node.data.transforms.at(-1);
    let i = node.data.vertexCount * 6;
    const currentElementCount = node.data.vertexCount * 6;
    const floatsToAdd = triangles.length * 3 * 6;
    node.data.vertices = handleArrayResize(Float32Array, node.data.vertices, currentElementCount, floatsToAdd);
    const pos = vec22.create();
    for (const tri of triangles) {
      vec22.transformMat3(points[tri[0]], m, pos);
      node.data.vertices[i + 0] = pos[0];
      node.data.vertices[i + 1] = pos[1];
      node.data.vertices[i + 2] = color[0];
      node.data.vertices[i + 3] = color[1];
      node.data.vertices[i + 4] = color[2];
      node.data.vertices[i + 5] = color[3];
      vec22.transformMat3(points[tri[1]], m, pos);
      node.data.vertices[i + 6] = pos[0];
      node.data.vertices[i + 7] = pos[1];
      node.data.vertices[i + 8] = color[0];
      node.data.vertices[i + 9] = color[1];
      node.data.vertices[i + 10] = color[2];
      node.data.vertices[i + 11] = color[3];
      vec22.transformMat3(points[tri[2]], m, pos);
      node.data.vertices[i + 12] = pos[0];
      node.data.vertices[i + 13] = pos[1];
      node.data.vertices[i + 14] = color[0];
      node.data.vertices[i + 15] = color[1];
      node.data.vertices[i + 16] = color[2];
      node.data.vertices[i + 17] = color[3];
      i += 18;
    }
    node.data.vertexCount += 3 * triangles.length;
    node.data.dirty = true;
  },
  ellipse: function(cobalt, node, center, halfWidth, halfHeight, numSegments, color, lineWidth = 1) {
    const [x, y] = center;
    const deltaAngle = 2 * Math.PI / numSegments;
    for (let i = 0; i < numSegments; i++) {
      const angle = i * deltaAngle;
      const nextAngle = (i + 1) * deltaAngle;
      const currX = x + halfWidth * Math.cos(angle);
      const currY = y + halfHeight * Math.sin(angle);
      const nextX = x + halfWidth * Math.cos(nextAngle);
      const nextY = y + halfHeight * Math.sin(nextAngle);
      line(cobalt, node, [currX, currY], [nextX, nextY], color, lineWidth);
    }
  },
  filledEllipse: function(cobalt, node, center, halfWidth, halfHeight, numSegments, color) {
    const [x, y] = center;
    const deltaAngle = 2 * Math.PI / numSegments;
    const currentElementCount = node.data.vertexCount * 6;
    const floatsToAdd = numSegments * 3 * 6;
    node.data.vertices = handleArrayResize(Float32Array, node.data.vertices, currentElementCount, floatsToAdd);
    const m = node.data.transforms.at(-1);
    for (let i = 0; i < numSegments; i++) {
      const angle = i * deltaAngle;
      const nextAngle = (i + 1) * deltaAngle;
      const currX = x + halfWidth * Math.cos(angle);
      const currY = y + halfHeight * Math.sin(angle);
      const nextX = x + halfWidth * Math.cos(nextAngle);
      const nextY = y + halfHeight * Math.sin(nextAngle);
      const stride = 18;
      const vi = node.data.vertexCount * 6 + i * stride;
      const pos = vec22.transformMat3([x, y], m);
      node.data.vertices[vi + 0] = pos[0];
      node.data.vertices[vi + 1] = pos[1];
      node.data.vertices[vi + 2] = color[0];
      node.data.vertices[vi + 3] = color[1];
      node.data.vertices[vi + 4] = color[2];
      node.data.vertices[vi + 5] = color[3];
      vec22.transformMat3([currX, currY], m, pos);
      node.data.vertices[vi + 6] = pos[0];
      node.data.vertices[vi + 7] = pos[1];
      node.data.vertices[vi + 8] = color[0];
      node.data.vertices[vi + 9] = color[1];
      node.data.vertices[vi + 10] = color[2];
      node.data.vertices[vi + 11] = color[3];
      vec22.transformMat3([nextX, nextY], m, pos);
      node.data.vertices[vi + 12] = pos[0];
      node.data.vertices[vi + 13] = pos[1];
      node.data.vertices[vi + 14] = color[0];
      node.data.vertices[vi + 15] = color[1];
      node.data.vertices[vi + 16] = color[2];
      node.data.vertices[vi + 17] = color[3];
    }
    node.data.vertexCount += 3 * numSegments;
    node.data.dirty = true;
  },
  box: function(cobalt, node, center, width, height, color, lineWidth = 1) {
    const [x, y] = center;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const topLeft = [x - halfWidth, y - halfHeight];
    const topRight = [x + halfWidth, y - halfHeight];
    const bottomLeft = [x - halfWidth, y + halfHeight];
    const bottomRight = [x + halfWidth, y + halfHeight];
    line(cobalt, node, topLeft, topRight, color, lineWidth);
    line(cobalt, node, bottomLeft, bottomRight, color, lineWidth);
    line(cobalt, node, topLeft, bottomLeft, color, lineWidth);
    line(cobalt, node, topRight, bottomRight, color, lineWidth);
  },
  filledBox: function(cobalt, node, center, width, height, color) {
    const [x, y] = center;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const m = node.data.transforms.at(-1);
    const topLeft = vec22.transformMat3([x - halfWidth, y - halfHeight], m);
    const topRight = vec22.transformMat3([x + halfWidth, y - halfHeight], m);
    const bottomLeft = vec22.transformMat3([x - halfWidth, y + halfHeight], m);
    const bottomRight = vec22.transformMat3([x + halfWidth, y + halfHeight], m);
    const currentElementCount = node.data.vertexCount * 6;
    const floatsToAdd = 6 * 6;
    node.data.vertices = handleArrayResize(Float32Array, node.data.vertices, currentElementCount, floatsToAdd);
    let i = node.data.vertexCount * 6;
    node.data.vertices[i + 0] = topLeft[0];
    node.data.vertices[i + 1] = topLeft[1];
    node.data.vertices[i + 2] = color[0];
    node.data.vertices[i + 3] = color[1];
    node.data.vertices[i + 4] = color[2];
    node.data.vertices[i + 5] = color[3];
    node.data.vertices[i + 6] = bottomLeft[0];
    node.data.vertices[i + 7] = bottomLeft[1];
    node.data.vertices[i + 8] = color[0];
    node.data.vertices[i + 9] = color[1];
    node.data.vertices[i + 10] = color[2];
    node.data.vertices[i + 11] = color[3];
    node.data.vertices[i + 12] = topRight[0];
    node.data.vertices[i + 13] = topRight[1];
    node.data.vertices[i + 14] = color[0];
    node.data.vertices[i + 15] = color[1];
    node.data.vertices[i + 16] = color[2];
    node.data.vertices[i + 17] = color[3];
    node.data.vertices[i + 18] = bottomLeft[0];
    node.data.vertices[i + 19] = bottomLeft[1];
    node.data.vertices[i + 20] = color[0];
    node.data.vertices[i + 21] = color[1];
    node.data.vertices[i + 22] = color[2];
    node.data.vertices[i + 23] = color[3];
    node.data.vertices[i + 24] = bottomRight[0];
    node.data.vertices[i + 25] = bottomRight[1];
    node.data.vertices[i + 26] = color[0];
    node.data.vertices[i + 27] = color[1];
    node.data.vertices[i + 28] = color[2];
    node.data.vertices[i + 29] = color[3];
    node.data.vertices[i + 30] = topRight[0];
    node.data.vertices[i + 31] = topRight[1];
    node.data.vertices[i + 32] = color[0];
    node.data.vertices[i + 33] = color[1];
    node.data.vertices[i + 34] = color[2];
    node.data.vertices[i + 35] = color[3];
    node.data.vertexCount += 6;
    node.data.dirty = true;
  },
  clear: function(cobalt, node) {
    node.data.vertexCount = 0;
    node.data.transforms.length = 1;
    mat3.identity(node.data.transforms[0]);
    node.data.dirty = true;
  }
};
function line(cobalt, node, start, end, color, lineWidth = 1) {
  const m = node.data.transforms.at(-1);
  start = vec22.transformMat3(start, m);
  end = vec22.transformMat3(end, m);
  const delta = vec22.sub(end, start);
  const unitBasis = vec22.normalize(delta);
  const perp = perpendicularComponent(unitBasis);
  const halfLineWidth = lineWidth / 2;
  let i = node.data.vertexCount * 6;
  const currentElementCount = node.data.vertexCount * 6;
  const floatsToAdd = 6 * 6;
  node.data.vertices = handleArrayResize(Float32Array, node.data.vertices, currentElementCount, floatsToAdd);
  node.data.vertices[i + 0] = start[0] + perp[0] * halfLineWidth;
  node.data.vertices[i + 1] = start[1] + perp[1] * halfLineWidth;
  node.data.vertices[i + 2] = color[0];
  node.data.vertices[i + 3] = color[1];
  node.data.vertices[i + 4] = color[2];
  node.data.vertices[i + 5] = color[3];
  node.data.vertices[i + 6] = start[0] - perp[0] * halfLineWidth;
  node.data.vertices[i + 7] = start[1] - perp[1] * halfLineWidth;
  node.data.vertices[i + 8] = color[0];
  node.data.vertices[i + 9] = color[1];
  node.data.vertices[i + 10] = color[2];
  node.data.vertices[i + 11] = color[3];
  node.data.vertices[i + 12] = end[0] + perp[0] * halfLineWidth;
  node.data.vertices[i + 13] = end[1] + perp[1] * halfLineWidth;
  node.data.vertices[i + 14] = color[0];
  node.data.vertices[i + 15] = color[1];
  node.data.vertices[i + 16] = color[2];
  node.data.vertices[i + 17] = color[3];
  node.data.vertices[i + 18] = start[0] - perp[0] * halfLineWidth;
  node.data.vertices[i + 19] = start[1] - perp[1] * halfLineWidth;
  node.data.vertices[i + 20] = color[0];
  node.data.vertices[i + 21] = color[1];
  node.data.vertices[i + 22] = color[2];
  node.data.vertices[i + 23] = color[3];
  node.data.vertices[i + 24] = end[0] + perp[0] * halfLineWidth;
  node.data.vertices[i + 25] = end[1] + perp[1] * halfLineWidth;
  node.data.vertices[i + 26] = color[0];
  node.data.vertices[i + 27] = color[1];
  node.data.vertices[i + 28] = color[2];
  node.data.vertices[i + 29] = color[3];
  node.data.vertices[i + 30] = end[0] - perp[0] * halfLineWidth;
  node.data.vertices[i + 31] = end[1] - perp[1] * halfLineWidth;
  node.data.vertices[i + 32] = color[0];
  node.data.vertices[i + 33] = color[1];
  node.data.vertices[i + 34] = color[2];
  node.data.vertices[i + 35] = color[3];
  node.data.vertexCount += 6;
  node.data.dirty = true;
}
function handleArrayResize(ArrayType, arr, currentElementCount, elementsToAdd) {
  if (currentElementCount + elementsToAdd <= arr.length)
    return arr;
  const newSize = arr.length * 2;
  const MAX_LENGTH = 16 * 1024 * 1024 / arr.BYTES_PER_ELEMENT;
  if (newSize > MAX_LENGTH)
    throw new Error("vertices exceed max array size");
  const newArray = new ArrayType(newSize);
  newArray.set(arr);
  return newArray;
}
function perpendicularComponent(inp) {
  return [-inp[1], inp[0]];
}

// node_modules/round-half-up-symmetric/index.js
function round(value) {
  if (value >= 0)
    return Math.round(value);
  return value % 0.5 === 0 ? Math.floor(value) : Math.round(value);
}

// src/primitives/primitives.js
var _tmpVec32 = vec3.create(0, 0, 0);
var primitives_default2 = {
  type: "cobalt:primitives",
  refs: [
    { name: "color", type: "textView", format: "PREFERRED_TEXTURE_VIEW", access: "write" }
  ],
  // cobalt event handling functions
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init8(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
    draw8(cobalt, node, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, node) {
    destroy6(node);
  },
  onResize: function(cobalt, node) {
    _writeMatricesBuffer(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
    _writeMatricesBuffer(cobalt, node);
  },
  // optional
  customFunctions: public_api_default
};
async function init8(cobalt, node) {
  const { device } = cobalt;
  const vertices = new Float32Array(1024);
  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    //mappedAtCreation: true,
  });
  const uniformBuffer = device.createBuffer({
    size: 64 * 2,
    // 4x4 matrix with 4 bytes per float32, times 2 matrices (view, projection)
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  const shaderModule = device.createShaderModule({
    code: primitives_default
  });
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: {}
      }
    ]
  });
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
  });
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer
        }
      }
    ]
  });
  const pipeline = device.createRenderPipeline({
    label: "primitives",
    layout: pipelineLayout,
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [{
        arrayStride: 6 * Float32Array.BYTES_PER_ELEMENT,
        // 2 floats per vertex position + 4 floats per vertex color
        //stepMode: 'vertex',
        attributes: [
          // position
          {
            shaderLocation: 0,
            offset: 0,
            format: "float32x2"
          },
          // color
          {
            shaderLocation: 1,
            format: "float32x4",
            offset: 8
          }
        ]
      }]
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [
        {
          format: getPreferredFormat(cobalt),
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha"
            },
            alpha: {
              srcFactor: "zero",
              dstFactor: "one"
            }
          }
        }
      ]
    },
    primitive: {
      topology: "triangle-list"
    }
  });
  return {
    uniformBuffer,
    // perspective and view matrices for the camera
    vertexBuffer,
    pipeline,
    bindGroup,
    // triangle data used to render the primitives
    vertexCount: 0,
    dirty: false,
    // when more stuff has been drawn and vertexBuffer needs updating
    vertices,
    // [ x, y, x, y, ... ]
    // saving/restoring will push/pop transforms off of this stack.
    // works very similarly to HTML Canvas's transforms.
    // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Transformations
    transforms: [mat3.identity()]
  };
}
function draw8(cobalt, node, commandEncoder) {
  if (node.data.vertexCount === 0)
    return;
  const { device } = cobalt;
  if (node.data.dirty) {
    node.data.dirty = false;
    const stride = 6 * Float32Array.BYTES_PER_ELEMENT;
    if (node.data.vertices.buffer.byteLength > node.data.vertexBuffer.size) {
      node.data.vertexBuffer.destroy();
      node.data.vertexBuffer = device.createBuffer({
        size: node.data.vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
    }
    let byteCount = node.data.vertexCount * stride;
    if (byteCount > node.data.vertexBuffer.size) {
      console.error("too many primitives, bailing");
      return;
    }
    cobalt.device.queue.writeBuffer(node.data.vertexBuffer, 0, node.data.vertices.buffer, 0, byteCount);
  }
  const loadOp = node.options.loadOp || "load";
  const renderpass = commandEncoder.beginRenderPass({
    label: "primitives",
    colorAttachments: [
      // color
      {
        view: node.refs.color,
        //node.refs.color.data.view,
        clearValue: cobalt.clearValue,
        loadOp,
        storeOp: "store"
      }
    ]
  });
  renderpass.setPipeline(node.data.pipeline);
  renderpass.setBindGroup(0, node.data.bindGroup);
  renderpass.setVertexBuffer(0, node.data.vertexBuffer);
  renderpass.draw(node.data.vertexCount);
  renderpass.end();
}
function destroy6(node) {
  node.data.vertexBuffer.destroy();
  node.data.vertexBuffer = null;
  node.data.uniformBuffer.destroy();
  node.data.uniformBuffer = null;
  node.data.transforms.length = 0;
}
function _writeMatricesBuffer(cobalt, node) {
  const { device } = cobalt;
  const GAME_WIDTH = cobalt.viewport.width / cobalt.viewport.zoom;
  const GAME_HEIGHT = cobalt.viewport.height / cobalt.viewport.zoom;
  const projection = mat4.ortho(0, GAME_WIDTH, GAME_HEIGHT, 0, -10, 10);
  vec3.set(-cobalt.viewport.position[0] - 1, -cobalt.viewport.position[1] - 1, 0, _tmpVec32);
  const view = mat4.translation(_tmpVec32);
  device.queue.writeBuffer(node.data.uniformBuffer, 0, view.buffer);
  device.queue.writeBuffer(node.data.uniformBuffer, 64, projection.buffer);
}

// src/light/public-api.js
var public_api_exports2 = {};
__export(public_api_exports2, {
  setAmbientLight: () => setAmbientLight,
  setLights: () => setLights,
  setOccluders: () => setOccluders
});
function setLights(cobalt, node, lights) {
  node.data.lights = lights;
  node.data.lightsBufferNeedsUpdate = true;
}
function setAmbientLight(cobalt, node, color) {
  node.data.lightsRenderer.setAmbientLight(color);
}
function setOccluders(cobalt, node, segmentsList) {
  node.data.lightsRenderer.setObstacles(segmentsList);
  node.data.lightsTextureNeedsUpdate = true;
}

// src/light/viewport.ts
var Viewport = class {
  invViewProjectionMatrix = mat4.identity();
  viewportSize = { width: 1, height: 1 };
  topLeft = [0, 0];
  zoom = 1;
  constructor(params) {
    this.setViewportSize(params.viewportSize.width, params.viewportSize.height);
    const initialTopLeft = params.center ?? this.topLeft;
    this.setTopLeft(...initialTopLeft);
    const initialZoom = params.zoom ?? 1;
    this.setZoom(initialZoom);
  }
  get invertViewProjectionMatrix() {
    return this.invViewProjectionMatrix;
  }
  setViewportSize(width, height) {
    this.viewportSize.width = width;
    this.viewportSize.height = height;
    this.updateMatrices();
  }
  setTopLeft(x, y) {
    this.topLeft[0] = x;
    this.topLeft[1] = y;
    this.updateMatrices();
  }
  setZoom(zoom) {
    this.zoom = zoom;
    this.updateMatrices();
  }
  updateMatrices() {
    mat4.identity(this.invViewProjectionMatrix);
    mat4.multiply(mat4.scaling([1, -1, 0]), this.invViewProjectionMatrix, this.invViewProjectionMatrix);
    mat4.multiply(mat4.translation([1, 1, 0]), this.invViewProjectionMatrix, this.invViewProjectionMatrix);
    mat4.multiply(mat4.scaling([0.5 * this.viewportSize.width / this.zoom, 0.5 * this.viewportSize.height / this.zoom, 0]), this.invViewProjectionMatrix, this.invViewProjectionMatrix);
    mat4.multiply(mat4.translation([this.topLeft[0], this.topLeft[1], 0]), this.invViewProjectionMatrix, this.invViewProjectionMatrix);
  }
};

// src/light/lights-buffer.ts
var LightsBuffer = class _LightsBuffer {
  static structs = {
    definition: `
struct Light {                //             align(16) size(48)
    color: vec3<f32>,         // offset(0)   align(16) size(12)
    radius: f32,              // offset(12)  align(4)  size(4)
    position: vec2<f32>,      // offset(16)  align(8)  size(8)
    intensity: f32,           // offset(24)  align(4)  size(4)
    attenuationLinear: f32,   // offset(28)  align(4)  size(4)
    attenuationExp: f32,      // offset(32)  align(4)  size(4)
};

struct LightsBuffer {         //             align(16)
    count: u32,               // offset(0)   align(4)  size(4)
    // padding
    lights: array<Light>,     // offset(16)  align(16)
};
`,
    light: {
      radius: { offset: 12 },
      position: { offset: 16 }
    },
    lightsBuffer: {
      lights: { offset: 16, stride: 48 }
    }
  };
  device;
  maxLightsCount;
  currentLightsCount = 0;
  buffer;
  get gpuBuffer() {
    return this.buffer.bufferGpu;
  }
  constructor(device, maxLightsCount) {
    this.device = device;
    this.maxLightsCount = maxLightsCount;
    const bufferCpu = new ArrayBuffer(_LightsBuffer.computeBufferBytesLength(maxLightsCount));
    const bufferGpu = device.createBuffer({
      label: "LightsBuffer buffer",
      size: bufferCpu.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX
    });
    this.buffer = { bufferCpu, bufferGpu };
    this.setLights([]);
  }
  setLights(lights) {
    if (lights.length > this.maxLightsCount) {
      throw new Error(`Too many lights "${lights.length}", max is "${this.maxLightsCount}".`);
    }
    const newBufferLength = _LightsBuffer.computeBufferBytesLength(lights.length);
    new Uint32Array(this.buffer.bufferCpu, 0, 1).set([lights.length]);
    lights.forEach((light, index) => {
      new Float32Array(this.buffer.bufferCpu, _LightsBuffer.structs.lightsBuffer.lights.offset + _LightsBuffer.structs.lightsBuffer.lights.stride * index, 9).set([
        ...light.color,
        light.radius,
        ...light.position,
        light.intensity,
        light.attenuationLinear,
        light.attenuationExp
      ]);
    });
    this.device.queue.writeBuffer(this.buffer.bufferGpu, 0, this.buffer.bufferCpu, 0, newBufferLength);
    this.currentLightsCount = lights.length;
  }
  get lightsCount() {
    return this.currentLightsCount;
  }
  destroy() {
    this.buffer.bufferGpu.destroy();
  }
  static computeBufferBytesLength(lightsCount) {
    return _LightsBuffer.structs.lightsBuffer.lights.offset + _LightsBuffer.structs.lightsBuffer.lights.stride * lightsCount;
  }
};

// src/light/texture/lights-texture-initializer.ts
var LightsTextureInitializer = class {
  lightsBuffer;
  renderPipeline;
  bindgroup;
  renderBundle;
  constructor(device, lightsBuffer, lightsTexture, maxLightSize) {
    this.lightsBuffer = lightsBuffer;
    const shaderModule = device.createShaderModule({
      label: "LightsTextureInitializer shader module",
      code: `
${LightsBuffer.structs.definition}

@group(0) @binding(0) var<storage,read> lightsBuffer: LightsBuffer;

struct VertexIn {
    @builtin(vertex_index) vertexIndex: u32,
};

struct VertexOut {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
};

const cellsGridSizeU = vec2<u32>(${lightsTexture.gridSize.x}, ${lightsTexture.gridSize.y});
const cellsGridSizeF = vec2<f32>(${lightsTexture.gridSize.x}, ${lightsTexture.gridSize.y});

@vertex
fn main_vertex(in: VertexIn) -> VertexOut {
    const corners = array<vec2<f32>, 4>(
        vec2<f32>(-1, -1),
        vec2<f32>(1, -1),
        vec2<f32>(-1, 1),
        vec2<f32>(1, 1),
    );
    let screenPosition = corners[in.vertexIndex];

    var out: VertexOut;
    out.position = vec4<f32>(screenPosition, 0.0, 1.0);
    out.uv = (0.5 + 0.5 * screenPosition) * cellsGridSizeF;
    return out;
}

struct FragmentOut {
    @location(0) color: vec4<f32>,
};

struct LightProperties {
    radius: f32,
    intensity: f32,
    attenuationLinear: f32,
    attenuationExp: f32,
};

fn get_light_properties(lightId: u32) -> LightProperties {
    var lightProperties: LightProperties;
    if (lightId < lightsBuffer.count) {
        let light = lightsBuffer.lights[lightId];
        lightProperties.radius = light.radius;
        lightProperties.intensity = 1.0;
        lightProperties.attenuationLinear = light.attenuationLinear;
        lightProperties.attenuationExp = light.attenuationExp;
    } else {
        lightProperties.radius = 0.0;
        lightProperties.intensity = 0.0;
        lightProperties.attenuationLinear = 0.0;
        lightProperties.attenuationExp = 0.0;
    }
    return lightProperties;
}

@fragment
fn main_fragment(in: VertexOut) -> FragmentOut {
    let cellId = vec2<u32>(in.uv);

    let lightIdFrom = 4u * (cellId.x + cellId.y * cellsGridSizeU.x);
    let lightProperties = array<LightProperties, 4>(
        get_light_properties(lightIdFrom + 0u),
        get_light_properties(lightIdFrom + 1u),
        get_light_properties(lightIdFrom + 2u),
        get_light_properties(lightIdFrom + 3u),
    );

    let sizes = vec4<f32>(
        lightProperties[0].radius,
        lightProperties[1].radius,
        lightProperties[2].radius,
        lightProperties[3].radius,
    );

    let localUv = fract(in.uv);
    let fromCenter = 2.0 * localUv - 1.0;
    let uvDistanceFromCenter = distance(vec2<f32>(0,0), fromCenter);
    let distancesFromCenter = vec4<f32>(uvDistanceFromCenter / sizes * f32(${maxLightSize}));

    let intensities = vec4<f32>(
        lightProperties[0].intensity * (1.0 + 1.0 * step(uvDistanceFromCenter, 0.01)),
        lightProperties[1].intensity * (1.0 + 1.0 * step(uvDistanceFromCenter, 0.01)),
        lightProperties[2].intensity * (1.0 + 1.0 * step(uvDistanceFromCenter, 0.01)),
        lightProperties[3].intensity * (1.0 + 1.0 * step(uvDistanceFromCenter, 0.01)),
    );
    let attenuationsLinear = vec4<f32>(
        lightProperties[0].attenuationLinear,
        lightProperties[1].attenuationLinear,
        lightProperties[2].attenuationLinear,
        lightProperties[3].attenuationLinear,
    );
    let attenuationsExp = vec4<f32>(
        lightProperties[0].attenuationExp,
        lightProperties[1].attenuationExp,
        lightProperties[2].attenuationExp,
        lightProperties[3].attenuationExp,
    );

    var lightIntensities = intensities / (1.0 + distancesFromCenter * (attenuationsLinear + distancesFromCenter * attenuationsExp)); // base intensity equation
    lightIntensities *= cos(distancesFromCenter * ${Math.PI / 2}); // soft limit;
    lightIntensities *= step(distancesFromCenter, vec4<f32>(1.0)); // hard limit

    var out: FragmentOut;
    out.color = lightIntensities;
    return out;
}
            `
    });
    this.renderPipeline = device.createRenderPipeline({
      label: "LightsTextureInitializer renderpipeline",
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "main_vertex"
      },
      fragment: {
        module: shaderModule,
        entryPoint: "main_fragment",
        targets: [{
          format: lightsTexture.format
        }]
      },
      primitive: {
        cullMode: "none",
        topology: "triangle-strip"
      },
      multisample: {
        count: lightsTexture.sampleCount
      }
    });
    this.bindgroup = device.createBindGroup({
      label: "LightsTextureInitializer bindgroup 0",
      layout: this.renderPipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.lightsBuffer.gpuBuffer }
        }
      ]
    });
    const renderBundleEncoder = device.createRenderBundleEncoder({
      label: "LightsTextureInitializer renderbundle encoder",
      colorFormats: [lightsTexture.format],
      sampleCount: lightsTexture.sampleCount
    });
    renderBundleEncoder.setPipeline(this.renderPipeline);
    renderBundleEncoder.setBindGroup(0, this.bindgroup);
    renderBundleEncoder.draw(4);
    this.renderBundle = renderBundleEncoder.finish({ label: "LightsTextureInitializer renderbundle" });
  }
  getRenderBundle() {
    return this.renderBundle;
  }
  destroy() {
  }
};

// src/light/texture/lights-texture-mask.ts
var LightsTextureMask = class {
  device;
  renderPipeline;
  renderBundleEncoderDescriptor;
  renderBundle;
  lightsBuffer;
  indirectDrawing;
  obstacles = null;
  constructor(device, lightsBuffer, lightsTexture, uniformLightSize) {
    this.device = device;
    this.lightsBuffer = lightsBuffer;
    const obstaclesAreTwoWay = true;
    const shaderModule = device.createShaderModule({
      label: "LightsTextureMask shader module",
      code: `
struct VertexIn {
    @builtin(instance_index) lightIndex: u32,
    @location(0) position: vec3<f32>,
    @location(1) lightSize: f32,
    @location(2) lightPosition: vec2<f32>,
};

struct VertexOut {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) localPosition: vec2<f32>,
};

const cellsGridSizeU = vec2<u32>(${lightsTexture.gridSize.x}, ${lightsTexture.gridSize.y});
const cellsGridSizeF = vec2<f32>(${lightsTexture.gridSize.x}, ${lightsTexture.gridSize.y});

@vertex
fn main_vertex(in: VertexIn) -> VertexOut {
    let worldPosition = in.lightPosition + (in.position.xy - in.lightPosition) * (1.0 + 10000.0 * in.position.z);

    let scaling = f32(${uniformLightSize});

    let cellIndex = in.lightIndex / 4u;
    let indexInCell = in.lightIndex % 4u;

    let cellIdU = vec2<u32>(
        cellIndex % cellsGridSizeU.x,
        cellIndex / cellsGridSizeU.x,
    );
    let cellIdF = vec2<f32>(cellIdU);

    var out: VertexOut;
    out.localPosition = (worldPosition - in.lightPosition) / scaling;
    out.position = vec4<f32>(
        (out.localPosition - (cellsGridSizeF - 1.0) + 2.0 * cellIdF) / cellsGridSizeF,
        0.0,
        1.0,
    );
    out.color = vec4<f32>(
        vec4<u32>(indexInCell) != vec4<u32>(0u, 1u, 2u, 3u),
    );
    return out;
}

struct FragmentOut {
    @location(0) color: vec4<f32>,
};

@fragment
fn main_fragment(in: VertexOut) -> FragmentOut {
    if (in.localPosition.x < -1.0 || in.localPosition.x > 1.0 || in.localPosition.y <= -1.0 || in.localPosition.y > 1.0) {
        discard;
    }
    var out: FragmentOut;
    out.color = in.color;
    return out;
}
            `
    });
    this.renderPipeline = device.createRenderPipeline({
      label: "LightsTextureMask renderpipeline",
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "main_vertex",
        buffers: [
          {
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: "float32x3"
              }
            ],
            arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
            stepMode: "vertex"
          },
          {
            attributes: [
              {
                shaderLocation: 1,
                offset: LightsBuffer.structs.light.radius.offset,
                format: "float32"
              },
              {
                shaderLocation: 2,
                offset: LightsBuffer.structs.light.position.offset,
                format: "float32x2"
              }
            ],
            arrayStride: LightsBuffer.structs.lightsBuffer.lights.stride,
            stepMode: "instance"
          }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "main_fragment",
        targets: [{
          format: lightsTexture.format,
          blend: {
            color: {
              operation: "min",
              srcFactor: "one",
              dstFactor: "one"
            },
            alpha: {
              operation: "min",
              srcFactor: "one",
              dstFactor: "one"
            }
          }
        }]
      },
      primitive: {
        cullMode: obstaclesAreTwoWay ? "none" : "back",
        topology: "triangle-list"
      },
      multisample: {
        count: lightsTexture.sampleCount
      }
    });
    this.indirectDrawing = {
      bufferCpu: new ArrayBuffer(20),
      bufferGpu: device.createBuffer({
        label: "LightsTextureMask indirect buffer",
        size: 20,
        usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST
      })
    };
    this.uploadIndirectDrawingBuffer();
    this.renderBundleEncoderDescriptor = {
      label: "LightsTextureMask renderbundle encoder",
      colorFormats: [lightsTexture.format],
      sampleCount: lightsTexture.sampleCount
    };
    this.renderBundle = this.buildRenderBundle();
  }
  getRenderBundle() {
    return this.renderBundle;
  }
  setObstacles(segments) {
    const positions = [];
    const indices = [];
    for (const segment of segments) {
      const firstQuadIndex = positions.length / 3;
      positions.push(
        ...segment[0],
        0,
        ...segment[1],
        0,
        ...segment[0],
        1,
        ...segment[1],
        1
      );
      indices.push(
        firstQuadIndex + 0,
        firstQuadIndex + 1,
        firstQuadIndex + 3,
        firstQuadIndex + 0,
        firstQuadIndex + 3,
        firstQuadIndex + 2
      );
    }
    let gpuBuffersChanged = false;
    const positionsArray = new Float32Array(positions);
    let positionsBufferGpu = this.obstacles?.positionsBufferGpu;
    if (!positionsBufferGpu || positionsBufferGpu.size < positionsArray.byteLength) {
      positionsBufferGpu?.destroy();
      positionsBufferGpu = this.device.createBuffer({
        label: "LightsTextureMask positions buffer",
        size: positionsArray.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
      gpuBuffersChanged = true;
    }
    this.device.queue.writeBuffer(positionsBufferGpu, 0, positionsArray);
    const indicesArray = new Uint16Array(indices);
    let indexBufferGpu = this.obstacles?.indexBufferGpu;
    if (!indexBufferGpu || indexBufferGpu.size < indicesArray.byteLength) {
      indexBufferGpu?.destroy();
      indexBufferGpu = this.device.createBuffer({
        label: "LightsTextureMask index buffer",
        size: indicesArray.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
      });
      gpuBuffersChanged = true;
    }
    this.device.queue.writeBuffer(indexBufferGpu, 0, indicesArray);
    this.obstacles = { positionsBufferGpu, indexBufferGpu };
    this.setIndirectIndexCount(indices.length);
    if (gpuBuffersChanged) {
      this.renderBundle = this.buildRenderBundle();
    }
  }
  setLightsCount(count) {
    this.setIndirectInstanceCount(count);
  }
  destroy() {
    this.indirectDrawing.bufferGpu.destroy();
    this.obstacles?.positionsBufferGpu.destroy();
    this.obstacles?.indexBufferGpu.destroy();
  }
  setIndirectIndexCount(indexCount) {
    const drawIndexedIndirectParameters = new Uint32Array(this.indirectDrawing.bufferCpu);
    if (drawIndexedIndirectParameters[0] !== indexCount) {
      drawIndexedIndirectParameters[0] = indexCount;
      this.uploadIndirectDrawingBuffer();
    }
  }
  setIndirectInstanceCount(instanceCount) {
    const drawIndexedIndirectParameters = new Uint32Array(this.indirectDrawing.bufferCpu);
    if (drawIndexedIndirectParameters[1] !== instanceCount) {
      drawIndexedIndirectParameters[1] = instanceCount;
      this.uploadIndirectDrawingBuffer();
    }
  }
  buildRenderBundle() {
    const renderBundleEncoder = this.device.createRenderBundleEncoder(this.renderBundleEncoderDescriptor);
    if (this.obstacles) {
      renderBundleEncoder.setPipeline(this.renderPipeline);
      renderBundleEncoder.setVertexBuffer(0, this.obstacles.positionsBufferGpu);
      renderBundleEncoder.setVertexBuffer(1, this.lightsBuffer.gpuBuffer, LightsBuffer.structs.lightsBuffer.lights.offset);
      renderBundleEncoder.setIndexBuffer(this.obstacles.indexBufferGpu, "uint16");
      renderBundleEncoder.drawIndexedIndirect(this.indirectDrawing.bufferGpu, 0);
    }
    return renderBundleEncoder.finish({ label: "LightsTextureMask renderbundle" });
  }
  uploadIndirectDrawingBuffer() {
    this.device.queue.writeBuffer(this.indirectDrawing.bufferGpu, 0, this.indirectDrawing.bufferCpu);
  }
};

// src/light/texture/lights-texture.ts
var LightsTexture = class {
  lightsBuffer;
  texture;
  gridSize;
  textureMultisampled = null;
  textureRenderpassDescriptor;
  textureInitializer;
  textureMask;
  constructor(device, lightsBuffer, lightsTextureProperties) {
    this.lightsBuffer = lightsBuffer;
    const cellsCount = this.lightsBuffer.maxLightsCount / 4;
    const gridSize = {
      x: Math.ceil(Math.sqrt(cellsCount)),
      y: 0
    };
    gridSize.y = Math.ceil(cellsCount / gridSize.x);
    this.gridSize = gridSize;
    const lightTextureSize = {
      width: gridSize.x * lightsTextureProperties.resolutionPerLight,
      height: gridSize.y * lightsTextureProperties.resolutionPerLight
    };
    const format = lightsTextureProperties.textureFormat;
    this.texture = device.createTexture({
      label: "LightsTextureMask texture",
      size: [lightTextureSize.width, lightTextureSize.height],
      format,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT
    });
    if (lightsTextureProperties.antialiased) {
      this.textureMultisampled = device.createTexture({
        label: "LightsTextureMask texture multisampled",
        size: [lightTextureSize.width, lightTextureSize.height],
        format,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
        sampleCount: 4
      });
    }
    const textureToRenderTo = this.textureMultisampled ?? this.texture;
    const textureRenderpassColorAttachment = {
      view: textureToRenderTo.createView(),
      clearValue: [0, 0, 0, 1],
      loadOp: "load",
      storeOp: "store"
    };
    if (lightsTextureProperties.antialiased) {
      textureRenderpassColorAttachment.resolveTarget = this.texture.createView();
    }
    this.textureRenderpassDescriptor = {
      label: "lights-renderer render to texture renderpass",
      colorAttachments: [textureRenderpassColorAttachment]
    };
    const lightsTexture = {
      gridSize,
      format,
      sampleCount: this.textureMultisampled?.sampleCount ?? 1
    };
    this.textureInitializer = new LightsTextureInitializer(device, lightsBuffer, lightsTexture, lightsTextureProperties.maxLightSize);
    this.textureMask = new LightsTextureMask(device, lightsBuffer, lightsTexture, lightsTextureProperties.maxLightSize);
  }
  update(commandEncoder) {
    this.textureMask.setLightsCount(this.lightsBuffer.lightsCount);
    const renderpassEncoder = commandEncoder.beginRenderPass(this.textureRenderpassDescriptor);
    const [textureWidth, textureHeight] = [this.texture.width, this.texture.height];
    renderpassEncoder.setViewport(0, 0, textureWidth, textureHeight, 0, 1);
    renderpassEncoder.setScissorRect(0, 0, textureWidth, textureHeight);
    renderpassEncoder.executeBundles([
      this.textureInitializer.getRenderBundle(),
      this.textureMask.getRenderBundle()
    ]);
    renderpassEncoder.end();
  }
  setObstacles(segments) {
    this.textureMask.setObstacles(segments);
  }
  destroy() {
    this.texture.destroy();
    this.textureMultisampled?.destroy();
    this.textureInitializer.destroy();
    this.textureMask.destroy();
  }
};

// src/light/lights-renderer.ts
var LightsRenderer = class {
  device;
  ambientLight = [0.2, 0.2, 0.2];
  targetTexture;
  renderPipeline;
  uniformsBufferGpu;
  bindgroup0;
  bindgroup1;
  renderBundle;
  lightsBuffer;
  lightsTexture;
  constructor(params) {
    this.device = params.device;
    this.targetTexture = params.targetTexture;
    this.lightsBuffer = params.lightsBuffer;
    this.lightsTexture = new LightsTexture(params.device, params.lightsBuffer, params.lightsTextureProperties);
    this.uniformsBufferGpu = params.device.createBuffer({
      label: "LightsRenderer uniforms buffer",
      size: 80,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const shaderModule = params.device.createShaderModule({
      label: "LightsRenderer shader module",
      code: `
struct Uniforms {                  //            align(16) size(80)
    invertViewMatrix: mat4x4<f32>, // offset(0)  align(16) size(64)
    ambientLight: vec3<f32>,       // offset(64) align(16) size(12)
};

${LightsBuffer.structs.definition}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage,read> lightsBuffer: LightsBuffer;
@group(0) @binding(2) var lightsTexture: texture_2d<f32>;
@group(0) @binding(3) var lightsTextureSampler: sampler;

@group(1) @binding(0) var albedoTexture: texture_2d<f32>;
@group(1) @binding(1) var albedoSampler: sampler;

struct VertexIn {
    @builtin(vertex_index) vertexIndex: u32,
};

struct VertexOut {
    @builtin(position) position: vec4<f32>,
    @location(0) worldPosition: vec2<f32>,
    @location(1) uv: vec2<f32>,
};

@vertex
fn main_vertex(in: VertexIn) -> VertexOut {
    const corners = array<vec2<f32>, 4>(
        vec2<f32>(-1, -1),
        vec2<f32>(1, -1),
        vec2<f32>(-1, 1),
        vec2<f32>(1, 1),
    );
    let screenPosition = corners[in.vertexIndex];

    var out: VertexOut;
    out.position = vec4<f32>(screenPosition, 0.0, 1.0);
    out.worldPosition = (uniforms.invertViewMatrix * out.position).xy;
    out.uv = 0.5 + 0.5 * screenPosition * vec2<f32>(1.0, -1.0);
    return out;
}

struct FragmentOut {
    @location(0) color: vec4<f32>,
};

const cellsGridSizeU = vec2<u32>(${this.lightsTexture.gridSize.x}, ${this.lightsTexture.gridSize.y});
const cellsGridSizeF = vec2<f32>(${this.lightsTexture.gridSize.x}, ${this.lightsTexture.gridSize.y});

fn sampleLightBaseIntensity(lightId: u32, localUv: vec2<f32>) -> f32 {
    let cellIndex = lightId / 4u;
    let indexInCell = lightId % 4u;

    let cellIdU = vec2<u32>(
        cellIndex % cellsGridSizeU.x,
        cellIndex / cellsGridSizeU.x,
    );
    let cellIdF = vec2<f32>(cellIdU);
    let uv = (cellIdF + localUv) / cellsGridSizeF;
    let uvYInverted = vec2<f32>(uv.x, 1.0 - uv.y);
    let sample = textureSampleLevel(lightsTexture, lightsTextureSampler, uvYInverted, 0.0);
    let channel = vec4<f32>(
        vec4<u32>(indexInCell) == vec4<u32>(0u, 1u, 2u, 3u),
    );
    return dot(sample, channel);
}
    
fn compute_lights(worldPosition: vec2<f32>) -> vec3<f32> {
    var color = vec3<f32>(uniforms.ambientLight);

    const maxUvDistance = f32(${1 - 2 / params.lightsTextureProperties.resolutionPerLight});

    let lightsCount = lightsBuffer.count;
    for (var iLight = 0u; iLight < lightsCount; iLight++) {
        let light = lightsBuffer.lights[iLight];
        let lightSize = f32(${params.lightsTextureProperties.resolutionPerLight});
        let relativePosition = (worldPosition - light.position) / lightSize;
        if (max(abs(relativePosition.x), abs(relativePosition.y)) < maxUvDistance) {
            let localUv = 0.5 + 0.5 * relativePosition;    
            let lightIntensity = light.intensity * sampleLightBaseIntensity(iLight, localUv);
            color += lightIntensity * light.color;
        }
    }

    return color;
}

@fragment
fn main_fragment(in: VertexOut) -> FragmentOut {
    let light = compute_lights(in.worldPosition);
    let albedo = textureSample(albedoTexture, albedoSampler, in.uv);
    let color = albedo.rgb * light;

    var out: FragmentOut;
    out.color = vec4<f32>(color, 1.0);
    return out;
}
            `
    });
    this.renderPipeline = params.device.createRenderPipeline({
      label: "LightsRenderer renderpipeline",
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "main_vertex"
      },
      fragment: {
        module: shaderModule,
        entryPoint: "main_fragment",
        targets: [{
          format: this.targetTexture.format
        }]
      },
      primitive: {
        cullMode: "none",
        topology: "triangle-strip"
      }
    });
    const bindgroupLayout = this.renderPipeline.getBindGroupLayout(0);
    this.bindgroup0 = params.device.createBindGroup({
      label: "LightsRenderer bindgroup 0",
      layout: bindgroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.uniformsBufferGpu }
        },
        {
          binding: 1,
          resource: { buffer: this.lightsBuffer.gpuBuffer }
        },
        {
          binding: 2,
          resource: this.lightsTexture.texture.createView({ label: "LightsRenderer lightsTexture view" })
        },
        {
          binding: 3,
          resource: params.device.createSampler({
            label: "LightsRenderer sampler",
            addressModeU: "clamp-to-edge",
            addressModeV: "clamp-to-edge",
            magFilter: params.lightsTextureProperties.filtering,
            minFilter: params.lightsTextureProperties.filtering
          })
        }
      ]
    });
    this.bindgroup1 = this.buildBindgroup1(params.albedo);
    this.renderBundle = this.buildRenderBundle();
  }
  computeLightsTexture(commandEncoder) {
    this.lightsTexture.update(commandEncoder);
  }
  render(renderpassEncoder, invertVpMatrix) {
    const uniformsBufferCpu = new ArrayBuffer(80);
    new Float32Array(uniformsBufferCpu, 0, 16).set(invertVpMatrix);
    new Float32Array(uniformsBufferCpu, 64, 3).set(this.ambientLight);
    this.device.queue.writeBuffer(this.uniformsBufferGpu, 0, uniformsBufferCpu);
    renderpassEncoder.executeBundles([this.renderBundle]);
  }
  setAlbedo(albedo) {
    this.bindgroup1 = this.buildBindgroup1(albedo);
    this.renderBundle = this.buildRenderBundle();
  }
  setAmbientLight(color) {
    this.ambientLight = [...color];
  }
  setObstacles(segments) {
    this.lightsTexture.setObstacles(segments);
  }
  destroy() {
    this.uniformsBufferGpu.destroy();
    this.lightsTexture.destroy();
  }
  buildBindgroup1(albedo) {
    return this.device.createBindGroup({
      label: "LightsRenderer bindgroup 1",
      layout: this.renderPipeline.getBindGroupLayout(1),
      entries: [
        {
          binding: 0,
          resource: albedo.view
        },
        {
          binding: 1,
          resource: albedo.sampler
        }
      ]
    });
  }
  buildRenderBundle() {
    const renderBundleEncoder = this.device.createRenderBundleEncoder({
      label: "LightsRenderer renderbundle encoder",
      colorFormats: [this.targetTexture.format]
    });
    renderBundleEncoder.setPipeline(this.renderPipeline);
    renderBundleEncoder.setBindGroup(0, this.bindgroup0);
    renderBundleEncoder.setBindGroup(1, this.bindgroup1);
    renderBundleEncoder.draw(4);
    return renderBundleEncoder.finish({ label: "LightsRenderer renderbundle" });
  }
};

// src/light/light.js
var light_default = {
  type: "cobalt:light",
  // the inputs and outputs to this node
  refs: [
    { name: "in", type: "textureView", format: "rgba16float", access: "read" },
    { name: "out", type: "textureView", format: "rgba16float", access: "write" }
  ],
  // cobalt event handling functions
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init9(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
    draw9(cobalt, node, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, node) {
    destroy7(node);
  },
  onResize: function(cobalt, node) {
    resize4(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
    node.data.viewport.setTopLeft(...cobalt.viewport.position);
  },
  // optional
  customFunctions: {
    ...public_api_exports2
  }
};
async function init9(cobalt, node) {
  const { device } = cobalt;
  const MAX_LIGHT_COUNT = 256;
  const MAX_LIGHT_SIZE = 256;
  const lightsBuffer = new LightsBuffer(device, MAX_LIGHT_COUNT);
  const viewport = new Viewport({
    viewportSize: {
      width: cobalt.viewport.width,
      height: cobalt.viewport.height
    },
    center: cobalt.viewport.position,
    zoom: cobalt.viewport.zoom
  });
  const lightsRenderer = new LightsRenderer({
    device,
    albedo: {
      view: node.refs.in.data.view,
      sampler: node.refs.in.data.sampler
    },
    targetTexture: node.refs.out.data.texture,
    lightsBuffer,
    lightsTextureProperties: {
      resolutionPerLight: MAX_LIGHT_SIZE,
      maxLightSize: MAX_LIGHT_SIZE,
      antialiased: false,
      filtering: "nearest",
      textureFormat: getPreferredFormat(cobalt)
    }
  });
  return {
    lightsBuffer,
    lightsBufferNeedsUpdate: true,
    lightsTextureNeedsUpdate: true,
    lightsRenderer,
    viewport,
    lights: []
  };
}
function draw9(cobalt, node, commandEncoder) {
  if (node.data.lightsBufferNeedsUpdate) {
    const lightsBuffer = node.data.lightsBuffer;
    lightsBuffer.setLights(node.data.lights);
    node.data.lightsBufferNeedsUpdate = false;
    node.data.lightsTextureNeedsUpdate = true;
  }
  const lightsRenderer = node.data.lightsRenderer;
  if (node.data.lightsTextureNeedsUpdate) {
    lightsRenderer.computeLightsTexture(commandEncoder);
    node.data.lightsTextureNeedsUpdate = false;
  }
  const renderpass = commandEncoder.beginRenderPass({
    label: "light",
    colorAttachments: [
      {
        view: node.refs.out.data.view,
        clearValue: cobalt.clearValue,
        loadOp: "load",
        storeOp: "store"
      }
    ]
  });
  node.data.viewport.setZoom(cobalt.viewport.zoom);
  const invertVpMatrix = node.data.viewport.invertViewProjectionMatrix;
  lightsRenderer.render(renderpass, invertVpMatrix);
  renderpass.end();
}
function destroy7(node) {
  node.data.lightsBuffer.destroy();
  node.data.lightsRenderer.destroy();
}
function resize4(cobalt, node) {
  node.data.lightsRenderer.setAlbedo({
    view: node.refs.in.data.view,
    sampler: node.refs.in.data.sampler
  });
  node.data.viewport.setViewportSize(cobalt.viewport.width, cobalt.viewport.height);
}

// src/sprite2/public-api.js
var public_api_exports3 = {};
__export(public_api_exports3, {
  addSprite: () => addSprite2,
  clear: () => clear2,
  removeSprite: () => removeSprite2,
  setSpriteName: () => setSpriteName2,
  setSpriteOpacity: () => setSpriteOpacity2,
  setSpritePosition: () => setSpritePosition2,
  setSpriteRotation: () => setSpriteRotation2,
  setSpriteScale: () => setSpriteScale2,
  setSpriteTint: () => setSpriteTint2
});
function addSprite2(cobalt, renderPass, name, position, scale, tint, opacity, rotation) {
  renderPass.data.sprites.push({
    position,
    sizeX: 1,
    sizeY: 1,
    scale: scale[0],
    rotation,
    opacity,
    tint,
    spriteID: renderPass.data.idByName.get(name),
    id: _uuid()
  });
  return renderPass.data.sprites.at(-1).id;
}
function removeSprite2(cobalt, renderPass, id) {
  for (let i = 0; i < renderPass.data.sprites.length; i++) {
    if (renderPass.data.sprites[i].id === id) {
      renderPass.data.sprites.splice(i, 1);
      return;
    }
  }
}
function clear2(cobalt, renderPass) {
  renderPass.data.sprites.length = 0;
}
function setSpriteName2(cobalt, renderPass, id, name) {
  const sprite = renderPass.data.sprites.find((s) => s.id === id);
  if (!sprite)
    return;
  sprite.spriteId = renderPass.data.idByName.get(name);
}
function setSpritePosition2(cobalt, renderPass, id, position) {
  const sprite = renderPass.data.sprites.find((s) => s.id === id);
  if (!sprite)
    return;
  vec2.copy(position, sprite.position);
}
function setSpriteTint2(cobalt, renderPass, id, tint) {
  const sprite = renderPass.data.sprites.find((s) => s.id === id);
  if (!sprite)
    return;
  sprite.tint = tint;
}
function setSpriteOpacity2(cobalt, renderPass, id, opacity) {
  const sprite = renderPass.data.sprites.find((s) => s.id === id);
  if (!sprite)
    return;
  sprite.opacity = opacity;
}
function setSpriteRotation2(cobalt, renderPass, id, rotation) {
  const sprite = renderPass.data.sprites.find((s) => s.id === id);
  if (!sprite)
    return;
  sprite.rotation = rotation;
}
function setSpriteScale2(cobalt, renderPass, id, scale) {
  const sprite = renderPass.data.sprites.find((s) => s.id === id);
  if (!sprite)
    return;
  sprite.scale = scale;
}

// src/sprite2/sprite.wgsl
var sprite_default2 = `struct ViewParams{view:mat4x4<f32>,proj:mat4x4<f32>};@group(0)@binding(0)var<uniform> uView:ViewParams;@group(0)@binding(1)var uSampler:sampler;@group(0)@binding(2)var uTex:texture_2d<f32>;struct SpriteDesc{uvOrigin:vec2<f32>,uvSpan:vec2<f32>,frameSize:vec2<f32>,centerOffset:vec2<f32>,};@group(0)@binding(3)var<storage,read>Sprites:array<SpriteDesc>;@group(0)@binding(4)var emissiveTexture:texture_2d<f32>;struct VSOut{@builtin(position)pos:vec4<f32>,@location(0)uv:vec2<f32>,@location(1)tint:vec4<f32>,@location(2)opacity:f32,};const corners=array<vec2<f32>,4>(vec2<f32>(-0.5,-0.5),vec2<f32>(0.5,-0.5),vec2<f32>(-0.5,0.5),vec2<f32>(0.5,0.5),);const uvBase=array<vec2<f32>,4>(vec2<f32>(0.0,0.0),vec2<f32>(1.0,0.0),vec2<f32>(0.0,1.0),vec2<f32>(1.0,1.0),);struct GBufferOutput{@location(0)color:vec4<f32>,@location(1)emissive:vec4<f32>,}@vertex fn vs_main(@builtin(vertex_index)vid:u32,@location(0)i_pos:vec2<f32>,@location(1)i_size:vec2<f32>,@location(2)i_scale_rot:vec2<f32>,@location(3)i_tint:vec4<f32>,@location(4)i_spriteId:u32,@location(5)i_opacity:f32,)->VSOut{let sc=i_scale_rot.x;let rot=i_scale_rot.y;let c=cos(rot);let s=sin(rot);let d=Sprites[i_spriteId];let corner=corners[vid];let sizePx=d.frameSize*i_size;var local=corner*sizePx*sc;local+=d.centerOffset*sc;let rotated=vec2<f32>(local.x*c-local.y*s,local.x*s+local.y*c);let world=vec4<f32>(rotated+i_pos,0.0,1.0);var out:VSOut;out.pos=uView.proj*uView.view*world;out.uv=d.uvOrigin+d.uvSpan*uvBase[vid];out.tint=i_tint;out.opacity=i_opacity;return out;}@fragment fn fs_main(in:VSOut)->GBufferOutput{var output:GBufferOutput;let texel=textureSample(uTex,uSampler,in.uv);output.color=vec4<f32>(texel.rgb*(1.0-in.tint.a)+(in.tint.rgb*in.tint.a),texel.a*in.opacity);let emissive=textureSample(emissiveTexture,uSampler,in.uv);output.emissive=vec4(emissive.rgb,1.0)*emissive.a;return output;}`;

// src/sprite2/sprite.js
var INSTANCE_STRIDE = 48;
var OFF_POS = 0;
var OFF_SIZE = 8;
var OFF_SCALEROT = 16;
var OFF_SPRITEID = 24;
var OFF_OPACITY = 28;
var OFF_TINT = 32;
var sprite_default3 = {
  type: "cobalt:sprite2",
  refs: [
    { name: "spritesheet", type: "customResource", access: "read" },
    {
      name: "hdr",
      type: "textureView",
      format: "rgba16float",
      access: "write"
    },
    {
      name: "emissive",
      type: "textureView",
      format: "rgba16float",
      access: "write"
    }
  ],
  // cobalt event handling functions
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init10(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
    draw10(cobalt, node, webGpuCommandEncoder);
  },
  onDestroy: function(cobalt, node) {
  },
  onResize: function(cobalt, node) {
  },
  onViewportPosition: function(cobalt, node) {
  },
  // optional
  customFunctions: {
    ...public_api_exports3
  }
};
async function init10(cobalt, nodeData) {
  const { device } = cobalt;
  const { descs, names } = buildSpriteTableFromTP(nodeData.refs.spritesheet.data.spritesheet.rawJson);
  const BYTES_PER_DESC = 8 * 4;
  const buf = new ArrayBuffer(BYTES_PER_DESC * descs.length);
  const f32 = new Float32Array(buf);
  for (let i = 0; i < descs.length; i++) {
    const d = descs[i];
    const base = i * 8;
    f32[base + 0] = d.UvOrigin[0];
    f32[base + 1] = d.UvOrigin[1];
    f32[base + 2] = d.UvSpan[0];
    f32[base + 3] = d.UvSpan[1];
    f32[base + 4] = d.FrameSize[0];
    f32[base + 5] = d.FrameSize[1];
    f32[base + 6] = d.CenterOffset[0];
    f32[base + 7] = d.CenterOffset[1];
  }
  const spriteBuf = device.createBuffer({
    label: "sprite2 desc table",
    size: Math.max(16, buf.byteLength),
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });
  device.queue.writeBuffer(spriteBuf, 0, buf);
  const idByName = new Map(names.map((n, i) => [n, i]));
  const uniformBuf = nodeData.refs.spritesheet.data.uniformBuffer;
  const instanceCap = 1024;
  const instanceBuf = device.createBuffer({
    label: "sprite2 instances",
    size: INSTANCE_STRIDE * instanceCap,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  });
  const instanceStaging = new ArrayBuffer(INSTANCE_STRIDE * instanceCap);
  const instanceView = new DataView(instanceStaging);
  const shader = device.createShaderModule({ code: sprite_default2 });
  const bgl = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" }
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: { type: "filtering" }
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: "float" }
      },
      {
        binding: 3,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "read-only-storage" }
      },
      {
        binding: 4,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: "float" }
      }
    ]
  });
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bgl]
  });
  const instLayout = {
    arrayStride: INSTANCE_STRIDE,
    stepMode: "instance",
    attributes: [
      { shaderLocation: 0, offset: OFF_POS, format: "float32x2" },
      { shaderLocation: 1, offset: OFF_SIZE, format: "float32x2" },
      { shaderLocation: 2, offset: OFF_SCALEROT, format: "float32x2" },
      { shaderLocation: 3, offset: OFF_TINT, format: "float32x4" },
      { shaderLocation: 4, offset: OFF_SPRITEID, format: "uint32" },
      { shaderLocation: 5, offset: OFF_OPACITY, format: "float32" }
    ]
  };
  const pipeline = device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module: shader,
      entryPoint: "vs_main",
      buffers: [instLayout]
    },
    fragment: {
      module: shader,
      entryPoint: "fs_main",
      targets: [
        // color
        {
          format: "rgba16float",
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha"
            },
            alpha: {
              srcFactor: "zero",
              dstFactor: "one"
            }
          }
        },
        // emissive
        {
          format: "rgba16float"
        }
      ]
    },
    primitive: { topology: "triangle-strip", cullMode: "none" },
    multisample: { count: 1 }
  });
  const bindGroupLayout = bgl;
  const bindGroup = device.createBindGroup({
    layout: bgl,
    entries: [
      { binding: 0, resource: { buffer: uniformBuf } },
      { binding: 1, resource: nodeData.refs.spritesheet.data.colorTexture.sampler },
      { binding: 2, resource: nodeData.refs.spritesheet.data.colorTexture.view },
      { binding: 3, resource: { buffer: spriteBuf } },
      { binding: 4, resource: nodeData.refs.spritesheet.data.emissiveTexture.view }
    ]
  });
  return {
    sprites: [],
    spriteBuf,
    spriteDescs: descs,
    instanceCap,
    instanceView,
    instanceBuf,
    instanceStaging,
    pipeline,
    bindGroup,
    idByName
  };
}
function ensureCapacity(cobalt, node, nInstances) {
  const { instanceCap } = node.data;
  if (nInstances <= instanceCap)
    return;
  let newCap = instanceCap;
  if (newCap === 0)
    newCap = 1024;
  while (newCap < nInstances)
    newCap *= 2;
  node.data.instanceBuf.destroy();
  node.data.instanceBuf = cobalt.device.createBuffer({
    size: INSTANCE_STRIDE * newCap,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  });
  node.data.instanceStaging = new ArrayBuffer(INSTANCE_STRIDE * newCap);
  node.data.instanceView = new DataView(node.data.instanceStaging);
  node.data.instanceCap = newCap;
}
function draw10(cobalt, node, commandEncoder) {
  const { device, context } = cobalt;
  const { instanceView, instanceBuf, instanceStaging, pipeline, bindGroup } = node.data;
  const viewRect = {
    x: cobalt.viewport.position[0],
    y: cobalt.viewport.position[1],
    w: cobalt.viewport.width,
    h: cobalt.viewport.height
  };
  const visible = [];
  for (const s of node.data.sprites) {
    const d = node.data.spriteDescs[s.spriteID];
    if (!d)
      continue;
    const sc = s.scale ?? 1;
    const sx = d.FrameSize[0] * (s.sizeX ?? 1) * sc * 0.5;
    const sy = d.FrameSize[1] * (s.sizeY ?? 1) * sc * 0.5;
    const rad = Math.hypot(sx, sy);
    const x = s.position[0], y = s.position[1];
    if (x + rad < viewRect.x || x - rad > viewRect.x + viewRect.w || y + rad < viewRect.y || y - rad > viewRect.y + viewRect.h) {
      console.log("wooo nice off screen!", s.id);
      continue;
    }
    visible.push(s);
  }
  ensureCapacity(cobalt, node, visible.length);
  for (let i = 0; i < visible.length; i++) {
    const base = i * INSTANCE_STRIDE;
    const s = visible[i];
    const tint = s.tint || [1, 1, 1, 1];
    const sizeX = s.sizeX, sizeY = s.sizeY;
    const scale = s.scale, rot = s.rotation;
    instanceView.setFloat32(base + OFF_POS + 0, s.position[0], true);
    instanceView.setFloat32(base + OFF_POS + 4, s.position[1], true);
    instanceView.setFloat32(base + OFF_SIZE + 0, sizeX, true);
    instanceView.setFloat32(base + OFF_SIZE + 4, sizeY, true);
    instanceView.setFloat32(base + OFF_SCALEROT + 0, scale, true);
    instanceView.setFloat32(base + OFF_SCALEROT + 4, rot, true);
    instanceView.setFloat32(base + OFF_TINT + 0, tint[0], true);
    instanceView.setFloat32(base + OFF_TINT + 4, tint[1], true);
    instanceView.setFloat32(base + OFF_TINT + 8, tint[2], true);
    instanceView.setFloat32(base + OFF_TINT + 12, tint[3], true);
    instanceView.setUint32(base + OFF_SPRITEID, s.spriteID >>> 0, true);
    instanceView.setFloat32(base + OFF_OPACITY, s.opacity, true);
  }
  device.queue.writeBuffer(instanceBuf, 0, instanceStaging, 0, visible.length * INSTANCE_STRIDE);
  const loadOp = node.options.loadOp || "load";
  const pass = commandEncoder.beginRenderPass({
    label: "sprite2 renderpass",
    colorAttachments: [
      // color
      {
        view: node.refs.hdr.data.view,
        clearValue: cobalt.clearValue,
        loadOp,
        storeOp: "store"
      },
      // emissive
      {
        view: node.refs.emissive.data.view,
        clearValue: cobalt.clearValue,
        loadOp: "clear",
        storeOp: "store"
      }
    ]
  });
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.setVertexBuffer(0, instanceBuf);
  pass.draw(4, visible.length, 0, 0);
  pass.end();
}
function buildSpriteTableFromTP(doc) {
  const atlasW = doc.meta.size.w;
  const atlasH = doc.meta.size.h;
  const names = Object.keys(doc.frames).sort();
  const descs = new Array(names.length);
  for (let i = 0; i < names.length; i++) {
    const fr = doc.frames[names[i]];
    const fx = fr.frame.x, fy = fr.frame.y, fw = fr.frame.w, fh = fr.frame.h;
    const offX = fx / atlasW, offY = fy / atlasH;
    const spanX = fw / atlasW, spanY = fh / atlasH;
    const sw = fr.sourceSize.w, sh = fr.sourceSize.h;
    const ox = fr.spriteSourceSize.x, oy = fr.spriteSourceSize.y;
    const cx = ox + fw * 0.5 - sw * 0.5;
    const cy = oy + fh * 0.5 - sh * 0.5;
    descs[i] = {
      UvOrigin: [offX, offY],
      UvSpan: [spanX, spanY],
      FrameSize: [fw, fh],
      CenterOffset: [cx, cy]
    };
  }
  return { descs, names };
}

// src/tile/tile.wgsl
var tile_default2 = `struct TransformData{viewOffset:vec2<f32>,viewportSize:vec2<f32>,inverseAtlasTextureSize:vec2<f32>,tileSize:f32,inverseTileSize:f32,};struct TileScroll{scrollScale:vec2<f32>};const positions=array<vec2<f32>,3>(vec2<f32>(-1.0,-3.0),vec2<f32>(3.0,1.0),vec2<f32>(-1.0,1.0));const uvs=array<vec2<f32>,3>(vec2<f32>(0.0,2.0),vec2<f32>(2.0,0.0),vec2<f32>(0.0,0.0));@binding(0)@group(0)var<uniform> myScroll:TileScroll;@binding(1)@group(0)var tileTexture:texture_2d<f32>;@binding(2)@group(0)var tileSampler:sampler;@binding(0)@group(1)var<uniform> transformUBO:TransformData;@binding(1)@group(1)var atlasTexture:texture_2d<f32>;@binding(2)@group(1)var atlasSampler:sampler;struct Fragment{@builtin(position)Position:vec4<f32>,@location(0)TexCoord:vec2<f32>};@vertex fn vs_main(@builtin(instance_index)i_id:u32,@builtin(vertex_index)VertexIndex:u32)->Fragment{var vertexPosition=vec2<f32>(positions[VertexIndex]);var vertexTexCoord=vec2<f32>(uvs[VertexIndex]);var output:Fragment;let inverseTileTextureSize=1/vec2<f32>(textureDimensions(tileTexture,0));var scrollScale=myScroll.scrollScale;var viewOffset:vec2<f32>=transformUBO.viewOffset*scrollScale;let PixelCoord=(vertexTexCoord*transformUBO.viewportSize)+viewOffset;output.TexCoord=PixelCoord/transformUBO.tileSize;output.Position=vec4<f32>(vertexPosition,0.0,1.0);return output;}@fragment fn fs_main(@location(0)TexCoord:vec2<f32>)->@location(0)vec4<f32>{var tilemapCoord=floor(TexCoord);var u_tilemapSize=vec2<f32>(textureDimensions(tileTexture,0));var tileFoo=fract((tilemapCoord+vec2<f32>(0.5,0.5))/u_tilemapSize);var tile=floor(textureSample(tileTexture,tileSampler,tileFoo)*255.0);if(tile.x==255&&tile.y==255){discard;}var u_tilesetSize=vec2<f32>(textureDimensions(atlasTexture,0))/transformUBO.tileSize;let u_tileUVMinBounds=vec2<f32>(0.5/transformUBO.tileSize,0.5/transformUBO.tileSize);let u_tileUVMaxBounds=vec2<f32>((transformUBO.tileSize-0.5)/transformUBO.tileSize,(transformUBO.tileSize-0.5)/transformUBO.tileSize);var texcoord=clamp(fract(TexCoord),u_tileUVMinBounds,u_tileUVMaxBounds);var tileCoord=(tile.xy+texcoord)/u_tilesetSize;var color=textureSample(atlasTexture,atlasSampler,tileCoord);if(color.a<=0.1){discard;}return color;}`;

// src/tile/atlas.js
var _buf = new Float32Array(8);
var atlas_default = {
  type: "cobalt:tileAtlas",
  refs: [],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init11(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
  },
  onDestroy: function(cobalt, node) {
    destroy8(data);
  },
  onResize: function(cobalt, node) {
    _writeTileBuffer(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
    _writeTileBuffer(cobalt, node);
  }
};
async function init11(cobalt, nodeData) {
  const { canvas, device } = cobalt;
  const format = nodeData.options.format || "rgba8unorm";
  let atlasMaterial;
  if (canvas) {
    atlasMaterial = await createTextureFromUrl(cobalt, "tile atlas", nodeData.options.textureUrl, format);
  } else {
    atlasMaterial = await createTextureFromBuffer(cobalt, "tile atlas", nodeData.options.texture, format);
  }
  const uniformBuffer = device.createBuffer({
    size: 32,
    //32 + (16 * 32), // in bytes.  32 for common data + (32 max tile layers * 16 bytes per tile layer)
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  const atlasBindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: {}
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {}
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {}
      }
    ]
  });
  const atlasBindGroup = device.createBindGroup({
    layout: atlasBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer
        }
      },
      {
        binding: 1,
        resource: atlasMaterial.view
      },
      {
        binding: 2,
        resource: atlasMaterial.sampler
      }
    ]
  });
  const tileBindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: {}
      },
      {
        binding: 1,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        texture: {}
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {}
      }
    ]
  });
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [tileBindGroupLayout, atlasBindGroupLayout]
  });
  const pipeline = device.createRenderPipeline({
    label: "tileatlas",
    vertex: {
      module: device.createShaderModule({
        code: tile_default2
      }),
      entryPoint: "vs_main",
      buffers: []
    },
    fragment: {
      module: device.createShaderModule({
        code: tile_default2
      }),
      entryPoint: "fs_main",
      targets: [
        {
          format: "rgba16float",
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha"
            },
            alpha: {
              srcFactor: "zero",
              dstFactor: "one"
            }
          }
        }
      ]
    },
    primitive: {
      topology: "triangle-list"
    },
    layout: pipelineLayout
  });
  return {
    pipeline,
    uniformBuffer,
    atlasBindGroup,
    // tile atlas texture, transform UBO
    atlasMaterial,
    tileBindGroupLayout,
    tileSize: nodeData.options.tileSize,
    tileScale: nodeData.options.tileScale
  };
}
function destroy8(data2) {
  data2.atlasMaterial.texture.destroy();
  data2.atlasMaterial.texture = void 0;
}
function _writeTileBuffer(c, nodeData) {
  _buf[0] = c.viewport.position[0];
  _buf[1] = c.viewport.position[1];
  const tile = nodeData.data;
  const { tileScale, tileSize } = tile;
  const GAME_WIDTH = c.viewport.width / c.viewport.zoom;
  const GAME_HEIGHT = c.viewport.height / c.viewport.zoom;
  _buf[2] = GAME_WIDTH / tileScale;
  _buf[3] = GAME_HEIGHT / tileScale;
  _buf[4] = 1 / tile.atlasMaterial.texture.width;
  _buf[5] = 1 / tile.atlasMaterial.texture.height;
  _buf[6] = tileSize;
  _buf[7] = 1 / tileSize;
  c.device.queue.writeBuffer(tile.uniformBuffer, 0, _buf, 0, 8);
}

// src/sprite/read-spritesheet.js
function readSpriteSheet(spritesheetJson) {
  const spriteFloatCount = 4 * 6;
  const spriteCount = Object.keys(spritesheetJson.frames).length;
  const vertices = new Float32Array(spriteCount * spriteFloatCount);
  const locations = [];
  const spriteMeta = {};
  let i = 0;
  for (const frameName in spritesheetJson.frames) {
    const frame = spritesheetJson.frames[frameName];
    locations.push(frameName);
    spriteMeta[frameName] = frame.sourceSize;
    const minX = -0.5 + frame.spriteSourceSize.x / frame.sourceSize.w;
    const minY = -0.5 + frame.spriteSourceSize.y / frame.sourceSize.h;
    const maxX = -0.5 + (frame.spriteSourceSize.x + frame.spriteSourceSize.w) / frame.sourceSize.w;
    const maxY = -0.5 + (frame.spriteSourceSize.y + frame.spriteSourceSize.h) / frame.sourceSize.h;
    const p0 = [minX, minY];
    const p1 = [minX, maxY];
    const p2 = [maxX, maxY];
    const p3 = [maxX, minY];
    const minU = 0 + frame.frame.x / spritesheetJson.meta.size.w;
    const minV = 0 + frame.frame.y / spritesheetJson.meta.size.h;
    const maxU = 0 + (frame.frame.x + frame.frame.w) / spritesheetJson.meta.size.w;
    const maxV = 0 + (frame.frame.y + frame.frame.h) / spritesheetJson.meta.size.h;
    const uv0 = [minU, minV];
    const uv1 = [minU, maxV];
    const uv2 = [maxU, maxV];
    const uv3 = [maxU, minV];
    vertices.set(p0, i);
    vertices.set(uv0, i + 2);
    vertices.set(p1, i + 4);
    vertices.set(uv1, i + 6);
    vertices.set(p2, i + 8);
    vertices.set(uv2, i + 10);
    vertices.set(p0, i + 12);
    vertices.set(uv0, i + 14);
    vertices.set(p2, i + 16);
    vertices.set(uv2, i + 18);
    vertices.set(p3, i + 20);
    vertices.set(uv3, i + 22);
    i += spriteFloatCount;
  }
  return {
    /*spriteCount, */
    spriteMeta,
    locations,
    vertices,
    rawJson: spritesheetJson
  };
}

// src/sprite/sprite.wgsl
var sprite_default4 = `struct TransformData{view:mat4x4<f32>,projection:mat4x4<f32>};struct Sprite{translate:vec2<f32>,scale:vec2<f32>,tint:vec4<f32>,opacity:f32,rotation:f32,emissiveIntensity:f32,sortValue:f32,};struct SpritesBuffer{models:array<Sprite>,};@binding(0)@group(0)var<uniform> transformUBO:TransformData;@binding(1)@group(0)var myTexture:texture_2d<f32>;@binding(2)@group(0)var mySampler:sampler;@binding(3)@group(0)var<storage,read>sprites:SpritesBuffer;@binding(4)@group(0)var emissiveTexture:texture_2d<f32>;struct Fragment{@builtin(position)Position:vec4<f32>,@location(0)TexCoord:vec2<f32>,@location(1)Tint:vec4<f32>,@location(2)Opacity:f32,};struct GBufferOutput{@location(0)color:vec4<f32>,@location(1)emissive:vec4<f32>,}@vertex fn vs_main(@builtin(instance_index)i_id:u32,@location(0)vertexPosition:vec2<f32>,@location(1)vertexTexCoord:vec2<f32>)->Fragment{var output:Fragment;var sx:f32=sprites.models[i_id].scale.x;var sy:f32=sprites.models[i_id].scale.y;var sz:f32=1.0;var rot:f32=sprites.models[i_id].rotation;var tx:f32=sprites.models[i_id].translate.x;var ty:f32=sprites.models[i_id].translate.y;var tz:f32=0;var s=sin(rot);var c=cos(rot);var scaleM:mat4x4<f32>=mat4x4<f32>(sx,0.0,0.0,0.0,0.0,sy,0.0,0.0,0.0,0.0,sz,0.0,0,0,0,1.0);var modelM:mat4x4<f32>=mat4x4<f32>(c,s,0.0,0.0,-s,c,0.0,0.0,0.0,0.0,1.0,0.0,tx,ty,tz,1.0)*scaleM;output.Position=transformUBO.projection*transformUBO.view*modelM*vec4<f32>(vertexPosition,0.0,1.0);output.TexCoord=vertexTexCoord;output.Tint=sprites.models[i_id].tint;output.Opacity=sprites.models[i_id].opacity;return output;}@fragment fn fs_main(@location(0)TexCoord:vec2<f32>,@location(1)Tint:vec4<f32>,@location(2)Opacity:f32)->GBufferOutput{var output:GBufferOutput;var outColor:vec4<f32>=textureSample(myTexture,mySampler,TexCoord);output.color=vec4<f32>(outColor.rgb*(1.0-Tint.a)+(Tint.rgb*Tint.a),outColor.a*Opacity);let emissive=textureSample(emissiveTexture,mySampler,TexCoord);output.emissive=vec4(emissive.rgb,1.0)*emissive.a;return output;}`;

// src/sprite/spritesheet.js
var _tmpVec33 = vec3.create(0, 0, 0);
var spritesheet_default = {
  type: "cobalt:spritesheet",
  refs: [],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init12(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
  },
  onDestroy: function(cobalt, node) {
    destroy9(node);
  },
  onResize: function(cobalt, node) {
    _writeSpriteBuffer(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
    _writeSpriteBuffer(cobalt, node);
  }
};
async function init12(cobalt, node) {
  const { canvas, device } = cobalt;
  let spritesheet, colorTexture, emissiveTexture;
  const format = node.options.format || "rgba8unorm";
  if (canvas) {
    spritesheet = await fetchJson(node.options.spriteSheetJsonUrl);
    spritesheet = readSpriteSheet(spritesheet);
    colorTexture = await createTextureFromUrl(cobalt, "sprite", node.options.colorTextureUrl, format);
    emissiveTexture = await createTextureFromUrl(cobalt, "emissive sprite", node.options.emissiveTextureUrl, format);
    canvas.style.imageRendering = "pixelated";
  } else {
    spritesheet = readSpriteSheet(node.options.spriteSheetJson);
    colorTexture = await createTextureFromBuffer(cobalt, "sprite", node.options.colorTexture, format);
    emissiveTexture = await createTextureFromBuffer(cobalt, "emissive sprite", node.options.emissiveTexture, format);
  }
  const quads = createSpriteQuads(device, spritesheet);
  const uniformBuffer = device.createBuffer({
    size: 64 * 2,
    // 4x4 matrix with 4 bytes per float32, times 2 matrices (view, projection)
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: {}
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {}
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {}
      },
      {
        binding: 3,
        visibility: GPUShaderStage.VERTEX,
        buffer: {
          type: "read-only-storage"
        }
      },
      {
        binding: 4,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {}
      }
    ]
  });
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
  });
  const pipeline = device.createRenderPipeline({
    label: "spritesheet",
    vertex: {
      module: device.createShaderModule({
        code: sprite_default4
      }),
      entryPoint: "vs_main",
      buffers: [quads.bufferLayout]
    },
    fragment: {
      module: device.createShaderModule({
        code: sprite_default4
      }),
      entryPoint: "fs_main",
      targets: [
        // color
        {
          format: "rgba16float",
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha"
            },
            alpha: {
              srcFactor: "zero",
              dstFactor: "one"
            }
          }
        },
        // emissive
        {
          format: "rgba16float"
        }
      ]
    },
    primitive: {
      topology: "triangle-list"
    },
    layout: pipelineLayout
  });
  return {
    pipeline,
    uniformBuffer,
    // perspective and view matrices for the camera
    quads,
    colorTexture,
    emissiveTexture,
    bindGroupLayout,
    spritesheet
  };
}
function destroy9(node) {
  node.data.quads.buffer.destroy();
  node.data.colorTexture.buffer.destroy();
  node.data.uniformBuffer.destroy();
  node.data.emissiveTexture.texture.destroy();
}
async function fetchJson(url) {
  const raw = await fetch(url);
  return raw.json();
}
function _writeSpriteBuffer(cobalt, node) {
  const { device, viewport } = cobalt;
  const GAME_WIDTH = viewport.width / viewport.zoom;
  const GAME_HEIGHT = viewport.height / viewport.zoom;
  const projection = mat4.ortho(0, GAME_WIDTH, GAME_HEIGHT, 0, -10, 10);
  vec3.set(-round(viewport.position[0]), -round(viewport.position[1]), 0, _tmpVec33);
  const view = mat4.translation(_tmpVec33);
  device.queue.writeBuffer(node.data.uniformBuffer, 0, view.buffer);
  device.queue.writeBuffer(node.data.uniformBuffer, 64, projection.buffer);
}

// src/fb-texture/fb-texture.js
var fb_texture_default = {
  type: "fbTexture",
  refs: [],
  // @params Object cobalt renderer world object
  // @params Object options optional data passed when initing this node
  onInit: async function(cobalt, options = {}) {
    return init13(cobalt, options);
  },
  onRun: function(cobalt, node, webGpuCommandEncoder) {
  },
  onDestroy: function(cobalt, node) {
    destroy10(data);
  },
  onResize: function(cobalt, node) {
    resize5(cobalt, node);
  },
  onViewportPosition: function(cobalt, node) {
  }
};
async function init13(cobalt, node) {
  const { device } = cobalt;
  node.options.format = node.options.format === "PREFERRED_TEXTURE_FORMAT" ? getPreferredFormat(cobalt) : node.options.format;
  const { format, label, mip_count, usage, viewportScale } = node.options;
  return createTexture(device, label, cobalt.viewport.width * viewportScale, cobalt.viewport.height * viewportScale, mip_count, format, usage);
}
function destroy10(node) {
  node.data.texture.destroy();
}
function resize5(cobalt, node) {
  const { device } = cobalt;
  destroy10(node);
  const { width, height } = cobalt.viewport;
  const { options } = node;
  const scale = node.options.viewportScale;
  node.data = createTexture(device, options.label, width * scale, height * scale, options.mip_count, options.format, options.usage);
}

// src/cobalt.js
async function init14(ctx, viewportWidth, viewportHeight) {
  let device, gpu, context, canvas;
  if (ctx.sdlWindow && ctx.gpu) {
    gpu = ctx.gpu;
    const instance = gpu.create(["verbose=1", "enable-dawn-features=allow_unsafe_apis"]);
    const adapter = await instance.requestAdapter();
    device = await adapter.requestDevice({
      requiredFeatures: ["texture-component-swizzle"]
    });
    context = gpu.renderGPUDeviceToWindow({ device, window: ctx.sdlWindow });
    global.GPUBufferUsage = gpu.GPUBufferUsage;
    global.GPUShaderStage = gpu.GPUShaderStage;
    global.GPUTextureUsage = gpu.GPUTextureUsage;
  } else {
    canvas = ctx;
    const adapter = await navigator.gpu?.requestAdapter({ powerPreference: "high-performance" });
    device = await adapter?.requestDevice();
    gpu = navigator.gpu;
    context = canvas.getContext("webgpu");
    context.configure({
      device,
      format: navigator.gpu?.getPreferredCanvasFormat(),
      // bgra8unorm
      alphaMode: "opaque"
    });
  }
  const nodeDefs = {
    // built in resource nodes
    "cobalt:tileAtlas": atlas_default,
    "cobalt:spritesheet": spritesheet_default,
    "cobalt:fbTexture": fb_texture_default,
    // builtin run nodes
    "cobalt:bloom": bloom_default2,
    "cobalt:composite": scene_composite_default2,
    "cobalt:sprite": sprite_default,
    "cobalt:tile": tile_default,
    "cobalt:displacement": displacement_default2,
    "cobalt:overlay": overlay_default2,
    "cobalt:fbBlit": fb_blit_default2,
    "cobalt:primitives": primitives_default2,
    "cobalt:light": light_default,
    "cobalt:sprite2": sprite_default3
  };
  return {
    nodeDefs,
    // runnable nodes. ordering dictates render order (first to last)
    nodes: [],
    // keeps references to all node refs that need to access the per-frame default texture view
    // these refs are updated on each invocation of Cobalt.draw(...)
    defaultTextureViewRefs: [],
    canvas,
    device,
    context,
    gpu,
    // used in the color attachments of renderpass
    clearValue: { r: 0, g: 0, b: 0, a: 1 },
    viewport: {
      width: viewportWidth,
      height: viewportHeight,
      zoom: 1,
      position: [0, 0]
      // top-left corner of the viewport
    }
  };
}
function defineNode(c, nodeDefinition) {
  if (!nodeDefinition?.type)
    throw new Error(`Can't define a new node missing a type.`);
  c.nodeDefs[nodeDefinition.type] = nodeDefinition;
}
async function initNode(c, nodeData) {
  const nodeDef = c.nodeDefs[nodeData?.type];
  if (!nodeDef)
    throw new Error(`Can't initialize a new node missing a type.`);
  const node = {
    type: nodeData.type,
    refs: nodeData.refs || {},
    options: nodeData.options || {},
    data: {},
    enabled: true
    // when disabled, the node won't be run
  };
  for (const refName in node.refs) {
    if (node.refs[refName] === "FRAME_TEXTURE_VIEW") {
      c.defaultTextureViewRefs.push({ node, refName });
      node.refs[refName] = getCurrentTextureView(c);
    }
  }
  node.data = await nodeDef.onInit(c, node);
  const customFunctions = nodeDef.customFunctions || {};
  for (const fnName in customFunctions) {
    node[fnName] = function(...args) {
      return customFunctions[fnName](c, node, ...args);
    };
  }
  c.nodes.push(node);
  return node;
}
function draw11(c) {
  const { device, context } = c;
  const commandEncoder = device.createCommandEncoder();
  const v = getCurrentTextureView(c);
  for (const r of c.defaultTextureViewRefs)
    r.node.refs[r.refName] = v;
  for (const node of c.nodes) {
    if (!node.enabled)
      continue;
    const nodeDef = c.nodeDefs[node.type];
    nodeDef.onRun(c, node, commandEncoder);
  }
  device.queue.submit([commandEncoder.finish()]);
  if (!c.canvas)
    c.context.swap();
}
function reset(c) {
  for (const n of c.nodes) {
    const nodeDef = c.nodeDefs[n.type];
    nodeDef.onDestroy(c, n);
  }
  c.nodes.length = 0;
  c.defaultTextureViewRefs.length = 0;
}
function setViewportDimensions(c, width, height) {
  c.viewport.width = width;
  c.viewport.height = height;
  for (const n of c.nodes) {
    const nodeDef = c.nodeDefs[n.type];
    nodeDef.onResize(c, n);
  }
}
function setViewportPosition(c, pos) {
  c.viewport.position[0] = pos[0] - c.viewport.width / 2 / c.viewport.zoom;
  c.viewport.position[1] = pos[1] - c.viewport.height / 2 / c.viewport.zoom;
  for (const n of c.nodes) {
    const nodeDef = c.nodeDefs[n.type];
    nodeDef.onViewportPosition(c, n);
  }
}
function getCurrentTextureView(cobalt) {
  if (cobalt.canvas)
    return cobalt.context.getCurrentTexture().createView();
  else {
    return cobalt.context.getCurrentTextureView();
  }
}
export {
  createTexture,
  createTextureFromBuffer,
  createTextureFromUrl,
  defineNode,
  draw11 as draw,
  getCurrentTextureView,
  init14 as init,
  initNode,
  reset,
  setViewportDimensions,
  setViewportPosition
};
