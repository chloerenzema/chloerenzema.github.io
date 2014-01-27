
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-type/index.js", Function("exports, require, module",
"/**\n\
 * toString ref.\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Return the type of `val`.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(val){\n\
  switch (toString.call(val)) {\n\
    case '[object Date]': return 'date';\n\
    case '[object RegExp]': return 'regexp';\n\
    case '[object Arguments]': return 'arguments';\n\
    case '[object Array]': return 'array';\n\
    case '[object Error]': return 'error';\n\
  }\n\
\n\
  if (val === null) return 'null';\n\
  if (val === undefined) return 'undefined';\n\
  if (val !== val) return 'nan';\n\
  if (val && val.nodeType === 1) return 'element';\n\
\n\
  return typeof val.valueOf();\n\
};\n\
//@ sourceURL=component-type/index.js"
));
require.register("component-each/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var toFunction = require('to-function');\n\
var type;\n\
\n\
try {\n\
  type = require('type-component');\n\
} catch (e) {\n\
  type = require('type');\n\
}\n\
\n\
/**\n\
 * HOP reference.\n\
 */\n\
\n\
var has = Object.prototype.hasOwnProperty;\n\
\n\
/**\n\
 * Iterate the given `obj` and invoke `fn(val, i)`.\n\
 *\n\
 * @param {String|Array|Object} obj\n\
 * @param {Function} fn\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(obj, fn){\n\
  fn = toFunction(fn);\n\
  switch (type(obj)) {\n\
    case 'array':\n\
      return array(obj, fn);\n\
    case 'object':\n\
      if ('number' == typeof obj.length) return array(obj, fn);\n\
      return object(obj, fn);\n\
    case 'string':\n\
      return string(obj, fn);\n\
  }\n\
};\n\
\n\
/**\n\
 * Iterate string chars.\n\
 *\n\
 * @param {String} obj\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
function string(obj, fn) {\n\
  for (var i = 0; i < obj.length; ++i) {\n\
    fn(obj.charAt(i), i);\n\
  }\n\
}\n\
\n\
/**\n\
 * Iterate object keys.\n\
 *\n\
 * @param {Object} obj\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
function object(obj, fn) {\n\
  for (var key in obj) {\n\
    if (has.call(obj, key)) {\n\
      fn(key, obj[key]);\n\
    }\n\
  }\n\
}\n\
\n\
/**\n\
 * Iterate array-ish.\n\
 *\n\
 * @param {Array|Object} obj\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
function array(obj, fn) {\n\
  for (var i = 0; i < obj.length; ++i) {\n\
    fn(obj[i], i);\n\
  }\n\
}\n\
//@ sourceURL=component-each/index.js"
));
require.register("component-event/index.js", Function("exports, require, module",
"var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',\n\
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',\n\
    prefix = bind !== 'addEventListener' ? 'on' : '';\n\
\n\
/**\n\
 * Bind `el` event `type` to `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(el, type, fn, capture){\n\
  el[bind](prefix + type, fn, capture || false);\n\
\n\
  return fn;\n\
};\n\
\n\
/**\n\
 * Unbind `el` event `type`'s callback `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(el, type, fn, capture){\n\
  el[unbind](prefix + type, fn, capture || false);\n\
\n\
  return fn;\n\
};//@ sourceURL=component-event/index.js"
));
require.register("component-delegate/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var matches = require('matches-selector')\n\
  , event = require('event');\n\
\n\
/**\n\
 * Delegate event `type` to `selector`\n\
 * and invoke `fn(e)`. A callback function\n\
 * is returned which may be passed to `.unbind()`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} selector\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(el, selector, type, fn, capture){\n\
  return event.bind(el, type, function(e){\n\
    if (matches(e.target, selector)) fn(e);\n\
  }, capture);\n\
  return callback;\n\
};\n\
\n\
/**\n\
 * Unbind event `type`'s callback `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(el, type, fn, capture){\n\
  event.unbind(el, type, fn, capture);\n\
};\n\
//@ sourceURL=component-delegate/index.js"
));
require.register("component-domify/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `parse`.\n\
 */\n\
\n\
module.exports = parse;\n\
\n\
/**\n\
 * Wrap map from jquery.\n\
 */\n\
\n\
var map = {\n\
  option: [1, '<select multiple=\"multiple\">', '</select>'],\n\
  optgroup: [1, '<select multiple=\"multiple\">', '</select>'],\n\
  legend: [1, '<fieldset>', '</fieldset>'],\n\
  thead: [1, '<table>', '</table>'],\n\
  tbody: [1, '<table>', '</table>'],\n\
  tfoot: [1, '<table>', '</table>'],\n\
  colgroup: [1, '<table>', '</table>'],\n\
  caption: [1, '<table>', '</table>'],\n\
  tr: [2, '<table><tbody>', '</tbody></table>'],\n\
  td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],\n\
  th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],\n\
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],\n\
  _default: [0, '', '']\n\
};\n\
\n\
/**\n\
 * Parse `html` and return the children.\n\
 *\n\
 * @param {String} html\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function parse(html) {\n\
  if ('string' != typeof html) throw new TypeError('String expected');\n\
\n\
  // tag name\n\
  var m = /<([\\w:]+)/.exec(html);\n\
  if (!m) throw new Error('No elements were generated.');\n\
  var tag = m[1];\n\
\n\
  // body support\n\
  if (tag == 'body') {\n\
    var el = document.createElement('html');\n\
    el.innerHTML = html;\n\
    return el.removeChild(el.lastChild);\n\
  }\n\
\n\
  // wrap map\n\
  var wrap = map[tag] || map._default;\n\
  var depth = wrap[0];\n\
  var prefix = wrap[1];\n\
  var suffix = wrap[2];\n\
  var el = document.createElement('div');\n\
  el.innerHTML = prefix + html + suffix;\n\
  while (depth--) el = el.lastChild;\n\
\n\
  var els = el.children;\n\
  if (1 == els.length) {\n\
    return el.removeChild(els[0]);\n\
  }\n\
\n\
  var fragment = document.createDocumentFragment();\n\
  while (els.length) {\n\
    fragment.appendChild(el.removeChild(els[0]));\n\
  }\n\
\n\
  return fragment;\n\
}\n\
//@ sourceURL=component-domify/index.js"
));
require.register("component-indexof/index.js", Function("exports, require, module",
"module.exports = function(arr, obj){\n\
  if (arr.indexOf) return arr.indexOf(obj);\n\
  for (var i = 0; i < arr.length; ++i) {\n\
    if (arr[i] === obj) return i;\n\
  }\n\
  return -1;\n\
};//@ sourceURL=component-indexof/index.js"
));
require.register("component-classes/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var index = require('indexof');\n\
\n\
/**\n\
 * Whitespace regexp.\n\
 */\n\
\n\
var re = /\\s+/;\n\
\n\
/**\n\
 * toString reference.\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Wrap `el` in a `ClassList`.\n\
 *\n\
 * @param {Element} el\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(el){\n\
  return new ClassList(el);\n\
};\n\
\n\
/**\n\
 * Initialize a new ClassList for `el`.\n\
 *\n\
 * @param {Element} el\n\
 * @api private\n\
 */\n\
\n\
function ClassList(el) {\n\
  this.el = el;\n\
  this.list = el.classList;\n\
}\n\
\n\
/**\n\
 * Add class `name` if not already present.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.add = function(name){\n\
  // classList\n\
  if (this.list) {\n\
    this.list.add(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  var arr = this.array();\n\
  var i = index(arr, name);\n\
  if (!~i) arr.push(name);\n\
  this.el.className = arr.join(' ');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove class `name` when present, or\n\
 * pass a regular expression to remove\n\
 * any which match.\n\
 *\n\
 * @param {String|RegExp} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.remove = function(name){\n\
  if ('[object RegExp]' == toString.call(name)) {\n\
    return this.removeMatching(name);\n\
  }\n\
\n\
  // classList\n\
  if (this.list) {\n\
    this.list.remove(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  var arr = this.array();\n\
  var i = index(arr, name);\n\
  if (~i) arr.splice(i, 1);\n\
  this.el.className = arr.join(' ');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove all classes matching `re`.\n\
 *\n\
 * @param {RegExp} re\n\
 * @return {ClassList}\n\
 * @api private\n\
 */\n\
