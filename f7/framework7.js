/**
 * Framework7 3.0.1
 * Full featured mobile HTML framework for building iOS & Android apps
 * http://framework7.io/
 *
 * Copyright 2014-2018 Vladimir Kharlampidi
 *
 * Released under the MIT License
 *
 * Released on: October 18, 2018
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Framework7 = factory());
}(this, (function () { 'use strict';

  /**
   * Template7 1.3.7
   * Mobile-first HTML template engine
   * 
   * http://www.idangero.us/template7/
   * 
   * Copyright 2018, Vladimir Kharlampidi
   * The iDangero.us
   * http://www.idangero.us/
   * 
   * Licensed under MIT
   * 
   * Released on: July 17, 2018
   */
  var t7ctx;
  if (typeof window !== 'undefined') {
    t7ctx = window;
  } else if (typeof global !== 'undefined') {
    t7ctx = global;
  } else {
    t7ctx = undefined;
  }

  var Template7Context = t7ctx;

  var Template7Utils = {
    quoteSingleRexExp: new RegExp('\'', 'g'),
    quoteDoubleRexExp: new RegExp('"', 'g'),
    isFunction: function isFunction(func) {
      return typeof func === 'function';
    },
    escape: function escape(string) {
      return (typeof Template7Context !== 'undefined' && Template7Context.escape) ?
        Template7Context.escape(string) :
        string
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
    },
    helperToSlices: function helperToSlices(string) {
      var quoteDoubleRexExp = Template7Utils.quoteDoubleRexExp;
      var quoteSingleRexExp = Template7Utils.quoteSingleRexExp;
      var helperParts = string.replace(/[{}#}]/g, '').trim().split(' ');
      var slices = [];
      var shiftIndex;
      var i;
      var j;
      for (i = 0; i < helperParts.length; i += 1) {
        var part = helperParts[i];
        var blockQuoteRegExp = (void 0);
        var openingQuote = (void 0);
        if (i === 0) { slices.push(part); }
        else if (part.indexOf('"') === 0 || part.indexOf('\'') === 0) {
          blockQuoteRegExp = part.indexOf('"') === 0 ? quoteDoubleRexExp : quoteSingleRexExp;
          openingQuote = part.indexOf('"') === 0 ? '"' : '\'';
          // Plain String
          if (part.match(blockQuoteRegExp).length === 2) {
            // One word string
            slices.push(part);
          } else {
            // Find closed Index
            shiftIndex = 0;
            for (j = i + 1; j < helperParts.length; j += 1) {
              part += " " + (helperParts[j]);
              if (helperParts[j].indexOf(openingQuote) >= 0) {
                shiftIndex = j;
                slices.push(part);
                break;
              }
            }
            if (shiftIndex) { i = shiftIndex; }
          }
        } else if (part.indexOf('=') > 0) {
          // Hash
          var hashParts = part.split('=');
          var hashName = hashParts[0];
          var hashContent = hashParts[1];
          if (!blockQuoteRegExp) {
            blockQuoteRegExp = hashContent.indexOf('"') === 0 ? quoteDoubleRexExp : quoteSingleRexExp;
            openingQuote = hashContent.indexOf('"') === 0 ? '"' : '\'';
          }
          if (hashContent.match(blockQuoteRegExp).length !== 2) {
            shiftIndex = 0;
            for (j = i + 1; j < helperParts.length; j += 1) {
              hashContent += " " + (helperParts[j]);
              if (helperParts[j].indexOf(openingQuote) >= 0) {
                shiftIndex = j;
                break;
              }
            }
            if (shiftIndex) { i = shiftIndex; }
          }
          var hash = [hashName, hashContent.replace(blockQuoteRegExp, '')];
          slices.push(hash);
        } else {
          // Plain variable
          slices.push(part);
        }
      }
      return slices;
    },
    stringToBlocks: function stringToBlocks(string) {
      var blocks = [];
      var i;
      var j;
      if (!string) { return []; }
      var stringBlocks = string.split(/({{[^{^}]*}})/);
      for (i = 0; i < stringBlocks.length; i += 1) {
        var block = stringBlocks[i];
        if (block === '') { continue; }
        if (block.indexOf('{{') < 0) {
          blocks.push({
            type: 'plain',
            content: block,
          });
        } else {
          if (block.indexOf('{/') >= 0) {
            continue;
          }
          block = block
            .replace(/{{([#/])*([ ])*/, '{{$1')
            .replace(/([ ])*}}/, '}}');
          if (block.indexOf('{#') < 0 && block.indexOf(' ') < 0 && block.indexOf('else') < 0) {
            // Simple variable
            blocks.push({
              type: 'variable',
              contextName: block.replace(/[{}]/g, ''),
            });
            continue;
          }
          // Helpers
          var helperSlices = Template7Utils.helperToSlices(block);
          var helperName = helperSlices[0];
          var isPartial = helperName === '>';
          var helperContext = [];
          var helperHash = {};
          for (j = 1; j < helperSlices.length; j += 1) {
            var slice = helperSlices[j];
            if (Array.isArray(slice)) {
              // Hash
              helperHash[slice[0]] = slice[1] === 'false' ? false : slice[1];
            } else {
              helperContext.push(slice);
            }
          }

          if (block.indexOf('{#') >= 0) {
            // Condition/Helper
            var helperContent = '';
            var elseContent = '';
            var toSkip = 0;
            var shiftIndex = (void 0);
            var foundClosed = false;
            var foundElse = false;
            var depth = 0;
            for (j = i + 1; j < stringBlocks.length; j += 1) {
              if (stringBlocks[j].indexOf('{{#') >= 0) {
                depth += 1;
              }
              if (stringBlocks[j].indexOf('{{/') >= 0) {
                depth -= 1;
              }
              if (stringBlocks[j].indexOf(("{{#" + helperName)) >= 0) {
                helperContent += stringBlocks[j];
                if (foundElse) { elseContent += stringBlocks[j]; }
                toSkip += 1;
              } else if (stringBlocks[j].indexOf(("{{/" + helperName)) >= 0) {
                if (toSkip > 0) {
                  toSkip -= 1;
                  helperContent += stringBlocks[j];
                  if (foundElse) { elseContent += stringBlocks[j]; }
                } else {
                  shiftIndex = j;
                  foundClosed = true;
                  break;
                }
              } else if (stringBlocks[j].indexOf('else') >= 0 && depth === 0) {
                foundElse = true;
              } else {
                if (!foundElse) { helperContent += stringBlocks[j]; }
                if (foundElse) { elseContent += stringBlocks[j]; }
              }
            }
            if (foundClosed) {
              if (shiftIndex) { i = shiftIndex; }
              if (helperName === 'raw') {
                blocks.push({
                  type: 'plain',
                  content: helperContent,
                });
              } else {
                blocks.push({
                  type: 'helper',
                  helperName: helperName,
                  contextName: helperContext,
                  content: helperContent,
                  inverseContent: elseContent,
                  hash: helperHash,
                });
              }
            }
          } else if (block.indexOf(' ') > 0) {
            if (isPartial) {
              helperName = '_partial';
              if (helperContext[0]) {
                if (helperContext[0].indexOf('[') === 0) { helperContext[0] = helperContext[0].replace(/[[\]]/g, ''); }
                else { helperContext[0] = "\"" + (helperContext[0].replace(/"|'/g, '')) + "\""; }
              }
            }
            blocks.push({
              type: 'helper',
              helperName: helperName,
              contextName: helperContext,
              hash: helperHash,
            });
          }
        }
      }
      return blocks;
    },
    parseJsVariable: function parseJsVariable(expression, replace, object) {
      return expression.split(/([+ -*/^])/g).map(function (part) {
        if (part.indexOf(replace) < 0) { return part; }
        if (!object) { return JSON.stringify(''); }
        var variable = object;
        if (part.indexOf((replace + ".")) >= 0) {
          part.split((replace + "."))[1].split('.').forEach(function (partName) {
            if (partName in variable) { variable = variable[partName]; }
            else { variable = undefined; }
          });
        }
        if (typeof variable === 'string') {
          variable = JSON.stringify(variable);
        }
        if (variable === undefined) { variable = 'undefined'; }
        return variable;
      }).join('');
    },
    parseJsParents: function parseJsParents(expression, parents) {
      return expression.split(/([+ -*^])/g).map(function (part) {
        if (part.indexOf('../') < 0) { return part; }
        if (!parents || parents.length === 0) { return JSON.stringify(''); }
        var levelsUp = part.split('../').length - 1;
        var parentData = levelsUp > parents.length ? parents[parents.length - 1] : parents[levelsUp - 1];

        var variable = parentData;
        var parentPart = part.replace(/..\//g, '');
        parentPart.split('.').forEach(function (partName) {
          if (variable[partName]) { variable = variable[partName]; }
          else { variable = 'undefined'; }
        });
        return JSON.stringify(variable);
      }).join('');
    },
    getCompileVar: function getCompileVar(name, ctx, data) {
      if ( data === void 0 ) data = 'data_1';

      var variable = ctx;
      var parts;
      var levelsUp = 0;
      var newDepth;
      if (name.indexOf('../') === 0) {
        levelsUp = name.split('../').length - 1;
        newDepth = variable.split('_')[1] - levelsUp;
        variable = "ctx_" + (newDepth >= 1 ? newDepth : 1);
        parts = name.split('../')[levelsUp].split('.');
      } else if (name.indexOf('@global') === 0) {
        variable = 'Template7.global';
        parts = name.split('@global.')[1].split('.');
      } else if (name.indexOf('@root') === 0) {
        variable = 'root';
        parts = name.split('@root.')[1].split('.');
      } else {
        parts = name.split('.');
      }
      for (var i = 0; i < parts.length; i += 1) {
        var part = parts[i];
        if (part.indexOf('@') === 0) {
          var dataLevel = data.split('_')[1];
          if (levelsUp > 0) {
            dataLevel = newDepth;
          }
          if (i > 0) {
            variable += "[(data_" + dataLevel + " && data_" + dataLevel + "." + (part.replace('@', '')) + ")]";
          } else {
            variable = "(data_" + dataLevel + " && data_" + dataLevel + "." + (part.replace('@', '')) + ")";
          }
        } else if (Number.isFinite ? Number.isFinite(part) : Template7Context.isFinite(part)) {
          variable += "[" + part + "]";
        } else if (part === 'this' || part.indexOf('this.') >= 0 || part.indexOf('this[') >= 0 || part.indexOf('this(') >= 0) {
          variable = part.replace('this', ctx);
        } else {
          variable += "." + part;
        }
      }
      return variable;
    },
    getCompiledArguments: function getCompiledArguments(contextArray, ctx, data) {
      var arr = [];
      for (var i = 0; i < contextArray.length; i += 1) {
        if (/^['"]/.test(contextArray[i])) { arr.push(contextArray[i]); }
        else if (/^(true|false|\d+)$/.test(contextArray[i])) { arr.push(contextArray[i]); }
        else {
          arr.push(Template7Utils.getCompileVar(contextArray[i], ctx, data));
        }
      }

      return arr.join(', ');
    },
  };

  /* eslint no-eval: "off" */
  var Template7Helpers = {
    _partial: function _partial(partialName, options) {
      var ctx = this;
      var p = Template7Class.partials[partialName];
      if (!p || (p && !p.template)) { return ''; }
      if (!p.compiled) {
        p.compiled = new Template7Class(p.template).compile();
      }
      Object.keys(options.hash).forEach(function (hashName) {
        ctx[hashName] = options.hash[hashName];
      });
      return p.compiled(ctx, options.data, options.root);
    },
    escape: function escape(context) {
      if (typeof context !== 'string') {
        throw new Error('Template7: Passed context to "escape" helper should be a string');
      }
      return Template7Utils.escape(context);
    },
    if: function if$1(context, options) {
      var ctx = context;
      if (Template7Utils.isFunction(ctx)) { ctx = ctx.call(this); }
      if (ctx) {
        return options.fn(this, options.data);
      }

      return options.inverse(this, options.data);
    },
    unless: function unless(context, options) {
      var ctx = context;
      if (Template7Utils.isFunction(ctx)) { ctx = ctx.call(this); }
      if (!ctx) {
        return options.fn(this, options.data);
      }

      return options.inverse(this, options.data);
    },
    each: function each(context, options) {
      var ctx = context;
      var ret = '';
      var i = 0;
      if (Template7Utils.isFunction(ctx)) { ctx = ctx.call(this); }
      if (Array.isArray(ctx)) {
        if (options.hash.reverse) {
          ctx = ctx.reverse();
        }
        for (i = 0; i < ctx.length; i += 1) {
          ret += options.fn(ctx[i], { first: i === 0, last: i === ctx.length - 1, index: i });
        }
        if (options.hash.reverse) {
          ctx = ctx.reverse();
        }
      } else {
        // eslint-disable-next-line
        for (var key in ctx) {
          i += 1;
          ret += options.fn(ctx[key], { key: key });
        }
      }
      if (i > 0) { return ret; }
      return options.inverse(this);
    },
    with: function with$1(context, options) {
      var ctx = context;
      if (Template7Utils.isFunction(ctx)) { ctx = context.call(this); }
      return options.fn(ctx);
    },
    join: function join(context, options) {
      var ctx = context;
      if (Template7Utils.isFunction(ctx)) { ctx = ctx.call(this); }
      return ctx.join(options.hash.delimiter || options.hash.delimeter);
    },
    js: function js(expression, options) {
      var data = options.data;
      var func;
      var execute = expression;
      ('index first last key').split(' ').forEach(function (prop) {
        if (typeof data[prop] !== 'undefined') {
          var re1 = new RegExp(("this.@" + prop), 'g');
          var re2 = new RegExp(("@" + prop), 'g');
          execute = execute
            .replace(re1, JSON.stringify(data[prop]))
            .replace(re2, JSON.stringify(data[prop]));
        }
      });
      if (options.root && execute.indexOf('@root') >= 0) {
        execute = Template7Utils.parseJsVariable(execute, '@root', options.root);
      }
      if (execute.indexOf('@global') >= 0) {
        execute = Template7Utils.parseJsVariable(execute, '@global', Template7Context.Template7.global);
      }
      if (execute.indexOf('../') >= 0) {
        execute = Template7Utils.parseJsParents(execute, options.parents);
      }
      if (execute.indexOf('return') >= 0) {
        func = "(function(){" + execute + "})";
      } else {
        func = "(function(){return (" + execute + ")})";
      }
      return eval(func).call(this);
    },
    js_if: function js_if(expression, options) {
      var data = options.data;
      var func;
      var execute = expression;
      ('index first last key').split(' ').forEach(function (prop) {
        if (typeof data[prop] !== 'undefined') {
          var re1 = new RegExp(("this.@" + prop), 'g');
          var re2 = new RegExp(("@" + prop), 'g');
          execute = execute
            .replace(re1, JSON.stringify(data[prop]))
            .replace(re2, JSON.stringify(data[prop]));
        }
      });
      if (options.root && execute.indexOf('@root') >= 0) {
        execute = Template7Utils.parseJsVariable(execute, '@root', options.root);
      }
      if (execute.indexOf('@global') >= 0) {
        execute = Template7Utils.parseJsVariable(execute, '@global', Template7Context.Template7.global);
      }
      if (execute.indexOf('../') >= 0) {
        execute = Template7Utils.parseJsParents(execute, options.parents);
      }
      if (execute.indexOf('return') >= 0) {
        func = "(function(){" + execute + "})";
      } else {
        func = "(function(){return (" + execute + ")})";
      }
      var condition = eval(func).call(this);
      if (condition) {
        return options.fn(this, options.data);
      }

      return options.inverse(this, options.data);
    },
  };
  Template7Helpers.js_compare = Template7Helpers.js_if;

  var Template7Options = {};
  var Template7Partials = {};

  var Template7Class = function Template7Class(template) {
    var t = this;
    t.template = template;
  };

  var staticAccessors = { options: { configurable: true },partials: { configurable: true },helpers: { configurable: true } };
  Template7Class.prototype.compile = function compile (template, depth) {
      if ( template === void 0 ) template = this.template;
      if ( depth === void 0 ) depth = 1;

    var t = this;
    if (t.compiled) { return t.compiled; }

    if (typeof template !== 'string') {
      throw new Error('Template7: Template must be a string');
    }
    var stringToBlocks = Template7Utils.stringToBlocks;
      var getCompileVar = Template7Utils.getCompileVar;
      var getCompiledArguments = Template7Utils.getCompiledArguments;

    var blocks = stringToBlocks(template);
    var ctx = "ctx_" + depth;
    var data = "data_" + depth;
    if (blocks.length === 0) {
      return function empty() { return ''; };
    }

    function getCompileFn(block, newDepth) {
      if (block.content) { return t.compile(block.content, newDepth); }
      return function empty() { return ''; };
    }
    function getCompileInverse(block, newDepth) {
      if (block.inverseContent) { return t.compile(block.inverseContent, newDepth); }
      return function empty() { return ''; };
    }

    var resultString = '';
    if (depth === 1) {
      resultString += "(function (" + ctx + ", " + data + ", root) {\n";
    } else {
      resultString += "(function (" + ctx + ", " + data + ") {\n";
    }
    if (depth === 1) {
      resultString += 'function isArray(arr){return Array.isArray(arr);}\n';
      resultString += 'function isFunction(func){return (typeof func === \'function\');}\n';
      resultString += 'function c(val, ctx) {if (typeof val !== "undefined" && val !== null) {if (isFunction(val)) {return val.call(ctx);} else return val;} else return "";}\n';
      resultString += 'root = root || ctx_1 || {};\n';
    }
    resultString += 'var r = \'\';\n';
    var i;
    for (i = 0; i < blocks.length; i += 1) {
      var block = blocks[i];
      // Plain block
      if (block.type === 'plain') {
        // eslint-disable-next-line
        resultString += "r +='" + ((block.content).replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/'/g, '\\' + '\'')) + "';";
        continue;
      }
      var variable = (void 0);
      var compiledArguments = (void 0);
      // Variable block
      if (block.type === 'variable') {
        variable = getCompileVar(block.contextName, ctx, data);
        resultString += "r += c(" + variable + ", " + ctx + ");";
      }
      // Helpers block
      if (block.type === 'helper') {
        var parents = (void 0);
        if (ctx !== 'ctx_1') {
          var level = ctx.split('_')[1];
          var parentsString = "ctx_" + (level - 1);
          for (var j = level - 2; j >= 1; j -= 1) {
            parentsString += ", ctx_" + j;
          }
          parents = "[" + parentsString + "]";
        } else {
          parents = "[" + ctx + "]";
        }
        var dynamicHelper = (void 0);
        if (block.helperName.indexOf('[') === 0) {
          block.helperName = getCompileVar(block.helperName.replace(/[[\]]/g, ''), ctx, data);
          dynamicHelper = true;
        }
        if (dynamicHelper || block.helperName in Template7Helpers) {
          compiledArguments = getCompiledArguments(block.contextName, ctx, data);
          resultString += "r += (Template7Helpers" + (dynamicHelper ? ("[" + (block.helperName) + "]") : ("." + (block.helperName))) + ").call(" + ctx + ", " + (compiledArguments && ((compiledArguments + ", "))) + "{hash:" + (JSON.stringify(block.hash)) + ", data: " + data + " || {}, fn: " + (getCompileFn(block, depth + 1)) + ", inverse: " + (getCompileInverse(block, depth + 1)) + ", root: root, parents: " + parents + "});";
        } else if (block.contextName.length > 0) {
          throw new Error(("Template7: Missing helper: \"" + (block.helperName) + "\""));
        } else {
          variable = getCompileVar(block.helperName, ctx, data);
          resultString += "if (" + variable + ") {";
          resultString += "if (isArray(" + variable + ")) {";
          resultString += "r += (Template7Helpers.each).call(" + ctx + ", " + variable + ", {hash:" + (JSON.stringify(block.hash)) + ", data: " + data + " || {}, fn: " + (getCompileFn(block, depth + 1)) + ", inverse: " + (getCompileInverse(block, depth + 1)) + ", root: root, parents: " + parents + "});";
          resultString += '}else {';
          resultString += "r += (Template7Helpers.with).call(" + ctx + ", " + variable + ", {hash:" + (JSON.stringify(block.hash)) + ", data: " + data + " || {}, fn: " + (getCompileFn(block, depth + 1)) + ", inverse: " + (getCompileInverse(block, depth + 1)) + ", root: root, parents: " + parents + "});";
          resultString += '}}';
        }
      }
    }
    resultString += '\nreturn r;})';

    if (depth === 1) {
      // eslint-disable-next-line
      t.compiled = eval(resultString);
      return t.compiled;
    }
    return resultString;
  };
  staticAccessors.options.get = function () {
    return Template7Options;
  };
  staticAccessors.partials.get = function () {
    return Template7Partials;
  };
  staticAccessors.helpers.get = function () {
    return Template7Helpers;
  };

  Object.defineProperties( Template7Class, staticAccessors );

  function Template7() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    var template = args[0];
    var data = args[1];
    if (args.length === 2) {
      var instance = new Template7Class(template);
      var rendered = instance.compile()(data);
      instance = null;
      return (rendered);
    }
    return new Template7Class(template);
  }
  Template7.registerHelper = function registerHelper(name, fn) {
    Template7Class.helpers[name] = fn;
  };
  Template7.unregisterHelper = function unregisterHelper(name) {
    Template7Class.helpers[name] = undefined;
    delete Template7Class.helpers[name];
  };
  Template7.registerPartial = function registerPartial(name, template) {
    Template7Class.partials[name] = { template: template };
  };
  Template7.unregisterPartial = function unregisterPartial(name) {
    if (Template7Class.partials[name]) {
      Template7Class.partials[name] = undefined;
      delete Template7Class.partials[name];
    }
  };
  Template7.compile = function compile(template, options) {
    var instance = new Template7Class(template, options);
    return instance.compile();
  };

  Template7.options = Template7Class.options;
  Template7.helpers = Template7Class.helpers;
  Template7.partials = Template7Class.partials;

  /**
   * SSR Window 1.0.0
   * Better handling for window object in SSR environment
   * https://github.com/nolimits4web/ssr-window
   *
   * Copyright 2018, Vladimir Kharlampidi
   *
   * Licensed under MIT
   *
   * Released on: February 10, 2018
   */
  var d;
  if (typeof document === 'undefined') {
    d = {
      body: {},
      addEventListener: function addEventListener() {},
      removeEventListener: function removeEventListener() {},
      activeElement: {
        blur: function blur() {},
        nodeName: '',
      },
      querySelector: function querySelector() {
        return null;
      },
      querySelectorAll: function querySelectorAll() {
        return [];
      },
      getElementById: function getElementById() {
        return null;
      },
      createEvent: function createEvent() {
        return {
          initEvent: function initEvent() {},
        };
      },
      createElement: function createElement() {
        return {
          children: [],
          childNodes: [],
          style: {},
          setAttribute: function setAttribute() {},
          getElementsByTagName: function getElementsByTagName() {
            return [];
          },
        };
      },
      location: { hash: '' },
    };
  } else {
    // eslint-disable-next-line
    d = document;
  }

  var doc = d;

  var w;
  if (typeof window === 'undefined') {
    w = {
      document: doc,
      navigator: {
        userAgent: '',
      },
      location: {},
      history: {},
      CustomEvent: function CustomEvent() {
        return this;
      },
      addEventListener: function addEventListener() {},
      removeEventListener: function removeEventListener() {},
      getComputedStyle: function getComputedStyle() {
        return {
          getPropertyValue: function getPropertyValue() {
            return '';
          },
        };
      },
      Image: function Image() {},
      Date: function Date() {},
      screen: {},
      setTimeout: function setTimeout() {},
      clearTimeout: function clearTimeout() {},
    };
  } else {
    // eslint-disable-next-line
    w = window;
  }

  var win = w;

  /**
   * Dom7 2.0.7
   * Minimalistic JavaScript library for DOM manipulation, with a jQuery-compatible API
   * http://framework7.io/docs/dom.html
   *
   * Copyright 2018, Vladimir Kharlampidi
   * The iDangero.us
   * http://www.idangero.us/
   *
   * Licensed under MIT
   *
   * Released on: June 14, 2018
   */

  var Dom7 = function Dom7(arr) {
    var self = this;
    // Create array-like object
    for (var i = 0; i < arr.length; i += 1) {
      self[i] = arr[i];
    }
    self.length = arr.length;
    // Return collection with methods
    return this;
  };

  function $$1(selector, context) {
    var arr = [];
    var i = 0;
    if (selector && !context) {
      if (selector instanceof Dom7) {
        return selector;
      }
    }
    if (selector) {
        // String
      if (typeof selector === 'string') {
        var els;
        var tempParent;
        var html = selector.trim();
        if (html.indexOf('<') >= 0 && html.indexOf('>') >= 0) {
          var toCreate = 'div';
          if (html.indexOf('<li') === 0) { toCreate = 'ul'; }
          if (html.indexOf('<tr') === 0) { toCreate = 'tbody'; }
          if (html.indexOf('<td') === 0 || html.indexOf('<th') === 0) { toCreate = 'tr'; }
          if (html.indexOf('<tbody') === 0) { toCreate = 'table'; }
          if (html.indexOf('<option') === 0) { toCreate = 'select'; }
          tempParent = doc.createElement(toCreate);
          tempParent.innerHTML = html;
          for (i = 0; i < tempParent.childNodes.length; i += 1) {
            arr.push(tempParent.childNodes[i]);
          }
        } else {
          if (!context && selector[0] === '#' && !selector.match(/[ .<>:~]/)) {
            // Pure ID selector
            els = [doc.getElementById(selector.trim().split('#')[1])];
          } else {
            // Other selectors
            els = (context || doc).querySelectorAll(selector.trim());
          }
          for (i = 0; i < els.length; i += 1) {
            if (els[i]) { arr.push(els[i]); }
          }
        }
      } else if (selector.nodeType || selector === win || selector === doc) {
        // Node/element
        arr.push(selector);
      } else if (selector.length > 0 && selector[0].nodeType) {
        // Array of elements or instance of Dom
        for (i = 0; i < selector.length; i += 1) {
          arr.push(selector[i]);
        }
      }
    }
    return new Dom7(arr);
  }

  $$1.fn = Dom7.prototype;
  $$1.Class = Dom7;
  $$1.Dom7 = Dom7;

  function unique(arr) {
    var uniqueArray = [];
    for (var i = 0; i < arr.length; i += 1) {
      if (uniqueArray.indexOf(arr[i]) === -1) { uniqueArray.push(arr[i]); }
    }
    return uniqueArray;
  }
  function toCamelCase(string) {
    return string.toLowerCase().replace(/-(.)/g, function (match, group1) { return group1.toUpperCase(); });
  }

  function requestAnimationFrame(callback) {
    if (win.requestAnimationFrame) { return win.requestAnimationFrame(callback); }
    else if (win.webkitRequestAnimationFrame) { return win.webkitRequestAnimationFrame(callback); }
    return win.setTimeout(callback, 1000 / 60);
  }
  function cancelAnimationFrame(id) {
    if (win.cancelAnimationFrame) { return win.cancelAnimationFrame(id); }
    else if (win.webkitCancelAnimationFrame) { return win.webkitCancelAnimationFrame(id); }
    return win.clearTimeout(id);
  }

  // Classes and attributes
  function addClass(className) {
    var this$1 = this;

    if (typeof className === 'undefined') {
      return this;
    }
    var classes = className.split(' ');
    for (var i = 0; i < classes.length; i += 1) {
      for (var j = 0; j < this.length; j += 1) {
        if (typeof this$1[j] !== 'undefined' && typeof this$1[j].classList !== 'undefined') { this$1[j].classList.add(classes[i]); }
      }
    }
    return this;
  }
  function removeClass(className) {
    var this$1 = this;

    var classes = className.split(' ');
    for (var i = 0; i < classes.length; i += 1) {
      for (var j = 0; j < this.length; j += 1) {
        if (typeof this$1[j] !== 'undefined' && typeof this$1[j].classList !== 'undefined') { this$1[j].classList.remove(classes[i]); }
      }
    }
    return this;
  }
  function hasClass(className) {
    if (!this[0]) { return false; }
    return this[0].classList.contains(className);
  }
  function toggleClass(className) {
    var this$1 = this;

    var classes = className.split(' ');
    for (var i = 0; i < classes.length; i += 1) {
      for (var j = 0; j < this.length; j += 1) {
        if (typeof this$1[j] !== 'undefined' && typeof this$1[j].classList !== 'undefined') { this$1[j].classList.toggle(classes[i]); }
      }
    }
    return this;
  }
  function attr(attrs, value) {
    var arguments$1 = arguments;
    var this$1 = this;

    if (arguments.length === 1 && typeof attrs === 'string') {
      // Get attr
      if (this[0]) { return this[0].getAttribute(attrs); }
      return undefined;
    }

    // Set attrs
    for (var i = 0; i < this.length; i += 1) {
      if (arguments$1.length === 2) {
        // String
        this$1[i].setAttribute(attrs, value);
      } else {
        // Object
        // eslint-disable-next-line
        for (var attrName in attrs) {
          this$1[i][attrName] = attrs[attrName];
          this$1[i].setAttribute(attrName, attrs[attrName]);
        }
      }
    }
    return this;
  }
  // eslint-disable-next-line
  function removeAttr(attr) {
    var this$1 = this;

    for (var i = 0; i < this.length; i += 1) {
      this$1[i].removeAttribute(attr);
    }
    return this;
  }
  // eslint-disable-next-line
  function prop(props, value) {
    var arguments$1 = arguments;
    var this$1 = this;

    if (arguments.length === 1 && typeof props === 'string') {
      // Get prop
      if (this[0]) { return this[0][props]; }
    } else {
      // Set props
      for (var i = 0; i < this.length; i += 1) {
        if (arguments$1.length === 2) {
          // String
          this$1[i][props] = value;
        } else {
          // Object
          // eslint-disable-next-line
          for (var propName in props) {
            this$1[i][propName] = props[propName];
          }
        }
      }
      return this;
    }
  }
  function data(key, value) {
    var this$1 = this;

    var el;
    if (typeof value === 'undefined') {
      el = this[0];
      // Get value
      if (el) {
        if (el.dom7ElementDataStorage && (key in el.dom7ElementDataStorage)) {
          return el.dom7ElementDataStorage[key];
        }

        var dataKey = el.getAttribute(("data-" + key));
        if (dataKey) {
          return dataKey;
        }
        return undefined;
      }
      return undefined;
    }

    // Set value
    for (var i = 0; i < this.length; i += 1) {
      el = this$1[i];
      if (!el.dom7ElementDataStorage) { el.dom7ElementDataStorage = {}; }
      el.dom7ElementDataStorage[key] = value;
    }
    return this;
  }
  function removeData(key) {
    var this$1 = this;

    for (var i = 0; i < this.length; i += 1) {
      var el = this$1[i];
      if (el.dom7ElementDataStorage && el.dom7ElementDataStorage[key]) {
        el.dom7ElementDataStorage[key] = null;
        delete el.dom7ElementDataStorage[key];
      }
    }
  }
  function dataset() {
    var el = this[0];
    if (!el) { return undefined; }
    var dataset = {}; // eslint-disable-line
    if (el.dataset) {
      // eslint-disable-next-line
      for (var dataKey in el.dataset) {
        dataset[dataKey] = el.dataset[dataKey];
      }
    } else {
      for (var i = 0; i < el.attributes.length; i += 1) {
        // eslint-disable-next-line
        var attr = el.attributes[i];
        if (attr.name.indexOf('data-') >= 0) {
          dataset[toCamelCase(attr.name.split('data-')[1])] = attr.value;
        }
      }
    }
    // eslint-disable-next-line
    for (var key in dataset) {
      if (dataset[key] === 'false') { dataset[key] = false; }
      else if (dataset[key] === 'true') { dataset[key] = true; }
      else if (parseFloat(dataset[key]) === dataset[key] * 1) { dataset[key] *= 1; }
    }
    return dataset;
  }
  function val(value) {
    var dom = this;
    if (typeof value === 'undefined') {
      if (dom[0]) {
        if (dom[0].multiple && dom[0].nodeName.toLowerCase() === 'select') {
          var values = [];
          for (var i = 0; i < dom[0].selectedOptions.length; i += 1) {
            values.push(dom[0].selectedOptions[i].value);
          }
          return values;
        }
        return dom[0].value;
      }
      return undefined;
    }

    for (var i$1 = 0; i$1 < dom.length; i$1 += 1) {
      var el = dom[i$1];
      if (Array.isArray(value) && el.multiple && el.nodeName.toLowerCase() === 'select') {
        for (var j = 0; j < el.options.length; j += 1) {
          el.options[j].selected = value.indexOf(el.options[j].value) >= 0;
        }
      } else {
        el.value = value;
      }
    }
    return dom;
  }
  // Transforms
  // eslint-disable-next-line
  function transform(transform) {
    var this$1 = this;

    for (var i = 0; i < this.length; i += 1) {
      var elStyle = this$1[i].style;
      elStyle.webkitTransform = transform;
      elStyle.transform = transform;
    }
    return this;
  }
  function transition(duration) {
    var this$1 = this;

    if (typeof duration !== 'string') {
      duration = duration + "ms"; // eslint-disable-line
    }
    for (var i = 0; i < this.length; i += 1) {
      var elStyle = this$1[i].style;
      elStyle.webkitTransitionDuration = duration;
      elStyle.transitionDuration = duration;
    }
    return this;
  }
  // Events
  function on() {
    var this$1 = this;
    var assign;

    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];
    var eventType = args[0];
    var targetSelector = args[1];
    var listener = args[2];
    var capture = args[3];
    if (typeof args[1] === 'function') {
      (assign = args, eventType = assign[0], listener = assign[1], capture = assign[2]);
      targetSelector = undefined;
    }
    if (!capture) { capture = false; }

    function handleLiveEvent(e) {
      var target = e.target;
      if (!target) { return; }
      var eventData = e.target.dom7EventData || [];
      if (eventData.indexOf(e) < 0) {
        eventData.unshift(e);
      }
      if ($$1(target).is(targetSelector)) { listener.apply(target, eventData); }
      else {
        var parents = $$1(target).parents(); // eslint-disable-line
        for (var k = 0; k < parents.length; k += 1) {
          if ($$1(parents[k]).is(targetSelector)) { listener.apply(parents[k], eventData); }
        }
      }
    }
    function handleEvent(e) {
      var eventData = e && e.target ? e.target.dom7EventData || [] : [];
      if (eventData.indexOf(e) < 0) {
        eventData.unshift(e);
      }
      listener.apply(this, eventData);
    }
    var events = eventType.split(' ');
    var j;
    for (var i = 0; i < this.length; i += 1) {
      var el = this$1[i];
      if (!targetSelector) {
        for (j = 0; j < events.length; j += 1) {
          var event = events[j];
          if (!el.dom7Listeners) { el.dom7Listeners = {}; }
          if (!el.dom7Listeners[event]) { el.dom7Listeners[event] = []; }
          el.dom7Listeners[event].push({
            listener: listener,
            proxyListener: handleEvent,
          });
          el.addEventListener(event, handleEvent, capture);
        }
      } else {
        // Live events
        for (j = 0; j < events.length; j += 1) {
          var event$1 = events[j];
          if (!el.dom7LiveListeners) { el.dom7LiveListeners = {}; }
          if (!el.dom7LiveListeners[event$1]) { el.dom7LiveListeners[event$1] = []; }
          el.dom7LiveListeners[event$1].push({
            listener: listener,
            proxyListener: handleLiveEvent,
          });
          el.addEventListener(event$1, handleLiveEvent, capture);
        }
      }
    }
    return this;
  }
  function off() {
    var this$1 = this;
    var assign;

    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];
    var eventType = args[0];
    var targetSelector = args[1];
    var listener = args[2];
    var capture = args[3];
    if (typeof args[1] === 'function') {
      (assign = args, eventType = assign[0], listener = assign[1], capture = assign[2]);
      targetSelector = undefined;
    }
    if (!capture) { capture = false; }

    var events = eventType.split(' ');
    for (var i = 0; i < events.length; i += 1) {
      var event = events[i];
      for (var j = 0; j < this.length; j += 1) {
        var el = this$1[j];
        var handlers = (void 0);
        if (!targetSelector && el.dom7Listeners) {
          handlers = el.dom7Listeners[event];
        } else if (targetSelector && el.dom7LiveListeners) {
          handlers = el.dom7LiveListeners[event];
        }
        if (handlers && handlers.length) {
          for (var k = handlers.length - 1; k >= 0; k -= 1) {
            var handler = handlers[k];
            if (listener && handler.listener === listener) {
              el.removeEventListener(event, handler.proxyListener, capture);
              handlers.splice(k, 1);
            } else if (!listener) {
              el.removeEventListener(event, handler.proxyListener, capture);
              handlers.splice(k, 1);
            }
          }
        }
      }
    }
    return this;
  }
  function once() {
    var assign;

    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];
    var dom = this;
    var eventName = args[0];
    var targetSelector = args[1];
    var listener = args[2];
    var capture = args[3];
    if (typeof args[1] === 'function') {
      (assign = args, eventName = assign[0], listener = assign[1], capture = assign[2]);
      targetSelector = undefined;
    }
    function proxy() {
      var eventArgs = [], len = arguments.length;
      while ( len-- ) eventArgs[ len ] = arguments[ len ];

      listener.apply(this, eventArgs);
      dom.off(eventName, targetSelector, proxy, capture);
    }
    return dom.on(eventName, targetSelector, proxy, capture);
  }
  function trigger() {
    var this$1 = this;
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    var events = args[0].split(' ');
    var eventData = args[1];
    for (var i = 0; i < events.length; i += 1) {
      var event = events[i];
      for (var j = 0; j < this.length; j += 1) {
        var el = this$1[j];
        var evt = (void 0);
        try {
          evt = new win.CustomEvent(event, {
            detail: eventData,
            bubbles: true,
            cancelable: true,
          });
        } catch (e) {
          evt = doc.createEvent('Event');
          evt.initEvent(event, true, true);
          evt.detail = eventData;
        }
        // eslint-disable-next-line
        el.dom7EventData = args.filter(function (data, dataIndex) { return dataIndex > 0; });
        el.dispatchEvent(evt);
        el.dom7EventData = [];
        delete el.dom7EventData;
      }
    }
    return this;
  }
  function transitionEnd(callback) {
    var events = ['webkitTransitionEnd', 'transitionend'];
    var dom = this;
    var i;
    function fireCallBack(e) {
      /* jshint validthis:true */
      if (e.target !== this) { return; }
      callback.call(this, e);
      for (i = 0; i < events.length; i += 1) {
        dom.off(events[i], fireCallBack);
      }
    }
    if (callback) {
      for (i = 0; i < events.length; i += 1) {
        dom.on(events[i], fireCallBack);
      }
    }
    return this;
  }
  function animationEnd(callback) {
    var events = ['webkitAnimationEnd', 'animationend'];
    var dom = this;
    var i;
    function fireCallBack(e) {
      if (e.target !== this) { return; }
      callback.call(this, e);
      for (i = 0; i < events.length; i += 1) {
        dom.off(events[i], fireCallBack);
      }
    }
    if (callback) {
      for (i = 0; i < events.length; i += 1) {
        dom.on(events[i], fireCallBack);
      }
    }
    return this;
  }
  // Sizing/Styles
  function width() {
    if (this[0] === win) {
      return win.innerWidth;
    }

    if (this.length > 0) {
      return parseFloat(this.css('width'));
    }

    return null;
  }
  function outerWidth(includeMargins) {
    if (this.length > 0) {
      if (includeMargins) {
        // eslint-disable-next-line
        var styles = this.styles();
        return this[0].offsetWidth + parseFloat(styles.getPropertyValue('margin-right')) + parseFloat(styles.getPropertyValue('margin-left'));
      }
      return this[0].offsetWidth;
    }
    return null;
  }
  function height() {
    if (this[0] === win) {
      return win.innerHeight;
    }

    if (this.length > 0) {
      return parseFloat(this.css('height'));
    }

    return null;
  }
  function outerHeight(includeMargins) {
    if (this.length > 0) {
      if (includeMargins) {
        // eslint-disable-next-line
        var styles = this.styles();
        return this[0].offsetHeight + parseFloat(styles.getPropertyValue('margin-top')) + parseFloat(styles.getPropertyValue('margin-bottom'));
      }
      return this[0].offsetHeight;
    }
    return null;
  }
  function offset() {
    if (this.length > 0) {
      var el = this[0];
      var box = el.getBoundingClientRect();
      var body = doc.body;
      var clientTop = el.clientTop || body.clientTop || 0;
      var clientLeft = el.clientLeft || body.clientLeft || 0;
      var scrollTop = el === win ? win.scrollY : el.scrollTop;
      var scrollLeft = el === win ? win.scrollX : el.scrollLeft;
      return {
        top: (box.top + scrollTop) - clientTop,
        left: (box.left + scrollLeft) - clientLeft,
      };
    }

    return null;
  }
  function hide() {
    var this$1 = this;

    for (var i = 0; i < this.length; i += 1) {
      this$1[i].style.display = 'none';
    }
    return this;
  }
  function show() {
    var this$1 = this;

    for (var i = 0; i < this.length; i += 1) {
      var el = this$1[i];
      if (el.style.display === 'none') {
        el.style.display = '';
      }
      if (win.getComputedStyle(el, null).getPropertyValue('display') === 'none') {
        // Still not visible
        el.style.display = 'block';
      }
    }
    return this;
  }
  function styles() {
    if (this[0]) { return win.getComputedStyle(this[0], null); }
    return {};
  }
  function css(props, value) {
    var this$1 = this;

    var i;
    if (arguments.length === 1) {
      if (typeof props === 'string') {
        if (this[0]) { return win.getComputedStyle(this[0], null).getPropertyValue(props); }
      } else {
        for (i = 0; i < this.length; i += 1) {
          // eslint-disable-next-line
          for (var prop in props) {
            this$1[i].style[prop] = props[prop];
          }
        }
        return this;
      }
    }
    if (arguments.length === 2 && typeof props === 'string') {
      for (i = 0; i < this.length; i += 1) {
        this$1[i].style[props] = value;
      }
      return this;
    }
    return this;
  }

  // Dom manipulation
  function toArray() {
    var this$1 = this;

    var arr = [];
    for (var i = 0; i < this.length; i += 1) {
      arr.push(this$1[i]);
    }
    return arr;
  }
  // Iterate over the collection passing elements to `callback`
  function each(callback) {
    var this$1 = this;

    // Don't bother continuing without a callback
    if (!callback) { return this; }
    // Iterate over the current collection
    for (var i = 0; i < this.length; i += 1) {
      // If the callback returns false
      if (callback.call(this$1[i], i, this$1[i]) === false) {
        // End the loop early
        return this$1;
      }
    }
    // Return `this` to allow chained DOM operations
    return this;
  }
  function forEach(callback) {
    var this$1 = this;

    // Don't bother continuing without a callback
    if (!callback) { return this; }
    // Iterate over the current collection
    for (var i = 0; i < this.length; i += 1) {
      // If the callback returns false
      if (callback.call(this$1[i], this$1[i], i) === false) {
        // End the loop early
        return this$1;
      }
    }
    // Return `this` to allow chained DOM operations
    return this;
  }
  function filter(callback) {
    var matchedItems = [];
    var dom = this;
    for (var i = 0; i < dom.length; i += 1) {
      if (callback.call(dom[i], i, dom[i])) { matchedItems.push(dom[i]); }
    }
    return new Dom7(matchedItems);
  }
  function map(callback) {
    var modifiedItems = [];
    var dom = this;
    for (var i = 0; i < dom.length; i += 1) {
      modifiedItems.push(callback.call(dom[i], i, dom[i]));
    }
    return new Dom7(modifiedItems);
  }
  // eslint-disable-next-line
  function html(html) {
    var this$1 = this;

    if (typeof html === 'undefined') {
      return this[0] ? this[0].innerHTML : undefined;
    }

    for (var i = 0; i < this.length; i += 1) {
      this$1[i].innerHTML = html;
    }
    return this;
  }
  // eslint-disable-next-line
  function text(text) {
    var this$1 = this;

    if (typeof text === 'undefined') {
      if (this[0]) {
        return this[0].textContent.trim();
      }
      return null;
    }

    for (var i = 0; i < this.length; i += 1) {
      this$1[i].textContent = text;
    }
    return this;
  }
  function is(selector) {
    var el = this[0];
    var compareWith;
    var i;
    if (!el || typeof selector === 'undefined') { return false; }
    if (typeof selector === 'string') {
      if (el.matches) { return el.matches(selector); }
      else if (el.webkitMatchesSelector) { return el.webkitMatchesSelector(selector); }
      else if (el.msMatchesSelector) { return el.msMatchesSelector(selector); }

      compareWith = $$1(selector);
      for (i = 0; i < compareWith.length; i += 1) {
        if (compareWith[i] === el) { return true; }
      }
      return false;
    } else if (selector === doc) { return el === doc; }
    else if (selector === win) { return el === win; }

    if (selector.nodeType || selector instanceof Dom7) {
      compareWith = selector.nodeType ? [selector] : selector;
      for (i = 0; i < compareWith.length; i += 1) {
        if (compareWith[i] === el) { return true; }
      }
      return false;
    }
    return false;
  }
  function indexOf(el) {
    var this$1 = this;

    for (var i = 0; i < this.length; i += 1) {
      if (this$1[i] === el) { return i; }
    }
    return -1;
  }
  function index() {
    var child = this[0];
    var i;
    if (child) {
      i = 0;
      // eslint-disable-next-line
      while ((child = child.previousSibling) !== null) {
        if (child.nodeType === 1) { i += 1; }
      }
      return i;
    }
    return undefined;
  }
  // eslint-disable-next-line
  function eq(index) {
    if (typeof index === 'undefined') { return this; }
    var length = this.length;
    var returnIndex;
    if (index > length - 1) {
      return new Dom7([]);
    }
    if (index < 0) {
      returnIndex = length + index;
      if (returnIndex < 0) { return new Dom7([]); }
      return new Dom7([this[returnIndex]]);
    }
    return new Dom7([this[index]]);
  }
  function append() {
    var this$1 = this;
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    var newChild;

    for (var k = 0; k < args.length; k += 1) {
      newChild = args[k];
      for (var i = 0; i < this.length; i += 1) {
        if (typeof newChild === 'string') {
          var tempDiv = doc.createElement('div');
          tempDiv.innerHTML = newChild;
          while (tempDiv.firstChild) {
            this$1[i].appendChild(tempDiv.firstChild);
          }
        } else if (newChild instanceof Dom7) {
          for (var j = 0; j < newChild.length; j += 1) {
            this$1[i].appendChild(newChild[j]);
          }
        } else {
          this$1[i].appendChild(newChild);
        }
      }
    }

    return this;
  }
   // eslint-disable-next-line
  function appendTo(parent) {
    $$1(parent).append(this);
    return this;
  }
  function prepend(newChild) {
    var this$1 = this;

    var i;
    var j;
    for (i = 0; i < this.length; i += 1) {
      if (typeof newChild === 'string') {
        var tempDiv = doc.createElement('div');
        tempDiv.innerHTML = newChild;
        for (j = tempDiv.childNodes.length - 1; j >= 0; j -= 1) {
          this$1[i].insertBefore(tempDiv.childNodes[j], this$1[i].childNodes[0]);
        }
      } else if (newChild instanceof Dom7) {
        for (j = 0; j < newChild.length; j += 1) {
          this$1[i].insertBefore(newChild[j], this$1[i].childNodes[0]);
        }
      } else {
        this$1[i].insertBefore(newChild, this$1[i].childNodes[0]);
      }
    }
    return this;
  }
   // eslint-disable-next-line
  function prependTo(parent) {
    $$1(parent).prepend(this);
    return this;
  }
  function insertBefore(selector) {
    var this$1 = this;

    var before = $$1(selector);
    for (var i = 0; i < this.length; i += 1) {
      if (before.length === 1) {
        before[0].parentNode.insertBefore(this$1[i], before[0]);
      } else if (before.length > 1) {
        for (var j = 0; j < before.length; j += 1) {
          before[j].parentNode.insertBefore(this$1[i].cloneNode(true), before[j]);
        }
      }
    }
  }
  function insertAfter(selector) {
    var this$1 = this;

    var after = $$1(selector);
    for (var i = 0; i < this.length; i += 1) {
      if (after.length === 1) {
        after[0].parentNode.insertBefore(this$1[i], after[0].nextSibling);
      } else if (after.length > 1) {
        for (var j = 0; j < after.length; j += 1) {
          after[j].parentNode.insertBefore(this$1[i].cloneNode(true), after[j].nextSibling);
        }
      }
    }
  }
  function next(selector) {
    if (this.length > 0) {
      if (selector) {
        if (this[0].nextElementSibling && $$1(this[0].nextElementSibling).is(selector)) {
          return new Dom7([this[0].nextElementSibling]);
        }
        return new Dom7([]);
      }

      if (this[0].nextElementSibling) { return new Dom7([this[0].nextElementSibling]); }
      return new Dom7([]);
    }
    return new Dom7([]);
  }
  function nextAll(selector) {
    var nextEls = [];
    var el = this[0];
    if (!el) { return new Dom7([]); }
    while (el.nextElementSibling) {
      var next = el.nextElementSibling; // eslint-disable-line
      if (selector) {
        if ($$1(next).is(selector)) { nextEls.push(next); }
      } else { nextEls.push(next); }
      el = next;
    }
    return new Dom7(nextEls);
  }
  function prev(selector) {
    if (this.length > 0) {
      var el = this[0];
      if (selector) {
        if (el.previousElementSibling && $$1(el.previousElementSibling).is(selector)) {
          return new Dom7([el.previousElementSibling]);
        }
        return new Dom7([]);
      }

      if (el.previousElementSibling) { return new Dom7([el.previousElementSibling]); }
      return new Dom7([]);
    }
    return new Dom7([]);
  }
  function prevAll(selector) {
    var prevEls = [];
    var el = this[0];
    if (!el) { return new Dom7([]); }
    while (el.previousElementSibling) {
      var prev = el.previousElementSibling; // eslint-disable-line
      if (selector) {
        if ($$1(prev).is(selector)) { prevEls.push(prev); }
      } else { prevEls.push(prev); }
      el = prev;
    }
    return new Dom7(prevEls);
  }
  function siblings(selector) {
    return this.nextAll(selector).add(this.prevAll(selector));
  }
  function parent(selector) {
    var this$1 = this;

    var parents = []; // eslint-disable-line
    for (var i = 0; i < this.length; i += 1) {
      if (this$1[i].parentNode !== null) {
        if (selector) {
          if ($$1(this$1[i].parentNode).is(selector)) { parents.push(this$1[i].parentNode); }
        } else {
          parents.push(this$1[i].parentNode);
        }
      }
    }
    return $$1(unique(parents));
  }
  function parents(selector) {
    var this$1 = this;

    var parents = []; // eslint-disable-line
    for (var i = 0; i < this.length; i += 1) {
      var parent = this$1[i].parentNode; // eslint-disable-line
      while (parent) {
        if (selector) {
          if ($$1(parent).is(selector)) { parents.push(parent); }
        } else {
          parents.push(parent);
        }
        parent = parent.parentNode;
      }
    }
    return $$1(unique(parents));
  }
  function closest(selector) {
    var closest = this; // eslint-disable-line
    if (typeof selector === 'undefined') {
      return new Dom7([]);
    }
    if (!closest.is(selector)) {
      closest = closest.parents(selector).eq(0);
    }
    return closest;
  }
  function find(selector) {
    var this$1 = this;

    var foundElements = [];
    for (var i = 0; i < this.length; i += 1) {
      var found = this$1[i].querySelectorAll(selector);
      for (var j = 0; j < found.length; j += 1) {
        foundElements.push(found[j]);
      }
    }
    return new Dom7(foundElements);
  }
  function children(selector) {
    var this$1 = this;

    var children = []; // eslint-disable-line
    for (var i = 0; i < this.length; i += 1) {
      var childNodes = this$1[i].childNodes;

      for (var j = 0; j < childNodes.length; j += 1) {
        if (!selector) {
          if (childNodes[j].nodeType === 1) { children.push(childNodes[j]); }
        } else if (childNodes[j].nodeType === 1 && $$1(childNodes[j]).is(selector)) {
          children.push(childNodes[j]);
        }
      }
    }
    return new Dom7(unique(children));
  }
  function remove() {
    var this$1 = this;

    for (var i = 0; i < this.length; i += 1) {
      if (this$1[i].parentNode) { this$1[i].parentNode.removeChild(this$1[i]); }
    }
    return this;
  }
  function detach() {
    return this.remove();
  }
  function add() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    var dom = this;
    var i;
    var j;
    for (i = 0; i < args.length; i += 1) {
      var toAdd = $$1(args[i]);
      for (j = 0; j < toAdd.length; j += 1) {
        dom[dom.length] = toAdd[j];
        dom.length += 1;
      }
    }
    return dom;
  }
  function empty() {
    var this$1 = this;

    for (var i = 0; i < this.length; i += 1) {
      var el = this$1[i];
      if (el.nodeType === 1) {
        for (var j = 0; j < el.childNodes.length; j += 1) {
          if (el.childNodes[j].parentNode) {
            el.childNodes[j].parentNode.removeChild(el.childNodes[j]);
          }
        }
        el.textContent = '';
      }
    }
    return this;
  }




  var Methods = Object.freeze({
  	addClass: addClass,
  	removeClass: removeClass,
  	hasClass: hasClass,
  	toggleClass: toggleClass,
  	attr: attr,
  	removeAttr: removeAttr,
  	prop: prop,
  	data: data,
  	removeData: removeData,
  	dataset: dataset,
  	val: val,
  	transform: transform,
  	transition: transition,
  	on: on,
  	off: off,
  	once: once,
  	trigger: trigger,
  	transitionEnd: transitionEnd,
  	animationEnd: animationEnd,
  	width: width,
  	outerWidth: outerWidth,
  	height: height,
  	outerHeight: outerHeight,
  	offset: offset,
  	hide: hide,
  	show: show,
  	styles: styles,
  	css: css,
  	toArray: toArray,
  	each: each,
  	forEach: forEach,
  	filter: filter,
  	map: map,
  	html: html,
  	text: text,
  	is: is,
  	indexOf: indexOf,
  	index: index,
  	eq: eq,
  	append: append,
  	appendTo: appendTo,
  	prepend: prepend,
  	prependTo: prependTo,
  	insertBefore: insertBefore,
  	insertAfter: insertAfter,
  	next: next,
  	nextAll: nextAll,
  	prev: prev,
  	prevAll: prevAll,
  	siblings: siblings,
  	parent: parent,
  	parents: parents,
  	closest: closest,
  	find: find,
  	children: children,
  	remove: remove,
  	detach: detach,
  	add: add,
  	empty: empty
  });

  function scrollTo() {
    var assign;

    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];
    var left = args[0];
    var top = args[1];
    var duration = args[2];
    var easing = args[3];
    var callback = args[4];
    if (args.length === 4 && typeof easing === 'function') {
      callback = easing;
      (assign = args, left = assign[0], top = assign[1], duration = assign[2], callback = assign[3], easing = assign[4]);
    }
    if (typeof easing === 'undefined') { easing = 'swing'; }

    return this.each(function animate() {
      var el = this;
      var currentTop;
      var currentLeft;
      var maxTop;
      var maxLeft;
      var newTop;
      var newLeft;
      var scrollTop; // eslint-disable-line
      var scrollLeft; // eslint-disable-line
      var animateTop = top > 0 || top === 0;
      var animateLeft = left > 0 || left === 0;
      if (typeof easing === 'undefined') {
        easing = 'swing';
      }
      if (animateTop) {
        currentTop = el.scrollTop;
        if (!duration) {
          el.scrollTop = top;
        }
      }
      if (animateLeft) {
        currentLeft = el.scrollLeft;
        if (!duration) {
          el.scrollLeft = left;
        }
      }
      if (!duration) { return; }
      if (animateTop) {
        maxTop = el.scrollHeight - el.offsetHeight;
        newTop = Math.max(Math.min(top, maxTop), 0);
      }
      if (animateLeft) {
        maxLeft = el.scrollWidth - el.offsetWidth;
        newLeft = Math.max(Math.min(left, maxLeft), 0);
      }
      var startTime = null;
      if (animateTop && newTop === currentTop) { animateTop = false; }
      if (animateLeft && newLeft === currentLeft) { animateLeft = false; }
      function render(time) {
        if ( time === void 0 ) time = new Date().getTime();

        if (startTime === null) {
          startTime = time;
        }
        var progress = Math.max(Math.min((time - startTime) / duration, 1), 0);
        var easeProgress = easing === 'linear' ? progress : (0.5 - (Math.cos(progress * Math.PI) / 2));
        var done;
        if (animateTop) { scrollTop = currentTop + (easeProgress * (newTop - currentTop)); }
        if (animateLeft) { scrollLeft = currentLeft + (easeProgress * (newLeft - currentLeft)); }
        if (animateTop && newTop > currentTop && scrollTop >= newTop) {
          el.scrollTop = newTop;
          done = true;
        }
        if (animateTop && newTop < currentTop && scrollTop <= newTop) {
          el.scrollTop = newTop;
          done = true;
        }
        if (animateLeft && newLeft > currentLeft && scrollLeft >= newLeft) {
          el.scrollLeft = newLeft;
          done = true;
        }
        if (animateLeft && newLeft < currentLeft && scrollLeft <= newLeft) {
          el.scrollLeft = newLeft;
          done = true;
        }

        if (done) {
          if (callback) { callback(); }
          return;
        }
        if (animateTop) { el.scrollTop = scrollTop; }
        if (animateLeft) { el.scrollLeft = scrollLeft; }
        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    });
  }
  // scrollTop(top, duration, easing, callback) {
  function scrollTop() {
    var assign;

    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];
    var top = args[0];
    var duration = args[1];
    var easing = args[2];
    var callback = args[3];
    if (args.length === 3 && typeof easing === 'function') {
      (assign = args, top = assign[0], duration = assign[1], callback = assign[2], easing = assign[3]);
    }
    var dom = this;
    if (typeof top === 'undefined') {
      if (dom.length > 0) { return dom[0].scrollTop; }
      return null;
    }
    return dom.scrollTo(undefined, top, duration, easing, callback);
  }
  function scrollLeft() {
    var assign;

    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];
    var left = args[0];
    var duration = args[1];
    var easing = args[2];
    var callback = args[3];
    if (args.length === 3 && typeof easing === 'function') {
      (assign = args, left = assign[0], duration = assign[1], callback = assign[2], easing = assign[3]);
    }
    var dom = this;
    if (typeof left === 'undefined') {
      if (dom.length > 0) { return dom[0].scrollLeft; }
      return null;
    }
    return dom.scrollTo(left, undefined, duration, easing, callback);
  }




  var Scroll = Object.freeze({
  	scrollTo: scrollTo,
  	scrollTop: scrollTop,
  	scrollLeft: scrollLeft
  });

  function animate(initialProps, initialParams) {
    var els = this;
    var a = {
      props: Object.assign({}, initialProps),
      params: Object.assign({
        duration: 300,
        easing: 'swing', // or 'linear'
        /* Callbacks
        begin(elements)
        complete(elements)
        progress(elements, complete, remaining, start, tweenValue)
        */
      }, initialParams),

      elements: els,
      animating: false,
      que: [],

      easingProgress: function easingProgress(easing, progress) {
        if (easing === 'swing') {
          return 0.5 - (Math.cos(progress * Math.PI) / 2);
        }
        if (typeof easing === 'function') {
          return easing(progress);
        }
        return progress;
      },
      stop: function stop() {
        if (a.frameId) {
          cancelAnimationFrame(a.frameId);
        }
        a.animating = false;
        a.elements.each(function (index, el) {
          var element = el;
          delete element.dom7AnimateInstance;
        });
        a.que = [];
      },
      done: function done(complete) {
        a.animating = false;
        a.elements.each(function (index, el) {
          var element = el;
          delete element.dom7AnimateInstance;
        });
        if (complete) { complete(els); }
        if (a.que.length > 0) {
          var que = a.que.shift();
          a.animate(que[0], que[1]);
        }
      },
      animate: function animate(props, params) {
        if (a.animating) {
          a.que.push([props, params]);
          return a;
        }
        var elements = [];

        // Define & Cache Initials & Units
        a.elements.each(function (index, el) {
          var initialFullValue;
          var initialValue;
          var unit;
          var finalValue;
          var finalFullValue;

          if (!el.dom7AnimateInstance) { a.elements[index].dom7AnimateInstance = a; }

          elements[index] = {
            container: el,
          };
          Object.keys(props).forEach(function (prop) {
            initialFullValue = win.getComputedStyle(el, null).getPropertyValue(prop).replace(',', '.');
            initialValue = parseFloat(initialFullValue);
            unit = initialFullValue.replace(initialValue, '');
            finalValue = parseFloat(props[prop]);
            finalFullValue = props[prop] + unit;
            elements[index][prop] = {
              initialFullValue: initialFullValue,
              initialValue: initialValue,
              unit: unit,
              finalValue: finalValue,
              finalFullValue: finalFullValue,
              currentValue: initialValue,
            };
          });
        });

        var startTime = null;
        var time;
        var elementsDone = 0;
        var propsDone = 0;
        var done;
        var began = false;

        a.animating = true;

        function render() {
          time = new Date().getTime();
          var progress;
          var easeProgress;
          // let el;
          if (!began) {
            began = true;
            if (params.begin) { params.begin(els); }
          }
          if (startTime === null) {
            startTime = time;
          }
          if (params.progress) {
            // eslint-disable-next-line
            params.progress(els, Math.max(Math.min((time - startTime) / params.duration, 1), 0), ((startTime + params.duration) - time < 0 ? 0 : (startTime + params.duration) - time), startTime);
          }

          elements.forEach(function (element) {
            var el = element;
            if (done || el.done) { return; }
            Object.keys(props).forEach(function (prop) {
              if (done || el.done) { return; }
              progress = Math.max(Math.min((time - startTime) / params.duration, 1), 0);
              easeProgress = a.easingProgress(params.easing, progress);
              var ref = el[prop];
              var initialValue = ref.initialValue;
              var finalValue = ref.finalValue;
              var unit = ref.unit;
              el[prop].currentValue = initialValue + (easeProgress * (finalValue - initialValue));
              var currentValue = el[prop].currentValue;

              if (
                (finalValue > initialValue && currentValue >= finalValue) ||
                (finalValue < initialValue && currentValue <= finalValue)) {
                el.container.style[prop] = finalValue + unit;
                propsDone += 1;
                if (propsDone === Object.keys(props).length) {
                  el.done = true;
                  elementsDone += 1;
                }
                if (elementsDone === elements.length) {
                  done = true;
                }
              }
              if (done) {
                a.done(params.complete);
                return;
              }
              el.container.style[prop] = currentValue + unit;
            });
          });
          if (done) { return; }
          // Then call
          a.frameId = requestAnimationFrame(render);
        }
        a.frameId = requestAnimationFrame(render);
        return a;
      },
    };

    if (a.elements.length === 0) {
      return els;
    }

    var animateInstance;
    for (var i = 0; i < a.elements.length; i += 1) {
      if (a.elements[i].dom7AnimateInstance) {
        animateInstance = a.elements[i].dom7AnimateInstance;
      } else { a.elements[i].dom7AnimateInstance = a; }
    }
    if (!animateInstance) {
      animateInstance = a;
    }

    if (initialProps === 'stop') {
      animateInstance.stop();
    } else {
      animateInstance.animate(a.props, a.params);
    }

    return els;
  }

  function stop() {
    var els = this;
    for (var i = 0; i < els.length; i += 1) {
      if (els[i].dom7AnimateInstance) {
        els[i].dom7AnimateInstance.stop();
      }
    }
  }




  var Animate = Object.freeze({
  	animate: animate,
  	stop: stop
  });

  var noTrigger = ('resize scroll').split(' ');
  function eventShortcut(name) {
    var this$1 = this;
    var ref;

    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];
    if (typeof args[0] === 'undefined') {
      for (var i = 0; i < this.length; i += 1) {
        if (noTrigger.indexOf(name) < 0) {
          if (name in this$1[i]) { this$1[i][name](); }
          else {
            $$1(this$1[i]).trigger(name);
          }
        }
      }
      return this;
    }
    return (ref = this).on.apply(ref, [ name ].concat( args ));
  }

  function click() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'click' ].concat( args ));
  }
  function blur() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'blur' ].concat( args ));
  }
  function focus() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'focus' ].concat( args ));
  }
  function focusin() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'focusin' ].concat( args ));
  }
  function focusout() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'focusout' ].concat( args ));
  }
  function keyup() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'keyup' ].concat( args ));
  }
  function keydown() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'keydown' ].concat( args ));
  }
  function keypress() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'keypress' ].concat( args ));
  }
  function submit() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'submit' ].concat( args ));
  }
  function change() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'change' ].concat( args ));
  }
  function mousedown() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'mousedown' ].concat( args ));
  }
  function mousemove() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'mousemove' ].concat( args ));
  }
  function mouseup() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'mouseup' ].concat( args ));
  }
  function mouseenter() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'mouseenter' ].concat( args ));
  }
  function mouseleave() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'mouseleave' ].concat( args ));
  }
  function mouseout() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'mouseout' ].concat( args ));
  }
  function mouseover() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'mouseover' ].concat( args ));
  }
  function touchstart() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'touchstart' ].concat( args ));
  }
  function touchend() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'touchend' ].concat( args ));
  }
  function touchmove() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'touchmove' ].concat( args ));
  }
  function resize() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'resize' ].concat( args ));
  }
  function scroll() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return eventShortcut.bind(this).apply(void 0, [ 'scroll' ].concat( args ));
  }




  var eventShortcuts = Object.freeze({
  	click: click,
  	blur: blur,
  	focus: focus,
  	focusin: focusin,
  	focusout: focusout,
  	keyup: keyup,
  	keydown: keydown,
  	keypress: keypress,
  	submit: submit,
  	change: change,
  	mousedown: mousedown,
  	mousemove: mousemove,
  	mouseup: mouseup,
  	mouseenter: mouseenter,
  	mouseleave: mouseleave,
  	mouseout: mouseout,
  	mouseover: mouseover,
  	touchstart: touchstart,
  	touchend: touchend,
  	touchmove: touchmove,
  	resize: resize,
  	scroll: scroll
  });

  [Methods, Scroll, Animate, eventShortcuts].forEach(function (group) {
    Object.keys(group).forEach(function (methodName) {
      $$1.fn[methodName] = group[methodName];
    });
  });

  /**
   * https://github.com/gre/bezier-easing
   * BezierEasing - use bezier curve for transition easing function
   * by Gaëtan Renaudeau 2014 - 2015 – MIT License
   */

  /* eslint-disable */

  // These values are established by empiricism with tests (tradeoff: performance VS precision)
  var NEWTON_ITERATIONS = 4;
  var NEWTON_MIN_SLOPE = 0.001;
  var SUBDIVISION_PRECISION = 0.0000001;
  var SUBDIVISION_MAX_ITERATIONS = 10;

  var kSplineTableSize = 11;
  var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

  var float32ArraySupported = typeof Float32Array === 'function';

  function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
  function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
  function C (aA1)      { return 3.0 * aA1; }

  // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
  function calcBezier (aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT; }

  // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
  function getSlope (aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1); }

  function binarySubdivide (aX, aA, aB, mX1, mX2) {
    var currentX, currentT, i = 0;
    do {
      currentT = aA + (aB - aA) / 2.0;
      currentX = calcBezier(currentT, mX1, mX2) - aX;
      if (currentX > 0.0) {
        aB = currentT;
      } else {
        aA = currentT;
      }
    } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
    return currentT;
  }

  function newtonRaphsonIterate (aX, aGuessT, mX1, mX2) {
   for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
     var currentSlope = getSlope(aGuessT, mX1, mX2);
     if (currentSlope === 0.0) {
       return aGuessT;
     }
     var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
     aGuessT -= currentX / currentSlope;
   }
   return aGuessT;
  }

  function bezier (mX1, mY1, mX2, mY2) {
    if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
      throw new Error('bezier x values must be in [0, 1] range');
    }

    // Precompute samples table
    var sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
    if (mX1 !== mY1 || mX2 !== mY2) {
      for (var i = 0; i < kSplineTableSize; ++i) {
        sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
      }
    }

    function getTForX (aX) {
      var intervalStart = 0.0;
      var currentSample = 1;
      var lastSample = kSplineTableSize - 1;

      for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
        intervalStart += kSampleStepSize;
      }
      --currentSample;

      // Interpolate to provide an initial guess for t
      var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
      var guessForT = intervalStart + dist * kSampleStepSize;

      var initialSlope = getSlope(guessForT, mX1, mX2);
      if (initialSlope >= NEWTON_MIN_SLOPE) {
        return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
      } else if (initialSlope === 0.0) {
        return guessForT;
      } else {
        return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
      }
    }

    return function BezierEasing (x) {
      if (mX1 === mY1 && mX2 === mY2) {
        return x; // linear
      }
      // Because JavaScript number are imprecise, we should guarantee the extremes are right.
      if (x === 0) {
        return 0;
      }
      if (x === 1) {
        return 1;
      }
      return calcBezier(getTForX(x), mY1, mY2);
    };
  }

  /* eslint no-control-regex: "off" */

  // Remove Diacritics
  var defaultDiacriticsRemovalap = [
    { base: 'A', letters: '\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F' },
    { base: 'AA', letters: '\uA732' },
    { base: 'AE', letters: '\u00C6\u01FC\u01E2' },
    { base: 'AO', letters: '\uA734' },
    { base: 'AU', letters: '\uA736' },
    { base: 'AV', letters: '\uA738\uA73A' },
    { base: 'AY', letters: '\uA73C' },
    { base: 'B', letters: '\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181' },
    { base: 'C', letters: '\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E' },
    { base: 'D', letters: '\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779' },
    { base: 'DZ', letters: '\u01F1\u01C4' },
    { base: 'Dz', letters: '\u01F2\u01C5' },
    { base: 'E', letters: '\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E' },
    { base: 'F', letters: '\u0046\u24BB\uFF26\u1E1E\u0191\uA77B' },
    { base: 'G', letters: '\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E' },
    { base: 'H', letters: '\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D' },
    { base: 'I', letters: '\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197' },
    { base: 'J', letters: '\u004A\u24BF\uFF2A\u0134\u0248' },
    { base: 'K', letters: '\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2' },
    { base: 'L', letters: '\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780' },
    { base: 'LJ', letters: '\u01C7' },
    { base: 'Lj', letters: '\u01C8' },
    { base: 'M', letters: '\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C' },
    { base: 'N', letters: '\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4' },
    { base: 'NJ', letters: '\u01CA' },
    { base: 'Nj', letters: '\u01CB' },
    { base: 'O', letters: '\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C' },
    { base: 'OI', letters: '\u01A2' },
    { base: 'OO', letters: '\uA74E' },
    { base: 'OU', letters: '\u0222' },
    { base: 'OE', letters: '\u008C\u0152' },
    { base: 'oe', letters: '\u009C\u0153' },
    { base: 'P', letters: '\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754' },
    { base: 'Q', letters: '\u0051\u24C6\uFF31\uA756\uA758\u024A' },
    { base: 'R', letters: '\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782' },
    { base: 'S', letters: '\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784' },
    { base: 'T', letters: '\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786' },
    { base: 'TZ', letters: '\uA728' },
    { base: 'U', letters: '\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244' },
    { base: 'V', letters: '\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245' },
    { base: 'VY', letters: '\uA760' },
    { base: 'W', letters: '\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72' },
    { base: 'X', letters: '\u0058\u24CD\uFF38\u1E8A\u1E8C' },
    { base: 'Y', letters: '\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE' },
    { base: 'Z', letters: '\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762' },
    { base: 'a', letters: '\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250' },
    { base: 'aa', letters: '\uA733' },
    { base: 'ae', letters: '\u00E6\u01FD\u01E3' },
    { base: 'ao', letters: '\uA735' },
    { base: 'au', letters: '\uA737' },
    { base: 'av', letters: '\uA739\uA73B' },
    { base: 'ay', letters: '\uA73D' },
    { base: 'b', letters: '\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253' },
    { base: 'c', letters: '\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184' },
    { base: 'd', letters: '\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A' },
    { base: 'dz', letters: '\u01F3\u01C6' },
    { base: 'e', letters: '\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD' },
    { base: 'f', letters: '\u0066\u24D5\uFF46\u1E1F\u0192\uA77C' },
    { base: 'g', letters: '\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F' },
    { base: 'h', letters: '\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265' },
    { base: 'hv', letters: '\u0195' },
    { base: 'i', letters: '\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131' },
    { base: 'j', letters: '\u006A\u24D9\uFF4A\u0135\u01F0\u0249' },
    { base: 'k', letters: '\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3' },
    { base: 'l', letters: '\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747' },
    { base: 'lj', letters: '\u01C9' },
    { base: 'm', letters: '\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F' },
    { base: 'n', letters: '\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5' },
    { base: 'nj', letters: '\u01CC' },
    { base: 'o', letters: '\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275' },
    { base: 'oi', letters: '\u01A3' },
    { base: 'ou', letters: '\u0223' },
    { base: 'oo', letters: '\uA74F' },
    { base: 'p', letters: '\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755' },
    { base: 'q', letters: '\u0071\u24E0\uFF51\u024B\uA757\uA759' },
    { base: 'r', letters: '\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783' },
    { base: 's', letters: '\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B' },
    { base: 't', letters: '\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787' },
    { base: 'tz', letters: '\uA729' },
    { base: 'u', letters: '\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289' },
    { base: 'v', letters: '\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C' },
    { base: 'vy', letters: '\uA761' },
    { base: 'w', letters: '\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73' },
    { base: 'x', letters: '\u0078\u24E7\uFF58\u1E8B\u1E8D' },
    { base: 'y', letters: '\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF' },
    { base: 'z', letters: '\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763' } ];

  var diacriticsMap = {};
  for (var i = 0; i < defaultDiacriticsRemovalap.length; i += 1) {
    var letters = defaultDiacriticsRemovalap[i].letters;
    for (var j = 0; j < letters.length; j += 1) {
      diacriticsMap[letters[j]] = defaultDiacriticsRemovalap[i].base;
    }
  }

  var createPromise = function createPromise(handler) {
    var resolved = false;
    var rejected = false;
    var resolveArgs;
    var rejectArgs;
    var promiseHandlers = {
      then: undefined,
      catch: undefined,
    };
    var promise = {
      then: function then(thenHandler) {
        if (resolved) {
          thenHandler.apply(void 0, resolveArgs);
        } else {
          promiseHandlers.then = thenHandler;
        }
        return promise;
      },
      catch: function catch$1(catchHandler) {
        if (rejected) {
          catchHandler.apply(void 0, rejectArgs);
        } else {
          promiseHandlers.catch = catchHandler;
        }
        return promise;
      },
    };

    function resolve() {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      resolved = true;
      if (promiseHandlers.then) { promiseHandlers.then.apply(promiseHandlers, args); }
      else { resolveArgs = args; }
    }
    function reject() {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      rejected = true;
      if (promiseHandlers.catch) { promiseHandlers.catch.apply(promiseHandlers, args); }
      else { rejectArgs = args; }
    }
    handler(resolve, reject);

    return promise;
  };

  var Utils = {
    mdPreloaderContent: "\n    <span class=\"preloader-inner\">\n      <span class=\"preloader-inner-gap\"></span>\n      <span class=\"preloader-inner-left\">\n          <span class=\"preloader-inner-half-circle\"></span>\n      </span>\n      <span class=\"preloader-inner-right\">\n          <span class=\"preloader-inner-half-circle\"></span>\n      </span>\n    </span>\n  ".trim(),
    eventNameToColonCase: function eventNameToColonCase(eventName) {
      var hasColon;
      return eventName.split('').map(function (char, index) {
        if (char.match(/[A-Z]/) && index !== 0 && !hasColon) {
          hasColon = true;
          return (":" + (char.toLowerCase()));
        }
        return char.toLowerCase();
      }).join('');
    },
    deleteProps: function deleteProps(obj) {
      var object = obj;
      Object.keys(object).forEach(function (key) {
        try {
          object[key] = null;
        } catch (e) {
          // no setter for object
        }
        try {
          delete object[key];
        } catch (e) {
          // something got wrong
        }
      });
    },
    bezier: function bezier$1() {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      return bezier.apply(void 0, args);
    },
    nextTick: function nextTick(callback, delay) {
      if ( delay === void 0 ) delay = 0;

      return setTimeout(callback, delay);
    },
    nextFrame: function nextFrame(callback) {
      return Utils.requestAnimationFrame(callback);
    },
    now: function now() {
      return Date.now();
    },
    promise: function promise(handler) {
      return win.Promise ? new Promise(handler) : createPromise(handler);
    },
    requestAnimationFrame: function requestAnimationFrame(callback) {
      if (win.requestAnimationFrame) { return win.requestAnimationFrame(callback); }
      if (win.webkitRequestAnimationFrame) { return win.webkitRequestAnimationFrame(callback); }
      return win.setTimeout(callback, 1000 / 60);
    },
    cancelAnimationFrame: function cancelAnimationFrame(id) {
      if (win.cancelAnimationFrame) { return win.cancelAnimationFrame(id); }
      if (win.webkitCancelAnimationFrame) { return win.webkitCancelAnimationFrame(id); }
      return win.clearTimeout(id);
    },
    removeDiacritics: function removeDiacritics(str) {
      return str.replace(/[^\u0000-\u007E]/g, function (a) { return diacriticsMap[a] || a; });
    },
    parseUrlQuery: function parseUrlQuery(url) {
      var query = {};
      var urlToParse = url || win.location.href;
      var i;
      var params;
      var param;
      var length;
      if (typeof urlToParse === 'string' && urlToParse.length) {
        urlToParse = urlToParse.indexOf('?') > -1 ? urlToParse.replace(/\S*\?/, '') : '';
        params = urlToParse.split('&').filter(function (paramsPart) { return paramsPart !== ''; });
        length = params.length;

        for (i = 0; i < length; i += 1) {
          param = params[i].replace(/#\S+/g, '').split('=');
          query[decodeURIComponent(param[0])] = typeof param[1] === 'undefined' ? undefined : decodeURIComponent(param[1]) || '';
        }
      }
      return query;
    },
    getTranslate: function getTranslate(el, axis) {
      if ( axis === void 0 ) axis = 'x';

      var matrix;
      var curTransform;
      var transformMatrix;

      var curStyle = win.getComputedStyle(el, null);

      if (win.WebKitCSSMatrix) {
        curTransform = curStyle.transform || curStyle.webkitTransform;
        if (curTransform.split(',').length > 6) {
          curTransform = curTransform.split(', ').map(function (a) { return a.replace(',', '.'); }).join(', ');
        }
        // Some old versions of Webkit choke when 'none' is passed; pass
        // empty string instead in this case
        transformMatrix = new win.WebKitCSSMatrix(curTransform === 'none' ? '' : curTransform);
      } else {
        transformMatrix = curStyle.MozTransform || curStyle.OTransform || curStyle.MsTransform || curStyle.msTransform || curStyle.transform || curStyle.getPropertyValue('transform').replace('translate(', 'matrix(1, 0, 0, 1,');
        matrix = transformMatrix.toString().split(',');
      }

      if (axis === 'x') {
        // Latest Chrome and webkits Fix
        if (win.WebKitCSSMatrix) { curTransform = transformMatrix.m41; }
        // Crazy IE10 Matrix
        else if (matrix.length === 16) { curTransform = parseFloat(matrix[12]); }
        // Normal Browsers
        else { curTransform = parseFloat(matrix[4]); }
      }
      if (axis === 'y') {
        // Latest Chrome and webkits Fix
        if (win.WebKitCSSMatrix) { curTransform = transformMatrix.m42; }
        // Crazy IE10 Matrix
        else if (matrix.length === 16) { curTransform = parseFloat(matrix[13]); }
        // Normal Browsers
        else { curTransform = parseFloat(matrix[5]); }
      }
      return curTransform || 0;
    },
    serializeObject: function serializeObject(obj, parents) {
      if ( parents === void 0 ) parents = [];

      if (typeof obj === 'string') { return obj; }
      var resultArray = [];
      var separator = '&';
      var newParents;
      function varName(name) {
        if (parents.length > 0) {
          var parentParts = '';
          for (var j = 0; j < parents.length; j += 1) {
            if (j === 0) { parentParts += parents[j]; }
            else { parentParts += "[" + (encodeURIComponent(parents[j])) + "]"; }
          }
          return (parentParts + "[" + (encodeURIComponent(name)) + "]");
        }
        return encodeURIComponent(name);
      }
      function varValue(value) {
        return encodeURIComponent(value);
      }
      Object.keys(obj).forEach(function (prop) {
        var toPush;
        if (Array.isArray(obj[prop])) {
          toPush = [];
          for (var i = 0; i < obj[prop].length; i += 1) {
            if (!Array.isArray(obj[prop][i]) && typeof obj[prop][i] === 'object') {
              newParents = parents.slice();
              newParents.push(prop);
              newParents.push(String(i));
              toPush.push(Utils.serializeObject(obj[prop][i], newParents));
            } else {
              toPush.push(((varName(prop)) + "[]=" + (varValue(obj[prop][i]))));
            }
          }
          if (toPush.length > 0) { resultArray.push(toPush.join(separator)); }
        } else if (obj[prop] === null || obj[prop] === '') {
          resultArray.push(((varName(prop)) + "="));
        } else if (typeof obj[prop] === 'object') {
          // Object, convert to named array
          newParents = parents.slice();
          newParents.push(prop);
          toPush = Utils.serializeObject(obj[prop], newParents);
          if (toPush !== '') { resultArray.push(toPush); }
        } else if (typeof obj[prop] !== 'undefined' && obj[prop] !== '') {
          // Should be string or plain value
          resultArray.push(((varName(prop)) + "=" + (varValue(obj[prop]))));
        } else if (obj[prop] === '') { resultArray.push(varName(prop)); }
      });
      return resultArray.join(separator);
    },
    isObject: function isObject(o) {
      return typeof o === 'object' && o !== null && o.constructor && o.constructor === Object;
    },
    merge: function merge() {
      var args = [], len$1 = arguments.length;
      while ( len$1-- ) args[ len$1 ] = arguments[ len$1 ];

      var to = args[0];
      args.splice(0, 1);
      var from = args;

      for (var i = 0; i < from.length; i += 1) {
        var nextSource = args[i];
        if (nextSource !== undefined && nextSource !== null) {
          var keysArray = Object.keys(Object(nextSource));
          for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex += 1) {
            var nextKey = keysArray[nextIndex];
            var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
            if (desc !== undefined && desc.enumerable) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    extend: function extend() {
      var args = [], len$1 = arguments.length;
      while ( len$1-- ) args[ len$1 ] = arguments[ len$1 ];

      var deep = true;
      var to;
      var from;
      if (typeof args[0] === 'boolean') {
        deep = args[0];
        to = args[1];
        args.splice(0, 2);
        from = args;
      } else {
        to = args[0];
        args.splice(0, 1);
        from = args;
      }
      for (var i = 0; i < from.length; i += 1) {
        var nextSource = args[i];
        if (nextSource !== undefined && nextSource !== null) {
          var keysArray = Object.keys(Object(nextSource));
          for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex += 1) {
            var nextKey = keysArray[nextIndex];
            var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
            if (desc !== undefined && desc.enumerable) {
              if (!deep) {
                to[nextKey] = nextSource[nextKey];
              } else if (Utils.isObject(to[nextKey]) && Utils.isObject(nextSource[nextKey])) {
                Utils.extend(to[nextKey], nextSource[nextKey]);
              } else if (!Utils.isObject(to[nextKey]) && Utils.isObject(nextSource[nextKey])) {
                to[nextKey] = {};
                Utils.extend(to[nextKey], nextSource[nextKey]);
              } else {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }
      }
      return to;
    },
  };

  var Device = (function Device() {
    var platform = win.navigator.platform;
    var ua = win.navigator.userAgent;

    var device = {
      ios: false,
      android: false,
      androidChrome: false,
      desktop: false,
      windowsPhone: false,
      iphone: false,
      iphoneX: false,
      ipod: false,
      ipad: false,
      edge: false,
      ie: false,
      macos: false,
      windows: false,
      cordova: !!(win.cordova || win.phonegap),
      phonegap: !!(win.cordova || win.phonegap),
    };

    var windowsPhone = ua.match(/(Windows Phone);?[\s\/]+([\d.]+)?/); // eslint-disable-line
    var android = ua.match(/(Android);?[\s\/]+([\d.]+)?/); // eslint-disable-line
    var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
    var ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
    var iphone = !ipad && ua.match(/(iPhone\sOS|iOS)\s([\d_]+)/);
    var iphoneX = iphone && win.screen.width === 375 && win.screen.height === 812;
    var ie = ua.indexOf('MSIE ') >= 0 || ua.indexOf('Trident/') >= 0;
    var edge = ua.indexOf('Edge/') >= 0;
    var macos = platform === 'MacIntel';
    var windows = platform === 'Win32';

    device.ie = ie;
    device.edge = edge;

    // Windows
    if (windowsPhone) {
      device.os = 'windows';
      device.osVersion = windows[2];
      device.windowsPhone = true;
    }
    // Android
    if (android && !windows) {
      device.os = 'android';
      device.osVersion = android[2];
      device.android = true;
      device.androidChrome = ua.toLowerCase().indexOf('chrome') >= 0;
    }
    if (ipad || iphone || ipod) {
      device.os = 'ios';
      device.ios = true;
    }
    // iOS
    if (iphone && !ipod) {
      device.osVersion = iphone[2].replace(/_/g, '.');
      device.iphone = true;
      device.iphoneX = iphoneX;
    }
    if (ipad) {
      device.osVersion = ipad[2].replace(/_/g, '.');
      device.ipad = true;
    }
    if (ipod) {
      device.osVersion = ipod[3] ? ipod[3].replace(/_/g, '.') : null;
      device.iphone = true;
    }
    // iOS 8+ changed UA
    if (device.ios && device.osVersion && ua.indexOf('Version/') >= 0) {
      if (device.osVersion.split('.')[0] === '10') {
        device.osVersion = ua.toLowerCase().split('version/')[1].split(' ')[0];
      }
    }

    // Webview
    device.webView = (iphone || ipad || ipod) && (ua.match(/.*AppleWebKit(?!.*Safari)/i) || win.navigator.standalone);
    device.webview = device.webView;


    // Desktop
    device.desktop = !(device.os || device.android || device.webView);
    if (device.desktop) {
      device.macos = macos;
      device.windows = windows;
    }

    // Minimal UI
    if (device.os && device.os === 'ios') {
      var osVersionArr = device.osVersion.split('.');
      var metaViewport = doc.querySelector('meta[name="viewport"]');
      device.minimalUi = !device.webView
        && (ipod || iphone)
        && (osVersionArr[0] * 1 === 7 ? osVersionArr[1] * 1 >= 1 : osVersionArr[0] * 1 > 7)
        && metaViewport && metaViewport.getAttribute('content').indexOf('minimal-ui') >= 0;
    }

    // Check for status bar and fullscreen app mode
    device.needsStatusbarOverlay = function needsStatusbarOverlay() {
      if ((device.webView || (device.android && device.cordova)) && (win.innerWidth * win.innerHeight === win.screen.width * win.screen.height)) {
        if (device.iphoneX && (win.orientation === 90 || win.orientation === -90)) {
          return false;
        }
        return true;
      }
      return false;
    };
    device.statusbar = device.needsStatusbarOverlay();

    // Pixel Ratio
    device.pixelRatio = win.devicePixelRatio || 1;

    // Export object
    return device;
  }());

  var Framework7Class = function Framework7Class(params, parents) {
    if ( params === void 0 ) params = {};
    if ( parents === void 0 ) parents = [];

    var self = this;
    self.params = params;

    // Events
    self.eventsParents = parents;
    self.eventsListeners = {};

    if (self.params && self.params.on) {
      Object.keys(self.params.on).forEach(function (eventName) {
        self.on(eventName, self.params.on[eventName]);
      });
    }
  };

  var staticAccessors$1 = { components: { configurable: true } };

  Framework7Class.prototype.on = function on (events, handler, priority) {
    var self = this;
    if (typeof handler !== 'function') { return self; }
    var method = priority ? 'unshift' : 'push';
    events.split(' ').forEach(function (event) {
      if (!self.eventsListeners[event]) { self.eventsListeners[event] = []; }
      self.eventsListeners[event][method](handler);
    });
    return self;
  };

  Framework7Class.prototype.once = function once (events, handler, priority) {
    var self = this;
    if (typeof handler !== 'function') { return self; }
    function onceHandler() {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

      handler.apply(self, args);
      self.off(events, onceHandler);
    }
    return self.on(events, onceHandler, priority);
  };

  Framework7Class.prototype.off = function off (events, handler) {
    var self = this;
    if (!self.eventsListeners) { return self; }
    events.split(' ').forEach(function (event) {
      if (typeof handler === 'undefined') {
        self.eventsListeners[event] = [];
      } else {
        self.eventsListeners[event].forEach(function (eventHandler, index) {
          if (eventHandler === handler) {
            self.eventsListeners[event].splice(index, 1);
          }
        });
      }
    });
    return self;
  };

  Framework7Class.prototype.emit = function emit () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

    var self = this;
    if (!self.eventsListeners) { return self; }
    var events;
    var data;
    var context;
    var eventsParents;
    if (typeof args[0] === 'string' || Array.isArray(args[0])) {
      events = args[0];
      data = args.slice(1, args.length);
      context = self;
      eventsParents = self.eventsParents;
    } else {
      events = args[0].events;
      data = args[0].data;
      context = args[0].context || self;
      eventsParents = args[0].local ? [] : args[0].parents || self.eventsParents;
    }
    var eventsArray = Array.isArray(events) ? events : events.split(' ');
    var localEvents = eventsArray.map(function (eventName) { return eventName.replace('local::', ''); });
    var parentEvents = eventsArray.filter(function (eventName) { return eventName.indexOf('local::') < 0; });

    localEvents.forEach(function (event) {
      if (self.eventsListeners && self.eventsListeners[event]) {
        var handlers = [];
        self.eventsListeners[event].forEach(function (eventHandler) {
          handlers.push(eventHandler);
        });
        handlers.forEach(function (eventHandler) {
          eventHandler.apply(context, data);
        });
      }
    });
    if (eventsParents && eventsParents.length > 0) {
      eventsParents.forEach(function (eventsParent) {
        eventsParent.emit.apply(eventsParent, [ parentEvents ].concat( data ));
      });
    }
    return self;
  };

  Framework7Class.prototype.useModulesParams = function useModulesParams (instanceParams) {
    var instance = this;
    if (!instance.modules) { return; }
    Object.keys(instance.modules).forEach(function (moduleName) {
      var module = instance.modules[moduleName];
      // Extend params
      if (module.params) {
        Utils.extend(instanceParams, module.params);
      }
    });
  };

  Framework7Class.prototype.useModules = function useModules (modulesParams) {
      if ( modulesParams === void 0 ) modulesParams = {};

    var instance = this;
    if (!instance.modules) { return; }
    Object.keys(instance.modules).forEach(function (moduleName) {
      var module = instance.modules[moduleName];
      var moduleParams = modulesParams[moduleName] || {};
      // Extend instance methods and props
      if (module.instance) {
        Object.keys(module.instance).forEach(function (modulePropName) {
          var moduleProp = module.instance[modulePropName];
          if (typeof moduleProp === 'function') {
            instance[modulePropName] = moduleProp.bind(instance);
          } else {
            instance[modulePropName] = moduleProp;
          }
        });
      }
      // Add event listeners
      if (module.on && instance.on) {
        Object.keys(module.on).forEach(function (moduleEventName) {
          instance.on(moduleEventName, module.on[moduleEventName]);
        });
      }

      // Module create callback
      if (module.create) {
        module.create.bind(instance)(moduleParams);
      }
    });
  };

  staticAccessors$1.components.set = function (components) {
    var Class = this;
    if (!Class.use) { return; }
    Class.use(components);
  };

  Framework7Class.installModule = function installModule (module) {
      var params = [], len = arguments.length - 1;
      while ( len-- > 0 ) params[ len ] = arguments[ len + 1 ];

    var Class = this;
    if (!Class.prototype.modules) { Class.prototype.modules = {}; }
    var name = module.name || (((Object.keys(Class.prototype.modules).length) + "_" + (Utils.now())));
    Class.prototype.modules[name] = module;
    // Prototype
    if (module.proto) {
      Object.keys(module.proto).forEach(function (key) {
        Class.prototype[key] = module.proto[key];
      });
    }
    // Class
    if (module.static) {
      Object.keys(module.static).forEach(function (key) {
        Class[key] = module.static[key];
      });
    }
    // Callback
    if (module.install) {
      module.install.apply(Class, params);
    }
    return Class;
  };

  Framework7Class.use = function use (module) {
      var params = [], len = arguments.length - 1;
      while ( len-- > 0 ) params[ len ] = arguments[ len + 1 ];

    var Class = this;
    if (Array.isArray(module)) {
      module.forEach(function (m) { return Class.installModule(m); });
      return Class;
    }
    return Class.installModule.apply(Class, [ module ].concat( params ));
  };

  Object.defineProperties( Framework7Class, staticAccessors$1 );

  var Framework7 = (function (Framework7Class$$1) {
    function Framework7(params) {
      Framework7Class$$1.call(this, params);

      var passedParams = Utils.extend({}, params);

      // App Instance
      var app = this;

      // Default
      var defaults = {
        version: '1.0.0',
        id: 'io.framework7.testapp',
        root: 'body',
        theme: 'auto',
        language: win.navigator.language,
        routes: [],
        name: 'Framework7',
        initOnDeviceReady: true,
        init: true,
      };

      // Extend defaults with modules params
      app.useModulesParams(defaults);

      // Extend defaults with passed params
      app.params = Utils.extend(defaults, params);

      var $rootEl = $$1(app.params.root);

      Utils.extend(app, {
        // App Id
        id: app.params.id,
        // App Name
        name: app.params.name,
        // App version
        version: app.params.version,
        // Routes
        routes: app.params.routes,
        // Lang
        language: app.params.language,
        // Root
        root: $rootEl,
        // RTL
        rtl: $rootEl.css('direction') === 'rtl',
        // Theme
        theme: (function getTheme() {
          if (app.params.theme === 'auto') {
            return Device.ios ? 'ios' : 'md';
          }
          return app.params.theme;
        }()),
        // Initially passed parameters
        passedParams: passedParams,
      });

      // Save Root
      if (app.root && app.root[0]) {
        app.root[0].f7 = app;
      }

      // Install Modules
      app.useModules();

      // Init
      if (app.params.init) {
        if (Device.cordova && app.params.initOnDeviceReady) {
          $$1(doc).on('deviceready', function () {
            app.init();
          });
        } else {
          app.init();
        }
      }
      // Return app instance
      return app;
    }

    if ( Framework7Class$$1 ) Framework7.__proto__ = Framework7Class$$1;
    Framework7.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    Framework7.prototype.constructor = Framework7;

    var prototypeAccessors = { $: { configurable: true },t7: { configurable: true } };
    var staticAccessors = { Dom7: { configurable: true },$: { configurable: true },Template7: { configurable: true },Class: { configurable: true } };

    Framework7.prototype.init = function init () {
      var app = this;
      if (app.initialized) { return app; }

      app.root.addClass('framework7-initializing');

      // RTL attr
      if (app.rtl) {
        $$1('html').attr('dir', 'rtl');
      }

      // Root class
      app.root.addClass('framework7-root');

      // Theme class
      $$1('html').removeClass('ios md').addClass(app.theme);

      // Data
      app.data = {};
      if (app.params.data && typeof app.params.data === 'function') {
        Utils.extend(app.data, app.params.data.bind(app)());
      } else if (app.params.data) {
        Utils.extend(app.data, app.params.data);
      }
      // Methods
      app.methods = {};
      if (app.params.methods) {
        Object.keys(app.params.methods).forEach(function (methodName) {
          if (typeof app.params.methods[methodName] === 'function') {
            app.methods[methodName] = app.params.methods[methodName].bind(app);
          } else {
            app.methods[methodName] = app.params.methods[methodName];
          }
        });
      }
      // Init class
      Utils.nextFrame(function () {
        app.root.removeClass('framework7-initializing');
      });
      // Emit, init other modules
      app.initialized = true;
      app.emit('init');

      return app;
    };
    // eslint-disable-next-line
    prototypeAccessors.$.get = function () {
      return $$1;
    };
    // eslint-disable-next-line
    prototypeAccessors.t7.get = function () {
      return Template7;
    };

    staticAccessors.Dom7.get = function () {
      return $$1;
    };

    staticAccessors.$.get = function () {
      return $$1;
    };

    staticAccessors.Template7.get = function () {
      return Template7;
    };

    staticAccessors.Class.get = function () {
      return Framework7Class$$1;
    };

    Object.defineProperties( Framework7.prototype, prototypeAccessors );
    Object.defineProperties( Framework7, staticAccessors );

    return Framework7;
  }(Framework7Class));

  var DeviceModule = {
    name: 'device',
    proto: {
      device: Device,
    },
    static: {
      device: Device,
    },
    on: {
      init: function init() {
        var classNames = [];
        var html = doc.querySelector('html');
        if (!html) { return; }
        // Pixel Ratio
        classNames.push(("device-pixel-ratio-" + (Math.floor(Device.pixelRatio))));
        if (Device.pixelRatio >= 2) {
          classNames.push('device-retina');
        }
        // OS classes
        if (Device.os) {
          classNames.push(
            ("device-" + (Device.os)),
            ("device-" + (Device.os) + "-" + (Device.osVersion.split('.')[0])),
            ("device-" + (Device.os) + "-" + (Device.osVersion.replace(/\./g, '-')))
          );
          if (Device.os === 'ios') {
            var major = parseInt(Device.osVersion.split('.')[0], 10);
            for (var i = major - 1; i >= 6; i -= 1) {
              classNames.push(("device-ios-gt-" + i));
            }
            if (Device.iphoneX) {
              classNames.push('device-iphone-x');
            }
          }
        } else if (Device.desktop) {
          classNames.push('device-desktop');
        }
        if (Device.cordova || Device.phonegap) {
          classNames.push('device-cordova');
        }

        // Add html classes
        classNames.forEach(function (className) {
          html.classList.add(className);
        });
      },
    },
  };

  var Support = (function Support() {
    var positionSticky = (function supportPositionSticky() {
      var support = false;
      var div = doc.createElement('div');
      ('sticky -webkit-sticky -moz-sticky').split(' ').forEach(function (prop) {
        if (support) { return; }
        div.style.position = prop;
        if (div.style.position === prop) {
          support = true;
        }
      });
      return support;
    }());

    var testDiv = doc.createElement('div');

    return {
      positionSticky: positionSticky,
      touch: (function checkTouch() {
        return !!(('ontouchstart' in win) || (win.DocumentTouch && doc instanceof win.DocumentTouch));
      }()),

      pointerEvents: !!(win.navigator.pointerEnabled || win.PointerEvent),
      prefixedPointerEvents: !!win.navigator.msPointerEnabled,

      transition: (function checkTransition() {
        var style = testDiv.style;
        return ('transition' in style || 'webkitTransition' in style || 'MozTransition' in style);
      }()),
      transforms3d: (win.Modernizr && win.Modernizr.csstransforms3d === true) || (function checkTransforms3d() {
        var style = testDiv.style;
        return ('webkitPerspective' in style || 'MozPerspective' in style || 'OPerspective' in style || 'MsPerspective' in style || 'perspective' in style);
      }()),

      flexbox: (function checkFlexbox() {
        var div = doc.createElement('div').style;
        var styles = ('alignItems webkitAlignItems webkitBoxAlign msFlexAlign mozBoxAlign webkitFlexDirection msFlexDirection mozBoxDirection mozBoxOrient webkitBoxDirection webkitBoxOrient').split(' ');
        for (var i = 0; i < styles.length; i += 1) {
          if (styles[i] in div) { return true; }
        }
        return false;
      }()),

      observer: (function checkObserver() {
        return ('MutationObserver' in win || 'WebkitMutationObserver' in win);
      }()),

      passiveListener: (function checkPassiveListener() {
        var supportsPassive = false;
        try {
          var opts = Object.defineProperty({}, 'passive', {
            // eslint-disable-next-line
            get: function get() {
              supportsPassive = true;
            },
          });
          win.addEventListener('testPassiveListener', null, opts);
        } catch (e) {
          // No support
        }
        return supportsPassive;
      }()),

      gestures: (function checkGestures() {
        return 'ongesturestart' in win;
      }()),
    };
  }());

  var SupportModule = {
    name: 'support',
    proto: {
      support: Support,
    },
    static: {
      support: Support,
    },
    on: {
      init: function init() {
        var html = doc.querySelector('html');
        if (!html) { return; }
        var classNames = [];
        if (Support.positionSticky) {
          classNames.push('support-position-sticky');
        }
        // Add html classes
        classNames.forEach(function (className) {
          html.classList.add(className);
        });
      },
    },
  };

  var UtilsModule = {
    name: 'utils',
    proto: {
      utils: Utils,
    },
    static: {
      utils: Utils,
    },
  };

  var ResizeModule = {
    name: 'resize',
    instance: {
      getSize: function getSize() {
        var app = this;
        if (!app.root[0]) { return { width: 0, height: 0, left: 0, top: 0 }; }
        var offset = app.root.offset();
        var ref = [app.root[0].offsetWidth, app.root[0].offsetHeight, offset.left, offset.top];
        var width = ref[0];
        var height = ref[1];
        var left = ref[2];
        var top = ref[3];
        app.width = width;
        app.height = height;
        app.left = left;
        app.top = top;
        return { width: width, height: height, left: left, top: top };
      },
    },
    on: {
      init: function init() {
        var app = this;

        // Get Size
        app.getSize();

        // Emit resize
        win.addEventListener('resize', function () {
          app.emit('resize');
        }, false);

        // Emit orientationchange
        win.addEventListener('orientationchange', function () {
          app.emit('orientationchange');
        });
      },
      orientationchange: function orientationchange() {
        var app = this;
        if (app.device && app.device.minimalUi) {
          if (win.orientation === 90 || win.orientation === -90) {
            doc.body.scrollTop = 0;
          }
        }
        // Fix iPad weird body scroll
        if (app.device.ipad) {
          doc.body.scrollLeft = 0;
          setTimeout(function () {
            doc.body.scrollLeft = 0;
          }, 0);
        }
      },
      resize: function resize() {
        var app = this;
        app.getSize();
      },
    },
  };

  var globals = {};
  var jsonpRequests = 0;

  function Request(requestOptions) {
    var globalsNoCallbacks = Utils.extend({}, globals);
    ('beforeCreate beforeOpen beforeSend error complete success statusCode').split(' ').forEach(function (callbackName) {
      delete globalsNoCallbacks[callbackName];
    });
    var defaults = Utils.extend({
      url: win.location.toString(),
      method: 'GET',
      data: false,
      async: true,
      cache: true,
      user: '',
      password: '',
      headers: {},
      xhrFields: {},
      statusCode: {},
      processData: true,
      dataType: 'text',
      contentType: 'application/x-www-form-urlencoded',
      timeout: 0,
    }, globalsNoCallbacks);

    var options = Utils.extend({}, defaults, requestOptions);
    var proceedRequest;

    // Function to run XHR callbacks and events
    function fireCallback(callbackName) {
      var data = [], len = arguments.length - 1;
      while ( len-- > 0 ) data[ len ] = arguments[ len + 1 ];

      /*
        Callbacks:
        beforeCreate (options),
        beforeOpen (xhr, options),
        beforeSend (xhr, options),
        error (xhr, status),
        complete (xhr, stautus),
        success (response, status, xhr),
        statusCode ()
      */
      var globalCallbackValue;
      var optionCallbackValue;
      if (globals[callbackName]) {
        globalCallbackValue = globals[callbackName].apply(globals, data);
      }
      if (options[callbackName]) {
        optionCallbackValue = options[callbackName].apply(options, data);
      }
      if (typeof globalCallbackValue !== 'boolean') { globalCallbackValue = true; }
      if (typeof optionCallbackValue !== 'boolean') { optionCallbackValue = true; }
      return (globalCallbackValue && optionCallbackValue);
    }

    // Before create callback
    proceedRequest = fireCallback('beforeCreate', options);
    if (proceedRequest === false) { return undefined; }

    // For jQuery guys
    if (options.type) { options.method = options.type; }

    // Parameters Prefix
    var paramsPrefix = options.url.indexOf('?') >= 0 ? '&' : '?';

    // UC method
    var method = options.method.toUpperCase();

    // Data to modify GET URL
    if ((method === 'GET' || method === 'HEAD' || method === 'OPTIONS' || method === 'DELETE') && options.data) {
      var stringData;
      if (typeof options.data === 'string') {
        // Should be key=value string
        if (options.data.indexOf('?') >= 0) { stringData = options.data.split('?')[1]; }
        else { stringData = options.data; }
      } else {
        // Should be key=value object
        stringData = Utils.serializeObject(options.data);
      }
      if (stringData.length) {
        options.url += paramsPrefix + stringData;
        if (paramsPrefix === '?') { paramsPrefix = '&'; }
      }
    }

    // JSONP
    if (options.dataType === 'json' && options.url.indexOf('callback=') >= 0) {
      var callbackName = "f7jsonp_" + (Date.now() + ((jsonpRequests += 1)));
      var abortTimeout;
      var callbackSplit = options.url.split('callback=');
      var requestUrl = (callbackSplit[0]) + "callback=" + callbackName;
      if (callbackSplit[1].indexOf('&') >= 0) {
        var addVars = callbackSplit[1].split('&').filter(function (el) { return el.indexOf('=') > 0; }).join('&');
        if (addVars.length > 0) { requestUrl += "&" + addVars; }
      }

      // Create script
      var script = doc.createElement('script');
      script.type = 'text/javascript';
      script.onerror = function onerror() {
        clearTimeout(abortTimeout);
        fireCallback('error', null, 'scripterror');
        fireCallback('complete', null, 'scripterror');
      };
      script.src = requestUrl;

      // Handler
      win[callbackName] = function jsonpCallback(data) {
        clearTimeout(abortTimeout);
        fireCallback('success', data);
        script.parentNode.removeChild(script);
        script = null;
        delete win[callbackName];
      };
      doc.querySelector('head').appendChild(script);

      if (options.timeout > 0) {
        abortTimeout = setTimeout(function () {
          script.parentNode.removeChild(script);
          script = null;
          fireCallback('error', null, 'timeout');
        }, options.timeout);
      }

      return undefined;
    }

    // Cache for GET/HEAD requests
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS' || method === 'DELETE') {
      if (options.cache === false) {
        options.url += paramsPrefix + "_nocache" + (Date.now());
      }
    }

    // Create XHR
    var xhr = new XMLHttpRequest();

    // Save Request URL
    xhr.requestUrl = options.url;
    xhr.requestParameters = options;

    // Before open callback
    proceedRequest = fireCallback('beforeOpen', xhr, options);
    if (proceedRequest === false) { return xhr; }

    // Open XHR
    xhr.open(method, options.url, options.async, options.user, options.password);

    // Create POST Data
    var postData = null;

    if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && options.data) {
      if (options.processData) {
        var postDataInstances = [ArrayBuffer, Blob, Document, FormData];
        // Post Data
        if (postDataInstances.indexOf(options.data.constructor) >= 0) {
          postData = options.data;
        } else {
          // POST Headers
          var boundary = "---------------------------" + (Date.now().toString(16));

          if (options.contentType === 'multipart/form-data') {
            xhr.setRequestHeader('Content-Type', ("multipart/form-data; boundary=" + boundary));
          } else {
            xhr.setRequestHeader('Content-Type', options.contentType);
          }
          postData = '';
          var data$1 = Utils.serializeObject(options.data);
          if (options.contentType === 'multipart/form-data') {
            data$1 = data$1.split('&');
            var newData = [];
            for (var i = 0; i < data$1.length; i += 1) {
              newData.push(("Content-Disposition: form-data; name=\"" + (data$1[i].split('=')[0]) + "\"\r\n\r\n" + (data$1[i].split('=')[1]) + "\r\n"));
            }
            postData = "--" + boundary + "\r\n" + (newData.join(("--" + boundary + "\r\n"))) + "--" + boundary + "--\r\n";
          } else {
            postData = data$1;
          }
        }
      } else {
        postData = options.data;
        xhr.setRequestHeader('Content-Type', options.contentType);
      }
    }

    // Additional headers
    if (options.headers) {
      Object.keys(options.headers).forEach(function (headerName) {
        xhr.setRequestHeader(headerName, options.headers[headerName]);
      });
    }

    // Check for crossDomain
    if (typeof options.crossDomain === 'undefined') {
      // eslint-disable-next-line
      options.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(options.url) && RegExp.$2 !== win.location.host;
    }

    if (!options.crossDomain) {
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    }

    if (options.xhrFields) {
      Utils.extend(xhr, options.xhrFields);
    }

    var xhrTimeout;

    // Handle XHR
    xhr.onload = function onload() {
      if (xhrTimeout) { clearTimeout(xhrTimeout); }
      if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 0) {
        var responseData;
        if (options.dataType === 'json') {
          var parseError;
          try {
            responseData = JSON.parse(xhr.responseText);
          } catch (err) {
            parseError = true;
          }
          if (!parseError) {
            fireCallback('success', responseData, xhr.status, xhr);
          } else {
            fireCallback('error', xhr, 'parseerror');
          }
        } else {
          responseData = xhr.responseType === 'text' || xhr.responseType === '' ? xhr.responseText : xhr.response;
          fireCallback('success', responseData, xhr.status, xhr);
        }
      } else {
        fireCallback('error', xhr, xhr.status);
      }
      if (options.statusCode) {
        if (globals.statusCode && globals.statusCode[xhr.status]) { globals.statusCode[xhr.status](xhr); }
        if (options.statusCode[xhr.status]) { options.statusCode[xhr.status](xhr); }
      }
      fireCallback('complete', xhr, xhr.status);
    };

    xhr.onerror = function onerror() {
      if (xhrTimeout) { clearTimeout(xhrTimeout); }
      fireCallback('error', xhr, xhr.status);
      fireCallback('complete', xhr, 'error');
    };

    // Timeout
    if (options.timeout > 0) {
      xhr.onabort = function onabort() {
        if (xhrTimeout) { clearTimeout(xhrTimeout); }
      };
      xhrTimeout = setTimeout(function () {
        xhr.abort();
        fireCallback('error', xhr, 'timeout');
        fireCallback('complete', xhr, 'timeout');
      }, options.timeout);
    }

    // Ajax start callback
    proceedRequest = fireCallback('beforeSend', xhr, options);
    if (proceedRequest === false) { return xhr; }

    // Send XHR
    xhr.send(postData);

    // Return XHR object
    return xhr;
  }
  function RequestShortcut(method) {
    var assign, assign$1;

    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];
    var ref = [];
    var url = ref[0];
    var data = ref[1];
    var success = ref[2];
    var error = ref[3];
    var dataType = ref[4];
    if (typeof args[1] === 'function') {
      (assign = args, url = assign[0], success = assign[1], error = assign[2], dataType = assign[3]);
    } else {
      (assign$1 = args, url = assign$1[0], data = assign$1[1], success = assign$1[2], error = assign$1[3], dataType = assign$1[4]);
    }
    [success, error].forEach(function (callback) {
      if (typeof callback === 'string') {
        dataType = callback;
        if (callback === success) { success = undefined; }
        else { error = undefined; }
      }
    });
    dataType = dataType || (method === 'json' || method === 'postJSON' ? 'json' : undefined);
    var requestOptions = {
      url: url,
      method: method === 'post' || method === 'postJSON' ? 'POST' : 'GET',
      data: data,
      success: success,
      error: error,
      dataType: dataType,
    };
    if (method === 'postJSON') {
      Utils.extend(requestOptions, {
        contentType: 'application/json',
        processData: false,
        crossDomain: true,
        data: typeof data === 'string' ? data : JSON.stringify(data),
      });
    }
    return Request(requestOptions);
  }
  Request.get = function get() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return RequestShortcut.apply(void 0, [ 'get' ].concat( args ));
  };
  Request.post = function post() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return RequestShortcut.apply(void 0, [ 'post' ].concat( args ));
  };
  Request.json = function json() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return RequestShortcut.apply(void 0, [ 'json' ].concat( args ));
  };
  Request.getJSON = Request.json;
  Request.postJSON = function postJSON() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return RequestShortcut.apply(void 0, [ 'postJSON' ].concat( args ));
  };
  Request.setup = function setup(options) {
    if (options.type && !options.method) {
      Utils.extend(options, { method: options.type });
    }
    Utils.extend(globals, options);
  };

  /* eslint no-param-reassign: "off" */

  var RequestModule = {
    name: 'request',
    proto: {
      request: Request,
    },
    static: {
      request: Request,
    },
  };

  function initTouch() {
    var app = this;
    var params = app.params.touch;
    var useRipple = app.theme === 'md' && params.materialRipple;

    if (Device.ios && Device.webView) {
      // Strange hack required for iOS 8 webview to work on inputs
      win.addEventListener('touchstart', function () {});
    }

    var touchStartX;
    var touchStartY;
    var touchStartTime;
    var targetElement;
    var trackClick;
    var activeSelection;
    var scrollParent;
    var lastClickTime;
    var isMoved;
    var tapHoldFired;
    var tapHoldTimeout;

    var activableElement;
    var activeTimeout;

    var needsFastClick;
    var needsFastClickTimeOut;

    var rippleWave;
    var rippleTarget;
    var rippleTimeout;

    function findActivableElement(el) {
      var target = $$1(el);
      var parents = target.parents(params.activeStateElements);
      var activable;
      if (target.is(params.activeStateElements)) {
        activable = target;
      }
      if (parents.length > 0) {
        activable = activable ? activable.add(parents) : parents;
      }
      return activable || target;
    }

    function isInsideScrollableView(el) {
      var pageContent = el.parents('.page-content, .panel');

      if (pageContent.length === 0) {
        return false;
      }

      // This event handler covers the "tap to stop scrolling".
      if (pageContent.prop('scrollHandlerSet') !== 'yes') {
        pageContent.on('scroll', function () {
          clearTimeout(activeTimeout);
          clearTimeout(rippleTimeout);
        });
        pageContent.prop('scrollHandlerSet', 'yes');
      }

      return true;
    }
    function addActive() {
      if (!activableElement) { return; }
      activableElement.addClass('active-state');
    }
    function removeActive() {
      if (!activableElement) { return; }
      activableElement.removeClass('active-state');
      activableElement = null;
    }
    function isFormElement(el) {
      var nodes = ('input select textarea label').split(' ');
      if (el.nodeName && nodes.indexOf(el.nodeName.toLowerCase()) >= 0) { return true; }
      return false;
    }
    function androidNeedsBlur(el) {
      var noBlur = ('button input textarea select').split(' ');
      if (doc.activeElement && el !== doc.activeElement && doc.activeElement !== doc.body) {
        if (noBlur.indexOf(el.nodeName.toLowerCase()) >= 0) {
          return false;
        }
        return true;
      }
      return false;
    }
    function targetNeedsFastClick(el) {
      /*
      if (
        Device.ios
        &&
        (
          Device.osVersion.split('.')[0] > 9
          ||
          (Device.osVersion.split('.')[0] * 1 === 9 && Device.osVersion.split('.')[1] >= 1)
        )
      ) {
        return false;
      }
      */
      var $el = $$1(el);
      if (el.nodeName.toLowerCase() === 'input' && (el.type === 'file' || el.type === 'range')) { return false; }
      if (el.nodeName.toLowerCase() === 'select' && Device.android) { return false; }
      if ($el.hasClass('no-fastclick') || $el.parents('.no-fastclick').length > 0) { return false; }
      if (params.fastClicksExclude && $el.is(params.fastClicksExclude)) { return false; }
      return true;
    }
    function targetNeedsFocus(el) {
      if (doc.activeElement === el) {
        return false;
      }
      var tag = el.nodeName.toLowerCase();
      var skipInputs = ('button checkbox file image radio submit').split(' ');
      if (el.disabled || el.readOnly) { return false; }
      if (tag === 'textarea') { return true; }
      if (tag === 'select') {
        if (Device.android) { return false; }
        return true;
      }
      if (tag === 'input' && skipInputs.indexOf(el.type) < 0) { return true; }
      return false;
    }
    function targetNeedsPrevent(el) {
      var $el = $$1(el);
      var prevent = true;
      if ($el.is('label') || $el.parents('label').length > 0) {
        if (Device.android) {
          prevent = false;
        } else if (Device.ios && $el.is('input')) {
          prevent = true;
        } else { prevent = false; }
      }
      return prevent;
    }

    // Ripple handlers
    function findRippleElement(el) {
      var rippleElements = params.materialRippleElements;
      var $el = $$1(el);
      if ($el.is(rippleElements)) {
        if ($el.hasClass('no-ripple')) {
          return false;
        }
        return $el;
      }
      if ($el.parents(rippleElements).length > 0) {
        var rippleParent = $el.parents(rippleElements).eq(0);
        if (rippleParent.hasClass('no-ripple')) {
          return false;
        }
        return rippleParent;
      }
      return false;
    }
    function createRipple($el, x, y) {
      if (!$el) { return; }
      rippleWave = app.touchRipple.create($el, x, y);
    }

    function removeRipple() {
      if (!rippleWave) { return; }
      rippleWave.remove();
      rippleWave = undefined;
      rippleTarget = undefined;
    }
    function rippleTouchStart(el) {
      rippleTarget = findRippleElement(el);
      if (!rippleTarget || rippleTarget.length === 0) {
        rippleTarget = undefined;
        return;
      }
      if (!isInsideScrollableView(rippleTarget)) {
        createRipple(rippleTarget, touchStartX, touchStartY);
      } else {
        rippleTimeout = setTimeout(function () {
          createRipple(rippleTarget, touchStartX, touchStartY);
        }, 80);
      }
    }
    function rippleTouchMove() {
      clearTimeout(rippleTimeout);
      removeRipple();
    }
    function rippleTouchEnd() {
      if (rippleWave) {
        removeRipple();
      } else if (rippleTarget && !isMoved) {
        clearTimeout(rippleTimeout);
        createRipple(rippleTarget, touchStartX, touchStartY);
        setTimeout(removeRipple, 0);
      } else {
        removeRipple();
      }
    }

    // Mouse Handlers
    function handleMouseDown(e) {
      findActivableElement(e.target).addClass('active-state');
      if ('which' in e && e.which === 3) {
        setTimeout(function () {
          $$1('.active-state').removeClass('active-state');
        }, 0);
      }
      if (useRipple) {
        touchStartX = e.pageX;
        touchStartY = e.pageY;
        rippleTouchStart(e.target, e.pageX, e.pageY);
      }
    }
    function handleMouseMove() {
      $$1('.active-state').removeClass('active-state');
      if (useRipple) {
        rippleTouchMove();
      }
    }
    function handleMouseUp() {
      $$1('.active-state').removeClass('active-state');
      if (useRipple) {
        rippleTouchEnd();
      }
    }

    // Send Click
    function sendClick(e) {
      var touch = e.changedTouches[0];
      var evt = doc.createEvent('MouseEvents');
      var eventType = 'click';
      if (Device.android && targetElement.nodeName.toLowerCase() === 'select') {
        eventType = 'mousedown';
      }
      evt.initMouseEvent(eventType, true, true, win, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
      evt.forwardedTouchEvent = true;

      if (app.device.ios && win.navigator.standalone) {
        // Fix the issue happens in iOS home screen apps where the wrong element is selected during a momentum scroll.
        // Upon tapping, we give the scrolling time to stop, then we grab the element based where the user tapped.
        setTimeout(function () {
          targetElement = doc.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
          targetElement.dispatchEvent(evt);
        }, 10);
      } else {
        targetElement.dispatchEvent(evt);
      }
    }

    // Touch Handlers
    function handleTouchStart(e) {
      var this$1 = this;

      isMoved = false;
      tapHoldFired = false;
      if (e.targetTouches.length > 1) {
        if (activableElement) { removeActive(); }
        return true;
      }
      if (e.touches.length > 1 && activableElement) {
        removeActive();
      }
      if (params.tapHold) {
        if (tapHoldTimeout) { clearTimeout(tapHoldTimeout); }
        tapHoldTimeout = setTimeout(function () {
          if (e && e.touches && e.touches.length > 1) { return; }
          tapHoldFired = true;
          e.preventDefault();
          $$1(e.target).trigger('taphold');
        }, params.tapHoldDelay);
      }
      if (needsFastClickTimeOut) { clearTimeout(needsFastClickTimeOut); }
      needsFastClick = targetNeedsFastClick(e.target);

      if (!needsFastClick) {
        trackClick = false;
        return true;
      }
      if (Device.ios || (Device.android && 'getSelection' in win)) {
        var selection = win.getSelection();
        if (
          selection.rangeCount
          && selection.focusNode !== doc.body
          && (!selection.isCollapsed || doc.activeElement === selection.focusNode)
        ) {
          activeSelection = true;
          return true;
        }

        activeSelection = false;
      }
      if (Device.android) {
        if (androidNeedsBlur(e.target)) {
          doc.activeElement.blur();
        }
      }

      trackClick = true;
      targetElement = e.target;
      touchStartTime = (new Date()).getTime();
      touchStartX = e.targetTouches[0].pageX;
      touchStartY = e.targetTouches[0].pageY;

      // Detect scroll parent
      if (Device.ios) {
        scrollParent = undefined;
        $$1(targetElement).parents().each(function () {
          var parent = this$1;
          if (parent.scrollHeight > parent.offsetHeight && !scrollParent) {
            scrollParent = parent;
            scrollParent.f7ScrollTop = scrollParent.scrollTop;
          }
        });
      }
      if ((touchStartTime - lastClickTime) < params.fastClicksDelayBetweenClicks) {
        e.preventDefault();
      }

      if (params.activeState) {
        activableElement = findActivableElement(targetElement);
        // If it's inside a scrollable view, we don't trigger active-state yet,
        // because it can be a scroll instead. Based on the link:
        // http://labnote.beedesk.com/click-scroll-and-pseudo-active-on-mobile-webk
        if (!isInsideScrollableView(activableElement)) {
          addActive();
        } else {
          activeTimeout = setTimeout(addActive, 80);
        }
      }
      if (useRipple) {
        rippleTouchStart(targetElement, touchStartX, touchStartY);
      }
      return true;
    }
    function handleTouchMove(e) {
      if (!trackClick) { return; }
      var distance = params.fastClicksDistanceThreshold;
      if (distance) {
        var pageX = e.targetTouches[0].pageX;
        var pageY = e.targetTouches[0].pageY;
        if (Math.abs(pageX - touchStartX) > distance || Math.abs(pageY - touchStartY) > distance) {
          isMoved = true;
        }
      } else {
        isMoved = true;
      }
      if (isMoved) {
        trackClick = false;
        targetElement = null;
        isMoved = true;
        if (params.tapHold) {
          clearTimeout(tapHoldTimeout);
        }
        if (params.activeState) {
          clearTimeout(activeTimeout);
          removeActive();
        }
        if (useRipple) {
          rippleTouchMove();
        }
      }
    }
    function handleTouchEnd(e) {
      clearTimeout(activeTimeout);
      clearTimeout(tapHoldTimeout);

      var touchEndTime = (new Date()).getTime();

      if (!trackClick) {
        if (!activeSelection && needsFastClick) {
          if (!(Device.android && !e.cancelable) && e.cancelable) {
            e.preventDefault();
          }
        }
        return true;
      }

      if (doc.activeElement === e.target) {
        if (params.activeState) { removeActive(); }
        if (useRipple) {
          rippleTouchEnd();
        }
        return true;
      }

      if (!activeSelection) {
        e.preventDefault();
      }

      if ((touchEndTime - lastClickTime) < params.fastClicksDelayBetweenClicks) {
        setTimeout(removeActive, 0);
        return true;
      }

      lastClickTime = touchEndTime;

      trackClick = false;

      if (Device.ios && scrollParent) {
        if (scrollParent.scrollTop !== scrollParent.f7ScrollTop) {
          return false;
        }
      }

      // Add active-state here because, in a very fast tap, the timeout didn't
      // have the chance to execute. Removing active-state in a timeout gives
      // the chance to the animation execute.
      if (params.activeState) {
        addActive();
        setTimeout(removeActive, 0);
      }
      // Remove Ripple
      if (useRipple) {
        rippleTouchEnd();
      }

      // Trigger focus when required
      if (targetNeedsFocus(targetElement)) {
        if (Device.ios && Device.webView) {
          targetElement.focus();
          return false;
        }

        targetElement.focus();
      }

      // Blur active elements
      if (doc.activeElement && targetElement !== doc.activeElement && doc.activeElement !== doc.body && targetElement.nodeName.toLowerCase() !== 'label') {
        doc.activeElement.blur();
      }

      // Send click
      e.preventDefault();
      if (params.tapHoldPreventClicks && tapHoldFired) {
        return false;
      }
      sendClick(e);
      return false;
    }
    function handleTouchCancel() {
      trackClick = false;
      targetElement = null;

      // Remove Active State
      clearTimeout(activeTimeout);
      clearTimeout(tapHoldTimeout);
      if (params.activeState) {
        removeActive();
      }

      // Remove Ripple
      if (useRipple) {
        rippleTouchEnd();
      }
    }

    function handleClick(e) {
      var allowClick = false;
      if (trackClick) {
        targetElement = null;
        trackClick = false;
        return true;
      }
      if ((e.target.type === 'submit' && e.detail === 0) || e.target.type === 'file') {
        return true;
      }
      if (!targetElement) {
        if (!isFormElement(e.target)) {
          allowClick = true;
        }
      }
      if (!needsFastClick) {
        allowClick = true;
      }
      if (doc.activeElement === targetElement) {
        allowClick = true;
      }
      if (e.forwardedTouchEvent) {
        allowClick = true;
      }
      if (!e.cancelable) {
        allowClick = true;
      }
      if (params.tapHold && params.tapHoldPreventClicks && tapHoldFired) {
        allowClick = false;
      }
      if (!allowClick) {
        e.stopImmediatePropagation();
        e.stopPropagation();
        if (targetElement) {
          if (targetNeedsPrevent(targetElement) || isMoved) {
            e.preventDefault();
          }
        } else {
          e.preventDefault();
        }
        targetElement = null;
      }
      needsFastClickTimeOut = setTimeout(function () {
        needsFastClick = false;
      }, (Device.ios || Device.androidChrome ? 100 : 400));

      if (params.tapHold) {
        tapHoldTimeout = setTimeout(function () {
          tapHoldFired = false;
        }, (Device.ios || Device.androidChrome ? 100 : 400));
      }

      return allowClick;
    }

    function emitAppTouchEvent(name, e) {
      app.emit({
        events: name,
        data: [e],
      });
    }
    function appClick(e) {
      emitAppTouchEvent('click', e);
    }
    function appTouchStartActive(e) {
      emitAppTouchEvent('touchstart touchstart:active', e);
    }
    function appTouchMoveActive(e) {
      emitAppTouchEvent('touchmove touchmove:active', e);
    }
    function appTouchEndActive(e) {
      emitAppTouchEvent('touchend touchend:active', e);
    }
    function appTouchStartPassive(e) {
      emitAppTouchEvent('touchstart:passive', e);
    }
    function appTouchMovePassive(e) {
      emitAppTouchEvent('touchmove:passive', e);
    }
    function appTouchEndPassive(e) {
      emitAppTouchEvent('touchend:passive', e);
    }

    var passiveListener = Support.passiveListener ? { passive: true } : false;
    var activeListener = Support.passiveListener ? { passive: false } : false;

    doc.addEventListener('click', appClick, true);

    if (Support.passiveListener) {
      doc.addEventListener(app.touchEvents.start, appTouchStartActive, activeListener);
      doc.addEventListener(app.touchEvents.move, appTouchMoveActive, activeListener);
      doc.addEventListener(app.touchEvents.end, appTouchEndActive, activeListener);

      doc.addEventListener(app.touchEvents.start, appTouchStartPassive, passiveListener);
      doc.addEventListener(app.touchEvents.move, appTouchMovePassive, passiveListener);
      doc.addEventListener(app.touchEvents.end, appTouchEndPassive, passiveListener);
    } else {
      doc.addEventListener(app.touchEvents.start, function (e) {
        appTouchStartActive(e);
        appTouchStartPassive(e);
      }, false);
      doc.addEventListener(app.touchEvents.move, function (e) {
        appTouchMoveActive(e);
        appTouchMovePassive(e);
      }, false);
      doc.addEventListener(app.touchEvents.end, function (e) {
        appTouchEndActive(e);
        appTouchEndPassive(e);
      }, false);
    }

    if (Support.touch) {
      app.on('click', handleClick);
      app.on('touchstart', handleTouchStart);
      app.on('touchmove', handleTouchMove);
      app.on('touchend', handleTouchEnd);
      doc.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    } else if (params.activeState) {
      app.on('touchstart', handleMouseDown);
      app.on('touchmove', handleMouseMove);
      app.on('touchend', handleMouseUp);
    }
    doc.addEventListener('contextmenu', function (e) {
      if (params.disableContextMenu && (Device.ios || Device.android || Device.cordova)) {
        e.preventDefault();
      }
      if (useRipple) {
        if (activableElement) { removeActive(); }
        rippleTouchEnd();
      }
    });
  }

  var TouchModule = {
    name: 'touch',
    params: {
      touch: {
        // Fast clicks
        fastClicks: true,
        fastClicksDistanceThreshold: 10,
        fastClicksDelayBetweenClicks: 50,
        fastClicksExclude: '', // CSS selector
        // ContextMenu
        disableContextMenu: true,
        // Tap Hold
        tapHold: false,
        tapHoldDelay: 750,
        tapHoldPreventClicks: true,
        // Active State
        activeState: true,
        activeStateElements: 'a, button, label, span, .actions-button, .stepper-button, .stepper-button-plus, .stepper-button-minus',
        materialRipple: true,
        materialRippleElements: '.ripple, .link, .item-link, .links-list a, .button, button, .input-clear-button, .dialog-button, .tab-link, .item-radio, .item-checkbox, .actions-button, .searchbar-disable-button, .fab a, .checkbox, .radio, .data-table .sortable-cell:not(.input-cell), .notification-close-button, .stepper-button, .stepper-button-minus, .stepper-button-plus',
      },
    },
    instance: {
      touchEvents: {
        start: Support.touch ? 'touchstart' : 'mousedown',
        move: Support.touch ? 'touchmove' : 'mousemove',
        end: Support.touch ? 'touchend' : 'mouseup',
      },
    },
    on: {
      init: initTouch,
    },
  };

  /**
   * Expose `pathToRegexp`.
   */
  var pathToRegexp_1 = pathToRegexp;
  var parse_1 = parse;
  var compile_1 = compile;
  var tokensToFunction_1 = tokensToFunction;
  var tokensToRegExp_1 = tokensToRegExp;

  /**
   * Default configs.
   */
  var DEFAULT_DELIMITER = '/';
  var DEFAULT_DELIMITERS = './';

  /**
   * The main path matching regexp utility.
   *
   * @type {RegExp}
   */
  var PATH_REGEXP = new RegExp([
    // Match escaped characters that would otherwise appear in future matches.
    // This allows the user to escape special characters that won't transform.
    '(\\\\.)',
    // Match Express-style parameters and un-named parameters with a prefix
    // and optional suffixes. Matches appear as:
    //
    // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
    // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined]
    '(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?'
  ].join('|'), 'g');

  /**
   * Parse a string for the raw tokens.
   *
   * @param  {string}  str
   * @param  {Object=} options
   * @return {!Array}
   */
  function parse (str, options) {
    var tokens = [];
    var key = 0;
    var index = 0;
    var path = '';
    var defaultDelimiter = (options && options.delimiter) || DEFAULT_DELIMITER;
    var delimiters = (options && options.delimiters) || DEFAULT_DELIMITERS;
    var pathEscaped = false;
    var res;

    while ((res = PATH_REGEXP.exec(str)) !== null) {
      var m = res[0];
      var escaped = res[1];
      var offset = res.index;
      path += str.slice(index, offset);
      index = offset + m.length;

      // Ignore already escaped sequences.
      if (escaped) {
        path += escaped[1];
        pathEscaped = true;
        continue
      }

      var prev = '';
      var next = str[index];
      var name = res[2];
      var capture = res[3];
      var group = res[4];
      var modifier = res[5];

      if (!pathEscaped && path.length) {
        var k = path.length - 1;

        if (delimiters.indexOf(path[k]) > -1) {
          prev = path[k];
          path = path.slice(0, k);
        }
      }

      // Push the current path onto the tokens.
      if (path) {
        tokens.push(path);
        path = '';
        pathEscaped = false;
      }

      var partial = prev !== '' && next !== undefined && next !== prev;
      var repeat = modifier === '+' || modifier === '*';
      var optional = modifier === '?' || modifier === '*';
      var delimiter = prev || defaultDelimiter;
      var pattern = capture || group;

      tokens.push({
        name: name || key++,
        prefix: prev,
        delimiter: delimiter,
        optional: optional,
        repeat: repeat,
        partial: partial,
        pattern: pattern ? escapeGroup(pattern) : '[^' + escapeString(delimiter) + ']+?'
      });
    }

    // Push any remaining characters.
    if (path || index < str.length) {
      tokens.push(path + str.substr(index));
    }

    return tokens
  }

  /**
   * Compile a string to a template function for the path.
   *
   * @param  {string}             str
   * @param  {Object=}            options
   * @return {!function(Object=, Object=)}
   */
  function compile (str, options) {
    return tokensToFunction(parse(str, options))
  }

  /**
   * Expose a method for transforming tokens into the path function.
   */
  function tokensToFunction (tokens) {
    // Compile all the tokens into regexps.
    var matches = new Array(tokens.length);

    // Compile all the patterns before compilation.
    for (var i = 0; i < tokens.length; i++) {
      if (typeof tokens[i] === 'object') {
        matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$');
      }
    }

    return function (data, options) {
      var path = '';
      var encode = (options && options.encode) || encodeURIComponent;

      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        if (typeof token === 'string') {
          path += token;
          continue
        }

        var value = data ? data[token.name] : undefined;
        var segment;

        if (Array.isArray(value)) {
          if (!token.repeat) {
            throw new TypeError('Expected "' + token.name + '" to not repeat, but got array')
          }

          if (value.length === 0) {
            if (token.optional) { continue }

            throw new TypeError('Expected "' + token.name + '" to not be empty')
          }

          for (var j = 0; j < value.length; j++) {
            segment = encode(value[j], token);

            if (!matches[i].test(segment)) {
              throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '"')
            }

            path += (j === 0 ? token.prefix : token.delimiter) + segment;
          }

          continue
        }

        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          segment = encode(String(value), token);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but got "' + segment + '"')
          }

          path += token.prefix + segment;
          continue
        }

        if (token.optional) {
          // Prepend partial segment prefixes.
          if (token.partial) { path += token.prefix; }

          continue
        }

        throw new TypeError('Expected "' + token.name + '" to be ' + (token.repeat ? 'an array' : 'a string'))
      }

      return path
    }
  }

  /**
   * Escape a regular expression string.
   *
   * @param  {string} str
   * @return {string}
   */
  function escapeString (str) {
    return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1')
  }

  /**
   * Escape the capturing group by escaping special characters and meaning.
   *
   * @param  {string} group
   * @return {string}
   */
  function escapeGroup (group) {
    return group.replace(/([=!:$/()])/g, '\\$1')
  }

  /**
   * Get the flags for a regexp from the options.
   *
   * @param  {Object} options
   * @return {string}
   */
  function flags (options) {
    return options && options.sensitive ? '' : 'i'
  }

  /**
   * Pull out keys from a regexp.
   *
   * @param  {!RegExp} path
   * @param  {Array=}  keys
   * @return {!RegExp}
   */
  function regexpToRegexp (path, keys) {
    if (!keys) { return path }

    // Use a negative lookahead to match only capturing groups.
    var groups = path.source.match(/\((?!\?)/g);

    if (groups) {
      for (var i = 0; i < groups.length; i++) {
        keys.push({
          name: i,
          prefix: null,
          delimiter: null,
          optional: false,
          repeat: false,
          partial: false,
          pattern: null
        });
      }
    }

    return path
  }

  /**
   * Transform an array into a regexp.
   *
   * @param  {!Array}  path
   * @param  {Array=}  keys
   * @param  {Object=} options
   * @return {!RegExp}
   */
  function arrayToRegexp (path, keys, options) {
    var parts = [];

    for (var i = 0; i < path.length; i++) {
      parts.push(pathToRegexp(path[i], keys, options).source);
    }

    return new RegExp('(?:' + parts.join('|') + ')', flags(options))
  }

  /**
   * Create a path regexp from string input.
   *
   * @param  {string}  path
   * @param  {Array=}  keys
   * @param  {Object=} options
   * @return {!RegExp}
   */
  function stringToRegexp (path, keys, options) {
    return tokensToRegExp(parse(path, options), keys, options)
  }

  /**
   * Expose a function for taking tokens and returning a RegExp.
   *
   * @param  {!Array}  tokens
   * @param  {Array=}  keys
   * @param  {Object=} options
   * @return {!RegExp}
   */
  function tokensToRegExp (tokens, keys, options) {
    options = options || {};

    var strict = options.strict;
    var end = options.end !== false;
    var delimiter = escapeString(options.delimiter || DEFAULT_DELIMITER);
    var delimiters = options.delimiters || DEFAULT_DELIMITERS;
    var endsWith = [].concat(options.endsWith || []).map(escapeString).concat('$').join('|');
    var route = '';
    var isEndDelimited = tokens.length === 0;

    // Iterate over the tokens and create our regexp string.
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];

      if (typeof token === 'string') {
        route += escapeString(token);
        isEndDelimited = i === tokens.length - 1 && delimiters.indexOf(token[token.length - 1]) > -1;
      } else {
        var prefix = escapeString(token.prefix);
        var capture = token.repeat
          ? '(?:' + token.pattern + ')(?:' + prefix + '(?:' + token.pattern + '))*'
          : token.pattern;

        if (keys) { keys.push(token); }

        if (token.optional) {
          if (token.partial) {
            route += prefix + '(' + capture + ')?';
          } else {
            route += '(?:' + prefix + '(' + capture + '))?';
          }
        } else {
          route += prefix + '(' + capture + ')';
        }
      }
    }

    if (end) {
      if (!strict) { route += '(?:' + delimiter + ')?'; }

      route += endsWith === '$' ? '$' : '(?=' + endsWith + ')';
    } else {
      if (!strict) { route += '(?:' + delimiter + '(?=' + endsWith + '))?'; }
      if (!isEndDelimited) { route += '(?=' + delimiter + '|' + endsWith + ')'; }
    }

    return new RegExp('^' + route, flags(options))
  }

  /**
   * Normalize the given path string, returning a regular expression.
   *
   * An empty array can be passed in for the keys, which will hold the
   * placeholder key descriptions. For example, using `/user/:id`, `keys` will
   * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
   *
   * @param  {(string|RegExp|Array)} path
   * @param  {Array=}                keys
   * @param  {Object=}               options
   * @return {!RegExp}
   */
  function pathToRegexp (path, keys, options) {
    if (path instanceof RegExp) {
      return regexpToRegexp(path, keys)
    }

    if (Array.isArray(path)) {
      return arrayToRegexp(/** @type {!Array} */ (path), keys, options)
    }

    return stringToRegexp(/** @type {string} */ (path), keys, options)
  }
  pathToRegexp_1.parse = parse_1;
  pathToRegexp_1.compile = compile_1;
  pathToRegexp_1.tokensToFunction = tokensToFunction_1;
  pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

  var tempDom = doc.createElement('div');

  var Framework7Component = function Framework7Component(opts, extendContext) {
    if ( extendContext === void 0 ) extendContext = {};

    var options = Utils.extend({}, opts);
    var component = Utils.merge(this, extendContext, { $options: options });

    // Apply context
    ('beforeCreate created beforeMount mounted beforeDestroy destroyed').split(' ').forEach(function (cycleKey) {
      if (options[cycleKey]) { options[cycleKey] = options[cycleKey].bind(component); }
    });

    if (options.data) {
      options.data = options.data.bind(component);
      // Data
      Utils.extend(component, options.data());
    }
    if (options.render) { options.render = options.render.bind(component); }
    if (options.methods) {
      Object.keys(options.methods).forEach(function (methodName) {
        component[methodName] = options.methods[methodName].bind(component);
      });
    }

    // Bind Events
    if (options.on) {
      Object.keys(options.on).forEach(function (eventName) {
        options.on[eventName] = options.on[eventName].bind(component);
      });
    }
    if (options.once) {
      Object.keys(options.once).forEach(function (eventName) {
        options.once[eventName] = options.once[eventName].bind(component);
      });
    }

    if (options.beforeCreate) { options.beforeCreate(); }

    // Watchers
    if (options.watch) {
      Object.keys(options.watch).forEach(function (watchKey) {
        var dataKeyValue = component[watchKey];
        Object.defineProperty(component, watchKey, {
          enumerable: true,
          configurable: true,
          set: function set(newValue) {
            var previousValue = dataKeyValue;
            dataKeyValue = newValue;
            if (previousValue === newValue) { return; }
            options.watch[watchKey].call(component, newValue, previousValue);
          },
          get: function get() {
            return dataKeyValue;
          },
        });
      });
    }

    // Render template

    function render() {
      var html = '';
      if (options.render) {
        html = options.render();
      } else if (options.template) {
        if (typeof options.template === 'string') {
          try {
            html = Template7.compile(options.template)(component);
          } catch (err) {
            throw err;
          }
        } else {
          // Supposed to be function
          html = options.template(component);
        }
      }
      return html;
    }

    var html = render();

    // Make Dom
    if (html && typeof html === 'string') {
      html = html.trim();
      tempDom.innerHTML = html;
    } else if (html) {
      tempDom.innerHTML = '';
      tempDom.appendChild(html);
    }

    // Extend component with $el
    var el = tempDom.children[0];
    var $el = $$1(el);
    component.$el = $el;
    component.el = el;
    component.el = el;

    // Find Events
    var events = [];
    $$1(tempDom).find('*').each(function (index, element) {
      var attrs = [];
      for (var i = 0; i < element.attributes.length; i += 1) {
        var attr = element.attributes[i];
        if (attr.name.indexOf('@') === 0) {
          attrs.push({
            name: attr.name,
            value: attr.value,
          });
        }
      }
      attrs.forEach(function (attr) {
        element.removeAttribute(attr.name);
        var event = attr.name.replace('@', '');
        var name = event;
        var stop = false;
        var prevent = false;
        var once = false;
        if (event.indexOf('.') >= 0) {
          event.split('.').forEach(function (eventNamePart, eventNameIndex) {
            if (eventNameIndex === 0) { name = eventNamePart; }
            else {
              if (eventNamePart === 'stop') { stop = true; }
              if (eventNamePart === 'prevent') { prevent = true; }
              if (eventNamePart === 'once') { once = true; }
            }
          });
        }
        var value = attr.value.toString();
        events.push({
          el: element,
          name: name,
          once: once,
          handler: function handler() {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            var e = args[0];
            if (stop) { e.stopPropagation(); }
            if (prevent) { e.preventDefault(); }
            var methodName;
            var method;
            var customArgs = [];
            if (value.indexOf('(') < 0) {
              customArgs = args;
              methodName = value;
            } else {
              methodName = value.split('(')[0];
              value.split('(')[1].split(')')[0].split(',').forEach(function (argument) {
                var arg = argument.trim();
                // eslint-disable-next-line
                if (!isNaN(arg)) { arg = parseFloat(arg); }
                else if (arg === 'true') { arg = true; }
                else if (arg === 'false') { arg = false; }
                else if (arg === 'null') { arg = null; }
                else if (arg === 'undefined') { arg = undefined; }
                else if (arg[0] === '"') { arg = arg.replace(/"/g, ''); }
                else if (arg[0] === '\'') { arg = arg.replace(/'/g, ''); }
                else if (arg.indexOf('.') > 0) {
                  var deepArg;
                  arg.split('.').forEach(function (path) {
                    if (!deepArg) { deepArg = component; }
                    deepArg = deepArg[path];
                  });
                  arg = deepArg;
                } else {
                  arg = component[arg];
                }
                customArgs.push(arg);
              });
            }
            if (methodName.indexOf('.') >= 0) {
              methodName.split('.').forEach(function (path, pathIndex) {
                if (!method) { method = component; }
                if (method[path]) { method = method[path]; }
                else {
                  throw new Error(("Component doesn't have method \"" + (methodName.split('.').slice(0, pathIndex + 1).join('.')) + "\""));
                }
              });
            } else {
              if (!component[methodName]) {
                throw new Error(("Component doesn't have method \"" + methodName + "\""));
              }
              method = component[methodName];
            }
            method.apply(void 0, customArgs);
          },
        });
      });
    });

    // Set styles scope ID
    var styleEl;
    if (options.style) {
      styleEl = doc.createElement('style');
      styleEl.innerHTML = options.style;
    }
    if (options.styleScopeId) {
      el.setAttribute('data-scope', options.styleScopeId);
    }

    // Attach events
    function attachEvents() {
      if (options.on) {
        Object.keys(options.on).forEach(function (eventName) {
          $el.on(Utils.eventNameToColonCase(eventName), options.on[eventName]);
        });
      }
      if (options.once) {
        Object.keys(options.once).forEach(function (eventName) {
          $el.once(Utils.eventNameToColonCase(eventName), options.once[eventName]);
        });
      }
      events.forEach(function (event) {
        $$1(event.el)[event.once ? 'once' : 'on'](event.name, event.handler);
      });
    }

    function detachEvents() {
      if (options.on) {
        Object.keys(options.on).forEach(function (eventName) {
          $el.off(Utils.eventNameToColonCase(eventName), options.on[eventName]);
        });
      }
      if (options.once) {
        Object.keys(options.once).forEach(function (eventName) {
          $el.off(Utils.eventNameToColonCase(eventName), options.once[eventName]);
        });
      }
      events.forEach(function (event) {
        $$1(event.el).off(event.name, event.handler);
      });
    }

    attachEvents();

    // Created callback
    if (options.created) { options.created(); }

    // Mount
    component.$mount = function mount(mountMethod) {
      if (options.beforeMount) { options.beforeMount(); }
      if (styleEl) { $$1('head').append(styleEl); }
      if (mountMethod) { mountMethod(el); }
      if (options.mounted) { options.mounted(); }
    };

    // Destroy
    component.$destroy = function destroy() {
      if (options.beforeDestroy) { options.beforeDestroy(); }
      if (styleEl) { $$1(styleEl).remove(); }
      detachEvents();
      if (options.destroyed) { options.destroyed(); }
      // Delete component instance
      if (el && el.f7Component) {
        el.f7Component = null;
        delete el.f7Component;
      }
      Utils.deleteProps(component);
      component = null;
    };

    // Store component instance
    for (var i = 0; i < tempDom.children.length; i += 1) {
      tempDom.children[i].f7Component = component;
    }

    return component;
  };


  var Component = {
    parse: function parse(componentString) {
      var callbackName = "f7_component_callback_" + (new Date().getTime());

      // Template
      var template;
      if (componentString.indexOf('<template>') >= 0) {
        template = componentString
          .split('<template>')
          .filter(function (item, index) { return index > 0; })
          .join('<template>')
          .split('</template>')
          .filter(function (item, index, arr) { return index < arr.length - 1; })
          .join('</template>')
          .replace(/{{#raw}}([ \n]*)<template/g, '{{#raw}}<template')
          .replace(/\/template>([ \n]*){{\/raw}}/g, '/template>{{/raw}}')
          .replace(/([ \n])<template/g, '$1{{#raw}}<template')
          .replace(/\/template>([ \n])/g, '/template>{{/raw}}$1');
      }

      // Styles
      var style;
      var styleScopeId = Utils.now();
      if (componentString.indexOf('<style>') >= 0) {
        style = componentString.split('<style>')[1].split('</style>')[0];
      } else if (componentString.indexOf('<style scoped>') >= 0) {
        style = componentString.split('<style scoped>')[1].split('</style>')[0];
        style = style.split('\n').map(function (line) {
          if (line.indexOf('{') >= 0) {
            if (line.indexOf('{{this}}') >= 0) {
              return line.replace('{{this}}', ("[data-scope=\"" + styleScopeId + "\"]"));
            }
            return ("[data-scope=\"" + styleScopeId + "\"] " + (line.trim()));
          }
          return line;
        }).join('\n');
      }

      var scriptContent;
      if (componentString.indexOf('<script>') >= 0) {
        var scripts = componentString.split('<script>');
        scriptContent = scripts[scripts.length - 1].split('</script>')[0].trim();
      } else {
        scriptContent = 'return {}';
      }
      scriptContent = "window." + callbackName + " = function () {" + scriptContent + "}";

      // Insert Script El
      var scriptEl = doc.createElement('script');
      scriptEl.innerHTML = scriptContent;
      $$1('head').append(scriptEl);

      var component = win[callbackName]();

      // Remove Script El
      $$1(scriptEl).remove();

      if (!component.template && !component.render) {
        component.template = template;
      }
      if (style) {
        component.style = style;
        component.styleScopeId = styleScopeId;
      }
      return component;
    },
    create: function create(c, extendContext) {
      if ( extendContext === void 0 ) extendContext = {};

      return new Framework7Component(c, extendContext);
    },
  };

  var History = {
    queue: [],
    clearQueue: function clearQueue() {
      if (History.queue.length === 0) { return; }
      var currentQueue = History.queue.shift();
      currentQueue();
    },
    routerQueue: [],
    clearRouterQueue: function clearRouterQueue() {
      if (History.routerQueue.length === 0) { return; }
      var currentQueue = History.routerQueue.pop();
      var router = currentQueue.router;
      var stateUrl = currentQueue.stateUrl;
      var action = currentQueue.action;

      var animate = router.params.animate;
      if (router.params.pushStateAnimate === false) { animate = false; }

      if (action === 'back') {
        router.back({ animate: animate, pushState: false });
      }
      if (action === 'load') {
        router.navigate(stateUrl, { animate: animate, pushState: false });
      }
    },
    handle: function handle(e) {
      if (History.blockPopstate) { return; }
      var app = this;
      // const mainView = app.views.main;
      var state = e.state;
      History.previousState = History.state;
      History.state = state;

      History.allowChange = true;
      History.clearQueue();

      state = History.state;
      if (!state) { state = {}; }

      app.views.forEach(function (view) {
        var router = view.router;
        var viewState = state[view.id];
        if (!viewState && view.params.pushState) {
          viewState = {
            url: view.router.history[0],
          };
        }
        if (!viewState) { return; }
        var stateUrl = viewState.url || undefined;

        var animate = router.params.animate;
        if (router.params.pushStateAnimate === false) { animate = false; }

        if (stateUrl !== router.url) {
          if (router.history.indexOf(stateUrl) >= 0) {
            // Go Back
            if (router.allowPageChange) {
              router.back({ animate: animate, pushState: false });
            } else {
              History.routerQueue.push({
                action: 'back',
                router: router,
              });
            }
          } else if (router.allowPageChange) {
            // Load page
            router.navigate(stateUrl, { animate: animate, pushState: false });
          } else {
            History.routerQueue.unshift({
              action: 'load',
              stateUrl: stateUrl,
              router: router,
            });
          }
        }
      });
    },
    initViewState: function initViewState(viewId, viewState) {
      var obj;

      var newState = Utils.extend({}, (History.state || {}), ( obj = {}, obj[viewId] = viewState, obj ));
      History.state = newState;
      win.history.replaceState(newState, '');
    },
    push: function push(viewId, viewState, url) {
      var obj;

      if (!History.allowChange) {
        History.queue.push(function () {
          History.push(viewId, viewState, url);
        });
        return;
      }
      History.previousState = History.state;
      var newState = Utils.extend({}, (History.previousState || {}), ( obj = {}, obj[viewId] = viewState, obj ));
      History.state = newState;
      win.history.pushState(newState, '', url);
    },
    replace: function replace(viewId, viewState, url) {
      var obj;

      if (!History.allowChange) {
        History.queue.push(function () {
          History.replace(viewId, viewState, url);
        });
        return;
      }
      History.previousState = History.state;
      var newState = Utils.extend({}, (History.previousState || {}), ( obj = {}, obj[viewId] = viewState, obj ));
      History.state = newState;
      win.history.replaceState(newState, '', url);
    },
    go: function go(index) {
      History.allowChange = false;
      win.history.go(index);
    },
    back: function back() {
      History.allowChange = false;
      win.history.back();
    },
    allowChange: true,
    previousState: {},
    state: win.history.state,
    blockPopstate: true,
    init: function init(app) {
      $$1(win).on('load', function () {
        setTimeout(function () {
          History.blockPopstate = false;
        }, 0);
      });

      if (doc.readyState && doc.readyState === 'complete') {
        History.blockPopstate = false;
      }

      $$1(win).on('popstate', History.handle.bind(app));
    },
  };

  function SwipeBack(r) {
    var router = r;
    var $el = router.$el;
    var $navbarEl = router.$navbarEl;
    var app = router.app;
    var params = router.params;
    var isTouched = false;
    var isMoved = false;
    var touchesStart = {};
    var isScrolling;
    var currentPage = [];
    var previousPage = [];
    var viewContainerWidth;
    var touchesDiff;
    var allowViewTouchMove = true;
    var touchStartTime;
    var currentNavbar = [];
    var previousNavbar = [];
    var currentNavElements;
    var previousNavElements;
    var activeNavBackIcon;
    var activeNavBackIconText;
    var previousNavBackIcon;
    // let previousNavBackIconText;
    var dynamicNavbar;
    var separateNavbar;
    var pageShadow;
    var pageOpacity;
    var navbarWidth;

    var paramsSwipeBackAnimateShadow = params[((app.theme) + "SwipeBackAnimateShadow")];
    var paramsSwipeBackAnimateOpacity = params[((app.theme) + "SwipeBackAnimateOpacity")];
    var paramsSwipeBackActiveArea = params[((app.theme) + "SwipeBackActiveArea")];
    var paramsSwipeBackThreshold = params[((app.theme) + "SwipeBackThreshold")];

    function handleTouchStart(e) {
      var swipeBackEnabled = params[((app.theme) + "SwipeBack")];
      if (!allowViewTouchMove || !swipeBackEnabled || isTouched || (app.swipeout && app.swipeout.el) || !router.allowPageChange) { return; }
      if ($$1(e.target).closest('.range-slider, .calendar-months').length > 0) { return; }
      isMoved = false;
      isTouched = true;
      isScrolling = undefined;
      touchesStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
      touchesStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
      touchStartTime = Utils.now();
      dynamicNavbar = router.dynamicNavbar;
      separateNavbar = router.separateNavbar;
    }
    function handleTouchMove(e) {
      if (!isTouched) { return; }
      var pageX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
      var pageY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
      if (typeof isScrolling === 'undefined') {
        isScrolling = !!(isScrolling || Math.abs(pageY - touchesStart.y) > Math.abs(pageX - touchesStart.x)) || pageX < touchesStart.x;
      }
      if (isScrolling || e.f7PreventSwipeBack || app.preventSwipeBack) {
        isTouched = false;
        return;
      }
      if (!isMoved) {
        // Calc values during first move fired
        var cancel = false;
        var target = $$1(e.target);

        var swipeout = target.closest('.swipeout');
        if (swipeout.length > 0) {
          if (!app.rtl && swipeout.find('.swipeout-actions-left').length > 0) { cancel = true; }
          if (app.rtl && swipeout.find('.swipeout-actions-right').length > 0) { cancel = true; }
        }

        currentPage = target.closest('.page');
        if (currentPage.hasClass('no-swipeback') || target.closest('.no-swipeback').length > 0) { cancel = true; }
        previousPage = $el.find('.page-previous:not(.stacked)');

        var notFromBorder = touchesStart.x - $el.offset().left > paramsSwipeBackActiveArea;
        viewContainerWidth = $el.width();
        if (app.rtl) {
          notFromBorder = touchesStart.x < ($el.offset().left - $el[0].scrollLeft) + (viewContainerWidth - paramsSwipeBackActiveArea);
        } else {
          notFromBorder = touchesStart.x - $el.offset().left > paramsSwipeBackActiveArea;
        }
        if (notFromBorder) { cancel = true; }
        if (previousPage.length === 0 || currentPage.length === 0) { cancel = true; }
        if (cancel) {
          isTouched = false;
          return;
        }

        if (paramsSwipeBackAnimateShadow) {
          pageShadow = currentPage.find('.page-shadow-effect');
          if (pageShadow.length === 0) {
            pageShadow = $$1('<div class="page-shadow-effect"></div>');
            currentPage.append(pageShadow);
          }
        }
        if (paramsSwipeBackAnimateOpacity) {
          pageOpacity = previousPage.find('.page-opacity-effect');
          if (pageOpacity.length === 0) {
            pageOpacity = $$1('<div class="page-opacity-effect"></div>');
            previousPage.append(pageOpacity);
          }
        }

        if (dynamicNavbar) {
          if (separateNavbar) {
            currentNavbar = $navbarEl.find('.navbar-current:not(.stacked)');
            previousNavbar = $navbarEl.find('.navbar-previous:not(.stacked)');
          } else {
            currentNavbar = currentPage.children('.navbar').children('.navbar-inner');
            previousNavbar = previousPage.children('.navbar').children('.navbar-inner');
          }
          navbarWidth = $navbarEl[0].offsetWidth;
          currentNavElements = currentNavbar.children('.left, .title, .right, .subnavbar, .fading');
          previousNavElements = previousNavbar.children('.left, .title, .right, .subnavbar, .fading');
          if (params.iosAnimateNavbarBackIcon) {
            if (currentNavbar.hasClass('sliding')) {
              activeNavBackIcon = currentNavbar.children('.left').find('.back .icon');
              activeNavBackIconText = currentNavbar.children('.left').find('.back span').eq(0);
            } else {
              activeNavBackIcon = currentNavbar.children('.left.sliding').find('.back .icon');
              activeNavBackIconText = currentNavbar.children('.left.sliding').find('.back span').eq(0);
            }
            if (previousNavbar.hasClass('sliding')) {
              previousNavBackIcon = previousNavbar.children('.left').find('.back .icon');
              // previousNavBackIconText = previousNavbar.children('left').find('.back span').eq(0);
            } else {
              previousNavBackIcon = previousNavbar.children('.left.sliding').find('.back .icon');
              // previousNavBackIconText = previousNavbar.children('.left.sliding').find('.back span').eq(0);
            }
          }
        }

        // Close/Hide Any Picker
        if ($$1('.sheet.modal-in').length > 0 && app.sheet) {
          app.sheet.close($$1('.sheet.modal-in'));
        }
      }
      e.f7PreventPanelSwipe = true;
      isMoved = true;
      app.preventSwipePanelBySwipeBack = true;
      e.preventDefault();

      // RTL inverter
      var inverter = app.rtl ? -1 : 1;

      // Touches diff
      touchesDiff = (pageX - touchesStart.x - paramsSwipeBackThreshold) * inverter;
      if (touchesDiff < 0) { touchesDiff = 0; }
      var percentage = touchesDiff / viewContainerWidth;

      // Swipe Back Callback
      var callbackData = {
        percentage: percentage,
        currentPageEl: currentPage[0],
        previousPageEl: previousPage[0],
        currentNavbarEl: currentNavbar[0],
        previousNavbarEl: previousNavbar[0],
      };
      $el.trigger('swipeback:move', callbackData);
      router.emit('swipebackMove', callbackData);

      // Transform pages
      var currentPageTranslate = touchesDiff * inverter;
      var previousPageTranslate = ((touchesDiff / 5) - (viewContainerWidth / 5)) * inverter;
      if (Device.pixelRatio === 1) {
        currentPageTranslate = Math.round(currentPageTranslate);
        previousPageTranslate = Math.round(previousPageTranslate);
      }

      currentPage.transform(("translate3d(" + currentPageTranslate + "px,0,0)"));
      if (paramsSwipeBackAnimateShadow) { pageShadow[0].style.opacity = 1 - (1 * percentage); }

      if (app.theme !== 'md') {
        previousPage.transform(("translate3d(" + previousPageTranslate + "px,0,0)"));
      }
      if (paramsSwipeBackAnimateOpacity) { pageOpacity[0].style.opacity = 1 - (1 * percentage); }

      // Dynamic Navbars Animation
      if (dynamicNavbar) {
        currentNavElements.each(function (index, navEl) {
          var $navEl = $$1(navEl);
          if (!$navEl.is('.subnavbar')) { $navEl[0].style.opacity = (1 - (Math.pow( percentage, 0.33 ))); }
          if ($navEl[0].className.indexOf('sliding') >= 0 || currentNavbar.hasClass('sliding')) {
            var activeNavTranslate = percentage * $navEl[0].f7NavbarRightOffset;
            if (Device.pixelRatio === 1) { activeNavTranslate = Math.round(activeNavTranslate); }
            $navEl.transform(("translate3d(" + activeNavTranslate + "px,0,0)"));
            if (params.iosAnimateNavbarBackIcon) {
              if ($navEl[0].className.indexOf('left') >= 0 && activeNavBackIcon.length > 0) {
                var iconTranslate = -activeNavTranslate;
                if (!separateNavbar) {
                  iconTranslate -= navbarWidth * percentage;
                }
                activeNavBackIcon.transform(("translate3d(" + iconTranslate + "px,0,0)"));
              }
            }
          }
        });
        previousNavElements.each(function (index, navEl) {
          var $navEl = $$1(navEl);
          if (!$navEl.is('.subnavbar')) { $navEl[0].style.opacity = (Math.pow( percentage, 3 )); }
          if ($navEl[0].className.indexOf('sliding') >= 0 || previousNavbar.hasClass('sliding')) {
            var previousNavTranslate = $navEl[0].f7NavbarLeftOffset * (1 - percentage);
            if ($navEl[0].className.indexOf('title') >= 0 && activeNavBackIcon && activeNavBackIcon.length && activeNavBackIconText.length) {
              previousNavTranslate = ($navEl[0].f7NavbarLeftOffset + activeNavBackIconText[0].offsetLeft) * (1 - percentage);
            } else {
              previousNavTranslate = $navEl[0].f7NavbarLeftOffset * (1 - percentage);
            }
            if (Device.pixelRatio === 1) { previousNavTranslate = Math.round(previousNavTranslate); }
            $navEl.transform(("translate3d(" + previousNavTranslate + "px,0,0)"));
            if (params.iosAnimateNavbarBackIcon) {
              if ($navEl[0].className.indexOf('left') >= 0 && previousNavBackIcon.length > 0) {
                var iconTranslate = -previousNavTranslate;
                if (!separateNavbar) {
                  iconTranslate += (navbarWidth / 5) * (1 - percentage);
                }
                previousNavBackIcon.transform(("translate3d(" + iconTranslate + "px,0,0)"));
              }
            }
          }
        });
      }
    }
    function handleTouchEnd() {
      app.preventSwipePanelBySwipeBack = false;
      if (!isTouched || !isMoved) {
        isTouched = false;
        isMoved = false;
        return;
      }
      isTouched = false;
      isMoved = false;
      if (touchesDiff === 0) {
        $$1([currentPage[0], previousPage[0]]).transform('');
        if (pageShadow && pageShadow.length > 0) { pageShadow.remove(); }
        if (pageOpacity && pageOpacity.length > 0) { pageOpacity.remove(); }
        if (dynamicNavbar) {
          currentNavElements.transform('').css({ opacity: '' });
          previousNavElements.transform('').css({ opacity: '' });
          if (activeNavBackIcon && activeNavBackIcon.length > 0) { activeNavBackIcon.transform(''); }
          if (previousNavBackIcon && activeNavBackIcon.length > 0) { previousNavBackIcon.transform(''); }
        }
        return;
      }
      var timeDiff = Utils.now() - touchStartTime;
      var pageChanged = false;
      // Swipe back to previous page
      if (
        (timeDiff < 300 && touchesDiff > 10)
        || (timeDiff >= 300 && touchesDiff > viewContainerWidth / 2)
      ) {
        currentPage.removeClass('page-current').addClass(("page-next" + (app.theme === 'md' ? ' page-next-on-right' : '')));
        previousPage.removeClass('page-previous').addClass('page-current').removeAttr('aria-hidden');
        if (pageShadow) { pageShadow[0].style.opacity = ''; }
        if (pageOpacity) { pageOpacity[0].style.opacity = ''; }
        if (dynamicNavbar) {
          currentNavbar.removeClass('navbar-current').addClass('navbar-next');
          previousNavbar.removeClass('navbar-previous').addClass('navbar-current').removeAttr('aria-hidden');
        }
        pageChanged = true;
      }
      // Reset custom styles
      // Add transitioning class for transition-duration
      $$1([currentPage[0], previousPage[0]]).addClass('page-transitioning page-transitioning-swipeback').transform('');

      if (dynamicNavbar) {
        currentNavElements.css({ opacity: '' })
          .each(function (navElIndex, navEl) {
            var translate = pageChanged ? navEl.f7NavbarRightOffset : 0;
            var sliding = $$1(navEl);
            var iconTranslate = pageChanged ? -translate : 0;
            if (!separateNavbar && pageChanged) { iconTranslate -= navbarWidth; }
            sliding.transform(("translate3d(" + translate + "px,0,0)"));
            if (params.iosAnimateNavbarBackIcon) {
              if (sliding.hasClass('left') && activeNavBackIcon.length > 0) {
                activeNavBackIcon.addClass('navbar-transitioning').transform(("translate3d(" + iconTranslate + "px,0,0)"));
              }
            }
          }).addClass('navbar-transitioning');

        previousNavElements.transform('').css({ opacity: '' }).each(function (navElIndex, navEl) {
          var translate = pageChanged ? 0 : navEl.f7NavbarLeftOffset;
          var sliding = $$1(navEl);
          var iconTranslate = pageChanged ? 0 : -translate;
          if (!separateNavbar && !pageChanged) { iconTranslate += navbarWidth / 5; }
          sliding.transform(("translate3d(" + translate + "px,0,0)"));
          if (params.iosAnimateNavbarBackIcon) {
            if (sliding.hasClass('left') && previousNavBackIcon.length > 0) {
              previousNavBackIcon.addClass('navbar-transitioning').transform(("translate3d(" + iconTranslate + "px,0,0)"));
            }
          }
        }).addClass('navbar-transitioning');
      }
      allowViewTouchMove = false;
      router.allowPageChange = false;

      // Swipe Back Callback
      var callbackData = {
        currentPage: currentPage[0],
        previousPage: previousPage[0],
        currentNavbar: currentNavbar[0],
        previousNavbar: previousNavbar[0],
      };

      if (pageChanged) {
        // Update Route
        router.currentRoute = previousPage[0].f7Page.route;
        router.currentPage = previousPage[0];

        // Page before animation callback
        router.pageCallback('beforeOut', currentPage, currentNavbar, 'current', 'next', { route: currentPage[0].f7Page.route, swipeBack: true });
        router.pageCallback('beforeIn', previousPage, previousNavbar, 'previous', 'current', { route: previousPage[0].f7Page.route, swipeBack: true });

        $el.trigger('swipeback:beforechange', callbackData);
        router.emit('swipebackBeforeChange', callbackData);
      } else {
        $el.trigger('swipeback:beforereset', callbackData);
        router.emit('swipebackBeforeReset', callbackData);
      }

      currentPage.transitionEnd(function () {
        $$1([currentPage[0], previousPage[0]]).removeClass('page-transitioning page-transitioning-swipeback');

        if (dynamicNavbar) {
          currentNavElements.removeClass('navbar-transitioning').css({ opacity: '' }).transform('');
          previousNavElements.removeClass('navbar-transitioning').css({ opacity: '' }).transform('');
          if (activeNavBackIcon && activeNavBackIcon.length > 0) { activeNavBackIcon.removeClass('navbar-transitioning'); }
          if (previousNavBackIcon && previousNavBackIcon.length > 0) { previousNavBackIcon.removeClass('navbar-transitioning'); }
        }
        allowViewTouchMove = true;
        router.allowPageChange = true;
        if (pageChanged) {
          // Update History
          if (router.history.length === 1) {
            router.history.unshift(router.url);
          }
          router.history.pop();
          router.saveHistory();

          // Update push state
          if (params.pushState) {
            History.back();
          }

          // Page after animation callback
          router.pageCallback('afterOut', currentPage, currentNavbar, 'current', 'next', { route: currentPage[0].f7Page.route, swipeBack: true });
          router.pageCallback('afterIn', previousPage, previousNavbar, 'previous', 'current', { route: previousPage[0].f7Page.route, swipeBack: true });

          // Remove Old Page
          if (params.stackPages && router.initialPages.indexOf(currentPage[0]) >= 0) {
            currentPage.addClass('stacked');
            if (separateNavbar) {
              currentNavbar.addClass('stacked');
            }
          } else {
            router.pageCallback('beforeRemove', currentPage, currentNavbar, 'next', { swipeBack: true });
            router.removePage(currentPage);
            if (separateNavbar) {
              router.removeNavbar(currentNavbar);
            }
          }

          $el.trigger('swipeback:afterchange', callbackData);
          router.emit('swipebackAfterChange', callbackData);

          router.emit('routeChanged', router.currentRoute, router.previousRoute, router);

          if (params.preloadPreviousPage) {
            router.back(router.history[router.history.length - 2], { preload: true });
          }
        } else {
          $el.trigger('swipeback:afterreset', callbackData);
          router.emit('swipebackAfterReset', callbackData);
        }
        if (pageShadow && pageShadow.length > 0) { pageShadow.remove(); }
        if (pageOpacity && pageOpacity.length > 0) { pageOpacity.remove(); }
      });
    }

    function attachEvents() {
      var passiveListener = (app.touchEvents.start === 'touchstart' && Support.passiveListener) ? { passive: true, capture: false } : false;
      $el.on(app.touchEvents.start, handleTouchStart, passiveListener);
      app.on('touchmove:active', handleTouchMove);
      app.on('touchend:passive', handleTouchEnd);
    }
    function detachEvents() {
      var passiveListener = (app.touchEvents.start === 'touchstart' && Support.passiveListener) ? { passive: true, capture: false } : false;
      $el.off(app.touchEvents.start, handleTouchStart, passiveListener);
      app.off('touchmove:active', handleTouchMove);
      app.off('touchend:passive', handleTouchEnd);
    }

    attachEvents();

    router.on('routerDestroy', detachEvents);
  }

  function redirect (direction, route, options) {
    var router = this;
    var redirect = route.route.redirect;
    if (options.initial && router.params.pushState) {
      options.replaceState = true; // eslint-disable-line
      options.history = true; // eslint-disable-line
    }
    function redirectResolve(redirectUrl, redirectOptions) {
      if ( redirectOptions === void 0 ) redirectOptions = {};

      router.allowPageChange = true;
      router[direction](redirectUrl, Utils.extend({}, options, redirectOptions));
    }
    function redirectReject() {
      router.allowPageChange = true;
    }
    if (typeof redirect === 'function') {
      router.allowPageChange = false;
      var redirectUrl = redirect.call(router, route, redirectResolve, redirectReject);
      if (redirectUrl && typeof redirectUrl === 'string') {
        router.allowPageChange = true;
        return router[direction](redirectUrl, options);
      }
      return router;
    }
    return router[direction](redirect, options);
  }

  function processQueue(router, routerQueue, routeQueue, to, from, resolve, reject) {
    var queue = [];

    if (Array.isArray(routeQueue)) {
      queue.push.apply(queue, routeQueue);
    } else if (routeQueue && typeof routeQueue === 'function') {
      queue.push(routeQueue);
    }
    if (routerQueue) {
      if (Array.isArray(routerQueue)) {
        queue.push.apply(queue, routerQueue);
      } else {
        queue.push(routerQueue);
      }
    }

    function next() {
      if (queue.length === 0) {
        resolve();
        return;
      }
      var queueItem = queue.shift();

      queueItem.call(
        router,
        to,
        from,
        function () {
          next();
        },
        function () {
          reject();
        }
      );
    }
    next();
  }

  function processRouteQueue (to, from, resolve, reject) {
    var router = this;
    function enterNextRoute() {
      if (to && to.route && (router.params.routesBeforeEnter || to.route.beforeEnter)) {
        router.allowPageChange = false;
        processQueue(
          router,
          router.params.routesBeforeEnter,
          to.route.beforeEnter,
          to,
          from,
          function () {
            router.allowPageChange = true;
            resolve();
          },
          function () {
            reject();
          }
        );
      } else {
        resolve();
      }
    }
    function leaveCurrentRoute() {
      if (from && from.route && (router.params.routesBeforeLeave || from.route.beforeLeave)) {
        router.allowPageChange = false;
        processQueue(
          router,
          router.params.routesBeforeLeave,
          from.route.beforeLeave,
          to,
          from,
          function () {
            router.allowPageChange = true;
            enterNextRoute();
          },
          function () {
            reject();
          }
        );
      } else {
        enterNextRoute();
      }
    }
    leaveCurrentRoute();
  }

  function refreshPage() {
    var router = this;
    return router.navigate(router.currentRoute.url, {
      ignoreCache: true,
      reloadCurrent: true,
    });
  }
  function loadScripts(pageName,arr_scripts, arr_links, callback) {
    var $hd = $$1(doc.head);
    var oldScripts = $hd.find("script");
    var removeNodes = [];
    for (var i = 0; i < oldScripts.length; i++) {
      var node = oldScripts[i]; 
      if (node.src) {
          for (var j = 0; j < arr_scripts.length; j++) {
              var s = arr_scripts[j];
              if (s.src && node.src.toLowerCase().indexOf(s.src.toLowerCase()) >= 0) {
                  s.exist = true;
              }
          }
      }
    } 
    var oldLinks = $hd.find("link");
    for (var i = 0; i < oldLinks.length; i++) {
      var node = oldLinks[i];
      if (node.href) {
        for (var j = 0; j < arr_links.length; j++) {
          var s = arr_links[j];
          if (s.href && node.href.toLowerCase().indexOf(s.href.toLowerCase()) >= 0) {
            s.exist = true;
          }
        }
        for (var j = 0; j < arr_scripts.length; j++) {
          var s = arr_scripts[j];
          var link = s.getAttribute("link");
          if (link && node.href && node.href.toLowerCase().indexOf(link.toLowerCase()) >= 0) {
            removeNodes.push(node); break;
          }
        }
      } 
    }
    for (var i = removeNodes.length - 1; i >= 0; i--) {
      var node = removeNodes[i];
      doc.head.removeChild(node);
    }
    var loaded = 0, all = 0; var blks = [];
    for (var i = 0; i < arr_scripts.length; i++) {
      var s = arr_scripts[i];
      if (s.exist) { continue; } 
      var script = doc.createElement("script");
      script.type = "text/javascript";
      if (script.readyState) {
        script.onreadystatechange = function () {
          if (script.readyState == "loaded" || script.readyState == "complete") {
            script.onreadystatechange = null;
            loaded++;
          }
        };
      } else {
        script.onload = function () {
          loaded++;
        };
      }
      // var flag = s.getAttribute("flag"); 
      script.setAttribute("page", pageName);
      if (s.src) {
        all++; script.src = s.src;
        //blks.push(script);
        doc.head.appendChild(script);
      }
      else if (s.text != "") {
        script.text = s.text;
        blks.push(script);
      }
    }
    for (var i = 0; i < arr_links.length; i++) {
      var s = arr_links[i];
      if (s.exist) { continue; }
      var link = doc.createElement("link");
      link.rel = "stylesheet";
      link.type = "text/css";

      if (link.readyState) {
        link.onreadystatechange = function () {
          if (link.readyState == "loaded" || link.readyState == "complete") {
            link.onreadystatechange = null;
            loaded++;
          }
        };
      } else {
        link.onload = function () {
          loaded++;
        };
      }
      if (s.href) {
        all++; link.href = s.href;
      } 
      link.setAttribute("page", pageName); 
      doc.head.appendChild(link);
    }

    var hi = setInterval(function () {
      if (loaded == all) {
        clearInterval(hi);
        var pg = window[pageName];
        if (pg) {
          window.me = pg;
          window.curPageName = pageName;
        }
        for (var i = 0; i < blks.length; i++) {
          var b = blks[i];
          doc.head.appendChild(b);
        }

        if (typeof (callback) != "undefined") {
          callback();
        }
        //start by xiang prevent whole page scrolling and bouncing
        var selfScroll = function ($sd) {
          $sd.on('touchstart', function (evt) {
            var sd = evt.currentTarget;
            var top = sd.scrollTop
              , totalScroll = sd.scrollHeight
              , currentScroll = top + sd.offsetHeight;
            if (top === 0) {
              sd.scrollTop = 1;
            } else if (currentScroll === totalScroll) {
              sd.scrollTop = top - 1;
            }
          });
        };

        var $pg = $$('#' + pageName);
        var scrDiv = $pg.find('.page-content');
        if (scrDiv.length == 1) {
          selfScroll(scrDiv);
        }
        var fixDivs = $pg.find('.toolbar,.navbar');
        fixDivs.on('touchmove', function (evt) {
          evt.preventDefault();
        });
        //end by xiang
      }
    }, 20); 
  }
  window.loadScripts = loadScripts;
  /*function forward_delete(el, forwardOptions = {}) {
    const router = this;
    const app = router.app;
    const view = router.view;

    const options = Utils.extend({
      animate: router.params.animate,
      pushState: true,
      replaceState: false,
      history: true,
      reloadCurrent: router.params.reloadPages,
      reloadPrevious: false,
      reloadAll: false,
      clearPreviousHistory: false,
      on: {},
    }, forwardOptions);

    const dynamicNavbar = router.dynamicNavbar;
    const separateNavbar = router.separateNavbar;

    const $viewEl = router.$el; 
    const $newPage = $(el.page);//by xiang
    const reload = options.reloadPrevious || options.reloadCurrent || options.reloadAll;
    let $oldPage;

    let $navbarEl;
    let $newNavbarInner;
    let $oldNavbarInner;

    if ($newPage.length) {
      // Remove theme elements
      router.removeThemeElements($newPage);
    }

    if (dynamicNavbar) {
      $newNavbarInner = $newPage.children('.navbar').children('.navbar-inner');
      if (separateNavbar) {
        $navbarEl = router.$navbarEl;
        if ($newNavbarInner.length > 0) {
          $newPage.children('.navbar').remove();
        }
        if ($newNavbarInner.length === 0 && $newPage[0].f7Page) {
          // Try from pageData
          $newNavbarInner = $newPage[0].f7Page.$navbarEl;
        }
      }
    }

    router.allowPageChange = false;
    if ($newPage.length === 0) {
      router.allowPageChange = true;
      throw new Error('no page found');//by xiang
      return router;
    }

    // Pages In View
    const $pagesInView = $viewEl
      .children('.page:not(.stacked)')
      .filter((index, pageInView) => pageInView !== $newPage[0]);

    // Navbars In View
    let $navbarsInView;
    if (separateNavbar) {
      $navbarsInView = $navbarEl
        .children('.navbar-inner:not(.stacked)')
        .filter((index, navbarInView) => navbarInView !== $newNavbarInner[0]);
    }

    // Exit when reload previous and only 1 page in view so nothing ro reload
    if (options.reloadPrevious && $pagesInView.length < 2) {
      router.allowPageChange = true;
      return router;
    }

    // New Page
    let newPagePosition = 'next';
    if (options.reloadCurrent || options.reloadAll) {
      newPagePosition = 'current';
    } else if (options.reloadPrevious) {
      newPagePosition = 'previous';
    }
    $newPage
      .addClass(`page-${newPagePosition}`)
      .removeClass('stacked');

    if (dynamicNavbar && $newNavbarInner.length) {
      $newNavbarInner
        .addClass(`navbar-${newPagePosition}`)
        .removeClass('stacked');
    }

    // Find Old Page
    if (options.reloadCurrent) {
      $oldPage = $pagesInView.eq($pagesInView.length - 1);
      if (separateNavbar) {
        // $oldNavbarInner = $navbarsInView.eq($pagesInView.length - 1);
        $oldNavbarInner = $(app.navbar.getElByPage($oldPage));
      }
    } else if (options.reloadPrevious) {
      $oldPage = $pagesInView.eq($pagesInView.length - 2);
      if (separateNavbar) {
        // $oldNavbarInner = $navbarsInView.eq($pagesInView.length - 2);
        $oldNavbarInner = $(app.navbar.getElByPage($oldPage));
      }
    } else if (options.reloadAll) {
      $oldPage = $pagesInView.filter((index, pageEl) => pageEl !== $newPage[0]);
      if (separateNavbar) {
        $oldNavbarInner = $navbarsInView.filter((index, navbarEl) => navbarEl !== $newNavbarInner[0]);
      }
    } else {
      if ($pagesInView.length > 1) {
        let i = 0;
        for (i = 0; i < $pagesInView.length - 1; i += 1) {
          const oldNavbarInnerEl = app.navbar.getElByPage($pagesInView.eq(i));
          if (true || router.params.stackPages) {//changed by xiang for keeping previous page in dom
            $pagesInView.eq(i).addClass('stacked');
            if (separateNavbar) {
              // $navbarsInView.eq(i).addClass('stacked');
              $(oldNavbarInnerEl).addClass('stacked');
            }
          } else {
            // Page remove event
            router.pageCallback('beforeRemove', $pagesInView[i], $navbarsInView && $navbarsInView[i], 'previous', undefined, options);
            router.removePage($pagesInView[i]);
            if (separateNavbar && oldNavbarInnerEl) {
              router.removeNavbar(oldNavbarInnerEl);
            }
          }
        }
      }
      $oldPage = $viewEl
        .children('.page:not(.stacked)')
        .filter((index, page) => page !== $newPage[0]);
      if (separateNavbar) {
        $oldNavbarInner = $navbarEl
          .children('.navbar-inner:not(.stacked)')
          .filter((index, navbarInner) => navbarInner !== $newNavbarInner[0]);
      }
    }
    if (dynamicNavbar && !separateNavbar) {
      $oldNavbarInner = $oldPage.children('.navbar').children('.navbar-inner');
    }

    // Push State
    if (router.params.pushState && (options.pushState || options.replaceState) && !options.reloadPrevious) {
      const pushStateRoot = router.params.pushStateRoot || '';
      History[options.reloadCurrent || options.reloadAll || options.replaceState ? 'replace' : 'push'](
        view.id,
        {
          url: options.route.url,
        },
        pushStateRoot + router.params.pushStateSeparator + options.route.url
      );
    }
    var prePage = router.currentRoute.name;
    if (!prePage) prePage = router.currentRoute.path.replace('/', '');
    if (!options.reloadPrevious) {
      // Current Page & Navbar
      router.currentPageEl = $newPage[0];
      if (dynamicNavbar && $newNavbarInner.length) {
        router.currentNavbarEl = $newNavbarInner[0];
      } else {
        delete router.currentNavbarEl;
      }

      // Current Route
      router.currentRoute = options.route;
    }

    // Update router history
    const url = options.route.url;

    if (options.history) {
      if ((options.reloadCurrent && router.history.length) > 0 || options.replaceState) {
        router.history[router.history.length - (options.reloadPrevious ? 2 : 1)] = url;
      } else if (options.reloadPrevious) {
        router.history[router.history.length - 2] = url;
      } else if (options.reloadAll) {
        router.history = [url];
      } else {
        router.history.push(url);
      }
    }
    router.saveHistory();

    //add a cover to the new page to avoid being seen before completely loaded    - by xiang
    window.waitAnimateEnd = false;
    window.AnimateEnded = false;
    window.AnimateEndDealed = false;
    window.scriptLoaded = false;
    if (!options.reloadCurrent && options.animate) {
      window.waitAnimateEnd = true;
    }
    if (options.useLoadCover) {
      var divLoad = $newPage.find('.PageLoadCover');
      if (divLoad.length == 0) {
        divLoad = $$('<div class="PageLoadCover" style="position:absolute;z-index:2000;left:0;top:0; width:100%;height:100%;line-height:100vh;text-align:center;background-color:#e8e8e8;font-size:16px;color:#333;">努力加载中...</div>');
        var bc = $newPage[0].style['background-color'];// $newPage.css('background-color');
        if (bc) {
          divLoad.css('backgroundColor', bc);
        }
        $newPage[0].append(divLoad[0]);
      }
      else {
        divLoad[0].style.visibility = 'visible'; divLoad[0].style['z-index'] = '2000';
      }
    }
    // Insert new page and navbar
    const newPageInDom = $newPage.parents(document).length > 0;
    const f7Component = $newPage[0].f7Component;
    if (options.reloadPrevious) {
      if (f7Component && !newPageInDom) {
        f7Component.$mount((componentEl) => {
          $(componentEl).insertBefore($oldPage);
        });
      } else {
        $newPage.insertBefore($oldPage);
      }
      if (separateNavbar && $newNavbarInner.length) {
        if ($oldNavbarInner.length) {
          $newNavbarInner.insertBefore($oldNavbarInner);
        } else {
          if (!router.$navbarEl.parents(document).length) {
            router.$el.prepend(router.$navbarEl);
          }
          $navbarEl.append($newNavbarInner);
        }
      }
    } else {
      if ($oldPage.next('.page')[0] !== $newPage[0]) {
        if (f7Component && !newPageInDom) {
          f7Component.$mount((componentEl) => {
            $viewEl.append(componentEl);
          });
        } else {
          $viewEl.append($newPage[0]);
        }
      }
      if (separateNavbar && $newNavbarInner.length) {
        if (!router.$navbarEl.parents(document).length) {
          router.$el.prepend(router.$navbarEl);
        }
        $navbarEl.append($newNavbarInner[0]);
      }
    }
    if (!newPageInDom) {
      router.pageCallback('mounted', $newPage, $newNavbarInner, newPagePosition, reload ? newPagePosition : 'current', options, $oldPage);
    }

    // Remove old page
    if (options.reloadCurrent && $oldPage.length > 0) {
      if (router.params.stackPages && router.initialPages.indexOf($oldPage[0]) >= 0) {
        $oldPage.addClass('stacked');
        if (separateNavbar) {
          $oldNavbarInner.addClass('stacked');
        }
      } else {
        // Page remove event
        router.pageCallback('beforeRemove', $oldPage, $oldNavbarInner, 'previous', undefined, options);
        router.removePage($oldPage);
        if (separateNavbar && $oldNavbarInner && $oldNavbarInner.length) {
          router.removeNavbar($oldNavbarInner);
        }
      }
    } else if (options.reloadAll) {
      $oldPage.each((index, pageEl) => {
        const $oldPageEl = $(pageEl);
        const $oldNavbarInnerEl = $(app.navbar.getElByPage($oldPageEl));
        if (router.params.stackPages && router.initialPages.indexOf($oldPageEl[0]) >= 0) {
          $oldPageEl.addClass('stacked');
          if (separateNavbar) {
            $oldNavbarInnerEl.addClass('stacked');
          }
        } else {
          // Page remove event
          router.pageCallback('beforeRemove', $oldPageEl, $oldNavbarInner && $oldNavbarInner.eq(index), 'previous', undefined, options);
          router.removePage($oldPageEl);
          if (separateNavbar && $oldNavbarInnerEl.length) {
            router.removeNavbar($oldNavbarInnerEl);
          }
        }
      });
    } else if (options.reloadPrevious) {
      if (router.params.stackPages && router.initialPages.indexOf($oldPage[0]) >= 0) {
        $oldPage.addClass('stacked');
        if (separateNavbar) {
          $oldNavbarInner.addClass('stacked');
        }
      } else {
        // Page remove event
        router.pageCallback('beforeRemove', $oldPage, $oldNavbarInner, 'previous', undefined, options);
        router.removePage($oldPage);
        if (separateNavbar && $oldNavbarInner && $oldNavbarInner.length) {
          router.removeNavbar($oldNavbarInner);
        }
      }
    }

    // Load Tab
    if (options.route.route.tab) {
      router.tabLoad(options.route.route.tab, Utils.extend({}, options, {
        history: false,
        pushState: false,
      }));
    }
    
    // Page init and before init events
    router.pageCallback('init', $newPage, $newNavbarInner, newPagePosition, reload ? newPagePosition : 'current', options, $oldPage);

    loadPageScript();
    function loadPageScript() {
      var pgName = options.route.name;
      loadScripts(pgName, el.scripts, el.links, function () { //by xiang
        var pg = window[pgName];
        if (pg) {
          if (pg.onPageLoad) {
            pg.onPageLoad(prePage, options);//by xiang 
            window.scriptLoaded = true;
            DealAnimateEnd();
          }
        }
      });
    }
    function DealAnimateEnd() {
      if (!options.animate || (window.waitAnimateEnd && !window.AnimateEndDealed && window.AnimateEnded && window.scriptLoaded)) {
        window.AnimateEndDealed = true;
        var pgName = options.route.name;
        var pg = window[pgName];
        if (pg) {
          if (pg.onPageAnimateEnd) {
            pg.onPageAnimateEnd();//by xiang  
          }
        }
        var plc = $$('.PageLoadCover');
        if (plc) { plc.remove(); }
        window.waitAnimateEnd = false; window.AnimateEndDealed = false; window.AnimateEnded = false; window.scriptLoaded = false;
      }
    }


    if (options.reloadCurrent || options.reloadAll) {
      loadPageScript();
      router.allowPageChange = true;
      router.pageCallback('beforeIn', $newPage, $newNavbarInner, newPagePosition, 'current', options);
      router.pageCallback('afterIn', $newPage, $newNavbarInner, newPagePosition, 'current', options);
      if (options.reloadCurrent && options.clearPreviousHistory) router.clearPreviousHistory();
      return router;
    }
    if (options.reloadPrevious) {
      router.allowPageChange = true;
      loadPageScript();
      return router;
    }

    // Before animation event
    router.pageCallback('beforeIn', $newPage, $newNavbarInner, 'next', 'current', options);
    router.pageCallback('beforeOut', $oldPage, $oldNavbarInner, 'current', 'previous', options);

    // Animation
    function afterAnimation() {
      const pageClasses = 'page-previous page-current page-next';
      const navbarClasses = 'navbar-previous navbar-current navbar-next';
      $newPage.removeClass(pageClasses).addClass('page-current').removeAttr('aria-hidden');
      $oldPage.removeClass(pageClasses).addClass('page-previous').attr('aria-hidden', 'true');
      if (dynamicNavbar) {
        $newNavbarInner.removeClass(navbarClasses).addClass('navbar-current').removeAttr('aria-hidden');
        $oldNavbarInner.removeClass(navbarClasses).addClass('navbar-previous').attr('aria-hidden', 'true');
      }
      // After animation event
      router.allowPageChange = true;
      router.pageCallback('afterIn', $newPage, $newNavbarInner, 'next', 'current', options);
      router.pageCallback('afterOut', $oldPage, $oldNavbarInner, 'current', 'previous', options);

      let keepOldPage = app.theme === 'ios' ? (router.params.preloadPreviousPage || router.params.iosSwipeBack) : router.params.preloadPreviousPage;
      if (!keepOldPage) {
        if ($newPage.hasClass('smart-select-page') || $newPage.hasClass('photo-browser-page') || $newPage.hasClass('autocomplete-page')) {
          keepOldPage = true;
        }
      }
      if (!keepOldPage) {
        if (router.params.stackPages) {
          $oldPage.addClass('stacked');
          if (separateNavbar) {
            $oldNavbarInner.addClass('stacked');
          }
        } else if (!($newPage.attr('data-name') && $newPage.attr('data-name') === 'smart-select-page')) {
          // Remove event
          router.pageCallback('beforeRemove', $oldPage, $oldNavbarInner, 'previous', undefined, options);
          router.removePage($oldPage);
          if (separateNavbar && $oldNavbarInner.length) {
            router.removeNavbar($oldNavbarInner);
          }
        }
      }
      if (options.clearPreviousHistory) router.clearPreviousHistory();
      router.emit('routeChanged', router.currentRoute, router.previousRoute, router);

      if (router.params.pushState) {
        History.clearRouterQueue();
      }
      if (options.animate) {
         window.AnimateEnded = true;
         DealAnimateEnd();
      }
    }
    function setPositionClasses() {
      const pageClasses = 'page-previous page-current page-next';
      const navbarClasses = 'navbar-previous navbar-current navbar-next';
      $oldPage.removeClass(pageClasses).addClass('page-current').removeAttr('aria-hidden');
      $newPage.removeClass(pageClasses).addClass('page-next').removeAttr('aria-hidden');
      if (dynamicNavbar) {
        $oldNavbarInner.removeClass(navbarClasses).addClass('navbar-current').removeAttr('aria-hidden');
        $newNavbarInner.removeClass(navbarClasses).addClass('navbar-next').removeAttr('aria-hidden');
      }
    }

   
    if (options.animate) {
      const delay = router.app.theme === 'md' ? router.params.materialPageLoadDelay : router.params.iosPageLoadDelay;
      if (delay) {
        setTimeout(() => {
          setPositionClasses();
          router.animate($oldPage, $newPage, $oldNavbarInner, $newNavbarInner, 'forward', () => {
            afterAnimation();  
          });
        }, delay);
      } else {
        setPositionClasses();
        router.animate($oldPage, $newPage, $oldNavbarInner, $newNavbarInner, 'forward', () => {
          afterAnimation();  
        });
      }
    } else {
      afterAnimation();  
    }
    return router;
  }*/
   
  function forward(urlOrEl, forwardOptions) {
    if ( forwardOptions === void 0 ) forwardOptions = {};

    var router = this;
    var app = router.app;
    var view = router.view;

    var options = Utils.extend({
      animate: router.params.animate,
      pushState: true,
      replaceState: false,
      history: true,
      reloadCurrent: router.params.reloadPages,
      reloadPrevious: false,
      reloadAll: false,
      clearPreviousHistory: false,
      on: {},
    }, forwardOptions);
    
    var pgName = options.route.name;
    //add a loading page before request ok
    var initEl = router.getPageEl("\n               <div class=\"page\" id=\""+ pgName + "\">\n                 <div class=\"page-content infinite-scroll-content\" style=\"text-align:center;line-height:calc(100vh - 50px);\">\n                      <span class=\"LoadMsg\">加载中...</span>\n                </div>\n                 <div class=\"toolbar toolbar-bottom-md\">\n                    <div class=\"toolbar-inner\">\n                       <a class=\"link\" href=\"javascript:app.router.back('');\"><i class=\"icon     icon-back\"></i><span class=\"ios-only\">返回</span></a>\n                    </div>\n                  </div>  \n              </div>\n           ");
    var paramEl = urlOrEl;
    var el = initEl;

    var dynamicNavbar = router.dynamicNavbar;
    var separateNavbar = router.separateNavbar;

    var $viewEl = router.$el;
    var $newPage = $$1(el.page);//by xiang
    var reload = options.reloadPrevious || options.reloadCurrent || options.reloadAll;
    var $oldPage;

    var $navbarEl;
    var $newNavbarInner;
    var $oldNavbarInner;

    if ($newPage.length) {
      // Remove theme elements
      router.removeThemeElements($newPage);
    }

    if (dynamicNavbar) {
      $newNavbarInner = $newPage.children('.navbar').children('.navbar-inner');
      if (separateNavbar) {
        $navbarEl = router.$navbarEl;
        if ($newNavbarInner.length > 0) {
          $newPage.children('.navbar').remove();
        }
        if ($newNavbarInner.length === 0 && $newPage[0].f7Page) {
          // Try from pageData
          $newNavbarInner = $newPage[0].f7Page.$navbarEl;
        }
      }
    }

    router.allowPageChange = false;
    if ($newPage.length === 0) {
      router.allowPageChange = true;
      throw new Error('no page found');//by xiang
      return router;
    }

    // Pages In View
    var $pagesInView = $viewEl
      .children('.page:not(.stacked)')
      .filter(function (index, pageInView) { return pageInView !== $newPage[0]; });

    // Navbars In View
    var $navbarsInView;
    if (separateNavbar) {
      $navbarsInView = $navbarEl
        .children('.navbar-inner:not(.stacked)')
        .filter(function (index, navbarInView) { return navbarInView !== $newNavbarInner[0]; });
    }

    // Exit when reload previous and only 1 page in view so nothing ro reload
    if (options.reloadPrevious && $pagesInView.length < 2) {
      router.allowPageChange = true;
      return router;
    }

    // New Page
    var newPagePosition = 'next';
    if (options.reloadCurrent || options.reloadAll) {
      newPagePosition = 'current';
    } else if (options.reloadPrevious) {
      newPagePosition = 'previous';
    }
    $newPage
      .addClass(("page-" + newPagePosition))
      .removeClass('stacked');

    if (dynamicNavbar && $newNavbarInner.length) {
      $newNavbarInner
        .addClass(("navbar-" + newPagePosition))
        .removeClass('stacked');
    }

    // Find Old Page
    if (options.reloadCurrent) {
      $oldPage = $pagesInView.eq($pagesInView.length - 1);
      if (separateNavbar) {
        // $oldNavbarInner = $navbarsInView.eq($pagesInView.length - 1);
        $oldNavbarInner = $$1(app.navbar.getElByPage($oldPage));
      }
    } else if (options.reloadPrevious) {
      $oldPage = $pagesInView.eq($pagesInView.length - 2);
      if (separateNavbar) {
        // $oldNavbarInner = $navbarsInView.eq($pagesInView.length - 2);
        $oldNavbarInner = $$1(app.navbar.getElByPage($oldPage));
      }
    } else if (options.reloadAll) {
      $oldPage = $pagesInView.filter(function (index, pageEl) { return pageEl !== $newPage[0]; });
      if (separateNavbar) {
        $oldNavbarInner = $navbarsInView.filter(function (index, navbarEl) { return navbarEl !== $newNavbarInner[0]; });
      }
    } else {
      if ($pagesInView.length > 1) {
        var i = 0;
        for (i = 0; i < $pagesInView.length - 1; i += 1) {
          var oldNavbarInnerEl = app.navbar.getElByPage($pagesInView.eq(i));
          {//changed by xiang for keeping previous page in dom
            $pagesInView.eq(i).addClass('stacked');
            if (separateNavbar) {
              // $navbarsInView.eq(i).addClass('stacked');
              $$1(oldNavbarInnerEl).addClass('stacked');
            }
          }
        }
      }
      $oldPage = $viewEl
        .children('.page:not(.stacked)')
        .filter(function (index, page) { return page !== $newPage[0]; });
      if (separateNavbar) {
        $oldNavbarInner = $navbarEl
          .children('.navbar-inner:not(.stacked)')
          .filter(function (index, navbarInner) { return navbarInner !== $newNavbarInner[0]; });
      }
    }
    if (dynamicNavbar && !separateNavbar) {
      $oldNavbarInner = $oldPage.children('.navbar').children('.navbar-inner');
    }

    // Push State
    if (router.params.pushState && (options.pushState || options.replaceState) && !options.reloadPrevious) {
      var pushStateRoot = router.params.pushStateRoot || '';
      History[options.reloadCurrent || options.reloadAll || options.replaceState ? 'replace' : 'push'](
        view.id,
        {
          url: options.route.url,
        },
        pushStateRoot + router.params.pushStateSeparator + options.route.url
      );
    }
    var prePage = router.currentRoute.name;
    if (!prePage) { prePage = router.currentRoute.path.replace('/', ''); }
    if (!options.reloadPrevious) {
      // Current Page & Navbar
      router.currentPageEl = $newPage[0];
      if (dynamicNavbar && $newNavbarInner.length) {
        router.currentNavbarEl = $newNavbarInner[0];
      } else {
        delete router.currentNavbarEl;
      }

      // Current Route
      router.currentRoute = options.route;
    }

    // Update router history
    var url = options.route.url;

    if (options.history) {
      if ((options.reloadCurrent && router.history.length) > 0 || options.replaceState) {
        router.history[router.history.length - (options.reloadPrevious ? 2 : 1)] = url;
      } else if (options.reloadPrevious) {
        router.history[router.history.length - 2] = url;
      } else if (options.reloadAll) {
        router.history = [url];
      } else {
        router.history.push(url);
      }
    }
    router.saveHistory();

    //add a cover to the new page to avoid being seen before completely loaded    - by xiang
    window.waitAnimateEnd = false;
    window.AnimateEnded = false;
    window.AnimateEndDealed = false;
    window.scriptLoaded = false;
    if (!options.reloadCurrent && options.animate) {
      window.waitAnimateEnd = true;
    }
    if (options.useLoadCover) {
      var divLoad = $newPage.find('.PageLoadCover');
      if (divLoad.length == 0) {
        divLoad = $$('<div class="PageLoadCover" style="position:absolute;z-index:2000;left:0;top:0; width:100%;height:100%;line-height:100vh;text-align:center;background-color:#e8e8e8;font-size:16px;color:#333;">努力加载中...</div>');
        var bc = $newPage[0].style['background-color'];// $newPage.css('background-color');
        if (bc) {
          divLoad.css('backgroundColor', bc);
        }
        $newPage[0].append(divLoad[0]);
      }
      else {
        divLoad[0].style.visibility = 'visible'; divLoad[0].style['z-index'] = '2000';
      }
    }
    // Insert new page and navbar
    var newPageInDom = $newPage.parents(doc).length > 0;
    var f7Component = $newPage[0].f7Component;
    if (options.reloadPrevious) {
      if (f7Component && !newPageInDom) {
        f7Component.$mount(function (componentEl) {
          $$1(componentEl).insertBefore($oldPage);
        });
      } else {
        $newPage.insertBefore($oldPage);
      }
      if (separateNavbar && $newNavbarInner.length) {
        if ($oldNavbarInner.length) {
          $newNavbarInner.insertBefore($oldNavbarInner);
        } else {
          if (!router.$navbarEl.parents(doc).length) {
            router.$el.prepend(router.$navbarEl);
          }
          $navbarEl.append($newNavbarInner);
        }
      }
    } else {
      if ($oldPage.next('.page')[0] !== $newPage[0]) {
        if (f7Component && !newPageInDom) {
          f7Component.$mount(function (componentEl) {
            $viewEl.append(componentEl);
          });
        } else {
          $viewEl.append($newPage[0]);
        }
      }
      if (separateNavbar && $newNavbarInner.length) {
        if (!router.$navbarEl.parents(doc).length) {
          router.$el.prepend(router.$navbarEl);
        }
        $navbarEl.append($newNavbarInner[0]);
      }
    }
    if (!newPageInDom) {
      router.pageCallback('mounted', $newPage, $newNavbarInner, newPagePosition, reload ? newPagePosition : 'current', options, $oldPage);
    }

    // Remove old page
    if (options.reloadCurrent && $oldPage.length > 0) {
      if (router.params.stackPages && router.initialPages.indexOf($oldPage[0]) >= 0) {
        $oldPage.addClass('stacked');
        if (separateNavbar) {
          $oldNavbarInner.addClass('stacked');
        }
      } else {
        // Page remove event
        router.pageCallback('beforeRemove', $oldPage, $oldNavbarInner, 'previous', undefined, options);
        router.removePage($oldPage);
        if (separateNavbar && $oldNavbarInner && $oldNavbarInner.length) {
          router.removeNavbar($oldNavbarInner);
        }
      }
    } else if (options.reloadAll) {
      $oldPage.each(function (index, pageEl) {
        var $oldPageEl = $$1(pageEl);
        var $oldNavbarInnerEl = $$1(app.navbar.getElByPage($oldPageEl));
        if (router.params.stackPages && router.initialPages.indexOf($oldPageEl[0]) >= 0) {
          $oldPageEl.addClass('stacked');
          if (separateNavbar) {
            $oldNavbarInnerEl.addClass('stacked');
          }
        } else {
          // Page remove event
          router.pageCallback('beforeRemove', $oldPageEl, $oldNavbarInner && $oldNavbarInner.eq(index), 'previous', undefined, options);
          router.removePage($oldPageEl);
          if (separateNavbar && $oldNavbarInnerEl.length) {
            router.removeNavbar($oldNavbarInnerEl);
          }
        }
      });
    } else if (options.reloadPrevious) {
      if (router.params.stackPages && router.initialPages.indexOf($oldPage[0]) >= 0) {
        $oldPage.addClass('stacked');
        if (separateNavbar) {
          $oldNavbarInner.addClass('stacked');
        }
      } else {
        // Page remove event
        router.pageCallback('beforeRemove', $oldPage, $oldNavbarInner, 'previous', undefined, options);
        router.removePage($oldPage);
        if (separateNavbar && $oldNavbarInner && $oldNavbarInner.length) {
          router.removeNavbar($oldNavbarInner);
        }
      }
    }

    //the init page has been in the dom, now let's get the real page

    //replace the temp page div with requested one
    function loadRealPage() {
      var contentDiv = $$('#' + pgName).find(".page-content");
      $$('.LoadMsg').html('加载中...');
      contentDiv.off("touchstart", loadRealPage);

      var realPageEl = null; var rqErr = '';
      if (typeof urlOrEl == 'string') {

        router.xhrRequest(urlOrEl, options)
          .then(function (pageContent) {
            realPageEl = router.getPageEl(pageContent);
          })
          .catch(function (err) {  //removed by xiang for error report
            rqErr = err;
            router.allowPageChange = true;
          });
      }
      else {//it's a dom object for page
        realPageEl = paramEl;
      }

      var tmStart = new Date();
      var it = setInterval(function () {
        if (realPageEl) {
          clearInterval(it);
          el = realPageEl;
          var domPg = $$('#' + pgName);
          domPg.html(el.page.html());

          // Page init and before init events
          router.pageCallback('init', domPg, $newNavbarInner, newPagePosition, reload ? newPagePosition : 'current', options, $oldPage);
          //add a cover to the new page to avoid being seen before completely loaded    - by xiang
          window.waitAnimateEnd = false;
          window.AnimateEnded = false;
          window.AnimateEndDealed = false;
          window.scriptLoaded = false;
          if (!options.reloadCurrent && options.animate) {
            window.waitAnimateEnd = true;
          }
          if (options.useLoadCover) {
            var divLoad = domPg.find('.PageLoadCover');
            if (divLoad.length == 0) {
              divLoad = $$('<div class="PageLoadCover" style="position:absolute;z-index:2000;left:0;top:0; width:100%;height:calc(100% - 45px);line-height:100vh;text-align:center;background-color:#e8e8e8;font-size:16px;color:#333;">努力加载中...</div>');
              var bc = domPg[0].style['background-color'];// $newPage.css('background-color');
              if (bc) {
                divLoad.css('backgroundColor', bc);
              }
              domPg[0].append(divLoad[0]);
            }
            else {
              divLoad[0].style.visibility = 'visible'; divLoad[0].style['z-index'] = '2000';
            }
          }
          //end cover
          loadPageScript();
          // Load Tab if this is a tab route page
          if (options.route.route.tab) {
            router.tabLoad(options.route.route.tab, Utils.extend({}, options, {
              history: false,
              pushState: false,
            }));
          }
        }
        else if (rqErr) {
          clearInterval(it);
          $$('.LoadMsg').html('网络出错了，轻触重试');
          contentDiv.on("touchstart", loadRealPage);
        }
        else if (new Date() - tmStart > 9000) {
          clearInterval(it);
          $$('.LoadMsg').html('连接超时，轻触重试');
          $$('#' + pgName).find(".page-content").on("touchstart", loadRealPage);
        }
      }, 20);
    }
    loadRealPage();

   

    // Page init and before init events 
   // router.pageCallback('init', $newPage, $newNavbarInner, newPagePosition, reload ? newPagePosition : 'current', options, $oldPage);  //moved to loadrealpage function

    loadPageScript();
    function loadPageScript() {
      var pgName = options.route.name;
      loadScripts(pgName, el.scripts, el.links, function () { //by xiang
        var pg = window[pgName];
        if (pg) {
          if (pg.onPageLoad) {
            pg.onPageLoad(prePage, options);//by xiang 
            window.scriptLoaded = true;
            DealAnimateEnd();
          }
        }
      });
    }
    function DealAnimateEnd() {
      if (!options.animate || (window.waitAnimateEnd && !window.AnimateEndDealed && window.AnimateEnded && window.scriptLoaded)) {
        window.AnimateEndDealed = true;
        var pgName = options.route.name;
        var pg = window[pgName];
        if (pg) {
          if (pg.onPageAnimateEnd) {
            pg.onPageAnimateEnd();//by xiang  
          }
        }
        var plc = $$('.PageLoadCover');
        if (plc) { plc.remove(); }
        window.waitAnimateEnd = false; window.AnimateEndDealed = false; window.AnimateEnded = false; window.scriptLoaded = false;
      }
    }


    if (options.reloadCurrent || options.reloadAll) {
      loadPageScript();
      router.allowPageChange = true;
      router.pageCallback('beforeIn', $newPage, $newNavbarInner, newPagePosition, 'current', options);
      router.pageCallback('afterIn', $newPage, $newNavbarInner, newPagePosition, 'current', options);
      if (options.reloadCurrent && options.clearPreviousHistory) { router.clearPreviousHistory(); }
      return router;
    }
    if (options.reloadPrevious) {
      router.allowPageChange = true;
      loadPageScript();
      return router;
    }

    // Before animation event
    router.pageCallback('beforeIn', $newPage, $newNavbarInner, 'next', 'current', options);
    router.pageCallback('beforeOut', $oldPage, $oldNavbarInner, 'current', 'previous', options);

    // Animation
    function afterAnimation() {
      var pageClasses = 'page-previous page-current page-next';
      var navbarClasses = 'navbar-previous navbar-current navbar-next';
      $newPage.removeClass(pageClasses).addClass('page-current').removeAttr('aria-hidden');
      $oldPage.removeClass(pageClasses).addClass('page-previous').attr('aria-hidden', 'true');
      if (dynamicNavbar) {
        $newNavbarInner.removeClass(navbarClasses).addClass('navbar-current').removeAttr('aria-hidden');
        $oldNavbarInner.removeClass(navbarClasses).addClass('navbar-previous').attr('aria-hidden', 'true');
      }
      // After animation event
      router.allowPageChange = true;
      router.pageCallback('afterIn', $newPage, $newNavbarInner, 'next', 'current', options);
      router.pageCallback('afterOut', $oldPage, $oldNavbarInner, 'current', 'previous', options);

      var keepOldPage = app.theme === 'ios' ? (router.params.preloadPreviousPage || router.params.iosSwipeBack) : router.params.preloadPreviousPage;
      if (!keepOldPage) {
        if ($newPage.hasClass('smart-select-page') || $newPage.hasClass('photo-browser-page') || $newPage.hasClass('autocomplete-page')) {
          keepOldPage = true;
        }
      }
      if (!keepOldPage) {
        if (router.params.stackPages) {
          $oldPage.addClass('stacked');
          if (separateNavbar) {
            $oldNavbarInner.addClass('stacked');
          }
        } else if (!($newPage.attr('data-name') && $newPage.attr('data-name') === 'smart-select-page')) {
          // Remove event
          router.pageCallback('beforeRemove', $oldPage, $oldNavbarInner, 'previous', undefined, options);
          router.removePage($oldPage);
          if (separateNavbar && $oldNavbarInner.length) {
            router.removeNavbar($oldNavbarInner);
          }
        }
      }
      if (options.clearPreviousHistory) { router.clearPreviousHistory(); }
      router.emit('routeChanged', router.currentRoute, router.previousRoute, router);

      if (router.params.pushState) {
        History.clearRouterQueue();
      }
      if (options.animate) {
        window.AnimateEnded = true;
        DealAnimateEnd();
      }
    }
    function setPositionClasses() {
      var pageClasses = 'page-previous page-current page-next';
      var navbarClasses = 'navbar-previous navbar-current navbar-next';
      $oldPage.removeClass(pageClasses).addClass('page-current').removeAttr('aria-hidden');
      $newPage.removeClass(pageClasses).addClass('page-next').removeAttr('aria-hidden');
      if (dynamicNavbar) {
        $oldNavbarInner.removeClass(navbarClasses).addClass('navbar-current').removeAttr('aria-hidden');
        $newNavbarInner.removeClass(navbarClasses).addClass('navbar-next').removeAttr('aria-hidden');
      }
    }


    if (options.animate) {
      var delay = router.app.theme === 'md' ? router.params.materialPageLoadDelay : router.params.iosPageLoadDelay;
      if (delay) {
        setTimeout(function () {
          setPositionClasses();
          router.animate($oldPage, $newPage, $oldNavbarInner, $newNavbarInner, 'forward', function () {
            afterAnimation();
          });
        }, delay);
      } else {
        setPositionClasses();
        router.animate($oldPage, $newPage, $oldNavbarInner, $newNavbarInner, 'forward', function () {
          afterAnimation();
        });
      }
    } else {
      afterAnimation();
    }
    return router;
  }
   
  function load(loadParams, loadOptions, ignorePageChange) {
    if ( loadParams === void 0 ) loadParams = {};
    if ( loadOptions === void 0 ) loadOptions = {};

    var router = this;
    if (!router.allowPageChange && !ignorePageChange) { return router; }
    var params = loadParams;
    var options = loadOptions;
    var url = params.url;
    var content = params.content;
    var el = params.el;
    var pageName = params.pageName;
    var template = params.template;
    var templateUrl = params.templateUrl;
    var component = params.component;
    var componentUrl = params.componentUrl;

    if (!options.reloadCurrent
      && options.route
      && options.route.route
      && options.route.route.parentPath
      && router.currentRoute.route
      && router.currentRoute.route.parentPath === options.route.route.parentPath) {
      // Do something nested
      if (options.route.url === router.url) {
        return false;
      }
      // Check for same params
      var sameParams = Object.keys(options.route.params).length === Object.keys(router.currentRoute.params).length;
      if (sameParams) {
        // Check for equal params name
        Object.keys(options.route.params).forEach(function (paramName) {
          if (
            !(paramName in router.currentRoute.params)
            || (router.currentRoute.params[paramName] !== options.route.params[paramName])
          ) {
            sameParams = false;
          }
        });
      }
      if (sameParams) {
        if (options.route.route.tab) {
          return router.tabLoad(options.route.route.tab, options);
        }
        return false;
      }
    }

    if (
      options.route
      && options.route.url
      && router.url === options.route.url
      && !(options.reloadCurrent || options.reloadPrevious)
      && !router.params.allowDuplicateUrls
    ) {
      router.allowPageChange = true;
      return false;
    }

    if (!options.route && url) {
      options.route = router.parseRouteUrl(url);
      Utils.extend(options.route, { route: { url: url, path: url } });
    }

    // Component Callbacks
    function resolve(pageEl, newOptions) {
      return router.forward(pageEl, Utils.extend(options, newOptions));
    }
    function reject() {
      router.allowPageChange = true;
      return router;
    }

    if (url || templateUrl || componentUrl) {
      router.allowPageChange = false;
    }

    // Proceed
    if (content) {
      router.forward(router.getPageEl(content), options);
    } else if (template || templateUrl) {
      // Parse template and send page element
      try {
        router.pageTemplateLoader(template, templateUrl, options, resolve, reject);
      } catch (err) {
        router.allowPageChange = true;
        throw err;
      }
    } else if (el) {
      // Load page from specified HTMLElement or by page name in pages container
      router.forward(router.getPageEl(el), options);
    } else if (pageName) {
      // Load page by page name in pages container
      router.forward(router.$el.children((".page[data-name=\"" + pageName + "\"]")).eq(0), options);
    } else if (component || componentUrl) {
      // Load from component (F7/Vue/React/...)
      try {
        router.pageComponentLoader(router.el, component, componentUrl, options, resolve, reject);
      } catch (err) {
        router.allowPageChange = true;
        throw err;
      }
    } else if (url) {
      // Load using XHR
        if (router.xhr) {
          router.xhr.abort();
          router.xhr = false;
        }
        router.forward(url, options);  
    }
    return router;
  }
  function navigate(navigateParams, navigateOptions) {
    if ( navigateOptions === void 0 ) navigateOptions = {};

    var router = this;
    var url;
    var createRoute;
    if (typeof navigateParams === 'string') {
      url = navigateParams;
    } else {
      url = navigateParams.url;
      createRoute = navigateParams.route;
    }
    var app = router.app;
    if (!router.view) {
      if (app.views.main) {
        app.views.main.router.navigate(url, navigateOptions);
      }
      return router;
    }
    if (url === '#' || url === '') {
      return router;
    }

    var navigateUrl = url.replace('./', '');
    if (navigateUrl[0] !== '/' && navigateUrl.indexOf('#') !== 0) {
      var currentPath = router.currentRoute.parentPath || router.currentRoute.path;
      navigateUrl = ((currentPath ? (currentPath + "/") : '/') + navigateUrl)
        .replace('///', '/')
        .replace('//', '/');
    }
    var route;
    if (createRoute) {
      route = Utils.extend(router.parseRouteUrl(navigateUrl), {
        route: Utils.extend({}, createRoute),
      });
    } else {
      route = router.findMatchingRoute(navigateUrl);
    }

    if (!route) {
      return router;
    }

    if (route.route.redirect) {
      return redirect.call(router, 'navigate', route, navigateOptions);
    }


    var options = {};
    if (route.route.options) {
      Utils.extend(options, route.route.options, navigateOptions, { route: route });
    } else {
      Utils.extend(options, navigateOptions, { route: route });
    }

    if (options && options.context) {
      route.context = options.context;
      options.route.context = options.context;
    }

    function resolve() {
      var routerLoaded = false;
      ('popup popover sheet loginScreen actions customModal').split(' ').forEach(function (modalLoadProp) {
        if (route.route[modalLoadProp] && !routerLoaded) {
          routerLoaded = true;
          router.modalLoad(modalLoadProp, route, options);
        }
      });
      ('url content component pageName el componentUrl template templateUrl').split(' ').forEach(function (pageLoadProp) {
        var obj;

        if (route.route[pageLoadProp] && !routerLoaded) {
          routerLoaded = true;
          router.load(( obj = {}, obj[pageLoadProp] = route.route[pageLoadProp], obj ), options);
        }
      });
      if (routerLoaded) { return; }
      // Async
      function asyncResolve(resolveParams, resolveOptions) {
        router.allowPageChange = false;
        var resolvedAsModal = false;
        if (resolveOptions && resolveOptions.context) {
          if (!route.context) { route.context = resolveOptions.context; }
          else { route.context = Utils.extend({}, route.context, resolveOptions.context); }
          options.route.context = route.context;
        }
        ('popup popover sheet loginScreen actions customModal').split(' ').forEach(function (modalLoadProp) {
          if (resolveParams[modalLoadProp]) {
            resolvedAsModal = true;
            var modalRoute = Utils.extend({}, route, { route: resolveParams });
            router.allowPageChange = true;
            router.modalLoad(modalLoadProp, modalRoute, Utils.extend(options, resolveOptions));
          }
        });
        if (resolvedAsModal) { return; }
        router.load(resolveParams, Utils.extend(options, resolveOptions), true);
      }
      function asyncReject() {
        router.allowPageChange = true;
      }
      if (route.route.async) {
        router.allowPageChange = false;

        route.route.async.call(router, route, router.currentRoute, asyncResolve, asyncReject);
      }
    }
    function reject() {
      router.allowPageChange = true;
    }

    processRouteQueue.call(
      router,
      route,
      router.currentRoute,
      function () {
        resolve();
      },
      function () {
        reject();
      }
    );

    // Return Router
    return router;
  }
  window.eleValue = function (eleID) {
    var ele = $$1('.page-current').find('#' + eleID);
    if (ele.length > 0) { return ele[0]; }
  };

  function tabLoad(tabRoute, loadOptions) {
    if ( loadOptions === void 0 ) loadOptions = {};

    var router = this;
    var options = Utils.extend({
      animate: router.params.animate,
      pushState: true,
      history: true,
      parentPageEl: null,
      preload: false,
      on: {},
    }, loadOptions);

    var currentRoute;
    var previousRoute;
    if (options.route) {
      // Set Route
      if (!options.preload && options.route !== router.currentRoute) {
        previousRoute = router.previousRoute;
        router.currentRoute = options.route;
      }
      if (options.preload) {
        currentRoute = options.route;
        previousRoute = router.currentRoute;
      } else {
        currentRoute = router.currentRoute;
        if (!previousRoute) { previousRoute = router.previousRoute; }
      }

      // Update Browser History
      if (router.params.pushState && options.pushState && !options.reloadPrevious) {
        History.replace(
          router.view.id,
          {
            url: options.route.url,
          },
          (router.params.pushStateRoot || '') + router.params.pushStateSeparator + options.route.url
        );
      }

      // Update Router History
      if (options.history) {
        router.history[Math.max(router.history.length - 1, 0)] = options.route.url;
        router.saveHistory();
      }
    }

    // Show Tab
    var $parentPageEl = $$1(options.parentPageEl || router.currentPageEl);
    var tabEl;
    if ($parentPageEl.length && $parentPageEl.find(("#" + (tabRoute.id))).length) {
      tabEl = $parentPageEl.find(("#" + (tabRoute.id))).eq(0);
    } else if (router.view.selector) {
      tabEl = (router.view.selector) + " #" + (tabRoute.id);
    } else {
      tabEl = "#" + (tabRoute.id);
    }
    var tabShowResult = router.app.tab.show({
      tabEl: tabEl,
      animate: options.animate,
      tabRoute: options.route,
    });

    var $newTabEl = tabShowResult.$newTabEl;
    var $oldTabEl = tabShowResult.$oldTabEl;
    var animated = tabShowResult.animated;
    var onTabsChanged = tabShowResult.onTabsChanged;

    if ($newTabEl && $newTabEl.parents('.page').length > 0 && options.route) {
      var tabParentPageData = $newTabEl.parents('.page')[0].f7Page;
      if (tabParentPageData && options.route) {
        tabParentPageData.route = options.route;
      }
    }

    // Tab Content Loaded
    function onTabLoaded(contentEl) {
      // Remove theme elements
      router.removeThemeElements($newTabEl);

      var tabEventTarget = $newTabEl;
      if (typeof contentEl !== 'string') { tabEventTarget = $$1(contentEl); }

      tabEventTarget.trigger('tab:init tab:mounted', tabRoute);
      router.emit('tabInit tabMounted', $newTabEl[0], tabRoute);

      if ($oldTabEl) {
        if (animated) {
          onTabsChanged(function () {
            if ($oldTabEl.length) {
              router.emit('routeChanged', router.currentRoute, router.previousRoute, router);
            }
            if (router.params.unloadTabContent) {
              router.tabRemove($oldTabEl, $newTabEl, tabRoute);
            }
          });
        } else {
          if ($oldTabEl.length) {
            router.emit('routeChanged', router.currentRoute, router.previousRoute, router);
          }
          if (router.params.unloadTabContent) {
            router.tabRemove($oldTabEl, $newTabEl, tabRoute);
          }
        }
      }
    }
    if (!router.params.unloadTabContent) {

      var pgName = loadOptions.route.route.tab.id;  //by xiang 20180921
      var tbInfo = null;
      if (window.tabInfo) {
        tbInfo = window.tabInfo[pgName];
      }
      if (tbInfo && tbInfo.f7RouterTabLoaded) { 
        if ($oldTabEl && $oldTabEl.length) {
          if (animated) {
            onTabsChanged(function () {
              router.emit('routeChanged', router.currentRoute, router.previousRoute, router);
            });
          } else {
            router.emit('routeChanged', router.currentRoute, router.previousRoute, router);
          }
        }
        var pgName = loadOptions.route.route.tab.id;  //by xiang 20180921
        var pg = window[pgName];
        if (pg) {
          window.me = pg;
          if (pg.onPageShow) {
            pg.onPageShow();//by xiang 
          }
        }
        return router;
      }
    }

    // Load Tab Content
    function loadTab(loadTabParams, loadTabOptions) {
      // Load Tab Props
      var url = loadTabParams.url;
      var content = loadTabParams.content;
      var el = loadTabParams.el;
      var template = loadTabParams.template;
      var templateUrl = loadTabParams.templateUrl;
      var component = loadTabParams.component;
      var componentUrl = loadTabParams.componentUrl;
      // Component/Template Callbacks
      function resolve(contentEl) {
        router.allowPageChange = true;
        if (!contentEl) { return; }
        var pgName = loadTabOptions.route.route.tab.id;
        if (typeof contentEl === 'string') {
          var pageVar = router.getPageEl(contentEl); //by xiang 20180921 
          if (pageVar.page) {
            $newTabEl.html(pageVar.page[0].innerHTML);
          } else {
            $newTabEl.html(contentEl);
          } 
          window.loadScripts(pgName, pageVar.scripts, pageVar.links, function () { //by xiang
            var pg = window[pgName];
            if (pg) {
              window.me = pg;
              if (pg.onPageLoad) {
                pg.onPageLoad(); 
              }
              if (pg.onPageShow) {
                pg.onPageShow();
              }
            }
          });
        } else {
          $newTabEl.html('');
          if (contentEl.f7Component) {
            contentEl.f7Component.$mount(function (componentEl) {
              $newTabEl.append(componentEl);
            });
          } else {
            $newTabEl.append(contentEl);
          }
        }
        if (!router.params.unloadTabContent) {
            var tbInfo = null; if (!window.tabInfo) { window.tabInfo = {}; }
            tbInfo = window.tabInfo;
            if (!tbInfo[pgName]) { tabInfo[pgName] = {}; }
            tabInfo[pgName].f7RouterTabLoaded = true; 
        }
        onTabLoaded(contentEl);
      }
      function reject() {
        router.allowPageChange = true;
        return router;
      }
     
      if (content) {
        resolve(content);
      } else if (template || templateUrl) {
        try {
          router.tabTemplateLoader(template, templateUrl, loadTabOptions, resolve, reject);
        } catch (err) {
          router.allowPageChange = true;
          throw err;
        }
      } else if (el) {
        resolve(el);
      } else if (component || componentUrl) {
        // Load from component (F7/Vue/React/...)
        try {
          router.tabComponentLoader($newTabEl[0], component, componentUrl, loadTabOptions, resolve, reject);
        } catch (err) {
          router.allowPageChange = true;
          throw err;
        }
      } else if (url) {
        // Load using XHR
        if (router.xhr) {
          router.xhr.abort();
          router.xhr = false;
        }
       var loadHtml = "<div class=\"page\">\n                 <div class=\"page-content\" style=\"text-align:center;line-height:calc(100vh - 50px);\">\n                      <span class=\"LoadMsg\">加载中...</span>\n                 </div> \n              </div>";

        $newTabEl.html(loadHtml);
        var loadRealTab = function () {
             var contentDiv = $newTabEl.find(".page-content");
             $$('.LoadMsg').html('加载中...');
             contentDiv.off("touchstart", loadRealTab);
          
                 var rqOK = false; var rqErr = '';
                 router.xhrRequest(url, loadTabOptions)
                   .then(function (tabContent) {
                     resolve(tabContent);
                     rqOK = true;
                   })
                   .catch(function (err) {
                     rqErr = err;
                     router.allowPageChange = true;
                   });
                 
                 var tmStart = new Date();
                 var it = setInterval(function () {
                   if (rqOK) {
                     clearInterval(it);
                   }
                   else if (rqErr) {
                     clearInterval(it);
                     $$('.LoadMsg').html('网络出错了，轻触重试');
                     contentDiv.on("touchstart", loadRealTab);
                   }
                   else if (new Date() - tmStart > 9000) {
                     clearInterval(it);
                     $$('.LoadMsg').html('连接超时，轻触重试');
                     contentDiv.on("touchstart", loadRealTab);
                   }
                 }, 20);
        };
        loadRealTab();
      }
    }

    ('url content component el componentUrl template templateUrl').split(' ').forEach(function (tabLoadProp) {
      var obj;

      if (tabRoute[tabLoadProp]) {
        loadTab(( obj = {}, obj[tabLoadProp] = tabRoute[tabLoadProp], obj ), options);
      }
    });

    // Async
    function asyncResolve(resolveParams, resolveOptions) {
      loadTab(resolveParams, Utils.extend(options, resolveOptions));
    }
    function asyncReject() {
      router.allowPageChange = true;
    }
    if (tabRoute.async) {
      tabRoute.async.call(router, currentRoute, previousRoute, asyncResolve, asyncReject);
    }
    return router;
  }
  function tabRemove($oldTabEl, $newTabEl, tabRoute) {
    var router = this;
    var hasTabComponentChild;
    $oldTabEl.children().each(function (index, tabChild) {
      if (tabChild.f7Component) {
        hasTabComponentChild = true;
        $$1(tabChild).trigger('tab:beforeremove', tabRoute);
        tabChild.f7Component.$destroy();
      }
    });
    if (!hasTabComponentChild) {
      $oldTabEl.trigger('tab:beforeremove', tabRoute);
    }
    router.emit('tabBeforeRemove', $oldTabEl[0], $newTabEl[0], tabRoute);
    router.removeTabContent($oldTabEl[0], tabRoute);
  }

  function modalLoad(modalType, route, loadOptions) {
    if ( loadOptions === void 0 ) loadOptions = {};

    var router = this;
    var app = router.app;

    var options = Utils.extend({
      animate: router.params.animate,
      pushState: true,
      history: true,
      on: {},
    }, loadOptions);

    var modalParams = Utils.extend({}, route.route[modalType]);
    var modalRoute = route.route;

    function onModalLoaded() {
      // Create Modal
      var modal = app[modalType].create(modalParams);
      modalRoute.modalInstance = modal;

      var hasEl = modal.el;

      function closeOnSwipeBack() {
        modal.close();
      }
      modal.on('modalOpen', function () {
        if (!hasEl) {
          // Remove theme elements
          router.removeThemeElements(modal.el);

          // Emit events
          modal.$el.trigger(((modalType.toLowerCase()) + ":init " + (modalType.toLowerCase()) + ":mounted"), route, modal);
          router.emit(("modalInit " + modalType + "Init " + modalType + "Mounted"), modal.el, route, modal);
        }
        router.once('swipeBackMove', closeOnSwipeBack);
      });
      modal.on('modalClose', function () {
        router.off('swipeBackMove', closeOnSwipeBack);
        if (!modal.closeByRouter) {
          router.back();
        }
      });

      modal.on('modalClosed', function () {
        modal.$el.trigger(((modalType.toLowerCase()) + ":beforeremove"), route, modal);
        modal.emit(("modalBeforeRemove " + modalType + "BeforeRemove"), modal.el, route, modal);
        var modalComponent = modal.el.f7Component;
        if (modalComponent) {
          modalComponent.$destroy();
        }
        Utils.nextTick(function () {
          if (modalComponent || modalParams.component) {
            router.removeModal(modal.el);
          }
          modal.destroy();
          delete modalRoute.modalInstance;
        });
      });

      if (options.route) {
        // Update Browser History
        if (router.params.pushState && options.pushState) {
          History.push(
            router.view.id,
            {
              url: options.route.url,
              modal: modalType,
            },
            (router.params.pushStateRoot || '') + router.params.pushStateSeparator + options.route.url
          );
        }

        // Set Route
        if (options.route !== router.currentRoute) {
          router.currentRoute = Utils.extend(options.route, { modal: modal });
        }

        // Update Router History
        if (options.history) {
          router.history.push(options.route.url);
          router.saveHistory();
        }
      }

      if (hasEl) {
        // Remove theme elements
        router.removeThemeElements(modal.el);

        // Emit events
        modal.$el.trigger(((modalType.toLowerCase()) + ":init " + (modalType.toLowerCase()) + ":mounted"), route, modal);
        router.emit(("modalInit " + modalType + "Init " + modalType + "Mounted"), modal.el, route, modal);
      }

      // Open
      modal.open();
    }

    // Load Modal Content
    function loadModal(loadModalParams, loadModalOptions) {
      // Load Modal Props
      var url = loadModalParams.url;
      var content = loadModalParams.content;
      var template = loadModalParams.template;
      var templateUrl = loadModalParams.templateUrl;
      var component = loadModalParams.component;
      var componentUrl = loadModalParams.componentUrl;

      // Component/Template Callbacks
      function resolve(contentEl) {
        if (contentEl) {
          if (typeof contentEl === 'string') {
            modalParams.content = contentEl;
          } else if (contentEl.f7Component) {
            contentEl.f7Component.$mount(function (componentEl) {
              modalParams.el = componentEl;
              app.root.append(componentEl);
            });
          } else {
            modalParams.el = contentEl;
          }
          onModalLoaded();
        }
      }
      function reject() {
        router.allowPageChange = true;
        return router;
      }

      if (content) {
        resolve(content);
      } else if (template || templateUrl) {
        try {
          router.modalTemplateLoader(template, templateUrl, loadModalOptions, resolve, reject);
        } catch (err) {
          router.allowPageChange = true;
          throw err;
        }
      } else if (component || componentUrl) {
        // Load from component (F7/Vue/React/...)
        try {
          router.modalComponentLoader(app.root[0], component, componentUrl, loadModalOptions, resolve, reject);
        } catch (err) {
          router.allowPageChange = true;
          throw err;
        }
      } else if (url) {
        // Load using XHR
        if (router.xhr) {
          router.xhr.abort();
          router.xhr = false;
        }
        router.xhrRequest(url, loadModalOptions)
          .then(function (modalContent) {
            modalParams.content = modalContent;
            onModalLoaded();
          })
          .catch(function () {
            router.allowPageChange = true;
          });
      } else {
        onModalLoaded();
      }
    }

    var foundLoadProp;
    ('url content component el componentUrl template templateUrl').split(' ').forEach(function (modalLoadProp) {
      var obj;

      if (modalParams[modalLoadProp] && !foundLoadProp) {
        foundLoadProp = true;
        loadModal(( obj = {}, obj[modalLoadProp] = modalParams[modalLoadProp], obj ), options);
      }
    });
    if (!foundLoadProp && modalType === 'actions') {
      onModalLoaded();
    }

    // Async
    function asyncResolve(resolveParams, resolveOptions) {
      loadModal(resolveParams, Utils.extend(options, resolveOptions));
    }
    function asyncReject() {
      router.allowPageChange = true;
    }
    if (modalParams.async) {
      modalParams.async.call(router, options.route, router.currentRoute, asyncResolve, asyncReject);
    }
    return router;
  }
  function modalRemove(modal) {
    Utils.extend(modal, { closeByRouter: true });
    modal.close();
  }

  function backward(el, backwardOptions) {
    var router = this;
    var app = router.app;
    var view = router.view;

    var options = Utils.extend({
      animate: router.params.animate,
      pushState: true,
    }, backwardOptions);

    var dynamicNavbar = router.dynamicNavbar;
    var separateNavbar = router.separateNavbar;

    var $newPage = $$1(el);
    var $oldPage = router.$el.children('.page-current');

    if ($newPage.length) {
      // Remove theme elements
      router.removeThemeElements($newPage);
    }

    var $navbarEl;
    var $newNavbarInner;
    var $oldNavbarInner;

    if (dynamicNavbar) {
      $newNavbarInner = $newPage.children('.navbar').children('.navbar-inner');
      if (separateNavbar) {
        $navbarEl = router.$navbarEl;
        if ($newNavbarInner.length > 0) {
          $newPage.children('.navbar').remove();
        }
        if ($newNavbarInner.length === 0 && $newPage[0].f7Page) {
          // Try from pageData
          $newNavbarInner = $newPage[0].f7Page.$navbarEl;
        }
        $oldNavbarInner = $navbarEl.find('.navbar-current');
      } else {
        $oldNavbarInner = $oldPage.children('.navbar').children('.navbar-inner');
      }
    }

    router.allowPageChange = false;
    if ($newPage.length === 0 || $oldPage.length === 0) {
      router.allowPageChange = true;
      return router;
    }

    // Remove theme elements
    router.removeThemeElements($newPage);

    // New Page
    $newPage
      .addClass('page-previous')
      .removeClass('stacked')
      .removeAttr('aria-hidden');

    if (dynamicNavbar && $newNavbarInner.length > 0) {
      $newNavbarInner
        .addClass('navbar-previous')
        .removeClass('stacked')
        .removeAttr('aria-hidden');
    }


    // Remove previous page in case of "forced"
    var backIndex;
    if (options.force) {
      if ($oldPage.prev('.page-previous:not(.stacked)').length > 0 || $oldPage.prev('.page-previous').length === 0) {
        if (router.history.indexOf(options.route.url) >= 0) {
          backIndex = router.history.length - router.history.indexOf(options.route.url) - 1;
          router.history = router.history.slice(0, router.history.indexOf(options.route.url) + 2);
          view.history = router.history;
        } else if (router.history[[router.history.length - 2]]) {
          router.history[router.history.length - 2] = options.route.url;
        } else {
          router.history.unshift(router.url);
        }

        if (backIndex && router.params.stackPages) {
          $oldPage.prevAll('.page-previous').each(function (index, pageToRemove) {
            var $pageToRemove = $$1(pageToRemove);
            var $navbarToRemove;
            if (separateNavbar) {
              // $navbarToRemove = $oldNavbarInner.prevAll('.navbar-previous').eq(index);
              $navbarToRemove = $$1(app.navbar.getElByPage($pageToRemove));
            }
            if ($pageToRemove[0] !== $newPage[0] && $pageToRemove.index() > $newPage.index()) {
              if (router.initialPages.indexOf($pageToRemove[0]) >= 0) {
                $pageToRemove.addClass('stacked');
                if (separateNavbar) {
                  $navbarToRemove.addClass('stacked');
                }
              } else {
                router.pageCallback('beforeRemove', $pageToRemove, $navbarToRemove, 'previous', undefined, options);
                router.removePage($pageToRemove);
                if (separateNavbar && $navbarToRemove.length > 0) {
                  router.removeNavbar($navbarToRemove);
                }
              }
            }
          });
        } else {
          var $pageToRemove = $oldPage.prev('.page-previous:not(.stacked)');
          var $navbarToRemove;
          if (separateNavbar) {
            // $navbarToRemove = $oldNavbarInner.prev('.navbar-inner:not(.stacked)');
            $navbarToRemove = $$1(app.navbar.getElByPage($pageToRemove));
          }
          if (router.params.stackPages && router.initialPages.indexOf($pageToRemove[0]) >= 0) {
            $pageToRemove.addClass('stacked');
            $navbarToRemove.addClass('stacked');
          } else if ($pageToRemove.length > 0) {
            router.pageCallback('beforeRemove', $pageToRemove, $navbarToRemove, 'previous', undefined, options);
            router.removePage($pageToRemove);
            if (separateNavbar && $navbarToRemove.length) {
              router.removeNavbar($navbarToRemove);
            }
          }
        }
      }
    }

    // Insert new page
    var newPageInDom = $newPage.parents(doc).length > 0;
    var f7Component = $newPage[0].f7Component;

    function insertPage() {
      if ($newPage.next($oldPage).length === 0) {
        if (!newPageInDom && f7Component) {
          f7Component.$mount(function (componentEl) {
            $$1(componentEl).insertBefore($oldPage);
          });
        } else {
          $newPage.insertBefore($oldPage);
        }
      }
      if (separateNavbar && $newNavbarInner.length) {
        $newNavbarInner.insertBefore($oldNavbarInner);
        if ($oldNavbarInner.length > 0) {
          $newNavbarInner.insertBefore($oldNavbarInner);
        } else {
          if (!router.$navbarEl.parents(doc).length) {
            router.$el.prepend(router.$navbarEl);
          }
          $navbarEl.append($newNavbarInner);
        }
      }
      if (!newPageInDom) {
        router.pageCallback('mounted', $newPage, $newNavbarInner, 'previous', 'current', options, $oldPage);
      }
    }

    if (options.preload) {
      // Insert Page
      insertPage();
      // Tab route
      if (options.route.route.tab) {
        router.tabLoad(options.route.route.tab, Utils.extend({}, options, {
          history: false,
          pushState: false,
          preload: true,
        }));
      }
      // Page init and before init events
      router.pageCallback('init', $newPage, $newNavbarInner, 'previous', 'current', options, $oldPage);
      if ($newPage.prevAll('.page-previous:not(.stacked)').length > 0) {
        $newPage.prevAll('.page-previous:not(.stacked)').each(function (index, pageToRemove) {
          var $pageToRemove = $$1(pageToRemove);
          var $navbarToRemove;
          if (separateNavbar) {
            // $navbarToRemove = $newNavbarInner.prevAll('.navbar-previous:not(.stacked)').eq(index);
            $navbarToRemove = $$1(app.navbar.getElByPage($pageToRemove));
          }
          if (router.params.stackPages && router.initialPages.indexOf(pageToRemove) >= 0) {
            $pageToRemove.addClass('stacked');
            if (separateNavbar) {
              $navbarToRemove.addClass('stacked');
            }
          } else {
            router.pageCallback('beforeRemove', $pageToRemove, $navbarToRemove, 'previous', undefined);
            router.removePage($pageToRemove);
            if (separateNavbar && $navbarToRemove.length) {
              router.removeNavbar($navbarToRemove);
            }
          }
        });
      }
      router.allowPageChange = true;
      return router;
    }

    // History State
    if (!(Device.ie || Device.edge)) {
      if (router.params.pushState && options.pushState) {
        if (backIndex) { History.go(-backIndex); }
        else { History.back(); }
      }
    }

    // Update History
    if (router.history.length === 1) {
      router.history.unshift(router.url);
    }
    router.history.pop();
    router.saveHistory();

    // Current Page & Navbar
    router.currentPageEl = $newPage[0];
    if (dynamicNavbar && $newNavbarInner.length) {
      router.currentNavbarEl = $newNavbarInner[0];
    } else {
      delete router.currentNavbarEl;
    }

    // Current Route
    router.currentRoute = options.route;

    // History State
    if (Device.ie || Device.edge) {
      if (router.params.pushState && options.pushState) {
        if (backIndex) { History.go(-backIndex); }
        else { History.back(); }
      }
    }

    // Insert Page
    insertPage();

    // Load Tab
    if (options.route.route.tab) {
      router.tabLoad(options.route.route.tab, Utils.extend({}, options, {
        history: false,
        pushState: false,
      }));
    }

    // Page init and before init events
    router.pageCallback('init', $newPage, $newNavbarInner, 'previous', 'current', options, $oldPage);

    // Before animation callback
    router.pageCallback('beforeIn', $newPage, $newNavbarInner, 'previous', 'current', options);
    router.pageCallback('beforeOut', $oldPage, $oldNavbarInner, 'current', 'next', options);

    // Animation
    function afterAnimation() {
      // Set classes
      var pageClasses = 'page-previous page-current page-next';
      var navbarClasses = 'navbar-previous navbar-current navbar-next';
      $newPage.removeClass(pageClasses).addClass('page-current').removeAttr('aria-hidden');
      $oldPage.removeClass(pageClasses).addClass('page-next').attr('aria-hidden', 'true');
      if (dynamicNavbar) {
        $newNavbarInner.removeClass(navbarClasses).addClass('navbar-current').removeAttr('aria-hidden');
        $oldNavbarInner.removeClass(navbarClasses).addClass('navbar-next').attr('aria-hidden', 'true');
      }

      // After animation event
      router.pageCallback('afterIn', $newPage, $newNavbarInner, 'previous', 'current', options);
      router.pageCallback('afterOut', $oldPage, $oldNavbarInner, 'current', 'next', options);

      // Remove Old Page
      if (router.params.stackPages && router.initialPages.indexOf($oldPage[0]) >= 0) {
        $oldPage.addClass('stacked');
        if (separateNavbar) {
          $oldNavbarInner.addClass('stacked');
        }
      } else {
        router.pageCallback('beforeRemove', $oldPage, $oldNavbarInner, 'next', undefined, options);
        router.removePage($oldPage);
        if (separateNavbar && $oldNavbarInner.length) {
          router.removeNavbar($oldNavbarInner);
        }
      }

      router.allowPageChange = true;
      router.emit('routeChanged', router.currentRoute, router.previousRoute, router);

      // Preload previous page   commentd by xiang to avoid backing twice
      /*const preloadPreviousPage = app.theme === 'ios' ? (router.params.preloadPreviousPage || router.params.iosSwipeBack) : router.params.preloadPreviousPage;
      if (preloadPreviousPage && router.history[router.history.length - 2]) {
        router.back(router.history[router.history.length - 2], { preload: true });
      }*/
      if (router.params.pushState) {
        History.clearRouterQueue();
      }
    }

    function setPositionClasses() {
      var pageClasses = 'page-previous page-current page-next';
      var navbarClasses = 'navbar-previous navbar-current navbar-next';
      $oldPage.removeClass(pageClasses).addClass('page-current');
      $newPage.removeClass(pageClasses).addClass('page-previous').removeAttr('aria-hidden');
      if (dynamicNavbar) {
        $oldNavbarInner.removeClass(navbarClasses).addClass('navbar-current');
        $newNavbarInner.removeClass(navbarClasses).addClass('navbar-previous').removeAttr('aria-hidden');
      }
    }

    if (options.animate) {
      setPositionClasses();
      router.animate($oldPage, $newPage, $oldNavbarInner, $newNavbarInner, 'backward', function () {
        afterAnimation();
      });
    } else {
      afterAnimation();
    }

    return router;
  }
  function loadBack(backParams, backOptions, ignorePageChange) {
    var router = this;

    if (!router.allowPageChange && !ignorePageChange) { return router; }
    var params = backParams;
    var options = backOptions;
    var url = params.url;
    var content = params.content;
    var el = params.el;
    var pageName = params.pageName;
    var template = params.template;
    var templateUrl = params.templateUrl;
    var component = params.component;
    var componentUrl = params.componentUrl;

    if (
      options.route.url
      && router.url === options.route.url
      && !(options.reloadCurrent || options.reloadPrevious)
      && !router.params.allowDuplicateUrls
    ) {
      return false;
    }

    if (!options.route && url) {
      options.route = router.parseRouteUrl(url);
    }

    // Component Callbacks
    function resolve(pageEl, newOptions) {
      return router.backward(pageEl, Utils.extend(options, newOptions));
    }
    function reject() {
      router.allowPageChange = true;
      return router;
    }

    if (url || templateUrl || componentUrl) {
      router.allowPageChange = false;
    }

    // Proceed
    if (content) {
      router.backward(router.getPageEl(content), options);
    } else if (template || templateUrl) {
      // Parse template and send page element
      try {
        router.pageTemplateLoader(template, templateUrl, options, resolve, reject);
      } catch (err) {
        router.allowPageChange = true;
        throw err;
      }
    } else if (el) {
      // Load page from specified HTMLElement or by page name in pages container
      router.backward(router.getPageEl(el), options);
    } else if (pageName) {
      // Load page by page name in pages container
      router.backward(router.$el.children((".page[data-name=\"" + pageName + "\"]")).eq(0), options);
    } else if (component || componentUrl) {
      // Load from component (F7/Vue/React/...)
      try {
        router.pageComponentLoader(router.el, component, componentUrl, options, resolve, reject);
      } catch (err) {
        router.allowPageChange = true;
        throw err;
      }
    } else if (url) {
      // Load using XHR
      if (router.xhr) {
        router.xhr.abort();
        router.xhr = false;
      }
      router.xhrRequest(url, options)
        .then(function (pageContent) {
          router.backward(router.getPageEl(pageContent), options);
        })
        .catch(function () {
          router.allowPageChange = true;
        });
    }
    return router;
  }
  function unloadScripts(pageName) {
    var $hd = $$1(doc.head);
    var oldScripts = $hd.find("script");
    var removeNodes = [];
    for (var i = 0; i < oldScripts.length; i++) {
      var node = oldScripts[i];
      var page = node.getAttribute("page");
      if (page && page == pageName) {
        removeNodes.push(node);
      }
    }
    var oldLinks = $hd.find("link");
    for (var i = 0; i < oldLinks.length; i++) {
      var node = oldLinks[i];
      var page = node.getAttribute("page");
      if (page && page == pageName) {
        removeNodes.push(node);
      } 
    }
    for (var i = removeNodes.length - 1; i >= 0; i--) {
      var node = removeNodes[i];
      doc.head.removeChild(node);
    }
  }
  function back() {
    var ref;

    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];
    var navigateUrl;
    var navigateOptions;
    if (typeof args[0] === 'object') {
      navigateOptions = args[0] || {};
    } else {
      navigateUrl = args[0];
      navigateOptions = args[1] || {};
    }

    var router = this;
    var app = router.app;
    if (!router.view) {
      (ref = app.views.main.router).back.apply(ref, args);
      return router;
    }

    var currentRouteIsModal = router.currentRoute.modal;
    var modalType;
    if (!currentRouteIsModal) {
      ('popup popover sheet loginScreen actions customModal').split(' ').forEach(function (modalLoadProp) {
        if (router.currentRoute.route[modalLoadProp]) {
          currentRouteIsModal = true;
          modalType = modalLoadProp;
        }
      });
    }
    if (currentRouteIsModal) {
      var modalToClose = router.currentRoute.modal
                           || router.currentRoute.route.modalInstance
                           || app[modalType].get();
      var previousUrl = router.history[router.history.length - 2];
      var previousRoute = router.findMatchingRoute(previousUrl);
      if (!previousRoute && previousUrl) {
        previousRoute = {
          url: previousUrl,
          path: previousUrl.split('?')[0],
          query: Utils.parseUrlQuery(previousUrl),
          route: {
            path: previousUrl.split('?')[0],
            url: previousUrl,
          },
        };
      }
      if (!previousRoute || !modalToClose) {
        return router;
      }
      if (router.params.pushState && navigateOptions.pushState !== false) {
        History.back();
      }
      router.currentRoute = previousRoute;
      router.history.pop();
      router.saveHistory();
      router.modalRemove(modalToClose);
      return router;
    }
    var $previousPage = router.$el.children('.page-current').prevAll('.page-previous').eq(0);
    if (!navigateOptions.force && $previousPage.length > 0) {
      if (router.params.pushState
        && $previousPage[0].f7Page
        && router.history[router.history.length - 2] !== $previousPage[0].f7Page.route.url
      ) {
        router.back(
          router.history[router.history.length - 2],
          Utils.extend(navigateOptions, { force: true })
        );
        return router;
      }
      var curName = router.currentRoute.name;//by xiang
      var previousPageRoute = $previousPage[0].f7Page.route;
      processRouteQueue.call(
        router,
        previousPageRoute,
        router.currentRoute,
        function () {
          router.loadBack({ el: $previousPage }, Utils.extend(navigateOptions, {
            route: previousPageRoute,
          }));
        },
        function () {}
      );
      unloadScripts(curName);
      var preName = router.currentRoute.name;
      if (router.currentRoute.route && router.currentRoute.route.tab) {
         preName = router.currentRoute.route.tab.id;
      }
      if (!preName) { preName = router.currentRoute.path.replace('/', ''); }
      var pg = window[preName]; 
      if (pg) {
        window.me = pg;
        window.curPageName = preName;
        if (pg.onPageBack) {
           pg.onPageBack(curName, navigateOptions);//by xiang
        }
      } 
      return router;
    }

    // Navigate URL
    if (navigateUrl === '#') {
      navigateUrl = undefined;
    }
    if (navigateUrl && navigateUrl[0] !== '/' && navigateUrl.indexOf('#') !== 0) {
      navigateUrl = ((router.path || '/') + navigateUrl).replace('//', '/');
    }
    if (!navigateUrl && router.history.length > 1) {
      navigateUrl = router.history[router.history.length - 2];
    }

    // Find route to load
    var route = router.findMatchingRoute(navigateUrl);
    if (!route) {
      if (navigateUrl) {
        route = {
          url: navigateUrl,
          path: navigateUrl.split('?')[0],
          query: Utils.parseUrlQuery(navigateUrl),
          route: {
            path: navigateUrl.split('?')[0],
            url: navigateUrl,
          },
        };
      }
    }
    if (!route) {
      return router;
    }

    if (route.route.redirect) {
      return redirect.call(router, 'back', route, navigateOptions);
    }

    var options = {};
    if (route.route.options) {
      Utils.extend(options, route.route.options, navigateOptions, { route: route });
    } else {
      Utils.extend(options, navigateOptions, { route: route });
    }

    if (options && options.context) {
      route.context = options.context;
      options.route.context = options.context;
    }

    var backForceLoaded;
    if (options.force && router.params.stackPages) {
      router.$el.children('.page-previous.stacked').each(function (index, pageEl) {
        if (pageEl.f7Page && pageEl.f7Page.route && pageEl.f7Page.route.url === route.url) {
          backForceLoaded = true;
          router.loadBack({ el: pageEl }, options);
        }
      });
      if (backForceLoaded) {
        return router;
      }
    }
    function resolve() {
      var routerLoaded = false;
      ('url content component pageName el componentUrl template templateUrl').split(' ').forEach(function (pageLoadProp) {
        var obj;

        if (route.route[pageLoadProp] && !routerLoaded) {
          routerLoaded = true;
          router.loadBack(( obj = {}, obj[pageLoadProp] = route.route[pageLoadProp], obj ), options);
        }
      });
      if (routerLoaded) { return; }
      // Async
      function asyncResolve(resolveParams, resolveOptions) {
        router.allowPageChange = false;
        if (resolveOptions && resolveOptions.context) {
          if (!route.context) { route.context = resolveOptions.context; }
          else { route.context = Utils.extend({}, route.context, resolveOptions.context); }
          options.route.context = route.context;
        }
        router.loadBack(resolveParams, Utils.extend(options, resolveOptions), true);
      }
      function asyncReject() {
        router.allowPageChange = true;
      }
      if (route.route.async) {
        router.allowPageChange = false;

        route.route.async.call(router, route, router.currentRoute, asyncResolve, asyncReject);
      }
    }
    function reject() {
      router.allowPageChange = true;
    }

    if (options.preload) {
      resolve();
    } else {
      processRouteQueue.call(
        router,
        route,
        router.currentRoute,
        function () {
          resolve();
        },
        function () {
          reject();
        }
      );
    }

    // Return Router
    return router;
  }

  function clearPreviousHistory() {
    var router = this;
    var app = router.app;
    var separateNavbar = router.separateNavbar;
    var url = router.history[router.history.length - 1];

    var $currentPageEl = $$1(router.currentPageEl);

    var $pagesToRemove = router.$el
      .children('.page:not(.stacked)')
      .filter(function (index, pageInView) { return pageInView !== $currentPageEl[0]; });

    $pagesToRemove.each(function (index, pageEl) {
      var $oldPageEl = $$1(pageEl);
      var $oldNavbarInnerEl = $$1(app.navbar.getElByPage($oldPageEl));
      if (router.params.stackPages && router.initialPages.indexOf($oldPageEl[0]) >= 0) {
        $oldPageEl.addClass('stacked');
        if (separateNavbar) {
          $oldNavbarInnerEl.addClass('stacked');
        }
      } else {
        // Page remove event
        router.pageCallback('beforeRemove', $oldPageEl, $oldNavbarInnerEl, 'previous', undefined, {});
        router.removePage($oldPageEl);
        if (separateNavbar && $oldNavbarInnerEl.length) {
          router.removeNavbar($oldNavbarInnerEl);
        }
      }
    });

    router.history = [url];
    router.view.history = [url];
    router.saveHistory();
  }

  var Router = (function (Framework7Class$$1) {
    function Router(app, view) {
      Framework7Class$$1.call(this, {}, [typeof view === 'undefined' ? app : view]);
      var router = this;

      // Is App Router
      router.isAppRouter = typeof view === 'undefined';

      if (router.isAppRouter) {
        // App Router
        Utils.extend(false, router, {
          app: app,
          params: app.params.view,
          routes: app.routes || [],
          cache: app.cache,
        });
      } else {
        // View Router
        Utils.extend(false, router, {
          app: app,
          view: view,
          viewId: view.id,
          params: view.params,
          routes: view.routes,
          $el: view.$el,
          el: view.el,
          $navbarEl: view.$navbarEl,
          navbarEl: view.navbarEl,
          history: view.history,
          scrollHistory: view.scrollHistory,
          cache: app.cache,
          dynamicNavbar: app.theme === 'ios' && view.params.iosDynamicNavbar,
          separateNavbar: app.theme === 'ios' && view.params.iosDynamicNavbar && view.params.iosSeparateDynamicNavbar,
          initialPages: [],
          initialNavbars: [],
        });
      }

      // Install Modules
      router.useModules();

      // Temporary Dom
      router.tempDom = doc.createElement('div');

      // AllowPageChage
      router.allowPageChange = true;

      // Current Route
      var currentRoute = {};
      var previousRoute = {};
      Object.defineProperty(router, 'currentRoute', {
        enumerable: true,
        configurable: true,
        set: function set(newRoute) {
          if ( newRoute === void 0 ) newRoute = {};

          previousRoute = Utils.extend({}, currentRoute);
          currentRoute = newRoute;
          if (!currentRoute) { return; }
          router.url = currentRoute.url;
          router.emit('routeChange', newRoute, previousRoute, router);
        },
        get: function get() {
          return currentRoute;
        },
      });
      Object.defineProperty(router, 'previousRoute', {
        enumerable: true,
        configurable: true,
        get: function get() {
          return previousRoute;
        },
        set: function set(newRoute) {
          previousRoute = newRoute;
        },
      });

      Utils.extend(router, {
        // Load
        forward: forward,
        load: load,
        navigate: navigate,
        refreshPage: refreshPage,
        // Tab
        tabLoad: tabLoad,
        tabRemove: tabRemove,
        // Modal
        modalLoad: modalLoad,
        modalRemove: modalRemove,
        // Back
        backward: backward,
        loadBack: loadBack,
        back: back,
        // Clear history
        clearPreviousHistory: clearPreviousHistory,
      });

      return router;
    }

    if ( Framework7Class$$1 ) Router.__proto__ = Framework7Class$$1;
    Router.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    Router.prototype.constructor = Router;

    Router.prototype.animatableNavElements = function animatableNavElements (newNavbarInner, oldNavbarInner) {
      var router = this;
      var dynamicNavbar = router.dynamicNavbar;
      var animateIcon = router.params.iosAnimateNavbarBackIcon;

      var newNavEls;
      var oldNavEls;
      function animatableNavEl(el, navbarInner) {
        var $el = $$1(el);
        var isSliding = $el.hasClass('sliding') || navbarInner.hasClass('sliding');
        var isSubnavbar = $el.hasClass('subnavbar');
        var needsOpacityTransition = isSliding ? !isSubnavbar : true;
        var hasIcon = isSliding && animateIcon && $el.hasClass('left') && $el.find('.back .icon').length > 0;
        var $iconEl;
        if (hasIcon) { $iconEl = $el.find('.back .icon'); }
        return {
          $el: $el,
          $iconEl: $iconEl,
          hasIcon: hasIcon,
          leftOffset: $el[0].f7NavbarLeftOffset,
          rightOffset: $el[0].f7NavbarRightOffset,
          isSliding: isSliding,
          isSubnavbar: isSubnavbar,
          needsOpacityTransition: needsOpacityTransition,
        };
      }
      if (dynamicNavbar) {
        newNavEls = [];
        oldNavEls = [];
        newNavbarInner.children('.left, .right, .title, .subnavbar').each(function (index, navEl) {
          newNavEls.push(animatableNavEl(navEl, newNavbarInner));
        });
        oldNavbarInner.children('.left, .right, .title, .subnavbar').each(function (index, navEl) {
          oldNavEls.push(animatableNavEl(navEl, oldNavbarInner));
        });
        [oldNavEls, newNavEls].forEach(function (navEls) {
          navEls.forEach(function (navEl) {
            var n = navEl;
            var isSliding = navEl.isSliding;
            var $el = navEl.$el;
            var otherEls = navEls === oldNavEls ? newNavEls : oldNavEls;
            if (!(isSliding && $el.hasClass('title') && otherEls)) { return; }
            otherEls.forEach(function (otherNavEl) {
              if (otherNavEl.$el.hasClass('left') && otherNavEl.hasIcon) {
                var iconTextEl = otherNavEl.$el.find('.back span')[0];
                n.leftOffset += iconTextEl ? iconTextEl.offsetLeft : 0;
              }
            });
          });
        });
      }

      return { newNavEls: newNavEls, oldNavEls: oldNavEls };
    };

    Router.prototype.animateWithCSS = function animateWithCSS (oldPage, newPage, oldNavbarInner, newNavbarInner, direction, callback) {
      var router = this;
      var dynamicNavbar = router.dynamicNavbar;
      var separateNavbar = router.separateNavbar;
      var ios = router.app.theme === 'ios';
      // Router Animation class
      var routerTransitionClass = "router-transition-" + direction + " router-transition-css-" + direction;

      var newNavEls;
      var oldNavEls;
      var navbarWidth = 0;

      if (ios && dynamicNavbar) {
        if (!separateNavbar) {
          navbarWidth = newNavbarInner[0].offsetWidth;
        }
        var navEls = router.animatableNavElements(newNavbarInner, oldNavbarInner);
        newNavEls = navEls.newNavEls;
        oldNavEls = navEls.oldNavEls;
      }

      function animateNavbars(progress) {
        if (ios && dynamicNavbar) {
          newNavEls.forEach(function (navEl) {
            var $el = navEl.$el;
            var offset = direction === 'forward' ? navEl.rightOffset : navEl.leftOffset;
            if (navEl.isSliding) {
              $el.transform(("translate3d(" + (offset * (1 - progress)) + "px,0,0)"));
            }
            if (navEl.hasIcon) {
              if (direction === 'forward') {
                navEl.$iconEl.transform(("translate3d(" + ((-offset - navbarWidth) * (1 - progress)) + "px,0,0)"));
              } else {
                navEl.$iconEl.transform(("translate3d(" + ((-offset + (navbarWidth / 5)) * (1 - progress)) + "px,0,0)"));
              }
            }
          });
          oldNavEls.forEach(function (navEl) {
            var $el = navEl.$el;
            var offset = direction === 'forward' ? navEl.leftOffset : navEl.rightOffset;
            if (navEl.isSliding) {
              $el.transform(("translate3d(" + (offset * (progress)) + "px,0,0)"));
            }
            if (navEl.hasIcon) {
              if (direction === 'forward') {
                navEl.$iconEl.transform(("translate3d(" + ((-offset + (navbarWidth / 5)) * (progress)) + "px,0,0)"));
              } else {
                navEl.$iconEl.transform(("translate3d(" + ((-offset - navbarWidth) * (progress)) + "px,0,0)"));
              }
            }
          });
        }
      }

      // AnimationEnd Callback
      function onDone() {
        if (router.dynamicNavbar) {
          if (newNavbarInner.hasClass('sliding')) {
            newNavbarInner.find('.title, .left, .right, .left .icon, .subnavbar').transform('');
          } else {
            newNavbarInner.find('.sliding').transform('');
          }
          if (oldNavbarInner.hasClass('sliding')) {
            oldNavbarInner.find('.title, .left, .right, .left .icon, .subnavbar').transform('');
          } else {
            oldNavbarInner.find('.sliding').transform('');
          }
        }
        router.$el.removeClass(routerTransitionClass);
        if (callback) { callback(); }
      }

      (direction === 'forward' ? newPage : oldPage).animationEnd(function () {
        onDone();
      });

      // Animate
      if (dynamicNavbar) {
        // Prepare Navbars
        animateNavbars(0);
        Utils.nextTick(function () {
          // Add class, start animation
          animateNavbars(1);
          router.$el.addClass(routerTransitionClass);
        });
      } else {
        // Add class, start animation
        router.$el.addClass(routerTransitionClass);
      }
    };

    Router.prototype.animateWithJS = function animateWithJS (oldPage, newPage, oldNavbarInner, newNavbarInner, direction, callback) {
      var router = this;
      var dynamicNavbar = router.dynamicNavbar;
      var separateNavbar = router.separateNavbar;
      var ios = router.app.theme === 'ios';
      var duration = ios ? 400 : 250;
      var routerTransitionClass = "router-transition-" + direction + " router-transition-js-" + direction;

      var startTime = null;
      var done = false;

      var newNavEls;
      var oldNavEls;
      var navbarWidth = 0;

      if (ios && dynamicNavbar) {
        if (!separateNavbar) {
          navbarWidth = newNavbarInner[0].offsetWidth;
        }
        var navEls = router.animatableNavElements(newNavbarInner, oldNavbarInner);
        newNavEls = navEls.newNavEls;
        oldNavEls = navEls.oldNavEls;
      }

      var $shadowEl;
      var $opacityEl;

      if (ios) {
        $shadowEl = $$1('<div class="page-shadow-effect"></div>');
        $opacityEl = $$1('<div class="page-opacity-effect"></div>');

        if (direction === 'forward') {
          newPage.append($shadowEl);
          oldPage.append($opacityEl);
        } else {
          newPage.append($opacityEl);
          oldPage.append($shadowEl);
        }
      }
      var easing = Utils.bezier(0.25, 0.1, 0.25, 1);

      function onDone() {
        newPage.transform('').css('opacity', '');
        oldPage.transform('').css('opacity', '');
        if (ios) {
          $shadowEl.remove();
          $opacityEl.remove();
          if (dynamicNavbar) {
            newNavEls.forEach(function (navEl) {
              navEl.$el.transform('');
              navEl.$el.css('opacity', '');
            });
            oldNavEls.forEach(function (navEl) {
              navEl.$el.transform('');
              navEl.$el.css('opacity', '');
            });
            newNavEls = [];
            oldNavEls = [];
          }
        }

        router.$el.removeClass(routerTransitionClass);

        if (callback) { callback(); }
      }

      function render() {
        var time = Utils.now();
        if (!startTime) { startTime = time; }
        var progress = Math.max(Math.min((time - startTime) / duration, 1), 0);
        var easeProgress = easing(progress);

        if (progress >= 1) {
          done = true;
        }
        var inverter = router.app.rtl ? -1 : 1;
        if (ios) {
          if (direction === 'forward') {
            newPage.transform(("translate3d(" + ((1 - easeProgress) * 100 * inverter) + "%,0,0)"));
            oldPage.transform(("translate3d(" + (-easeProgress * 20 * inverter) + "%,0,0)"));
            $shadowEl[0].style.opacity = easeProgress;
            $opacityEl[0].style.opacity = easeProgress;
          } else {
            newPage.transform(("translate3d(" + (-(1 - easeProgress) * 20 * inverter) + "%,0,0)"));
            oldPage.transform(("translate3d(" + (easeProgress * 100 * inverter) + "%,0,0)"));
            $shadowEl[0].style.opacity = 1 - easeProgress;
            $opacityEl[0].style.opacity = 1 - easeProgress;
          }
          if (dynamicNavbar) {
            newNavEls.forEach(function (navEl) {
              var $el = navEl.$el;
              var offset = direction === 'forward' ? navEl.rightOffset : navEl.leftOffset;
              if (navEl.needsOpacityTransition) {
                $el[0].style.opacity = easeProgress;
              }
              if (navEl.isSliding) {
                $el.transform(("translate3d(" + (offset * (1 - easeProgress)) + "px,0,0)"));
              }
              if (navEl.hasIcon) {
                if (direction === 'forward') {
                  navEl.$iconEl.transform(("translate3d(" + ((-offset - navbarWidth) * (1 - easeProgress)) + "px,0,0)"));
                } else {
                  navEl.$iconEl.transform(("translate3d(" + ((-offset + (navbarWidth / 5)) * (1 - easeProgress)) + "px,0,0)"));
                }
              }
            });
            oldNavEls.forEach(function (navEl) {
              var $el = navEl.$el;
              var offset = direction === 'forward' ? navEl.leftOffset : navEl.rightOffset;
              if (navEl.needsOpacityTransition) {
                $el[0].style.opacity = (1 - easeProgress);
              }
              if (navEl.isSliding) {
                $el.transform(("translate3d(" + (offset * (easeProgress)) + "px,0,0)"));
              }
              if (navEl.hasIcon) {
                if (direction === 'forward') {
                  navEl.$iconEl.transform(("translate3d(" + ((-offset + (navbarWidth / 5)) * (easeProgress)) + "px,0,0)"));
                } else {
                  navEl.$iconEl.transform(("translate3d(" + ((-offset - navbarWidth) * (easeProgress)) + "px,0,0)"));
                }
              }
            });
          }
        } else if (direction === 'forward') {
          newPage.transform(("translate3d(0, " + ((1 - easeProgress) * 56) + "px,0)"));
          newPage.css('opacity', easeProgress);
        } else {
          oldPage.transform(("translate3d(0, " + (easeProgress * 56) + "px,0)"));
          oldPage.css('opacity', 1 - easeProgress);
        }

        if (done) {
          onDone();
          return;
        }
        Utils.nextFrame(render);
      }

      router.$el.addClass(routerTransitionClass);

      Utils.nextFrame(render);
    };

    Router.prototype.animate = function animate () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      // Args: oldPage, newPage, oldNavbarInner, newNavbarInner, direction, callback
      var router = this;
      if (router.params.animateCustom) {
        router.params.animateCustom.apply(router, args);
      } else if (router.params.animateWithJS) {
        router.animateWithJS.apply(router, args);
      } else {
        router.animateWithCSS.apply(router, args);
      }
    };

    Router.prototype.removeModal = function removeModal (modalEl) {
      var router = this;
      router.removeEl(modalEl);
    };
    // eslint-disable-next-line
    Router.prototype.removeTabContent = function removeTabContent (tabEl) {
      var $tabEl = $$1(tabEl);
      $tabEl.html('');
    };

    Router.prototype.removeNavbar = function removeNavbar (el) {
      var router = this;
      router.removeEl(el);
    };

    Router.prototype.removePage = function removePage (el) {
      var router = this;
      router.removeEl(el);
    };

    Router.prototype.removeEl = function removeEl (el) {
      if (!el) { return; }
      var router = this;
      var $el = $$1(el);
      if ($el.length === 0) { return; }
      if ($el[0].f7Component && $el[0].f7Component.$destroy) {
        $el[0].f7Component.$destroy();
      }
      $el.find('.tab').each(function (tabIndex, tabEl) {
        $$1(tabEl).children().each(function (index, tabChild) {
          if (tabChild.f7Component) {
            $$1(tabChild).trigger('tab:beforeremove');
            tabChild.f7Component.$destroy();
          }
        });
      });
      if (!router.params.removeElements) {
        return;
      }
      if (router.params.removeElementsWithTimeout) {
        setTimeout(function () {
          $el.remove();
        }, router.params.removeElementsTimeout);
      } else {
        $el.remove();
      }
    };

    Router.prototype.getPageEl = function getPageEl (content) {
      var router = this;
      if (typeof content === 'string') {
        router.tempDom.innerHTML = content;
      } else {
        if ($$1(content).hasClass('page')) {
          return content;
        }
        router.tempDom.innerHTML = '';
        $$1(router.tempDom).append(content);
      }
      var page = router.findElement('.page', router.tempDom);
      var scripts = $$1(router.tempDom).find('script');  //by xiang
      var links = $$1(router.tempDom).find('link');//by xiang
      return { page: page, scripts: scripts, links: links };//by xiang
      return router.findElement('.page', router.tempDom);//by xiang
    };

    Router.prototype.findElement = function findElement (stringSelector, container, notStacked) {
      var router = this;
      var view = router.view;
      var app = router.app;

      // Modals Selector
      var modalsSelector = '.popup, .dialog, .popover, .actions-modal, .sheet-modal, .login-screen, .page';

      var $container = $$1(container);
      var selector = stringSelector;
      if (notStacked) { selector += ':not(.stacked)'; }

      var found = $container
        .find(selector)
        .filter(function (index, el) { return $$1(el).parents(modalsSelector).length === 0; });

      if (found.length > 1) {
        if (typeof view.selector === 'string') {
          // Search in related view
          found = $container.find(((view.selector) + " " + selector));
        }
        if (found.length > 1) {
          // Search in main view
          found = $container.find(("." + (app.params.viewMainClass) + " " + selector));
        }
      }
      if (found.length === 1) { return found; }

      // Try to find not stacked
      if (!notStacked) { found = router.findElement(selector, $container, true); }
      if (found && found.length === 1) { return found; }
      if (found && found.length > 1) { return $$1(found[0]); }
      return undefined;
    };

    Router.prototype.flattenRoutes = function flattenRoutes (routes) {
      var this$1 = this;
      if ( routes === void 0 ) routes = this.routes;

      var flattenedRoutes = [];
      routes.forEach(function (route) {
        if ('routes' in route) {
          var mergedPathsRoutes = route.routes.map(function (childRoute) {
            var cRoute = Utils.extend({}, childRoute);
            cRoute.path = (((route.path) + "/" + (cRoute.path))).replace('///', '/').replace('//', '/');
            return cRoute;
          });
          flattenedRoutes = flattenedRoutes.concat(route, this$1.flattenRoutes(mergedPathsRoutes));
        } else if ('tabs' in route && route.tabs) {
          var mergedPathsRoutes$1 = route.tabs.map(function (tabRoute) {
            var tRoute = Utils.extend({}, route, {
              path: (((route.path) + "/" + (tabRoute.path))).replace('///', '/').replace('//', '/'),
              parentPath: route.path,
              tab: tabRoute,
            });
            delete tRoute.tabs;
            return tRoute;
          });
          flattenedRoutes = flattenedRoutes.concat(this$1.flattenRoutes(mergedPathsRoutes$1));
        } else {
          flattenedRoutes.push(route);
        }
      });
      return flattenedRoutes;
    };
    // eslint-disable-next-line
    Router.prototype.parseRouteUrl = function parseRouteUrl (url) {
      if (!url) { return {}; }
      var query = Utils.parseUrlQuery(url);
      var hash = url.split('#')[1];
      var params = {};
      var path = url.split('#')[0].split('?')[0];
      return {
        query: query,
        hash: hash,
        params: params,
        url: url,
        path: path,
      };
    };

    Router.prototype.findTabRoute = function findTabRoute (tabEl) {
      var router = this;
      var $tabEl = $$1(tabEl);
      var parentPath = router.currentRoute.route.parentPath;
      var tabId = $tabEl.attr('id');
      var flattenedRoutes = router.flattenRoutes(router.routes);
      var foundTabRoute;
      flattenedRoutes.forEach(function (route) {
        if (
          route.parentPath === parentPath
          && route.tab
          && route.tab.id === tabId
        ) {
          foundTabRoute = route;
        }
      });
      return foundTabRoute;
    };

    Router.prototype.findRouteByKey = function findRouteByKey (key, value) {
      var router = this;
      var routes = router.routes;
      var flattenedRoutes = router.flattenRoutes(routes);
      var matchingRoute;

      flattenedRoutes.forEach(function (route) {
        if (matchingRoute) { return; }
        if (route[key] === value) {
          matchingRoute = route;
        }
      });
      return matchingRoute;
    };

    Router.prototype.findMatchingRoute = function findMatchingRoute (url) {
      if (!url) { return undefined; }
      var router = this;
      var routes = router.routes;
      var flattenedRoutes = router.flattenRoutes(routes);
      var ref = router.parseRouteUrl(url);
      var path = ref.path;
      var query = ref.query;
      var hash = ref.hash;
      var params = ref.params;
      var matchingRoute;
      flattenedRoutes.forEach(function (route) {
        if (matchingRoute) { return; }
        var keys = [];

        var pathsToMatch = [route.path];
        if (route.alias) {
          if (typeof route.alias === 'string') { pathsToMatch.push(route.alias); }
          else if (Array.isArray(route.alias)) {
            route.alias.forEach(function (aliasPath) {
              pathsToMatch.push(aliasPath);
            });
          }
        }

        var matched;
        pathsToMatch.forEach(function (pathToMatch) {
          if (matched) { return; }
          matched = pathToRegexp_1(pathToMatch, keys).exec(path);
        });

        if (matched) {
          keys.forEach(function (keyObj, index) {
            if (typeof keyObj.name === 'number') { return; }
            var paramValue = matched[index + 1];
            params[keyObj.name] = paramValue;
          });

          var parentPath;
          if (route.parentPath) {
            parentPath = path.split('/').slice(0, route.parentPath.split('/').length - 1).join('/');
          }

          matchingRoute = {
            query: query,
            hash: hash,
            params: params,
            url: url,
            path: path,
            parentPath: parentPath,
            route: route,
            name: route.name,
          };
        }
      });
      return matchingRoute;
    };

    Router.prototype.removeFromXhrCache = function removeFromXhrCache (url) {
      var router = this;
      var xhrCache = router.cache.xhr;
      var index = false;
      for (var i = 0; i < xhrCache.length; i += 1) {
        if (xhrCache[i].url === url) { index = i; }
      }
      if (index !== false) { xhrCache.splice(index, 1); }
    };

    Router.prototype.xhrRequest = function xhrRequest (requestUrl, options) {
      var router = this;
      var params = router.params;
      var ignoreCache = options.ignoreCache;
      var url = requestUrl;

      var hasQuery = url.indexOf('?') >= 0;
      if (params.passRouteQueryToRequest
        && options
        && options.route
        && options.route.query
        && Object.keys(options.route.query).length
      ) {
        url += "" + (hasQuery ? '&' : '?') + (Utils.serializeObject(options.route.query));
        hasQuery = true;
      }

      if (params.passRouteParamsToRequest
        && options
        && options.route
        && options.route.params
        && Object.keys(options.route.params).length
      ) {
        url += "" + (hasQuery ? '&' : '?') + (Utils.serializeObject(options.route.params));
        hasQuery = true;
      }

      if (url.indexOf('{{') >= 0
        && options
        && options.route
        && options.route.params
        && Object.keys(options.route.params).length
      ) {
        Object.keys(options.route.params).forEach(function (paramName) {
          var regExp = new RegExp(("{{" + paramName + "}}"), 'g');
          url = url.replace(regExp, options.route.params[paramName] || '');
        });
      }
      // should we ignore get params or not
      if (params.xhrCacheIgnoreGetParameters && url.indexOf('?') >= 0) {
        url = url.split('?')[0];
      }
      return Utils.promise(function (resolve, reject) {
        //removed by xiang to request from server each time.
        /*if (params.xhrCache && !ignoreCache && url.indexOf('nocache') < 0 && params.xhrCacheIgnore.indexOf(url) < 0) {
          for (let i = 0; i < router.cache.xhr.length; i += 1) {
            const cachedUrl = router.cache.xhr[i];
            if (cachedUrl.url === url) {
              // Check expiration
              if (Utils.now() - cachedUrl.time < params.xhrCacheDuration) {
                // Load from cache
                resolve(cachedUrl.content);
                return;
              }
            }
          }
        }*/
        router.xhr = router.app.request({
          url: url,
          method: 'GET',
          beforeSend: function beforeSend(xhr) {
            router.emit('routerAjaxStart', xhr, options);
          },
          complete: function complete(xhr, status) {
            router.emit('routerAjaxComplete', xhr);
            if ((status !== 'error' && status !== 'timeout' && (xhr.status >= 200 && xhr.status < 300)) || xhr.status === 0) {
              if (params.xhrCache && xhr.responseText !== '') {
                router.removeFromXhrCache(url);
                router.cache.xhr.push({
                  url: url,
                  time: Utils.now(),
                  content: xhr.responseText,
                });
              }
              router.emit('routerAjaxSuccess', xhr, options);
              resolve(xhr.responseText);
            } else {
              router.emit('routerAjaxError', xhr, options);
              reject(xhr);
            }
          },
          error: function error(xhr) {
            router.emit('routerAjaxError', xhr, options);
            reject(xhr);
          },
        });
      });
    };

    // Remove theme elements
    Router.prototype.removeThemeElements = function removeThemeElements (el) {
      var router = this;
      var theme = router.app.theme;
      $$1(el).find(("." + (theme === 'md' ? 'ios' : 'md') + "-only, .if-" + (theme === 'md' ? 'ios' : 'md'))).remove();
    };

    Router.prototype.templateLoader = function templateLoader (template, templateUrl, options, resolve, reject) {
      var router = this;
      function compile(t) {
        var compiledHtml;
        var context;
        try {
          context = options.context || {};
          if (typeof context === 'function') { context = context.call(router); }
          else if (typeof context === 'string') {
            try {
              context = JSON.parse(context);
            } catch (err) {
              reject();
              throw (err);
            }
          }
          if (typeof t === 'function') {
            compiledHtml = t(context);
          } else {
            compiledHtml = Template7.compile(t)(Utils.extend({}, context || {}, {
              $app: router.app,
              $root: Utils.extend({}, router.app.data, router.app.methods),
              $route: options.route,
              $router: router,
              $theme: {
                ios: router.app.theme === 'ios',
                md: router.app.theme === 'md',
              },
            }));
          }
        } catch (err) {
          reject();
          throw (err);
        }
        resolve(compiledHtml, { context: context });
      }
      if (templateUrl) {
        // Load via XHR
        if (router.xhr) {
          router.xhr.abort();
          router.xhr = false;
        }
        router
          .xhrRequest(templateUrl, options)
          .then(function (templateContent) {
            compile(templateContent);
          })
          .catch(function () {
            reject();
          });
      } else {
        compile(template);
      }
    };

    Router.prototype.modalTemplateLoader = function modalTemplateLoader (template, templateUrl, options, resolve, reject) {
      var router = this;
      return router.templateLoader(template, templateUrl, options, function (html) {
        resolve(html);
      }, reject);
    };

    Router.prototype.tabTemplateLoader = function tabTemplateLoader (template, templateUrl, options, resolve, reject) {
      var router = this;
      return router.templateLoader(template, templateUrl, options, function (html) {
        resolve(html);
      }, reject);
    };

    Router.prototype.pageTemplateLoader = function pageTemplateLoader (template, templateUrl, options, resolve, reject) {
      var router = this;
      return router.templateLoader(template, templateUrl, options, function (html, newOptions) {
        if ( newOptions === void 0 ) newOptions = {};

        resolve(router.getPageEl(html), newOptions);
      }, reject);
    };

    Router.prototype.componentLoader = function componentLoader (component, componentUrl, options, resolve, reject) {
      if ( options === void 0 ) options = {};

      var router = this;
      var url = typeof component === 'string' ? component : componentUrl;
      function compile(c) {
        var context = options.context || {};
        if (typeof context === 'function') { context = context.call(router); }
        else if (typeof context === 'string') {
          try {
            context = JSON.parse(context);
          } catch (err) {
            reject();
            throw (err);
          }
        }
        var extendContext = Utils.merge(
          {},
          context,
          {
            $: $$1,
            $$: $$1,
            $app: router.app,
            $root: Utils.merge({}, router.app.data, router.app.methods),
            $route: options.route,
            $router: router,
            $dom7: $$1,
            $theme: {
              ios: router.app.theme === 'ios',
              md: router.app.theme === 'md',
            },
          }
        );
        var createdComponent = Component.create(c, extendContext);
        resolve(createdComponent.el);
      }
      if (url) {
        // Load via XHR
        if (router.xhr) {
          router.xhr.abort();
          router.xhr = false;
        }
        router
          .xhrRequest(url, options)
          .then(function (loadedComponent) {
            compile(Component.parse(loadedComponent));
          })
          .catch(function (err) {
            reject();
            throw (err);
          });
      } else {
        compile(component);
      }
    };

    Router.prototype.modalComponentLoader = function modalComponentLoader (rootEl, component, componentUrl, options, resolve, reject) {
      var router = this;
      router.componentLoader(component, componentUrl, options, function (el) {
        resolve(el);
      }, reject);
    };

    Router.prototype.tabComponentLoader = function tabComponentLoader (tabEl, component, componentUrl, options, resolve, reject) {
      var router = this;
      router.componentLoader(component, componentUrl, options, function (el) {
        resolve(el);
      }, reject);
    };

    Router.prototype.pageComponentLoader = function pageComponentLoader (routerEl, component, componentUrl, options, resolve, reject) {
      var router = this;
      router.componentLoader(component, componentUrl, options, function (el, newOptions) {
        if ( newOptions === void 0 ) newOptions = {};

        resolve(el, newOptions);
      }, reject);
    };

    Router.prototype.getPageData = function getPageData (pageEl, navbarEl, from, to, route, pageFromEl) {
      if ( route === void 0 ) route = {};

      var router = this;
      var $pageEl = $$1(pageEl);
      var $navbarEl = $$1(navbarEl);
      var currentPage = $pageEl[0].f7Page || {};
      var direction;
      var pageFrom;
      if ((from === 'next' && to === 'current') || (from === 'current' && to === 'previous')) { direction = 'forward'; }
      if ((from === 'current' && to === 'next') || (from === 'previous' && to === 'current')) { direction = 'backward'; }
      if (currentPage && !currentPage.fromPage) {
        var $pageFromEl = $$1(pageFromEl);
        if ($pageFromEl.length) {
          pageFrom = $pageFromEl[0].f7Page;
        }
      }
      pageFrom = currentPage.pageFrom || pageFrom;
      if (pageFrom && pageFrom.pageFrom) {
        pageFrom.pageFrom = null;
      }
      var page = {
        app: router.app,
        view: router.view,
        router: router,
        $el: $pageEl,
        el: $pageEl[0],
        $pageEl: $pageEl,
        pageEl: $pageEl[0],
        $navbarEl: $navbarEl,
        navbarEl: $navbarEl[0],
        name: $pageEl.attr('data-name'),
        position: from,
        from: from,
        to: to,
        direction: direction,
        route: currentPage.route ? currentPage.route : route,
        pageFrom: pageFrom,
      };

      if ($navbarEl && $navbarEl[0]) {
        $navbarEl[0].f7Page = page;
      }
      $pageEl[0].f7Page = page;
      return page;
    };

    // Callbacks
    Router.prototype.pageCallback = function pageCallback (callback, pageEl, navbarEl, from, to, options, pageFromEl) {
      if ( options === void 0 ) options = {};

      if (!pageEl) { return; }
      var router = this;
      var $pageEl = $$1(pageEl);
      if (!$pageEl.length) { return; }
      var route = options.route;
      var restoreScrollTopOnBack = router.params.restoreScrollTopOnBack;

      var camelName = "page" + (callback[0].toUpperCase() + callback.slice(1, callback.length));
      var colonName = "page:" + (callback.toLowerCase());

      var page = {};
      if (callback === 'beforeRemove' && $pageEl[0].f7Page) {
        page = Utils.extend($pageEl[0].f7Page, { from: from, to: to, position: from });
      } else {
        page = router.getPageData(pageEl, navbarEl, from, to, route, pageFromEl);
      }
      page.swipeBack = !!options.swipeBack;

      var ref = options.route ? options.route.route : {};
      var on = ref.on; if ( on === void 0 ) on = {};
      var once = ref.once; if ( once === void 0 ) once = {};
      if (options.on) {
        Utils.extend(on, options.on);
      }
      if (options.once) {
        Utils.extend(once, options.once);
      }

      function attachEvents() {
        if ($pageEl[0].f7RouteEventsAttached) { return; }
        $pageEl[0].f7RouteEventsAttached = true;
        if (on && Object.keys(on).length > 0) {
          $pageEl[0].f7RouteEventsOn = on;
          Object.keys(on).forEach(function (eventName) {
            on[eventName] = on[eventName].bind(router);
            $pageEl.on(Utils.eventNameToColonCase(eventName), on[eventName]);
          });
        }
        if (once && Object.keys(once).length > 0) {
          $pageEl[0].f7RouteEventsOnce = once;
          Object.keys(once).forEach(function (eventName) {
            once[eventName] = once[eventName].bind(router);
            $pageEl.once(Utils.eventNameToColonCase(eventName), once[eventName]);
          });
        }
      }

      function detachEvents() {
        if (!$pageEl[0].f7RouteEventsAttached) { return; }
        if ($pageEl[0].f7RouteEventsOn) {
          Object.keys($pageEl[0].f7RouteEventsOn).forEach(function (eventName) {
            $pageEl.off(Utils.eventNameToColonCase(eventName), $pageEl[0].f7RouteEventsOn[eventName]);
          });
        }
        if ($pageEl[0].f7RouteEventsOnce) {
          Object.keys($pageEl[0].f7RouteEventsOnce).forEach(function (eventName) {
            $pageEl.off(Utils.eventNameToColonCase(eventName), $pageEl[0].f7RouteEventsOnce[eventName]);
          });
        }
        $pageEl[0].f7RouteEventsAttached = null;
        $pageEl[0].f7RouteEventsOn = null;
        $pageEl[0].f7RouteEventsOnce = null;
        delete $pageEl[0].f7RouteEventsAttached;
        delete $pageEl[0].f7RouteEventsOn;
        delete $pageEl[0].f7RouteEventsOnce;
      }

      if (callback === 'mounted') {
        attachEvents();
      }
      if (callback === 'init') {
        if (restoreScrollTopOnBack && (from === 'previous' || !from) && to === 'current' && router.scrollHistory[page.route.url] && !$pageEl.hasClass('no-restore-scroll')) {
          var $pageContent = $pageEl.find('.page-content');
          if ($pageContent.length > 0) {
            // eslint-disable-next-line
            $pageContent = $pageContent.filter(function (pageContentIndex, pageContentEl) {
              return (
                $$1(pageContentEl).parents('.tab:not(.tab-active)').length === 0
                && !$$1(pageContentEl).is('.tab:not(.tab-active)')
              );
            });
          }
          $pageContent.scrollTop(router.scrollHistory[page.route.url]);
        }
        attachEvents();
        if ($pageEl[0].f7PageInitialized) {
          $pageEl.trigger('page:reinit', page);
          router.emit('pageReinit', page);
          return;
        }
        $pageEl[0].f7PageInitialized = true;
      }
      if (restoreScrollTopOnBack && callback === 'beforeOut' && from === 'current' && to === 'previous') {
        // Save scroll position
        var $pageContent$1 = $pageEl.find('.page-content');
        if ($pageContent$1.length > 0) {
          // eslint-disable-next-line
          $pageContent$1 = $pageContent$1.filter(function (pageContentIndex, pageContentEl) {
            return (
              $$1(pageContentEl).parents('.tab:not(.tab-active)').length === 0
              && !$$1(pageContentEl).is('.tab:not(.tab-active)')
            );
          });
        }
        router.scrollHistory[page.route.url] = $pageContent$1.scrollTop();
      }
      if (restoreScrollTopOnBack && callback === 'beforeOut' && from === 'current' && to === 'next') {
        // Delete scroll position
        delete router.scrollHistory[page.route.url];
      }

      $pageEl.trigger(colonName, page);
      router.emit(camelName, page);

      if (callback === 'beforeRemove') {
        detachEvents();
        $pageEl[0].f7Page = null;
      }
    };

    Router.prototype.saveHistory = function saveHistory () {
      var router = this;
      router.view.history = router.history;
      if (router.params.pushState) {
        win.localStorage[("f7router-" + (router.view.id) + "-history")] = JSON.stringify(router.history);
      }
    };

    Router.prototype.restoreHistory = function restoreHistory () {
      var router = this;
      if (router.params.pushState && win.localStorage[("f7router-" + (router.view.id) + "-history")]) {
        router.history = JSON.parse(win.localStorage[("f7router-" + (router.view.id) + "-history")]);
        router.view.history = router.history;
      }
    };

    Router.prototype.clearHistory = function clearHistory () {
      var router = this;
      router.history = [];
      if (router.view) { router.view.history = []; }
      router.saveHistory();
    };

    Router.prototype.init = function init () {
      var router = this;
      var app = router.app;
      var view = router.view;

      // Init Swipeback
      {
        if (
          (view && router.params.iosSwipeBack && app.theme === 'ios')
          || (view && router.params.mdSwipeBack && app.theme === 'md')
        ) {
          SwipeBack(router);
        }
      }

      // Dynamic not separated navbbar
      if (router.dynamicNavbar && !router.separateNavbar) {
        router.$el.addClass('router-dynamic-navbar-inside');
      }

      var initUrl = router.params.url;
      var documentUrl = doc.location.href.split(doc.location.origin)[1];
      var historyRestored;
      var ref = router.params;
      var pushState = ref.pushState;
      var pushStateOnLoad = ref.pushStateOnLoad;
      var pushStateSeparator = ref.pushStateSeparator;
      var pushStateAnimateOnLoad = ref.pushStateAnimateOnLoad;
      var ref$1 = router.params;
      var pushStateRoot = ref$1.pushStateRoot;
      if (win.cordova && pushState && !pushStateSeparator && !pushStateRoot && doc.location.pathname.indexOf('index.html')) {
        // eslint-disable-next-line
        console.warn('Framework7: wrong or not complete pushState configuration, trying to guess pushStateRoot');
        pushStateRoot = doc.location.pathname.split('index.html')[0];
      }

      if (!pushState || !pushStateOnLoad) {
        if (!initUrl) {
          initUrl = documentUrl;
        }
        if (doc.location.search && initUrl.indexOf('?') < 0) {
          initUrl += doc.location.search;
        }
        if (doc.location.hash && initUrl.indexOf('#') < 0) {
          initUrl += doc.location.hash;
        }
      } else {
        if (pushStateRoot && documentUrl.indexOf(pushStateRoot) >= 0) {
          documentUrl = documentUrl.split(pushStateRoot)[1];
          if (documentUrl === '') { documentUrl = '/'; }
        }
        if (pushStateSeparator.length > 0 && documentUrl.indexOf(pushStateSeparator) >= 0) {
          initUrl = documentUrl.split(pushStateSeparator)[1];
        } else {
          initUrl = documentUrl;
        }
        router.restoreHistory();
        if (router.history.indexOf(initUrl) >= 0) {
          router.history = router.history.slice(0, router.history.indexOf(initUrl) + 1);
        } else if (router.params.url === initUrl) {
          router.history = [initUrl];
        } else if (History.state && History.state[view.id] && History.state[view.id].url === router.history[router.history.length - 1]) {
          initUrl = router.history[router.history.length - 1];
        } else {
          router.history = [documentUrl.split(pushStateSeparator)[0] || '/', initUrl];
        }
        if (router.history.length > 1) {
          historyRestored = true;
        } else {
          router.history = [];
        }
        router.saveHistory();
      }
      var currentRoute;
      if (router.history.length > 1) {
        // Will load page
        currentRoute = router.findMatchingRoute(router.history[0]);
        if (!currentRoute) {
          currentRoute = Utils.extend(router.parseRouteUrl(router.history[0]), {
            route: {
              url: router.history[0],
              path: router.history[0].split('?')[0],
            },
          });
        }
      } else {
        // Don't load page
        currentRoute = router.findMatchingRoute(initUrl);
        if (!currentRoute) {
          currentRoute = Utils.extend(router.parseRouteUrl(initUrl), {
            route: {
              url: initUrl,
              path: initUrl.split('?')[0],
            },
          });
        }
      }

      if (router.params.stackPages) {
        router.$el.children('.page').each(function (index, pageEl) {
          var $pageEl = $$1(pageEl);
          router.initialPages.push($pageEl[0]);
          if (router.separateNavbar && $pageEl.children('.navbar').length > 0) {
            router.initialNavbars.push($pageEl.children('.navbar').find('.navbar-inner')[0]);
          }
        });
      }

      if (router.$el.children('.page:not(.stacked)').length === 0 && initUrl) {
        // No pages presented in DOM, reload new page
        router.navigate(initUrl, {
          initial: true,
          reloadCurrent: true,
          pushState: false,
        });
      } else {
        // Init current DOM page
        var hasTabRoute;
        router.currentRoute = currentRoute;
        router.$el.children('.page:not(.stacked)').each(function (index, pageEl) {
          var $pageEl = $$1(pageEl);
          var $navbarInnerEl;
          $pageEl.addClass('page-current');
          if (router.separateNavbar) {
            $navbarInnerEl = $pageEl.children('.navbar').children('.navbar-inner');
            if ($navbarInnerEl.length > 0) {
              if (!router.$navbarEl.parents(doc).length) {
                router.$el.prepend(router.$navbarEl);
              }
              router.$navbarEl.append($navbarInnerEl);
              $pageEl.children('.navbar').remove();
            } else {
              router.$navbarEl.addClass('navbar-hidden');
            }
          }
          var initOptions = {
            route: router.currentRoute,
          };
          if (router.currentRoute && router.currentRoute.route && router.currentRoute.route.options) {
            Utils.extend(initOptions, router.currentRoute.route.options);
          }
          router.currentPageEl = $pageEl[0];
          if (router.dynamicNavbar && $navbarInnerEl.length) {
            router.currentNavbarEl = $navbarInnerEl[0];
          }
          router.removeThemeElements($pageEl);
          if (router.dynamicNavbar && $navbarInnerEl.length) {
            router.removeThemeElements($navbarInnerEl);
          }
          if (initOptions.route.route.tab) {
            hasTabRoute = true;
            router.tabLoad(initOptions.route.route.tab, Utils.extend({}, initOptions));
          }
          router.pageCallback('init', $pageEl, $navbarInnerEl, 'current', undefined, initOptions);
        });
        if (historyRestored) {
          router.navigate(initUrl, {
            initial: true,
            pushState: false,
            history: false,
            animate: pushStateAnimateOnLoad,
            once: {
              pageAfterIn: function pageAfterIn() {
                if (router.history.length > 2) {
                  router.back({ preload: true });
                }
              },
            },
          });
        }
        if (!historyRestored && !hasTabRoute) {
          router.history.push(initUrl);
          router.saveHistory();
        }
      }
      if (initUrl && pushState && pushStateOnLoad && (!History.state || !History.state[view.id])) {
        History.initViewState(view.id, {
          url: initUrl,
        });
      }
      router.emit('local::init routerInit', router);
    };

    Router.prototype.destroy = function destroy () {
      var router = this;

      router.emit('local::destroy routerDestroy', router);

      // Delete props & methods
      Object.keys(router).forEach(function (routerProp) {
        router[routerProp] = null;
        delete router[routerProp];
      });

      router = null;
    };

    return Router;
  }(Framework7Class));

  var Router$1 = {
    name: 'router',
    static: {
      Router: Router,
    },
    instance: {
      cache: {
        xhr: [],
        templates: [],
        components: [],
      },
    },
    create: function create() {
      var instance = this;
      if (instance.app) {
        // View Router
        if (instance.params.router) {
          instance.router = new Router(instance.app, instance);
        }
      } else {
        // App Router
        instance.router = new Router(instance);
      }
    },
  };

  var View = (function (Framework7Class$$1) {
    function View(appInstance, el, viewParams) {
      if ( viewParams === void 0 ) viewParams = {};

      Framework7Class$$1.call(this, viewParams, [appInstance]);

      var app = appInstance;
      var $el = $$1(el);
      var view = this;

      var defaults = {
        routes: [],
        routesAdd: [],
      };

      // Default View params
      view.params = Utils.extend(defaults, app.params.view, viewParams);

      // Routes
      if (view.params.routes.length > 0) {
        view.routes = view.params.routes;
      } else {
        view.routes = [].concat(app.routes, view.params.routesAdd);
      }

      // Selector
      var selector;
      if (typeof el === 'string') { selector = el; }
      else {
        // Supposed to be HTMLElement or Dom7
        selector = ($el.attr('id') ? ("#" + ($el.attr('id'))) : '') + ($el.attr('class') ? ("." + ($el.attr('class').replace(/ /g, '.').replace('.active', ''))) : '');
      }

      // DynamicNavbar
      var $navbarEl;
      if (app.theme === 'ios' && view.params.iosDynamicNavbar && view.params.iosSeparateDynamicNavbar) {
        $navbarEl = $el.children('.navbar').eq(0);
        if ($navbarEl.length === 0) {
          $navbarEl = $$1('<div class="navbar"></div>');
        }
      }

      // View Props
      Utils.extend(false, view, {
        app: app,
        $el: $el,
        el: $el[0],
        name: view.params.name,
        main: view.params.main || $el.hasClass('view-main'),
        $navbarEl: $navbarEl,
        navbarEl: $navbarEl ? $navbarEl[0] : undefined,
        selector: selector,
        history: [],
        scrollHistory: {},
      });

      // Save in DOM
      $el[0].f7View = view;

      // Install Modules
      view.useModules();

      // Add to app
      app.views.push(view);
      if (view.main) {
        app.views.main = view;
      }
      if (view.name) {
        app.views[view.name] = view;
      }

      // Index
      view.index = app.views.indexOf(view);

      // View ID
      var viewId;
      if (view.name) {
        viewId = "view_" + (view.name);
      } else if (view.main) {
        viewId = 'view_main';
      } else {
        viewId = "view_" + (view.index);
      }
      view.id = viewId;

      // Init View
      if (app.initialized) {
        view.init();
      } else {
        app.on('init', function () {
          view.init();
        });
      }

      return view;
    }

    if ( Framework7Class$$1 ) View.__proto__ = Framework7Class$$1;
    View.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    View.prototype.constructor = View;

    View.prototype.destroy = function destroy () {
      var view = this;
      var app = view.app;

      view.$el.trigger('view:beforedestroy', view);
      view.emit('local::beforeDestroy viewBeforeDestroy', view);

      if (view.main) {
        app.views.main = null;
        delete app.views.main;
      } else if (view.name) {
        app.views[view.name] = null;
        delete app.views[view.name];
      }
      view.$el[0].f7View = null;
      delete view.$el[0].f7View;

      app.views.splice(app.views.indexOf(view), 1);

      // Destroy Router
      if (view.params.router && view.router) {
        view.router.destroy();
      }

      view.emit('local::destroy viewDestroy', view);

      // Delete props & methods
      Object.keys(view).forEach(function (viewProp) {
        view[viewProp] = null;
        delete view[viewProp];
      });

      view = null;
    };

    View.prototype.init = function init () {
      var view = this;
      if (view.params.router) {
        view.router.init();
      }
    };

    return View;
  }(Framework7Class));

  // Use Router
  View.use(Router$1);

  function initClicks(app) {
    function handleClicks(e) {
      var clicked = $$1(e.target);
      var clickedLink = clicked.closest('a');
      var isLink = clickedLink.length > 0;
      var url = isLink && clickedLink.attr('href');
      var isTabLink = isLink && clickedLink.hasClass('tab-link') && (clickedLink.attr('data-tab') || (url && url.indexOf('#') === 0));

      // Check if link is external
      if (isLink) {
        // eslint-disable-next-line
        if (clickedLink.is(app.params.clicks.externalLinks) || (url && url.indexOf('javascript:') >= 0)) {
          var target = clickedLink.attr('target');
          if (
            url
            && win.cordova
            && win.cordova.InAppBrowser
            && (target === '_system' || target === '_blank')
          ) {
            e.preventDefault();
            win.cordova.InAppBrowser.open(url, target);
          }
          return;
        }
      }

      // Modules Clicks
      Object.keys(app.modules).forEach(function (moduleName) {
        var moduleClicks = app.modules[moduleName].clicks;
        if (!moduleClicks) { return; }
        Object.keys(moduleClicks).forEach(function (clickSelector) {
          var matchingClickedElement = clicked.closest(clickSelector).eq(0);
          if (matchingClickedElement.length > 0) {
            moduleClicks[clickSelector].call(app, matchingClickedElement, matchingClickedElement.dataset());
          }
        });
      });

      // Load Page
      var clickedLinkData = {};
      if (isLink) {
        e.preventDefault();
        clickedLinkData = clickedLink.dataset();
      }
      var validUrl = url && url.length > 0 && url !== '#' && !isTabLink;
      var template = clickedLinkData.template;
      if (validUrl || clickedLink.hasClass('back') || template) {
        var view;
        if (clickedLinkData.view) {
          view = $$1(clickedLinkData.view)[0].f7View;
        } else {
          view = clicked.parents('.view')[0] && clicked.parents('.view')[0].f7View;
          if (!clickedLink.hasClass('back') && view && view.params.linksView) {
            if (typeof view.params.linksView === 'string') { view = $$1(view.params.linksView)[0].f7View; }
            else if (view.params.linksView instanceof View) { view = view.params.linksView; }
          }
        }
        if (!view) {
          if (app.views.main) { view = app.views.main; }
        }
        if (!view || !view.router) { return; }
        if (clickedLinkData.context && typeof clickedLinkData.context === 'string') {
          try {
            clickedLinkData.context = JSON.parse(clickedLinkData.context);
          } catch (err) {
            // something wrong there
          }
        }
        if (clickedLink.hasClass('back')) { view.router.back(url, clickedLinkData); }
        else { view.router.navigate(url, clickedLinkData); }
      }
    }

    app.on('click', handleClicks);

    // Prevent scrolling on overlays
    function preventScrolling(e) {
      e.preventDefault();
    }
    if (Support.touch && !Device.android) {
      var activeListener = Support.passiveListener ? { passive: false, capture: false } : false;
      $$1(doc).on((app.params.touch.fastClicks ? 'touchstart' : 'touchmove'), '.panel-backdrop, .dialog-backdrop, .preloader-backdrop, .popup-backdrop, .searchbar-backdrop', preventScrolling, activeListener);
    }
  }
  var ClicksModule = {
    name: 'clicks',
    params: {
      clicks: {
        // External Links
        externalLinks: '.external',
      },
    },
    on: {
      init: function init() {
        var app = this;
        initClicks(app);
      },
    },
  };

  var HistoryModule = {
    name: 'history',
    static: {
      history: History,
    },
    on: {
      init: function init() {
        History.init(this);
      },
    },
  };

  var keyPrefix = 'f7storage-';
  var Storage = {
    get: function get(key) {
      return Utils.promise(function (resolve, reject) {
        try {
          var value = JSON.parse(win.localStorage.getItem(("" + keyPrefix + key)));
          resolve(value);
        } catch (e) {
          reject(e);
        }
      });
    },
    set: function set(key, value) {
      return Utils.promise(function (resolve, reject) {
        try {
          win.localStorage.setItem(("" + keyPrefix + key), JSON.stringify(value));
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    },
    remove: function remove(key) {
      return Utils.promise(function (resolve, reject) {
        try {
          win.localStorage.removeItem(("" + keyPrefix + key));
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    },
    clear: function clear() {

    },
    length: function length() {

    },
    keys: function keys() {
      return Utils.promise(function (resolve, reject) {
        try {
          var keys = Object.keys(win.localStorage)
            .filter(function (keyName) { return keyName.indexOf(keyPrefix) === 0; })
            .map(function (keyName) { return keyName.replace(keyPrefix, ''); });
          resolve(keys);
        } catch (e) {
          reject(e);
        }
      });
    },
    forEach: function forEach(callback) {
      return Utils.promise(function (resolve, reject) {
        try {
          Object.keys(win.localStorage)
            .filter(function (keyName) { return keyName.indexOf(keyPrefix) === 0; })
            .forEach(function (keyName, index) {
              var key = keyName.replace(keyPrefix, '');
              Storage.get(key).then(function (value) {
                callback(key, value, index);
              });
            });
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    },
  };

  var StorageModule = {
    name: 'storage',
    static: {
      Storage: Storage,
      storage: Storage,
    },
  };

  var Statusbar = {
    hide: function hide() {
      $$1('html').removeClass('with-statusbar');
      if (Device.cordova && win.StatusBar) {
        win.StatusBar.hide();
      }
    },
    show: function show() {
      if (Device.cordova && win.StatusBar) {
        win.StatusBar.show();
        Utils.nextTick(function () {
          if (Device.needsStatusbarOverlay()) {
            $$1('html').addClass('with-statusbar');
          }
        });
        return;
      }
      $$1('html').addClass('with-statusbar');
    },
    onClick: function onClick() {
      var app = this;
      var pageContent;
      if ($$1('.popup.modal-in').length > 0) {
        // Check for opened popup
        pageContent = $$1('.popup.modal-in').find('.page:not(.page-previous):not(.page-next):not(.cached)').find('.page-content');
      } else if ($$1('.panel.panel-active').length > 0) {
        // Check for opened panel
        pageContent = $$1('.panel.panel-active').find('.page:not(.page-previous):not(.page-next):not(.cached)').find('.page-content');
      } else if ($$1('.views > .view.tab-active').length > 0) {
        // View in tab bar app layout
        pageContent = $$1('.views > .view.tab-active').find('.page:not(.page-previous):not(.page-next):not(.cached)').find('.page-content');
      } else if ($$1('.views').length > 0) {
        pageContent = $$1('.views').find('.page:not(.page-previous):not(.page-next):not(.cached)').find('.page-content');
      } else {
        pageContent = app.root.children('.view').find('.page:not(.page-previous):not(.page-next):not(.cached)').find('.page-content');
      }

      if (pageContent && pageContent.length > 0) {
        // Check for tab
        if (pageContent.hasClass('tab')) {
          pageContent = pageContent.parent('.tabs').children('.page-content.tab-active');
        }
        if (pageContent.length > 0) { pageContent.scrollTop(0, 300); }
      }
    },
    setIosTextColor: function setIosTextColor(color) {
      if (Device.cordova && win.StatusBar) {
        if (color === 'white') {
          win.StatusBar.styleLightContent();
        } else {
          win.StatusBar.styleDefault();
        }
      }
    },
    setBackgroundColor: function setBackgroundColor(color) {
      $$1('.statusbar').css('background-color', color);
      if (Device.cordova && win.StatusBar) {
        win.StatusBar.backgroundColorByHexString(color);
      }
    },
    isVisible: function isVisible() {
      if (Device.cordova && win.StatusBar) {
        return win.StatusBar.isVisible;
      }
      return false;
    },
    iosOverlaysWebView: function iosOverlaysWebView(overlays) {
      if ( overlays === void 0 ) overlays = true;

      if (!Device.ios) { return; }
      if (Device.cordova && win.StatusBar) {
        win.StatusBar.overlaysWebView(overlays);
        if (overlays) {
          $$1('html').addClass('with-statusbar');
        } else {
          $$1('html').removeClass('with-statusbar');
        }
      }
    },
    checkOverlay: function checkOverlay() {
      if (Device.needsStatusbarOverlay()) {
        $$1('html').addClass('with-statusbar');
      } else {
        $$1('html').removeClass('with-statusbar');
      }
    },
    init: function init() {
      var app = this;
      var params = app.params.statusbar;
      if (!params.enabled) { return; }

      if (params.overlay === 'auto') {
        if (Device.needsStatusbarOverlay()) {
          $$1('html').addClass('with-statusbar');
        } else {
          $$1('html').removeClass('with-statusbar');
        }

        if (Device.ios && (Device.cordova || Device.webView)) {
          if (win.orientation === 0) {
            app.once('resize', function () {
              Statusbar.checkOverlay();
            });
          }

          $$1(doc).on('resume', function () {
            Statusbar.checkOverlay();
          }, false);

          app.on(Device.ios ? 'orientationchange' : 'orientationchange resize', function () {
            Statusbar.checkOverlay();
          });
        }
      } else if (params.overlay === true) {
        $$1('html').addClass('with-statusbar');
      } else if (params.overlay === false) {
        $$1('html').removeClass('with-statusbar');
      }

      if (Device.cordova && win.StatusBar) {
        if (params.scrollTopOnClick) {
          $$1(win).on('statusTap', Statusbar.onClick.bind(app));
        }
        if (params.iosOverlaysWebView) {
          win.StatusBar.overlaysWebView(true);
        } else {
          win.StatusBar.overlaysWebView(false);
        }

        if (params.iosTextColor === 'white') {
          win.StatusBar.styleLightContent();
        } else {
          win.StatusBar.styleDefault();
        }
      }
      if (params.iosBackgroundColor && app.theme === 'ios') {
        Statusbar.setBackgroundColor(params.iosBackgroundColor);
      }
      if (params.materialBackgroundColor && app.theme === 'md') {
        Statusbar.setBackgroundColor(params.materialBackgroundColor);
      }
    },
  };

  var Statusbar$1 = {
    name: 'statusbar',
    params: {
      statusbar: {
        enabled: true,
        overlay: 'auto',
        scrollTopOnClick: true,
        iosOverlaysWebView: true,
        iosTextColor: 'black',
        iosBackgroundColor: null,
        materialBackgroundColor: null,
      },
    },
    create: function create() {
      var app = this;
      Utils.extend(app, {
        statusbar: {
          checkOverlay: Statusbar.checkOverlay,
          hide: Statusbar.hide,
          show: Statusbar.show,
          iosOverlaysWebView: Statusbar.iosOverlaysWebView,
          setIosTextColor: Statusbar.setIosTextColor,
          setBackgroundColor: Statusbar.setBackgroundColor,
          isVisible: Statusbar.isVisible,
          init: Statusbar.init.bind(app),
        },
      });
    },
    on: {
      init: function init() {
        var app = this;
        Statusbar.init.call(app);
      },
    },
    clicks: {
      '.statusbar': function onStatusbarClick() {
        var app = this;
        if (!app.params.statusbar.enabled) { return; }
        if (!app.params.statusbar.scrollTopOnClick) { return; }
        Statusbar.onClick.call(app);
      },
    },
  };

  function getCurrentView(app) {
    var popoverView = $$1('.popover.modal-in .view');
    var popupView = $$1('.popup.modal-in .view');
    var panelView = $$1('.panel.panel-active .view');
    var appViews = $$1('.views');
    if (appViews.length === 0) { appViews = app.root; }
    // Find active view as tab
    var appView = appViews.children('.view');
    // Propably in tabs or split view
    if (appView.length > 1) {
      if (appView.hasClass('tab')) {
        // Tabs
        appView = appViews.children('.view.tab-active');
      }
    }
    if (popoverView.length > 0 && popoverView[0].f7View) { return popoverView[0].f7View; }
    if (popupView.length > 0 && popupView[0].f7View) { return popupView[0].f7View; }
    if (panelView.length > 0 && panelView[0].f7View) { return panelView[0].f7View; }
    if (appView.length > 0) {
      if (appView.length === 1 && appView[0].f7View) { return appView[0].f7View; }
      if (appView.length > 1) {
        return app.views.main;
      }
    }
    return undefined;
  }

  var View$1 = {
    name: 'view',
    params: {
      view: {
        name: undefined,
        main: false,
        router: true,
        linksView: null,
        stackPages: false,
        xhrCache: true,
        xhrCacheIgnore: [],
        xhrCacheIgnoreGetParameters: false,
        xhrCacheDuration: 1000 * 60 * 10, // Ten minutes
        preloadPreviousPage: true,
        uniqueHistory: false,
        uniqueHistoryIgnoreGetParameters: false,
        allowDuplicateUrls: false,
        reloadPages: false,
        removeElements: true,
        removeElementsWithTimeout: false,
        removeElementsTimeout: 0,
        restoreScrollTopOnBack: true,
        unloadTabContent: false,//by xiang to avoid load twice 
        passRouteQueryToRequest: true,
        passRouteParamsToRequest: false,
        // Swipe Back
        iosSwipeBack: true,
        iosSwipeBackAnimateShadow: true,
        iosSwipeBackAnimateOpacity: true,
        iosSwipeBackActiveArea: 30,
        iosSwipeBackThreshold: 0,
        mdSwipeBack: false,
        mdSwipeBackAnimateShadow: true,
        mdSwipeBackAnimateOpacity: false,
        mdSwipeBackActiveArea: 30,
        mdSwipeBackThreshold: 0,
        // Push State
        pushState: false,
        pushStateRoot: undefined,
        pushStateAnimate: true,
        pushStateAnimateOnLoad: false,
        pushStateSeparator: '#!',
        pushStateOnLoad: true,
        // Animate Pages
        animate: true,
        animateWithJS: false,
        // iOS Dynamic Navbar
        iosDynamicNavbar: true,
        iosSeparateDynamicNavbar: true,
        // Animate iOS Navbar Back Icon
        iosAnimateNavbarBackIcon: true,
        // Delays
        iosPageLoadDelay: 0,
        materialPageLoadDelay: 0,
        // Routes hooks
        routesBeforeEnter: null,
        routesBeforeLeave: null,
      },
    },
    static: {
      View: View,
    },
    create: function create() {
      var app = this;
      Utils.extend(app, {
        views: Utils.extend([], {
          create: function create(el, params) {
            return new View(app, el, params);
          },
          get: function get(viewEl) {
            var $viewEl = $$1(viewEl);
            if ($viewEl.length && $viewEl[0].f7View) { return $viewEl[0].f7View; }
            return undefined;
          },
        }),
      });
      Object.defineProperty(app.views, 'current', {
        enumerable: true,
        configurable: true,
        get: function get() {
          return getCurrentView(app);
        },
      });
      // Alias
      app.view = app.views;
    },
    on: {
      init: function init() {
        var app = this;
        $$1('.view-init').each(function (index, viewEl) {
          if (viewEl.f7View) { return; }
          var viewParams = $$1(viewEl).dataset();
          app.views.create(viewEl, viewParams);
        });
      },
      modalOpen: function modalOpen(modal) {
        var app = this;
        modal.$el.find('.view-init').each(function (index, viewEl) {
          if (viewEl.f7View) { return; }
          var viewParams = $$1(viewEl).dataset();
          app.views.create(viewEl, viewParams);
        });
      },
      modalBeforeDestroy: function modalBeforeDestroy(modal) {
        if (!modal || !modal.$el) { return; }
        modal.$el.find('.view-init').each(function (index, viewEl) {
          var view = viewEl.f7View;
          if (!view) { return; }
          view.destroy();
        });
      },
    },
  };

  var Navbar = {
    size: function size(el) {
      var app = this;
      if (app.theme !== 'ios') { return; }
      var $el = $$1(el);
      if ($el.hasClass('navbar')) {
        $el = $el.children('.navbar-inner').each(function (index, navbarEl) {
          app.navbar.size(navbarEl);
        });
        return;
      }
      if (
        $el.hasClass('stacked')
        || $el.parents('.stacked').length > 0
        || $el.parents('.tab:not(.tab-active)').length > 0
        || $el.parents('.popup:not(.modal-in)').length > 0
      ) {
        return;
      }
      var $viewEl = $el.parents('.view').eq(0);
      var left = app.rtl ? $el.children('.right') : $el.children('.left');
      var right = app.rtl ? $el.children('.left') : $el.children('.right');
      var title = $el.children('.title');
      var subnavbar = $el.children('.subnavbar');
      var noLeft = left.length === 0;
      var noRight = right.length === 0;
      var leftWidth = noLeft ? 0 : left.outerWidth(true);
      var rightWidth = noRight ? 0 : right.outerWidth(true);
      var titleWidth = title.outerWidth(true);
      var navbarStyles = $el.styles();
      var navbarWidth = $el[0].offsetWidth;
      var navbarInnerWidth = navbarWidth - parseInt(navbarStyles.paddingLeft, 10) - parseInt(navbarStyles.paddingRight, 10);
      var isPrevious = $el.hasClass('navbar-previous');
      var sliding = $el.hasClass('sliding');

      var router;
      var dynamicNavbar;
      var separateNavbar;
      var separateNavbarRightOffset = 0;
      var separateNavbarLeftOffset = 0;

      if ($viewEl.length > 0 && $viewEl[0].f7View) {
        router = $viewEl[0].f7View.router;
        dynamicNavbar = router && router.dynamicNavbar;
        separateNavbar = router && router.separateNavbar;
        if (!separateNavbar) {
          separateNavbarRightOffset = navbarWidth;
          separateNavbarLeftOffset = navbarWidth / 5;
        }
      }

      var currLeft;
      var diff;
      if (noRight) {
        currLeft = navbarInnerWidth - titleWidth;
      }
      if (noLeft) {
        currLeft = 0;
      }
      if (!noLeft && !noRight) {
        currLeft = ((navbarInnerWidth - rightWidth - titleWidth) + leftWidth) / 2;
      }
      var requiredLeft = (navbarInnerWidth - titleWidth) / 2;
      if (navbarInnerWidth - leftWidth - rightWidth > titleWidth) {
        if (requiredLeft < leftWidth) {
          requiredLeft = leftWidth;
        }
        if (requiredLeft + titleWidth > navbarInnerWidth - rightWidth) {
          requiredLeft = navbarInnerWidth - rightWidth - titleWidth;
        }
        diff = requiredLeft - currLeft;
      } else {
        diff = 0;
      }

      // RTL inverter
      var inverter = app.rtl ? -1 : 1;

      if (dynamicNavbar) {
        if (title.hasClass('sliding') || (title.length > 0 && sliding)) {
          var titleLeftOffset = (-(currLeft + diff) * inverter) + separateNavbarLeftOffset;
          var titleRightOffset = ((navbarInnerWidth - currLeft - diff - titleWidth) * inverter) - separateNavbarRightOffset;

          if (isPrevious) {
            if (router && router.params.iosAnimateNavbarBackIcon) {
              var activeNavbarBackLink = $el.parent().find('.navbar-current').children('.left.sliding').find('.back .icon ~ span');
              if (activeNavbarBackLink.length > 0) {
                titleLeftOffset += activeNavbarBackLink[0].offsetLeft;
              }
            }
          }
          title[0].f7NavbarLeftOffset = titleLeftOffset;
          title[0].f7NavbarRightOffset = titleRightOffset;
        }
        if (!noLeft && (left.hasClass('sliding') || sliding)) {
          if (app.rtl) {
            left[0].f7NavbarLeftOffset = (-(navbarInnerWidth - left[0].offsetWidth) / 2) * inverter;
            left[0].f7NavbarRightOffset = leftWidth * inverter;
          } else {
            left[0].f7NavbarLeftOffset = -leftWidth + separateNavbarLeftOffset;
            left[0].f7NavbarRightOffset = ((navbarInnerWidth - left[0].offsetWidth) / 2) - separateNavbarRightOffset;
            if (router && router.params.iosAnimateNavbarBackIcon && left.find('.back .icon').length > 0) {
              left[0].f7NavbarRightOffset -= left.find('.back .icon')[0].offsetWidth;
            }
          }
        }
        if (!noRight && (right.hasClass('sliding') || sliding)) {
          if (app.rtl) {
            right[0].f7NavbarLeftOffset = -rightWidth * inverter;
            right[0].f7NavbarRightOffset = ((navbarInnerWidth - right[0].offsetWidth) / 2) * inverter;
          } else {
            right[0].f7NavbarLeftOffset = (-(navbarInnerWidth - right[0].offsetWidth) / 2) + separateNavbarLeftOffset;
            right[0].f7NavbarRightOffset = rightWidth - separateNavbarRightOffset;
          }
        }
        if (subnavbar.length && (subnavbar.hasClass('sliding') || sliding)) {
          subnavbar[0].f7NavbarLeftOffset = app.rtl ? subnavbar[0].offsetWidth : (-subnavbar[0].offsetWidth + separateNavbarLeftOffset);
          subnavbar[0].f7NavbarRightOffset = (-subnavbar[0].f7NavbarLeftOffset - separateNavbarRightOffset) + separateNavbarLeftOffset;
        }
      }

      // Title left
      if (app.params.navbar.iosCenterTitle) {
        var titleLeft = diff;
        if (app.rtl && noLeft && noRight && title.length > 0) { titleLeft = -titleLeft; }
        title.css({ left: (titleLeft + "px") });
      }
    },
    hide: function hide(el, animate) {
      if ( animate === void 0 ) animate = true;

      var $el = $$1(el);
      if ($el.hasClass('navbar-inner')) { $el = $el.parents('.navbar'); }
      if (!$el.length) { return; }
      if ($el.hasClass('navbar-hidden')) { return; }
      var className = "navbar-hidden" + (animate ? ' navbar-transitioning' : '');
      $el.transitionEnd(function () {
        $el.removeClass('navbar-transitioning');
      });
      $el.addClass(className);
    },
    show: function show(el, animate) {
      if ( el === void 0 ) el = '.navbar-hidden';
      if ( animate === void 0 ) animate = true;

      var $el = $$1(el);
      if ($el.hasClass('navbar-inner')) { $el = $el.parents('.navbar'); }
      if (!$el.length) { return; }
      if (!$el.hasClass('navbar-hidden')) { return; }
      if (animate) {
        $el.addClass('navbar-transitioning');
        $el.transitionEnd(function () {
          $el.removeClass('navbar-transitioning');
        });
      }
      $el.removeClass('navbar-hidden');
    },
    getElByPage: function getElByPage(page) {
      var $pageEl;
      var $navbarEl;
      var pageData;
      if (page.$navbarEl || page.$el) {
        pageData = page;
        $pageEl = page.$el;
      } else {
        $pageEl = $$1(page);
        if ($pageEl.length > 0) { pageData = $pageEl[0].f7Page; }
      }
      if (pageData && pageData.$navbarEl && pageData.$navbarEl.length > 0) {
        $navbarEl = pageData.$navbarEl;
      } else if ($pageEl) {
        $navbarEl = $pageEl.children('.navbar').children('.navbar-inner');
      }
      if (!$navbarEl || ($navbarEl && $navbarEl.length === 0)) { return undefined; }
      return $navbarEl[0];
    },
    getPageByEl: function getPageByEl(navbarInnerEl) {
      var $navbarInnerEl = $$1(navbarInnerEl);
      if ($navbarInnerEl.hasClass('navbar')) {
        $navbarInnerEl = $navbarInnerEl.find('.navbar-inner');
        if ($navbarInnerEl.length > 1) { return undefined; }
      }
      return $navbarInnerEl[0].f7Page;
    },
    initHideNavbarOnScroll: function initHideNavbarOnScroll(pageEl, navbarInnerEl) {
      var app = this;
      var $pageEl = $$1(pageEl);
      var $navbarEl = $$1(navbarInnerEl || app.navbar.getElByPage(pageEl)).closest('.navbar');

      var previousScrollTop;
      var currentScrollTop;

      var scrollHeight;
      var offsetHeight;
      var reachEnd;
      var action;
      var navbarHidden;
      function handleScroll() {
        var scrollContent = this;
        if ($pageEl.hasClass('page-previous')) { return; }
        currentScrollTop = scrollContent.scrollTop;
        scrollHeight = scrollContent.scrollHeight;
        offsetHeight = scrollContent.offsetHeight;
        reachEnd = currentScrollTop + offsetHeight >= scrollHeight;
        navbarHidden = $navbarEl.hasClass('navbar-hidden');

        if (reachEnd) {
          if (app.params.navbar.showOnPageScrollEnd) {
            action = 'show';
          }
        } else if (previousScrollTop > currentScrollTop) {
          if (app.params.navbar.showOnPageScrollTop || currentScrollTop <= 44) {
            action = 'show';
          } else {
            action = 'hide';
          }
        } else if (currentScrollTop > 44) {
          action = 'hide';
        } else {
          action = 'show';
        }

        if (action === 'show' && navbarHidden) {
          app.navbar.show($navbarEl);
          navbarHidden = false;
        } else if (action === 'hide' && !navbarHidden) {
          app.navbar.hide($navbarEl);
          navbarHidden = true;
        }

        previousScrollTop = currentScrollTop;
      }
      $pageEl.on('scroll', '.page-content', handleScroll, true);
      $pageEl[0].f7ScrollNavbarHandler = handleScroll;
    },
  };
  var Navbar$1 = {
    name: 'navbar',
    create: function create() {
      var app = this;
      Utils.extend(app, {
        navbar: {
          size: Navbar.size.bind(app),
          hide: Navbar.hide.bind(app),
          show: Navbar.show.bind(app),
          getElByPage: Navbar.getElByPage.bind(app),
          initHideNavbarOnScroll: Navbar.initHideNavbarOnScroll.bind(app),
        },
      });
    },
    params: {
      navbar: {
        scrollTopOnTitleClick: true,
        iosCenterTitle: true,
        hideOnPageScroll: false,
        showOnPageScrollEnd: true,
        showOnPageScrollTop: true,
      },
    },
    on: {
      'panelBreakpoint resize': function onResize() {
        var app = this;
        if (app.theme !== 'ios') { return; }
        $$1('.navbar').each(function (index, navbarEl) {
          app.navbar.size(navbarEl);
        });
      },
      pageBeforeRemove: function pageBeforeRemove(page) {
        if (page.$el[0].f7ScrollNavbarHandler) {
          page.$el.off('scroll', '.page-content', page.$el[0].f7ScrollNavbarHandler, true);
        }
      },
      pageBeforeIn: function pageBeforeIn(page) {
        var app = this;
        if (app.theme !== 'ios') { return; }
        var $navbarEl;
        var view = page.$el.parents('.view')[0].f7View;
        var navbarInnerEl = app.navbar.getElByPage(page);
        if (!navbarInnerEl) {
          $navbarEl = page.$el.parents('.view').children('.navbar');
        } else {
          $navbarEl = $$1(navbarInnerEl).parents('.navbar');
        }
        if (page.$el.hasClass('no-navbar') || (view.router.dynamicNavbar && !navbarInnerEl)) {
          var animate = !!(page.pageFrom && page.router.history.length > 0);
          app.navbar.hide($navbarEl, animate);
        } else {
          app.navbar.show($navbarEl);
        }
      },
      pageReinit: function pageReinit(page) {
        var app = this;
        if (app.theme !== 'ios') { return; }
        var $navbarEl = $$1(app.navbar.getElByPage(page));
        if (!$navbarEl || $navbarEl.length === 0) { return; }
        app.navbar.size($navbarEl);
      },
      pageInit: function pageInit(page) {
        var app = this;
        var $navbarEl = $$1(app.navbar.getElByPage(page));
        if (!$navbarEl || $navbarEl.length === 0) { return; }
        if (app.theme === 'ios') {
          app.navbar.size($navbarEl);
        }
        if (
          app.params.navbar.hideOnPageScroll
          || page.$el.find('.hide-navbar-on-scroll').length
          || page.$el.hasClass('hide-navbar-on-scroll')
          || page.$el.find('.hide-bars-on-scroll').length
          || page.$el.hasClass('hide-bars-on-scroll')
        ) {
          if (
            page.$el.find('.keep-navbar-on-scroll').length
            || page.$el.hasClass('keep-navbar-on-scroll')
            || page.$el.find('.keep-bars-on-scroll').length
            || page.$el.hasClass('keep-bars-on-scroll')
          ) {
            return;
          }
          app.navbar.initHideNavbarOnScroll(page.el, $navbarEl[0]);
        }
      },
      modalOpen: function modalOpen(modal) {
        var app = this;
        if (app.theme !== 'ios') { return; }
        modal.$el.find('.navbar:not(.navbar-previous):not(.stacked)').each(function (index, navbarEl) {
          app.navbar.size(navbarEl);
        });
      },
      panelOpen: function panelOpen(panel) {
        var app = this;
        if (app.theme !== 'ios') { return; }
        panel.$el.find('.navbar:not(.navbar-previous):not(.stacked)').each(function (index, navbarEl) {
          app.navbar.size(navbarEl);
        });
      },
      panelSwipeOpen: function panelSwipeOpen(panel) {
        var app = this;
        if (app.theme !== 'ios') { return; }
        panel.$el.find('.navbar:not(.navbar-previous):not(.stacked)').each(function (index, navbarEl) {
          app.navbar.size(navbarEl);
        });
      },
      tabShow: function tabShow(tabEl) {
        var app = this;
        $$1(tabEl).find('.navbar:not(.navbar-previous):not(.stacked)').each(function (index, navbarEl) {
          app.navbar.size(navbarEl);
        });
      },
    },
    clicks: {
      '.navbar .title': function onTitleClick($clickedEl) {
        var app = this;
        if (!app.params.navbar.scrollTopOnTitleClick) { return; }
        if ($clickedEl.closest('a').length > 0) {
          return;
        }
        var pageContent;
        // Find active page
        var navbar = $clickedEl.parents('.navbar');

        // Static Layout
        pageContent = navbar.parents('.page-content');

        if (pageContent.length === 0) {
          // Fixed Layout
          if (navbar.parents('.page').length > 0) {
            pageContent = navbar.parents('.page').find('.page-content');
          }
          // Through Layout
          if (pageContent.length === 0) {
            if (navbar.nextAll('.page-current:not(.stacked)').length > 0) {
              pageContent = navbar.nextAll('.page-current:not(.stacked)').find('.page-content');
            }
          }
        }
        if (pageContent && pageContent.length > 0) {
          // Check for tab
          if (pageContent.hasClass('tab')) {
            pageContent = pageContent.parent('.tabs').children('.page-content.tab-active');
          }
          if (pageContent.length > 0) { pageContent.scrollTop(0, 300); }
        }
      },
    },
  };

  var Toolbar = {
    setHighlight: function setHighlight(tabbarEl) {
      var app = this;
      if (app.theme !== 'md') { return; }

      var $tabbarEl = $$1(tabbarEl);

      if ($tabbarEl.length === 0 || !($tabbarEl.hasClass('tabbar') || $tabbarEl.hasClass('tabbar-labels'))) { return; }

      if ($tabbarEl.find('.tab-link-highlight').length === 0) {
        $tabbarEl.children('.toolbar-inner').append('<span class="tab-link-highlight"></span>');
      }

      var $highlightEl = $tabbarEl.find('.tab-link-highlight');
      var $activeLink = $tabbarEl.find('.tab-link-active');
      var highlightWidth;
      var highlightTranslate;

      if ($tabbarEl.hasClass('tabbar-scrollable') && $activeLink && $activeLink[0]) {
        highlightWidth = ($activeLink[0].offsetWidth) + "px";
        highlightTranslate = ($activeLink[0].offsetLeft) + "px";
      } else {
        var activeIndex = $activeLink.index();
        var tabLinksCount = $tabbarEl.find('.tab-link').length;
        highlightWidth = (100 / tabLinksCount) + "%";
        highlightTranslate = ((app.rtl ? -activeIndex : activeIndex) * 100) + "%";
      }

      $highlightEl
        .css('width', highlightWidth)
        .transform(("translate3d(" + highlightTranslate + ",0,0)"));
    },
    init: function init(tabbarEl) {
      var app = this;
      app.toolbar.setHighlight(tabbarEl);
    },
    hide: function hide(el, animate) {
      if ( animate === void 0 ) animate = true;

      var $el = $$1(el);
      if ($el.hasClass('toolbar-hidden')) { return; }
      var className = "toolbar-hidden" + (animate ? ' toolbar-transitioning' : '');
      $el.transitionEnd(function () {
        $el.removeClass('toolbar-transitioning');
      });
      $el.addClass(className);
    },
    show: function show(el, animate) {
      if ( animate === void 0 ) animate = true;

      var $el = $$1(el);
      if (!$el.hasClass('toolbar-hidden')) { return; }
      if (animate) {
        $el.addClass('toolbar-transitioning');
        $el.transitionEnd(function () {
          $el.removeClass('toolbar-transitioning');
        });
      }
      $el.removeClass('toolbar-hidden');
    },
    initHideToolbarOnScroll: function initHideToolbarOnScroll(pageEl) {
      var app = this;
      var $pageEl = $$1(pageEl);
      var $toolbarEl = $pageEl.parents('.view').children('.toolbar');
      if ($toolbarEl.length === 0) {
        $toolbarEl = $pageEl.find('.toolbar');
      }
      if ($toolbarEl.length === 0) {
        $toolbarEl = $pageEl.parents('.views').children('.tabbar, .tabbar-labels');
      }
      if ($toolbarEl.length === 0) {
        return;
      }

      var previousScrollTop;
      var currentScrollTop;

      var scrollHeight;
      var offsetHeight;
      var reachEnd;
      var action;
      var toolbarHidden;
      function handleScroll() {
        var scrollContent = this;
        if ($pageEl.hasClass('page-previous')) { return; }
        currentScrollTop = scrollContent.scrollTop;
        scrollHeight = scrollContent.scrollHeight;
        offsetHeight = scrollContent.offsetHeight;
        reachEnd = currentScrollTop + offsetHeight >= scrollHeight;
        toolbarHidden = $toolbarEl.hasClass('toolbar-hidden');

        if (reachEnd) {
          if (app.params.toolbar.showOnPageScrollEnd) {
            action = 'show';
          }
        } else if (previousScrollTop > currentScrollTop) {
          if (app.params.toolbar.showOnPageScrollTop || currentScrollTop <= 44) {
            action = 'show';
          } else {
            action = 'hide';
          }
        } else if (currentScrollTop > 44) {
          action = 'hide';
        } else {
          action = 'show';
        }

        if (action === 'show' && toolbarHidden) {
          app.toolbar.show($toolbarEl);
          toolbarHidden = false;
        } else if (action === 'hide' && !toolbarHidden) {
          app.toolbar.hide($toolbarEl);
          toolbarHidden = true;
        }

        previousScrollTop = currentScrollTop;
      }
      $pageEl.on('scroll', '.page-content', handleScroll, true);
      $pageEl[0].f7ScrollToolbarHandler = handleScroll;
    },
  };
  var Toolbar$1 = {
    name: 'toolbar',
    create: function create() {
      var app = this;
      Utils.extend(app, {
        toolbar: {
          hide: Toolbar.hide.bind(app),
          show: Toolbar.show.bind(app),
          setHighlight: Toolbar.setHighlight.bind(app),
          initHideToolbarOnScroll: Toolbar.initHideToolbarOnScroll.bind(app),
          init: Toolbar.init.bind(app),
        },
      });
    },
    params: {
      toolbar: {
        hideOnPageScroll: false,
        showOnPageScrollEnd: true,
        showOnPageScrollTop: true,
      },
    },
    on: {
      pageBeforeRemove: function pageBeforeRemove(page) {
        if (page.$el[0].f7ScrollToolbarHandler) {
          page.$el.off('scroll', '.page-content', page.$el[0].f7ScrollToolbarHandler, true);
        }
      },
      pageBeforeIn: function pageBeforeIn(page) {
        var app = this;
        var $toolbarEl = page.$el.parents('.view').children('.toolbar');
        if ($toolbarEl.length === 0) {
          $toolbarEl = page.$el.find('.toolbar');
        }
        if ($toolbarEl.length === 0) {
          $toolbarEl = page.$el.parents('.views').children('.tabbar, .tabbar-labels');
        }
        if ($toolbarEl.length === 0) {
          return;
        }
        if (page.$el.hasClass('no-toolbar')) {
          app.toolbar.hide($toolbarEl);
        } else {
          app.toolbar.show($toolbarEl);
        }
      },
      pageInit: function pageInit(page) {
        var app = this;
        page.$el.find('.tabbar, .tabbar-labels').each(function (index, tabbarEl) {
          app.toolbar.init(tabbarEl);
        });
        if (
          app.params.toolbar.hideOnPageScroll
          || page.$el.find('.hide-toolbar-on-scroll').length
          || page.$el.hasClass('hide-toolbar-on-scroll')
          || page.$el.find('.hide-bars-on-scroll').length
          || page.$el.hasClass('hide-bars-on-scroll')
        ) {
          if (
            page.$el.find('.keep-toolbar-on-scroll').length
            || page.$el.hasClass('keep-toolbar-on-scroll')
            || page.$el.find('.keep-bars-on-scroll').length
            || page.$el.hasClass('keep-bars-on-scroll')
          ) {
            return;
          }
          app.toolbar.initHideToolbarOnScroll(page.el);
        }
      },
      init: function init() {
        var app = this;
        app.root.find('.tabbar, .tabbar-labels').each(function (index, tabbarEl) {
          app.toolbar.init(tabbarEl);
        });
      },
    },
  };

  var Subnavbar = {
    name: 'subnavbar',
    on: {
      pageInit: function pageInit(page) {
        if (page.$navbarEl && page.$navbarEl.length && page.$navbarEl.find('.subnavbar').length) {
          page.$el.addClass('page-with-subnavbar');
        }
        if (page.$el.find('.subnavbar').length) {
          page.$el.addClass('page-with-subnavbar');
        }
      },
    },
  };

  var TouchRipple = function TouchRipple($el, x, y) {
    var ripple = this;
    if (!$el) { return undefined; }
    var box = $el[0].getBoundingClientRect();
    var center = {
      x: x - box.left,
      y: y - box.top,
    };
    var width = box.width;
    var height = box.height;
    var diameter = Math.max((Math.pow( ((Math.pow( height, 2 )) + (Math.pow( width, 2 ))), 0.5 )), 48);

    ripple.$rippleWaveEl = $$1(("<div class=\"ripple-wave\" style=\"width: " + diameter + "px; height: " + diameter + "px; margin-top:-" + (diameter / 2) + "px; margin-left:-" + (diameter / 2) + "px; left:" + (center.x) + "px; top:" + (center.y) + "px;\"></div>"));

    $el.prepend(ripple.$rippleWaveEl);

    /* eslint no-underscore-dangle: ["error", { "allow": ["_clientLeft"] }] */
    ripple._clientLeft = ripple.$rippleWaveEl[0].clientLeft;

    ripple.rippleTransform = "translate3d(" + (-center.x + (width / 2)) + "px, " + (-center.y + (height / 2)) + "px, 0) scale(1)";

    ripple.$rippleWaveEl.transform(ripple.rippleTransform);

    return ripple;
  };

  TouchRipple.prototype.onRemove = function onRemove () {
    var ripple = this;
    if (ripple.$rippleWaveEl) {
      ripple.$rippleWaveEl.remove();
    }
    Object.keys(ripple).forEach(function (key) {
      ripple[key] = null;
      delete ripple[key];
    });
    ripple = null;
  };

  TouchRipple.prototype.remove = function remove () {
    var ripple = this;
    if (ripple.removing) { return; }
    var $rippleWaveEl = this.$rippleWaveEl;
    var rippleTransform = this.rippleTransform;
    var removeTimeout = Utils.nextTick(function () {
      ripple.onRemove();
    }, 400);
    ripple.removing = true;
    $rippleWaveEl
      .addClass('ripple-wave-fill')
      .transform(rippleTransform.replace('scale(1)', 'scale(1.01)'))
      .transitionEnd(function () {
        clearTimeout(removeTimeout);
        Utils.nextFrame(function () {
          $rippleWaveEl
            .addClass('ripple-wave-out')
            .transform(rippleTransform.replace('scale(1)', 'scale(1.01)'));

          removeTimeout = Utils.nextTick(function () {
            ripple.onRemove();
          }, 700);

          $rippleWaveEl.transitionEnd(function () {
            clearTimeout(removeTimeout);
            ripple.onRemove();
          });
        });
      });
  };

  var TouchRipple$1 = {
    name: 'touch-ripple',
    static: {
      TouchRipple: TouchRipple,
    },
    create: function create() {
      var app = this;
      app.touchRipple = {
        create: function create() {
          var args = [], len = arguments.length;
          while ( len-- ) args[ len ] = arguments[ len ];

          return new (Function.prototype.bind.apply( TouchRipple, [ null ].concat( args) ));
        },
      };
    },
  };

  var openedModals = [];
  var dialogsQueue = [];
  function clearDialogsQueue() {
    if (dialogsQueue.length === 0) { return; }
    var dialog = dialogsQueue.shift();
    dialog.open();
  }
  var Modal = (function (Framework7Class$$1) {
    function Modal(app, params) {
      Framework7Class$$1.call(this, params, [app]);

      var modal = this;

      var defaults = {};

      // Extend defaults with modules params
      modal.useModulesParams(defaults);

      modal.params = Utils.extend(defaults, params);
      modal.opened = false;

      // Install Modules
      modal.useModules();

      return this;
    }

    if ( Framework7Class$$1 ) Modal.__proto__ = Framework7Class$$1;
    Modal.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    Modal.prototype.constructor = Modal;

    Modal.prototype.onOpen = function onOpen () {
      var modal = this;
      modal.opened = true;
      openedModals.push(modal);
      $$1('html').addClass(("with-modal-" + (modal.type.toLowerCase())));
      modal.$el.trigger(("modal:open " + (modal.type.toLowerCase()) + ":open"), modal);
      modal.emit(("local::open modalOpen " + (modal.type) + "Open"), modal);
    };

    Modal.prototype.onOpened = function onOpened () {
      var modal = this;
      modal.$el.trigger(("modal:opened " + (modal.type.toLowerCase()) + ":opened"), modal);
      modal.emit(("local::opened modalOpened " + (modal.type) + "Opened"), modal);
    };

    Modal.prototype.onClose = function onClose () {
      var modal = this;
      modal.opened = false;
      if (!modal.type || !modal.$el) { return; }
      openedModals.splice(openedModals.indexOf(modal), 1);
      $$1('html').removeClass(("with-modal-" + (modal.type.toLowerCase())));
      modal.$el.trigger(("modal:close " + (modal.type.toLowerCase()) + ":close"), modal);
      modal.emit(("local::close modalClose " + (modal.type) + "Close"), modal);
    };

    Modal.prototype.onClosed = function onClosed () {
      var modal = this;
      if (!modal.type || !modal.$el) { return; }
      modal.$el.removeClass('modal-out');
      modal.$el.hide();
      modal.$el.trigger(("modal:closed " + (modal.type.toLowerCase()) + ":closed"), modal);
      modal.emit(("local::closed modalClosed " + (modal.type) + "Closed"), modal);
    };

    Modal.prototype.open = function open (animateModal) {
      var modal = this;
      var app = modal.app;
      var $el = modal.$el;
      var $backdropEl = modal.$backdropEl;
      var type = modal.type;
      var animate = true;
      if (typeof animateModal !== 'undefined') { animate = animateModal; }
      else if (typeof modal.params.animate !== 'undefined') {
        animate = modal.params.animate;
      }

      if (!$el || $el.hasClass('modal-in')) {
        return modal;
      }

      if (type === 'dialog' && app.params.modal.queueDialogs) {
        var pushToQueue;
        if ($$1('.dialog.modal-in').length > 0) {
          pushToQueue = true;
        } else if (openedModals.length > 0) {
          openedModals.forEach(function (openedModal) {
            if (openedModal.type === 'dialog') { pushToQueue = true; }
          });
        }
        if (pushToQueue) {
          dialogsQueue.push(modal);
          return modal;
        }
      }

      var $modalParentEl = $el.parent();
      var wasInDom = $el.parents(doc).length > 0;
      if (app.params.modal.moveToRoot && !$modalParentEl.is(app.root)) {
        app.root.append($el);
        modal.once((type + "Closed"), function () {
          if (wasInDom) {
            $modalParentEl.append($el);
          } else {
            $el.remove();
          }
        });
      }
      // Show Modal
      $el.show();

      // Set Dialog offset
      if (type === 'dialog') {
        $el.css({
          marginTop: ((-Math.round($el.outerHeight() / 2)) + "px"),
        });
      }

      // Emit open
      /* eslint no-underscore-dangle: ["error", { "allow": ["_clientLeft"] }] */
      modal._clientLeft = $el[0].clientLeft;

      // Backdrop
      if ($backdropEl) {
        $backdropEl[animate ? 'removeClass' : 'addClass']('not-animated');
        $backdropEl.addClass('backdrop-in');
      }
      // Modal
      function transitionEnd() {
        if ($el.hasClass('modal-out')) {
          modal.onClosed();
        } else if ($el.hasClass('modal-in')) {
          modal.onOpened();
        }
      }
      if (animate) {
        $el
          .animationEnd(function () {
            transitionEnd();
          });
        $el
          .transitionEnd(function () {
            transitionEnd();
          });
        $el
          .removeClass('modal-out not-animated')
          .addClass('modal-in');
        modal.onOpen();
      } else {
        $el.removeClass('modal-out').addClass('modal-in not-animated');
        modal.onOpen();
        modal.onOpened();
      }

      return modal;
    };

    Modal.prototype.close = function close (animateModal) {
      var modal = this;
      var $el = modal.$el;
      var $backdropEl = modal.$backdropEl;

      var animate = true;
      if (typeof animateModal !== 'undefined') { animate = animateModal; }
      else if (typeof modal.params.animate !== 'undefined') {
        animate = modal.params.animate;
      }

      if (!$el || !$el.hasClass('modal-in')) {
        return modal;
      }

      // backdrop
      if ($backdropEl) {
        $backdropEl[animate ? 'removeClass' : 'addClass']('not-animated');
        $backdropEl.removeClass('backdrop-in');
      }

      // Modal
      $el[animate ? 'removeClass' : 'addClass']('not-animated');
      function transitionEnd() {
        if ($el.hasClass('modal-out')) {
          modal.onClosed();
        } else if ($el.hasClass('modal-in')) {
          modal.onOpened();
        }
      }
      if (animate) {
        $el
          .animationEnd(function () {
            transitionEnd();
          });
        $el
          .transitionEnd(function () {
            transitionEnd();
          });
        $el
          .removeClass('modal-in')
          .addClass('modal-out');
        // Emit close
        modal.onClose();
      } else {
        $el
          .addClass('not-animated')
          .removeClass('modal-in')
          .addClass('modal-out');
        // Emit close
        modal.onClose();
        modal.onClosed();
      }

      if (modal.type === 'dialog') {
        clearDialogsQueue();
      }

      return modal;
    };

    Modal.prototype.destroy = function destroy () {
      var modal = this;
      if (modal.destroyed) { return; }
      modal.emit(("local::beforeDestroy modalBeforeDestroy " + (modal.type) + "BeforeDestroy"), modal);
      if (modal.$el) {
        modal.$el.trigger(("modal:beforedestroy " + (modal.type.toLowerCase()) + ":beforedestroy"), modal);
        if (modal.$el.length && modal.$el[0].f7Modal) {
          delete modal.$el[0].f7Modal;
        }
      }
      Utils.deleteProps(modal);
      modal.destroyed = true;
    };

    return Modal;
  }(Framework7Class));

  var CustomModal = (function (Modal$$1) {
    function CustomModal(app, params) {
      var extendedParams = Utils.extend({
        backdrop: true,
        closeByBackdropClick: true,
        on: {},
      }, params);

      // Extends with open/close Modal methods;
      Modal$$1.call(this, app, extendedParams);

      var customModal = this;

      customModal.params = extendedParams;

      // Find Element
      var $el;
      if (!customModal.params.el) {
        $el = $$1(customModal.params.content);
      } else {
        $el = $$1(customModal.params.el);
      }

      if ($el && $el.length > 0 && $el[0].f7Modal) {
        return $el[0].f7Modal;
      }

      if ($el.length === 0) {
        return customModal.destroy();
      }
      var $backdropEl;
      if (customModal.params.backdrop) {
        $backdropEl = app.root.children('.custom-modal-backdrop');
        if ($backdropEl.length === 0) {
          $backdropEl = $$1('<div class="custom-modal-backdrop"></div>');
          app.root.append($backdropEl);
        }
      }

      function handleClick(e) {
        if (!customModal || customModal.destroyed) { return; }
        if ($backdropEl && e.target === $backdropEl[0]) {
          customModal.close();
        }
      }

      customModal.on('customModalOpened', function () {
        if (customModal.params.closeByBackdropClick && customModal.params.backdrop) {
          app.on('click', handleClick);
        }
      });
      customModal.on('customModalClose', function () {
        if (customModal.params.closeByBackdropClick && customModal.params.backdrop) {
          app.off('click', handleClick);
        }
      });

      Utils.extend(customModal, {
        app: app,
        $el: $el,
        el: $el[0],
        $backdropEl: $backdropEl,
        backdropEl: $backdropEl && $backdropEl[0],
        type: 'customModal',
      });

      $el[0].f7Modal = customModal;

      return customModal;
    }

    if ( Modal$$1 ) CustomModal.__proto__ = Modal$$1;
    CustomModal.prototype = Object.create( Modal$$1 && Modal$$1.prototype );
    CustomModal.prototype.constructor = CustomModal;

    return CustomModal;
  }(Modal));

  var Modal$1 = {
    name: 'modal',
    static: {
      Modal: Modal,
      CustomModal: CustomModal,
    },
    create: function create() {
      var app = this;
      app.customModal = {
        create: function create(params) {
          return new CustomModal(app, params);
        },
      };
    },
    params: {
      modal: {
        moveToRoot: true,
        queueDialogs: true,
      },
    },
  };

  var Dialog = (function (Modal$$1) {
    function Dialog(app, params) {
      var extendedParams = Utils.extend({
        title: app.params.dialog.title,
        text: undefined,
        content: '',
        buttons: [],
        verticalButtons: false,
        onClick: undefined,
        cssClass: undefined,
        destroyOnClose: false,
        on: {},
      }, params);
      if (typeof extendedParams.closeByBackdropClick === 'undefined') {
        extendedParams.closeByBackdropClick = app.params.dialog.closeByBackdropClick;
      }

      // Extends with open/close Modal methods;
      Modal$$1.call(this, app, extendedParams);

      var dialog = this;

      var title = extendedParams.title;
      var text = extendedParams.text;
      var content = extendedParams.content;
      var buttons = extendedParams.buttons;
      var verticalButtons = extendedParams.verticalButtons;
      var cssClass = extendedParams.cssClass;

      dialog.params = extendedParams;

      // Find Element
      var $el;
      if (!dialog.params.el) {
        var dialogClasses = ['dialog'];
        if (buttons.length === 0) { dialogClasses.push('dialog-no-buttons'); }
        if (buttons.length > 0) { dialogClasses.push(("dialog-buttons-" + (buttons.length))); }
        if (verticalButtons) { dialogClasses.push('dialog-buttons-vertical'); }
        if (cssClass) { dialogClasses.push(cssClass); }

        var buttonsHTML = '';
        if (buttons.length > 0) {
          buttonsHTML = "\n          <div class=\"dialog-buttons\">\n            " + (buttons.map(function (button) { return ("\n              <span class=\"dialog-button" + (button.bold ? ' dialog-button-bold' : '') + (button.color ? (" color-" + (button.color)) : '') + (button.cssClass ? (" " + (button.cssClass)) : '') + "\">" + (button.text) + "</span>\n            "); }).join('')) + "\n          </div>\n        ";
        }

        var dialogHtml = "\n        <div class=\"" + (dialogClasses.join(' ')) + "\">\n          <div class=\"dialog-inner\">\n            " + (title ? ("<div class=\"dialog-title\">" + title + "</div>") : '') + "\n            " + (text ? ("<div class=\"dialog-text\">" + text + "</div>") : '') + "\n            " + content + "\n          </div>\n          " + buttonsHTML + "\n        </div>\n      ";
        $el = $$1(dialogHtml);
      } else {
        $el = $$1(dialog.params.el);
      }

      if ($el && $el.length > 0 && $el[0].f7Modal) {
        return $el[0].f7Modal;
      }

      if ($el.length === 0) {
        return dialog.destroy();
      }

      var $backdropEl = app.root.children('.dialog-backdrop');
      if ($backdropEl.length === 0) {
        $backdropEl = $$1('<div class="dialog-backdrop"></div>');
        app.root.append($backdropEl);
      }

      // Assign events
      function buttonOnClick(e) {
        var buttonEl = this;
        var index = $$1(buttonEl).index();
        var button = buttons[index];
        if (button.onClick) { button.onClick(dialog, e); }
        if (dialog.params.onClick) { dialog.params.onClick(dialog, index); }
        if (button.close !== false) { dialog.close(); }
      }
      var addKeyboardHander;
      function onKeyPress(e) {
        var keyCode = e.keyCode;
        buttons.forEach(function (button, index) {
          if (button.keyCodes && button.keyCodes.indexOf(keyCode) >= 0) {
            if (doc.activeElement) { doc.activeElement.blur(); }
            if (button.onClick) { button.onClick(dialog, e); }
            if (dialog.params.onClick) { dialog.params.onClick(dialog, index); }
            if (button.close !== false) { dialog.close(); }
          }
        });
      }
      if (buttons && buttons.length > 0) {
        dialog.on('open', function () {
          $el.find('.dialog-button').each(function (index, buttonEl) {
            var button = buttons[index];
            if (button.keyCodes) { addKeyboardHander = true; }
            $$1(buttonEl).on('click', buttonOnClick);
          });
          if (
            addKeyboardHander
            && !app.device.ios
            && !app.device.android
            && !app.device.cordova
          ) {
            $$1(doc).on('keydown', onKeyPress);
          }
        });
        dialog.on('close', function () {
          $el.find('.dialog-button').each(function (index, buttonEl) {
            $$1(buttonEl).off('click', buttonOnClick);
          });
          if (
            addKeyboardHander
            && !app.device.ios
            && !app.device.android
            && !app.device.cordova
          ) {
            $$1(doc).off('keydown', onKeyPress);
          }
          addKeyboardHander = false;
        });
      }
      Utils.extend(dialog, {
        app: app,
        $el: $el,
        el: $el[0],
        $backdropEl: $backdropEl,
        backdropEl: $backdropEl[0],
        type: 'dialog',
        setProgress: function setProgress(progress, duration) {
          app.progressbar.set($el.find('.progressbar'), progress, duration);
          return dialog;
        },
        setText: function setText(newText) {
          var $textEl = $el.find('.dialog-text');
          if ($textEl.length === 0) {
            $textEl = $$1('<div class="dialog-text"></div>');
            if (typeof title !== 'undefined') {
              $textEl.insertAfter($el.find('.dialog-title'));
            } else {
              $el.find('.dialog-inner').prepend($textEl);
            }
          }
          $textEl.html(newText);
          dialog.params.text = newText;
          return dialog;
        },
        setTitle: function setTitle(newTitle) {
          var $titleEl = $el.find('.dialog-title');
          if ($titleEl.length === 0) {
            $titleEl = $$1('<div class="dialog-title"></div>');
            $el.find('.dialog-inner').prepend($titleEl);
          }
          $titleEl.html(newTitle);
          dialog.params.title = newTitle;
          return dialog;
        },
      });

      function handleClick(e) {
        var target = e.target;
        var $target = $$1(target);
        if ($target.closest(dialog.el).length === 0) {
          if (
            dialog.params.closeByBackdropClick
            && dialog.backdropEl
            && dialog.backdropEl === target
          ) {
            dialog.close();
          }
        }
      }

      dialog.on('opened', function () {
        if (dialog.params.closeByBackdropClick) {
          app.on('click', handleClick);
        }
      });
      dialog.on('close', function () {
        if (dialog.params.closeByBackdropClick) {
          app.off('click', handleClick);
        }
      });

      $el[0].f7Modal = dialog;

      if (dialog.params.destroyOnClose) {
        dialog.once('closed', function () {
          setTimeout(function () {
            dialog.destroy();
          }, 0);
        });
      }

      return dialog;
    }

    if ( Modal$$1 ) Dialog.__proto__ = Modal$$1;
    Dialog.prototype = Object.create( Modal$$1 && Modal$$1.prototype );
    Dialog.prototype.constructor = Dialog;

    return Dialog;
  }(Modal));

  function ConstructorMethods (parameters) {
    if ( parameters === void 0 ) parameters = {};

    var defaultSelector = parameters.defaultSelector;
    var constructor = parameters.constructor;
    var domProp = parameters.domProp;
    var app = parameters.app;
    var addMethods = parameters.addMethods;
    var methods = {
      create: function create() {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

        if (app) { return new (Function.prototype.bind.apply( constructor, [ null ].concat( [app], args) )); }
        return new (Function.prototype.bind.apply( constructor, [ null ].concat( args) ));
      },
      get: function get(el) {
        if ( el === void 0 ) el = defaultSelector;

        if (el instanceof constructor) { return el; }
        var $el = $$1(el);
        if ($el.length === 0) { return undefined; }
        return $el[0][domProp];
      },
      destroy: function destroy(el) {
        var instance = methods.get(el);
        if (instance && instance.destroy) { return instance.destroy(); }
        return undefined;
      },
    };
    if (addMethods && Array.isArray(addMethods)) {
      addMethods.forEach(function (methodName) {
        methods[methodName] = function (el) {
          if ( el === void 0 ) el = defaultSelector;
          var args = [], len = arguments.length - 1;
          while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

          var instance = methods.get(el);
          if (instance && instance[methodName]) { return instance[methodName].apply(instance, args); }
          return undefined;
        };
      });
    }
    return methods;
  }

  function ModalMethods (parameters) {
    if ( parameters === void 0 ) parameters = {};

    var defaultSelector = parameters.defaultSelector;
    var constructor = parameters.constructor;
    var app = parameters.app;
    var methods = Utils.extend(
      ConstructorMethods({
        defaultSelector: defaultSelector,
        constructor: constructor,
        app: app,
        domProp: 'f7Modal',
      }),
      {
        open: function open(el, animate) {
          var $el = $$1(el);
          var instance = $el[0].f7Modal;
          if (!instance) { instance = new constructor(app, { el: $el }); }
          return instance.open(animate);
        },
        close: function close(el, animate) {
          if ( el === void 0 ) el = defaultSelector;

          var $el = $$1(el);
          if ($el.length === 0) { return undefined; }
          var instance = $el[0].f7Modal;
          if (!instance) { instance = new constructor(app, { el: $el }); }
          return instance.close(animate);
        },
      }
    );
    return methods;
  }

  var Dialog$1 = {
    name: 'dialog',
    params: {
      dialog: {
        title: undefined,
        buttonOk: 'OK',
        buttonCancel: 'Cancel',
        usernamePlaceholder: 'Username',
        passwordPlaceholder: 'Password',
        preloaderTitle: 'Loading... ',
        progressTitle: 'Loading... ',
        closeByBackdropClick: false,
        destroyPredefinedDialogs: true,
        keyboardActions: true,
      },
    },
    static: {
      Dialog: Dialog,
    },
    create: function create() {
      var app = this;
      var defaultDialogTitle = app.params.dialog.title || app.name;
      var destroyOnClose = app.params.dialog.destroyPredefinedDialogs;
      var keyboardActions = app.params.dialog.keyboardActions;
      app.dialog = Utils.extend(
        ModalMethods({
          app: app,
          constructor: Dialog,
          defaultSelector: '.dialog.modal-in',
        }),
        {
          // Shortcuts
          alert: function alert() {
            var assign;

            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];
            var text = args[0];
            var title = args[1];
            var callbackOk = args[2];
            if (args.length === 2 && typeof args[1] === 'function') {
              (assign = args, text = assign[0], callbackOk = assign[1], title = assign[2]);
            }
            return new Dialog(app, {
              title: typeof title === 'undefined' ? defaultDialogTitle : title,
              text: text,
              buttons: [{
                text: app.params.dialog.buttonOk,
                bold: true,
                onClick: callbackOk,
                keyCodes: keyboardActions ? [13, 27] : null,
              }],
              destroyOnClose: destroyOnClose,
            }).open();
          },
          prompt: function prompt() {
            var assign;

            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];
            var text = args[0];
            var title = args[1];
            var callbackOk = args[2];
            var callbackCancel = args[3];
            if (typeof args[1] === 'function') {
              (assign = args, text = assign[0], callbackOk = assign[1], callbackCancel = assign[2], title = assign[3]);
            }
            return new Dialog(app, {
              title: typeof title === 'undefined' ? defaultDialogTitle : title,
              text: text,
              content: '<div class="dialog-input-field item-input"><div class="item-input-wrap"><input type="text" class="dialog-input"></div></div>',
              buttons: [
                {
                  text: app.params.dialog.buttonCancel,
                  keyCodes: keyboardActions ? [27] : null,
                },
                {
                  text: app.params.dialog.buttonOk,
                  bold: true,
                  keyCodes: keyboardActions ? [13] : null,
                } ],
              onClick: function onClick(dialog, index) {
                var inputValue = dialog.$el.find('.dialog-input').val();
                if (index === 0 && callbackCancel) { callbackCancel(inputValue); }
                if (index === 1 && callbackOk) { callbackOk(inputValue); }
              },
              destroyOnClose: destroyOnClose,
            }).open();
          },
          confirm: function confirm() {
            var assign;

            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];
            var text = args[0];
            var title = args[1];
            var callbackOk = args[2];
            var callbackCancel = args[3];
            if (typeof args[1] === 'function') {
              (assign = args, text = assign[0], callbackOk = assign[1], callbackCancel = assign[2], title = assign[3]);
            }
            return new Dialog(app, {
              title: typeof title === 'undefined' ? defaultDialogTitle : title,
              text: text,
              buttons: [
                {
                  text: app.params.dialog.buttonCancel,
                  onClick: callbackCancel,
                  keyCodes: keyboardActions ? [27] : null,
                },
                {
                  text: app.params.dialog.buttonOk,
                  bold: true,
                  onClick: callbackOk,
                  keyCodes: keyboardActions ? [13] : null,
                } ],
              destroyOnClose: destroyOnClose,
            }).open();
          },
          login: function login() {
            var assign;

            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];
            var text = args[0];
            var title = args[1];
            var callbackOk = args[2];
            var callbackCancel = args[3];
            if (typeof args[1] === 'function') {
              (assign = args, text = assign[0], callbackOk = assign[1], callbackCancel = assign[2], title = assign[3]);
            }
            return new Dialog(app, {
              title: typeof title === 'undefined' ? defaultDialogTitle : title,
              text: text,
              content: ("\n              <div class=\"dialog-input-field dialog-input-double item-input\">\n                <div class=\"item-input-wrap\">\n                  <input type=\"text\" name=\"dialog-username\" placeholder=\"" + (app.params.dialog.usernamePlaceholder) + "\" class=\"dialog-input\">\n                </div>\n              </div>\n              <div class=\"dialog-input-field dialog-input-double item-input\">\n                <div class=\"item-input-wrap\">\n                  <input type=\"password\" name=\"dialog-password\" placeholder=\"" + (app.params.dialog.passwordPlaceholder) + "\" class=\"dialog-input\">\n                </div>\n              </div>"),
              buttons: [
                {
                  text: app.params.dialog.buttonCancel,
                  keyCodes: keyboardActions ? [27] : null,
                },
                {
                  text: app.params.dialog.buttonOk,
                  bold: true,
                  keyCodes: keyboardActions ? [13] : null,
                } ],
              onClick: function onClick(dialog, index) {
                var username = dialog.$el.find('[name="dialog-username"]').val();
                var password = dialog.$el.find('[name="dialog-password"]').val();
                if (index === 0 && callbackCancel) { callbackCancel(username, password); }
                if (index === 1 && callbackOk) { callbackOk(username, password); }
              },
              destroyOnClose: destroyOnClose,
            }).open();
          },
          password: function password() {
            var assign;

            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];
            var text = args[0];
            var title = args[1];
            var callbackOk = args[2];
            var callbackCancel = args[3];
            if (typeof args[1] === 'function') {
              (assign = args, text = assign[0], callbackOk = assign[1], callbackCancel = assign[2], title = assign[3]);
            }
            return new Dialog(app, {
              title: typeof title === 'undefined' ? defaultDialogTitle : title,
              text: text,
              content: ("\n              <div class=\"dialog-input-field item-input\">\n                <div class=\"item-input-wrap\">\n                  <input type=\"password\" name=\"dialog-password\" placeholder=\"" + (app.params.dialog.passwordPlaceholder) + "\" class=\"dialog-input\">\n                </div>\n              </div>"),
              buttons: [
                {
                  text: app.params.dialog.buttonCancel,
                  keyCodes: keyboardActions ? [27] : null,
                },
                {
                  text: app.params.dialog.buttonOk,
                  bold: true,
                  keyCodes: keyboardActions ? [13] : null,
                } ],
              onClick: function onClick(dialog, index) {
                var password = dialog.$el.find('[name="dialog-password"]').val();
                if (index === 0 && callbackCancel) { callbackCancel(password); }
                if (index === 1 && callbackOk) { callbackOk(password); }
              },
              destroyOnClose: destroyOnClose,
            }).open();
          },
          preloader: function preloader(title, color) {
            var preloaderInner = app.theme !== 'md' ? '' : Utils.mdPreloaderContent;
            return new Dialog(app, {
              title: typeof title === 'undefined' || title === null ? app.params.dialog.preloaderTitle : title,
              content: ("<div class=\"preloader" + (color ? (" color-" + color) : '') + "\">" + preloaderInner + "</div>"),
              cssClass: 'dialog-preloader',
              destroyOnClose: destroyOnClose,
            }).open();
          },
          progress: function progress() {
            var assign, assign$1, assign$2;

            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];
            var title = args[0];
            var progress = args[1];
            var color = args[2];
            if (args.length === 2) {
              if (typeof args[0] === 'number') {
                (assign = args, progress = assign[0], color = assign[1], title = assign[2]);
              } else if (typeof args[0] === 'string' && typeof args[1] === 'string') {
                (assign$1 = args, title = assign$1[0], color = assign$1[1], progress = assign$1[2]);
              }
            } else if (args.length === 1) {
              if (typeof args[0] === 'number') {
                (assign$2 = args, progress = assign$2[0], title = assign$2[1], color = assign$2[2]);
              }
            }
            var infinite = typeof progress === 'undefined';
            var dialog = new Dialog(app, {
              title: typeof title === 'undefined' ? app.params.dialog.progressTitle : title,
              cssClass: 'dialog-progress',
              content: ("\n              <div class=\"progressbar" + (infinite ? '-infinite' : '') + (color ? (" color-" + color) : '') + "\">\n                " + (!infinite ? '<span></span>' : '') + "\n              </div>\n            "),
              destroyOnClose: destroyOnClose,
            });
            if (!infinite) { dialog.setProgress(progress); }
            return dialog.open();
          },
        }
      );
    },
  };

  var Popover = (function (Modal$$1) {
    function Popover(app, params) {
      var extendedParams = Utils.extend(
        { on: {} },
        app.params.popover,
        params
      );

      // Extends with open/close Modal methods;
      Modal$$1.call(this, app, extendedParams);

      var popover = this;

      popover.params = extendedParams;

      // Find Element
      var $el;
      if (!popover.params.el) {
        $el = $$1(popover.params.content);
      } else {
        $el = $$1(popover.params.el);
      }

      if ($el && $el.length > 0 && $el[0].f7Modal) {
        return $el[0].f7Modal;
      }

      // Find Target
      var $targetEl = $$1(popover.params.targetEl).eq(0);

      if ($el.length === 0) {
        return popover.destroy();
      }

      // Backdrop
      var $backdropEl;
      if (popover.params.backdrop) {
        $backdropEl = app.root.children('.popover-backdrop');
        if ($backdropEl.length === 0) {
          $backdropEl = $$1('<div class="popover-backdrop"></div>');
          app.root.append($backdropEl);
        }
      }

      // Find Angle
      var $angleEl;
      if ($el.find('.popover-angle').length === 0) {
        $angleEl = $$1('<div class="popover-angle"></div>');
        $el.prepend($angleEl);
      } else {
        $angleEl = $el.find('.popover-angle');
      }

      // Open
      var originalOpen = popover.open;

      Utils.extend(popover, {
        app: app,
        $el: $el,
        el: $el[0],
        $targetEl: $targetEl,
        targetEl: $targetEl[0],
        $angleEl: $angleEl,
        angleEl: $angleEl[0],
        $backdropEl: $backdropEl,
        backdropEl: $backdropEl && $backdropEl[0],
        type: 'popover',
        open: function open() {
          var assign;

          var args = [], len = arguments.length;
          while ( len-- ) args[ len ] = arguments[ len ];
          var targetEl = args[0];
          var animate = args[1];
          if (typeof args[0] === 'boolean') { (assign = args, animate = assign[0], targetEl = assign[1]); }
          if (targetEl) {
            popover.$targetEl = $$1(targetEl);
            popover.targetEl = popover.$targetEl[0];
          }
          originalOpen.call(popover, animate);
        },
      });

      function handleResize() {
        popover.resize();
      }
      popover.on('popoverOpen', function () {
        popover.resize();
        app.on('resize', handleResize);
        popover.on('popoverClose popoverBeforeDestroy', function () {
          app.off('resize', handleResize);
        });
      });

      function handleClick(e) {
        var target = e.target;
        var $target = $$1(target);
        if ($target.closest(popover.el).length === 0) {
          if (
            popover.params.closeByBackdropClick
            && popover.params.backdrop
            && popover.backdropEl
            && popover.backdropEl === target
          ) {
            popover.close();
          } else if (popover.params.closeByOutsideClick) {
            popover.close();
          }
        }
      }

      popover.on('popoverOpened', function () {
        if (popover.params.closeByOutsideClick || popover.params.closeByBackdropClick) {
          app.on('click', handleClick);
        }
      });
      popover.on('popoverClose', function () {
        if (popover.params.closeByOutsideClick || popover.params.closeByBackdropClick) {
          app.off('click', handleClick);
        }
      });

      $el[0].f7Modal = popover;

      return popover;
    }

    if ( Modal$$1 ) Popover.__proto__ = Modal$$1;
    Popover.prototype = Object.create( Modal$$1 && Modal$$1.prototype );
    Popover.prototype.constructor = Popover;

    Popover.prototype.resize = function resize () {
      var popover = this;
      var app = popover.app;
      var $el = popover.$el;
      var $targetEl = popover.$targetEl;
      var $angleEl = popover.$angleEl;
      var ref = popover.params;
      var targetX = ref.targetX;
      var targetY = ref.targetY;
      $el.css({ left: '', top: '' });
      var ref$1 = [$el.width(), $el.height()];
      var width = ref$1[0];
      var height = ref$1[1];
      var angleSize = 0;
      var angleLeft;
      var angleTop;
      if (app.theme === 'ios') {
        $angleEl.removeClass('on-left on-right on-top on-bottom').css({ left: '', top: '' });
        angleSize = $angleEl.width() / 2;
      } else {
        $el.removeClass('popover-on-left popover-on-right popover-on-top popover-on-bottom').css({ left: '', top: '' });
      }

      var targetWidth;
      var targetHeight;
      var targetOffsetLeft;
      var targetOffsetTop;
      if ($targetEl && $targetEl.length > 0) {
        targetWidth = $targetEl.outerWidth();
        targetHeight = $targetEl.outerHeight();

        var targetOffset = $targetEl.offset();
        targetOffsetLeft = targetOffset.left - app.left;
        targetOffsetTop = targetOffset.top - app.top;

        var targetParentPage = $targetEl.parents('.page');
        if (targetParentPage.length > 0) {
          targetOffsetTop -= targetParentPage[0].scrollTop;
        }
      } else if (typeof targetX !== 'undefined' && targetY !== 'undefined') {
        targetOffsetLeft = targetX;
        targetOffsetTop = targetY;
        targetWidth = popover.params.targetWidth || 0;
        targetHeight = popover.params.targetHeight || 0;
      }

      var ref$2 = [0, 0, 0];
      var left = ref$2[0];
      var top = ref$2[1];
      var diff = ref$2[2];
      // Top Position
      var position = app.theme === 'md' ? 'bottom' : 'top';
      if (app.theme === 'md') {
        if (height < app.height - targetOffsetTop - targetHeight) {
          // On bottom
          position = 'bottom';
          top = targetOffsetTop;
        } else if (height < targetOffsetTop) {
          // On top
          top = (targetOffsetTop - height) + targetHeight;
          position = 'top';
        } else {
          // On middle
          position = 'bottom';
          top = targetOffsetTop;
        }

        if (top <= 0) {
          top = 8;
        } else if (top + height >= app.height) {
          top = app.height - height - 8;
        }

        // Horizontal Position
        left = (targetOffsetLeft + targetWidth) - width - 8;
        if (left + width >= app.width - 8) {
          left = (targetOffsetLeft + targetWidth) - width - 8;
        }
        if (left < 8) {
          left = 8;
        }
        if (position === 'top') {
          $el.addClass('popover-on-top');
        }
        if (position === 'bottom') {
          $el.addClass('popover-on-bottom');
        }
      } else {
        if ((height + angleSize) < targetOffsetTop) {
          // On top
          top = targetOffsetTop - height - angleSize;
        } else if ((height + angleSize) < app.height - targetOffsetTop - targetHeight) {
          // On bottom
          position = 'bottom';
          top = targetOffsetTop + targetHeight + angleSize;
        } else {
          // On middle
          position = 'middle';
          top = ((targetHeight / 2) + targetOffsetTop) - (height / 2);
          diff = top;
          if (top <= 0) {
            top = 5;
          } else if (top + height >= app.height) {
            top = app.height - height - 5;
          }
          diff -= top;
        }

        // Horizontal Position
        if (position === 'top' || position === 'bottom') {
          left = ((targetWidth / 2) + targetOffsetLeft) - (width / 2);
          diff = left;
          if (left < 5) { left = 5; }
          if (left + width > app.width) { left = app.width - width - 5; }
          if (left < 0) { left = 0; }
          if (position === 'top') {
            $angleEl.addClass('on-bottom');
          }
          if (position === 'bottom') {
            $angleEl.addClass('on-top');
          }
          diff -= left;
          angleLeft = ((width / 2) - angleSize) + diff;
          angleLeft = Math.max(Math.min(angleLeft, width - (angleSize * 2) - 13), 13);
          $angleEl.css({ left: (angleLeft + "px") });
        } else if (position === 'middle') {
          left = targetOffsetLeft - width - angleSize;
          $angleEl.addClass('on-right');
          if (left < 5 || (left + width > app.width)) {
            if (left < 5) { left = targetOffsetLeft + targetWidth + angleSize; }
            if (left + width > app.width) { left = app.width - width - 5; }
            $angleEl.removeClass('on-right').addClass('on-left');
          }
          angleTop = ((height / 2) - angleSize) + diff;
          angleTop = Math.max(Math.min(angleTop, height - (angleSize * 2) - 13), 13);
          $angleEl.css({ top: (angleTop + "px") });
        }
      }

      // Apply Styles
      $el.css({ top: (top + "px"), left: (left + "px") });
    };

    return Popover;
  }(Modal));

  var Popover$1 = {
    name: 'popover',
    params: {
      popover: {
        closeByBackdropClick: true,
        closeByOutsideClick: false,
        backdrop: true,
      },
    },
    static: {
      Popover: Popover,
    },
    create: function create() {
      var app = this;
      app.popover = Utils.extend(
        ModalMethods({
          app: app,
          constructor: Popover,
          defaultSelector: '.popover.modal-in',
        }),
        {
          open: function open(popoverEl, targetEl, animate) {
            var $popoverEl = $$1(popoverEl);
            var popover = $popoverEl[0].f7Modal;
            if (!popover) { popover = new Popover(app, { el: $popoverEl, targetEl: targetEl }); }
            return popover.open(targetEl, animate);
          },
        }
      );
    },
    clicks: {
      '.popover-open': function openPopover($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        app.popover.open(data.popover, $clickedEl, data.animate);
      },
      '.popover-close': function closePopover($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        app.popover.close(data.popover, data.animate);
      },
    },
  };

  var Sheet = (function (Modal$$1) {
    function Sheet(app, params) {
      var extendedParams = Utils.extend(
        { on: {} },
        app.params.sheet,
        params
      );

      // Extends with open/close Modal methods;
      Modal$$1.call(this, app, extendedParams);

      var sheet = this;

      sheet.params = extendedParams;

      // Find Element
      var $el;
      if (!sheet.params.el) {
        $el = $$1(sheet.params.content);
      } else {
        $el = $$1(sheet.params.el);
      }

      if ($el && $el.length > 0 && $el[0].f7Modal) {
        return $el[0].f7Modal;
      }

      if ($el.length === 0) {
        return sheet.destroy();
      }
      var $backdropEl;
      if (sheet.params.backdrop) {
        $backdropEl = app.root.children('.sheet-backdrop');
        if ($backdropEl.length === 0) {
          $backdropEl = $$1('<div class="sheet-backdrop"></div>');
          app.root.append($backdropEl);
        }
      }

      var $pageContentEl;
      function scrollToOpen() {
        var $scrollEl = $$1(sheet.params.scrollToEl).eq(0);
        if ($scrollEl.length === 0) { return; }
        $pageContentEl = $scrollEl.parents('.page-content');
        if ($pageContentEl.length === 0) { return; }

        var paddingTop = parseInt($pageContentEl.css('padding-top'), 10);
        var paddingBottom = parseInt($pageContentEl.css('padding-bottom'), 10);
        var pageHeight = $pageContentEl[0].offsetHeight - paddingTop - $el.height();
        var pageScrollHeight = $pageContentEl[0].scrollHeight - paddingTop - $el.height();
        var pageScroll = $pageContentEl.scrollTop();

        var newPaddingBottom;

        var scrollElTop = ($scrollEl.offset().top - paddingTop) + $scrollEl[0].offsetHeight;
        if (scrollElTop > pageHeight) {
          var scrollTop = (pageScroll + scrollElTop) - pageHeight;
          if (scrollTop + pageHeight > pageScrollHeight) {
            newPaddingBottom = ((scrollTop + pageHeight) - pageScrollHeight) + paddingBottom;
            if (pageHeight === pageScrollHeight) {
              newPaddingBottom = $el.height();
            }
            $pageContentEl.css({
              'padding-bottom': (newPaddingBottom + "px"),
            });
          }
          $pageContentEl.scrollTop(scrollTop, 300);
        }
      }

      function scrollToClose() {
        if ($pageContentEl && $pageContentEl.length > 0) {
          $pageContentEl.css({
            'padding-bottom': '',
          });
        }
      }
      function handleClick(e) {
        var target = e.target;
        var $target = $$1(target);
        if ($target.closest(sheet.el).length === 0) {
          if (
            sheet.params.closeByBackdropClick
            && sheet.params.backdrop
            && sheet.backdropEl
            && sheet.backdropEl === target
          ) {
            sheet.close();
          } else if (sheet.params.closeByOutsideClick) {
            sheet.close();
          }
        }
      }

      sheet.on('sheetOpen', function () {
        if (sheet.params.scrollToEl) {
          scrollToOpen();
        }
      });
      sheet.on('sheetOpened', function () {
        if (sheet.params.closeByOutsideClick || sheet.params.closeByBackdropClick) {
          app.on('click', handleClick);
        }
      });
      sheet.on('sheetClose', function () {
        if (sheet.params.scrollToEl) {
          scrollToClose();
        }
        if (sheet.params.closeByOutsideClick || sheet.params.closeByBackdropClick) {
          app.off('click', handleClick);
        }
      });

      Utils.extend(sheet, {
        app: app,
        $el: $el,
        el: $el[0],
        $backdropEl: $backdropEl,
        backdropEl: $backdropEl && $backdropEl[0],
        type: 'sheet',
      });

      $el[0].f7Modal = sheet;

      return sheet;
    }

    if ( Modal$$1 ) Sheet.__proto__ = Modal$$1;
    Sheet.prototype = Object.create( Modal$$1 && Modal$$1.prototype );
    Sheet.prototype.constructor = Sheet;

    return Sheet;
  }(Modal));

  var Sheet$1 = {
    name: 'sheet',
    params: {
      sheet: {
        closeByBackdropClick: true,
        closeByOutsideClick: false,
      },
    },
    static: {
      Sheet: Sheet,
    },
    create: function create() {
      var app = this;
      if (!app.passedParams.sheet || app.passedParams.sheet.backdrop === undefined) {
        app.params.sheet.backdrop = app.theme === 'md';
      }
      app.sheet = Utils.extend(
        {},
        ModalMethods({
          app: app,
          constructor: Sheet,
          defaultSelector: '.sheet-modal.modal-in',
        })
      );
    },
    clicks: {
      '.sheet-open': function openSheet($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        if ($$1('.sheet-modal.modal-in').length > 0 && data.sheet && $$1(data.sheet)[0] !== $$1('.sheet-modal.modal-in')[0]) {
          app.sheet.close('.sheet-modal.modal-in');
        }
        app.sheet.open(data.sheet, data.animate);
      },
      '.sheet-close': function closeSheet($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        app.sheet.close(data.sheet, data.animate);
      },
    },
  };

  var Swipeout = {
    init: function init() {
      var app = this;
      var touchesStart = {};
      var isTouched;
      var isMoved;
      var isScrolling;
      var touchStartTime;
      var touchesDiff;
      var $swipeoutEl;
      var $swipeoutContent;
      var $actionsRight;
      var $actionsLeft;
      var actionsLeftWidth;
      var actionsRightWidth;
      var translate;
      var opened;
      var openedActionsSide;
      var $leftButtons;
      var $rightButtons;
      var direction;
      var $overswipeLeftButton;
      var $overswipeRightButton;
      var overswipeLeft;
      var overswipeRight;

      function handleTouchStart(e) {
        if (!Swipeout.allow) { return; }
        isMoved = false;
        isTouched = true;
        isScrolling = undefined;
        touchesStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
        touchesStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
        touchStartTime = (new Date()).getTime();
        $swipeoutEl = $$1(this);
      }
      function handleTouchMove(e) {
        if (!isTouched) { return; }
        var pageX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
        var pageY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
        if (typeof isScrolling === 'undefined') {
          isScrolling = !!(isScrolling || Math.abs(pageY - touchesStart.y) > Math.abs(pageX - touchesStart.x));
        }
        if (isScrolling) {
          isTouched = false;
          return;
        }

        if (!isMoved) {
          if ($$1('.list.sortable-opened').length > 0) { return; }
          $swipeoutContent = $swipeoutEl.find('.swipeout-content');
          $actionsRight = $swipeoutEl.find('.swipeout-actions-right');
          $actionsLeft = $swipeoutEl.find('.swipeout-actions-left');
          actionsLeftWidth = null;
          actionsRightWidth = null;
          $leftButtons = null;
          $rightButtons = null;
          $overswipeRightButton = null;
          $overswipeLeftButton = null;
          if ($actionsLeft.length > 0) {
            actionsLeftWidth = $actionsLeft.outerWidth();
            $leftButtons = $actionsLeft.children('a');
            $overswipeLeftButton = $actionsLeft.find('.swipeout-overswipe');
          }
          if ($actionsRight.length > 0) {
            actionsRightWidth = $actionsRight.outerWidth();
            $rightButtons = $actionsRight.children('a');
            $overswipeRightButton = $actionsRight.find('.swipeout-overswipe');
          }
          opened = $swipeoutEl.hasClass('swipeout-opened');
          if (opened) {
            openedActionsSide = $swipeoutEl.find('.swipeout-actions-left.swipeout-actions-opened').length > 0 ? 'left' : 'right';
          }
          $swipeoutEl.removeClass('swipeout-transitioning');
          if (!app.params.swipeout.noFollow) {
            $swipeoutEl.find('.swipeout-actions-opened').removeClass('swipeout-actions-opened');
            $swipeoutEl.removeClass('swipeout-opened');
          }
        }
        isMoved = true;
        e.preventDefault();

        touchesDiff = pageX - touchesStart.x;
        translate = touchesDiff;

        if (opened) {
          if (openedActionsSide === 'right') { translate -= actionsRightWidth; }
          else { translate += actionsLeftWidth; }
        }

        if (
          (translate > 0 && $actionsLeft.length === 0)
          || (translate < 0 && $actionsRight.length === 0)
        ) {
          if (!opened) {
            isTouched = false;
            isMoved = false;
            $swipeoutContent.transform('');
            if ($rightButtons && $rightButtons.length > 0) {
              $rightButtons.transform('');
            }
            if ($leftButtons && $leftButtons.length > 0) {
              $leftButtons.transform('');
            }
            return;
          }
          translate = 0;
        }

        if (translate < 0) { direction = 'to-left'; }
        else if (translate > 0) { direction = 'to-right'; }
        else if (!direction) { direction = 'to-left'; }

        var buttonOffset;
        var progress;

        e.f7PreventSwipePanel = true;
        if (app.params.swipeout.noFollow) {
          if (opened) {
            if (openedActionsSide === 'right' && touchesDiff > 0) {
              app.swipeout.close($swipeoutEl);
            }
            if (openedActionsSide === 'left' && touchesDiff < 0) {
              app.swipeout.close($swipeoutEl);
            }
          } else {
            if (touchesDiff < 0 && $actionsRight.length > 0) {
              app.swipeout.open($swipeoutEl, 'right');
            }
            if (touchesDiff > 0 && $actionsLeft.length > 0) {
              app.swipeout.open($swipeoutEl, 'left');
            }
          }
          isTouched = false;
          isMoved = false;
          return;
        }
        overswipeLeft = false;
        overswipeRight = false;
        if ($actionsRight.length > 0) {
          // Show right actions
          var buttonTranslate = translate;
          progress = buttonTranslate / actionsRightWidth;
          if (buttonTranslate < -actionsRightWidth) {
            buttonTranslate = -actionsRightWidth - (Math.pow( (-buttonTranslate - actionsRightWidth), 0.8 ));
            translate = buttonTranslate;
            if ($overswipeRightButton.length > 0) {
              overswipeRight = true;
            }
          }
          if (direction !== 'to-left') {
            progress = 0;
            buttonTranslate = 0;
          }
          $rightButtons.each(function (index, buttonEl) {
            var $buttonEl = $$1(buttonEl);
            if (typeof buttonEl.f7SwipeoutButtonOffset === 'undefined') {
              $buttonEl[0].f7SwipeoutButtonOffset = buttonEl.offsetLeft;
            }
            buttonOffset = buttonEl.f7SwipeoutButtonOffset;
            if ($overswipeRightButton.length > 0 && $buttonEl.hasClass('swipeout-overswipe') && direction === 'to-left') {
              $buttonEl.css({ left: ((overswipeRight ? -buttonOffset : 0) + "px") });
              if (overswipeRight) {
                $buttonEl.addClass('swipeout-overswipe-active');
              } else {
                $buttonEl.removeClass('swipeout-overswipe-active');
              }
            }
            $buttonEl.transform(("translate3d(" + (buttonTranslate - (buttonOffset * (1 + Math.max(progress, -1)))) + "px,0,0)"));
          });
        }
        if ($actionsLeft.length > 0) {
          // Show left actions
          var buttonTranslate$1 = translate;
          progress = buttonTranslate$1 / actionsLeftWidth;
          if (buttonTranslate$1 > actionsLeftWidth) {
            buttonTranslate$1 = actionsLeftWidth + (Math.pow( (buttonTranslate$1 - actionsLeftWidth), 0.8 ));
            translate = buttonTranslate$1;
            if ($overswipeLeftButton.length > 0) {
              overswipeLeft = true;
            }
          }
          if (direction !== 'to-right') {
            buttonTranslate$1 = 0;
            progress = 0;
          }
          $leftButtons.each(function (index, buttonEl) {
            var $buttonEl = $$1(buttonEl);
            if (typeof buttonEl.f7SwipeoutButtonOffset === 'undefined') {
              $buttonEl[0].f7SwipeoutButtonOffset = actionsLeftWidth - buttonEl.offsetLeft - buttonEl.offsetWidth;
            }
            buttonOffset = buttonEl.f7SwipeoutButtonOffset;
            if ($overswipeLeftButton.length > 0 && $buttonEl.hasClass('swipeout-overswipe') && direction === 'to-right') {
              $buttonEl.css({ left: ((overswipeLeft ? buttonOffset : 0) + "px") });
              if (overswipeLeft) {
                $buttonEl.addClass('swipeout-overswipe-active');
              } else {
                $buttonEl.removeClass('swipeout-overswipe-active');
              }
            }
            if ($leftButtons.length > 1) {
              $buttonEl.css('z-index', $leftButtons.length - index);
            }
            $buttonEl.transform(("translate3d(" + (buttonTranslate$1 + (buttonOffset * (1 - Math.min(progress, 1)))) + "px,0,0)"));
          });
        }
        $swipeoutEl.trigger('swipeout', progress);
        app.emit('swipeout', $swipeoutEl[0], progress);
        $swipeoutContent.transform(("translate3d(" + translate + "px,0,0)"));
      }
      function handleTouchEnd() {
        if (!isTouched || !isMoved) {
          isTouched = false;
          isMoved = false;
          return;
        }

        isTouched = false;
        isMoved = false;
        var timeDiff = (new Date()).getTime() - touchStartTime;
        var $actions = direction === 'to-left' ? $actionsRight : $actionsLeft;
        var actionsWidth = direction === 'to-left' ? actionsRightWidth : actionsLeftWidth;
        var action;
        var $buttons;
        var i;

        if (
          (
            timeDiff < 300
            && (
              (touchesDiff < -10 && direction === 'to-left')
              || (touchesDiff > 10 && direction === 'to-right')
            )
          )
          || (
            timeDiff >= 300
            && (Math.abs(translate) > actionsWidth / 2)
          )
        ) {
          action = 'open';
        } else {
          action = 'close';
        }
        if (timeDiff < 300) {
          if (Math.abs(translate) === 0) { action = 'close'; }
          if (Math.abs(translate) === actionsWidth) { action = 'open'; }
        }

        if (action === 'open') {
          Swipeout.el = $swipeoutEl[0];
          $swipeoutEl.trigger('swipeout:open');
          app.emit('swipeoutOpen', $swipeoutEl[0]);
          $swipeoutEl.addClass('swipeout-opened swipeout-transitioning');
          var newTranslate = direction === 'to-left' ? -actionsWidth : actionsWidth;
          $swipeoutContent.transform(("translate3d(" + newTranslate + "px,0,0)"));
          $actions.addClass('swipeout-actions-opened');
          $buttons = direction === 'to-left' ? $rightButtons : $leftButtons;
          if ($buttons) {
            for (i = 0; i < $buttons.length; i += 1) {
              $$1($buttons[i]).transform(("translate3d(" + newTranslate + "px,0,0)"));
            }
          }
          if (overswipeRight) {
            $actionsRight.find('.swipeout-overswipe')[0].click();
          }
          if (overswipeLeft) {
            $actionsLeft.find('.swipeout-overswipe')[0].click();
          }
        } else {
          $swipeoutEl.trigger('swipeout:close');
          app.emit('swipeoutClose', $swipeoutEl[0]);
          Swipeout.el = undefined;
          $swipeoutEl.addClass('swipeout-transitioning').removeClass('swipeout-opened');
          $swipeoutContent.transform('');
          $actions.removeClass('swipeout-actions-opened');
        }

        var buttonOffset;
        if ($leftButtons && $leftButtons.length > 0 && $leftButtons !== $buttons) {
          $leftButtons.each(function (index, buttonEl) {
            var $buttonEl = $$1(buttonEl);
            buttonOffset = buttonEl.f7SwipeoutButtonOffset;
            if (typeof buttonOffset === 'undefined') {
              $buttonEl[0].f7SwipeoutButtonOffset = actionsLeftWidth - buttonEl.offsetLeft - buttonEl.offsetWidth;
            }
            $buttonEl.transform(("translate3d(" + buttonOffset + "px,0,0)"));
          });
        }
        if ($rightButtons && $rightButtons.length > 0 && $rightButtons !== $buttons) {
          $rightButtons.each(function (index, buttonEl) {
            var $buttonEl = $$1(buttonEl);
            buttonOffset = buttonEl.f7SwipeoutButtonOffset;
            if (typeof buttonOffset === 'undefined') {
              $buttonEl[0].f7SwipeoutButtonOffset = buttonEl.offsetLeft;
            }
            $buttonEl.transform(("translate3d(" + (-buttonOffset) + "px,0,0)"));
          });
        }
        $swipeoutContent.transitionEnd(function () {
          if ((opened && action === 'open') || (!opened && action === 'close')) { return; }
          $swipeoutEl.trigger(action === 'open' ? 'swipeout:opened' : 'swipeout:closed');
          app.emit(action === 'open' ? 'swipeoutOpened' : 'swipeoutClosed', $swipeoutEl[0]);
          $swipeoutEl.removeClass('swipeout-transitioning');
          if (opened && action === 'close') {
            if ($actionsRight.length > 0) {
              $rightButtons.transform('');
            }
            if ($actionsLeft.length > 0) {
              $leftButtons.transform('');
            }
          }
        });
      }

      var passiveListener = app.support.passiveListener ? { passive: true } : false;

      app.on('touchstart', function (e) {
        if (Swipeout.el) {
          var $targetEl = $$1(e.target);
          if (!(
            $$1(Swipeout.el).is($targetEl[0])
            || $targetEl.parents('.swipeout').is(Swipeout.el)
            || $targetEl.hasClass('modal-in')
            || ($targetEl.attr('class') || '').indexOf('-backdrop') > 0
            || $targetEl.hasClass('actions-modal')
            || $targetEl.parents('.actions-modal.modal-in, .dialog.modal-in').length > 0
          )) {
            app.swipeout.close(Swipeout.el);
          }
        }
      });
      $$1(doc).on(app.touchEvents.start, 'li.swipeout', handleTouchStart, passiveListener);
      app.on('touchmove:active', handleTouchMove);
      app.on('touchend:passive', handleTouchEnd);
    },
    allow: true,
    el: undefined,
    open: function open() {
      var assign;

      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];
      var app = this;
      var el = args[0];
      var side = args[1];
      var callback = args[2];
      if (typeof args[1] === 'function') {
        (assign = args, el = assign[0], callback = assign[1], side = assign[2]);
      }
      var $el = $$1(el).eq(0);

      if ($el.length === 0) { return; }
      if (!$el.hasClass('swipeout') || $el.hasClass('swipeout-opened')) { return; }
      if (!side) {
        if ($el.find('.swipeout-actions-right').length > 0) { side = 'right'; }
        else { side = 'left'; }
      }
      var $swipeoutActions = $el.find((".swipeout-actions-" + side));
      var $swipeoutContent = $el.find('.swipeout-content');
      if ($swipeoutActions.length === 0) { return; }
      $el.trigger('swipeout:open').addClass('swipeout-opened').removeClass('swipeout-transitioning');
      app.emit('swipeoutOpen', $el[0]);
      $swipeoutActions.addClass('swipeout-actions-opened');
      var $buttons = $swipeoutActions.children('a');
      var swipeoutActionsWidth = $swipeoutActions.outerWidth();
      var translate = side === 'right' ? -swipeoutActionsWidth : swipeoutActionsWidth;
      if ($buttons.length > 1) {
        $buttons.each(function (buttonIndex, buttonEl) {
          var $buttonEl = $$1(buttonEl);
          if (side === 'right') {
            $buttonEl.transform(("translate3d(" + (-buttonEl.offsetLeft) + "px,0,0)"));
          } else {
            $buttonEl.css('z-index', $buttons.length - buttonIndex).transform(("translate3d(" + (swipeoutActionsWidth - buttonEl.offsetWidth - buttonEl.offsetLeft) + "px,0,0)"));
          }
        });
      }
      $el.addClass('swipeout-transitioning');
      $swipeoutContent.transitionEnd(function () {
        $el.trigger('swipeout:opened');
        app.emit('swipeoutOpened', $el[0]);
        if (callback) { callback.call($el[0]); }
      });
      Utils.nextFrame(function () {
        $buttons.transform(("translate3d(" + translate + "px,0,0)"));
        $swipeoutContent.transform(("translate3d(" + translate + "px,0,0)"));
      });
      Swipeout.el = $el[0];
    },
    close: function close(el, callback) {
      var app = this;
      var $el = $$1(el).eq(0);
      if ($el.length === 0) { return; }
      if (!$el.hasClass('swipeout-opened')) { return; }
      var side = $el.find('.swipeout-actions-opened').hasClass('swipeout-actions-right') ? 'right' : 'left';
      var $swipeoutActions = $el.find('.swipeout-actions-opened').removeClass('swipeout-actions-opened');
      var $buttons = $swipeoutActions.children('a');
      var swipeoutActionsWidth = $swipeoutActions.outerWidth();
      Swipeout.allow = false;
      $el.trigger('swipeout:close');
      app.emit('swipeoutClose', $el[0]);
      $el.removeClass('swipeout-opened').addClass('swipeout-transitioning');

      var closeTimeout;
      function onSwipeoutClose() {
        Swipeout.allow = true;
        if ($el.hasClass('swipeout-opened')) { return; }
        $el.removeClass('swipeout-transitioning');
        $buttons.transform('');
        $el.trigger('swipeout:closed');
        app.emit('swipeoutClosed', $el[0]);
        if (callback) { callback.call($el[0]); }
        if (closeTimeout) { clearTimeout(closeTimeout); }
      }
      $el.find('.swipeout-content').transform('').transitionEnd(onSwipeoutClose);
      closeTimeout = setTimeout(onSwipeoutClose, 500);

      $buttons.each(function (index, buttonEl) {
        var $buttonEl = $$1(buttonEl);
        if (side === 'right') {
          $buttonEl.transform(("translate3d(" + (-buttonEl.offsetLeft) + "px,0,0)"));
        } else {
          $buttonEl.transform(("translate3d(" + (swipeoutActionsWidth - buttonEl.offsetWidth - buttonEl.offsetLeft) + "px,0,0)"));
        }
        $buttonEl.css({ left: '0px' }).removeClass('swipeout-overswipe-active');
      });
      if (Swipeout.el && Swipeout.el === $el[0]) { Swipeout.el = undefined; }
    },
    delete: function delete$1(el, callback) {
      var app = this;
      var $el = $$1(el).eq(0);
      if ($el.length === 0) { return; }
      Swipeout.el = undefined;
      $el.trigger('swipeout:delete');
      app.emit('swipeoutDelete', $el[0]);
      $el.css({ height: (($el.outerHeight()) + "px") });
      $el.transitionEnd(function () {
        $el.trigger('swipeout:deleted');
        app.emit('swipeoutDeleted', $el[0]);
        if (callback) { callback.call($el[0]); }
        if ($el.parents('.virtual-list').length > 0) {
          var virtualList = $el.parents('.virtual-list')[0].f7VirtualList;
          var virtualIndex = $el[0].f7VirtualListIndex;
          if (virtualList && typeof virtualIndex !== 'undefined') { virtualList.deleteItem(virtualIndex); }
        } else if (app.params.swipeout.removeElements) {
          if (app.params.swipeout.removeElementsWithTimeout) {
            setTimeout(function () {
              $el.remove();
            }, app.params.swipeout.removeElementsTimeout);
          } else {
            $el.remove();
          }
        } else {
          $el.removeClass('swipeout-deleting swipeout-transitioning');
        }
      });
      // eslint-disable-next-line
      $el[0]._clientLeft = $el[0].clientLeft;
      $el
        .addClass('swipeout-deleting swipeout-transitioning')
        .css({ height: '0px' })
        .find('.swipeout-content')
        .transform('translate3d(-100%,0,0)');
    },
  };
  var Swipeout$1 = {
    name: 'swipeout',
    params: {
      swipeout: {
        actionsNoFold: false,
        noFollow: false,
        removeElements: true,
        removeElementsWithTimeout: false,
        removeElementsTimeout: 0,
      },
    },
    create: function create() {
      var app = this;
      Utils.extend(app, {
        swipeout: {
          init: Swipeout.init.bind(app),
          open: Swipeout.open.bind(app),
          close: Swipeout.close.bind(app),
          delete: Swipeout.delete.bind(app),
        },
      });
      Object.defineProperty(app.swipeout, 'el', {
        enumerable: true,
        configurable: true,
        get: function () { return Swipeout.el; },
        set: function set(el) {
          Swipeout.el = el;
        },
      });
      Object.defineProperty(app.swipeout, 'allow', {
        enumerable: true,
        configurable: true,
        get: function () { return Swipeout.allow; },
        set: function set(allow) {
          Swipeout.allow = allow;
        },
      });
    },
    clicks: {
      '.swipeout-open': function openSwipeout($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        app.swipeout.open(data.swipeout, data.side);
      },
      '.swipeout-close': function closeSwipeout($clickedEl) {
        var app = this;
        var $swipeoutEl = $clickedEl.closest('.swipeout');
        if ($swipeoutEl.length === 0) { return; }
        app.swipeout.close($swipeoutEl);
      },
      '.swipeout-delete': function deleteSwipeout($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        var $swipeoutEl = $clickedEl.closest('.swipeout');
        if ($swipeoutEl.length === 0) { return; }
        var confirm = data.confirm;
        var confirmTitle = data.confirmTitle;
        if (data.confirm) {
          app.dialog.confirm(confirm, confirmTitle, function () {
            app.swipeout.delete($swipeoutEl);
          });
        } else {
          app.swipeout.delete($swipeoutEl);
        }
      },
    },
    on: {
      init: function init() {
        var app = this;
        if (!app.params.swipeout) { return; }
        app.swipeout.init();
      },
    },
  };

  var VirtualList = (function (Framework7Class$$1) {
    function VirtualList(app, params) {
      if ( params === void 0 ) params = {};

      Framework7Class$$1.call(this, params, [app]);
      var vl = this;

      var defaults = {
        cols: 1,
        height: app.theme === 'md' ? 48 : 44,
        cache: true,
        dynamicHeightBufferSize: 1,
        showFilteredItemsOnly: false,
        renderExternal: undefined,
        setListHeight: true,
        searchByItem: undefined,
        searchAll: undefined,
        itemTemplate: undefined,
        ul: null,
        createUl: true,
        renderItem: function renderItem(item) {
          return ("\n          <li>\n            <div class=\"item-content\">\n              <div class=\"item-inner\">\n                <div class=\"item-title\">" + item + "</div>\n              </div>\n            </div>\n          </li>\n        ").trim();
        },
        on: {},
      };

      // Extend defaults with modules params
      vl.useModulesParams(defaults);

      vl.params = Utils.extend(defaults, params);
      if (vl.params.height === undefined || !vl.params.height) {
        vl.params.height = app.theme === 'md' ? 48 : 44;
      }

      vl.$el = $$1(params.el);
      vl.el = vl.$el[0];

      if (vl.$el.length === 0) { return undefined; }
      vl.$el[0].f7VirtualList = vl;

      vl.items = vl.params.items;
      if (vl.params.showFilteredItemsOnly) {
        vl.filteredItems = [];
      }
      if (vl.params.itemTemplate) {
        if (typeof vl.params.itemTemplate === 'string') { vl.renderItem = Template7.compile(vl.params.itemTemplate); }
        else if (typeof vl.params.itemTemplate === 'function') { vl.renderItem = vl.params.itemTemplate; }
      } else if (vl.params.renderItem) {
        vl.renderItem = vl.params.renderItem;
      }
      vl.$pageContentEl = vl.$el.parents('.page-content');
      vl.pageContentEl = vl.$pageContentEl[0];

      // Bad scroll
      if (typeof vl.params.updatableScroll !== 'undefined') {
        vl.updatableScroll = vl.params.updatableScroll;
      } else {
        vl.updatableScroll = true;
        if (Device.ios && Device.osVersion.split('.')[0] < 8) {
          vl.updatableScroll = false;
        }
      }

      // Append <ul>
      var ul = vl.params.ul;
      vl.$ul = ul ? $$1(vl.params.ul) : vl.$el.children('ul');
      if (vl.$ul.length === 0 && vl.params.createUl) {
        vl.$el.append('<ul></ul>');
        vl.$ul = vl.$el.children('ul');
      }
      vl.ul = vl.$ul[0];

      var $itemsWrapEl;
      if (!vl.ul && !vl.params.createUl) { $itemsWrapEl = vl.$el; }
      else { $itemsWrapEl = vl.$ul; }

      Utils.extend(vl, {
        $itemsWrapEl: $itemsWrapEl,
        itemsWrapEl: $itemsWrapEl[0],
        // DOM cached items
        domCache: {},
        displayDomCache: {},
        // Temporary DOM Element
        tempDomElement: doc.createElement('ul'),
        // Last repain position
        lastRepaintY: null,
        // Fragment
        fragment: doc.createDocumentFragment(),
        // Props
        pageHeight: undefined,
        rowsPerScreen: undefined,
        rowsBefore: undefined,
        rowsAfter: undefined,
        rowsToRender: undefined,
        maxBufferHeight: 0,
        listHeight: undefined,
        dynamicHeight: typeof vl.params.height === 'function',
      });

      // Install Modules
      vl.useModules();

      // Attach events
      var handleScrollBound = vl.handleScroll.bind(vl);
      var handleResizeBound = vl.handleResize.bind(vl);
      var $pageEl;
      var $tabEl;
      var $panelEl;
      var $popupEl;
      vl.attachEvents = function attachEvents() {
        $pageEl = vl.$el.parents('.page').eq(0);
        $tabEl = vl.$el.parents('.tab').eq(0);
        $panelEl = vl.$el.parents('.panel').eq(0);
        $popupEl = vl.$el.parents('.popup').eq(0);

        vl.$pageContentEl.on('scroll', handleScrollBound);
        if ($pageEl) { $pageEl.on('page:reinit', handleResizeBound); }
        if ($tabEl) { $tabEl.on('tab:show', handleResizeBound); }
        if ($panelEl) { $panelEl.on('panel:open', handleResizeBound); }
        if ($popupEl) { $popupEl.on('popup:open', handleResizeBound); }
        app.on('resize', handleResizeBound);
      };
      vl.detachEvents = function attachEvents() {
        vl.$pageContentEl.off('scroll', handleScrollBound);
        if ($pageEl) { $pageEl.off('page:reinit', handleResizeBound); }
        if ($tabEl) { $tabEl.off('tab:show', handleResizeBound); }
        if ($panelEl) { $panelEl.off('panel:open', handleResizeBound); }
        if ($popupEl) { $popupEl.off('popup:open', handleResizeBound); }
        app.off('resize', handleResizeBound);
      };
      // Init
      vl.init();

      return vl;
    }

    if ( Framework7Class$$1 ) VirtualList.__proto__ = Framework7Class$$1;
    VirtualList.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    VirtualList.prototype.constructor = VirtualList;

    VirtualList.prototype.setListSize = function setListSize () {
      var vl = this;
      var items = vl.filteredItems || vl.items;
      vl.pageHeight = vl.$pageContentEl[0].offsetHeight;
      if (vl.dynamicHeight) {
        vl.listHeight = 0;
        vl.heights = [];
        for (var i = 0; i < items.length; i += 1) {
          var itemHeight = vl.params.height(items[i]);
          vl.listHeight += itemHeight;
          vl.heights.push(itemHeight);
        }
      } else {
        vl.listHeight = Math.ceil(items.length / vl.params.cols) * vl.params.height;
        vl.rowsPerScreen = Math.ceil(vl.pageHeight / vl.params.height);
        vl.rowsBefore = vl.params.rowsBefore || vl.rowsPerScreen * 2;
        vl.rowsAfter = vl.params.rowsAfter || vl.rowsPerScreen;
        vl.rowsToRender = (vl.rowsPerScreen + vl.rowsBefore + vl.rowsAfter);
        vl.maxBufferHeight = (vl.rowsBefore / 2) * vl.params.height;
      }

      if (vl.updatableScroll || vl.params.setListHeight) {
        vl.$itemsWrapEl.css({ height: ((vl.listHeight) + "px") });
      }
    };

    VirtualList.prototype.render = function render (force, forceScrollTop) {
      var vl = this;
      if (force) { vl.lastRepaintY = null; }

      var scrollTop = -(vl.$el[0].getBoundingClientRect().top - vl.$pageContentEl[0].getBoundingClientRect().top);

      if (typeof forceScrollTop !== 'undefined') { scrollTop = forceScrollTop; }
      if (vl.lastRepaintY === null || Math.abs(scrollTop - vl.lastRepaintY) > vl.maxBufferHeight || (!vl.updatableScroll && (vl.$pageContentEl[0].scrollTop + vl.pageHeight >= vl.$pageContentEl[0].scrollHeight))) {
        vl.lastRepaintY = scrollTop;
      } else {
        return;
      }

      var items = vl.filteredItems || vl.items;
      var fromIndex;
      var toIndex;
      var heightBeforeFirstItem = 0;
      var heightBeforeLastItem = 0;
      if (vl.dynamicHeight) {
        var itemTop = 0;
        var itemHeight;
        vl.maxBufferHeight = vl.pageHeight;

        for (var j = 0; j < vl.heights.length; j += 1) {
          itemHeight = vl.heights[j];
          if (typeof fromIndex === 'undefined') {
            if (itemTop + itemHeight >= scrollTop - (vl.pageHeight * 2 * vl.params.dynamicHeightBufferSize)) { fromIndex = j; }
            else { heightBeforeFirstItem += itemHeight; }
          }

          if (typeof toIndex === 'undefined') {
            if (itemTop + itemHeight >= scrollTop + (vl.pageHeight * 2 * vl.params.dynamicHeightBufferSize) || j === vl.heights.length - 1) { toIndex = j + 1; }
            heightBeforeLastItem += itemHeight;
          }
          itemTop += itemHeight;
        }
        toIndex = Math.min(toIndex, items.length);
      } else {
        fromIndex = (parseInt(scrollTop / vl.params.height, 10) - vl.rowsBefore) * vl.params.cols;
        if (fromIndex < 0) {
          fromIndex = 0;
        }
        toIndex = Math.min(fromIndex + (vl.rowsToRender * vl.params.cols), items.length);
      }

      var topPosition;
      var renderExternalItems = [];
      vl.reachEnd = false;
      var i;
      for (i = fromIndex; i < toIndex; i += 1) {
        var itemEl = (void 0);
        // Define real item index
        var index = vl.items.indexOf(items[i]);

        if (i === fromIndex) { vl.currentFromIndex = index; }
        if (i === toIndex - 1) { vl.currentToIndex = index; }
        if (vl.filteredItems) {
          if (vl.items[index] === vl.filteredItems[vl.filteredItems.length - 1]) { vl.reachEnd = true; }
        } else if (index === vl.items.length - 1) { vl.reachEnd = true; }

        // Find items
        if (vl.params.renderExternal) {
          renderExternalItems.push(items[i]);
        } else if (vl.domCache[index]) {
          itemEl = vl.domCache[index];
          itemEl.f7VirtualListIndex = index;
        } else {
          if (vl.renderItem) {
            vl.tempDomElement.innerHTML = vl.renderItem(items[i], index).trim();
          } else {
            vl.tempDomElement.innerHTML = items[i].toString().trim();
          }
          itemEl = vl.tempDomElement.childNodes[0];
          if (vl.params.cache) { vl.domCache[index] = itemEl; }
          itemEl.f7VirtualListIndex = index;
        }

        // Set item top position
        if (i === fromIndex) {
          if (vl.dynamicHeight) {
            topPosition = heightBeforeFirstItem;
          } else {
            topPosition = ((i * vl.params.height) / vl.params.cols);
          }
        }
        if (!vl.params.renderExternal) {
          itemEl.style.top = topPosition + "px";

          // Before item insert
          vl.emit('local::itemBeforeInsert vlItemBeforeInsert', vl, itemEl, items[i]);

          // Append item to fragment
          vl.fragment.appendChild(itemEl);
        }
      }

      // Update list height with not updatable scroll
      if (!vl.updatableScroll) {
        if (vl.dynamicHeight) {
          vl.itemsWrapEl.style.height = heightBeforeLastItem + "px";
        } else {
          vl.itemsWrapEl.style.height = ((i * vl.params.height) / vl.params.cols) + "px";
        }
      }

      // Update list html
      if (vl.params.renderExternal) {
        if (items && items.length === 0) {
          vl.reachEnd = true;
        }
      } else {
        vl.emit('local::beforeClear vlBeforeClear', vl, vl.fragment);
        vl.itemsWrapEl.innerHTML = '';

        vl.emit('local::itemsBeforeInsert vlItemsBeforeInsert', vl, vl.fragment);

        if (items && items.length === 0) {
          vl.reachEnd = true;
          if (vl.params.emptyTemplate) { vl.itemsWrapEl.innerHTML = vl.params.emptyTemplate; }
        } else {
          vl.itemsWrapEl.appendChild(vl.fragment);
        }

        vl.emit('local::itemsAfterInsert vlItemsAfterInsert', vl, vl.fragment);
      }

      if (typeof forceScrollTop !== 'undefined' && force) {
        vl.$pageContentEl.scrollTop(forceScrollTop, 0);
      }
      if (vl.params.renderExternal) {
        vl.params.renderExternal(vl, {
          fromIndex: fromIndex,
          toIndex: toIndex,
          listHeight: vl.listHeight,
          topPosition: topPosition,
          items: renderExternalItems,
        });
      }
    };

    // Filter
    VirtualList.prototype.filterItems = function filterItems (indexes, resetScrollTop) {
      if ( resetScrollTop === void 0 ) resetScrollTop = true;

      var vl = this;
      vl.filteredItems = [];
      for (var i = 0; i < indexes.length; i += 1) {
        vl.filteredItems.push(vl.items[indexes[i]]);
      }
      if (resetScrollTop) {
        vl.$pageContentEl[0].scrollTop = 0;
      }
      vl.update();
    };

    VirtualList.prototype.resetFilter = function resetFilter () {
      var vl = this;
      if (vl.params.showFilteredItemsOnly) {
        vl.filteredItems = [];
      } else {
        vl.filteredItems = null;
        delete vl.filteredItems;
      }
      vl.update();
    };

    VirtualList.prototype.scrollToItem = function scrollToItem (index) {
      var vl = this;
      if (index > vl.items.length) { return false; }
      var itemTop = 0;
      if (vl.dynamicHeight) {
        for (var i = 0; i < index; i += 1) {
          itemTop += vl.heights[i];
        }
      } else {
        itemTop = index * vl.params.height;
      }
      var listTop = vl.$el[0].offsetTop;
      vl.render(true, (listTop + itemTop) - parseInt(vl.$pageContentEl.css('padding-top'), 10));
      return true;
    };

    VirtualList.prototype.handleScroll = function handleScroll () {
      var vl = this;
      vl.render();
    };

    // Handle resize event
    VirtualList.prototype.isVisible = function isVisible () {
      var vl = this;
      return !!(vl.el.offsetWidth || vl.el.offsetHeight || vl.el.getClientRects().length);
    };

    VirtualList.prototype.handleResize = function handleResize () {
      var vl = this;
      if (vl.isVisible()) {
        vl.setListSize();
        vl.render(true);
      }
    };

    // Append
    VirtualList.prototype.appendItems = function appendItems (items) {
      var vl = this;
      for (var i = 0; i < items.length; i += 1) {
        vl.items.push(items[i]);
      }
      vl.update();
    };

    VirtualList.prototype.appendItem = function appendItem (item) {
      var vl = this;
      vl.appendItems([item]);
    };

    // Replace
    VirtualList.prototype.replaceAllItems = function replaceAllItems (items) {
      var vl = this;
      vl.items = items;
      delete vl.filteredItems;
      vl.domCache = {};
      vl.update();
    };

    VirtualList.prototype.replaceItem = function replaceItem (index, item) {
      var vl = this;
      vl.items[index] = item;
      if (vl.params.cache) { delete vl.domCache[index]; }
      vl.update();
    };

    // Prepend
    VirtualList.prototype.prependItems = function prependItems (items) {
      var vl = this;
      for (var i = items.length - 1; i >= 0; i -= 1) {
        vl.items.unshift(items[i]);
      }
      if (vl.params.cache) {
        var newCache = {};
        Object.keys(vl.domCache).forEach(function (cached) {
          newCache[parseInt(cached, 10) + items.length] = vl.domCache[cached];
        });
        vl.domCache = newCache;
      }
      vl.update();
    };

    VirtualList.prototype.prependItem = function prependItem (item) {
      var vl = this;
      vl.prependItems([item]);
    };

    // Move
    VirtualList.prototype.moveItem = function moveItem (from, to) {
      var vl = this;
      var fromIndex = from;
      var toIndex = to;
      if (fromIndex === toIndex) { return; }
      // remove item from array
      var item = vl.items.splice(fromIndex, 1)[0];
      if (toIndex >= vl.items.length) {
        // Add item to the end
        vl.items.push(item);
        toIndex = vl.items.length - 1;
      } else {
      // Add item to new index
        vl.items.splice(toIndex, 0, item);
      }
      // Update cache
      if (vl.params.cache) {
        var newCache = {};
        Object.keys(vl.domCache).forEach(function (cached) {
          var cachedIndex = parseInt(cached, 10);
          var leftIndex = fromIndex < toIndex ? fromIndex : toIndex;
          var rightIndex = fromIndex < toIndex ? toIndex : fromIndex;
          var indexShift = fromIndex < toIndex ? -1 : 1;
          if (cachedIndex < leftIndex || cachedIndex > rightIndex) { newCache[cachedIndex] = vl.domCache[cachedIndex]; }
          if (cachedIndex === leftIndex) { newCache[rightIndex] = vl.domCache[cachedIndex]; }
          if (cachedIndex > leftIndex && cachedIndex <= rightIndex) { newCache[cachedIndex + indexShift] = vl.domCache[cachedIndex]; }
        });
        vl.domCache = newCache;
      }
      vl.update();
    };

    // Insert before
    VirtualList.prototype.insertItemBefore = function insertItemBefore (index, item) {
      var vl = this;
      if (index === 0) {
        vl.prependItem(item);
        return;
      }
      if (index >= vl.items.length) {
        vl.appendItem(item);
        return;
      }
      vl.items.splice(index, 0, item);
      // Update cache
      if (vl.params.cache) {
        var newCache = {};
        Object.keys(vl.domCache).forEach(function (cached) {
          var cachedIndex = parseInt(cached, 10);
          if (cachedIndex >= index) {
            newCache[cachedIndex + 1] = vl.domCache[cachedIndex];
          }
        });
        vl.domCache = newCache;
      }
      vl.update();
    };

    // Delete
    VirtualList.prototype.deleteItems = function deleteItems (indexes) {
      var vl = this;
      var prevIndex;
      var indexShift = 0;
      var loop = function ( i ) {
        var index = indexes[i];
        if (typeof prevIndex !== 'undefined') {
          if (index > prevIndex) {
            indexShift = -i;
          }
        }
        index += indexShift;
        prevIndex = indexes[i];
        // Delete item
        var deletedItem = vl.items.splice(index, 1)[0];

        // Delete from filtered
        if (vl.filteredItems && vl.filteredItems.indexOf(deletedItem) >= 0) {
          vl.filteredItems.splice(vl.filteredItems.indexOf(deletedItem), 1);
        }
        // Update cache
        if (vl.params.cache) {
          var newCache = {};
          Object.keys(vl.domCache).forEach(function (cached) {
            var cachedIndex = parseInt(cached, 10);
            if (cachedIndex === index) {
              delete vl.domCache[index];
            } else if (parseInt(cached, 10) > index) {
              newCache[cachedIndex - 1] = vl.domCache[cached];
            } else {
              newCache[cachedIndex] = vl.domCache[cached];
            }
          });
          vl.domCache = newCache;
        }
      };

      for (var i = 0; i < indexes.length; i += 1) loop( i );
      vl.update();
    };

    VirtualList.prototype.deleteAllItems = function deleteAllItems () {
      var vl = this;
      vl.items = [];
      delete vl.filteredItems;
      if (vl.params.cache) { vl.domCache = {}; }
      vl.update();
    };

    VirtualList.prototype.deleteItem = function deleteItem (index) {
      var vl = this;
      vl.deleteItems([index]);
    };

    // Clear cache
    VirtualList.prototype.clearCache = function clearCache () {
      var vl = this;
      vl.domCache = {};
    };

    // Update Virtual List
    VirtualList.prototype.update = function update (deleteCache) {
      var vl = this;
      if (deleteCache && vl.params.cache) {
        vl.domCache = {};
      }
      vl.setListSize();
      vl.render(true);
    };

    VirtualList.prototype.init = function init () {
      var vl = this;
      vl.attachEvents();
      vl.setListSize();
      vl.render();
    };

    VirtualList.prototype.destroy = function destroy () {
      var vl = this;
      vl.detachEvents();
      vl.$el[0].f7VirtualList = null;
      delete vl.$el[0].f7VirtualList;
      Utils.deleteProps(vl);
      vl = null;
    };

    return VirtualList;
  }(Framework7Class));

  var VirtualList$1 = {
    name: 'virtualList',
    static: {
      VirtualList: VirtualList,
    },
    create: function create() {
      var app = this;
      app.virtualList = ConstructorMethods({
        defaultSelector: '.virtual-list',
        constructor: VirtualList,
        app: app,
        domProp: 'f7VirtualList',
      });
    },
  };

  var Tab = {
    show: function show() {
      var assign, assign$1, assign$2;

      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];
      var app = this;
      var tabEl;
      var tabLinkEl;
      var animate;
      var tabRoute;
      if (args.length === 1 && args[0].constructor === Object) {
        tabEl = args[0].tabEl;
        tabLinkEl = args[0].tabLinkEl;
        animate = args[0].animate;
        tabRoute = args[0].tabRoute;
      } else {
        (assign = args, tabEl = assign[0], tabLinkEl = assign[1], animate = assign[2], tabRoute = assign[3]);
        if (typeof args[1] === 'boolean') {
          (assign$1 = args, tabEl = assign$1[0], animate = assign$1[1], tabLinkEl = assign$1[2], tabRoute = assign$1[3]);
          if (args.length > 2 && tabLinkEl.constructor === Object) {
            (assign$2 = args, tabEl = assign$2[0], animate = assign$2[1], tabRoute = assign$2[2], tabLinkEl = assign$2[3]);
          }
        }
      }
      if (typeof animate === 'undefined') { animate = true; }

      var $newTabEl = $$1(tabEl);
      if (tabRoute && $newTabEl[0]) {
        $newTabEl[0].f7TabRoute = tabRoute;
      }

      if ($newTabEl.length === 0 || $newTabEl.hasClass('tab-active')) {
        return {
          $newTabEl: $newTabEl,
          newTabEl: $newTabEl[0],
        };
      }

      var $tabLinkEl;
      if (tabLinkEl) { $tabLinkEl = $$1(tabLinkEl); }

      var $tabsEl = $newTabEl.parent('.tabs');
      if ($tabsEl.length === 0) {
        return {
          $newTabEl: $newTabEl,
          newTabEl: $newTabEl[0],
        };
      }

      // Release swipeouts in hidden tabs
      if (app.swipeout) { app.swipeout.allowOpen = true; }

      // Animated tabs
      var tabsChangedCallbacks = [];

      function onTabsChanged(callback) {
        tabsChangedCallbacks.push(callback);
      }
      function tabsChanged() {
        tabsChangedCallbacks.forEach(function (callback) {
          callback();
        });
      }

      var animated = false;

      if ($tabsEl.parent().hasClass('tabs-animated-wrap')) {
        $tabsEl.parent()[animate ? 'removeClass' : 'addClass']('not-animated');

        var transitionDuration = parseFloat($tabsEl.css('transition-duration').replace(',', '.'));
        if (animate && transitionDuration) {
          $tabsEl.transitionEnd(tabsChanged);
          animated = true;
        }

        var tabsTranslate = (app.rtl ? $newTabEl.index() : -$newTabEl.index()) * 100;
        $tabsEl.transform(("translate3d(" + tabsTranslate + "%,0,0)"));
      }

      // Swipeable tabs
      if ($tabsEl.parent().hasClass('tabs-swipeable-wrap') && app.swiper) {
        var swiper = $tabsEl.parent()[0].swiper;
        if (swiper && swiper.activeIndex !== $newTabEl.index()) {
          animated = true;
          swiper
            .once('slideChangeTransitionEnd', function () {
              tabsChanged();
            })
            .slideTo($newTabEl.index(), animate ? undefined : 0);
        }
      }

      // Remove active class from old tabs
      var $oldTabEl = $tabsEl.children('.tab-active');
      $oldTabEl
        .removeClass('tab-active')
        .trigger('tab:hide');
      app.emit('tabHide', $oldTabEl[0]);

      // Trigger 'show' event on new tab
      $newTabEl
        .addClass('tab-active')
        .trigger('tab:show');
      app.emit('tabShow', $newTabEl[0]);
      if (!$newTabEl[0].isLoaded && typeof (tabEl) == "string") { //by xiang
        if (me["onTabLoad"]) { 
          me.curTab = tabEl.replace("#", "");
          me["onTabLoad"](me.curTab);
        }
        $newTabEl[0].isLoaded = true;
      }
      // Find related link for new tab
      if (!$tabLinkEl) {
        // Search by id
        if (typeof tabEl === 'string') { $tabLinkEl = $$1((".tab-link[href=\"" + tabEl + "\"]")); }
        else { $tabLinkEl = $$1((".tab-link[href=\"#" + ($newTabEl.attr('id')) + "\"]")); }
        // Search by data-tab
        if (!$tabLinkEl || ($tabLinkEl && $tabLinkEl.length === 0)) {
          $$1('[data-tab]').each(function (index, el) {
            if ($newTabEl.is($$1(el).attr('data-tab'))) { $tabLinkEl = $$1(el); }
          });
        }
        if (tabRoute && (!$tabLinkEl || ($tabLinkEl && $tabLinkEl.length === 0))) {
          $tabLinkEl = $$1(("[data-route-tab-id=\"" + (tabRoute.route.tab.id) + "\"]"));
          if ($tabLinkEl.length === 0) {
            $tabLinkEl = $$1((".tab-link[href=\"" + (tabRoute.url) + "\"]"));
          }
        }
        if ($tabLinkEl.length > 1 && $newTabEl.parents('.page').length) {
          // eslint-disable-next-line
          $tabLinkEl = $tabLinkEl.filter(function (index, tabLinkElement) {
            return $$1(tabLinkElement).parents('.page')[0] === $newTabEl.parents('.page')[0];
          });
          if (app.theme === 'ios' && $tabLinkEl.length === 0 && tabRoute) {
            var $pageEl = $newTabEl.parents('.page');
            var $navbarEl = $$1(app.navbar.getElByPage($pageEl));
            $tabLinkEl = $navbarEl.find(("[data-route-tab-id=\"" + (tabRoute.route.tab.id) + "\"]"));
            if ($tabLinkEl.length === 0) {
              $tabLinkEl = $navbarEl.find((".tab-link[href=\"" + (tabRoute.url) + "\"]"));
            }
          }
        }
      }
      if ($tabLinkEl.length > 0) {
        // Find related link for old tab
        var $oldTabLinkEl;
        if ($oldTabEl && $oldTabEl.length > 0) {
          // Search by id
          var oldTabId = $oldTabEl.attr('id');
          if (oldTabId) {
            $oldTabLinkEl = $$1((".tab-link[href=\"#" + oldTabId + "\"]"));
            // Search by data-route-tab-id
            if (!$oldTabLinkEl || ($oldTabLinkEl && $oldTabLinkEl.length === 0)) {
              $oldTabLinkEl = $$1((".tab-link[data-route-tab-id=\"" + oldTabId + "\"]"));
            }
          }
          // Search by data-tab
          if (!$oldTabLinkEl || ($oldTabLinkEl && $oldTabLinkEl.length === 0)) {
            $$1('[data-tab]').each(function (index, tabLinkElement) {
              if ($oldTabEl.is($$1(tabLinkElement).attr('data-tab'))) { $oldTabLinkEl = $$1(tabLinkElement); }
            });
          }
          if (!$oldTabLinkEl || ($oldTabLinkEl && $oldTabLinkEl.length === 0)) {
            $oldTabLinkEl = $tabLinkEl.siblings('.tab-link-active');
          }
        } else if (tabRoute) {
          $oldTabLinkEl = $tabLinkEl.siblings('.tab-link-active');
        }

        if ($oldTabLinkEl && $oldTabLinkEl.length > 1 && $oldTabEl && $oldTabEl.parents('.page').length) {
          // eslint-disable-next-line
          $oldTabLinkEl = $oldTabLinkEl.filter(function (index, tabLinkElement) {
            return $$1(tabLinkElement).parents('.page')[0] === $oldTabEl.parents('.page')[0];
          });
        }

        if ($oldTabLinkEl && $oldTabLinkEl.length > 0) { $oldTabLinkEl.removeClass('tab-link-active'); }

        // Update links' classes
        if ($tabLinkEl && $tabLinkEl.length > 0) {
          $tabLinkEl.addClass('tab-link-active');
          // Material Highlight
          if (app.theme === 'md' && app.toolbar) {
            var $tabbarEl = $tabLinkEl.parents('.tabbar, .tabbar-labels');
            if ($tabbarEl.length > 0) {
              app.toolbar.setHighlight($tabbarEl);
            }
          }
        }
      }
      return {
        $newTabEl: $newTabEl,
        newTabEl: $newTabEl[0],
        $oldTabEl: $oldTabEl,
        oldTabEl: $oldTabEl[0],
        onTabsChanged: onTabsChanged,
        animated: animated,
      };
    },
  };
  var Tabs = {
    name: 'tabs',
    create: function create() {
      var app = this;
      Utils.extend(app, {
        tab: {
          show: Tab.show.bind(app),
        },
      });
    },
    clicks: {
      '.tab-link': function tabLinkClick($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        if (($clickedEl.attr('href') && $clickedEl.attr('href').indexOf('#') === 0) || $clickedEl.attr('data-tab')) {
          app.tab.show({
            tabEl: data.tab || $clickedEl.attr('href'),
            tabLinkEl: $clickedEl,
            animate: data.animate,
          }); 
        }
      },
    },
  };

  var Input = {
    ignoreTypes: ['checkbox', 'button', 'submit', 'range', 'radio', 'image'],
    createTextareaResizableShadow: function createTextareaResizableShadow() {
      var $shadowEl = $$1(doc.createElement('textarea'));
      $shadowEl.addClass('textarea-resizable-shadow');
      $shadowEl.prop({
        disabled: true,
        readonly: true,
      });
      Input.textareaResizableShadow = $shadowEl;
    },
    textareaResizableShadow: undefined,
    resizeTextarea: function resizeTextarea(textareaEl) {
      var app = this;
      var $textareaEl = $$1(textareaEl);
      if (!Input.textareaResizableShadow) {
        Input.createTextareaResizableShadow();
      }
      var $shadowEl = Input.textareaResizableShadow;
      if (!$textareaEl.length) { return; }
      if (!$textareaEl.hasClass('resizable')) { return; }
      if (Input.textareaResizableShadow.parents().length === 0) {
        app.root.append($shadowEl);
      }

      var styles = win.getComputedStyle($textareaEl[0]);
      ('padding margin width font-size font-family font-style font-weight line-height font-variant text-transform letter-spacing border box-sizing display').split(' ').forEach(function (style) {
        var styleValue = styles[style];
        if (('font-size line-height letter-spacing width').split(' ').indexOf(style) >= 0) {
          styleValue = styleValue.replace(',', '.');
        }
        $shadowEl.css(style, styleValue);
      });
      var currentHeight = $textareaEl[0].clientHeight;

      $shadowEl.val('');
      var initialHeight = $shadowEl[0].scrollHeight;

      $shadowEl.val($textareaEl.val());
      $shadowEl.css('height', 0);
      var scrollHeight = $shadowEl[0].scrollHeight;

      if (currentHeight !== scrollHeight) {
        if (scrollHeight > initialHeight) {
          $textareaEl.css('height', (scrollHeight + "px"));
          $textareaEl.trigger('textarea:resize', { initialHeight: initialHeight, currentHeight: currentHeight, scrollHeight: scrollHeight });
        } else if (scrollHeight < currentHeight) {
          $textareaEl.css('height', '');
          $textareaEl.trigger('textarea:resize', { initialHeight: initialHeight, currentHeight: currentHeight, scrollHeight: scrollHeight });
        }
      }
    },
    validate: function validate(inputEl) {
      var $inputEl = $$1(inputEl);
      if (!$inputEl.length) { return; }
      var $itemInputEl = $inputEl.parents('.item-input');
      var $inputWrapEl = $inputEl.parents('.input');
      var validity = $inputEl[0].validity;
      var validationMessage = $inputEl.dataset().errorMessage || $inputEl[0].validationMessage || '';
      if (!validity) { return; }
      if (!validity.valid) {
        var $errorEl = $inputEl.nextAll('.item-input-error-message, .input-error-message');
        if (validationMessage) {
          if ($errorEl.length === 0) {
            $errorEl = $$1(("<div class=\"" + ($inputWrapEl.length ? 'input-error-message' : 'item-input-error-message') + "\"></div>"));
            $errorEl.insertAfter($inputEl);
          }
          $errorEl.text(validationMessage);
        }
        if ($errorEl.length > 0) {
          $itemInputEl.addClass('item-input-with-error-message');
          $inputWrapEl.addClass('input-with-eror-message');
        }
        $itemInputEl.addClass('item-input-invalid');
        $inputWrapEl.addClass('input-invalid');
        $inputEl.addClass('input-invalid');
      } else {
        $itemInputEl.removeClass('item-input-invalid item-input-with-error-message');
        $inputWrapEl.removeClass('input-invalid input-with-error-message');
        $inputEl.removeClass('input-invalid');
      }
    },
    validateInputs: function validateInputs(el) {
      var app = this;
      $$1(el).find('input, textarea, select').each(function (index, inputEl) {
        app.input.validate(inputEl);
      });
    },
    focus: function focus(inputEl) {
      var $inputEl = $$1(inputEl);
      var type = $inputEl.attr('type');
      if (Input.ignoreTypes.indexOf(type) >= 0) { return; }
      $inputEl.parents('.item-input').addClass('item-input-focused');
      $inputEl.parents('.input').addClass('input-focused');
      $inputEl.addClass('input-focused');
    },
    blur: function blur(inputEl) {
      var $inputEl = $$1(inputEl);
      $inputEl.parents('.item-input').removeClass('item-input-focused');
      $inputEl.parents('.input').removeClass('input-focused');
      $inputEl.removeClass('input-focused');
    },
    checkEmptyState: function checkEmptyState(inputEl) {
      var $inputEl = $$1(inputEl);
      var value = $inputEl.val();
      var $itemInputEl = $inputEl.parents('.item-input');
      var $inputWrapEl = $inputEl.parents('.input');
      if ((value && (typeof value === 'string' && value.trim() !== '')) || (Array.isArray(value) && value.length > 0)) {
        $itemInputEl.addClass('item-input-with-value');
        $inputWrapEl.addClass('input-with-value');
        $inputEl.addClass('input-with-value');
        $inputEl.trigger('input:notempty');
      } else {
        $itemInputEl.removeClass('item-input-with-value');
        $inputWrapEl.removeClass('input-with-value');
        $inputEl.removeClass('input-with-value');
        $inputEl.trigger('input:empty');
      }
    },
    scrollIntoView: function scrollIntoView(inputEl, duration, centered, force) {
      if ( duration === void 0 ) duration = 0;

      var $inputEl = $$1(inputEl);
      var $scrollableEl = $inputEl.parents('.page-content, .panel').eq(0);
      if (!$scrollableEl.length) {
        return false;
      }
      var contentHeight = $scrollableEl[0].offsetHeight;
      var contentScrollTop = $scrollableEl[0].scrollTop;
      var contentPaddingTop = parseInt($scrollableEl.css('padding-top'), 10);
      var contentPaddingBottom = parseInt($scrollableEl.css('padding-bottom'), 10);
      var contentOffsetTop = $scrollableEl.offset().top - contentScrollTop;

      var inputOffsetTop = $inputEl.offset().top - contentOffsetTop;
      var inputHeight = $inputEl[0].offsetHeight;

      var min = (inputOffsetTop + contentScrollTop) - contentPaddingTop;
      var max = ((inputOffsetTop + contentScrollTop) - contentHeight) + contentPaddingBottom + inputHeight;
      var centeredPosition = min + ((max - min) / 2);

      if (contentScrollTop > min) {
        $scrollableEl.scrollTop(centered ? centeredPosition : min, duration);
        return true;
      }
      if (contentScrollTop < max) {
        $scrollableEl.scrollTop(centered ? centeredPosition : max, duration);
        return true;
      }
      if (force) {
        $scrollableEl.scrollTop(centered ? centeredPosition : max, duration);
      }
      return false;
    },
    init: function init() {
      var app = this;
      Input.createTextareaResizableShadow();
      function onFocus() {
        var inputEl = this;
        if (app.params.input.scrollIntoViewOnFocus) {
          if (Device.android) {
            $$1(win).once('resize', function () {
              if (doc && doc.activeElement === inputEl) {
                app.input.scrollIntoView(inputEl, app.params.input.scrollIntoViewDuration, app.params.input.scrollIntoViewCentered, app.params.input.scrollIntoViewAlways);
              }
            });
          } else {
            app.input.scrollIntoView(inputEl, app.params.input.scrollIntoViewDuration, app.params.input.scrollIntoViewCentered, app.params.input.scrollIntoViewAlways);
          }
        }
        app.input.focus(inputEl);
      }
      function onBlur() {
        var $inputEl = $$1(this);
        var tag = $inputEl[0].nodeName.toLowerCase();
        app.input.blur($inputEl);
        if ($inputEl.dataset().validate || $inputEl.attr('validate') !== null) {
          app.input.validate($inputEl);
        }
        // Resize textarea
        if (tag === 'textarea' && $inputEl.hasClass('resizable')) {
          if (Input.textareaResizableShadow) { Input.textareaResizableShadow.remove(); }
        }
      }
      function onChange() {
        var $inputEl = $$1(this);
        var type = $inputEl.attr('type');
        var tag = $inputEl[0].nodeName.toLowerCase();
        if (Input.ignoreTypes.indexOf(type) >= 0) { return; }

        // Check Empty State
        app.input.checkEmptyState($inputEl);

        // Check validation
        if ($inputEl.dataset().validate || $inputEl.attr('validate') !== null) {
          app.input.validate($inputEl);
        }

        // Resize textarea
        if (tag === 'textarea' && $inputEl.hasClass('resizable')) {
          app.input.resizeTextarea($inputEl);
        }
      }
      function onInvalid(e) {
        var $inputEl = $$1(this);
        if ($inputEl.dataset().validate || $inputEl.attr('validate') !== null) {
          e.preventDefault();
          app.input.validate($inputEl);
        }
      }
      function clearInput() {
        var $clicked = $$1(this);
        var $inputEl = $clicked.siblings('input, textarea').eq(0);
        var previousValue = $inputEl.val();
        $inputEl
          .val('')
          .trigger('change input')
          .focus()
          .trigger('input:clear', previousValue);
      }
      $$1(doc).on('click', '.input-clear-button', clearInput);
      $$1(doc).on('change input', 'input, textarea, select', onChange, true);
      $$1(doc).on('focus', 'input, textarea, select', onFocus, true);
      $$1(doc).on('blur', 'input, textarea, select', onBlur, true);
      $$1(doc).on('invalid', 'input, textarea, select', onInvalid, true);
    },
  };

  var Input$1 = {
    name: 'input',
    params: {
      input: {
        scrollIntoViewOnFocus: Device.android,
        scrollIntoViewCentered: false,
        scrollIntoViewDuration: 0,
        scrollIntoViewAlways: false,
      },
    },
    create: function create() {
      var app = this;
      Utils.extend(app, {
        input: {
          scrollIntoView: Input.scrollIntoView.bind(app),
          focus: Input.focus.bind(app),
          blur: Input.blur.bind(app),
          validate: Input.validate.bind(app),
          validateInputs: Input.validateInputs.bind(app),
          checkEmptyState: Input.checkEmptyState.bind(app),
          resizeTextarea: Input.resizeTextarea.bind(app),
          init: Input.init.bind(app),
        },
      });
    },
    on: {
      init: function init() {
        var app = this;
        app.input.init();
      },
      tabMounted: function tabMounted(tabEl) {
        var app = this;
        var $tabEl = $$1(tabEl);
        $tabEl.find('.item-input, .input').each(function (itemInputIndex, itemInputEl) {
          var $itemInputEl = $$1(itemInputEl);
          $itemInputEl.find('input, select, textarea').each(function (inputIndex, inputEl) {
            var $inputEl = $$1(inputEl);
            if (Input.ignoreTypes.indexOf($inputEl.attr('type')) >= 0) { return; }
            app.input.checkEmptyState($inputEl);
          });
        });
        $tabEl.find('textarea.resizable').each(function (textareaIndex, textareaEl) {
          app.input.resizeTextarea(textareaEl);
        });
      },
      pageInit: function pageInit(page) {
        var app = this;
        var $pageEl = page.$el;
        $pageEl.find('.item-input, .input').each(function (itemInputIndex, itemInputEl) {
          var $itemInputEl = $$1(itemInputEl);
          $itemInputEl.find('input, select, textarea').each(function (inputIndex, inputEl) {
            var $inputEl = $$1(inputEl);
            if (Input.ignoreTypes.indexOf($inputEl.attr('type')) >= 0) { return; }
            app.input.checkEmptyState($inputEl);
          });
        });
        $pageEl.find('textarea.resizable').each(function (textareaIndex, textareaEl) {
          app.input.resizeTextarea(textareaEl);
        });
      },
    },
  };

  var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function unwrapExports (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var idate_min = createCommonjsModule(function (module, exports) {
  !function(t,e){module.exports=e();}("undefined"!=typeof self?self:commonjsGlobal,function(){return function(t){function e(r){if(n[r]){ return n[r].exports; }var o=n[r]={i:r,l:!1,exports:{}};return t[r].call(o.exports,o,o.exports,e),o.l=!0,o.exports}var n={};return e.m=t,e.c=n,e.d=function(t,n,r){e.o(t,n)||Object.defineProperty(t,n,{configurable:!1,enumerable:!0,get:r});},e.n=function(t){var n=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(n,"a",n),n},e.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},e.p="",e(e.s=0)}([function(t,e,n){function r(t){if(Array.isArray(t)){for(var e=0,n=Array(t.length);e<t.length;e++){ n[e]=t[e]; }return n}return Array.from(t)}function o(t,e){if(!(t instanceof e)){ throw new TypeError("Cannot call a class as a function") }}function a(t,e){if(!t){ throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); }return !e||"object"!=typeof e&&"function"!=typeof e?t:e}function i(t,e){if("function"!=typeof e&&null!==e){ throw new TypeError("Super expression must either be null or a function, not "+typeof e); }t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e);}Object.defineProperty(e,"__esModule",{value:!0});var u=function(){function t(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r);}}return function(e,n,r){return n&&t(e.prototype,n),r&&t(e,r),e}}(),s=n(1),c=["getHours","getMilliseconds","getMinutes","getSeconds","getTime","getTimezoneOffset","getUTCDate","getUTCDay","getUTCFullYear","getUTCHours","getUTCMilliseconds","getUTCMinutes","getUTCMonth","getUTCSeconds","now","parse","setHours","setMilliseconds","setMinutes","setSeconds","setTime","setUTCDate","setUTCFullYear","setUTCHours","setUTCMilliseconds","setUTCMinutes","setUTCMonth","setUTCSeconds","toDateString","toISOString","toJSON","toLocaleDateString","toLocaleTimeString","toLocaleString","toTimeString","toUTCString","UTC","valueOf"],f=["Shanbe","Yekshanbe","Doshanbe","Seshanbe","Chaharshanbe","Panjshanbe","Jom'e"],l=["شنبه","یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه"],g=["Farvardin","Ordibehesht","Khordad","Tir","Mordad","Shahrivar","Mehr","Aban","Azar","Dey","Bahman","Esfand"],h=["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"],d=["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"],y=function(t){function e(){o(this,e);var t=a(this,(e.__proto__||Object.getPrototypeOf(e)).call(this)),n=void 0,i=Array.from(arguments);if(0===i.length){ n=Date.now(); }else if(1===i.length){ n=i[0]instanceof Date?i[0].getTime():i[0]; }else{var u=(0, s.fixDate)(i[0],i[1]||0,void 0===i[2]?1:i[2]),f=(0, s.toGregorian)(u[0],u[1]+1,u[2]);n=[f.gy,f.gm-1,f.gd].concat([i[3]||0,i[4]||0,i[5]||0,i[6]||0]);}Array.isArray(n)?t.gdate=new(Function.prototype.bind.apply(Date,[null].concat(r(n)))):t.gdate=new Date(n);var l=(0, s.toJalaali)(t.gdate.getFullYear(),t.gdate.getMonth()+1,t.gdate.getDate());return t.jdate=[l.jy,l.jm-1,l.jd],c.forEach(function(t){e.prototype[t]=function(){var e;return (e=this.gdate)[t].apply(e,arguments)};}),t}return i(e,t),u(e,[{key:"getFullYear",value:function(){return this.jdate[0]}},{key:"setFullYear",value:function(t){return this.jdate=(0, s.fixDate)(t,this.jdate[1],this.jdate[2]),this.syncDate(),this.gdate.getTime()}},{key:"getMonth",value:function(){return this.jdate[1]}},{key:"setMonth",value:function(t){return this.jdate=(0, s.fixDate)(this.jdate[0],t,this.jdate[2]),this.syncDate(),this.gdate.getTime()}},{key:"getDate",value:function(){return this.jdate[2]}},{key:"setDate",value:function(t){return this.jdate=(0, s.fixDate)(this.jdate[0],this.jdate[1],t),this.syncDate(),this.gdate.getTime()}},{key:"getDay",value:function(){return (this.gdate.getDay()+1)%7}},{key:"syncDate",value:function(){var t=(0, s.toGregorian)(this.jdate[0],this.jdate[1]+1,this.jdate[2]);this.gdate.setFullYear(t.gy),this.gdate.setMonth(t.gm-1),this.gdate.setDate(t.gd);}},{key:"toString",value:function(){var t=!(arguments.length>0&&void 0!==arguments[0])||arguments[0],e=function(t){return 1===t.toString().length?"0"+t:t.toString()},n=e(this.getHours())+":"+e(this.getMinutes())+":"+e(this.getSeconds());return t?function(t){return t.replace(/./g,function(t){return d[t]||t})}(l[this.getDay()]+" "+this.getDate()+" "+h[this.getMonth()]+" "+this.getFullYear()+" ساعت "+n):f[this.getDay()]+" "+this.getDate()+" "+g[this.getMonth()]+" "+this.getFullYear()+" "+n}}]),e}(Date);e.default=y,t.exports=e.default;},function(t,e,n){function r(t,e,n){return "[object Date]"===Object.prototype.toString.call(t)&&(n=t.getDate(),e=t.getMonth()+1,t=t.getFullYear()),c(f(t,e,n))}function o(t,e,n){return l(s(t,e,n))}function a(t){return 0===u(t).leap}function i(t,e){return e<=6?31:e<=11?30:a(t)?30:29}function u(t){var e,n,r,o,a,i,u,s=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178],c=s.length,f=t+621,l=-14,d=s[0];if(t<d||t>=s[c-1]){ throw new Error("Invalid Jalaali year "+t); }for(u=1;u<c&&(e=s[u],n=e-d,!(t<e));u+=1){ l=l+8*g(n,33)+g(h(n,33),4),d=e; }return i=t-d,l=l+8*g(i,33)+g(h(i,33)+3,4),4===h(n,33)&&n-i==4&&(l+=1),o=g(f,4)-g(3*(g(f,100)+1),4)-150,a=20+l-o,n-i<6&&(i=i-n+33*g(n+4,33)),r=h(h(i+1,33)-1,4),-1===r&&(r=4),{leap:r,gy:f,march:a}}function s(t,e,n){var r=u(t);return f(r.gy,3,r.march)+31*(e-1)-g(e,7)*(e-7)+n-1}function c(t){var e,n,r,o=l(t).gy,a=o-621,i=u(a),s=f(o,3,i.march);if((r=t-s)>=0){if(r<=185){ return n=1+g(r,31),e=h(r,31)+1,{jy:a,jm:n,jd:e}; }r-=186;}else { a-=1,r+=179,1===i.leap&&(r+=1); }return n=7+g(r,30),e=h(r,30)+1,{jy:a,jm:n,jd:e}}function f(t,e,n){var r=g(1461*(t+g(e-8,6)+100100),4)+g(153*h(e+9,12)+2,5)+n-34840408;return r=r-g(3*g(t+100100+g(e-8,6),100),4)+752}function l(t){var e,n,r,o,a;return e=4*t+139361631,e=e+4*g(3*g(4*t+183187720,146097),4)-3908,n=5*g(h(e,1461),4)+308,r=g(h(n,153),5)+1,o=h(g(n,153),12)+1,a=g(e,1461)-100100+g(8-o,6),{gy:a,gm:o,gd:r}}function g(t,e){return ~~(t/e)}function h(t,e){return t-~~(t/e)*e}function d(t,e,n){for(e>11&&(t+=Math.floor(e/12),e%=12);e<0;){ t-=1,e+=12; }for(;n>i(t,e+1);){ e=11!==e?e+1:0,t=0===e?t+1:t,n-=i(t,e+1); }for(;n<=0;){ e=0!==e?e-1:11,t=11===e?t-1:t,n+=i(t,e+1); }return [t,e||0,n||1]}Object.defineProperty(e,"__esModule",{value:!0}),e.toJalaali=r,e.toGregorian=o,e.monthLength=i,e.fixDate=d;}])});
  });

  var IDate = unwrapExports(idate_min);
  var idate_min_1 = idate_min.IDate;

  var Calendar = (function (Framework7Class$$1) {
    function Calendar(app, params) {
      if ( params === void 0 ) params = {};

      Framework7Class$$1.call(this, params, [app]);
      var calendar = this;

      calendar.params = Utils.extend({}, app.params.calendar, params);

      if (calendar.params.calendarType === 'jalali') {
        Object.keys(calendar.params.jalali).forEach(function (param) {
          if (!params[param]) {
            calendar.params[param] = calendar.params.jalali[param];
          }
        });
      }

      if (calendar.params.calendarType === 'jalali') {
        calendar.DateHandleClass = IDate;
      } else {
        calendar.DateHandleClass = Date;
      }

      var $containerEl;
      if (calendar.params.containerEl) {
        $containerEl = $$1(calendar.params.containerEl);
        if ($containerEl.length === 0) { return calendar; }
      }

      var $inputEl;
      if (calendar.params.inputEl) {
        $inputEl = $$1(calendar.params.inputEl);
      }

      var view;
      if ($inputEl) {
        view = $inputEl.parents('.view').length && $inputEl.parents('.view')[0].f7View;
      }
      if (!view) { view = app.views.main; }

      var isHorizontal = calendar.params.direction === 'horizontal';

      var inverter = 1;
      if (isHorizontal) {
        inverter = app.rtl ? -1 : 1;
      }

      Utils.extend(calendar, {
        app: app,
        $containerEl: $containerEl,
        containerEl: $containerEl && $containerEl[0],
        inline: $containerEl && $containerEl.length > 0,
        $inputEl: $inputEl,
        inputEl: $inputEl && $inputEl[0],
        initialized: false,
        opened: false,
        url: calendar.params.url,
        isHorizontal: isHorizontal,
        inverter: inverter,
        view: view,
        animating: false,
      });

      function onInputClick() {
        calendar.open();
      }
      function onInputFocus(e) {
        e.preventDefault();
      }
      function onHtmlClick(e) {
        var $targetEl = $$1(e.target);
        if (calendar.isPopover()) { return; }
        if (!calendar.opened || calendar.closing) { return; }
        if ($targetEl.closest('[class*="backdrop"]').length) { return; }
        if ($inputEl && $inputEl.length > 0) {
          if ($targetEl[0] !== $inputEl[0] && $targetEl.closest('.sheet-modal, .calendar-modal').length === 0) {
            calendar.close();
          }
        } else if ($$1(e.target).closest('.sheet-modal, .calendar-modal').length === 0) {
          calendar.close();
        }
      }

      // Events
      Utils.extend(calendar, {
        attachInputEvents: function attachInputEvents() {
          calendar.$inputEl.on('click', onInputClick);
          if (calendar.params.inputReadOnly) {
            calendar.$inputEl.on('focus mousedown', onInputFocus);
          }
        },
        detachInputEvents: function detachInputEvents() {
          calendar.$inputEl.off('click', onInputClick);
          if (calendar.params.inputReadOnly) {
            calendar.$inputEl.off('focus mousedown', onInputFocus);
          }
        },
        attachHtmlEvents: function attachHtmlEvents() {
          app.on('click', onHtmlClick);
        },
        detachHtmlEvents: function detachHtmlEvents() {
          app.off('click', onHtmlClick);
        },
      });
      calendar.attachCalendarEvents = function attachCalendarEvents() {
        var allowItemClick = true;
        var isTouched;
        var isMoved;
        var touchStartX;
        var touchStartY;
        var touchCurrentX;
        var touchCurrentY;
        var touchStartTime;
        var touchEndTime;
        var currentTranslate;
        var wrapperWidth;
        var wrapperHeight;
        var percentage;
        var touchesDiff;
        var isScrolling;

        var $el = calendar.$el;
        var $wrapperEl = calendar.$wrapperEl;

        function handleTouchStart(e) {
          if (isMoved || isTouched) { return; }
          isTouched = true;
          touchStartX = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
          touchCurrentX = touchStartX;
          touchStartY = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
          touchCurrentY = touchStartY;
          touchStartTime = (new calendar.DateHandleClass()).getTime();
          percentage = 0;
          allowItemClick = true;
          isScrolling = undefined;
          currentTranslate = calendar.monthsTranslate;
        }
        function handleTouchMove(e) {
          if (!isTouched) { return; }
          var isH = calendar.isHorizontal;

          touchCurrentX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
          touchCurrentY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
          if (typeof isScrolling === 'undefined') {
            isScrolling = !!(isScrolling || Math.abs(touchCurrentY - touchStartY) > Math.abs(touchCurrentX - touchStartX));
          }
          if (isH && isScrolling) {
            isTouched = false;
            return;
          }
          e.preventDefault();
          if (calendar.animating) {
            isTouched = false;
            return;
          }
          allowItemClick = false;
          if (!isMoved) {
            // First move
            isMoved = true;
            wrapperWidth = $wrapperEl[0].offsetWidth;
            wrapperHeight = $wrapperEl[0].offsetHeight;
            $wrapperEl.transition(0);
          }

          touchesDiff = isH ? touchCurrentX - touchStartX : touchCurrentY - touchStartY;
          percentage = touchesDiff / (isH ? wrapperWidth : wrapperHeight);
          currentTranslate = ((calendar.monthsTranslate * calendar.inverter) + percentage) * 100;

          // Transform wrapper
          $wrapperEl.transform(("translate3d(" + (isH ? currentTranslate : 0) + "%, " + (isH ? 0 : currentTranslate) + "%, 0)"));
        }
        function handleTouchEnd() {
          if (!isTouched || !isMoved) {
            isTouched = false;
            isMoved = false;
            return;
          }
          isTouched = false;
          isMoved = false;

          touchEndTime = new calendar.DateHandleClass().getTime();
          if (touchEndTime - touchStartTime < 300) {
            if (Math.abs(touchesDiff) < 10) {
              calendar.resetMonth();
            } else if (touchesDiff >= 10) {
              if (app.rtl) { calendar.nextMonth(); }
              else { calendar.prevMonth(); }
            } else if (app.rtl) { calendar.prevMonth(); }
            else { calendar.nextMonth(); }
          } else if (percentage <= -0.5) {
            if (app.rtl) { calendar.prevMonth(); }
            else { calendar.nextMonth(); }
          } else if (percentage >= 0.5) {
            if (app.rtl) { calendar.nextMonth(); }
            else { calendar.prevMonth(); }
          } else {
            calendar.resetMonth();
          }

          // Allow click
          setTimeout(function () {
            allowItemClick = true;
          }, 100);
        }

        function handleDayClick(e) {
          if (!allowItemClick) { return; }
          var $dayEl = $$1(e.target).parents('.calendar-day');
          if ($dayEl.length === 0 && $$1(e.target).hasClass('calendar-day')) {
            $dayEl = $$1(e.target);
          }
          if ($dayEl.length === 0) { return; }
          if ($dayEl.hasClass('calendar-day-disabled')) { return; }
          if (!calendar.params.rangePicker) {
            if ($dayEl.hasClass('calendar-day-next')) { calendar.nextMonth(); }
            if ($dayEl.hasClass('calendar-day-prev')) { calendar.prevMonth(); }
          }
          var dateYear = parseInt($dayEl.attr('data-year'), 10);
          var dateMonth = parseInt($dayEl.attr('data-month'), 10);
          var dateDay = parseInt($dayEl.attr('data-day'), 10);
          calendar.emit(
            'local::dayClick calendarDayClick',
            calendar,
            $dayEl[0],
            dateYear,
            dateMonth,
            dateDay
          );
          if (!$dayEl.hasClass('calendar-day-selected') || calendar.params.multiple || calendar.params.rangePicker) {
            calendar.addValue(new calendar.DateHandleClass(dateYear, dateMonth, dateDay, 0, 0, 0));
          }
          if (calendar.params.closeOnSelect) {
            if (
              (calendar.params.rangePicker && calendar.value.length === 2)
              || !calendar.params.rangePicker
            ) {
              calendar.close();
            }
          }
        }

        function onNextMonthClick() {
          calendar.nextMonth();
        }

        function onPrevMonthClick() {
          calendar.prevMonth();
        }

        function onNextYearClick() {
          calendar.nextYear();
        }

        function onPrevYearClick() {
          calendar.prevYear();
        }

        var passiveListener = app.touchEvents.start === 'touchstart' && app.support.passiveListener ? { passive: true, capture: false } : false;
        // Selectors clicks
        $el.find('.calendar-prev-month-button').on('click', onPrevMonthClick);
        $el.find('.calendar-next-month-button').on('click', onNextMonthClick);
        $el.find('.calendar-prev-year-button').on('click', onPrevYearClick);
        $el.find('.calendar-next-year-button').on('click', onNextYearClick);
        // Day clicks
        $wrapperEl.on('click', handleDayClick);
        // Touch events
        {
          if (calendar.params.touchMove) {
            $wrapperEl.on(app.touchEvents.start, handleTouchStart, passiveListener);
            app.on('touchmove:active', handleTouchMove);
            app.on('touchend:passive', handleTouchEnd);
          }
        }

        calendar.detachCalendarEvents = function detachCalendarEvents() {
          $el.find('.calendar-prev-month-button').off('click', onPrevMonthClick);
          $el.find('.calendar-next-month-button').off('click', onNextMonthClick);
          $el.find('.calendar-prev-year-button').off('click', onPrevYearClick);
          $el.find('.calendar-next-year-button').off('click', onNextYearClick);
          $wrapperEl.off('click', handleDayClick);
          {
            if (calendar.params.touchMove) {
              $wrapperEl.off(app.touchEvents.start, handleTouchStart, passiveListener);
              app.off('touchmove:active', handleTouchMove);
              app.off('touchend:passive', handleTouchEnd);
            }
          }
        };
      };

      calendar.init();

      return calendar;
    }

    if ( Framework7Class$$1 ) Calendar.__proto__ = Framework7Class$$1;
    Calendar.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    Calendar.prototype.constructor = Calendar;
    // eslint-disable-next-line
    Calendar.prototype.normalizeDate = function normalizeDate (date) {
      var calendar = this;
      var d = new calendar.DateHandleClass(date);
      return new calendar.DateHandleClass(d.getFullYear(), d.getMonth(), d.getDate());
    };

    Calendar.prototype.normalizeValues = function normalizeValues (values) {
      var calendar = this;
      var newValues = [];
      if (values && Array.isArray(values)) {
        newValues = values.map(function (val) { return calendar.normalizeDate(val); });
      }
      return newValues;
    };

    Calendar.prototype.initInput = function initInput () {
      var calendar = this;
      if (!calendar.$inputEl) { return; }
      if (calendar.params.inputReadOnly) { calendar.$inputEl.prop('readOnly', true); }
    };

    Calendar.prototype.isPopover = function isPopover () {
      var calendar = this;
      var app = calendar.app;
      var modal = calendar.modal;
      var params = calendar.params;
      if (params.openIn === 'sheet') { return false; }
      if (modal && modal.type !== 'popover') { return false; }

      if (!calendar.inline && calendar.inputEl) {
        if (params.openIn === 'popover') { return true; }
        if (app.device.ios) {
          return !!app.device.ipad;
        }
        if (app.width >= 768) {
          return true;
        }
      }
      return false;
    };

    Calendar.prototype.formatDate = function formatDate (d) {
      var calendar = this;
      var date = new calendar.DateHandleClass(d);
      var year = date.getFullYear();
      var month = date.getMonth();
      var month1 = month + 1;
      var day = date.getDate();
      var weekDay = date.getDay();
      var ref = calendar.params;
      var dateFormat = ref.dateFormat;
      var monthNames = ref.monthNames;
      var monthNamesShort = ref.monthNamesShort;
      var dayNames = ref.dayNames;
      var dayNamesShort = ref.dayNamesShort;

      return dateFormat
        .replace(/yyyy/g, year)
        .replace(/yy/g, String(year).substring(2))
        .replace(/mm/g, month1 < 10 ? ("0" + month1) : month1)
        .replace(/m(\W+)/g, (month1 + "$1"))
        .replace(/MM/g, monthNames[month])
        .replace(/M(\W+)/g, ((monthNamesShort[month]) + "$1"))
        .replace(/dd/g, day < 10 ? ("0" + day) : day)
        .replace(/d(\W+)/g, (day + "$1"))
        .replace(/DD/g, dayNames[weekDay])
        .replace(/D(\W+)/g, ((dayNamesShort[weekDay]) + "$1"));
    };

    Calendar.prototype.formatValue = function formatValue () {
      var calendar = this;
      var value = calendar.value;
      if (calendar.params.formatValue) {
        return calendar.params.formatValue.call(calendar, value);
      }
      return value
        .map(function (v) { return calendar.formatDate(v); })
        .join(calendar.params.rangePicker ? ' - ' : ', ');
    };

    Calendar.prototype.addValue = function addValue (newValue) {
      var calendar = this;
      var ref = calendar.params;
      var multiple = ref.multiple;
      var rangePicker = ref.rangePicker;
      var rangePickerMinDays = ref.rangePickerMinDays;
      var rangePickerMaxDays = ref.rangePickerMaxDays;
      if (multiple) {
        if (!calendar.value) { calendar.value = []; }
        var inValuesIndex;
        for (var i = 0; i < calendar.value.length; i += 1) {
          if (new calendar.DateHandleClass(newValue).getTime() === new calendar.DateHandleClass(calendar.value[i]).getTime()) {
            inValuesIndex = i;
          }
        }
        if (typeof inValuesIndex === 'undefined') {
          calendar.value.push(newValue);
        } else {
          calendar.value.splice(inValuesIndex, 1);
        }
        calendar.updateValue();
      } else if (rangePicker) {
        if (!calendar.value) { calendar.value = []; }
        if (calendar.value.length === 2 || calendar.value.length === 0) {
          calendar.value = [];
        }

        if ((calendar.value.length === 0
          || ((Math.abs(calendar.value[0].getTime() - newValue.getTime()) >= (rangePickerMinDays - 1) * 60 * 60 * 24 * 1000) && (rangePickerMaxDays === 0 || Math.abs(calendar.value[0].getTime() - newValue.getTime()) <= (rangePickerMaxDays - 1) * 60 * 60 * 24 * 1000)))) { calendar.value.push(newValue); }
        else { calendar.value = []; }

        calendar.value.sort(function (a, b) { return a - b; });
        calendar.updateValue();
      } else {
        calendar.value = [newValue];
        calendar.updateValue();
      }
    };

    Calendar.prototype.setValue = function setValue (values) {
      var calendar = this;
      calendar.value = values;
      calendar.updateValue();
    };

    Calendar.prototype.getValue = function getValue () {
      var calendar = this;
      return calendar.value;
    };

    Calendar.prototype.updateValue = function updateValue (onlyHeader) {
      var calendar = this;
      var $el = calendar.$el;
      var $wrapperEl = calendar.$wrapperEl;
      var $inputEl = calendar.$inputEl;
      var value = calendar.value;
      var params = calendar.params;
      var i;
      if ($el && $el.length > 0) {
        $wrapperEl.find('.calendar-day-selected').removeClass('calendar-day-selected');
        var valueDate;
        if (params.rangePicker && value.length === 2) {
          for (i = new calendar.DateHandleClass(value[0]).getTime(); i <= new calendar.DateHandleClass(value[1]).getTime(); i += 24 * 60 * 60 * 1000) {
            valueDate = new calendar.DateHandleClass(i);
            $wrapperEl.find((".calendar-day[data-date=\"" + (valueDate.getFullYear()) + "-" + (valueDate.getMonth()) + "-" + (valueDate.getDate()) + "\"]")).addClass('calendar-day-selected');
          }
        } else {
          for (i = 0; i < calendar.value.length; i += 1) {
            valueDate = new calendar.DateHandleClass(value[i]);
            $wrapperEl.find((".calendar-day[data-date=\"" + (valueDate.getFullYear()) + "-" + (valueDate.getMonth()) + "-" + (valueDate.getDate()) + "\"]")).addClass('calendar-day-selected');
          }
        }
      }
      if (!onlyHeader) {
        calendar.emit('local::change calendarChange', calendar, value);
      }


      if (($inputEl && $inputEl.length) || params.header) {
        var inputValue = calendar.formatValue(value);
        if (params.header && $el && $el.length) {
          $el.find('.calendar-selected-date').text(inputValue);
        }
        if ($inputEl && $inputEl.length && !onlyHeader) {
          $inputEl.val(inputValue);
          $inputEl.trigger('change');
        }
      }
    };

    Calendar.prototype.updateCurrentMonthYear = function updateCurrentMonthYear (dir) {
      var calendar = this;
      var $months = calendar.$months;
      var $el = calendar.$el;
      var params = calendar.params;
      if (typeof dir === 'undefined') {
        calendar.currentMonth = parseInt($months.eq(1).attr('data-month'), 10);
        calendar.currentYear = parseInt($months.eq(1).attr('data-year'), 10);
      } else {
        calendar.currentMonth = parseInt($months.eq(dir === 'next' ? ($months.length - 1) : 0).attr('data-month'), 10);
        calendar.currentYear = parseInt($months.eq(dir === 'next' ? ($months.length - 1) : 0).attr('data-year'), 10);
      }
      $el.find('.current-month-value').text(params.monthNames[calendar.currentMonth]);
      $el.find('.current-year-value').text(calendar.currentYear);
    };

    Calendar.prototype.update = function update () {
      var calendar = this;
      var currentYear = calendar.currentYear;
      var currentMonth = calendar.currentMonth;
      var $wrapperEl = calendar.$wrapperEl;
      var currentDate = new calendar.DateHandleClass(currentYear, currentMonth);
      var prevMonthHtml = calendar.renderMonth(currentDate, 'prev');
      var currentMonthHtml = calendar.renderMonth(currentDate);
      var nextMonthHtml = calendar.renderMonth(currentDate, 'next');

      $wrapperEl
        .transition(0)
        .html(("" + prevMonthHtml + currentMonthHtml + nextMonthHtml))
        .transform('translate3d(0,0,0)');
      calendar.$months = $wrapperEl.find('.calendar-month');
      calendar.monthsTranslate = 0;
      calendar.setMonthsTranslate();
      calendar.$months.each(function (index, monthEl) {
        calendar.emit(
          'local::monthAdd calendarMonthAdd',
          monthEl
        );
      });
    };

    Calendar.prototype.onMonthChangeStart = function onMonthChangeStart (dir) {
      var calendar = this;
      var $months = calendar.$months;
      var currentYear = calendar.currentYear;
      var currentMonth = calendar.currentMonth;
      calendar.updateCurrentMonthYear(dir);
      $months.removeClass('calendar-month-current calendar-month-prev calendar-month-next');
      var currentIndex = dir === 'next' ? $months.length - 1 : 0;

      $months.eq(currentIndex).addClass('calendar-month-current');
      $months.eq(dir === 'next' ? currentIndex - 1 : currentIndex + 1).addClass(dir === 'next' ? 'calendar-month-prev' : 'calendar-month-next');

      calendar.emit(
        'local::monthYearChangeStart calendarMonthYearChangeStart',
        calendar,
        currentYear,
        currentMonth
      );
    };

    Calendar.prototype.onMonthChangeEnd = function onMonthChangeEnd (dir, rebuildBoth) {
      var calendar = this;
      var currentYear = calendar.currentYear;
      var currentMonth = calendar.currentMonth;
      var $wrapperEl = calendar.$wrapperEl;
      var monthsTranslate = calendar.monthsTranslate;
      calendar.animating = false;
      var nextMonthHtml;
      var prevMonthHtml;
      var currentMonthHtml;
      $wrapperEl
        .find('.calendar-month:not(.calendar-month-prev):not(.calendar-month-current):not(.calendar-month-next)')
        .remove();

      if (typeof dir === 'undefined') {
        dir = 'next'; // eslint-disable-line
        rebuildBoth = true; // eslint-disable-line
      }
      if (!rebuildBoth) {
        currentMonthHtml = calendar.renderMonth(new calendar.DateHandleClass(currentYear, currentMonth), dir);
      } else {
        $wrapperEl.find('.calendar-month-next, .calendar-month-prev').remove();
        prevMonthHtml = calendar.renderMonth(new calendar.DateHandleClass(currentYear, currentMonth), 'prev');
        nextMonthHtml = calendar.renderMonth(new calendar.DateHandleClass(currentYear, currentMonth), 'next');
      }
      if (dir === 'next' || rebuildBoth) {
        $wrapperEl.append(currentMonthHtml || nextMonthHtml);
      }
      if (dir === 'prev' || rebuildBoth) {
        $wrapperEl.prepend(currentMonthHtml || prevMonthHtml);
      }
      var $months = $wrapperEl.find('.calendar-month');
      calendar.$months = $months;
      calendar.setMonthsTranslate(monthsTranslate);
      calendar.emit(
        'local::monthAdd calendarMonthAdd',
        calendar,
        dir === 'next' ? $months.eq($months.length - 1)[0] : $months.eq(0)[0]
      );
      calendar.emit(
        'local::monthYearChangeEnd calendarMonthYearChangeEnd',
        calendar,
        currentYear,
        currentMonth
      );
    };

    Calendar.prototype.setMonthsTranslate = function setMonthsTranslate (translate) {
      var calendar = this;
      var $months = calendar.$months;
      var isH = calendar.isHorizontal;
      var inverter = calendar.inverter;
      // eslint-disable-next-line
      translate = translate || calendar.monthsTranslate || 0;
      if (typeof calendar.monthsTranslate === 'undefined') {
        calendar.monthsTranslate = translate;
      }
      $months.removeClass('calendar-month-current calendar-month-prev calendar-month-next');
      var prevMonthTranslate = -(translate + 1) * 100 * inverter;
      var currentMonthTranslate = -translate * 100 * inverter;
      var nextMonthTranslate = -(translate - 1) * 100 * inverter;
      $months.eq(0)
        .transform(("translate3d(" + (isH ? prevMonthTranslate : 0) + "%, " + (isH ? 0 : prevMonthTranslate) + "%, 0)"))
        .addClass('calendar-month-prev');
      $months.eq(1)
        .transform(("translate3d(" + (isH ? currentMonthTranslate : 0) + "%, " + (isH ? 0 : currentMonthTranslate) + "%, 0)"))
        .addClass('calendar-month-current');
      $months.eq(2)
        .transform(("translate3d(" + (isH ? nextMonthTranslate : 0) + "%, " + (isH ? 0 : nextMonthTranslate) + "%, 0)"))
        .addClass('calendar-month-next');
    };

    Calendar.prototype.nextMonth = function nextMonth (transition) {
      var calendar = this;
      var params = calendar.params;
      var $wrapperEl = calendar.$wrapperEl;
      var inverter = calendar.inverter;
      var isH = calendar.isHorizontal;
      if (typeof transition === 'undefined' || typeof transition === 'object') {
        transition = ''; // eslint-disable-line
        if (!params.animate) { transition = 0; } // eslint-disable-line
      }
      var nextMonth = parseInt(calendar.$months.eq(calendar.$months.length - 1).attr('data-month'), 10);
      var nextYear = parseInt(calendar.$months.eq(calendar.$months.length - 1).attr('data-year'), 10);
      var nextDate = new calendar.DateHandleClass(nextYear, nextMonth);
      var nextDateTime = nextDate.getTime();
      var transitionEndCallback = !calendar.animating;
      if (params.maxDate) {
        if (nextDateTime > new calendar.DateHandleClass(params.maxDate).getTime()) {
          calendar.resetMonth();
          return;
        }
      }
      calendar.monthsTranslate -= 1;
      if (nextMonth === calendar.currentMonth) {
        var nextMonthTranslate = -(calendar.monthsTranslate) * 100 * inverter;
        var nextMonthHtml = $$1(calendar.renderMonth(nextDateTime, 'next'))
          .transform(("translate3d(" + (isH ? nextMonthTranslate : 0) + "%, " + (isH ? 0 : nextMonthTranslate) + "%, 0)"))
          .addClass('calendar-month-next');
        $wrapperEl.append(nextMonthHtml[0]);
        calendar.$months = $wrapperEl.find('.calendar-month');
        calendar.emit(
          'local::monthAdd calendarMonthAdd',
          calendar.$months.eq(calendar.$months.length - 1)[0]
        );
      }
      calendar.animating = true;
      calendar.onMonthChangeStart('next');
      var translate = (calendar.monthsTranslate * 100) * inverter;

      $wrapperEl.transition(transition).transform(("translate3d(" + (isH ? translate : 0) + "%, " + (isH ? 0 : translate) + "%, 0)"));
      if (transitionEndCallback) {
        $wrapperEl.transitionEnd(function () {
          calendar.onMonthChangeEnd('next');
        });
      }
      if (!params.animate) {
        calendar.onMonthChangeEnd('next');
      }
    };

    Calendar.prototype.prevMonth = function prevMonth (transition) {
      var calendar = this;
      var params = calendar.params;
      var $wrapperEl = calendar.$wrapperEl;
      var inverter = calendar.inverter;
      var isH = calendar.isHorizontal;
      if (typeof transition === 'undefined' || typeof transition === 'object') {
        transition = ''; // eslint-disable-line
        if (!params.animate) { transition = 0; } // eslint-disable-line
      }
      var prevMonth = parseInt(calendar.$months.eq(0).attr('data-month'), 10);
      var prevYear = parseInt(calendar.$months.eq(0).attr('data-year'), 10);
      var prevDate = new calendar.DateHandleClass(prevYear, prevMonth + 1, -1);
      var prevDateTime = prevDate.getTime();
      var transitionEndCallback = !calendar.animating;
      if (params.minDate) {
        var minDate = new calendar.DateHandleClass(params.minDate);
        minDate = new calendar.DateHandleClass(minDate.getFullYear(), minDate.getMonth(), 1);
        if (prevDateTime < minDate.getTime()) {
          calendar.resetMonth();
          return;
        }
      }
      calendar.monthsTranslate += 1;
      if (prevMonth === calendar.currentMonth) {
        var prevMonthTranslate = -(calendar.monthsTranslate) * 100 * inverter;
        var prevMonthHtml = $$1(calendar.renderMonth(prevDateTime, 'prev'))
          .transform(("translate3d(" + (isH ? prevMonthTranslate : 0) + "%, " + (isH ? 0 : prevMonthTranslate) + "%, 0)"))
          .addClass('calendar-month-prev');
        $wrapperEl.prepend(prevMonthHtml[0]);
        calendar.$months = $wrapperEl.find('.calendar-month');
        calendar.emit(
          'local::monthAdd calendarMonthAdd',
          calendar.$months.eq(0)[0]
        );
      }
      calendar.animating = true;
      calendar.onMonthChangeStart('prev');
      var translate = (calendar.monthsTranslate * 100) * inverter;
      $wrapperEl
        .transition(transition)
        .transform(("translate3d(" + (isH ? translate : 0) + "%, " + (isH ? 0 : translate) + "%, 0)"));
      if (transitionEndCallback) {
        $wrapperEl.transitionEnd(function () {
          calendar.onMonthChangeEnd('prev');
        });
      }
      if (!params.animate) {
        calendar.onMonthChangeEnd('prev');
      }
    };

    Calendar.prototype.resetMonth = function resetMonth (transition) {
      if ( transition === void 0 ) transition = '';

      var calendar = this;
      var $wrapperEl = calendar.$wrapperEl;
      var inverter = calendar.inverter;
      var isH = calendar.isHorizontal;
      var monthsTranslate = calendar.monthsTranslate;
      var translate = (monthsTranslate * 100) * inverter;
      $wrapperEl
        .transition(transition)
        .transform(("translate3d(" + (isH ? translate : 0) + "%, " + (isH ? 0 : translate) + "%, 0)"));
    };
    // eslint-disable-next-line
    Calendar.prototype.setYearMonth = function setYearMonth (year, month, transition) {
      var calendar = this;
      var params = calendar.params;
      var isH = calendar.isHorizontal;
      var $wrapperEl = calendar.$wrapperEl;
      var inverter = calendar.inverter;
      // eslint-disable-next-line
      if (typeof year === 'undefined') { year = calendar.currentYear; }
      // eslint-disable-next-line
      if (typeof month === 'undefined') { month = calendar.currentMonth; }
      if (typeof transition === 'undefined' || typeof transition === 'object') {
        // eslint-disable-next-line
        transition = '';
        // eslint-disable-next-line
        if (!params.animate) { transition = 0; }
      }
      var targetDate;
      if (year < calendar.currentYear) {
        targetDate = new calendar.DateHandleClass(year, month + 1, -1).getTime();
      } else {
        targetDate = new calendar.DateHandleClass(year, month).getTime();
      }
      if (params.maxDate && targetDate > new calendar.DateHandleClass(params.maxDate).getTime()) {
        return false;
      }
      if (params.minDate) {
        var minDate = new calendar.DateHandleClass(params.minDate);
        minDate = new calendar.DateHandleClass(minDate.getFullYear(), minDate.getMonth(), 1);
        if (targetDate < minDate.getTime()) {
          return false;
        }
      }
      var currentDate = new calendar.DateHandleClass(calendar.currentYear, calendar.currentMonth).getTime();
      var dir = targetDate > currentDate ? 'next' : 'prev';
      var newMonthHTML = calendar.renderMonth(new calendar.DateHandleClass(year, month));
      calendar.monthsTranslate = calendar.monthsTranslate || 0;
      var prevTranslate = calendar.monthsTranslate;
      var monthTranslate;
      var transitionEndCallback = !calendar.animating;
      if (targetDate > currentDate) {
        // To next
        calendar.monthsTranslate -= 1;
        if (!calendar.animating) { calendar.$months.eq(calendar.$months.length - 1).remove(); }
        $wrapperEl.append(newMonthHTML);
        calendar.$months = $wrapperEl.find('.calendar-month');
        monthTranslate = -(prevTranslate - 1) * 100 * inverter;
        calendar.$months
          .eq(calendar.$months.length - 1)
          .transform(("translate3d(" + (isH ? monthTranslate : 0) + "%, " + (isH ? 0 : monthTranslate) + "%, 0)"))
          .addClass('calendar-month-next');
      } else {
        // To prev
        calendar.monthsTranslate += 1;
        if (!calendar.animating) { calendar.$months.eq(0).remove(); }
        $wrapperEl.prepend(newMonthHTML);
        calendar.$months = $wrapperEl.find('.calendar-month');
        monthTranslate = -(prevTranslate + 1) * 100 * inverter;
        calendar.$months
          .eq(0)
          .transform(("translate3d(" + (isH ? monthTranslate : 0) + "%, " + (isH ? 0 : monthTranslate) + "%, 0)"))
          .addClass('calendar-month-prev');
      }
      calendar.emit(
        'local::monthAdd calendarMonthAdd',
        dir === 'next'
          ? calendar.$months.eq(calendar.$months.length - 1)[0]
          : calendar.$months.eq(0)[0]
      );

      calendar.animating = true;
      calendar.onMonthChangeStart(dir);
      var wrapperTranslate = (calendar.monthsTranslate * 100) * inverter;
      $wrapperEl
        .transition(transition)
        .transform(("translate3d(" + (isH ? wrapperTranslate : 0) + "%, " + (isH ? 0 : wrapperTranslate) + "%, 0)"));
      if (transitionEndCallback) {
        $wrapperEl.transitionEnd(function () {
          calendar.onMonthChangeEnd(dir, true);
        });
      }
      if (!params.animate) {
        calendar.onMonthChangeEnd(dir);
      }
    };

    Calendar.prototype.nextYear = function nextYear () {
      var calendar = this;
      calendar.setYearMonth(calendar.currentYear + 1);
    };

    Calendar.prototype.prevYear = function prevYear () {
      var calendar = this;
      calendar.setYearMonth(calendar.currentYear - 1);
    };
    // eslint-disable-next-line
    Calendar.prototype.dateInRange = function dateInRange (dayDate, range) {
      var calendar = this;
      var match = false;
      var i;
      if (!range) { return false; }
      if (Array.isArray(range)) {
        for (i = 0; i < range.length; i += 1) {
          if (range[i].from || range[i].to) {
            if (range[i].from && range[i].to) {
              if ((dayDate <= new calendar.DateHandleClass(range[i].to).getTime()) && (dayDate >= new calendar.DateHandleClass(range[i].from).getTime())) {
                match = true;
              }
            } else if (range[i].from) {
              if (dayDate >= new calendar.DateHandleClass(range[i].from).getTime()) {
                match = true;
              }
            } else if (range[i].to) {
              if (dayDate <= new calendar.DateHandleClass(range[i].to).getTime()) {
                match = true;
              }
            }
          } else if (dayDate === new calendar.DateHandleClass(range[i]).getTime()) {
            match = true;
          }
        }
      } else if (range.from || range.to) {
        if (range.from && range.to) {
          if ((dayDate <= new calendar.DateHandleClass(range.to).getTime()) && (dayDate >= new calendar.DateHandleClass(range.from).getTime())) {
            match = true;
          }
        } else if (range.from) {
          if (dayDate >= new calendar.DateHandleClass(range.from).getTime()) {
            match = true;
          }
        } else if (range.to) {
          if (dayDate <= new calendar.DateHandleClass(range.to).getTime()) {
            match = true;
          }
        }
      } else if (typeof range === 'function') {
        match = range(new calendar.DateHandleClass(dayDate));
      }
      return match;
    };
    // eslint-disable-next-line
    Calendar.prototype.daysInMonth = function daysInMonth (date) {
      var calendar = this;
      var d = new calendar.DateHandleClass(date);
      return new calendar.DateHandleClass(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    };

    Calendar.prototype.renderMonths = function renderMonths (date) {
      var calendar = this;
      if (calendar.params.renderMonths) {
        return calendar.params.renderMonths.call(calendar, date);
      }
      return ("\n    <div class=\"calendar-months-wrapper\">\n    " + (calendar.renderMonth(date, 'prev')) + "\n    " + (calendar.renderMonth(date)) + "\n    " + (calendar.renderMonth(date, 'next')) + "\n    </div>\n  ").trim();
    };

    Calendar.prototype.renderMonth = function renderMonth (d, offset) {
      var calendar = this;
      var params = calendar.params;
      var value = calendar.value;
      if (params.renderMonth) {
        return params.renderMonth.call(calendar, d, offset);
      }
      var date = new calendar.DateHandleClass(d);
      var year = date.getFullYear();
      var month = date.getMonth();

      if (offset === 'next') {
        if (month === 11) { date = new calendar.DateHandleClass(year + 1, 0); }
        else { date = new calendar.DateHandleClass(year, month + 1, 1); }
      }
      if (offset === 'prev') {
        if (month === 0) { date = new calendar.DateHandleClass(year - 1, 11); }
        else { date = new calendar.DateHandleClass(year, month - 1, 1); }
      }
      if (offset === 'next' || offset === 'prev') {
        month = date.getMonth();
        year = date.getFullYear();
      }

      var currentValues = [];
      var today = new calendar.DateHandleClass().setHours(0, 0, 0, 0);
      var minDate = params.minDate ? new calendar.DateHandleClass(params.minDate).getTime() : null;
      var maxDate = params.maxDate ? new calendar.DateHandleClass(params.maxDate).getTime() : null;
      var rows = 6;
      var cols = 7;
      var daysInPrevMonth = calendar.daysInMonth(new calendar.DateHandleClass(date.getFullYear(), date.getMonth()).getTime() - (10 * 24 * 60 * 60 * 1000));
      var daysInMonth = calendar.daysInMonth(date);
      var minDayNumber = params.firstDay === 6 ? 0 : 1;

      var monthHtml = '';
      var dayIndex = 0 + (params.firstDay - 1);
      var disabled;
      var hasEvent;
      var firstDayOfMonthIndex = new calendar.DateHandleClass(date.getFullYear(), date.getMonth()).getDay();
      if (firstDayOfMonthIndex === 0) { firstDayOfMonthIndex = 7; }

      if (value && value.length) {
        for (var i = 0; i < value.length; i += 1) {
          currentValues.push(new calendar.DateHandleClass(value[i]).setHours(0, 0, 0, 0));
        }
      }

      for (var row = 1; row <= rows; row += 1) {
        var rowHtml = '';
        for (var col = 1; col <= cols; col += 1) {
          dayIndex += 1;
          var dayDate = (void 0);
          var dayNumber = dayIndex - firstDayOfMonthIndex;
          var addClass = '';
          if (row === 1 && col === 1 && dayNumber > minDayNumber && params.firstDay !== 1) {
            dayIndex -= 7;
            dayNumber = dayIndex - firstDayOfMonthIndex;
          }

          var weekDayIndex = ((col - 1) + params.firstDay > 6)
            ? ((col - 1 - 7) + params.firstDay)
            : ((col - 1) + params.firstDay);

          if (dayNumber < 0) {
            dayNumber = daysInPrevMonth + dayNumber + 1;
            addClass += ' calendar-day-prev';
            dayDate = new calendar.DateHandleClass(month - 1 < 0 ? year - 1 : year, month - 1 < 0 ? 11 : month - 1, dayNumber).getTime();
          } else {
            dayNumber += 1;
            if (dayNumber > daysInMonth) {
              dayNumber -= daysInMonth;
              addClass += ' calendar-day-next';
              dayDate = new calendar.DateHandleClass(month + 1 > 11 ? year + 1 : year, month + 1 > 11 ? 0 : month + 1, dayNumber).getTime();
            } else {
              dayDate = new calendar.DateHandleClass(year, month, dayNumber).getTime();
            }
          }
          // Today
          if (dayDate === today) { addClass += ' calendar-day-today'; }

          // Selected
          if (params.rangePicker && currentValues.length === 2) {
            if (dayDate >= currentValues[0] && dayDate <= currentValues[1]) { addClass += ' calendar-day-selected'; }
          } else if (currentValues.indexOf(dayDate) >= 0) { addClass += ' calendar-day-selected'; }
          // Weekend
          if (params.weekendDays.indexOf(weekDayIndex) >= 0) {
            addClass += ' calendar-day-weekend';
          }
          // Has Events
          hasEvent = false;
          if (params.events) {
            if (calendar.dateInRange(dayDate, params.events)) {
              hasEvent = true;
            }
          }
          if (hasEvent) {
            addClass += ' calendar-day-has-events';
          }
          // Custom Ranges
          if (params.rangesClasses) {
            for (var k = 0; k < params.rangesClasses.length; k += 1) {
              if (calendar.dateInRange(dayDate, params.rangesClasses[k].range)) {
                addClass += " " + (params.rangesClasses[k].cssClass);
              }
            }
          }
          // Disabled
          disabled = false;
          if ((minDate && dayDate < minDate) || (maxDate && dayDate > maxDate)) {
            disabled = true;
          }
          if (params.disabled) {
            if (calendar.dateInRange(dayDate, params.disabled)) {
              disabled = true;
            }
          }
          if (disabled) {
            addClass += ' calendar-day-disabled';
          }

          dayDate = new calendar.DateHandleClass(dayDate);
          var dayYear = dayDate.getFullYear();
          var dayMonth = dayDate.getMonth();
          rowHtml += ("\n      <div data-year=\"" + dayYear + "\" data-month=\"" + dayMonth + "\" data-day=\"" + dayNumber + "\" class=\"calendar-day" + addClass + "\" data-date=\"" + dayYear + "-" + dayMonth + "-" + dayNumber + "\">\n      <span>" + dayNumber + "</span>\n      </div>").trim();
        }
        monthHtml += "<div class=\"calendar-row\">" + rowHtml + "</div>";
      }
      monthHtml = "<div class=\"calendar-month\" data-year=\"" + year + "\" data-month=\"" + month + "\">" + monthHtml + "</div>";
      return monthHtml;
    };

    Calendar.prototype.renderWeekHeader = function renderWeekHeader () {
      var calendar = this;
      if (calendar.params.renderWeekHeader) {
        return calendar.params.renderWeekHeader.call(calendar);
      }
      var params = calendar.params;
      var weekDaysHtml = '';
      for (var i = 0; i < 7; i += 1) {
        var dayIndex = (i + params.firstDay > 6)
          ? ((i - 7) + params.firstDay)
          : (i + params.firstDay);
        var dayName = params.dayNamesShort[dayIndex];
        weekDaysHtml += "<div class=\"calendar-week-day\">" + dayName + "</div>";
      }
      return ("\n    <div class=\"calendar-week-header\">\n    " + weekDaysHtml + "\n    </div>\n  ").trim();
    };

    Calendar.prototype.renderMonthSelector = function renderMonthSelector () {
      var calendar = this;
      var app = calendar.app;
      if (calendar.params.renderMonthSelector) {
        return calendar.params.renderMonthSelector.call(calendar);
      }

      var needsBlackIcon;
      if (calendar.inline && calendar.$containerEl.closest('.theme-dark').length === 0) {
        needsBlackIcon = true;
      } else if (app.root.closest('.theme-dark').length === 0) {
        needsBlackIcon = true;
      }

      var iconColor = app.theme === 'md' && needsBlackIcon ? 'color-black' : '';
      return ("\n    <div class=\"calendar-month-selector\">\n    <a href=\"#\" class=\"link icon-only calendar-prev-month-button\">\n      <i class=\"icon icon-prev " + iconColor + "\"></i>\n    </a>\n    <span class=\"current-month-value\"></span>\n    <a href=\"#\" class=\"link icon-only calendar-next-month-button\">\n      <i class=\"icon icon-next " + iconColor + "\"></i>\n    </a>\n    </div>\n  ").trim();
    };

    Calendar.prototype.renderYearSelector = function renderYearSelector () {
      var calendar = this;
      var app = calendar.app;
      if (calendar.params.renderYearSelector) {
        return calendar.params.renderYearSelector.call(calendar);
      }

      var needsBlackIcon;
      if (calendar.inline && calendar.$containerEl.closest('.theme-dark').length === 0) {
        needsBlackIcon = true;
      } else if (app.root.closest('.theme-dark').length === 0) {
        needsBlackIcon = true;
      }

      var iconColor = app.theme === 'md' && needsBlackIcon ? 'color-black' : '';
      return ("\n    <div class=\"calendar-year-selector\">\n    <a href=\"#\" class=\"link icon-only calendar-prev-year-button\">\n      <i class=\"icon icon-prev " + iconColor + "\"></i>\n    </a>\n    <span class=\"current-year-value\"></span>\n    <a href=\"#\" class=\"link icon-only calendar-next-year-button\">\n      <i class=\"icon icon-next " + iconColor + "\"></i>\n    </a>\n    </div>\n  ").trim();
    };

    Calendar.prototype.renderHeader = function renderHeader () {
      var calendar = this;
      if (calendar.params.renderHeader) {
        return calendar.params.renderHeader.call(calendar);
      }
      return ("\n    <div class=\"calendar-header\">\n    <div class=\"calendar-selected-date\">" + (calendar.params.headerPlaceholder) + "</div>\n    </div>\n  ").trim();
    };

    Calendar.prototype.renderFooter = function renderFooter () {
      var calendar = this;
      var app = calendar.app;
      if (calendar.params.renderFooter) {
        return calendar.params.renderFooter.call(calendar);
      }
      return ("\n    <div class=\"calendar-footer\">\n    <a href=\"#\" class=\"" + (app.theme === 'md' ? 'button' : 'link') + " calendar-close sheet-close popover-close\">" + (calendar.params.toolbarCloseText) + "</a>\n    </div>\n  ").trim();
    };

    Calendar.prototype.renderToolbar = function renderToolbar () {
      var calendar = this;
      if (calendar.params.renderToolbar) {
        return calendar.params.renderToolbar.call(calendar, calendar);
      }
      return ("\n    <div class=\"toolbar no-shadow\">\n    <div class=\"toolbar-inner\">\n      " + (calendar.renderMonthSelector()) + "\n      " + (calendar.renderYearSelector()) + "\n    </div>\n    </div>\n  ").trim();
    };
    // eslint-disable-next-line
    Calendar.prototype.renderInline = function renderInline () {
      var calendar = this;
      var ref = calendar.params;
      var cssClass = ref.cssClass;
      var toolbar = ref.toolbar;
      var header = ref.header;
      var footer = ref.footer;
      var rangePicker = ref.rangePicker;
      var weekHeader = ref.weekHeader;
      var value = calendar.value;
      var date = value && value.length ? value[0] : new calendar.DateHandleClass().setHours(0, 0, 0);
      var inlineHtml = ("\n    <div class=\"calendar calendar-inline " + (rangePicker ? 'calendar-range' : '') + " " + (cssClass || '') + "\">\n    " + (header ? calendar.renderHeader() : '') + "\n    " + (toolbar ? calendar.renderToolbar() : '') + "\n    " + (weekHeader ? calendar.renderWeekHeader() : '') + "\n    <div class=\"calendar-months\">\n      " + (calendar.renderMonths(date)) + "\n    </div>\n    " + (footer ? calendar.renderFooter() : '') + "\n    </div>\n  ").trim();

      return inlineHtml;
    };

    Calendar.prototype.renderCustomModal = function renderCustomModal () {
      var calendar = this;
      var ref = calendar.params;
      var cssClass = ref.cssClass;
      var toolbar = ref.toolbar;
      var header = ref.header;
      var footer = ref.footer;
      var rangePicker = ref.rangePicker;
      var weekHeader = ref.weekHeader;
      var value = calendar.value;
      var date = value && value.length ? value[0] : new calendar.DateHandleClass().setHours(0, 0, 0);
      var sheetHtml = ("\n    <div class=\"calendar calendar-modal " + (rangePicker ? 'calendar-range' : '') + " " + (cssClass || '') + "\">\n    " + (header ? calendar.renderHeader() : '') + "\n    " + (toolbar ? calendar.renderToolbar() : '') + "\n    " + (weekHeader ? calendar.renderWeekHeader() : '') + "\n    <div class=\"calendar-months\">\n      " + (calendar.renderMonths(date)) + "\n    </div>\n    " + (footer ? calendar.renderFooter() : '') + "\n    </div>\n  ").trim();

      return sheetHtml;
    };

    Calendar.prototype.renderSheet = function renderSheet () {
      var calendar = this;
      var ref = calendar.params;
      var cssClass = ref.cssClass;
      var toolbar = ref.toolbar;
      var header = ref.header;
      var footer = ref.footer;
      var rangePicker = ref.rangePicker;
      var weekHeader = ref.weekHeader;
      var value = calendar.value;
      var date = value && value.length ? value[0] : new calendar.DateHandleClass().setHours(0, 0, 0);
      var sheetHtml = ("\n    <div class=\"sheet-modal calendar calendar-sheet " + (rangePicker ? 'calendar-range' : '') + " " + (cssClass || '') + "\">\n    " + (header ? calendar.renderHeader() : '') + "\n    " + (toolbar ? calendar.renderToolbar() : '') + "\n    " + (weekHeader ? calendar.renderWeekHeader() : '') + "\n    <div class=\"sheet-modal-inner calendar-months\">\n      " + (calendar.renderMonths(date)) + "\n    </div>\n    " + (footer ? calendar.renderFooter() : '') + "\n    </div>\n  ").trim();

      return sheetHtml;
    };

    Calendar.prototype.renderPopover = function renderPopover () {
      var calendar = this;
      var ref = calendar.params;
      var cssClass = ref.cssClass;
      var toolbar = ref.toolbar;
      var header = ref.header;
      var footer = ref.footer;
      var rangePicker = ref.rangePicker;
      var weekHeader = ref.weekHeader;
      var value = calendar.value;
      var date = value && value.length ? value[0] : new calendar.DateHandleClass().setHours(0, 0, 0);
      var popoverHtml = ("\n    <div class=\"popover calendar-popover\">\n    <div class=\"popover-inner\">\n      <div class=\"calendar " + (rangePicker ? 'calendar-range' : '') + " " + (cssClass || '') + "\">\n      " + (header ? calendar.renderHeader() : '') + "\n      " + (toolbar ? calendar.renderToolbar() : '') + "\n      " + (weekHeader ? calendar.renderWeekHeader() : '') + "\n      <div class=\"calendar-months\">\n        " + (calendar.renderMonths(date)) + "\n      </div>\n      " + (footer ? calendar.renderFooter() : '') + "\n      </div>\n    </div>\n    </div>\n  ").trim();

      return popoverHtml;
    };

    Calendar.prototype.render = function render () {
      var calendar = this;
      var params = calendar.params;
      if (params.render) { return params.render.call(calendar); }
      if (!calendar.inline) {
        var modalType = params.openIn;
        if (modalType === 'auto') { modalType = calendar.isPopover() ? 'popover' : 'sheet'; }

        if (modalType === 'popover') { return calendar.renderPopover(); }
        if (modalType === 'sheet') { return calendar.renderSheet(); }
        return calendar.renderCustomModal();
      }
      return calendar.renderInline();
    };

    Calendar.prototype.onOpen = function onOpen () {
      var calendar = this;
      var initialized = calendar.initialized;
      var $el = calendar.$el;
      var app = calendar.app;
      var $inputEl = calendar.$inputEl;
      var inline = calendar.inline;
      var value = calendar.value;
      var params = calendar.params;
      calendar.closing = false;
      calendar.opened = true;
      calendar.opening = true;

      // Init main events
      calendar.attachCalendarEvents();

      var updateValue = !value && params.value;

      // Set value
      if (!initialized) {
        if (value) { calendar.setValue(value, 0); }
        else if (params.value) {
          calendar.setValue(calendar.normalizeValues(params.value), 0);
        }
      } else if (value) {
        calendar.setValue(value, 0);
      }

      // Update current month and year
      calendar.updateCurrentMonthYear();

      // Set initial translate
      calendar.monthsTranslate = 0;
      calendar.setMonthsTranslate();

      // Update input value
      if (updateValue) { calendar.updateValue(); }
      else if (params.header && value) {
        calendar.updateValue(true);
      }

      // Extra focus
      if (!inline && $inputEl.length && app.theme === 'md') {
        $inputEl.trigger('focus');
      }

      calendar.initialized = true;

      calendar.$months.each(function (index, monthEl) {
        calendar.emit('local::monthAdd calendarMonthAdd', monthEl);
      });

      // Trigger events
      if ($el) {
        $el.trigger('calendar:open', calendar);
      }
      if ($inputEl) {
        $inputEl.trigger('calendar:open', calendar);
      }
      calendar.emit('local::open calendarOpen', calendar);
    };

    Calendar.prototype.onOpened = function onOpened () {
      var calendar = this;
      calendar.opening = false;
      if (calendar.$el) {
        calendar.$el.trigger('calendar:opened', calendar);
      }
      if (calendar.$inputEl) {
        calendar.$inputEl.trigger('calendar:opened', calendar);
      }
      calendar.emit('local::opened calendarOpened', calendar);
    };

    Calendar.prototype.onClose = function onClose () {
      var calendar = this;
      var app = calendar.app;
      calendar.opening = false;
      calendar.closing = true;

      if (calendar.$inputEl && app.theme === 'md') {
        calendar.$inputEl.trigger('blur');
      }
      if (calendar.detachCalendarEvents) {
        calendar.detachCalendarEvents();
      }

      if (calendar.$el) {
        calendar.$el.trigger('calendar:close', calendar);
      }
      if (calendar.$inputEl) {
        calendar.$inputEl.trigger('calendar:close', calendar);
      }
      calendar.emit('local::close calendarClose', calendar);
    };

    Calendar.prototype.onClosed = function onClosed () {
      var calendar = this;
      calendar.opened = false;
      calendar.closing = false;

      if (!calendar.inline) {
        Utils.nextTick(function () {
          if (calendar.modal && calendar.modal.el && calendar.modal.destroy) {
            if (!calendar.params.routableModals) {
              calendar.modal.destroy();
            }
          }
          delete calendar.modal;
        });
      }
      if (calendar.$el) {
        calendar.$el.trigger('calendar:closed', calendar);
      }
      if (calendar.$inputEl) {
        calendar.$inputEl.trigger('calendar:closed', calendar);
      }
      calendar.emit('local::closed calendarClosed', calendar);
    };

    Calendar.prototype.open = function open () {
      var obj;

      var calendar = this;
      var app = calendar.app;
      var opened = calendar.opened;
      var inline = calendar.inline;
      var $inputEl = calendar.$inputEl;
      var params = calendar.params;
      if (opened) { return; }

      if (inline) {
        calendar.$el = $$1(calendar.render());
        calendar.$el[0].f7Calendar = calendar;
        calendar.$wrapperEl = calendar.$el.find('.calendar-months-wrapper');
        calendar.$months = calendar.$wrapperEl.find('.calendar-month');
        calendar.$containerEl.append(calendar.$el);
        calendar.onOpen();
        calendar.onOpened();
        return;
      }
      var modalType = params.openIn;
      if (modalType === 'auto') {
        modalType = calendar.isPopover() ? 'popover' : 'sheet';
      }
      var modalContent = calendar.render();

      var modalParams = {
        targetEl: $inputEl,
        scrollToEl: calendar.params.scrollToInput ? $inputEl : undefined,
        content: modalContent,
        backdrop: modalType === 'popover' && app.params.popover.backdrop !== false,
        on: {
          open: function open() {
            var modal = this;
            calendar.modal = modal;
            calendar.$el = modalType === 'popover' ? modal.$el.find('.calendar') : modal.$el;
            calendar.$wrapperEl = calendar.$el.find('.calendar-months-wrapper');
            calendar.$months = calendar.$wrapperEl.find('.calendar-month');
            calendar.$el[0].f7Calendar = calendar;
            if (modalType === 'customModal') {
              $$1(calendar.$el).find('.calendar-close').once('click', function () {
                calendar.close();
              });
            }
            calendar.onOpen();
          },
          opened: function opened() { calendar.onOpened(); },
          close: function close() { calendar.onClose(); },
          closed: function closed() { calendar.onClosed(); },
        },
      };
      if (calendar.params.routableModals) {
        calendar.view.router.navigate({
          url: calendar.url,
          route: ( obj = {
            path: calendar.url
          }, obj[modalType] = modalParams, obj ),
        });
      } else {
        calendar.modal = app[modalType].create(modalParams);
        calendar.modal.open();
      }
    };

    Calendar.prototype.close = function close () {
      var calendar = this;
      var opened = calendar.opened;
      var inline = calendar.inline;
      if (!opened) { return; }
      if (inline) {
        calendar.onClose();
        calendar.onClosed();
        return;
      }
      if (calendar.params.routableModals) {
        calendar.view.router.back();
      } else {
        calendar.modal.close();
      }
    };

    Calendar.prototype.init = function init () {
      var calendar = this;

      calendar.initInput();

      if (calendar.inline) {
        calendar.open();
        calendar.emit('local::init calendarInit', calendar);
        return;
      }

      if (!calendar.initialized && calendar.params.value) {
        calendar.setValue(calendar.normalizeValues(calendar.params.value));
      }

      // Attach input Events
      if (calendar.$inputEl) {
        calendar.attachInputEvents();
      }
      if (calendar.params.closeByOutsideClick) {
        calendar.attachHtmlEvents();
      }
      calendar.emit('local::init calendarInit', calendar);
    };

    Calendar.prototype.destroy = function destroy () {
      var calendar = this;
      if (calendar.destroyed) { return; }
      var $el = calendar.$el;
      calendar.emit('local::beforeDestroy calendarBeforeDestroy', calendar);
      if ($el) { $el.trigger('calendar:beforedestroy', calendar); }

      calendar.close();

      // Detach Events
      if (calendar.$inputEl) {
        calendar.detachInputEvents();
      }
      if (calendar.params.closeByOutsideClick) {
        calendar.detachHtmlEvents();
      }

      if ($el && $el.length) { delete calendar.$el[0].f7Calendar; }
      Utils.deleteProps(calendar);
      calendar.destroyed = true;
    };

    return Calendar;
  }(Framework7Class));

  var Calendar$1 = {
    name: 'calendar',
    static: {
      Calendar: Calendar,
    },
    create: function create() {
      var app = this;
      app.calendar = ConstructorMethods({
        defaultSelector: '.calendar',
        constructor: Calendar,
        app: app,
        domProp: 'f7Calendar',
      });
      app.calendar.close = function close(el) {
        if ( el === void 0 ) el = '.calendar';

        var $el = $$1(el);
        if ($el.length === 0) { return; }
        var calendar = $el[0].f7Calendar;
        if (!calendar || (calendar && !calendar.opened)) { return; }
        calendar.close();
      };
    },
    params: {
      calendar: {
        // Calendar settings
        calendarType: 'gregorian', // or 'jalali'
        monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        firstDay: 1, // First day of the week, Monday
        weekendDays: [0, 6], // Sunday and Saturday
        jalali: {
          monthNames: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
          monthNamesShort: ['فَر', 'اُر', 'خُر', 'تیر', 'مُر', 'شَه', 'مهر', 'آب', 'آذر', 'دی', 'بَه', 'اِس'],
          dayNames: ['یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'],
          dayNamesShort: ['1ش', '۲ش', '۳ش', '۴ش', '۵ش', 'ج', 'ش'],
          firstDay: 6, // Saturday
          weekendDays: [5], // Friday
        },
        multiple: false,
        rangePicker: false,
        rangePickerMinDays: 1, // when calendar is used as rangePicker
        rangePickerMaxDays: 0, // when calendar is used as rangePicker, 0 means unlimited
        dateFormat: 'yyyy-mm-dd',
        direction: 'horizontal', // or 'vertical'
        minDate: null,
        maxDate: null,
        disabled: null, // dates range of disabled days
        events: null, // dates range of days with events
        rangesClasses: null, // array with custom classes date ranges
        touchMove: true,
        animate: true,
        closeOnSelect: false,
        monthSelector: true,
        yearSelector: true,
        weekHeader: true,
        value: null,
        // Common opener settings
        containerEl: null,
        openIn: 'auto', // or 'popover' or 'sheet' or 'customModal'
        formatValue: null,
        inputEl: null,
        inputReadOnly: true,
        closeByOutsideClick: true,
        scrollToInput: true,
        header: false,
        headerPlaceholder: 'Select date',
        footer: false,
        toolbar: true,
        toolbarCloseText: 'Done',
        cssClass: null,
        routableModals: true,
        view: null,
        url: 'date/',
        // Render functions
        renderWeekHeader: null,
        renderMonths: null,
        renderMonth: null,
        renderMonthSelector: null,
        renderYearSelector: null,
        renderHeader: null,
        renderFooter: null,
        renderToolbar: null,
        renderInline: null,
        renderPopover: null,
        renderSheet: null,
        render: null,
      },
    },
  };

  function pickerColumn (colEl, updateItems) {
    var picker = this;
    var app = picker.app;
    var $colEl = $$1(colEl);
    var colIndex = $colEl.index();
    var col = picker.cols[colIndex];
    if (col.divider) { return; }

    col.$el = $colEl;
    col.el = $colEl[0];
    col.$itemsEl = col.$el.find('.picker-items');
    col.items = col.$itemsEl.find('.picker-item');

    var itemHeight;
    var itemsHeight;
    var minTranslate;
    var maxTranslate;
    var animationFrameId;

    function updateDuringScroll() {
      animationFrameId = Utils.requestAnimationFrame(function () {
        col.updateItems(undefined, undefined, 0);
        updateDuringScroll();
      });
    }

    col.replaceValues = function replaceColValues(values, displayValues) {
      col.detachEvents();
      col.values = values;
      col.displayValues = displayValues;
      col.$itemsEl.html(picker.renderColumn(col, true));
      col.items = col.$itemsEl.find('.picker-item');
      col.calcSize();
      col.setValue(col.values[0], 0, true);
      col.attachEvents();
    };
    col.calcSize = function calcColSize() {
      if (picker.params.rotateEffect) {
        col.$el.removeClass('picker-column-absolute');
        if (!col.width) { col.$el.css({ width: '' }); }
      }
      var colWidth = 0;
      var colHeight = col.$el[0].offsetHeight;
      itemHeight = col.items[0].offsetHeight;
      itemsHeight = itemHeight * col.items.length;
      minTranslate = ((colHeight / 2) - itemsHeight) + (itemHeight / 2);
      maxTranslate = (colHeight / 2) - (itemHeight / 2);
      if (col.width) {
        colWidth = col.width;
        if (parseInt(colWidth, 10) === colWidth) { colWidth += 'px'; }
        col.$el.css({ width: colWidth });
      }
      if (picker.params.rotateEffect) {
        if (!col.width) {
          col.items.each(function (index, itemEl) {
            var item = $$1(itemEl).children('span');
            colWidth = Math.max(colWidth, item[0].offsetWidth);
          });
          col.$el.css({ width: ((colWidth + 2) + "px") });
        }
        col.$el.addClass('picker-column-absolute');
      }
    };

    col.setValue = function setColValue(newValue, transition, valueCallbacks) {
      if ( transition === void 0 ) transition = '';

      var newActiveIndex = col.$itemsEl.find((".picker-item[data-picker-value=\"" + newValue + "\"]")).index();
      if (typeof newActiveIndex === 'undefined' || newActiveIndex === -1) {
        return;
      }
      var newTranslate = (-newActiveIndex * itemHeight) + maxTranslate;
      // Update wrapper
      col.$itemsEl.transition(transition);
      col.$itemsEl.transform(("translate3d(0," + newTranslate + "px,0)"));

      // Watch items
      if (picker.params.updateValuesOnMomentum && col.activeIndex && col.activeIndex !== newActiveIndex) {
        Utils.cancelAnimationFrame(animationFrameId);
        col.$itemsEl.transitionEnd(function () {
          Utils.cancelAnimationFrame(animationFrameId);
        });
        updateDuringScroll();
      }

      // Update items
      col.updateItems(newActiveIndex, newTranslate, transition, valueCallbacks);
    };

    col.updateItems = function updateColItems(activeIndex, translate, transition, valueCallbacks) {
      if (typeof translate === 'undefined') {
        // eslint-disable-next-line
        translate = Utils.getTranslate(col.$itemsEl[0], 'y');
      }
      // eslint-disable-next-line
      if (typeof activeIndex === 'undefined') { activeIndex = -Math.round((translate - maxTranslate) / itemHeight); }
      // eslint-disable-next-line
      if (activeIndex < 0) { activeIndex = 0; }
      // eslint-disable-next-line
      if (activeIndex >= col.items.length) { activeIndex = col.items.length - 1; }
      var previousActiveIndex = col.activeIndex;
      col.activeIndex = activeIndex;
      col.$itemsEl.find('.picker-item-selected').removeClass('picker-item-selected');

      col.items.transition(transition);

      var selectedItem = col.items.eq(activeIndex).addClass('picker-item-selected').transform('');

      // Set 3D rotate effect
      if (picker.params.rotateEffect) {
        col.items.each(function (index, itemEl) {
          var $itemEl = $$1(itemEl);
          var itemOffsetTop = $itemEl.index() * itemHeight;
          var translateOffset = maxTranslate - translate;
          var itemOffset = itemOffsetTop - translateOffset;
          var percentage = itemOffset / itemHeight;
          var itemsFit = Math.ceil(col.height / itemHeight / 2) + 1;

          var angle = (-18 * percentage);
          if (angle > 180) { angle = 180; }
          if (angle < -180) { angle = -180; }
          if (Math.abs(percentage) > itemsFit) {
            $itemEl.addClass('picker-item-far');
          } else {
            $itemEl.removeClass('picker-item-far');
          }
          $itemEl.transform(("translate3d(0, " + (-translate + maxTranslate) + "px, " + (picker.needsOriginFix ? -110 : 0) + "px) rotateX(" + angle + "deg)"));
        });
      }

      if (valueCallbacks || typeof valueCallbacks === 'undefined') {
        // Update values
        col.value = selectedItem.attr('data-picker-value');
        col.displayValue = col.displayValues ? col.displayValues[activeIndex] : col.value;
        // On change callback
        if (previousActiveIndex !== activeIndex) {
          if (col.onChange) {
            col.onChange(picker, col.value, col.displayValue);
          }
          picker.updateValue();
        }
      }
    };

    var allowItemClick = true;
    var isTouched;
    var isMoved;
    var touchStartY;
    var touchCurrentY;
    var touchStartTime;
    var touchEndTime;
    var startTranslate;
    var returnTo;
    var currentTranslate;
    var prevTranslate;
    var velocityTranslate;
    function handleTouchStart(e) {
      if (isMoved || isTouched) { return; }
      e.preventDefault();
      isTouched = true;
      touchStartY = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
      touchCurrentY = touchStartY;
      touchStartTime = (new Date()).getTime();

      allowItemClick = true;
      startTranslate = Utils.getTranslate(col.$itemsEl[0], 'y');
      currentTranslate = startTranslate;
    }
    function handleTouchMove(e) {
      if (!isTouched) { return; }
      e.preventDefault();
      allowItemClick = false;
      touchCurrentY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
      if (!isMoved) {
        // First move
        Utils.cancelAnimationFrame(animationFrameId);
        isMoved = true;
        startTranslate = Utils.getTranslate(col.$itemsEl[0], 'y');
        currentTranslate = startTranslate;
        col.$itemsEl.transition(0);
      }

      var diff = touchCurrentY - touchStartY;
      currentTranslate = startTranslate + diff;
      returnTo = undefined;

      // Normalize translate
      if (currentTranslate < minTranslate) {
        currentTranslate = minTranslate - (Math.pow( (minTranslate - currentTranslate), 0.8 ));
        returnTo = 'min';
      }
      if (currentTranslate > maxTranslate) {
        currentTranslate = maxTranslate + (Math.pow( (currentTranslate - maxTranslate), 0.8 ));
        returnTo = 'max';
      }
      // Transform wrapper
      col.$itemsEl.transform(("translate3d(0," + currentTranslate + "px,0)"));

      // Update items
      col.updateItems(undefined, currentTranslate, 0, picker.params.updateValuesOnTouchmove);

      // Calc velocity
      velocityTranslate = currentTranslate - prevTranslate || currentTranslate;
      prevTranslate = currentTranslate;
    }
    function handleTouchEnd() {
      if (!isTouched || !isMoved) {
        isTouched = false;
        isMoved = false;
        return;
      }
      isTouched = false;
      isMoved = false;
      col.$itemsEl.transition('');
      if (returnTo) {
        if (returnTo === 'min') {
          col.$itemsEl.transform(("translate3d(0," + minTranslate + "px,0)"));
        } else { col.$itemsEl.transform(("translate3d(0," + maxTranslate + "px,0)")); }
      }
      touchEndTime = new Date().getTime();
      var newTranslate;
      if (touchEndTime - touchStartTime > 300) {
        newTranslate = currentTranslate;
      } else {
        newTranslate = currentTranslate + (velocityTranslate * picker.params.momentumRatio);
      }

      newTranslate = Math.max(Math.min(newTranslate, maxTranslate), minTranslate);

      // Active Index
      var activeIndex = -Math.floor((newTranslate - maxTranslate) / itemHeight);

      // Normalize translate
      if (!picker.params.freeMode) { newTranslate = (-activeIndex * itemHeight) + maxTranslate; }

      // Transform wrapper
      col.$itemsEl.transform(("translate3d(0," + (parseInt(newTranslate, 10)) + "px,0)"));

      // Update items
      col.updateItems(activeIndex, newTranslate, '', true);

      // Watch items
      if (picker.params.updateValuesOnMomentum) {
        updateDuringScroll();
        col.$itemsEl.transitionEnd(function () {
          Utils.cancelAnimationFrame(animationFrameId);
        });
      }

      // Allow click
      setTimeout(function () {
        allowItemClick = true;
      }, 100);
    }

    function handleClick() {
      if (!allowItemClick) { return; }
      Utils.cancelAnimationFrame(animationFrameId);
      var value = $$1(this).attr('data-picker-value');
      col.setValue(value);
    }

    var activeListener = app.support.passiveListener ? { passive: false, capture: false } : false;
    col.attachEvents = function attachColEvents() {
      col.$el.on(app.touchEvents.start, handleTouchStart, activeListener);
      app.on('touchmove:active', handleTouchMove);
      app.on('touchend:passive', handleTouchEnd);
      col.items.on('click', handleClick);
    };
    col.detachEvents = function detachColEvents() {
      col.$el.off(app.touchEvents.start, handleTouchStart, activeListener);
      app.off('touchmove:active', handleTouchMove);
      app.off('touchend:passive', handleTouchEnd);
      col.items.off('click', handleClick);
    };

    col.init = function initCol() {
      col.calcSize();
      col.$itemsEl.transform(("translate3d(0," + maxTranslate + "px,0)")).transition(0);
      if (colIndex === 0) { col.$el.addClass('picker-column-first'); }
      if (colIndex === picker.cols.length - 1) { col.$el.addClass('picker-column-last'); }
      // Update items on init
      if (updateItems) { col.updateItems(0, maxTranslate, 0); }

      col.attachEvents();
    };

    col.destroy = function destroyCol() {
      col.detachEvents();
    };

    col.init();
  }

  var Picker = (function (Framework7Class$$1) {
    function Picker(app, params) {
      if ( params === void 0 ) params = {};

      Framework7Class$$1.call(this, params, [app]);
      var picker = this;
      picker.params = Utils.extend({}, app.params.picker, params);

      var $containerEl;
      if (picker.params.containerEl) {
        $containerEl = $$1(picker.params.containerEl);
        if ($containerEl.length === 0) { return picker; }
      }

      var $inputEl;
      if (picker.params.inputEl) {
        $inputEl = $$1(picker.params.inputEl);
      }

      var view;
      if ($inputEl) {
        view = $inputEl.parents('.view').length && $inputEl.parents('.view')[0].f7View;
      }
      if (!view) { view = app.views.main; }

      Utils.extend(picker, {
        app: app,
        $containerEl: $containerEl,
        containerEl: $containerEl && $containerEl[0],
        inline: $containerEl && $containerEl.length > 0,
        needsOriginFix: app.device.ios || ((win.navigator.userAgent.toLowerCase().indexOf('safari') >= 0 && win.navigator.userAgent.toLowerCase().indexOf('chrome') < 0) && !app.device.android),
        cols: [],
        $inputEl: $inputEl,
        inputEl: $inputEl && $inputEl[0],
        initialized: false,
        opened: false,
        url: picker.params.url,
        view: view,
      });

      function onResize() {
        picker.resizeCols();
      }
      function onInputClick() {
        picker.open();
      }
      function onInputFocus(e) {
        e.preventDefault();
      }
      function onHtmlClick(e) {
        var $targetEl = $$1(e.target);
        if (picker.isPopover()) { return; }
        if (!picker.opened) { return; }
        if ($targetEl.closest('[class*="backdrop"]').length) { return; }
        if ($inputEl && $inputEl.length > 0) {
          if ($targetEl[0] !== $inputEl[0] && $targetEl.closest('.sheet-modal').length === 0) {
            picker.close();
          }
        } else if ($$1(e.target).closest('.sheet-modal').length === 0) {
          picker.close();
        }
      }

      // Events
      Utils.extend(picker, {
        attachResizeEvent: function attachResizeEvent() {
          app.on('resize', onResize);
        },
        detachResizeEvent: function detachResizeEvent() {
          app.off('resize', onResize);
        },
        attachInputEvents: function attachInputEvents() {
          picker.$inputEl.on('click', onInputClick);
          if (picker.params.inputReadOnly) {
            picker.$inputEl.on('focus mousedown', onInputFocus);
          }
        },
        detachInputEvents: function detachInputEvents() {
          picker.$inputEl.off('click', onInputClick);
          if (picker.params.inputReadOnly) {
            picker.$inputEl.off('focus mousedown', onInputFocus);
          }
        },
        attachHtmlEvents: function attachHtmlEvents() {
          app.on('click', onHtmlClick);
        },
        detachHtmlEvents: function detachHtmlEvents() {
          app.off('click', onHtmlClick);
        },
      });

      picker.init();

      return picker;
    }

    if ( Framework7Class$$1 ) Picker.__proto__ = Framework7Class$$1;
    Picker.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    Picker.prototype.constructor = Picker;

    Picker.prototype.initInput = function initInput () {
      var picker = this;
      if (!picker.$inputEl) { return; }
      if (picker.params.inputReadOnly) { picker.$inputEl.prop('readOnly', true); }
    };

    Picker.prototype.resizeCols = function resizeCols () {
      var picker = this;
      if (!picker.opened) { return; }
      for (var i = 0; i < picker.cols.length; i += 1) {
        if (!picker.cols[i].divider) {
          picker.cols[i].calcSize();
          picker.cols[i].setValue(picker.cols[i].value, 0, false);
        }
      }
    };

    Picker.prototype.isPopover = function isPopover () {
      var picker = this;
      var app = picker.app;
      var modal = picker.modal;
      var params = picker.params;
      if (params.openIn === 'sheet') { return false; }
      if (modal && modal.type !== 'popover') { return false; }

      if (!picker.inline && picker.inputEl) {
        if (params.openIn === 'popover') { return true; }
        if (app.device.ios) {
          return !!app.device.ipad;
        } if (app.width >= 768) {
          return true;
        }
      }
      return false;
    };

    Picker.prototype.formatValue = function formatValue () {
      var picker = this;
      var value = picker.value;
      var displayValue = picker.displayValue;
      if (picker.params.formatValue) {
        return picker.params.formatValue.call(picker, value, displayValue);
      }
      return value.join(' ');
    };

    Picker.prototype.setValue = function setValue (values, transition) {
      var picker = this;
      var valueIndex = 0;
      if (picker.cols.length === 0) {
        picker.value = values;
        picker.updateValue(values);
        return;
      }
      for (var i = 0; i < picker.cols.length; i += 1) {
        if (picker.cols[i] && !picker.cols[i].divider) {
          picker.cols[i].setValue(values[valueIndex], transition);
          valueIndex += 1;
        }
      }
    };

    Picker.prototype.getValue = function getValue () {
      var picker = this;
      return picker.value;
    };

    Picker.prototype.updateValue = function updateValue (forceValues) {
      var picker = this;
      var newValue = forceValues || [];
      var newDisplayValue = [];
      var column;
      if (picker.cols.length === 0) {
        var noDividerColumns = picker.params.cols.filter(function (c) { return !c.divider; });
        for (var i = 0; i < noDividerColumns.length; i += 1) {
          column = noDividerColumns[i];
          if (column.displayValues !== undefined && column.values !== undefined && column.values.indexOf(newValue[i]) !== -1) {
            newDisplayValue.push(column.displayValues[column.values.indexOf(newValue[i])]);
          } else {
            newDisplayValue.push(newValue[i]);
          }
        }
      } else {
        for (var i$1 = 0; i$1 < picker.cols.length; i$1 += 1) {
          if (!picker.cols[i$1].divider) {
            newValue.push(picker.cols[i$1].value);
            newDisplayValue.push(picker.cols[i$1].displayValue);
          }
        }
      }

      if (newValue.indexOf(undefined) >= 0) {
        return;
      }
      picker.value = newValue;
      picker.displayValue = newDisplayValue;
      picker.emit('local::change pickerChange', picker, picker.value, picker.displayValue);
      if (picker.inputEl) {
        picker.$inputEl.val(picker.formatValue());
        picker.$inputEl.trigger('change');
      }
    };

    Picker.prototype.initColumn = function initColumn (colEl, updateItems) {
      var picker = this;
      pickerColumn.call(picker, colEl, updateItems);
    };
    // eslint-disable-next-line
    Picker.prototype.destroyColumn = function destroyColumn (colEl) {
      var picker = this;
      var $colEl = $$1(colEl);
      var index = $colEl.index();
      if (picker.cols[index] && picker.cols[index].destroy) {
        picker.cols[index].destroy();
      }
    };

    Picker.prototype.renderToolbar = function renderToolbar () {
      var picker = this;
      if (picker.params.renderToolbar) { return picker.params.renderToolbar.call(picker, picker); }
      return ("\n      <div class=\"toolbar no-shadow\">\n        <div class=\"toolbar-inner\">\n          <div class=\"left\"></div>\n          <div class=\"right\">\n            <a href=\"#\" class=\"link sheet-close popover-close\">" + (picker.params.toolbarCloseText) + "</a>\n          </div>\n        </div>\n      </div>\n    ").trim();
    };
    // eslint-disable-next-line
    Picker.prototype.renderColumn = function renderColumn (col, onlyItems) {
      var colClasses = "picker-column " + (col.textAlign ? ("picker-column-" + (col.textAlign)) : '') + " " + (col.cssClass || '');
      var columnHtml;
      var columnItemsHtml;

      if (col.divider) {
        columnHtml = "\n        <div class=\"" + colClasses + " picker-column-divider\">" + (col.content) + "</div>\n      ";
      } else {
        columnItemsHtml = col.values.map(function (value, index) { return ("\n        <div class=\"picker-item\" data-picker-value=\"" + value + "\">\n          <span>" + (col.displayValues ? col.displayValues[index] : value) + "</span>\n        </div>\n      "); }).join('');
        columnHtml = "\n        <div class=\"" + colClasses + "\">\n          <div class=\"picker-items\">" + columnItemsHtml + "</div>\n        </div>\n      ";
      }

      return onlyItems ? columnItemsHtml.trim() : columnHtml.trim();
    };

    Picker.prototype.renderInline = function renderInline () {
      var picker = this;
      var ref = picker.params;
      var rotateEffect = ref.rotateEffect;
      var cssClass = ref.cssClass;
      var toolbar = ref.toolbar;
      var inlineHtml = ("\n      <div class=\"picker picker-inline " + (rotateEffect ? 'picker-3d' : '') + " " + (cssClass || '') + "\">\n        " + (toolbar ? picker.renderToolbar() : '') + "\n        <div class=\"picker-columns\">\n          " + (picker.cols.map(function (col) { return picker.renderColumn(col); }).join('')) + "\n          <div class=\"picker-center-highlight\"></div>\n        </div>\n      </div>\n    ").trim();

      return inlineHtml;
    };

    Picker.prototype.renderSheet = function renderSheet () {
      var picker = this;
      var ref = picker.params;
      var rotateEffect = ref.rotateEffect;
      var cssClass = ref.cssClass;
      var toolbar = ref.toolbar;
      var sheetHtml = ("\n      <div class=\"sheet-modal picker picker-sheet " + (rotateEffect ? 'picker-3d' : '') + " " + (cssClass || '') + "\">\n        " + (toolbar ? picker.renderToolbar() : '') + "\n        <div class=\"sheet-modal-inner picker-columns\">\n          " + (picker.cols.map(function (col) { return picker.renderColumn(col); }).join('')) + "\n          <div class=\"picker-center-highlight\"></div>\n        </div>\n      </div>\n    ").trim();

      return sheetHtml;
    };

    Picker.prototype.renderPopover = function renderPopover () {
      var picker = this;
      var ref = picker.params;
      var rotateEffect = ref.rotateEffect;
      var cssClass = ref.cssClass;
      var toolbar = ref.toolbar;
      var popoverHtml = ("\n      <div class=\"popover picker-popover\">\n        <div class=\"popover-inner\">\n          <div class=\"picker " + (rotateEffect ? 'picker-3d' : '') + " " + (cssClass || '') + "\">\n            " + (toolbar ? picker.renderToolbar() : '') + "\n            <div class=\"picker-columns\">\n              " + (picker.cols.map(function (col) { return picker.renderColumn(col); }).join('')) + "\n              <div class=\"picker-center-highlight\"></div>\n            </div>\n          </div>\n        </div>\n      </div>\n    ").trim();

      return popoverHtml;
    };

    Picker.prototype.render = function render () {
      var picker = this;
      if (picker.params.render) { return picker.params.render.call(picker); }
      if (!picker.inline) {
        if (picker.isPopover()) { return picker.renderPopover(); }
        return picker.renderSheet();
      }
      return picker.renderInline();
    };

    Picker.prototype.onOpen = function onOpen () {
      var picker = this;
      var initialized = picker.initialized;
      var $el = picker.$el;
      var app = picker.app;
      var $inputEl = picker.$inputEl;
      var inline = picker.inline;
      var value = picker.value;
      var params = picker.params;
      picker.opened = true;

      // Init main events
      picker.attachResizeEvent();

      // Init cols
      $el.find('.picker-column').each(function (index, colEl) {
        var updateItems = true;
        if (
          (!initialized && params.value)
          || (initialized && value)
        ) {
          updateItems = false;
        }
        picker.initColumn(colEl, updateItems);
      });

      // Set value
      if (!initialized) {
        if (value) { picker.setValue(value, 0); }
        else if (params.value) {
          picker.setValue(params.value, 0);
        }
      } else if (value) {
        picker.setValue(value, 0);
      }

      // Extra focus
      if (!inline && $inputEl.length && app.theme === 'md') {
        $inputEl.trigger('focus');
      }

      picker.initialized = true;

      // Trigger events
      if ($el) {
        $el.trigger('picker:open', picker);
      }
      if ($inputEl) {
        $inputEl.trigger('picker:open', picker);
      }
      picker.emit('local::open pickerOpen', picker);
    };

    Picker.prototype.onOpened = function onOpened () {
      var picker = this;

      if (picker.$el) {
        picker.$el.trigger('picker:opened', picker);
      }
      if (picker.$inputEl) {
        picker.$inputEl.trigger('picker:opened', picker);
      }
      picker.emit('local::opened pickerOpened', picker);
    };

    Picker.prototype.onClose = function onClose () {
      var picker = this;
      var app = picker.app;

      // Detach events
      picker.detachResizeEvent();

      picker.cols.forEach(function (col) {
        if (col.destroy) { col.destroy(); }
      });
      if (picker.$inputEl && app.theme === 'md') {
        picker.$inputEl.trigger('blur');
      }

      if (picker.$el) {
        picker.$el.trigger('picker:close', picker);
      }
      if (picker.$inputEl) {
        picker.$inputEl.trigger('picker:close', picker);
      }
      picker.emit('local::close pickerClose', picker);
    };

    Picker.prototype.onClosed = function onClosed () {
      var picker = this;
      picker.opened = false;

      if (!picker.inline) {
        Utils.nextTick(function () {
          if (picker.modal && picker.modal.el && picker.modal.destroy) {
            if (!picker.params.routableModals) {
              picker.modal.destroy();
            }
          }
          delete picker.modal;
        });
      }

      if (picker.$el) {
        picker.$el.trigger('picker:closed', picker);
      }
      if (picker.$inputEl) {
        picker.$inputEl.trigger('picker:closed', picker);
      }
      picker.emit('local::closed pickerClosed', picker);
    };

    Picker.prototype.open = function open () {
      var obj;

      var picker = this;
      var app = picker.app;
      var opened = picker.opened;
      var inline = picker.inline;
      var $inputEl = picker.$inputEl;
      if (opened) { return; }
      if (picker.cols.length === 0 && picker.params.cols.length) {
        picker.params.cols.forEach(function (col) {
          picker.cols.push(col);
        });
      }
      if (inline) {
        picker.$el = $$1(picker.render());
        picker.$el[0].f7Picker = picker;
        picker.$containerEl.append(picker.$el);
        picker.onOpen();
        picker.onOpened();
        return;
      }
      var isPopover = picker.isPopover();
      var modalType = isPopover ? 'popover' : 'sheet';
      var modalParams = {
        targetEl: $inputEl,
        scrollToEl: picker.params.scrollToInput ? $inputEl : undefined,
        content: picker.render(),
        backdrop: isPopover,
        on: {
          open: function open() {
            var modal = this;
            picker.modal = modal;
            picker.$el = isPopover ? modal.$el.find('.picker') : modal.$el;
            picker.$el[0].f7Picker = picker;
            picker.onOpen();
          },
          opened: function opened() { picker.onOpened(); },
          close: function close() { picker.onClose(); },
          closed: function closed() { picker.onClosed(); },
        },
      };
      if (picker.params.routableModals) {
        picker.view.router.navigate({
          url: picker.url,
          route: ( obj = {
            path: picker.url
          }, obj[modalType] = modalParams, obj ),
        });
      } else {
        picker.modal = app[modalType].create(modalParams);
        picker.modal.open();
      }
    };

    Picker.prototype.close = function close () {
      var picker = this;
      var opened = picker.opened;
      var inline = picker.inline;
      if (!opened) { return; }
      if (inline) {
        picker.onClose();
        picker.onClosed();
        return;
      }
      if (picker.params.routableModals) {
        picker.view.router.back();
      } else {
        picker.modal.close();
      }
    };

    Picker.prototype.init = function init () {
      var picker = this;

      picker.initInput();

      if (picker.inline) {
        picker.open();
        picker.emit('local::init pickerInit', picker);
        return;
      }

      if (!picker.initialized && picker.params.value) {
        picker.setValue(picker.params.value);
      }

      // Attach input Events
      if (picker.$inputEl) {
        picker.attachInputEvents();
      }
      if (picker.params.closeByOutsideClick) {
        picker.attachHtmlEvents();
      }
      picker.emit('local::init pickerInit', picker);
    };

    Picker.prototype.destroy = function destroy () {
      var picker = this;
      if (picker.destroyed) { return; }
      var $el = picker.$el;
      picker.emit('local::beforeDestroy pickerBeforeDestroy', picker);
      if ($el) { $el.trigger('picker:beforedestroy', picker); }

      picker.close();

      // Detach Events
      if (picker.$inputEl) {
        picker.detachInputEvents();
      }
      if (picker.params.closeByOutsideClick) {
        picker.detachHtmlEvents();
      }

      if ($el && $el.length) { delete picker.$el[0].f7Picker; }
      Utils.deleteProps(picker);
      picker.destroyed = true;
    };

    return Picker;
  }(Framework7Class));

  var Picker$1 = {
    name: 'picker',
    static: {
      Picker: Picker,
    },
    create: function create() {
      var app = this;
      app.picker = ConstructorMethods({
        defaultSelector: '.picker',
        constructor: Picker,
        app: app,
        domProp: 'f7Picker',
      });
      app.picker.close = function close(el) {
        if ( el === void 0 ) el = '.picker';

        var $el = $$1(el);
        if ($el.length === 0) { return; }
        var picker = $el[0].f7Picker;
        if (!picker || (picker && !picker.opened)) { return; }
        picker.close();
      };
    },
    params: {
      picker: {
        // Picker settings
        updateValuesOnMomentum: false,
        updateValuesOnTouchmove: true,
        rotateEffect: false,
        momentumRatio: 7,
        freeMode: false,
        cols: [],
        // Common opener settings
        containerEl: null,
        openIn: 'auto', // or 'popover' or 'sheet'
        formatValue: null,
        inputEl: null,
        inputReadOnly: true,
        closeByOutsideClick: true,
        scrollToInput: true,
        toolbar: true,
        toolbarCloseText: 'Done',
        cssClass: null,
        routableModals: true,
        view: null,
        url: 'select/',
        // Render functions
        renderToolbar: null,
        render: null,
      },
    },
  };

  var InfiniteScroll = {
    handleScroll: function handleScroll(el, e) {
      var app = this;
      var $el = $$1(el);
      var scrollTop = $el[0].scrollTop;
      var scrollHeight = $el[0].scrollHeight;
      var height = $el[0].offsetHeight;
      var distance = $el[0].getAttribute('data-infinite-distance');

      var virtualListContainer = $el.find('.virtual-list');
      var virtualList;

      var onTop = $el.hasClass('infinite-scroll-top');
      if (!distance) { distance = 50; }
      if (typeof distance === 'string' && distance.indexOf('%') >= 0) {
        distance = (parseInt(distance, 10) / 100) * height;
      }
      if (distance > height) { distance = height; }
      if (onTop) {
        if (scrollTop < distance) {
          $el.trigger('infinite', e);
          app.emit('infinite', $el[0], e);
        }
      } else if (scrollTop + height >= scrollHeight - distance) {
        if (virtualListContainer.length > 0) {
          virtualList = virtualListContainer.eq(-1)[0].f7VirtualList;
          if (virtualList && !virtualList.reachEnd && !virtualList.params.updatableScroll) {
            return;
          }
        }
        $el.trigger('infinite', e);
        app.emit('infinite', $el[0], e);
      }
    },
    create: function create(el) {
      var $el = $$1(el);
      var app = this;
      $el.on('scroll', function handle(e) {
        app.infiniteScroll.handle(this, e);
      });
    },
    destroy: function destroy(el) {
      var $el = $$1(el);
      $el.off('scroll');
    },
  };
  var InfiniteScroll$1 = {
    name: 'infiniteScroll',
    create: function create() {
      var app = this;
      Utils.extend(app, {
        infiniteScroll: {
          handle: InfiniteScroll.handleScroll.bind(app),
          create: InfiniteScroll.create.bind(app),
          destroy: InfiniteScroll.destroy.bind(app),
        },
      });
    },
    on: {
      tabMounted: function tabMounted(tabEl) {
        var app = this;
        var $tabEl = $$1(tabEl);
        $tabEl.find('.infinite-scroll-content').each(function (index, el) {
          app.infiniteScroll.create(el);
        });
      },
      tabBeforeRemove: function tabBeforeRemove(tabEl) {
        var $tabEl = $$1(tabEl);
        var app = this;
        $tabEl.find('.infinite-scroll-content').each(function (index, el) {
          app.infiniteScroll.destroy(el);
        });
      },
      pageInit: function pageInit(page) {
        var app = this;
        page.$el.find('.infinite-scroll-content').each(function (index, el) {
          app.infiniteScroll.create(el);
        });
      },
      pageBeforeRemove: function pageBeforeRemove(page) {
        var app = this;
        page.$el.find('.infinite-scroll-content').each(function (index, el) {
          app.infiniteScroll.destroy(el);
        });
      },
    },
  };

  var PullToRefresh = (function (Framework7Class$$1) {
    function PullToRefresh(app, el) {
      Framework7Class$$1.call(this, {}, [app]);
      var ptr = this;
      var $el = $$1(el);
      var $preloaderEl = $el.find('.ptr-preloader');

      ptr.$el = $el;
      ptr.el = $el[0];
      ptr.app = app;

      // Extend defaults with modules params
      ptr.useModulesParams({});

      var isMaterial = app.theme === 'md';

      // Done
      ptr.done = function done() {
        var $transitionTarget = isMaterial ? $preloaderEl : $el;
        $transitionTarget.transitionEnd(function () {
          $el.removeClass('ptr-transitioning ptr-pull-up ptr-pull-down');
          $el.trigger('ptr:done');
          ptr.emit('local::done ptrDone', $el[0]);
        });
        $el.removeClass('ptr-refreshing').addClass('ptr-transitioning');
        return ptr;
      };

      ptr.refresh = function refresh() {
        if ($el.hasClass('ptr-refreshing')) { return ptr; }
        $el.addClass('ptr-transitioning ptr-refreshing');
        $el.trigger('ptr:refresh', ptr.done);
        ptr.emit('local::refresh ptrRefresh', $el[0], ptr.done);
        return ptr;
      };

      // Events handling
      var touchId;
      var isTouched;
      var isMoved;
      var touchesStart = {};
      var isScrolling;
      var touchesDiff;
      var refresh = false;
      var useTranslate = false;
      var startTranslate = 0;
      var translate;
      var scrollTop;
      var wasScrolled;
      var triggerDistance;
      var dynamicTriggerDistance;
      var pullStarted;
      var hasNavbar = false;
      var $pageEl = $el.parents('.page');

      if ($pageEl.find('.navbar').length > 0 || $pageEl.parents('.view').children('.navbar').length > 0) { hasNavbar = true; }
      if ($pageEl.hasClass('no-navbar')) { hasNavbar = false; }
      if (!hasNavbar) { $el.addClass('ptr-no-navbar'); }

      // Define trigger distance
      if ($el.attr('data-ptr-distance')) {
        dynamicTriggerDistance = true;
      } else {
        triggerDistance = isMaterial ? 66 : 44;
      }

      function handleTouchStart(e) {
        if (isTouched) {
          if (Device.os === 'android') {
            if ('targetTouches' in e && e.targetTouches.length > 1) { return; }
          } else { return; }
        }

        if ($el.hasClass('ptr-refreshing')) {
          return;
        }
        if ($$1(e.target).closest('.sortable-handler').length) { return; }

        isMoved = false;
        pullStarted = false;
        isTouched = true;
        isScrolling = undefined;
        wasScrolled = undefined;
        if (e.type === 'touchstart') { touchId = e.targetTouches[0].identifier; }
        touchesStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
        touchesStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
      }

      function handleTouchMove(e) {
        if (!isTouched) { return; }
        var pageX;
        var pageY;
        var touch;
        if (e.type === 'touchmove') {
          if (touchId && e.touches) {
            for (var i = 0; i < e.touches.length; i += 1) {
              if (e.touches[i].identifier === touchId) {
                touch = e.touches[i];
              }
            }
          }
          if (!touch) { touch = e.targetTouches[0]; }
          pageX = touch.pageX;
          pageY = touch.pageY;
        } else {
          pageX = e.pageX;
          pageY = e.pageY;
        }
        if (!pageX || !pageY) { return; }


        if (typeof isScrolling === 'undefined') {
          isScrolling = !!(isScrolling || Math.abs(pageY - touchesStart.y) > Math.abs(pageX - touchesStart.x));
        }
        if (!isScrolling) {
          isTouched = false;
          return;
        }

        scrollTop = $el[0].scrollTop;
        if (typeof wasScrolled === 'undefined' && scrollTop !== 0) { wasScrolled = true; }

        if (!isMoved) {
          $el.removeClass('ptr-transitioning');
          if (scrollTop > $el[0].offsetHeight) {
            isTouched = false;
            return;
          }
          if (dynamicTriggerDistance) {
            triggerDistance = $el.attr('data-ptr-distance');
            if (triggerDistance.indexOf('%') >= 0) { triggerDistance = ($el[0].offsetHeight * parseInt(triggerDistance, 10)) / 100; }
          }
          startTranslate = $el.hasClass('ptr-refreshing') ? triggerDistance : 0;
          if ($el[0].scrollHeight === $el[0].offsetHeight || Device.os !== 'ios' || isMaterial) {
            useTranslate = true;
          } else {
            useTranslate = false;
          }
        }
        isMoved = true;
        touchesDiff = pageY - touchesStart.y;

        if ((touchesDiff > 0 && scrollTop <= 0) || scrollTop < 0) {
          // iOS 8 fix
          if (Device.os === 'ios' && parseInt(Device.osVersion.split('.')[0], 10) > 7 && scrollTop === 0 && !wasScrolled) { useTranslate = true; }

          if (useTranslate) {
            e.preventDefault();
            translate = (Math.pow( touchesDiff, 0.85 )) + startTranslate;
            if (isMaterial) {
              $preloaderEl.transform(("translate3d(0," + translate + "px,0)"))
                .find('.ptr-arrow').transform(("rotate(" + ((180 * (touchesDiff / 66)) + 100) + "deg)"));
            } else {
              $el.transform(("translate3d(0," + translate + "px,0)"));
            }
          }
          if ((useTranslate && (Math.pow( touchesDiff, 0.85 )) > triggerDistance) || (!useTranslate && touchesDiff >= triggerDistance * 2)) {
            refresh = true;
            $el.addClass('ptr-pull-up').removeClass('ptr-pull-down');
          } else {
            refresh = false;
            $el.removeClass('ptr-pull-up').addClass('ptr-pull-down');
          }
          if (!pullStarted) {
            $el.trigger('ptr:pullstart');
            ptr.emit('local::pullStart ptrPullStart', $el[0]);
            pullStarted = true;
          }
          $el.trigger('ptr:pullmove', {
            event: e,
            scrollTop: scrollTop,
            translate: translate,
            touchesDiff: touchesDiff,
          });
          ptr.emit('local::pullMove ptrPullMove', $el[0], {
            event: e,
            scrollTop: scrollTop,
            translate: translate,
            touchesDiff: touchesDiff,
          });
        } else {
          pullStarted = false;
          $el.removeClass('ptr-pull-up ptr-pull-down');
          refresh = false;
        }
      }
      function handleTouchEnd(e) {
        if (e.type === 'touchend' && e.changedTouches && e.changedTouches.length > 0 && touchId) {
          if (e.changedTouches[0].identifier !== touchId) {
            isTouched = false;
            isScrolling = false;
            isMoved = false;
            touchId = null;
            return;
          }
        }
        if (!isTouched || !isMoved) {
          isTouched = false;
          isMoved = false;
          return;
        }
        if (translate) {
          $el.addClass('ptr-transitioning');
          translate = 0;
        }
        if (isMaterial) {
          $preloaderEl.transform('')
            .find('.ptr-arrow').transform('');
        } else {
          $el.transform('');
        }

        if (refresh) {
          $el.addClass('ptr-refreshing');
          $el.trigger('ptr:refresh', ptr.done);
          ptr.emit('local::refresh ptrRefresh', $el[0], ptr.done);
        } else {
          $el.removeClass('ptr-pull-down');
        }
        isTouched = false;
        isMoved = false;
        if (pullStarted) {
          $el.trigger('ptr:pullend');
          ptr.emit('local::pullEnd ptrPullEnd', $el[0]);
        }
      }

      if (!$pageEl.length || !$el.length) { return ptr; }

      $el[0].f7PullToRefresh = ptr;

      // Events
      ptr.attachEvents = function attachEvents() {
        var passive = Support.passiveListener ? { passive: true } : false;
        $el.on(app.touchEvents.start, handleTouchStart, passive);
        app.on('touchmove', handleTouchMove);
        app.on('touchend:passive', handleTouchEnd);
      };
      ptr.detachEvents = function detachEvents() {
        var passive = Support.passiveListener ? { passive: true } : false;
        $el.off(app.touchEvents.start, handleTouchStart, passive);
        app.off('touchmove', handleTouchMove);
        app.off('touchend:passive', handleTouchEnd);
      };

      // Install Modules
      ptr.useModules();

      // Init
      ptr.init();

      return ptr;
    }

    if ( Framework7Class$$1 ) PullToRefresh.__proto__ = Framework7Class$$1;
    PullToRefresh.prototype = Object.create( Framework7Class$$1 && Framework7Class$$1.prototype );
    PullToRefresh.prototype.constructor = PullToRefresh;

    PullToRefresh.prototype.init = function init () {
      var ptr = this;
      ptr.attachEvents();
    };

    PullToRefresh.prototype.destroy = function destroy () {
      var ptr = this;
      ptr.emit('local::beforeDestroy ptrBeforeDestroy', ptr);
      ptr.$el.trigger('ptr:beforedestroy', ptr);
      delete ptr.el.f7PullToRefresh;
      ptr.detachEvents();
      Utils.deleteProps(ptr);
      ptr = null;
    };

    return PullToRefresh;
  }(Framework7Class));

  var PullToRefresh$1 = {
    name: 'pullToRefresh',
    create: function create() {
      var app = this;
      app.ptr = Utils.extend(
        ConstructorMethods({
          defaultSelector: '.ptr-content',
          constructor: PullToRefresh,
          app: app,
          domProp: 'f7PullToRefresh',
        }),
        {
          done: function done(el) {
            var ptr = app.ptr.get(el);
            if (ptr) { return ptr.done(); }
            return undefined;
          },
          refresh: function refresh(el) {
            var ptr = app.ptr.get(el);
            if (ptr) { return ptr.refresh(); }
            return undefined;
          },
        }
      );
    },
    static: {
      PullToRefresh: PullToRefresh,
    },
    on: {
      tabMounted: function tabMounted(tabEl) {
        var app = this;
        var $tabEl = $$1(tabEl);
        $tabEl.find('.ptr-content').each(function (index, el) {
          app.ptr.create(el);
        });
      },
      tabBeforeRemove: function tabBeforeRemove(tabEl) {
        var $tabEl = $$1(tabEl);
        var app = this;
        $tabEl.find('.ptr-content').each(function (index, el) {
          app.ptr.destroy(el);
        });
      },
      pageInit: function pageInit(page) {
        var app = this;
        page.$el.find('.ptr-content').each(function (index, el) {
          app.ptr.create(el);
        });
      },
      pageBeforeRemove: function pageBeforeRemove(page) {
        var app = this;
        page.$el.find('.ptr-content').each(function (index, el) {
          app.ptr.destroy(el);
        });
      },
    },
  };

  var Lazy = {
    destroy: function destroy(pageEl) {
      var $pageEl = $$1(pageEl).closest('.page');
      if (!$pageEl.length) { return; }
      if ($pageEl[0].f7LazyDestroy) {
        $pageEl[0].f7LazyDestroy();
      }
    },
    create: function create(pageEl) {
      var app = this;
      var $pageEl = $$1(pageEl).closest('.page').eq(0);

      // Lazy images
      var lazyLoadImages = $pageEl.find('.lazy');
      if (lazyLoadImages.length === 0 && !$pageEl.hasClass('lazy')) { return; }

      // Placeholder
      var placeholderSrc = app.params.lazy.placeholder;

      if (placeholderSrc !== false) {
        lazyLoadImages.each(function (index, lazyEl) {
          if ($$1(lazyEl).attr('data-src') && !$$1(lazyEl).attr('src')) { $$1(lazyEl).attr('src', placeholderSrc); }
        });
      }

      // load image
      var imagesSequence = [];
      var imageIsLoading = false;

      function onImageComplete(lazyEl) {
        if (imagesSequence.indexOf(lazyEl) >= 0) {
          imagesSequence.splice(imagesSequence.indexOf(lazyEl), 1);
        }
        imageIsLoading = false;
        if (app.params.lazy.sequential && imagesSequence.length > 0) {
          imageIsLoading = true;
          app.lazy.loadImage(imagesSequence[0], onImageComplete);
        }
      }

      function lazyHandler() {
        app.lazy.load($pageEl, function (lazyEl) {
          if (app.params.lazy.sequential && imageIsLoading) {
            if (imagesSequence.indexOf(lazyEl) < 0) { imagesSequence.push(lazyEl); }
            return;
          }
          imageIsLoading = true;
          app.lazy.loadImage(lazyEl, onImageComplete);
        });
      }

      function attachEvents() {
        $pageEl[0].f7LazyAttached = true;
        $pageEl.on('lazy', lazyHandler);
        $pageEl.on('scroll', lazyHandler, true);
        $pageEl.find('.tab').on('tab:mounted tab:show', lazyHandler);
        app.on('resize', lazyHandler);
      }
      function detachEvents() {
        $pageEl[0].f7LazyAttached = false;
        delete $pageEl[0].f7LazyAttached;
        $pageEl.off('lazy', lazyHandler);
        $pageEl.off('scroll', lazyHandler, true);
        $pageEl.find('.tab').off('tab:mounted tab:show', lazyHandler);
        app.off('resize', lazyHandler);
      }

      // Store detach function
      if (!$pageEl[0].f7LazyDestroy) {
        $pageEl[0].f7LazyDestroy = detachEvents;
      }

      // Attach events
      if (!$pageEl[0].f7LazyAttached) {
        attachEvents();
      }

      // Run loader on page load/init
      lazyHandler();
    },
    isInViewport: function isInViewport(lazyEl) {
      var app = this;
      var rect = lazyEl.getBoundingClientRect();
      var threshold = app.params.lazy.threshold || 0;

      return (
        rect.top >= (0 - threshold)
        && rect.left >= (0 - threshold)
        && rect.top <= (app.height + threshold)
        && rect.left <= (app.width + threshold)
      );
    },
    loadImage: function loadImage(imageEl, callback) {
      var app = this;
      var $imageEl = $$1(imageEl);

      var bg = $imageEl.attr('data-background');
      var src = bg || $imageEl.attr('data-src');
      if (!src) { return; }
      function onLoad() {
        $imageEl.removeClass('lazy').addClass('lazy-loaded');
        if (bg) {
          $imageEl.css('background-image', ("url(" + src + ")"));
        } else {
          $imageEl.attr('src', src);
        }
        if (callback) { callback(imageEl); }
        $imageEl.trigger('lazy:loaded');
        app.emit('lazyLoaded', $imageEl[0]);
      }

      function onError() {
        $imageEl.removeClass('lazy').addClass('lazy-loaded');
        if (bg) {
          $imageEl.css('background-image', ("url(" + (app.params.lazy.placeholder || '') + ")"));
        } else {
          $imageEl.attr('src', app.params.lazy.placeholder || '');
        }
        if (callback) { callback(imageEl); }
        $imageEl.trigger('lazy:error');
        app.emit('lazyError', $imageEl[0]);
      }
      var image = new win.Image();
      image.onload = onLoad;
      image.onerror = onError;
      image.src = src;

      $imageEl.removeAttr('data-src').removeAttr('data-background');

      // Add loaded callback and events
      $imageEl.trigger('lazy:load');
      app.emit('lazyLoad', $imageEl[0]);
    },
    load: function load(pageEl, callback) {
      var app = this;
      var $pageEl = $$1(pageEl);
      if (!$pageEl.hasClass('page')) { $pageEl = $pageEl.parents('.page').eq(0); }
      if ($pageEl.length === 0) {
        return;
      }
      $pageEl.find('.lazy').each(function (index, lazyEl) {
        var $lazyEl = $$1(lazyEl);
        if ($lazyEl.parents('.tab:not(.tab-active)').length > 0) {
          return;
        }
        if (app.lazy.isInViewport(lazyEl)) {
          if (callback) { callback(lazyEl); }
          else { app.lazy.loadImage(lazyEl); }
        }
      });
    },

  };
  var Lazy$1 = {
    name: 'lazy',
    params: {
      lazy: {
        placeholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEXCwsK592mkAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==',
        threshold: 0,
        sequential: true,
      },
    },
    create: function create() {
      var app = this;
      Utils.extend(app, {
        lazy: {
          create: Lazy.create.bind(app),
          destroy: Lazy.destroy.bind(app),
          loadImage: Lazy.loadImage.bind(app),
          load: Lazy.load.bind(app),
          isInViewport: Lazy.isInViewport.bind(app),
        },
      });
    },
    on: {
      pageInit: function pageInit(page) {
        var app = this;
        if (page.$el.find('.lazy').length > 0 || page.$el.hasClass('lazy')) {
          app.lazy.create(page.$el);
        }
      },
      pageAfterIn: function pageAfterIn(page) {
        var app = this;
        if (page.$el.find('.lazy').length > 0 || page.$el.hasClass('lazy')) {
          app.lazy.create(page.$el);
        }
      },
      pageBeforeRemove: function pageBeforeRemove(page) {
        var app = this;
        if (page.$el.find('.lazy').length > 0 || page.$el.hasClass('lazy')) {
          app.lazy.destroy(page.$el);
        }
      },
      tabMounted: function tabMounted(tabEl) {
        var app = this;
        var $tabEl = $$1(tabEl);
        if ($tabEl.find('.lazy').length > 0 || $tabEl.hasClass('lazy')) {
          app.lazy.create($tabEl);
        }
      },
      tabBeforeRemove: function tabBeforeRemove(tabEl) {
        var app = this;
        var $tabEl = $$1(tabEl);
        if ($tabEl.find('.lazy').length > 0 || $tabEl.hasClass('lazy')) {
          app.lazy.destroy($tabEl);
        }
      },
    },
  };

  var Fab = {
    morphOpen: function morphOpen(fabEl, targetEl) {
      var app = this;
      var $fabEl = $$1(fabEl);
      var $targetEl = $$1(targetEl);
      if ($targetEl.length === 0) { return; }

      $targetEl.transition(0).addClass('fab-morph-target-visible');
      var target = {
        width: $targetEl[0].offsetWidth,
        height: $targetEl[0].offsetHeight,
        offset: $targetEl.offset(),
        borderRadius: $targetEl.css('border-radius'),
        zIndex: $targetEl.css('z-index'),
      };
      var fab = {
        width: $fabEl[0].offsetWidth,
        height: $fabEl[0].offsetHeight,
        offset: $fabEl.offset(),
        translateX: Utils.getTranslate($fabEl[0], 'x'),
        translateY: Utils.getTranslate($fabEl[0], 'y'),
      };

      $fabEl[0].f7FabMorphData = {
        $targetEl: $targetEl,
        target: target,
        fab: fab,
      };

      var diffX = (fab.offset.left + (fab.width / 2))
                    - (target.offset.left + (target.width / 2))
                    - fab.translateX;
      var diffY = (fab.offset.top + (fab.height / 2))
                    - (target.offset.top + (target.height / 2))
                    - fab.translateY;
      var scaleX = target.width / fab.width;
      var scaleY = target.height / fab.height;

      var borderRadius = Math.ceil(parseInt(target.borderRadius, 10) / Math.max(scaleX, scaleY));
      if (borderRadius > 0) { borderRadius += 2; }

      $fabEl[0].f7FabMorphResizeHandler = function resizeHandler() {
        $fabEl.transition(0).transform('');
        $targetEl.transition(0);
        target.width = $targetEl[0].offsetWidth;
        target.height = $targetEl[0].offsetHeight;
        target.offset = $targetEl.offset();
        fab.offset = $fabEl.offset();

        var diffXNew = (fab.offset.left + (fab.width / 2))
                        - (target.offset.left + (target.width / 2))
                        - fab.translateX;
        var diffYNew = (fab.offset.top + (fab.height / 2))
                        - (target.offset.top + (target.height / 2))
                        - fab.translateY;
        var scaleXNew = target.width / fab.width;
        var scaleYNew = target.height / fab.height;

        $fabEl.transform(("translate3d(" + (-diffXNew) + "px, " + (-diffYNew) + "px, 0) scale(" + scaleXNew + ", " + scaleYNew + ")"));
      };

      $targetEl
        .css('opacity', 0)
        .transform(("scale(" + (1 / scaleX) + ", " + (1 / scaleY) + ")"));
      $fabEl
        .addClass('fab-opened')
        .css('z-index', target.zIndex - 1)
        .transform(("translate3d(" + (-diffX) + "px, " + (-diffY) + "px, 0)"));
      $fabEl.transitionEnd(function () {
        $targetEl.transition('');
        Utils.nextTick(function () {
          $targetEl.css('opacity', 1).transform('scale(1,1)');
        });
        $fabEl.transform(("translate3d(" + (-diffX) + "px, " + (-diffY) + "px, 0) scale(" + scaleX + ", " + scaleY + ")"))
          .css('border-radius', (borderRadius + "px"))
          .css('box-shadow', 'none');
        app.on('resize', $fabEl[0].f7FabMorphResizeHandler);
        if ($targetEl.parents('.page-content').length > 0) {
          $targetEl.parents('.page-content').on('scroll', $fabEl[0].f7FabMorphResizeHandler);
        }
      });
    },
    morphClose: function morphClose(fabEl) {
      var app = this;
      var $fabEl = $$1(fabEl);
      var morphData = $fabEl[0].f7FabMorphData;
      if (!morphData) { return; }
      var $targetEl = morphData.$targetEl;
      var target = morphData.target;
      var fab = morphData.fab;
      if ($targetEl.length === 0) { return; }

      var diffX = (fab.offset.left + (fab.width / 2))
                    - (target.offset.left + (target.width / 2))
                    - fab.translateX;
      var diffY = (fab.offset.top + (fab.height / 2))
                    - (target.offset.top + (target.height / 2))
                    - fab.translateY;
      var scaleX = target.width / fab.width;
      var scaleY = target.height / fab.height;

      app.off('resize', $fabEl[0].f7FabMorphResizeHandler);
      if ($targetEl.parents('.page-content').length > 0) {
        $targetEl.parents('.page-content').off('scroll', $fabEl[0].f7FabMorphResizeHandler);
      }

      $targetEl
        .css('opacity', 0)
        .transform(("scale(" + (1 / scaleX) + ", " + (1 / scaleY) + ")"));
      $fabEl
        .transition('')
        .css('box-shadow', '')
        .css('border-radius', '')
        .transform(("translate3d(" + (-diffX) + "px, " + (-diffY) + "px, 0)"));
      $fabEl.transitionEnd(function () {
        $fabEl
          .css('z-index', '')
          .removeClass('fab-opened')
          .transform('');
        Utils.nextTick(function () {
          $fabEl.transitionEnd(function () {
            $targetEl
              .removeClass('fab-morph-target-visible')
              .css('opacity', '')
              .transform('')
              .transition('');
          });
        });
      });
    },
    open: function open(fabEl, targetEl) {
      var app = this;
      var $fabEl = $$1(fabEl).eq(0);
      var $buttonsEl = $fabEl.find('.fab-buttons');
      if (!$fabEl.length) { return; }
      if ($fabEl.hasClass('fab-opened')) { return; }
      if (!$buttonsEl.length && !$fabEl.hasClass('fab-morph')) { return; }

      if (app.fab.openedEl) {
        if (app.fab.openedEl === $fabEl[0]) { return; }
        app.fab.close(app.fab.openedEl);
      }
      app.fab.openedEl = $fabEl[0];
      if ($fabEl.hasClass('fab-morph')) {
        app.fab.morphOpen($fabEl, targetEl || $fabEl.attr('data-morph-to'));
      } else {
        $fabEl.addClass('fab-opened');
      }
      $fabEl.trigger('fab:open');
    },
    close: function close(fabEl) {
      if ( fabEl === void 0 ) fabEl = '.fab-opened';

      var app = this;
      var $fabEl = $$1(fabEl).eq(0);
      var $buttonsEl = $fabEl.find('.fab-buttons');
      if (!$fabEl.length) { return; }
      if (!$fabEl.hasClass('fab-opened')) { return; }
      if (!$buttonsEl.length && !$fabEl.hasClass('fab-morph')) { return; }
      app.fab.openedEl = null;
      if ($fabEl.hasClass('fab-morph')) {
        app.fab.morphClose($fabEl);
      } else {
        $fabEl.removeClass('fab-opened');
      }
      $fabEl.trigger('fab:close');
    },
    toggle: function toggle(fabEl) {
      var app = this;
      var $fabEl = $$1(fabEl);
      if (!$fabEl.hasClass('fab-opened')) { app.fab.open(fabEl); }
      else { app.fab.close(fabEl); }
    },
  };

  var Fab$1 = {
    name: 'fab',
    create: function create() {
      var app = this;
      Utils.extend(app, {
        fab: {
          openedEl: null,
          morphOpen: Fab.morphOpen.bind(app),
          morphClose: Fab.morphClose.bind(app),
          open: Fab.open.bind(app),
          close: Fab.close.bind(app),
          toggle: Fab.toggle.bind(app),
        },
      });
    },
    clicks: {
      '.fab > a': function open($clickedEl) {
        var app = this;
        app.fab.toggle($clickedEl.parents('.fab'));
      },
      '.fab-open': function open($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        app.fab.open(data.fab);
      },
      '.fab-close': function close($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        app.fab.close(data.fab);
      },
    },
  };

  var Searchbar = (function (FrameworkClass) {
    function Searchbar(app, params) {
      if ( params === void 0 ) params = {};

      FrameworkClass.call(this, params, [app]);

      var sb = this;

      var defaults = {
        el: undefined,
        inputEl: undefined,
        disableButton: true,
        disableButtonEl: undefined,
        backdropEl: undefined,
        searchContainer: undefined, // container to search, HTMLElement or CSS selector
        searchItem: 'li', // single item selector, CSS selector
        searchIn: undefined, // where to search in item, CSS selector
        ignore: '.searchbar-ignore',
        foundEl: '.searchbar-found',
        notFoundEl: '.searchbar-not-found',
        hideOnEnableEl: '.searchbar-hide-on-enable',
        hideOnSearchEl: '.searchbar-hide-on-search',
        backdrop: true,
        removeDiacritics: true,
        customSearch: false,
        hideDividers: true,
        hideGroups: true,
        disableOnBackdropClick: true,
        expandable: false,
      };

      // Extend defaults with modules params
      sb.useModulesParams(defaults);

      sb.params = Utils.extend(defaults, params);

      var $el = $$1(sb.params.el);
      if ($el.length === 0) { return sb; }

      $el[0].f7Searchbar = sb;

      var $pageEl;
      var $navbarEl;
      if ($el.parents('.page').length > 0) {
        $pageEl = $el.parents('.page');
      } else {
        $navbarEl = $el.parents('.navbar-inner');
        if ($navbarEl.length > 0) {
          if ($navbarEl[0].f7Page) {
            $pageEl = $navbarEl[0].f7Page.$el;
          } else {
            var $currentPageEl = $el.parents('.view').find('.page-current');
            if ($currentPageEl[0] && $currentPageEl[0].f7Page && $currentPageEl[0].f7Page.navbarEl === $navbarEl[0]) {
              $pageEl = $currentPageEl;
            }
          }
        }
      }

      var $foundEl;
      if (params.foundEl) {
        $foundEl = $$1(params.foundEl);
      } else if (typeof sb.params.foundEl === 'string' && $pageEl) {
        $foundEl = $pageEl.find(sb.params.foundEl);
      }

      var $notFoundEl;
      if (params.notFoundEl) {
        $notFoundEl = $$1(params.notFoundEl);
      } else if (typeof sb.params.notFoundEl === 'string' && $pageEl) {
        $notFoundEl = $pageEl.find(sb.params.notFoundEl);
      }

      var $hideOnEnableEl;
      if (params.hideOnEnableEl) {
        $hideOnEnableEl = $$1(params.hideOnEnableEl);
      } else if (typeof sb.params.hideOnEnableEl === 'string' && $pageEl) {
        $hideOnEnableEl = $pageEl.find(sb.params.hideOnEnableEl);
      }

      var $hideOnSearchEl;
      if (params.hideOnSearchEl) {
        $hideOnSearchEl = $$1(params.hideOnSearchEl);
      } else if (typeof sb.params.hideOnSearchEl === 'string' && $pageEl) {
        $hideOnSearchEl = $pageEl.find(sb.params.hideOnSearchEl);
      }

      var $backdropEl;
      if (sb.params.backdrop) {
        if (sb.params.backdropEl) {
          $backdropEl = $$1(sb.params.backdropEl);
        } else if ($pageEl && $pageEl.length > 0) {
          $backdropEl = $pageEl.find('.searchbar-backdrop');
        } else {
          $backdropEl = $el.siblings('.searchbar-backdrop');
        }
        if ($backdropEl.length === 0) {
          $backdropEl = $$1('<div class="searchbar-backdrop"></div>');
          if ($pageEl && $pageEl.length) {
            if ($el.parents($pageEl).length > 0 && $navbarEl && $el.parents($navbarEl).length === 0) {
              $backdropEl.insertBefore($el);
            } else {
              $backdropEl.insertBefore($pageEl.find('.page-content').eq(0));
            }
          } else {
            $backdropEl.insertBefore($el);
          }
        }
      }

      var $searchContainer;
      if (sb.params.searchContainer) {
        $searchContainer = $$1(sb.params.searchContainer);
      }

      var $inputEl;
      if (sb.params.inputEl) {
        $inputEl = $$1(sb.params.inputEl);
      } else {
        $inputEl = $el.find('input[type="search"]').eq(0);
      }

      var $disableButtonEl;
      if (sb.params.disableButton) {
        if (sb.params.disableButtonEl) {
          $disableButtonEl = $$1(sb.params.disableButtonEl);
        } else {
          $disableButtonEl = $el.find('.searchbar-disable-button');
        }
      }

      Utils.extend(sb, {
        app: app,
        view: app.views.get($el.parents('.view')),
        $el: $el,
        el: $el[0],
        $backdropEl: $backdropEl,
        backdropEl: $backdropEl && $backdropEl[0],
        $searchContainer: $searchContainer,
        searchContainer: $searchContainer && $searchContainer[0],
        $inputEl: $inputEl,
        inputEl: $inputEl[0],
        $disableButtonEl: $disableButtonEl,
        disableButtonEl: $disableButtonEl && $disableButtonEl[0],
        disableButtonHasMargin: false,
        $pageEl: $pageEl,
        pageEl: $pageEl && $pageEl[0],
        $navbarEl: $navbarEl,
        navbarEl: $navbarEl && $navbarEl[0],
        $foundEl: $foundEl,
        foundEl: $foundEl && $foundEl[0],
        $notFoundEl: $notFoundEl,
        notFoundEl: $notFoundEl && $notFoundEl[0],
        $hideOnEnableEl: $hideOnEnableEl,
        hideOnEnableEl: $hideOnEnableEl && $hideOnEnableEl[0],
        $hideOnSearchEl: $hideOnSearchEl,
        hideOnSearchEl: $hideOnSearchEl && $hideOnSearchEl[0],
        previousQuery: '',
        query: '',
        isVirtualList: $searchContainer && $searchContainer.hasClass('virtual-list'),
        virtualList: undefined,
        enabled: false,
        expandable: sb.params.expandable || $el.hasClass('searchbar-expandable'),
      });

      // Events
      function preventSubmit(e) {
        e.preventDefault();
      }
      function onInputFocus(e) {
        sb.enable(e);
        sb.$el.addClass('searchbar-focused');
      }
      function onInputBlur() {
        sb.$el.removeClass('searchbar-focused');
      }
      function onInputChange() {
        var value = sb.$inputEl.val().trim();
        if (
          (
            (sb.$searchContainer && sb.$searchContainer.length > 0)
            && (sb.params.searchIn || sb.isVirtualList || sb.params.searchIn === sb.params.searchItem)
          )
          || sb.params.customSearch
        ) {
          sb.search(value, true);
        }
      }
      function onInputClear(e, previousValue) {
        sb.$el.trigger('searchbar:clear', previousValue);
        sb.emit('local::clear searchbarClear', sb, previousValue);
      }
      function disableOnClick(e) {
        sb.disable(e);
      }
      function onPageBeforeOut() {
        if (!sb || (sb && !sb.$el)) { return; }
        if (sb.enabled) {
          sb.$el.removeClass('searchbar-enabled');
        }
      }
      function onPageBeforeIn() {
        if (!sb || (sb && !sb.$el)) { return; }
        if (sb.enabled) {
          sb.$el.addClass('searchbar-enabled');
        }
      }
      sb.attachEvents = function attachEvents() {
        $el.on('submit', preventSubmit);
        if (sb.params.disableButton) {
          sb.$disableButtonEl.on('click', disableOnClick);
        }
        if (sb.params.disableOnBackdropClick && sb.$backdropEl) {
          sb.$backdropEl.on('click', disableOnClick);
        }
        if (sb.expandable && app.theme === 'ios' && sb.view && $navbarEl && sb.$pageEl) {
          sb.$pageEl.on('page:beforeout', onPageBeforeOut);
          sb.$pageEl.on('page:beforein', onPageBeforeIn);
        }
        sb.$inputEl.on('focus', onInputFocus);
        sb.$inputEl.on('blur', onInputBlur);
        sb.$inputEl.on('change input compositionend', onInputChange);
        sb.$inputEl.on('input:clear', onInputClear);
      };
      sb.detachEvents = function detachEvents() {
        $el.off('submit', preventSubmit);
        if (sb.params.disableButton) {
          sb.$disableButtonEl.off('click', disableOnClick);
        }
        if (sb.params.disableOnBackdropClick && sb.$backdropEl) {
          sb.$backdropEl.off('click', disableOnClick);
        }
        if (sb.expandable && app.theme === 'ios' && sb.view && $navbarEl && sb.$pageEl) {
          sb.$pageEl.off('page:beforeout', onPageBeforeOut);
          sb.$pageEl.off('page:beforein', onPageBeforeIn);
        }
        sb.$inputEl.off('focus', onInputFocus);
        sb.$inputEl.off('blur', onInputBlur);
        sb.$inputEl.off('change input compositionend', onInputChange);
        sb.$inputEl.off('input:clear', onInputClear);
      };

      // Install Modules
      sb.useModules();

      // Init
      sb.init();

      return sb;
    }

    if ( FrameworkClass ) Searchbar.__proto__ = FrameworkClass;
    Searchbar.prototype = Object.create( FrameworkClass && FrameworkClass.prototype );
    Searchbar.prototype.constructor = Searchbar;

    Searchbar.prototype.clear = function clear (e) {
      var sb = this;
      if (!sb.query && e && $$1(e.target).hasClass('searchbar-clear')) {
        sb.disable();
        return sb;
      }
      var previousQuery = sb.value;
      sb.$inputEl.val('').trigger('change').focus();
      sb.$el.trigger('searchbar:clear', previousQuery);
      sb.emit('local::clear searchbarClear', sb, previousQuery);
      return sb;
    };

    Searchbar.prototype.setDisableButtonMargin = function setDisableButtonMargin () {
      var sb = this;
      if (sb.expandable) { return; }
      var app = sb.app;
      sb.$disableButtonEl.transition(0).show();
      sb.$disableButtonEl.css(("margin-" + (app.rtl ? 'left' : 'right')), ((-sb.disableButtonEl.offsetWidth) + "px"));
      /* eslint no-underscore-dangle: ["error", { "allow": ["_clientLeft"] }] */
      sb._clientLeft = sb.$disableButtonEl[0].clientLeft;
      sb.$disableButtonEl.transition('');
      sb.disableButtonHasMargin = true;
    };

    Searchbar.prototype.enable = function enable (setFocus) {
      var sb = this;
      if (sb.enabled) { return sb; }
      var app = sb.app;
      sb.enabled = true;
      function enable() {
        if (sb.$backdropEl && ((sb.$searchContainer && sb.$searchContainer.length) || sb.params.customSearch) && !sb.$el.hasClass('searchbar-enabled') && !sb.query) {
          sb.backdropShow();
        }
        sb.$el.addClass('searchbar-enabled');
        if (!sb.expandable && sb.$disableButtonEl && sb.$disableButtonEl.length > 0 && app.theme === 'ios') {
          if (!sb.disableButtonHasMargin) {
            sb.setDisableButtonMargin();
          }
          sb.$disableButtonEl.css(("margin-" + (app.rtl ? 'left' : 'right')), '0px');
        }
        if (sb.$hideOnEnableEl) { sb.$hideOnEnableEl.addClass('hidden-by-searchbar'); }
        sb.$el.trigger('searchbar:enable');
        sb.emit('local::enable searchbarEnable', sb);
      }
      var needsFocus = false;
      if (setFocus === true) {
        if (doc.activeElement !== sb.inputEl) {
          needsFocus = true;
        }
      }
      var isIos = app.device.ios && app.theme === 'ios';
      if (isIos) {
        if (sb.expandable) {
          if (needsFocus) { sb.$inputEl.focus(); }
          enable();
        } else {
          if (needsFocus) { sb.$inputEl.focus(); }
          if (setFocus && (setFocus.type === 'focus' || setFocus === true)) {
            Utils.nextTick(function () {
              enable();
            }, 400);
          } else {
            enable();
          }
        }
      } else {
        if (needsFocus) { sb.$inputEl.focus(); }
        if (app.theme === 'md' && sb.expandable) {
          sb.$el.parents('.page, .view, .navbar-inner').scrollLeft(0);
        }
        enable();
      }
      return sb;
    };

    Searchbar.prototype.disable = function disable () {
      var sb = this;
      if (!sb.enabled) { return sb; }
      var app = sb.app;
      sb.$inputEl.val('').trigger('change');
      sb.$el.removeClass('searchbar-enabled');
      sb.$el.removeClass('searchbar-focused');
      if (!sb.expandable && sb.$disableButtonEl && sb.$disableButtonEl.length > 0 && app.theme === 'ios') {
        sb.$disableButtonEl.css(("margin-" + (app.rtl ? 'left' : 'right')), ((-sb.disableButtonEl.offsetWidth) + "px"));
      }

      if (sb.$backdropEl && ((sb.$searchContainer && sb.$searchContainer.length) || sb.params.customSearch)) {
        sb.backdropHide();
      }

      sb.enabled = false;

      sb.$inputEl.blur();

      if (sb.$hideOnEnableEl) { sb.$hideOnEnableEl.removeClass('hidden-by-searchbar'); }

      sb.$el.trigger('searchbar:disable');
      sb.emit('local::disable searchbarDisable', sb);
      return sb;
    };

    Searchbar.prototype.toggle = function toggle () {
      var sb = this;
      if (sb.enabled) { sb.disable(); }
      else { sb.enable(true); }
      return sb;
    };

    Searchbar.prototype.backdropShow = function backdropShow () {
      var sb = this;
      if (sb.$backdropEl) {
        sb.$backdropEl.addClass('searchbar-backdrop-in');
      }
      return sb;
    };

    Searchbar.prototype.backdropHide = function backdropHide () {
      var sb = this;
      if (sb.$backdropEl) {
        sb.$backdropEl.removeClass('searchbar-backdrop-in');
      }
      return sb;
    };

    Searchbar.prototype.search = function search (query, internal) {
      var sb = this;
      sb.previousQuery = sb.query || '';
      if (query === sb.previousQuery) { return sb; }

      if (!internal) {
        if (!sb.enabled) {
          sb.enable();
        }
        sb.$inputEl.val(query);
      }
      sb.query = query;
      sb.value = query;

      var $searchContainer = sb.$searchContainer;
      var $el = sb.$el;
      var $foundEl = sb.$foundEl;
      var $notFoundEl = sb.$notFoundEl;
      var $hideOnSearchEl = sb.$hideOnSearchEl;
      var isVirtualList = sb.isVirtualList;

      // Hide on search element
      if (query.length > 0 && $hideOnSearchEl) {
        $hideOnSearchEl.addClass('hidden-by-searchbar');
      } else if ($hideOnSearchEl) {
        $hideOnSearchEl.removeClass('hidden-by-searchbar');
      }
      // Add active/inactive classes on overlay
      if (
        ($searchContainer && $searchContainer.length && $el.hasClass('searchbar-enabled'))
        || (sb.params.customSearch && $el.hasClass('searchbar-enabled'))
      ) {
        if (query.length === 0) {
          sb.backdropShow();
        } else {
          sb.backdropHide();
        }
      }

      if (sb.params.customSearch) {
        $el.trigger('searchbar:search', query, sb.previousQuery);
        sb.emit('local::search searchbarSearch', sb, query, sb.previousQuery);
        return sb;
      }

      var foundItems = [];
      var vlQuery;
      if (isVirtualList) {
        sb.virtualList = $searchContainer[0].f7VirtualList;
        if (query.trim() === '') {
          sb.virtualList.resetFilter();
          if ($notFoundEl) { $notFoundEl.hide(); }
          if ($foundEl) { $foundEl.show(); }
          return sb;
        }
        vlQuery = sb.params.removeDiacritics ? Utils.removeDiacritics(query) : query;
        if (sb.virtualList.params.searchAll) {
          foundItems = sb.virtualList.params.searchAll(vlQuery, sb.virtualList.items) || [];
        } else if (sb.virtualList.params.searchByItem) {
          for (var i = 0; i < sb.virtualList.items.length; i += 1) {
            if (sb.virtualList.params.searchByItem(vlQuery, sb.virtualList.params.items[i], i)) {
              foundItems.push(i);
            }
          }
        }
      } else {
        var values;
        if (sb.params.removeDiacritics) { values = Utils.removeDiacritics(query.trim().toLowerCase()).split(' '); }
        else {
          values = query.trim().toLowerCase().split(' ');
        }
        $searchContainer.find(sb.params.searchItem).removeClass('hidden-by-searchbar').each(function (itemIndex, itemEl) {
          var $itemEl = $$1(itemEl);
          var compareWithText = [];
          var $searchIn = sb.params.searchIn ? $itemEl.find(sb.params.searchIn) : $itemEl;
          if (sb.params.searchIn === sb.params.searchItem) {
            $searchIn = $itemEl;
          }
          $searchIn.each(function (searchInIndex, searchInEl) {
            var itemText = $$1(searchInEl).text().trim().toLowerCase();
            if (sb.params.removeDiacritics) { itemText = Utils.removeDiacritics(itemText); }
            compareWithText.push(itemText);
          });
          compareWithText = compareWithText.join(' ');
          var wordsMatch = 0;
          for (var i = 0; i < values.length; i += 1) {
            if (compareWithText.indexOf(values[i]) >= 0) { wordsMatch += 1; }
          }
          if (wordsMatch !== values.length && !(sb.params.ignore && $itemEl.is(sb.params.ignore))) {
            $itemEl.addClass('hidden-by-searchbar');
          } else {
            foundItems.push($itemEl[0]);
          }
        });

        if (sb.params.hideDividers) {
          $searchContainer.find('.item-divider, .list-group-title').each(function (titleIndex, titleEl) {
            var $titleEl = $$1(titleEl);
            var $nextElements = $titleEl.nextAll('li');
            var hide = true;
            for (var i = 0; i < $nextElements.length; i += 1) {
              var $nextEl = $nextElements.eq(i);
              if ($nextEl.hasClass('list-group-title') || $nextEl.hasClass('item-divider')) { break; }
              if (!$nextEl.hasClass('hidden-by-searchbar')) {
                hide = false;
              }
            }
            var ignore = sb.params.ignore && $titleEl.is(sb.params.ignore);
            if (hide && !ignore) { $titleEl.addClass('hidden-by-searchbar'); }
            else { $titleEl.removeClass('hidden-by-searchbar'); }
          });
        }
        if (sb.params.hideGroups) {
          $searchContainer.find('.list-group').each(function (groupIndex, groupEl) {
            var $groupEl = $$1(groupEl);
            var ignore = sb.params.ignore && $groupEl.is(sb.params.ignore);
            var notHidden = $groupEl.find('li:not(.hidden-by-searchbar)');
            if (notHidden.length === 0 && !ignore) {
              $groupEl.addClass('hidden-by-searchbar');
            } else {
              $groupEl.removeClass('hidden-by-searchbar');
            }
          });
        }
      }

      if (foundItems.length === 0) {
        if ($notFoundEl) { $notFoundEl.show(); }
        if ($foundEl) { $foundEl.hide(); }
      } else {
        if ($notFoundEl) { $notFoundEl.hide(); }
        if ($foundEl) { $foundEl.show(); }
      }
      if (isVirtualList && sb.virtualList) {
        sb.virtualList.filterItems(foundItems);
      }

      $el.trigger('searchbar:search', query, sb.previousQuery, foundItems);
      sb.emit('local::search searchbarSearch', sb, query, sb.previousQuery, foundItems);

      return sb;
    };

    Searchbar.prototype.init = function init () {
      var sb = this;
      sb.attachEvents();
    };

    Searchbar.prototype.destroy = function destroy () {
      var sb = this;
      sb.emit('local::beforeDestroy searchbarBeforeDestroy', sb);
      sb.$el.trigger('searchbar:beforedestroy', sb);
      sb.detachEvents();
      delete sb.$el.f7Searchbar;
      Utils.deleteProps(sb);
    };

    return Searchbar;
  }(Framework7Class));

  var Searchbar$1 = {
    name: 'searchbar',
    static: {
      Searchbar: Searchbar,
    },
    create: function create() {
      var app = this;
      app.searchbar = ConstructorMethods({
        defaultSelector: '.searchbar',
        constructor: Searchbar,
        app: app,
        domProp: 'f7Searchbar',
        addMethods: 'clear enable disable toggle search'.split(' '),
      });
    },
    on: {
      tabMounted: function tabMounted(tabEl) {
        var app = this;
        $$1(tabEl).find('.searchbar-init').each(function (index, searchbarEl) {
          var $searchbarEl = $$1(searchbarEl);
          app.searchbar.create(Utils.extend($searchbarEl.dataset(), { el: searchbarEl }));
        });
      },
      tabBeforeRemove: function tabBeforeRemove(tabEl) {
        $$1(tabEl).find('.searchbar-init').each(function (index, searchbarEl) {
          if (searchbarEl.f7Searchbar && searchbarEl.f7Searchbar.destroy) {
            searchbarEl.f7Searchbar.destroy();
          }
        });
      },
      pageInit: function pageInit(page) {
        var app = this;
        page.$el.find('.searchbar-init').each(function (index, searchbarEl) {
          var $searchbarEl = $$1(searchbarEl);
          app.searchbar.create(Utils.extend($searchbarEl.dataset(), { el: searchbarEl }));
        });
        if (app.theme === 'ios' && page.view && page.view.router.separateNavbar && page.$navbarEl && page.$navbarEl.length > 0) {
          page.$navbarEl.find('.searchbar-init').each(function (index, searchbarEl) {
            var $searchbarEl = $$1(searchbarEl);
            app.searchbar.create(Utils.extend($searchbarEl.dataset(), { el: searchbarEl }));
          });
        }
      },
      pageBeforeRemove: function pageBeforeRemove(page) {
        var app = this;
        page.$el.find('.searchbar-init').each(function (index, searchbarEl) {
          if (searchbarEl.f7Searchbar && searchbarEl.f7Searchbar.destroy) {
            searchbarEl.f7Searchbar.destroy();
          }
        });
        if (app.theme === 'ios' && page.view && page.view.router.separateNavbar && page.$navbarEl && page.$navbarEl.length > 0) {
          page.$navbarEl.find('.searchbar-init').each(function (index, searchbarEl) {
            if (searchbarEl.f7Searchbar && searchbarEl.f7Searchbar.destroy) {
              searchbarEl.f7Searchbar.destroy();
            }
          });
        }
      },
    },
    clicks: {
      '.searchbar-clear': function clear($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        var sb = app.searchbar.get(data.searchbar);
        if (sb) { sb.clear(); }
      },
      '.searchbar-enable': function enable($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        var sb = app.searchbar.get(data.searchbar);
        if (sb) { sb.enable(true); }
      },
      '.searchbar-disable': function disable($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        var sb = app.searchbar.get(data.searchbar);
        if (sb) { sb.disable(); }
      },
      '.searchbar-toggle': function toggle($clickedEl, data) {
        if ( data === void 0 ) data = {};

        var app = this;
        var sb = app.searchbar.get(data.searchbar);
        if (sb) { sb.toggle(); }
      },
    },
  };

  {
    if (typeof window !== 'undefined') {
      // Template7
      if (!window.Template7) { window.Template7 = Template7; }

      // Dom7
      if (!window.Dom7) { window.Dom7 = $$1; }
    }
  }

  // Install Core Modules & Components
  Framework7.use([
    DeviceModule,
    SupportModule,
    UtilsModule,
    ResizeModule,
    RequestModule,
    TouchModule,
    ClicksModule,
    Router$1,
    HistoryModule,
    StorageModule,
    Statusbar$1,
    View$1,
    Navbar$1,
    Toolbar$1,
    Subnavbar,
    TouchRipple$1,
    Modal$1,
    Dialog$1,
    Popover$1,
    Sheet$1,
    Swipeout$1,
    VirtualList$1,
    Tabs,
    Input$1,
    Calendar$1,
    Picker$1,
    InfiniteScroll$1,
    PullToRefresh$1,
    Lazy$1,
    Fab$1,
    Searchbar$1
  ]);

  return Framework7;

})));