\n\
ClassList.prototype.removeMatching = function(re){\n\
  var arr = this.array();\n\
  for (var i = 0; i < arr.length; i++) {\n\
    if (re.test(arr[i])) {\n\
      this.remove(arr[i]);\n\
    }\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Toggle class `name`.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.toggle = function(name){\n\
  // classList\n\
  if (this.list) {\n\
    this.list.toggle(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  if (this.has(name)) {\n\
    this.remove(name);\n\
  } else {\n\
    this.add(name);\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return an array of classes.\n\
 *\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.array = function(){\n\
  var str = this.el.className.replace(/^\\s+|\\s+$/g, '');\n\
  var arr = str.split(re);\n\
  if ('' === arr[0]) arr.shift();\n\
  return arr;\n\
};\n\
\n\
/**\n\
 * Check if class `name` is present.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.has =\n\
ClassList.prototype.contains = function(name){\n\
  return this.list\n\
    ? this.list.contains(name)\n\
    : !! ~index(this.array(), name);\n\
};\n\
//@ sourceURL=component-classes/index.js"
));
require.register("visionmedia-debug/index.js", Function("exports, require, module",
"if ('undefined' == typeof window) {\n\
  module.exports = require('./lib/debug');\n\
} else {\n\
  module.exports = require('./debug');\n\
}\n\
//@ sourceURL=visionmedia-debug/index.js"
));
require.register("visionmedia-debug/debug.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `debug()` as the module.\n\
 */\n\
\n\
module.exports = debug;\n\
\n\
/**\n\
 * Create a debugger with the given `name`.\n\
 *\n\
 * @param {String} name\n\
 * @return {Type}\n\
 * @api public\n\
 */\n\
\n\
function debug(name) {\n\
  if (!debug.enabled(name)) return function(){};\n\
\n\
  return function(fmt){\n\
    fmt = coerce(fmt);\n\
\n\
    var curr = new Date;\n\
    var ms = curr - (debug[name] || curr);\n\
    debug[name] = curr;\n\
\n\
    fmt = name\n\
      + ' '\n\
      + fmt\n\
      + ' +' + debug.humanize(ms);\n\
\n\
    // This hackery is required for IE8\n\
    // where `console.log` doesn't have 'apply'\n\
    window.console\n\
      && console.log\n\
      && Function.prototype.apply.call(console.log, console, arguments);\n\
  }\n\
}\n\
\n\
/**\n\
 * The currently active debug mode names.\n\
 */\n\
\n\
debug.names = [];\n\
debug.skips = [];\n\
\n\
/**\n\
 * Enables a debug mode by name. This can include modes\n\
 * separated by a colon and wildcards.\n\
 *\n\
 * @param {String} name\n\
 * @api public\n\
 */\n\
\n\
debug.enable = function(name) {\n\
  try {\n\
    localStorage.debug = name;\n\
  } catch(e){}\n\
\n\
  var split = (name || '').split(/[\\s,]+/)\n\
    , len = split.length;\n\
\n\
  for (var i = 0; i < len; i++) {\n\
    name = split[i].replace('*', '.*?');\n\
    if (name[0] === '-') {\n\
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));\n\
    }\n\
    else {\n\
      debug.names.push(new RegExp('^' + name + '$'));\n\
    }\n\
  }\n\
};\n\
\n\
/**\n\
 * Disable debug output.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
debug.disable = function(){\n\
  debug.enable('');\n\
};\n\
\n\
/**\n\
 * Humanize the given `ms`.\n\
 *\n\
 * @param {Number} m\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
debug.humanize = function(ms) {\n\
  var sec = 1000\n\
    , min = 60 * 1000\n\
    , hour = 60 * min;\n\
\n\
  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';\n\
  if (ms >= min) return (ms / min).toFixed(1) + 'm';\n\
  if (ms >= sec) return (ms / sec | 0) + 's';\n\
  return ms + 'ms';\n\
};\n\
\n\
/**\n\
 * Returns true if the given mode name is enabled, false otherwise.\n\
 *\n\
 * @param {String} name\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
debug.enabled = function(name) {\n\
  for (var i = 0, len = debug.skips.length; i < len; i++) {\n\
    if (debug.skips[i].test(name)) {\n\
      return false;\n\
    }\n\
  }\n\
  for (var i = 0, len = debug.names.length; i < len; i++) {\n\
    if (debug.names[i].test(name)) {\n\
      return true;\n\
    }\n\
  }\n\
  return false;\n\
};\n\
\n\
/**\n\
 * Coerce `val`.\n\
 */\n\
\n\
function coerce(val) {\n\
  if (val instanceof Error) return val.stack || val.message;\n\
  return val;\n\
}\n\
\n\
// persist\n\
\n\
try {\n\
  if (window.localStorage) debug.enable(localStorage.debug);\n\
} catch(e){}\n\
//@ sourceURL=visionmedia-debug/debug.js"
));
require.register("ianstormtaylor-to-no-case/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `toNoCase`.\n\
 */\n\
\n\
module.exports = toNoCase;\n\
\n\
\n\
/**\n\
 * Test whether a string is camel-case.\n\
 */\n\
\n\
var hasSpace = /\\s/;\n\
var hasCamel = /[a-z][A-Z]/;\n\
var hasSeparator = /[\\W_]/;\n\
\n\
\n\
/**\n\
 * Remove any starting case from a `string`, like camel or snake, but keep\n\
 * spaces and punctuation that may be important otherwise.\n\
 *\n\
 * @param {String} string\n\
 * @return {String}\n\
 */\n\
\n\
function toNoCase (string) {\n\
  if (hasSpace.test(string)) return string.toLowerCase();\n\
\n\
  if (hasSeparator.test(string)) string = unseparate(string);\n\
  if (hasCamel.test(string)) string = uncamelize(string);\n\
  return string.toLowerCase();\n\
}\n\
\n\
\n\
/**\n\
 * Separator splitter.\n\
 */\n\
\n\
var separatorSplitter = /[\\W_]+(.|$)/g;\n\
\n\
\n\
/**\n\
 * Un-separate a `string`.\n\
 *\n\
 * @param {String} string\n\
 * @return {String}\n\
 */\n\
\n\
function unseparate (string) {\n\
  return string.replace(separatorSplitter, function (m, next) {\n\
    return next ? ' ' + next : '';\n\
  });\n\
}\n\
\n\
\n\
/**\n\
 * Camelcase splitter.\n\
 */\n\
\n\
var camelSplitter = /(.)([A-Z]+)/g;\n\
\n\
\n\
/**\n\
 * Un-camelcase a `string`.\n\
 *\n\
 * @param {String} string\n\
 * @return {String}\n\
 */\n\
\n\
function uncamelize (string) {\n\
  return string.replace(camelSplitter, function (m, previous, uppers) {\n\
    return previous + ' ' + uppers.toLowerCase().split('').join(' ');\n\
  });\n\
}//@ sourceURL=ianstormtaylor-to-no-case/index.js"
));
require.register("ianstormtaylor-to-space-case/index.js", Function("exports, require, module",
"\n\
var clean = require('to-no-case');\n\
\n\
\n\
/**\n\
 * Expose `toSpaceCase`.\n\
 */\n\
\n\
module.exports = toSpaceCase;\n\
\n\
\n\
/**\n\
 * Convert a `string` to space case.\n\
 *\n\
 * @param {String} string\n\
 * @return {String}\n\
 */\n\
\n\
\n\
function toSpaceCase (string) {\n\
  return clean(string).replace(/[\\W_]+(.|$)/g, function (matches, match) {\n\
    return match ? ' ' + match : '';\n\
  });\n\
}//@ sourceURL=ianstormtaylor-to-space-case/index.js"
));
require.register("ianstormtaylor-to-camel-case/index.js", Function("exports, require, module",
"\n\
var toSpace = require('to-space-case');\n\
\n\
\n\
/**\n\
 * Expose `toCamelCase`.\n\
 */\n\
\n\
module.exports = toCamelCase;\n\
\n\
\n\
/**\n\
 * Convert a `string` to camel case.\n\
 *\n\
 * @param {String} string\n\
 * @return {String}\n\
 */\n\
\n\
\n\
function toCamelCase (string) {\n\
  return toSpace(string).replace(/\\s(\\w)/g, function (matches, letter) {\n\
    return letter.toUpperCase();\n\
  });\n\
}//@ sourceURL=ianstormtaylor-to-camel-case/index.js"
));
require.register("component-within-document/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Check if `el` is within the document.\n\
 *\n\
 * @param {Element} el\n\
 * @return {Boolean}\n\
 * @api private\n\
 */\n\
\n\
module.exports = function(el) {\n\
  var node = el;\n\
  while (node = node.parentNode) {\n\
    if (node == document) return true;\n\
  }\n\
  return false;\n\
};//@ sourceURL=component-within-document/index.js"
));
require.register("component-css/index.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var debug = require('debug')('css');\n\
var set = require('./lib/style');\n\
var get = require('./lib/css');\n\
\n\
/**\n\
 * Expose `css`\n\
 */\n\
\n\
module.exports = css;\n\
\n\
/**\n\
 * Get and set css values\n\
 *\n\
 * @param {Element} el\n\
 * @param {String|Object} prop\n\
 * @param {Mixed} val\n\
 * @return {Element} el\n\
 * @api public\n\
 */\n\
\n\
function css(el, prop, val) {\n\
  if (!el) return;\n\
\n\
  if (undefined !== val) {\n\
    var obj = {};\n\
    obj[prop] = val;\n\
    debug('setting styles %j', obj);\n\
    return setStyles(el, obj);\n\
  }\n\
\n\
  if ('object' == typeof prop) {\n\
    debug('setting styles %j', prop);\n\
    return setStyles(el, prop);\n\
  }\n\
\n\
  debug('getting %s', prop);\n\
  return get(el, prop);\n\
}\n\
\n\
/**\n\
 * Set the styles on an element\n\
 *\n\
 * @param {Element} el\n\
 * @param {Object} props\n\
 * @return {Element} el\n\
 */\n\
\n\
function setStyles(el, props) {\n\
  for (var prop in props) {\n\
    set(el, prop, props[prop]);\n\
  }\n\
\n\
  return el;\n\
}\n\
//@ sourceURL=component-css/index.js"
));
require.register("component-css/lib/css.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var debug = require('debug')('css:css');\n\
var camelcase = require('to-camel-case');\n\
var computed = require('./computed');\n\
var property = require('./prop');\n\
\n\
/**\n\
 * Expose `css`\n\
 */\n\
\n\
module.exports = css;\n\
\n\
/**\n\
 * CSS Normal Transforms\n\
 */\n\
\n\
var cssNormalTransform = {\n\
  letterSpacing: 0,\n\
  fontWeight: 400\n\
};\n\
\n\
/**\n\
 * Get a CSS value\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} prop\n\
 * @param {Mixed} extra\n\
 * @param {Array} styles\n\
 * @return {String}\n\
 */\n\
\n\
function css(el, prop, extra, styles) {\n\
  var hooks = require('./hooks');\n\
  var orig = camelcase(prop);\n\
  var style = el.style;\n\
  var val;\n\
\n\
  prop = property(prop, style);\n\
  var hook = hooks[prop] || hooks[orig];\n\
\n\
  // If a hook was provided get the computed value from there\n\
  if (hook && hook.get) {\n\
    debug('get hook provided. use that');\n\
    val = hook.get(el, true, extra);\n\
  }\n\
\n\
  // Otherwise, if a way to get the computed value exists, use that\n\
  if (undefined == val) {\n\
    debug('fetch the computed value of %s', prop);\n\
    val = computed(el, prop);\n\
  }\n\
\n\
  if ('normal' == val && cssNormalTransform[prop]) {\n\
    val = cssNormalTransform[prop];\n\
    debug('normal => %s', val);\n\
  }\n\
\n\
  // Return, converting to number if forced or a qualifier was provided and val looks numeric\n\
  if ('' == extra || extra) {\n\
    debug('converting value: %s into a number');\n\
    var num = parseFloat(val);\n\
    return true === extra || isNumeric(num) ? num || 0 : val;\n\
  }\n\
\n\
  return val;\n\
}\n\
\n\
/**\n\
 * Is Numeric\n\
 *\n\
 * @param {Mixed} obj\n\
 * @return {Boolean}\n\
 */\n\
\n\
function isNumeric(obj) {\n\
  return !isNan(parseFloat(obj)) && isFinite(obj);\n\
}\n\
//@ sourceURL=component-css/lib/css.js"
));
require.register("component-css/lib/prop.js", Function("exports, require, module",
"/**\n\
 * Module dependencies\n\
 */\n\
\n\
var debug = require('debug')('css:prop');\n\
var camelcase = require('to-camel-case');\n\
var vendor = require('./vendor');\n\
\n\
/**\n\
 * Export `prop`\n\
 */\n\
\n\
module.exports = prop;\n\
\n\
/**\n\
 * Normalize Properties\n\
 */\n\
\n\
var cssProps = {\n\
  'float': 'cssFloat' in document.body.style ? 'cssFloat' : 'styleFloat'\n\
};\n\
\n\
/**\n\
 * Get the vendor prefixed property\n\
 *\n\
 * @param {String} prop\n\
 * @param {String} style\n\
 * @return {String} prop\n\
 * @api private\n\
 */\n\
\n\
function prop(prop, style) {\n\
  prop = cssProps[prop] || (cssProps[prop] = vendor(prop, style));\n\
  debug('transform property: %s => %s');\n\
  return prop;\n\
}\n\
//@ sourceURL=component-css/lib/prop.js"
));
require.register("component-css/lib/swap.js", Function("exports, require, module",
"/**\n\
 * Export `swap`\n\
 */\n\
\n\
module.exports = swap;\n\
\n\
/**\n\
 * Initialize `swap`\n\
 *\n\
 * @param {Element} el\n\
 * @param {Object} options\n\
 * @param {Function} fn\n\
 * @param {Array} args\n\
 * @return {Mixed}\n\
 */\n\
\n\
function swap(el, options, fn, args) {\n\
  // Remember the old values, and insert the new ones\n\
  for (var key in options) {\n\
    old[key] = el.style[key];\n\
    el.style[key] = options[key];\n\
  }\n\
\n\
  ret = fn.apply(el, args || []);\n\
\n\
  // Revert the old values\n\
  for (key in options) {\n\
    el.style[key] = old[key];\n\
  }\n\
\n\
  return ret;\n\
}\n\
//@ sourceURL=component-css/lib/swap.js"
));
require.register("component-css/lib/style.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var debug = require('debug')('css:style');\n\
var camelcase = require('to-camel-case');\n\
var support = require('./support');\n\
var property = require('./prop');\n\
var hooks = require('./hooks');\n\
\n\
/**\n\
 * Expose `style`\n\
 */\n\
\n\
module.exports = style;\n\
\n\
/**\n\
 * Possibly-unitless properties\n\
 *\n\
 * Don't automatically add 'px' to these properties\n\
 */\n\
\n\
var cssNumber = {\n\
  \"columnCount\": true,\n\
  \"fillOpacity\": true,\n\
  \"fontWeight\": true,\n\
  \"lineHeight\": true,\n\
  \"opacity\": true,\n\
  \"order\": true,\n\
  \"orphans\": true,\n\
  \"widows\": true,\n\
  \"zIndex\": true,\n\
  \"zoom\": true\n\
};\n\
\n\
/**\n\
 * Set a css value\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} prop\n\
 * @param {Mixed} val\n\
 * @param {Mixed} extra\n\
 */\n\
\n\
function style(el, prop, val, extra) {\n\
  // Don't set styles on text and comment nodes\n\
  if (!el || el.nodeType === 3 || el.nodeType === 8 || !el.style ) return;\n\
\n\
  var orig = camelcase(prop);\n\
  var style = el.style;\n\
  var type = typeof val;\n\
\n\
  if (!val) return get(el, prop, orig, extra);\n\
\n\
  prop = property(prop, style);\n\
\n\
  var hook = hooks[prop] || hooks[orig];\n\
\n\
  // If a number was passed in, add 'px' to the (except for certain CSS properties)\n\
  if ('number' == type && !cssNumber[orig]) {\n\
    debug('adding \"px\" to end of number');\n\
    val += 'px';\n\
  }\n\
\n\
  // Fixes jQuery #8908, it can be done more correctly by specifying setters in cssHooks,\n\
  // but it would mean to define eight (for every problematic property) identical functions\n\
  if (!support.clearCloneStyle && '' === val && 0 === prop.indexOf('background')) {\n\
    debug('set property (%s) value to \"inherit\"', prop);\n\
    style[prop] = 'inherit';\n\
  }\n\
\n\
  // If a hook was provided, use that value, otherwise just set the specified value\n\
  if (!hook || !hook.set || undefined !== (val = hook.set(el, val, extra))) {\n\
    // Support: Chrome, Safari\n\
    // Setting style to blank string required to delete \"style: x !important;\"\n\
    debug('set hook defined. setting property (%s) to %s', prop, val);\n\
    style[prop] = '';\n\
    style[prop] = val;\n\
  }\n\
\n\
}\n\
\n\
/**\n\
 * Get the style\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} prop\n\
 * @param {String} orig\n\
 * @param {Mixed} extra\n\
 * @return {String}\n\
 */\n\
\n\
function get(el, prop, orig, extra) {\n\
  var style = el.style;\n\
  var hook = hooks[prop] || hooks[orig];\n\
  var ret;\n\
\n\
  if (hook && hook.get && undefined !== (ret = hook.get(el, false, extra))) {\n\
    debug('get hook defined, returning: %s', ret);\n\
    return ret;\n\
  }\n\
\n\
  ret = style[prop];\n\
  debug('getting %s', ret);\n\
  return ret;\n\
}\n\
//@ sourceURL=component-css/lib/style.js"
));
require.register("component-css/lib/hooks.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var each = require('each');\n\
var css = require('./css');\n\
var cssShow = { position: 'absolute', visibility: 'hidden', display: 'block' };\n\
var pnum = (/[+-]?(?:\\d*\\.|)\\d+(?:[eE][+-]?\\d+|)/).source;\n\
var rnumnonpx = new RegExp( '^(' + pnum + ')(?!px)[a-z%]+$', 'i');\n\
var rnumsplit = new RegExp( '^(' + pnum + ')(.*)$', 'i');\n\
var rdisplayswap = /^(none|table(?!-c[ea]).+)/;\n\
var styles = require('./styles');\n\
var support = require('./support');\n\
var swap = require('./swap');\n\
var computed = require('./computed');\n\
var cssExpand = [ \"Top\", \"Right\", \"Bottom\", \"Left\" ];\n\
\n\
/**\n\
 * Height & Width\n\
 */\n\
\n\
each(['width', 'height'], function(name) {\n\
  exports[name] = {};\n\
\n\
  exports[name].get = function(el, compute, extra) {\n\
    if (!compute) return;\n\
    // certain elements can have dimension info if we invisibly show them\n\
    // however, it must have a current display style that would benefit from this\n\
    return 0 == el.offsetWidth && rdisplayswap.test(css(el, 'display'))\n\
      ? swap(el, cssShow, function() { return getWidthOrHeight(el, name, extra); })\n\
      : getWidthOrHeight(el, name, extra);\n\
  }\n\
\n\
  exports[name].set = function(el, val, extra) {\n\
    var styles = extra && styles(el);\n\
    return setPositiveNumber(el, val, extra\n\
      ? augmentWidthOrHeight(el, name, extra, 'border-box' == css(el, 'boxSizing', false, styles), styles)\n\
      : 0\n\
    );\n\
  };\n\
\n\
});\n\
\n\
/**\n\
 * Opacity\n\
 */\n\
\n\
exports.opacity = {};\n\
exports.opacity.get = function(el, compute) {\n\
  if (!compute) return;\n\
  var ret = computed(el, 'opacity');\n\
  return '' == ret ? '1' : ret;\n\
}\n\
\n\
/**\n\
 * Utility: Set Positive Number\n\
 *\n\
 * @param {Element} el\n\
 * @param {Mixed} val\n\
 * @param {Number} subtract\n\
 * @return {Number}\n\
 */\n\
\n\
function setPositiveNumber(el, val, subtract) {\n\
  var matches = rnumsplit.exec(val);\n\
  return matches ?\n\
    // Guard against undefined 'subtract', e.g., when used as in cssHooks\n\
    Math.max(0, matches[1]) + (matches[2] || 'px') :\n\
    val;\n\
}\n\
\n\
/**\n\
 * Utility: Get the width or height\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} prop\n\
 * @param {Mixed} extra\n\
 * @return {String}\n\
 */\n\
\n\
function getWidthOrHeight(el, prop, extra) {\n\
  // Start with offset property, which is equivalent to the border-box value\n\
  var valueIsBorderBox = true;\n\
  var val = prop === 'width' ? el.offsetWidth : el.offsetHeight;\n\
  var styles = computed(el);\n\
  var isBorderBox = support.boxSizing && css(el, 'boxSizing') === 'border-box';\n\
\n\
  // some non-html elements return undefined for offsetWidth, so check for null/undefined\n\
  // svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285\n\
  // MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668\n\
  if (val <= 0 || val == null) {\n\
    // Fall back to computed then uncomputed css if necessary\n\
    val = computed(el, prop, styles);\n\
\n\
    if (val < 0 || val == null) {\n\
      val = el.style[prop];\n\
    }\n\
\n\
    // Computed unit is not pixels. Stop here and return.\n\
    if (rnumnonpx.test(val)) {\n\
      return val;\n\
    }\n\
\n\
    // we need the check for style in case a browser which returns unreliable values\n\
    // for getComputedStyle silently falls back to the reliable el.style\n\
    valueIsBorderBox = isBorderBox && (support.boxSizingReliable() || val === el.style[prop]);\n\
\n\
    // Normalize ', auto, and prepare for extra\n\
    val = parseFloat(val) || 0;\n\
  }\n\
\n\
  // use the active box-sizing model to add/subtract irrelevant styles\n\
  extra = extra || (isBorderBox ? 'border' : 'content');\n\
  val += augmentWidthOrHeight(el, prop, extra, valueIsBorderBox, styles);\n\
  return val + 'px';\n\
}\n\
\n\
/**\n\
 * Utility: Augment the width or the height\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} prop\n\
 * @param {Mixed} extra\n\
 * @param {Boolean} isBorderBox\n\
 * @param {Array} styles\n\
 */\n\
\n\
function augmentWidthOrHeight(el, prop, extra, isBorderBox, styles) {\n\
  // If we already have the right measurement, avoid augmentation,\n\
  // Otherwise initialize for horizontal or vertical properties\n\
  var i = extra === (isBorderBox ? 'border' : 'content') ? 4 : 'width' == prop ? 1 : 0;\n\
  var val = 0;\n\
\n\
  for (; i < 4; i += 2) {\n\
    // both box models exclude margin, so add it if we want it\n\
    if (extra === 'margin') {\n\
      val += css(el, extra + cssExpand[i], true, styles);\n\
    }\n\
\n\
    if (isBorderBox) {\n\
      // border-box includes padding, so remove it if we want content\n\
      if (extra === 'content') {\n\
        val -= css(el, 'padding' + cssExpand[i], true, styles);\n\
      }\n\
\n\
      // at this point, extra isn't border nor margin, so remove border\n\
      if (extra !== 'margin') {\n\
        val -= css(el, 'border' + cssExpand[i] + 'Width', true, styles);\n\
      }\n\
    } else {\n\
      // at this point, extra isn't content, so add padding\n\
      val += css(el, 'padding' + cssExpand[i], true, styles);\n\
\n\
      // at this point, extra isn't content nor padding, so add border\n\
      if (extra !== 'padding') {\n\
        val += css(el, 'border' + cssExpand[i] + 'Width', true, styles);\n\
      }\n\
    }\n\
  }\n\
\n\
  return val;\n\
}\n\
//@ sourceURL=component-css/lib/hooks.js"
));
require.register("component-css/lib/styles.js", Function("exports, require, module",
"/**\n\
 * Expose `styles`\n\
 */\n\
\n\
module.exports = styles;\n\
\n\
/**\n\
 * Get all the styles\n\
 *\n\
 * @param {Element} el\n\
 * @return {Array}\n\
 */\n\
\n\
function styles(el) {\n\
  if (window.getComputedStyle) {\n\
    return el.ownerDocument.defaultView.getComputedStyle(el, null);\n\
  } else {\n\
    return el.currentStyle;\n\
  }\n\
}\n\
//@ sourceURL=component-css/lib/styles.js"
));
require.register("component-css/lib/vendor.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var prefixes = ['Webkit', 'O', 'Moz', 'ms'];\n\
\n\
/**\n\
 * Expose `vendor`\n\
 */\n\
\n\
module.exports = vendor;\n\
\n\
/**\n\
 * Get the vendor prefix for a given property\n\
 *\n\
 * @param {String} prop\n\
 * @param {Object} style\n\
 * @return {String}\n\
 */\n\
\n\
function vendor(prop, style) {\n\
  // shortcut for names that are not vendor prefixed\n\
  if (style[prop]) return prop;\n\
\n\
  // check for vendor prefixed names\n\
  var capName = prop[0].toUpperCase() + prop.slice(1);\n\
  var original = prop;\n\
  var i = prefixes.length;\n\
\n\
  while (i--) {\n\
    prop = prefixes[i] + capName;\n\
    if (prop in style) return prop;\n\
  }\n\
\n\
  return original;\n\
}\n\
//@ sourceURL=component-css/lib/vendor.js"
));
require.register("component-css/lib/support.js", Function("exports, require, module",
"/**\n\
 * Support values\n\
 */\n\
\n\
var reliableMarginRight;\n\
var boxSizingReliableVal;\n\
var pixelPositionVal;\n\
var clearCloneStyle;\n\
\n\
/**\n\
 * Container setup\n\
 */\n\
\n\
var docElem = document.documentElement;\n\
var container = document.createElement('div');\n\
var div = document.createElement('div');\n\
\n\
/**\n\
 * Clear clone style\n\
 */\n\
\n\
div.style.backgroundClip = 'content-box';\n\
div.cloneNode(true).style.backgroundClip = '';\n\
exports.clearCloneStyle = div.style.backgroundClip === 'content-box';\n\
\n\
container.style.cssText = 'border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px';\n\
container.appendChild(div);\n\
\n\
/**\n\
 * Pixel position\n\
 *\n\
 * Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084\n\
 * getComputedStyle returns percent when specified for top/left/bottom/right\n\
 * rather than make the css module depend on the offset module, we just check for it here\n\
 */\n\
\n\
exports.pixelPosition = function() {\n\
  if (undefined == pixelPositionVal) computePixelPositionAndBoxSizingReliable();\n\
  return pixelPositionVal;\n\
}\n\
\n\
/**\n\
 * Reliable box sizing\n\
 */\n\
\n\
exports.boxSizingReliable = function() {\n\
  if (undefined == boxSizingReliableVal) computePixelPositionAndBoxSizingReliable();\n\
  return boxSizingReliableVal;\n\
}\n\
\n\
/**\n\
 * Reliable margin right\n\
 *\n\
 * Support: Android 2.3\n\
 * Check if div with explicit width and no margin-right incorrectly\n\
 * gets computed margin-right based on width of container. (#3333)\n\
 * WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right\n\
 * This support function is only executed once so no memoizing is needed.\n\
 *\n\
 * @return {Boolean}\n\
 */\n\
\n\
exports.reliableMarginRight = function() {\n\
  var ret;\n\
  var marginDiv = div.appendChild(document.createElement(\"div\" ));\n\
\n\
  marginDiv.style.cssText = div.style.cssText = divReset;\n\
  marginDiv.style.marginRight = marginDiv.style.width = \"0\";\n\
  div.style.width = \"1px\";\n\
  docElem.appendChild(container);\n\
\n\
  ret = !parseFloat(window.getComputedStyle(marginDiv, null).marginRight);\n\
\n\
  docElem.removeChild(container);\n\
\n\
  // Clean up the div for other support tests.\n\
  div.innerHTML = \"\";\n\
\n\
  return ret;\n\
}\n\
\n\
/**\n\
 * Executing both pixelPosition & boxSizingReliable tests require only one layout\n\
 * so they're executed at the same time to save the second computation.\n\
 */\n\
\n\
function computePixelPositionAndBoxSizingReliable() {\n\
  // Support: Firefox, Android 2.3 (Prefixed box-sizing versions).\n\
  div.style.cssText = \"-webkit-box-sizing:border-box;-moz-box-sizing:border-box;\" +\n\
    \"box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;\" +\n\
    \"position:absolute;top:1%\";\n\
  docElem.appendChild(container);\n\
\n\
  var divStyle = window.getComputedStyle(div, null);\n\
  pixelPositionVal = divStyle.top !== \"1%\";\n\
  boxSizingReliableVal = divStyle.width === \"4px\";\n\
\n\
  docElem.removeChild(container);\n\
}\n\
\n\
\n\
//@ sourceURL=component-css/lib/support.js"
));
require.register("component-css/lib/computed.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var debug = require('debug')('css:computed');\n\
var withinDocument = require('within-document');\n\
var styles = require('./styles');\n\
\n\
/**\n\
 * Expose `computed`\n\
 */\n\
\n\
module.exports = computed;\n\
\n\
/**\n\
 * Get the computed style\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} prop\n\
 * @param {Array} precomputed (optional)\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function computed(el, prop, precomputed) {\n\
  var computed = precomputed || styles(el);\n\
  var ret;\n\
  \n\
  if (!computed) return;\n\
\n\
  if (computed.getPropertyValue) {\n\
    ret = computed.getPropertyValue(prop) || computed[prop];\n\
  } else {\n\
    ret = computed[prop];\n\
  }\n\
\n\
  if ('' === ret && !withinDocument(el)) {\n\
    debug('element not within document, try finding from style attribute');\n\
    var style = require('./style');\n\
    ret = style(el, prop);\n\
  }\n\
\n\
  debug('computed value of %s: %s', prop, ret);\n\
\n\
  // Support: IE\n\
  // IE returns zIndex value as an integer.\n\
  return undefined === ret ? ret : ret + '';\n\
}\n\
//@ sourceURL=component-css/lib/computed.js"
));
require.register("component-value/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var typeOf = require('type');\n\
\n\
/**\n\
 * Set or get `el`'s' value.\n\
 *\n\
 * @param {Element} el\n\
 * @param {Mixed} val\n\
 * @return {Mixed}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(el, val){\n\
  if (2 == arguments.length) return set(el, val);\n\
  return get(el);\n\
};\n\
\n\
/**\n\
 * Get `el`'s value.\n\
 */\n\
\n\
function get(el) {\n\
  switch (type(el)) {\n\
    case 'checkbox':\n\
    case 'radio':\n\
      if (el.checked) {\n\
        var attr = el.getAttribute('value');\n\
        return null == attr ? true : attr;\n\
      } else {\n\
        return false;\n\
      }\n\
    case 'radiogroup':\n\
      for (var i = 0, radio; radio = el[i]; i++) {\n\
        if (radio.checked) return radio.value;\n\
      }\n\
      break;\n\
    case 'select':\n\
      for (var i = 0, option; option = el.options[i]; i++) {\n\
        if (option.selected) return option.value;\n\
      }\n\
      break;\n\
    default:\n\
      return el.value;\n\
  }\n\
}\n\
\n\
/**\n\
 * Set `el`'s value.\n\
 */\n\
\n\
function set(el, val) {\n\
  switch (type(el)) {\n\
    case 'checkbox':\n\
    case 'radio':\n\
      if (val) {\n\
        el.checked = true;\n\
      } else {\n\
        el.checked = false;\n\
      }\n\
      break;\n\
    case 'radiogroup':\n\
      for (var i = 0, radio; radio = el[i]; i++) {\n\
        radio.checked = radio.value === val;\n\
      }\n\
      break;\n\
    case 'select':\n\
      for (var i = 0, option; option = el.options[i]; i++) {\n\
        option.selected = option.value === val;\n\
      }\n\
      break;\n\
    default:\n\
      el.value = val;\n\
  }\n\
}\n\
\n\
/**\n\
 * Element type.\n\
 */\n\
\n\
function type(el) {\n\
  var group = 'array' == typeOf(el) || 'object' == typeOf(el);\n\
  if (group) el = el[0];\n\
  var name = el.nodeName.toLowerCase();\n\
  var type = el.getAttribute('type');\n\
\n\
  if (group && type && 'radio' == type.toLowerCase()) return 'radiogroup';\n\
  if ('input' == name && type && 'checkbox' == type.toLowerCase()) return 'checkbox';\n\
  if ('input' == name && type && 'radio' == type.toLowerCase()) return 'radio';\n\
  if ('select' == name) return 'select';\n\
  return name;\n\
}\n\
//@ sourceURL=component-value/index.js"
));
require.register("component-query/index.js", Function("exports, require, module",
"function one(selector, el) {\n\
  return el.querySelector(selector);\n\
}\n\
\n\
exports = module.exports = function(selector, el){\n\
  el = el || document;\n\
  return one(selector, el);\n\
};\n\
\n\
exports.all = function(selector, el){\n\
  el = el || document;\n\
  return el.querySelectorAll(selector);\n\
};\n\
\n\
exports.engine = function(obj){\n\
  if (!obj.one) throw new Error('.one callback required');\n\
  if (!obj.all) throw new Error('.all callback required');\n\
  one = obj.one;\n\
  exports.all = obj.all;\n\
  return exports;\n\
};\n\
//@ sourceURL=component-query/index.js"
));
require.register("component-matches-selector/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var query = require('query');\n\
\n\
/**\n\
 * Element prototype.\n\
 */\n\
\n\
var proto = Element.prototype;\n\
\n\
/**\n\
 * Vendor function.\n\
 */\n\
\n\
var vendor = proto.matches\n\
  || proto.webkitMatchesSelector\n\
  || proto.mozMatchesSelector\n\
  || proto.msMatchesSelector\n\
  || proto.oMatchesSelector;\n\
\n\
/**\n\
 * Expose `match()`.\n\
 */\n\
\n\
module.exports = match;\n\
\n\
/**\n\
 * Match `el` to `selector`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} selector\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
function match(el, selector) {\n\
  if (vendor) return vendor.call(el, selector);\n\
  var nodes = query.all(selector, el.parentNode);\n\
  for (var i = 0; i < nodes.length; ++i) {\n\
    if (nodes[i] == el) return true;\n\
  }\n\
  return false;\n\
}\n\
//@ sourceURL=component-matches-selector/index.js"
));
require.register("yields-traverse/index.js", Function("exports, require, module",
"\n\
/**\n\
 * dependencies\n\
 */\n\
\n\
var matches = require('matches-selector');\n\
\n\
/**\n\
 * Traverse with the given `el`, `selector` and `len`.\n\
 *\n\
 * @param {String} type\n\
 * @param {Element} el\n\
 * @param {String} selector\n\
 * @param {Number} len\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(type, el, selector, len){\n\
  var el = el[type]\n\
    , n = len || 1\n\
    , ret = [];\n\
\n\
  if (!el) return ret;\n\
\n\
  do {\n\
    if (n == ret.length) break;\n\
    if (1 != el.nodeType) continue;\n\
    if (matches(el, selector)) ret.push(el);\n\
    if (!selector) ret.push(el);\n\
  } while (el = el[type]);\n\
\n\
  return ret;\n\
}\n\
//@ sourceURL=yields-traverse/index.js"
));
require.register("component-trim/index.js", Function("exports, require, module",
"\n\
exports = module.exports = trim;\n\
\n\
function trim(str){\n\
  if (str.trim) return str.trim();\n\
  return str.replace(/^\\s*|\\s*$/g, '');\n\
}\n\
\n\
exports.left = function(str){\n\
  if (str.trimLeft) return str.trimLeft();\n\
  return str.replace(/^\\s*/, '');\n\
};\n\
\n\
exports.right = function(str){\n\
  if (str.trimRight) return str.trimRight();\n\
  return str.replace(/\\s*$/, '');\n\
};\n\
//@ sourceURL=component-trim/index.js"
));
require.register("yields-isArray/index.js", Function("exports, require, module",
"\n\
/**\n\
 * isArray\n\
 */\n\
\n\
var isArray = Array.isArray;\n\
\n\
/**\n\
 * toString\n\
 */\n\
\n\
var str = Object.prototype.toString;\n\
\n\
/**\n\
 * Wether or not the given `val`\n\
 * is an array.\n\
 *\n\
 * example:\n\
 *\n\
 *        isArray([]);\n\
 *        // > true\n\
 *        isArray(arguments);\n\
 *        // > false\n\
 *        isArray('');\n\
 *        // > false\n\
 *\n\
 * @param {mixed} val\n\
 * @return {bool}\n\
 */\n\
\n\
module.exports = isArray || function (val) {\n\
  return !! val && '[object Array]' == str.call(val);\n\
};\n\
//@ sourceURL=yields-isArray/index.js"
));
require.register("component-props/index.js", Function("exports, require, module",
"/**\n\
 * Global Names\n\
 */\n\
\n\
var globals = /\\b(Array|Date|Object|Math|JSON)\\b/g;\n\
\n\
/**\n\
 * Return immediate identifiers parsed from `str`.\n\
 *\n\
 * @param {String} str\n\
 * @param {String|Function} map function or prefix\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(str, fn){\n\
  var p = unique(props(str));\n\
  if (fn && 'string' == typeof fn) fn = prefixed(fn);\n\
  if (fn) return map(str, p, fn);\n\
  return p;\n\
};\n\
\n\
/**\n\
 * Return immediate identifiers in `str`.\n\
 *\n\
 * @param {String} str\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function props(str) {\n\
  return str\n\
    .replace(/\\.\\w+|\\w+ *\\(|\"[^\"]*\"|'[^']*'|\\/([^/]+)\\//g, '')\n\
    .replace(globals, '')\n\
    .match(/[a-zA-Z_]\\w*/g)\n\
    || [];\n\
}\n\
\n\
/**\n\
 * Return `str` with `props` mapped with `fn`.\n\
 *\n\
 * @param {String} str\n\
 * @param {Array} props\n\
 * @param {Function} fn\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function map(str, props, fn) {\n\
  var re = /\\.\\w+|\\w+ *\\(|\"[^\"]*\"|'[^']*'|\\/([^/]+)\\/|[a-zA-Z_]\\w*/g;\n\
  return str.replace(re, function(_){\n\
    if ('(' == _[_.length - 1]) return fn(_);\n\
    if (!~props.indexOf(_)) return _;\n\
    return fn(_);\n\
  });\n\
}\n\
\n\
/**\n\
 * Return unique array.\n\
 *\n\
 * @param {Array} arr\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function unique(arr) {\n\
  var ret = [];\n\
\n\
  for (var i = 0; i < arr.length; i++) {\n\
    if (~ret.indexOf(arr[i])) continue;\n\
    ret.push(arr[i]);\n\
  }\n\
\n\
  return ret;\n\
}\n\
\n\
/**\n\
 * Map with prefix `str`.\n\
 */\n\
\n\
function prefixed(str) {\n\
  return function(_){\n\
    return str + _;\n\
  };\n\
}\n\
//@ sourceURL=component-props/index.js"
));
require.register("component-to-function/index.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
try {\n\
  var expr = require('props');\n\
} catch(e) {\n\
  var expr = require('props-component');\n\
}\n\
\n\
/**\n\
 * Expose `toFunction()`.\n\
 */\n\
\n\
module.exports = toFunction;\n\
\n\
/**\n\
 * Convert `obj` to a `Function`.\n\
 *\n\
 * @param {Mixed} obj\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function toFunction(obj) {\n\
  switch ({}.toString.call(obj)) {\n\
    case '[object Object]':\n\
      return objectToFunction(obj);\n\
    case '[object Function]':\n\
      return obj;\n\
    case '[object String]':\n\
      return stringToFunction(obj);\n\
    case '[object RegExp]':\n\
      return regexpToFunction(obj);\n\
    default:\n\
      return defaultToFunction(obj);\n\
  }\n\
}\n\
\n\
/**\n\
 * Default to strict equality.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function defaultToFunction(val) {\n\
  return function(obj){\n\
    return val === obj;\n\
  }\n\
}\n\
\n\
/**\n\
 * Convert `re` to a function.\n\
 *\n\
 * @param {RegExp} re\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function regexpToFunction(re) {\n\
  return function(obj){\n\
    return re.test(obj);\n\
  }\n\
}\n\
\n\
/**\n\
 * Convert property `str` to a function.\n\
 *\n\
 * @param {String} str\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function stringToFunction(str) {\n\
  // immediate such as \"> 20\"\n\
  if (/^ *\\W+/.test(str)) return new Function('_', 'return _ ' + str);\n\
\n\
  // properties such as \"name.first\" or \"age > 18\" or \"age > 18 && age < 36\"\n\
  return new Function('_', 'return ' + get(str));\n\
}\n\
\n\
/**\n\
 * Convert `object` to a function.\n\
 *\n\
 * @param {Object} object\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function objectToFunction(obj) {\n\
  var match = {}\n\
  for (var key in obj) {\n\
    match[key] = typeof obj[key] === 'string'\n\
      ? defaultToFunction(obj[key])\n\
      : toFunction(obj[key])\n\
  }\n\
  return function(val){\n\
    if (typeof val !== 'object') return false;\n\
    for (var key in match) {\n\
      if (!(key in val)) return false;\n\
      if (!match[key](val[key])) return false;\n\
    }\n\
    return true;\n\
  }\n\
}\n\
\n\
/**\n\
 * Built the getter function. Supports getter style functions\n\
 *\n\
 * @param {String} str\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function get(str) {\n\
  var props = expr(str);\n\
  if (!props.length) return '_.' + str;\n\
\n\
  var val;\n\
  for(var i = 0, prop; prop = props[i]; i++) {\n\
    val = '_.' + prop;\n\
    val = \"('function' == typeof \" + val + \" ? \" + val + \"() : \" + val + \")\";\n\
    str = str.replace(new RegExp(prop, 'g'), val);\n\
  }\n\
\n\
  return str;\n\
}\n\
//@ sourceURL=component-to-function/index.js"
));
require.register("matthewp-keys/index.js", Function("exports, require, module",
"module.exports = Object.keys || function(obj){\n\
  var keys = [];\n\
\n\
  for (var key in obj) {\n\
    if (obj.hasOwnProperty(key)) {\n\
      keys.push(key);\n\
    }\n\
  }\n\
\n\
  return keys;\n\
};//@ sourceURL=matthewp-keys/index.js"
));
require.register("matthewp-text/index.js", Function("exports, require, module",
"\n\
var text = 'innerText' in document.createElement('div')\n\
  ? 'innerText'\n\
  : 'textContent'\n\
\n\
module.exports = function (el, val) {\n\
  if (val == null) return el[text];\n\
  el[text] = val;\n\
};\n\
//@ sourceURL=matthewp-text/index.js"
));
require.register("component-dom/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var isArray = require('isArray');\n\
var domify = require('domify');\n\
var each = require('each');\n\
var events = require('event');\n\
var getKeys = require('keys');\n\
var query = require('query');\n\
var trim = require('trim');\n\
var slice = [].slice;\n\
\n\
/**\n\
 * Attributes supported.\n\
 */\n\
\n\
var attrs = [\n\
  'id',\n\
  'src',\n\
  'rel',\n\
  'cols',\n\
  'rows',\n\
  'type',\n\
  'name',\n\
  'href',\n\
  'title',\n\
  'style',\n\
  'width',\n\
  'height',\n\
  'action',\n\
  'method',\n\
  'tabindex',\n\
  'placeholder'\n\
];\n\
\n\
/*\n\
 * A simple way to check for HTML strings or ID strings\n\
 */\n\
\n\
var quickExpr = /^(?:[^#<]*(<[\\w\\W]+>)[^>]*$|#([\\w\\-]*)$)/;\n\
\n\
/**\n\
 * Expose `dom()`.\n\
 */\n\
\n\
module.exports = dom;\n\
\n\
/**\n\
 * Return a dom `List` for the given\n\
 * `html`, selector, or element.\n\
 *\n\
 * @param {String|Element|List} selector\n\
 * @param {String|ELement|context} context\n\
 * @return {List}\n\
 * @api public\n\
 */\n\
\n\
function dom(selector, context) {\n\
  // array\n\
  if (isArray(selector)) {\n\
    return new List(selector);\n\
  }\n\
\n\
  // List\n\
  if (selector instanceof List) {\n\
    return selector;\n\
  }\n\
\n\
  // node\n\
  if (selector.nodeName) {\n\
    return new List([selector]);\n\
  }\n\
\n\
  if ('string' != typeof selector) {\n\
    throw new TypeError('invalid selector');\n\
  }\n\
\n\
  // html\n\
  var htmlselector = trim.left(selector);\n\
  if (isHTML(htmlselector)) {\n\
    return new List([domify(htmlselector)], htmlselector);\n\
  }\n\
\n\
  // selector\n\
  var ctx = context\n\
    ? (context instanceof List ? context[0] : context)\n\
    : document;\n\
\n\
  return new List(query.all(selector, ctx), selector);\n\
}\n\
\n\
/**\n\
 * Static: Expose `List`\n\
 */\n\
\n\
dom.List = List;\n\
\n\
/**\n\
 * Static: Expose supported attrs.\n\
 */\n\
\n\
dom.attrs = attrs;\n\
\n\
/**\n\
 * Static: Mixin a function\n\
 *\n\
 * @param {Object|String} name\n\
 * @param {Object|Function} obj\n\
 * @return {List} self\n\
 */\n\
\n\
dom.use = function(name, fn) {\n\
  var keys = [];\n\
  var tmp;\n\
\n\
  if (2 == arguments.length) {\n\
    keys.push(name);\n\
    tmp = {};\n\
    tmp[name] = fn;\n\
    fn = tmp;\n\
  } else if (name.name) {\n\
    // use function name\n\
    fn = name;\n\
    name = name.name;\n\
    keys.push(name);\n\
    tmp = {};\n\
    tmp[name] = fn;\n\
    fn = tmp;\n\
  } else {\n\
    keys = getKeys(name);\n\
    fn = name;\n\
  }\n\
\n\
  for(var i = 0, len = keys.length; i < len; i++) {\n\
    List.prototype[keys[i]] = fn[keys[i]];\n\
  }\n\
\n\
  return this;\n\
}\n\
\n\
/**\n\
 * Initialize a new `List` with the\n\
 * given array-ish of `els` and `selector`\n\
 * string.\n\
 *\n\
 * @param {Mixed} els\n\
 * @param {String} selector\n\
 * @api private\n\
 */\n\
\n\
function List(els, selector) {\n\
  els = els || [];\n\
  var len = this.length = els.length;\n\
  for(var i = 0; i < len; i++) this[i] = els[i];\n\
  this.selector = selector;\n\
}\n\
\n\
/**\n\
 * Remake the list\n\
 *\n\
 * @param {String|ELement|context} context\n\
 * @return {List}\n\
 * @api private\n\
 */\n\
\n\
List.prototype.dom = dom;\n\
\n\
/**\n\
 * Make `List` an array-like object\n\
 */\n\
\n\
List.prototype.length = 0;\n\
List.prototype.splice = Array.prototype.splice;\n\
\n\
/**\n\
 * Array-like object to array\n\
 *\n\
 * @return {Array}\n\
 */\n\
\n\
List.prototype.toArray = function() {\n\
  return slice.call(this);\n\
}\n\
\n\
/**\n\
 * Attribute accessors.\n\
 */\n\
\n\
each(attrs, function(name){\n\
  List.prototype[name] = function(val){\n\
    if (0 == arguments.length) return this.attr(name);\n\
    return this.attr(name, val);\n\
  };\n\
});\n\
\n\
/**\n\
 * Mixin the API\n\
 */\n\
\n\
dom.use(require('./lib/attributes'));\n\
dom.use(require('./lib/classes'));\n\
dom.use(require('./lib/events'));\n\
dom.use(require('./lib/manipulate'));\n\
dom.use(require('./lib/traverse'));\n\
\n\
/**\n\
 * Check if the string is HTML\n\
 *\n\
 * @param {String} str\n\
 * @return {Boolean}\n\
 * @api private\n\
 */\n\
\n\
function isHTML(str) {\n\
  // Faster than running regex, if str starts with `<` and ends with `>`, assume it's HTML\n\
  if (str.charAt(0) === '<' && str.charAt(str.length - 1) === '>' && str.length >= 3) return true;\n\
\n\
  // Run the regex\n\
  var match = quickExpr.exec(str);\n\
  return !!(match && match[1]);\n\
}\n\
//@ sourceURL=component-dom/index.js"
));
require.register("component-dom/lib/traverse.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var proto = Array.prototype;\n\
var each = require('each');\n\
var traverse = require('traverse');\n\
var toFunction = require('to-function');\n\
var matches = require('matches-selector');\n\
\n\
/**\n\
 * Find children matching the given `selector`.\n\
 *\n\
 * @param {String} selector\n\
 * @return {List}\n\
 * @api public\n\
 */\n\
\n\
exports.find = function(selector){\n\
  return this.dom(selector, this);\n\
};\n\
\n\
/**\n\
 * Check if the any element in the selection\n\
 * matches `selector`.\n\
 *\n\
 * @param {String} selector\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
exports.is = function(selector){\n\
  for(var i = 0, el; el = this[i]; i++) {\n\
    if (matches(el, selector)) return true;\n\
  }\n\
\n\
  return false;\n\
};\n\
\n\
/**\n\
 * Get parent(s) with optional `selector` and `limit`\n\
 *\n\
 * @param {String} selector\n\
 * @param {Number} limit\n\
 * @return {List}\n\
 * @api public\n\
 */\n\
\n\
exports.parent = function(selector, limit){\n\
  return this.dom(traverse('parentNode',\n\
    this[0],\n\
    selector,\n\
    limit\n\
    || 1));\n\
};\n\
\n\
/**\n\
 * Get next element(s) with optional `selector` and `limit`.\n\
 *\n\
 * @param {String} selector\n\
 * @param {Number} limit\n\
 * @retrun {List}\n\
 * @api public\n\
 */\n\
\n\
exports.next = function(selector, limit){\n\
  return this.dom(traverse('nextSibling',\n\
    this[0],\n\
    selector,\n\
    limit\n\
    || 1));\n\
};\n\
\n\
/**\n\
 * Get previous element(s) with optional `selector` and `limit`.\n\
 *\n\
 * @param {String} selector\n\
 * @param {Number} limit\n\
 * @return {List}\n\
 * @api public\n\
 */\n\
\n\
exports.prev =\n\
exports.previous = function(selector, limit){\n\
  return this.dom(traverse('previousSibling',\n\
    this[0],\n\
    selector,\n\
    limit\n\
    || 1));\n\
};\n\
\n\
/**\n\
 * Iterate over each element creating a new list with\n\
 * one item and invoking `fn(list, i)`.\n\
 *\n\
 * @param {Function} fn\n\
 * @return {List} self\n\
 * @api public\n\
 */\n\
\n\
exports.each = function(fn){\n\
  var dom = this.dom;\n\
\n\
  for (var i = 0, list, len = this.length; i < len; i++) {\n\
    list = dom(this[i]);\n\
    fn.call(list, list, i);\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Iterate over each element and invoke `fn(el, i)`\n\
 *\n\
 * @param {Function} fn\n\
 * @return {List} self\n\
 * @api public\n\
 */\n\
\n\
exports.forEach = function(fn) {\n\
  for (var i = 0, len = this.length; i < len; i++) {\n\
    fn.call(this[i], this[i], i);\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Map each return value from `fn(val, i)`.\n\
 *\n\
 * Passing a callback function:\n\
 *\n\
 *    inputs.map(function(input){\n\
 *      return input.type\n\
 *    })\n\
 *\n\
 * Passing a property string:\n\
 *\n\
 *    inputs.map('type')\n\
 *\n\
 * @param {Function} fn\n\
 * @return {List} self\n\
 * @api public\n\
 */\n\
\n\
exports.map = function(fn){\n\
  fn = toFunction(fn);\n\
  var dom = this.dom;\n\
  var out = [];\n\
\n\
  for (var i = 0, len = this.length; i < len; i++) {\n\
    out.push(fn.call(dom(this[i]), this[i], i));\n\
  }\n\
\n\
  return this.dom(out);\n\
};\n\
\n\
/**\n\
 * Select all values that return a truthy value of `fn(val, i)`.\n\
 *\n\
 *    inputs.select(function(input){\n\
 *      return input.type == 'password'\n\
 *    })\n\
 *\n\
 *  With a property:\n\
 *\n\
 *    inputs.select('type == password')\n\
 *\n\
 * @param {Function|String} fn\n\
 * @return {List} self\n\
 * @api public\n\
 */\n\
\n\
exports.filter =\n\
exports.select = function(fn){\n\
  fn = toFunction(fn);\n\
  var dom = this.dom;\n\
  var out = [];\n\
  var val;\n\
\n\
  for (var i = 0, len = this.length; i < len; i++) {\n\
    val = fn.call(dom(this[i]), this[i], i);\n\
    if (val) out.push(this[i]);\n\
  }\n\
\n\
  return this.dom(out);\n\
};\n\
\n\
/**\n\
 * Reject all values that return a truthy value of `fn(val, i)`.\n\
 *\n\
 * Rejecting using a callback:\n\
 *\n\
 *    input.reject(function(user){\n\
 *      return input.length < 20\n\
 *    })\n\
 *\n\
 * Rejecting with a property:\n\
 *\n\
 *    items.reject('password')\n\
 *\n\
 * Rejecting values via `==`:\n\
 *\n\
 *    data.reject(null)\n\
 *    input.reject(file)\n\
 *\n\
 * @param {Function|String|Mixed} fn\n\
 * @return {List}\n\
 * @api public\n\
 */\n\
\n\
exports.reject = function(fn){\n\
  var out = [];\n\
  var len = this.length;\n\
  var val, i;\n\
\n\
  if ('string' == typeof fn) fn = toFunction(fn);\n\
\n\
  if (fn) {\n\
    for (i = 0; i < len; i++) {\n\
      val = fn.call(dom(this[i]), this[i], i);\n\
      if (!val) out.push(this[i]);\n\
    }\n\
  } else {\n\
    for (i = 0; i < len; i++) {\n\
      if (this[i] != fn) out.push(this[i]);\n\
    }\n\
  }\n\
\n\
  return this.dom(out);\n\
};\n\
\n\
/**\n\
 * Return a `List` containing the element at `i`.\n\
 *\n\
 * @param {Number} i\n\
 * @return {List}\n\
 * @api public\n\
 */\n\
\n\
exports.at = function(i){\n\
  return this.dom(this[i]);\n\
};\n\
\n\
/**\n\
 * Return a `List` containing the first element.\n\
 *\n\
 * @param {Number} i\n\
 * @return {List}\n\
 * @api public\n\
 */\n\
\n\
exports.first = function(){\n\
  return this.dom(this[0]);\n\
};\n\
\n\
/**\n\
 * Return a `List` containing the last element.\n\
 *\n\
 * @param {Number} i\n\
 * @return {List}\n\
 * @api public\n\
 */\n\
\n\
exports.last = function(){\n\
  return this.dom(this[this.length - 1]);\n\
};\n\
\n\
/**\n\
 * Mixin the array functions\n\
 */\n\
\n\
each([\n\
  'push',\n\
  'pop',\n\
  'shift',\n\
  'splice',\n\
  'unshift',\n\
  'reverse',\n\
  'sort',\n\
  'toString',\n\
  'concat',\n\
  'join',\n\
  'slice'\n\
], function(method) {\n\
  exports[method] = function() {\n\
    return proto[method].apply(this.toArray(), arguments);\n\
  };\n\
});\n\
//@ sourceURL=component-dom/lib/traverse.js"
));
require.register("component-dom/lib/manipulate.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var value = require('value');\n\
var css = require('css');\n\
var text = require('text');\n\
\n\
/**\n\
 * Return element text.\n\
 *\n\
 * @param {String} str\n\
 * @return {String|List}\n\
 * @api public\n\
 */\n\
\n\
exports.text = function(str) {\n\
  if (1 == arguments.length) {\n\
    return this.forEach(function(el) {\n\
      if (11 == el.nodeType) {\n\
        var node;\n\
        while (node = el.firstChild) el.removeChild(node);\n\
        el.appendChild(document.createTextNode(str));\n\
      } else {\n\
        text(el, str);\n\
      }\n\
    });\n\
  }\n\
\n\
  var out = '';\n\
  this.forEach(function(el) {\n\
    if (11 == el.nodeType) {\n\
      out += getText(el.firstChild);\n\
    } else {\n\
      out += text(el);\n\
    }\n\
  });\n\
\n\
  return out;\n\
};\n\
\n\
/**\n\
 * Get text helper from Sizzle.\n\
 *\n\
 * Source: https://github.com/jquery/sizzle/blob/master/src/sizzle.js#L914-L947\n\
 *\n\
 * @param {Element|Array} el\n\
 * @return {String}\n\
 */\n\
\n\
function getText(el) {\n\
  var ret = '';\n\
  var type = el.nodeType;\n\
  var node;\n\
\n\
  switch(type) {\n\
    case 1:\n\
    case 9:\n\
      ret = text(el);\n\
      break;\n\
    case 11:\n\
      ret = el.textContent || el.innerText;\n\
      break;\n\
    case 3:\n\
    case 4:\n\
      return el.nodeValue;\n\
    default:\n\
      while (node = el[i++]) {\n\
        ret += getText(node);\n\
      }\n\
  }\n\
\n\
  return ret;\n\
}\n\
\n\
/**\n\
 * Return element html.\n\
 *\n\
 * @return {String} html\n\
 * @api public\n\
 */\n\
\n\
exports.html = function(html) {\n\
  if (1 == arguments.length) {\n\
    return this.forEach(function(el) {\n\
      el.innerHTML = html;\n\
    });\n\
  }\n\
\n\
  // TODO: real impl\n\
  return this[0] && this[0].innerHTML;\n\
};\n\
\n\
/**\n\
 * Get and set the css value\n\
 *\n\
 * @param {String|Object} prop\n\
 * @param {Mixed} val\n\
 * @return {Mixed}\n\
 * @api public\n\
 */\n\
\n\
exports.css = function(prop, val) {\n\
  // getter\n\
  if (!val && 'object' != typeof prop) {\n\
    return css(this[0], prop);\n\
  }\n\
  // setter\n\
  this.forEach(function(el) {\n\
    css(el, prop, val);\n\
  });\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Prepend `val`.\n\
 *\n\
 * From jQuery: if there is more than one target element\n\
 * cloned copies of the inserted element will be created\n\
 * for each target after the first.\n\
 *\n\
 * @param {String|Element|List} val\n\
 * @return {List} self\n\
 * @api public\n\
 */\n\
\n\
exports.prepend = function(val) {\n\
  var dom = this.dom;\n\
\n\
  this.forEach(function(target, i) {\n\
    dom(val).forEach(function(selector) {\n\
      selector = i ? selector.cloneNode(true) : selector;\n\
      if (target.children.length) {\n\
        target.insertBefore(selector, target.firstChild);\n\
      } else {\n\
        target.appendChild(selector);\n\
      }\n\
    });\n\
  });\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Append `val`.\n\
 *\n\
 * From jQuery: if there is more than one target element\n\
 * cloned copies of the inserted element will be created\n\
 * for each target after the first.\n\
 *\n\
 * @param {String|Element|List} val\n\
 * @return {List} self\n\
 * @api public\n\
 */\n\
\n\
exports.append = function(val) {\n\
  var dom = this.dom;\n\
\n\
  this.forEach(function(target, i) {\n\
    dom(val).forEach(function(el) {\n\
      el = i ? el.cloneNode(true) : el;\n\
      target.appendChild(el);\n\
    });\n\
  });\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Insert self's `els` after `val`\n\
 *\n\
 * From jQuery: if there is more than one target element,\n\
 * cloned copies of the inserted element will be created\n\
 * for each target after the first, and that new set\n\
 * (the original element plus clones) is returned.\n\
 *\n\
 * @param {String|Element|List} val\n\
 * @return {List} self\n\
 * @api public\n\
 */\n\
\n\
exports.insertAfter = function(val) {\n\
  var dom = this.dom;\n\
\n\
  this.forEach(function(el) {\n\
    dom(val).forEach(function(target, i) {\n\
      if (!target.parentNode) return;\n\
      el = i ? el.cloneNode(true) : el;\n\
      target.parentNode.insertBefore(el, target.nextSibling);\n\
    });\n\
  });\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Append self's `el` to `val`\n\
 *\n\
 * @param {String|Element|List} val\n\
 * @return {List} self\n\
 * @api public\n\
 */\n\
\n\
exports.appendTo = function(val) {\n\
  this.dom(val).append(this);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Replace elements in the DOM.\n\
 *\n\
 * @param {String|Element|List} val\n\
 * @return {List} self\n\
 * @api public\n\
 */\n\
\n\
exports.replace = function(val) {\n\
  var self = this;\n\
  var list = this.dom(val);\n\
\n\
  list.forEach(function(el, i) {\n\
    var old = self[i];\n\
    var parent = old.parentNode;\n\
    if (!parent) return;\n\
    el = i ? el.cloneNode(true) : el;\n\
    parent.replaceChild(el, old);\n\
  });\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Empty the dom list\n\
 *\n\
 * @return self\n\
 * @api public\n\
 */\n\
\n\
exports.empty = function() {\n\
  return this.forEach(function(el) {\n\
    text(el, \"\");\n\
  });\n\
};\n\
\n\
/**\n\
 * Remove all elements in the dom list\n\
 *\n\
 * @return {List} self\n\
 * @api public\n\
 */\n\
\n\
exports.remove = function() {\n\
  return this.forEach(function(el) {\n\
    var parent = el.parentNode;\n\
    if (parent) parent.removeChild(el);\n\
  });\n\
};\n\
\n\
/**\n\
 * Return a cloned dom list with all elements cloned.\n\
 *\n\
 * @return {List}\n\
 * @api public\n\
 */\n\
\n\
exports.clone = function() {\n\
  var out = this.map(function(el) {\n\
    return el.cloneNode(true);\n\
  });\n\
\n\
  return this.dom(out);\n\
};\n\
//@ sourceURL=component-dom/lib/manipulate.js"
));
require.register("component-dom/lib/classes.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var classes = require('classes');\n\
\n\
/**\n\
 * Add the given class `name`.\n\
 *\n\
 * @param {String} name\n\
 * @return {List} self\n\
 * @api public\n\
 */\n\
\n\
exports.addClass = function(name){\n\
  return this.forEach(function(el) {\n\
    el._classes = el._classes || classes(el);\n\
    el._classes.add(name);\n\
  });\n\
};\n\
\n\
/**\n\
 * Remove the given class `name`.\n\
 *\n\
 * @param {String|RegExp} name\n\
 * @return {List} self\n\
 * @api public\n\
 */\n\
\n\
exports.removeClass = function(name){\n\
  return this.forEach(function(el) {\n\
    el._classes = el._classes || classes(el);\n\
    el._classes.remove(name);\n\
  });\n\
};\n\
\n\
/**\n\
 * Toggle the given class `name`,\n\
 * optionally a `bool` may be given\n\
 * to indicate that the class should\n\
 * be added when truthy.\n\
 *\n\
 * @param {String} name\n\
 * @param {Boolean} bool\n\
 * @return {List} self\n\
 * @api public\n\
 */\n\
\n\
exports.toggleClass = function(name, bool){\n\
  var fn = 'toggle';\n\
\n\
  // toggle with boolean\n\
  if (2 == arguments.length) {\n\
    fn = bool ? 'add' : 'remove';\n\
  }\n\
\n\
  return this.forEach(function(el) {\n\
    el._classes = el._classes || classes(el);\n\
    el._classes[fn](name);\n\
  })\n\
};\n\
\n\
/**\n\
 * Check if the given class `name` is present.\n\
 *\n\
 * @param {String} name\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
exports.hasClass = function(name){\n\
  var el;\n\
\n\
  for(var i = 0, len = this.length; i < len; i++) {\n\
    el = this[i];\n\
    el._classes = el._classes || classes(el);\n\
    if (el._classes.has(name)) return true;\n\
  }\n\
\n\
  return false;\n\
};\n\
//@ sourceURL=component-dom/lib/classes.js"
));
require.register("component-dom/lib/attributes.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var value = require('value');\n\
\n\
/**\n\
 * Set attribute `name` to `val`, or get attr `name`.\n\
 *\n\
 * @param {String} name\n\
 * @param {String} [val]\n\
 * @return {String|List} self\n\
 * @api public\n\
 */\n\
\n\
exports.attr = function(name, val){\n\
  // get\n\
  if (1 == arguments.length) {\n\
    return this[0] && this[0].getAttribute(name);\n\
  }\n\
\n\
  // remove\n\
  if (null == val) {\n\
    return this.removeAttr(name);\n\
  }\n\
\n\
  // set\n\
  return this.forEach(function(el){\n\
    el.setAttribute(name, val);\n\
  });\n\
};\n\
\n\
/**\n\
 * Remove attribute `name`.\n\
 *\n\
 * @param {String} name\n\
 * @return {List} self\n\
 * @api public\n\
 */\n\
\n\
exports.removeAttr = function(name){\n\
  return this.forEach(function(el){\n\
    el.removeAttribute(name);\n\
  });\n\
};\n\
\n\
/**\n\
 * Set property `name` to `val`, or get property `name`.\n\
 *\n\
 * @param {String} name\n\
 * @param {String} [val]\n\
 * @return {Object|List} self\n\
 * @api public\n\
 */\n\
\n\
exports.prop = function(name, val){\n\
  if (1 == arguments.length) {\n\
    return this[0] && this[0][name];\n\
  }\n\
\n\
  return this.forEach(function(el){\n\
    el[name] = val;\n\
  });\n\
};\n\
\n\
/**\n\
 * Get the first element's value or set selected\n\
 * element values to `val`.\n\
 *\n\
 * @param {Mixed} [val]\n\
 * @return {Mixed}\n\
 * @api public\n\
 */\n\
\n\
exports.val =\n\
exports.value = function(val){\n\
  if (0 == arguments.length) {\n\
    return this[0]\n\
      ? value(this[0])\n\
      : undefined;\n\
  }\n\
\n\
  return this.forEach(function(el){\n\
    value(el, val);\n\
  });\n\
};\n\
//@ sourceURL=component-dom/lib/attributes.js"
));
require.register("component-dom/lib/events.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var events = require('event');\n\
var delegate = require('delegate');\n\
\n\
/**\n\
 * Bind to `event` and invoke `fn(e)`. When\n\
 * a `selector` is given then events are delegated.\n\
 *\n\
 * @param {String} event\n\
 * @param {String} [selector]\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {List}\n\
 * @api public\n\
 */\n\
\n\
exports.on = function(event, selector, fn, capture){\n\
  if ('string' == typeof selector) {\n\
    return this.forEach(function (el) {\n\
      fn._delegate = delegate.bind(el, selector, event, fn, capture);\n\
    });\n\
  }\n\
\n\
  capture = fn;\n\
  fn = selector;\n\
\n\
  return this.forEach(function (el) {\n\
    events.bind(el, event, fn, capture);\n\
  });\n\
};\n\
\n\
/**\n\
 * Unbind to `event` and invoke `fn(e)`. When\n\
 * a `selector` is given then delegated event\n\
 * handlers are unbound.\n\
 *\n\
 * @param {String} event\n\
 * @param {String} [selector]\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {List}\n\
 * @api public\n\
 */\n\
\n\
exports.off = function(event, selector, fn, capture){\n\
  if ('string' == typeof selector) {\n\
    return this.forEach(function (el) {\n\
      // TODO: add selector support back\n\
      delegate.unbind(el, event, fn._delegate, capture);\n\
    });\n\
  }\n\
\n\
  capture = fn;\n\
  fn = selector;\n\
\n\
  return this.forEach(function (el) {\n\
    events.unbind(el, event, fn, capture);\n\
  });\n\
};\n\
//@ sourceURL=component-dom/lib/events.js"
));
require.register("component-emitter/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `Emitter`.\n\
 */\n\
\n\
module.exports = Emitter;\n\
\n\
/**\n\
 * Initialize a new `Emitter`.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
function Emitter(obj) {\n\
  if (obj) return mixin(obj);\n\
};\n\
\n\
/**\n\
 * Mixin the emitter properties.\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function mixin(obj) {\n\
  for (var key in Emitter.prototype) {\n\
    obj[key] = Emitter.prototype[key];\n\
  }\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Listen on the given `event` with `fn`.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.on =\n\
Emitter.prototype.addEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
  (this._callbacks[event] = this._callbacks[event] || [])\n\
    .push(fn);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Adds an `event` listener that will be invoked a single\n\
 * time then automatically removed.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.once = function(event, fn){\n\
  var self = this;\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  function on() {\n\
    self.off(event, on);\n\
    fn.apply(this, arguments);\n\
  }\n\
\n\
  on.fn = fn;\n\
  this.on(event, on);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove the given callback for `event` or all\n\
 * registered callbacks.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.off =\n\
Emitter.prototype.removeListener =\n\
Emitter.prototype.removeAllListeners =\n\
Emitter.prototype.removeEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  // all\n\
  if (0 == arguments.length) {\n\
    this._callbacks = {};\n\
    return this;\n\
  }\n\
\n\
  // specific event\n\
  var callbacks = this._callbacks[event];\n\
  if (!callbacks) return this;\n\
\n\
  // remove all handlers\n\
  if (1 == arguments.length) {\n\
    delete this._callbacks[event];\n\
    return this;\n\
  }\n\
\n\
  // remove specific handler\n\
  var cb;\n\
  for (var i = 0; i < callbacks.length; i++) {\n\
    cb = callbacks[i];\n\
    if (cb === fn || cb.fn === fn) {\n\
      callbacks.splice(i, 1);\n\
      break;\n\
    }\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Emit `event` with the given args.\n\
 *\n\
 * @param {String} event\n\
 * @param {Mixed} ...\n\
 * @return {Emitter}\n\
 */\n\
\n\
Emitter.prototype.emit = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  var args = [].slice.call(arguments, 1)\n\
    , callbacks = this._callbacks[event];\n\
\n\
  if (callbacks) {\n\
    callbacks = callbacks.slice(0);\n\
    for (var i = 0, len = callbacks.length; i < len; ++i) {\n\
      callbacks[i].apply(this, args);\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return array of callbacks for `event`.\n\
 *\n\
 * @param {String} event\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.listeners = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  return this._callbacks[event] || [];\n\
};\n\
\n\
/**\n\
 * Check if this emitter has `event` handlers.\n\
 *\n\
 * @param {String} event\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.hasListeners = function(event){\n\
  return !! this.listeners(event).length;\n\
};\n\
//@ sourceURL=component-emitter/index.js"
));
require.register("ianstormtaylor-redraw/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `redraw`.\n\
 */\n\
\n\
module.exports = redraw;\n\
\n\
\n\
/**\n\
 * Force a redraw on an `el`.\n\
 *\n\
 * @param {Element} el\n\
 */\n\
\n\
function redraw (el) {\n\
  el.offsetHeight;\n\
}//@ sourceURL=ianstormtaylor-redraw/index.js"
));
require.register("jkroso-classes/index.js", Function("exports, require, module",
"\n\
module.exports = document.createElement('div').classList\n\
  ? require('./modern')\n\
  : require('./fallback')//@ sourceURL=jkroso-classes/index.js"
));
require.register("jkroso-classes/fallback.js", Function("exports, require, module",
"\n\
var index = require('indexof')\n\
\n\
exports.add = function(name, el){\n\
\tvar arr = exports.array(el)\n\
\tif (index(arr, name) < 0) {\n\
\t\tarr.push(name)\n\
\t\tel.className = arr.join(' ')\n\
\t}\n\
}\n\
\n\
exports.remove = function(name, el){\n\
\tif (name instanceof RegExp) {\n\
\t\treturn exports.removeMatching(name, el)\n\
\t}\n\
\tvar arr = exports.array(el)\n\
\tvar i = index(arr, name)\n\
\tif (i >= 0) {\n\
\t\tarr.splice(i, 1)\n\
\t\tel.className = arr.join(' ')\n\
\t}\n\
}\n\
\n\
exports.removeMatching = function(re, el){\n\
\tvar arr = exports.array(el)\n\
\tfor (var i = 0; i < arr.length;) {\n\
\t\tif (re.test(arr[i])) arr.splice(i, 1)\n\
\t\telse i++\n\
\t}\n\
\tel.className = arr.join(' ')\n\
}\n\
\n\
exports.toggle = function(name, el){\n\
\tif (exports.has(name, el)) {\n\
\t\texports.remove(name, el)\n\
\t} else {\n\
\t\texports.add(name, el)\n\
\t}\n\
}\n\
\n\
exports.array = function(el){\n\
\treturn el.className.match(/([^\\s]+)/g) || []\n\
}\n\
\n\
exports.has =\n\
exports.contains = function(name, el){\n\
\treturn index(exports.array(el), name) >= 0\n\
}//@ sourceURL=jkroso-classes/fallback.js"
));
require.register("jkroso-classes/modern.js", Function("exports, require, module",
"\n\
/**\n\
 * Add class `name` if not already present.\n\
 *\n\
 * @param {String} name\n\
 * @param {Element} el\n\
 * @api public\n\
 */\n\
\n\
exports.add = function(name, el){\n\
\tel.classList.add(name)\n\
}\n\
\n\
/**\n\
 * Remove `name` if present\n\
 *\n\
 * @param {String|RegExp} name\n\
 * @param {Element} el\n\
 * @api public\n\
 */\n\
\n\
exports.remove = function(name, el){\n\
\tif (name instanceof RegExp) {\n\
\t\treturn exports.removeMatching(name, el)\n\
\t}\n\
\tel.classList.remove(name)\n\
}\n\
\n\
/**\n\
 * Remove all classes matching `re`.\n\
 *\n\
 * @param {RegExp} re\n\
 * @param {Element} el\n\
 * @api public\n\
 */\n\
\n\
exports.removeMatching = function(re, el){\n\
\tvar arr = exports.array(el)\n\
\tfor (var i = 0; i < arr.length; i++) {\n\
\t\tif (re.test(arr[i])) el.classList.remove(arr[i])\n\
\t}\n\
}\n\
\n\
/**\n\
 * Toggle class `name`.\n\
 *\n\
 * @param {String} name\n\
 * @param {Element} el\n\
 * @api public\n\
 */\n\
\n\
exports.toggle = function(name, el){\n\
\tel.classList.toggle(name)\n\
}\n\
\n\
/**\n\
 * Return an array of classes.\n\
 *\n\
 * @param {Element} el\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
exports.array = function(el){\n\
\treturn el.className.match(/([^\\s]+)/g) || []\n\
}\n\
\n\
/**\n\
 * Check if class `name` is present.\n\
 *\n\
 * @param {String} name\n\
 * @param {Element} el\n\
 * @api public\n\
 */\n\
\n\
exports.has =\n\
exports.contains = function(name, el){\n\
\treturn el.classList.contains(name)\n\
}//@ sourceURL=jkroso-classes/modern.js"
));
require.register("ianstormtaylor-classes/index.js", Function("exports, require, module",
"\n\
var classes = require('classes');\n\
\n\
\n\
/**\n\
 * Expose `mixin`.\n\
 */\n\
\n\
module.exports = exports = mixin;\n\
\n\
\n\
/**\n\
 * Mixin the classes methods.\n\
 *\n\
 * @param {Object} object\n\
 * @return {Object}\n\
 */\n\
\n\
function mixin (obj) {\n\
  for (var method in exports) obj[method] = exports[method];\n\
  return obj;\n\
}\n\
\n\
\n\
/**\n\
 * Add a class.\n\
 *\n\
 * @param {String} name\n\
 * @return {Object}\n\
 */\n\
\n\
exports.addClass = function (name) {\n\
  classes.add(name, this.el);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Remove a class.\n\
 *\n\
 * @param {String} name\n\
 * @return {Object}\n\
 */\n\
\n\
exports.removeClass = function (name) {\n\
  classes.remove(name, this.el);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Has a class?\n\
 *\n\
 * @param {String} name\n\
 * @return {Boolean}\n\
 */\n\
\n\
exports.hasClass = function (name) {\n\
  return classes.has(name, this.el);\n\
};\n\
\n\
\n\
/**\n\
 * Toggle a class.\n\
 *\n\
 * @param {String} name\n\
 * @return {Object}\n\
 */\n\
\n\
exports.toggleClass = function (name) {\n\
  classes.toggle(name, this.el);\n\
  return this;\n\
};\n\
//@ sourceURL=ianstormtaylor-classes/index.js"
));
require.register("component-bind/index.js", Function("exports, require, module",
"/**\n\
 * Slice reference.\n\
 */\n\
\n\
var slice = [].slice;\n\
\n\
/**\n\
 * Bind `obj` to `fn`.\n\
 *\n\
 * @param {Object} obj\n\
 * @param {Function|String} fn or string\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(obj, fn){\n\
  if ('string' == typeof fn) fn = obj[fn];\n\
  if ('function' != typeof fn) throw new Error('bind() requires a function');\n\
  var args = slice.call(arguments, 2);\n\
  return function(){\n\
    return fn.apply(obj, args.concat(slice.call(arguments)));\n\
  }\n\
};\n\
//@ sourceURL=component-bind/index.js"
));
require.register("segmentio-bind-all/index.js", Function("exports, require, module",
"\n\
try {\n\
  var bind = require('bind');\n\
  var type = require('type');\n\
} catch (e) {\n\
  var bind = require('bind-component');\n\
  var type = require('type-component');\n\
}\n\
\n\
module.exports = function (obj) {\n\
  for (var key in obj) {\n\
    var val = obj[key];\n\
    if (type(val) === 'function') obj[key] = bind(obj, obj[key]);\n\
  }\n\
  return obj;\n\
};//@ sourceURL=segmentio-bind-all/index.js"
));
require.register("segmentio-on-escape/index.js", Function("exports, require, module",
"\n\
var bind = require('event').bind\n\
  , indexOf = require('indexof');\n\
\n\
\n\
/**\n\
 * Expose `onEscape`.\n\
 */\n\
\n\
module.exports = exports = onEscape;\n\
\n\
\n\
/**\n\
 * Handlers.\n\
 */\n\
\n\
var fns = [];\n\
\n\
\n\
/**\n\
 * Escape binder.\n\
 *\n\
 * @param {Function} fn\n\
 */\n\
\n\
function onEscape (fn) {\n\
  fns.push(fn);\n\
}\n\
\n\
\n\
/**\n\
 * Bind a handler, for symmetry.\n\
 */\n\
\n\
exports.bind = onEscape;\n\
\n\
\n\
/**\n\
 * Unbind a handler.\n\
 *\n\
 * @param {Function} fn\n\
 */\n\
\n\
exports.unbind = function (fn) {\n\
  var index = indexOf(fns, fn);\n\
  if (index !== -1) fns.splice(index, 1);\n\
};\n\
\n\
\n\
/**\n\
 * Bind to `document` once.\n\
 */\n\
\n\
bind(document, 'keydown', function (e) {\n\
  if (27 !== e.keyCode) return;\n\
  for (var i = 0, fn; fn = fns[i]; i++) fn(e);\n\
});//@ sourceURL=segmentio-on-escape/index.js"
));
require.register("segmentio-overlay/lib/index.js", Function("exports, require, module",
"\n\
var after = require('after-transition').once\n\
  , bindAll = require('bind-all')\n\
  , Classes = require('classes')\n\
  , domify = require('domify')\n\
  , Emitter = require('emitter')\n\
  , escape = require('on-escape')\n\
  , event = require('event')\n\
  , redraw = require('redraw')\n\
  , template = require('./index.html');\n\
\n\
\n\
/**\n\
 * Expose `Overlay`.\n\
 */\n\
\n\
module.exports = Overlay;\n\
\n\
\n\
/**\n\
 * Initialize a new `Overlay`.\n\
 *\n\
 * @param {Element} target (optional)\n\
 */\n\
\n\
function Overlay (target) {\n\
  if (!(this instanceof Overlay)) return new Overlay(target);\n\
  bindAll(this);\n\
  this.el = domify(template);\n\
  if (!target) {\n\
    target = document.body;\n\
    this.addClass('fixed');\n\
  }\n\
  target.appendChild(this.el);\n\
  redraw(this.el); // to force an initial show to take\n\
}\n\
\n\
\n\
/**\n\
 * Mixin emitter.\n\
 */\n\
\n\
Emitter(Overlay.prototype);\n\
\n\
\n\
/**\n\
 * Mixin classes.\n\
 */\n\
\n\
Classes(Overlay.prototype);\n\
\n\
\n\
/**\n\
 * Show the overlay.\n\
 *\n\
 * @param {Function} callback\n\
 * @return {Overlay}\n\
 */\n\
\n\
Overlay.prototype.show = function (callback) {\n\
  var visible = ! this.hasClass('hidden');\n\
  var showing = this.hasClass('showing');\n\
\n\
  if('function' === typeof callback) {\n\
    visible && !showing ? callback() : this.once('show', callback);\n\
  }\n\
\n\
  if (visible || showing) return this;\n\
  this.addClass('showing');\n\
  this.emit('showing');\n\
\n\
  var self = this;\n\
  after(this.el, function () {\n\
    self.removeClass('showing');\n\
    self.emit('show');\n\
  });\n\
\n\
  this.removeClass('hidden');\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Hide the overlay.\n\
 *\n\
 * @param {Function} callback\n\
 * @return {Overlay}\n\
 */\n\
\n\
Overlay.prototype.hide = function (callback) {\n\
  var hidden = this.hasClass('hidden');\n\
  var hiding = this.hasClass('hiding');\n\
\n\
  if ('function' === typeof callback) {\n\
    hidden && !hiding ? callback() : this.once('hide', callback);\n\
  }\n\
\n\
  if (hidden || hiding) return this;\n\
  this.addClass('hiding');\n\
  this.emit('hiding');\n\
\n\
  var self = this;\n\
  after(this.el, function () {\n\
    self.removeClass('hiding');\n\
    self.emit('hide');\n\
  });\n\
\n\
  this.addClass('hidden');\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Remove the overlay from the DOM, hiding it first if it isn't hidden.\n\
 *\n\
 * @param {Function} callback\n\
 * @return {Overlay}\n\
 */\n\
\n\
Overlay.prototype.remove = function (callback) {\n\
  var removed = ! this.el.parentNode;\n\
  var removing = this.hasClass('removing');\n\
\n\
  if ('function' === typeof callback) {\n\
    removed && !removing ? callback() : this.once('remove', callback);\n\
  }\n\
\n\
  if (removed || removing) return this;\n\
  this.addClass('removing');\n\
  this.emit('removing');\n\
\n\
  var self = this;\n\
  var el = this.el;\n\
  this.hide(function () {\n\
    el.parentNode.removeChild(el);\n\
    self.removeClass('removing');\n\
    self.emit('remove');\n\
  });\n\
\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Bind to closeable events.\n\
 *\n\
 * @return {Overlay}\n\
 * @api private\n\
 */\n\
\n\
Overlay.prototype.bind = function () {\n\
  event.bind(this.el, 'click', this.hide);\n\
  escape.bind(this.hide);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Unbind from closeable events.\n\
 *\n\
 * @return {Overlay}\n\
 * @api private\n\
 */\n\
\n\
Overlay.prototype.unbind = function () {\n\
  event.unbind(this.el, 'click', this.hide);\n\
  escape.unbind(this.hide);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Make the overlay closeable.\n\
 *\n\
 * @return {Overlay}\n\
 */\n\
\n\
Overlay.prototype.closeable =\n\
Overlay.prototype.closable = function () {\n\
  this.addClass('closeable').addClass('closable');\n\
  this.on('show', this.bind);\n\
  this.on('hide', this.unbind);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Make the overlay temporary, so that it will be removed when hidden.\n\
 *\n\
 * @return {Overlay}\n\
 */\n\
\n\
Overlay.prototype.temporary = function () {\n\
  this.addClass('temporary');\n\
  this.on('hide', this.remove);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Attach or invoke callbacks for an\n\
 *///@ sourceURL=segmentio-overlay/lib/index.js"
));
require.register("yields-has-transitions/index.js", Function("exports, require, module",
"/**\n\
 * Check if `el` or browser supports transitions.\n\
 *\n\
 * @param {Element} el\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
exports = module.exports = function(el){\n\
  switch (arguments.length) {\n\
    case 0: return bool;\n\
    case 1: return bool\n\
      ? transitions(el)\n\
      : bool;\n\
  }\n\
};\n\
\n\
/**\n\
 * Check if the given `el` has transitions.\n\
 *\n\
 * @param {Element} el\n\
 * @return {Boolean}\n\
 * @api private\n\
 */\n\
\n\
function transitions(el, styl){\n\
  if (el.transition) return true;\n\
  styl = window.getComputedStyle(el);\n\
  return !! parseFloat(styl.transitionDuration, 10);\n\
}\n\
\n\
/**\n\
 * Style.\n\
 */\n\
\n\
var styl = document.body.style;\n\
\n\
/**\n\
 * Export support.\n\
 */\n\
\n\
var bool = 'transition' in styl\n\
  || 'webkitTransition' in styl\n\
  || 'MozTransition' in styl\n\
  || 'msTransition' in styl;\n\
//@ sourceURL=yields-has-transitions/index.js"
));
require.register("ecarter-css-emitter/index.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var events = require('event');\n\
\n\
// CSS events\n\
\n\
var watch = [\n\
  'transitionend'\n\
, 'webkitTransitionEnd'\n\
, 'oTransitionEnd'\n\
, 'MSTransitionEnd'\n\
, 'animationend'\n\
, 'webkitAnimationEnd'\n\
, 'oAnimationEnd'\n\
, 'MSAnimationEnd'\n\
];\n\
\n\
/**\n\
 * Expose `CSSnext`\n\
 */\n\
\n\
module.exports = CssEmitter;\n\
\n\
/**\n\
 * Initialize a new `CssEmitter`\n\
 *\n\
 */\n\
\n\
function CssEmitter(element){\n\
  if (!(this instanceof CssEmitter)) return new CssEmitter(element);\n\
  this.el = element;\n\
}\n\
\n\
/**\n\
 * Bind CSS events.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
CssEmitter.prototype.bind = function(fn){\n\
  for (var i=0; i < watch.length; i++) {\n\
    events.bind(this.el, watch[i], fn);\n\
  }\n\
};\n\
\n\
/**\n\
 * Unbind CSS events\n\
 * \n\
 * @api public\n\
 */\n\
\n\
CssEmitter.prototype.unbind = function(fn){\n\
  for (var i=0; i < watch.length; i++) {\n\
    events.unbind(this.el, watch[i], fn);\n\
  }\n\
};\n\
\n\
\n\
//@ sourceURL=ecarter-css-emitter/index.js"
));
require.register("component-once/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Identifier.\n\
 */\n\
\n\
var n = 0;\n\
\n\
/**\n\
 * Global.\n\
 */\n\
\n\
var global = (function(){ return this })();\n\
\n\
/**\n\
 * Make `fn` callable only once.\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(fn) {\n\
  var id = n++;\n\
  var called;\n\
\n\
  function once(){\n\
    // no receiver\n\
    if (this == global) {\n\
      if (called) return;\n\
      called = true;\n\
      return fn.apply(this, arguments);\n\
    }\n\
\n\
    // receiver\n\
    var key = '__called_' + id + '__';\n\
    if (this[key]) return;\n\
    this[key] = true;\n\
    return fn.apply(this, arguments);\n\
  }\n\
\n\
  return once;\n\
};\n\
//@ sourceURL=component-once/index.js"
));
require.register("yields-after-transition/index.js", Function("exports, require, module",
"\n\
/**\n\
 * dependencies\n\
 */\n\
\n\
var has = require('has-transitions')\n\
  , emitter = require('css-emitter')\n\
  , once = require('once');\n\
\n\
/**\n\
 * Transition support.\n\
 */\n\
\n\
var supported = has();\n\
\n\
/**\n\
 * Export `after`\n\
 */\n\
\n\
module.exports = after;\n\
\n\
/**\n\
 * Invoke the given `fn` after transitions\n\
 *\n\
 * It will be invoked only if the browser\n\
 * supports transitions __and__\n\
 * the element has transitions\n\
 * set in `.style` or css.\n\
 *\n\
 * @param {Element} el\n\
 * @param {Function} fn\n\
 * @return {Function} fn\n\
 * @api public\n\
 */\n\
\n\
function after(el, fn){\n\
  if (!supported || !has(el)) return fn();\n\
  emitter(el).bind(fn);\n\
  return fn;\n\
};\n\
\n\
/**\n\
 * Same as `after()` only the function is invoked once.\n\
 *\n\
 * @param {Element} el\n\
 * @param {Function} fn\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
after.once = function(el, fn){\n\
  var callback = once(fn);\n\
  after(el, fn = function(){\n\
    emitter(el).unbind(fn);\n\
    callback();\n\
  });\n\
};\n\
//@ sourceURL=yields-after-transition/index.js"
));
require.register("segmentio-modal/lib/index.js", Function("exports, require, module",
"\n\
var after = require('after-transition').once\n\
  , bind = require('event').bind\n\
  , classes = require('classes')\n\
  , domify = require('domify')\n\
  , Emitter = require('emitter')\n\
  , overlay = require('overlay')\n\
  , redraw = require('redraw')\n\
  , template = require('./index.html');\n\
\n\
\n\
/**\n\
 * Expose `Modal`.\n\
 */\n\
\n\
module.exports = Modal;\n\
\n\
\n\
/**\n\
 * Initialize a new `Modal`.\n\
 *\n\
 * @param {Element} el\n\
 */\n\
\n\
function Modal (el) {\n\
  if (!(this instanceof Modal)) return new Modal(el);\n\
  this.view = el;\n\
  this.overlay = overlay().addClass('modal-overlay');\n\
  this.wrapper = domify(template);\n\
  this.modal = this.wrapper.querySelector('div');\n\
  this.close = this.wrapper.querySelector('a');\n\
  this.modal.appendChild(this.view);\n\
  this.bind();\n\
  document.body.appendChild(this.wrapper);\n\
  redraw(this.wrapper); // to force an initial show to take\n\
}\n\
\n\
\n\
/**\n\
 * Mixin emitter.\n\
 */\n\
\n\
Emitter(Modal.prototype);\n\
\n\
\n\
/**\n\
 * Bind to DOM events.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Modal.prototype.bind = function () {\n\
  var hide = this.hide.bind(this);\n\
  this.overlay.on('hiding', hide);\n\
  bind(this.close, 'click', hide);\n\
};\n\
\n\
\n\
/**\n\
 * Show the modal.\n\
 *\n\
 * @param {Function} callback\n\
 * @return {Modal}\n\
 */\n\
\n\
Modal.prototype.show = function (callback) {\n\
  var self = this;\n\
  this.overlay.show(function () {\n\
    self.emit('show');\n\
    if ('function' === typeof callback) callback();\n\
  });\n\
  this.removeClass('hidden', true);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Hide the modal.\n\
 *\n\
 * @param {Function} callback\n\
 * @return {Modal}\n\
 */\n\
\n\
Modal.prototype.hide = function (callback) {\n\
  var self = this;\n\
  this.overlay.hide(function () {\n\
    self.emit('hide');\n\
    if ('function' === typeof callback) callback();\n\
  });\n\
  this.addClass('hidden', true);\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Remove the modal from the DOM.\n\
 *\n\
 * @param {Function} callback\n\
 * @return {Modal}\n\
 */\n\
\n\
Modal.prototype.remove = function (callback) {\n\
  var self = this;\n\
  var wrapper = this.wrapper;\n\
  this.overlay.remove(function () {\n\
    if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);\n\
    self.emit('remove');\n\
    if ('function' === typeof callback) callback();\n\
  });\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Make the modal closeable.\n\
 *\n\
 * @return {Modal}\n\
 */\n\
\n\
Modal.prototype.closeable =\n\
Modal.prototype.closable = function () {\n\
  this.overlay.closeable();\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Make the modal temporary.\n\
 *\n\
 * @return {Modal}\n\
 */\n\
\n\
Modal.prototype.temporary = function () {\n\
  this.overlay.temporary();\n\
  var self = this;\n\
  this.overlay.on('remove', function () {\n\
    self.remove();\n\
  });\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Add a class to the modal. If the `all` flag is set, then it will add the\n\
 * class to the overlay and wrapper too, for styling purposes.\n\
 *\n\
 * @param {String} name\n\
 * @param {Boolean} all\n\
 * @return {Modal}\n\
 */\n\
\n\
Modal.prototype.addClass = function (name, all) {\n\
  classes(this.modal).add(name);\n\
  if (all) {\n\
    classes(this.wrapper).add(name);\n\
    this.overlay.addClass(name);\n\
  }\n\
  return this;\n\
};\n\
\n\
\n\
/**\n\
 * Remove a class from the modal. If the `all` flag is set, then it will remove\n\
 * the class from the overlay and wrapper too, for styling purposes.\n\
 *\n\
 * @param {String} name\n\
 * @param {Boolean} all\n\
 * @return {Modal}\n\
 */\n\
\n\
Modal.prototype.removeClass = function (name, all) {\n\
  classes(this.modal).remove(name);\n\
  if (all) {\n\
    classes(this.wrapper).remove(name);\n\
    this.overlay.removeClass(name);\n\
  }\n\
  return this;\n\
};\n\
//@ sourceURL=segmentio-modal/lib/index.js"
));
require.register("component-raf/index.js", Function("exports, require, module",
"\n\
module.exports = window.requestAnimationFrame\n\
  || window.webkitRequestAnimationFrame\n\
  || window.mozRequestAnimationFrame\n\
  || window.oRequestAnimationFrame\n\
  || window.msRequestAnimationFrame\n\
  || fallback;\n\
\n\
var prev = new Date().getTime();\n\
function fallback(fn) {\n\
  var curr = new Date().getTime();\n\
  var ms = Math.max(0, 16 - (curr - prev));\n\
  setTimeout(fn, ms);\n\
  prev = curr;\n\
}\n\
//@ sourceURL=component-raf/index.js"
));
require.register("component-ease/index.js", Function("exports, require, module",
"\n\
exports.linear = function(n){\n\
  return n;\n\
};\n\
\n\
exports.inQuad = function(n){\n\
  return n * n;\n\
};\n\
\n\
exports.outQuad = function(n){\n\
  return n * (2 - n);\n\
};\n\
\n\
exports.inOutQuad = function(n){\n\
  n *= 2;\n\
  if (n < 1) return 0.5 * n * n;\n\
  return - 0.5 * (--n * (n - 2) - 1);\n\
};\n\
\n\
exports.inCube = function(n){\n\
  return n * n * n;\n\
};\n\
\n\
exports.outCube = function(n){\n\
  return --n * n * n + 1;\n\
};\n\
\n\
exports.inOutCube = function(n){\n\
  n *= 2;\n\
  if (n < 1) return 0.5 * n * n * n;\n\
  return 0.5 * ((n -= 2 ) * n * n + 2);\n\
};\n\
\n\
exports.inQuart = function(n){\n\
  return n * n * n * n;\n\
};\n\
\n\
exports.outQuart = function(n){\n\
  return 1 - (--n * n * n * n);\n\
};\n\
\n\
exports.inOutQuart = function(n){\n\
  n *= 2;\n\
  if (n < 1) return 0.5 * n * n * n * n;\n\
  return -0.5 * ((n -= 2) * n * n * n - 2);\n\
};\n\
\n\
exports.inQuint = function(n){\n\
  return n * n * n * n * n;\n\
}\n\
\n\
exports.outQuint = function(n){\n\
  return --n * n * n * n * n + 1;\n\
}\n\
\n\
exports.inOutQuint = function(n){\n\
  n *= 2;\n\
  if (n < 1) return 0.5 * n * n * n * n * n;\n\
  return 0.5 * ((n -= 2) * n * n * n * n + 2);\n\
};\n\
\n\
exports.inSine = function(n){\n\
  return 1 - Math.cos(n * Math.PI / 2 );\n\
};\n\
\n\
exports.outSine = function(n){\n\
  return Math.sin(n * Math.PI / 2);\n\
};\n\
\n\
exports.inOutSine = function(n){\n\
  return .5 * (1 - Math.cos(Math.PI * n));\n\
};\n\
\n\
exports.inExpo = function(n){\n\
  return 0 == n ? 0 : Math.pow(1024, n - 1);\n\
};\n\
\n\
exports.outExpo = function(n){\n\
  return 1 == n ? n : 1 - Math.pow(2, -10 * n);\n\
};\n\
\n\
exports.inOutExpo = function(n){\n\
  if (0 == n) return 0;\n\
  if (1 == n) return 1;\n\
  if ((n *= 2) < 1) return .5 * Math.pow(1024, n - 1);\n\
  return .5 * (-Math.pow(2, -10 * (n - 1)) + 2);\n\
};\n\
\n\
exports.inCirc = function(n){\n\
  return 1 - Math.sqrt(1 - n * n);\n\
};\n\
\n\
exports.outCirc = function(n){\n\
  return Math.sqrt(1 - (--n * n));\n\
};\n\
\n\
exports.inOutCirc = function(n){\n\
  n *= 2\n\
  if (n < 1) return -0.5 * (Math.sqrt(1 - n * n) - 1);\n\
  return 0.5 * (Math.sqrt(1 - (n -= 2) * n) + 1);\n\
};\n\
\n\
exports.inBack = function(n){\n\
  var s = 1.70158;\n\
  return n * n * (( s + 1 ) * n - s);\n\
};\n\
\n\
exports.outBack = function(n){\n\
  var s = 1.70158;\n\
  return --n * n * ((s + 1) * n + s) + 1;\n\
};\n\
\n\
exports.inOutBack = function(n){\n\
  var s = 1.70158 * 1.525;\n\
  if ( ( n *= 2 ) < 1 ) return 0.5 * ( n * n * ( ( s + 1 ) * n - s ) );\n\
  return 0.5 * ( ( n -= 2 ) * n * ( ( s + 1 ) * n + s ) + 2 );\n\
};\n\
\n\
exports.inBounce = function(n){\n\
  return 1 - exports.outBounce(1 - n);\n\
};\n\
\n\
exports.outBounce = function(n){\n\
  if ( n < ( 1 / 2.75 ) ) {\n\
    return 7.5625 * n * n;\n\
  } else if ( n < ( 2 / 2.75 ) ) {\n\
    return 7.5625 * ( n -= ( 1.5 / 2.75 ) ) * n + 0.75;\n\
  } else if ( n < ( 2.5 / 2.75 ) ) {\n\
    return 7.5625 * ( n -= ( 2.25 / 2.75 ) ) * n + 0.9375;\n\
  } else {\n\
    return 7.5625 * ( n -= ( 2.625 / 2.75 ) ) * n + 0.984375;\n\
  }\n\
};\n\
\n\
exports.inOutBounce = function(n){\n\
  if (n < .5) return exports.inBounce(n * 2) * .5;\n\
  return exports.outBounce(n * 2 - 1) * .5 + .5;\n\
};\n\
\n\
// aliases\n\
\n\
exports['in-quad'] = exports.inQuad;\n\
exports['out-quad'] = exports.outQuad;\n\
exports['in-out-quad'] = exports.inOutQuad;\n\
exports['in-cube'] = exports.inCube;\n\
exports['out-cube'] = exports.outCube;\n\
exports['in-out-cube'] = exports.inOutCube;\n\
exports['in-quart'] = exports.inQuart;\n\
exports['out-quart'] = exports.outQuart;\n\
exports['in-out-quart'] = exports.inOutQuart;\n\
exports['in-quint'] = exports.inQuint;\n\
exports['out-quint'] = exports.outQuint;\n\
exports['in-out-quint'] = exports.inOutQuint;\n\
exports['in-sine'] = exports.inSine;\n\
exports['out-sine'] = exports.outSine;\n\
exports['in-out-sine'] = exports.inOutSine;\n\
exports['in-expo'] = exports.inExpo;\n\
exports['out-expo'] = exports.outExpo;\n\
exports['in-out-expo'] = exports.inOutExpo;\n\
exports['in-circ'] = exports.inCirc;\n\
exports['out-circ'] = exports.outCirc;\n\
exports['in-out-circ'] = exports.inOutCirc;\n\
exports['in-back'] = exports.inBack;\n\
exports['out-back'] = exports.outBack;\n\
exports['in-out-back'] = exports.inOutBack;\n\
exports['in-bounce'] = exports.inBounce;\n\
exports['out-bounce'] = exports.outBounce;\n\
exports['in-out-bounce'] = exports.inOutBounce;\n\
//@ sourceURL=component-ease/index.js"
));
require.register("component-tween/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Emitter = require('emitter')\n\
  , ease = require('ease');\n\
\n\
/**\n\
 * Expose `Tween`.\n\
 */\n\
\n\
module.exports = Tween;\n\
\n\
/**\n\
 * Initialize a new `Tween` with `obj`.\n\
 *\n\
 * @param {Object|Array} obj\n\
 * @api public\n\
 */\n\
\n\
function Tween(obj) {\n\
  if (!(this instanceof Tween)) return new Tween(obj);\n\
  this._from = obj;\n\
  this.ease('linear');\n\
  this.duration(500);\n\
}\n\
\n\
/**\n\
 * Mixin emitter.\n\
 */\n\
\n\
Emitter(Tween.prototype);\n\
\n\
/**\n\
 * Reset the tween.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
Tween.prototype.reset = function(){\n\
  this.isArray = Array.isArray(this._from);\n\
  this._curr = clone(this._from);\n\
  this._done = false;\n\
  this._start = Date.now();\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Tween to `obj` and reset internal state.\n\
 *\n\
 *    tween.to({ x: 50, y: 100 })\n\
 *\n\
 * @param {Object|Array} obj\n\
 * @return {Tween} self\n\
 * @api public\n\
 */\n\
\n\
Tween.prototype.to = function(obj){\n\
  this.reset();\n\
  this._to = obj;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set duration to `ms` [500].\n\
 *\n\
 * @param {Number} ms\n\
 * @return {Tween} self\n\
 * @api public\n\
 */\n\
\n\
Tween.prototype.duration = function(ms){\n\
  this._duration = ms;\n\
  this._end = this._start + this._duration;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set easing function to `fn`.\n\
 *\n\
 *    tween.ease('in-out-sine')\n\
 *\n\
 * @param {String|Function} fn\n\
 * @return {Tween}\n\
 * @api public\n\
 */\n\
\n\
Tween.prototype.ease = function(fn){\n\
  fn = 'function' == typeof fn ? fn : ease[fn];\n\
  if (!fn) throw new TypeError('invalid easing function');\n\
  this._ease = fn;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Perform a step.\n\
 *\n\
 * @return {Tween} self\n\
 * @api private\n\
 */\n\
\n\
Tween.prototype.step = function(){\n\
  if (this._done) return;\n\
\n\
  // duration\n\
  var duration = this._duration;\n\
  var end = this._end;\n\
  var now = Date.now();\n\
  var delta = now - this._start;\n\
  var done = delta >= duration;\n\
\n\
  // complete\n\
  if (done) {\n\
    this._from = this._curr;\n\
    this._done = true;\n\
    this.emit('end')\n\
    return;\n\
  }\n\
\n\
  // tween\n\
  var from = this._from;\n\
  var to = this._to;\n\
  var curr = this._curr;\n\
  var fn = this._ease;\n\
  var p = (now - this._start) / duration;\n\
  var n = fn(p);\n\
\n\
  // array\n\
  if (this.isArray) {\n\
    for (var i = 0; i < from.length; ++i) {\n\
      curr[i] = from[i] + (to[i] - from[i]) * n;\n\
    }\n\
\n\
    this._update(curr);\n\
    return this;\n\
  }\n\
\n\
  // objech\n\
  for (var k in from) {\n\
    curr[k] = from[k] + (to[k] - from[k]) * n;\n\
  }\n\
\n\
  this._update(curr);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set update function to `fn` or\n\
 * when no argument is given this performs\n\
 * a \"step\".\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Tween} self\n\
 * @api public\n\
 */\n\
\n\
Tween.prototype.update = function(fn){\n\
  if (0 == arguments.length) return this.step();\n\
  this._update = fn;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Clone `obj`.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
function clone(obj) {\n\
  if (Array.isArray(obj)) return obj.slice();\n\
  var ret = {};\n\
  for (var key in obj) ret[key] = obj[key];\n\
  return ret;\n\
}//@ sourceURL=component-tween/index.js"
));
require.register("component-scroll-to/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Tween = require('tween');\n\
var raf = require('raf');\n\
\n\
/**\n\
 * Expose `scrollTo`.\n\
 */\n\
\n\
module.exports = scrollTo;\n\
\n\
/**\n\
 * Scroll to `(x, y)`.\n\
 *\n\
 * @param {Number} x\n\
 * @param {Number} y\n\
 * @api public\n\
 */\n\
\n\
function scrollTo(x, y, options) {\n\
  options = options || {};\n\
\n\
  // start position\n\
  var start = scroll();\n\
\n\
  // setup tween\n\
  var tween = Tween(start)\n\
    .ease(options.ease || 'out-circ')\n\
    .to({ top: y, left: x })\n\
    .duration(options.duration || 1000);\n\
\n\
  // scroll\n\
  tween.update(function(o){\n\
    window.scrollTo(o.left | 0, o.top | 0);\n\
  });\n\
\n\
  // handle end\n\
  tween.on('end', function(){\n\
    animate = function(){};\n\
  });\n\
\n\
  // animate\n\
  function animate() {\n\
    raf(animate);\n\
    tween.update();\n\
  }\n\
\n\
  animate();\n\
  \n\
  return tween;\n\
}\n\
\n\
/**\n\
 * Return scroll position.\n\
 *\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function scroll() {\n\
  var y = window.pageYOffset || document.documentElement.scrollTop;\n\
  var x = window.pageXOffset || document.documentElement.scrollLeft;\n\
  return { top: y, left: x };\n\
}\n\
//@ sourceURL=component-scroll-to/index.js"
));


require.register("whyohwhyamihere-is-mobile/index.js", Function("exports, require, module",
"module.exports = function() {\n\
    var check = false;\n\
    (function(a){if(/(android|bb\\d+|meego).+mobile|avantgo|bada\\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\\-(n|u)|c55\\/|capi|ccwa|cdm\\-|cell|chtm|cldc|cmd\\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\\-s|devi|dica|dmob|do(c|p)o|ds(12|\\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\\-|_)|g1 u|g560|gene|gf\\-5|g\\-mo|go(\\.w|od)|gr(ad|un)|haie|hcit|hd\\-(m|p|t)|hei\\-|hi(pt|ta)|hp( i|ip)|hs\\-c|ht(c(\\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\\-(20|go|ma)|i230|iac( |\\-|\\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\\/)|klon|kpt |kwc\\-|kyo(c|k)|le(no|xi)|lg( g|\\/(k|l|u)|50|54|\\-[a-w])|libw|lynx|m1\\-w|m3ga|m50\\/|ma(te|ui|xo)|mc(01|21|ca)|m\\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\\-2|po(ck|rt|se)|prox|psio|pt\\-g|qa\\-a|qc(07|12|21|32|60|\\-[2-7]|i\\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\\-|oo|p\\-)|sdk\\/|se(c(\\-|0|1)|47|mc|nd|ri)|sgh\\-|shar|sie(\\-|m)|sk\\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\\-|v\\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\\-|tdg\\-|tel(i|m)|tim\\-|t\\-mo|to(pl|sh)|ts(70|m\\-|m3|m5)|tx\\-9|up(\\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\\-|your|zeto|zte\\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);\n\
    return check; \n\
}//@ sourceURL=whyohwhyamihere-is-mobile/index.js"
));
require.register("component-reduce/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Reduce `arr` with `fn`.\n\
 *\n\
 * @param {Array} arr\n\
 * @param {Function} fn\n\
 * @param {Mixed} initial\n\
 *\n\
 * TODO: combatible error handling?\n\
 */\n\
\n\
module.exports = function(arr, fn, initial){  \n\
  var idx = 0;\n\
  var len = arr.length;\n\
  var curr = arguments.length == 3\n\
    ? initial\n\
    : arr[idx++];\n\
\n\
  while (idx < len) {\n\
    curr = fn.call(null, curr, arr[idx], ++idx, arr);\n\
  }\n\
  \n\
  return curr;\n\
};//@ sourceURL=component-reduce/index.js"
));
require.register("visionmedia-superagent/lib/client.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Emitter = require('emitter');\n\
var reduce = require('reduce');\n\
\n\
/**\n\
 * Root reference for iframes.\n\
 */\n\
\n\
var root = 'undefined' == typeof window\n\
  ? this\n\
  : window;\n\
\n\
/**\n\
 * Noop.\n\
 */\n\
\n\
function noop(){};\n\
\n\
/**\n\
 * Check if `obj` is a host object,\n\
 * we don't want to serialize these :)\n\
 *\n\
 * TODO: future proof, move to compoent land\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Boolean}\n\
 * @api private\n\
 */\n\
\n\
function isHost(obj) {\n\
  var str = {}.toString.call(obj);\n\
\n\
  switch (str) {\n\
    case '[object File]':\n\
    case '[object Blob]':\n\
    case '[object FormData]':\n\
      return true;\n\
    default:\n\
      return false;\n\
  }\n\
}\n\
\n\
/**\n\
 * Determine XHR.\n\
 */\n\
\n\
function getXHR() {\n\
  if (root.XMLHttpRequest\n\
    && ('file:' != root.location.protocol || !root.ActiveXObject)) {\n\
    return new XMLHttpRequest;\n\
  } else {\n\
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}\n\
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}\n\
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}\n\
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}\n\
  }\n\
  return false;\n\
}\n\
\n\
/**\n\
 * Removes leading and trailing whitespace, added to support IE.\n\
 *\n\
 * @param {String} s\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
var trim = ''.trim\n\
  ? function(s) { return s.trim(); }\n\
  : function(s) { return s.replace(/(^\\s*|\\s*$)/g, ''); };\n\
\n\
/**\n\
 * Check if `obj` is an object.\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Boolean}\n\
 * @api private\n\
 */\n\
\n\
function isObject(obj) {\n\
  return obj === Object(obj);\n\
}\n\
\n\
/**\n\
 * Serialize the given `obj`.\n\
 *\n\
 * @param {Object} obj\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function serialize(obj) {\n\
  if (!isObject(obj)) return obj;\n\
  var pairs = [];\n\
  for (var key in obj) {\n\
    if (null != obj[key]) {\n\
      pairs.push(encodeURIComponent(key)\n\
        + '=' + encodeURIComponent(obj[key]));\n\
    }\n\
  }\n\
  return pairs.join('&');\n\
}\n\
\n\
/**\n\
 * Expose serialization method.\n\
 */\n\
\n\
 request.serializeObject = serialize;\n\
\n\
 /**\n\
  * Parse the given x-www-form-urlencoded `str`.\n\
  *\n\
  * @param {String} str\n\
  * @return {Object}\n\
  * @api private\n\
  */\n\
\n\
function parseString(str) {\n\
  var obj = {};\n\
  var pairs = str.split('&');\n\
  var parts;\n\
  var pair;\n\
\n\
  for (var i = 0, len = pairs.length; i < len; ++i) {\n\
    pair = pairs[i];\n\
    parts = pair.split('=');\n\
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);\n\
  }\n\
\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Expose parser.\n\
 */\n\
\n\
request.parseString = parseString;\n\
\n\
/**\n\
 * Default MIME type map.\n\
 *\n\
 *     superagent.types.xml = 'application/xml';\n\
 *\n\
 */\n\
\n\
request.types = {\n\
  html: 'text/html',\n\
  json: 'application/json',\n\
  xml: 'application/xml',\n\
  urlencoded: 'application/x-www-form-urlencoded',\n\
  'form': 'application/x-www-form-urlencoded',\n\
  'form-data': 'application/x-www-form-urlencoded'\n\
};\n\
\n\
/**\n\
 * Default serialization map.\n\
 *\n\
 *     superagent.serialize['application/xml'] = function(obj){\n\
 *       return 'generated xml here';\n\
 *     };\n\
 *\n\
 */\n\
\n\
 request.serialize = {\n\
   'application/x-www-form-urlencoded': serialize,\n\
   'application/json': JSON.stringify\n\
 };\n\
\n\
 /**\n\
  * Default parsers.\n\
  *\n\
  *     superagent.parse['application/xml'] = function(str){\n\
  *       return { object parsed from str };\n\
  *     };\n\
  *\n\
  */\n\
\n\
request.parse = {\n\
  'application/x-www-form-urlencoded': parseString,\n\
  'application/json': JSON.parse\n\
};\n\
\n\
/**\n\
 * Parse the given header `str` into\n\
 * an object containing the mapped fields.\n\
 *\n\
 * @param {String} str\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function parseHeader(str) {\n\
  var lines = str.split(/\\r?\\n\
/);\n\
  var fields = {};\n\
  var index;\n\
  var line;\n\
  var field;\n\
  var val;\n\
\n\
  lines.pop(); // trailing CRLF\n\
\n\
  for (var i = 0, len = lines.length; i < len; ++i) {\n\
    line = lines[i];\n\
    index = line.indexOf(':');\n\
    field = line.slice(0, index).toLowerCase();\n\
    val = trim(line.slice(index + 1));\n\
    fields[field] = val;\n\
  }\n\
\n\
  return fields;\n\
}\n\
\n\
/**\n\
 * Return the mime type for the given `str`.\n\
 *\n\
 * @param {String} str\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function type(str){\n\
  return str.split(/ *; */).shift();\n\
};\n\
\n\
/**\n\
 * Return header field parameters.\n\
 *\n\
 * @param {String} str\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function params(str){\n\
  return reduce(str.split(/ *; */), function(obj, str){\n\
    var parts = str.split(/ *= */)\n\
      , key = parts.shift()\n\
      , val = parts.shift();\n\
\n\
    if (key && val) obj[key] = val;\n\
    return obj;\n\
  }, {});\n\
};\n\
\n\
/**\n\
 * Initialize a new `Response` with the given `xhr`.\n\
 *\n\
 *  - set flags (.ok, .error, etc)\n\
 *  - parse header\n\
 *\n\
 * Examples:\n\
 *\n\
 *  Aliasing `superagent` as `request` is nice:\n\
 *\n\
 *      request = superagent;\n\
 *\n\
 *  We can use the promise-like API, or pass callbacks:\n\
 *\n\
 *      request.get('/').end(function(res){});\n\
 *      request.get('/', function(res){});\n\
 *\n\
 *  Sending data can be chained:\n\
 *\n\
 *      request\n\
 *        .post('/user')\n\
 *        .send({ name: 'tj' })\n\
 *        .end(function(res){});\n\
 *\n\
 *  Or passed to `.send()`:\n\
 *\n\
 *      request\n\
 *        .post('/user')\n\
 *        .send({ name: 'tj' }, function(res){});\n\
 *\n\
 *  Or passed to `.post()`:\n\
 *\n\
 *      request\n\
 *        .post('/user', { name: 'tj' })\n\
 *        .end(function(res){});\n\
 *\n\
 * Or further reduced to a single call for simple cases:\n\
 *\n\
 *      request\n\
 *        .post('/user', { name: 'tj' }, function(res){});\n\
 *\n\
 * @param {XMLHTTPRequest} xhr\n\
 * @param {Object} options\n\
 * @api private\n\
 */\n\
\n\
function Response(req, options) {\n\
  options = options || {};\n\
  this.req = req;\n\
  this.xhr = this.req.xhr;\n\
  this.text = this.xhr.responseText;\n\
  this.setStatusProperties(this.xhr.status);\n\
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());\n\
  // getAllResponseHeaders sometimes falsely returns \"\" for CORS requests, but\n\
  // getResponseHeader still works. so we get content-type even if getting\n\
  // other headers fails.\n\
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');\n\
  this.setHeaderProperties(this.header);\n\
  this.body = this.req.method != 'HEAD'\n\
    ? this.parseBody(this.text)\n\
    : null;\n\
}\n\
\n\
/**\n\
 * Get case-insensitive `field` value.\n\
 *\n\
 * @param {String} field\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
Response.prototype.get = function(field){\n\
  return this.header[field.toLowerCase()];\n\
};\n\
\n\
/**\n\
 * Set header related properties:\n\
 *\n\
 *   - `.type` the content type without params\n\
 *\n\
 * A response of \"Content-Type: text/plain; charset=utf-8\"\n\
 * will provide you with a `.type` of \"text/plain\".\n\
 *\n\
 * @param {Object} header\n\
 * @api private\n\
 */\n\
\n\
Response.prototype.setHeaderProperties = function(header){\n\
  // content-type\n\
  var ct = this.header['content-type'] || '';\n\
  this.type = type(ct);\n\
\n\
  // params\n\
  var obj = params(ct);\n\
  for (var key in obj) this[key] = obj[key];\n\
};\n\
\n\
/**\n\
 * Parse the given body `str`.\n\
 *\n\
 * Used for auto-parsing of bodies. Parsers\n\
 * are defined on the `superagent.parse` object.\n\
 *\n\
 * @param {String} str\n\
 * @return {Mixed}\n\
 * @api private\n\
 */\n\
\n\
Response.prototype.parseBody = function(str){\n\
  var parse = request.parse[this.type];\n\
  return parse\n\
    ? parse(str)\n\
    : null;\n\
};\n\
\n\
/**\n\
 * Set flags such as `.ok` based on `status`.\n\
 *\n\
 * For example a 2xx response will give you a `.ok` of __true__\n\
 * whereas 5xx will be __false__ and `.error` will be __true__. The\n\
 * `.clientError` and `.serverError` are also available to be more\n\
 * specific, and `.statusType` is the class of error ranging from 1..5\n\
 * sometimes useful for mapping respond colors etc.\n\
 *\n\
 * \"sugar\" properties are also defined for common cases. Currently providing:\n\
 *\n\
 *   - .noContent\n\
 *   - .badRequest\n\
 *   - .unauthorized\n\
 *   - .notAcceptable\n\
 *   - .notFound\n\
 *\n\
 * @param {Number} status\n\
 * @api private\n\
 */\n\
\n\
Response.prototype.setStatusProperties = function(status){\n\
  var type = status / 100 | 0;\n\
\n\
  // status / class\n\
  this.status = status;\n\
  this.statusType = type;\n\
\n\
  // basics\n\
  this.info = 1 == type;\n\
  this.ok = 2 == type;\n\
  this.clientError = 4 == type;\n\
  this.serverError = 5 == type;\n\
  this.error = (4 == type || 5 == type)\n\
    ? this.toError()\n\
    : false;\n\
\n\
  // sugar\n\
  this.accepted = 202 == status;\n\
  this.noContent = 204 == status || 1223 == status;\n\
  this.badRequest = 400 == status;\n\
  this.unauthorized = 401 == status;\n\
  this.notAcceptable = 406 == status;\n\
  this.notFound = 404 == status;\n\
  this.forbidden = 403 == status;\n\
};\n\
\n\
/**\n\
 * Return an `Error` representative of this response.\n\
 *\n\
 * @return {Error}\n\
 * @api public\n\
 */\n\
\n\
Response.prototype.toError = function(){\n\
  var req = this.req;\n\
  var method = req.method;\n\
  var path = req.path;\n\
\n\
  var msg = 'cannot ' + method + ' ' + path + ' (' + this.status + ')';\n\
  var err = new Error(msg);\n\
  err.status = this.status;\n\
  err.method = method;\n\
  err.path = path;\n\
\n\
  return err;\n\
};\n\
\n\
/**\n\
 * Expose `Response`.\n\
 */\n\
\n\
request.Response = Response;\n\
\n\
/**\n\
 * Initialize a new `Request` with the given `method` and `url`.\n\
 *\n\
 * @param {String} method\n\
 * @param {String} url\n\
 * @api public\n\
 */\n\
\n\
function Request(method, url) {\n\
  var self = this;\n\
  Emitter.call(this);\n\
  this._query = this._query || [];\n\
  this.method = method;\n\
  this.url = url;\n\
  this.header = {};\n\
  this._header = {};\n\
  this.on('end', function(){\n\
    var res = new Response(self);\n\
    if ('HEAD' == method) res.text = null;\n\
    self.callback(null, res);\n\
  });\n\
}\n\
\n\
/**\n\
 * Mixin `Emitter`.\n\
 */\n\
\n\
Emitter(Request.prototype);\n\
\n\
/**\n\
 * Set timeout to `ms`.\n\
 *\n\
 * @param {Number} ms\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.timeout = function(ms){\n\
  this._timeout = ms;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Clear previous timeout.\n\
 *\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.clearTimeout = function(){\n\
  this._timeout = 0;\n\
  clearTimeout(this._timer);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Abort the request, and clear potential timeout.\n\
 *\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.abort = function(){\n\
  if (this.aborted) return;\n\
  this.aborted = true;\n\
  this.xhr.abort();\n\
  this.clearTimeout();\n\
  this.emit('abort');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set header `field` to `val`, or multiple fields with one object.\n\
 *\n\
 * Examples:\n\
 *\n\
 *      req.get('/')\n\
 *        .set('Accept', 'application/json')\n\
 *        .set('X-API-Key', 'foobar')\n\
 *        .end(callback);\n\
 *\n\
 *      req.get('/')\n\
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })\n\
 *        .end(callback);\n\
 *\n\
 * @param {String|Object} field\n\
 * @param {String} val\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.set = function(field, val){\n\
  if (isObject(field)) {\n\
    for (var key in field) {\n\
      this.set(key, field[key]);\n\
    }\n\
    return this;\n\
  }\n\
  this._header[field.toLowerCase()] = val;\n\
  this.header[field] = val;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Get case-insensitive header `field` value.\n\
 *\n\
 * @param {String} field\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
Request.prototype.getHeader = function(field){\n\
  return this._header[field.toLowerCase()];\n\
};\n\
\n\
/**\n\
 * Set Content-Type to `type`, mapping values from `request.types`.\n\
 *\n\
 * Examples:\n\
 *\n\
 *      superagent.types.xml = 'application/xml';\n\
 *\n\
 *      request.post('/')\n\
 *        .type('xml')\n\
 *        .send(xmlstring)\n\
 *        .end(callback);\n\
 *\n\
 *      request.post('/')\n\
 *        .type('application/xml')\n\
 *        .send(xmlstring)\n\
 *        .end(callback);\n\
 *\n\
 * @param {String} type\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.type = function(type){\n\
  this.set('Content-Type', request.types[type] || type);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set Accept to `type`, mapping values from `request.types`.\n\
 *\n\
 * Examples:\n\
 *\n\
 *      superagent.types.json = 'application/json';\n\
 *\n\
 *      request.get('/agent')\n\
 *        .accept('json')\n\
 *        .end(callback);\n\
 *\n\
 *      request.get('/agent')\n\
 *        .accept('application/json')\n\
 *        .end(callback);\n\
 *\n\
 * @param {String} accept\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.accept = function(type){\n\
  this.set('Accept', request.types[type] || type);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set Authorization field value with `user` and `pass`.\n\
 *\n\
 * @param {String} user\n\
 * @param {String} pass\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.auth = function(user, pass){\n\
  var str = btoa(user + ':' + pass);\n\
  this.set('Authorization', 'Basic ' + str);\n\
  return this;\n\
};\n\
\n\
/**\n\
* Add query-string `val`.\n\
*\n\
* Examples:\n\
*\n\
*   request.get('/shoes')\n\
*     .query('size=10')\n\
*     .query({ color: 'blue' })\n\
*\n\
* @param {Object|String} val\n\
* @return {Request} for chaining\n\
* @api public\n\
*/\n\
\n\
Request.prototype.query = function(val){\n\
  if ('string' != typeof val) val = serialize(val);\n\
  if (val) this._query.push(val);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Send `data`, defaulting the `.type()` to \"json\" when\n\
 * an object is given.\n\
 *\n\
 * Examples:\n\
 *\n\
 *       // querystring\n\
 *       request.get('/search')\n\
 *         .end(callback)\n\
 *\n\
 *       // multiple data \"writes\"\n\
 *       request.get('/search')\n\
 *         .send({ search: 'query' })\n\
 *         .send({ range: '1..5' })\n\
 *         .send({ order: 'desc' })\n\
 *         .end(callback)\n\
 *\n\
 *       // manual json\n\
 *       request.post('/user')\n\
 *         .type('json')\n\
 *         .send('{\"name\":\"tj\"})\n\
 *         .end(callback)\n\
 *\n\
 *       // auto json\n\
 *       request.post('/user')\n\
 *         .send({ name: 'tj' })\n\
 *         .end(callback)\n\
 *\n\
 *       // manual x-www-form-urlencoded\n\
 *       request.post('/user')\n\
 *         .type('form')\n\
 *         .send('name=tj')\n\
 *         .end(callback)\n\
 *\n\
 *       // auto x-www-form-urlencoded\n\
 *       request.post('/user')\n\
 *         .type('form')\n\
 *         .send({ name: 'tj' })\n\
 *         .end(callback)\n\
 *\n\
 *       // defaults to x-www-form-urlencoded\n\
  *      request.post('/user')\n\
  *        .send('name=tobi')\n\
  *        .send('species=ferret')\n\
  *        .end(callback)\n\
 *\n\
 * @param {String|Object} data\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.send = function(data){\n\
  var obj = isObject(data);\n\
  var type = this.getHeader('Content-Type');\n\
\n\
  // merge\n\
  if (obj && isObject(this._data)) {\n\
    for (var key in data) {\n\
      this._data[key] = data[key];\n\
    }\n\
  } else if ('string' == typeof data) {\n\
    if (!type) this.type('form');\n\
    type = this.getHeader('Content-Type');\n\
    if ('application/x-www-form-urlencoded' == type) {\n\
      this._data = this._data\n\
        ? this._data + '&' + data\n\
        : data;\n\
    } else {\n\
      this._data = (this._data || '') + data;\n\
    }\n\
  } else {\n\
    this._data = data;\n\
  }\n\
\n\
  if (!obj) return this;\n\
  if (!type) this.type('json');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Invoke the callback with `err` and `res`\n\
 * and handle arity check.\n\
 *\n\
 * @param {Error} err\n\
 * @param {Response} res\n\
 * @api private\n\
 */\n\
\n\
Request.prototype.callback = function(err, res){\n\
  var fn = this._callback;\n\
  if (2 == fn.length) return fn(err, res);\n\
  if (err) return this.emit('error', err);\n\
  fn(res);\n\
};\n\
\n\
/**\n\
 * Invoke callback with x-domain error.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Request.prototype.crossDomainError = function(){\n\
  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');\n\
  err.crossDomain = true;\n\
  this.callback(err);\n\
};\n\
\n\
/**\n\
 * Invoke callback with timeout error.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Request.prototype.timeoutError = function(){\n\
  var timeout = this._timeout;\n\
  var err = new Error('timeout of ' + timeout + 'ms exceeded');\n\
  err.timeout = timeout;\n\
  this.callback(err);\n\
};\n\
\n\
/**\n\
 * Enable transmission of cookies with x-domain requests.\n\
 *\n\
 * Note that for this to work the origin must not be\n\
 * using \"Access-Control-Allow-Origin\" with a wildcard,\n\
 * and also must set \"Access-Control-Allow-Credentials\"\n\
 * to \"true\".\n\
 *\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.withCredentials = function(){\n\
  this._withCredentials = true;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Initiate request, invoking callback `fn(res)`\n\
 * with an instanceof `Response`.\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.end = function(fn){\n\
  var self = this;\n\
  var xhr = this.xhr = getXHR();\n\
  var query = this._query.join('&');\n\
  var timeout = this._timeout;\n\
  var data = this._data;\n\
\n\
  // store callback\n\
  this._callback = fn || noop;\n\
\n\
  // state change\n\
  xhr.onreadystatechange = function(){\n\
    if (4 != xhr.readyState) return;\n\
    if (0 == xhr.status) {\n\
      if (self.aborted) return self.timeoutError();\n\
      return self.crossDomainError();\n\
    }\n\
    self.emit('end');\n\
  };\n\
\n\
  // progress\n\
  if (xhr.upload) {\n\
    xhr.upload.onprogress = function(e){\n\
      e.percent = e.loaded / e.total * 100;\n\
      self.emit('progress', e);\n\
    };\n\
  }\n\
\n\
  // timeout\n\
  if (timeout && !this._timer) {\n\
    this._timer = setTimeout(function(){\n\
      self.abort();\n\
    }, timeout);\n\
  }\n\
\n\
  // querystring\n\
  if (query) {\n\
    query = request.serializeObject(query);\n\
    this.url += ~this.url.indexOf('?')\n\
      ? '&' + query\n\
      : '?' + query;\n\
  }\n\
\n\
  // initiate request\n\
  xhr.open(this.method, this.url, true);\n\
\n\
  // CORS\n\
  if (this._withCredentials) xhr.withCredentials = true;\n\
\n\
  // body\n\
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {\n\
    // serialize stuff\n\
    var serialize = request.serialize[this.getHeader('Content-Type')];\n\
    if (serialize) data = serialize(data);\n\
  }\n\
\n\
  // set header fields\n\
  for (var field in this.header) {\n\
    if (null == this.header[field]) continue;\n\
    xhr.setRequestHeader(field, this.header[field]);\n\
  }\n\
\n\
  // send stuff\n\
  xhr.send(data);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Expose `Request`.\n\
 */\n\
\n\
request.Request = Request;\n\
\n\
/**\n\
 * Issue a request:\n\
 *\n\
 * Examples:\n\
 *\n\
 *    request('GET', '/users').end(callback)\n\
 *    request('/users').end(callback)\n\
 *    request('/users', callback)\n\
 *\n\
 * @param {String} method\n\
 * @param {String|Function} url or callback\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
function request(method, url) {\n\
  // callback\n\
  if ('function' == typeof url) {\n\
    return new Request('GET', method).end(url);\n\
  }\n\
\n\
  // url first\n\
  if (1 == arguments.length) {\n\
    return new Request('GET', method);\n\
  }\n\
\n\
  return new Request(method, url);\n\
}\n\
\n\
/**\n\
 * GET `url` with optional callback `fn(res)`.\n\
 *\n\
 * @param {String} url\n\
 * @param {Mixed|Function} data or fn\n\
 * @param {Function} fn\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
request.get = function(url, data, fn){\n\
  var req = request('GET', url);\n\
  if ('function' == typeof data) fn = data, data = null;\n\
  if (data) req.query(data);\n\
  if (fn) req.end(fn);\n\
  return req;\n\
};\n\
\n\
/**\n\
 * HEAD `url` with optional callback `fn(res)`.\n\
 *\n\
 * @param {String} url\n\
 * @param {Mixed|Function} data or fn\n\
 * @param {Function} fn\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
request.head = function(url, data, fn){\n\
  var req = request('HEAD', url);\n\
  if ('function' == typeof data) fn = data, data = null;\n\
  if (data) req.send(data);\n\
  if (fn) req.end(fn);\n\
  return req;\n\
};\n\
\n\
/**\n\
 * DELETE `url` with optional callback `fn(res)`.\n\
 *\n\
 * @param {String} url\n\
 * @param {Function} fn\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
request.del = function(url, fn){\n\
  var req = request('DELETE', url);\n\
  if (fn) req.end(fn);\n\
  return req;\n\
};\n\
\n\
/**\n\
 * PATCH `url` with optional `data` and callback `fn(res)`.\n\
 *\n\
 * @param {String} url\n\
 * @param {Mixed} data\n\
 * @param {Function} fn\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
request.patch = function(url, data, fn){\n\
  var req = request('PATCH', url);\n\
  if ('function' == typeof data) fn = data, data = null;\n\
  if (data) req.send(data);\n\
  if (fn) req.end(fn);\n\
  return req;\n\
};\n\
\n\
/**\n\
 * POST `url` with optional `data` and callback `fn(res)`.\n\
 *\n\
 * @param {String} url\n\
 * @param {Mixed} data\n\
 * @param {Function} fn\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
request.post = function(url, data, fn){\n\
  var req = request('POST', url);\n\
  if ('function' == typeof data) fn = data, data = null;\n\
  if (data) req.send(data);\n\
  if (fn) req.end(fn);\n\
  return req;\n\
};\n\
\n\
/**\n\
 * PUT `url` with optional `data` and callback `fn(res)`.\n\
 *\n\
 * @param {String} url\n\
 * @param {Mixed|Function} data or fn\n\
 * @param {Function} fn\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
request.put = function(url, data, fn){\n\
  var req = request('PUT', url);\n\
  if ('function' == typeof data) fn = data, data = null;\n\
  if (data) req.send(data);\n\
  if (fn) req.end(fn);\n\
  return req;\n\
};\n\
\n\
/**\n\
 * Expose `request`.\n\
 */\n\
\n\
module.exports = request;\n\
//@ sourceURL=visionmedia-superagent/lib/client.js"
));
require.register("chrisanderson/components/index.js", Function("exports, require, module",
"var modal = require('modal'),\n\
    mobile = require('is-mobile'),\n\
    dom = require('dom'),\n\
    scrollTo = require('scroll-to');\n\
    \n\
    \n\
var $image = dom('.work-block'),\n\
    $work = dom('.work'),\n\
    $loading = dom('.loading');\n\
\n\
$image.on('click', function(e) { \n\
    var image = new Image();\n\
    \n\
    var imgSrc = dom(this).find('.image').attr('data-image');\n\
    \n\
    if (imgSrc) {\n\
        image.src = imgSrc; \n\
        var m = modal(image);\n\
        m.show(); \n\
        m.temporary();\n\
        \n\
        dom('.overlay, .modal').on('click', function() {\n\
            m.addClass('animated');\n\
            m.addClass('fade-out');\n\
            m.hide();\n\
            dom('.overlay, .modal').off('click');\n\
            m.removeClass('.fade-out');\n\
        });\n\
    }\n\
}); \n\
\n\
var rndm = Math.floor(Math.random()*6);\n\
setTimeout(function(){\n\
    $loading.css('display', 'none');\n\
    $work.css('visibility', 'visible');\n\
    $work.addClass('fade-in');\n\
}, rndm*1000);//@ sourceURL=chrisanderson/components/index.js"
));





















































require.register("segmentio-overlay/lib/index.html", Function("exports, require, module",
"module.exports = '<div class=\"overlay hidden\"></div>';//@ sourceURL=segmentio-overlay/lib/index.html"
));



require.register("segmentio-modal/lib/index.html", Function("exports, require, module",
"module.exports = '<div class=\"modal-wrapper hidden\">\\n\
  <div class=\"modal hidden\">\\n\
    <a class=\"modal-close-button\"></a>\\n\
  </div>\\n\
</div>';//@ sourceURL=segmentio-modal/lib/index.html"
));






require.alias("component-dom/index.js", "chrisanderson/deps/dom/index.js");
require.alias("component-dom/lib/traverse.js", "chrisanderson/deps/dom/lib/traverse.js");
require.alias("component-dom/lib/manipulate.js", "chrisanderson/deps/dom/lib/manipulate.js");
require.alias("component-dom/lib/classes.js", "chrisanderson/deps/dom/lib/classes.js");
require.alias("component-dom/lib/attributes.js", "chrisanderson/deps/dom/lib/attributes.js");
require.alias("component-dom/lib/events.js", "chrisanderson/deps/dom/lib/events.js");
require.alias("component-dom/index.js", "dom/index.js");
require.alias("component-each/index.js", "component-dom/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");
require.alias("component-props/index.js", "component-to-function/deps/props/index.js");
require.alias("component-props/index.js", "component-to-function/deps/props/index.js");
require.alias("component-props/index.js", "component-props/index.js");
require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-event/index.js", "component-dom/deps/event/index.js");

require.alias("component-delegate/index.js", "component-dom/deps/delegate/index.js");
require.alias("component-matches-selector/index.js", "component-delegate/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("component-event/index.js", "component-delegate/deps/event/index.js");

require.alias("component-domify/index.js", "component-dom/deps/domify/index.js");

require.alias("component-classes/index.js", "component-dom/deps/classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("component-css/index.js", "component-dom/deps/css/index.js");
require.alias("component-css/lib/css.js", "component-dom/deps/css/lib/css.js");
require.alias("component-css/lib/prop.js", "component-dom/deps/css/lib/prop.js");
require.alias("component-css/lib/swap.js", "component-dom/deps/css/lib/swap.js");
require.alias("component-css/lib/style.js", "component-dom/deps/css/lib/style.js");
require.alias("component-css/lib/hooks.js", "component-dom/deps/css/lib/hooks.js");
require.alias("component-css/lib/styles.js", "component-dom/deps/css/lib/styles.js");
require.alias("component-css/lib/vendor.js", "component-dom/deps/css/lib/vendor.js");
require.alias("component-css/lib/support.js", "component-dom/deps/css/lib/support.js");
require.alias("component-css/lib/computed.js", "component-dom/deps/css/lib/computed.js");
require.alias("component-css/index.js", "component-dom/deps/css/index.js");
require.alias("component-each/index.js", "component-css/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");
require.alias("component-props/index.js", "component-to-function/deps/props/index.js");
require.alias("component-props/index.js", "component-to-function/deps/props/index.js");
require.alias("component-props/index.js", "component-props/index.js");
require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("visionmedia-debug/index.js", "component-css/deps/debug/index.js");
require.alias("visionmedia-debug/debug.js", "component-css/deps/debug/debug.js");

require.alias("ianstormtaylor-to-camel-case/index.js", "component-css/deps/to-camel-case/index.js");
require.alias("ianstormtaylor-to-space-case/index.js", "ianstormtaylor-to-camel-case/deps/to-space-case/index.js");
require.alias("ianstormtaylor-to-no-case/index.js", "ianstormtaylor-to-space-case/deps/to-no-case/index.js");

require.alias("component-within-document/index.js", "component-css/deps/within-document/index.js");

require.alias("component-css/index.js", "component-css/index.js");
require.alias("component-value/index.js", "component-dom/deps/value/index.js");
require.alias("component-value/index.js", "component-dom/deps/value/index.js");
require.alias("component-type/index.js", "component-value/deps/type/index.js");

require.alias("component-value/index.js", "component-value/index.js");
require.alias("component-query/index.js", "component-dom/deps/query/index.js");

require.alias("component-matches-selector/index.js", "component-dom/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("yields-traverse/index.js", "component-dom/deps/traverse/index.js");
require.alias("yields-traverse/index.js", "component-dom/deps/traverse/index.js");
require.alias("component-matches-selector/index.js", "yields-traverse/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("yields-traverse/index.js", "yields-traverse/index.js");
require.alias("component-trim/index.js", "component-dom/deps/trim/index.js");

require.alias("yields-isArray/index.js", "component-dom/deps/isArray/index.js");

require.alias("component-to-function/index.js", "component-dom/deps/to-function/index.js");
require.alias("component-props/index.js", "component-to-function/deps/props/index.js");
require.alias("component-props/index.js", "component-to-function/deps/props/index.js");
require.alias("component-props/index.js", "component-props/index.js");
require.alias("matthewp-keys/index.js", "component-dom/deps/keys/index.js");
require.alias("matthewp-keys/index.js", "component-dom/deps/keys/index.js");
require.alias("matthewp-keys/index.js", "matthewp-keys/index.js");
require.alias("matthewp-text/index.js", "component-dom/deps/text/index.js");

require.alias("segmentio-modal/lib/index.js", "chrisanderson/deps/modal/lib/index.js");
require.alias("segmentio-modal/lib/index.js", "chrisanderson/deps/modal/index.js");
require.alias("segmentio-modal/lib/index.js", "modal/index.js");
require.alias("component-classes/index.js", "segmentio-modal/deps/classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("component-domify/index.js", "segmentio-modal/deps/domify/index.js");

require.alias("component-emitter/index.js", "segmentio-modal/deps/emitter/index.js");

require.alias("component-event/index.js", "segmentio-modal/deps/event/index.js");

require.alias("ianstormtaylor-redraw/index.js", "segmentio-modal/deps/redraw/index.js");

require.alias("segmentio-overlay/lib/index.js", "segmentio-modal/deps/overlay/lib/index.js");
require.alias("segmentio-overlay/lib/index.js", "segmentio-modal/deps/overlay/index.js");
require.alias("component-domify/index.js", "segmentio-overlay/deps/domify/index.js");

require.alias("component-emitter/index.js", "segmentio-overlay/deps/emitter/index.js");

require.alias("component-event/index.js", "segmentio-overlay/deps/event/index.js");

require.alias("ianstormtaylor-classes/index.js", "segmentio-overlay/deps/classes/index.js");
require.alias("jkroso-classes/index.js", "ianstormtaylor-classes/deps/classes/index.js");
require.alias("jkroso-classes/fallback.js", "ianstormtaylor-classes/deps/classes/fallback.js");
require.alias("jkroso-classes/modern.js", "ianstormtaylor-classes/deps/classes/modern.js");
require.alias("component-indexof/index.js", "jkroso-classes/deps/indexof/index.js");

require.alias("ianstormtaylor-redraw/index.js", "segmentio-overlay/deps/redraw/index.js");

require.alias("segmentio-bind-all/index.js", "segmentio-overlay/deps/bind-all/index.js");
require.alias("component-bind/index.js", "segmentio-bind-all/deps/bind/index.js");

require.alias("component-type/index.js", "segmentio-bind-all/deps/type/index.js");

require.alias("segmentio-on-escape/index.js", "segmentio-overlay/deps/on-escape/index.js");
require.alias("component-event/index.js", "segmentio-on-escape/deps/event/index.js");

require.alias("component-indexof/index.js", "segmentio-on-escape/deps/indexof/index.js");

require.alias("yields-after-transition/index.js", "segmentio-overlay/deps/after-transition/index.js");
require.alias("yields-after-transition/index.js", "segmentio-overlay/deps/after-transition/index.js");
require.alias("yields-has-transitions/index.js", "yields-after-transition/deps/has-transitions/index.js");
require.alias("yields-has-transitions/index.js", "yields-after-transition/deps/has-transitions/index.js");
require.alias("yields-has-transitions/index.js", "yields-has-transitions/index.js");
require.alias("ecarter-css-emitter/index.js", "yields-after-transition/deps/css-emitter/index.js");
require.alias("component-emitter/index.js", "ecarter-css-emitter/deps/emitter/index.js");

require.alias("component-event/index.js", "ecarter-css-emitter/deps/event/index.js");

require.alias("component-once/index.js", "yields-after-transition/deps/once/index.js");

require.alias("yields-after-transition/index.js", "yields-after-transition/index.js");
require.alias("segmentio-overlay/lib/index.js", "segmentio-overlay/index.js");
require.alias("yields-after-transition/index.js", "segmentio-modal/deps/after-transition/index.js");
require.alias("yields-after-transition/index.js", "segmentio-modal/deps/after-transition/index.js");
require.alias("yields-has-transitions/index.js", "yields-after-transition/deps/has-transitions/index.js");
require.alias("yields-has-transitions/index.js", "yields-after-transition/deps/has-transitions/index.js");
require.alias("yields-has-transitions/index.js", "yields-has-transitions/index.js");
require.alias("ecarter-css-emitter/index.js", "yields-after-transition/deps/css-emitter/index.js");
require.alias("component-emitter/index.js", "ecarter-css-emitter/deps/emitter/index.js");

require.alias("component-event/index.js", "ecarter-css-emitter/deps/event/index.js");

require.alias("component-once/index.js", "yields-after-transition/deps/once/index.js");

require.alias("yields-after-transition/index.js", "yields-after-transition/index.js");
require.alias("segmentio-modal/lib/index.js", "segmentio-modal/index.js");
require.alias("component-scroll-to/index.js", "chrisanderson/deps/scroll-to/index.js");
require.alias("component-scroll-to/index.js", "chrisanderson/deps/scroll-to/index.js");
require.alias("component-scroll-to/index.js", "scroll-to/index.js");
require.alias("component-raf/index.js", "component-scroll-to/deps/raf/index.js");

require.alias("component-tween/index.js", "component-scroll-to/deps/tween/index.js");
require.alias("component-emitter/index.js", "component-tween/deps/emitter/index.js");

require.alias("component-ease/index.js", "component-tween/deps/ease/index.js");

require.alias("component-scroll-to/index.js", "component-scroll-to/index.js");


require.alias("whyohwhyamihere-is-mobile/index.js", "chrisanderson/deps/is-mobile/index.js");
require.alias("whyohwhyamihere-is-mobile/index.js", "chrisanderson/deps/is-mobile/index.js");
require.alias("whyohwhyamihere-is-mobile/index.js", "is-mobile/index.js");
require.alias("whyohwhyamihere-is-mobile/index.js", "whyohwhyamihere-is-mobile/index.js");
require.alias("visionmedia-superagent/lib/client.js", "chrisanderson/deps/superagent/lib/client.js");
require.alias("visionmedia-superagent/lib/client.js", "chrisanderson/deps/superagent/index.js");
require.alias("visionmedia-superagent/lib/client.js", "superagent/index.js");
require.alias("component-emitter/index.js", "visionmedia-superagent/deps/emitter/index.js");

require.alias("component-reduce/index.js", "visionmedia-superagent/deps/reduce/index.js");

require.alias("visionmedia-superagent/lib/client.js", "visionmedia-superagent/index.js");