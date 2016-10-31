(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = after

function after(count, callback, err_cb) {
    var bail = false
    err_cb = err_cb || noop
    proxy.count = count

    return (count === 0) ? callback() : proxy

    function proxy(err, result) {
        if (proxy.count <= 0) {
            throw new Error('after called too many times')
        }
        --proxy.count

        // after first error, rest are passed to err_cb
        if (err) {
            bail = true
            callback(err)
            // future error callbacks will go to error handler
            callback = err_cb
        } else if (proxy.count === 0 && !bail) {
            callback(null, result)
        }
    }
}

function noop() {}

},{}],2:[function(require,module,exports){
/**
 * An abstraction for slicing an arraybuffer even when
 * ArrayBuffer.prototype.slice is not supported
 *
 * @api public
 */

module.exports = function(arraybuffer, start, end) {
  var bytes = arraybuffer.byteLength;
  start = start || 0;
  end = end || bytes;

  if (arraybuffer.slice) { return arraybuffer.slice(start, end); }

  if (start < 0) { start += bytes; }
  if (end < 0) { end += bytes; }
  if (end > bytes) { end = bytes; }

  if (start >= bytes || start >= end || bytes === 0) {
    return new ArrayBuffer(0);
  }

  var abv = new Uint8Array(arraybuffer);
  var result = new Uint8Array(end - start);
  for (var i = start, ii = 0; i < end; i++, ii++) {
    result[ii] = abv[i];
  }
  return result.buffer;
};

},{}],3:[function(require,module,exports){

/**
 * Expose `Backoff`.
 */

module.exports = Backoff;

/**
 * Initialize backoff timer with `opts`.
 *
 * - `min` initial timeout in milliseconds [100]
 * - `max` max timeout [10000]
 * - `jitter` [0]
 * - `factor` [2]
 *
 * @param {Object} opts
 * @api public
 */

function Backoff(opts) {
  opts = opts || {};
  this.ms = opts.min || 100;
  this.max = opts.max || 10000;
  this.factor = opts.factor || 2;
  this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
  this.attempts = 0;
}

/**
 * Return the backoff duration.
 *
 * @return {Number}
 * @api public
 */

Backoff.prototype.duration = function(){
  var ms = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var rand =  Math.random();
    var deviation = Math.floor(rand * this.jitter * ms);
    ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
  }
  return Math.min(ms, this.max) | 0;
};

/**
 * Reset the number of attempts.
 *
 * @api public
 */

Backoff.prototype.reset = function(){
  this.attempts = 0;
};

/**
 * Set the minimum duration
 *
 * @api public
 */

Backoff.prototype.setMin = function(min){
  this.ms = min;
};

/**
 * Set the maximum duration
 *
 * @api public
 */

Backoff.prototype.setMax = function(max){
  this.max = max;
};

/**
 * Set the jitter
 *
 * @api public
 */

Backoff.prototype.setJitter = function(jitter){
  this.jitter = jitter;
};


},{}],4:[function(require,module,exports){
/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */
(function(){
  "use strict";

  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  // Use a lookup table to find the index.
  var lookup = new Uint8Array(256);
  for (var i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  exports.encode = function(arraybuffer) {
    var bytes = new Uint8Array(arraybuffer),
    i, len = bytes.length, base64 = "";

    for (i = 0; i < len; i+=3) {
      base64 += chars[bytes[i] >> 2];
      base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
      base64 += chars[bytes[i + 2] & 63];
    }

    if ((len % 3) === 2) {
      base64 = base64.substring(0, base64.length - 1) + "=";
    } else if (len % 3 === 1) {
      base64 = base64.substring(0, base64.length - 2) + "==";
    }

    return base64;
  };

  exports.decode =  function(base64) {
    var bufferLength = base64.length * 0.75,
    len = base64.length, i, p = 0,
    encoded1, encoded2, encoded3, encoded4;

    if (base64[base64.length - 1] === "=") {
      bufferLength--;
      if (base64[base64.length - 2] === "=") {
        bufferLength--;
      }
    }

    var arraybuffer = new ArrayBuffer(bufferLength),
    bytes = new Uint8Array(arraybuffer);

    for (i = 0; i < len; i+=4) {
      encoded1 = lookup[base64.charCodeAt(i)];
      encoded2 = lookup[base64.charCodeAt(i+1)];
      encoded3 = lookup[base64.charCodeAt(i+2)];
      encoded4 = lookup[base64.charCodeAt(i+3)];

      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return arraybuffer;
  };
})();

},{}],5:[function(require,module,exports){
(function (global){
/**
 * Create a blob builder even when vendor prefixes exist
 */

var BlobBuilder = global.BlobBuilder
  || global.WebKitBlobBuilder
  || global.MSBlobBuilder
  || global.MozBlobBuilder;

/**
 * Check if Blob constructor is supported
 */

var blobSupported = (function() {
  try {
    var a = new Blob(['hi']);
    return a.size === 2;
  } catch(e) {
    return false;
  }
})();

/**
 * Check if Blob constructor supports ArrayBufferViews
 * Fails in Safari 6, so we need to map to ArrayBuffers there.
 */

var blobSupportsArrayBufferView = blobSupported && (function() {
  try {
    var b = new Blob([new Uint8Array([1,2])]);
    return b.size === 2;
  } catch(e) {
    return false;
  }
})();

/**
 * Check if BlobBuilder is supported
 */

var blobBuilderSupported = BlobBuilder
  && BlobBuilder.prototype.append
  && BlobBuilder.prototype.getBlob;

/**
 * Helper function that maps ArrayBufferViews to ArrayBuffers
 * Used by BlobBuilder constructor and old browsers that didn't
 * support it in the Blob constructor.
 */

function mapArrayBufferViews(ary) {
  for (var i = 0; i < ary.length; i++) {
    var chunk = ary[i];
    if (chunk.buffer instanceof ArrayBuffer) {
      var buf = chunk.buffer;

      // if this is a subarray, make a copy so we only
      // include the subarray region from the underlying buffer
      if (chunk.byteLength !== buf.byteLength) {
        var copy = new Uint8Array(chunk.byteLength);
        copy.set(new Uint8Array(buf, chunk.byteOffset, chunk.byteLength));
        buf = copy.buffer;
      }

      ary[i] = buf;
    }
  }
}

function BlobBuilderConstructor(ary, options) {
  options = options || {};

  var bb = new BlobBuilder();
  mapArrayBufferViews(ary);

  for (var i = 0; i < ary.length; i++) {
    bb.append(ary[i]);
  }

  return (options.type) ? bb.getBlob(options.type) : bb.getBlob();
};

function BlobConstructor(ary, options) {
  mapArrayBufferViews(ary);
  return new Blob(ary, options || {});
};

module.exports = (function() {
  if (blobSupported) {
    return blobSupportsArrayBufferView ? global.Blob : BlobConstructor;
  } else if (blobBuilderSupported) {
    return BlobBuilderConstructor;
  } else {
    return undefined;
  }
})();

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
(function (process,__dirname){
// universal module definition
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.Decoder = factory();
    }
}(this, function () {
  
  var global;
  
  function initglobal(){
    global = this;
    if (!global){
      if (typeof window != "undefined"){
        global = window;
      }else if (typeof self != "undefined"){
        global = self;
      };
    };
  };
  initglobal();
  
  
  function error(message) {
    console.error(message);
    console.trace();
  };

  
  function assert(condition, message) {
    if (!condition) {
      error(message);
    };
  };
  
  
  var getModule = function(par_broadwayOnHeadersDecoded, par_broadwayOnPictureDecoded){
    
    
    /*var ModuleX = {
      'print': function(text) { console.log('stdout: ' + text); },
      'printErr': function(text) { console.log('stderr: ' + text); }
    };*/
    
    
    /*
    
      The reason why this is all packed into one file is that this file can also function as worker.
      you can integrate the file into your build system and provide the original file to be loaded into a worker.
    
    */
    
    var Module = (function(){
    
var Module;if(!Module)Module=(typeof Module!=="undefined"?Module:null)||{};var moduleOverrides={};for(var key in Module){if(Module.hasOwnProperty(key)){moduleOverrides[key]=Module[key]}}var ENVIRONMENT_IS_WEB=typeof window==="object";var ENVIRONMENT_IS_WORKER=typeof importScripts==="function";var ENVIRONMENT_IS_NODE=typeof process==="object"&&typeof null==="function"&&!ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_WORKER;var ENVIRONMENT_IS_SHELL=!ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_NODE&&!ENVIRONMENT_IS_WORKER;if(ENVIRONMENT_IS_NODE){if(!Module["print"])Module["print"]=function print(x){process["stdout"].write(x+"\n")};if(!Module["printErr"])Module["printErr"]=function printErr(x){process["stderr"].write(x+"\n")};var nodeFS=(null)("fs");var nodePath=(null)("path");Module["read"]=function read(filename,binary){filename=nodePath["normalize"](filename);var ret=nodeFS["readFileSync"](filename);if(!ret&&filename!=nodePath["resolve"](filename)){filename=path.join(__dirname,"..","src",filename);ret=nodeFS["readFileSync"](filename)}if(ret&&!binary)ret=ret.toString();return ret};Module["readBinary"]=function readBinary(filename){var ret=Module["read"](filename,true);if(!ret.buffer){ret=new Uint8Array(ret)}assert(ret.buffer);return ret};Module["load"]=function load(f){globalEval(read(f))};if(!Module["thisProgram"]){if(process["argv"].length>1){Module["thisProgram"]=process["argv"][1].replace(/\\/g,"/")}else{Module["thisProgram"]="unknown-program"}}Module["arguments"]=process["argv"].slice(2);if(typeof module!=="undefined"){module["exports"]=Module}process["on"]("uncaughtException",(function(ex){if(!(ex instanceof ExitStatus)){throw ex}}));Module["inspect"]=(function(){return"[Emscripten Module object]"})}else if(ENVIRONMENT_IS_SHELL){if(!Module["print"])Module["print"]=print;if(typeof printErr!="undefined")Module["printErr"]=printErr;if(typeof read!="undefined"){Module["read"]=read}else{Module["read"]=function read(){throw"no read() available (jsc?)"}}Module["readBinary"]=function readBinary(f){if(typeof readbuffer==="function"){return new Uint8Array(readbuffer(f))}var data=read(f,"binary");assert(typeof data==="object");return data};if(typeof scriptArgs!="undefined"){Module["arguments"]=scriptArgs}else if(typeof arguments!="undefined"){Module["arguments"]=arguments}}else if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){Module["read"]=function read(url){var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.send(null);return xhr.responseText};if(typeof arguments!="undefined"){Module["arguments"]=arguments}if(typeof console!=="undefined"){if(!Module["print"])Module["print"]=function print(x){console.log(x)};if(!Module["printErr"])Module["printErr"]=function printErr(x){console.log(x)}}else{var TRY_USE_DUMP=false;if(!Module["print"])Module["print"]=TRY_USE_DUMP&&typeof dump!=="undefined"?(function(x){dump(x)}):(function(x){})}if(ENVIRONMENT_IS_WORKER){Module["load"]=importScripts}if(typeof Module["setWindowTitle"]==="undefined"){Module["setWindowTitle"]=(function(title){document.title=title})}}else{throw"Unknown runtime environment. Where are we?"}function globalEval(x){eval.call(null,x)}if(!Module["load"]&&Module["read"]){Module["load"]=function load(f){globalEval(Module["read"](f))}}if(!Module["print"]){Module["print"]=(function(){})}if(!Module["printErr"]){Module["printErr"]=Module["print"]}if(!Module["arguments"]){Module["arguments"]=[]}if(!Module["thisProgram"]){Module["thisProgram"]="./this.program"}Module.print=Module["print"];Module.printErr=Module["printErr"];Module["preRun"]=[];Module["postRun"]=[];for(var key in moduleOverrides){if(moduleOverrides.hasOwnProperty(key)){Module[key]=moduleOverrides[key]}}var Runtime={setTempRet0:(function(value){tempRet0=value}),getTempRet0:(function(){return tempRet0}),stackSave:(function(){return STACKTOP}),stackRestore:(function(stackTop){STACKTOP=stackTop}),getNativeTypeSize:(function(type){switch(type){case"i1":case"i8":return 1;case"i16":return 2;case"i32":return 4;case"i64":return 8;case"float":return 4;case"double":return 8;default:{if(type[type.length-1]==="*"){return Runtime.QUANTUM_SIZE}else if(type[0]==="i"){var bits=parseInt(type.substr(1));assert(bits%8===0);return bits/8}else{return 0}}}}),getNativeFieldSize:(function(type){return Math.max(Runtime.getNativeTypeSize(type),Runtime.QUANTUM_SIZE)}),STACK_ALIGN:16,prepVararg:(function(ptr,type){if(type==="double"||type==="i64"){if(ptr&7){assert((ptr&7)===4);ptr+=4}}else{assert((ptr&3)===0)}return ptr}),getAlignSize:(function(type,size,vararg){if(!vararg&&(type=="i64"||type=="double"))return 8;if(!type)return Math.min(size,8);return Math.min(size||(type?Runtime.getNativeFieldSize(type):0),Runtime.QUANTUM_SIZE)}),dynCall:(function(sig,ptr,args){if(args&&args.length){if(!args.splice)args=Array.prototype.slice.call(args);args.splice(0,0,ptr);return Module["dynCall_"+sig].apply(null,args)}else{return Module["dynCall_"+sig].call(null,ptr)}}),functionPointers:[],addFunction:(function(func){for(var i=0;i<Runtime.functionPointers.length;i++){if(!Runtime.functionPointers[i]){Runtime.functionPointers[i]=func;return 2*(1+i)}}throw"Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS."}),removeFunction:(function(index){Runtime.functionPointers[(index-2)/2]=null}),warnOnce:(function(text){if(!Runtime.warnOnce.shown)Runtime.warnOnce.shown={};if(!Runtime.warnOnce.shown[text]){Runtime.warnOnce.shown[text]=1;Module.printErr(text)}}),funcWrappers:{},getFuncWrapper:(function(func,sig){assert(sig);if(!Runtime.funcWrappers[sig]){Runtime.funcWrappers[sig]={}}var sigCache=Runtime.funcWrappers[sig];if(!sigCache[func]){sigCache[func]=function dynCall_wrapper(){return Runtime.dynCall(sig,func,arguments)}}return sigCache[func]}),getCompilerSetting:(function(name){throw"You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work"}),stackAlloc:(function(size){var ret=STACKTOP;STACKTOP=STACKTOP+size|0;STACKTOP=STACKTOP+15&-16;return ret}),staticAlloc:(function(size){var ret=STATICTOP;STATICTOP=STATICTOP+size|0;STATICTOP=STATICTOP+15&-16;return ret}),dynamicAlloc:(function(size){var ret=DYNAMICTOP;DYNAMICTOP=DYNAMICTOP+size|0;DYNAMICTOP=DYNAMICTOP+15&-16;if(DYNAMICTOP>=TOTAL_MEMORY){var success=enlargeMemory();if(!success){DYNAMICTOP=ret;return 0}}return ret}),alignMemory:(function(size,quantum){var ret=size=Math.ceil(size/(quantum?quantum:16))*(quantum?quantum:16);return ret}),makeBigInt:(function(low,high,unsigned){var ret=unsigned?+(low>>>0)+ +(high>>>0)*+4294967296:+(low>>>0)+ +(high|0)*+4294967296;return ret}),GLOBAL_BASE:8,QUANTUM_SIZE:4,__dummy__:0};Module["Runtime"]=Runtime;var __THREW__=0;var ABORT=false;var EXITSTATUS=0;var undef=0;var tempValue,tempInt,tempBigInt,tempInt2,tempBigInt2,tempPair,tempBigIntI,tempBigIntR,tempBigIntS,tempBigIntP,tempBigIntD,tempDouble,tempFloat;var tempI64,tempI64b;var tempRet0,tempRet1,tempRet2,tempRet3,tempRet4,tempRet5,tempRet6,tempRet7,tempRet8,tempRet9;function assert(condition,text){if(!condition){abort("Assertion failed: "+text)}}var globalScope=this;function getCFunc(ident){var func=Module["_"+ident];if(!func){try{func=eval("_"+ident)}catch(e){}}assert(func,"Cannot call unknown function "+ident+" (perhaps LLVM optimizations or closure removed it?)");return func}var cwrap,ccall;((function(){var JSfuncs={"stackSave":(function(){Runtime.stackSave()}),"stackRestore":(function(){Runtime.stackRestore()}),"arrayToC":(function(arr){var ret=Runtime.stackAlloc(arr.length);writeArrayToMemory(arr,ret);return ret}),"stringToC":(function(str){var ret=0;if(str!==null&&str!==undefined&&str!==0){ret=Runtime.stackAlloc((str.length<<2)+1);writeStringToMemory(str,ret)}return ret})};var toC={"string":JSfuncs["stringToC"],"array":JSfuncs["arrayToC"]};ccall=function ccallFunc(ident,returnType,argTypes,args,opts){var func=getCFunc(ident);var cArgs=[];var stack=0;if(args){for(var i=0;i<args.length;i++){var converter=toC[argTypes[i]];if(converter){if(stack===0)stack=Runtime.stackSave();cArgs[i]=converter(args[i])}else{cArgs[i]=args[i]}}}var ret=func.apply(null,cArgs);if(returnType==="string")ret=Pointer_stringify(ret);if(stack!==0){if(opts&&opts.async){EmterpreterAsync.asyncFinalizers.push((function(){Runtime.stackRestore(stack)}));return}Runtime.stackRestore(stack)}return ret};var sourceRegex=/^function\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;function parseJSFunc(jsfunc){var parsed=jsfunc.toString().match(sourceRegex).slice(1);return{arguments:parsed[0],body:parsed[1],returnValue:parsed[2]}}var JSsource={};for(var fun in JSfuncs){if(JSfuncs.hasOwnProperty(fun)){JSsource[fun]=parseJSFunc(JSfuncs[fun])}}cwrap=function cwrap(ident,returnType,argTypes){argTypes=argTypes||[];var cfunc=getCFunc(ident);var numericArgs=argTypes.every((function(type){return type==="number"}));var numericRet=returnType!=="string";if(numericRet&&numericArgs){return cfunc}var argNames=argTypes.map((function(x,i){return"$"+i}));var funcstr="(function("+argNames.join(",")+") {";var nargs=argTypes.length;if(!numericArgs){funcstr+="var stack = "+JSsource["stackSave"].body+";";for(var i=0;i<nargs;i++){var arg=argNames[i],type=argTypes[i];if(type==="number")continue;var convertCode=JSsource[type+"ToC"];funcstr+="var "+convertCode.arguments+" = "+arg+";";funcstr+=convertCode.body+";";funcstr+=arg+"="+convertCode.returnValue+";"}}var cfuncname=parseJSFunc((function(){return cfunc})).returnValue;funcstr+="var ret = "+cfuncname+"("+argNames.join(",")+");";if(!numericRet){var strgfy=parseJSFunc((function(){return Pointer_stringify})).returnValue;funcstr+="ret = "+strgfy+"(ret);"}if(!numericArgs){funcstr+=JSsource["stackRestore"].body.replace("()","(stack)")+";"}funcstr+="return ret})";return eval(funcstr)}}))();Module["ccall"]=ccall;Module["cwrap"]=cwrap;function setValue(ptr,value,type,noSafe){type=type||"i8";if(type.charAt(type.length-1)==="*")type="i32";switch(type){case"i1":HEAP8[ptr>>0]=value;break;case"i8":HEAP8[ptr>>0]=value;break;case"i16":HEAP16[ptr>>1]=value;break;case"i32":HEAP32[ptr>>2]=value;break;case"i64":tempI64=[value>>>0,(tempDouble=value,+Math_abs(tempDouble)>=+1?tempDouble>+0?(Math_min(+Math_floor(tempDouble/+4294967296),+4294967295)|0)>>>0:~~+Math_ceil((tempDouble- +(~~tempDouble>>>0))/+4294967296)>>>0:0)],HEAP32[ptr>>2]=tempI64[0],HEAP32[ptr+4>>2]=tempI64[1];break;case"float":HEAPF32[ptr>>2]=value;break;case"double":HEAPF64[ptr>>3]=value;break;default:abort("invalid type for setValue: "+type)}}Module["setValue"]=setValue;function getValue(ptr,type,noSafe){type=type||"i8";if(type.charAt(type.length-1)==="*")type="i32";switch(type){case"i1":return HEAP8[ptr>>0];case"i8":return HEAP8[ptr>>0];case"i16":return HEAP16[ptr>>1];case"i32":return HEAP32[ptr>>2];case"i64":return HEAP32[ptr>>2];case"float":return HEAPF32[ptr>>2];case"double":return HEAPF64[ptr>>3];default:abort("invalid type for setValue: "+type)}return null}Module["getValue"]=getValue;var ALLOC_NORMAL=0;var ALLOC_STACK=1;var ALLOC_STATIC=2;var ALLOC_DYNAMIC=3;var ALLOC_NONE=4;Module["ALLOC_NORMAL"]=ALLOC_NORMAL;Module["ALLOC_STACK"]=ALLOC_STACK;Module["ALLOC_STATIC"]=ALLOC_STATIC;Module["ALLOC_DYNAMIC"]=ALLOC_DYNAMIC;Module["ALLOC_NONE"]=ALLOC_NONE;function allocate(slab,types,allocator,ptr){var zeroinit,size;if(typeof slab==="number"){zeroinit=true;size=slab}else{zeroinit=false;size=slab.length}var singleType=typeof types==="string"?types:null;var ret;if(allocator==ALLOC_NONE){ret=ptr}else{ret=[_malloc,Runtime.stackAlloc,Runtime.staticAlloc,Runtime.dynamicAlloc][allocator===undefined?ALLOC_STATIC:allocator](Math.max(size,singleType?1:types.length))}if(zeroinit){var ptr=ret,stop;assert((ret&3)==0);stop=ret+(size&~3);for(;ptr<stop;ptr+=4){HEAP32[ptr>>2]=0}stop=ret+size;while(ptr<stop){HEAP8[ptr++>>0]=0}return ret}if(singleType==="i8"){if(slab.subarray||slab.slice){HEAPU8.set(slab,ret)}else{HEAPU8.set(new Uint8Array(slab),ret)}return ret}var i=0,type,typeSize,previousType;while(i<size){var curr=slab[i];if(typeof curr==="function"){curr=Runtime.getFunctionIndex(curr)}type=singleType||types[i];if(type===0){i++;continue}if(type=="i64")type="i32";setValue(ret+i,curr,type);if(previousType!==type){typeSize=Runtime.getNativeTypeSize(type);previousType=type}i+=typeSize}return ret}Module["allocate"]=allocate;function getMemory(size){if(!staticSealed)return Runtime.staticAlloc(size);if(typeof _sbrk!=="undefined"&&!_sbrk.called||!runtimeInitialized)return Runtime.dynamicAlloc(size);return _malloc(size)}Module["getMemory"]=getMemory;function Pointer_stringify(ptr,length){if(length===0||!ptr)return"";var hasUtf=0;var t;var i=0;while(1){t=HEAPU8[ptr+i>>0];hasUtf|=t;if(t==0&&!length)break;i++;if(length&&i==length)break}if(!length)length=i;var ret="";if(hasUtf<128){var MAX_CHUNK=1024;var curr;while(length>0){curr=String.fromCharCode.apply(String,HEAPU8.subarray(ptr,ptr+Math.min(length,MAX_CHUNK)));ret=ret?ret+curr:curr;ptr+=MAX_CHUNK;length-=MAX_CHUNK}return ret}return Module["UTF8ToString"](ptr)}Module["Pointer_stringify"]=Pointer_stringify;function AsciiToString(ptr){var str="";while(1){var ch=HEAP8[ptr++>>0];if(!ch)return str;str+=String.fromCharCode(ch)}}Module["AsciiToString"]=AsciiToString;function stringToAscii(str,outPtr){return writeAsciiToMemory(str,outPtr,false)}Module["stringToAscii"]=stringToAscii;function UTF8ArrayToString(u8Array,idx){var u0,u1,u2,u3,u4,u5;var str="";while(1){u0=u8Array[idx++];if(!u0)return str;if(!(u0&128)){str+=String.fromCharCode(u0);continue}u1=u8Array[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}u2=u8Array[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2}else{u3=u8Array[idx++]&63;if((u0&248)==240){u0=(u0&7)<<18|u1<<12|u2<<6|u3}else{u4=u8Array[idx++]&63;if((u0&252)==248){u0=(u0&3)<<24|u1<<18|u2<<12|u3<<6|u4}else{u5=u8Array[idx++]&63;u0=(u0&1)<<30|u1<<24|u2<<18|u3<<12|u4<<6|u5}}}if(u0<65536){str+=String.fromCharCode(u0)}else{var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023)}}}Module["UTF8ArrayToString"]=UTF8ArrayToString;function UTF8ToString(ptr){return UTF8ArrayToString(HEAPU8,ptr)}Module["UTF8ToString"]=UTF8ToString;function stringToUTF8Array(str,outU8Array,outIdx,maxBytesToWrite){if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343)u=65536+((u&1023)<<10)|str.charCodeAt(++i)&1023;if(u<=127){if(outIdx>=endIdx)break;outU8Array[outIdx++]=u}else if(u<=2047){if(outIdx+1>=endIdx)break;outU8Array[outIdx++]=192|u>>6;outU8Array[outIdx++]=128|u&63}else if(u<=65535){if(outIdx+2>=endIdx)break;outU8Array[outIdx++]=224|u>>12;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63}else if(u<=2097151){if(outIdx+3>=endIdx)break;outU8Array[outIdx++]=240|u>>18;outU8Array[outIdx++]=128|u>>12&63;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63}else if(u<=67108863){if(outIdx+4>=endIdx)break;outU8Array[outIdx++]=248|u>>24;outU8Array[outIdx++]=128|u>>18&63;outU8Array[outIdx++]=128|u>>12&63;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63}else{if(outIdx+5>=endIdx)break;outU8Array[outIdx++]=252|u>>30;outU8Array[outIdx++]=128|u>>24&63;outU8Array[outIdx++]=128|u>>18&63;outU8Array[outIdx++]=128|u>>12&63;outU8Array[outIdx++]=128|u>>6&63;outU8Array[outIdx++]=128|u&63}}outU8Array[outIdx]=0;return outIdx-startIdx}Module["stringToUTF8Array"]=stringToUTF8Array;function stringToUTF8(str,outPtr,maxBytesToWrite){return stringToUTF8Array(str,HEAPU8,outPtr,maxBytesToWrite)}Module["stringToUTF8"]=stringToUTF8;function lengthBytesUTF8(str){var len=0;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343)u=65536+((u&1023)<<10)|str.charCodeAt(++i)&1023;if(u<=127){++len}else if(u<=2047){len+=2}else if(u<=65535){len+=3}else if(u<=2097151){len+=4}else if(u<=67108863){len+=5}else{len+=6}}return len}Module["lengthBytesUTF8"]=lengthBytesUTF8;function UTF16ToString(ptr){var i=0;var str="";while(1){var codeUnit=HEAP16[ptr+i*2>>1];if(codeUnit==0)return str;++i;str+=String.fromCharCode(codeUnit)}}Module["UTF16ToString"]=UTF16ToString;function stringToUTF16(str,outPtr,maxBytesToWrite){if(maxBytesToWrite===undefined){maxBytesToWrite=2147483647}if(maxBytesToWrite<2)return 0;maxBytesToWrite-=2;var startPtr=outPtr;var numCharsToWrite=maxBytesToWrite<str.length*2?maxBytesToWrite/2:str.length;for(var i=0;i<numCharsToWrite;++i){var codeUnit=str.charCodeAt(i);HEAP16[outPtr>>1]=codeUnit;outPtr+=2}HEAP16[outPtr>>1]=0;return outPtr-startPtr}Module["stringToUTF16"]=stringToUTF16;function lengthBytesUTF16(str){return str.length*2}Module["lengthBytesUTF16"]=lengthBytesUTF16;function UTF32ToString(ptr){var i=0;var str="";while(1){var utf32=HEAP32[ptr+i*4>>2];if(utf32==0)return str;++i;if(utf32>=65536){var ch=utf32-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023)}else{str+=String.fromCharCode(utf32)}}}Module["UTF32ToString"]=UTF32ToString;function stringToUTF32(str,outPtr,maxBytesToWrite){if(maxBytesToWrite===undefined){maxBytesToWrite=2147483647}if(maxBytesToWrite<4)return 0;var startPtr=outPtr;var endPtr=startPtr+maxBytesToWrite-4;for(var i=0;i<str.length;++i){var codeUnit=str.charCodeAt(i);if(codeUnit>=55296&&codeUnit<=57343){var trailSurrogate=str.charCodeAt(++i);codeUnit=65536+((codeUnit&1023)<<10)|trailSurrogate&1023}HEAP32[outPtr>>2]=codeUnit;outPtr+=4;if(outPtr+4>endPtr)break}HEAP32[outPtr>>2]=0;return outPtr-startPtr}Module["stringToUTF32"]=stringToUTF32;function lengthBytesUTF32(str){var len=0;for(var i=0;i<str.length;++i){var codeUnit=str.charCodeAt(i);if(codeUnit>=55296&&codeUnit<=57343)++i;len+=4}return len}Module["lengthBytesUTF32"]=lengthBytesUTF32;function demangle(func){var hasLibcxxabi=!!Module["___cxa_demangle"];if(hasLibcxxabi){try{var buf=_malloc(func.length);writeStringToMemory(func.substr(1),buf);var status=_malloc(4);var ret=Module["___cxa_demangle"](buf,0,0,status);if(getValue(status,"i32")===0&&ret){return Pointer_stringify(ret)}}catch(e){}finally{if(buf)_free(buf);if(status)_free(status);if(ret)_free(ret)}}var i=3;var basicTypes={"v":"void","b":"bool","c":"char","s":"short","i":"int","l":"long","f":"float","d":"double","w":"wchar_t","a":"signed char","h":"unsigned char","t":"unsigned short","j":"unsigned int","m":"unsigned long","x":"long long","y":"unsigned long long","z":"..."};var subs=[];var first=true;function dump(x){if(x)Module.print(x);Module.print(func);var pre="";for(var a=0;a<i;a++)pre+=" ";Module.print(pre+"^")}function parseNested(){i++;if(func[i]==="K")i++;var parts=[];while(func[i]!=="E"){if(func[i]==="S"){i++;var next=func.indexOf("_",i);var num=func.substring(i,next)||0;parts.push(subs[num]||"?");i=next+1;continue}if(func[i]==="C"){parts.push(parts[parts.length-1]);i+=2;continue}var size=parseInt(func.substr(i));var pre=size.toString().length;if(!size||!pre){i--;break}var curr=func.substr(i+pre,size);parts.push(curr);subs.push(curr);i+=pre+size}i++;return parts}function parse(rawList,limit,allowVoid){limit=limit||Infinity;var ret="",list=[];function flushList(){return"("+list.join(", ")+")"}var name;if(func[i]==="N"){name=parseNested().join("::");limit--;if(limit===0)return rawList?[name]:name}else{if(func[i]==="K"||first&&func[i]==="L")i++;var size=parseInt(func.substr(i));if(size){var pre=size.toString().length;name=func.substr(i+pre,size);i+=pre+size}}first=false;if(func[i]==="I"){i++;var iList=parse(true);var iRet=parse(true,1,true);ret+=iRet[0]+" "+name+"<"+iList.join(", ")+">"}else{ret=name}paramLoop:while(i<func.length&&limit-->0){var c=func[i++];if(c in basicTypes){list.push(basicTypes[c])}else{switch(c){case"P":list.push(parse(true,1,true)[0]+"*");break;case"R":list.push(parse(true,1,true)[0]+"&");break;case"L":{i++;var end=func.indexOf("E",i);var size=end-i;list.push(func.substr(i,size));i+=size+2;break};case"A":{var size=parseInt(func.substr(i));i+=size.toString().length;if(func[i]!=="_")throw"?";i++;list.push(parse(true,1,true)[0]+" ["+size+"]");break};case"E":break paramLoop;default:ret+="?"+c;break paramLoop}}}if(!allowVoid&&list.length===1&&list[0]==="void")list=[];if(rawList){if(ret){list.push(ret+"?")}return list}else{return ret+flushList()}}var parsed=func;try{if(func=="Object._main"||func=="_main"){return"main()"}if(typeof func==="number")func=Pointer_stringify(func);if(func[0]!=="_")return func;if(func[1]!=="_")return func;if(func[2]!=="Z")return func;switch(func[3]){case"n":return"operator new()";case"d":return"operator delete()"}parsed=parse()}catch(e){parsed+="?"}if(parsed.indexOf("?")>=0&&!hasLibcxxabi){Runtime.warnOnce("warning: a problem occurred in builtin C++ name demangling; build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling")}return parsed}function demangleAll(text){return text.replace(/__Z[\w\d_]+/g,(function(x){var y=demangle(x);return x===y?x:x+" ["+y+"]"}))}function jsStackTrace(){var err=new Error;if(!err.stack){try{throw new Error(0)}catch(e){err=e}if(!err.stack){return"(no stack trace available)"}}return err.stack.toString()}function stackTrace(){return demangleAll(jsStackTrace())}Module["stackTrace"]=stackTrace;var PAGE_SIZE=4096;function alignMemoryPage(x){if(x%4096>0){x+=4096-x%4096}return x}var HEAP;var HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAPF64;var STATIC_BASE=0,STATICTOP=0,staticSealed=false;var STACK_BASE=0,STACKTOP=0,STACK_MAX=0;var DYNAMIC_BASE=0,DYNAMICTOP=0;function abortOnCannotGrowMemory(){abort("Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value "+TOTAL_MEMORY+", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which adjusts the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ")}function enlargeMemory(){abortOnCannotGrowMemory()}var TOTAL_STACK=Module["TOTAL_STACK"]||5242880;var TOTAL_MEMORY=Module["TOTAL_MEMORY"]||52428800;var totalMemory=64*1024;while(totalMemory<TOTAL_MEMORY||totalMemory<2*TOTAL_STACK){if(totalMemory<16*1024*1024){totalMemory*=2}else{totalMemory+=16*1024*1024}}if(totalMemory!==TOTAL_MEMORY){TOTAL_MEMORY=totalMemory}assert(typeof Int32Array!=="undefined"&&typeof Float64Array!=="undefined"&&!!(new Int32Array(1))["subarray"]&&!!(new Int32Array(1))["set"],"JS engine does not provide full typed array support");var buffer;buffer=new ArrayBuffer(TOTAL_MEMORY);HEAP8=new Int8Array(buffer);HEAP16=new Int16Array(buffer);HEAP32=new Int32Array(buffer);HEAPU8=new Uint8Array(buffer);HEAPU16=new Uint16Array(buffer);HEAPU32=new Uint32Array(buffer);HEAPF32=new Float32Array(buffer);HEAPF64=new Float64Array(buffer);HEAP32[0]=255;assert(HEAPU8[0]===255&&HEAPU8[3]===0,"Typed arrays 2 must be run on a little-endian system");Module["HEAP"]=HEAP;Module["buffer"]=buffer;Module["HEAP8"]=HEAP8;Module["HEAP16"]=HEAP16;Module["HEAP32"]=HEAP32;Module["HEAPU8"]=HEAPU8;Module["HEAPU16"]=HEAPU16;Module["HEAPU32"]=HEAPU32;Module["HEAPF32"]=HEAPF32;Module["HEAPF64"]=HEAPF64;function callRuntimeCallbacks(callbacks){while(callbacks.length>0){var callback=callbacks.shift();if(typeof callback=="function"){callback();continue}var func=callback.func;if(typeof func==="number"){if(callback.arg===undefined){Runtime.dynCall("v",func)}else{Runtime.dynCall("vi",func,[callback.arg])}}else{func(callback.arg===undefined?null:callback.arg)}}}var __ATPRERUN__=[];var __ATINIT__=[];var __ATMAIN__=[];var __ATEXIT__=[];var __ATPOSTRUN__=[];var runtimeInitialized=false;var runtimeExited=false;function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift())}}callRuntimeCallbacks(__ATPRERUN__)}function ensureInitRuntime(){if(runtimeInitialized)return;runtimeInitialized=true;callRuntimeCallbacks(__ATINIT__)}function preMain(){callRuntimeCallbacks(__ATMAIN__)}function exitRuntime(){callRuntimeCallbacks(__ATEXIT__);runtimeExited=true}function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift())}}callRuntimeCallbacks(__ATPOSTRUN__)}function addOnPreRun(cb){__ATPRERUN__.unshift(cb)}Module["addOnPreRun"]=addOnPreRun;function addOnInit(cb){__ATINIT__.unshift(cb)}Module["addOnInit"]=addOnInit;function addOnPreMain(cb){__ATMAIN__.unshift(cb)}Module["addOnPreMain"]=addOnPreMain;function addOnExit(cb){__ATEXIT__.unshift(cb)}Module["addOnExit"]=addOnExit;function addOnPostRun(cb){__ATPOSTRUN__.unshift(cb)}Module["addOnPostRun"]=addOnPostRun;function intArrayFromString(stringy,dontAddNull,length){var len=length>0?length:lengthBytesUTF8(stringy)+1;var u8array=new Array(len);var numBytesWritten=stringToUTF8Array(stringy,u8array,0,u8array.length);if(dontAddNull)u8array.length=numBytesWritten;return u8array}Module["intArrayFromString"]=intArrayFromString;function intArrayToString(array){var ret=[];for(var i=0;i<array.length;i++){var chr=array[i];if(chr>255){chr&=255}ret.push(String.fromCharCode(chr))}return ret.join("")}Module["intArrayToString"]=intArrayToString;function writeStringToMemory(string,buffer,dontAddNull){var array=intArrayFromString(string,dontAddNull);var i=0;while(i<array.length){var chr=array[i];HEAP8[buffer+i>>0]=chr;i=i+1}}Module["writeStringToMemory"]=writeStringToMemory;function writeArrayToMemory(array,buffer){for(var i=0;i<array.length;i++){HEAP8[buffer++>>0]=array[i]}}Module["writeArrayToMemory"]=writeArrayToMemory;function writeAsciiToMemory(str,buffer,dontAddNull){for(var i=0;i<str.length;++i){HEAP8[buffer++>>0]=str.charCodeAt(i)}if(!dontAddNull)HEAP8[buffer>>0]=0}Module["writeAsciiToMemory"]=writeAsciiToMemory;function unSign(value,bits,ignore){if(value>=0){return value}return bits<=32?2*Math.abs(1<<bits-1)+value:Math.pow(2,bits)+value}function reSign(value,bits,ignore){if(value<=0){return value}var half=bits<=32?Math.abs(1<<bits-1):Math.pow(2,bits-1);if(value>=half&&(bits<=32||value>half)){value=-2*half+value}return value}if(!Math["imul"]||Math["imul"](4294967295,5)!==-5)Math["imul"]=function imul(a,b){var ah=a>>>16;var al=a&65535;var bh=b>>>16;var bl=b&65535;return al*bl+(ah*bl+al*bh<<16)|0};Math.imul=Math["imul"];if(!Math["clz32"])Math["clz32"]=(function(x){x=x>>>0;for(var i=0;i<32;i++){if(x&1<<31-i)return i}return 32});Math.clz32=Math["clz32"];var Math_abs=Math.abs;var Math_cos=Math.cos;var Math_sin=Math.sin;var Math_tan=Math.tan;var Math_acos=Math.acos;var Math_asin=Math.asin;var Math_atan=Math.atan;var Math_atan2=Math.atan2;var Math_exp=Math.exp;var Math_log=Math.log;var Math_sqrt=Math.sqrt;var Math_ceil=Math.ceil;var Math_floor=Math.floor;var Math_pow=Math.pow;var Math_imul=Math.imul;var Math_fround=Math.fround;var Math_min=Math.min;var Math_clz32=Math.clz32;var runDependencies=0;var runDependencyWatcher=null;var dependenciesFulfilled=null;function getUniqueRunDependency(id){return id}function addRunDependency(id){runDependencies++;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}}Module["addRunDependency"]=addRunDependency;function removeRunDependency(id){runDependencies--;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}if(runDependencies==0){if(runDependencyWatcher!==null){clearInterval(runDependencyWatcher);runDependencyWatcher=null}if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback()}}}Module["removeRunDependency"]=removeRunDependency;Module["preloadedImages"]={};Module["preloadedAudios"]={};var memoryInitializer=null;var ASM_CONSTS=[];STATIC_BASE=8;STATICTOP=STATIC_BASE+8896;__ATINIT__.push();allocate([10,0,0,0,13,0,0,0,16,0,0,0,11,0,0,0,14,0,0,0,18,0,0,0,13,0,0,0,16,0,0,0,20,0,0,0,14,0,0,0,18,0,0,0,23,0,0,0,16,0,0,0,20,0,0,0,25,0,0,0,18,0,0,0,23,0,0,0,29,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,12,0,0,0,13,0,0,0,14,0,0,0,15,0,0,0,16,0,0,0,17,0,0,0,18,0,0,0,19,0,0,0,20,0,0,0,21,0,0,0,22,0,0,0,23,0,0,0,24,0,0,0,25,0,0,0,26,0,0,0,27,0,0,0,28,0,0,0,29,0,0,0,29,0,0,0,30,0,0,0,31,0,0,0,32,0,0,0,32,0,0,0,33,0,0,0,34,0,0,0,34,0,0,0,35,0,0,0,35,0,0,0,36,0,0,0,36,0,0,0,37,0,0,0,37,0,0,0,37,0,0,0,38,0,0,0,38,0,0,0,38,0,0,0,39,0,0,0,39,0,0,0,39,0,0,0,39,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,0,0,0,0,1,0,0,0,4,0,0,0,5,0,0,0,2,0,0,0,3,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,12,0,0,0,13,0,0,0,10,0,0,0,11,0,0,0,14,0,0,0,15,0,0,0,0,0,0,0,5,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,4,0,0,0,2,0,0,0,4,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,0,0,0,0,13,0,0,0,4,0,0,0,8,0,0,0,0,0,0,0,15,0,0,0,4,0,0,0,10,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,12,0,0,0,4,0,0,0,11,0,0,0,4,0,0,0,14,0,0,0,0,0,0,0,17,0,0,0,4,0,0,0,16,0,0,0,0,0,0,0,19,0,0,0,4,0,0,0,18,0,0,0,0,0,0,0,21,0,0,0,4,0,0,0,20,0,0,0,0,0,0,0,23,0,0,0,4,0,0,0,22,0,0,0,1,0,0,0,10,0,0,0,1,0,0,0,11,0,0,0,4,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,1,0,0,0,14,0,0,0,1,0,0,0,15,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,4,0,0,0,2,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,8,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,7,0,0,0,4,0,0,0,12,0,0,0,4,0,0,0,13,0,0,0,1,0,0,0,18,0,0,0,1,0,0,0,19,0,0,0,4,0,0,0,16,0,0,0,4,0,0,0,17,0,0,0,1,0,0,0,22,0,0,0,1,0,0,0,23,0,0,0,4,0,0,0,20,0,0,0,4,0,0,0,21,0,0,0,1,0,0,0,11,0,0,0,1,0,0,0,14,0,0,0,4,0,0,0,1,0,0,0,255,0,0,0,4,0,0,0,1,0,0,0,15,0,0,0,2,0,0,0,10,0,0,0,4,0,0,0,5,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,9,0,0,0,255,0,0,0,12,0,0,0,4,0,0,0,7,0,0,0,255,0,0,0,2,0,0,0,4,0,0,0,13,0,0,0,255,0,0,0,8,0,0,0,1,0,0,0,19,0,0,0,2,0,0,0,18,0,0,0,4,0,0,0,17,0,0,0,255,0,0,0,16,0,0,0,1,0,0,0,23,0,0,0,2,0,0,0,22,0,0,0,4,0,0,0,21,0,0,0,255,0,0,0,20,0,0,0,3,0,0,0,15,0,0,0,1,0,0,0,10,0,0,0,0,0,0,0,5,0,0,0,4,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,1,0,0,0,14,0,0,0,4,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,7,0,0,0,4,0,0,0,2,0,0,0,0,0,0,0,13,0,0,0,4,0,0,0,8,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,12,0,0,0,3,0,0,0,19,0,0,0,1,0,0,0,18,0,0,0,0,0,0,0,17,0,0,0,4,0,0,0,16,0,0,0,3,0,0,0,23,0,0,0,1,0,0,0,22,0,0,0,0,0,0,0,21,0,0,0,4,0,0,0,20,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,4,0,0,0,8,0,0,0,12,0,0,0,8,0,0,0,12,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,4,0,0,0,8,0,0,0,12,0,0,0,8,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,4,0,0,0,8,0,0,0,8,0,0,0,12,0,0,0,12,0,0,0,8,0,0,0,8,0,0,0,12,0,0,0,12,0,0,0,0,0,0,0,5,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,7,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,4,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,4,0,0,0,2,0,0,0,4,0,0,0,1,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,4,0,0,0,3,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,0,0,0,0,13,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,13,0,0,0,0,0,0,0,15,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,13,0,0,0,4,0,0,0,8,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,13,0,0,0,4,0,0,0,8,0,0,0,0,0,0,0,15,0,0,0,4,0,0,0,10,0,0,0,4,0,0,0,9,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,11,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,12,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,12,0,0,0,4,0,0,0,11,0,0,0,4,0,0,0,14,0,0,0,1,0,0,0,10,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,10,0,0,0,4,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,10,0,0,0,1,0,0,0,11,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,10,0,0,0,1,0,0,0,11,0,0,0,4,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,1,0,0,0,14,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,14,0,0,0,4,0,0,0,4,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,14,0,0,0,1,0,0,0,15,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,14,0,0,0,1,0,0,0,15,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,4,0,0,0,2,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,2,0,0,0,4,0,0,0,8,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,2,0,0,0,4,0,0,0,3,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,2,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,8,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,6,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,12,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,7,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,7,0,0,0,4,0,0,0,12,0,0,0,4,0,0,0,13,0,0,0,1,0,0,0,14,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,14,0,0,0,255,0,0,0,4,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,1,0,0,0,14,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,1,0,0,0,14,0,0,0,4,0,0,0,1,0,0,0,255,0,0,0,4,0,0,0,2,0,0,0,10,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,2,0,0,0,10,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,15,0,0,0,2,0,0,0,10,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,15,0,0,0,2,0,0,0,10,0,0,0,4,0,0,0,5,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,6,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,6,0,0,0,255,0,0,0,12,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,9,0,0,0,255,0,0,0,12,0,0,0,255,0,0,0,2,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,2,0,0,0,255,0,0,0,8,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,7,0,0,0,255,0,0,0,2,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,7,0,0,0,255,0,0,0,2,0,0,0,4,0,0,0,13,0,0,0,255,0,0,0,8,0,0,0,3,0,0,0,15,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,3,0,0,0,15,0,0,0,0,0,0,0,5,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,3,0,0,0,15,0,0,0,1,0,0,0,10,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,3,0,0,0,15,0,0,0,1,0,0,0,10,0,0,0,0,0,0,0,5,0,0,0,4,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,4,0,0,0,1,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,1,0,0,0,14,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,1,0,0,0,14,0,0,0,4,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,7,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,13,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,4,0,0,0,2,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,4,0,0,0,2,0,0,0,0,0,0,0,13,0,0,0,4,0,0,0,8,0,0,0,4,0,0,0,3,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,9,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,255,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,4,0,0,0,9,0,0,0,4,0,0,0,12,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,12,0,0,0,13,0,0,0,14,0,0,0,15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,192,30,0,0,0,4,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,102,32,38,16,6,8,101,24,101,24,67,16,67,16,67,16,67,16,67,16,67,16,67,16,67,16,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,8,34,8,0,0,0,0,0,0,0,0,106,64,74,48,42,40,10,32,105,56,105,56,73,40,73,40,41,32,41,32,9,24,9,24,104,48,104,48,104,48,104,48,72,32,72,32,72,32,72,32,40,24,40,24,40,24,40,24,8,16,8,16,8,16,8,16,103,40,103,40,103,40,103,40,103,40,103,40,103,40,103,40,71,24,71,24,71,24,71,24,71,24,71,24,71,24,71,24,110,96,78,88,46,80,14,80,110,88,78,80,46,72,14,72,13,64,13,64,77,72,77,72,45,64,45,64,13,56,13,56,109,80,109,80,77,64,77,64,45,56,45,56,13,48,13,48,107,72,107,72,107,72,107,72,107,72,107,72,107,72,107,72,75,56,75,56,75,56,75,56,75,56,75,56,75,56,75,56,43,48,43,48,43,48,43,48,43,48,43,48,43,48,43,48,11,40,11,40,11,40,11,40,11,40,11,40,11,40,11,40,0,0,0,0,47,104,47,104,16,128,80,128,48,128,16,120,112,128,80,120,48,120,16,112,112,120,80,112,48,112,16,104,111,112,111,112,79,104,79,104,47,96,47,96,15,96,15,96,111,104,111,104,79,96,79,96,47,88,47,88,15,88,15,88,0,0,0,0,0,0,0,0,102,56,70,32,38,32,6,16,102,48,70,24,38,24,6,8,101,40,101,40,37,16,37,16,100,32,100,32,100,32,100,32,100,24,100,24,100,24,100,24,67,16,67,16,67,16,67,16,67,16,67,16,67,16,67,16,0,0,0,0,0,0,0,0,105,72,73,56,41,56,9,48,8,40,8,40,72,48,72,48,40,48,40,48,8,32,8,32,103,64,103,64,103,64,103,64,71,40,71,40,71,40,71,40,39,40,39,40,39,40,39,40,7,24,7,24,7,24,7,24,0,0,0,0,109,120,109,120,110,128,78,128,46,128,14,128,46,120,14,120,78,120,46,112,77,112,77,112,13,112,13,112,109,112,109,112,77,104,77,104,45,104,45,104,13,104,13,104,109,104,109,104,77,96,77,96,45,96,45,96,13,96,13,96,12,88,12,88,12,88,12,88,76,88,76,88,76,88,76,88,44,88,44,88,44,88,44,88,12,80,12,80,12,80,12,80,108,96,108,96,108,96,108,96,76,80,76,80,76,80,76,80,44,80,44,80,44,80,44,80,12,72,12,72,12,72,12,72,107,88,107,88,107,88,107,88,107,88,107,88,107,88,107,88,75,72,75,72,75,72,75,72,75,72,75,72,75,72,75,72,43,72,43,72,43,72,43,72,43,72,43,72,43,72,43,72,11,64,11,64,11,64,11,64,11,64,11,64,11,64,11,64,107,80,107,80,107,80,107,80,107,80,107,80,107,80,107,80,75,64,75,64,75,64,75,64,75,64,75,64,75,64,75,64,43,64,43,64,43,64,43,64,43,64,43,64,43,64,43,64,11,56,11,56,11,56,11,56,11,56,11,56,11,56,11,56,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,24,70,56,38,56,6,16,102,72,70,48,38,48,6,8,37,40,37,40,69,40,69,40,37,32,37,32,69,32,69,32,37,24,37,24,101,64,101,64,69,24,69,24,37,16,37,16,100,56,100,56,100,56,100,56,100,48,100,48,100,48,100,48,100,40,100,40,100,40,100,40,100,32,100,32,100,32,100,32,100,24,100,24,100,24,100,24,68,16,68,16,68,16,68,16,36,8,36,8,36,8,36,8,4,0,4,0,4,0,4,0,0,0,10,128,106,128,74,128,42,128,10,120,106,120,74,120,42,120,10,112,106,112,74,112,42,112,10,104,41,104,41,104,9,96,9,96,73,104,73,104,41,96,41,96,9,88,9,88,105,104,105,104,73,96,73,96,41,88,41,88,9,80,9,80,104,96,104,96,104,96,104,96,72,88,72,88,72,88,72,88,40,80,40,80,40,80,40,80,8,72,8,72,8,72,8,72,104,88,104,88,104,88,104,88,72,80,72,80,72,80,72,80,40,72,40,72,40,72,40,72,8,64,8,64,8,64,8,64,7,56,7,56,7,56,7,56,7,56,7,56,7,56,7,56,7,48,7,48,7,48,7,48,7,48,7,48,7,48,7,48,71,72,71,72,71,72,71,72,71,72,71,72,71,72,71,72,7,40,7,40,7,40,7,40,7,40,7,40,7,40,7,40,103,80,103,80,103,80,103,80,103,80,103,80,103,80,103,80,71,64,71,64,71,64,71,64,71,64,71,64,71,64,71,64,39,64,39,64,39,64,39,64,39,64,39,64,39,64,39,64,7,32,7,32,7,32,7,32,7,32,7,32,7,32,7,32,6,8,38,8,0,0,6,0,6,16,38,16,70,16,0,0,6,24,38,24,70,24,102,24,6,32,38,32,70,32,102,32,6,40,38,40,70,40,102,40,6,48,38,48,70,48,102,48,6,56,38,56,70,56,102,56,6,64,38,64,70,64,102,64,6,72,38,72,70,72,102,72,6,80,38,80,70,80,102,80,6,88,38,88,70,88,102,88,6,96,38,96,70,96,102,96,6,104,38,104,70,104,102,104,6,112,38,112,70,112,102,112,6,120,38,120,70,120,102,120,6,128,38,128,70,128,102,128,0,0,67,16,2,0,2,0,33,8,33,8,33,8,33,8,103,32,103,32,72,32,40,32,71,24,71,24,39,24,39,24,6,32,6,32,6,32,6,32,6,24,6,24,6,24,6,24,6,16,6,16,6,16,6,16,102,24,102,24,102,24,102,24,38,16,38,16,38,16,38,16,6,8,6,8,6,8,6,8,0,0,0,0,0,0,1,1,1,1,1,1,2,2,2,2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,6,6,6,6,6,6,7,7,7,7,7,7,8,8,8,8,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,4,5,0,1,2,3,0,16,1,2,4,8,32,3,5,10,12,15,47,7,11,13,14,6,9,31,35,37,42,44,33,34,36,40,39,43,45,46,17,18,20,24,19,21,26,28,23,27,29,30,22,25,38,41,47,31,15,0,23,27,29,30,7,11,13,14,39,43,45,46,16,3,5,10,12,19,21,26,28,35,37,42,44,1,2,4,8,17,18,20,24,6,9,22,25,32,33,34,36,40,38,41,0,0,101,85,68,68,52,52,35,35,35,35,19,19,19,19,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,249,233,217,200,200,184,184,167,167,167,167,151,151,151,151,134,134,134,134,134,134,134,134,118,118,118,118,118,118,118,118,230,214,198,182,165,165,149,149,132,132,132,132,116,116,116,116,100,100,100,100,84,84,84,84,67,67,67,67,67,67,67,67,51,51,51,51,51,51,51,51,35,35,35,35,35,35,35,35,19,19,19,19,19,19,19,19,3,3,3,3,3,3,3,3,214,182,197,197,165,165,149,149,132,132,132,132,84,84,84,84,68,68,68,68,4,4,4,4,115,115,115,115,115,115,115,115,99,99,99,99,99,99,99,99,51,51,51,51,51,51,51,51,35,35,35,35,35,35,35,35,19,19,19,19,19,19,19,19,197,181,165,5,148,148,116,116,52,52,36,36,131,131,131,131,99,99,99,99,83,83,83,83,67,67,67,67,19,19,19,19,181,149,164,164,132,132,36,36,20,20,4,4,115,115,115,115,99,99,99,99,83,83,83,83,67,67,67,67,51,51,51,51,166,6,21,21,132,132,132,132,147,147,147,147,147,147,147,147,115,115,115,115,115,115,115,115,99,99,99,99,99,99,99,99,83,83,83,83,83,83,83,83,67,67,67,67,67,67,67,67,51,51,51,51,51,51,51,51,35,35,35,35,35,35,35,35,150,6,21,21,116,116,116,116,131,131,131,131,131,131,131,131,99,99,99,99,99,99,99,99,67,67,67,67,67,67,67,67,51,51,51,51,51,51,51,51,35,35,35,35,35,35,35,35,82,82,82,82,82,82,82,82,82,82,82,82,82,82,82,82,134,6,37,37,20,20,20,20,115,115,115,115,115,115,115,115,99,99,99,99,99,99,99,99,51,51,51,51,51,51,51,51,82,82,82,82,82,82,82,82,82,82,82,82,82,82,82,82,66,66,66,66,66,66,66,66,66,66,66,66,66,66,66,66,22,6,117,117,36,36,36,36,83,83,83,83,83,83,83,83,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,98,66,66,66,66,66,66,66,66,66,66,66,66,66,66,66,66,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,21,5,100,100,35,35,35,35,82,82,82,82,82,82,82,82,66,66,66,66,66,66,66,66,50,50,50,50,50,50,50,50,4,20,35,35,51,51,83,83,65,65,65,65,65,65,65,65,4,20,67,67,34,34,34,34,49,49,49,49,49,49,49,49,3,19,50,50,33,33,33,33,2,18,33,33,17,1,34,18,1,1,50,34,18,2,67,51,34,34,18,18,2,2,83,67,51,35,18,18,2,2,19,35,67,51,99,83,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,5,6,7,8,9,10,12,13,15,17,20,22,25,28,32,36,40,45,50,56,63,71,80,90,101,113,127,144,162,182,203,226,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,3,3,3,3,4,4,4,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14,15,15,16,16,17,17,18,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,2,1,2,3,1,2,3,2,2,3,2,2,4,2,3,4,2,3,4,3,3,5,3,4,6,3,4,6,4,5,7,4,5,8,4,6,9,5,7,10,6,8,11,6,8,13,7,10,14,8,11,16,9,12,18,10,13,20,11,15,23,13,17,25,68,69,67,79,68,69,82,32,73,78,73,84,73,65,76,73,90,65,84,73,79,78,32,70,65,73,76,69,68,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"i8",ALLOC_NONE,Runtime.GLOBAL_BASE);var tempDoublePtr=Runtime.alignMemory(allocate(12,"i8",ALLOC_STATIC),8);assert(tempDoublePtr%8==0);function copyTempFloat(ptr){HEAP8[tempDoublePtr]=HEAP8[ptr];HEAP8[tempDoublePtr+1]=HEAP8[ptr+1];HEAP8[tempDoublePtr+2]=HEAP8[ptr+2];HEAP8[tempDoublePtr+3]=HEAP8[ptr+3]}function copyTempDouble(ptr){HEAP8[tempDoublePtr]=HEAP8[ptr];HEAP8[tempDoublePtr+1]=HEAP8[ptr+1];HEAP8[tempDoublePtr+2]=HEAP8[ptr+2];HEAP8[tempDoublePtr+3]=HEAP8[ptr+3];HEAP8[tempDoublePtr+4]=HEAP8[ptr+4];HEAP8[tempDoublePtr+5]=HEAP8[ptr+5];HEAP8[tempDoublePtr+6]=HEAP8[ptr+6];HEAP8[tempDoublePtr+7]=HEAP8[ptr+7]}function ___setErrNo(value){if(Module["___errno_location"])HEAP32[Module["___errno_location"]()>>2]=value;return value}var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};function _sysconf(name){switch(name){case 30:return PAGE_SIZE;case 85:return totalMemory/PAGE_SIZE;case 132:case 133:case 12:case 137:case 138:case 15:case 235:case 16:case 17:case 18:case 19:case 20:case 149:case 13:case 10:case 236:case 153:case 9:case 21:case 22:case 159:case 154:case 14:case 77:case 78:case 139:case 80:case 81:case 82:case 68:case 67:case 164:case 11:case 29:case 47:case 48:case 95:case 52:case 51:case 46:return 200809;case 79:return 0;case 27:case 246:case 127:case 128:case 23:case 24:case 160:case 161:case 181:case 182:case 242:case 183:case 184:case 243:case 244:case 245:case 165:case 178:case 179:case 49:case 50:case 168:case 169:case 175:case 170:case 171:case 172:case 97:case 76:case 32:case 173:case 35:return-1;case 176:case 177:case 7:case 155:case 8:case 157:case 125:case 126:case 92:case 93:case 129:case 130:case 131:case 94:case 91:return 1;case 74:case 60:case 69:case 70:case 4:return 1024;case 31:case 42:case 72:return 32;case 87:case 26:case 33:return 2147483647;case 34:case 1:return 47839;case 38:case 36:return 99;case 43:case 37:return 2048;case 0:return 2097152;case 3:return 65536;case 28:return 32768;case 44:return 32767;case 75:return 16384;case 39:return 1e3;case 89:return 700;case 71:return 256;case 40:return 255;case 2:return 100;case 180:return 64;case 25:return 20;case 5:return 16;case 6:return 6;case 73:return 4;case 84:{if(typeof navigator==="object")return navigator["hardwareConcurrency"]||1;return 1}}___setErrNo(ERRNO_CODES.EINVAL);return-1}Module["_memset"]=_memset;function _pthread_cleanup_push(routine,arg){__ATEXIT__.push((function(){Runtime.dynCall("vi",routine,[arg])}));_pthread_cleanup_push.level=__ATEXIT__.length}function _broadwayOnPictureDecoded($buffer,width,height){par_broadwayOnPictureDecoded($buffer,width,height)}Module["_broadwayOnPictureDecoded"]=_broadwayOnPictureDecoded;function _pthread_cleanup_pop(){assert(_pthread_cleanup_push.level==__ATEXIT__.length,"cannot pop if something else added meanwhile!");__ATEXIT__.pop();_pthread_cleanup_push.level=__ATEXIT__.length}function _abort(){Module["abort"]()}function _emscripten_memcpy_big(dest,src,num){HEAPU8.set(HEAPU8.subarray(src,src+num),dest);return dest}Module["_memcpy"]=_memcpy;var SYSCALLS={varargs:0,get:(function(varargs){SYSCALLS.varargs+=4;var ret=HEAP32[SYSCALLS.varargs-4>>2];return ret}),getStr:(function(){var ret=Pointer_stringify(SYSCALLS.get());return ret}),get64:(function(){var low=SYSCALLS.get(),high=SYSCALLS.get();if(low>=0)assert(high===0);else assert(high===-1);return low}),getZero:(function(){assert(SYSCALLS.get()===0)})};function ___syscall6(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD();FS.close(stream);return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return-e.errno}}function _sbrk(bytes){var self=_sbrk;if(!self.called){DYNAMICTOP=alignMemoryPage(DYNAMICTOP);self.called=true;assert(Runtime.dynamicAlloc);self.alloc=Runtime.dynamicAlloc;Runtime.dynamicAlloc=(function(){abort("cannot dynamically allocate, sbrk now has control")})}var ret=DYNAMICTOP;if(bytes!=0){var success=self.alloc(bytes);if(!success)return-1>>>0}return ret}function _broadwayOnHeadersDecoded(){par_broadwayOnHeadersDecoded()}Module["_broadwayOnHeadersDecoded"]=_broadwayOnHeadersDecoded;function _time(ptr){var ret=Date.now()/1e3|0;if(ptr){HEAP32[ptr>>2]=ret}return ret}function _pthread_self(){return 0}function ___syscall140(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(),offset_high=SYSCALLS.get(),offset_low=SYSCALLS.get(),result=SYSCALLS.get(),whence=SYSCALLS.get();var offset=offset_low;assert(offset_high===0);FS.llseek(stream,offset,whence);HEAP32[result>>2]=stream.position;if(stream.getdents&&offset===0&&whence===0)stream.getdents=null;return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return-e.errno}}function ___syscall146(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.get(),iov=SYSCALLS.get(),iovcnt=SYSCALLS.get();var ret=0;if(!___syscall146.buffer)___syscall146.buffer=[];var buffer=___syscall146.buffer;for(var i=0;i<iovcnt;i++){var ptr=HEAP32[iov+i*8>>2];var len=HEAP32[iov+(i*8+4)>>2];for(var j=0;j<len;j++){var curr=HEAPU8[ptr+j];if(curr===0||curr===10){Module["print"](UTF8ArrayToString(buffer,0));buffer.length=0}else{buffer.push(curr)}}ret+=len}return ret}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return-e.errno}}function ___syscall54(which,varargs){SYSCALLS.varargs=varargs;try{return 0}catch(e){if(typeof FS==="undefined"||!(e instanceof FS.ErrnoError))abort(e);return-e.errno}}STACK_BASE=STACKTOP=Runtime.alignMemory(STATICTOP);staticSealed=true;STACK_MAX=STACK_BASE+TOTAL_STACK;DYNAMIC_BASE=DYNAMICTOP=Runtime.alignMemory(STACK_MAX);assert(DYNAMIC_BASE<TOTAL_MEMORY,"TOTAL_MEMORY not big enough for stack");function invoke_ii(index,a1){try{return Module["dynCall_ii"](index,a1)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;asm["setThrew"](1,0)}}function invoke_iiii(index,a1,a2,a3){try{return Module["dynCall_iiii"](index,a1,a2,a3)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;asm["setThrew"](1,0)}}function invoke_viiiii(index,a1,a2,a3,a4,a5){try{Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;asm["setThrew"](1,0)}}function invoke_vi(index,a1){try{Module["dynCall_vi"](index,a1)}catch(e){if(typeof e!=="number"&&e!=="longjmp")throw e;asm["setThrew"](1,0)}}Module.asmGlobalArg={"Math":Math,"Int8Array":Int8Array,"Int16Array":Int16Array,"Int32Array":Int32Array,"Uint8Array":Uint8Array,"Uint16Array":Uint16Array,"Uint32Array":Uint32Array,"Float32Array":Float32Array,"Float64Array":Float64Array,"NaN":NaN,"Infinity":Infinity};Module.asmLibraryArg={"abort":abort,"assert":assert,"invoke_ii":invoke_ii,"invoke_iiii":invoke_iiii,"invoke_viiiii":invoke_viiiii,"invoke_vi":invoke_vi,"_broadwayOnPictureDecoded":_broadwayOnPictureDecoded,"_pthread_cleanup_pop":_pthread_cleanup_pop,"_pthread_self":_pthread_self,"___syscall6":___syscall6,"___setErrNo":___setErrNo,"_abort":_abort,"_sbrk":_sbrk,"_time":_time,"_pthread_cleanup_push":_pthread_cleanup_push,"_emscripten_memcpy_big":_emscripten_memcpy_big,"___syscall54":___syscall54,"_broadwayOnHeadersDecoded":_broadwayOnHeadersDecoded,"___syscall140":___syscall140,"_sysconf":_sysconf,"___syscall146":___syscall146,"STACKTOP":STACKTOP,"STACK_MAX":STACK_MAX,"tempDoublePtr":tempDoublePtr,"ABORT":ABORT};// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer) {
"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=0;var n=0;var o=0;var p=0;var q=global.NaN,r=global.Infinity;var s=0,t=0,u=0,v=0,w=0.0,x=0,y=0,z=0,A=0.0;var B=0;var C=0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=global.Math.floor;var M=global.Math.abs;var N=global.Math.sqrt;var O=global.Math.pow;var P=global.Math.cos;var Q=global.Math.sin;var R=global.Math.tan;var S=global.Math.acos;var T=global.Math.asin;var U=global.Math.atan;var V=global.Math.atan2;var W=global.Math.exp;var X=global.Math.log;var Y=global.Math.ceil;var Z=global.Math.imul;var _=global.Math.min;var $=global.Math.clz32;var aa=env.abort;var ba=env.assert;var ca=env.invoke_ii;var da=env.invoke_iiii;var ea=env.invoke_viiiii;var fa=env.invoke_vi;var ga=env._broadwayOnPictureDecoded;var ha=env._pthread_cleanup_pop;var ia=env._pthread_self;var ja=env.___syscall6;var ka=env.___setErrNo;var la=env._abort;var ma=env._sbrk;var na=env._time;var oa=env._pthread_cleanup_push;var pa=env._emscripten_memcpy_big;var qa=env.___syscall54;var ra=env._broadwayOnHeadersDecoded;var sa=env.___syscall140;var ta=env._sysconf;var ua=env.___syscall146;var va=0.0;
// EMSCRIPTEN_START_FUNCS
function Aa(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+15&-16;return b|0}function Ba(){return i|0}function Ca(a){a=a|0;i=a}function Da(a,b){a=a|0;b=b|0;i=a;j=b}function Ea(a,b){a=a|0;b=b|0;if(!m){m=a;n=b}}function Fa(b){b=b|0;a[k>>0]=a[b>>0];a[k+1>>0]=a[b+1>>0];a[k+2>>0]=a[b+2>>0];a[k+3>>0]=a[b+3>>0]}function Ga(b){b=b|0;a[k>>0]=a[b>>0];a[k+1>>0]=a[b+1>>0];a[k+2>>0]=a[b+2>>0];a[k+3>>0]=a[b+3>>0];a[k+4>>0]=a[b+4>>0];a[k+5>>0]=a[b+5>>0];a[k+6>>0]=a[b+6>>0];a[k+7>>0]=a[b+7>>0]}function Ha(a){a=a|0;B=a}function Ia(){return B|0}function Ja(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;g=d[5472+b>>0]|0;j=d[5524+b>>0]|0;h=c[8+(j*12|0)>>2]<<g;b=c[8+(j*12|0)+4>>2]<<g;g=c[8+(j*12|0)+8>>2]<<g;if(!e)c[a>>2]=Z(c[a>>2]|0,h)|0;a:do if(!(f&65436)){if(f&98){j=Z(c[a+4>>2]|0,b)|0;k=Z(c[a+20>>2]|0,h)|0;h=Z(c[a+24>>2]|0,b)|0;g=c[a>>2]|0;f=k+32+g+((h>>1)+j)>>6;c[a>>2]=f;e=g-k+32+((j>>1)-h)>>6;c[a+4>>2]=e;i=g-k+32-((j>>1)-h)>>6;c[a+8>>2]=i;j=k+32+g-((h>>1)+j)>>6;c[a+12>>2]=j;c[a+48>>2]=f;c[a+32>>2]=f;c[a+16>>2]=f;c[a+52>>2]=e;c[a+36>>2]=e;c[a+20>>2]=e;c[a+56>>2]=i;c[a+40>>2]=i;c[a+24>>2]=i;c[a+60>>2]=j;c[a+44>>2]=j;c[a+28>>2]=j;if((f+512|e+512|i+512|j+512)>>>0>1023)b=1;else break;return b|0}b=(c[a>>2]|0)+32>>6;if((b+512|0)>>>0>1023){k=1;return k|0}else{c[a+60>>2]=b;c[a+56>>2]=b;c[a+52>>2]=b;c[a+48>>2]=b;c[a+44>>2]=b;c[a+40>>2]=b;c[a+36>>2]=b;c[a+32>>2]=b;c[a+28>>2]=b;c[a+24>>2]=b;c[a+20>>2]=b;c[a+16>>2]=b;c[a+12>>2]=b;c[a+8>>2]=b;c[a+4>>2]=b;c[a>>2]=b;break}}else{f=Z(c[a+4>>2]|0,b)|0;i=Z(c[a+56>>2]|0,b)|0;l=Z(c[a+60>>2]|0,g)|0;m=Z(c[a+8>>2]|0,b)|0;r=Z(c[a+20>>2]|0,h)|0;o=Z(c[a+16>>2]|0,g)|0;s=Z(c[a+32>>2]|0,b)|0;e=Z(c[a+12>>2]|0,h)|0;q=Z(c[a+24>>2]|0,b)|0;n=Z(c[a+28>>2]|0,b)|0;p=Z(c[a+48>>2]|0,g)|0;k=Z(c[a+36>>2]|0,b)|0;g=Z(c[a+40>>2]|0,g)|0;h=Z(c[a+44>>2]|0,h)|0;t=Z(c[a+52>>2]|0,b)|0;b=c[a>>2]|0;c[a>>2]=b+r+((q>>1)+f);c[a+4>>2]=b-r+((f>>1)-q);c[a+8>>2]=b-r-((f>>1)-q);c[a+12>>2]=b+r-((q>>1)+f);c[a+16>>2]=(p>>1)+o+(n+m);c[a+20>>2]=(o>>1)-p+(m-n);c[a+24>>2]=m-n-((o>>1)-p);c[a+28>>2]=n+m-((p>>1)+o);c[a+32>>2]=(t>>1)+s+(h+e);c[a+36>>2]=(s>>1)-t+(e-h);c[a+40>>2]=e-h-((s>>1)-t);c[a+44>>2]=h+e-((t>>1)+s);c[a+48>>2]=(l>>1)+g+(i+k);c[a+52>>2]=(g>>1)-l+(k-i);c[a+56>>2]=k-i-((g>>1)-l);c[a+60>>2]=i+k-((l>>1)+g);j=3;e=(t>>1)+s+(h+e)|0;f=b+r+((q>>1)+f)|0;b=(p>>1)+o+(n+m)|0;g=(l>>1)+g+(i+k)|0;while(1){i=(b>>1)-g|0;g=(g>>1)+b|0;h=e+32+f|0;c[a>>2]=h+g>>6;b=f-e+32|0;c[a+16>>2]=b+i>>6;c[a+32>>2]=b-i>>6;c[a+48>>2]=h-g>>6;if(((h+g>>6)+512|(b+i>>6)+512)>>>0>1023){b=1;g=14;break}if(((b-i>>6)+512|(h-g>>6)+512)>>>0>1023){b=1;g=14;break}b=a+4|0;if(!j)break a;e=c[a+36>>2]|0;t=c[a+20>>2]|0;g=c[a+52>>2]|0;a=b;j=j+-1|0;f=c[b>>2]|0;b=t}if((g|0)==14)return b|0}while(0);t=0;return t|0}function Ka(f,g,h,j,k,l,m,n){f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;var o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,_=0,$=0,aa=0;$=i;i=i+80|0;G=c[g>>2]|0;c[f>>2]=G;o=(c[f+196>>2]|0)+1|0;c[f+196>>2]=o;X=c[h+4>>2]|0;Y=Z(c[h+8>>2]|0,X)|0;W=c[h>>2]|0;c[h+12>>2]=W+((l-((l>>>0)%(X>>>0)|0)<<8)+(((l>>>0)%(X>>>0)|0)<<4));X=(((l>>>0)%(X>>>0)|0)<<3)+(Y<<8)+(l-((l>>>0)%(X>>>0)|0)<<6)|0;c[h+16>>2]=W+X;c[h+20>>2]=W+(X+(Y<<6));if((G|0)==31){c[f+20>>2]=0;if(o>>>0>1){b[f+28>>1]=16;b[f+30>>1]=16;b[f+32>>1]=16;b[f+34>>1]=16;b[f+36>>1]=16;b[f+38>>1]=16;b[f+40>>1]=16;b[f+42>>1]=16;b[f+44>>1]=16;b[f+46>>1]=16;b[f+48>>1]=16;b[f+50>>1]=16;b[f+52>>1]=16;b[f+54>>1]=16;b[f+56>>1]=16;b[f+58>>1]=16;b[f+60>>1]=16;b[f+62>>1]=16;b[f+64>>1]=16;b[f+66>>1]=16;b[f+68>>1]=16;b[f+70>>1]=16;b[f+72>>1]=16;b[f+74>>1]=16;n=0;i=$;return n|0}k=23;p=g+328|0;q=n;o=f+28|0;while(1){b[o>>1]=16;a[q>>0]=c[p>>2];a[q+1>>0]=c[p+4>>2];a[q+2>>0]=c[p+8>>2];a[q+3>>0]=c[p+12>>2];a[q+4>>0]=c[p+16>>2];a[q+5>>0]=c[p+20>>2];a[q+6>>0]=c[p+24>>2];a[q+7>>0]=c[p+28>>2];a[q+8>>0]=c[p+32>>2];a[q+9>>0]=c[p+36>>2];a[q+10>>0]=c[p+40>>2];a[q+11>>0]=c[p+44>>2];a[q+12>>0]=c[p+48>>2];a[q+13>>0]=c[p+52>>2];a[q+14>>0]=c[p+56>>2];a[q+15>>0]=c[p+60>>2];if(!k)break;else{k=k+-1|0;p=p+64|0;q=q+16|0;o=o+2|0}}$a(h,n);n=0;i=$;return n|0}do if(!G){o=f+28|0;q=o+54|0;do{a[o>>0]=0;o=o+1|0}while((o|0)<(q|0));c[f+20>>2]=c[k>>2];r=0}else{o=f+28|0;p=g+272|0;q=o+54|0;do{a[o>>0]=a[p>>0]|0;o=o+1|0;p=p+1|0}while((o|0)<(q|0));p=c[g+8>>2]|0;o=c[k>>2]|0;do if(p){c[k>>2]=o+p;if((o+p|0)<0){c[k>>2]=o+p+52;o=o+p+52|0;break}if((o+p|0)>51){c[k>>2]=o+p+-52;o=o+p+-52|0}else o=o+p|0}while(0);c[f+20>>2]=o;a:do if(G>>>0>6){if(!(b[f+76>>1]|0)){r=g+1992|0;p=15;q=g+328|0;k=320;s=f+28|0}else{F=a[5524+o>>0]|0;p=a[5472+o>>0]|0;y=c[g+1872>>2]|0;u=c[g+1884>>2]|0;w=c[g+1880>>2]|0;A=c[g+1896>>2]|0;Y=c[g+1876>>2]|0;s=c[g+1888>>2]|0;z=c[g+1892>>2]|0;x=c[g+1912>>2]|0;X=c[g+1900>>2]|0;E=c[g+1904>>2]|0;B=c[g+1908>>2]|0;W=c[g+1916>>2]|0;v=c[g+1864>>2]|0;t=c[g+1868>>2]|0;q=t+s+(v+u)|0;c[g+1864>>2]=q;k=t-s+(v-u)|0;c[g+1868>>2]=k;r=v-u-(t-s)|0;c[g+1872>>2]=r;s=v+u-(t+s)|0;c[g+1876>>2]=s;t=x+w+(z+y)|0;c[g+1880>>2]=t;u=w-x+(y-z)|0;c[g+1884>>2]=u;v=y-z-(w-x)|0;c[g+1888>>2]=v;w=z+y-(x+w)|0;c[g+1892>>2]=w;x=W+A+(B+Y)|0;c[g+1896>>2]=x;y=A-W+(Y-B)|0;c[g+1900>>2]=y;z=Y-B-(A-W)|0;c[g+1904>>2]=z;A=B+Y-(W+A)|0;c[g+1908>>2]=A;W=c[g+1920>>2]|0;Y=c[g+1924>>2]|0;B=Y+E+(W+X)|0;c[g+1912>>2]=B;C=E-Y+(X-W)|0;c[g+1916>>2]=C;D=X-W-(E-Y)|0;c[g+1920>>2]=D;E=W+X-(Y+E)|0;c[g+1924>>2]=E;F=c[8+((F&255)*12|0)>>2]|0;if(o>>>0>11){o=F<<(p&255)+-2;c[g+1864>>2]=Z(B+t+(q+x)|0,o)|0;c[g+1880>>2]=Z(t-B+(q-x)|0,o)|0;c[g+1896>>2]=Z(q-x-(t-B)|0,o)|0;c[g+1912>>2]=Z(q+x-(B+t)|0,o)|0;c[g+1868>>2]=Z(C+u+(k+y)|0,o)|0;c[g+1884>>2]=Z(u-C+(k-y)|0,o)|0;c[g+1900>>2]=Z(k-y-(u-C)|0,o)|0;c[g+1916>>2]=Z(k+y-(C+u)|0,o)|0;c[g+1872>>2]=Z(D+v+(r+z)|0,o)|0;c[g+1888>>2]=Z(v-D+(r-z)|0,o)|0;c[g+1904>>2]=Z(r-z-(v-D)|0,o)|0;c[g+1920>>2]=Z(r+z-(D+v)|0,o)|0;c[g+1876>>2]=Z(E+w+(s+A)|0,o)|0;c[g+1892>>2]=Z(w-E+(s-A)|0,o)|0;c[g+1908>>2]=Z(s-A-(w-E)|0,o)|0;o=Z(s+A-(E+w)|0,o)|0}else{Y=(o+-6|0)>>>0<6?1:2;o=2-(p&255)|0;c[g+1864>>2]=(Z(B+t+(q+x)|0,F)|0)+Y>>o;c[g+1880>>2]=(Z(t-B+(q-x)|0,F)|0)+Y>>o;c[g+1896>>2]=(Z(q-x-(t-B)|0,F)|0)+Y>>o;c[g+1912>>2]=(Z(q+x-(B+t)|0,F)|0)+Y>>o;c[g+1868>>2]=(Z(C+u+(k+y)|0,F)|0)+Y>>o;c[g+1884>>2]=(Z(u-C+(k-y)|0,F)|0)+Y>>o;c[g+1900>>2]=(Z(k-y-(u-C)|0,F)|0)+Y>>o;c[g+1916>>2]=(Z(k+y-(C+u)|0,F)|0)+Y>>o;c[g+1872>>2]=(Z(D+v+(r+z)|0,F)|0)+Y>>o;c[g+1888>>2]=(Z(v-D+(r-z)|0,F)|0)+Y>>o;c[g+1904>>2]=(Z(r-z-(v-D)|0,F)|0)+Y>>o;c[g+1920>>2]=(Z(r+z-(D+v)|0,F)|0)+Y>>o;c[g+1876>>2]=(Z(E+w+(s+A)|0,F)|0)+Y>>o;c[g+1892>>2]=(Z(w-E+(s-A)|0,F)|0)+Y>>o;c[g+1908>>2]=(Z(s-A-(w-E)|0,F)|0)+Y>>o;o=(Z(s+A-(E+w)|0,F)|0)+Y>>o}c[g+1924>>2]=o;r=g+1992|0;p=15;q=g+328|0;k=320;s=f+28|0}while(1){Y=c[g+1864+(c[k>>2]<<2)>>2]|0;k=k+4|0;c[q>>2]=Y;if((Y|0)==0?(b[s>>1]|0)==0:0)c[q>>2]=16777215;else _=21;if((_|0)==21?(_=0,(Ja(q,c[f+20>>2]|0,1,c[r>>2]|0)|0)!=0):0){o=1;break}t=s+2|0;o=r+4|0;if(!p){k=r;v=s;break a}else{r=o;p=p+-1|0;q=q+64|0;s=t}}i=$;return o|0}else{k=g+1992|0;p=15;q=g+328|0;r=f+28|0;while(1){if(b[r>>1]|0){if(Ja(q,c[f+20>>2]|0,0,c[k>>2]|0)|0){o=1;break}}else c[q>>2]=16777215;s=r+2|0;o=k+4|0;if(!p){v=r;t=s;break a}else{k=o;p=p+-1|0;q=q+64|0;r=s}}i=$;return o|0}while(0);p=(c[f+24>>2]|0)+(c[f+20>>2]|0)|0;p=(p|0)<0?0:(p|0)>51?51:p;u=c[80+(p<<2)>>2]|0;if((b[f+78>>1]|0)==0?(b[f+80>>1]|0)==0:0){s=g+1932|0;r=c[g+1928>>2]|0}else{r=c[8+((d[5524+u>>0]|0)*12|0)>>2]|0;if((p+-6|0)>>>0<46){r=r<<(d[5472+u>>0]|0)+-1;p=0}else p=1;s=c[g+1928>>2]|0;X=c[g+1936>>2]|0;W=c[g+1932>>2]|0;V=c[g+1940>>2]|0;Y=(Z(V+W+(X+s)|0,r)|0)>>p;c[g+1928>>2]=Y;c[g+1932>>2]=(Z(X+s-(V+W)|0,r)|0)>>p;c[g+1936>>2]=(Z(W-V+(s-X)|0,r)|0)>>p;c[g+1940>>2]=(Z(s-X-(W-V)|0,r)|0)>>p;V=c[g+1944>>2]|0;W=c[g+1952>>2]|0;X=c[g+1948>>2]|0;s=c[g+1956>>2]|0;c[g+1944>>2]=(Z(s+X+(W+V)|0,r)|0)>>p;c[g+1948>>2]=(Z(W+V-(s+X)|0,r)|0)>>p;c[g+1952>>2]=(Z(X-s+(V-W)|0,r)|0)>>p;c[g+1956>>2]=(Z(V-W-(X-s)|0,r)|0)>>p;s=g+1932|0;r=Y}p=q+64|0;c[p>>2]=r;if((r|0)==0?(b[t>>1]|0)==0:0)c[p>>2]=16777215;else _=36;if((_|0)==36?(Ja(p,u,1,c[o>>2]|0)|0)!=0:0){n=1;i=$;return n|0}p=k+8|0;Y=c[s>>2]|0;o=q+128|0;c[o>>2]=Y;if((Y|0)==0?(b[v+4>>1]|0)==0:0)c[o>>2]=16777215;else _=40;if((_|0)==40?(Ja(o,u,1,c[p>>2]|0)|0)!=0:0){n=1;i=$;return n|0}o=k+12|0;Y=c[g+1936>>2]|0;p=q+192|0;c[p>>2]=Y;if((Y|0)==0?(b[v+6>>1]|0)==0:0)c[p>>2]=16777215;else _=44;if((_|0)==44?(Ja(p,u,1,c[o>>2]|0)|0)!=0:0){n=1;i=$;return n|0}o=k+16|0;Y=c[g+1940>>2]|0;p=q+256|0;c[p>>2]=Y;if((Y|0)==0?(b[v+8>>1]|0)==0:0)c[p>>2]=16777215;else _=48;if((_|0)==48?(Ja(p,u,1,c[o>>2]|0)|0)!=0:0){n=1;i=$;return n|0}o=k+20|0;Y=c[g+1944>>2]|0;p=q+320|0;c[p>>2]=Y;if((Y|0)==0?(b[v+10>>1]|0)==0:0)c[p>>2]=16777215;else _=52;if((_|0)==52?(Ja(p,u,1,c[o>>2]|0)|0)!=0:0){n=1;i=$;return n|0}o=k+24|0;Y=c[g+1948>>2]|0;p=q+384|0;c[p>>2]=Y;if((Y|0)==0?(b[v+12>>1]|0)==0:0)c[p>>2]=16777215;else _=56;if((_|0)==56?(Ja(p,u,1,c[o>>2]|0)|0)!=0:0){n=1;i=$;return n|0}o=k+28|0;Y=c[g+1952>>2]|0;p=q+448|0;c[p>>2]=Y;if((Y|0)==0?(b[v+14>>1]|0)==0:0)c[p>>2]=16777215;else _=60;if((_|0)==60?(Ja(p,u,1,c[o>>2]|0)|0)!=0:0){n=1;i=$;return n|0}p=k+32|0;Y=c[g+1956>>2]|0;o=q+512|0;c[o>>2]=Y;if((Y|0)==0?(b[v+16>>1]|0)==0:0)c[o>>2]=16777215;else _=64;if((_|0)==64?(Ja(o,u,1,c[p>>2]|0)|0)!=0:0){n=1;i=$;return n|0}if(G>>>0<6){r=c[f>>2]|0;break}do if(l){G=c[h+4>>2]|0;H=Z(c[h+8>>2]|0,G)|0;I=Z((l>>>0)/(G>>>0)|0,G)|0;p=c[h>>2]|0;o=(l-I<<4)+(Z(G<<8,(l>>>0)/(G>>>0)|0)|0)|0;if((l>>>0)/(G>>>0)|0){F=o-(G<<4|1)|0;a[$>>0]=a[p+F>>0]|0;a[$+1>>0]=a[p+(F+1)>>0]|0;a[$+2>>0]=a[p+(F+2)>>0]|0;a[$+3>>0]=a[p+(F+3)>>0]|0;a[$+4>>0]=a[p+(F+4)>>0]|0;a[$+5>>0]=a[p+(F+5)>>0]|0;a[$+6>>0]=a[p+(F+6)>>0]|0;a[$+7>>0]=a[p+(F+7)>>0]|0;a[$+8>>0]=a[p+(F+8)>>0]|0;a[$+9>>0]=a[p+(F+9)>>0]|0;a[$+10>>0]=a[p+(F+10)>>0]|0;a[$+11>>0]=a[p+(F+11)>>0]|0;a[$+12>>0]=a[p+(F+12)>>0]|0;a[$+13>>0]=a[p+(F+13)>>0]|0;a[$+14>>0]=a[p+(F+14)>>0]|0;a[$+15>>0]=a[p+(F+15)>>0]|0;a[$+16>>0]=a[p+(F+16)>>0]|0;a[$+17>>0]=a[p+(F+17)>>0]|0;a[$+18>>0]=a[p+(F+18)>>0]|0;a[$+19>>0]=a[p+(F+19)>>0]|0;a[$+20>>0]=a[p+(F+20)>>0]|0;F=$+21|0;J=22;K=23;L=24;M=25;N=26;O=27;P=28;Q=29;R=30;S=31;T=32;U=33;j=34;V=35;W=36;X=37;Y=38}else{F=$;J=1;K=2;L=3;M=4;N=5;O=6;P=7;Q=8;R=9;S=10;T=11;U=12;j=13;V=14;W=15;X=16;Y=17}if((I|0)!=(l|0)){a[$+40>>0]=a[p+(o+-1)>>0]|0;a[$+40+1>>0]=a[p+(o+-1+(G<<4))>>0]|0;o=o+-1+(G<<4)+(G<<4)|0;a[$+40+2>>0]=a[p+o>>0]|0;a[$+40+3>>0]=a[p+(o+(G<<4))>>0]|0;a[$+40+4>>0]=a[p+(o+(G<<4)+(G<<4))>>0]|0;o=o+(G<<4)+(G<<4)+(G<<4)|0;a[$+40+5>>0]=a[p+o>>0]|0;a[$+40+6>>0]=a[p+(o+(G<<4))>>0]|0;a[$+40+7>>0]=a[p+(o+(G<<4)+(G<<4))>>0]|0;o=o+(G<<4)+(G<<4)+(G<<4)|0;a[$+40+8>>0]=a[p+o>>0]|0;a[$+40+9>>0]=a[p+(o+(G<<4))>>0]|0;a[$+40+10>>0]=a[p+(o+(G<<4)+(G<<4))>>0]|0;o=o+(G<<4)+(G<<4)+(G<<4)|0;a[$+40+11>>0]=a[p+o>>0]|0;a[$+40+12>>0]=a[p+(o+(G<<4))>>0]|0;a[$+40+13>>0]=a[p+(o+(G<<4)+(G<<4))>>0]|0;o=o+(G<<4)+(G<<4)+(G<<4)|0;a[$+40+14>>0]=a[p+o>>0]|0;a[$+40+15>>0]=a[p+(o+(G<<4))>>0]|0;o=$+40+16|0;k=17;r=18;s=19;t=20;u=21;v=22;w=23;x=24;y=25;z=26;A=27;B=28;C=29;D=30;E=31}else{o=$+40|0;k=1;r=2;s=3;t=4;u=5;v=6;w=7;x=8;y=9;z=10;A=11;B=12;C=13;D=14;E=15}q=c[h>>2]|0;p=(Z(((l>>>0)/(G>>>0)|0)<<3,G<<3&2147483640)|0)+(H<<8)+(l-I<<3)|0;if((l>>>0)/(G>>>0)|0){aa=p-(G<<3&2147483640|1)|0;a[F>>0]=a[q+aa>>0]|0;a[$+J>>0]=a[q+(aa+1)>>0]|0;a[$+K>>0]=a[q+(aa+2)>>0]|0;a[$+L>>0]=a[q+(aa+3)>>0]|0;a[$+M>>0]=a[q+(aa+4)>>0]|0;a[$+N>>0]=a[q+(aa+5)>>0]|0;a[$+O>>0]=a[q+(aa+6)>>0]|0;a[$+P>>0]=a[q+(aa+7)>>0]|0;a[$+Q>>0]=a[q+(aa+8)>>0]|0;a[$+R>>0]=a[q+(aa+(H<<6))>>0]|0;a[$+S>>0]=a[q+(aa+(H<<6)+1)>>0]|0;a[$+T>>0]=a[q+(aa+(H<<6)+2)>>0]|0;a[$+U>>0]=a[q+(aa+(H<<6)+3)>>0]|0;a[$+j>>0]=a[q+(aa+(H<<6)+4)>>0]|0;a[$+V>>0]=a[q+(aa+(H<<6)+5)>>0]|0;a[$+W>>0]=a[q+(aa+(H<<6)+6)>>0]|0;a[$+X>>0]=a[q+(aa+(H<<6)+7)>>0]|0;a[$+Y>>0]=a[q+(aa+(H<<6)+8)>>0]|0}if((I|0)==(l|0))break;a[o>>0]=a[q+(p+-1)>>0]|0;a[$+40+k>>0]=a[q+(p+-1+(G<<3&2147483640))>>0]|0;aa=p+-1+(G<<3&2147483640)+(G<<3&2147483640)|0;a[$+40+r>>0]=a[q+aa>>0]|0;a[$+40+s>>0]=a[q+(aa+(G<<3&2147483640))>>0]|0;a[$+40+t>>0]=a[q+(aa+(G<<3&2147483640)+(G<<3&2147483640))>>0]|0;aa=aa+(G<<3&2147483640)+(G<<3&2147483640)+(G<<3&2147483640)|0;a[$+40+u>>0]=a[q+aa>>0]|0;a[$+40+v>>0]=a[q+(aa+(G<<3&2147483640))>>0]|0;a[$+40+w>>0]=a[q+(aa+(G<<3&2147483640)+(G<<3&2147483640))>>0]|0;aa=(H-G<<6)+(G<<3&2147483640)+(aa+(G<<3&2147483640)+(G<<3&2147483640))|0;a[$+40+x>>0]=a[q+aa>>0]|0;a[$+40+y>>0]=a[q+(aa+(G<<3&2147483640))>>0]|0;a[$+40+z>>0]=a[q+(aa+(G<<3&2147483640)+(G<<3&2147483640))>>0]|0;aa=aa+(G<<3&2147483640)+(G<<3&2147483640)+(G<<3&2147483640)|0;a[$+40+A>>0]=a[q+aa>>0]|0;a[$+40+B>>0]=a[q+(aa+(G<<3&2147483640))>>0]|0;a[$+40+C>>0]=a[q+(aa+(G<<3&2147483640)+(G<<3&2147483640))>>0]|0;aa=aa+(G<<3&2147483640)+(G<<3&2147483640)+(G<<3&2147483640)|0;a[$+40+D>>0]=a[q+aa>>0]|0;a[$+40+E>>0]=a[q+(aa+(G<<3&2147483640))>>0]|0}while(0);s=c[f>>2]|0;b:do if(s>>>0>6){o=c[f+200>>2]|0;do if(!o){r=(m|0)!=0;k=0}else{p=(c[f+4>>2]|0)==(c[o+4>>2]|0);if(!((m|0)!=0&p)){r=(m|0)!=0;k=p&1;break}r=1;k=(c[o>>2]|0)>>>0<6?0:p&1}while(0);o=c[f+204>>2]|0;do if(!o)q=0;else{p=(c[f+4>>2]|0)==(c[o+4>>2]|0);if(!(r&p)){q=p&1;break}q=(c[o>>2]|0)>>>0<6?0:p&1}while(0);o=c[f+212>>2]|0;do if(!o)o=0;else{p=(c[f+4>>2]|0)==(c[o+4>>2]|0);if(!(r&p)){o=p&1;break}o=(c[o>>2]|0)>>>0<6?0:p&1}while(0);switch(s+1&3|0){case 0:{if(!q)break b;o=n;p=0;while(1){a[o>>0]=a[$+1>>0]|0;a[o+1>>0]=a[$+2>>0]|0;a[o+2>>0]=a[$+3>>0]|0;a[o+3>>0]=a[$+4>>0]|0;a[o+4>>0]=a[$+5>>0]|0;a[o+5>>0]=a[$+6>>0]|0;a[o+6>>0]=a[$+7>>0]|0;a[o+7>>0]=a[$+8>>0]|0;a[o+8>>0]=a[$+9>>0]|0;a[o+9>>0]=a[$+10>>0]|0;a[o+10>>0]=a[$+11>>0]|0;a[o+11>>0]=a[$+12>>0]|0;a[o+12>>0]=a[$+13>>0]|0;a[o+13>>0]=a[$+14>>0]|0;a[o+14>>0]=a[$+15>>0]|0;a[o+15>>0]=a[$+16>>0]|0;p=p+1|0;if((p|0)==16)break;else o=o+16|0}break}case 1:{if(!k)break b;else{o=n;p=0}while(1){aa=$+40+p|0;a[o>>0]=a[aa>>0]|0;a[o+1>>0]=a[aa>>0]|0;a[o+2>>0]=a[aa>>0]|0;a[o+3>>0]=a[aa>>0]|0;a[o+4>>0]=a[aa>>0]|0;a[o+5>>0]=a[aa>>0]|0;a[o+6>>0]=a[aa>>0]|0;a[o+7>>0]=a[aa>>0]|0;a[o+8>>0]=a[aa>>0]|0;a[o+9>>0]=a[aa>>0]|0;a[o+10>>0]=a[aa>>0]|0;a[o+11>>0]=a[aa>>0]|0;a[o+12>>0]=a[aa>>0]|0;a[o+13>>0]=a[aa>>0]|0;a[o+14>>0]=a[aa>>0]|0;a[o+15>>0]=a[aa>>0]|0;p=p+1|0;if((p|0)==16)break;else o=o+16|0}break}case 2:{p=(k|0)!=0;o=(q|0)!=0;do if(p&o)o=((d[$+1>>0]|0)+16+(d[$+40>>0]|0)+(d[$+2>>0]|0)+(d[$+40+1>>0]|0)+(d[$+3>>0]|0)+(d[$+40+2>>0]|0)+(d[$+4>>0]|0)+(d[$+40+3>>0]|0)+(d[$+5>>0]|0)+(d[$+40+4>>0]|0)+(d[$+6>>0]|0)+(d[$+40+5>>0]|0)+(d[$+7>>0]|0)+(d[$+40+6>>0]|0)+(d[$+8>>0]|0)+(d[$+40+7>>0]|0)+(d[$+9>>0]|0)+(d[$+40+8>>0]|0)+(d[$+10>>0]|0)+(d[$+40+9>>0]|0)+(d[$+11>>0]|0)+(d[$+40+10>>0]|0)+(d[$+12>>0]|0)+(d[$+40+11>>0]|0)+(d[$+13>>0]|0)+(d[$+40+12>>0]|0)+(d[$+14>>0]|0)+(d[$+40+13>>0]|0)+(d[$+15>>0]|0)+(d[$+40+14>>0]|0)+(d[$+16>>0]|0)+(d[$+40+15>>0]|0)|0)>>>5;else{if(p){o=((d[$+40>>0]|0)+8+(d[$+40+1>>0]|0)+(d[$+40+2>>0]|0)+(d[$+40+3>>0]|0)+(d[$+40+4>>0]|0)+(d[$+40+5>>0]|0)+(d[$+40+6>>0]|0)+(d[$+40+7>>0]|0)+(d[$+40+8>>0]|0)+(d[$+40+9>>0]|0)+(d[$+40+10>>0]|0)+(d[$+40+11>>0]|0)+(d[$+40+12>>0]|0)+(d[$+40+13>>0]|0)+(d[$+40+14>>0]|0)+(d[$+40+15>>0]|0)|0)>>>4;break}if(!o){o=128;break}o=((d[$+1>>0]|0)+8+(d[$+2>>0]|0)+(d[$+3>>0]|0)+(d[$+4>>0]|0)+(d[$+5>>0]|0)+(d[$+6>>0]|0)+(d[$+7>>0]|0)+(d[$+8>>0]|0)+(d[$+9>>0]|0)+(d[$+10>>0]|0)+(d[$+11>>0]|0)+(d[$+12>>0]|0)+(d[$+13>>0]|0)+(d[$+14>>0]|0)+(d[$+15>>0]|0)+(d[$+16>>0]|0)|0)>>>4}while(0);xb(n|0,o&255|0,256)|0;break}default:{if(!((k|0)!=0&(q|0)!=0&(o|0)!=0))break b;o=d[$+16>>0]|0;p=d[$+40+15>>0]|0;k=d[$>>0]|0;q=(((d[$+9>>0]|0)-(d[$+7>>0]|0)+((d[$+10>>0]|0)-(d[$+6>>0]|0)<<1)+(((d[$+11>>0]|0)-(d[$+5>>0]|0)|0)*3|0)+((d[$+12>>0]|0)-(d[$+4>>0]|0)<<2)+(((d[$+13>>0]|0)-(d[$+3>>0]|0)|0)*5|0)+(((d[$+14>>0]|0)-(d[$+2>>0]|0)|0)*6|0)+(((d[$+15>>0]|0)-(d[$+1>>0]|0)|0)*7|0)+(o-k<<3)|0)*5|0)+32>>6;k=(((d[$+40+8>>0]|0)-(d[$+40+6>>0]|0)+(p-k<<3)+((d[$+40+9>>0]|0)-(d[$+40+5>>0]|0)<<1)+(((d[$+40+10>>0]|0)-(d[$+40+4>>0]|0)|0)*3|0)+((d[$+40+11>>0]|0)-(d[$+40+3>>0]|0)<<2)+(((d[$+40+12>>0]|0)-(d[$+40+2>>0]|0)|0)*5|0)+(((d[$+40+13>>0]|0)-(d[$+40+1>>0]|0)|0)*6|0)+(((d[$+40+14>>0]|0)-(d[$+40>>0]|0)|0)*7|0)|0)*5|0)+32>>6;t=0;do{r=(p+o<<4)+16+(Z(t+-7|0,k)|0)|0;s=t<<4;u=0;do{aa=r+(Z(u+-7|0,q)|0)>>5;a[n+(u+s)>>0]=(aa|0)<0?0:(aa|0)>255?-1:aa&255;u=u+1|0}while((u|0)!=16);t=t+1|0}while((t|0)!=16)}}Pa(n,g+328|0,0);Pa(n,g+392|0,1);Pa(n,g+456|0,2);Pa(n,g+520|0,3);Pa(n,g+584|0,4);Pa(n,g+648|0,5);Pa(n,g+712|0,6);Pa(n,g+776|0,7);Pa(n,g+840|0,8);Pa(n,g+904|0,9);Pa(n,g+968|0,10);Pa(n,g+1032|0,11);Pa(n,g+1096|0,12);Pa(n,g+1160|0,13);Pa(n,g+1224|0,14);Pa(n,g+1288|0,15);o=f+200|0;_=179}else{M=0;while(1){aa=384+(M<<3)|0;s=c[aa+4>>2]|0;switch(c[aa>>2]|0){case 0:{o=f+200|0;_=113;break}case 1:{o=f+204|0;_=113;break}case 2:{o=f+208|0;_=113;break}case 3:{o=f+212|0;_=113;break}case 4:{o=f;_=114;break}default:{r=0;q=0}}if((_|0)==113){_=0;o=c[o>>2]|0;if(!o){r=0;q=0}else _=114}do if((_|0)==114){p=(c[f+4>>2]|0)==(c[o+4>>2]|0);if(!((m|0)!=0&p)){r=o;q=p&1;break}r=o;q=(c[o>>2]|0)>>>0<6?0:p&1}while(0);aa=576+(M<<3)|0;k=c[aa+4>>2]|0;switch(c[aa>>2]|0){case 0:{o=f+200|0;_=120;break}case 1:{o=f+204|0;_=120;break}case 2:{o=f+208|0;_=120;break}case 3:{o=f+212|0;_=120;break}case 4:{o=f;_=122;break}default:_=121}if((_|0)==120){o=c[o>>2]|0;if(!o)_=121;else _=122}do if((_|0)==121){_=0;C=0;B=0;A=(q|0)!=0;o=2}else if((_|0)==122){_=0;p=(c[f+4>>2]|0)==(c[o+4>>2]|0);if((m|0)!=0&p)p=(c[o>>2]|0)>>>0<6?0:p&1;else p=p&1;q=(q|0)!=0;p=(p|0)!=0;if(!(q&p)){C=0;B=p;A=q;o=2;break}if((c[r>>2]|0)==6)p=d[(s&255)+(r+82)>>0]|0;else p=2;if((c[o>>2]|0)==6)o=d[(k&255)+(o+82)>>0]|0;else o=2;C=1;B=1;A=1;o=p>>>0<o>>>0?p:o}while(0);if(!(c[g+12+(M<<2)>>2]|0)){aa=c[g+76+(M<<2)>>2]|0;o=(aa>>>0>=o>>>0&1)+aa|0}a[f+82+M>>0]=o;switch(c[768+(M<<3)>>2]|0){case 0:{p=f+200|0;_=136;break}case 1:{p=f+204|0;_=136;break}case 2:{p=f+208|0;_=136;break}case 3:{p=f+212|0;_=136;break}case 4:{p=f;_=137;break}default:z=0}if((_|0)==136){_=0;p=c[p>>2]|0;if(!p)z=0;else _=137}do if((_|0)==137){_=0;q=(c[f+4>>2]|0)==(c[p+4>>2]|0);if(!((m|0)!=0&q)){z=q&1;break}z=(c[p>>2]|0)>>>0<6?0:q&1}while(0);switch(c[960+(M<<3)>>2]|0){case 0:{p=f+200|0;_=143;break}case 1:{p=f+204|0;_=143;break}case 2:{p=f+208|0;_=143;break}case 3:{p=f+212|0;_=143;break}case 4:{p=f;_=144;break}default:y=0}if((_|0)==143){_=0;p=c[p>>2]|0;if(!p)y=0;else _=144}do if((_|0)==144){_=0;q=(c[f+4>>2]|0)==(c[p+4>>2]|0);if(!((m|0)!=0&q)){y=q&1;break}y=(c[p>>2]|0)>>>0<6?0:q&1}while(0);K=c[1152+(M<<2)>>2]|0;L=c[1216+(M<<2)>>2]|0;u=(1285>>>M&1|0)!=0;if(u){q=$+40+(L+1)|0;p=$+40+L|0;k=$+40+(L+3)|0;r=$+40+(L+2)|0}else{q=n+((L<<4)+K+15)|0;p=n+((L<<4)+K+-1)|0;k=n+((L<<4)+K+47)|0;r=n+((L<<4)+K+31)|0}J=a[p>>0]|0;I=a[q>>0]|0;H=a[k>>0]|0;G=a[r>>0]|0;do if(!(51>>>M&1)){p=(L+-1<<4)+K|0;q=a[n+p>>0]|0;r=a[n+(p+1)>>0]|0;s=a[n+(p+2)>>0]|0;v=a[n+(p+3)>>0]|0;x=a[n+(p+4)>>0]|0;k=a[n+(p+5)>>0]|0;w=a[n+(p+6)>>0]|0;t=a[n+(p+7)>>0]|0;if(u){u=$+40+(L+-1)|0;F=v;E=w;p=x;break}else{u=n+(p+-1)|0;F=v;E=w;p=x;break}}else{u=$+K|0;q=a[$+(K+1)>>0]|0;r=a[$+(K+2)>>0]|0;s=a[$+(K+3)>>0]|0;F=a[$+(K+4)>>0]|0;t=a[$+(K+8)>>0]|0;E=a[$+(K+7)>>0]|0;k=a[$+(K+6)>>0]|0;p=a[$+(K+5)>>0]|0}while(0);D=a[u>>0]|0;switch(o|0){case 0:{if(!B)break b;p=F;k=s;t=r;u=q;v=F;w=s;x=r;y=q;z=F;A=s;B=r;C=q;o=(s&255)<<16|(F&255)<<24|(r&255)<<8|q&255;break}case 1:{if(!A)break b;u=Z(J&255,16843009)|0;y=Z(I&255,16843009)|0;C=Z(G&255,16843009)|0;p=u>>>24&255;k=u>>>16&255;t=u>>>8&255;u=u&255;v=y>>>24&255;w=y>>>16&255;x=y>>>8&255;y=y&255;z=C>>>24&255;A=C>>>16&255;B=C>>>8&255;C=C&255;o=Z(H&255,16843009)|0;break}case 2:{do if(C)o=((J&255)+4+(I&255)+(H&255)+(G&255)+(F&255)+(s&255)+(r&255)+(q&255)|0)>>>3;else{if(A){o=((J&255)+2+(I&255)+(H&255)+(G&255)|0)>>>2;break}if(!B){o=128;break}o=((F&255)+2+(s&255)+(r&255)+(q&255)|0)>>>2}while(0);o=Z(o&255,16843009)|0;p=o>>>24&255;k=o>>>16&255;t=o>>>8&255;u=o&255;v=o>>>24&255;w=o>>>16&255;x=o>>>8&255;y=o&255;z=o>>>24&255;A=o>>>16&255;B=o>>>8&255;C=o&255;break}case 3:{if(!B)break b;aa=(z|0)==0;y=r&255;C=s&255;X=F&255;Y=(aa?F:p)&255;l=(aa?F:k)&255;B=(X+2+l+(Y<<1)|0)>>>2&255;o=(aa?F:E)&255;A=(Y+2+o+(l<<1)|0)>>>2&255;aa=(aa?F:t)&255;p=B;k=(Y+(X<<1)+(C+2)|0)>>>2&255;t=(y+(X+2)+(C<<1)|0)>>>2&255;u=((q&255)+(C+2)+(y<<1)|0)>>>2&255;v=A;w=B;x=(Y+(X<<1)+(C+2)|0)>>>2&255;y=(y+(X+2)+(C<<1)|0)>>>2&255;z=(l+2+aa+(o<<1)|0)>>>2&255;C=(Y+(X<<1)+(C+2)|0)>>>2&255;o=(X+2+l+(Y<<1)|0)>>>2&255|(o+2+(aa*3|0)|0)>>>2<<24|(Y+2+o+(l<<1)|0)>>>2<<8&65280|(l+2+aa+(o<<1)|0)>>>2<<16&16711680;break}case 4:{if(!(C&(y|0)!=0))break b;o=q&255;A=(o+2+(J&255)+((D&255)<<1)|0)>>>2&255;z=r&255;v=s&255;B=((I&255)+((J&255)<<1)+((D&255)+2)|0)>>>2&255;p=((F&255)+2+z+(v<<1)|0)>>>2&255;k=((z<<1)+v+(o+2)|0)>>>2&255;t=((o<<1)+z+((D&255)+2)|0)>>>2&255;u=A;v=((z<<1)+v+(o+2)|0)>>>2&255;w=((o<<1)+z+((D&255)+2)|0)>>>2&255;x=A;y=B;z=((o<<1)+z+((D&255)+2)|0)>>>2&255;C=((J&255)+2+((I&255)<<1)+(G&255)|0)>>>2&255;o=((I&255)+2+(H&255)+((G&255)<<1)|0)>>>2&255|((J&255)+2+((I&255)<<1)+(G&255)|0)>>>2<<8&65280|(o+2+(J&255)+((D&255)<<1)|0)>>>2<<24|((I&255)+((J&255)<<1)+((D&255)+2)|0)>>>2<<16&16711680;break}case 5:{if(!(C&(y|0)!=0))break b;o=q&255;aa=r&255;l=s&255;v=F&255;p=(v+1+l|0)>>>1&255;k=(l+1+aa|0)>>>1&255;t=(aa+1+o|0)>>>1&255;u=(o+1+(D&255)|0)>>>1&255;v=(v+2+aa+(l<<1)|0)>>>2&255;w=((aa<<1)+l+(o+2)|0)>>>2&255;x=(aa+2+(o<<1)+(D&255)|0)>>>2&255;y=(o+2+(J&255)+((D&255)<<1)|0)>>>2&255;z=(l+1+aa|0)>>>1&255;A=(aa+1+o|0)>>>1&255;B=(o+1+(D&255)|0)>>>1&255;C=((I&255)+2+((J&255)<<1)+(D&255)|0)>>>2&255;o=((aa<<1)+l+(o+2)|0)>>>2<<24|((J&255)+2+((I&255)<<1)+(G&255)|0)>>>2&255|(aa+2+(o<<1)+(D&255)|0)>>>2<<16&16711680|(o+2+(J&255)+((D&255)<<1)|0)>>>2<<8&65280;break}case 6:{if(!(C&(y|0)!=0))break b;v=q&255;k=r&255;p=((s&255)+2+(k<<1)+v|0)>>>2&255;k=(k+2+(v<<1)+(D&255)|0)>>>2&255;t=(v+((J&255)+2)+((D&255)<<1)|0)>>>2&255;u=((D&255)+((J&255)+1)|0)>>>1&255;v=(v+((J&255)+2)+((D&255)<<1)|0)>>>2&255;w=((D&255)+((J&255)+1)|0)>>>1&255;x=(((J&255)<<1)+2+(I&255)+(D&255)|0)>>>2&255;y=((J&255)+1+(I&255)|0)>>>1&255;z=(((J&255)<<1)+2+(I&255)+(D&255)|0)>>>2&255;A=((J&255)+1+(I&255)|0)>>>1&255;B=(((I&255)<<1)+((J&255)+2)+(G&255)|0)>>>2&255;C=((I&255)+1+(G&255)|0)>>>1&255;o=((H&255)+1+(G&255)|0)>>>1&255|(((I&255)<<1)+((J&255)+2)+(G&255)|0)>>>2<<24|((I&255)+1+(G&255)|0)>>>1<<16&16711680|(I&255)+2+(H&255)+((G&255)<<1)<<6&65280;break}case 7:{if(!B)break b;X=(z|0)==0;y=q&255;W=r&255;o=s&255;aa=F&255;l=(X?F:p)&255;Y=(X?F:k)&255;p=(aa+1+l|0)>>>1&255;k=(aa+1+o|0)>>>1&255;t=(o+1+W|0)>>>1&255;u=(W+1+y|0)>>>1&255;v=(aa+2+Y+(l<<1)|0)>>>2&255;w=(l+(aa<<1)+(o+2)|0)>>>2&255;x=(W+(aa+2)+(o<<1)|0)>>>2&255;y=(y+(o+2)+(W<<1)|0)>>>2&255;z=(l+1+Y|0)>>>1&255;A=(aa+1+l|0)>>>1&255;B=(aa+1+o|0)>>>1&255;C=(o+1+W|0)>>>1&255;o=(W+(aa+2)+(o<<1)|0)>>>2&255|(l+2+((X?F:E)&255)+(Y<<1)|0)>>>2<<24|(aa+2+Y+(l<<1)|0)>>>2<<16&16711680|(l+(aa<<1)+(o+2)|0)>>>2<<8&65280;break}default:{if(!A)break b;p=((I&255)+2+(H&255)+((G&255)<<1)|0)>>>2&255;k=((I&255)+1+(G&255)|0)>>>1&255;t=((J&255)+2+((I&255)<<1)+(G&255)|0)>>>2&255;u=((J&255)+1+(I&255)|0)>>>1&255;v=((G&255)+2+((H&255)*3|0)|0)>>>2&255;w=((H&255)+1+(G&255)|0)>>>1&255;x=((I&255)+2+(H&255)+((G&255)<<1)|0)>>>2&255;y=((I&255)+1+(G&255)|0)>>>1&255;z=H;A=H;B=((G&255)+2+((H&255)*3|0)|0)>>>2&255;C=((H&255)+1+(G&255)|0)>>>1&255;o=(H&255)<<8|H&255|(H&255)<<16|(H&255)<<24}}c[n+((L<<4)+K)>>2]=(k&255)<<16|(p&255)<<24|(t&255)<<8|u&255;c[n+((L<<4)+K+16)>>2]=(w&255)<<16|(v&255)<<24|(x&255)<<8|y&255;c[n+((L<<4)+K+32)>>2]=(A&255)<<16|(z&255)<<24|(B&255)<<8|C&255;c[n+((L<<4)+K+48)>>2]=o;Pa(n,g+328+(M<<6)|0,M);M=M+1|0;if(M>>>0>=16){o=f+200|0;_=179;break b}}}while(0);c:do if((_|0)==179){E=c[g+140>>2]|0;o=c[o>>2]|0;do if(!o){q=(m|0)!=0;r=0}else{p=(c[f+4>>2]|0)==(c[o+4>>2]|0);if(!((m|0)!=0&p)){q=(m|0)!=0;r=p&1;break}q=1;r=(c[o>>2]|0)>>>0<6?0:p&1}while(0);o=c[f+204>>2]|0;do if(!o)k=0;else{p=(c[f+4>>2]|0)==(c[o+4>>2]|0);if(!(q&p)){k=p&1;break}k=(c[o>>2]|0)>>>0<6?0:p&1}while(0);o=c[f+212>>2]|0;do if(!o)o=0;else{p=(c[f+4>>2]|0)==(c[o+4>>2]|0);if(!(q&p)){o=p&1;break}o=(c[o>>2]|0)>>>0<6?0:p&1}while(0);C=(r|0)!=0;D=(k|0)!=0;B=C&D&(o|0)!=0;A=(r|0)==0;z=(k|0)==0;w=n+256|0;x=$+40+16|0;y=$+21|0;t=g+1352|0;u=16;v=0;while(1){switch(E|0){case 0:{q=y+1|0;do if(C&D){o=((d[q>>0]|0)+4+(d[y+2>>0]|0)+(d[y+3>>0]|0)+(d[y+4>>0]|0)+(d[x>>0]|0)+(d[x+1>>0]|0)+(d[x+2>>0]|0)+(d[x+3>>0]|0)|0)>>>3;p=((d[y+5>>0]|0)+2+(d[y+6>>0]|0)+(d[y+7>>0]|0)+(d[y+8>>0]|0)|0)>>>2}else{if(D){o=((d[q>>0]|0)+2+(d[y+2>>0]|0)+(d[y+3>>0]|0)+(d[y+4>>0]|0)|0)>>>2;p=((d[y+5>>0]|0)+2+(d[y+6>>0]|0)+(d[y+7>>0]|0)+(d[y+8>>0]|0)|0)>>>2;break}if(!C){o=128;p=128;break}p=((d[x>>0]|0)+2+(d[x+1>>0]|0)+(d[x+2>>0]|0)+(d[x+3>>0]|0)|0)>>>2;o=p}while(0);g=o&255;aa=p&255;s=w+32|0;xb(w|0,g|0,4)|0;xb(w+4|0,aa|0,4)|0;xb(w+8|0,g|0,4)|0;xb(w+12|0,aa|0,4)|0;xb(w+16|0,g|0,4)|0;xb(w+20|0,aa|0,4)|0;xb(w+24|0,g|0,4)|0;xb(w+28|0,aa|0,4)|0;do if(C){o=d[x+4>>0]|0;p=d[x+5>>0]|0;q=d[x+6>>0]|0;k=d[x+7>>0]|0;if(!D){r=(o+2+p+q+k|0)>>>2;o=(o+2+p+q+k|0)>>>2;break}r=(o+2+p+q+k|0)>>>2;o=(o+4+p+q+k+(d[y+5>>0]|0)+(d[y+6>>0]|0)+(d[y+7>>0]|0)+(d[y+8>>0]|0)|0)>>>3}else{if(!D){r=128;o=128;break}r=((d[q>>0]|0)+2+(d[y+2>>0]|0)+(d[y+3>>0]|0)+(d[y+4>>0]|0)|0)>>>2;o=((d[y+5>>0]|0)+2+(d[y+6>>0]|0)+(d[y+7>>0]|0)+(d[y+8>>0]|0)|0)>>>2}while(0);g=r&255;aa=o&255;xb(s|0,g|0,4)|0;xb(w+36|0,aa|0,4)|0;xb(w+40|0,g|0,4)|0;xb(w+44|0,aa|0,4)|0;xb(w+48|0,g|0,4)|0;xb(w+52|0,aa|0,4)|0;xb(w+56|0,g|0,4)|0;xb(w+60|0,aa|0,4)|0;break}case 1:{if(A)break c;xb(w|0,a[x>>0]|0,8)|0;xb(w+8|0,a[x+1>>0]|0,8)|0;xb(w+16|0,a[x+2>>0]|0,8)|0;xb(w+24|0,a[x+3>>0]|0,8)|0;xb(w+32|0,a[x+4>>0]|0,8)|0;xb(w+40|0,a[x+5>>0]|0,8)|0;xb(w+48|0,a[x+6>>0]|0,8)|0;xb(w+56|0,a[x+7>>0]|0,8)|0;break}case 2:{if(z)break c;aa=a[y+1>>0]|0;a[w>>0]=aa;a[w+8>>0]=aa;a[w+16>>0]=aa;a[w+24>>0]=aa;a[w+32>>0]=aa;a[w+40>>0]=aa;a[w+48>>0]=aa;a[w+56>>0]=aa;aa=a[y+2>>0]|0;a[w+1>>0]=aa;a[w+9>>0]=aa;a[w+17>>0]=aa;a[w+25>>0]=aa;a[w+33>>0]=aa;a[w+41>>0]=aa;a[w+49>>0]=aa;a[w+57>>0]=aa;aa=a[y+3>>0]|0;a[w+2>>0]=aa;a[w+10>>0]=aa;a[w+18>>0]=aa;a[w+26>>0]=aa;a[w+34>>0]=aa;a[w+42>>0]=aa;a[w+50>>0]=aa;a[w+58>>0]=aa;aa=a[y+4>>0]|0;a[w+3>>0]=aa;a[w+11>>0]=aa;a[w+19>>0]=aa;a[w+27>>0]=aa;a[w+35>>0]=aa;a[w+43>>0]=aa;a[w+51>>0]=aa;a[w+59>>0]=aa;aa=a[y+5>>0]|0;a[w+4>>0]=aa;a[w+12>>0]=aa;a[w+20>>0]=aa;a[w+28>>0]=aa;a[w+36>>0]=aa;a[w+44>>0]=aa;a[w+52>>0]=aa;a[w+60>>0]=aa;aa=a[y+6>>0]|0;a[w+5>>0]=aa;a[w+13>>0]=aa;a[w+21>>0]=aa;a[w+29>>0]=aa;a[w+37>>0]=aa;a[w+45>>0]=aa;a[w+53>>0]=aa;a[w+61>>0]=aa;aa=a[y+7>>0]|0;a[w+6>>0]=aa;a[w+14>>0]=aa;a[w+22>>0]=aa;a[w+30>>0]=aa;a[w+38>>0]=aa;a[w+46>>0]=aa;a[w+54>>0]=aa;a[w+62>>0]=aa;aa=a[y+8>>0]|0;a[w+7>>0]=aa;a[w+15>>0]=aa;a[w+23>>0]=aa;a[w+31>>0]=aa;a[w+39>>0]=aa;a[w+47>>0]=aa;a[w+55>>0]=aa;a[w+63>>0]=aa;break}default:{if(!B)break c;r=d[y+8>>0]|0;s=d[x+7>>0]|0;q=d[y>>0]|0;p=(((d[y+5>>0]|0)-(d[y+3>>0]|0)+((d[y+6>>0]|0)-(d[y+2>>0]|0)<<1)+(((d[y+7>>0]|0)-(d[y+1>>0]|0)|0)*3|0)+(r-q<<2)|0)*17|0)+16>>5;q=(((d[x+4>>0]|0)-(d[x+2>>0]|0)+(s-q<<2)+((d[x+5>>0]|0)-(d[x+1>>0]|0)<<1)+(((d[x+6>>0]|0)-(d[x>>0]|0)|0)*3|0)|0)*17|0)+16>>5;k=Z(p,-3)|0;o=w;r=(s+r<<4)+16+(Z(q,-3)|0)|0;s=8;while(1){s=s+-1|0;aa=r+k|0;a[o>>0]=a[6294+((aa>>5)+512)>>0]|0;a[o+1>>0]=a[6294+((aa+p>>5)+512)>>0]|0;a[o+2>>0]=a[6294+((aa+p+p>>5)+512)>>0]|0;a[o+3>>0]=a[6294+((aa+p+p+p>>5)+512)>>0]|0;a[o+4>>0]=a[6294+((aa+p+p+p+p>>5)+512)>>0]|0;aa=aa+p+p+p+p+p|0;a[o+5>>0]=a[6294+((aa>>5)+512)>>0]|0;a[o+6>>0]=a[6294+((aa+p>>5)+512)>>0]|0;a[o+7>>0]=a[6294+((aa+p+p>>5)+512)>>0]|0;if(!s)break;else{o=o+8|0;r=r+q|0}}}}Pa(w,t,u);aa=u|1;Pa(w,t+64|0,aa);Pa(w,t+128|0,aa+1|0);Pa(w,t+192|0,u|3);v=v+1|0;if(v>>>0>=2)break;else{w=w+64|0;x=x+8|0;y=y+9|0;t=t+256|0;u=u+4|0}}if((c[f+196>>2]|0)>>>0<=1)$a(h,n);aa=0;i=$;return aa|0}while(0);aa=1;i=$;return aa|0}while(0);aa=c[h+4>>2]|0;T=((l>>>0)/(aa>>>0)|0)<<4;U=l-(Z((l>>>0)/(aa>>>0)|0,aa)|0)<<4;c[$+4>>2]=aa;c[$+8>>2]=c[h+8>>2];d:do switch(r|0){case 1:case 0:{z=c[g+144>>2]|0;o=c[f+200>>2]|0;if((o|0)!=0?(c[o+4>>2]|0)==(c[f+4>>2]|0):0)if((c[o>>2]|0)>>>0<6){v=e[o+152>>1]|e[o+152+2>>1]<<16;k=1;s=c[o+104>>2]|0;o=v>>>16&65535;v=v&65535}else{k=1;s=-1;o=0;v=0}else{k=0;s=-1;o=0;v=0}p=c[f+204>>2]|0;if((p|0)!=0?(c[p+4>>2]|0)==(c[f+4>>2]|0):0)if((c[p>>2]|0)>>>0<6){u=e[p+172>>1]|e[p+172+2>>1]<<16;q=1;t=c[p+108>>2]|0;w=u>>>16&65535;u=u&65535}else{q=1;t=-1;w=0;u=0}else{q=0;t=-1;w=0;u=0}do if(!r)if(!((k|0)==0|(q|0)==0)){if((s|0)==0?((o&65535)<<16|v&65535|0)==0:0){p=0;o=0;break}if((t|0)==0?((w&65535)<<16|u&65535|0)==0:0){p=0;o=0}else _=230}else{p=0;o=0}else _=230;while(0);if((_|0)==230){x=b[g+160>>1]|0;y=b[g+162>>1]|0;p=c[f+208>>2]|0;if((p|0)!=0?(c[p+4>>2]|0)==(c[f+4>>2]|0):0)if((c[p>>2]|0)>>>0<6){r=c[p+108>>2]|0;k=e[p+172>>1]|e[p+172+2>>1]<<16;_=239}else{r=-1;k=0;_=239}else _=234;do if((_|0)==234){p=c[f+212>>2]|0;if((p|0)!=0?(c[p+4>>2]|0)==(c[f+4>>2]|0):0){if((c[p>>2]|0)>>>0>=6){r=-1;k=0;_=239;break}r=c[p+112>>2]|0;k=e[p+192>>1]|e[p+192+2>>1]<<16;_=239;break}if((k|0)==0|(q|0)!=0){r=-1;k=0;_=239}else p=v}while(0);do if((_|0)==239){q=(s|0)==(z|0);p=(t|0)==(z|0);if(((p&1)+(q&1)+((r|0)==(z|0)&1)|0)!=1){Y=v<<16>>16;W=u<<16>>16;p=k<<16>>16;V=u<<16>>16>v<<16>>16;X=V?W:Y;Y=V?Y:(W|0)<(Y|0)?W:Y;W=o<<16>>16;V=w<<16>>16;aa=k>>16;o=w<<16>>16>o<<16>>16;m=o?V:W;o=o?W:(V|0)<(W|0)?V:W;p=((X|0)<(p|0)?X:(Y|0)>(p|0)?Y:p)&65535;o=((m|0)<(aa|0)?m:(o|0)>(aa|0)?o:aa)&65535;break}if(q|p){p=q?v:u;o=q?o:w}else{p=k&65535;o=k>>>16&65535}}while(0);p=(p&65535)+(x&65535)|0;o=(o&65535)+(y&65535)|0;if(((p<<16>>16)+8192|0)>>>0>16383){_=427;break d}if(((o<<16>>16)+2048|0)>>>0>4095){_=427;break d}else{p=p&65535;o=o&65535}}if(((z>>>0<=16?(J=c[(c[j+4>>2]|0)+(z<<2)>>2]|0,(J|0)!=0):0)?(c[J+20>>2]|0)>>>0>1:0)?(K=c[J>>2]|0,(K|0)!=0):0){b[f+192>>1]=p;b[f+194>>1]=o;aa=e[f+192>>1]|e[f+192+2>>1]<<16;b[f+188>>1]=aa;b[f+188+2>>1]=aa>>>16;b[f+184>>1]=aa;b[f+184+2>>1]=aa>>>16;b[f+180>>1]=aa;b[f+180+2>>1]=aa>>>16;b[f+176>>1]=aa;b[f+176+2>>1]=aa>>>16;b[f+172>>1]=aa;b[f+172+2>>1]=aa>>>16;b[f+168>>1]=aa;b[f+168+2>>1]=aa>>>16;b[f+164>>1]=aa;b[f+164+2>>1]=aa>>>16;b[f+160>>1]=aa;b[f+160+2>>1]=aa>>>16;b[f+156>>1]=aa;b[f+156+2>>1]=aa>>>16;b[f+152>>1]=aa;b[f+152+2>>1]=aa>>>16;b[f+148>>1]=aa;b[f+148+2>>1]=aa>>>16;b[f+144>>1]=aa;b[f+144+2>>1]=aa>>>16;b[f+140>>1]=aa;b[f+140+2>>1]=aa>>>16;b[f+136>>1]=aa;b[f+136+2>>1]=aa>>>16;b[f+132>>1]=aa;b[f+132+2>>1]=aa>>>16;c[f+100>>2]=z;c[f+104>>2]=z;c[f+108>>2]=z;c[f+112>>2]=z;c[f+116>>2]=K;c[f+120>>2]=K;c[f+124>>2]=K;c[f+128>>2]=K;c[$>>2]=K;Wa(n,f+132|0,$,U,T,0,0,16,16)}else _=427;break}case 2:{v=b[g+160>>1]|0;w=b[g+162>>1]|0;x=c[g+144>>2]|0;o=c[f+204>>2]|0;if((o|0)!=0?(c[o+4>>2]|0)==(c[f+4>>2]|0):0)if((c[o>>2]|0)>>>0<6){u=e[o+172>>1]|e[o+172+2>>1]<<16;o=c[o+108>>2]|0;r=1;t=u&65535;u=u>>>16&65535}else{o=-1;r=1;t=0;u=0}else{o=-1;r=0;t=0;u=0}e:do if((o|0)!=(x|0)){o=c[f+200>>2]|0;if((o|0)!=0?(c[o+4>>2]|0)==(c[f+4>>2]|0):0)if((c[o>>2]|0)>>>0<6){aa=e[o+152>>1]|e[o+152+2>>1]<<16;k=1;s=c[o+104>>2]|0;p=aa&65535;o=aa>>>16&65535}else{k=1;s=-1;p=0;o=0}else{k=0;s=-1;p=0;o=0}q=c[f+208>>2]|0;if((q|0)!=0?(c[q+4>>2]|0)==(c[f+4>>2]|0):0)if((c[q>>2]|0)>>>0<6){r=c[q+108>>2]|0;k=e[q+172>>1]|e[q+172+2>>1]<<16}else{r=-1;k=0}else _=263;do if((_|0)==263){q=c[f+212>>2]|0;if((q|0)!=0?(c[q+4>>2]|0)==(c[f+4>>2]|0):0){if((c[q>>2]|0)>>>0>=6){r=-1;k=0;break}r=c[q+112>>2]|0;k=e[q+192>>1]|e[q+192+2>>1]<<16;break}if((r|0)!=0|(k|0)==0){r=-1;k=0}else break e}while(0);q=(s|0)==(x|0);if((((r|0)==(x|0)&1)+(q&1)|0)!=1){W=p<<16>>16;V=t<<16>>16;Y=k<<16>>16;p=t<<16>>16>p<<16>>16;X=p?V:W;p=p?W:(V|0)<(W|0)?V:W;W=o<<16>>16;V=u<<16>>16;aa=k>>16;o=u<<16>>16>o<<16>>16;m=o?V:W;o=o?W:(V|0)<(W|0)?V:W;p=((X|0)<(Y|0)?X:(p|0)>(Y|0)?p:Y)&65535;o=((m|0)<(aa|0)?m:(o|0)>(aa|0)?o:aa)&65535;break}if(q){p=q?p:t;o=q?o:u}else{p=k&65535;o=k>>>16&65535}}else{p=t;o=u}while(0);p=(p&65535)+(v&65535)|0;o=(o&65535)+(w&65535)|0;if((((((p<<16>>16)+8192|0)>>>0<=16383?!(x>>>0>16|((o<<16>>16)+2048|0)>>>0>4095):0)?(I=c[(c[j+4>>2]|0)+(x<<2)>>2]|0,(I|0)!=0):0)?(c[I+20>>2]|0)>>>0>1:0)?(M=c[I>>2]|0,(M|0)!=0):0){b[f+160>>1]=p;b[f+162>>1]=o;k=e[f+160>>1]|e[f+160+2>>1]<<16;b[f+156>>1]=k;b[f+156+2>>1]=k>>>16;b[f+152>>1]=k;b[f+152+2>>1]=k>>>16;b[f+148>>1]=k;b[f+148+2>>1]=k>>>16;b[f+144>>1]=k;b[f+144+2>>1]=k>>>16;b[f+140>>1]=k;b[f+140+2>>1]=k>>>16;b[f+136>>1]=k;b[f+136+2>>1]=k>>>16;b[f+132>>1]=k;b[f+132+2>>1]=k>>>16;c[f+100>>2]=x;c[f+104>>2]=x;c[f+116>>2]=M;c[f+120>>2]=M;s=b[g+164>>1]|0;t=b[g+166>>1]|0;u=c[g+148>>2]|0;p=c[f+200>>2]|0;if(((p|0)!=0?(c[p+4>>2]|0)==(c[f+4>>2]|0):0)?(c[p>>2]|0)>>>0<6:0){r=e[p+184>>1]|e[p+184+2>>1]<<16;o=c[p+112>>2]|0;q=r>>>16&65535;r=r&65535}else{o=-1;q=0;r=0}do if((o|0)!=(u|0)){if(((p|0)!=0?(c[p+4>>2]|0)==(c[f+4>>2]|0):0)?(c[p>>2]|0)>>>0<6:0){o=c[p+104>>2]|0;p=e[p+160>>1]|e[p+160+2>>1]<<16}else{o=-1;p=0}if((((o|0)==(u|0)&1)+((x|0)==(u|0)&1)|0)==1){q=(x|0)==(u|0)?k>>>16:p>>>16;o=(x|0)==(u|0)?k:p;break}else{aa=r<<16>>16;o=p<<16>>16;W=(k&65535)<<16>>16>r<<16>>16;m=W?k<<16>>16:aa;aa=W?aa:(k<<16>>16|0)<(aa|0)?k<<16>>16:aa;W=q<<16>>16;Y=p>>16;q=(k>>>16&65535)<<16>>16>q<<16>>16;X=q?k>>16:W;q=q?W:(k>>16|0)<(W|0)?k>>16:W;q=(X|0)<(Y|0)?X:(q|0)>(Y|0)?q:Y;o=(m|0)<(o|0)?m:(aa|0)>(o|0)?aa:o;break}}else{o=q&65535;q=o;o=o<<16|r&65535}while(0);p=(o&65535)+(s&65535)|0;o=(q&65535)+(t&65535)|0;if((((((p<<16>>16)+8192|0)>>>0<=16383?!(u>>>0>16|((o<<16>>16)+2048|0)>>>0>4095):0)?(N=c[(c[j+4>>2]|0)+(u<<2)>>2]|0,(N|0)!=0):0)?(c[N+20>>2]|0)>>>0>1:0)?(O=c[N>>2]|0,(O|0)!=0):0){b[f+192>>1]=p;b[f+194>>1]=o;aa=e[f+192>>1]|e[f+192+2>>1]<<16;b[f+188>>1]=aa;b[f+188+2>>1]=aa>>>16;b[f+184>>1]=aa;b[f+184+2>>1]=aa>>>16;b[f+180>>1]=aa;b[f+180+2>>1]=aa>>>16;b[f+176>>1]=aa;b[f+176+2>>1]=aa>>>16;b[f+172>>1]=aa;b[f+172+2>>1]=aa>>>16;b[f+168>>1]=aa;b[f+168+2>>1]=aa>>>16;b[f+164>>1]=aa;b[f+164+2>>1]=aa>>>16;c[f+108>>2]=u;c[f+112>>2]=u;c[f+124>>2]=O;c[f+128>>2]=O;c[$>>2]=M;Wa(n,f+132|0,$,U,T,0,0,16,8);c[$>>2]=c[f+124>>2];Wa(n,f+164|0,$,U,T,0,8,16,8)}else _=427}else _=427;break}case 3:{u=b[g+160>>1]|0;v=b[g+162>>1]|0;w=c[g+144>>2]|0;o=c[f+200>>2]|0;if((o|0)!=0?(c[o+4>>2]|0)==(c[f+4>>2]|0):0)if((c[o>>2]|0)>>>0<6){aa=e[o+152>>1]|e[o+152+2>>1]<<16;p=c[o+104>>2]|0;q=1;t=aa&65535;o=aa>>>16&65535}else{p=-1;q=1;t=0;o=0}else{p=-1;q=0;t=0;o=0}f:do if((p|0)!=(w|0)){k=c[f+204>>2]|0;if((k|0)!=0?(c[k+4>>2]|0)==(c[f+4>>2]|0):0)if((c[k>>2]|0)>>>0<6){r=e[k+172>>1]|e[k+172+2>>1]<<16;q=c[k+108>>2]|0;s=c[k+112>>2]|0;p=r&65535;k=e[k+188>>1]|e[k+188+2>>1]<<16;r=r>>>16&65535}else{q=-1;s=-1;p=0;k=0;r=0}else _=305;do if((_|0)==305){k=c[f+212>>2]|0;if((k|0)!=0?(c[k+4>>2]|0)==(c[f+4>>2]|0):0){if((c[k>>2]|0)>>>0>=6){q=-1;s=-1;p=0;k=0;r=0;break}q=-1;s=c[k+112>>2]|0;p=0;k=e[k+192>>1]|e[k+192+2>>1]<<16;r=0;break}if(!q){q=-1;s=-1;p=0;k=0;r=0}else{p=t;break f}}while(0);q=(q|0)==(w|0);if(((q&1)+((s|0)==(w|0)&1)|0)!=1){W=t<<16>>16;V=p<<16>>16;Y=k<<16>>16;p=p<<16>>16>t<<16>>16;X=p?V:W;p=p?W:(V|0)<(W|0)?V:W;W=o<<16>>16;V=r<<16>>16;aa=k>>16;o=r<<16>>16>o<<16>>16;m=o?V:W;o=o?W:(V|0)<(W|0)?V:W;p=((X|0)<(Y|0)?X:(p|0)>(Y|0)?p:Y)&65535;o=((m|0)<(aa|0)?m:(o|0)>(aa|0)?o:aa)&65535;break}if(q)o=r;else{p=k&65535;o=k>>>16&65535}}else p=t;while(0);p=(p&65535)+(u&65535)|0;o=(o&65535)+(v&65535)|0;if((((((p<<16>>16)+8192|0)>>>0<=16383?!(w>>>0>16|((o<<16>>16)+2048|0)>>>0>4095):0)?(H=c[(c[j+4>>2]|0)+(w<<2)>>2]|0,(H|0)!=0):0)?(c[H+20>>2]|0)>>>0>1:0)?(Q=c[H>>2]|0,(Q|0)!=0):0){b[f+176>>1]=p;b[f+178>>1]=o;o=e[f+176>>1]|e[f+176+2>>1]<<16;b[f+172>>1]=o;b[f+172+2>>1]=o>>>16;b[f+168>>1]=o;b[f+168+2>>1]=o>>>16;b[f+164>>1]=o;b[f+164+2>>1]=o>>>16;b[f+144>>1]=o;b[f+144+2>>1]=o>>>16;b[f+140>>1]=o;b[f+140+2>>1]=o>>>16;b[f+136>>1]=o;b[f+136+2>>1]=o>>>16;b[f+132>>1]=o;b[f+132+2>>1]=o>>>16;c[f+100>>2]=w;c[f+108>>2]=w;c[f+116>>2]=Q;c[f+124>>2]=Q;s=b[g+164>>1]|0;t=b[g+166>>1]|0;u=c[g+148>>2]|0;p=c[f+208>>2]|0;if((p|0)!=0?(c[p+4>>2]|0)==(c[f+4>>2]|0):0)if((c[p>>2]|0)>>>0<6){k=c[p+108>>2]|0;r=e[p+172>>1]|e[p+172+2>>1]<<16;q=1}else{k=-1;r=0;q=1}else{p=c[f+204>>2]|0;if((p|0)!=0?(c[p+4>>2]|0)==(c[f+4>>2]|0):0)if((c[p>>2]|0)>>>0<6){k=c[p+108>>2]|0;r=e[p+176>>1]|e[p+176+2>>1]<<16;q=1}else{k=-1;r=0;q=1}else{k=-1;r=0;q=0}}do if((k|0)!=(u|0)){p=c[f+204>>2]|0;if((p|0)!=0?(c[p+4>>2]|0)==(c[f+4>>2]|0):0)if((c[p>>2]|0)>>>0<6){q=e[p+188>>1]|e[p+188+2>>1]<<16;p=c[p+112>>2]|0;k=q&65535;q=q>>>16&65535}else{p=-1;k=0;q=0}else if(!q){q=o>>>16;break}else{p=-1;k=0;q=0}p=(p|0)==(u|0);if(((p&1)+((w|0)==(u|0)&1)|0)!=1){m=k<<16>>16;aa=r<<16>>16;V=k<<16>>16>(o&65535)<<16>>16;Y=V?m:o<<16>>16;m=V?o<<16>>16:(m|0)<(o<<16>>16|0)?m:o<<16>>16;V=q<<16>>16;X=r>>16;q=q<<16>>16>(o>>>16&65535)<<16>>16;W=q?V:o>>16;q=q?o>>16:(V|0)<(o>>16|0)?V:o>>16;q=(W|0)<(X|0)?W:(q|0)>(X|0)?q:X;o=(Y|0)<(aa|0)?Y:(m|0)>(aa|0)?m:aa;break}if((w|0)!=(u|0))if(p){o=q&65535;q=o;o=o<<16|k&65535;break}else{q=r>>>16;o=r;break}else q=o>>>16}else{q=r>>>16;o=r}while(0);p=(o&65535)+(s&65535)|0;o=(q&65535)+(t&65535)|0;if((((((p<<16>>16)+8192|0)>>>0<=16383?!(u>>>0>16|((o<<16>>16)+2048|0)>>>0>4095):0)?(R=c[(c[j+4>>2]|0)+(u<<2)>>2]|0,(R|0)!=0):0)?(c[R+20>>2]|0)>>>0>1:0)?(S=c[R>>2]|0,(S|0)!=0):0){b[f+192>>1]=p;b[f+194>>1]=o;aa=e[f+192>>1]|e[f+192+2>>1]<<16;b[f+188>>1]=aa;b[f+188+2>>1]=aa>>>16;b[f+184>>1]=aa;b[f+184+2>>1]=aa>>>16;b[f+180>>1]=aa;b[f+180+2>>1]=aa>>>16;b[f+160>>1]=aa;b[f+160+2>>1]=aa>>>16;b[f+156>>1]=aa;b[f+156+2>>1]=aa>>>16;b[f+152>>1]=aa;b[f+152+2>>1]=aa>>>16;b[f+148>>1]=aa;b[f+148+2>>1]=aa>>>16;c[f+104>>2]=u;c[f+112>>2]=u;c[f+120>>2]=S;c[f+128>>2]=S;c[$>>2]=Q;Wa(n,f+132|0,$,U,T,0,0,8,16);c[$>>2]=c[f+120>>2];Wa(n,f+148|0,$,U,T,8,0,8,16)}else _=427}else _=427;break}default:{o=0;do{F=g+176+(o<<2)|0;switch(c[F>>2]|0){case 0:{E=1;break}case 2:case 1:{E=2;break}default:E=4}G=g+192+(o<<2)|0;c[f+100+(o<<2)>>2]=c[G>>2];q=c[G>>2]|0;if(q>>>0>16){_=353;break}p=c[(c[j+4>>2]|0)+(q<<2)>>2]|0;if(!p){_=353;break}if((c[p+20>>2]|0)>>>0<=1){_=353;break}aa=c[p>>2]|0;c[f+116+(o<<2)>>2]=aa;if(!aa){_=427;break d}D=o<<2;p=0;while(1){A=b[g+208+(o<<4)+(p<<2)>>1]|0;B=b[g+208+(o<<4)+(p<<2)+2>>1]|0;C=c[F>>2]|0;switch(c[1280+(o<<7)+(C<<5)+(p<<3)>>2]|0){case 0:{k=c[f+200>>2]|0;_=361;break}case 1:{k=c[f+204>>2]|0;_=361;break}case 2:{k=c[f+208>>2]|0;_=361;break}case 3:{k=c[f+212>>2]|0;_=361;break}case 4:{k=f;_=361;break}default:{u=0;w=-1;k=0;z=0}}if((_|0)==361){_=0;r=d[1280+(o<<7)+(C<<5)+(p<<3)+4>>0]|0;if((k|0)!=0?(c[k+4>>2]|0)==(c[f+4>>2]|0):0)if((c[k>>2]|0)>>>0<6){z=k+132+(r<<2)|0;z=e[z>>1]|e[z+2>>1]<<16;u=1;w=c[k+100+(r>>>2<<2)>>2]|0;k=z&65535;z=z>>>16&65535}else{u=1;w=-1;k=0;z=0}else{u=0;w=-1;k=0;z=0}}switch(c[1792+(o<<7)+(C<<5)+(p<<3)>>2]|0){case 0:{s=c[f+200>>2]|0;_=370;break}case 1:{s=c[f+204>>2]|0;_=370;break}case 2:{s=c[f+208>>2]|0;_=370;break}case 3:{s=c[f+212>>2]|0;_=370;break}case 4:{s=f;_=370;break}default:{t=0;v=-1;x=0;y=0}}if((_|0)==370){r=d[1792+(o<<7)+(C<<5)+(p<<3)+4>>0]|0;if((s|0)!=0?(c[s+4>>2]|0)==(c[f+4>>2]|0):0)if((c[s>>2]|0)>>>0<6){y=s+132+(r<<2)|0;y=e[y>>1]|e[y+2>>1]<<16;t=1;v=c[s+100+(r>>>2<<2)>>2]|0;x=y&65535;y=y>>>16&65535}else{t=1;v=-1;x=0;y=0}else{t=0;v=-1;x=0;y=0}}switch(c[2304+(o<<7)+(C<<5)+(p<<3)>>2]|0){case 0:{s=c[f+200>>2]|0;_=379;break}case 1:{s=c[f+204>>2]|0;_=379;break}case 2:{s=c[f+208>>2]|0;_=379;break}case 3:{s=c[f+212>>2]|0;_=379;break}case 4:{s=f;_=379;break}default:_=383}if((_|0)==379){r=d[2304+(o<<7)+(C<<5)+(p<<3)+4>>0]|0;if((s|0)!=0?(c[s+4>>2]|0)==(c[f+4>>2]|0):0)if((c[s>>2]|0)>>>0<6){u=s+132+(r<<2)|0;t=c[s+100+(r>>>2<<2)>>2]|0;u=e[u>>1]|e[u+2>>1]<<16;_=393}else{t=-1;u=0;_=393}else _=383}do if((_|0)==383){_=0;switch(c[2816+(o<<7)+(C<<5)+(p<<3)>>2]|0){case 0:{L=c[f+200>>2]|0;_=388;break}case 1:{L=c[f+204>>2]|0;_=388;break}case 2:{L=c[f+208>>2]|0;_=388;break}case 3:{L=c[f+212>>2]|0;_=388;break}case 4:{L=f;_=388;break}default:{}}if(((_|0)==388?(_=0,P=d[2816+(o<<7)+(C<<5)+(p<<3)+4>>0]|0,(L|0)!=0):0)?(c[L+4>>2]|0)==(c[f+4>>2]|0):0){if((c[L>>2]|0)>>>0>=6){t=-1;u=0;_=393;break}u=L+132+(P<<2)|0;t=c[L+100+(P>>>2<<2)>>2]|0;u=e[u>>1]|e[u+2>>1]<<16;_=393;break}if((u|0)==0|(t|0)!=0){t=-1;u=0;_=393}else q=z}while(0);do if((_|0)==393){_=0;s=(w|0)==(q|0);r=(v|0)==(q|0);if(((r&1)+(s&1)+((t|0)==(q|0)&1)|0)!=1){aa=k<<16>>16;W=x<<16>>16;Y=u<<16>>16;k=x<<16>>16>k<<16>>16;X=k?W:aa;k=k?aa:(W|0)<(aa|0)?W:aa;aa=z<<16>>16;W=y<<16>>16;q=u>>16;V=y<<16>>16>z<<16>>16;m=V?W:aa;aa=V?aa:(W|0)<(aa|0)?W:aa;k=((X|0)<(Y|0)?X:(k|0)>(Y|0)?k:Y)&65535;q=((m|0)<(q|0)?m:(aa|0)>(q|0)?aa:q)&65535;break}if(s|r){k=s?k:x;q=s?z:y}else{k=u&65535;q=u>>>16&65535}}while(0);k=(k&65535)+(A&65535)|0;q=(q&65535)+(B&65535)|0;if(((k<<16>>16)+8192|0)>>>0>16383){_=427;break d}if(((q<<16>>16)+2048|0)>>>0>4095){_=427;break d}switch(C|0){case 0:{b[f+132+(D<<2)>>1]=k;b[f+132+(D<<2)+2>>1]=q;b[f+132+((D|1)<<2)>>1]=k;b[f+132+((D|1)<<2)+2>>1]=q;b[f+132+((D|2)<<2)>>1]=k;b[f+132+((D|2)<<2)+2>>1]=q;b[f+132+((D|3)<<2)>>1]=k;b[f+132+((D|3)<<2)+2>>1]=q;break}case 1:{aa=(p<<1)+D|0;b[f+132+(aa<<2)>>1]=k;b[f+132+(aa<<2)+2>>1]=q;b[f+132+((aa|1)<<2)>>1]=k;b[f+132+((aa|1)<<2)+2>>1]=q;break}case 2:{aa=p+D|0;b[f+132+(aa<<2)>>1]=k;b[f+132+(aa<<2)+2>>1]=q;b[f+132+(aa+2<<2)>>1]=k;b[f+132+(aa+2<<2)+2>>1]=q;break}case 3:{aa=p+D|0;b[f+132+(aa<<2)>>1]=k;b[f+132+(aa<<2)+2>>1]=q;break}default:{}}p=p+1|0;if(p>>>0>=E>>>0)break;q=c[G>>2]|0}o=o+1|0}while(o>>>0<4);if((_|0)==353){c[f+116+(o<<2)>>2]=0;_=427;break d}q=0;while(1){c[$>>2]=c[f+116+(q<<2)>>2];o=q<<3&8;p=q>>>0<2?0:8;switch(c[g+176+(q<<2)>>2]|0){case 0:{Wa(n,f+132+(q<<2<<2)|0,$,U,T,o,p,8,8);break}case 1:{aa=q<<2;Wa(n,f+132+(aa<<2)|0,$,U,T,o,p,8,4);Wa(n,f+132+((aa|2)<<2)|0,$,U,T,o,p|4,8,4);break}case 2:{aa=q<<2;Wa(n,f+132+(aa<<2)|0,$,U,T,o,p,4,8);Wa(n,f+132+((aa|1)<<2)|0,$,U,T,o|4,p,4,8);break}default:{aa=q<<2;Wa(n,f+132+(aa<<2)|0,$,U,T,o,p,4,4);Wa(n,f+132+((aa|1)<<2)|0,$,U,T,o|4,p,4,4);Wa(n,f+132+((aa|2)<<2)|0,$,U,T,o,p|4,4,4);Wa(n,f+132+((aa|3)<<2)|0,$,U,T,o|4,p|4,4,4)}}q=q+1|0;if((q|0)==4)break d}}}while(0);if((_|0)==427){aa=1;i=$;return aa|0}do if((c[f+196>>2]|0)>>>0<=1){if(!(c[f>>2]|0)){$a(h,n);break}w=c[h+4>>2]|0;s=c[h+8>>2]|0;v=c[h>>2]|0;r=0;do{p=c[1152+(r<<2)>>2]|0;q=c[1216+(r<<2)>>2]|0;o=(l-((l>>>0)%(w>>>0)|0)<<8)+(((l>>>0)%(w>>>0)|0)<<4)+p+(Z(q,w<<4)|0)|0;k=c[g+328+(r<<6)>>2]|0;if((k|0)==16777215){aa=c[n+((q<<4)+p+16)>>2]|0;c[v+o>>2]=c[n+((q<<4)+p)>>2];c[v+o+((w<<2&1073741820)<<2)>>2]=aa;aa=c[n+((q<<4)+p+48)>>2]|0;c[v+o+((w<<2&1073741820)<<1<<2)>>2]=c[n+((q<<4)+p+32)>>2];c[v+o+((w<<2&1073741820)*3<<2)>>2]=aa}else{aa=d[n+((q<<4)+p+1)>>0]|0;h=c[g+328+(r<<6)+4>>2]|0;a[v+o>>0]=a[6294+(k+512+(d[n+((q<<4)+p)>>0]|0))>>0]|0;f=d[n+((q<<4)+p+2)>>0]|0;_=c[g+328+(r<<6)+8>>2]|0;a[v+(o+1)>>0]=a[6294+((aa|512)+h)>>0]|0;h=d[n+((q<<4)+p+3)>>0]|0;aa=c[g+328+(r<<6)+12>>2]|0;a[v+(o+2)>>0]=a[6294+(_+512+f)>>0]|0;a[v+(o+3)>>0]=a[6294+(aa+512+h)>>0]|0;h=d[n+((q<<4)+p+17)>>0]|0;aa=c[g+328+(r<<6)+20>>2]|0;a[v+(o+(w<<4))>>0]=a[6294+((c[g+328+(r<<6)+16>>2]|0)+512+(d[n+((q<<4)+p+16)>>0]|0))>>0]|0;f=d[n+((q<<4)+p+18)>>0]|0;_=c[g+328+(r<<6)+24>>2]|0;a[v+(o+(w<<4)+1)>>0]=a[6294+((h|512)+aa)>>0]|0;aa=d[n+((q<<4)+p+19)>>0]|0;h=c[g+328+(r<<6)+28>>2]|0;a[v+(o+(w<<4)+2)>>0]=a[6294+(_+512+f)>>0]|0;a[v+(o+(w<<4)+3)>>0]=a[6294+(h+512+aa)>>0]|0;aa=o+(w<<4)+(w<<4)|0;h=d[n+((q<<4)+p+33)>>0]|0;f=c[g+328+(r<<6)+36>>2]|0;a[v+aa>>0]=a[6294+((c[g+328+(r<<6)+32>>2]|0)+512+(d[n+((q<<4)+p+32)>>0]|0))>>0]|0;_=d[n+((q<<4)+p+34)>>0]|0;m=c[g+328+(r<<6)+40>>2]|0;a[v+(aa+1)>>0]=a[6294+((h|512)+f)>>0]|0;f=d[n+((q<<4)+p+35)>>0]|0;h=c[g+328+(r<<6)+44>>2]|0;a[v+(aa+2)>>0]=a[6294+(m+512+_)>>0]|0;a[v+(aa+3)>>0]=a[6294+(h+512+f)>>0]|0;f=d[n+((q<<4)+p+49)>>0]|0;h=c[g+328+(r<<6)+52>>2]|0;a[v+(aa+(w<<4))>>0]=a[6294+((c[g+328+(r<<6)+48>>2]|0)+512+(d[n+((q<<4)+p+48)>>0]|0))>>0]|0;_=d[n+((q<<4)+p+50)>>0]|0;m=c[g+328+(r<<6)+56>>2]|0;a[v+(aa+(w<<4)+1)>>0]=a[6294+((f|512)+h)>>0]|0;h=d[n+((q<<4)+p+51)>>0]|0;f=c[g+328+(r<<6)+60>>2]|0;a[v+(aa+(w<<4)+2)>>0]=a[6294+(m+512+_)>>0]|0;a[v+(aa+(w<<4)+3)>>0]=a[6294+(f+512+h)>>0]|0}r=r+1|0}while((r|0)!=16);q=Z(s,w)|0;t=16;do{r=t&3;k=c[1152+(r<<2)>>2]|0;r=c[1216+(r<<2)>>2]|0;u=t>>>0>19;o=u?320:256;p=(r<<3)+k+o|0;u=(((l>>>0)%(w>>>0)|0)<<3)+(q<<8)+(l-((l>>>0)%(w>>>0)|0)<<6)+k+(u?q<<6:0)+(Z(r,w<<3&2147483640)|0)|0;s=c[g+328+(t<<6)>>2]|0;if((s|0)==16777215){aa=c[n+((r<<3)+k+(o|8))>>2]|0;c[v+u>>2]=c[n+p>>2];c[v+u+((w<<3&2147483640)>>>2<<2)>>2]=aa;aa=c[n+((r<<3)+k+(o|24))>>2]|0;c[v+u+((w<<3&2147483640)>>>1<<2)>>2]=c[n+((r<<3)+k+(o|16))>>2];c[v+u+(((w<<3&2147483640)>>>1)+((w<<3&2147483640)>>>2)<<2)>>2]=aa}else{f=d[n+(p+1)>>0]|0;aa=c[g+328+(t<<6)+4>>2]|0;a[v+u>>0]=a[6294+(s+512+(d[n+p>>0]|0))>>0]|0;h=d[n+(p+2)>>0]|0;_=c[g+328+(t<<6)+8>>2]|0;a[v+(u+1)>>0]=a[6294+((f|512)+aa)>>0]|0;aa=d[n+(p+3)>>0]|0;f=c[g+328+(t<<6)+12>>2]|0;a[v+(u+2)>>0]=a[6294+(_+512+h)>>0]|0;a[v+(u+3)>>0]=a[6294+(f+512+aa)>>0]|0;aa=u+(w<<3&2147483640)|0;f=d[n+(p+9)>>0]|0;h=c[g+328+(t<<6)+20>>2]|0;a[v+aa>>0]=a[6294+((c[g+328+(t<<6)+16>>2]|0)+512+(d[n+(p+8)>>0]|0))>>0]|0;_=d[n+(p+10)>>0]|0;m=c[g+328+(t<<6)+24>>2]|0;a[v+(aa+1)>>0]=a[6294+((f|512)+h)>>0]|0;h=d[n+(p+11)>>0]|0;f=c[g+328+(t<<6)+28>>2]|0;a[v+(aa+2)>>0]=a[6294+(m+512+_)>>0]|0;a[v+(aa+3)>>0]=a[6294+(f+512+h)>>0]|0;aa=aa+(w<<3&2147483640)|0;h=d[n+(p+17)>>0]|0;f=c[g+328+(t<<6)+36>>2]|0;a[v+aa>>0]=a[6294+((c[g+328+(t<<6)+32>>2]|0)+512+(d[n+(p+16)>>0]|0))>>0]|0;_=d[n+(p+18)>>0]|0;m=c[g+328+(t<<6)+40>>2]|0;a[v+(aa+1)>>0]=a[6294+((h|512)+f)>>0]|0;f=d[n+(p+19)>>0]|0;h=c[g+328+(t<<6)+44>>2]|0;a[v+(aa+2)>>0]=a[6294+(m+512+_)>>0]|0;a[v+(aa+3)>>0]=a[6294+(h+512+f)>>0]|0;f=d[n+(p+25)>>0]|0;h=c[g+328+(t<<6)+52>>2]|0;a[v+(aa+(w<<3&2147483640))>>0]=a[6294+((c[g+328+(t<<6)+48>>2]|0)+512+(d[n+(p+24)>>0]|0))>>0]|0;_=d[n+(p+26)>>0]|0;m=c[g+328+(t<<6)+56>>2]|0;a[v+(aa+(w<<3&2147483640)+1)>>0]=a[6294+((f|512)+h)>>0]|0;h=d[n+(p+27)>>0]|0;f=c[g+328+(t<<6)+60>>2]|0;a[v+(aa+(w<<3&2147483640)+2)>>0]=a[6294+(m+512+_)>>0]|0;a[v+(aa+(w<<3&2147483640)+3)>>0]=a[6294+(f+512+h)>>0]|0}t=t+1|0}while((t|0)!=24)}while(0);aa=0;i=$;return aa|0}function La(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;h=a[384+(e<<3)+4>>0]|0;i=a[576+(e<<3)+4>>0]|0;if(11205370>>>e&1){g=b[f+((h&255)<<1)>>1]|0;if(13434828>>>e&1){d=g+1+(b[f+((i&255)<<1)>>1]|0)>>1;return d|0}e=c[d+204>>2]|0;if(!e){d=g;return d|0}if((c[d+4>>2]|0)!=(c[e+4>>2]|0)){d=g;return d|0}d=g+1+(b[e+28+((i&255)<<1)>>1]|0)>>1;return d|0}if(13434828>>>e&1){e=b[f+((i&255)<<1)>>1]|0;g=c[d+200>>2]|0;if(!g){d=e;return d|0}if((c[d+4>>2]|0)!=(c[g+4>>2]|0)){d=e;return d|0}d=e+1+(b[g+28+((h&255)<<1)>>1]|0)>>1;return d|0}e=c[d+200>>2]|0;if((e|0)!=0?(c[d+4>>2]|0)==(c[e+4>>2]|0):0){g=b[e+28+((h&255)<<1)>>1]|0;f=1}else{g=0;f=0}e=c[d+204>>2]|0;if(!e){d=g;return d|0}if((c[d+4>>2]|0)!=(c[e+4>>2]|0)){d=g;return d|0}e=b[e+28+((i&255)<<1)>>1]|0;if(!f){d=e;return d|0}d=g+1+e>>1;return d|0}function Ma(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;g=c[a+4>>2]|0;i=c[a+12>>2]<<3;j=c[a+16>>2]|0;if((i-j|0)>31){f=c[a+8>>2]|0;e=(d[g+1>>0]|0)<<16|(d[g>>0]|0)<<24|(d[g+2>>0]|0)<<8|(d[g+3>>0]|0);if(!f)f=a+8|0;else{e=(d[g+4>>0]|0)>>>(8-f|0)|e<<f;f=a+8|0}}else if((i-j|0)>0){f=c[a+8>>2]|0;e=(d[g>>0]|0)<<f+24;if((i-j+-8+f|0)>0){h=i-j+-8+f|0;f=f+24|0;while(1){g=g+1|0;f=f+-8|0;e=(d[g>>0]|0)<<f|e;if((h|0)<=8){f=a+8|0;break}else h=h+-8|0}}else f=a+8|0}else{e=0;f=a+8|0}c[a+16>>2]=j+b;c[f>>2]=j+b&7;if((j+b|0)>>>0>i>>>0){j=0;a=32-b|0;a=e>>>a;a=j?a:-1;return a|0}c[a+4>>2]=(c[a>>2]|0)+((j+b|0)>>>3);j=1;a=32-b|0;a=e>>>a;a=j?a:-1;return a|0}function Na(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;g=c[a+4>>2]|0;j=c[a+12>>2]<<3;i=c[a+16>>2]|0;if((j-i|0)>31){f=c[a+8>>2]|0;e=(d[g+1>>0]|0)<<16|(d[g>>0]|0)<<24|(d[g+2>>0]|0)<<8|(d[g+3>>0]|0);if(!f)f=7;else{e=(d[g+4>>0]|0)>>>(8-f|0)|e<<f;f=7}}else if((j-i|0)>0){f=c[a+8>>2]|0;e=(d[g>>0]|0)<<f+24;if((j-i+-8+f|0)>0){h=j-i+-8+f|0;f=f+24|0;while(1){g=g+1|0;f=f+-8|0;e=(d[g>>0]|0)<<f|e;if((h|0)<=8){f=7;break}else h=h+-8|0}}else f=7}else{e=0;f=21}do if((f|0)==7){if((e|0)<0){c[a+16>>2]=i+1;c[a+8>>2]=i+1&7;if((i+1|0)>>>0<=j>>>0)c[a+4>>2]=(c[a>>2]|0)+((i+1|0)>>>3);c[b>>2]=0;b=0;return b|0}if(e>>>0>1073741823){c[a+16>>2]=i+3;c[a+8>>2]=i+3&7;if((i+3|0)>>>0>j>>>0){b=1;return b|0}c[a+4>>2]=(c[a>>2]|0)+((i+3|0)>>>3);c[b>>2]=(e>>>29&1)+1;b=0;return b|0}if(e>>>0>536870911){c[a+16>>2]=i+5;c[a+8>>2]=i+5&7;if((i+5|0)>>>0>j>>>0){b=1;return b|0}c[a+4>>2]=(c[a>>2]|0)+((i+5|0)>>>3);c[b>>2]=(e>>>27&3)+3;b=0;return b|0}if(e>>>0<=268435455)if(!(e&134217728)){f=21;break}else{g=4;e=0;break}c[a+16>>2]=i+7;c[a+8>>2]=i+7&7;if((i+7|0)>>>0>j>>>0){b=1;return b|0}c[a+4>>2]=(c[a>>2]|0)+((i+7|0)>>>3);c[b>>2]=(e>>>25&7)+7;b=0;return b|0}while(0);if((f|0)==21){f=134217728;g=0;while(1){h=g+1|0;f=f>>>1;if(!((f|0)!=0&(f&e|0)==0))break;else g=h}e=g+5|0;if((e|0)==32){c[b>>2]=0;e=(c[a+16>>2]|0)+32|0;c[a+16>>2]=e;c[a+8>>2]=e&7;if(e>>>0<=c[a+12>>2]<<3>>>0)c[a+4>>2]=(c[a>>2]|0)+(e>>>3);if((Ma(a,1)|0)!=1){b=1;return b|0}g=c[a+4>>2]|0;i=c[a+12>>2]<<3;j=c[a+16>>2]|0;if((i-j|0)>31){f=c[a+8>>2]|0;e=(d[g+1>>0]|0)<<16|(d[g>>0]|0)<<24|(d[g+2>>0]|0)<<8|(d[g+3>>0]|0);if(f)e=(d[g+4>>0]|0)>>>(8-f|0)|e<<f}else if((i-j|0)>0){f=c[a+8>>2]|0;e=(d[g>>0]|0)<<f+24;if((i-j+-8+f|0)>0){h=i-j+-8+f|0;f=f+24|0;while(1){g=g+1|0;f=f+-8|0;e=(d[g>>0]|0)<<f|e;if((h|0)<=8)break;else h=h+-8|0}}}else e=0;c[a+16>>2]=j+32;c[a+8>>2]=j+32&7;if((j+32|0)>>>0>i>>>0){b=1;return b|0}c[a+4>>2]=(c[a>>2]|0)+((j+32|0)>>>3);switch(e|0){case 0:{c[b>>2]=-1;b=0;return b|0}case 1:{c[b>>2]=-1;b=1;return b|0}default:{b=1;return b|0}}}else{g=e;e=h}}e=e+5+i|0;c[a+16>>2]=e;c[a+8>>2]=e&7;if(e>>>0<=j>>>0)c[a+4>>2]=(c[a>>2]|0)+(e>>>3);e=Ma(a,g)|0;if((e|0)==-1){b=1;return b|0}c[b>>2]=(1<<g)+-1+e;b=0;return b|0}function Oa(a,b,f,g){a=a|0;b=b|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0;Q=i;i=i+128|0;p=c[a+4>>2]|0;M=c[a+12>>2]<<3;o=c[a+16>>2]|0;if((M-o|0)>31){h=c[a+8>>2]|0;m=(d[p+1>>0]|0)<<16|(d[p>>0]|0)<<24|(d[p+2>>0]|0)<<8|(d[p+3>>0]|0);if(h)m=(d[p+4>>0]|0)>>>(8-h|0)|m<<h}else if((M-o|0)>0){h=c[a+8>>2]|0;m=(d[p>>0]|0)<<h+24;if((M-o+-8+h|0)>0){q=M-o+-8+h|0;h=h+24|0;while(1){p=p+1|0;h=h+-8|0;m=(d[p>>0]|0)<<h|m;if((q|0)<=8)break;else q=q+-8|0}}}else m=0;h=m>>>16;do if(f>>>0<2)if((m|0)>=0){if(m>>>0>201326591){r=e[4160+(m>>>26<<1)>>1]|0;t=31;break}if(m>>>0>16777215){r=e[4224+(m>>>22<<1)>>1]|0;t=31;break}if(m>>>0>2097151){r=e[4320+((m>>>18)+-8<<1)>>1]|0;t=31;break}else{r=e[4432+(h<<1)>>1]|0;t=31;break}}else s=1;else if(f>>>0<4){if((m|0)<0){s=(h&16384|0)!=0?2:2082;break}if(m>>>0>268435455){r=e[4496+(m>>>26<<1)>>1]|0;t=31;break}if(m>>>0>33554431){r=e[4560+(m>>>23<<1)>>1]|0;t=31;break}else{r=e[4624+(m>>>18<<1)>>1]|0;t=31;break}}else{if(f>>>0<8){h=m>>>26;if((h+-8|0)>>>0<56){r=e[4880+(h<<1)>>1]|0;t=31;break}r=e[5008+(m>>>22<<1)>>1]|0;t=31;break}if(f>>>0<17){r=e[5264+(m>>>26<<1)>>1]|0;t=31;break}h=m>>>29;if(h){r=e[5392+(h<<1)>>1]|0;t=31;break}r=e[5408+(m>>>24<<1)>>1]|0;t=31;break}while(0);if((t|0)==31)if(!r){a=1;i=Q;return a|0}else s=r;r=s&31;h=m<<r;K=s>>>11&31;if(K>>>0>g>>>0){a=1;i=Q;return a|0}w=s>>>5&63;do if(K){if(!w){p=32-r|0;m=0}else{do if((32-r|0)>>>0<w>>>0){c[a+16>>2]=o+r;f=o+s&7;c[a+8>>2]=f;if(M>>>0<(o+r|0)>>>0){a=1;i=Q;return a|0}m=c[a>>2]|0;p=(o+r|0)>>>3;c[a+4>>2]=m+p;if((M-(o+r)|0)>31){h=(d[m+(p+1)>>0]|0)<<16|(d[m+p>>0]|0)<<24|(d[m+(p+2)>>0]|0)<<8|(d[m+(p+3)>>0]|0);if(!f){o=o+r|0;r=32;q=h;break}o=o+r|0;r=32;q=(d[m+(p+4)>>0]|0)>>>(8-f|0)|h<<f;break}if((M-(o+r)|0)>0){h=(d[m+p>>0]|0)<<(f|24);if((M-(o+r)+-8+f|0)>0){p=m+p|0;q=M-(o+r)+-8+f|0;m=f|24;while(1){p=p+1|0;m=m+-8|0;h=(d[p>>0]|0)<<m|h;if((q|0)<=8){o=o+r|0;r=32;q=h;break}else q=q+-8|0}}else{o=o+r|0;r=32;q=h}}else{o=o+r|0;r=32;q=0}}else{r=32-r|0;q=h}while(0);h=q>>>(32-w|0);f=0;m=1<<w+-1;do{c[Q+64+(f<<2)>>2]=(m&h|0)!=0?-1:1;m=m>>>1;f=f+1|0}while((m|0)!=0);p=r-w|0;h=q<<w;m=f}a:do if(m>>>0<K>>>0){q=h;v=m;u=K>>>0>10&w>>>0<3&1;b:while(1){do if(p>>>0<16){q=o+(32-p)|0;c[a+16>>2]=q;c[a+8>>2]=q&7;if(M>>>0<q>>>0){L=1;t=158;break b}m=c[a>>2]|0;c[a+4>>2]=m+(q>>>3);if((M-q|0)>31){h=(d[m+((q>>>3)+1)>>0]|0)<<16|(d[m+(q>>>3)>>0]|0)<<24|(d[m+((q>>>3)+2)>>0]|0)<<8|(d[m+((q>>>3)+3)>>0]|0);if(!(q&7)){o=q;s=32;r=h;break}o=q;s=32;r=(d[m+((q>>>3)+4)>>0]|0)>>>(8-(q&7)|0)|h<<(q&7);break}if((M-q|0)<=0){L=1;t=158;break b}h=(d[m+(q>>>3)>>0]|0)<<(q&7|24);if((M-q+-8+(q&7)|0)>0){o=m+(q>>>3)|0;p=M-q+-8+(q&7)|0;m=q&7|24;while(1){o=o+1|0;m=m+-8|0;h=(d[o>>0]|0)<<m|h;if((p|0)<=8){o=q;s=32;r=h;break}else p=p+-8|0}}else{o=q;s=32;r=h}}else{s=p;r=q}while(0);do if((r|0)>=0)if(r>>>0<=1073741823)if(r>>>0<=536870911)if(r>>>0<=268435455)if(r>>>0<=134217727)if(r>>>0<=67108863)if(r>>>0<=33554431)if(r>>>0<=16777215)if(r>>>0>8388607){J=8;t=75}else{if(r>>>0>4194303){J=9;t=75;break}if(r>>>0>2097151){J=10;t=75;break}if(r>>>0>1048575){J=11;t=75;break}if(r>>>0>524287){J=12;t=75;break}if(r>>>0>262143){J=13;t=75;break}if(r>>>0>131071){m=s+-15|0;p=r<<15;h=14;q=u;f=(u|0)!=0?u:4}else{if(r>>>0<65536){L=1;t=158;break b}m=s+-16|0;p=r<<16;h=15;q=(u|0)!=0?u:1;f=12}I=h<<q;G=m;H=(q|0)==0;F=p;E=q;D=f;t=76}else{J=7;t=75}else{J=6;t=75}else{J=5;t=75}else{J=4;t=75}else{J=3;t=75}else{J=2;t=75}else{J=1;t=75}else{J=0;t=75}while(0);if((t|0)==75){t=0;h=J+1|0;p=r<<h;h=s-h|0;m=J<<u;if(!u){C=1;B=o;z=h;A=p;x=m;y=0}else{I=m;G=h;H=0;F=p;E=u;D=u;t=76}}if((t|0)==76){do if(G>>>0<D>>>0){q=o+(32-G)|0;c[a+16>>2]=q;c[a+8>>2]=q&7;if(M>>>0<q>>>0){L=1;t=158;break b}m=c[a>>2]|0;c[a+4>>2]=m+(q>>>3);if((M-q|0)>31){h=(d[m+((q>>>3)+1)>>0]|0)<<16|(d[m+(q>>>3)>>0]|0)<<24|(d[m+((q>>>3)+2)>>0]|0)<<8|(d[m+((q>>>3)+3)>>0]|0);if(!(q&7)){o=q;p=32;break}o=q;p=32;h=(d[m+((q>>>3)+4)>>0]|0)>>>(8-(q&7)|0)|h<<(q&7);break}if((M-q|0)>0){h=(d[m+(q>>>3)>>0]|0)<<(q&7|24);if((M-q+-8+(q&7)|0)>0){o=m+(q>>>3)|0;p=M-q+-8+(q&7)|0;m=q&7|24;while(1){o=o+1|0;m=m+-8|0;h=(d[o>>0]|0)<<m|h;if((p|0)<=8){o=q;p=32;break}else p=p+-8|0}}else{o=q;p=32}}else{o=q;p=32;h=0}}else{p=G;h=F}while(0);C=H;B=o;z=p-D|0;A=h<<D;x=(h>>>(32-D|0))+I|0;y=E}h=w>>>0<3&(v|0)==(w|0)?x+2|0:x;m=C?1:y;c[Q+64+(v<<2)>>2]=(h&1|0)==0?(h+2|0)>>>1:0-((h+2|0)>>>1)|0;v=v+1|0;if(v>>>0>=K>>>0){n=B;l=z;k=A;break a}else{o=B;p=z;q=A;u=((m>>>0<6?((h+2|0)>>>1|0)>(3<<m+-1|0):0)&1)+m|0}}if((t|0)==158){i=Q;return L|0}}else{n=o;l=p;k=h}while(0);if(K>>>0<g>>>0){do if(l>>>0<9){o=n+(32-l)|0;c[a+16>>2]=o;c[a+8>>2]=o&7;if(M>>>0<o>>>0){a=1;i=Q;return a|0}k=c[a>>2]|0;c[a+4>>2]=k+(o>>>3);if((M-o|0)>31){h=(d[k+((o>>>3)+1)>>0]|0)<<16|(d[k+(o>>>3)>>0]|0)<<24|(d[k+((o>>>3)+2)>>0]|0)<<8|(d[k+((o>>>3)+3)>>0]|0);if(!(o&7)){n=o;l=32;k=h;break}n=o;l=32;k=(d[k+((o>>>3)+4)>>0]|0)>>>(8-(o&7)|0)|h<<(o&7);break}if((M-o|0)>0){h=(d[k+(o>>>3)>>0]|0)<<(o&7|24);if((M-o+-8+(o&7)|0)>0){l=k+(o>>>3)|0;m=M-o+-8+(o&7)|0;k=o&7|24;while(1){l=l+1|0;k=k+-8|0;h=(d[l>>0]|0)<<k|h;if((m|0)<=8){n=o;l=32;k=h;break}else m=m+-8|0}}else{n=o;l=32;k=h}}else{n=o;l=32;k=0}}while(0);h=k>>>23;c:do if((g|0)==4)if((k|0)>=0)if((K|0)!=3)if(k>>>0<=1073741823)if((K|0)==2)h=34;else h=k>>>0>536870911?35:51;else h=18;else h=17;else h=1;else{do switch(K|0){case 1:{if(k>>>0>268435455)h=d[5672+(k>>>27)>>0]|0;else h=d[5704+h>>0]|0;break}case 2:{h=d[5736+(k>>>26)>>0]|0;break}case 3:{h=d[5800+(k>>>26)>>0]|0;break}case 4:{h=d[5864+(k>>>27)>>0]|0;break}case 5:{h=d[5896+(k>>>27)>>0]|0;break}case 6:{h=d[5928+(k>>>26)>>0]|0;break}case 7:{h=d[5992+(k>>>26)>>0]|0;break}case 8:{h=d[6056+(k>>>26)>>0]|0;break}case 9:{h=d[6120+(k>>>26)>>0]|0;break}case 10:{h=d[6184+(k>>>27)>>0]|0;break}case 11:{h=d[6216+(k>>>28)>>0]|0;break}case 12:{h=d[6232+(k>>>28)>>0]|0;break}case 13:{h=d[6248+(k>>>29)>>0]|0;break}case 14:{h=d[6256+(k>>>30)>>0]|0;break}default:{h=k>>31&16|1;break c}}while(0);if(!h){a=1;i=Q;return a|0}}while(0);m=h&15;l=l-m|0;k=k<<m;m=h>>>4&15}else m=0;if(!(K+-1|0)){c[b+(m<<2)>>2]=c[Q+64>>2];N=l;O=1<<m;break}h=k;q=0;p=m;d:while(1){if(!p){c[Q+(q<<2)>>2]=1;k=n;P=l;j=0}else{do if(l>>>0<11){o=n+(32-l)|0;c[a+16>>2]=o;c[a+8>>2]=o&7;if(M>>>0<o>>>0){L=1;t=158;break d}k=c[a>>2]|0;c[a+4>>2]=k+(o>>>3);if((M-o|0)>31){h=(d[k+((o>>>3)+1)>>0]|0)<<16|(d[k+(o>>>3)>>0]|0)<<24|(d[k+((o>>>3)+2)>>0]|0)<<8|(d[k+((o>>>3)+3)>>0]|0);if(!(o&7)){n=o;l=32;m=h;break}n=o;l=32;m=(d[k+((o>>>3)+4)>>0]|0)>>>(8-(o&7)|0)|h<<(o&7);break}if((M-o|0)>0){h=(d[k+(o>>>3)>>0]|0)<<(o&7|24);if((M-o+-8+(o&7)|0)>0){l=k+(o>>>3)|0;m=M-o+-8+(o&7)|0;k=o&7|24;while(1){l=l+1|0;k=k+-8|0;h=(d[l>>0]|0)<<k|h;if((m|0)<=8){n=o;l=32;m=h;break}else m=m+-8|0}}else{n=o;l=32;m=h}}else{n=o;l=32;m=0}}else m=h;while(0);switch(p|0){case 1:{h=d[6260+(m>>>31)>>0]|0;break}case 2:{h=d[6262+(m>>>30)>>0]|0;break}case 3:{h=d[6266+(m>>>30)>>0]|0;break}case 4:{h=d[6270+(m>>>29)>>0]|0;break}case 5:{h=d[6278+(m>>>29)>>0]|0;break}case 6:{h=d[6286+(m>>>29)>>0]|0;break}default:{do if(m>>>0<=536870911)if(m>>>0<=268435455)if(m>>>0<=134217727)if(m>>>0<=67108863)if(m>>>0>33554431)h=167;else{if(m>>>0>16777215){h=184;break}if(m>>>0>8388607){h=201;break}if(m>>>0>4194303){h=218;break}h=m>>>0<2097152?0:235}else h=150;else h=133;else h=116;else h=m>>>29<<4^115;while(0);if((h>>>4&15)>>>0>p>>>0){L=1;t=158;break d}}}if(!h){L=1;t=158;break}g=h&15;j=h>>>4&15;c[Q+(q<<2)>>2]=j+1;k=n;P=l-g|0;h=m<<g;j=p-j|0}q=q+1|0;if(q>>>0>=(K+-1|0)>>>0){t=154;break}else{n=k;l=P;p=j}}if((t|0)==154){c[b+(j<<2)>>2]=c[Q+64+(K+-1<<2)>>2];k=K+-2|0;h=1<<j;while(1){j=(c[Q+(k<<2)>>2]|0)+j|0;h=1<<j|h;c[b+(j<<2)>>2]=c[Q+64+(k<<2)>>2];if(!k){N=P;O=h;break}else k=k+-1|0}}else if((t|0)==158){i=Q;return L|0}}else{N=32-r|0;O=0}while(0);h=(c[a+16>>2]|0)+(32-N)|0;c[a+16>>2]=h;c[a+8>>2]=h&7;if(h>>>0>c[a+12>>2]<<3>>>0){a=1;i=Q;return a|0}c[a+4>>2]=(c[a>>2]|0)+(h>>>3);a=O<<16|K<<4;i=Q;return a|0}function Pa(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;g=c[e>>2]|0;if((g|0)==16777215)return;h=f>>>0<16?16:8;f=f>>>0<16?f:f&3;f=(Z(c[1216+(f<<2)>>2]|0,h)|0)+(c[1152+(f<<2)>>2]|0)|0;k=c[e+4>>2]|0;j=d[b+(f+1)>>0]|0;a[b+f>>0]=a[6294+(g+512+(d[b+f>>0]|0))>>0]|0;i=c[e+8>>2]|0;g=d[b+(f+2)>>0]|0;a[b+(f+1)>>0]=a[6294+(k+512+j)>>0]|0;j=a[6294+((c[e+12>>2]|0)+512+(d[b+(f+3)>>0]|0))>>0]|0;a[b+(f+2)>>0]=a[6294+(i+512+g)>>0]|0;a[b+(f+3)>>0]=j;j=c[e+20>>2]|0;g=d[b+(f+h+1)>>0]|0;a[b+(f+h)>>0]=a[6294+((c[e+16>>2]|0)+512+(d[b+(f+h)>>0]|0))>>0]|0;i=c[e+24>>2]|0;k=d[b+(f+h+2)>>0]|0;a[b+(f+h+1)>>0]=a[6294+(j+512+g)>>0]|0;g=a[6294+((c[e+28>>2]|0)+512+(d[b+(f+h+3)>>0]|0))>>0]|0;a[b+(f+h+2)>>0]=a[6294+(i+512+k)>>0]|0;a[b+(f+h+3)>>0]=g;f=f+h+h|0;g=c[e+36>>2]|0;k=d[b+(f+1)>>0]|0;a[b+f>>0]=a[6294+((c[e+32>>2]|0)+512+(d[b+f>>0]|0))>>0]|0;i=c[e+40>>2]|0;j=d[b+(f+2)>>0]|0;a[b+(f+1)>>0]=a[6294+(g+512+k)>>0]|0;k=a[6294+((c[e+44>>2]|0)+512+(d[b+(f+3)>>0]|0))>>0]|0;a[b+(f+2)>>0]=a[6294+(i+512+j)>>0]|0;a[b+(f+3)>>0]=k;k=c[e+52>>2]|0;j=d[b+(f+h+1)>>0]|0;a[b+(f+h)>>0]=a[6294+((c[e+48>>2]|0)+512+(d[b+(f+h)>>0]|0))>>0]|0;i=c[e+56>>2]|0;g=d[b+(f+h+2)>>0]|0;a[b+(f+h+1)>>0]=a[6294+(k+512+j)>>0]|0;e=a[6294+((c[e+60>>2]|0)+512+(d[b+(f+h+3)>>0]|0))>>0]|0;a[b+(f+h+2)>>0]=a[6294+(i+512+g)>>0]|0;a[b+(f+h+3)>>0]=e;return}function Qa(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;q=(c|0)<0|(g+c|0)>(e|0)?2:1;p=(h+d|0)<0?0-h|0:d;n=(g+c|0)<0?0-g|0:c;p=(p|0)>(f|0)?f:p;n=(n|0)>(e|0)?e:n;c=(n|0)>0?a+n|0:a;o=c+(Z(p,e)|0)|0;c=(p|0)>0?o:c;o=(n|0)<0?0-n|0:0;n=(n+g|0)>(e|0)?n+g-e|0:0;l=(p|0)<0?0-p|0:0;m=(p+h|0)>(f|0)?p+h-f|0:0;if(l){j=h+-1+((h+d|0)>0?0-(h+d)|0:0)|0;j=(j|0)>(~f|0)?j:~f;a=b;k=0-p|0;while(1){ya[q&3](c,a,o,g-o-n|0,n);k=k+-1|0;if(!k)break;else a=a+i|0}b=b+(Z(j+1+((j|0)<-1?~j:0)|0,i)|0)|0}if((h-l|0)!=(m|0)){d=h+-1-((h+d|0)>0?h+d|0:0)|0;d=(d|0)>(~f|0)?d:~f;d=f+-1+h-d+((d|0)<-1?d+1|0:0)-((h+-1-d|0)<(f|0)?f:h+-1-d|0)|0;j=b;k=c;a=h-l-m|0;while(1){ya[q&3](k,j,o,g-o-n|0,n);a=a+-1|0;if(!a)break;else{j=j+i|0;k=k+e|0}}b=b+(Z(d,i)|0)|0;c=c+(Z(d,e)|0)|0}a=c+(0-e)|0;if(!m)return;else c=p+h-f|0;while(1){ya[q&3](a,b,o,g-o-n|0,n);c=c+-1|0;if(!c)break;else b=b+i|0}return}function Ra(b,c,e,f,g,h,j,k,l){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;s=i;i=i+448|0;if(((e|0)>=0?!((f|0)<0|(j+e|0)>>>0>g>>>0):0)?(f+5+k|0)>>>0<=h>>>0:0)h=e;else{Qa(b,s,e,f,g,h,j,k+5|0,j);b=s;h=0;f=0;g=j}f=h+g+(Z(f,g)|0)|0;if(!(k>>>2)){i=s;return}p=g<<2;q=0-g|0;r=g<<1;if(!j){i=s;return}o=c;m=k>>>2;n=b+f|0;l=b+(f+(Z(g,l+2|0)|0))|0;c=b+(f+(g*5|0))|0;while(1){f=o;h=j;b=n;e=l;k=c;while(1){t=d[k+(q<<1)>>0]|0;x=d[k+q>>0]|0;u=d[k+g>>0]|0;y=d[k>>0]|0;v=d[b+r>>0]|0;a[f+48>>0]=((d[6294+(((d[k+r>>0]|0)+16-(u+t)-(u+t<<2)+v+((y+x|0)*20|0)>>5)+512)>>0]|0)+1+(d[e+r>>0]|0)|0)>>>1;w=d[b+g>>0]|0;a[f+32>>0]=((d[6294+((u+16+((x+t|0)*20|0)-(v+y)-(v+y<<2)+w>>5)+512)>>0]|0)+1+(d[e+g>>0]|0)|0)>>>1;u=d[b>>0]|0;a[f+16>>0]=((d[6294+((y+16+((v+t|0)*20|0)-(w+x)-(w+x<<2)+u>>5)+512)>>0]|0)+1+(d[e>>0]|0)|0)>>>1;a[f>>0]=((d[6294+((x+16+((w+v|0)*20|0)-(u+t)-(u+t<<2)+(d[b+q>>0]|0)>>5)+512)>>0]|0)+1+(d[e+q>>0]|0)|0)>>>1;h=h+-1|0;if(!h)break;else{f=f+1|0;b=b+1|0;e=e+1|0;k=k+1|0}}m=m+-1|0;if(!m)break;else{o=o+64|0;n=n+p|0;l=l+p|0;c=c+p|0}}i=s;return}function Sa(b,c,e,f,g,h,j,k,l){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;r=i;i=i+448|0;if((e|0)>=0?!((k+f|0)>>>0>h>>>0|((f|0)<0|(e+5+j|0)>>>0>g>>>0)):0)h=g;else{Qa(b,r,e,f,g,h,j+5|0,k,j+5|0);b=r;e=0;f=0;h=j+5|0}if(!k){i=r;return}q=h-j|0;h=b+(e+5+(Z(f,h)|0))|0;while(1){if(j>>>2){e=d[h+-1>>0]|0;m=d[h+-2>>0]|0;g=d[h+-3>>0]|0;f=d[h+-4>>0]|0;b=d[h+-5>>0]|0;p=c+(j>>>2<<2)|0;if(!l){o=h;n=e;e=j>>>2;while(1){s=n+f|0;t=f;f=d[o>>0]|0;a[c>>0]=(g+1+(d[6294+((b+16-s+((m+g|0)*20|0)-(s<<2)+f>>5)+512)>>0]|0)|0)>>>1;s=f+g|0;b=g;g=d[o+1>>0]|0;a[c+1>>0]=(m+1+(d[6294+((t+16+((n+m|0)*20|0)-s-(s<<2)+g>>5)+512)>>0]|0)|0)>>>1;s=g+m|0;t=m;m=d[o+2>>0]|0;a[c+2>>0]=(n+1+(d[6294+((b+16+((f+n|0)*20|0)-s-(s<<2)+m>>5)+512)>>0]|0)|0)>>>1;s=m+n|0;b=d[o+3>>0]|0;a[c+3>>0]=(f+1+(d[6294+((t+16+((g+f|0)*20|0)-s-(s<<2)+b>>5)+512)>>0]|0)|0)>>>1;e=e+-1|0;if(!e)break;else{t=n;c=c+4|0;o=o+4|0;n=b;b=t}}}else{o=h;n=e;e=j>>>2;while(1){t=n+f|0;s=f;f=d[o>>0]|0;a[c>>0]=(m+1+(d[6294+((b+16-t+((m+g|0)*20|0)-(t<<2)+f>>5)+512)>>0]|0)|0)>>>1;t=f+g|0;b=g;g=d[o+1>>0]|0;a[c+1>>0]=(n+1+(d[6294+((s+16+((n+m|0)*20|0)-t-(t<<2)+g>>5)+512)>>0]|0)|0)>>>1;t=g+m|0;s=m;m=d[o+2>>0]|0;a[c+2>>0]=(f+1+(d[6294+((b+16+((f+n|0)*20|0)-t-(t<<2)+m>>5)+512)>>0]|0)|0)>>>1;t=m+n|0;b=d[o+3>>0]|0;a[c+3>>0]=(g+1+(d[6294+((s+16+((g+f|0)*20|0)-t-(t<<2)+b>>5)+512)>>0]|0)|0)>>>1;e=e+-1|0;if(!e)break;else{t=n;c=c+4|0;o=o+4|0;n=b;b=t}}}c=p;h=h+(j>>>2<<2)|0}k=k+-1|0;if(!k)break;else{c=c+(16-j)|0;h=h+q|0}}i=r;return}function Ta(b,c,e,f,g,h,j,k,l){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;v=i;i=i+448|0;if(((e|0)>=0?!((f|0)<0|(e+5+j|0)>>>0>g>>>0):0)?(f+5+k|0)>>>0<=h>>>0:0)h=e;else{Qa(b,v,e,f,g,h,j+5|0,k+5|0,j+5|0);b=v;h=0;f=0;g=j+5|0}f=(Z(f,g)|0)+h|0;u=g+(l&1|2)+f|0;m=b+u|0;if(!k){i=v;return}t=g-j|0;h=c;f=b+((Z(g,l>>>1&1|2)|0)+5+f)|0;s=k;while(1){if(j>>>2){c=h;l=f;n=d[f+-1>>0]|0;o=d[f+-2>>0]|0;p=d[f+-3>>0]|0;q=d[f+-4>>0]|0;e=d[f+-5>>0]|0;r=j>>>2;while(1){w=n+q|0;x=q;q=d[l>>0]|0;a[c>>0]=a[6294+((e+16-w+((o+p|0)*20|0)-(w<<2)+q>>5)+512)>>0]|0;w=q+p|0;e=p;p=d[l+1>>0]|0;a[c+1>>0]=a[6294+((x+16+((n+o|0)*20|0)-w-(w<<2)+p>>5)+512)>>0]|0;w=p+o|0;x=o;o=d[l+2>>0]|0;a[c+2>>0]=a[6294+((e+16+((q+n|0)*20|0)-w-(w<<2)+o>>5)+512)>>0]|0;w=o+n|0;e=d[l+3>>0]|0;a[c+3>>0]=a[6294+((x+16+((p+q|0)*20|0)-w-(w<<2)+e>>5)+512)>>0]|0;r=r+-1|0;if(!r)break;else{x=n;c=c+4|0;l=l+4|0;n=e;e=x}}h=h+(j>>>2<<2)|0;f=f+(j>>>2<<2)|0}s=s+-1|0;if(!s)break;else{h=h+(16-j)|0;f=f+t|0}}if(!(k>>>2)){i=v;return}o=g<<2;p=0-g|0;q=g<<1;if(!j){i=v;return}n=h+(16-j-(k<<4))|0;l=b+(u+(g*5|0))|0;c=k>>>2;while(1){f=n;h=m;b=l;e=j;while(1){x=d[b+(p<<1)>>0]|0;t=d[b+p>>0]|0;s=d[b+g>>0]|0;r=d[b>>0]|0;k=d[h+q>>0]|0;u=f+48|0;a[u>>0]=((d[6294+(((d[b+q>>0]|0)+16-(s+x)-(s+x<<2)+k+((r+t|0)*20|0)>>5)+512)>>0]|0)+1+(d[u>>0]|0)|0)>>>1;u=d[h+g>>0]|0;w=f+32|0;a[w>>0]=((d[6294+((s+16+((t+x|0)*20|0)-(k+r)-(k+r<<2)+u>>5)+512)>>0]|0)+1+(d[w>>0]|0)|0)>>>1;w=d[h>>0]|0;s=f+16|0;a[s>>0]=((d[6294+((r+16+((k+x|0)*20|0)-(u+t)-(u+t<<2)+w>>5)+512)>>0]|0)+1+(d[s>>0]|0)|0)>>>1;a[f>>0]=((d[6294+((t+16+((u+k|0)*20|0)-(w+x)-(w+x<<2)+(d[h+p>>0]|0)>>5)+512)>>0]|0)+1+(d[f>>0]|0)|0)>>>1;e=e+-1|0;if(!e)break;else{f=f+1|0;h=h+1|0;b=b+1|0}}c=c+-1|0;if(!c)break;else{n=n+64|0;m=m+o|0;l=l+o|0}}i=v;return}function Ua(b,e,f,g,h,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;u=i;i=i+1792|0;if(((f|0)>=0?!((g|0)<0|(f+5+k|0)>>>0>h>>>0):0)?(g+5+l|0)>>>0<=j>>>0:0){n=f+5|0;f=h;h=l+5|0}else{Qa(b,u+1344|0,f,g,h,j,k+5|0,l+5|0,k+5|0);b=u+1344|0;n=5;g=0;f=k+5|0;h=l+5|0}if(h){t=f-k|0;j=u;b=b+(n+(Z(g,f)|0))|0;while(1){if(k>>>2){g=j;n=b;o=d[b+-1>>0]|0;p=d[b+-2>>0]|0;q=d[b+-3>>0]|0;r=d[b+-4>>0]|0;f=d[b+-5>>0]|0;s=k>>>2;while(1){v=o+r|0;w=r;r=d[n>>0]|0;c[g>>2]=f-v+((p+q|0)*20|0)-(v<<2)+r;v=r+q|0;f=q;q=d[n+1>>0]|0;c[g+4>>2]=((o+p|0)*20|0)+w-v+q-(v<<2);v=q+p|0;w=p;p=d[n+2>>0]|0;c[g+8>>2]=f-v+p+((r+o|0)*20|0)-(v<<2);v=p+o|0;f=d[n+3>>0]|0;c[g+12>>2]=w-v+f+((q+r|0)*20|0)-(v<<2);s=s+-1|0;if(!s)break;else{w=o;g=g+16|0;n=n+4|0;o=f;f=w}}j=j+(k>>>2<<2<<2)|0;b=b+(k>>>2<<2)|0}h=h+-1|0;if(!h)break;else b=b+t|0}}if(!(l>>>2)){i=u;return}j=u+(k<<2)|0;b=u+((Z(m+2|0,k)|0)+k<<2)|0;f=u+(k*6<<2)|0;q=l>>>2;while(1){if(k){g=e;h=j;n=b;o=f;p=k;while(1){w=c[o+(0-k<<1<<2)>>2]|0;t=c[o+(0-k<<2)>>2]|0;v=c[o+(k<<2)>>2]|0;s=c[o>>2]|0;l=c[h+(k<<1<<2)>>2]|0;a[g+48>>0]=((d[6294+(((c[o+(k<<1<<2)>>2]|0)+512-(v+w)-(v+w<<2)+l+((s+t|0)*20|0)>>10)+512)>>0]|0)+1+(d[6294+(((c[n+(k<<1<<2)>>2]|0)+16>>5)+512)>>0]|0)|0)>>>1;m=c[h+(k<<2)>>2]|0;a[g+32>>0]=((d[6294+((v+512+((t+w|0)*20|0)-(l+s)-(l+s<<2)+m>>10)+512)>>0]|0)+1+(d[6294+(((c[n+(k<<2)>>2]|0)+16>>5)+512)>>0]|0)|0)>>>1;v=c[h>>2]|0;a[g+16>>0]=((d[6294+((s+512+((l+w|0)*20|0)-(m+t)-(m+t<<2)+v>>10)+512)>>0]|0)+1+(d[6294+(((c[n>>2]|0)+16>>5)+512)>>0]|0)|0)>>>1;a[g>>0]=((d[6294+((t+512+((m+l|0)*20|0)-(v+w)-(v+w<<2)+(c[h+(0-k<<2)>>2]|0)>>10)+512)>>0]|0)+1+(d[6294+(((c[n+(0-k<<2)>>2]|0)+16>>5)+512)>>0]|0)|0)>>>1;p=p+-1|0;if(!p)break;else{g=g+1|0;h=h+4|0;n=n+4|0;o=o+4|0}}e=e+k|0;j=j+(k<<2)|0;b=b+(k<<2)|0;f=f+(k<<2)|0}q=q+-1|0;if(!q)break;else{e=e+(64-k)|0;j=j+(k*3<<2)|0;b=b+(k*3<<2)|0;f=f+(k*3<<2)|0}}i=u;return}function Va(b,e,f,g,h,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;u=i;i=i+1792|0;if(((f|0)>=0?!((g|0)<0|(f+5+k|0)>>>0>h>>>0):0)?(g+5+l|0)>>>0<=j>>>0:0)j=f;else{Qa(b,u+1344|0,f,g,h,j,k+5|0,l+5|0,k+5|0);b=u+1344|0;j=0;g=0;h=k+5|0}g=j+h+(Z(g,h)|0)|0;if(l>>>2){r=(h<<2)-k+-5|0;s=0-h|0;t=h<<1;q=u+(k+5<<2)|0;j=b+g|0;b=b+(g+(h*5|0))|0;p=l>>>2;while(1){if(!(k+5|0))g=q;else{g=q;f=j;n=b;o=k+5|0;while(1){v=d[n+(s<<1)>>0]|0;z=d[n+s>>0]|0;w=d[n+h>>0]|0;A=d[n>>0]|0;x=d[f+t>>0]|0;c[g+(k+5<<1<<2)>>2]=(d[n+t>>0]|0)-(w+v)-(w+v<<2)+x+((A+z|0)*20|0);y=d[f+h>>0]|0;c[g+(k+5<<2)>>2]=((z+v|0)*20|0)+w-(x+A)+y-(x+A<<2);w=d[f>>0]|0;c[g>>2]=A-(y+z)+w+((x+v|0)*20|0)-(y+z<<2);c[g+(-5-k<<2)>>2]=z-(w+v)+(d[f+s>>0]|0)+((y+x|0)*20|0)-(w+v<<2);o=o+-1|0;if(!o)break;else{g=g+4|0;f=f+1|0;n=n+1|0}}g=q+(k+5<<2)|0;j=j+(k+5)|0;b=b+(k+5)|0}p=p+-1|0;if(!p)break;else{q=g+((k+5|0)*3<<2)|0;j=j+r|0;b=b+r|0}}}if(!l){i=u;return}g=u+(m+2<<2)|0;j=u+20|0;while(1){if(k>>>2){f=e;h=g;n=j;o=c[j+-4>>2]|0;p=c[j+-8>>2]|0;q=c[j+-12>>2]|0;r=c[j+-16>>2]|0;b=c[j+-20>>2]|0;s=k>>>2;while(1){A=o+r|0;z=r;r=c[n>>2]|0;a[f>>0]=((d[6294+((b+512-A+((p+q|0)*20|0)-(A<<2)+r>>10)+512)>>0]|0)+1+(d[6294+(((c[h>>2]|0)+16>>5)+512)>>0]|0)|0)>>>1;A=r+q|0;b=q;q=c[n+4>>2]|0;a[f+1>>0]=((d[6294+((z+512+((o+p|0)*20|0)-A-(A<<2)+q>>10)+512)>>0]|0)+1+(d[6294+(((c[h+4>>2]|0)+16>>5)+512)>>0]|0)|0)>>>1;A=q+p|0;z=p;p=c[n+8>>2]|0;a[f+2>>0]=((d[6294+((b+512+((r+o|0)*20|0)-A-(A<<2)+p>>10)+512)>>0]|0)+1+(d[6294+(((c[h+8>>2]|0)+16>>5)+512)>>0]|0)|0)>>>1;A=p+o|0;b=c[n+12>>2]|0;a[f+3>>0]=((d[6294+((z+512+((q+r|0)*20|0)-A-(A<<2)+b>>10)+512)>>0]|0)+1+(d[6294+(((c[h+12>>2]|0)+16>>5)+512)>>0]|0)|0)>>>1;s=s+-1|0;if(!s)break;else{A=o;f=f+4|0;h=h+16|0;n=n+16|0;o=b;b=A}}e=e+(k>>>2<<2)|0;g=g+(k>>>2<<2<<2)|0;j=j+(k>>>2<<2<<2)|0}l=l+-1|0;if(!l)break;else{e=e+(16-k)|0;g=g+20|0;j=j+20|0}}i=u;return}function Wa(e,f,g,h,j,k,l,m,n){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;var o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;D=i;i=i+1792|0;B=b[f>>1]|0;C=b[f+2>>1]|0;p=c[g+4>>2]<<4;s=c[g+8>>2]<<4;r=(B>>2)+(k+h)|0;q=(C>>2)+(l+j)|0;do switch(c[3328+((B&3)<<4)+((C&3)<<2)>>2]|0){case 0:{Qa(c[g>>2]|0,e+((l<<4)+k)|0,r,q,p,s,m,n,16);o=g;break}case 1:{Ra(c[g>>2]|0,e+((l<<4)+k)|0,r,q+-2|0,p,s,m,n,0);o=g;break}case 2:{o=c[g>>2]|0;if(((r|0)>=0?!((q|0)<2|(r+m|0)>>>0>p>>>0):0)?(q+3+n|0)>>>0<=s>>>0:0){s=o;o=q+-2|0}else{Qa(o,D,r,q+-2|0,p,s,m,n+5|0,m);s=D;r=0;o=0;p=m}o=r+p+(Z(o,p)|0)|0;if((n>>>2|0)!=0?(x=p<<2,y=0-p|0,z=p<<1,(m|0)!=0):0){u=e+((l<<4)+k)|0;v=n>>>2;w=s+o|0;s=s+(o+(p*5|0))|0;while(1){o=u;q=m;r=w;t=s;while(1){C=d[t+(y<<1)>>0]|0;F=d[t+y>>0]|0;B=d[t+p>>0]|0;G=d[t>>0]|0;A=d[r+z>>0]|0;a[o+48>>0]=a[6294+(((d[t+z>>0]|0)+16-(B+C)-(B+C<<2)+A+((G+F|0)*20|0)>>5)+512)>>0]|0;E=d[r+p>>0]|0;a[o+32>>0]=a[6294+((B+16+((F+C|0)*20|0)-(A+G)-(A+G<<2)+E>>5)+512)>>0]|0;B=d[r>>0]|0;a[o+16>>0]=a[6294+((G+16+((A+C|0)*20|0)-(E+F)-(E+F<<2)+B>>5)+512)>>0]|0;a[o>>0]=a[6294+((F+16+((E+A|0)*20|0)-(B+C)-(B+C<<2)+(d[r+y>>0]|0)>>5)+512)>>0]|0;q=q+-1|0;if(!q)break;else{o=o+1|0;r=r+1|0;t=t+1|0}}v=v+-1|0;if(!v)break;else{u=u+64|0;w=w+x|0;s=s+x|0}}}o=g;break}case 3:{Ra(c[g>>2]|0,e+((l<<4)+k)|0,r,q+-2|0,p,s,m,n,1);o=g;break}case 4:{Sa(c[g>>2]|0,e+((l<<4)+k)|0,r+-2|0,q,p,s,m,n,0);o=g;break}case 5:{Ta(c[g>>2]|0,e+((l<<4)+k)|0,r+-2|0,q+-2|0,p,s,m,n,0);o=g;break}case 6:{Va(c[g>>2]|0,e+((l<<4)+k)|0,r+-2|0,q+-2|0,p,s,m,n,0);o=g;break}case 7:{Ta(c[g>>2]|0,e+((l<<4)+k)|0,r+-2|0,q+-2|0,p,s,m,n,2);o=g;break}case 8:{o=c[g>>2]|0;if((r|0)>=2?!((q+n|0)>>>0>s>>>0|((q|0)<0|(r+3+m|0)>>>0>p>>>0)):0){s=o;r=r+-2|0}else{Qa(o,D,r+-2|0,q,p,s,m+5|0,n,m+5|0);s=D;r=0;q=0;p=m+5|0}if(n){z=p-m|0;o=e+((l<<4)+k)|0;p=s+(r+5+(Z(q,p)|0))|0;y=n;while(1){if(m>>>2){r=o;s=p;t=d[p+-1>>0]|0;u=d[p+-2>>0]|0;v=d[p+-3>>0]|0;w=d[p+-4>>0]|0;q=d[p+-5>>0]|0;x=m>>>2;while(1){G=t+w|0;F=w;w=d[s>>0]|0;a[r>>0]=a[6294+((q+16-G+((u+v|0)*20|0)-(G<<2)+w>>5)+512)>>0]|0;G=w+v|0;q=v;v=d[s+1>>0]|0;a[r+1>>0]=a[6294+((F+16+((t+u|0)*20|0)-G-(G<<2)+v>>5)+512)>>0]|0;G=v+u|0;F=u;u=d[s+2>>0]|0;a[r+2>>0]=a[6294+((q+16+((w+t|0)*20|0)-G-(G<<2)+u>>5)+512)>>0]|0;G=u+t|0;q=d[s+3>>0]|0;a[r+3>>0]=a[6294+((F+16+((v+w|0)*20|0)-G-(G<<2)+q>>5)+512)>>0]|0;x=x+-1|0;if(!x)break;else{G=t;r=r+4|0;s=s+4|0;t=q;q=G}}o=o+(m>>>2<<2)|0;p=p+(m>>>2<<2)|0}y=y+-1|0;if(!y)break;else{o=o+(16-m)|0;p=p+z|0}}}o=g;break}case 9:{Ua(c[g>>2]|0,e+((l<<4)+k)|0,r+-2|0,q+-2|0,p,s,m,n,0);o=g;break}case 10:{o=c[g>>2]|0;if(((r|0)>=2?!((q|0)<2|(r+3+m|0)>>>0>p>>>0):0)?(q+3+n|0)>>>0<=s>>>0:0){s=r+3|0;q=q+-2|0;r=n+5|0}else{Qa(o,D,r+-2|0,q+-2|0,p,s,m+5|0,n+5|0,m+5|0);o=D;s=5;q=0;p=m+5|0;r=n+5|0}if(r){z=p-m|0;y=D+448|0;p=o+(s+(Z(q,p)|0))|0;while(1){if(!(m>>>2))o=y;else{q=y;s=p;t=d[p+-1>>0]|0;u=d[p+-2>>0]|0;v=d[p+-3>>0]|0;w=d[p+-4>>0]|0;o=d[p+-5>>0]|0;x=m>>>2;while(1){G=t+w|0;F=w;w=d[s>>0]|0;c[q>>2]=o-G+((u+v|0)*20|0)-(G<<2)+w;G=w+v|0;o=v;v=d[s+1>>0]|0;c[q+4>>2]=((t+u|0)*20|0)+F-G+v-(G<<2);G=v+u|0;F=u;u=d[s+2>>0]|0;c[q+8>>2]=o-G+u+((w+t|0)*20|0)-(G<<2);G=u+t|0;o=d[s+3>>0]|0;c[q+12>>2]=F-G+o+((v+w|0)*20|0)-(G<<2);x=x+-1|0;if(!x)break;else{G=t;q=q+16|0;s=s+4|0;t=o;o=G}}o=y+(m>>>2<<2<<2)|0;p=p+(m>>>2<<2)|0}r=r+-1|0;if(!r)break;else{y=o;p=p+z|0}}}if(n>>>2){o=e+((l<<4)+k)|0;p=D+448+(m<<2)|0;q=D+448+(m*6<<2)|0;v=n>>>2;while(1){if(m){r=o;s=p;t=q;u=m;while(1){G=c[t+(0-m<<1<<2)>>2]|0;B=c[t+(0-m<<2)>>2]|0;F=c[t+(m<<2)>>2]|0;A=c[t>>2]|0;E=c[s+(m<<1<<2)>>2]|0;a[r+48>>0]=a[6294+(((c[t+(m<<1<<2)>>2]|0)+512-(F+G)-(F+G<<2)+E+((A+B|0)*20|0)>>10)+512)>>0]|0;C=c[s+(m<<2)>>2]|0;a[r+32>>0]=a[6294+((F+512+((B+G|0)*20|0)-(E+A)-(E+A<<2)+C>>10)+512)>>0]|0;F=c[s>>2]|0;a[r+16>>0]=a[6294+((A+512+((E+G|0)*20|0)-(C+B)-(C+B<<2)+F>>10)+512)>>0]|0;a[r>>0]=a[6294+((B+512+((C+E|0)*20|0)-(F+G)-(F+G<<2)+(c[s+(0-m<<2)>>2]|0)>>10)+512)>>0]|0;u=u+-1|0;if(!u)break;else{r=r+1|0;s=s+4|0;t=t+4|0}}o=o+m|0;p=p+(m<<2)|0;q=q+(m<<2)|0}v=v+-1|0;if(!v)break;else{o=o+(64-m)|0;p=p+(m*3<<2)|0;q=q+(m*3<<2)|0}}}o=g;break}case 11:{Ua(c[g>>2]|0,e+((l<<4)+k)|0,r+-2|0,q+-2|0,p,s,m,n,1);o=g;break}case 12:{Sa(c[g>>2]|0,e+((l<<4)+k)|0,r+-2|0,q,p,s,m,n,1);o=g;break}case 13:{Ta(c[g>>2]|0,e+((l<<4)+k)|0,r+-2|0,q+-2|0,p,s,m,n,1);o=g;break}case 14:{Va(c[g>>2]|0,e+((l<<4)+k)|0,r+-2|0,q+-2|0,p,s,m,n,1);o=g;break}default:{Ta(c[g>>2]|0,e+((l<<4)+k)|0,r+-2|0,q+-2|0,p,s,m,n,3);o=g}}while(0);u=e+((k>>>1)+256+(l>>>1<<3))|0;p=c[o>>2]|0;s=c[g+4>>2]|0;t=c[g+8>>2]|0;C=b[f>>1]|0;q=(C>>3)+((k+h|0)>>>1)|0;B=b[f+2>>1]|0;r=(B>>3)+((l+j|0)>>>1)|0;o=Z(s<<8,t)|0;if((C&7|0)!=0&(B&7|0)!=0){if(((q|0)>=0?!((r|0)<0?1:(q+1+(m>>>1)|0)>>>0>s<<3>>>0):0)?(r+1+(n>>>1)|0)>>>0<=t<<3>>>0:0){A=p+o|0;j=s<<3;o=t<<3}else{Qa(p+o|0,D+448|0,q,r,s<<3,t<<3,(m>>>1)+1|0,(n>>>1)+1|0,(m>>>1)+1|0);Qa(p+(o+(Z(t<<3,s<<3)|0))|0,D+448+(Z((n>>>1)+1|0,(m>>>1)+1|0)|0)|0,q,r,s<<3,t<<3,(m>>>1)+1|0,(n>>>1)+1|0,(m>>>1)+1|0);A=D+448|0;q=0;r=0;j=(m>>>1)+1|0;o=(n>>>1)+1|0}t=j<<1;p=j+1|0;s=j+2|0;w=0;do{if(!((m>>>2|0)==0|(n>>>2|0)==0)){u=e+((k>>>1)+256+(l>>>1<<3)+(w<<6))|0;x=A+((Z((Z(w,o)|0)+r|0,j)|0)+q)|0;f=n>>>2;while(1){z=d[x+j>>0]|0;g=(Z(d[x+t>>0]|0,B&7)|0)+(Z(z,8-(B&7)|0)|0)|0;z=Z(z,B&7)|0;v=u;y=x;z=(Z(d[x>>0]|0,8-(B&7)|0)|0)+z|0;h=m>>>2;while(1){F=d[y+p>>0]|0;G=(Z(F,B&7)|0)+(Z(d[y+1>>0]|0,8-(B&7)|0)|0)|0;F=(Z(d[y+(t|1)>>0]|0,B&7)|0)+(Z(F,8-(B&7)|0)|0)|0;H=((Z(z,8-(C&7)|0)|0)+32+(Z(G,C&7)|0)|0)>>>6;a[v+8>>0]=((Z(g,8-(C&7)|0)|0)+32+(Z(F,C&7)|0)|0)>>>6;a[v>>0]=H;H=y;y=y+2|0;E=d[H+s>>0]|0;z=(Z(E,B&7)|0)+(Z(d[y>>0]|0,8-(B&7)|0)|0)|0;g=(Z(d[H+(t+2)>>0]|0,B&7)|0)+(Z(E,8-(B&7)|0)|0)|0;G=((Z(G,8-(C&7)|0)|0)+32+(Z(z,C&7)|0)|0)>>>6;a[v+9>>0]=((Z(F,8-(C&7)|0)|0)+32+(Z(g,C&7)|0)|0)>>>6;a[v+1>>0]=G;h=h+-1|0;if(!h)break;else v=v+2|0}f=f+-1|0;if(!f)break;else{u=u+(16-(m>>>1)+(m>>>2<<1))|0;x=x+((m>>>2<<1)-(m>>>1)+t)|0}}}w=w+1|0}while((w|0)!=2);i=D;return}if(C&7){if((q|0)>=0?!(((n>>>1)+r|0)>>>0>t<<3>>>0|((r|0)<0?1:(q+1+(m>>>1)|0)>>>0>s<<3>>>0)):0){x=p+o|0;f=s<<3;w=t<<3}else{Qa(p+o|0,D+448|0,q,r,s<<3,t<<3,(m>>>1)+1|0,n>>>1,(m>>>1)+1|0);Qa(p+(o+(Z(t<<3,s<<3)|0))|0,D+448+(Z((m>>>1)+1|0,n>>>1)|0)|0,q,r,s<<3,t<<3,(m>>>1)+1|0,n>>>1,(m>>>1)+1|0);x=D+448|0;q=0;r=0;f=(m>>>1)+1|0;w=n>>>1}g=8-(C&7)|0;y=f+1|0;z=f+2|0;if(!((m>>>2|0)==0|(n>>>2|0)==0)){h=(f<<1)-(m>>>1)+(m>>>2<<1)|0;o=u;s=x+((Z(r,f)|0)+q)|0;v=n>>>2;while(1){p=o;t=s;u=m>>>2;while(1){G=d[t>>0]|0;F=d[t+y>>0]|0;E=t;t=t+2|0;H=d[E+1>>0]|0;a[p+8>>0]=(((Z(F,C&7)|0)+(Z(d[E+f>>0]|0,g)|0)<<3)+32|0)>>>6;a[p>>0]=(((Z(H,C&7)|0)+(Z(G,g)|0)<<3)+32|0)>>>6;G=d[t>>0]|0;a[p+9>>0]=(((Z(d[E+z>>0]|0,C&7)|0)+(Z(F,g)|0)<<3)+32|0)>>>6;a[p+1>>0]=(((Z(G,C&7)|0)+(Z(H,g)|0)<<3)+32|0)>>>6;u=u+-1|0;if(!u)break;else p=p+2|0}v=v+-1|0;if(!v)break;else{o=o+((m>>>2<<1)+(16-(m>>>1)))|0;s=s+h|0}}t=e+((k>>>1)+256+(l>>>1<<3)+64)|0;s=x+((Z(r+w|0,f)|0)+q)|0;r=n>>>2;while(1){o=t;p=s;q=m>>>2;while(1){G=d[p>>0]|0;F=d[p+y>>0]|0;E=p;p=p+2|0;H=d[E+1>>0]|0;a[o+8>>0]=(((Z(F,C&7)|0)+(Z(d[E+f>>0]|0,g)|0)<<3)+32|0)>>>6;a[o>>0]=(((Z(H,C&7)|0)+(Z(G,g)|0)<<3)+32|0)>>>6;G=d[p>>0]|0;a[o+9>>0]=(((Z(d[E+z>>0]|0,C&7)|0)+(Z(F,g)|0)<<3)+32|0)>>>6;a[o+1>>0]=(((Z(G,C&7)|0)+(Z(H,g)|0)<<3)+32|0)>>>6;q=q+-1|0;if(!q)break;else o=o+2|0}r=r+-1|0;if(!r)break;else{t=t+((m>>>2<<1)+(16-(m>>>1)))|0;s=s+h|0}}}i=D;return}if(!(B&7)){Qa(p+o|0,u,q,r,s<<3,t<<3,m>>>1,n>>>1,8);Qa(p+((Z(t<<3,s<<3)|0)+o)|0,e+((k>>>1)+256+(l>>>1<<3)+64)|0,q,r,s<<3,t<<3,m>>>1,n>>>1,8);i=D;return}if(((q|0)>=0?!((r|0)<0?1:((m>>>1)+q|0)>>>0>s<<3>>>0):0)?(r+1+(n>>>1)|0)>>>0<=t<<3>>>0:0){x=p+o|0;h=s<<3;w=t<<3}else{Qa(p+o|0,D+448|0,q,r,s<<3,t<<3,m>>>1,(n>>>1)+1|0,m>>>1);Qa(p+(o+(Z(t<<3,s<<3)|0))|0,D+448+(Z((n>>>1)+1|0,m>>>1)|0)|0,q,r,s<<3,t<<3,m>>>1,(n>>>1)+1|0,m>>>1);x=D+448|0;q=0;r=0;h=m>>>1;w=(n>>>1)+1|0}z=8-(B&7)|0;g=h<<1;y=h+1|0;if(!((m>>>2|0)==0|(n>>>2|0)==0)){o=u;s=x+((Z(r,h)|0)+q)|0;v=n>>>2;while(1){p=o;t=s;u=m>>>2;while(1){H=d[t+h>>0]|0;G=d[t>>0]|0;a[p+8>>0]=(((Z(H,z)|0)+(Z(d[t+g>>0]|0,B&7)|0)<<3)+32|0)>>>6;a[p>>0]=(((Z(G,z)|0)+(Z(H,B&7)|0)<<3)+32|0)>>>6;H=d[t+y>>0]|0;G=d[t+1>>0]|0;a[p+9>>0]=(((Z(H,z)|0)+(Z(d[t+(g|1)>>0]|0,B&7)|0)<<3)+32|0)>>>6;a[p+1>>0]=(((Z(G,z)|0)+(Z(H,B&7)|0)<<3)+32|0)>>>6;u=u+-1|0;if(!u)break;else{p=p+2|0;t=t+2|0}}v=v+-1|0;if(!v)break;else{o=o+((m>>>2<<1)+(16-(m>>>1)))|0;s=s+(g-(m>>>1)+(m>>>2<<1))|0}}t=e+((k>>>1)+256+(l>>>1<<3)+64)|0;s=x+((Z(r+w|0,h)|0)+q)|0;r=n>>>2;while(1){o=t;p=s;q=m>>>2;while(1){H=d[p+h>>0]|0;G=d[p>>0]|0;a[o+8>>0]=(((Z(H,z)|0)+(Z(d[p+g>>0]|0,B&7)|0)<<3)+32|0)>>>6;a[o>>0]=(((Z(G,z)|0)+(Z(H,B&7)|0)<<3)+32|0)>>>6;H=d[p+y>>0]|0;G=d[p+1>>0]|0;a[o+9>>0]=(((Z(H,z)|0)+(Z(d[p+(g|1)>>0]|0,B&7)|0)<<3)+32|0)>>>6;a[o+1>>0]=(((Z(G,z)|0)+(Z(H,B&7)|0)<<3)+32|0)>>>6;q=q+-1|0;if(!q)break;else{o=o+2|0;p=p+2|0}}r=r+-1|0;if(!r)break;else{t=t+((m>>>2<<1)+(16-(m>>>1)))|0;s=s+(g-(m>>>1)+(m>>>2<<1))|0}}}i=D;return}function Xa(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;if(d){xb(c|0,a[b>>0]|0,d|0)|0;c=c+d|0}if(e){d=e;g=b;h=c;while(1){a[h>>0]=a[g>>0]|0;d=d+-1|0;if(!d)break;else{g=g+1|0;h=h+1|0}}b=b+e|0;c=c+e|0}if(!f)return;xb(c|0,a[b+-1>>0]|0,f|0)|0;return}function Ya(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;yb(b|0,a|0,d|0)|0;return}function Za(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;w=c[a+8>>2]|0;x=c[w>>2]|0;if((x|0)!=(d|0))return;c[a+52>>2]=0;v=c[a+56>>2]|0;do if(!b){c[w+20>>2]=0;c[w+12>>2]=e;c[w+8>>2]=e;c[w+16>>2]=f;c[w+24>>2]=(v|0)==0&1;if(!v){j=(c[a+44>>2]|0)+1|0;c[a+44>>2]=j;c[w+36>>2]=g;c[w+28>>2]=h;c[w+32>>2]=i;n=a+44|0;u=108;break}else{c[w+36>>2]=g;c[w+28>>2]=h;c[w+32>>2]=i;u=110;break}}else{do if(!g){if(!(c[b+8>>2]|0)){j=c[a+40>>2]|0;d=c[a+24>>2]|0;if(j>>>0>=d>>>0)if(j){m=c[a>>2]|0;n=0;k=-1;l=0;do{if(((c[m+(n*40|0)+20>>2]|0)+-1|0)>>>0<2){b=c[m+(n*40|0)+8>>2]|0;u=(k|0)==-1|(b|0)<(l|0);k=u?n:k;l=u?b:l}n=n+1|0}while((n|0)!=(j|0));if((k|0)>-1){c[m+(k*40|0)+20>>2]=0;c[a+40>>2]=j+-1;if(!(c[m+(k*40|0)+24>>2]|0)){c[a+44>>2]=(c[a+44>>2]|0)+-1;k=a+40|0;j=j+-1|0}else{k=a+40|0;j=j+-1|0}}else k=a+40|0}else{k=a+40|0;j=0}else k=a+40|0}else{d=v;r=v;s=0;k=0;a:while(1){switch(c[b+12+(s*20|0)>>2]|0){case 6:{n=c[b+12+(s*20|0)+12>>2]|0;q=c[a+36>>2]|0;if((q|0)==65535|q>>>0<n>>>0)break a;o=c[a+24>>2]|0;b:do if(o){m=c[a>>2]|0;l=0;while(1){j=m+(l*40|0)+20|0;if((c[j>>2]|0)==3?(c[m+(l*40|0)+8>>2]|0)==(n|0):0)break;j=l+1|0;if(j>>>0<o>>>0)l=j;else{u=89;break b}}c[j>>2]=0;j=(c[a+40>>2]|0)+-1|0;c[a+40>>2]=j;if(!(c[m+(l*40|0)+24>>2]|0))c[a+44>>2]=(c[a+44>>2]|0)+-1}else u=89;while(0);if((u|0)==89){u=0;j=c[a+40>>2]|0}if(j>>>0>=o>>>0)break a;c[w+12>>2]=e;c[w+8>>2]=n;c[w+16>>2]=f;c[w+20>>2]=3;c[w+24>>2]=(d|0)==0&1;c[a+40>>2]=j+1;c[a+44>>2]=(c[a+44>>2]|0)+1;j=r;k=1;break}case 1:{m=e-(c[b+12+(s*20|0)+4>>2]|0)|0;n=c[a+24>>2]|0;if(!n)break a;o=c[a>>2]|0;j=0;while(1){l=o+(j*40|0)+20|0;if(((c[l>>2]|0)+-1|0)>>>0<2?(c[o+(j*40|0)+8>>2]|0)==(m|0):0)break;j=j+1|0;if(j>>>0>=n>>>0)break a}if((j|0)<0)break a;c[l>>2]=0;c[a+40>>2]=(c[a+40>>2]|0)+-1;if(!(c[o+(j*40|0)+24>>2]|0)){c[a+44>>2]=(c[a+44>>2]|0)+-1;j=r}else j=r;break}case 2:{m=c[b+12+(s*20|0)+8>>2]|0;n=c[a+24>>2]|0;if(!n)break a;o=c[a>>2]|0;j=0;while(1){l=o+(j*40|0)+20|0;if((c[l>>2]|0)==3?(c[o+(j*40|0)+8>>2]|0)==(m|0):0)break;j=j+1|0;if(j>>>0>=n>>>0)break a}if((j|0)<0)break a;c[l>>2]=0;c[a+40>>2]=(c[a+40>>2]|0)+-1;if(!(c[o+(j*40|0)+24>>2]|0)){c[a+44>>2]=(c[a+44>>2]|0)+-1;j=r}else j=r;break}case 3:{j=c[b+12+(s*20|0)+4>>2]|0;o=c[b+12+(s*20|0)+12>>2]|0;q=c[a+36>>2]|0;if((q|0)==65535|q>>>0<o>>>0)break a;p=c[a+24>>2]|0;if(!p)break a;q=c[a>>2]|0;n=0;while(1){l=q+(n*40|0)+20|0;if((c[l>>2]|0)==3?(c[q+(n*40|0)+8>>2]|0)==(o|0):0){u=48;break}m=n+1|0;if(m>>>0<p>>>0)n=m;else break}if((u|0)==48?(u=0,c[l>>2]=0,c[a+40>>2]=(c[a+40>>2]|0)+-1,(c[q+(n*40|0)+24>>2]|0)==0):0)c[a+44>>2]=(c[a+44>>2]|0)+-1;n=e-j|0;j=0;while(1){l=q+(j*40|0)+20|0;m=c[l>>2]|0;if((m+-1|0)>>>0<2?(t=q+(j*40|0)+8|0,(c[t>>2]|0)==(n|0)):0)break;j=j+1|0;if(j>>>0>=p>>>0)break a}if(!((j|0)>-1&m>>>0>1))break a;c[l>>2]=3;c[t>>2]=o;j=r;break}case 4:{m=c[b+12+(s*20|0)+16>>2]|0;c[a+36>>2]=m;n=c[a+24>>2]|0;if(!n)j=r;else{o=c[a>>2]|0;j=m;p=0;do{l=o+(p*40|0)+20|0;do if((c[l>>2]|0)==3){if((c[o+(p*40|0)+8>>2]|0)>>>0<=m>>>0)if((j|0)==65535)j=65535;else break;c[l>>2]=0;c[a+40>>2]=(c[a+40>>2]|0)+-1;if(!(c[o+(p*40|0)+24>>2]|0))c[a+44>>2]=(c[a+44>>2]|0)+-1}while(0);p=p+1|0}while((p|0)!=(n|0));j=r}break}case 5:{n=c[a>>2]|0;e=0;do{j=n+(e*40|0)+20|0;if((c[j>>2]|0)!=0?(c[j>>2]=0,(c[n+(e*40|0)+24>>2]|0)==0):0)c[a+44>>2]=(c[a+44>>2]|0)+-1;e=e+1|0}while((e|0)!=16);c:do if(!d){l=c[a+28>>2]|0;m=r;while(1){e=0;d=2147483647;j=0;do{if(c[n+(e*40|0)+24>>2]|0){q=c[n+(e*40|0)+16>>2]|0;r=(q|0)<(d|0);d=r?q:d;j=r?n+(e*40|0)|0:j}e=e+1|0}while(e>>>0<=l>>>0);if(!j){j=m;d=0;break c}r=c[a+16>>2]|0;q=c[a+12>>2]|0;c[q+(r<<4)>>2]=c[j>>2];c[q+(r<<4)+12>>2]=c[j+36>>2];c[q+(r<<4)+4>>2]=c[j+28>>2];c[q+(r<<4)+8>>2]=c[j+32>>2];c[a+16>>2]=r+1;c[j+24>>2]=0;if(!(c[j+20>>2]|0))c[a+44>>2]=(c[a+44>>2]|0)+-1;if(!m)m=0;else{j=m;d=m;break}}}else j=r;while(0);c[a+40>>2]=0;c[a+36>>2]=65535;c[a+48>>2]=0;c[a+52>>2]=1;e=0;break}default:break a}r=j;s=s+1|0}if(k)break;k=a+40|0;j=c[a+40>>2]|0;d=c[a+24>>2]|0}if(j>>>0<d>>>0){c[w+12>>2]=e;c[w+8>>2]=e;c[w+16>>2]=f;c[w+20>>2]=2;c[w+24>>2]=(v|0)==0&1;c[a+44>>2]=(c[a+44>>2]|0)+1;c[k>>2]=j+1}}else{c[a+20>>2]=0;c[a+16>>2]=0;m=c[a>>2]|0;j=0;do{d=m+(j*40|0)+20|0;if((c[d>>2]|0)!=0?(c[d>>2]=0,(c[m+(j*40|0)+24>>2]|0)==0):0)c[a+44>>2]=(c[a+44>>2]|0)+-1;j=j+1|0}while((j|0)!=16);d:do if(!v){l=c[a+28>>2]|0;d=0;while(1){k=0;j=2147483647;e=0;do{if(c[m+(k*40|0)+24>>2]|0){u=c[m+(k*40|0)+16>>2]|0;f=(u|0)<(j|0);j=f?u:j;e=f?m+(k*40|0)|0:e}k=k+1|0}while(k>>>0<=l>>>0);if(!e)break d;f=c[a+12>>2]|0;c[f+(d<<4)>>2]=c[e>>2];c[f+(d<<4)+12>>2]=c[e+36>>2];c[f+(d<<4)+4>>2]=c[e+28>>2];c[f+(d<<4)+8>>2]=c[e+32>>2];d=d+1|0;c[a+16>>2]=d;c[e+24>>2]=0;if(c[e+20>>2]|0)continue;c[a+44>>2]=(c[a+44>>2]|0)+-1}}while(0);c[a+40>>2]=0;c[a+36>>2]=65535;c[a+48>>2]=0;if((c[b>>2]|0)!=0|(v|0)==0^1){c[a+16>>2]=0;c[a+20>>2]=0}f=(c[b+4>>2]|0)==0;c[w+20>>2]=f?2:3;c[a+36>>2]=f?65535:0;c[w+12>>2]=0;c[w+8>>2]=0;c[w+16>>2]=0;c[w+24>>2]=(v|0)==0&1;c[a+44>>2]=1;c[a+40>>2]=1}while(0);c[w+36>>2]=g;c[w+28>>2]=h;c[w+32>>2]=i;if(!v){n=a+44|0;j=c[a+44>>2]|0;u=108}else u=110}while(0);if((u|0)==108){d=c[a+28>>2]|0;if(j>>>0>d>>>0){m=c[a>>2]|0;do{l=0;e=2147483647;k=0;do{if(c[m+(l*40|0)+24>>2]|0){g=c[m+(l*40|0)+16>>2]|0;i=(g|0)<(e|0);e=i?g:e;k=i?m+(l*40|0)|0:k}l=l+1|0}while(l>>>0<=d>>>0);if((k|0)!=0?(i=c[a+16>>2]|0,g=c[a+12>>2]|0,c[g+(i<<4)>>2]=c[k>>2],c[g+(i<<4)+12>>2]=c[k+36>>2],c[g+(i<<4)+4>>2]=c[k+28>>2],c[g+(i<<4)+8>>2]=c[k+32>>2],c[a+16>>2]=i+1,c[k+24>>2]=0,(c[k+20>>2]|0)==0):0){j=j+-1|0;c[n>>2]=j}}while(j>>>0>d>>>0)}}else if((u|0)==110){d=c[a+16>>2]|0;w=c[a+12>>2]|0;c[w+(d<<4)>>2]=x;c[w+(d<<4)+12>>2]=g;c[w+(d<<4)+4>>2]=h;c[w+(d<<4)+8>>2]=i;c[a+16>>2]=d+1;d=c[a+28>>2]|0}_a(c[a>>2]|0,d+1|0);return}function _a(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;s=i;i=i+16|0;q=7;do{if(q>>>0<b>>>0){p=q;do{n=a+(p*40|0)|0;m=c[n>>2]|0;n=c[n+4>>2]|0;o=c[a+(p*40|0)+8>>2]|0;j=a+(p*40|0)+12|0;h=c[j>>2]|0;j=c[j+4>>2]|0;k=c[a+(p*40|0)+20>>2]|0;l=c[a+(p*40|0)+24>>2]|0;g=a+(p*40|0)+28|0;c[s>>2]=c[g>>2];c[s+4>>2]=c[g+4>>2];c[s+8>>2]=c[g+8>>2];a:do if(p>>>0<q>>>0){e=p;r=9}else{b:do if(!k)if(!l)e=p;else{d=p;while(1){e=d-q|0;if(c[a+(e*40|0)+20>>2]|0){e=d;break b}if(c[a+(e*40|0)+24>>2]|0){e=d;break b}d=a+(d*40|0)|0;f=a+(e*40|0)|0;g=d+40|0;do{c[d>>2]=c[f>>2];d=d+4|0;f=f+4|0}while((d|0)<(g|0));if(e>>>0<q>>>0){r=9;break a}else d=e}}else{g=p;while(1){e=g-q|0;d=c[a+(e*40|0)+20>>2]|0;do if(d){if((d+-1|k+-1)>>>0<2){f=c[a+(e*40|0)+8>>2]|0;if((f|0)>(o|0)){e=g;break b}d=a+(g*40|0)|0;if((f|0)<(o|0))break;else{e=g;break a}}if((d+-1|0)>>>0<2){e=g;break b}if((k+-1|0)>>>0>=2?(c[a+(e*40|0)+8>>2]|0)<=(o|0):0){e=g;break b}else r=17}else r=17;while(0);if((r|0)==17){r=0;d=a+(g*40|0)|0}f=a+(e*40|0)|0;g=d+40|0;do{c[d>>2]=c[f>>2];d=d+4|0;f=f+4|0}while((d|0)<(g|0));if(e>>>0<q>>>0){r=9;break a}else g=e}}while(0);d=a+(e*40|0)|0}while(0);if((r|0)==9){r=0;d=a+(e*40|0)|0}g=d;c[g>>2]=m;c[g+4>>2]=n;c[a+(e*40|0)+8>>2]=o;o=a+(e*40|0)+12|0;c[o>>2]=h;c[o+4>>2]=j;c[a+(e*40|0)+20>>2]=k;c[a+(e*40|0)+24>>2]=l;o=a+(e*40|0)+28|0;c[o>>2]=c[s>>2];c[o+4>>2]=c[s+4>>2];c[o+8>>2]=c[s+8>>2];p=p+1|0}while((p|0)!=(b|0))}q=q>>>1}while((q|0)!=0);i=s;return}function $a(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;e=c[a+4>>2]|0;f=c[a+16>>2]|0;g=c[a+20>>2]|0;h=16;a=c[a+12>>2]|0;d=b;while(1){i=c[d+4>>2]|0;c[a>>2]=c[d>>2];c[a+4>>2]=i;i=c[d+12>>2]|0;c[a+8>>2]=c[d+8>>2];c[a+12>>2]=i;h=h+-1|0;if(!h)break;else{a=a+(e<<2<<2)|0;d=d+16|0}}d=c[b+260>>2]|0;c[f>>2]=c[b+256>>2];c[f+4>>2]=d;d=c[b+268>>2]|0;c[f+((e<<1&2147483646)<<2)>>2]=c[b+264>>2];c[f+((e<<1&2147483646|1)<<2)>>2]=d;d=c[b+276>>2]|0;c[f+(e<<2<<2)>>2]=c[b+272>>2];c[f+((e<<2|1)<<2)>>2]=d;d=(e<<1&2147483646)+(e<<2)|0;h=c[b+284>>2]|0;c[f+(d<<2)>>2]=c[b+280>>2];c[f+((d|1)<<2)>>2]=h;h=c[b+292>>2]|0;c[f+(d+(e<<1&2147483646)<<2)>>2]=c[b+288>>2];c[f+((d+(e<<1&2147483646)|1)<<2)>>2]=h;h=d+(e<<1&2147483646)+(e<<1&2147483646)|0;i=c[b+300>>2]|0;c[f+(h<<2)>>2]=c[b+296>>2];c[f+((h|1)<<2)>>2]=i;i=c[b+308>>2]|0;c[f+(h+(e<<1&2147483646)<<2)>>2]=c[b+304>>2];c[f+((h+(e<<1&2147483646)|1)<<2)>>2]=i;i=h+(e<<1&2147483646)+(e<<1&2147483646)|0;a=c[b+316>>2]|0;c[f+(i<<2)>>2]=c[b+312>>2];c[f+((i|1)<<2)>>2]=a;f=c[b+324>>2]|0;c[g>>2]=c[b+320>>2];c[g+4>>2]=f;f=c[b+332>>2]|0;c[g+((e<<1&2147483646)<<2)>>2]=c[b+328>>2];c[g+((e<<1&2147483646|1)<<2)>>2]=f;f=c[b+340>>2]|0;c[g+(e<<2<<2)>>2]=c[b+336>>2];c[g+((e<<2|1)<<2)>>2]=f;f=c[b+348>>2]|0;c[g+(d<<2)>>2]=c[b+344>>2];c[g+((d|1)<<2)>>2]=f;f=c[b+356>>2]|0;c[g+(d+(e<<1&2147483646)<<2)>>2]=c[b+352>>2];c[g+((d+(e<<1&2147483646)|1)<<2)>>2]=f;f=c[b+364>>2]|0;c[g+(h<<2)>>2]=c[b+360>>2];c[g+((h|1)<<2)>>2]=f;f=c[b+372>>2]|0;c[g+(h+(e<<1&2147483646)<<2)>>2]=c[b+368>>2];c[g+((h+(e<<1&2147483646)|1)<<2)>>2]=f;h=c[b+380>>2]|0;c[g+(i<<2)>>2]=c[b+376>>2];c[g+((i|1)<<2)>>2]=h;return}function ab(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;if(e>>>0<4){p=d[(c[f>>2]|0)+(e+-1)>>0]|0;o=4;while(1){e=b+-2|0;k=b+-1|0;i=b+1|0;l=a[i>>0]|0;m=d[k>>0]|0;n=d[b>>0]|0;if((((m-n|0)<0?0-(m-n)|0:m-n|0)>>>0<(c[f+4>>2]|0)>>>0?(q=d[e>>0]|0,r=c[f+8>>2]|0,((q-m|0)<0?0-(q-m)|0:q-m|0)>>>0<r>>>0):0)?(((l&255)-n|0)<0?0-((l&255)-n)|0:(l&255)-n|0)>>>0<r>>>0:0){j=a[b+2>>0]|0;h=d[b+-3>>0]|0;if(((h-m|0)<0?0-(h-m)|0:h-m|0)>>>0<r>>>0){a[e>>0]=((((m+1+n|0)>>>1)-(q<<1)+h>>1|0)<(0-p|0)?0-p|0:(((m+1+n|0)>>>1)-(q<<1)+h>>1|0)>(p|0)?p:((m+1+n|0)>>>1)-(q<<1)+h>>1)+q;h=c[f+8>>2]|0;e=p+1|0}else{h=r;e=p}if((((j&255)-n|0)<0?0-((j&255)-n)|0:(j&255)-n|0)>>>0<h>>>0){a[i>>0]=((((m+1+n|0)>>>1)-((l&255)<<1)+(j&255)>>1|0)<(0-p|0)?0-p|0:(((m+1+n|0)>>>1)-((l&255)<<1)+(j&255)>>1|0)>(p|0)?p:((m+1+n|0)>>>1)-((l&255)<<1)+(j&255)>>1)+(l&255);e=e+1|0}s=0-e|0;s=(4-(l&255)+(n-m<<2)+q>>3|0)<(s|0)?s:(4-(l&255)+(n-m<<2)+q>>3|0)>(e|0)?e:4-(l&255)+(n-m<<2)+q>>3;t=a[6294+((n|512)-s)>>0]|0;a[k>>0]=a[6294+(s+(m|512))>>0]|0;a[b>>0]=t}o=o+-1|0;if(!o)break;else b=b+g|0}return}r=4;while(1){i=b+-2|0;j=b+-1|0;k=b+1|0;l=a[k>>0]|0;m=d[j>>0]|0;n=d[b>>0]|0;e=(m-n|0)<0?0-(m-n)|0:m-n|0;h=c[f+4>>2]|0;do if((e>>>0<h>>>0?(s=d[i>>0]|0,t=c[f+8>>2]|0,((s-m|0)<0?0-(s-m)|0:s-m|0)>>>0<t>>>0):0)?(((l&255)-n|0)<0?0-((l&255)-n)|0:(l&255)-n|0)>>>0<t>>>0:0){o=b+-3|0;p=b+2|0;q=a[p>>0]|0;if(e>>>0<((h>>>2)+2|0)>>>0){e=d[o>>0]|0;if(((e-m|0)<0?0-(e-m)|0:e-m|0)>>>0<t>>>0){a[j>>0]=((l&255)+4+(n+m+s<<1)+e|0)>>>3;a[i>>0]=(n+m+s+2+e|0)>>>2;a[o>>0]=(n+m+s+4+(e*3|0)+((d[b+-4>>0]|0)<<1)|0)>>>3}else a[j>>0]=(m+2+(l&255)+(s<<1)|0)>>>2;if((((q&255)-n|0)<0?0-((q&255)-n)|0:(q&255)-n|0)>>>0<(c[f+8>>2]|0)>>>0){a[b>>0]=((n+m+(l&255)<<1)+4+s+(q&255)|0)>>>3;a[k>>0]=(n+m+(l&255)+2+(q&255)|0)>>>2;a[p>>0]=(n+m+(l&255)+4+((q&255)*3|0)+((d[b+3>>0]|0)<<1)|0)>>>3;break}}else a[j>>0]=(m+2+(l&255)+(s<<1)|0)>>>2;a[b>>0]=(n+2+((l&255)<<1)+s|0)>>>2}while(0);r=r+-1|0;if(!r)break;else b=b+g|0}return}function bb(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;p=d[(c[f>>2]|0)+(e+-1)>>0]|0;q=Z(g,-3)|0;o=4;while(1){e=b+(0-g<<1)|0;k=b+(0-g)|0;j=b+g|0;l=a[j>>0]|0;m=d[k>>0]|0;n=d[b>>0]|0;if((((m-n|0)<0?0-(m-n)|0:m-n|0)>>>0<(c[f+4>>2]|0)>>>0?(r=d[e>>0]|0,s=c[f+8>>2]|0,((r-m|0)<0?0-(r-m)|0:r-m|0)>>>0<s>>>0):0)?(((l&255)-n|0)<0?0-((l&255)-n)|0:(l&255)-n|0)>>>0<s>>>0:0){h=d[b+q>>0]|0;if(((h-m|0)<0?0-(h-m)|0:h-m|0)>>>0<s>>>0){a[e>>0]=((((m+1+n|0)>>>1)-(r<<1)+h>>1|0)<(0-p|0)?0-p|0:(((m+1+n|0)>>>1)-(r<<1)+h>>1|0)>(p|0)?p:((m+1+n|0)>>>1)-(r<<1)+h>>1)+r;i=c[f+8>>2]|0;e=p+1|0}else{i=s;e=p}h=d[b+(g<<1)>>0]|0;if(((h-n|0)<0?0-(h-n)|0:h-n|0)>>>0<i>>>0){a[j>>0]=((((m+1+n|0)>>>1)-((l&255)<<1)+h>>1|0)<(0-p|0)?0-p|0:(((m+1+n|0)>>>1)-((l&255)<<1)+h>>1|0)>(p|0)?p:((m+1+n|0)>>>1)-((l&255)<<1)+h>>1)+(l&255);e=e+1|0}j=0-e|0;l=(4-(l&255)+(n-m<<2)+r>>3|0)<(j|0)?j:(4-(l&255)+(n-m<<2)+r>>3|0)>(e|0)?e:4-(l&255)+(n-m<<2)+r>>3;n=a[6294+((n|512)-l)>>0]|0;a[k>>0]=a[6294+(l+(m|512))>>0]|0;a[b>>0]=n}o=o+-1|0;if(!o)break;else b=b+1|0}return}function cb(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;j=a[b+1>>0]|0;k=d[b+-1>>0]|0;l=d[b>>0]|0;do if((((k-l|0)<0?0-(k-l)|0:k-l|0)>>>0<(c[f+4>>2]|0)>>>0?(h=d[b+-2>>0]|0,i=c[f+8>>2]|0,((h-k|0)<0?0-(h-k)|0:h-k|0)>>>0<i>>>0):0)?(((j&255)-l|0)<0?0-((j&255)-l)|0:(j&255)-l|0)>>>0<i>>>0:0)if(e>>>0<4){i=d[(c[f>>2]|0)+(e+-1)>>0]|0;j=(4-(j&255)+(l-k<<2)+h>>3|0)<(~i|0)?~i:(4-(j&255)+(l-k<<2)+h>>3|0)>(i+1|0)?i+1|0:4-(j&255)+(l-k<<2)+h>>3;l=a[6294+((l|512)-j)>>0]|0;a[b+-1>>0]=a[6294+(j+(k|512))>>0]|0;a[b>>0]=l;break}else{a[b+-1>>0]=(k+2+(j&255)+(h<<1)|0)>>>2;a[b>>0]=(l+2+((j&255)<<1)+h|0)>>>2;break}while(0);h=d[b+(g+-1)>>0]|0;i=d[b+g>>0]|0;if(((h-i|0)<0?0-(h-i)|0:h-i|0)>>>0>=(c[f+4>>2]|0)>>>0)return;j=d[b+(g+-2)>>0]|0;k=c[f+8>>2]|0;if(((j-h|0)<0?0-(j-h)|0:j-h|0)>>>0>=k>>>0)return;l=d[b+(g+1)>>0]|0;if(((l-i|0)<0?0-(l-i)|0:l-i|0)>>>0>=k>>>0)return;if(e>>>0<4){e=d[(c[f>>2]|0)+(e+-1)>>0]|0;e=(4-l+(i-h<<2)+j>>3|0)<(~e|0)?~e:(4-l+(i-h<<2)+j>>3|0)>(e+1|0)?e+1|0:4-l+(i-h<<2)+j>>3;f=a[6294+((i|512)-e)>>0]|0;a[b+(g+-1)>>0]=a[6294+(e+(h|512))>>0]|0;a[b+g>>0]=f;return}else{a[b+(g+-1)>>0]=(h+2+l+(j<<1)|0)>>>2;a[b+g>>0]=(i+2+(l<<1)+j|0)>>>2;return}}function db(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;if(e>>>0<4){l=d[(c[f>>2]|0)+(e+-1)>>0]|0;k=8;while(1){e=b+(0-g)|0;h=a[b+g>>0]|0;i=d[e>>0]|0;j=d[b>>0]|0;if((((i-j|0)<0?0-(i-j)|0:i-j|0)>>>0<(c[f+4>>2]|0)>>>0?(n=d[b+(0-g<<1)>>0]|0,o=c[f+8>>2]|0,((n-i|0)<0?0-(n-i)|0:n-i|0)>>>0<o>>>0):0)?(((h&255)-j|0)<0?0-((h&255)-j)|0:(h&255)-j|0)>>>0<o>>>0:0){h=(4-(h&255)+(j-i<<2)+n>>3|0)<(~l|0)?~l:(4-(h&255)+(j-i<<2)+n>>3|0)>(l+1|0)?l+1|0:4-(h&255)+(j-i<<2)+n>>3;m=a[6294+((j|512)-h)>>0]|0;a[e>>0]=a[6294+(h+(i|512))>>0]|0;a[b>>0]=m}k=k+-1|0;if(!k)break;else b=b+1|0}return}else{k=8;while(1){e=b+(0-g)|0;h=a[b+g>>0]|0;i=d[e>>0]|0;j=d[b>>0]|0;if((((i-j|0)<0?0-(i-j)|0:i-j|0)>>>0<(c[f+4>>2]|0)>>>0?(l=d[b+(0-g<<1)>>0]|0,m=c[f+8>>2]|0,((l-i|0)<0?0-(l-i)|0:l-i|0)>>>0<m>>>0):0)?(((h&255)-j|0)<0?0-((h&255)-j)|0:(h&255)-j|0)>>>0<m>>>0:0){a[e>>0]=(i+2+(h&255)+(l<<1)|0)>>>2;a[b>>0]=(j+2+((h&255)<<1)+l|0)>>>2}k=k+-1|0;if(!k)break;else b=b+1|0}return}}function eb(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0;m=d[(c[f>>2]|0)+(e+-1)>>0]|0;h=a[b+g>>0]|0;i=d[b+(0-g)>>0]|0;j=d[b>>0]|0;e=c[f+4>>2]|0;if((((i-j|0)<0?0-(i-j)|0:i-j|0)>>>0<e>>>0?(k=d[b+(0-g<<1)>>0]|0,l=c[f+8>>2]|0,((k-i|0)<0?0-(k-i)|0:k-i|0)>>>0<l>>>0):0)?(((h&255)-j|0)<0?0-((h&255)-j)|0:(h&255)-j|0)>>>0<l>>>0:0){l=(4-(h&255)+(j-i<<2)+k>>3|0)<(~m|0)?~m:(4-(h&255)+(j-i<<2)+k>>3|0)>(m+1|0)?m+1|0:4-(h&255)+(j-i<<2)+k>>3;e=a[6294+((j|512)-l)>>0]|0;a[b+(0-g)>>0]=a[6294+(l+(i|512))>>0]|0;a[b>>0]=e;e=c[f+4>>2]|0}j=d[b+(1-g)>>0]|0;k=d[b+1>>0]|0;if(((j-k|0)<0?0-(j-k)|0:j-k|0)>>>0>=e>>>0)return;i=d[b+(0-g<<1|1)>>0]|0;e=c[f+8>>2]|0;if(((i-j|0)<0?0-(i-j)|0:i-j|0)>>>0>=e>>>0)return;h=d[b+(g+1)>>0]|0;if(((h-k|0)<0?0-(h-k)|0:h-k|0)>>>0>=e>>>0)return;f=(4-h+(k-j<<2)+i>>3|0)<(~m|0)?~m:(4-h+(k-j<<2)+i>>3|0)>(m+1|0)?m+1|0:4-h+(k-j<<2)+i>>3;m=a[6294+((k|512)-f)>>0]|0;a[b+(1-g)>>0]=a[6294+(f+(j|512))>>0]|0;a[b+1>>0]=m;return}
function ib(e,f,g,h,j){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,$a=0,gb=0,ib=0,jb=0,kb=0,lb=0,mb=0,nb=0,ob=0,pb=0,qb=0,rb=0;rb=i;i=i+816|0;if((c[e+3344>>2]|0)!=0?(c[e+3348>>2]|0)==(f|0):0){c[rb+624>>2]=c[e+3356>>2];c[rb+624+4>>2]=c[e+3356+4>>2];c[rb+624+8>>2]=c[e+3356+8>>2];c[rb+624+12>>2]=c[e+3356+12>>2];c[rb+624+4>>2]=c[rb+624>>2];c[rb+624+8>>2]=0;c[rb+624+16>>2]=0;c[j>>2]=c[e+3352>>2];B=rb+624+8|0;t=rb+624+4|0;u=rb+624+16|0;m=0}else{do if(((g>>>0>3?(a[f>>0]|0)==0:0)?(a[f+1>>0]|0)==0:0)?(n=a[f+2>>0]|0,(n&255)<2):0){s=-3;r=3;q=f+3|0;o=2;while(1){if(n<<24>>24)if(n<<24>>24==1&o>>>0>1){t=r;u=0;v=0;x=q;y=0;break}else o=0;else o=o+1|0;p=r+1|0;if((p|0)==(g|0)){Xa=9;break}s=~r;n=a[q>>0]|0;r=p;q=q+1|0}if((Xa|0)==9){c[j>>2]=g;e=3;i=rb;return e|0}while(1){n=a[x>>0]|0;o=t+1|0;p=(n<<24>>24!=0^1)+y|0;u=n<<24>>24==3&(p|0)==2?1:u;if(n<<24>>24==1&p>>>0>1){Xa=16;break}y=n<<24>>24!=0?0:p;w=n<<24>>24!=0&p>>>0>2?1:v;if((o|0)==(g|0)){Xa=18;break}else{t=o;v=w;x=x+1|0}}if((Xa|0)==16){z=t+s-p|0;c[rb+624+12>>2]=z;E=rb+624+12|0;A=u;B=r;C=v;D=p-(p>>>0<3?p:3)|0;break}else if((Xa|0)==18){z=s+g-y|0;c[rb+624+12>>2]=z;E=rb+624+12|0;A=u;B=r;C=w;D=y;break}}else Xa=19;while(0);if((Xa|0)==19){c[rb+624+12>>2]=g;E=rb+624+12|0;z=g;A=1;B=0;C=0;D=0}n=f+B|0;c[rb+624>>2]=n;c[rb+624+4>>2]=n;c[rb+624+8>>2]=0;c[rb+624+16>>2]=0;c[j>>2]=B+z+D;if(C){e=3;i=rb;return e|0}do if(A){p=c[E>>2]|0;q=n;r=n;n=0;a:while(1){while(1){Sa=p;p=p+-1|0;if(!Sa){Xa=31;break a}o=a[q>>0]|0;if((n|0)!=2){F=n;break}if(o<<24>>24!=3){Xa=29;break}if(!p){ka=3;Xa=1494;break a}n=q+1|0;if((d[n>>0]|0)>3){ka=3;Xa=1494;break a}else{q=n;n=0}}if((Xa|0)==29){Xa=0;if((o&255)<3){ka=3;Xa=1494;break}else F=2}a[r>>0]=o;q=q+1|0;r=r+1|0;n=o<<24>>24==0?F+1|0:0}if((Xa|0)==31){c[E>>2]=r-q+(c[E>>2]|0);m=c[rb+624+16>>2]|0;break}else if((Xa|0)==1494){i=rb;return ka|0}}else m=0;while(0);c[e+3356>>2]=c[rb+624>>2];c[e+3356+4>>2]=c[rb+624+4>>2];c[e+3356+8>>2]=c[rb+624+8>>2];c[e+3356+12>>2]=c[rb+624+12>>2];c[e+3356+16>>2]=c[rb+624+16>>2];c[e+3352>>2]=c[j>>2];c[e+3348>>2]=f;B=rb+624+8|0;t=rb+624+4|0;u=rb+624+16|0}c[e+3344>>2]=0;A=rb+624+12|0;Sa=c[A>>2]<<3;o=m+1|0;c[u>>2]=o;c[B>>2]=o&7;if(o>>>0>Sa>>>0){e=3;i=rb;return e|0}s=c[rb+624>>2]|0;c[t>>2]=s+(o>>>3);q=c[A>>2]<<3;r=c[u>>2]|0;if((q-r|0)>31){m=c[B>>2]|0;n=d[s+((o>>>3)+1)>>0]<<16|d[s+(o>>>3)>>0]<<24|d[s+((o>>>3)+2)>>0]<<8|d[s+((o>>>3)+3)>>0];if(m)n=(d[s+((o>>>3)+4)>>0]|0)>>>(8-m|0)|n<<m}else if((q-r|0)>0){m=c[B>>2]|0;n=d[s+(o>>>3)>>0]<<m+24;if((q-r+-8+m|0)>0){o=s+(o>>>3)|0;p=q-r+-8+m|0;m=m+24|0;while(1){o=o+1|0;m=m+-8|0;n=d[o>>0]<<m|n;if((p|0)<=8)break;else p=p+-8|0}}}else n=0;c[u>>2]=r+2;c[B>>2]=r+2&7;if((r+2|0)>>>0>q>>>0){m=0;o=c[t>>2]|0}else{c[t>>2]=s+((r+2|0)>>>3);m=1;o=s+((r+2|0)>>>3)|0}z=m?n>>>30:-1;q=c[A>>2]<<3;r=c[u>>2]|0;if((q-r|0)>31){n=c[B>>2]|0;m=d[o+1>>0]<<16|d[o>>0]<<24|d[o+2>>0]<<8|d[o+3>>0];if(n)m=(d[o+4>>0]|0)>>>(8-n|0)|m<<n}else if((q-r|0)>0){n=c[B>>2]|0;m=d[o>>0]<<n+24;if((q-r+-8+n|0)>0){p=q-r+-8+n|0;n=n+24|0;while(1){o=o+1|0;n=n+-8|0;m=d[o>>0]<<n|m;if((p|0)<=8)break;else p=p+-8|0}}}else m=0;c[u>>2]=r+5;c[B>>2]=r+5&7;if((r+5|0)>>>0>q>>>0){e=0;i=rb;return e|0}c[t>>2]=s+((r+5|0)>>>3);y=m>>>27;if((y+-2|0)>>>0<3){e=3;i=rb;return e|0}switch(y|0){case 5:case 7:case 8:{if((z|0)==0|(y|0)==6){e=3;i=rb;return e|0}break}case 6:case 9:case 10:case 11:case 12:{if(z){e=3;i=rb;return e|0}break}default:{}}if((y+-1|0)>>>0>11){e=0;i=rb;return e|0}b:do switch(y|0){case 6:case 7:case 8:case 9:case 10:case 11:case 13:case 14:case 15:case 16:case 17:case 18:{P=1;Xa=206;break}case 5:case 1:{if(!(c[e+1332>>2]|0))x=0;else{c[e+1332>>2]=0;x=1};c[rb+644>>2]=c[rb+624>>2];c[rb+644+4>>2]=c[rb+624+4>>2];c[rb+644+8>>2]=c[rb+624+8>>2];c[rb+644+12>>2]=c[rb+624+12>>2];c[rb+644+16>>2]=c[rb+624+16>>2];m=Na(rb+644|0,rb+680|0)|0;c:do if(!m){m=Na(rb+644|0,rb+680|0)|0;if(!m){m=Na(rb+644|0,rb+680|0)|0;if(!m){m=c[rb+680>>2]|0;if(m>>>0>255){O=1;Xa=63}else{u=c[e+148+(m<<2)>>2]|0;if(((u|0)!=0?(G=c[u+4>>2]|0,M=c[e+20+(G<<2)>>2]|0,(M|0)!=0):0)?(Sa=c[e+8>>2]|0,(Sa|0)==32|(G|0)==(Sa|0)|(y|0)==5):0){m=c[e+1304>>2]|0;if((m|0)==(z|0))m=x;else m=(m|0)==0|(z|0)==0?1:x;if((c[e+1300>>2]|0)==5)if((y|0)==5)k=m;else Xa=72;else if((y|0)==5)Xa=72;else k=m;if((Xa|0)==72)k=1;m=c[M+12>>2]|0;c[rb+604>>2]=c[rb+624>>2];c[rb+604+4>>2]=c[rb+624+4>>2];c[rb+604+8>>2]=c[rb+624+8>>2];c[rb+604+12>>2]=c[rb+624+12>>2];c[rb+604+16>>2]=c[rb+624+16>>2];d:do if(!(Na(rb+604|0,rb+680|0)|0)){if(Na(rb+604|0,rb+680|0)|0){Xa=85;break}if(!(Na(rb+604|0,rb+680|0)|0))t=0;else{Xa=85;break}while(1)if(!(m>>>t))break;else t=t+1|0;q=t+-1|0;w=rb+604+4|0;o=c[w>>2]|0;v=rb+604+12|0;r=c[v>>2]<<3;g=rb+604+16|0;s=c[g>>2]|0;do if((r-s|0)>31){n=c[rb+604+8>>2]|0;m=d[o+1>>0]<<16|d[o>>0]<<24|d[o+2>>0]<<8|d[o+3>>0];if(!n){n=rb+604+8|0;break}m=(d[o+4>>0]|0)>>>(8-n|0)|m<<n;n=rb+604+8|0}else{if((r-s|0)<=0){m=0;n=rb+604+8|0;break}n=c[rb+604+8>>2]|0;m=d[o>>0]<<n+24;if((r-s+-8+n|0)>0){p=r-s+-8+n|0;n=n+24|0}else{n=rb+604+8|0;break}while(1){o=o+1|0;n=n+-8|0;m=d[o>>0]<<n|m;if((p|0)<=8){n=rb+604+8|0;break}else p=p+-8|0}}while(0);c[g>>2]=q+s;c[n>>2]=q+s&7;if((q+s|0)>>>0>r>>>0){Xa=85;break}c[w>>2]=(c[rb+604>>2]|0)+((q+s|0)>>>3);m=m>>>(33-t|0);if((m|0)==-1){Xa=85;break}if((c[e+1308>>2]|0)!=(m|0)){c[e+1308>>2]=m;k=1}e:do if((y|0)==5){m=c[M+12>>2]|0;c[rb+604>>2]=c[rb+624>>2];c[rb+604+4>>2]=c[rb+624+4>>2];c[rb+604+8>>2]=c[rb+624+8>>2];c[rb+604+12>>2]=c[rb+624+12>>2];c[rb+604+16>>2]=c[rb+624+16>>2];do if(!(Na(rb+604|0,rb+680|0)|0)){if(Na(rb+604|0,rb+680|0)|0)break;if(!(Na(rb+604|0,rb+680|0)|0))t=0;else break;while(1)if(!(m>>>t))break;else t=t+1|0;q=t+-1|0;o=c[w>>2]|0;r=c[v>>2]<<3;s=c[g>>2]|0;do if((r-s|0)>31){n=c[rb+604+8>>2]|0;m=d[o+1>>0]<<16|d[o>>0]<<24|d[o+2>>0]<<8|d[o+3>>0];if(!n){n=rb+604+8|0;break}m=(d[o+4>>0]|0)>>>(8-n|0)|m<<n;n=rb+604+8|0}else{if((r-s|0)<=0){m=0;n=rb+604+8|0;break}n=c[rb+604+8>>2]|0;m=d[o>>0]<<n+24;if((r-s+-8+n|0)>0){p=r-s+-8+n|0;n=n+24|0}else{n=rb+604+8|0;break}while(1){o=o+1|0;n=n+-8|0;m=d[o>>0]<<n|m;if((p|0)<=8){n=rb+604+8|0;break}else p=p+-8|0}}while(0);c[g>>2]=q+s;c[n>>2]=q+s&7;if((q+s|0)>>>0>r>>>0)break;c[w>>2]=(c[rb+604>>2]|0)+((q+s|0)>>>3);if((m>>>(33-t|0)|0)==-1)break;if(Na(rb+604|0,rb+172|0)|0)break d;if((c[e+1300>>2]|0)==5){Ra=c[e+1312>>2]|0;Sa=c[rb+172>>2]|0;m=e+1312|0;n=(Ra|0)==(Sa|0)?Ra:Sa;k=(Ra|0)==(Sa|0)?k:1}else{m=e+1312|0;n=c[rb+172>>2]|0}c[m>>2]=n;break e}while(0);break d}while(0);f:do switch(c[M+16>>2]|0){case 0:{c[rb+604>>2]=c[rb+624>>2];c[rb+604+4>>2]=c[rb+624+4>>2];c[rb+604+8>>2]=c[rb+624+8>>2];c[rb+604+12>>2]=c[rb+624+12>>2];c[rb+604+16>>2]=c[rb+624+16>>2];do if(!(Na(rb+604|0,rb+680|0)|0)){if(Na(rb+604|0,rb+680|0)|0)break;if(Na(rb+604|0,rb+680|0)|0)break;m=c[M+12>>2]|0;t=0;while(1)if(!(m>>>t))break;else t=t+1|0;q=t+-1|0;o=c[w>>2]|0;r=c[v>>2]<<3;s=c[g>>2]|0;do if((r-s|0)>31){n=c[rb+604+8>>2]|0;m=d[o+1>>0]<<16|d[o>>0]<<24|d[o+2>>0]<<8|d[o+3>>0];if(!n){n=rb+604+8|0;break}m=(d[o+4>>0]|0)>>>(8-n|0)|m<<n;n=rb+604+8|0}else{if((r-s|0)<=0){m=0;n=rb+604+8|0;break}n=c[rb+604+8>>2]|0;m=d[o>>0]<<n+24;if((r-s+-8+n|0)>0){p=r-s+-8+n|0;n=n+24|0}else{n=rb+604+8|0;break}while(1){o=o+1|0;n=n+-8|0;m=d[o>>0]<<n|m;if((p|0)<=8){n=rb+604+8|0;break}else p=p+-8|0}}while(0);c[g>>2]=q+s;c[n>>2]=q+s&7;if((q+s|0)>>>0>r>>>0)break;c[w>>2]=(c[rb+604>>2]|0)+((q+s|0)>>>3);if((m>>>(33-t|0)|0)==-1)break;if((y|0)==5?(Na(rb+604|0,rb+680|0)|0)!=0:0)break;m=c[M+20>>2]|0;t=0;while(1)if(!(m>>>t))break;else t=t+1|0;q=t+-1|0;o=c[w>>2]|0;r=c[v>>2]<<3;s=c[g>>2]|0;do if((r-s|0)>31){n=c[rb+604+8>>2]|0;m=d[o+1>>0]<<16|d[o>>0]<<24|d[o+2>>0]<<8|d[o+3>>0];if(!n){n=rb+604+8|0;break}m=(d[o+4>>0]|0)>>>(8-n|0)|m<<n;n=rb+604+8|0}else{if((r-s|0)<=0){m=0;n=rb+604+8|0;break}n=c[rb+604+8>>2]|0;m=d[o>>0]<<n+24;if((r-s+-8+n|0)>0){p=r-s+-8+n|0;n=n+24|0}else{n=rb+604+8|0;break}while(1){o=o+1|0;n=n+-8|0;m=d[o>>0]<<n|m;if((p|0)<=8){n=rb+604+8|0;break}else p=p+-8|0}}while(0);c[g>>2]=q+s;c[n>>2]=q+s&7;if((q+s|0)>>>0>r>>>0)break;c[w>>2]=(c[rb+604>>2]|0)+((q+s|0)>>>3);m=m>>>(33-t|0);if((m|0)==-1)break;if((c[e+1316>>2]|0)!=(m|0)){c[e+1316>>2]=m;k=1}if(!(c[u+8>>2]|0))break f;c[rb+604>>2]=c[rb+624>>2];c[rb+604+4>>2]=c[rb+624+4>>2];c[rb+604+8>>2]=c[rb+624+8>>2];c[rb+604+12>>2]=c[rb+624+12>>2];c[rb+604+16>>2]=c[rb+624+16>>2];m=Na(rb+604|0,rb+644|0)|0;do if(!m){m=Na(rb+604|0,rb+644|0)|0;if(m){l=m;break}m=Na(rb+604|0,rb+644|0)|0;if(m){l=m;break}m=c[M+12>>2]|0;t=0;while(1)if(!(m>>>t))break;else t=t+1|0;q=t+-1|0;o=c[w>>2]|0;r=c[v>>2]<<3;s=c[g>>2]|0;do if((r-s|0)>31){n=c[rb+604+8>>2]|0;m=d[o+1>>0]<<16|d[o>>0]<<24|d[o+2>>0]<<8|d[o+3>>0];if(!n){n=rb+604+8|0;break}m=(d[o+4>>0]|0)>>>(8-n|0)|m<<n;n=rb+604+8|0}else{if((r-s|0)<=0){m=0;n=rb+604+8|0;break}n=c[rb+604+8>>2]|0;m=d[o>>0]<<n+24;if((r-s+-8+n|0)>0){p=r-s+-8+n|0;n=n+24|0}else{n=rb+604+8|0;break}while(1){o=o+1|0;n=n+-8|0;m=d[o>>0]<<n|m;if((p|0)<=8){n=rb+604+8|0;break}else p=p+-8|0}}while(0);c[g>>2]=q+s;c[n>>2]=q+s&7;if((q+s|0)>>>0>r>>>0){l=1;break}c[w>>2]=(c[rb+604>>2]|0)+((q+s|0)>>>3);if((m>>>(33-t|0)|0)==-1){l=1;break}if((y|0)==5?(L=Na(rb+604|0,rb+644|0)|0,(L|0)!=0):0){l=L;break}m=c[M+20>>2]|0;t=0;while(1)if(!(m>>>t))break;else t=t+1|0;s=t+-1|0;o=c[w>>2]|0;q=c[v>>2]<<3;r=c[g>>2]|0;do if((q-r|0)>31){n=c[rb+604+8>>2]|0;m=d[o+1>>0]<<16|d[o>>0]<<24|d[o+2>>0]<<8|d[o+3>>0];if(!n){n=rb+604+8|0;break}m=(d[o+4>>0]|0)>>>(8-n|0)|m<<n;n=rb+604+8|0}else{if((q-r|0)<=0){m=0;n=rb+604+8|0;break}n=c[rb+604+8>>2]|0;m=d[o>>0]<<n+24;if((q-r+-8+n|0)>0){p=q-r+-8+n|0;n=n+24|0}else{n=rb+604+8|0;break}while(1){o=o+1|0;n=n+-8|0;m=d[o>>0]<<n|m;if((p|0)<=8){n=rb+604+8|0;break}else p=p+-8|0}}while(0);c[g>>2]=s+r;c[n>>2]=s+r&7;if((s+r|0)>>>0>q>>>0){l=1;break}c[w>>2]=(c[rb+604>>2]|0)+((s+r|0)>>>3);if((m>>>(33-t|0)|0)==-1){l=1;break}c[rb+680>>2]=0;m=Na(rb+604|0,rb+680|0)|0;n=c[rb+680>>2]|0;do if((n|0)==-1){o=(m|0)==0?1:0;m=(m|0)==0?0:-2147483648}else{if(m){o=1;m=0;break}o=0;m=(n&1|0)!=0?(n+1|0)>>>1:0-((n+1|0)>>>1)|0}while(0);if(o)break d;if((c[e+1320>>2]|0)==(m|0))break f;c[e+1320>>2]=m;k=1;break f}else l=m;while(0);N=k;Xa=208;break c}while(0);break d}case 1:{if(c[M+24>>2]|0)break f;t=c[u+8>>2]|0;c[rb+604>>2]=c[rb+624>>2];c[rb+604+4>>2]=c[rb+624+4>>2];c[rb+604+8>>2]=c[rb+624+8>>2];c[rb+604+12>>2]=c[rb+624+12>>2];c[rb+604+16>>2]=c[rb+624+16>>2];l=Na(rb+604|0,rb+644|0)|0;g:do if(!l){l=Na(rb+604|0,rb+644|0)|0;if(l)break;l=Na(rb+604|0,rb+644|0)|0;if(l)break;l=c[M+12>>2]|0;s=0;while(1)if(!(l>>>s))break;else s=s+1|0;r=s+-1|0;n=c[w>>2]|0;p=c[v>>2]<<3;q=c[g>>2]|0;do if((p-q|0)>31){m=c[rb+604+8>>2]|0;l=d[n+1>>0]<<16|d[n>>0]<<24|d[n+2>>0]<<8|d[n+3>>0];if(!m){m=rb+604+8|0;break}l=(d[n+4>>0]|0)>>>(8-m|0)|l<<m;m=rb+604+8|0}else{if((p-q|0)<=0){l=0;m=rb+604+8|0;break}m=c[rb+604+8>>2]|0;l=d[n>>0]<<m+24;if((p-q+-8+m|0)>0){o=p-q+-8+m|0;m=m+24|0}else{m=rb+604+8|0;break}while(1){n=n+1|0;m=m+-8|0;l=d[n>>0]<<m|l;if((o|0)<=8){m=rb+604+8|0;break}else o=o+-8|0}}while(0);c[g>>2]=r+q;c[m>>2]=r+q&7;if((r+q|0)>>>0>p>>>0){l=1;break}c[w>>2]=(c[rb+604>>2]|0)+((r+q|0)>>>3);if((l>>>(33-s|0)|0)==-1){l=1;break}if((y|0)==5?(H=Na(rb+604|0,rb+644|0)|0,(H|0)!=0):0){l=H;break}c[rb+680>>2]=0;l=Na(rb+604|0,rb+680|0)|0;m=c[rb+680>>2]|0;do if((m|0)==-1)if(!l)Xa=190;else I=-2147483648;else{if(l){Xa=190;break}I=(m&1|0)!=0?(m+1|0)>>>1:0-((m+1|0)>>>1)|0}while(0);if((Xa|0)==190){l=1;break}do if(t){c[rb+680>>2]=0;l=Na(rb+604|0,rb+680|0)|0;m=c[rb+680>>2]|0;do if((m|0)==-1)if(!l)Xa=197;else{J=-2147483648;Xa=196}else{if(l){Xa=197;break}J=(m&1|0)!=0?(m+1|0)>>>1:0-((m+1|0)>>>1)|0;Xa=196}while(0);if((Xa|0)==196){K=J;break}else if((Xa|0)==197){l=1;break g}}else K=0;while(0);if((c[e+1324>>2]|0)!=(I|0)){c[e+1324>>2]=I;k=1}if(!(c[u+8>>2]|0))break f;if((c[e+1328>>2]|0)==(K|0))break f;c[e+1328>>2]=K;k=1;break f}while(0);N=k;Xa=208;break c}default:{}}while(0);c[e+1300>>2]=y;c[e+1300+4>>2]=z;P=k;Xa=206;break b}else Xa=85;while(0);break}e=4;i=rb;return e|0}}else{O=m;Xa=63}}else{O=m;Xa=63}}else{O=m;Xa=63}while(0);if((Xa|0)==63){l=O;N=x;Xa=208}h:do if((Xa|0)==208){if((l|0)<65520)switch(l|0){case 0:{Q=N;break b}default:break h}switch(l|0){case 65520:{ka=4;break}default:break h}i=rb;return ka|0}while(0);e=3;i=rb;return e|0}default:{P=0;Xa=206}}while(0);if((Xa|0)==206)Q=P;do if(!Q)Xa=222;else{if((c[e+1184>>2]|0)!=0?(c[e+16>>2]|0)!=0:0){if(c[e+3380>>2]|0){e=3;i=rb;return e|0}if(!(c[e+1188>>2]|0)){k=c[e+1220>>2]|0;l=k+((c[e+1248>>2]|0)*40|0)|0;c[e+1228>>2]=l;c[e+1336>>2]=c[l>>2];l=c[e+1260>>2]|0;if((l|0)!=0?(c[c[e+1224>>2]>>2]=k,(l|0)!=1):0){k=1;do{c[(c[e+1224>>2]|0)+(k<<2)>>2]=(c[e+1220>>2]|0)+(k*40|0);k=k+1|0}while((k|0)!=(l|0))}fb(e,e+1336|0,0);k=e+1336|0}else{fb(e,e+1336|0,c[e+1372>>2]|0);k=e+1336|0}c[j>>2]=0;c[e+3344>>2]=1;c[e+1180>>2]=0;Ua=e+16|0;Wa=e+1188|0;Ta=e+1212|0;Va=k;break}c[e+1188>>2]=0;c[e+1180>>2]=0;Xa=222}while(0);i:do if((Xa|0)==222)switch(y|0){case 7:{l=rb+72|0;m=l+92|0;do{c[l>>2]=0;l=l+4|0}while((l|0)<(m|0));k=Ma(rb+624|0,8)|0;j:do if((((((((k|0)!=-1?(c[rb+72>>2]=k,Ma(rb+624|0,1)|0,Ma(rb+624|0,1)|0,(Ma(rb+624|0,1)|0)!=-1):0)?(Ma(rb+624|0,5)|0)!=-1:0)?(T=Ma(rb+624|0,8)|0,(T|0)!=-1):0)?(c[rb+72+4>>2]=T,qb=(Na(rb+624|0,rb+72+8|0)|0)!=0,!(qb|(c[rb+72+8>>2]|0)>>>0>31)):0)?(Na(rb+624|0,rb+644|0)|0)==0:0)?(U=c[rb+644>>2]|0,U>>>0<=12):0)?(c[rb+72+12>>2]=1<<U+4,(Na(rb+624|0,rb+644|0)|0)==0):0){k=c[rb+644>>2]|0;if(k>>>0>2)break;c[rb+72+16>>2]=k;k:do switch(k|0){case 0:{if(Na(rb+624|0,rb+644|0)|0)break j;k=c[rb+644>>2]|0;if(k>>>0>12)break j;c[rb+72+20>>2]=1<<k+4;break}case 1:{k=Ma(rb+624|0,1)|0;if((k|0)==-1)break j;c[rb+72+24>>2]=(k|0)==1&1;c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;do if((l|0)==-1)if(!k)Xa=241;else W=-2147483648;else{if(k){Xa=241;break}W=(l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0}while(0);if((Xa|0)==241)break j;c[rb+72+28>>2]=W;c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;do if((l|0)==-1)if(!k)Xa=246;else X=-2147483648;else{if(k){Xa=246;break}X=(l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0}while(0);if((Xa|0)==246)break j;c[rb+72+32>>2]=X;o=rb+72+36|0;if(Na(rb+624|0,o)|0)break j;k=c[o>>2]|0;if(k>>>0>255)break j;if(!k){c[rb+72+40>>2]=0;break k}k=ub(k<<2)|0;c[rb+72+40>>2]=k;if(!k)break j;if(!(c[o>>2]|0))break k;c[rb+680>>2]=0;l=Na(rb+624|0,rb+680|0)|0;m=c[rb+680>>2]|0;do if((m|0)==-1)if(!l)Xa=258;else Y=-2147483648;else{if(l){Xa=258;break}Y=(m&1|0)!=0?(m+1|0)>>>1:0-((m+1|0)>>>1)|0}while(0);if((Xa|0)==258)break j;c[k>>2]=Y;if((c[o>>2]|0)>>>0<=1)break k;n=1;while(1){m=(c[rb+72+40>>2]|0)+(n<<2)|0;c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;if((l|0)==-1)if(!k)break;else k=-2147483648;else{if(k)break;k=(l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0}c[m>>2]=k;n=n+1|0;if(n>>>0>=(c[o>>2]|0)>>>0)break k}break j}default:{}}while(0);t=rb+72+44|0;qb=(Na(rb+624|0,t)|0)!=0;if(qb|(c[t>>2]|0)>>>0>16)break;k=Ma(rb+624|0,1)|0;if((k|0)==-1)break;c[rb+72+48>>2]=(k|0)==1&1;if(Na(rb+624|0,rb+644|0)|0)break;c[rb+72+52>>2]=(c[rb+644>>2]|0)+1;if(Na(rb+624|0,rb+644|0)|0)break;c[rb+72+56>>2]=(c[rb+644>>2]|0)+1;switch(Ma(rb+624|0,1)|0){case 0:case -1:break j;default:{}}if((Ma(rb+624|0,1)|0)==-1)break;k=Ma(rb+624|0,1)|0;if((k|0)==-1)break;c[rb+72+60>>2]=(k|0)==1&1;if((k|0)==1){if(Na(rb+624|0,rb+72+64|0)|0)break;if(Na(rb+624|0,rb+72+68|0)|0)break;if(Na(rb+624|0,rb+72+72|0)|0)break;if(Na(rb+624|0,rb+72+76|0)|0)break;l=c[rb+72+52>>2]|0;if((c[rb+72+64>>2]|0)>((l<<3)+~c[rb+72+68>>2]|0))break;k=c[rb+72+56>>2]|0;if((c[rb+72+72>>2]|0)>((k<<3)+~c[rb+72+76>>2]|0))break}else{k=c[rb+72+56>>2]|0;l=c[rb+72+52>>2]|0}k=Z(l,k)|0;do switch(c[rb+72+4>>2]|0){case 10:{$=99;aa=152064;Xa=296;break}case 11:{$=396;aa=345600;Xa=296;break}case 12:{$=396;aa=912384;Xa=296;break}case 13:{$=396;aa=912384;Xa=296;break}case 20:{$=396;aa=912384;Xa=296;break}case 21:{$=792;aa=1824768;Xa=296;break}case 22:{$=1620;aa=3110400;Xa=296;break}case 30:{$=1620;aa=3110400;Xa=296;break}case 31:{$=3600;aa=6912e3;Xa=296;break}case 32:{$=5120;aa=7864320;Xa=296;break}case 40:{$=8192;aa=12582912;Xa=296;break}case 41:{$=8192;aa=12582912;Xa=296;break}case 42:{$=8704;aa=13369344;Xa=296;break}case 50:{$=22080;aa=42393600;Xa=296;break}case 51:{$=36864;aa=70778880;Xa=296;break}default:Xa=298}while(0);do if((Xa|0)==296){if($>>>0<k>>>0){Xa=298;break}k=(aa>>>0)/((k*384|0)>>>0)|0;k=k>>>0<16?k:16;c[rb+644>>2]=k;l=c[t>>2]|0;if(l>>>0>k>>>0){ba=l;Xa=299}else ca=k}while(0);if((Xa|0)==298){c[rb+644>>2]=2147483647;ba=c[t>>2]|0;Xa=299}if((Xa|0)==299){c[rb+644>>2]=ba;ca=ba}c[rb+72+88>>2]=ca;k=Ma(rb+624|0,1)|0;if((k|0)==-1)break;c[rb+72+80>>2]=(k|0)==1&1;do if((k|0)==1){s=ub(952)|0;c[rb+72+84>>2]=s;if(!s)break j;xb(s|0,0,952)|0;k=Ma(rb+624|0,1)|0;if((k|0)==-1)break j;c[s>>2]=(k|0)==1&1;do if((k|0)==1){k=Ma(rb+624|0,8)|0;if((k|0)==-1)break j;c[s+4>>2]=k;if((k|0)!=255)break;k=Ma(rb+624|0,16)|0;if((k|0)==-1)break j;c[s+8>>2]=k;k=Ma(rb+624|0,16)|0;if((k|0)==-1)break j;c[s+12>>2]=k}while(0);k=Ma(rb+624|0,1)|0;if((k|0)==-1)break j;c[s+16>>2]=(k|0)==1&1;if((k|0)==1){k=Ma(rb+624|0,1)|0;if((k|0)==-1)break j;c[s+20>>2]=(k|0)==1&1}k=Ma(rb+624|0,1)|0;if((k|0)==-1)break j;c[s+24>>2]=(k|0)==1&1;do if((k|0)==1){k=Ma(rb+624|0,3)|0;if((k|0)==-1)break j;c[s+28>>2]=k;k=Ma(rb+624|0,1)|0;if((k|0)==-1)break j;c[s+32>>2]=(k|0)==1&1;k=Ma(rb+624|0,1)|0;if((k|0)==-1)break j;c[s+36>>2]=(k|0)==1&1;if((k|0)!=1){c[s+40>>2]=2;c[s+44>>2]=2;c[s+48>>2]=2;break}k=Ma(rb+624|0,8)|0;if((k|0)==-1)break j;c[s+40>>2]=k;k=Ma(rb+624|0,8)|0;if((k|0)==-1)break j;c[s+44>>2]=k;k=Ma(rb+624|0,8)|0;if((k|0)==-1)break j;c[s+48>>2]=k}else{c[s+28>>2]=5;c[s+40>>2]=2;c[s+44>>2]=2;c[s+48>>2]=2}while(0);k=Ma(rb+624|0,1)|0;if((k|0)==-1)break j;c[s+52>>2]=(k|0)==1&1;if((k|0)==1){if(Na(rb+624|0,s+56|0)|0)break j;if((c[s+56>>2]|0)>>>0>5)break j;if(Na(rb+624|0,s+60|0)|0)break j;if((c[s+60>>2]|0)>>>0>5)break j}k=Ma(rb+624|0,1)|0;if((k|0)==-1)break j;c[s+64>>2]=(k|0)==1&1;if((k|0)==1){m=c[rb+624+4>>2]|0;q=c[A>>2]<<3;r=c[rb+624+16>>2]|0;do if((q-r|0)>31){k=c[B>>2]|0;l=d[m+1>>0]<<16|d[m>>0]<<24|d[m+2>>0]<<8|d[m+3>>0];if(!k)break;l=(d[m+4>>0]|0)>>>(8-k|0)|l<<k}else{if((q-r|0)<=0){l=0;break}k=c[B>>2]|0;l=d[m>>0]<<k+24;if((q-r+-8+k|0)>0){n=q-r+-8+k|0;k=k+24|0}else break;while(1){m=m+1|0;k=k+-8|0;l=d[m>>0]<<k|l;if((n|0)<=8)break;else n=n+-8|0}}while(0);c[rb+624+16>>2]=r+32;o=r+32&7;c[B>>2]=o;if(q>>>0<(r+32|0)>>>0)break j;p=c[rb+624>>2]|0;m=(r+32|0)>>>3;c[rb+624+4>>2]=p+m;if(!l)break j;c[s+68>>2]=l;do if((q-(r+32)|0)>31){k=d[p+(m+1)>>0]<<16|d[p+m>>0]<<24|d[p+(m+2)>>0]<<8|d[p+(m+3)>>0];if(!o)break;k=(d[p+(m+4)>>0]|0)>>>(8-o|0)|k<<o}else{if((q-(r+32)|0)<=0){k=0;break}k=d[p+m>>0]<<(o|24);if((q-(r+32)+-8+o|0)>0){m=p+m|0;n=q-(r+32)+-8+o|0;l=o|24}else break;while(1){m=m+1|0;l=l+-8|0;k=d[m>>0]<<l|k;if((n|0)<=8)break;else n=n+-8|0}}while(0);c[rb+624+16>>2]=r+64;c[B>>2]=r+64&7;if((r+64|0)>>>0>q>>>0)break j;c[rb+624+4>>2]=p+((r+64|0)>>>3);if(!k)break j;c[s+72>>2]=k;k=Ma(rb+624|0,1)|0;if((k|0)==-1)break j;c[s+76>>2]=(k|0)==1&1}k=Ma(rb+624|0,1)|0;if((k|0)==-1)break j;c[s+80>>2]=(k|0)==1&1;if((k|0)==1){if(hb(rb+624|0,s+84|0)|0)break j}else{c[s+84>>2]=1;c[s+96>>2]=288000001;c[s+224>>2]=288000001;c[s+480>>2]=24;c[s+484>>2]=24;c[s+488>>2]=24;c[s+492>>2]=24}k=Ma(rb+624|0,1)|0;if((k|0)==-1)break j;c[s+496>>2]=(k|0)==1&1;if((k|0)==1){if(hb(rb+624|0,s+500|0)|0)break j}else{c[s+500>>2]=1;c[s+512>>2]=240000001;c[s+640>>2]=240000001;c[s+896>>2]=24;c[s+900>>2]=24;c[s+904>>2]=24;c[s+908>>2]=24}if(!((c[s+80>>2]|0)==0?(c[s+496>>2]|0)==0:0)){k=Ma(rb+624|0,1)|0;if((k|0)==-1)break j;c[s+912>>2]=(k|0)==1&1}k=Ma(rb+624|0,1)|0;if((k|0)==-1)break j;c[s+916>>2]=(k|0)==1&1;k=Ma(rb+624|0,1)|0;if((k|0)==-1)break j;c[s+920>>2]=(k|0)==1&1;if((k|0)==1){k=Ma(rb+624|0,1)|0;if((k|0)==-1)break j;c[s+924>>2]=(k|0)==1&1;if(Na(rb+624|0,s+928|0)|0)break j;if((c[s+928>>2]|0)>>>0>16)break j;if(Na(rb+624|0,s+932|0)|0)break j;if((c[s+932>>2]|0)>>>0>16)break j;if(Na(rb+624|0,s+936|0)|0)break j;if((c[s+936>>2]|0)>>>0>16)break j;if(Na(rb+624|0,s+940|0)|0)break j;if((c[s+940>>2]|0)>>>0>16)break j;if(Na(rb+624|0,s+944|0)|0)break j;if(Na(rb+624|0,s+948|0)|0)break j}else{c[s+924>>2]=1;c[s+928>>2]=2;c[s+932>>2]=1;c[s+936>>2]=16;c[s+940>>2]=16;c[s+944>>2]=16;c[s+948>>2]=16}k=c[rb+72+84>>2]|0;if(!(c[k+920>>2]|0))break;l=c[k+948>>2]|0;if((l>>>0<(c[t>>2]|0)>>>0?1:(c[k+944>>2]|0)>>>0>l>>>0)|l>>>0>(c[rb+72+88>>2]|0)>>>0)break j;c[rb+72+88>>2]=(l|0)==0?1:l}while(0);Ma(rb+624|0,8-(c[B>>2]|0)|0)|0;p=c[rb+72+8>>2]|0;q=c[e+20+(p<<2)>>2]|0;do if(!q){qb=ub(92)|0;c[e+20+(p<<2)>>2]=qb;if(!qb)ka=0;else break;i=rb;return ka|0}else{if((p|0)!=(c[e+8>>2]|0)){vb(c[q+40>>2]|0);c[(c[e+20+(p<<2)>>2]|0)+40>>2]=0;vb(c[(c[e+20+(p<<2)>>2]|0)+84>>2]|0);c[(c[e+20+(p<<2)>>2]|0)+84>>2]=0;break}r=c[e+16>>2]|0;l:do if((c[rb+72>>2]|0)==(c[r>>2]|0)){if((c[rb+72+4>>2]|0)!=(c[r+4>>2]|0))break;if((c[rb+72+12>>2]|0)!=(c[r+12>>2]|0))break;k=c[rb+72+16>>2]|0;if((k|0)!=(c[r+16>>2]|0))break;if((c[t>>2]|0)!=(c[r+44>>2]|0))break;if((c[rb+72+48>>2]|0)!=(c[r+48>>2]|0))break;if((c[rb+72+52>>2]|0)!=(c[r+52>>2]|0))break;if((c[rb+72+56>>2]|0)!=(c[r+56>>2]|0))break;o=c[rb+72+60>>2]|0;if((o|0)!=(c[r+60>>2]|0))break;if((c[rb+72+80>>2]|0)!=(c[r+80>>2]|0))break;m:do switch(k|0){case 0:{if((c[rb+72+20>>2]|0)!=(c[r+20>>2]|0))break l;break}case 1:{if((c[rb+72+24>>2]|0)!=(c[r+24>>2]|0))break l;if((c[rb+72+28>>2]|0)!=(c[r+28>>2]|0))break l;if((c[rb+72+32>>2]|0)!=(c[r+32>>2]|0))break l;k=c[rb+72+36>>2]|0;if((k|0)!=(c[r+36>>2]|0))break l;if(!k)break m;l=c[rb+72+40>>2]|0;m=c[r+40>>2]|0;n=0;do{if((c[l+(n<<2)>>2]|0)!=(c[m+(n<<2)>>2]|0))break l;n=n+1|0}while(n>>>0<k>>>0);break}default:{}}while(0);if(o){if((c[rb+72+64>>2]|0)!=(c[r+64>>2]|0))break;if((c[rb+72+68>>2]|0)!=(c[r+68>>2]|0))break;if((c[rb+72+72>>2]|0)!=(c[r+72>>2]|0))break;if((c[rb+72+76>>2]|0)!=(c[r+76>>2]|0))break}vb(c[rb+72+40>>2]|0);c[rb+72+40>>2]=0;vb(c[rb+72+84>>2]|0);c[rb+72+84>>2]=0;e=0;i=rb;return e|0}while(0);vb(c[q+40>>2]|0);c[(c[e+20+(p<<2)>>2]|0)+40>>2]=0;vb(c[(c[e+20+(p<<2)>>2]|0)+84>>2]|0);c[(c[e+20+(p<<2)>>2]|0)+84>>2]=0;c[e+8>>2]=33;c[e+4>>2]=257;c[e+16>>2]=0;c[e+12>>2]=0}while(0);l=c[e+20+(p<<2)>>2]|0;k=rb+72|0;m=l+92|0;do{c[l>>2]=c[k>>2];l=l+4|0;k=k+4|0}while((l|0)<(m|0));e=0;i=rb;return e|0}while(0);vb(c[rb+72+40>>2]|0);c[rb+72+40>>2]=0;vb(c[rb+72+84>>2]|0);c[rb+72+84>>2]=0;e=3;i=rb;return e|0}case 8:{l=rb;m=l+72|0;do{c[l>>2]=0;l=l+4|0}while((l|0)<(m|0));n:do if(((((!((Na(rb+624|0,rb)|0)!=0|(c[rb>>2]|0)>>>0>255)?(qb=(Na(rb+624|0,rb+4|0)|0)!=0,!(qb|(c[rb+4>>2]|0)>>>0>31)):0)?(Ma(rb+624|0,1)|0)==0:0)?(R=Ma(rb+624|0,1)|0,(R|0)!=-1):0)?(c[rb+8>>2]=(R|0)==1&1,(Na(rb+624|0,rb+644|0)|0)==0):0)?(S=(c[rb+644>>2]|0)+1|0,c[rb+12>>2]=S,S>>>0<=8):0){o:do if(S>>>0>1){if(Na(rb+624|0,rb+16|0)|0)break n;k=c[rb+16>>2]|0;if(k>>>0>6)break n;switch(k|0){case 0:{qb=ub(c[rb+12>>2]<<2)|0;c[rb+20>>2]=qb;if(!qb)break n;if(!(c[rb+12>>2]|0))break o;else k=0;do{if(Na(rb+624|0,rb+644|0)|0)break n;c[(c[rb+20>>2]|0)+(k<<2)>>2]=(c[rb+644>>2]|0)+1;k=k+1|0}while(k>>>0<(c[rb+12>>2]|0)>>>0);break}case 2:{c[rb+24>>2]=ub((c[rb+12>>2]<<2)+-4|0)|0;qb=ub((c[rb+12>>2]<<2)+-4|0)|0;c[rb+28>>2]=qb;if((qb|0)==0|(c[rb+24>>2]|0)==0)break n;if((c[rb+12>>2]|0)==1)break o;else k=0;do{if(Na(rb+624|0,rb+644|0)|0)break n;c[(c[rb+24>>2]|0)+(k<<2)>>2]=c[rb+644>>2];if(Na(rb+624|0,rb+644|0)|0)break n;c[(c[rb+28>>2]|0)+(k<<2)>>2]=c[rb+644>>2];k=k+1|0}while(k>>>0<((c[rb+12>>2]|0)+-1|0)>>>0);break}case 5:case 4:case 3:{k=Ma(rb+624|0,1)|0;if((k|0)==-1)break n;c[rb+32>>2]=(k|0)==1&1;if(Na(rb+624|0,rb+644|0)|0)break n;c[rb+36>>2]=(c[rb+644>>2]|0)+1;break o}case 6:{if(Na(rb+624|0,rb+644|0)|0)break n;qb=(c[rb+644>>2]|0)+1|0;c[rb+40>>2]=qb;qb=ub(qb<<2)|0;c[rb+44>>2]=qb;if(!qb)break n;k=c[288+((c[rb+12>>2]|0)+-1<<2)>>2]|0;if(!(c[rb+40>>2]|0))break o;else l=0;do{qb=Ma(rb+624|0,k)|0;c[(c[rb+44>>2]|0)+(l<<2)>>2]=qb;l=l+1|0;if(qb>>>0>=(c[rb+12>>2]|0)>>>0)break n}while(l>>>0<(c[rb+40>>2]|0)>>>0);break}default:break o}}while(0);if(!(Na(rb+624|0,rb+644|0)|0)){k=c[rb+644>>2]|0;if(k>>>0>31)break;c[rb+48>>2]=k+1;qb=(Na(rb+624|0,rb+644|0)|0)!=0;if(qb|(c[rb+644>>2]|0)>>>0>31)break;if(Ma(rb+624|0,1)|0)break;if((Ma(rb+624|0,2)|0)>>>0>2)break;c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;do if((l|0)==-1){if(!k)break;break n}else{if(k)break;k=((l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0)+26|0;if(k>>>0>51)break n;c[rb+52>>2]=k;c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;do if((l|0)==-1){if(!k)break;break n}else{if(k)break;if((((l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0)+26|0)>>>0>51)break n;c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;do if((l|0)==-1){if(!k)break;break n}else{if(k)break;k=(l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0;if((k+12|0)>>>0>24)break n;c[rb+56>>2]=k;k=Ma(rb+624|0,1)|0;if((k|0)==-1)break n;c[rb+60>>2]=(k|0)==1&1;k=Ma(rb+624|0,1)|0;if((k|0)==-1)break n;c[rb+64>>2]=(k|0)==1&1;k=Ma(rb+624|0,1)|0;if((k|0)==-1)break n;c[rb+68>>2]=(k|0)==1&1;Ma(rb+624|0,8-(c[B>>2]|0)|0)|0;l=c[rb>>2]|0;k=c[e+148+(l<<2)>>2]|0;do if(!k){qb=ub(72)|0;c[e+148+(l<<2)>>2]=qb;if(!qb)ka=0;else break;i=rb;return ka|0}else{if((l|0)!=(c[e+4>>2]|0)){vb(c[k+20>>2]|0);c[(c[e+148+(l<<2)>>2]|0)+20>>2]=0;vb(c[(c[e+148+(l<<2)>>2]|0)+24>>2]|0);c[(c[e+148+(l<<2)>>2]|0)+24>>2]=0;vb(c[(c[e+148+(l<<2)>>2]|0)+28>>2]|0);c[(c[e+148+(l<<2)>>2]|0)+28>>2]=0;vb(c[(c[e+148+(l<<2)>>2]|0)+44>>2]|0);c[(c[e+148+(l<<2)>>2]|0)+44>>2]=0;break}if((c[rb+4>>2]|0)!=(c[e+8>>2]|0)){c[e+4>>2]=257;k=c[e+148+(l<<2)>>2]|0}vb(c[k+20>>2]|0);c[(c[e+148+(l<<2)>>2]|0)+20>>2]=0;vb(c[(c[e+148+(l<<2)>>2]|0)+24>>2]|0);c[(c[e+148+(l<<2)>>2]|0)+24>>2]=0;vb(c[(c[e+148+(l<<2)>>2]|0)+28>>2]|0);c[(c[e+148+(l<<2)>>2]|0)+28>>2]=0;vb(c[(c[e+148+(l<<2)>>2]|0)+44>>2]|0);c[(c[e+148+(l<<2)>>2]|0)+44>>2]=0}while(0);l=c[e+148+(l<<2)>>2]|0;k=rb;m=l+72|0;do{c[l>>2]=c[k>>2];l=l+4|0;k=k+4|0}while((l|0)<(m|0));e=0;i=rb;return e|0}while(0);break n}while(0);break n}while(0)}}while(0);vb(c[rb+20>>2]|0);c[rb+20>>2]=0;vb(c[rb+24>>2]|0);c[rb+24>>2]=0;vb(c[rb+28>>2]|0);c[rb+28>>2]=0;vb(c[rb+44>>2]|0);c[rb+44>>2]=0;e=3;i=rb;return e|0}case 1:case 5:{if(c[e+1180>>2]|0){e=0;i=rb;return e|0}c[e+1184>>2]=1;p:do if(!(c[e+1188>>2]|0)){c[e+1204>>2]=0;c[e+1208>>2]=h;c[rb+644>>2]=c[rb+624>>2];c[rb+644+4>>2]=c[rb+624+4>>2];c[rb+644+8>>2]=c[rb+624+8>>2];c[rb+644+12>>2]=c[rb+624+12>>2];c[rb+644+16>>2]=c[rb+624+16>>2];if((Na(rb+644|0,rb+680|0)|0)==0?(Na(rb+644|0,rb+680|0)|0)==0:0){Na(rb+644|0,rb+680|0)|0;t=c[rb+680>>2]|0}else t=0;u=c[e+8>>2]|0;s=e+148+(t<<2)|0;l=c[s>>2]|0;q:do if((l|0)!=0?(_=c[l+4>>2]|0,V=c[e+20+(_<<2)>>2]|0,(V|0)!=0):0){p=c[V+52>>2]|0;q=Z(c[V+56>>2]|0,p)|0;r=c[l+12>>2]|0;r:do if(r>>>0>1){k=c[l+16>>2]|0;switch(k|0){case 0:{k=c[l+20>>2]|0;l=0;do{if((c[k+(l<<2)>>2]|0)>>>0>q>>>0){k=4;break q}l=l+1|0}while(l>>>0<r>>>0);break}case 2:{o=c[l+24>>2]|0;k=c[l+28>>2]|0;n=0;do{l=c[o+(n<<2)>>2]|0;m=c[k+(n<<2)>>2]|0;if(!(l>>>0<=m>>>0&m>>>0<q>>>0)){k=4;break q}n=n+1|0;if(((l>>>0)%(p>>>0)|0)>>>0>((m>>>0)%(p>>>0)|0)>>>0){k=4;break q}}while(n>>>0<(r+-1|0)>>>0);break}default:{if((k+-3|0)>>>0<3)if((c[l+36>>2]|0)>>>0>q>>>0){k=4;break q}else break r;if((k|0)!=6)break r;if((c[l+40>>2]|0)>>>0<q>>>0){k=4;break q}else break r}}}while(0);k=c[e+4>>2]|0;do if((k|0)==256){c[e+4>>2]=t;k=c[s>>2]|0;c[e+12>>2]=k;k=c[k+4>>2]|0;c[e+8>>2]=k;Wa=c[e+20+(k<<2)>>2]|0;c[e+16>>2]=Wa;Va=c[Wa+52>>2]|0;Wa=c[Wa+56>>2]|0;c[e+1176>>2]=Z(Wa,Va)|0;c[e+1340>>2]=Va;c[e+1344>>2]=Wa;c[e+3380>>2]=1}else{if(!(c[e+3380>>2]|0)){if((k|0)==(t|0)){k=u;break}if((_|0)==(u|0)){c[e+4>>2]=t;c[e+12>>2]=c[s>>2];k=u;break}if((y|0)!=5){k=4;break q}c[e+4>>2]=t;k=c[s>>2]|0;c[e+12>>2]=k;k=c[k+4>>2]|0;c[e+8>>2]=k;Wa=c[e+20+(k<<2)>>2]|0;c[e+16>>2]=Wa;Va=c[Wa+52>>2]|0;Wa=c[Wa+56>>2]|0;c[e+1176>>2]=Z(Wa,Va)|0;c[e+1340>>2]=Va;c[e+1344>>2]=Wa;c[e+3380>>2]=1;break}c[e+3380>>2]=0;vb(c[e+1212>>2]|0);c[e+1212>>2]=0;vb(c[e+1172>>2]|0);c[e+1172>>2]=0;c[e+1212>>2]=ub((c[e+1176>>2]|0)*216|0)|0;Wa=ub(c[e+1176>>2]<<2)|0;c[e+1172>>2]=Wa;k=c[e+1212>>2]|0;if((Wa|0)==0|(k|0)==0){k=5;break q}xb(k|0,0,(c[e+1176>>2]|0)*216|0)|0;p=c[e+1212>>2]|0;k=c[e+16>>2]|0;q=c[k+52>>2]|0;r=c[e+1176>>2]|0;if(!r)l=k;else{m=0;n=0;o=0;while(1){k=(m|0)!=0;c[p+(n*216|0)+200>>2]=k?p+((n+-1|0)*216|0)|0:0;l=(o|0)!=0;do if(l){c[p+(n*216|0)+204>>2]=p+((n-q|0)*216|0);if(m>>>0>=(q+-1|0)>>>0){Xa=507;break}c[p+(n*216|0)+208>>2]=p+((1-q+n|0)*216|0)}else{c[p+(n*216|0)+204>>2]=0;Xa=507}while(0);if((Xa|0)==507){Xa=0;c[p+(n*216|0)+208>>2]=0}c[p+(n*216|0)+212>>2]=k&l?p+((n+~q|0)*216|0)|0:0;k=m+1|0;n=n+1|0;if((n|0)==(r|0))break;else{m=(k|0)==(q|0)?0:k;o=((k|0)==(q|0)&1)+o|0}}l=c[e+16>>2]|0}s:do if(!(c[e+1216>>2]|0)){if((c[l+16>>2]|0)==2){p=1;break}do if(c[l+80>>2]|0){k=c[l+84>>2]|0;if(!(c[k+920>>2]|0))break;if(!(c[k+944>>2]|0)){p=1;break s}}while(0);p=0}else p=1;while(0);r=Z(c[l+56>>2]|0,c[l+52>>2]|0)|0;n=c[l+88>>2]|0;o=c[l+44>>2]|0;m=c[l+12>>2]|0;k=c[e+1220>>2]|0;do if(!k)q=e+1248|0;else{if((c[e+1248>>2]|0)==-1){q=e+1248|0;break}else l=0;do{vb(c[k+(l*40|0)+4>>2]|0);k=c[e+1220>>2]|0;c[k+(l*40|0)+4>>2]=0;l=l+1|0}while(l>>>0<((c[e+1248>>2]|0)+1|0)>>>0);q=e+1248|0}while(0);vb(k);c[e+1220>>2]=0;vb(c[e+1224>>2]|0);c[e+1224>>2]=0;vb(c[e+1232>>2]|0);c[e+1232>>2]=0;c[e+1256>>2]=65535;k=o>>>0>1?o:1;c[e+1244>>2]=k;c[q>>2]=(p|0)==0?n:k;c[e+1252>>2]=m;c[e+1276>>2]=p;c[e+1264>>2]=0;c[e+1260>>2]=0;c[e+1268>>2]=0;k=ub(680)|0;c[e+1220>>2]=k;if(!k){k=5;break q}xb(k|0,0,680)|0;if((c[q>>2]|0)!=-1){m=0;do{k=ub(r*384|47)|0;l=c[e+1220>>2]|0;c[l+(m*40|0)+4>>2]=k;if(!k){k=5;break q}c[l+(m*40|0)>>2]=k+(0-k&15);m=m+1|0}while(m>>>0<((c[q>>2]|0)+1|0)>>>0)}c[e+1224>>2]=ub(68)|0;Wa=ub((c[q>>2]<<4)+16|0)|0;c[e+1232>>2]=Wa;k=c[e+1224>>2]|0;if((Wa|0)==0|(k|0)==0){k=5;break q}l=k;m=l+68|0;do{a[l>>0]=0;l=l+1|0}while((l|0)<(m|0));c[e+1240>>2]=0;c[e+1236>>2]=0;k=c[e+8>>2]|0}while(0);if((u|0)==(k|0))break p;w=c[e+16>>2]|0;k=c[e>>2]|0;if(k>>>0<32)v=c[e+20+(k<<2)>>2]|0;else v=0;c[j>>2]=0;c[e+3344>>2]=1;t:do if((y|0)==5){s=c[e+12>>2]|0;c[rb+604>>2]=c[rb+624>>2];c[rb+604+4>>2]=c[rb+624+4>>2];c[rb+604+8>>2]=c[rb+624+8>>2];c[rb+604+12>>2]=c[rb+624+12>>2];c[rb+604+16>>2]=c[rb+624+16>>2];k=Na(rb+604|0,rb+644|0)|0;u:do if(!k){k=Na(rb+604|0,rb+644|0)|0;if(k){l=1;break}k=Na(rb+604|0,rb+644|0)|0;if(k){l=1;break}k=c[w+12>>2]|0;r=0;while(1)if(!(k>>>r))break;else r=r+1|0;o=r+-1|0;t=rb+604+4|0;m=c[t>>2]|0;p=c[rb+604+12>>2]<<3;u=rb+604+16|0;q=c[u>>2]|0;do if((p-q|0)>31){l=c[rb+604+8>>2]|0;k=d[m+1>>0]<<16|d[m>>0]<<24|d[m+2>>0]<<8|d[m+3>>0];if(!l){l=rb+604+8|0;break}k=(d[m+4>>0]|0)>>>(8-l|0)|k<<l;l=rb+604+8|0}else{if((p-q|0)<=0){k=0;l=rb+604+8|0;break}l=c[rb+604+8>>2]|0;k=d[m>>0]<<l+24;if((p-q+-8+l|0)>0){n=p-q+-8+l|0;l=l+24|0}else{l=rb+604+8|0;break}while(1){m=m+1|0;l=l+-8|0;k=d[m>>0]<<l|k;if((n|0)<=8){l=rb+604+8|0;break}else n=n+-8|0}}while(0);c[u>>2]=o+q;c[l>>2]=o+q&7;if((o+q|0)>>>0>p>>>0){k=1;l=1;break}c[t>>2]=(c[rb+604>>2]|0)+((o+q|0)>>>3);if((k>>>(33-r|0)|0)==-1){k=1;l=1;break}k=Na(rb+604|0,rb+644|0)|0;if(k){l=1;break}k=c[w+16>>2]|0;do if(!k){k=c[w+20>>2]|0;r=0;while(1)if(!(k>>>r))break;else r=r+1|0;o=r+-1|0;m=c[t>>2]|0;p=c[rb+604+12>>2]<<3;q=c[u>>2]|0;do if((p-q|0)>31){l=c[rb+604+8>>2]|0;k=d[m+1>>0]<<16|d[m>>0]<<24|d[m+2>>0]<<8|d[m+3>>0];if(!l){l=rb+604+8|0;break}k=(d[m+4>>0]|0)>>>(8-l|0)|k<<l;l=rb+604+8|0}else{if((p-q|0)<=0){k=0;l=rb+604+8|0;break}l=c[rb+604+8>>2]|0;k=d[m>>0]<<l+24;if((p-q+-8+l|0)>0){n=p-q+-8+l|0;l=l+24|0}else{l=rb+604+8|0;break}while(1){m=m+1|0;l=l+-8|0;k=d[m>>0]<<l|k;if((n|0)<=8){l=rb+604+8|0;break}else n=n+-8|0}}while(0);c[u>>2]=o+q;c[l>>2]=o+q&7;if((o+q|0)>>>0>p>>>0){k=1;l=1;break u}c[t>>2]=(c[rb+604>>2]|0)+((o+q|0)>>>3);if((k>>>(33-r|0)|0)==-1){k=1;l=1;break u}if(!(c[s+8>>2]|0))break;c[rb+680>>2]=0;k=Na(rb+604|0,rb+680|0)|0;if((c[rb+680>>2]|0)==-1)if(!k)Xa=567;else Xa=566;else if(!k)Xa=566;else Xa=567;if((Xa|0)==566){ia=c[w+16>>2]|0;Xa=568;break}else if((Xa|0)==567){k=1;l=1;break u}}else{ia=k;Xa=568}while(0);do if((Xa|0)==568){if((ia|0)!=1)break;if(c[w+24>>2]|0)break;c[rb+680>>2]=0;k=Na(rb+604|0,rb+680|0)|0;if((c[rb+680>>2]|0)==-1){if(!k)Xa=573}else if(k)Xa=573;if((Xa|0)==573){k=1;l=1;break u}if(!(c[s+8>>2]|0))break;c[rb+680>>2]=0;k=Na(rb+604|0,rb+680|0)|0;if((c[rb+680>>2]|0)==-1)if(!k)Xa=579;else Xa=578;else if(!k)Xa=578;else Xa=579;if((Xa|0)==578)break;else if((Xa|0)==579){k=1;l=1;break u}}while(0);if((c[s+68>>2]|0)!=0?(ja=Na(rb+604|0,rb+644|0)|0,(ja|0)!=0):0){k=ja;l=1;break}m=c[t>>2]|0;o=c[rb+604+12>>2]<<3;p=c[u>>2]|0;do if((o-p|0)>31){k=c[rb+604+8>>2]|0;l=d[m+1>>0]<<16|d[m>>0]<<24|d[m+2>>0]<<8|d[m+3>>0];if(!k){k=rb+604+8|0;break}l=(d[m+4>>0]|0)>>>(8-k|0)|l<<k;k=rb+604+8|0}else{if((o-p|0)<=0){l=0;k=rb+604+8|0;break}k=c[rb+604+8>>2]|0;l=d[m>>0]<<k+24;if((o-p+-8+k|0)>0){n=o-p+-8+k|0;k=k+24|0}else{k=rb+604+8|0;break}while(1){m=m+1|0;k=k+-8|0;l=d[m>>0]<<k|l;if((n|0)<=8){k=rb+604+8|0;break}else n=n+-8|0}}while(0);c[u>>2]=p+1;c[k>>2]=p+1&7;if((p+1|0)>>>0>o>>>0)k=0;else{c[t>>2]=(c[rb+604>>2]|0)+((p+1|0)>>>3);k=1}l=k?l>>>31:-1;k=(l|0)==-1&1}else l=1;while(0);if(l|k){Xa=596;break}if((v|0)==0|(c[e+1276>>2]|0)!=0){Xa=596;break}if((c[v+52>>2]|0)!=(c[w+52>>2]|0)){Xa=596;break}if((c[v+56>>2]|0)!=(c[w+56>>2]|0)){Xa=596;break}if((c[v+88>>2]|0)!=(c[w+88>>2]|0)){Xa=596;break}n=c[e+1220>>2]|0;if(!n)break;c[e+1280>>2]=1;o=c[e+1248>>2]|0;k=0;l=2147483647;m=0;while(1){if(c[n+(k*40|0)+24>>2]|0){pb=c[n+(k*40|0)+16>>2]|0;qb=(pb|0)<(l|0);l=qb?pb:l;m=qb?n+(k*40|0)|0:m}k=k+1|0;if(k>>>0<=o>>>0)continue;if(!m)break t;qb=c[e+1236>>2]|0;pb=c[e+1232>>2]|0;c[pb+(qb<<4)>>2]=c[m>>2];c[pb+(qb<<4)+12>>2]=c[m+36>>2];c[pb+(qb<<4)+4>>2]=c[m+28>>2];c[pb+(qb<<4)+8>>2]=c[m+32>>2];c[e+1236>>2]=qb+1;c[m+24>>2]=0;if(c[m+20>>2]|0){k=0;l=2147483647;m=0;continue}c[e+1264>>2]=(c[e+1264>>2]|0)+-1;k=0;l=2147483647;m=0}}else Xa=596;while(0);if((Xa|0)==596)c[e+1280>>2]=0;c[e>>2]=c[e+8>>2];e=2;i=rb;return e|0}else k=4;while(0);c[e+4>>2]=256;c[e+12>>2]=0;c[e+8>>2]=32;c[e+16>>2]=0;c[e+3380>>2]=0;e=k;i=rb;return e|0}while(0);if(c[e+3380>>2]|0){e=3;i=rb;return e|0}o=c[e+16>>2]|0;s=c[e+12>>2]|0;xb(e+2356|0,0,988)|0;t=Z(c[o+56>>2]|0,c[o+52>>2]|0)|0;v:do if(((Na(rb+624|0,rb+604|0)|0)==0?(Wa=c[rb+604>>2]|0,c[e+2356>>2]=Wa,Wa>>>0<t>>>0):0)?(Na(rb+624|0,rb+604|0)|0)==0:0){Wa=c[rb+604>>2]|0;c[e+2360>>2]=Wa;switch(Wa|0){case 7:case 2:break;case 5:case 0:{if((y|0)==5)break v;if(!(c[o+44>>2]|0))break v;break}default:break v}if((Na(rb+624|0,rb+604|0)|0)==0?(Wa=c[rb+604>>2]|0,c[e+2364>>2]=Wa,(Wa|0)==(c[s>>2]|0)):0){k=c[o+12>>2]|0;l=0;while(1)if(!(k>>>l))break;else l=l+1|0;k=Ma(rb+624|0,l+-1|0)|0;if((k|0)==-1)break;if((k|0)!=0&(y|0)==5)break;c[e+2368>>2]=k;if((y|0)==5){if(Na(rb+624|0,rb+604|0)|0)break;Wa=c[rb+604>>2]|0;c[e+2372>>2]=Wa;if(Wa>>>0>65535)break}k=c[o+16>>2]|0;if(!k){k=c[o+20>>2]|0;l=0;while(1)if(!(k>>>l))break;else l=l+1|0;k=Ma(rb+624|0,l+-1|0)|0;if((k|0)==-1)break;c[e+2376>>2]=k;do if(c[s+8>>2]|0){c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;do if((l|0)==-1)if(!k)Xa=631;else{da=-2147483648;Xa=632}else{if(k){Xa=631;break}da=(l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0;Xa=632}while(0);if((Xa|0)==631)break v;else if((Xa|0)==632){c[e+2380>>2]=da;break}}while(0);if((y|0)==5){k=c[e+2376>>2]|0;if(k>>>0>(c[o+20>>2]|0)>>>1>>>0)break;Wa=c[e+2380>>2]|0;if((k|0)!=(((Wa|0)>0?0:0-Wa|0)|0))break}k=c[o+16>>2]|0}do if((k|0)==1){if(c[o+24>>2]|0)break;c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;do if((l|0)==-1)if(!k)Xa=643;else ea=-2147483648;else{if(k){Xa=643;break}ea=(l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0}while(0);if((Xa|0)==643)break v;c[e+2384>>2]=ea;do if(c[s+8>>2]|0){c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;do if((l|0)==-1)if(!k)Xa=649;else{fa=-2147483648;Xa=650}else{if(k){Xa=649;break}fa=(l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0;Xa=650}while(0);if((Xa|0)==649)break v;else if((Xa|0)==650){c[e+2388>>2]=fa;break}}while(0);if((y|0)!=5)break;Va=c[e+2384>>2]|0;Wa=(c[o+32>>2]|0)+Va+(c[e+2388>>2]|0)|0;if(((Va|0)<(Wa|0)?Va:Wa)|0)break v}while(0);if(c[s+68>>2]|0){if(Na(rb+624|0,rb+604|0)|0)break;Wa=c[rb+604>>2]|0;c[e+2392>>2]=Wa;if(Wa>>>0>127)break}k=c[e+2360>>2]|0;switch(k|0){case 5:case 0:{k=Ma(rb+624|0,1)|0;if((k|0)==-1)break v;c[e+2396>>2]=k;if(!k){k=c[s+48>>2]|0;if(k>>>0>16)break v;c[e+2400>>2]=k}else{if(Na(rb+624|0,rb+604|0)|0)break v;k=c[rb+604>>2]|0;if(k>>>0>15)break v;c[e+2400>>2]=k+1}k=c[e+2360>>2]|0;break}default:{}}w:do switch(k|0){case 5:case 0:{m=c[e+2400>>2]|0;n=c[o+12>>2]|0;k=Ma(rb+624|0,1)|0;x:do if((k|0)!=-1){c[e+2424>>2]=k;if(k){k=0;while(1){if(Na(rb+624|0,rb+644|0)|0)break x;l=c[rb+644>>2]|0;if(l>>>0>3)break x;c[e+2428+(k*12|0)>>2]=l;if(l>>>0<2){if(Na(rb+624|0,rb+680|0)|0)break x;l=c[rb+680>>2]|0;if(l>>>0>=n>>>0)break x;c[e+2428+(k*12|0)+4>>2]=l+1}else{if((l|0)!=2)break;if(Na(rb+624|0,rb+680|0)|0)break x;c[e+2428+(k*12|0)+8>>2]=c[rb+680>>2]}k=k+1|0;if(k>>>0>m>>>0)break x}if(!k)break}break w}while(0);break v}default:{}}while(0);do if(z){r=c[o+44>>2]|0;k=Ma(rb+624|0,1)|0;y:do if((y|0)==5){if((k|0)==-1){Xa=706;break}c[e+2632>>2]=k;k=Ma(rb+624|0,1)|0;if((k|0)==-1){Xa=706;break}c[e+2636>>2]=k;if((r|0)!=0|(k|0)==0)Xa=707;else Xa=706}else{if((k|0)==-1){Xa=706;break}c[e+2640>>2]=k;if(!k){Xa=707;break}m=0;n=0;o=0;p=0;q=0;while(1){if(m>>>0>((r<<1)+2|0)>>>0){Xa=706;break y}if(Na(rb+624|0,rb+644|0)|0){Xa=706;break y}l=c[rb+644>>2]|0;if(l>>>0>6){Xa=706;break y}c[e+2644+(m*20|0)>>2]=l;if((l&-3|0)==1){if(Na(rb+624|0,rb+680|0)|0){Xa=706;break y}c[e+2644+(m*20|0)+4>>2]=(c[rb+680>>2]|0)+1}switch(l|0){case 2:{if(Na(rb+624|0,rb+680|0)|0){Xa=706;break y}c[e+2644+(m*20|0)+8>>2]=c[rb+680>>2];ga=o;break}case 3:case 6:{if(Na(rb+624|0,rb+680|0)|0){Xa=706;break y}c[e+2644+(m*20|0)+12>>2]=c[rb+680>>2];if((l|0)==4)Xa=700;else ga=o;break}case 4:{Xa=700;break}default:ga=o}if((Xa|0)==700){Xa=0;if(Na(rb+624|0,rb+680|0)|0){Xa=706;break y}k=c[rb+680>>2]|0;if(k>>>0>r>>>0){Xa=706;break y}c[e+2644+(m*20|0)+16>>2]=(k|0)==0?65535:k+-1|0;ga=o+1|0}p=((l|0)==5&1)+p|0;n=((l+-1|0)>>>0<3&1)+n|0;q=((l|0)==6&1)+q|0;if(!l)break;else{m=m+1|0;o=ga}}if((p|ga|q)>>>0>1){Xa=706;break}if((p|0)!=0&(n|0)!=0)Xa=706;else Xa=707}while(0);if((Xa|0)==706)break v;else if((Xa|0)==707)break}while(0);c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;do if((l|0)==-1)if(!k)Xa=712;else ha=-2147483648;else{if(k){Xa=712;break}ha=(l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0}while(0);if((Xa|0)==712)break;c[e+2404>>2]=ha;if(((c[s+52>>2]|0)+ha|0)>>>0>51)break;z:do if(c[s+60>>2]|0){if(Na(rb+624|0,rb+604|0)|0)break v;k=c[rb+604>>2]|0;c[e+2408>>2]=k;if(k>>>0>2)break v;if((k|0)==1)break;c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;do if((l|0)==-1){if(!k)break;break v}else{if(k)break;k=(l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0;if((k+6|0)>>>0>12)break v;c[e+2412>>2]=k<<1;c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;do if((l|0)==-1){if(!k)break;break v}else{if(k)break;k=(l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0;if((k+6|0)>>>0>12)break v;c[e+2416>>2]=k<<1;break z}while(0);break v}while(0);break v}while(0);do if((c[s+12>>2]|0)>>>0>1){if(((c[s+16>>2]|0)+-3|0)>>>0>=3)break;m=c[s+36>>2]|0;m=(((t>>>0)%(m>>>0)|0|0)==0?1:2)+((t>>>0)/(m>>>0)|0)|0;l=0;while(1){k=l+1|0;if(!(-1<<k&m))break;else l=k}k=Ma(rb+624|0,((1<<l)+-1&m|0)==0?l:k)|0;c[rb+604>>2]=k;if((k|0)==-1)break v;c[e+2420>>2]=k;Wa=c[s+36>>2]|0;if(k>>>0>(((t+-1+Wa|0)>>>0)/(Wa>>>0)|0)>>>0)break v}while(0);if(!(c[e+1188>>2]|0)){do if((y|0)!=5){t=c[e+2368>>2]|0;Wa=c[(c[e+16>>2]|0)+48>>2]|0;c[e+1236>>2]=0;c[e+1240>>2]=0;if(!Wa)break;u=c[e+1268>>2]|0;do if((u|0)!=(t|0)){k=c[e+1252>>2]|0;if((((u+1|0)>>>0)%(k>>>0)|0|0)==(t|0)){Xa=778;break}v=c[(c[e+1220>>2]|0)+((c[e+1248>>2]|0)*40|0)>>2]|0;n=k;s=((u+1|0)>>>0)%(k>>>0)|0;A:while(1){k=c[e+1260>>2]|0;if(!k)o=0;else{l=c[e+1220>>2]|0;m=0;do{if(((c[l+(m*40|0)+20>>2]|0)+-1|0)>>>0<2){Xa=c[l+(m*40|0)+12>>2]|0;c[l+(m*40|0)+8>>2]=Xa-(Xa>>>0>s>>>0?n:0)}m=m+1|0}while((m|0)!=(k|0));o=k}do if(o>>>0>=(c[e+1244>>2]|0)>>>0){if(!o){ka=3;Xa=1494;break A}p=c[e+1220>>2]|0;m=0;k=-1;l=0;while(1){if(((c[p+(m*40|0)+20>>2]|0)+-1|0)>>>0<2){Xa=c[p+(m*40|0)+8>>2]|0;Wa=(k|0)==-1|(Xa|0)<(l|0);n=Wa?m:k;l=Wa?Xa:l}else n=k;m=m+1|0;if((m|0)==(o|0))break;else k=n}if((n|0)<=-1){ka=3;Xa=1494;break A}c[p+(n*40|0)+20>>2]=0;k=o+-1|0;c[e+1260>>2]=k;if(c[p+(n*40|0)+24>>2]|0)break;c[e+1264>>2]=(c[e+1264>>2]|0)+-1}while(0);l=c[e+1264>>2]|0;r=c[e+1248>>2]|0;if(l>>>0>=r>>>0){q=(c[e+1276>>2]|0)==0;do do if(q){o=c[e+1220>>2]|0;p=0;m=2147483647;n=0;do{if(c[o+(p*40|0)+24>>2]|0){Wa=c[o+(p*40|0)+16>>2]|0;Xa=(Wa|0)<(m|0);m=Xa?Wa:m;n=Xa?o+(p*40|0)|0:n}p=p+1|0}while(p>>>0<=r>>>0);if(!n)break;Xa=c[e+1236>>2]|0;Wa=c[e+1232>>2]|0;c[Wa+(Xa<<4)>>2]=c[n>>2];c[Wa+(Xa<<4)+12>>2]=c[n+36>>2];c[Wa+(Xa<<4)+4>>2]=c[n+28>>2];c[Wa+(Xa<<4)+8>>2]=c[n+32>>2];c[e+1236>>2]=Xa+1;c[n+24>>2]=0;if(c[n+20>>2]|0)break;l=l+-1|0;c[e+1264>>2]=l}while(0);while(l>>>0>=r>>>0)}n=c[e+1220>>2]|0;c[n+(r*40|0)+20>>2]=1;c[n+(r*40|0)+12>>2]=s;c[n+(r*40|0)+8>>2]=s;c[n+(r*40|0)+16>>2]=0;c[n+(r*40|0)+24>>2]=0;c[e+1264>>2]=l+1;c[e+1260>>2]=k+1;_a(n,r+1|0);n=c[e+1252>>2]|0;s=((s+1|0)>>>0)%(n>>>0)|0;if((s|0)==(t|0)){Xa=770;break}}if((Xa|0)==770){k=c[e+1236>>2]|0;B:do if(k){l=c[e+1232>>2]|0;n=c[e+1248>>2]|0;o=c[e+1220>>2]|0;p=c[o+(n*40|0)>>2]|0;m=0;while(1){if((c[l+(m<<4)>>2]|0)==(p|0))break;m=m+1|0;if(m>>>0>=k>>>0)break B}if(!n)break;else l=0;while(1){k=o+(l*40|0)|0;l=l+1|0;if((c[k>>2]|0)==(v|0))break;if(l>>>0>=n>>>0)break B}c[k>>2]=p;c[o+(n*40|0)>>2]=v}while(0);if(z){Xa=782;break}la=c[e+1268>>2]|0;break}else if((Xa|0)==1494){i=rb;return ka|0}}else Xa=778;while(0);do if((Xa|0)==778){if(!z){la=u;break}if((u|0)==(t|0))ka=3;else{Xa=782;break}i=rb;return ka|0}while(0);if((Xa|0)==782){c[e+1268>>2]=t;break}if((la|0)==(t|0))break;Wa=c[e+1252>>2]|0;c[e+1268>>2]=((t+-1+Wa|0)>>>0)%(Wa>>>0)|0}while(0);Wa=(c[e+1220>>2]|0)+((c[e+1248>>2]|0)*40|0)|0;c[e+1228>>2]=Wa;c[e+1336>>2]=c[Wa>>2]}yb(e+1368|0,e+2356|0,988)|0;c[e+1188>>2]=1;c[e+1360>>2]=y;c[e+1360+4>>2]=z;k=c[e+1432>>2]|0;y=c[e+1172>>2]|0;m=c[e+12>>2]|0;g=c[e+16>>2]|0;x=c[g+52>>2]|0;g=c[g+56>>2]|0;t=Z(g,x)|0;s=c[m+12>>2]|0;C:do if((s|0)==1)xb(y|0,0,t<<2|0)|0;else{l=c[m+16>>2]|0;do if((l+-3|0)>>>0<3){k=Z(c[m+36>>2]|0,k)|0;k=k>>>0<t>>>0?k:t;if((l&-2|0)!=4){p=0;w=k;break}p=(c[m+32>>2]|0)==0?k:t-k|0;w=k}else{p=0;w=0}while(0);switch(l|0){case 0:{p=c[m+20>>2]|0;if(!t)break C;else{k=0;q=0}while(1){while(1)if(k>>>0<s>>>0)break;else k=0;o=p+(k<<2)|0;l=c[o>>2]|0;D:do if(!l)l=0;else{n=0;do{m=n+q|0;if(m>>>0>=t>>>0)break D;c[y+(m<<2)>>2]=k;n=n+1|0;l=c[o>>2]|0}while(n>>>0<l>>>0)}while(0);q=l+q|0;if(q>>>0>=t>>>0)break;else k=k+1|0}break}case 1:{if(!t)break C;else k=0;do{c[y+(k<<2)>>2]=((((Z((k>>>0)/(x>>>0)|0,s)|0)>>>1)+((k>>>0)%(x>>>0)|0)|0)>>>0)%(s>>>0)|0;k=k+1|0}while((k|0)!=(t|0));break}case 2:{r=c[m+24>>2]|0;q=c[m+28>>2]|0;if(t){k=0;do{c[y+(k<<2)>>2]=s+-1;k=k+1|0}while((k|0)!=(t|0));if(!(s+-1|0))break C}o=s+-2|0;while(1){k=c[r+(o<<2)>>2]|0;p=c[q+(o<<2)>>2]|0;E:do if(((k>>>0)/(x>>>0)|0)>>>0<=((p>>>0)/(x>>>0)|0)>>>0){if(((k>>>0)%(x>>>0)|0)>>>0>((p>>>0)%(x>>>0)|0)>>>0){k=(k>>>0)/(x>>>0)|0;while(1){k=k+1|0;if(k>>>0>((p>>>0)/(x>>>0)|0)>>>0)break E}}else n=(k>>>0)/(x>>>0)|0;do{l=Z(n,x)|0;m=(k>>>0)%(x>>>0)|0;do{c[y+(m+l<<2)>>2]=o;m=m+1|0}while(m>>>0<=((p>>>0)%(x>>>0)|0)>>>0);n=n+1|0}while(n>>>0<=((p>>>0)/(x>>>0)|0)>>>0)}while(0);if(!o)break;else o=o+-1|0}break}case 3:{v=c[m+32>>2]|0;if(t){k=0;do{c[y+(k<<2)>>2]=1;k=k+1|0}while((k|0)!=(t|0))}if(!w)break C;s=(g-v|0)>>>1;u=0;l=(x-v|0)>>>1;m=(x-v|0)>>>1;n=(g-v|0)>>>1;o=(x-v|0)>>>1;p=v+-1|0;q=(g-v|0)>>>1;r=v;while(1){k=y+((Z(q,x)|0)+o<<2)|0;t=(c[k>>2]|0)==1;if(t)c[k>>2]=0;do if(!((p|0)==-1&(o|0)==(l|0))){if((p|0)==1&(o|0)==(m|0)){o=m+1|0;o=(o|0)<(x+-1|0)?o:x+-1|0;k=s;m=o;p=0;r=1-(v<<1)|0;break}if((r|0)==-1&(q|0)==(n|0)){q=n+-1|0;q=(q|0)>0?q:0;k=s;n=q;p=1-(v<<1)|0;r=0;break}if((r|0)==1&(q|0)==(s|0)){q=s+1|0;q=(q|0)<(g+-1|0)?q:g+-1|0;k=q;p=(v<<1)+-1|0;r=0;break}else{k=s;o=o+p|0;q=q+r|0;break}}else{o=l+-1|0;o=(o|0)>0?o:0;k=s;l=o;p=0;r=(v<<1)+-1|0}while(0);u=(t&1)+u|0;if(u>>>0>=w>>>0)break;else s=k}break}case 4:{k=c[m+32>>2]|0;if(!t)break C;l=0;do{c[y+(l<<2)>>2]=l>>>0<p>>>0?k:1-k|0;l=l+1|0}while((l|0)!=(t|0));break}case 5:{k=c[m+32>>2]|0;if(!x)break C;if(!g)break C;else{m=0;n=0}while(1){l=0;o=n;while(1){Wa=y+((Z(l,x)|0)+m<<2)|0;c[Wa>>2]=o>>>0<p>>>0?k:1-k|0;l=l+1|0;if((l|0)==(g|0))break;else o=o+1|0}m=m+1|0;if((m|0)==(x|0))break;else n=n+g|0}break}default:{if(!t)break C;k=c[m+44>>2]|0;l=0;do{c[y+(l<<2)>>2]=c[k+(l<<2)>>2];l=l+1|0}while((l|0)!=(t|0))}}}while(0);o=c[e+1260>>2]|0;do if(!o){l=c[e+1380>>2]|0;p=c[e+1412>>2]|0;g=e+1412|0}else{k=0;do{c[(c[e+1224>>2]|0)+(k<<2)>>2]=(c[e+1220>>2]|0)+(k*40|0);k=k+1|0}while((k|0)!=(o|0));l=c[e+1380>>2]|0;p=c[e+1412>>2]|0;if(!o){g=e+1412|0;break}m=c[e+1220>>2]|0;n=0;do{if(((c[m+(n*40|0)+20>>2]|0)+-1|0)>>>0<2){k=c[m+(n*40|0)+12>>2]|0;if(k>>>0>l>>>0)k=k-(c[e+1252>>2]|0)|0;c[m+(n*40|0)+8>>2]=k}n=n+1|0}while((n|0)!=(o|0));g=e+1412|0}while(0);F:do if(c[e+1436>>2]|0){k=c[e+1440>>2]|0;if(k>>>0>=3)break;r=l;s=0;G:while(1){H:do if(k>>>0<2){m=c[e+1440+(s*12|0)+4>>2]|0;do if(!k){k=r-m|0;if((k|0)>=0)break;k=(c[e+1252>>2]|0)+k|0}else{Wa=m+r|0;k=c[e+1252>>2]|0;k=Wa-((Wa|0)<(k|0)?0:k)|0}while(0);if(k>>>0>l>>>0)q=k-(c[e+1252>>2]|0)|0;else q=k;m=c[e+1244>>2]|0;if(!m){ka=3;Xa=1494;break G}n=c[e+1220>>2]|0;r=0;while(1){o=c[n+(r*40|0)+20>>2]|0;if((o+-1|0)>>>0<2?(c[n+(r*40|0)+8>>2]|0)==(q|0):0){q=r;r=k;break H}r=r+1|0;if(r>>>0>=m>>>0){ka=3;Xa=1494;break G}}}else{k=c[e+1440+(s*12|0)+8>>2]|0;m=c[e+1244>>2]|0;if(!m){ka=3;Xa=1494;break G}n=c[e+1220>>2]|0;q=0;while(1){if((c[n+(q*40|0)+20>>2]|0)==3?(c[n+(q*40|0)+8>>2]|0)==(k|0):0){o=3;break H}q=q+1|0;if(q>>>0>=m>>>0){ka=3;Xa=1494;break G}}}while(0);if(!(o>>>0>1&(q|0)>-1)){ka=3;Xa=1494;break}if(s>>>0<p>>>0){k=p;do{Wa=k;k=k+-1|0;Va=c[e+1224>>2]|0;c[Va+(Wa<<2)>>2]=c[Va+(k<<2)>>2]}while(k>>>0>s>>>0);k=c[e+1220>>2]|0}else k=n;c[(c[e+1224>>2]|0)+(s<<2)>>2]=k+(q*40|0);s=s+1|0;if(s>>>0<=p>>>0){o=s;k=s;do{m=c[e+1224>>2]|0;n=c[m+(o<<2)>>2]|0;if((n|0)!=((c[e+1220>>2]|0)+(q*40|0)|0)){c[m+(k<<2)>>2]=n;k=k+1|0}o=o+1|0}while(o>>>0<=p>>>0)}k=c[e+1440+(s*12|0)>>2]|0;if(k>>>0>=3)break F}if((Xa|0)==1494){i=rb;return ka|0}}while(0);u=c[e+3376>>2]|0;t=c[e+1368>>2]|0;c[rb+168>>2]=0;c[e+1192>>2]=(c[e+1192>>2]|0)+1;c[e+1200>>2]=0;c[rb+164>>2]=(c[e+1416>>2]|0)+(c[(c[e+12>>2]|0)+52>>2]|0);v=rb+624+16|0;q=c[e+1212>>2]|0;m=0;w=0;n=0;I:while(1){if((c[e+1404>>2]|0)==0?(c[q+(t*216|0)+196>>2]|0)!=0:0){ta=1;break}l=c[(c[e+12>>2]|0)+56>>2]|0;Ua=c[e+1420>>2]|0;Va=c[e+1424>>2]|0;Wa=c[e+1428>>2]|0;c[q+(t*216|0)+4>>2]=c[e+1192>>2];c[q+(t*216|0)+8>>2]=Ua;c[q+(t*216|0)+12>>2]=Va;c[q+(t*216|0)+16>>2]=Wa;c[q+(t*216|0)+24>>2]=l;l=c[e+1372>>2]|0;do if((l|0)!=2){if((n|0)!=0|(l|0)==7){Xa=889;break}k=Na(rb+624|0,rb+168|0)|0;if(k){ta=k;break I}k=c[rb+168>>2]|0;if(k>>>0>((c[e+1176>>2]|0)-t|0)>>>0){ta=1;break I}if(!k){xa=c[e+1212>>2]|0;ya=c[e+1372>>2]|0;Xa=891;break}else{xb(u+12|0,0,164)|0;c[u>>2]=0;wa=k;Ca=1;Xa=890;break}}else Xa=889;while(0);if((Xa|0)==889)if(!m){xa=q;ya=l;Xa=891}else{wa=m;Ca=n;Xa=890}if((Xa|0)==890){Xa=0;ma=wa+-1|0;c[rb+168>>2]=ma;na=Ca}else if((Xa|0)==891){Xa=0;s=xa+(t*216|0)|0;o=c[g>>2]|0;xb(u|0,0,2088)|0;k=Na(rb+624|0,rb+604|0)|0;l=c[rb+604>>2]|0;switch(ya|0){case 2:case 7:{if((k|0)!=0|(l+6|0)>>>0>31){Ea=1;Xa=1092;break I}else n=l+6|0;break}default:if((k|0)!=0|(l+1|0)>>>0>31){Ea=1;Xa=1092;break I}else n=l+1|0}c[u>>2]=n;do if((n|0)!=31){Wa=n>>>0<6;r=Wa?2:(n|0)!=6&1;if(n>>>0<4|Wa^1){J:do switch(r|0){case 2:{K:do if(o>>>0>1){switch(n|0){case 0:case 1:{k=0;break}case 3:case 2:{k=1;break}default:k=3}if(o>>>0>2){m=0;while(1){if(Na(rb+624|0,rb+644|0)|0){ra=1;break J}l=c[rb+644>>2]|0;if(l>>>0>=o>>>0){ra=1;break J}c[u+144+(m<<2)>>2]=l;if(!k)break K;else{k=k+-1|0;m=m+1|0}}}else l=0;while(1){m=Ma(rb+624|0,1)|0;if((m|0)==-1){Aa=-1;Xa=1048;break}if((m^1)>>>0>=o>>>0){Aa=m^1;Xa=1048;break}c[u+144+(l<<2)>>2]=m^1;if(!k){Xa=1004;break}else{k=k+-1|0;l=l+1|0}}if((Xa|0)==1004){Xa=0;c[rb+644>>2]=m^1;break}else if((Xa|0)==1048){Xa=0;c[rb+644>>2]=Aa;ra=1;break J}}while(0);switch(n|0){case 0:case 1:{m=0;n=0;break}case 3:case 2:{m=1;n=0;break}default:{m=3;n=0}}while(1){c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;if((l|0)==-1)if(!k){Xa=1012;break}else k=-2147483648;else{if(k){Xa=1012;break}k=(l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0}b[u+160+(n<<2)>>1]=k;c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;if((l|0)==-1)if(!k){Xa=1017;break}else k=-2147483648;else{if(k){Xa=1017;break}k=(l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0}b[u+160+(n<<2)+2>>1]=k;if(!m){ra=0;break J}else{m=m+-1|0;n=n+1|0}}if((Xa|0)==1012){Xa=0;ra=1;break J}else if((Xa|0)==1017){Xa=0;ra=1;break J}break}case 0:{k=c[A>>2]|0;l=c[v>>2]|0;o=c[rb+624+4>>2]|0;p=0;q=0;while(1){l=(k<<3)-l|0;do if((l|0)>31){k=c[B>>2]|0;l=d[o+1>>0]<<16|d[o>>0]<<24|d[o+2>>0]<<8|d[o+3>>0];if(!k){pa=l;Xa=1026;break}pa=(d[o+4>>0]|0)>>>(8-k|0)|l<<k;Xa=1026}else{if((l|0)<=0){c[u+12+(q<<2)>>2]=0;ua=0;Xa=1027;break}m=c[B>>2]|0;k=d[o>>0]<<m+24;if((l+-8+m|0)>0){n=l+-8+m|0;l=m+24|0}else{pa=k;Xa=1026;break}while(1){o=o+1|0;l=l+-8|0;k=d[o>>0]<<l|k;if((n|0)<=8){pa=k;Xa=1026;break}else n=n+-8|0}}while(0);if((Xa|0)==1026){Xa=0;Wa=pa>>>31;c[u+12+(q<<2)>>2]=Wa;if(!Wa){ua=pa;Xa=1027}else{za=pa<<1;Da=0}}if((Xa|0)==1027){c[u+76+(q<<2)>>2]=ua>>>28&7;za=ua<<4;Da=1}l=q|1;Xa=za>>>31;c[u+12+(l<<2)>>2]=Xa;if(!Xa){c[u+76+(l<<2)>>2]=za>>>28&7;m=za<<4;k=Da+1|0}else{m=za<<1;k=Da}Xa=m>>>31;c[u+12+(l+1<<2)>>2]=Xa;if(!Xa){c[u+76+(l+1<<2)>>2]=m>>>28&7;l=m<<4;k=k+1|0}else l=m<<1;m=q|3;Xa=l>>>31;c[u+12+(m<<2)>>2]=Xa;if(!Xa){c[u+76+(m<<2)>>2]=l>>>28&7;l=l<<4;k=k+1|0}else l=l<<1;Xa=l>>>31;c[u+12+(m+1<<2)>>2]=Xa;if(!Xa){c[u+76+(m+1<<2)>>2]=l>>>28&7;l=l<<4;k=k+1|0}else l=l<<1;Xa=l>>>31;c[u+12+(m+2<<2)>>2]=Xa;if(!Xa){c[u+76+(m+2<<2)>>2]=l>>>28&7;l=l<<4;k=k+1|0}else l=l<<1;Xa=l>>>31;c[u+12+(m+3<<2)>>2]=Xa;if(!Xa){c[u+76+(m+3<<2)>>2]=l>>>28&7;m=l<<4;k=k+1|0}else m=l<<1;l=q|7;Xa=m>>>31;c[u+12+(l<<2)>>2]=Xa;if(!Xa){c[u+76+(l<<2)>>2]=m>>>28&7;m=m<<4;k=k+1|0}else m=m<<1;l=(k*3|0)+8+(c[v>>2]|0)|0;c[v>>2]=l;c[B>>2]=l&7;k=c[A>>2]|0;if(l>>>0>k<<3>>>0){Xa=1033;break}o=(c[rb+624>>2]|0)+(l>>>3)|0;c[rb+624+4>>2]=o;p=p+1|0;if((p|0)>=2){Xa=1030;break}else q=q+8|0}if((Xa|0)==1030){c[rb+644>>2]=m;Xa=1031;break J}else if((Xa|0)==1033){Xa=0;c[rb+644>>2]=m;ra=1;break J}break}case 1:{Xa=1031;break}default:ra=0}while(0);do if((Xa|0)==1031){Xa=0;Wa=(Na(rb+624|0,rb+644|0)|0)!=0;k=c[rb+644>>2]|0;if(Wa|k>>>0>3){ra=1;break}c[u+140>>2]=k;ra=0}while(0);k=ra}else{Wa=(Na(rb+624|0,rb+644|0)|0)!=0;k=c[rb+644>>2]|0;L:do if(!(Wa|k>>>0>3)){c[u+176>>2]=k;Wa=(Na(rb+624|0,rb+644|0)|0)!=0;k=c[rb+644>>2]|0;if(Wa|k>>>0>3){sa=1;break}c[u+180>>2]=k;Wa=(Na(rb+624|0,rb+644|0)|0)!=0;k=c[rb+644>>2]|0;if(Wa|k>>>0>3){sa=1;break}c[u+184>>2]=k;Wa=(Na(rb+624|0,rb+644|0)|0)!=0;k=c[rb+644>>2]|0;if(Wa|k>>>0>3){sa=1;break}c[u+188>>2]=k;if(o>>>0>1&(n|0)!=5){if(o>>>0>2){if(Na(rb+624|0,rb+644|0)|0){sa=1;break}k=c[rb+644>>2]|0}else{k=Ma(rb+624|0,1)|0;c[rb+644>>2]=k;if((k|0)==-1){sa=1;break}c[rb+644>>2]=k^1;k=k^1}if(k>>>0>=o>>>0){sa=1;break}c[u+192>>2]=k;if(o>>>0>2){if(Na(rb+624|0,rb+644|0)|0){sa=1;break}k=c[rb+644>>2]|0}else{k=Ma(rb+624|0,1)|0;c[rb+644>>2]=k;if((k|0)==-1){sa=1;break}c[rb+644>>2]=k^1;k=k^1}if(k>>>0>=o>>>0){sa=1;break}c[u+196>>2]=k;if(o>>>0>2){if(Na(rb+624|0,rb+644|0)|0){sa=1;break}k=c[rb+644>>2]|0}else{k=Ma(rb+624|0,1)|0;c[rb+644>>2]=k;if((k|0)==-1){sa=1;break}c[rb+644>>2]=k^1;k=k^1}if(k>>>0>=o>>>0){sa=1;break}c[u+200>>2]=k;if(o>>>0>2){if(Na(rb+624|0,rb+644|0)|0){sa=1;break}k=c[rb+644>>2]|0}else{k=Ma(rb+624|0,1)|0;c[rb+644>>2]=k;if((k|0)==-1){sa=1;break}c[rb+644>>2]=k^1;k=k^1}if(k>>>0>=o>>>0){sa=1;break}c[u+204>>2]=k}switch(c[u+176>>2]|0){case 0:{k=0;break}case 2:case 1:{k=1;break}default:k=3}c[rb+644>>2]=k;m=0;while(1){c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;if((l|0)==-1)if(!k){Xa=921;break}else k=-2147483648;else{if(k){Xa=921;break}k=(l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0}b[u+208+(m<<2)>>1]=k;c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;if((l|0)==-1)if(!k){Xa=926;break}else k=-2147483648;else{if(k){Xa=926;break}k=(l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0}b[u+208+(m<<2)+2>>1]=k;Xa=c[rb+644>>2]|0;c[rb+644>>2]=Xa+-1;if(!Xa){Xa=928;break}else m=m+1|0}if((Xa|0)==921){Xa=0;sa=1;break}else if((Xa|0)==926){Xa=0;sa=1;break}else if((Xa|0)==928){switch(c[u+180>>2]|0){case 0:{k=0;break}case 2:case 1:{k=1;break}default:k=3}c[rb+644>>2]=k;m=0;while(1){c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;if((l|0)==-1)if(!k){Xa=936;break}else k=-2147483648;else{if(k){Xa=936;break}k=(l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0}b[u+224+(m<<2)>>1]=k;c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;if((l|0)==-1)if(!k){Xa=941;break}else k=-2147483648;else{if(k){Xa=941;break}k=(l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0}b[u+224+(m<<2)+2>>1]=k;Xa=c[rb+644>>2]|0;c[rb+644>>2]=Xa+-1;if(!Xa){Xa=943;break}else m=m+1|0}if((Xa|0)==936){Xa=0;sa=1;break}else if((Xa|0)==941){Xa=0;sa=1;break}else if((Xa|0)==943){switch(c[u+184>>2]|0){case 0:{k=0;break}case 2:case 1:{k=1;break}default:k=3}c[rb+644>>2]=k;m=0;while(1){c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;if((l|0)==-1)if(!k){Xa=951;break}else k=-2147483648;else{if(k){Xa=951;break}k=(l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0}b[u+240+(m<<2)>>1]=k;c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;if((l|0)==-1)if(!k){Xa=956;break}else k=-2147483648;else{if(k){Xa=956;break}k=(l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0}b[u+240+(m<<2)+2>>1]=k;Xa=c[rb+644>>2]|0;c[rb+644>>2]=Xa+-1;if(!Xa){Xa=958;break}else m=m+1|0}if((Xa|0)==951){Xa=0;sa=1;break}else if((Xa|0)==956){Xa=0;sa=1;break}else if((Xa|0)==958){Xa=0;switch(c[u+188>>2]|0){case 0:{k=0;break}case 2:case 1:{k=1;break}default:k=3}c[rb+644>>2]=k;m=0;while(1){c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;if((l|0)==-1)if(!k){Xa=966;break}else k=-2147483648;else{if(k){Xa=966;break}k=(l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0}b[u+256+(m<<2)>>1]=k;c[rb+680>>2]=0;k=Na(rb+624|0,rb+680|0)|0;l=c[rb+680>>2]|0;if((l|0)==-1)if(!k){Xa=971;break}else k=-2147483648;else{if(k){Xa=971;break}k=(l&1|0)!=0?(l+1|0)>>>1:0-((l+1|0)>>>1)|0}b[u+256+(m<<2)+2>>1]=k;Wa=c[rb+644>>2]|0;c[rb+644>>2]=Wa+-1;if(!Wa){sa=0;break L}else m=m+1|0}if((Xa|0)==966){Xa=0;sa=1;break}else if((Xa|0)==971){Xa=0;sa=1;break}}}}}else sa=1;while(0);k=sa}if(k){Ea=1;Xa=1092;break I}if((r|0)!=1){if(Na(rb+624|0,rb+680|0)|0){Xa=1054;break I}k=c[rb+680>>2]|0;if(k>>>0>47){Xa=1054;break I}Wa=a[((r|0)==0?5624:5576)+k>>0]|0;c[rb+604>>2]=Wa&255;c[u+4>>2]=Wa&255;if(!(Wa<<24>>24))break}else{Wa=c[u>>2]|0;c[u+4>>2]=((Wa+-7|0)>>>0>11?((Wa+-7|0)>>>2)+268435453|0:(Wa+-7|0)>>>2)<<4|(Wa>>>0>18?15:0)}c[rb+680>>2]=0;Wa=Na(rb+624|0,rb+680|0)|0;k=c[rb+680>>2]|0;if((Wa|0)!=0|(k|0)==-1){Xa=1058;break I}k=(k&1|0)!=0?(k+1|0)>>>1:0-((k+1|0)>>>1)|0;if((k+26|0)>>>0>51){Ea=1;Xa=1092;break I}c[u+8>>2]=k;l=c[u+4>>2]|0;M:do if((c[u>>2]|0)>>>0>6){k=c[xa+(t*216|0)+200>>2]|0;do if(!k){m=0;n=0}else{if((c[xa+(t*216|0)+4>>2]|0)!=(c[k+4>>2]|0)){m=0;n=0;break}m=b[k+38>>1]|0;n=1}while(0);k=c[xa+(t*216|0)+204>>2]|0;do if(!k)k=m;else{if((c[xa+(t*216|0)+4>>2]|0)!=(c[k+4>>2]|0)){k=m;break}k=b[k+48>>1]|0;if(!n)break;k=m+1+k>>1}while(0);k=Oa(rb+624|0,u+1864|0,k,16)|0;if(k&15){qa=k;break}b[u+320>>1]=k>>>4&255;o=3;m=0;while(1){n=l>>>1;if(l&1){k=Oa(rb+624|0,u+328+(m<<6)+4|0,La(s,m,u+272|0)|0,15)|0;c[u+1992+(m<<2)>>2]=k>>>15;if(k&15){qa=k;break M}b[u+272+(m<<1)>>1]=k>>>4&255;k=m|1;l=Oa(rb+624|0,u+328+(k<<6)+4|0,La(s,k,u+272|0)|0,15)|0;c[u+1992+(k<<2)>>2]=l>>>15;if(l&15){qa=l;break M}b[u+272+(k<<1)>>1]=l>>>4&255;k=m|2;l=Oa(rb+624|0,u+328+(k<<6)+4|0,La(s,k,u+272|0)|0,15)|0;c[u+1992+(k<<2)>>2]=l>>>15;if(l&15){qa=l;break M}b[u+272+(k<<1)>>1]=l>>>4&255;k=m|3;l=Oa(rb+624|0,u+328+(k<<6)+4|0,La(s,k,u+272|0)|0,15)|0;c[u+1992+(k<<2)>>2]=l>>>15;if(l&15){qa=l;break M}b[u+272+(k<<1)>>1]=l>>>4&255}k=m+4|0;if(!o){va=n;Ba=k;Xa=1080;break}else{l=n;o=o+-1|0;m=k}}}else{o=3;m=0;while(1){n=l>>>1;if(l&1){k=Oa(rb+624|0,u+328+(m<<6)|0,La(s,m,u+272|0)|0,16)|0;c[u+1992+(m<<2)>>2]=k>>>16;if(k&15){qa=k;break M}b[u+272+(m<<1)>>1]=k>>>4&255;k=m|1;l=Oa(rb+624|0,u+328+(k<<6)|0,La(s,k,u+272|0)|0,16)|0;c[u+1992+(k<<2)>>2]=l>>>16;if(l&15){qa=l;break M}b[u+272+(k<<1)>>1]=l>>>4&255;k=m|2;l=Oa(rb+624|0,u+328+(k<<6)|0,La(s,k,u+272|0)|0,16)|0;c[u+1992+(k<<2)>>2]=l>>>16;if(l&15){qa=l;break M}b[u+272+(k<<1)>>1]=l>>>4&255;k=m|3;l=Oa(rb+624|0,u+328+(k<<6)|0,La(s,k,u+272|0)|0,16)|0;c[u+1992+(k<<2)>>2]=l>>>16;if(l&15){qa=l;break M}b[u+272+(k<<1)>>1]=l>>>4&255}k=m+4|0;if(!o){va=n;Ba=k;Xa=1080;break}else{l=n;o=o+-1|0;m=k}}}while(0);N:do if((Xa|0)==1080){Xa=0;if(va&3){k=Oa(rb+624|0,u+1928|0,-1,4)|0;if(k&15){qa=k;break}b[u+322>>1]=k>>>4&255;k=Oa(rb+624|0,u+1944|0,-1,4)|0;if(k&15){qa=k;break}b[u+324>>1]=k>>>4&255}if(!(va&2)){qa=0;break}else{l=7;m=Ba}while(1){k=Oa(rb+624|0,u+328+(m<<6)+4|0,La(s,m,u+272|0)|0,15)|0;if(k&15){qa=k;break N}b[u+272+(m<<1)>>1]=k>>>4&255;c[u+1992+(m<<2)>>2]=k>>>15;if(!l){qa=0;break}else{l=l+-1|0;m=m+1|0}}}while(0);c[v>>2]=((c[rb+624+4>>2]|0)-(c[rb+624>>2]|0)<<3)+(c[B>>2]|0);if(qa){Ea=qa;Xa=1092;break I}}else{while(1){if(!(c[B>>2]|0)){l=0;m=u+328|0;break}if(Ma(rb+624|0,1)|0){Ea=1;Xa=1092;break I}}while(1){k=Ma(rb+624|0,8)|0;c[rb+604>>2]=k;if((k|0)==-1){Ea=1;Xa=1092;break I}c[m>>2]=k;l=l+1|0;if(l>>>0>=384)break;else m=m+4|0}}while(0);ma=0;na=0}k=Ka((c[e+1212>>2]|0)+(t*216|0)|0,u,e+1336|0,e+1220|0,rb+164|0,t,c[(c[e+12>>2]|0)+64>>2]|0,rb+172+(0-(rb+172)&15)|0)|0;if(k){ta=k;break}q=c[e+1212>>2]|0;w=((c[q+(t*216|0)+196>>2]|0)==1&1)+w|0;o=c[A>>2]<<3;p=c[v>>2]|0;do if((o|0)==(p|0))k=0;else{if((o-p|0)>>>0>8){k=1;break}l=c[rb+624+4>>2]|0;do if((o-p|0)>0){m=c[B>>2]|0;k=d[l>>0]<<m+24;if((o-p+-8+m|0)>0){n=o-p+-8+m|0;m=m+24|0}else break;while(1){l=l+1|0;m=m+-8|0;k=d[l>>0]<<m|k;if((n|0)<=8)break;else n=n+-8|0}}else k=0;while(0);k=(k>>>(32-(o-p)|0)|0)!=(1<<o-p+-1|0)&1}while(0);l=(ma|k|0)!=0;switch(c[e+1372>>2]|0){case 7:case 2:{c[e+1200>>2]=t;break}default:{}}m=c[e+1172>>2]|0;oa=c[e+1176>>2]|0;n=c[m+(t<<2)>>2]|0;k=t;do{k=k+1|0;if(k>>>0>=oa>>>0)break}while((c[m+(k<<2)>>2]|0)!=(n|0));t=(k|0)==(oa|0)?0:k;if(!((t|0)!=0|l^1)){ta=1;break}if(!l){Xa=1108;break}else{m=ma;n=na}}do if((Xa|0)==1054){Ea=1;Xa=1092}else if((Xa|0)==1058){Ea=1;Xa=1092}else if((Xa|0)==1108){k=(c[e+1196>>2]|0)+w|0;if(k>>>0>oa>>>0){ta=1;break}c[e+1196>>2]=k;ta=0}while(0);if((Xa|0)==1092)ta=Ea;if(!ta){do if(!(c[e+1404>>2]|0)){if((c[e+1196>>2]|0)==(c[e+1176>>2]|0))break;else ka=0;i=rb;return ka|0}else{k=c[e+1176>>2]|0;if(!k)break;l=c[e+1212>>2]|0;m=0;n=0;do{n=((c[l+(m*216|0)+196>>2]|0)!=0&1)+n|0;m=m+1|0}while((m|0)!=(k|0));if((n|0)==(k|0))break;else ka=0;i=rb;return ka|0}while(0);c[e+1180>>2]=1;Ua=e+16|0;Wa=e+1188|0;Ta=e+1212|0;Va=e+1336|0;break i}m=c[e+1368>>2]|0;p=c[e+1192>>2]|0;k=c[e+1200>>2]|0;O:do if(!k)k=m;else{l=0;do{do{k=k+-1|0;if(k>>>0<=m>>>0)break O}while((c[(c[e+1212>>2]|0)+(k*216|0)+4>>2]|0)!=(p|0));l=l+1|0;qb=c[(c[e+16>>2]|0)+52>>2]|0}while(l>>>0<(qb>>>0>10?qb:10)>>>0)}while(0);o=c[e+1212>>2]|0;while(1){if((c[o+(k*216|0)+4>>2]|0)!=(p|0)){ka=3;Xa=1494;break}l=o+(k*216|0)+196|0;m=c[l>>2]|0;if(!m){ka=3;Xa=1494;break}c[l>>2]=m+-1;l=c[e+1172>>2]|0;m=c[e+1176>>2]|0;n=c[l+(k<<2)>>2]|0;do{k=k+1|0;if(k>>>0>=m>>>0)break}while((c[l+(k<<2)>>2]|0)!=(n|0));k=(k|0)==(m|0)?0:k;if(!k){ka=3;Xa=1494;break}}if((Xa|0)==1494){i=rb;return ka|0}}}while(0);e=3;i=rb;return e|0}default:{e=0;i=rb;return e|0}}while(0);ka=c[Va+4>>2]|0;la=Va+8|0;k=c[la>>2]|0;ma=Z(k,ka)|0;if(k){na=rb+680+120|0;oa=rb+680+112|0;pa=rb+680+104|0;qa=rb+680+96|0;ra=rb+680+88|0;sa=rb+680+80|0;ta=rb+680+72|0;ua=rb+680+64|0;va=rb+680+56|0;wa=rb+680+48|0;xa=rb+680+40|0;ya=rb+680+32|0;za=rb+680+124|0;Aa=rb+680+116|0;Ba=rb+680+108|0;Ca=rb+680+92|0;Da=rb+680+84|0;Ea=rb+680+76|0;Fa=rb+680+60|0;Ga=rb+680+52|0;Ha=rb+680+44|0;Ia=rb+680+28|0;Ja=rb+680+20|0;Pa=rb+680+12|0;Qa=Z(ka,-48)|0;Ra=rb+644+24|0;Sa=rb+644+12|0;ha=0;ia=0;ja=c[Ta>>2]|0;while(1){m=c[ja+8>>2]|0;P:do if((m|0)!=1){ga=ja+200|0;j=c[ga>>2]|0;do if(!j)l=1;else{if((m|0)==2?(c[ja+4>>2]|0)!=(c[j+4>>2]|0):0){l=1;break}l=5}while(0);fa=ja+204|0;ca=c[fa>>2]|0;do if(ca){if((m|0)==2?(c[ja+4>>2]|0)!=(c[ca+4>>2]|0):0)break;l=l|2}while(0);ea=(l&2|0)==0;Q:do if(ea){c[rb+680+24>>2]=0;c[rb+680+16>>2]=0;c[rb+680+8>>2]=0;c[rb+680>>2]=0;q=0}else{do if((c[ja>>2]|0)>>>0<=5){if((c[ca>>2]|0)>>>0>5)break;do if(!(b[ja+28>>1]|0)){if(b[ca+48>>1]|0){m=2;break}if((c[ja+116>>2]|0)!=(c[ca+124>>2]|0)){m=1;break}Xa=(b[ja+132>>1]|0)-(b[ca+172>>1]|0)|0;if((((Xa|0)<0?0-Xa|0:Xa)|0)>3){m=1;break}m=(b[ja+134>>1]|0)-(b[ca+174>>1]|0)|0;m=(((m|0)<0?0-m|0:m)|0)>3&1}else m=2;while(0);c[rb+680>>2]=m;do if(!(b[ja+30>>1]|0)){if(b[ca+50>>1]|0){n=2;break}if((c[ja+116>>2]|0)!=(c[ca+124>>2]|0)){n=1;break}Xa=(b[ja+136>>1]|0)-(b[ca+176>>1]|0)|0;if((((Xa|0)<0?0-Xa|0:Xa)|0)>3){n=1;break}n=(b[ja+138>>1]|0)-(b[ca+178>>1]|0)|0;n=(((n|0)<0?0-n|0:n)|0)>3&1}else n=2;while(0);c[rb+680+8>>2]=n;do if(!(b[ja+36>>1]|0)){if(b[ca+56>>1]|0){o=2;break}if((c[ja+120>>2]|0)!=(c[ca+128>>2]|0)){o=1;break}Xa=(b[ja+148>>1]|0)-(b[ca+188>>1]|0)|0;if((((Xa|0)<0?0-Xa|0:Xa)|0)>3){o=1;break}o=(b[ja+150>>1]|0)-(b[ca+190>>1]|0)|0;o=(((o|0)<0?0-o|0:o)|0)>3&1}else o=2;while(0);c[rb+680+16>>2]=o;do if(!(b[ja+38>>1]|0)){if(b[ca+58>>1]|0){p=2;break}if((c[ja+120>>2]|0)!=(c[ca+128>>2]|0)){p=1;break}Xa=(b[ja+152>>1]|0)-(b[ca+192>>1]|0)|0;if((((Xa|0)<0?0-Xa|0:Xa)|0)>3){p=1;break}p=(b[ja+154>>1]|0)-(b[ca+194>>1]|0)|0;p=(((p|0)<0?0-p|0:p)|0)>3&1}else p=2;while(0);c[rb+680+24>>2]=p;q=(n|m|o|p|0)!=0&1;break Q}while(0);c[rb+680+24>>2]=4;c[rb+680+16>>2]=4;c[rb+680+8>>2]=4;c[rb+680>>2]=4;q=1}while(0);da=(l&4|0)==0;R:do if(da){c[rb+680+100>>2]=0;c[rb+680+68>>2]=0;c[rb+680+36>>2]=0;c[rb+680+4>>2]=0;$a=c[ja>>2]|0;ib=q;Xa=1194}else{p=c[ja>>2]|0;do if(p>>>0<=5){if((c[j>>2]|0)>>>0>5)break;do if(!(b[ja+28>>1]|0)){if(b[j+38>>1]|0){l=2;break}if((c[ja+116>>2]|0)!=(c[j+120>>2]|0)){l=1;break}gb=(b[ja+132>>1]|0)-(b[j+152>>1]|0)|0;if((((gb|0)<0?0-gb|0:gb)|0)>3){l=1;break}l=(b[ja+134>>1]|0)-(b[j+154>>1]|0)|0;l=(((l|0)<0?0-l|0:l)|0)>3&1}else l=2;while(0);c[rb+680+4>>2]=l;do if(!(b[ja+32>>1]|0)){if(b[j+42>>1]|0){m=2;break}if((c[ja+116>>2]|0)!=(c[j+120>>2]|0)){m=1;break}gb=(b[ja+140>>1]|0)-(b[j+160>>1]|0)|0;if((((gb|0)<0?0-gb|0:gb)|0)>3){m=1;break}m=(b[ja+142>>1]|0)-(b[j+162>>1]|0)|0;m=(((m|0)<0?0-m|0:m)|0)>3&1}else m=2;while(0);c[rb+680+36>>2]=m;do if(!(b[ja+44>>1]|0)){if(b[j+54>>1]|0){n=2;break}if((c[ja+124>>2]|0)!=(c[j+128>>2]|0)){n=1;break}gb=(b[ja+164>>1]|0)-(b[j+184>>1]|0)|0;if((((gb|0)<0?0-gb|0:gb)|0)>3){n=1;break}n=(b[ja+166>>1]|0)-(b[j+186>>1]|0)|0;n=(((n|0)<0?0-n|0:n)|0)>3&1}else n=2;while(0);c[rb+680+68>>2]=n;do if(!(b[ja+48>>1]|0)){if(b[j+58>>1]|0){o=2;break}if((c[ja+124>>2]|0)!=(c[j+128>>2]|0)){o=1;break}gb=(b[ja+172>>1]|0)-(b[j+192>>1]|0)|0;if((((gb|0)<0?0-gb|0:gb)|0)>3){o=1;break}o=(b[ja+174>>1]|0)-(b[j+194>>1]|0)|0;o=(((o|0)<0?0-o|0:o)|0)>3&1}else o=2;while(0);c[rb+680+100>>2]=o;if(q){gb=p;Ya=q;Xa=1196;break R}gb=p;Ya=(m|l|n|o|0)!=0&1;Xa=1196;break R}while(0);c[rb+680+100>>2]=4;c[rb+680+68>>2]=4;c[rb+680+36>>2]=4;c[rb+680+4>>2]=4;$a=p;ib=1;Xa=1194}while(0);if((Xa|0)==1194){Xa=0;if($a>>>0>5){c[na>>2]=3;c[oa>>2]=3;c[pa>>2]=3;c[qa>>2]=3;c[ra>>2]=3;c[sa>>2]=3;c[ta>>2]=3;c[ua>>2]=3;c[va>>2]=3;c[wa>>2]=3;c[xa>>2]=3;c[ya>>2]=3;c[za>>2]=3;c[Aa>>2]=3;c[Ba>>2]=3;c[Ca>>2]=3;c[Da>>2]=3;c[Ea>>2]=3;c[Fa>>2]=3;c[Ga>>2]=3;c[Ha>>2]=3;c[Ia>>2]=3;c[Ja>>2]=3;c[Pa>>2]=3}else{gb=$a;Ya=ib;Xa=1196}}do if((Xa|0)==1196){Xa=0;S:do if(gb>>>0<2){l=ja+28|0;n=b[ja+32>>1]|0;if(!(n<<16>>16))m=(b[l>>1]|0)!=0?2:0;else m=2;c[ya>>2]=m;o=b[ja+34>>1]|0;if(!(o<<16>>16))J=(b[ja+30>>1]|0)!=0?2:0;else J=2;c[xa>>2]=J;p=b[ja+40>>1]|0;if(!(p<<16>>16))I=(b[ja+36>>1]|0)!=0?2:0;else I=2;c[wa>>2]=I;q=b[ja+42>>1]|0;if(!(q<<16>>16))H=(b[ja+38>>1]|0)!=0?2:0;else H=2;c[va>>2]=H;r=b[ja+44>>1]|0;G=(r|n)<<16>>16!=0?2:0;c[ua>>2]=G;s=b[ja+46>>1]|0;F=(s|o)<<16>>16!=0?2:0;c[ta>>2]=F;t=b[ja+52>>1]|0;f=(t|p)<<16>>16!=0?2:0;c[sa>>2]=f;u=b[ja+54>>1]|0;E=(u|q)<<16>>16!=0?2:0;c[ra>>2]=E;v=b[ja+48>>1]|0;D=(v|r)<<16>>16!=0?2:0;c[qa>>2]=D;w=b[ja+50>>1]|0;C=(w|s)<<16>>16!=0?2:0;c[pa>>2]=C;g=b[ja+56>>1]|0;B=t<<16>>16!=0|g<<16>>16==0^1?2:0;c[oa>>2]=B;x=(b[ja+58>>1]|0)==0;A=u<<16>>16!=0|x^1?2:0;c[na>>2]=A;y=b[ja+30>>1]|0;if(!(y<<16>>16))z=(b[l>>1]|0)!=0?2:0;else z=2;c[Pa>>2]=z;aa=b[ja+36>>1]|0;ba=(aa|y)<<16>>16!=0?2:0;c[Ja>>2]=ba;aa=(b[ja+38>>1]|aa)<<16>>16!=0?2:0;c[Ia>>2]=aa;y=n<<16>>16!=0|o<<16>>16==0^1?2:0;c[Ha>>2]=y;o=o<<16>>16!=0|p<<16>>16==0^1?2:0;c[Ga>>2]=o;$=p<<16>>16!=0|q<<16>>16==0^1?2:0;c[Fa>>2]=$;r=(s|r)<<16>>16!=0?2:0;c[Ea>>2]=r;p=(t|s)<<16>>16!=0?2:0;c[Da>>2]=p;s=(u|t)<<16>>16!=0?2:0;c[Ca>>2]=s;q=(w|v)<<16>>16!=0?2:0;c[Ba>>2]=q;n=g<<16>>16==0?(w<<16>>16!=0?2:0):2;c[Aa>>2]=n;l=x?(g<<16>>16!=0?2:0):2;c[za>>2]=l;v=r;g=$;x=o;w=F;u=G;t=H;r=I;o=J}else switch(gb|0){case 2:{y=ja+28|0;B=b[ja+32>>1]|0;if(!(B<<16>>16))l=(b[y>>1]|0)!=0;else l=1;K=l?2:0;c[ya>>2]=K;A=b[ja+34>>1]|0;if(!(A<<16>>16))l=(b[ja+30>>1]|0)!=0;else l=1;o=l?2:0;c[xa>>2]=o;x=b[ja+40>>1]|0;if(!(x<<16>>16))l=(b[ja+36>>1]|0)!=0;else l=1;r=l?2:0;c[wa>>2]=r;s=b[ja+42>>1]|0;if(!(s<<16>>16))J=(b[ja+38>>1]|0)!=0?2:0;else J=2;c[va>>2]=J;t=b[ja+48>>1]|0;if(!(t<<16>>16))D=(b[ja+44>>1]|0)!=0?2:0;else D=2;c[qa>>2]=D;u=b[ja+50>>1]|0;if(!(u<<16>>16))C=(b[ja+46>>1]|0)!=0?2:0;else C=2;c[pa>>2]=C;v=b[ja+56>>1]|0;if(!(v<<16>>16))G=(b[ja+52>>1]|0)!=0?2:0;else G=2;c[oa>>2]=G;w=(b[ja+58>>1]|0)==0;if(w)F=(b[ja+54>>1]|0)!=0?2:0;else F=2;c[na>>2]=F;g=b[ja+44>>1]|0;l=b[ja+166>>1]|0;m=b[ja+142>>1]|0;do if(!((g|B)<<16>>16)){ba=(b[ja+164>>1]|0)-(b[ja+140>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){I=1;break}if((((l-m|0)<0?0-(l-m)|0:l-m|0)|0)>3){I=1;break}I=(c[ja+124>>2]|0)!=(c[ja+116>>2]|0)&1}else I=2;while(0);c[ua>>2]=I;q=b[ja+46>>1]|0;l=b[ja+170>>1]|0;m=b[ja+146>>1]|0;do if(!((q|A)<<16>>16)){ba=(b[ja+168>>1]|0)-(b[ja+144>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){H=1;break}if((((l-m|0)<0?0-(l-m)|0:l-m|0)|0)>3){H=1;break}H=(c[ja+124>>2]|0)!=(c[ja+116>>2]|0)&1}else H=2;while(0);c[ta>>2]=H;p=b[ja+52>>1]|0;l=b[ja+182>>1]|0;m=b[ja+158>>1]|0;do if(!((p|x)<<16>>16)){ba=(b[ja+180>>1]|0)-(b[ja+156>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){f=1;break}if((((l-m|0)<0?0-(l-m)|0:l-m|0)|0)>3){f=1;break}f=(c[ja+128>>2]|0)!=(c[ja+120>>2]|0)&1}else f=2;while(0);c[sa>>2]=f;n=b[ja+54>>1]|0;l=b[ja+186>>1]|0;m=b[ja+162>>1]|0;do if(!((n|s)<<16>>16)){ba=(b[ja+184>>1]|0)-(b[ja+160>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){E=1;break}if((((l-m|0)<0?0-(l-m)|0:l-m|0)|0)>3){E=1;break}E=(c[ja+128>>2]|0)!=(c[ja+120>>2]|0)&1}else E=2;while(0);c[ra>>2]=E;l=b[ja+30>>1]|0;if(!(l<<16>>16))z=(b[y>>1]|0)!=0?2:0;else z=2;c[Pa>>2]=z;aa=b[ja+36>>1]|0;ba=(aa|l)<<16>>16!=0?2:0;c[Ja>>2]=ba;aa=(b[ja+38>>1]|aa)<<16>>16!=0?2:0;c[Ia>>2]=aa;y=B<<16>>16!=0|A<<16>>16==0^1?2:0;c[Ha>>2]=y;A=A<<16>>16!=0|x<<16>>16==0^1?2:0;c[Ga>>2]=A;x=x<<16>>16!=0|s<<16>>16==0^1?2:0;c[Fa>>2]=x;g=(q|g)<<16>>16!=0?2:0;c[Ea>>2]=g;B=(p|q)<<16>>16!=0?2:0;c[Da>>2]=B;s=(n|p)<<16>>16!=0?2:0;c[Ca>>2]=s;q=t<<16>>16!=0|u<<16>>16==0^1?2:0;c[Ba>>2]=q;n=v<<16>>16==0?(u<<16>>16!=0?2:0):2;c[Aa>>2]=n;l=w?(v<<16>>16!=0?2:0):2;c[za>>2]=l;p=B;v=g;g=x;x=A;A=F;B=G;w=H;u=I;t=J;m=K;break S}case 3:{l=ja+28|0;n=b[ja+32>>1]|0;if(!(n<<16>>16))m=(b[l>>1]|0)!=0?2:0;else m=2;c[ya>>2]=m;u=b[ja+34>>1]|0;if(!(u<<16>>16))O=(b[ja+30>>1]|0)!=0?2:0;else O=2;c[xa>>2]=O;v=b[ja+40>>1]|0;if(!(v<<16>>16))N=(b[ja+36>>1]|0)!=0?2:0;else N=2;c[wa>>2]=N;o=b[ja+42>>1]|0;if(!(o<<16>>16))M=(b[ja+38>>1]|0)!=0?2:0;else M=2;c[va>>2]=M;p=b[ja+44>>1]|0;L=(p|n)<<16>>16!=0?2:0;c[ua>>2]=L;w=b[ja+46>>1]|0;K=(w|u)<<16>>16!=0?2:0;c[ta>>2]=K;g=b[ja+52>>1]|0;f=(g|v)<<16>>16!=0?2:0;c[sa>>2]=f;q=b[ja+54>>1]|0;E=(q|o)<<16>>16!=0?2:0;c[ra>>2]=E;r=b[ja+48>>1]|0;D=(r|p)<<16>>16!=0?2:0;c[qa>>2]=D;y=b[ja+50>>1]|0;C=w<<16>>16!=0|y<<16>>16==0^1?2:0;c[pa>>2]=C;F=b[ja+56>>1]|0;B=(F|g)<<16>>16!=0?2:0;c[oa>>2]=B;s=(b[ja+58>>1]|0)==0;A=q<<16>>16!=0|s^1?2:0;c[na>>2]=A;t=b[ja+30>>1]|0;if(!(t<<16>>16))z=(b[l>>1]|0)!=0?2:0;else z=2;c[Pa>>2]=z;ba=b[ja+36>>1]|0;J=(b[ja+38>>1]|0)==0?(ba<<16>>16!=0?2:0):2;c[Ia>>2]=J;I=n<<16>>16!=0|u<<16>>16==0^1?2:0;c[Ha>>2]=I;H=v<<16>>16!=0|o<<16>>16==0^1?2:0;c[Fa>>2]=H;G=(w|p)<<16>>16!=0?2:0;c[Ea>>2]=G;x=(q|g)<<16>>16!=0?2:0;c[Ca>>2]=x;q=y<<16>>16==0?(r<<16>>16!=0?2:0):2;c[Ba>>2]=q;l=s?(F<<16>>16!=0?2:0):2;c[za>>2]=l;n=b[ja+150>>1]|0;o=b[ja+138>>1]|0;do if(!((ba|t)<<16>>16)){ba=(b[ja+148>>1]|0)-(b[ja+136>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){t=1;break}if((((n-o|0)<0?0-(n-o)|0:n-o|0)|0)>3){t=1;break}t=(c[ja+120>>2]|0)!=(c[ja+116>>2]|0)&1}else t=2;while(0);c[Ja>>2]=t;n=b[ja+158>>1]|0;o=b[ja+146>>1]|0;do if(!((v|u)<<16>>16)){ba=(b[ja+156>>1]|0)-(b[ja+144>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){r=1;break}if((((n-o|0)<0?0-(n-o)|0:n-o|0)|0)>3){r=1;break}r=(c[ja+120>>2]|0)!=(c[ja+116>>2]|0)&1}else r=2;while(0);c[Ga>>2]=r;n=b[ja+182>>1]|0;o=b[ja+170>>1]|0;do if(!((g|w)<<16>>16)){ba=(b[ja+180>>1]|0)-(b[ja+168>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){p=1;break}if((((n-o|0)<0?0-(n-o)|0:n-o|0)|0)>3){p=1;break}p=(c[ja+128>>2]|0)!=(c[ja+124>>2]|0)&1}else p=2;while(0);c[Da>>2]=p;n=b[ja+190>>1]|0;o=b[ja+178>>1]|0;do if(!((F|y)<<16>>16)){ba=(b[ja+188>>1]|0)-(b[ja+176>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){n=1;break}if((((n-o|0)<0?0-(n-o)|0:n-o|0)|0)>3){n=1;break}n=(c[ja+128>>2]|0)!=(c[ja+124>>2]|0)&1}else n=2;while(0);c[Aa>>2]=n;s=x;v=G;g=H;x=r;y=I;aa=J;ba=t;w=K;u=L;t=M;r=N;o=O;break S}default:{y=b[ja+32>>1]|0;l=b[ja+28>>1]|0;F=b[ja+142>>1]|0;n=b[ja+134>>1]|0;do if(!((l|y)<<16>>16)){ba=(b[ja+140>>1]|0)-(b[ja+132>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){m=1;break}m=(((F-n|0)<0?0-(F-n)|0:F-n|0)|0)>3&1}else m=2;while(0);c[ya>>2]=m;G=b[ja+34>>1]|0;p=b[ja+30>>1]|0;H=b[ja+146>>1]|0;q=b[ja+138>>1]|0;do if(!((p|G)<<16>>16)){ba=(b[ja+144>>1]|0)-(b[ja+136>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){o=1;break}o=(((H-q|0)<0?0-(H-q)|0:H-q|0)|0)>3&1}else o=2;while(0);c[xa>>2]=o;I=b[ja+40>>1]|0;s=b[ja+36>>1]|0;J=b[ja+158>>1]|0;v=b[ja+150>>1]|0;do if(!((s|I)<<16>>16)){ba=(b[ja+156>>1]|0)-(b[ja+148>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){r=1;break}r=(((J-v|0)<0?0-(J-v)|0:J-v|0)|0)>3&1}else r=2;while(0);c[wa>>2]=r;K=b[ja+42>>1]|0;g=b[ja+38>>1]|0;L=b[ja+162>>1]|0;x=b[ja+154>>1]|0;do if(!((g|K)<<16>>16)){ba=(b[ja+160>>1]|0)-(b[ja+152>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){t=1;break}t=(((L-x|0)<0?0-(L-x)|0:L-x|0)|0)>3&1}else t=2;while(0);c[va>>2]=t;M=b[ja+44>>1]|0;N=b[ja+166>>1]|0;do if(!((M|y)<<16>>16)){ba=(b[ja+164>>1]|0)-(b[ja+140>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){u=1;break}if((((N-F|0)<0?0-(N-F)|0:N-F|0)|0)>3){u=1;break}u=(c[ja+124>>2]|0)!=(c[ja+116>>2]|0)&1}else u=2;while(0);c[ua>>2]=u;O=b[ja+46>>1]|0;P=b[ja+170>>1]|0;do if(!((O|G)<<16>>16)){ba=(b[ja+168>>1]|0)-(b[ja+144>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){w=1;break}if((((P-H|0)<0?0-(P-H)|0:P-H|0)|0)>3){w=1;break}w=(c[ja+124>>2]|0)!=(c[ja+116>>2]|0)&1}else w=2;while(0);c[ta>>2]=w;Q=b[ja+52>>1]|0;h=b[ja+182>>1]|0;do if(!((Q|I)<<16>>16)){ba=(b[ja+180>>1]|0)-(b[ja+156>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){f=1;break}if((((h-J|0)<0?0-(h-J)|0:h-J|0)|0)>3){f=1;break}f=(c[ja+128>>2]|0)!=(c[ja+120>>2]|0)&1}else f=2;while(0);c[sa>>2]=f;R=b[ja+54>>1]|0;S=b[ja+186>>1]|0;do if(!((R|K)<<16>>16)){ba=(b[ja+184>>1]|0)-(b[ja+160>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){E=1;break}if((((S-L|0)<0?0-(S-L)|0:S-L|0)|0)>3){E=1;break}E=(c[ja+128>>2]|0)!=(c[ja+120>>2]|0)&1}else E=2;while(0);c[ra>>2]=E;T=b[ja+48>>1]|0;U=b[ja+174>>1]|0;do if(!((T|M)<<16>>16)){ba=(b[ja+172>>1]|0)-(b[ja+164>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){D=1;break}D=(((U-N|0)<0?0-(U-N)|0:U-N|0)|0)>3&1}else D=2;while(0);c[qa>>2]=D;V=b[ja+50>>1]|0;W=b[ja+178>>1]|0;do if(!((V|O)<<16>>16)){ba=(b[ja+176>>1]|0)-(b[ja+168>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){C=1;break}C=(((W-P|0)<0?0-(W-P)|0:W-P|0)|0)>3&1}else C=2;while(0);c[pa>>2]=C;X=b[ja+56>>1]|0;Y=b[ja+190>>1]|0;do if(!((X|Q)<<16>>16)){ba=(b[ja+188>>1]|0)-(b[ja+180>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){B=1;break}B=(((Y-h|0)<0?0-(Y-h)|0:Y-h|0)|0)>3&1}else B=2;while(0);c[oa>>2]=B;_=b[ja+58>>1]|0;$=b[ja+194>>1]|0;do if(!((_|R)<<16>>16)){ba=(b[ja+192>>1]|0)-(b[ja+184>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){A=1;break}A=((($-S|0)<0?0-($-S)|0:$-S|0)|0)>3&1}else A=2;while(0);c[na>>2]=A;do if(!((p|l)<<16>>16)){ba=(b[ja+136>>1]|0)-(b[ja+132>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){z=1;break}z=(((q-n|0)<0?0-(q-n)|0:q-n|0)|0)>3&1}else z=2;while(0);c[Pa>>2]=z;do if(!((s|p)<<16>>16)){ba=(b[ja+148>>1]|0)-(b[ja+136>>1]|0)|0;if((((ba|0)<0?0-ba|0:ba)|0)>3){ba=1;break}if((((v-q|0)<0?0-(v-q)|0:v-q|0)|0)>3){ba=1;break}ba=(c[ja+120>>2]|0)!=(c[ja+116>>2]|0)&1}else ba=2;while(0);c[Ja>>2]=ba;do if(!((g|s)<<16>>16)){aa=(b[ja+152>>1]|0)-(b[ja+148>>1]|0)|0;if((((aa|0)<0?0-aa|0:aa)|0)>3){aa=1;break}aa=(((x-v|0)<0?0-(x-v)|0:x-v|0)|0)>3&1}else aa=2;while(0);c[Ia>>2]=aa;do if(!((G|y)<<16>>16)){y=(b[ja+144>>1]|0)-(b[ja+140>>1]|0)|0;if((((y|0)<0?0-y|0:y)|0)>3){y=1;break}y=(((H-F|0)<0?0-(H-F)|0:H-F|0)|0)>3&1}else y=2;while(0);c[Ha>>2]=y;do if(!((I|G)<<16>>16)){G=(b[ja+156>>1]|0)-(b[ja+144>>1]|0)|0;if((((G|0)<0?0-G|0:G)|0)>3){x=1;break}if((((J-H|0)<0?0-(J-H)|0:J-H|0)|0)>3){x=1;break}x=(c[ja+120>>2]|0)!=(c[ja+116>>2]|0)&1}else x=2;while(0);c[Ga>>2]=x;do if(!((K|I)<<16>>16)){K=(b[ja+160>>1]|0)-(b[ja+156>>1]|0)|0;if((((K|0)<0?0-K|0:K)|0)>3){g=1;break}g=(((L-J|0)<0?0-(L-J)|0:L-J|0)|0)>3&1}else g=2;while(0);c[Fa>>2]=g;do if(!((O|M)<<16>>16)){M=(b[ja+168>>1]|0)-(b[ja+164>>1]|0)|0;if((((M|0)<0?0-M|0:M)|0)>3){v=1;break}v=(((P-N|0)<0?0-(P-N)|0:P-N|0)|0)>3&1}else v=2;while(0);c[Ea>>2]=v;do if(!((Q|O)<<16>>16)){O=(b[ja+180>>1]|0)-(b[ja+168>>1]|0)|0;if((((O|0)<0?0-O|0:O)|0)>3){p=1;break}if((((h-P|0)<0?0-(h-P)|0:h-P|0)|0)>3){p=1;break}p=(c[ja+128>>2]|0)!=(c[ja+124>>2]|0)&1}else p=2;while(0);c[Da>>2]=p;do if(!((R|Q)<<16>>16)){R=(b[ja+184>>1]|0)-(b[ja+180>>1]|0)|0;if((((R|0)<0?0-R|0:R)|0)>3){s=1;break}s=(((S-h|0)<0?0-(S-h)|0:S-h|0)|0)>3&1}else s=2;while(0);c[Ca>>2]=s;do if(!((V|T)<<16>>16)){T=(b[ja+176>>1]|0)-(b[ja+172>>1]|0)|0;if((((T|0)<0?0-T|0:T)|0)>3){q=1;break}q=(((W-U|0)<0?0-(W-U)|0:W-U|0)|0)>3&1}else q=2;while(0);c[Ba>>2]=q;do if(!((X|V)<<16>>16)){V=(b[ja+188>>1]|0)-(b[ja+176>>1]|0)|0;if((((V|0)<0?0-V|0:V)|0)>3){n=1;break}if((((Y-W|0)<0?0-(Y-W)|0:Y-W|0)|0)>3){n=1;break}n=(c[ja+128>>2]|0)!=(c[ja+124>>2]|0)&1}else n=2;while(0);c[Aa>>2]=n;do if(!((_|X)<<16>>16)){_=(b[ja+192>>1]|0)-(b[ja+188>>1]|0)|0;if((((_|0)<0?0-_|0:_)|0)>3){l=1;break}l=((($-Y|0)<0?0-($-Y)|0:$-Y|0)|0)>3&1}else l=2;while(0);c[za>>2]=l;break S}}while(0);if(Ya)break;if(!(n|l|q|s|p|v|g|x|y|aa|ba|z|A|B|C|D|E|f|w|u|t|r|o|m))break P}while(0);J=ja+20|0;l=c[J>>2]|0;K=ja+12|0;m=c[K>>2]|0;n=(m+l|0)<0?0:(m+l|0)>51?51:m+l|0;L=ja+16|0;o=c[L>>2]|0;p=d[7574+n>>0]|0;c[rb+644+28>>2]=p;q=d[7626+((o+l|0)<0?0:(o+l|0)>51?51:o+l|0)>>0]|0;c[rb+644+32>>2]=q;c[rb+644+24>>2]=7678+(n*3|0);do if(!ea){k=c[ca+20>>2]|0;if((k|0)==(l|0)){c[rb+644+4>>2]=p;c[rb+644+8>>2]=q;c[rb+644>>2]=7678+(n*3|0);break}else{ca=((l+1+k|0)>>>1)+m|0;ca=(ca|0)<0?0:(ca|0)>51?51:ca;ba=((l+1+k|0)>>>1)+o|0;c[rb+644+4>>2]=d[7574+ca>>0];c[rb+644+8>>2]=d[7626+((ba|0)<0?0:(ba|0)>51?51:ba)>>0];c[rb+644>>2]=7678+(ca*3|0);break}}while(0);do if(!da){k=c[j+20>>2]|0;if((k|0)==(l|0)){c[rb+644+16>>2]=p;c[rb+644+20>>2]=q;c[Sa>>2]=7678+(n*3|0);break}else{j=((l+1+k|0)>>>1)+m|0;j=(j|0)<0?0:(j|0)>51?51:j;ca=((l+1+k|0)>>>1)+o|0;c[rb+644+16>>2]=d[7574+j>>0];c[rb+644+20>>2]=d[7626+((ca|0)<0?0:(ca|0)>51?51:ca)>>0];c[rb+644+12>>2]=7678+(j*3|0);break}}while(0);I=Z(ia,ka)|0;f=3;F=0;G=(c[Va>>2]|0)+((I<<8)+(ha<<4))|0;H=rb+680|0;while(1){k=c[H+4>>2]|0;if(k)ab(G,k,Sa,ka<<4);k=c[H+12>>2]|0;if(k)ab(G+4|0,k,Ra,ka<<4);D=H+16|0;k=c[H+20>>2]|0;if(k)ab(G+8|0,k,Ra,ka<<4);E=H+24|0;k=c[H+28>>2]|0;if(k)ab(G+12|0,k,Ra,ka<<4);B=c[H>>2]|0;C=H+8|0;k=c[C>>2]|0;T:do if((B|0)==(k|0)){if((B|0)!=(c[D>>2]|0)){Xa=1399;break}if((B|0)!=(c[E>>2]|0)){Xa=1399;break}if(!B)break;if(B>>>0<4){q=d[(c[rb+644+(F*12|0)>>2]|0)+(B+-1)>>0]|0;r=rb+644+(F*12|0)+4|0;s=rb+644+(F*12|0)+8|0;p=G;x=16;while(1){l=p+(0-(ka<<4)<<1)|0;t=p+(0-(ka<<4))|0;o=p+(ka<<4)|0;u=a[o>>0]|0;v=d[t>>0]|0;w=d[p>>0]|0;do if(((v-w|0)<0?0-(v-w)|0:v-w|0)>>>0<(c[r>>2]|0)>>>0){g=d[l>>0]|0;m=c[s>>2]|0;if(((g-v|0)<0?0-(g-v)|0:g-v|0)>>>0>=m>>>0)break;if((((u&255)-w|0)<0?0-((u&255)-w)|0:(u&255)-w|0)>>>0>=m>>>0)break;n=d[p+Qa>>0]|0;if(((n-v|0)<0?0-(n-v)|0:n-v|0)>>>0<m>>>0){a[l>>0]=((((v+1+w|0)>>>1)-(g<<1)+n>>1|0)<(0-q|0)?0-q|0:(((v+1+w|0)>>>1)-(g<<1)+n>>1|0)>(q|0)?q:((v+1+w|0)>>>1)-(g<<1)+n>>1)+g;m=c[s>>2]|0;l=q+1|0}else l=q;n=d[p+(ka<<5)>>0]|0;if(((n-w|0)<0?0-(n-w)|0:n-w|0)>>>0<m>>>0){a[o>>0]=((((v+1+w|0)>>>1)-((u&255)<<1)+n>>1|0)<(0-q|0)?0-q|0:(((v+1+w|0)>>>1)-((u&255)<<1)+n>>1|0)>(q|0)?q:((v+1+w|0)>>>1)-((u&255)<<1)+n>>1)+(u&255);l=l+1|0}ca=0-l|0;ca=(4-(u&255)+(w-v<<2)+g>>3|0)<(ca|0)?ca:(4-(u&255)+(w-v<<2)+g>>3|0)>(l|0)?l:4-(u&255)+(w-v<<2)+g>>3;j=a[6294+((w|512)-ca)>>0]|0;a[t>>0]=a[6294+(ca+(v|512))>>0]|0;a[p>>0]=j}while(0);x=x+-1|0;if(!x)break T;else p=p+1|0}}o=rb+644+(F*12|0)+4|0;p=rb+644+(F*12|0)+8|0;n=G;A=16;while(1){q=n+(0-(ka<<4)<<1)|0;r=n+(0-(ka<<4))|0;s=n+(ka<<4)|0;t=a[s>>0]|0;u=d[r>>0]|0;v=d[n>>0]|0;l=(u-v|0)<0?0-(u-v)|0:u-v|0;m=c[o>>2]|0;U:do if(l>>>0<m>>>0){w=d[q>>0]|0;g=c[p>>2]|0;if(((w-u|0)<0?0-(w-u)|0:w-u|0)>>>0>=g>>>0)break;if((((t&255)-v|0)<0?0-((t&255)-v)|0:(t&255)-v|0)>>>0>=g>>>0)break;x=n+Qa|0;y=n+(ka<<5)|0;z=a[y>>0]|0;do if(l>>>0<((m>>>2)+2|0)>>>0){l=d[x>>0]|0;if(((l-u|0)<0?0-(l-u)|0:l-u|0)>>>0<g>>>0){a[r>>0]=((t&255)+4+(v+u+w<<1)+l|0)>>>3;a[q>>0]=(v+u+w+2+l|0)>>>2;a[x>>0]=(v+u+w+4+(l*3|0)+(d[n+(0-(ka<<4)<<2)>>0]<<1)|0)>>>3}else a[r>>0]=(u+2+(t&255)+(w<<1)|0)>>>2;if((((z&255)-v|0)<0?0-((z&255)-v)|0:(z&255)-v|0)>>>0>=(c[p>>2]|0)>>>0)break;a[n>>0]=((v+u+(t&255)<<1)+4+w+(z&255)|0)>>>3;a[s>>0]=(v+u+(t&255)+2+(z&255)|0)>>>2;a[y>>0]=(v+u+(t&255)+4+((z&255)*3|0)+(d[n+(ka*48|0)>>0]<<1)|0)>>>3;break U}else a[r>>0]=(u+2+(t&255)+(w<<1)|0)>>>2;while(0);a[n>>0]=(v+2+((t&255)<<1)+w|0)>>>2}while(0);A=A+-1|0;if(!A)break;else n=n+1|0}}else Xa=1399;while(0);do if((Xa|0)==1399){Xa=0;if(B){bb(G,B,rb+644+(F*12|0)|0,ka<<4);k=c[C>>2]|0}if(k)bb(G+4|0,k,rb+644+(F*12|0)|0,ka<<4);k=c[D>>2]|0;if(k)bb(G+8|0,k,rb+644+(F*12|0)|0,ka<<4);k=c[E>>2]|0;if(!k)break;bb(G+12|0,k,rb+644+(F*12|0)|0,ka<<4)}while(0);if(!f)break;else{f=f+-1|0;F=2;G=G+(ka<<6)|0;H=H+32|0}}s=c[ja+24>>2]|0;q=c[J>>2]|0;r=c[80+(((q+s|0)<0?0:(q+s|0)>51?51:q+s|0)<<2)>>2]|0;o=c[K>>2]|0;p=(o+r|0)<0?0:(o+r|0)>51?51:o+r|0;l=c[L>>2]|0;m=d[7574+p>>0]|0;c[rb+644+28>>2]=m;n=d[7626+((l+r|0)<0?0:(l+r|0)>51?51:l+r|0)>>0]|0;c[rb+644+32>>2]=n;c[rb+644+24>>2]=7678+(p*3|0);do if(!ea){k=c[(c[fa>>2]|0)+20>>2]|0;if((k|0)==(q|0)){c[rb+644+4>>2]=m;c[rb+644+8>>2]=n;c[rb+644>>2]=7678+(p*3|0);break}else{ea=(r+1+(c[80+(((k+s|0)<0?0:(k+s|0)>51?51:k+s|0)<<2)>>2]|0)|0)>>>1;fa=(ea+o|0)<0?0:(ea+o|0)>51?51:ea+o|0;c[rb+644+4>>2]=d[7574+fa>>0];c[rb+644+8>>2]=d[7626+((ea+l|0)<0?0:(ea+l|0)>51?51:ea+l|0)>>0];c[rb+644>>2]=7678+(fa*3|0);break}}while(0);do if(!da){k=c[(c[ga>>2]|0)+20>>2]|0;if((k|0)==(q|0)){c[rb+644+16>>2]=m;c[rb+644+20>>2]=n;c[Sa>>2]=7678+(p*3|0);break}else{fa=(r+1+(c[80+(((k+s|0)<0?0:(k+s|0)>51?51:k+s|0)<<2)>>2]|0)|0)>>>1;ga=(fa+o|0)<0?0:(fa+o|0)>51?51:fa+o|0;c[rb+644+16>>2]=d[7574+ga>>0];c[rb+644+20>>2]=d[7626+((fa+l|0)<0?0:(fa+l|0)>51?51:fa+l|0)>>0];c[rb+644+12>>2]=7678+(ga*3|0);break}}while(0);q=c[Va>>2]|0;p=(ha<<3)+(ma<<8)+(I<<6)|0;o=q+(p+(ma<<6))|0;p=q+p|0;q=0;r=rb+680|0;s=0;while(1){k=r+4|0;l=c[k>>2]|0;if(l){cb(p,l,Sa,ka<<3);cb(o,c[k>>2]|0,Sa,ka<<3)}k=r+36|0;l=c[k>>2]|0;if(l){cb(p+(ka<<4)|0,l,Sa,ka<<3);cb(o+(ka<<4)|0,c[k>>2]|0,Sa,ka<<3)}n=r+16|0;k=r+20|0;l=c[k>>2]|0;if(l){cb(p+4|0,l,Ra,ka<<3);cb(o+4|0,c[k>>2]|0,Ra,ka<<3)}k=r+52|0;l=c[k>>2]|0;if(l){cb(p+(ka<<4|4)|0,l,Ra,ka<<3);cb(o+(ka<<4|4)|0,c[k>>2]|0,Ra,ka<<3)}l=c[r>>2]|0;m=r+8|0;k=c[m>>2]|0;do if((l|0)==(k|0)){if((l|0)!=(c[n>>2]|0)){Xa=1430;break}if((l|0)!=(c[r+24>>2]|0)){Xa=1430;break}if(!l)break;ga=rb+644+(q*12|0)|0;db(p,l,ga,ka<<3);db(o,c[r>>2]|0,ga,ka<<3)}else Xa=1430;while(0);do if((Xa|0)==1430){Xa=0;if(l){k=rb+644+(q*12|0)|0;eb(p,l,k,ka<<3);eb(o,c[r>>2]|0,k,ka<<3);k=c[m>>2]|0}if(k){ga=rb+644+(q*12|0)|0;eb(p+2|0,k,ga,ka<<3);eb(o+2|0,c[m>>2]|0,ga,ka<<3)}k=c[n>>2]|0;if(k){ga=rb+644+(q*12|0)|0;eb(p+4|0,k,ga,ka<<3);eb(o+4|0,c[n>>2]|0,ga,ka<<3)}k=r+24|0;l=c[k>>2]|0;if(!l)break;ga=rb+644+(q*12|0)|0;eb(p+6|0,l,ga,ka<<3);eb(o+6|0,c[k>>2]|0,ga,ka<<3)}while(0);s=s+1|0;if((s|0)==2)break;else{o=o+(ka<<5)|0;p=p+(ka<<5)|0;q=2;r=r+64|0}}k=c[la>>2]|0}while(0);l=ha+1|0;ia=((l|0)==(ka|0)&1)+ia|0;if(ia>>>0>=k>>>0)break;else{ha=(l|0)==(ka|0)?0:l;ja=ja+216|0}}}c[e+1196>>2]=0;c[e+1192>>2]=0;m=c[e+1176>>2]|0;if(m){k=c[Ta>>2]|0;l=0;do{c[k+(l*216|0)+4>>2]=0;c[k+(l*216|0)+196>>2]=0;l=l+1|0}while((l|0)!=(m|0))}t=c[Ua>>2]|0;V:do if(!(c[e+1652>>2]|0))u=0;else{k=0;W:while(1){switch(c[e+1656+(k*20|0)>>2]|0){case 5:{u=1;break V}case 0:break W;default:{}}k=k+1|0}u=0}while(0);X:do switch(c[t+16>>2]|0){case 0:{if((c[e+1360>>2]|0)!=5){k=c[e+1284>>2]|0;l=c[e+1388>>2]|0;if(k>>>0>l>>>0?(kb=c[t+20>>2]|0,(k-l|0)>>>0>=kb>>>1>>>0):0){ob=e+1284|0;pb=l;qb=(c[e+1288>>2]|0)+kb|0}else{jb=e+1284|0;lb=l;mb=k;Xa=1454}}else{c[e+1288>>2]=0;c[e+1284>>2]=0;jb=e+1284|0;lb=c[e+1388>>2]|0;mb=0;Xa=1454}do if((Xa|0)==1454){if(lb>>>0>mb>>>0?(nb=c[t+20>>2]|0,(lb-mb|0)>>>0>nb>>>1>>>0):0){ob=jb;pb=lb;qb=(c[e+1288>>2]|0)-nb|0;break}ob=jb;pb=lb;qb=c[e+1288>>2]|0}while(0);if(!(c[e+1364>>2]|0)){k=c[e+1392>>2]|0;k=qb+pb+((k|0)<0?k:0)|0;break X}c[e+1288>>2]=qb;k=c[e+1392>>2]|0;if(!u){c[ob>>2]=pb;k=qb+pb+((k|0)<0?k:0)|0;break X}else{c[e+1288>>2]=0;c[ob>>2]=(k|0)<0?0-k|0:0;k=0;break X}}case 1:{if((c[e+1360>>2]|0)!=5){k=c[e+1296>>2]|0;if((c[e+1292>>2]|0)>>>0>(c[e+1380>>2]|0)>>>0)k=(c[t+12>>2]|0)+k|0}else k=0;p=c[t+36>>2]|0;if(!p)l=0;else l=(c[e+1380>>2]|0)+k|0;s=(c[e+1364>>2]|0)==0;o=(((l|0)!=0&s)<<31>>31)+l|0;if(o){r=((o+-1|0)>>>0)%(p>>>0)|0;q=((o+-1|0)>>>0)/(p>>>0)|0}else{r=0;q=0}if(!p)l=0;else{m=c[t+40>>2]|0;l=0;n=0;do{l=(c[m+(n<<2)>>2]|0)+l|0;n=n+1|0}while((n|0)!=(p|0))}if(o){l=Z(l,q)|0;m=c[t+40>>2]|0;n=0;do{l=(c[m+(n<<2)>>2]|0)+l|0;n=n+1|0}while(n>>>0<=r>>>0)}else l=0;if(s)m=(c[t+28>>2]|0)+l|0;else m=l;l=(c[e+1400>>2]|0)+(c[t+32>>2]|0)|0;if(!u){qb=((l|0)<0?l:0)+m+(c[e+1396>>2]|0)|0;c[e+1296>>2]=k;c[e+1292>>2]=c[e+1380>>2];k=qb;break X}else{c[e+1296>>2]=0;c[e+1292>>2]=0;k=0;break X}}default:{if((c[e+1360>>2]|0)==5){l=e+1296|0;m=0;k=0}else{n=c[e+1380>>2]|0;k=c[e+1296>>2]|0;if((c[e+1292>>2]|0)>>>0>n>>>0)k=(c[t+12>>2]|0)+k|0;l=e+1296|0;m=k;k=(((c[e+1364>>2]|0)==0)<<31>>31)+(k+n<<1)|0}if(!u){c[l>>2]=m;c[e+1292>>2]=c[e+1380>>2];break X}else{c[l>>2]=0;c[e+1292>>2]=0;k=0;break X}}}while(0);do if(c[Wa>>2]|0){m=c[e+1380>>2]|0;n=c[e+1360>>2]|0;o=c[e+1208>>2]|0;p=c[e+1204>>2]|0;l=c[Va>>2]|0;if(!(c[e+1364>>2]|0)){Za(e+1220|0,0,l,m,k,(n|0)==5&1,o,p);break}else{Za(e+1220|0,e+1644|0,l,m,k,(n|0)==5&1,o,p);break}}while(0);c[e+1184>>2]=0;c[Wa>>2]=0;e=1;i=rb;return e|0}function jb(a){a=a|0;var b=0;b=ub(a)|0;c[854]=b;c[853]=b;c[852]=a;c[855]=b+a;return b|0}
function kb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;x=i;i=i+16|0;c[852]=a;b=c[853]|0;c[848]=b;c[849]=a;d=a;a:while(1){a=c[858]|0;c[850]=a;p=c[856]|0;b:do if(!((b|0)==0|(d|0)==0|(p|0)==0)?(v=c[p>>2]|0,(v|0)!=0):0){c[859]=0;c[x>>2]=0;c[p+3392>>2]=c[851];c:do if((v|0)==2){a=0;w=5}else{e=a;a=1;d:while(1){m=ib(p+8|0,b,d,e,x)|0;o=c[x>>2]|0;b=b+o|0;n=d-o|0;n=(n|0)<0?0:n;c[859]=b;switch(m|0){case 5:{w=31;break b}case 2:{w=7;break c}case 1:{w=10;break d}case 4:{m=0;e:while(1){e=c[p+8+148+(m<<2)>>2]|0;f:do if((e|0)!=0?(u=c[p+8+20+(c[e+4>>2]<<2)>>2]|0,(u|0)!=0):0){j=c[u+52>>2]|0;k=Z(c[u+56>>2]|0,j)|0;l=c[e+12>>2]|0;if(l>>>0<=1){d=0;break e}d=c[e+16>>2]|0;switch(d|0){case 0:{d=c[e+20>>2]|0;e=0;while(1){if((c[d+(e<<2)>>2]|0)>>>0>k>>>0)break f;e=e+1|0;if(e>>>0>=l>>>0){d=0;break e}}}case 2:{h=c[e+24>>2]|0;d=c[e+28>>2]|0;g=0;while(1){e=c[h+(g<<2)>>2]|0;f=c[d+(g<<2)>>2]|0;if(!(e>>>0<=f>>>0&f>>>0<k>>>0))break f;g=g+1|0;if(((e>>>0)%(j>>>0)|0)>>>0>((f>>>0)%(j>>>0)|0)>>>0)break f;if(g>>>0>=(l+-1|0)>>>0){d=0;break e}}}default:{if((d+-3|0)>>>0<3)if((c[e+36>>2]|0)>>>0>k>>>0)break f;else{d=0;break e}if((d|0)!=6){d=0;break e}if((c[e+40>>2]|0)>>>0<k>>>0)break f;else{d=0;break e}}}}while(0);m=m+1|0;if(m>>>0>=256){d=1;break}}a=((d|0)==0|n|0)==0?-2:a;break}default:{}}if(!n)break;if((c[p>>2]|0)==2){a=o;w=5;break c}e=c[850]|0;d=n}if((w|0)==10){w=0;c[p+4>>2]=(c[p+4>>2]|0)+1;a=(n|0)==0?2:3}switch(a|0){case -2:case 1:break a;case 4:{w=34;break}case 3:{w=70;break}case 2:break;default:break b}}while(0);if((w|0)==5){c[p>>2]=1;b=b+a|0;c[859]=b;w=7}do if((w|0)==7){if((c[p+1288>>2]|0)!=0?(c[p+1244>>2]|0)!=(c[p+1248>>2]|0):0){c[p+1288>>2]=0;c[p>>2]=2;w=70;break}w=34}while(0);if((w|0)==34){w=0;b=c[856]|0;if(!b)break;d=c[b+24>>2]|0;if(!d)break;if(!(c[b+20>>2]|0))break;c[861]=c[d+52>>2]<<4;c[862]=c[d+56>>2]<<4;if(c[d+80>>2]|0){p=c[d+84>>2]|0;if(((p|0)!=0?(c[p+24>>2]|0)!=0:0)?(c[p+32>>2]|0)!=0:0)c[863]=1;else c[863]=0;b=c[d+84>>2]|0;if(((b|0)!=0?(c[b+24>>2]|0)!=0:0)?(c[b+36>>2]|0)!=0:0)b=c[b+48>>2]|0;else b=2}else{c[863]=0;b=2}c[864]=b;if(!(c[d+60>>2]|0)){c[867]=0;c[868]=0;c[869]=0;c[870]=0;b=0}else{c[867]=1;c[868]=c[d+64>>2]<<1;c[869]=(c[d+52>>2]<<4)-((c[d+68>>2]|0)+(c[d+64>>2]|0)<<1);c[870]=c[d+72>>2]<<1;b=(c[d+56>>2]<<4)-((c[d+76>>2]|0)+(c[d+72>>2]|0)<<1)|0}c[871]=b;g:do if(((c[d+80>>2]|0)!=0?(q=c[d+84>>2]|0,(q|0)!=0):0)?(c[q>>2]|0)!=0:0){b=c[q+4>>2]|0;do switch(b|0){case 1:case 0:{a=b;break g}case 2:{a=11;b=12;break g}case 3:{a=11;b=10;break g}case 4:{a=11;b=16;break g}case 5:{a=33;b=40;break g}case 6:{a=11;b=24;break g}case 7:{a=11;b=20;break g}case 8:{a=11;b=32;break g}case 9:{a=33;b=80;break g}case 10:{a=11;b=18;break g}case 11:{a=11;b=15;break g}case 12:{a=33;b=64;break g}case 13:{a=99;b=160;break g}case 255:{b=c[q+8>>2]|0;p=c[q+12>>2]|0;a=(b|0)==0|(p|0)==0?0:p;b=(b|0)==0|(p|0)==0?0:b;break g}default:{a=0;b=0;break g}}while(0)}else{a=1;b=1}while(0);c[865]=b;c[866]=a;c[860]=c[d>>2];ra();p=c[859]|0;c[849]=(c[848]|0)-p+(c[849]|0);c[848]=p;break}else if((w|0)==70){w=0;p=b;c[849]=(c[848]|0)-p+(c[849]|0);c[848]=p}c[849]=0;c[858]=(c[858]|0)+1;b=c[856]|0;if((((b|0)!=0?(r=c[b+1248>>2]|0,r>>>0<(c[b+1244>>2]|0)>>>0):0)?(s=c[b+1240>>2]|0,c[b+1248>>2]=r+1,(s+(r<<4)|0)!=0):0)?(t=c[s+(r<<4)>>2]|0,(t|0)!=0):0){e=s+(r<<4)+8|0;f=s+(r<<4)+12|0;a=s+(r<<4)+4|0;b=t;while(1){p=c[e>>2]|0;o=c[f>>2]|0;n=c[a>>2]|0;c[872]=b;c[873]=n;c[874]=o;c[875]=p;c[857]=(c[857]|0)+1;ga(b|0,c[861]|0,c[862]|0);b=c[856]|0;if(!b)break b;a=c[b+1248>>2]|0;if(a>>>0>=(c[b+1244>>2]|0)>>>0)break b;d=c[b+1240>>2]|0;c[b+1248>>2]=a+1;if(!(d+(a<<4)|0))break b;b=c[d+(a<<4)>>2]|0;if(!b)break b;e=d+(a<<4)+8|0;f=d+(a<<4)+12|0;a=d+(a<<4)+4|0}}}else w=31;while(0);if((w|0)==31)w=0;a=c[849]|0;if(!a){w=84;break}b=c[848]|0;d=a}if((w|0)==84){i=x;return}c[849]=0;i=x;return}function lb(){var d=0,e=0,f=0,g=0,h=0,j=0;j=i;i=i+16|0;g=ub(3396)|0;if(g){xb(g+8|0,0,3388)|0;c[g+16>>2]=32;c[g+12>>2]=256;c[g+1340>>2]=1;f=ub(2112)|0;c[g+3384>>2]=f;if(f){c[g>>2]=1;c[g+4>>2]=0;c[856]=g;c[857]=1;c[858]=1;h=0;i=j;return h|0}f=0;do{e=g+8+20+(f<<2)|0;d=c[e>>2]|0;if(d){vb(c[d+40>>2]|0);c[(c[e>>2]|0)+40>>2]=0;vb(c[(c[e>>2]|0)+84>>2]|0);c[(c[e>>2]|0)+84>>2]=0;vb(c[e>>2]|0);c[e>>2]=0}f=f+1|0}while((f|0)!=32);f=0;do{d=g+8+148+(f<<2)|0;e=c[d>>2]|0;if(e){vb(c[e+20>>2]|0);c[(c[d>>2]|0)+20>>2]=0;vb(c[(c[d>>2]|0)+24>>2]|0);c[(c[d>>2]|0)+24>>2]=0;vb(c[(c[d>>2]|0)+28>>2]|0);c[(c[d>>2]|0)+28>>2]=0;vb(c[(c[d>>2]|0)+44>>2]|0);c[(c[d>>2]|0)+44>>2]=0;vb(c[d>>2]|0);c[d>>2]=0}f=f+1|0}while((f|0)!=256);vb(c[g+3384>>2]|0);c[g+3384>>2]=0;vb(c[g+1220>>2]|0);c[g+1220>>2]=0;vb(c[g+1180>>2]|0);c[g+1180>>2]=0;d=c[g+1228>>2]|0;if((d|0)!=0?(c[g+1256>>2]|0)!=-1:0){e=0;do{vb(c[d+(e*40|0)+4>>2]|0);d=c[g+1228>>2]|0;c[d+(e*40|0)+4>>2]=0;e=e+1|0}while(e>>>0<((c[g+1256>>2]|0)+1|0)>>>0)}vb(d);c[g+1228>>2]=0;vb(c[g+1232>>2]|0);c[g+1232>>2]=0;vb(c[g+1240>>2]|0);vb(g)}d=c[892]|0;do if(!d){d=a[3626]|0;a[3626]=d+255|d;d=c[888]|0;if(!(d&8)){c[890]=0;c[889]=0;e=c[899]|0;c[895]=e;c[893]=e;d=e+(c[900]|0)|0;c[892]=d;break}c[888]=d|32;h=-1;i=j;return h|0}else e=c[893]|0;while(0);if((d-e|0)>>>0<29){if((xa[c[3588>>2]&3](3552,7834,29)|0)>>>0<29){h=-1;i=j;return h|0}}else{d=7834;f=e+29|0;do{a[e>>0]=a[d>>0]|0;e=e+1|0;d=d+1|0}while((e|0)<(f|0));c[893]=(c[893]|0)+29}f=a[3627]|0;if(f<<24>>24!=10){d=c[893]|0;e=c[892]|0;if(d>>>0<e>>>0){c[893]=d+1;a[d>>0]=10;h=-1;i=j;return h|0}}else e=c[892]|0;a[j>>0]=10;do if(!e){f=b[1813]|0;a[3626]=((f&65535)<<24>>24)+255|(f&65535)<<24>>24;d=c[888]|0;if(!(d&8)){c[890]=0;c[889]=0;g=c[899]|0;c[895]=g;c[893]=g;e=g+(c[900]|0)|0;c[892]=e;d=(f&65535)>>>8&255;h=32;break}else{c[888]=d|32;break}}else{g=c[893]|0;d=f;h=32}while(0);do if((h|0)==32)if(g>>>0>=e>>>0|d<<24>>24==10){xa[c[3588>>2]&3](3552,j,1)|0;break}else{c[893]=g+1;a[g>>0]=10;break}while(0);h=-1;i=j;return h|0}function mb(){return}function nb(){return 2}function ob(){return 3}function pb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;k=i;i=i+48|0;g=c[a+28>>2]|0;c[k+32>>2]=g;g=(c[a+20>>2]|0)-g|0;c[k+32+4>>2]=g;c[k+32+8>>2]=b;c[k+32+12>>2]=d;j=k+32|0;f=2;g=g+d|0;while(1){if(!(c[876]|0)){c[k+16>>2]=c[a+60>>2];c[k+16+4>>2]=j;c[k+16+8>>2]=f;b=ua(146,k+16|0)|0;if(b>>>0>4294963200){if(!(c[876]|0))e=3548;else e=c[(ia()|0)+60>>2]|0;c[e>>2]=0-b;b=-1}}else{oa(1,a|0);c[k>>2]=c[a+60>>2];c[k+4>>2]=j;c[k+8>>2]=f;b=ua(146,k|0)|0;if(b>>>0>4294963200){if(!(c[876]|0))e=3548;else e=c[(ia()|0)+60>>2]|0;c[e>>2]=0-b;b=-1}ha(0)}if((g|0)==(b|0)){b=13;break}if((b|0)<0){b=15;break}g=g-b|0;e=c[j+4>>2]|0;if(b>>>0<=e>>>0)if((f|0)==2){c[a+28>>2]=(c[a+28>>2]|0)+b;h=e;e=j;f=2}else{h=e;e=j}else{h=c[a+44>>2]|0;c[a+28>>2]=h;c[a+20>>2]=h;h=c[j+12>>2]|0;b=b-e|0;e=j+8|0;f=f+-1|0}c[e>>2]=(c[e>>2]|0)+b;c[e+4>>2]=h-b;j=e}if((b|0)==13){j=c[a+44>>2]|0;c[a+16>>2]=j+(c[a+48>>2]|0);c[a+28>>2]=j;c[a+20>>2]=j}else if((b|0)==15){c[a+16>>2]=0;c[a+28>>2]=0;c[a+20>>2]=0;c[a>>2]=c[a>>2]|32;if((f|0)==2)d=0;else d=d-(c[j+4>>2]|0)|0}i=k;return d|0}function qb(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=i;i=i+80|0;c[b+36>>2]=3;if((c[b>>2]&64|0)==0?(c[f>>2]=c[b+60>>2],c[f+4>>2]=21505,c[f+8>>2]=f+12,(qa(54,f|0)|0)!=0):0)a[b+75>>0]=-1;e=pb(b,d,e)|0;i=f;return e|0}function rb(a){a=a|0;var b=0,d=0;d=i;i=i+16|0;c[d>>2]=c[a+60>>2];a=ja(6,d|0)|0;if(a>>>0>4294963200){if(!(c[876]|0))b=3548;else b=c[(ia()|0)+60>>2]|0;c[b>>2]=0-a;a=-1}i=d;return a|0}function sb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;f=i;i=i+32|0;c[f>>2]=c[a+60>>2];c[f+4>>2]=0;c[f+8>>2]=b;c[f+12>>2]=f+20;c[f+16>>2]=d;b=sa(140,f|0)|0;if(b>>>0<=4294963200)if((b|0)<0)e=7;else a=c[f+20>>2]|0;else{if(!(c[876]|0))a=3548;else a=c[(ia()|0)+60>>2]|0;c[a>>2]=0-b;e=7}if((e|0)==7){c[f+20>>2]=-1;a=-1}i=f;return a|0}function tb(a){a=a|0;return}function ub(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;do if(a>>>0<245){n=a>>>0<11?16:a+11&-8;g=c[916]|0;if(g>>>(n>>>3)&3){a=(g>>>(n>>>3)&1^1)+(n>>>3)<<1;b=c[3704+(a+2<<2)>>2]|0;d=c[b+8>>2]|0;do if((3704+(a<<2)|0)!=(d|0)){if(d>>>0<(c[920]|0)>>>0)la();if((c[d+12>>2]|0)==(b|0)){c[d+12>>2]=3704+(a<<2);c[3704+(a+2<<2)>>2]=d;break}else la()}else c[916]=g&~(1<<(g>>>(n>>>3)&1^1)+(n>>>3));while(0);F=(g>>>(n>>>3)&1^1)+(n>>>3)<<3;c[b+4>>2]=F|3;c[b+(F|4)>>2]=c[b+(F|4)>>2]|1;F=b+8|0;return F|0}b=c[918]|0;if(n>>>0>b>>>0){if(g>>>(n>>>3)){a=g>>>(n>>>3)<<(n>>>3)&(2<<(n>>>3)|0-(2<<(n>>>3)));f=((a&0-a)+-1|0)>>>(((a&0-a)+-1|0)>>>12&16);e=f>>>(f>>>5&8)>>>(f>>>(f>>>5&8)>>>2&4);e=(f>>>5&8|((a&0-a)+-1|0)>>>12&16|f>>>(f>>>5&8)>>>2&4|e>>>1&2|e>>>(e>>>1&2)>>>1&1)+(e>>>(e>>>1&2)>>>(e>>>(e>>>1&2)>>>1&1))|0;f=c[3704+((e<<1)+2<<2)>>2]|0;a=c[f+8>>2]|0;do if((3704+(e<<1<<2)|0)!=(a|0)){if(a>>>0<(c[920]|0)>>>0)la();if((c[a+12>>2]|0)==(f|0)){c[a+12>>2]=3704+(e<<1<<2);c[3704+((e<<1)+2<<2)>>2]=a;h=c[918]|0;break}else la()}else{c[916]=g&~(1<<e);h=b}while(0);c[f+4>>2]=n|3;c[f+(n|4)>>2]=(e<<3)-n|1;c[f+(e<<3)>>2]=(e<<3)-n;if(h){d=c[921]|0;b=h>>>3;a=c[916]|0;if(a&1<<b){a=c[3704+((b<<1)+2<<2)>>2]|0;if(a>>>0<(c[920]|0)>>>0)la();else{i=3704+((b<<1)+2<<2)|0;j=a}}else{c[916]=a|1<<b;i=3704+((b<<1)+2<<2)|0;j=3704+(b<<1<<2)|0}c[i>>2]=d;c[j+12>>2]=d;c[d+8>>2]=j;c[d+12>>2]=3704+(b<<1<<2)}c[918]=(e<<3)-n;c[921]=f+n;F=f+8|0;return F|0}a=c[917]|0;if(a){i=((a&0-a)+-1|0)>>>(((a&0-a)+-1|0)>>>12&16);j=i>>>(i>>>5&8)>>>(i>>>(i>>>5&8)>>>2&4);j=c[3968+((i>>>5&8|((a&0-a)+-1|0)>>>12&16|i>>>(i>>>5&8)>>>2&4|j>>>1&2|j>>>(j>>>1&2)>>>1&1)+(j>>>(j>>>1&2)>>>(j>>>(j>>>1&2)>>>1&1))<<2)>>2]|0;i=(c[j+4>>2]&-8)-n|0;b=j;while(1){a=c[b+16>>2]|0;if(!a){a=c[b+20>>2]|0;if(!a)break}b=(c[a+4>>2]&-8)-n|0;F=b>>>0<i>>>0;i=F?b:i;b=a;j=F?a:j}f=c[920]|0;if(j>>>0<f>>>0)la();h=j+n|0;if(j>>>0>=h>>>0)la();g=c[j+24>>2]|0;a=c[j+12>>2]|0;do if((a|0)==(j|0)){b=j+20|0;a=c[b>>2]|0;if(!a){b=j+16|0;a=c[b>>2]|0;if(!a){k=0;break}}while(1){d=a+20|0;e=c[d>>2]|0;if(e){a=e;b=d;continue}d=a+16|0;e=c[d>>2]|0;if(!e)break;else{a=e;b=d}}if(b>>>0<f>>>0)la();else{c[b>>2]=0;k=a;break}}else{b=c[j+8>>2]|0;if(b>>>0<f>>>0)la();if((c[b+12>>2]|0)!=(j|0))la();if((c[a+8>>2]|0)==(j|0)){c[b+12>>2]=a;c[a+8>>2]=b;k=a;break}else la()}while(0);do if(g){a=c[j+28>>2]|0;if((j|0)==(c[3968+(a<<2)>>2]|0)){c[3968+(a<<2)>>2]=k;if(!k){c[917]=c[917]&~(1<<a);break}}else{if(g>>>0<(c[920]|0)>>>0)la();if((c[g+16>>2]|0)==(j|0))c[g+16>>2]=k;else c[g+20>>2]=k;if(!k)break}b=c[920]|0;if(k>>>0<b>>>0)la();c[k+24>>2]=g;a=c[j+16>>2]|0;do if(a)if(a>>>0<b>>>0)la();else{c[k+16>>2]=a;c[a+24>>2]=k;break}while(0);a=c[j+20>>2]|0;if(a)if(a>>>0<(c[920]|0)>>>0)la();else{c[k+20>>2]=a;c[a+24>>2]=k;break}}while(0);if(i>>>0<16){F=i+n|0;c[j+4>>2]=F|3;F=j+(F+4)|0;c[F>>2]=c[F>>2]|1}else{c[j+4>>2]=n|3;c[j+(n|4)>>2]=i|1;c[j+(i+n)>>2]=i;b=c[918]|0;if(b){d=c[921]|0;a=c[916]|0;if(a&1<<(b>>>3)){a=c[3704+((b>>>3<<1)+2<<2)>>2]|0;if(a>>>0<(c[920]|0)>>>0)la();else{l=3704+((b>>>3<<1)+2<<2)|0;m=a}}else{c[916]=a|1<<(b>>>3);l=3704+((b>>>3<<1)+2<<2)|0;m=3704+(b>>>3<<1<<2)|0}c[l>>2]=d;c[m+12>>2]=d;c[d+8>>2]=m;c[d+12>>2]=3704+(b>>>3<<1<<2)}c[918]=i;c[921]=h}F=j+8|0;return F|0}else i=n}else i=n}else if(a>>>0<=4294967231){k=a+11&-8;i=c[917]|0;if(i){if((a+11|0)>>>8)if(k>>>0>16777215)h=31;else{h=(a+11|0)>>>8<<((((a+11|0)>>>8)+1048320|0)>>>16&8);h=14-((h+520192|0)>>>16&4|(((a+11|0)>>>8)+1048320|0)>>>16&8|((h<<((h+520192|0)>>>16&4))+245760|0)>>>16&2)+(h<<((h+520192|0)>>>16&4)<<(((h<<((h+520192|0)>>>16&4))+245760|0)>>>16&2)>>>15)|0;h=k>>>(h+7|0)&1|h<<1}else h=0;a=c[3968+(h<<2)>>2]|0;a:do if(!a){b=0-k|0;d=0;a=0;w=86}else{b=0-k|0;d=0;f=k<<((h|0)==31?0:25-(h>>>1)|0);g=a;a=0;while(1){e=c[g+4>>2]&-8;if((e-k|0)>>>0<b>>>0)if((e|0)==(k|0)){b=e-k|0;e=g;a=g;w=90;break a}else{b=e-k|0;a=g}w=c[g+20>>2]|0;g=c[g+16+(f>>>31<<2)>>2]|0;d=(w|0)==0|(w|0)==(g|0)?d:w;if(!g){w=86;break}else f=f<<1}}while(0);if((w|0)==86){if((d|0)==0&(a|0)==0){a=2<<h;if(!((a|0-a)&i)){i=k;break}m=((a|0-a)&i&0-((a|0-a)&i))+-1|0;a=m>>>(m>>>12&16)>>>(m>>>(m>>>12&16)>>>5&8);d=a>>>(a>>>2&4)>>>(a>>>(a>>>2&4)>>>1&2);d=c[3968+((m>>>(m>>>12&16)>>>5&8|m>>>12&16|a>>>2&4|a>>>(a>>>2&4)>>>1&2|d>>>1&1)+(d>>>(d>>>1&1))<<2)>>2]|0;a=0}if(!d){i=b;j=a}else{e=d;w=90}}if((w|0)==90)while(1){w=0;m=(c[e+4>>2]&-8)-k|0;d=m>>>0<b>>>0;b=d?m:b;a=d?e:a;d=c[e+16>>2]|0;if(d){e=d;w=90;continue}e=c[e+20>>2]|0;if(!e){i=b;j=a;break}else w=90}if((j|0)!=0?i>>>0<((c[918]|0)-k|0)>>>0:0){f=c[920]|0;if(j>>>0<f>>>0)la();h=j+k|0;if(j>>>0>=h>>>0)la();g=c[j+24>>2]|0;a=c[j+12>>2]|0;do if((a|0)==(j|0)){b=j+20|0;a=c[b>>2]|0;if(!a){b=j+16|0;a=c[b>>2]|0;if(!a){n=0;break}}while(1){d=a+20|0;e=c[d>>2]|0;if(e){a=e;b=d;continue}d=a+16|0;e=c[d>>2]|0;if(!e)break;else{a=e;b=d}}if(b>>>0<f>>>0)la();else{c[b>>2]=0;n=a;break}}else{b=c[j+8>>2]|0;if(b>>>0<f>>>0)la();if((c[b+12>>2]|0)!=(j|0))la();if((c[a+8>>2]|0)==(j|0)){c[b+12>>2]=a;c[a+8>>2]=b;n=a;break}else la()}while(0);do if(g){a=c[j+28>>2]|0;if((j|0)==(c[3968+(a<<2)>>2]|0)){c[3968+(a<<2)>>2]=n;if(!n){c[917]=c[917]&~(1<<a);break}}else{if(g>>>0<(c[920]|0)>>>0)la();if((c[g+16>>2]|0)==(j|0))c[g+16>>2]=n;else c[g+20>>2]=n;if(!n)break}b=c[920]|0;if(n>>>0<b>>>0)la();c[n+24>>2]=g;a=c[j+16>>2]|0;do if(a)if(a>>>0<b>>>0)la();else{c[n+16>>2]=a;c[a+24>>2]=n;break}while(0);a=c[j+20>>2]|0;if(a)if(a>>>0<(c[920]|0)>>>0)la();else{c[n+20>>2]=a;c[a+24>>2]=n;break}}while(0);b:do if(i>>>0>=16){c[j+4>>2]=k|3;c[j+(k|4)>>2]=i|1;c[j+(i+k)>>2]=i;b=i>>>3;if(i>>>0<256){a=c[916]|0;if(a&1<<b){a=c[3704+((b<<1)+2<<2)>>2]|0;if(a>>>0<(c[920]|0)>>>0)la();else{p=3704+((b<<1)+2<<2)|0;q=a}}else{c[916]=a|1<<b;p=3704+((b<<1)+2<<2)|0;q=3704+(b<<1<<2)|0}c[p>>2]=h;c[q+12>>2]=h;c[j+(k+8)>>2]=q;c[j+(k+12)>>2]=3704+(b<<1<<2);break}a=i>>>8;if(a)if(i>>>0>16777215)e=31;else{e=a<<((a+1048320|0)>>>16&8)<<(((a<<((a+1048320|0)>>>16&8))+520192|0)>>>16&4);e=14-(((a<<((a+1048320|0)>>>16&8))+520192|0)>>>16&4|(a+1048320|0)>>>16&8|(e+245760|0)>>>16&2)+(e<<((e+245760|0)>>>16&2)>>>15)|0;e=i>>>(e+7|0)&1|e<<1}else e=0;a=3968+(e<<2)|0;c[j+(k+28)>>2]=e;c[j+(k+20)>>2]=0;c[j+(k+16)>>2]=0;b=c[917]|0;d=1<<e;if(!(b&d)){c[917]=b|d;c[a>>2]=h;c[j+(k+24)>>2]=a;c[j+(k+12)>>2]=h;c[j+(k+8)>>2]=h;break}a=c[a>>2]|0;c:do if((c[a+4>>2]&-8|0)!=(i|0)){e=i<<((e|0)==31?0:25-(e>>>1)|0);while(1){d=a+16+(e>>>31<<2)|0;b=c[d>>2]|0;if(!b)break;if((c[b+4>>2]&-8|0)==(i|0)){s=b;break c}else{e=e<<1;a=b}}if(d>>>0<(c[920]|0)>>>0)la();else{c[d>>2]=h;c[j+(k+24)>>2]=a;c[j+(k+12)>>2]=h;c[j+(k+8)>>2]=h;break b}}else s=a;while(0);a=s+8|0;b=c[a>>2]|0;F=c[920]|0;if(b>>>0>=F>>>0&s>>>0>=F>>>0){c[b+12>>2]=h;c[a>>2]=h;c[j+(k+8)>>2]=b;c[j+(k+12)>>2]=s;c[j+(k+24)>>2]=0;break}else la()}else{F=i+k|0;c[j+4>>2]=F|3;F=j+(F+4)|0;c[F>>2]=c[F>>2]|1}while(0);F=j+8|0;return F|0}else i=k}else i=k}else i=-1;while(0);d=c[918]|0;if(d>>>0>=i>>>0){a=d-i|0;b=c[921]|0;if(a>>>0>15){c[921]=b+i;c[918]=a;c[b+(i+4)>>2]=a|1;c[b+d>>2]=a;c[b+4>>2]=i|3}else{c[918]=0;c[921]=0;c[b+4>>2]=d|3;c[b+(d+4)>>2]=c[b+(d+4)>>2]|1}F=b+8|0;return F|0}a=c[919]|0;if(a>>>0>i>>>0){E=a-i|0;c[919]=E;F=c[922]|0;c[922]=F+i;c[F+(i+4)>>2]=E|1;c[F+4>>2]=i|3;F=F+8|0;return F|0}do if(!(c[1034]|0)){a=ta(30)|0;if(!(a+-1&a)){c[1036]=a;c[1035]=a;c[1037]=-1;c[1038]=-1;c[1039]=0;c[1027]=0;c[1034]=(na(0)|0)&-16^1431655768;break}else la()}while(0);f=i+48|0;e=c[1036]|0;g=i+47|0;h=e+g&0-e;if(h>>>0<=i>>>0){F=0;return F|0}a=c[1026]|0;if((a|0)!=0?(s=c[1024]|0,(s+h|0)>>>0<=s>>>0|(s+h|0)>>>0>a>>>0):0){F=0;return F|0}d:do if(!(c[1027]&4)){d=c[922]|0;e:do if(d){a=4112;while(1){b=c[a>>2]|0;if(b>>>0<=d>>>0?(o=a+4|0,(b+(c[o>>2]|0)|0)>>>0>d>>>0):0)break;a=c[a+8>>2]|0;if(!a){w=174;break e}}b=e+g-(c[919]|0)&0-e;if(b>>>0<2147483647){d=ma(b|0)|0;s=(d|0)==((c[a>>2]|0)+(c[o>>2]|0)|0);a=s?b:0;if(s){if((d|0)!=(-1|0)){q=d;p=a;w=194;break d}}else w=184}else a=0}else w=174;while(0);do if((w|0)==174){e=ma(0)|0;if((e|0)!=(-1|0)){a=c[1035]|0;if(!(a+-1&e))b=h;else b=h-e+(a+-1+e&0-a)|0;a=c[1024]|0;d=a+b|0;if(b>>>0>i>>>0&b>>>0<2147483647){s=c[1026]|0;if((s|0)!=0?d>>>0<=a>>>0|d>>>0>s>>>0:0){a=0;break}d=ma(b|0)|0;a=(d|0)==(e|0)?b:0;if((d|0)==(e|0)){q=e;p=a;w=194;break d}else w=184}else a=0}else a=0}while(0);f:do if((w|0)==184){e=0-b|0;do if(f>>>0>b>>>0&(b>>>0<2147483647&(d|0)!=(-1|0))?(r=c[1036]|0,r=g-b+r&0-r,r>>>0<2147483647):0)if((ma(r|0)|0)==(-1|0)){ma(e|0)|0;break f}else{b=r+b|0;break}while(0);if((d|0)!=(-1|0)){q=d;p=b;w=194;break d}}while(0);c[1027]=c[1027]|4;w=191}else{a=0;w=191}while(0);if((((w|0)==191?h>>>0<2147483647:0)?(t=ma(h|0)|0,u=ma(0)|0,t>>>0<u>>>0&((t|0)!=(-1|0)&(u|0)!=(-1|0))):0)?(v=(u-t|0)>>>0>(i+40|0)>>>0,v):0){q=t;p=v?u-t|0:a;w=194}if((w|0)==194){a=(c[1024]|0)+p|0;c[1024]=a;if(a>>>0>(c[1025]|0)>>>0)c[1025]=a;g=c[922]|0;g:do if(g){f=4112;while(1){a=c[f>>2]|0;b=f+4|0;d=c[b>>2]|0;if((q|0)==(a+d|0)){w=204;break}e=c[f+8>>2]|0;if(!e)break;else f=e}if(((w|0)==204?(c[f+12>>2]&8|0)==0:0)?g>>>0<q>>>0&g>>>0>=a>>>0:0){c[b>>2]=d+p;F=(c[919]|0)+p|0;E=(g+8&7|0)==0?0:0-(g+8)&7;c[922]=g+E;c[919]=F-E;c[g+(E+4)>>2]=F-E|1;c[g+(F+4)>>2]=40;c[923]=c[1038];break}a=c[920]|0;if(q>>>0<a>>>0){c[920]=q;l=q}else l=a;b=q+p|0;a=4112;while(1){if((c[a>>2]|0)==(b|0)){w=212;break}a=c[a+8>>2]|0;if(!a){a=4112;break}}if((w|0)==212)if(!(c[a+12>>2]&8)){c[a>>2]=q;n=a+4|0;c[n>>2]=(c[n>>2]|0)+p;n=q+8|0;n=(n&7|0)==0?0:0-n&7;j=q+(p+8)|0;j=(j&7|0)==0?0:0-j&7;a=q+(j+p)|0;m=n+i|0;o=q+m|0;k=a-(q+n)-i|0;c[q+(n+4)>>2]=i|3;h:do if((a|0)!=(g|0)){if((a|0)==(c[921]|0)){F=(c[918]|0)+k|0;c[918]=F;c[921]=o;c[q+(m+4)>>2]=F|1;c[q+(F+m)>>2]=F;break}h=p+4|0;i=c[q+(j+h)>>2]|0;if((i&3|0)==1){i:do if(i>>>0>=256){g=c[q+((j|24)+p)>>2]|0;b=c[q+(p+12+j)>>2]|0;do if((b|0)==(a|0)){d=q+((j|16)+h)|0;b=c[d>>2]|0;if(!b){d=q+((j|16)+p)|0;b=c[d>>2]|0;if(!b){C=0;break}}while(1){e=b+20|0;f=c[e>>2]|0;if(f){b=f;d=e;continue}e=b+16|0;f=c[e>>2]|0;if(!f)break;else{b=f;d=e}}if(d>>>0<l>>>0)la();else{c[d>>2]=0;C=b;break}}else{d=c[q+((j|8)+p)>>2]|0;if(d>>>0<l>>>0)la();if((c[d+12>>2]|0)!=(a|0))la();if((c[b+8>>2]|0)==(a|0)){c[d+12>>2]=b;c[b+8>>2]=d;C=b;break}else la()}while(0);if(!g)break;b=c[q+(p+28+j)>>2]|0;do if((a|0)!=(c[3968+(b<<2)>>2]|0)){if(g>>>0<(c[920]|0)>>>0)la();if((c[g+16>>2]|0)==(a|0))c[g+16>>2]=C;else c[g+20>>2]=C;if(!C)break i}else{c[3968+(b<<2)>>2]=C;if(C)break;c[917]=c[917]&~(1<<b);break i}while(0);b=c[920]|0;if(C>>>0<b>>>0)la();c[C+24>>2]=g;a=c[q+((j|16)+p)>>2]|0;do if(a)if(a>>>0<b>>>0)la();else{c[C+16>>2]=a;c[a+24>>2]=C;break}while(0);a=c[q+((j|16)+h)>>2]|0;if(!a)break;if(a>>>0<(c[920]|0)>>>0)la();else{c[C+20>>2]=a;c[a+24>>2]=C;break}}else{b=c[q+((j|8)+p)>>2]|0;d=c[q+(p+12+j)>>2]|0;do if((b|0)!=(3704+(i>>>3<<1<<2)|0)){if(b>>>0<l>>>0)la();if((c[b+12>>2]|0)==(a|0))break;la()}while(0);if((d|0)==(b|0)){c[916]=c[916]&~(1<<(i>>>3));break}do if((d|0)==(3704+(i>>>3<<1<<2)|0))A=d+8|0;else{if(d>>>0<l>>>0)la();if((c[d+8>>2]|0)==(a|0)){A=d+8|0;break}la()}while(0);c[b+12>>2]=d;c[A>>2]=b}while(0);a=q+((i&-8|j)+p)|0;f=(i&-8)+k|0}else f=k;b=a+4|0;c[b>>2]=c[b>>2]&-2;c[q+(m+4)>>2]=f|1;c[q+(f+m)>>2]=f;b=f>>>3;if(f>>>0<256){a=c[916]|0;do if(!(a&1<<b)){c[916]=a|1<<b;D=3704+((b<<1)+2<<2)|0;E=3704+(b<<1<<2)|0}else{a=c[3704+((b<<1)+2<<2)>>2]|0;if(a>>>0>=(c[920]|0)>>>0){D=3704+((b<<1)+2<<2)|0;E=a;break}la()}while(0);c[D>>2]=o;c[E+12>>2]=o;c[q+(m+8)>>2]=E;c[q+(m+12)>>2]=3704+(b<<1<<2);break}a=f>>>8;do if(!a)e=0;else{if(f>>>0>16777215){e=31;break}e=a<<((a+1048320|0)>>>16&8)<<(((a<<((a+1048320|0)>>>16&8))+520192|0)>>>16&4);e=14-(((a<<((a+1048320|0)>>>16&8))+520192|0)>>>16&4|(a+1048320|0)>>>16&8|(e+245760|0)>>>16&2)+(e<<((e+245760|0)>>>16&2)>>>15)|0;e=f>>>(e+7|0)&1|e<<1}while(0);a=3968+(e<<2)|0;c[q+(m+28)>>2]=e;c[q+(m+20)>>2]=0;c[q+(m+16)>>2]=0;b=c[917]|0;d=1<<e;if(!(b&d)){c[917]=b|d;c[a>>2]=o;c[q+(m+24)>>2]=a;c[q+(m+12)>>2]=o;c[q+(m+8)>>2]=o;break}a=c[a>>2]|0;j:do if((c[a+4>>2]&-8|0)!=(f|0)){e=f<<((e|0)==31?0:25-(e>>>1)|0);while(1){d=a+16+(e>>>31<<2)|0;b=c[d>>2]|0;if(!b)break;if((c[b+4>>2]&-8|0)==(f|0)){F=b;break j}else{e=e<<1;a=b}}if(d>>>0<(c[920]|0)>>>0)la();else{c[d>>2]=o;c[q+(m+24)>>2]=a;c[q+(m+12)>>2]=o;c[q+(m+8)>>2]=o;break h}}else F=a;while(0);a=F+8|0;b=c[a>>2]|0;E=c[920]|0;if(b>>>0>=E>>>0&F>>>0>=E>>>0){c[b+12>>2]=o;c[a>>2]=o;c[q+(m+8)>>2]=b;c[q+(m+12)>>2]=F;c[q+(m+24)>>2]=0;break}else la()}else{F=(c[919]|0)+k|0;c[919]=F;c[922]=o;c[q+(m+4)>>2]=F|1}while(0);F=q+(n|8)|0;return F|0}else a=4112;while(1){b=c[a>>2]|0;if(b>>>0<=g>>>0?(x=c[a+4>>2]|0,(b+x|0)>>>0>g>>>0):0)break;a=c[a+8>>2]|0}f=b+(x+-47+((b+(x+-39)&7|0)==0?0:0-(b+(x+-39))&7))|0;f=f>>>0<(g+16|0)>>>0?g:f;F=q+8|0;F=(F&7|0)==0?0:0-F&7;E=p+-40-F|0;c[922]=q+F;c[919]=E;c[q+(F+4)>>2]=E|1;c[q+(p+-36)>>2]=40;c[923]=c[1038];c[f+4>>2]=27;c[f+8>>2]=c[1028];c[f+8+4>>2]=c[1029];c[f+8+8>>2]=c[1030];c[f+8+12>>2]=c[1031];c[1028]=q;c[1029]=p;c[1031]=0;c[1030]=f+8;c[f+28>>2]=7;if((f+32|0)>>>0<(b+x|0)>>>0){a=f+28|0;do{F=a;a=a+4|0;c[a>>2]=7}while((F+8|0)>>>0<(b+x|0)>>>0)}if((f|0)!=(g|0)){c[f+4>>2]=c[f+4>>2]&-2;c[g+4>>2]=f-g|1;c[f>>2]=f-g;if((f-g|0)>>>0<256){a=c[916]|0;if(a&1<<((f-g|0)>>>3)){a=c[3704+(((f-g|0)>>>3<<1)+2<<2)>>2]|0;if(a>>>0<(c[920]|0)>>>0)la();else{y=3704+(((f-g|0)>>>3<<1)+2<<2)|0;z=a}}else{c[916]=a|1<<((f-g|0)>>>3);y=3704+(((f-g|0)>>>3<<1)+2<<2)|0;z=3704+((f-g|0)>>>3<<1<<2)|0}c[y>>2]=g;c[z+12>>2]=g;c[g+8>>2]=z;c[g+12>>2]=3704+((f-g|0)>>>3<<1<<2);break}if((f-g|0)>>>8)if((f-g|0)>>>0>16777215)e=31;else{e=(f-g|0)>>>8<<((((f-g|0)>>>8)+1048320|0)>>>16&8);e=14-((e+520192|0)>>>16&4|(((f-g|0)>>>8)+1048320|0)>>>16&8|((e<<((e+520192|0)>>>16&4))+245760|0)>>>16&2)+(e<<((e+520192|0)>>>16&4)<<(((e<<((e+520192|0)>>>16&4))+245760|0)>>>16&2)>>>15)|0;e=(f-g|0)>>>(e+7|0)&1|e<<1}else e=0;a=3968+(e<<2)|0;c[g+28>>2]=e;c[g+20>>2]=0;c[g+16>>2]=0;b=c[917]|0;d=1<<e;if(!(b&d)){c[917]=b|d;c[a>>2]=g;c[g+24>>2]=a;c[g+12>>2]=g;c[g+8>>2]=g;break}a=c[a>>2]|0;k:do if((c[a+4>>2]&-8|0)!=(f-g|0)){e=f-g<<((e|0)==31?0:25-(e>>>1)|0);while(1){d=a+16+(e>>>31<<2)|0;b=c[d>>2]|0;if(!b)break;if((c[b+4>>2]&-8|0)==(f-g|0)){B=b;break k}else{e=e<<1;a=b}}if(d>>>0<(c[920]|0)>>>0)la();else{c[d>>2]=g;c[g+24>>2]=a;c[g+12>>2]=g;c[g+8>>2]=g;break g}}else B=a;while(0);a=B+8|0;b=c[a>>2]|0;F=c[920]|0;if(b>>>0>=F>>>0&B>>>0>=F>>>0){c[b+12>>2]=g;c[a>>2]=g;c[g+8>>2]=b;c[g+12>>2]=B;c[g+24>>2]=0;break}else la()}}else{F=c[920]|0;if((F|0)==0|q>>>0<F>>>0)c[920]=q;c[1028]=q;c[1029]=p;c[1031]=0;c[925]=c[1034];c[924]=-1;a=0;do{F=a<<1;c[3704+(F+3<<2)>>2]=3704+(F<<2);c[3704+(F+2<<2)>>2]=3704+(F<<2);a=a+1|0}while((a|0)!=32);F=q+8|0;F=(F&7|0)==0?0:0-F&7;E=p+-40-F|0;c[922]=q+F;c[919]=E;c[q+(F+4)>>2]=E|1;c[q+(p+-36)>>2]=40;c[923]=c[1038]}while(0);a=c[919]|0;if(a>>>0>i>>>0){E=a-i|0;c[919]=E;F=c[922]|0;c[922]=F+i;c[F+(i+4)>>2]=E|1;c[F+4>>2]=i|3;F=F+8|0;return F|0}}if(!(c[876]|0))a=3548;else a=c[(ia()|0)+60>>2]|0;c[a>>2]=12;F=0;return F|0}function vb(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;if(!a)return;i=c[920]|0;if((a+-8|0)>>>0<i>>>0)la();p=c[a+-4>>2]|0;if((p&3|0)==1)la();o=a+((p&-8)+-8)|0;do if(!(p&1)){k=c[a+-8>>2]|0;if(!(p&3))return;l=a+(-8-k)|0;m=k+(p&-8)|0;if(l>>>0<i>>>0)la();if((l|0)==(c[921]|0)){b=c[a+((p&-8)+-4)>>2]|0;if((b&3|0)!=3){t=l;g=m;break}c[918]=m;c[a+((p&-8)+-4)>>2]=b&-2;c[a+(-8-k+4)>>2]=m|1;c[o>>2]=m;return}if(k>>>0<256){b=c[a+(-8-k+8)>>2]|0;d=c[a+(-8-k+12)>>2]|0;if((b|0)!=(3704+(k>>>3<<1<<2)|0)){if(b>>>0<i>>>0)la();if((c[b+12>>2]|0)!=(l|0))la()}if((d|0)==(b|0)){c[916]=c[916]&~(1<<(k>>>3));t=l;g=m;break}if((d|0)!=(3704+(k>>>3<<1<<2)|0)){if(d>>>0<i>>>0)la();if((c[d+8>>2]|0)!=(l|0))la();else e=d+8|0}else e=d+8|0;c[b+12>>2]=d;c[e>>2]=b;t=l;g=m;break}h=c[a+(-8-k+24)>>2]|0;b=c[a+(-8-k+12)>>2]|0;do if((b|0)==(l|0)){b=c[a+(-8-k+20)>>2]|0;if(!b){b=c[a+(-8-k+16)>>2]|0;if(!b){j=0;break}else f=a+(-8-k+16)|0}else f=a+(-8-k+20)|0;while(1){d=b+20|0;e=c[d>>2]|0;if(e){b=e;f=d;continue}d=b+16|0;e=c[d>>2]|0;if(!e)break;else{b=e;f=d}}if(f>>>0<i>>>0)la();else{c[f>>2]=0;j=b;break}}else{d=c[a+(-8-k+8)>>2]|0;if(d>>>0<i>>>0)la();if((c[d+12>>2]|0)!=(l|0))la();if((c[b+8>>2]|0)==(l|0)){c[d+12>>2]=b;c[b+8>>2]=d;j=b;break}else la()}while(0);if(h){b=c[a+(-8-k+28)>>2]|0;if((l|0)==(c[3968+(b<<2)>>2]|0)){c[3968+(b<<2)>>2]=j;if(!j){c[917]=c[917]&~(1<<b);t=l;g=m;break}}else{if(h>>>0<(c[920]|0)>>>0)la();if((c[h+16>>2]|0)==(l|0))c[h+16>>2]=j;else c[h+20>>2]=j;if(!j){t=l;g=m;break}}d=c[920]|0;if(j>>>0<d>>>0)la();c[j+24>>2]=h;b=c[a+(-8-k+16)>>2]|0;do if(b)if(b>>>0<d>>>0)la();else{c[j+16>>2]=b;c[b+24>>2]=j;break}while(0);b=c[a+(-8-k+20)>>2]|0;if(b)if(b>>>0<(c[920]|0)>>>0)la();else{c[j+20>>2]=b;c[b+24>>2]=j;t=l;g=m;break}else{t=l;g=m}}else{t=l;g=m}}else{t=a+-8|0;g=p&-8}while(0);if(t>>>0>=o>>>0)la();e=c[a+((p&-8)+-4)>>2]|0;if(!(e&1))la();if(!(e&2)){if((o|0)==(c[922]|0)){u=(c[919]|0)+g|0;c[919]=u;c[922]=t;c[t+4>>2]=u|1;if((t|0)!=(c[921]|0))return;c[921]=0;c[918]=0;return}if((o|0)==(c[921]|0)){u=(c[918]|0)+g|0;c[918]=u;c[921]=t;c[t+4>>2]=u|1;c[t+u>>2]=u;return}g=(e&-8)+g|0;do if(e>>>0>=256){h=c[a+((p&-8)+16)>>2]|0;b=c[a+(p&-8|4)>>2]|0;do if((b|0)==(o|0)){b=c[a+((p&-8)+12)>>2]|0;if(!b){b=c[a+((p&-8)+8)>>2]|0;if(!b){q=0;break}else f=a+((p&-8)+8)|0}else f=a+((p&-8)+12)|0;while(1){d=b+20|0;e=c[d>>2]|0;if(e){b=e;f=d;continue}d=b+16|0;e=c[d>>2]|0;if(!e)break;else{b=e;f=d}}if(f>>>0<(c[920]|0)>>>0)la();else{c[f>>2]=0;q=b;break}}else{d=c[a+(p&-8)>>2]|0;if(d>>>0<(c[920]|0)>>>0)la();if((c[d+12>>2]|0)!=(o|0))la();if((c[b+8>>2]|0)==(o|0)){c[d+12>>2]=b;c[b+8>>2]=d;q=b;break}else la()}while(0);if(h){b=c[a+((p&-8)+20)>>2]|0;if((o|0)==(c[3968+(b<<2)>>2]|0)){c[3968+(b<<2)>>2]=q;if(!q){c[917]=c[917]&~(1<<b);break}}else{if(h>>>0<(c[920]|0)>>>0)la();if((c[h+16>>2]|0)==(o|0))c[h+16>>2]=q;else c[h+20>>2]=q;if(!q)break}d=c[920]|0;if(q>>>0<d>>>0)la();c[q+24>>2]=h;b=c[a+((p&-8)+8)>>2]|0;do if(b)if(b>>>0<d>>>0)la();else{c[q+16>>2]=b;c[b+24>>2]=q;break}while(0);b=c[a+((p&-8)+12)>>2]|0;if(b)if(b>>>0<(c[920]|0)>>>0)la();else{c[q+20>>2]=b;c[b+24>>2]=q;break}}}else{d=c[a+(p&-8)>>2]|0;b=c[a+(p&-8|4)>>2]|0;if((d|0)!=(3704+(e>>>3<<1<<2)|0)){if(d>>>0<(c[920]|0)>>>0)la();if((c[d+12>>2]|0)!=(o|0))la()}if((b|0)==(d|0)){c[916]=c[916]&~(1<<(e>>>3));break}if((b|0)!=(3704+(e>>>3<<1<<2)|0)){if(b>>>0<(c[920]|0)>>>0)la();if((c[b+8>>2]|0)!=(o|0))la();else n=b+8|0}else n=b+8|0;c[d+12>>2]=b;c[n>>2]=d}while(0);c[t+4>>2]=g|1;c[t+g>>2]=g;if((t|0)==(c[921]|0)){c[918]=g;return}}else{c[a+((p&-8)+-4)>>2]=e&-2;c[t+4>>2]=g|1;c[t+g>>2]=g}d=g>>>3;if(g>>>0<256){b=c[916]|0;if(b&1<<d){b=c[3704+((d<<1)+2<<2)>>2]|0;if(b>>>0<(c[920]|0)>>>0)la();else{r=3704+((d<<1)+2<<2)|0;s=b}}else{c[916]=b|1<<d;r=3704+((d<<1)+2<<2)|0;s=3704+(d<<1<<2)|0}c[r>>2]=t;c[s+12>>2]=t;c[t+8>>2]=s;c[t+12>>2]=3704+(d<<1<<2);return}b=g>>>8;if(b)if(g>>>0>16777215)f=31;else{f=b<<((b+1048320|0)>>>16&8)<<(((b<<((b+1048320|0)>>>16&8))+520192|0)>>>16&4);f=14-(((b<<((b+1048320|0)>>>16&8))+520192|0)>>>16&4|(b+1048320|0)>>>16&8|(f+245760|0)>>>16&2)+(f<<((f+245760|0)>>>16&2)>>>15)|0;f=g>>>(f+7|0)&1|f<<1}else f=0;b=3968+(f<<2)|0;c[t+28>>2]=f;c[t+20>>2]=0;c[t+16>>2]=0;d=c[917]|0;e=1<<f;a:do if(d&e){b=c[b>>2]|0;b:do if((c[b+4>>2]&-8|0)!=(g|0)){f=g<<((f|0)==31?0:25-(f>>>1)|0);while(1){e=b+16+(f>>>31<<2)|0;d=c[e>>2]|0;if(!d)break;if((c[d+4>>2]&-8|0)==(g|0)){u=d;break b}else{f=f<<1;b=d}}if(e>>>0<(c[920]|0)>>>0)la();else{c[e>>2]=t;c[t+24>>2]=b;c[t+12>>2]=t;c[t+8>>2]=t;break a}}else u=b;while(0);b=u+8|0;d=c[b>>2]|0;s=c[920]|0;if(d>>>0>=s>>>0&u>>>0>=s>>>0){c[d+12>>2]=t;c[b>>2]=t;c[t+8>>2]=d;c[t+12>>2]=u;c[t+24>>2]=0;break}else la()}else{c[917]=d|e;c[b>>2]=t;c[t+24>>2]=b;c[t+12>>2]=t;c[t+8>>2]=t}while(0);u=(c[924]|0)+-1|0;c[924]=u;if(!u)b=4120;else return;while(1){b=c[b>>2]|0;if(!b)break;else b=b+8|0}c[924]=-1;return}function wb(){}function xb(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;g=b&3;h=d|d<<8|d<<16|d<<24;if(g){g=b+4-g|0;while((b|0)<(g|0)){a[b>>0]=d;b=b+1|0}}while((b|0)<(f&~3|0)){c[b>>2]=h;b=b+4|0}}while((b|0)<(f|0)){a[b>>0]=d;b=b+1|0}return b-e|0}function yb(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((e|0)>=4096)return pa(b|0,d|0,e|0)|0;f=b|0;if((b&3)==(d&3)){while(b&3){if(!e)return f|0;a[b>>0]=a[d>>0]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b>>0]=a[d>>0]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function zb(a,b){a=a|0;b=b|0;return wa[a&1](b|0)|0}function Ab(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return xa[a&3](b|0,c|0,d|0)|0}function Bb(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ya[a&3](b|0,c|0,d|0,e|0,f|0)}function Cb(a,b){a=a|0;b=b|0;za[a&1](b|0)}function Db(a){a=a|0;aa(0);return 0}function Eb(a,b,c){a=a|0;b=b|0;c=c|0;aa(1);return 0}function Fb(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;aa(2)}function Gb(a){a=a|0;aa(3)}
function fb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;l=c[b+4>>2]|0;m=c[b+8>>2]|0;switch(d|0){case 0:case 5:{e=3;break}default:if(!(c[a+3384>>2]|0))k=0;else e=3}if((e|0)==3){f=c[a+1224>>2]|0;g=0;do{e=c[f+(g<<2)>>2]|0;if((e|0)!=0?(c[e+20>>2]|0)>>>0>1:0)e=c[e>>2]|0;else e=0;g=g+1|0}while(g>>>0<16&(e|0)==0);k=e}i=c[a+1176>>2]|0;a:do if(!i){f=0;g=0;e=0}else{h=c[a+1212>>2]|0;f=0;g=0;e=0;do{if(c[h+(g*216|0)+196>>2]|0)break a;g=g+1|0;f=f+1|0;e=((f|0)==(l|0)&1)+e|0;f=(f|0)==(l|0)?0:f}while(g>>>0<i>>>0)}while(0);if((g|0)==(i|0)){switch(d|0){case 2:case 7:{if((k|0)==0|(c[a+3384>>2]|0)==0)e=16;else e=17;break}default:if(!k)e=16;else e=17}if((e|0)==16)xb(c[b>>2]|0,-128,Z(l*384|0,m)|0)|0;else if((e|0)==17)yb(c[b>>2]|0,k|0,Z(l*384|0,m)|0)|0;g=c[a+1176>>2]|0;c[a+1204>>2]=g;if(!g)return;e=c[a+1212>>2]|0;f=0;do{c[e+(f*216|0)+8>>2]=1;f=f+1|0}while((f|0)!=(g|0));return}h=c[a+1212>>2]|0;i=Z(e,l)|0;if(f){g=f;do{g=g+-1|0;j=g+i|0;gb(h+(j*216|0)|0,b,e,g,d,k);c[h+(j*216|0)+196>>2]=1;c[a+1204>>2]=(c[a+1204>>2]|0)+1}while((g|0)!=0)}f=f+1|0;if(f>>>0<l>>>0)do{g=f+i|0;if(!(c[h+(g*216|0)+196>>2]|0)){gb(h+(g*216|0)|0,b,e,f,d,k);c[h+(g*216|0)+196>>2]=1;c[a+1204>>2]=(c[a+1204>>2]|0)+1}f=f+1|0}while((f|0)!=(l|0));if(e){if(l){f=e+-1|0;g=Z(f,l)|0;i=0;do{h=f;j=(c[a+1212>>2]|0)+((i+g|0)*216|0)|0;while(1){gb(j,b,h,i,d,k);c[j+196>>2]=1;c[a+1204>>2]=(c[a+1204>>2]|0)+1;if(!h)break;else{h=h+-1|0;j=j+((0-l|0)*216|0)|0}}i=i+1|0}while((i|0)!=(l|0))}}else e=0;e=e+1|0;if(e>>>0>=m>>>0)return;if(!l)return;do{h=c[a+1212>>2]|0;g=Z(e,l)|0;i=0;do{f=i+g|0;if(!(c[h+(f*216|0)+196>>2]|0)){gb(h+(f*216|0)|0,b,e,i,d,k);c[h+(f*216|0)+196>>2]=1;c[a+1204>>2]=(c[a+1204>>2]|0)+1}i=i+1|0}while((i|0)!=(l|0));e=e+1|0}while((e|0)!=(m|0));return}function gb(b,e,f,g,h,j){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0;R=i;i=i+480|0;P=c[e+4>>2]|0;k=c[e+8>>2]|0;n=(Z(P,f)|0)+g|0;Q=Z(k,P)|0;r=c[e>>2]|0;c[e+12>>2]=r+((n-((n>>>0)%(P>>>0)|0)<<8)+(((n>>>0)%(P>>>0)|0)<<4));n=(((n>>>0)%(P>>>0)|0)<<3)+(Q<<8)+(n-((n>>>0)%(P>>>0)|0)<<6)|0;c[e+16>>2]=r+n;c[e+20>>2]=r+(n+(Q<<6));n=(Z(f<<8,P)|0)+(g<<4)|0;c[b+20>>2]=40;c[b+8>>2]=0;c[b>>2]=6;c[b+12>>2]=0;c[b+16>>2]=0;c[b+24>>2]=0;a:do switch(h|0){case 2:case 7:{xb(R+96|0,0,384)|0;break}default:{c[R+24>>2]=0;c[R+4>>2]=P;c[R+8>>2]=k;c[R>>2]=j;if(!j){xb(R+96|0,0,384)|0;break a}Wa(R+96|0,R+24|0,R,g<<4,f<<4,0,0,16,16);$a(e,R+96|0);i=R;return}}while(0);j=R+32|0;h=j+64|0;do{c[j>>2]=0;j=j+4|0}while((j|0)<(h|0));if((f|0)!=0?(c[b+((0-P|0)*216|0)+196>>2]|0)!=0:0){z=n-(P<<4)|3;w=(d[r+(n-(P<<4)|1)>>0]|0)+(d[r+(n-(P<<4))>>0]|0)+(d[r+((n-(P<<4)|1)+1)>>0]|0)+(d[r+z>>0]|0)|0;C=n-(P<<4)|7;z=(d[r+(z+2)>>0]|0)+(d[r+(z+1)>>0]|0)+(d[r+(z+3)>>0]|0)+(d[r+C>>0]|0)|0;A=(d[r+(C+2)>>0]|0)+(d[r+(C+1)>>0]|0)+(d[r+(C+3)>>0]|0)+(d[r+(C+4)>>0]|0)|0;C=(d[r+(C+6)>>0]|0)+(d[r+(C+5)>>0]|0)+(d[r+(C+7)>>0]|0)+(d[r+(n-(P<<4)|15)>>0]|0)|0;c[R+32>>2]=A+(z+w)+C;c[R+32+4>>2]=z+w-A-C;j=A+(z+w)+C|0;h=z+w-A-C|0;y=1}else{j=0;h=0;w=0;z=0;A=0;C=0;y=0}if((k+-1|0)!=(f|0)?(c[b+(P*216|0)+196>>2]|0)!=0:0){B=n+(P<<8)|3;u=(d[r+(n+(P<<8)|1)>>0]|0)+(d[r+(n+(P<<8))>>0]|0)+(d[r+((n+(P<<8)|1)+1)>>0]|0)+(d[r+B>>0]|0)|0;E=n+(P<<8)|7;B=(d[r+(B+2)>>0]|0)+(d[r+(B+1)>>0]|0)+(d[r+(B+3)>>0]|0)+(d[r+E>>0]|0)|0;D=(d[r+(E+2)>>0]|0)+(d[r+(E+1)>>0]|0)+(d[r+(E+3)>>0]|0)+(d[r+(E+4)>>0]|0)|0;E=(d[r+(E+6)>>0]|0)+(d[r+(E+5)>>0]|0)+(d[r+(E+7)>>0]|0)+(d[r+(n+(P<<8)|15)>>0]|0)|0;j=D+(B+u)+j+E|0;c[R+32>>2]=j;h=B+u-D-E+h|0;c[R+32+4>>2]=h;x=1;s=y+1|0}else{x=0;u=0;B=0;D=0;E=0;s=y}if((g|0)!=0?(c[b+-20>>2]|0)!=0:0){v=(d[r+(n+-1+(P<<4))>>0]|0)+(d[r+(n+-1)>>0]|0)+(d[r+(n+-1+(P<<5))>>0]|0)+(d[r+(n+-1+(P*48|0))>>0]|0)|0;I=n+-1+(P<<6)|0;F=(d[r+(I+(P<<4))>>0]|0)+(d[r+I>>0]|0)+(d[r+(I+(P<<5))>>0]|0)+(d[r+(I+(P*48|0))>>0]|0)|0;G=(d[r+(I+(P<<6)+(P<<4))>>0]|0)+(d[r+(I+(P<<6))>>0]|0)+(d[r+(I+(P<<6)+(P<<5))>>0]|0)+(d[r+(I+(P<<6)+(P*48|0))>>0]|0)|0;I=I+(P<<6)+(P<<6)|0;I=(d[r+(I+(P<<4))>>0]|0)+(d[r+I>>0]|0)+(d[r+(I+(P<<5))>>0]|0)+(d[r+(I+(P*48|0))>>0]|0)|0;j=G+(F+v)+j+I|0;c[R+32>>2]=j;c[R+32+16>>2]=F+v-G-I;l=F+v-G-I|0;m=s+1|0;t=1}else{l=0;m=s;v=0;F=0;G=0;I=0;t=0}do if((P+-1|0)!=(g|0)?(c[b+412>>2]|0)!=0:0){q=(d[r+(n+16+(P<<4))>>0]|0)+(d[r+(n+16)>>0]|0)+(d[r+(n+16+(P<<5))>>0]|0)+(d[r+(n+16+(P*48|0))>>0]|0)|0;n=n+16+(P<<6)|0;o=(d[r+(n+(P<<4))>>0]|0)+(d[r+n>>0]|0)+(d[r+(n+(P<<5))>>0]|0)+(d[r+(n+(P*48|0))>>0]|0)|0;p=(d[r+(n+(P<<6)+(P<<4))>>0]|0)+(d[r+(n+(P<<6))>>0]|0)+(d[r+(n+(P<<6)+(P<<5))>>0]|0)+(d[r+(n+(P<<6)+(P*48|0))>>0]|0)|0;n=n+(P<<6)+(P<<6)|0;n=(d[r+(n+(P<<4))>>0]|0)+(d[r+n>>0]|0)+(d[r+(n+(P<<5))>>0]|0)+(d[r+(n+(P*48|0))>>0]|0)|0;r=m+1|0;k=t+1|0;j=p+(o+q)+j+n|0;c[R+32>>2]=j;l=o+q-p-n+l|0;c[R+32+16>>2]=l;b=(s|0)==0;m=(t|0)!=0;if(!(b&m)){if(!b){b=m;n=1;m=r;r=21;break}}else c[R+32+4>>2]=G+I+F+v-q-o-p-n>>5;p=R+32+16|0;o=m;m=(y|0)!=0;n=(x|0)!=0;b=1;h=r;r=27}else r=17;while(0);if((r|0)==17){k=(t|0)!=0;if(!s){o=k;q=0;h=m;k=t;r=23}else{b=k;n=0;k=t;r=21}}if((r|0)==21){c[R+32+4>>2]=h>>s+3;o=b;q=n;h=m;r=23}do if((r|0)==23){b=(k|0)==0;m=(y|0)!=0;n=(x|0)!=0;if(n&(m&b)){c[R+32+16>>2]=A+C+z+w-E-D-B-u>>5;O=o;m=1;n=1;N=q;break}if(b){O=o;N=q}else{p=R+32+16|0;b=q;r=27}}while(0);if((r|0)==27){c[p>>2]=l>>k+3;O=o;N=b}switch(h|0){case 1:{k=j>>4;c[R+32>>2]=k;break}case 2:{k=j>>5;c[R+32>>2]=k;break}case 3:{k=j*21>>10;c[R+32>>2]=k;break}default:{k=j>>6;c[R+32>>2]=k}}L=R+32+4|0;j=c[L>>2]|0;M=R+32+16|0;h=c[M>>2]|0;if(!(h|j)){c[R+32+60>>2]=k;c[R+32+56>>2]=k;c[R+32+52>>2]=k;c[R+32+48>>2]=k;c[R+32+44>>2]=k;c[R+32+40>>2]=k;c[R+32+36>>2]=k;c[R+32+32>>2]=k;c[R+32+28>>2]=k;c[R+32+24>>2]=k;c[R+32+20>>2]=k;c[M>>2]=k;c[R+32+12>>2]=k;c[R+32+8>>2]=k;c[L>>2]=k;h=0;k=R+96|0;b=R+32|0}else{J=j+k|0;K=(j>>1)+k|0;b=k-(j>>1)|0;k=k-j|0;c[R+32>>2]=J+h;c[M>>2]=(h>>1)+J;c[R+32+32>>2]=J-(h>>1);c[R+32+48>>2]=J-h;c[L>>2]=K+h;c[R+32+20>>2]=K+(h>>1);c[R+32+36>>2]=K-(h>>1);c[R+32+52>>2]=K-h;c[R+32+8>>2]=b+h;c[R+32+24>>2]=b+(h>>1);c[R+32+40>>2]=b-(h>>1);c[R+32+56>>2]=b-h;c[R+32+12>>2]=k+h;c[R+32+28>>2]=(h>>1)+k;c[R+32+44>>2]=k-(h>>1);c[R+32+60>>2]=k-h;h=0;k=R+96|0;b=R+32|0}while(1){j=c[b+((h>>>2&3)<<2)>>2]|0;a[k>>0]=(j|0)<0?0:(j|0)>255?-1:j&255;j=h+1|0;if((j|0)==256)break;else{h=j;k=k+1|0;b=(j&63|0)==0?b+16|0:b}}K=0-(P<<3)|3;J=(P<<4)+-1+(P<<4)|0;t=z;b=A;k=C;r=B;o=D;l=E;H=0;s=F;q=G;p=I;G=(c[e>>2]|0)+((Z(f<<6,P)|0)+(g<<3)+(Q<<8))|0;while(1){j=R+32|0;h=j+64|0;do{c[j>>2]=0;j=j+4|0}while((j|0)<(h|0));if(m){w=(d[G+(0-(P<<3)|1)>>0]|0)+(d[G+(0-(P<<3))>>0]|0)|0;D=(d[G+K>>0]|0)+(d[G+((0-(P<<3)|1)+1)>>0]|0)|0;E=(d[G+(K+2)>>0]|0)+(d[G+(K+1)>>0]|0)|0;F=(d[G+(0-(P<<3)|7)>>0]|0)+(d[G+(K+3)>>0]|0)|0;c[R+32>>2]=E+(D+w)+F;c[L>>2]=D+w-E-F;j=E+(D+w)+F|0;h=D+w-E-F|0;b=1}else{j=0;h=0;D=t;E=b;F=k;b=0}if(n){u=(d[G+(P<<6|1)>>0]|0)+(d[G+(P<<6)>>0]|0)|0;A=(d[G+(P<<6|3)>>0]|0)+(d[G+((P<<6|1)+1)>>0]|0)|0;B=(d[G+((P<<6|3)+2)>>0]|0)+(d[G+((P<<6|3)+1)>>0]|0)|0;C=(d[G+(P<<6|7)>>0]|0)+(d[G+((P<<6|3)+3)>>0]|0)|0;j=B+(A+u)+j+C|0;c[R+32>>2]=j;k=A+u-B-C+h|0;c[L>>2]=k;b=b+1|0}else{k=h;A=r;B=o;C=l}if(O){v=(d[G+((P<<3)+-1)>>0]|0)+(d[G+-1>>0]|0)|0;x=(d[G+((P<<4)+-1+(P<<3))>>0]|0)+(d[G+((P<<4)+-1)>>0]|0)|0;y=(d[G+(J+(P<<3))>>0]|0)+(d[G+J>>0]|0)|0;z=(d[G+(J+(P<<4)+(P<<3))>>0]|0)+(d[G+(J+(P<<4))>>0]|0)|0;o=y+(x+v)+j+z|0;c[R+32>>2]=o;c[M>>2]=x+v-y-z;l=x+v-y-z|0;j=b+1|0;h=1}else{o=j;l=0;j=b;x=s;y=q;z=p;h=0}do if(N){p=(d[G+((P<<3)+8)>>0]|0)+(d[G+8>>0]|0)|0;q=(d[G+((P<<4|8)+(P<<3))>>0]|0)+(d[G+(P<<4|8)>>0]|0)|0;r=(d[G+((P<<4|8)+(P<<4)+(P<<3))>>0]|0)+(d[G+((P<<4|8)+(P<<4))>>0]|0)|0;s=(d[G+((P<<4|8)+(P<<4)+(P<<4)+(P<<3))>>0]|0)+(d[G+((P<<4|8)+(P<<4)+(P<<4))>>0]|0)|0;j=j+1|0;h=h+1|0;t=r+(q+p)+o+s|0;c[R+32>>2]=t;l=q+p-r-s+l|0;c[M>>2]=l;o=(b|0)==0;if(!(O&o))if(o){b=t;r=53;break}else{o=t;r=49;break}else{k=y+z+x+v-p-q-r-s>>4;c[L>>2]=k;b=t;r=53;break}}else if(!b){p=k;b=o;r=50}else r=49;while(0);if((r|0)==49){p=k>>b+2;c[L>>2]=p;b=o;r=50}do if((r|0)==50){r=0;k=(h|0)==0;if(!(n&(m&k)))if(k){k=p;h=l;break}else{k=p;r=53;break}else{h=E+F+D+w-C-B-A-u>>4;c[M>>2]=h;k=p;break}}while(0);if((r|0)==53){h=l>>h+2;c[M>>2]=h}switch(j|0){case 1:{j=b>>3;c[R+32>>2]=j;break}case 2:{j=b>>4;c[R+32>>2]=j;break}case 3:{j=b*21>>9;c[R+32>>2]=j;break}default:{j=b>>5;c[R+32>>2]=j}}if(!(h|k)){c[R+32+60>>2]=j;c[R+32+56>>2]=j;c[R+32+52>>2]=j;c[R+32+48>>2]=j;c[R+32+44>>2]=j;c[R+32+40>>2]=j;c[R+32+36>>2]=j;c[R+32+32>>2]=j;c[R+32+28>>2]=j;c[R+32+24>>2]=j;c[R+32+20>>2]=j;c[M>>2]=j;c[R+32+12>>2]=j;c[R+32+8>>2]=j;c[L>>2]=j}else{s=k+j|0;I=k>>1;t=I+j|0;I=j-I|0;f=j-k|0;c[R+32>>2]=s+h;g=h>>1;c[M>>2]=g+s;c[R+32+32>>2]=s-g;c[R+32+48>>2]=s-h;c[L>>2]=t+h;c[R+32+20>>2]=t+g;c[R+32+36>>2]=t-g;c[R+32+52>>2]=t-h;c[R+32+8>>2]=I+h;c[R+32+24>>2]=I+g;c[R+32+40>>2]=I-g;c[R+32+56>>2]=I-h;c[R+32+12>>2]=f+h;c[R+32+28>>2]=g+f;c[R+32+44>>2]=f-g;c[R+32+60>>2]=f-h}h=0;k=R+96+((H<<6)+256)|0;b=R+32|0;while(1){j=c[b+((h>>>1&3)<<2)>>2]|0;a[k>>0]=(j|0)<0?0:(j|0)>255?-1:j&255;j=h+1|0;if((j|0)==64)break;else{h=j;k=k+1|0;b=(j&15|0)==0?b+16|0:b}}H=H+1|0;if((H|0)==2)break;else{t=D;b=E;k=F;r=A;o=B;l=C;s=x;q=y;p=z;G=G+(Q<<6)|0}}$a(e,R+96|0);i=R;return}function hb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=Na(a,b)|0;if(d){b=d;return b|0}f=(c[b>>2]|0)+1|0;c[b>>2]=f;if(f>>>0>32){b=1;return b|0}d=Ma(a,4)|0;if((d|0)==-1){b=1;return b|0}c[b+4>>2]=d;d=Ma(a,4)|0;if((d|0)==-1){b=1;return b|0}c[b+8>>2]=d;a:do if(c[b>>2]|0){f=0;while(1){e=b+12+(f<<2)|0;d=Na(a,e)|0;if(d){e=17;break}d=c[e>>2]|0;if((d|0)==-1){d=1;e=17;break}c[e>>2]=d+1;c[e>>2]=d+1<<(c[b+4>>2]|0)+6;e=b+140+(f<<2)|0;d=Na(a,e)|0;if(d){e=17;break}d=c[e>>2]|0;if((d|0)==-1){d=1;e=17;break}c[e>>2]=d+1;c[e>>2]=d+1<<(c[b+8>>2]|0)+4;d=Ma(a,1)|0;if((d|0)==-1){d=1;e=17;break}c[b+268+(f<<2)>>2]=(d|0)==1&1;f=f+1|0;if(f>>>0>=(c[b>>2]|0)>>>0)break a}if((e|0)==17)return d|0}while(0);d=Ma(a,5)|0;if((d|0)==-1){b=1;return b|0}c[b+396>>2]=d+1;d=Ma(a,5)|0;if((d|0)==-1){b=1;return b|0}c[b+400>>2]=d+1;d=Ma(a,5)|0;if((d|0)==-1){b=1;return b|0}c[b+404>>2]=d+1;d=Ma(a,5)|0;if((d|0)==-1){b=1;return b|0}c[b+408>>2]=d;b=0;return b|0}

// EMSCRIPTEN_END_FUNCS
var wa=[Db,rb];var xa=[Eb,qb,sb,pb];var ya=[Fb,Ya,Xa,Fb];var za=[Gb,tb];return{_free:vb,_broadwayGetMajorVersion:nb,_broadwayExit:mb,_memset:xb,_broadwayCreateStream:jb,_malloc:ub,_memcpy:yb,_broadwayGetMinorVersion:ob,_broadwayPlayStream:kb,_broadwayInit:lb,runPostSets:wb,stackAlloc:Aa,stackSave:Ba,stackRestore:Ca,establishStackSpace:Da,setThrew:Ea,setTempRet0:Ha,getTempRet0:Ia,dynCall_ii:zb,dynCall_iiii:Ab,dynCall_viiiii:Bb,dynCall_vi:Cb}})


// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg,Module.asmLibraryArg,buffer);var _free=Module["_free"]=asm["_free"];var runPostSets=Module["runPostSets"]=asm["runPostSets"];var _broadwayGetMajorVersion=Module["_broadwayGetMajorVersion"]=asm["_broadwayGetMajorVersion"];var _broadwayExit=Module["_broadwayExit"]=asm["_broadwayExit"];var _broadwayGetMinorVersion=Module["_broadwayGetMinorVersion"]=asm["_broadwayGetMinorVersion"];var _memset=Module["_memset"]=asm["_memset"];var _broadwayCreateStream=Module["_broadwayCreateStream"]=asm["_broadwayCreateStream"];var _malloc=Module["_malloc"]=asm["_malloc"];var _memcpy=Module["_memcpy"]=asm["_memcpy"];var _broadwayPlayStream=Module["_broadwayPlayStream"]=asm["_broadwayPlayStream"];var _broadwayInit=Module["_broadwayInit"]=asm["_broadwayInit"];var dynCall_ii=Module["dynCall_ii"]=asm["dynCall_ii"];var dynCall_iiii=Module["dynCall_iiii"]=asm["dynCall_iiii"];var dynCall_viiiii=Module["dynCall_viiiii"]=asm["dynCall_viiiii"];var dynCall_vi=Module["dynCall_vi"]=asm["dynCall_vi"];Runtime.stackAlloc=asm["stackAlloc"];Runtime.stackSave=asm["stackSave"];Runtime.stackRestore=asm["stackRestore"];Runtime.establishStackSpace=asm["establishStackSpace"];Runtime.setTempRet0=asm["setTempRet0"];Runtime.getTempRet0=asm["getTempRet0"];function ExitStatus(status){this.name="ExitStatus";this.message="Program terminated with exit("+status+")";this.status=status}ExitStatus.prototype=new Error;ExitStatus.prototype.constructor=ExitStatus;var initialStackTop;var preloadStartTime=null;var calledMain=false;dependenciesFulfilled=function runCaller(){if(!Module["calledRun"])run();if(!Module["calledRun"])dependenciesFulfilled=runCaller};Module["callMain"]=Module.callMain=function callMain(args){assert(runDependencies==0,"cannot call main when async dependencies remain! (listen on __ATMAIN__)");assert(__ATPRERUN__.length==0,"cannot call main when preRun functions remain to be called");args=args||[];ensureInitRuntime();var argc=args.length+1;function pad(){for(var i=0;i<4-1;i++){argv.push(0)}}var argv=[allocate(intArrayFromString(Module["thisProgram"]),"i8",ALLOC_NORMAL)];pad();for(var i=0;i<argc-1;i=i+1){argv.push(allocate(intArrayFromString(args[i]),"i8",ALLOC_NORMAL));pad()}argv.push(0);argv=allocate(argv,"i32",ALLOC_NORMAL);try{var ret=Module["_main"](argc,argv,0);exit(ret,true)}catch(e){if(e instanceof ExitStatus){return}else if(e=="SimulateInfiniteLoop"){Module["noExitRuntime"]=true;return}else{if(e&&typeof e==="object"&&e.stack)Module.printErr("exception thrown: "+[e,e.stack]);throw e}}finally{calledMain=true}};function run(args){args=args||Module["arguments"];if(preloadStartTime===null)preloadStartTime=Date.now();if(runDependencies>0){return}preRun();if(runDependencies>0)return;if(Module["calledRun"])return;function doRun(){if(Module["calledRun"])return;Module["calledRun"]=true;if(ABORT)return;ensureInitRuntime();preMain();if(Module["onRuntimeInitialized"])Module["onRuntimeInitialized"]();if(Module["_main"]&&shouldRunNow)Module["callMain"](args);postRun()}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout((function(){setTimeout((function(){Module["setStatus"]("")}),1);doRun()}),1)}else{doRun()}}Module["run"]=Module.run=run;function exit(status,implicit){if(implicit&&Module["noExitRuntime"]){return}if(Module["noExitRuntime"]){}else{ABORT=true;EXITSTATUS=status;STACKTOP=initialStackTop;exitRuntime();if(Module["onExit"])Module["onExit"](status)}if(ENVIRONMENT_IS_NODE){process["stdout"]["once"]("drain",(function(){process["exit"](status)}));console.log(" ");setTimeout((function(){process["exit"](status)}),500)}else if(ENVIRONMENT_IS_SHELL&&typeof quit==="function"){quit(status)}throw new ExitStatus(status)}Module["exit"]=Module.exit=exit;var abortDecorators=[];function abort(what){if(what!==undefined){Module.print(what);Module.printErr(what);what=JSON.stringify(what)}else{what=""}ABORT=true;EXITSTATUS=1;var extra="\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.";var output="abort("+what+") at "+stackTrace()+extra;if(abortDecorators){abortDecorators.forEach((function(decorator){output=decorator(output,what)}))}throw output}Module["abort"]=Module.abort=abort;if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].pop()()}}var shouldRunNow=false;if(Module["noInitialRun"]){shouldRunNow=false}Module["noExitRuntime"]=true;run()




       return Module;
    })();
    
    var resultModule = global.Module || Module;

    resultModule._broadwayOnHeadersDecoded = par_broadwayOnHeadersDecoded;
    resultModule._broadwayOnPictureDecoded = par_broadwayOnPictureDecoded;
    
    return resultModule;
  };

  return (function(){
    "use strict";
  
  
  var nowValue = function(){
    return (new Date()).getTime();
  };
  
  if (typeof performance != "undefined"){
    if (performance.now){
      nowValue = function(){
        return performance.now();
      };
    };
  };
  
  
  var Decoder = function(parOptions){
    this.options = parOptions || {};
    
    this.now = nowValue;
    
    var asmInstance;
    
    var fakeWindow = {
    };
    
    var onPicFun = function ($buffer, width, height) {
      var buffer = this.pictureBuffers[$buffer];
      if (!buffer) {
        buffer = this.pictureBuffers[$buffer] = toU8Array($buffer, (width * height * 3) / 2);
      };
      
      var infos;
      var doInfo = false;
      if (this.infoAr.length){
        doInfo = true;
        infos = this.infoAr;
      };
      this.infoAr = [];
      
      if (this.options.rgb){
        if (!asmInstance){
          asmInstance = getAsm(width, height);
        };
        asmInstance.inp.set(buffer);
        asmInstance.doit();

        var copyU8 = new Uint8Array(asmInstance.outSize);
        copyU8.set( asmInstance.out );
        
        if (doInfo){
          infos[0].finishDecoding = nowValue();
        };
        
        this.onPictureDecoded(copyU8, width, height, infos);
        return;
        
      };
      
      if (doInfo){
        infos[0].finishDecoding = nowValue();
      };
      this.onPictureDecoded(buffer, width, height, infos);
    }.bind(this);
    
    var ignore = false;
    
    if (this.options.sliceMode){
      onPicFun = function ($buffer, width, height, $sliceInfo) {
        if (ignore){
          return;
        };
        var buffer = this.pictureBuffers[$buffer];
        if (!buffer) {
          buffer = this.pictureBuffers[$buffer] = toU8Array($buffer, (width * height * 3) / 2);
        };
        var sliceInfo = this.pictureBuffers[$sliceInfo];
        if (!sliceInfo) {
          sliceInfo = this.pictureBuffers[$sliceInfo] = toU32Array($sliceInfo, 18);
        };

        var infos;
        var doInfo = false;
        if (this.infoAr.length){
          doInfo = true;
          infos = this.infoAr;
        };
        this.infoAr = [];

        /*if (this.options.rgb){
        
        no rgb in slice mode

        };*/

        infos[0].finishDecoding = nowValue();
        var sliceInfoAr = [];
        for (var i = 0; i < 20; ++i){
          sliceInfoAr.push(sliceInfo[i]);
        };
        infos[0].sliceInfoAr = sliceInfoAr;

        this.onPictureDecoded(buffer, width, height, infos);
      }.bind(this);
    };
    
    var Module = getModule.apply(fakeWindow, [function () {
    }, onPicFun]);
    

    var HEAP8 = Module.HEAP8;
    var HEAPU8 = Module.HEAPU8;
    var HEAP16 = Module.HEAP16;
    var HEAP32 = Module.HEAP32;

    
    var MAX_STREAM_BUFFER_LENGTH = 1024 * 1024;
  
    // from old constructor
    Module._broadwayInit();
    
    /**
   * Creates a typed array from a HEAP8 pointer. 
   */
    function toU8Array(ptr, length) {
      return HEAPU8.subarray(ptr, ptr + length);
    };
    function toU32Array(ptr, length) {
      //var tmp = HEAPU8.subarray(ptr, ptr + (length * 4));
      return new Uint32Array(HEAPU8.buffer, ptr, length);
    };
    this.streamBuffer = toU8Array(Module._broadwayCreateStream(MAX_STREAM_BUFFER_LENGTH), MAX_STREAM_BUFFER_LENGTH);
    this.pictureBuffers = {};
    // collect extra infos that are provided with the nal units
    this.infoAr = [];
    
    this.onPictureDecoded = function (buffer, width, height, infos) {
      
    };
    
    /**
     * Decodes a stream buffer. This may be one single (unframed) NAL unit without the
     * start code, or a sequence of NAL units with framing start code prefixes. This
     * function overwrites stream buffer allocated by the codec with the supplied buffer.
     */
    
    var sliceNum = 0;
    if (this.options.sliceMode){
      sliceNum = this.options.sliceNum;
      
      this.decode = function decode(typedAr, parInfo, copyDoneFun) {
        this.infoAr.push(parInfo);
        parInfo.startDecoding = nowValue();
        var nals = parInfo.nals;
        var i;
        if (!nals){
          nals = [];
          parInfo.nals = nals;
          var l = typedAr.length;
          var foundSomething = false;
          var lastFound = 0;
          var lastStart = 0;
          for (i = 0; i < l; ++i){
            if (typedAr[i] === 1){
              if (
                typedAr[i - 1] === 0 &&
                typedAr[i - 2] === 0
              ){
                var startPos = i - 2;
                if (typedAr[i - 3] === 0){
                  startPos = i - 3;
                };
                // its a nal;
                if (foundSomething){
                  nals.push({
                    offset: lastFound,
                    end: startPos,
                    type: typedAr[lastStart] & 31
                  });
                };
                lastFound = startPos;
                lastStart = startPos + 3;
                if (typedAr[i - 3] === 0){
                  lastStart = startPos + 4;
                };
                foundSomething = true;
              };
            };
          };
          if (foundSomething){
            nals.push({
              offset: lastFound,
              end: i,
              type: typedAr[lastStart] & 31
            });
          };
        };
        
        var currentSlice = 0;
        var playAr;
        var offset = 0;
        for (i = 0; i < nals.length; ++i){
          if (nals[i].type === 1 || nals[i].type === 5){
            if (currentSlice === sliceNum){
              playAr = typedAr.subarray(nals[i].offset, nals[i].end);
              this.streamBuffer[offset] = 0;
              offset += 1;
              this.streamBuffer.set(playAr, offset);
              offset += playAr.length;
            };
            currentSlice += 1;
          }else{
            playAr = typedAr.subarray(nals[i].offset, nals[i].end);
            this.streamBuffer[offset] = 0;
            offset += 1;
            this.streamBuffer.set(playAr, offset);
            offset += playAr.length;
            Module._broadwayPlayStream(offset);
            offset = 0;
          };
        };
        copyDoneFun();
        Module._broadwayPlayStream(offset);
      };
      
    }else{
      this.decode = function decode(typedAr, parInfo) {
        // console.info("Decoding: " + buffer.length);
        // collect infos
        if (parInfo){
          this.infoAr.push(parInfo);
          parInfo.startDecoding = nowValue();
        };

        this.streamBuffer.set(typedAr);
        Module._broadwayPlayStream(typedAr.length);
      };
    };

  };

  
  Decoder.prototype = {
    
  };
  
  
  
  
  /*
  
    asm.js implementation of a yuv to rgb convertor
    provided by @soliton4
    
    based on 
    http://www.wordsaretoys.com/2013/10/18/making-yuv-conversion-a-little-faster/
  
  */
  
  
  // factory to create asm.js yuv -> rgb convertor for a given resolution
  var asmInstances = {};
  var getAsm = function(parWidth, parHeight){
    var idStr = "" + parWidth + "x" + parHeight;
    if (asmInstances[idStr]){
      return asmInstances[idStr];
    };

    var lumaSize = parWidth * parHeight;
    var chromaSize = (lumaSize|0) >> 2;

    var inpSize = lumaSize + chromaSize + chromaSize;
    var outSize = parWidth * parHeight * 4;
    var cacheSize = Math.pow(2, 24) * 4;
    var size = inpSize + outSize + cacheSize;

    var chunkSize = Math.pow(2, 24);
    var heapSize = chunkSize;
    while (heapSize < size){
      heapSize += chunkSize;
    };
    var heap = new ArrayBuffer(heapSize);

    var res = asmFactory(global, {}, heap);
    res.init(parWidth, parHeight);
    asmInstances[idStr] = res;

    res.heap = heap;
    res.out = new Uint8Array(heap, 0, outSize);
    res.inp = new Uint8Array(heap, outSize, inpSize);
    res.outSize = outSize;

    return res;
  };


  function asmFactory(stdlib, foreign, heap) {
    "use asm";

    var imul = stdlib.Math.imul;
    var min = stdlib.Math.min;
    var max = stdlib.Math.max;
    var pow = stdlib.Math.pow;
    var out = new stdlib.Uint8Array(heap);
    var out32 = new stdlib.Uint32Array(heap);
    var inp = new stdlib.Uint8Array(heap);
    var mem = new stdlib.Uint8Array(heap);
    var mem32 = new stdlib.Uint32Array(heap);

    // for double algo
    /*var vt = 1.370705;
    var gt = 0.698001;
    var gt2 = 0.337633;
    var bt = 1.732446;*/

    var width = 0;
    var height = 0;
    var lumaSize = 0;
    var chromaSize = 0;
    var inpSize = 0;
    var outSize = 0;

    var inpStart = 0;
    var outStart = 0;

    var widthFour = 0;

    var cacheStart = 0;


    function init(parWidth, parHeight){
      parWidth = parWidth|0;
      parHeight = parHeight|0;

      var i = 0;
      var s = 0;

      width = parWidth;
      widthFour = imul(parWidth, 4)|0;
      height = parHeight;
      lumaSize = imul(width|0, height|0)|0;
      chromaSize = (lumaSize|0) >> 2;
      outSize = imul(imul(width, height)|0, 4)|0;
      inpSize = ((lumaSize + chromaSize)|0 + chromaSize)|0;

      outStart = 0;
      inpStart = (outStart + outSize)|0;
      cacheStart = (inpStart + inpSize)|0;

      // initializing memory (to be on the safe side)
      s = ~~(+pow(+2, +24));
      s = imul(s, 4)|0;

      for (i = 0|0; ((i|0) < (s|0))|0; i = (i + 4)|0){
        mem32[((cacheStart + i)|0) >> 2] = 0;
      };
    };

    function doit(){
      var ystart = 0;
      var ustart = 0;
      var vstart = 0;

      var y = 0;
      var yn = 0;
      var u = 0;
      var v = 0;

      var o = 0;

      var line = 0;
      var col = 0;

      var usave = 0;
      var vsave = 0;

      var ostart = 0;
      var cacheAdr = 0;

      ostart = outStart|0;

      ystart = inpStart|0;
      ustart = (ystart + lumaSize|0)|0;
      vstart = (ustart + chromaSize)|0;

      for (line = 0; (line|0) < (height|0); line = (line + 2)|0){
        usave = ustart;
        vsave = vstart;
        for (col = 0; (col|0) < (width|0); col = (col + 2)|0){
          y = inp[ystart >> 0]|0;
          yn = inp[((ystart + width)|0) >> 0]|0;

          u = inp[ustart >> 0]|0;
          v = inp[vstart >> 0]|0;

          cacheAdr = (((((y << 16)|0) + ((u << 8)|0))|0) + v)|0;
          o = mem32[((cacheStart + cacheAdr)|0) >> 2]|0;
          if (o){}else{
            o = yuv2rgbcalc(y,u,v)|0;
            mem32[((cacheStart + cacheAdr)|0) >> 2] = o|0;
          };
          mem32[ostart >> 2] = o;

          cacheAdr = (((((yn << 16)|0) + ((u << 8)|0))|0) + v)|0;
          o = mem32[((cacheStart + cacheAdr)|0) >> 2]|0;
          if (o){}else{
            o = yuv2rgbcalc(yn,u,v)|0;
            mem32[((cacheStart + cacheAdr)|0) >> 2] = o|0;
          };
          mem32[((ostart + widthFour)|0) >> 2] = o;

          //yuv2rgb5(y, u, v, ostart);
          //yuv2rgb5(yn, u, v, (ostart + widthFour)|0);
          ostart = (ostart + 4)|0;

          // next step only for y. u and v stay the same
          ystart = (ystart + 1)|0;
          y = inp[ystart >> 0]|0;
          yn = inp[((ystart + width)|0) >> 0]|0;

          //yuv2rgb5(y, u, v, ostart);
          cacheAdr = (((((y << 16)|0) + ((u << 8)|0))|0) + v)|0;
          o = mem32[((cacheStart + cacheAdr)|0) >> 2]|0;
          if (o){}else{
            o = yuv2rgbcalc(y,u,v)|0;
            mem32[((cacheStart + cacheAdr)|0) >> 2] = o|0;
          };
          mem32[ostart >> 2] = o;

          //yuv2rgb5(yn, u, v, (ostart + widthFour)|0);
          cacheAdr = (((((yn << 16)|0) + ((u << 8)|0))|0) + v)|0;
          o = mem32[((cacheStart + cacheAdr)|0) >> 2]|0;
          if (o){}else{
            o = yuv2rgbcalc(yn,u,v)|0;
            mem32[((cacheStart + cacheAdr)|0) >> 2] = o|0;
          };
          mem32[((ostart + widthFour)|0) >> 2] = o;
          ostart = (ostart + 4)|0;

          //all positions inc 1

          ystart = (ystart + 1)|0;
          ustart = (ustart + 1)|0;
          vstart = (vstart + 1)|0;
        };
        ostart = (ostart + widthFour)|0;
        ystart = (ystart + width)|0;

      };

    };

    function yuv2rgbcalc(y, u, v){
      y = y|0;
      u = u|0;
      v = v|0;

      var r = 0;
      var g = 0;
      var b = 0;

      var o = 0;

      var a0 = 0;
      var a1 = 0;
      var a2 = 0;
      var a3 = 0;
      var a4 = 0;

      a0 = imul(1192, (y - 16)|0)|0;
      a1 = imul(1634, (v - 128)|0)|0;
      a2 = imul(832, (v - 128)|0)|0;
      a3 = imul(400, (u - 128)|0)|0;
      a4 = imul(2066, (u - 128)|0)|0;

      r = (((a0 + a1)|0) >> 10)|0;
      g = (((((a0 - a2)|0) - a3)|0) >> 10)|0;
      b = (((a0 + a4)|0) >> 10)|0;

      if ((((r & 255)|0) != (r|0))|0){
        r = min(255, max(0, r|0)|0)|0;
      };
      if ((((g & 255)|0) != (g|0))|0){
        g = min(255, max(0, g|0)|0)|0;
      };
      if ((((b & 255)|0) != (b|0))|0){
        b = min(255, max(0, b|0)|0)|0;
      };

      o = 255;
      o = (o << 8)|0;
      o = (o + b)|0;
      o = (o << 8)|0;
      o = (o + g)|0;
      o = (o << 8)|0;
      o = (o + r)|0;

      return o|0;

    };



    return {
      init: init,
      doit: doit
    };
  };

  
  /*
    potential worker initialization
  
  */
  
  
  if (typeof self != "undefined"){
    var isWorker = false;
    var decoder;
    var reuseMemory = false;
    var sliceMode = false;
    var sliceNum = 0;
    var sliceCnt = 0;
    var lastSliceNum = 0;
    var sliceInfoAr;
    var lastBuf;
    var awaiting = 0;
    var pile = [];
    var startDecoding;
    var finishDecoding;
    var timeDecoding;
    
    var memAr = [];
    var getMem = function(length){
      if (memAr.length){
        var u = memAr.shift();
        while (u && u.byteLength !== length){
          u = memAr.shift();
        };
        if (u){
          return u;
        };
      };
      return new ArrayBuffer(length);
    }; 
    
    var copySlice = function(source, target, infoAr, width, height){
      
      var length = width * height;
      var length4 = length / 4
      var plane2 = length;
      var plane3 = length + length4;
      
      var copy16 = function(parBegin, parEnd){
        var i = 0;
        for (i = 0; i < 16; ++i){
          var begin = parBegin + (width * i);
          var end = parEnd + (width * i)
          target.set(source.subarray(begin, end), begin);
        };
      };
      var copy8 = function(parBegin, parEnd){
        var i = 0;
        for (i = 0; i < 8; ++i){
          var begin = parBegin + ((width / 2) * i);
          var end = parEnd + ((width / 2) * i)
          target.set(source.subarray(begin, end), begin);
        };
      };
      var copyChunk = function(begin, end){
        target.set(source.subarray(begin, end), begin);
      };
      
      var begin = infoAr[0];
      var end = infoAr[1];
      if (end > 0){
        copy16(begin, end);
        copy8(infoAr[2], infoAr[3]);
        copy8(infoAr[4], infoAr[5]);
      };
      begin = infoAr[6];
      end = infoAr[7];
      if (end > 0){
        copy16(begin, end);
        copy8(infoAr[8], infoAr[9]);
        copy8(infoAr[10], infoAr[11]);
      };
      
      begin = infoAr[12];
      end = infoAr[15];
      if (end > 0){
        copyChunk(begin, end);
        copyChunk(infoAr[13], infoAr[16]);
        copyChunk(infoAr[14], infoAr[17]);
      };
      
    };
    
    var sliceMsgFun = function(){};
    
    var setSliceCnt = function(parSliceCnt){
      sliceCnt = parSliceCnt;
      lastSliceNum = sliceCnt - 1;
    };
    
    
    self.addEventListener('message', function(e) {
      
      if (isWorker){
        if (reuseMemory){
          if (e.data.reuse){
            memAr.push(e.data.reuse);
          };
        };
        if (e.data.buf){
          if (sliceMode && awaiting !== 0){
            pile.push(e.data);
          }else{
            decoder.decode(
              new Uint8Array(e.data.buf, e.data.offset || 0, e.data.length), 
              e.data.info, 
              function(){
                if (sliceMode && sliceNum !== lastSliceNum){
                  postMessage(e.data, [e.data.buf]);
                };
              }
            );
          };
          return;
        };
        
        if (e.data.slice){
          // update ref pic
          var copyStart = nowValue();
          copySlice(new Uint8Array(e.data.slice), lastBuf, e.data.infos[0].sliceInfoAr, e.data.width, e.data.height);
          // is it the one? then we need to update it
          if (e.data.theOne){
            copySlice(lastBuf, new Uint8Array(e.data.slice), sliceInfoAr, e.data.width, e.data.height);
            if (timeDecoding > e.data.infos[0].timeDecoding){
              e.data.infos[0].timeDecoding = timeDecoding;
            };
            e.data.infos[0].timeCopy += (nowValue() - copyStart);
          };
          // move on
          postMessage(e.data, [e.data.slice]);
          
          // next frame in the pipe?
          awaiting -= 1;
          if (awaiting === 0 && pile.length){
            var data = pile.shift();
            decoder.decode(
              new Uint8Array(data.buf, data.offset || 0, data.length), 
              data.info, 
              function(){
                if (sliceMode && sliceNum !== lastSliceNum){
                  postMessage(data, [data.buf]);
                };
              }
            );
          };
          return;
        };
        
        if (e.data.setSliceCnt){
          setSliceCnt(e.data.sliceCnt);
          return;
        };
        
      }else{
        if (e.data && e.data.type === "Broadway.js - Worker init"){
          isWorker = true;
          decoder = new Decoder(e.data.options);
          
          if (e.data.options.sliceMode){
            reuseMemory = true;
            sliceMode = true;
            sliceNum = e.data.options.sliceNum;
            setSliceCnt(e.data.options.sliceCnt);

            decoder.onPictureDecoded = function (buffer, width, height, infos) {
              
              // buffer needs to be copied because we give up ownership
              var copyU8 = new Uint8Array(getMem(buffer.length));
              copySlice(buffer, copyU8, infos[0].sliceInfoAr, width, height);
              
              startDecoding = infos[0].startDecoding;
              finishDecoding = infos[0].finishDecoding;
              timeDecoding = finishDecoding - startDecoding;
              infos[0].timeDecoding = timeDecoding;
              infos[0].timeCopy = 0;
              
              postMessage({
                slice: copyU8.buffer,
                sliceNum: sliceNum,
                width: width, 
                height: height, 
                infos: infos
              }, [copyU8.buffer]); // 2nd parameter is used to indicate transfer of ownership
              
              awaiting = sliceCnt - 1;
              
              lastBuf = buffer;
              sliceInfoAr = infos[0].sliceInfoAr;

            };
            
          }else if (e.data.options.reuseMemory){
            reuseMemory = true;
            decoder.onPictureDecoded = function (buffer, width, height, infos) {
              
              // buffer needs to be copied because we give up ownership
              var copyU8 = new Uint8Array(getMem(buffer.length));
              copyU8.set( buffer, 0, buffer.length );

              postMessage({
                buf: copyU8.buffer, 
                length: buffer.length,
                width: width, 
                height: height, 
                infos: infos
              }, [copyU8.buffer]); // 2nd parameter is used to indicate transfer of ownership

            };
            
          }else{
            decoder.onPictureDecoded = function (buffer, width, height, infos) {
              if (buffer) {
                buffer = new Uint8Array(buffer);
              };

              // buffer needs to be copied because we give up ownership
              var copyU8 = new Uint8Array(buffer.length);
              copyU8.set( buffer, 0, buffer.length );

              postMessage({
                buf: copyU8.buffer, 
                length: buffer.length,
                width: width, 
                height: height, 
                infos: infos
              }, [copyU8.buffer]); // 2nd parameter is used to indicate transfer of ownership

            };
          };
          postMessage({ consoleLog: "broadway worker initialized" });
        };
      };


    }, false);
  };
  
  Decoder.nowValue = nowValue;
  
  return Decoder;
  
  })();
  
  
}));


}).call(this,require('_process'),"/node_modules/broadway-player/Player")
},{"_process":50}],7:[function(require,module,exports){
/*


usage:

p = new Player({
  useWorker: <bool>,
  workerFile: <defaults to "Decoder.js"> // give path to Decoder.js
  webgl: true | false | "auto" // defaults to "auto"
});

// canvas property represents the canvas node
// put it somewhere in the dom
p.canvas;

p.webgl; // contains the used rendering mode. if you pass auto to webgl you can see what auto detection resulted in

p.decode(<binary>);


*/



// universal module definition
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(["./Decoder", "./YUVCanvas"], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require("./Decoder"), require("./YUVCanvas"));
    } else {
        // Browser globals (root is window)
        root.Player = factory(root.Decoder, root.YUVCanvas);
    }
}(this, function (Decoder, WebGLCanvas) {
  "use strict";
  
  
  var nowValue = Decoder.nowValue;
  
  
  var Player = function(parOptions){
    var self = this;
    this._config = parOptions || {};
    
    this.render = true;
    if (this._config.render === false){
      this.render = false;
    };
    
    this.nowValue = nowValue;
    
    this._config.workerFile = this._config.workerFile || "Decoder.js";
    if (this._config.preserveDrawingBuffer){
      this._config.contextOptions = this._config.contextOptions || {};
      this._config.contextOptions.preserveDrawingBuffer = true;
    };
    
    var webgl = "auto";
    if (this._config.webgl === true){
      webgl = true;
    }else if (this._config.webgl === false){
      webgl = false;
    };
    
    if (webgl == "auto"){
      webgl = true;
      try{
        if (!window.WebGLRenderingContext) {
          // the browser doesn't even know what WebGL is
          webgl = false;
        } else {
          var canvas = document.createElement('canvas');
          var ctx = canvas.getContext("webgl");
          if (!ctx) {
            // browser supports WebGL but initialization failed.
            webgl = false;
          };
        };
      }catch(e){
        webgl = false;
      };
    };
    
    this.webgl = webgl;
    
    // choose functions
    if (this.webgl){
      this.createCanvasObj = this.createCanvasWebGL;
      this.renderFrame = this.renderFrameWebGL;
    }else{
      this.createCanvasObj = this.createCanvasRGB;
      this.renderFrame = this.renderFrameRGB;
    };
    
    
    var lastWidth;
    var lastHeight;
    var onPictureDecoded = function(buffer, width, height, infos) {
      self.onPictureDecoded(buffer, width, height, infos);
      
      var startTime = nowValue();
      
      if (!buffer || !self.render) {
        return;
      };
      
      self.renderFrame({
        canvasObj: self.canvasObj,
        data: buffer,
        width: width,
        height: height
      });
      
      if (self.onRenderFrameComplete){
        self.onRenderFrameComplete({
          data: buffer,
          width: width,
          height: height,
          infos: infos,
          canvasObj: self.canvasObj
        });
      };
      
    };
    
    // provide size
    
    if (!this._config.size){
      this._config.size = {};
    };
    this._config.size.width = this._config.size.width || 200;
    this._config.size.height = this._config.size.height || 200;
    
    if (this._config.useWorker){
      var worker = new Worker(this._config.workerFile);
      this.worker = worker;
      worker.addEventListener('message', function(e) {
        var data = e.data;
        if (data.consoleLog){
          console.log(data.consoleLog);
          return;
        };
        
        onPictureDecoded.call(self, new Uint8Array(data.buf, 0, data.length), data.width, data.height, data.infos);
        
      }, false);
      
      worker.postMessage({type: "Broadway.js - Worker init", options: {
        rgb: !webgl,
        memsize: this.memsize,
        reuseMemory: this._config.reuseMemory ? true : false
      }});
      
      if (this._config.transferMemory){
        this.decode = function(parData, parInfo){
          // no copy
          // instead we are transfering the ownership of the buffer
          // dangerous!!!
          
          worker.postMessage({buf: parData.buffer, offset: parData.byteOffset, length: parData.length, info: parInfo}, [parData.buffer]); // Send data to our worker.
        };
        
      }else{
        this.decode = function(parData, parInfo){
          // Copy the sample so that we only do a structured clone of the
          // region of interest
          var copyU8 = new Uint8Array(parData.length);
          copyU8.set( parData, 0, parData.length );
          worker.postMessage({buf: copyU8.buffer, offset: 0, length: parData.length, info: parInfo}, [copyU8.buffer]); // Send data to our worker.
        };
        
      };
      
      if (this._config.reuseMemory){
        this.recycleMemory = function(parArray){
          //this.beforeRecycle();
          worker.postMessage({reuse: parArray.buffer}, [parArray.buffer]); // Send data to our worker.
          //this.afterRecycle();
        };
      }
      
    }else{
      
      this.decoder = new Decoder({
        rgb: !webgl
      });
      this.decoder.onPictureDecoded = onPictureDecoded;

      this.decode = function(parData, parInfo){
        self.decoder.decode(parData, parInfo);
      };
      
    };
    
    
    
    if (this.render){
      this.canvasObj = this.createCanvasObj({
        contextOptions: this._config.contextOptions
      });
      this.canvas = this.canvasObj.canvas;
    };

    this.domNode = this.canvas;
    
    lastWidth = this._config.size.width;
    lastHeight = this._config.size.height;
    
  };
  
  Player.prototype = {
    
    onPictureDecoded: function(buffer, width, height, infos){},
    
    // call when memory of decoded frames is not used anymore
    recycleMemory: function(buf){
    },
    /*beforeRecycle: function(){},
    afterRecycle: function(){},*/
    
    // for both functions options is:
    //
    //  width
    //  height
    //  enableScreenshot
    //
    // returns a object that has a property canvas which is a html5 canvas
    createCanvasWebGL: function(options){
      var canvasObj = this._createBasicCanvasObj(options);
      canvasObj.contextOptions = options.contextOptions;
      return canvasObj;
    },
    
    createCanvasRGB: function(options){
      var canvasObj = this._createBasicCanvasObj(options);
      return canvasObj;
    },
    
    // part that is the same for webGL and RGB
    _createBasicCanvasObj: function(options){
      options = options || {};
      
      var obj = {};
      var width = options.width;
      if (!width){
        width = this._config.size.width;
      };
      var height = options.height;
      if (!height){
        height = this._config.size.height;
      };
      obj.canvas = document.createElement('canvas');
      obj.canvas.width = width;
      obj.canvas.height = height;
      obj.canvas.style.backgroundColor = "#0D0E1B";
      
      
      return obj;
    },
    
    // options:
    //
    // canvas
    // data
    renderFrameWebGL: function(options){
      
      var canvasObj = options.canvasObj;
      
      var width = options.width || canvasObj.canvas.width;
      var height = options.height || canvasObj.canvas.height;
      
      if (canvasObj.canvas.width !== width || canvasObj.canvas.height !== height || !canvasObj.webGLCanvas){
        canvasObj.canvas.width = width;
        canvasObj.canvas.height = height;
        canvasObj.webGLCanvas = new WebGLCanvas({
          canvas: canvasObj.canvas,
          contextOptions: canvasObj.contextOptions,
          width: width,
          height: height
        });
      };
      
      var ylen = width * height;
      var uvlen = (width / 2) * (height / 2);
      
      canvasObj.webGLCanvas.drawNextOutputPicture({
        yData: options.data.subarray(0, ylen),
        uData: options.data.subarray(ylen, ylen + uvlen),
        vData: options.data.subarray(ylen + uvlen, ylen + uvlen + uvlen)
      });
      
      var self = this;
      self.recycleMemory(options.data);
      
    },
    renderFrameRGB: function(options){
      var canvasObj = options.canvasObj;

      var width = options.width || canvasObj.canvas.width;
      var height = options.height || canvasObj.canvas.height;
      
      if (canvasObj.canvas.width !== width || canvasObj.canvas.height !== height){
        canvasObj.canvas.width = width;
        canvasObj.canvas.height = height;
      };
      
      var ctx = canvasObj.ctx;
      var imgData = canvasObj.imgData;

      if (!ctx){
        canvasObj.ctx = canvasObj.canvas.getContext('2d');
        ctx = canvasObj.ctx;

        canvasObj.imgData = ctx.createImageData(width, height);
        imgData = canvasObj.imgData;
      };

      imgData.data.set(options.data);
      ctx.putImageData(imgData, 0, 0);
      var self = this;
      self.recycleMemory(options.data);
      
    }
    
  };
  
  return Player;
  
}));


},{"./Decoder":6,"./YUVCanvas":8}],8:[function(require,module,exports){
//
//  Copyright (c) 2015 Paperspace Co. All rights reserved.
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to
//  deal in the Software without restriction, including without limitation the
//  rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
//  sell copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
//  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
//  IN THE SOFTWARE.
//


// universal module definition
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.YUVCanvas = factory();
    }
}(this, function () {


/**
 * This class can be used to render output pictures from an H264bsdDecoder to a canvas element.
 * If available the content is rendered using WebGL.
 */
  function YUVCanvas(parOptions) {
    
    parOptions = parOptions || {};
    
    this.canvasElement = parOptions.canvas || document.createElement("canvas");
    this.contextOptions = parOptions.contextOptions;
    
    this.type = parOptions.type || "yuv420";
    
    this.customYUV444 = parOptions.customYUV444;
    
    this.conversionType = parOptions.conversionType || "rec601";

    this.width = parOptions.width || 640;
    this.height = parOptions.height || 320;
    
    this.animationTime = parOptions.animationTime || 0;
    
    this.canvasElement.width = this.width;
    this.canvasElement.height = this.height;

    this.initContextGL();

    if(this.contextGL) {
      this.initProgram();
      this.initBuffers();
      this.initTextures();
    };
    

/**
 * Draw the next output picture using WebGL
 */
    if (this.type === "yuv420"){
      this.drawNextOuptutPictureGL = function(par) {
        var gl = this.contextGL;
        var texturePosBuffer = this.texturePosBuffer;
        var uTexturePosBuffer = this.uTexturePosBuffer;
        var vTexturePosBuffer = this.vTexturePosBuffer;
        
        var yTextureRef = this.yTextureRef;
        var uTextureRef = this.uTextureRef;
        var vTextureRef = this.vTextureRef;
        
        var yData = par.yData;
        var uData = par.uData;
        var vData = par.vData;
        
        var width = this.width;
        var height = this.height;
        
        var yDataPerRow = par.yDataPerRow || width;
        var yRowCnt     = par.yRowCnt || height;
        
        var uDataPerRow = par.uDataPerRow || (width / 2);
        var uRowCnt     = par.uRowCnt || (height / 2);
        
        var vDataPerRow = par.vDataPerRow || uDataPerRow;
        var vRowCnt     = par.vRowCnt || uRowCnt;
        
        gl.viewport(0, 0, width, height);

        var tTop = 0;
        var tLeft = 0;
        var tBottom = height / yRowCnt;
        var tRight = width / yDataPerRow;
        var texturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);

        gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texturePosValues, gl.DYNAMIC_DRAW);
        
        if (this.customYUV444){
          tBottom = height / uRowCnt;
          tRight = width / uDataPerRow;
        }else{
          tBottom = (height / 2) / uRowCnt;
          tRight = (width / 2) / uDataPerRow;
        };
        var uTexturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);

        gl.bindBuffer(gl.ARRAY_BUFFER, uTexturePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, uTexturePosValues, gl.DYNAMIC_DRAW);
        
        
        if (this.customYUV444){
          tBottom = height / vRowCnt;
          tRight = width / vDataPerRow;
        }else{
          tBottom = (height / 2) / vRowCnt;
          tRight = (width / 2) / vDataPerRow;
        };
        var vTexturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);

        gl.bindBuffer(gl.ARRAY_BUFFER, vTexturePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vTexturePosValues, gl.DYNAMIC_DRAW);
        

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, yTextureRef);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, yDataPerRow, yRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, yData);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, uTextureRef);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, uDataPerRow, uRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, uData);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, vTextureRef);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, vDataPerRow, vRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, vData);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); 
      };
      
    }else if (this.type === "yuv422"){
      this.drawNextOuptutPictureGL = function(par) {
        var gl = this.contextGL;
        var texturePosBuffer = this.texturePosBuffer;
        
        var textureRef = this.textureRef;
        
        var data = par.data;
        
        var width = this.width;
        var height = this.height;
        
        var dataPerRow = par.dataPerRow || (width * 2);
        var rowCnt     = par.rowCnt || height;

        gl.viewport(0, 0, width, height);

        var tTop = 0;
        var tLeft = 0;
        var tBottom = height / rowCnt;
        var tRight = width / (dataPerRow / 2);
        var texturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);

        gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texturePosValues, gl.DYNAMIC_DRAW);
        
        gl.uniform2f(gl.getUniformLocation(this.shaderProgram, 'resolution'), dataPerRow, height);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureRef);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, dataPerRow, rowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); 
      };
    };
    
  };

  /**
 * Returns true if the canvas supports WebGL
 */
  YUVCanvas.prototype.isWebGL = function() {
    return this.contextGL;
  };

  /**
 * Create the GL context from the canvas element
 */
  YUVCanvas.prototype.initContextGL = function() {
    var canvas = this.canvasElement;
    var gl = null;

    var validContextNames = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"];
    var nameIndex = 0;

    while(!gl && nameIndex < validContextNames.length) {
      var contextName = validContextNames[nameIndex];

      try {
        if (this.contextOptions){
          gl = canvas.getContext(contextName, this.contextOptions);
        }else{
          gl = canvas.getContext(contextName);
        };
      } catch (e) {
        gl = null;
      }

      if(!gl || typeof gl.getParameter !== "function") {
        gl = null;
      }    

      ++nameIndex;
    };

    this.contextGL = gl;
  };

/**
 * Initialize GL shader program
 */
YUVCanvas.prototype.initProgram = function() {
    var gl = this.contextGL;

  // vertex shader is the same for all types
  var vertexShaderScript;
  var fragmentShaderScript;
  
  if (this.type === "yuv420"){

    vertexShaderScript = [
      'attribute vec4 vertexPos;',
      'attribute vec4 texturePos;',
      'attribute vec4 uTexturePos;',
      'attribute vec4 vTexturePos;',
      'varying vec2 textureCoord;',
      'varying vec2 uTextureCoord;',
      'varying vec2 vTextureCoord;',

      'void main()',
      '{',
      '  gl_Position = vertexPos;',
      '  textureCoord = texturePos.xy;',
      '  uTextureCoord = uTexturePos.xy;',
      '  vTextureCoord = vTexturePos.xy;',
      '}'
    ].join('\n');
    
    fragmentShaderScript = [
      'precision highp float;',
      'varying highp vec2 textureCoord;',
      'varying highp vec2 uTextureCoord;',
      'varying highp vec2 vTextureCoord;',
      'uniform sampler2D ySampler;',
      'uniform sampler2D uSampler;',
      'uniform sampler2D vSampler;',
      'uniform mat4 YUV2RGB;',

      'void main(void) {',
      '  highp float y = texture2D(ySampler,  textureCoord).r;',
      '  highp float u = texture2D(uSampler,  uTextureCoord).r;',
      '  highp float v = texture2D(vSampler,  vTextureCoord).r;',
      '  gl_FragColor = vec4(y, u, v, 1) * YUV2RGB;',
      '}'
    ].join('\n');
    
  }else if (this.type === "yuv422"){
    vertexShaderScript = [
      'attribute vec4 vertexPos;',
      'attribute vec4 texturePos;',
      'varying vec2 textureCoord;',

      'void main()',
      '{',
      '  gl_Position = vertexPos;',
      '  textureCoord = texturePos.xy;',
      '}'
    ].join('\n');
    
    fragmentShaderScript = [
      'precision highp float;',
      'varying highp vec2 textureCoord;',
      'uniform sampler2D sampler;',
      'uniform highp vec2 resolution;',
      'uniform mat4 YUV2RGB;',

      'void main(void) {',
      
      '  highp float texPixX = 1.0 / resolution.x;',
      '  highp float logPixX = 2.0 / resolution.x;', // half the resolution of the texture
      '  highp float logHalfPixX = 4.0 / resolution.x;', // half of the logical resolution so every 4th pixel
      '  highp float steps = floor(textureCoord.x / logPixX);',
      '  highp float uvSteps = floor(textureCoord.x / logHalfPixX);',
      '  highp float y = texture2D(sampler, vec2((logPixX * steps) + texPixX, textureCoord.y)).r;',
      '  highp float u = texture2D(sampler, vec2((logHalfPixX * uvSteps), textureCoord.y)).r;',
      '  highp float v = texture2D(sampler, vec2((logHalfPixX * uvSteps) + texPixX + texPixX, textureCoord.y)).r;',
      
      //'  highp float y = texture2D(sampler,  textureCoord).r;',
      //'  gl_FragColor = vec4(y, u, v, 1) * YUV2RGB;',
      '  gl_FragColor = vec4(y, u, v, 1.0) * YUV2RGB;',
      '}'
    ].join('\n');
  };

  var YUV2RGB = [];

  if (this.conversionType == "rec709") {
      // ITU-T Rec. 709
      YUV2RGB = [
          1.16438,  0.00000,  1.79274, -0.97295,
          1.16438, -0.21325, -0.53291,  0.30148,
          1.16438,  2.11240,  0.00000, -1.13340,
          0, 0, 0, 1,
      ];
  } else {
      // assume ITU-T Rec. 601
      YUV2RGB = [
          1.16438,  0.00000,  1.59603, -0.87079,
          1.16438, -0.39176, -0.81297,  0.52959,
          1.16438,  2.01723,  0.00000, -1.08139,
          0, 0, 0, 1
      ];
  };

  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderScript);
  gl.compileShader(vertexShader);
  if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.log('Vertex shader failed to compile: ' + gl.getShaderInfoLog(vertexShader));
  }

  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderScript);
  gl.compileShader(fragmentShader);
  if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.log('Fragment shader failed to compile: ' + gl.getShaderInfoLog(fragmentShader));
  }

  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log('Program failed to compile: ' + gl.getProgramInfoLog(program));
  }

  gl.useProgram(program);

  var YUV2RGBRef = gl.getUniformLocation(program, 'YUV2RGB');
  gl.uniformMatrix4fv(YUV2RGBRef, false, YUV2RGB);

  this.shaderProgram = program;
};

/**
 * Initialize vertex buffers and attach to shader program
 */
YUVCanvas.prototype.initBuffers = function() {
  var gl = this.contextGL;
  var program = this.shaderProgram;

  var vertexPosBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]), gl.STATIC_DRAW);

  var vertexPosRef = gl.getAttribLocation(program, 'vertexPos');
  gl.enableVertexAttribArray(vertexPosRef);
  gl.vertexAttribPointer(vertexPosRef, 2, gl.FLOAT, false, 0, 0);
  
  if (this.animationTime){
    
    var animationTime = this.animationTime;
    var timePassed = 0;
    var stepTime = 15;
  
    var aniFun = function(){
      
      timePassed += stepTime;
      var mul = ( 1 * timePassed ) / animationTime;
      
      if (timePassed >= animationTime){
        mul = 1;
      }else{
        setTimeout(aniFun, stepTime);
      };
      
      var neg = -1 * mul;
      var pos = 1 * mul;

      var vertexPosBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([pos, pos, neg, pos, pos, neg, neg, neg]), gl.STATIC_DRAW);

      var vertexPosRef = gl.getAttribLocation(program, 'vertexPos');
      gl.enableVertexAttribArray(vertexPosRef);
      gl.vertexAttribPointer(vertexPosRef, 2, gl.FLOAT, false, 0, 0);
      
      try{
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }catch(e){};

    };
    aniFun();
    
  };

  

  var texturePosBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 0, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);

  var texturePosRef = gl.getAttribLocation(program, 'texturePos');
  gl.enableVertexAttribArray(texturePosRef);
  gl.vertexAttribPointer(texturePosRef, 2, gl.FLOAT, false, 0, 0);

  this.texturePosBuffer = texturePosBuffer;

  if (this.type === "yuv420"){
    var uTexturePosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uTexturePosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 0, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);

    var uTexturePosRef = gl.getAttribLocation(program, 'uTexturePos');
    gl.enableVertexAttribArray(uTexturePosRef);
    gl.vertexAttribPointer(uTexturePosRef, 2, gl.FLOAT, false, 0, 0);

    this.uTexturePosBuffer = uTexturePosBuffer;
    
    
    var vTexturePosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vTexturePosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 0, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);

    var vTexturePosRef = gl.getAttribLocation(program, 'vTexturePos');
    gl.enableVertexAttribArray(vTexturePosRef);
    gl.vertexAttribPointer(vTexturePosRef, 2, gl.FLOAT, false, 0, 0);

    this.vTexturePosBuffer = vTexturePosBuffer;
  };

};

/**
 * Initialize GL textures and attach to shader program
 */
YUVCanvas.prototype.initTextures = function() {
  var gl = this.contextGL;
  var program = this.shaderProgram;

  if (this.type === "yuv420"){

    var yTextureRef = this.initTexture();
    var ySamplerRef = gl.getUniformLocation(program, 'ySampler');
    gl.uniform1i(ySamplerRef, 0);
    this.yTextureRef = yTextureRef;

    var uTextureRef = this.initTexture();
    var uSamplerRef = gl.getUniformLocation(program, 'uSampler');
    gl.uniform1i(uSamplerRef, 1);
    this.uTextureRef = uTextureRef;

    var vTextureRef = this.initTexture();
    var vSamplerRef = gl.getUniformLocation(program, 'vSampler');
    gl.uniform1i(vSamplerRef, 2);
    this.vTextureRef = vTextureRef;
    
  }else if (this.type === "yuv422"){
    // only one texture for 422
    var textureRef = this.initTexture();
    var samplerRef = gl.getUniformLocation(program, 'sampler');
    gl.uniform1i(samplerRef, 0);
    this.textureRef = textureRef;

  };
};

/**
 * Create and configure a single texture
 */
YUVCanvas.prototype.initTexture = function() {
    var gl = this.contextGL;

    var textureRef = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureRef);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return textureRef;
};

/**
 * Draw picture data to the canvas.
 * If this object is using WebGL, the data must be an I420 formatted ArrayBuffer,
 * Otherwise, data must be an RGBA formatted ArrayBuffer.
 */
YUVCanvas.prototype.drawNextOutputPicture = function(width, height, croppingParams, data) {
    var gl = this.contextGL;

    if(gl) {
        this.drawNextOuptutPictureGL(width, height, croppingParams, data);
    } else {
        this.drawNextOuptutPictureRGBA(width, height, croppingParams, data);
    }
};



/**
 * Draw next output picture using ARGB data on a 2d canvas.
 */
YUVCanvas.prototype.drawNextOuptutPictureRGBA = function(width, height, croppingParams, data) {
    var canvas = this.canvasElement;

    var croppingParams = null;

    var argbData = data;

    var ctx = canvas.getContext('2d');
    var imageData = ctx.getImageData(0, 0, width, height);
    imageData.data.set(argbData);

    if(croppingParams === null) {
        ctx.putImageData(imageData, 0, 0);
    } else {
        ctx.putImageData(imageData, -croppingParams.left, -croppingParams.top, 0, 0, croppingParams.width, croppingParams.height);
    }
};
  
  return YUVCanvas;
  
}));

},{}],9:[function(require,module,exports){
/**
 * Slice reference.
 */

var slice = [].slice;

/**
 * Bind `obj` to `fn`.
 *
 * @param {Object} obj
 * @param {Function|String} fn or string
 * @return {Function}
 * @api public
 */

module.exports = function(obj, fn){
  if ('string' == typeof fn) fn = obj[fn];
  if ('function' != typeof fn) throw new Error('bind() requires a function');
  var args = slice.call(arguments, 2);
  return function(){
    return fn.apply(obj, args.concat(slice.call(arguments)));
  }
};

},{}],10:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],11:[function(require,module,exports){

module.exports = function(a, b){
  var fn = function(){};
  fn.prototype = b.prototype;
  a.prototype = new fn;
  a.prototype.constructor = a;
};
},{}],12:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage(){
  try {
    return window.localStorage;
  } catch (e) {}
}

},{"./debug":13}],13:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":31}],14:[function(require,module,exports){

module.exports = require('./lib/index');

},{"./lib/index":15}],15:[function(require,module,exports){

module.exports = require('./socket');

/**
 * Exports parser
 *
 * @api public
 *
 */
module.exports.parser = require('engine.io-parser');

},{"./socket":16,"engine.io-parser":24}],16:[function(require,module,exports){
(function (global){
/**
 * Module dependencies.
 */

var transports = require('./transports/index');
var Emitter = require('component-emitter');
var debug = require('debug')('engine.io-client:socket');
var index = require('indexof');
var parser = require('engine.io-parser');
var parseuri = require('parseuri');
var parsejson = require('parsejson');
var parseqs = require('parseqs');

/**
 * Module exports.
 */

module.exports = Socket;

/**
 * Socket constructor.
 *
 * @param {String|Object} uri or options
 * @param {Object} options
 * @api public
 */

function Socket (uri, opts) {
  if (!(this instanceof Socket)) return new Socket(uri, opts);

  opts = opts || {};

  if (uri && 'object' === typeof uri) {
    opts = uri;
    uri = null;
  }

  if (uri) {
    uri = parseuri(uri);
    opts.hostname = uri.host;
    opts.secure = uri.protocol === 'https' || uri.protocol === 'wss';
    opts.port = uri.port;
    if (uri.query) opts.query = uri.query;
  } else if (opts.host) {
    opts.hostname = parseuri(opts.host).host;
  }

  this.secure = null != opts.secure ? opts.secure
    : (global.location && 'https:' === location.protocol);

  if (opts.hostname && !opts.port) {
    // if no port is specified manually, use the protocol default
    opts.port = this.secure ? '443' : '80';
  }

  this.agent = opts.agent || false;
  this.hostname = opts.hostname ||
    (global.location ? location.hostname : 'localhost');
  this.port = opts.port || (global.location && location.port
      ? location.port
      : (this.secure ? 443 : 80));
  this.query = opts.query || {};
  if ('string' === typeof this.query) this.query = parseqs.decode(this.query);
  this.upgrade = false !== opts.upgrade;
  this.path = (opts.path || '/engine.io').replace(/\/$/, '') + '/';
  this.forceJSONP = !!opts.forceJSONP;
  this.jsonp = false !== opts.jsonp;
  this.forceBase64 = !!opts.forceBase64;
  this.enablesXDR = !!opts.enablesXDR;
  this.timestampParam = opts.timestampParam || 't';
  this.timestampRequests = opts.timestampRequests;
  this.transports = opts.transports || ['polling', 'websocket'];
  this.readyState = '';
  this.writeBuffer = [];
  this.prevBufferLen = 0;
  this.policyPort = opts.policyPort || 843;
  this.rememberUpgrade = opts.rememberUpgrade || false;
  this.binaryType = null;
  this.onlyBinaryUpgrades = opts.onlyBinaryUpgrades;
  this.perMessageDeflate = false !== opts.perMessageDeflate ? (opts.perMessageDeflate || {}) : false;

  if (true === this.perMessageDeflate) this.perMessageDeflate = {};
  if (this.perMessageDeflate && null == this.perMessageDeflate.threshold) {
    this.perMessageDeflate.threshold = 1024;
  }

  // SSL options for Node.js client
  this.pfx = opts.pfx || null;
  this.key = opts.key || null;
  this.passphrase = opts.passphrase || null;
  this.cert = opts.cert || null;
  this.ca = opts.ca || null;
  this.ciphers = opts.ciphers || null;
  this.rejectUnauthorized = opts.rejectUnauthorized === undefined ? null : opts.rejectUnauthorized;

  // other options for Node.js client
  var freeGlobal = typeof global === 'object' && global;
  if (freeGlobal.global === freeGlobal) {
    if (opts.extraHeaders && Object.keys(opts.extraHeaders).length > 0) {
      this.extraHeaders = opts.extraHeaders;
    }
  }

  // set on handshake
  this.id = null;
  this.upgrades = null;
  this.pingInterval = null;
  this.pingTimeout = null;

  // set on heartbeat
  this.pingIntervalTimer = null;
  this.pingTimeoutTimer = null;

  this.open();
}

Socket.priorWebsocketSuccess = false;

/**
 * Mix in `Emitter`.
 */

Emitter(Socket.prototype);

/**
 * Protocol version.
 *
 * @api public
 */

Socket.protocol = parser.protocol; // this is an int

/**
 * Expose deps for legacy compatibility
 * and standalone browser access.
 */

Socket.Socket = Socket;
Socket.Transport = require('./transport');
Socket.transports = require('./transports/index');
Socket.parser = require('engine.io-parser');

/**
 * Creates transport of the given type.
 *
 * @param {String} transport name
 * @return {Transport}
 * @api private
 */

Socket.prototype.createTransport = function (name) {
  debug('creating transport "%s"', name);
  var query = clone(this.query);

  // append engine.io protocol identifier
  query.EIO = parser.protocol;

  // transport name
  query.transport = name;

  // session id if we already have one
  if (this.id) query.sid = this.id;

  var transport = new transports[name]({
    agent: this.agent,
    hostname: this.hostname,
    port: this.port,
    secure: this.secure,
    path: this.path,
    query: query,
    forceJSONP: this.forceJSONP,
    jsonp: this.jsonp,
    forceBase64: this.forceBase64,
    enablesXDR: this.enablesXDR,
    timestampRequests: this.timestampRequests,
    timestampParam: this.timestampParam,
    policyPort: this.policyPort,
    socket: this,
    pfx: this.pfx,
    key: this.key,
    passphrase: this.passphrase,
    cert: this.cert,
    ca: this.ca,
    ciphers: this.ciphers,
    rejectUnauthorized: this.rejectUnauthorized,
    perMessageDeflate: this.perMessageDeflate,
    extraHeaders: this.extraHeaders
  });

  return transport;
};

function clone (obj) {
  var o = {};
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      o[i] = obj[i];
    }
  }
  return o;
}

/**
 * Initializes transport to use and starts probe.
 *
 * @api private
 */
Socket.prototype.open = function () {
  var transport;
  if (this.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf('websocket') !== -1) {
    transport = 'websocket';
  } else if (0 === this.transports.length) {
    // Emit error on next tick so it can be listened to
    var self = this;
    setTimeout(function () {
      self.emit('error', 'No transports available');
    }, 0);
    return;
  } else {
    transport = this.transports[0];
  }
  this.readyState = 'opening';

  // Retry with the next transport if the transport is disabled (jsonp: false)
  try {
    transport = this.createTransport(transport);
  } catch (e) {
    this.transports.shift();
    this.open();
    return;
  }

  transport.open();
  this.setTransport(transport);
};

/**
 * Sets the current transport. Disables the existing one (if any).
 *
 * @api private
 */

Socket.prototype.setTransport = function (transport) {
  debug('setting transport %s', transport.name);
  var self = this;

  if (this.transport) {
    debug('clearing existing transport %s', this.transport.name);
    this.transport.removeAllListeners();
  }

  // set up transport
  this.transport = transport;

  // set up transport listeners
  transport
  .on('drain', function () {
    self.onDrain();
  })
  .on('packet', function (packet) {
    self.onPacket(packet);
  })
  .on('error', function (e) {
    self.onError(e);
  })
  .on('close', function () {
    self.onClose('transport close');
  });
};

/**
 * Probes a transport.
 *
 * @param {String} transport name
 * @api private
 */

Socket.prototype.probe = function (name) {
  debug('probing transport "%s"', name);
  var transport = this.createTransport(name, { probe: 1 });
  var failed = false;
  var self = this;

  Socket.priorWebsocketSuccess = false;

  function onTransportOpen () {
    if (self.onlyBinaryUpgrades) {
      var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
      failed = failed || upgradeLosesBinary;
    }
    if (failed) return;

    debug('probe transport "%s" opened', name);
    transport.send([{ type: 'ping', data: 'probe' }]);
    transport.once('packet', function (msg) {
      if (failed) return;
      if ('pong' === msg.type && 'probe' === msg.data) {
        debug('probe transport "%s" pong', name);
        self.upgrading = true;
        self.emit('upgrading', transport);
        if (!transport) return;
        Socket.priorWebsocketSuccess = 'websocket' === transport.name;

        debug('pausing current transport "%s"', self.transport.name);
        self.transport.pause(function () {
          if (failed) return;
          if ('closed' === self.readyState) return;
          debug('changing transport and sending upgrade packet');

          cleanup();

          self.setTransport(transport);
          transport.send([{ type: 'upgrade' }]);
          self.emit('upgrade', transport);
          transport = null;
          self.upgrading = false;
          self.flush();
        });
      } else {
        debug('probe transport "%s" failed', name);
        var err = new Error('probe error');
        err.transport = transport.name;
        self.emit('upgradeError', err);
      }
    });
  }

  function freezeTransport () {
    if (failed) return;

    // Any callback called by transport should be ignored since now
    failed = true;

    cleanup();

    transport.close();
    transport = null;
  }

  // Handle any error that happens while probing
  function onerror (err) {
    var error = new Error('probe error: ' + err);
    error.transport = transport.name;

    freezeTransport();

    debug('probe transport "%s" failed because of error: %s', name, err);

    self.emit('upgradeError', error);
  }

  function onTransportClose () {
    onerror('transport closed');
  }

  // When the socket is closed while we're probing
  function onclose () {
    onerror('socket closed');
  }

  // When the socket is upgraded while we're probing
  function onupgrade (to) {
    if (transport && to.name !== transport.name) {
      debug('"%s" works - aborting "%s"', to.name, transport.name);
      freezeTransport();
    }
  }

  // Remove all listeners on the transport and on self
  function cleanup () {
    transport.removeListener('open', onTransportOpen);
    transport.removeListener('error', onerror);
    transport.removeListener('close', onTransportClose);
    self.removeListener('close', onclose);
    self.removeListener('upgrading', onupgrade);
  }

  transport.once('open', onTransportOpen);
  transport.once('error', onerror);
  transport.once('close', onTransportClose);

  this.once('close', onclose);
  this.once('upgrading', onupgrade);

  transport.open();
};

/**
 * Called when connection is deemed open.
 *
 * @api public
 */

Socket.prototype.onOpen = function () {
  debug('socket open');
  this.readyState = 'open';
  Socket.priorWebsocketSuccess = 'websocket' === this.transport.name;
  this.emit('open');
  this.flush();

  // we check for `readyState` in case an `open`
  // listener already closed the socket
  if ('open' === this.readyState && this.upgrade && this.transport.pause) {
    debug('starting upgrade probes');
    for (var i = 0, l = this.upgrades.length; i < l; i++) {
      this.probe(this.upgrades[i]);
    }
  }
};

/**
 * Handles a packet.
 *
 * @api private
 */

Socket.prototype.onPacket = function (packet) {
  if ('opening' === this.readyState || 'open' === this.readyState ||
      'closing' === this.readyState) {
    debug('socket receive: type "%s", data "%s"', packet.type, packet.data);

    this.emit('packet', packet);

    // Socket is live - any packet counts
    this.emit('heartbeat');

    switch (packet.type) {
      case 'open':
        this.onHandshake(parsejson(packet.data));
        break;

      case 'pong':
        this.setPing();
        this.emit('pong');
        break;

      case 'error':
        var err = new Error('server error');
        err.code = packet.data;
        this.onError(err);
        break;

      case 'message':
        this.emit('data', packet.data);
        this.emit('message', packet.data);
        break;
    }
  } else {
    debug('packet received with socket readyState "%s"', this.readyState);
  }
};

/**
 * Called upon handshake completion.
 *
 * @param {Object} handshake obj
 * @api private
 */

Socket.prototype.onHandshake = function (data) {
  this.emit('handshake', data);
  this.id = data.sid;
  this.transport.query.sid = data.sid;
  this.upgrades = this.filterUpgrades(data.upgrades);
  this.pingInterval = data.pingInterval;
  this.pingTimeout = data.pingTimeout;
  this.onOpen();
  // In case open handler closes socket
  if ('closed' === this.readyState) return;
  this.setPing();

  // Prolong liveness of socket on heartbeat
  this.removeListener('heartbeat', this.onHeartbeat);
  this.on('heartbeat', this.onHeartbeat);
};

/**
 * Resets ping timeout.
 *
 * @api private
 */

Socket.prototype.onHeartbeat = function (timeout) {
  clearTimeout(this.pingTimeoutTimer);
  var self = this;
  self.pingTimeoutTimer = setTimeout(function () {
    if ('closed' === self.readyState) return;
    self.onClose('ping timeout');
  }, timeout || (self.pingInterval + self.pingTimeout));
};

/**
 * Pings server every `this.pingInterval` and expects response
 * within `this.pingTimeout` or closes connection.
 *
 * @api private
 */

Socket.prototype.setPing = function () {
  var self = this;
  clearTimeout(self.pingIntervalTimer);
  self.pingIntervalTimer = setTimeout(function () {
    debug('writing ping packet - expecting pong within %sms', self.pingTimeout);
    self.ping();
    self.onHeartbeat(self.pingTimeout);
  }, self.pingInterval);
};

/**
* Sends a ping packet.
*
* @api private
*/

Socket.prototype.ping = function () {
  var self = this;
  this.sendPacket('ping', function () {
    self.emit('ping');
  });
};

/**
 * Called on `drain` event
 *
 * @api private
 */

Socket.prototype.onDrain = function () {
  this.writeBuffer.splice(0, this.prevBufferLen);

  // setting prevBufferLen = 0 is very important
  // for example, when upgrading, upgrade packet is sent over,
  // and a nonzero prevBufferLen could cause problems on `drain`
  this.prevBufferLen = 0;

  if (0 === this.writeBuffer.length) {
    this.emit('drain');
  } else {
    this.flush();
  }
};

/**
 * Flush write buffers.
 *
 * @api private
 */

Socket.prototype.flush = function () {
  if ('closed' !== this.readyState && this.transport.writable &&
    !this.upgrading && this.writeBuffer.length) {
    debug('flushing %d packets in socket', this.writeBuffer.length);
    this.transport.send(this.writeBuffer);
    // keep track of current length of writeBuffer
    // splice writeBuffer and callbackBuffer on `drain`
    this.prevBufferLen = this.writeBuffer.length;
    this.emit('flush');
  }
};

/**
 * Sends a message.
 *
 * @param {String} message.
 * @param {Function} callback function.
 * @param {Object} options.
 * @return {Socket} for chaining.
 * @api public
 */

Socket.prototype.write =
Socket.prototype.send = function (msg, options, fn) {
  this.sendPacket('message', msg, options, fn);
  return this;
};

/**
 * Sends a packet.
 *
 * @param {String} packet type.
 * @param {String} data.
 * @param {Object} options.
 * @param {Function} callback function.
 * @api private
 */

Socket.prototype.sendPacket = function (type, data, options, fn) {
  if ('function' === typeof data) {
    fn = data;
    data = undefined;
  }

  if ('function' === typeof options) {
    fn = options;
    options = null;
  }

  if ('closing' === this.readyState || 'closed' === this.readyState) {
    return;
  }

  options = options || {};
  options.compress = false !== options.compress;

  var packet = {
    type: type,
    data: data,
    options: options
  };
  this.emit('packetCreate', packet);
  this.writeBuffer.push(packet);
  if (fn) this.once('flush', fn);
  this.flush();
};

/**
 * Closes the connection.
 *
 * @api private
 */

Socket.prototype.close = function () {
  if ('opening' === this.readyState || 'open' === this.readyState) {
    this.readyState = 'closing';

    var self = this;

    if (this.writeBuffer.length) {
      this.once('drain', function () {
        if (this.upgrading) {
          waitForUpgrade();
        } else {
          close();
        }
      });
    } else if (this.upgrading) {
      waitForUpgrade();
    } else {
      close();
    }
  }

  function close () {
    self.onClose('forced close');
    debug('socket closing - telling transport to close');
    self.transport.close();
  }

  function cleanupAndClose () {
    self.removeListener('upgrade', cleanupAndClose);
    self.removeListener('upgradeError', cleanupAndClose);
    close();
  }

  function waitForUpgrade () {
    // wait for upgrade to finish since we can't send packets while pausing a transport
    self.once('upgrade', cleanupAndClose);
    self.once('upgradeError', cleanupAndClose);
  }

  return this;
};

/**
 * Called upon transport error
 *
 * @api private
 */

Socket.prototype.onError = function (err) {
  debug('socket error %j', err);
  Socket.priorWebsocketSuccess = false;
  this.emit('error', err);
  this.onClose('transport error', err);
};

/**
 * Called upon transport close.
 *
 * @api private
 */

Socket.prototype.onClose = function (reason, desc) {
  if ('opening' === this.readyState || 'open' === this.readyState || 'closing' === this.readyState) {
    debug('socket close with reason: "%s"', reason);
    var self = this;

    // clear timers
    clearTimeout(this.pingIntervalTimer);
    clearTimeout(this.pingTimeoutTimer);

    // stop event from firing again for transport
    this.transport.removeAllListeners('close');

    // ensure transport won't stay open
    this.transport.close();

    // ignore further transport communication
    this.transport.removeAllListeners();

    // set ready state
    this.readyState = 'closed';

    // clear session id
    this.id = null;

    // emit close event
    this.emit('close', reason, desc);

    // clean buffers after, so users can still
    // grab the buffers on `close` event
    self.writeBuffer = [];
    self.prevBufferLen = 0;
  }
};

/**
 * Filters upgrades, returning only those matching client transports.
 *
 * @param {Array} server upgrades
 * @api private
 *
 */

Socket.prototype.filterUpgrades = function (upgrades) {
  var filteredUpgrades = [];
  for (var i = 0, j = upgrades.length; i < j; i++) {
    if (~index(this.transports, upgrades[i])) filteredUpgrades.push(upgrades[i]);
  }
  return filteredUpgrades;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./transport":17,"./transports/index":18,"component-emitter":10,"debug":12,"engine.io-parser":24,"indexof":29,"parsejson":32,"parseqs":33,"parseuri":34}],17:[function(require,module,exports){
/**
 * Module dependencies.
 */

var parser = require('engine.io-parser');
var Emitter = require('component-emitter');

/**
 * Module exports.
 */

module.exports = Transport;

/**
 * Transport abstract constructor.
 *
 * @param {Object} options.
 * @api private
 */

function Transport (opts) {
  this.path = opts.path;
  this.hostname = opts.hostname;
  this.port = opts.port;
  this.secure = opts.secure;
  this.query = opts.query;
  this.timestampParam = opts.timestampParam;
  this.timestampRequests = opts.timestampRequests;
  this.readyState = '';
  this.agent = opts.agent || false;
  this.socket = opts.socket;
  this.enablesXDR = opts.enablesXDR;

  // SSL options for Node.js client
  this.pfx = opts.pfx;
  this.key = opts.key;
  this.passphrase = opts.passphrase;
  this.cert = opts.cert;
  this.ca = opts.ca;
  this.ciphers = opts.ciphers;
  this.rejectUnauthorized = opts.rejectUnauthorized;

  // other options for Node.js client
  this.extraHeaders = opts.extraHeaders;
}

/**
 * Mix in `Emitter`.
 */

Emitter(Transport.prototype);

/**
 * Emits an error.
 *
 * @param {String} str
 * @return {Transport} for chaining
 * @api public
 */

Transport.prototype.onError = function (msg, desc) {
  var err = new Error(msg);
  err.type = 'TransportError';
  err.description = desc;
  this.emit('error', err);
  return this;
};

/**
 * Opens the transport.
 *
 * @api public
 */

Transport.prototype.open = function () {
  if ('closed' === this.readyState || '' === this.readyState) {
    this.readyState = 'opening';
    this.doOpen();
  }

  return this;
};

/**
 * Closes the transport.
 *
 * @api private
 */

Transport.prototype.close = function () {
  if ('opening' === this.readyState || 'open' === this.readyState) {
    this.doClose();
    this.onClose();
  }

  return this;
};

/**
 * Sends multiple packets.
 *
 * @param {Array} packets
 * @api private
 */

Transport.prototype.send = function (packets) {
  if ('open' === this.readyState) {
    this.write(packets);
  } else {
    throw new Error('Transport not open');
  }
};

/**
 * Called upon open
 *
 * @api private
 */

Transport.prototype.onOpen = function () {
  this.readyState = 'open';
  this.writable = true;
  this.emit('open');
};

/**
 * Called with data.
 *
 * @param {String} data
 * @api private
 */

Transport.prototype.onData = function (data) {
  var packet = parser.decodePacket(data, this.socket.binaryType);
  this.onPacket(packet);
};

/**
 * Called with a decoded packet.
 */

Transport.prototype.onPacket = function (packet) {
  this.emit('packet', packet);
};

/**
 * Called upon close.
 *
 * @api private
 */

Transport.prototype.onClose = function () {
  this.readyState = 'closed';
  this.emit('close');
};

},{"component-emitter":10,"engine.io-parser":24}],18:[function(require,module,exports){
(function (global){
/**
 * Module dependencies
 */

var XMLHttpRequest = require('xmlhttprequest-ssl');
var XHR = require('./polling-xhr');
var JSONP = require('./polling-jsonp');
var websocket = require('./websocket');

/**
 * Export transports.
 */

exports.polling = polling;
exports.websocket = websocket;

/**
 * Polling transport polymorphic constructor.
 * Decides on xhr vs jsonp based on feature detection.
 *
 * @api private
 */

function polling (opts) {
  var xhr;
  var xd = false;
  var xs = false;
  var jsonp = false !== opts.jsonp;

  if (global.location) {
    var isSSL = 'https:' === location.protocol;
    var port = location.port;

    // some user agents have empty `location.port`
    if (!port) {
      port = isSSL ? 443 : 80;
    }

    xd = opts.hostname !== location.hostname || port !== opts.port;
    xs = opts.secure !== isSSL;
  }

  opts.xdomain = xd;
  opts.xscheme = xs;
  xhr = new XMLHttpRequest(opts);

  if ('open' in xhr && !opts.forceJSONP) {
    return new XHR(opts);
  } else {
    if (!jsonp) throw new Error('JSONP disabled');
    return new JSONP(opts);
  }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./polling-jsonp":19,"./polling-xhr":20,"./websocket":22,"xmlhttprequest-ssl":23}],19:[function(require,module,exports){
(function (global){

/**
 * Module requirements.
 */

var Polling = require('./polling');
var inherit = require('component-inherit');

/**
 * Module exports.
 */

module.exports = JSONPPolling;

/**
 * Cached regular expressions.
 */

var rNewline = /\n/g;
var rEscapedNewline = /\\n/g;

/**
 * Global JSONP callbacks.
 */

var callbacks;

/**
 * Noop.
 */

function empty () { }

/**
 * JSONP Polling constructor.
 *
 * @param {Object} opts.
 * @api public
 */

function JSONPPolling (opts) {
  Polling.call(this, opts);

  this.query = this.query || {};

  // define global callbacks array if not present
  // we do this here (lazily) to avoid unneeded global pollution
  if (!callbacks) {
    // we need to consider multiple engines in the same page
    if (!global.___eio) global.___eio = [];
    callbacks = global.___eio;
  }

  // callback identifier
  this.index = callbacks.length;

  // add callback to jsonp global
  var self = this;
  callbacks.push(function (msg) {
    self.onData(msg);
  });

  // append to query string
  this.query.j = this.index;

  // prevent spurious errors from being emitted when the window is unloaded
  if (global.document && global.addEventListener) {
    global.addEventListener('beforeunload', function () {
      if (self.script) self.script.onerror = empty;
    }, false);
  }
}

/**
 * Inherits from Polling.
 */

inherit(JSONPPolling, Polling);

/*
 * JSONP only supports binary as base64 encoded strings
 */

JSONPPolling.prototype.supportsBinary = false;

/**
 * Closes the socket.
 *
 * @api private
 */

JSONPPolling.prototype.doClose = function () {
  if (this.script) {
    this.script.parentNode.removeChild(this.script);
    this.script = null;
  }

  if (this.form) {
    this.form.parentNode.removeChild(this.form);
    this.form = null;
    this.iframe = null;
  }

  Polling.prototype.doClose.call(this);
};

/**
 * Starts a poll cycle.
 *
 * @api private
 */

JSONPPolling.prototype.doPoll = function () {
  var self = this;
  var script = document.createElement('script');

  if (this.script) {
    this.script.parentNode.removeChild(this.script);
    this.script = null;
  }

  script.async = true;
  script.src = this.uri();
  script.onerror = function (e) {
    self.onError('jsonp poll error', e);
  };

  var insertAt = document.getElementsByTagName('script')[0];
  if (insertAt) {
    insertAt.parentNode.insertBefore(script, insertAt);
  } else {
    (document.head || document.body).appendChild(script);
  }
  this.script = script;

  var isUAgecko = 'undefined' !== typeof navigator && /gecko/i.test(navigator.userAgent);

  if (isUAgecko) {
    setTimeout(function () {
      var iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      document.body.removeChild(iframe);
    }, 100);
  }
};

/**
 * Writes with a hidden iframe.
 *
 * @param {String} data to send
 * @param {Function} called upon flush.
 * @api private
 */

JSONPPolling.prototype.doWrite = function (data, fn) {
  var self = this;

  if (!this.form) {
    var form = document.createElement('form');
    var area = document.createElement('textarea');
    var id = this.iframeId = 'eio_iframe_' + this.index;
    var iframe;

    form.className = 'socketio';
    form.style.position = 'absolute';
    form.style.top = '-1000px';
    form.style.left = '-1000px';
    form.target = id;
    form.method = 'POST';
    form.setAttribute('accept-charset', 'utf-8');
    area.name = 'd';
    form.appendChild(area);
    document.body.appendChild(form);

    this.form = form;
    this.area = area;
  }

  this.form.action = this.uri();

  function complete () {
    initIframe();
    fn();
  }

  function initIframe () {
    if (self.iframe) {
      try {
        self.form.removeChild(self.iframe);
      } catch (e) {
        self.onError('jsonp polling iframe removal error', e);
      }
    }

    try {
      // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
      var html = '<iframe src="javascript:0" name="' + self.iframeId + '">';
      iframe = document.createElement(html);
    } catch (e) {
      iframe = document.createElement('iframe');
      iframe.name = self.iframeId;
      iframe.src = 'javascript:0';
    }

    iframe.id = self.iframeId;

    self.form.appendChild(iframe);
    self.iframe = iframe;
  }

  initIframe();

  // escape \n to prevent it from being converted into \r\n by some UAs
  // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
  data = data.replace(rEscapedNewline, '\\\n');
  this.area.value = data.replace(rNewline, '\\n');

  try {
    this.form.submit();
  } catch (e) {}

  if (this.iframe.attachEvent) {
    this.iframe.onreadystatechange = function () {
      if (self.iframe.readyState === 'complete') {
        complete();
      }
    };
  } else {
    this.iframe.onload = complete;
  }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./polling":21,"component-inherit":11}],20:[function(require,module,exports){
(function (global){
/**
 * Module requirements.
 */

var XMLHttpRequest = require('xmlhttprequest-ssl');
var Polling = require('./polling');
var Emitter = require('component-emitter');
var inherit = require('component-inherit');
var debug = require('debug')('engine.io-client:polling-xhr');

/**
 * Module exports.
 */

module.exports = XHR;
module.exports.Request = Request;

/**
 * Empty function
 */

function empty () {}

/**
 * XHR Polling constructor.
 *
 * @param {Object} opts
 * @api public
 */

function XHR (opts) {
  Polling.call(this, opts);

  if (global.location) {
    var isSSL = 'https:' === location.protocol;
    var port = location.port;

    // some user agents have empty `location.port`
    if (!port) {
      port = isSSL ? 443 : 80;
    }

    this.xd = opts.hostname !== global.location.hostname ||
      port !== opts.port;
    this.xs = opts.secure !== isSSL;
  } else {
    this.extraHeaders = opts.extraHeaders;
  }
}

/**
 * Inherits from Polling.
 */

inherit(XHR, Polling);

/**
 * XHR supports binary
 */

XHR.prototype.supportsBinary = true;

/**
 * Creates a request.
 *
 * @param {String} method
 * @api private
 */

XHR.prototype.request = function (opts) {
  opts = opts || {};
  opts.uri = this.uri();
  opts.xd = this.xd;
  opts.xs = this.xs;
  opts.agent = this.agent || false;
  opts.supportsBinary = this.supportsBinary;
  opts.enablesXDR = this.enablesXDR;

  // SSL options for Node.js client
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;

  // other options for Node.js client
  opts.extraHeaders = this.extraHeaders;

  return new Request(opts);
};

/**
 * Sends data.
 *
 * @param {String} data to send.
 * @param {Function} called upon flush.
 * @api private
 */

XHR.prototype.doWrite = function (data, fn) {
  var isBinary = typeof data !== 'string' && data !== undefined;
  var req = this.request({ method: 'POST', data: data, isBinary: isBinary });
  var self = this;
  req.on('success', fn);
  req.on('error', function (err) {
    self.onError('xhr post error', err);
  });
  this.sendXhr = req;
};

/**
 * Starts a poll cycle.
 *
 * @api private
 */

XHR.prototype.doPoll = function () {
  debug('xhr poll');
  var req = this.request();
  var self = this;
  req.on('data', function (data) {
    self.onData(data);
  });
  req.on('error', function (err) {
    self.onError('xhr poll error', err);
  });
  this.pollXhr = req;
};

/**
 * Request constructor
 *
 * @param {Object} options
 * @api public
 */

function Request (opts) {
  this.method = opts.method || 'GET';
  this.uri = opts.uri;
  this.xd = !!opts.xd;
  this.xs = !!opts.xs;
  this.async = false !== opts.async;
  this.data = undefined !== opts.data ? opts.data : null;
  this.agent = opts.agent;
  this.isBinary = opts.isBinary;
  this.supportsBinary = opts.supportsBinary;
  this.enablesXDR = opts.enablesXDR;

  // SSL options for Node.js client
  this.pfx = opts.pfx;
  this.key = opts.key;
  this.passphrase = opts.passphrase;
  this.cert = opts.cert;
  this.ca = opts.ca;
  this.ciphers = opts.ciphers;
  this.rejectUnauthorized = opts.rejectUnauthorized;

  // other options for Node.js client
  this.extraHeaders = opts.extraHeaders;

  this.create();
}

/**
 * Mix in `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Creates the XHR object and sends the request.
 *
 * @api private
 */

Request.prototype.create = function () {
  var opts = { agent: this.agent, xdomain: this.xd, xscheme: this.xs, enablesXDR: this.enablesXDR };

  // SSL options for Node.js client
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;

  var xhr = this.xhr = new XMLHttpRequest(opts);
  var self = this;

  try {
    debug('xhr open %s: %s', this.method, this.uri);
    xhr.open(this.method, this.uri, this.async);
    try {
      if (this.extraHeaders) {
        xhr.setDisableHeaderCheck(true);
        for (var i in this.extraHeaders) {
          if (this.extraHeaders.hasOwnProperty(i)) {
            xhr.setRequestHeader(i, this.extraHeaders[i]);
          }
        }
      }
    } catch (e) {}
    if (this.supportsBinary) {
      // This has to be done after open because Firefox is stupid
      // http://stackoverflow.com/questions/13216903/get-binary-data-with-xmlhttprequest-in-a-firefox-extension
      xhr.responseType = 'arraybuffer';
    }

    if ('POST' === this.method) {
      try {
        if (this.isBinary) {
          xhr.setRequestHeader('Content-type', 'application/octet-stream');
        } else {
          xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
        }
      } catch (e) {}
    }

    try {
      xhr.setRequestHeader('Accept', '*/*');
    } catch (e) {}

    // ie6 check
    if ('withCredentials' in xhr) {
      xhr.withCredentials = true;
    }

    if (this.hasXDR()) {
      xhr.onload = function () {
        self.onLoad();
      };
      xhr.onerror = function () {
        self.onError(xhr.responseText);
      };
    } else {
      xhr.onreadystatechange = function () {
        if (4 !== xhr.readyState) return;
        if (200 === xhr.status || 1223 === xhr.status) {
          self.onLoad();
        } else {
          // make sure the `error` event handler that's user-set
          // does not throw in the same tick and gets caught here
          setTimeout(function () {
            self.onError(xhr.status);
          }, 0);
        }
      };
    }

    debug('xhr data %s', this.data);
    xhr.send(this.data);
  } catch (e) {
    // Need to defer since .create() is called directly fhrom the constructor
    // and thus the 'error' event can only be only bound *after* this exception
    // occurs.  Therefore, also, we cannot throw here at all.
    setTimeout(function () {
      self.onError(e);
    }, 0);
    return;
  }

  if (global.document) {
    this.index = Request.requestsCount++;
    Request.requests[this.index] = this;
  }
};

/**
 * Called upon successful response.
 *
 * @api private
 */

Request.prototype.onSuccess = function () {
  this.emit('success');
  this.cleanup();
};

/**
 * Called if we have data.
 *
 * @api private
 */

Request.prototype.onData = function (data) {
  this.emit('data', data);
  this.onSuccess();
};

/**
 * Called upon error.
 *
 * @api private
 */

Request.prototype.onError = function (err) {
  this.emit('error', err);
  this.cleanup(true);
};

/**
 * Cleans up house.
 *
 * @api private
 */

Request.prototype.cleanup = function (fromError) {
  if ('undefined' === typeof this.xhr || null === this.xhr) {
    return;
  }
  // xmlhttprequest
  if (this.hasXDR()) {
    this.xhr.onload = this.xhr.onerror = empty;
  } else {
    this.xhr.onreadystatechange = empty;
  }

  if (fromError) {
    try {
      this.xhr.abort();
    } catch (e) {}
  }

  if (global.document) {
    delete Request.requests[this.index];
  }

  this.xhr = null;
};

/**
 * Called upon load.
 *
 * @api private
 */

Request.prototype.onLoad = function () {
  var data;
  try {
    var contentType;
    try {
      contentType = this.xhr.getResponseHeader('Content-Type').split(';')[0];
    } catch (e) {}
    if (contentType === 'application/octet-stream') {
      data = this.xhr.response || this.xhr.responseText;
    } else {
      if (!this.supportsBinary) {
        data = this.xhr.responseText;
      } else {
        try {
          data = String.fromCharCode.apply(null, new Uint8Array(this.xhr.response));
        } catch (e) {
          var ui8Arr = new Uint8Array(this.xhr.response);
          var dataArray = [];
          for (var idx = 0, length = ui8Arr.length; idx < length; idx++) {
            dataArray.push(ui8Arr[idx]);
          }

          data = String.fromCharCode.apply(null, dataArray);
        }
      }
    }
  } catch (e) {
    this.onError(e);
  }
  if (null != data) {
    this.onData(data);
  }
};

/**
 * Check if it has XDomainRequest.
 *
 * @api private
 */

Request.prototype.hasXDR = function () {
  return 'undefined' !== typeof global.XDomainRequest && !this.xs && this.enablesXDR;
};

/**
 * Aborts the request.
 *
 * @api public
 */

Request.prototype.abort = function () {
  this.cleanup();
};

/**
 * Aborts pending requests when unloading the window. This is needed to prevent
 * memory leaks (e.g. when using IE) and to ensure that no spurious error is
 * emitted.
 */

Request.requestsCount = 0;
Request.requests = {};

if (global.document) {
  if (global.attachEvent) {
    global.attachEvent('onunload', unloadHandler);
  } else if (global.addEventListener) {
    global.addEventListener('beforeunload', unloadHandler, false);
  }
}

function unloadHandler () {
  for (var i in Request.requests) {
    if (Request.requests.hasOwnProperty(i)) {
      Request.requests[i].abort();
    }
  }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./polling":21,"component-emitter":10,"component-inherit":11,"debug":12,"xmlhttprequest-ssl":23}],21:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Transport = require('../transport');
var parseqs = require('parseqs');
var parser = require('engine.io-parser');
var inherit = require('component-inherit');
var yeast = require('yeast');
var debug = require('debug')('engine.io-client:polling');

/**
 * Module exports.
 */

module.exports = Polling;

/**
 * Is XHR2 supported?
 */

var hasXHR2 = (function () {
  var XMLHttpRequest = require('xmlhttprequest-ssl');
  var xhr = new XMLHttpRequest({ xdomain: false });
  return null != xhr.responseType;
})();

/**
 * Polling interface.
 *
 * @param {Object} opts
 * @api private
 */

function Polling (opts) {
  var forceBase64 = (opts && opts.forceBase64);
  if (!hasXHR2 || forceBase64) {
    this.supportsBinary = false;
  }
  Transport.call(this, opts);
}

/**
 * Inherits from Transport.
 */

inherit(Polling, Transport);

/**
 * Transport name.
 */

Polling.prototype.name = 'polling';

/**
 * Opens the socket (triggers polling). We write a PING message to determine
 * when the transport is open.
 *
 * @api private
 */

Polling.prototype.doOpen = function () {
  this.poll();
};

/**
 * Pauses polling.
 *
 * @param {Function} callback upon buffers are flushed and transport is paused
 * @api private
 */

Polling.prototype.pause = function (onPause) {
  var self = this;

  this.readyState = 'pausing';

  function pause () {
    debug('paused');
    self.readyState = 'paused';
    onPause();
  }

  if (this.polling || !this.writable) {
    var total = 0;

    if (this.polling) {
      debug('we are currently polling - waiting to pause');
      total++;
      this.once('pollComplete', function () {
        debug('pre-pause polling complete');
        --total || pause();
      });
    }

    if (!this.writable) {
      debug('we are currently writing - waiting to pause');
      total++;
      this.once('drain', function () {
        debug('pre-pause writing complete');
        --total || pause();
      });
    }
  } else {
    pause();
  }
};

/**
 * Starts polling cycle.
 *
 * @api public
 */

Polling.prototype.poll = function () {
  debug('polling');
  this.polling = true;
  this.doPoll();
  this.emit('poll');
};

/**
 * Overloads onData to detect payloads.
 *
 * @api private
 */

Polling.prototype.onData = function (data) {
  var self = this;
  debug('polling got data %s', data);
  var callback = function (packet, index, total) {
    // if its the first message we consider the transport open
    if ('opening' === self.readyState) {
      self.onOpen();
    }

    // if its a close packet, we close the ongoing requests
    if ('close' === packet.type) {
      self.onClose();
      return false;
    }

    // otherwise bypass onData and handle the message
    self.onPacket(packet);
  };

  // decode payload
  parser.decodePayload(data, this.socket.binaryType, callback);

  // if an event did not trigger closing
  if ('closed' !== this.readyState) {
    // if we got data we're not polling
    this.polling = false;
    this.emit('pollComplete');

    if ('open' === this.readyState) {
      this.poll();
    } else {
      debug('ignoring poll - transport state "%s"', this.readyState);
    }
  }
};

/**
 * For polling, send a close packet.
 *
 * @api private
 */

Polling.prototype.doClose = function () {
  var self = this;

  function close () {
    debug('writing close packet');
    self.write([{ type: 'close' }]);
  }

  if ('open' === this.readyState) {
    debug('transport open - closing');
    close();
  } else {
    // in case we're trying to close while
    // handshaking is in progress (GH-164)
    debug('transport not open - deferring close');
    this.once('open', close);
  }
};

/**
 * Writes a packets payload.
 *
 * @param {Array} data packets
 * @param {Function} drain callback
 * @api private
 */

Polling.prototype.write = function (packets) {
  var self = this;
  this.writable = false;
  var callbackfn = function () {
    self.writable = true;
    self.emit('drain');
  };

  parser.encodePayload(packets, this.supportsBinary, function (data) {
    self.doWrite(data, callbackfn);
  });
};

/**
 * Generates uri for connection.
 *
 * @api private
 */

Polling.prototype.uri = function () {
  var query = this.query || {};
  var schema = this.secure ? 'https' : 'http';
  var port = '';

  // cache busting is forced
  if (false !== this.timestampRequests) {
    query[this.timestampParam] = yeast();
  }

  if (!this.supportsBinary && !query.sid) {
    query.b64 = 1;
  }

  query = parseqs.encode(query);

  // avoid port if default for schema
  if (this.port && (('https' === schema && this.port !== 443) ||
     ('http' === schema && this.port !== 80))) {
    port = ':' + this.port;
  }

  // prepend ? to query
  if (query.length) {
    query = '?' + query;
  }

  var ipv6 = this.hostname.indexOf(':') !== -1;
  return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
};

},{"../transport":17,"component-inherit":11,"debug":12,"engine.io-parser":24,"parseqs":33,"xmlhttprequest-ssl":23,"yeast":47}],22:[function(require,module,exports){
(function (global){
/**
 * Module dependencies.
 */

var Transport = require('../transport');
var parser = require('engine.io-parser');
var parseqs = require('parseqs');
var inherit = require('component-inherit');
var yeast = require('yeast');
var debug = require('debug')('engine.io-client:websocket');
var BrowserWebSocket = global.WebSocket || global.MozWebSocket;

/**
 * Get either the `WebSocket` or `MozWebSocket` globals
 * in the browser or try to resolve WebSocket-compatible
 * interface exposed by `ws` for Node-like environment.
 */

var WebSocket = BrowserWebSocket;
if (!WebSocket && typeof window === 'undefined') {
  try {
    WebSocket = require('ws');
  } catch (e) { }
}

/**
 * Module exports.
 */

module.exports = WS;

/**
 * WebSocket transport constructor.
 *
 * @api {Object} connection options
 * @api public
 */

function WS (opts) {
  var forceBase64 = (opts && opts.forceBase64);
  if (forceBase64) {
    this.supportsBinary = false;
  }
  this.perMessageDeflate = opts.perMessageDeflate;
  Transport.call(this, opts);
}

/**
 * Inherits from Transport.
 */

inherit(WS, Transport);

/**
 * Transport name.
 *
 * @api public
 */

WS.prototype.name = 'websocket';

/*
 * WebSockets support binary
 */

WS.prototype.supportsBinary = true;

/**
 * Opens socket.
 *
 * @api private
 */

WS.prototype.doOpen = function () {
  if (!this.check()) {
    // let probe timeout
    return;
  }

  var uri = this.uri();
  var protocols = void (0);
  var opts = {
    agent: this.agent,
    perMessageDeflate: this.perMessageDeflate
  };

  // SSL options for Node.js client
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;
  if (this.extraHeaders) {
    opts.headers = this.extraHeaders;
  }

  try {
    this.ws = BrowserWebSocket ? new WebSocket(uri) : new WebSocket(uri, protocols, opts);
  } catch (err) {
    return this.emit('error', err);
  }

  if (this.ws.binaryType === undefined) {
    this.supportsBinary = false;
  }

  if (this.ws.supports && this.ws.supports.binary) {
    this.supportsBinary = true;
    this.ws.binaryType = 'nodebuffer';
  } else {
    this.ws.binaryType = 'arraybuffer';
  }

  this.addEventListeners();
};

/**
 * Adds event listeners to the socket
 *
 * @api private
 */

WS.prototype.addEventListeners = function () {
  var self = this;

  this.ws.onopen = function () {
    self.onOpen();
  };
  this.ws.onclose = function () {
    self.onClose();
  };
  this.ws.onmessage = function (ev) {
    self.onData(ev.data);
  };
  this.ws.onerror = function (e) {
    self.onError('websocket error', e);
  };
};

/**
 * Writes data to socket.
 *
 * @param {Array} array of packets.
 * @api private
 */

WS.prototype.write = function (packets) {
  var self = this;
  this.writable = false;

  // encodePacket efficient as it uses WS framing
  // no need for encodePayload
  var total = packets.length;
  for (var i = 0, l = total; i < l; i++) {
    (function (packet) {
      parser.encodePacket(packet, self.supportsBinary, function (data) {
        if (!BrowserWebSocket) {
          // always create a new object (GH-437)
          var opts = {};
          if (packet.options) {
            opts.compress = packet.options.compress;
          }

          if (self.perMessageDeflate) {
            var len = 'string' === typeof data ? global.Buffer.byteLength(data) : data.length;
            if (len < self.perMessageDeflate.threshold) {
              opts.compress = false;
            }
          }
        }

        // Sometimes the websocket has already been closed but the browser didn't
        // have a chance of informing us about it yet, in that case send will
        // throw an error
        try {
          if (BrowserWebSocket) {
            // TypeError is thrown when passing the second argument on Safari
            self.ws.send(data);
          } else {
            self.ws.send(data, opts);
          }
        } catch (e) {
          debug('websocket closed before onclose event');
        }

        --total || done();
      });
    })(packets[i]);
  }

  function done () {
    self.emit('flush');

    // fake drain
    // defer to next tick to allow Socket to clear writeBuffer
    setTimeout(function () {
      self.writable = true;
      self.emit('drain');
    }, 0);
  }
};

/**
 * Called upon close
 *
 * @api private
 */

WS.prototype.onClose = function () {
  Transport.prototype.onClose.call(this);
};

/**
 * Closes socket.
 *
 * @api private
 */

WS.prototype.doClose = function () {
  if (typeof this.ws !== 'undefined') {
    this.ws.close();
  }
};

/**
 * Generates uri for connection.
 *
 * @api private
 */

WS.prototype.uri = function () {
  var query = this.query || {};
  var schema = this.secure ? 'wss' : 'ws';
  var port = '';

  // avoid port if default for schema
  if (this.port && (('wss' === schema && this.port !== 443) ||
    ('ws' === schema && this.port !== 80))) {
    port = ':' + this.port;
  }

  // append timestamp to URI
  if (this.timestampRequests) {
    query[this.timestampParam] = yeast();
  }

  // communicate binary support capabilities
  if (!this.supportsBinary) {
    query.b64 = 1;
  }

  query = parseqs.encode(query);

  // prepend ? to query
  if (query.length) {
    query = '?' + query;
  }

  var ipv6 = this.hostname.indexOf(':') !== -1;
  return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
};

/**
 * Feature detection for WebSocket.
 *
 * @return {Boolean} whether this transport is available.
 * @api public
 */

WS.prototype.check = function () {
  return !!WebSocket && !('__initialize' in WebSocket && this.name === WS.prototype.name);
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../transport":17,"component-inherit":11,"debug":12,"engine.io-parser":24,"parseqs":33,"ws":49,"yeast":47}],23:[function(require,module,exports){
(function (global){
// browser shim for xmlhttprequest module

var hasCORS = require('has-cors');

module.exports = function (opts) {
  var xdomain = opts.xdomain;

  // scheme must be same when usign XDomainRequest
  // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
  var xscheme = opts.xscheme;

  // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
  // https://github.com/Automattic/engine.io-client/pull/217
  var enablesXDR = opts.enablesXDR;

  // XMLHttpRequest can be disabled on IE
  try {
    if ('undefined' !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
      return new XMLHttpRequest();
    }
  } catch (e) { }

  // Use XDomainRequest for IE8 if enablesXDR is true
  // because loading bar keeps flashing when using jsonp-polling
  // https://github.com/yujiosaka/socke.io-ie8-loading-example
  try {
    if ('undefined' !== typeof XDomainRequest && !xscheme && enablesXDR) {
      return new XDomainRequest();
    }
  } catch (e) { }

  if (!xdomain) {
    try {
      return new global[['Active'].concat('Object').join('X')]('Microsoft.XMLHTTP');
    } catch (e) { }
  }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"has-cors":28}],24:[function(require,module,exports){
(function (global){
/**
 * Module dependencies.
 */

var keys = require('./keys');
var hasBinary = require('has-binary');
var sliceBuffer = require('arraybuffer.slice');
var after = require('after');
var utf8 = require('wtf-8');

var base64encoder;
if (global && global.ArrayBuffer) {
  base64encoder = require('base64-arraybuffer');
}

/**
 * Check if we are running an android browser. That requires us to use
 * ArrayBuffer with polling transports...
 *
 * http://ghinda.net/jpeg-blob-ajax-android/
 */

var isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

/**
 * Check if we are running in PhantomJS.
 * Uploading a Blob with PhantomJS does not work correctly, as reported here:
 * https://github.com/ariya/phantomjs/issues/11395
 * @type boolean
 */
var isPhantomJS = typeof navigator !== 'undefined' && /PhantomJS/i.test(navigator.userAgent);

/**
 * When true, avoids using Blobs to encode payloads.
 * @type boolean
 */
var dontSendBlobs = isAndroid || isPhantomJS;

/**
 * Current protocol version.
 */

exports.protocol = 3;

/**
 * Packet types.
 */

var packets = exports.packets = {
    open:     0    // non-ws
  , close:    1    // non-ws
  , ping:     2
  , pong:     3
  , message:  4
  , upgrade:  5
  , noop:     6
};

var packetslist = keys(packets);

/**
 * Premade error packet.
 */

var err = { type: 'error', data: 'parser error' };

/**
 * Create a blob api even for blob builder when vendor prefixes exist
 */

var Blob = require('blob');

/**
 * Encodes a packet.
 *
 *     <packet type id> [ <data> ]
 *
 * Example:
 *
 *     5hello world
 *     3
 *     4
 *
 * Binary is encoded in an identical principle
 *
 * @api private
 */

exports.encodePacket = function (packet, supportsBinary, utf8encode, callback) {
  if ('function' == typeof supportsBinary) {
    callback = supportsBinary;
    supportsBinary = false;
  }

  if ('function' == typeof utf8encode) {
    callback = utf8encode;
    utf8encode = null;
  }

  var data = (packet.data === undefined)
    ? undefined
    : packet.data.buffer || packet.data;

  if (global.ArrayBuffer && data instanceof ArrayBuffer) {
    return encodeArrayBuffer(packet, supportsBinary, callback);
  } else if (Blob && data instanceof global.Blob) {
    return encodeBlob(packet, supportsBinary, callback);
  }

  // might be an object with { base64: true, data: dataAsBase64String }
  if (data && data.base64) {
    return encodeBase64Object(packet, callback);
  }

  // Sending data as a utf-8 string
  var encoded = packets[packet.type];

  // data fragment is optional
  if (undefined !== packet.data) {
    encoded += utf8encode ? utf8.encode(String(packet.data)) : String(packet.data);
  }

  return callback('' + encoded);

};

function encodeBase64Object(packet, callback) {
  // packet data is an object { base64: true, data: dataAsBase64String }
  var message = 'b' + exports.packets[packet.type] + packet.data.data;
  return callback(message);
}

/**
 * Encode packet helpers for binary types
 */

function encodeArrayBuffer(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  var data = packet.data;
  var contentArray = new Uint8Array(data);
  var resultBuffer = new Uint8Array(1 + data.byteLength);

  resultBuffer[0] = packets[packet.type];
  for (var i = 0; i < contentArray.length; i++) {
    resultBuffer[i+1] = contentArray[i];
  }

  return callback(resultBuffer.buffer);
}

function encodeBlobAsArrayBuffer(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  var fr = new FileReader();
  fr.onload = function() {
    packet.data = fr.result;
    exports.encodePacket(packet, supportsBinary, true, callback);
  };
  return fr.readAsArrayBuffer(packet.data);
}

function encodeBlob(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  if (dontSendBlobs) {
    return encodeBlobAsArrayBuffer(packet, supportsBinary, callback);
  }

  var length = new Uint8Array(1);
  length[0] = packets[packet.type];
  var blob = new Blob([length.buffer, packet.data]);

  return callback(blob);
}

/**
 * Encodes a packet with binary data in a base64 string
 *
 * @param {Object} packet, has `type` and `data`
 * @return {String} base64 encoded message
 */

exports.encodeBase64Packet = function(packet, callback) {
  var message = 'b' + exports.packets[packet.type];
  if (Blob && packet.data instanceof global.Blob) {
    var fr = new FileReader();
    fr.onload = function() {
      var b64 = fr.result.split(',')[1];
      callback(message + b64);
    };
    return fr.readAsDataURL(packet.data);
  }

  var b64data;
  try {
    b64data = String.fromCharCode.apply(null, new Uint8Array(packet.data));
  } catch (e) {
    // iPhone Safari doesn't let you apply with typed arrays
    var typed = new Uint8Array(packet.data);
    var basic = new Array(typed.length);
    for (var i = 0; i < typed.length; i++) {
      basic[i] = typed[i];
    }
    b64data = String.fromCharCode.apply(null, basic);
  }
  message += global.btoa(b64data);
  return callback(message);
};

/**
 * Decodes a packet. Changes format to Blob if requested.
 *
 * @return {Object} with `type` and `data` (if any)
 * @api private
 */

exports.decodePacket = function (data, binaryType, utf8decode) {
  if (data === undefined) {
    return err;
  }
  // String data
  if (typeof data == 'string') {
    if (data.charAt(0) == 'b') {
      return exports.decodeBase64Packet(data.substr(1), binaryType);
    }

    if (utf8decode) {
      data = tryDecode(data);
      if (data === false) {
        return err;
      }
    }
    var type = data.charAt(0);

    if (Number(type) != type || !packetslist[type]) {
      return err;
    }

    if (data.length > 1) {
      return { type: packetslist[type], data: data.substring(1) };
    } else {
      return { type: packetslist[type] };
    }
  }

  var asArray = new Uint8Array(data);
  var type = asArray[0];
  var rest = sliceBuffer(data, 1);
  if (Blob && binaryType === 'blob') {
    rest = new Blob([rest]);
  }
  return { type: packetslist[type], data: rest };
};

function tryDecode(data) {
  try {
    data = utf8.decode(data);
  } catch (e) {
    return false;
  }
  return data;
}

/**
 * Decodes a packet encoded in a base64 string
 *
 * @param {String} base64 encoded message
 * @return {Object} with `type` and `data` (if any)
 */

exports.decodeBase64Packet = function(msg, binaryType) {
  var type = packetslist[msg.charAt(0)];
  if (!base64encoder) {
    return { type: type, data: { base64: true, data: msg.substr(1) } };
  }

  var data = base64encoder.decode(msg.substr(1));

  if (binaryType === 'blob' && Blob) {
    data = new Blob([data]);
  }

  return { type: type, data: data };
};

/**
 * Encodes multiple messages (payload).
 *
 *     <length>:data
 *
 * Example:
 *
 *     11:hello world2:hi
 *
 * If any contents are binary, they will be encoded as base64 strings. Base64
 * encoded strings are marked with a b before the length specifier
 *
 * @param {Array} packets
 * @api private
 */

exports.encodePayload = function (packets, supportsBinary, callback) {
  if (typeof supportsBinary == 'function') {
    callback = supportsBinary;
    supportsBinary = null;
  }

  var isBinary = hasBinary(packets);

  if (supportsBinary && isBinary) {
    if (Blob && !dontSendBlobs) {
      return exports.encodePayloadAsBlob(packets, callback);
    }

    return exports.encodePayloadAsArrayBuffer(packets, callback);
  }

  if (!packets.length) {
    return callback('0:');
  }

  function setLengthHeader(message) {
    return message.length + ':' + message;
  }

  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, !isBinary ? false : supportsBinary, true, function(message) {
      doneCallback(null, setLengthHeader(message));
    });
  }

  map(packets, encodeOne, function(err, results) {
    return callback(results.join(''));
  });
};

/**
 * Async array map using after
 */

function map(ary, each, done) {
  var result = new Array(ary.length);
  var next = after(ary.length, done);

  var eachWithIndex = function(i, el, cb) {
    each(el, function(error, msg) {
      result[i] = msg;
      cb(error, result);
    });
  };

  for (var i = 0; i < ary.length; i++) {
    eachWithIndex(i, ary[i], next);
  }
}

/*
 * Decodes data when a payload is maybe expected. Possible binary contents are
 * decoded from their base64 representation
 *
 * @param {String} data, callback method
 * @api public
 */

exports.decodePayload = function (data, binaryType, callback) {
  if (typeof data != 'string') {
    return exports.decodePayloadAsBinary(data, binaryType, callback);
  }

  if (typeof binaryType === 'function') {
    callback = binaryType;
    binaryType = null;
  }

  var packet;
  if (data == '') {
    // parser error - ignoring payload
    return callback(err, 0, 1);
  }

  var length = ''
    , n, msg;

  for (var i = 0, l = data.length; i < l; i++) {
    var chr = data.charAt(i);

    if (':' != chr) {
      length += chr;
    } else {
      if ('' == length || (length != (n = Number(length)))) {
        // parser error - ignoring payload
        return callback(err, 0, 1);
      }

      msg = data.substr(i + 1, n);

      if (length != msg.length) {
        // parser error - ignoring payload
        return callback(err, 0, 1);
      }

      if (msg.length) {
        packet = exports.decodePacket(msg, binaryType, true);

        if (err.type == packet.type && err.data == packet.data) {
          // parser error in individual packet - ignoring payload
          return callback(err, 0, 1);
        }

        var ret = callback(packet, i + n, l);
        if (false === ret) return;
      }

      // advance cursor
      i += n;
      length = '';
    }
  }

  if (length != '') {
    // parser error - ignoring payload
    return callback(err, 0, 1);
  }

};

/**
 * Encodes multiple messages (payload) as binary.
 *
 * <1 = binary, 0 = string><number from 0-9><number from 0-9>[...]<number
 * 255><data>
 *
 * Example:
 * 1 3 255 1 2 3, if the binary contents are interpreted as 8 bit integers
 *
 * @param {Array} packets
 * @return {ArrayBuffer} encoded payload
 * @api private
 */

exports.encodePayloadAsArrayBuffer = function(packets, callback) {
  if (!packets.length) {
    return callback(new ArrayBuffer(0));
  }

  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, true, true, function(data) {
      return doneCallback(null, data);
    });
  }

  map(packets, encodeOne, function(err, encodedPackets) {
    var totalLength = encodedPackets.reduce(function(acc, p) {
      var len;
      if (typeof p === 'string'){
        len = p.length;
      } else {
        len = p.byteLength;
      }
      return acc + len.toString().length + len + 2; // string/binary identifier + separator = 2
    }, 0);

    var resultArray = new Uint8Array(totalLength);

    var bufferIndex = 0;
    encodedPackets.forEach(function(p) {
      var isString = typeof p === 'string';
      var ab = p;
      if (isString) {
        var view = new Uint8Array(p.length);
        for (var i = 0; i < p.length; i++) {
          view[i] = p.charCodeAt(i);
        }
        ab = view.buffer;
      }

      if (isString) { // not true binary
        resultArray[bufferIndex++] = 0;
      } else { // true binary
        resultArray[bufferIndex++] = 1;
      }

      var lenStr = ab.byteLength.toString();
      for (var i = 0; i < lenStr.length; i++) {
        resultArray[bufferIndex++] = parseInt(lenStr[i]);
      }
      resultArray[bufferIndex++] = 255;

      var view = new Uint8Array(ab);
      for (var i = 0; i < view.length; i++) {
        resultArray[bufferIndex++] = view[i];
      }
    });

    return callback(resultArray.buffer);
  });
};

/**
 * Encode as Blob
 */

exports.encodePayloadAsBlob = function(packets, callback) {
  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, true, true, function(encoded) {
      var binaryIdentifier = new Uint8Array(1);
      binaryIdentifier[0] = 1;
      if (typeof encoded === 'string') {
        var view = new Uint8Array(encoded.length);
        for (var i = 0; i < encoded.length; i++) {
          view[i] = encoded.charCodeAt(i);
        }
        encoded = view.buffer;
        binaryIdentifier[0] = 0;
      }

      var len = (encoded instanceof ArrayBuffer)
        ? encoded.byteLength
        : encoded.size;

      var lenStr = len.toString();
      var lengthAry = new Uint8Array(lenStr.length + 1);
      for (var i = 0; i < lenStr.length; i++) {
        lengthAry[i] = parseInt(lenStr[i]);
      }
      lengthAry[lenStr.length] = 255;

      if (Blob) {
        var blob = new Blob([binaryIdentifier.buffer, lengthAry.buffer, encoded]);
        doneCallback(null, blob);
      }
    });
  }

  map(packets, encodeOne, function(err, results) {
    return callback(new Blob(results));
  });
};

/*
 * Decodes data when a payload is maybe expected. Strings are decoded by
 * interpreting each byte as a key code for entries marked to start with 0. See
 * description of encodePayloadAsBinary
 *
 * @param {ArrayBuffer} data, callback method
 * @api public
 */

exports.decodePayloadAsBinary = function (data, binaryType, callback) {
  if (typeof binaryType === 'function') {
    callback = binaryType;
    binaryType = null;
  }

  var bufferTail = data;
  var buffers = [];

  var numberTooLong = false;
  while (bufferTail.byteLength > 0) {
    var tailArray = new Uint8Array(bufferTail);
    var isString = tailArray[0] === 0;
    var msgLength = '';

    for (var i = 1; ; i++) {
      if (tailArray[i] == 255) break;

      if (msgLength.length > 310) {
        numberTooLong = true;
        break;
      }

      msgLength += tailArray[i];
    }

    if(numberTooLong) return callback(err, 0, 1);

    bufferTail = sliceBuffer(bufferTail, 2 + msgLength.length);
    msgLength = parseInt(msgLength);

    var msg = sliceBuffer(bufferTail, 0, msgLength);
    if (isString) {
      try {
        msg = String.fromCharCode.apply(null, new Uint8Array(msg));
      } catch (e) {
        // iPhone Safari doesn't let you apply to typed arrays
        var typed = new Uint8Array(msg);
        msg = '';
        for (var i = 0; i < typed.length; i++) {
          msg += String.fromCharCode(typed[i]);
        }
      }
    }

    buffers.push(msg);
    bufferTail = sliceBuffer(bufferTail, msgLength);
  }

  var total = buffers.length;
  buffers.forEach(function(buffer, i) {
    callback(exports.decodePacket(buffer, binaryType, true), i, total);
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./keys":25,"after":1,"arraybuffer.slice":2,"base64-arraybuffer":4,"blob":5,"has-binary":26,"wtf-8":46}],25:[function(require,module,exports){

/**
 * Gets the keys for an object.
 *
 * @return {Array} keys
 * @api private
 */

module.exports = Object.keys || function keys (obj){
  var arr = [];
  var has = Object.prototype.hasOwnProperty;

  for (var i in obj) {
    if (has.call(obj, i)) {
      arr.push(i);
    }
  }
  return arr;
};

},{}],26:[function(require,module,exports){
(function (global){

/*
 * Module requirements.
 */

var isArray = require('isarray');

/**
 * Module exports.
 */

module.exports = hasBinary;

/**
 * Checks for binary data.
 *
 * Right now only Buffer and ArrayBuffer are supported..
 *
 * @param {Object} anything
 * @api public
 */

function hasBinary(data) {

  function _hasBinary(obj) {
    if (!obj) return false;

    if ( (global.Buffer && global.Buffer.isBuffer(obj)) ||
         (global.ArrayBuffer && obj instanceof ArrayBuffer) ||
         (global.Blob && obj instanceof Blob) ||
         (global.File && obj instanceof File)
        ) {
      return true;
    }

    if (isArray(obj)) {
      for (var i = 0; i < obj.length; i++) {
          if (_hasBinary(obj[i])) {
              return true;
          }
      }
    } else if (obj && 'object' == typeof obj) {
      if (obj.toJSON) {
        obj = obj.toJSON();
      }

      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && _hasBinary(obj[key])) {
          return true;
        }
      }
    }

    return false;
  }

  return _hasBinary(data);
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"isarray":30}],27:[function(require,module,exports){
(function (global){

/*
 * Module requirements.
 */

var isArray = require('isarray');

/**
 * Module exports.
 */

module.exports = hasBinary;

/**
 * Checks for binary data.
 *
 * Right now only Buffer and ArrayBuffer are supported..
 *
 * @param {Object} anything
 * @api public
 */

function hasBinary(data) {

  function _hasBinary(obj) {
    if (!obj) return false;

    if ( (global.Buffer && global.Buffer.isBuffer && global.Buffer.isBuffer(obj)) ||
         (global.ArrayBuffer && obj instanceof ArrayBuffer) ||
         (global.Blob && obj instanceof Blob) ||
         (global.File && obj instanceof File)
        ) {
      return true;
    }

    if (isArray(obj)) {
      for (var i = 0; i < obj.length; i++) {
          if (_hasBinary(obj[i])) {
              return true;
          }
      }
    } else if (obj && 'object' == typeof obj) {
      // see: https://github.com/Automattic/has-binary/pull/4
      if (obj.toJSON && 'function' == typeof obj.toJSON) {
        obj = obj.toJSON();
      }

      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && _hasBinary(obj[key])) {
          return true;
        }
      }
    }

    return false;
  }

  return _hasBinary(data);
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"isarray":30}],28:[function(require,module,exports){

/**
 * Module exports.
 *
 * Logic borrowed from Modernizr:
 *
 *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
 */

try {
  module.exports = typeof XMLHttpRequest !== 'undefined' &&
    'withCredentials' in new XMLHttpRequest();
} catch (err) {
  // if XMLHttp support is disabled in IE then it will throw
  // when trying to create
  module.exports = false;
}

},{}],29:[function(require,module,exports){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],30:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],31:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = '' + str;
  if (str.length > 10000) return;
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],32:[function(require,module,exports){
(function (global){
/**
 * JSON parse.
 *
 * @see Based on jQuery#parseJSON (MIT) and JSON2
 * @api private
 */

var rvalidchars = /^[\],:{}\s]*$/;
var rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
var rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
var rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;
var rtrimLeft = /^\s+/;
var rtrimRight = /\s+$/;

module.exports = function parsejson(data) {
  if ('string' != typeof data || !data) {
    return null;
  }

  data = data.replace(rtrimLeft, '').replace(rtrimRight, '');

  // Attempt to parse using the native JSON parser first
  if (global.JSON && JSON.parse) {
    return JSON.parse(data);
  }

  if (rvalidchars.test(data.replace(rvalidescape, '@')
      .replace(rvalidtokens, ']')
      .replace(rvalidbraces, ''))) {
    return (new Function('return ' + data))();
  }
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],33:[function(require,module,exports){
/**
 * Compiles a querystring
 * Returns string representation of the object
 *
 * @param {Object}
 * @api private
 */

exports.encode = function (obj) {
  var str = '';

  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      if (str.length) str += '&';
      str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
    }
  }

  return str;
};

/**
 * Parses a simple querystring into an object
 *
 * @param {String} qs
 * @api private
 */

exports.decode = function(qs){
  var qry = {};
  var pairs = qs.split('&');
  for (var i = 0, l = pairs.length; i < l; i++) {
    var pair = pairs[i].split('=');
    qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return qry;
};

},{}],34:[function(require,module,exports){
/**
 * Parses an URI
 *
 * @author Steven Levithan <stevenlevithan.com> (MIT license)
 * @api private
 */

var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

var parts = [
    'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
];

module.exports = function parseuri(str) {
    var src = str,
        b = str.indexOf('['),
        e = str.indexOf(']');

    if (b != -1 && e != -1) {
        str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
    }

    var m = re.exec(str || ''),
        uri = {},
        i = 14;

    while (i--) {
        uri[parts[i]] = m[i] || '';
    }

    if (b != -1 && e != -1) {
        uri.source = src;
        uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
        uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
        uri.ipv6uri = true;
    }

    return uri;
};

},{}],35:[function(require,module,exports){

/**
 * Module dependencies.
 */

var url = require('./url');
var parser = require('socket.io-parser');
var Manager = require('./manager');
var debug = require('debug')('socket.io-client');

/**
 * Module exports.
 */

module.exports = exports = lookup;

/**
 * Managers cache.
 */

var cache = exports.managers = {};

/**
 * Looks up an existing `Manager` for multiplexing.
 * If the user summons:
 *
 *   `io('http://localhost/a');`
 *   `io('http://localhost/b');`
 *
 * We reuse the existing instance based on same scheme/port/host,
 * and we initialize sockets for each namespace.
 *
 * @api public
 */

function lookup (uri, opts) {
  if (typeof uri === 'object') {
    opts = uri;
    uri = undefined;
  }

  opts = opts || {};

  var parsed = url(uri);
  var source = parsed.source;
  var id = parsed.id;
  var path = parsed.path;
  var sameNamespace = cache[id] && path in cache[id].nsps;
  var newConnection = opts.forceNew || opts['force new connection'] ||
                      false === opts.multiplex || sameNamespace;

  var io;

  if (newConnection) {
    debug('ignoring socket cache for %s', source);
    io = Manager(source, opts);
  } else {
    if (!cache[id]) {
      debug('new io instance for %s', source);
      cache[id] = Manager(source, opts);
    }
    io = cache[id];
  }
  if (parsed.query && !opts.query) {
    opts.query = parsed.query;
  } else if (opts && 'object' === typeof opts.query) {
    opts.query = encodeQueryString(opts.query);
  }
  return io.socket(parsed.path, opts);
}
/**
 *  Helper method to parse query objects to string.
 * @param {object} query
 * @returns {string}
 */
function encodeQueryString (obj) {
  var str = [];
  for (var p in obj) {
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
    }
  }
  return str.join('&');
}
/**
 * Protocol version.
 *
 * @api public
 */

exports.protocol = parser.protocol;

/**
 * `connect`.
 *
 * @param {String} uri
 * @api public
 */

exports.connect = lookup;

/**
 * Expose constructors for standalone build.
 *
 * @api public
 */

exports.Manager = require('./manager');
exports.Socket = require('./socket');

},{"./manager":36,"./socket":38,"./url":39,"debug":12,"socket.io-parser":42}],36:[function(require,module,exports){

/**
 * Module dependencies.
 */

var eio = require('engine.io-client');
var Socket = require('./socket');
var Emitter = require('component-emitter');
var parser = require('socket.io-parser');
var on = require('./on');
var bind = require('component-bind');
var debug = require('debug')('socket.io-client:manager');
var indexOf = require('indexof');
var Backoff = require('backo2');

/**
 * IE6+ hasOwnProperty
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Module exports
 */

module.exports = Manager;

/**
 * `Manager` constructor.
 *
 * @param {String} engine instance or engine uri/opts
 * @param {Object} options
 * @api public
 */

function Manager (uri, opts) {
  if (!(this instanceof Manager)) return new Manager(uri, opts);
  if (uri && ('object' === typeof uri)) {
    opts = uri;
    uri = undefined;
  }
  opts = opts || {};

  opts.path = opts.path || '/socket.io';
  this.nsps = {};
  this.subs = [];
  this.opts = opts;
  this.reconnection(opts.reconnection !== false);
  this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
  this.reconnectionDelay(opts.reconnectionDelay || 1000);
  this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
  this.randomizationFactor(opts.randomizationFactor || 0.5);
  this.backoff = new Backoff({
    min: this.reconnectionDelay(),
    max: this.reconnectionDelayMax(),
    jitter: this.randomizationFactor()
  });
  this.timeout(null == opts.timeout ? 20000 : opts.timeout);
  this.readyState = 'closed';
  this.uri = uri;
  this.connecting = [];
  this.lastPing = null;
  this.encoding = false;
  this.packetBuffer = [];
  this.encoder = new parser.Encoder();
  this.decoder = new parser.Decoder();
  this.autoConnect = opts.autoConnect !== false;
  if (this.autoConnect) this.open();
}

/**
 * Propagate given event to sockets and emit on `this`
 *
 * @api private
 */

Manager.prototype.emitAll = function () {
  this.emit.apply(this, arguments);
  for (var nsp in this.nsps) {
    if (has.call(this.nsps, nsp)) {
      this.nsps[nsp].emit.apply(this.nsps[nsp], arguments);
    }
  }
};

/**
 * Update `socket.id` of all sockets
 *
 * @api private
 */

Manager.prototype.updateSocketIds = function () {
  for (var nsp in this.nsps) {
    if (has.call(this.nsps, nsp)) {
      this.nsps[nsp].id = this.engine.id;
    }
  }
};

/**
 * Mix in `Emitter`.
 */

Emitter(Manager.prototype);

/**
 * Sets the `reconnection` config.
 *
 * @param {Boolean} true/false if it should automatically reconnect
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnection = function (v) {
  if (!arguments.length) return this._reconnection;
  this._reconnection = !!v;
  return this;
};

/**
 * Sets the reconnection attempts config.
 *
 * @param {Number} max reconnection attempts before giving up
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionAttempts = function (v) {
  if (!arguments.length) return this._reconnectionAttempts;
  this._reconnectionAttempts = v;
  return this;
};

/**
 * Sets the delay between reconnections.
 *
 * @param {Number} delay
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionDelay = function (v) {
  if (!arguments.length) return this._reconnectionDelay;
  this._reconnectionDelay = v;
  this.backoff && this.backoff.setMin(v);
  return this;
};

Manager.prototype.randomizationFactor = function (v) {
  if (!arguments.length) return this._randomizationFactor;
  this._randomizationFactor = v;
  this.backoff && this.backoff.setJitter(v);
  return this;
};

/**
 * Sets the maximum delay between reconnections.
 *
 * @param {Number} delay
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionDelayMax = function (v) {
  if (!arguments.length) return this._reconnectionDelayMax;
  this._reconnectionDelayMax = v;
  this.backoff && this.backoff.setMax(v);
  return this;
};

/**
 * Sets the connection timeout. `false` to disable
 *
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.timeout = function (v) {
  if (!arguments.length) return this._timeout;
  this._timeout = v;
  return this;
};

/**
 * Starts trying to reconnect if reconnection is enabled and we have not
 * started reconnecting yet
 *
 * @api private
 */

Manager.prototype.maybeReconnectOnOpen = function () {
  // Only try to reconnect if it's the first time we're connecting
  if (!this.reconnecting && this._reconnection && this.backoff.attempts === 0) {
    // keeps reconnection from firing twice for the same reconnection loop
    this.reconnect();
  }
};

/**
 * Sets the current transport `socket`.
 *
 * @param {Function} optional, callback
 * @return {Manager} self
 * @api public
 */

Manager.prototype.open =
Manager.prototype.connect = function (fn, opts) {
  debug('readyState %s', this.readyState);
  if (~this.readyState.indexOf('open')) return this;

  debug('opening %s', this.uri);
  this.engine = eio(this.uri, this.opts);
  var socket = this.engine;
  var self = this;
  this.readyState = 'opening';
  this.skipReconnect = false;

  // emit `open`
  var openSub = on(socket, 'open', function () {
    self.onopen();
    fn && fn();
  });

  // emit `connect_error`
  var errorSub = on(socket, 'error', function (data) {
    debug('connect_error');
    self.cleanup();
    self.readyState = 'closed';
    self.emitAll('connect_error', data);
    if (fn) {
      var err = new Error('Connection error');
      err.data = data;
      fn(err);
    } else {
      // Only do this if there is no fn to handle the error
      self.maybeReconnectOnOpen();
    }
  });

  // emit `connect_timeout`
  if (false !== this._timeout) {
    var timeout = this._timeout;
    debug('connect attempt will timeout after %d', timeout);

    // set timer
    var timer = setTimeout(function () {
      debug('connect attempt timed out after %d', timeout);
      openSub.destroy();
      socket.close();
      socket.emit('error', 'timeout');
      self.emitAll('connect_timeout', timeout);
    }, timeout);

    this.subs.push({
      destroy: function () {
        clearTimeout(timer);
      }
    });
  }

  this.subs.push(openSub);
  this.subs.push(errorSub);

  return this;
};

/**
 * Called upon transport open.
 *
 * @api private
 */

Manager.prototype.onopen = function () {
  debug('open');

  // clear old subs
  this.cleanup();

  // mark as open
  this.readyState = 'open';
  this.emit('open');

  // add new subs
  var socket = this.engine;
  this.subs.push(on(socket, 'data', bind(this, 'ondata')));
  this.subs.push(on(socket, 'ping', bind(this, 'onping')));
  this.subs.push(on(socket, 'pong', bind(this, 'onpong')));
  this.subs.push(on(socket, 'error', bind(this, 'onerror')));
  this.subs.push(on(socket, 'close', bind(this, 'onclose')));
  this.subs.push(on(this.decoder, 'decoded', bind(this, 'ondecoded')));
};

/**
 * Called upon a ping.
 *
 * @api private
 */

Manager.prototype.onping = function () {
  this.lastPing = new Date();
  this.emitAll('ping');
};

/**
 * Called upon a packet.
 *
 * @api private
 */

Manager.prototype.onpong = function () {
  this.emitAll('pong', new Date() - this.lastPing);
};

/**
 * Called with data.
 *
 * @api private
 */

Manager.prototype.ondata = function (data) {
  this.decoder.add(data);
};

/**
 * Called when parser fully decodes a packet.
 *
 * @api private
 */

Manager.prototype.ondecoded = function (packet) {
  this.emit('packet', packet);
};

/**
 * Called upon socket error.
 *
 * @api private
 */

Manager.prototype.onerror = function (err) {
  debug('error', err);
  this.emitAll('error', err);
};

/**
 * Creates a new socket for the given `nsp`.
 *
 * @return {Socket}
 * @api public
 */

Manager.prototype.socket = function (nsp, opts) {
  var socket = this.nsps[nsp];
  if (!socket) {
    socket = new Socket(this, nsp, opts);
    this.nsps[nsp] = socket;
    var self = this;
    socket.on('connecting', onConnecting);
    socket.on('connect', function () {
      socket.id = self.engine.id;
    });

    if (this.autoConnect) {
      // manually call here since connecting evnet is fired before listening
      onConnecting();
    }
  }

  function onConnecting () {
    if (!~indexOf(self.connecting, socket)) {
      self.connecting.push(socket);
    }
  }

  return socket;
};

/**
 * Called upon a socket close.
 *
 * @param {Socket} socket
 */

Manager.prototype.destroy = function (socket) {
  var index = indexOf(this.connecting, socket);
  if (~index) this.connecting.splice(index, 1);
  if (this.connecting.length) return;

  this.close();
};

/**
 * Writes a packet.
 *
 * @param {Object} packet
 * @api private
 */

Manager.prototype.packet = function (packet) {
  debug('writing packet %j', packet);
  var self = this;
  if (packet.query && packet.type === 0) packet.nsp += '?' + packet.query;

  if (!self.encoding) {
    // encode, then write to engine with result
    self.encoding = true;
    this.encoder.encode(packet, function (encodedPackets) {
      for (var i = 0; i < encodedPackets.length; i++) {
        self.engine.write(encodedPackets[i], packet.options);
      }
      self.encoding = false;
      self.processPacketQueue();
    });
  } else { // add packet to the queue
    self.packetBuffer.push(packet);
  }
};

/**
 * If packet buffer is non-empty, begins encoding the
 * next packet in line.
 *
 * @api private
 */

Manager.prototype.processPacketQueue = function () {
  if (this.packetBuffer.length > 0 && !this.encoding) {
    var pack = this.packetBuffer.shift();
    this.packet(pack);
  }
};

/**
 * Clean up transport subscriptions and packet buffer.
 *
 * @api private
 */

Manager.prototype.cleanup = function () {
  debug('cleanup');

  var subsLength = this.subs.length;
  for (var i = 0; i < subsLength; i++) {
    var sub = this.subs.shift();
    sub.destroy();
  }

  this.packetBuffer = [];
  this.encoding = false;
  this.lastPing = null;

  this.decoder.destroy();
};

/**
 * Close the current socket.
 *
 * @api private
 */

Manager.prototype.close =
Manager.prototype.disconnect = function () {
  debug('disconnect');
  this.skipReconnect = true;
  this.reconnecting = false;
  if ('opening' === this.readyState) {
    // `onclose` will not fire because
    // an open event never happened
    this.cleanup();
  }
  this.backoff.reset();
  this.readyState = 'closed';
  if (this.engine) this.engine.close();
};

/**
 * Called upon engine close.
 *
 * @api private
 */

Manager.prototype.onclose = function (reason) {
  debug('onclose');

  this.cleanup();
  this.backoff.reset();
  this.readyState = 'closed';
  this.emit('close', reason);

  if (this._reconnection && !this.skipReconnect) {
    this.reconnect();
  }
};

/**
 * Attempt a reconnection.
 *
 * @api private
 */

Manager.prototype.reconnect = function () {
  if (this.reconnecting || this.skipReconnect) return this;

  var self = this;

  if (this.backoff.attempts >= this._reconnectionAttempts) {
    debug('reconnect failed');
    this.backoff.reset();
    this.emitAll('reconnect_failed');
    this.reconnecting = false;
  } else {
    var delay = this.backoff.duration();
    debug('will wait %dms before reconnect attempt', delay);

    this.reconnecting = true;
    var timer = setTimeout(function () {
      if (self.skipReconnect) return;

      debug('attempting reconnect');
      self.emitAll('reconnect_attempt', self.backoff.attempts);
      self.emitAll('reconnecting', self.backoff.attempts);

      // check again for the case socket closed in above events
      if (self.skipReconnect) return;

      self.open(function (err) {
        if (err) {
          debug('reconnect attempt error');
          self.reconnecting = false;
          self.reconnect();
          self.emitAll('reconnect_error', err.data);
        } else {
          debug('reconnect success');
          self.onreconnect();
        }
      });
    }, delay);

    this.subs.push({
      destroy: function () {
        clearTimeout(timer);
      }
    });
  }
};

/**
 * Called upon successful reconnect.
 *
 * @api private
 */

Manager.prototype.onreconnect = function () {
  var attempt = this.backoff.attempts;
  this.reconnecting = false;
  this.backoff.reset();
  this.updateSocketIds();
  this.emitAll('reconnect', attempt);
};

},{"./on":37,"./socket":38,"backo2":3,"component-bind":9,"component-emitter":40,"debug":12,"engine.io-client":14,"indexof":29,"socket.io-parser":42}],37:[function(require,module,exports){

/**
 * Module exports.
 */

module.exports = on;

/**
 * Helper for subscriptions.
 *
 * @param {Object|EventEmitter} obj with `Emitter` mixin or `EventEmitter`
 * @param {String} event name
 * @param {Function} callback
 * @api public
 */

function on (obj, ev, fn) {
  obj.on(ev, fn);
  return {
    destroy: function () {
      obj.removeListener(ev, fn);
    }
  };
}

},{}],38:[function(require,module,exports){

/**
 * Module dependencies.
 */

var parser = require('socket.io-parser');
var Emitter = require('component-emitter');
var toArray = require('to-array');
var on = require('./on');
var bind = require('component-bind');
var debug = require('debug')('socket.io-client:socket');
var hasBin = require('has-binary');

/**
 * Module exports.
 */

module.exports = exports = Socket;

/**
 * Internal events (blacklisted).
 * These events can't be emitted by the user.
 *
 * @api private
 */

var events = {
  connect: 1,
  connect_error: 1,
  connect_timeout: 1,
  connecting: 1,
  disconnect: 1,
  error: 1,
  reconnect: 1,
  reconnect_attempt: 1,
  reconnect_failed: 1,
  reconnect_error: 1,
  reconnecting: 1,
  ping: 1,
  pong: 1
};

/**
 * Shortcut to `Emitter#emit`.
 */

var emit = Emitter.prototype.emit;

/**
 * `Socket` constructor.
 *
 * @api public
 */

function Socket (io, nsp, opts) {
  this.io = io;
  this.nsp = nsp;
  this.json = this; // compat
  this.ids = 0;
  this.acks = {};
  this.receiveBuffer = [];
  this.sendBuffer = [];
  this.connected = false;
  this.disconnected = true;
  if (opts && opts.query) {
    this.query = opts.query;
  }
  if (this.io.autoConnect) this.open();
}

/**
 * Mix in `Emitter`.
 */

Emitter(Socket.prototype);

/**
 * Subscribe to open, close and packet events
 *
 * @api private
 */

Socket.prototype.subEvents = function () {
  if (this.subs) return;

  var io = this.io;
  this.subs = [
    on(io, 'open', bind(this, 'onopen')),
    on(io, 'packet', bind(this, 'onpacket')),
    on(io, 'close', bind(this, 'onclose'))
  ];
};

/**
 * "Opens" the socket.
 *
 * @api public
 */

Socket.prototype.open =
Socket.prototype.connect = function () {
  if (this.connected) return this;

  this.subEvents();
  this.io.open(); // ensure open
  if ('open' === this.io.readyState) this.onopen();
  this.emit('connecting');
  return this;
};

/**
 * Sends a `message` event.
 *
 * @return {Socket} self
 * @api public
 */

Socket.prototype.send = function () {
  var args = toArray(arguments);
  args.unshift('message');
  this.emit.apply(this, args);
  return this;
};

/**
 * Override `emit`.
 * If the event is in `events`, it's emitted normally.
 *
 * @param {String} event name
 * @return {Socket} self
 * @api public
 */

Socket.prototype.emit = function (ev) {
  if (events.hasOwnProperty(ev)) {
    emit.apply(this, arguments);
    return this;
  }

  var args = toArray(arguments);
  var parserType = parser.EVENT; // default
  if (hasBin(args)) { parserType = parser.BINARY_EVENT; } // binary
  var packet = { type: parserType, data: args };

  packet.options = {};
  packet.options.compress = !this.flags || false !== this.flags.compress;

  // event ack callback
  if ('function' === typeof args[args.length - 1]) {
    debug('emitting packet with ack id %d', this.ids);
    this.acks[this.ids] = args.pop();
    packet.id = this.ids++;
  }

  if (this.connected) {
    this.packet(packet);
  } else {
    this.sendBuffer.push(packet);
  }

  delete this.flags;

  return this;
};

/**
 * Sends a packet.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.packet = function (packet) {
  packet.nsp = this.nsp;
  this.io.packet(packet);
};

/**
 * Called upon engine `open`.
 *
 * @api private
 */

Socket.prototype.onopen = function () {
  debug('transport is open - connecting');

  // write connect packet if necessary
  if ('/' !== this.nsp) {
    if (this.query) {
      this.packet({type: parser.CONNECT, query: this.query});
    } else {
      this.packet({type: parser.CONNECT});
    }
  }
};

/**
 * Called upon engine `close`.
 *
 * @param {String} reason
 * @api private
 */

Socket.prototype.onclose = function (reason) {
  debug('close (%s)', reason);
  this.connected = false;
  this.disconnected = true;
  delete this.id;
  this.emit('disconnect', reason);
};

/**
 * Called with socket packet.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onpacket = function (packet) {
  if (packet.nsp !== this.nsp) return;

  switch (packet.type) {
    case parser.CONNECT:
      this.onconnect();
      break;

    case parser.EVENT:
      this.onevent(packet);
      break;

    case parser.BINARY_EVENT:
      this.onevent(packet);
      break;

    case parser.ACK:
      this.onack(packet);
      break;

    case parser.BINARY_ACK:
      this.onack(packet);
      break;

    case parser.DISCONNECT:
      this.ondisconnect();
      break;

    case parser.ERROR:
      this.emit('error', packet.data);
      break;
  }
};

/**
 * Called upon a server event.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onevent = function (packet) {
  var args = packet.data || [];
  debug('emitting event %j', args);

  if (null != packet.id) {
    debug('attaching ack callback to event');
    args.push(this.ack(packet.id));
  }

  if (this.connected) {
    emit.apply(this, args);
  } else {
    this.receiveBuffer.push(args);
  }
};

/**
 * Produces an ack callback to emit with an event.
 *
 * @api private
 */

Socket.prototype.ack = function (id) {
  var self = this;
  var sent = false;
  return function () {
    // prevent double callbacks
    if (sent) return;
    sent = true;
    var args = toArray(arguments);
    debug('sending ack %j', args);

    var type = hasBin(args) ? parser.BINARY_ACK : parser.ACK;
    self.packet({
      type: type,
      id: id,
      data: args
    });
  };
};

/**
 * Called upon a server acknowlegement.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onack = function (packet) {
  var ack = this.acks[packet.id];
  if ('function' === typeof ack) {
    debug('calling ack %s with %j', packet.id, packet.data);
    ack.apply(this, packet.data);
    delete this.acks[packet.id];
  } else {
    debug('bad ack %s', packet.id);
  }
};

/**
 * Called upon server connect.
 *
 * @api private
 */

Socket.prototype.onconnect = function () {
  this.connected = true;
  this.disconnected = false;
  this.emit('connect');
  this.emitBuffered();
};

/**
 * Emit buffered events (received and emitted).
 *
 * @api private
 */

Socket.prototype.emitBuffered = function () {
  var i;
  for (i = 0; i < this.receiveBuffer.length; i++) {
    emit.apply(this, this.receiveBuffer[i]);
  }
  this.receiveBuffer = [];

  for (i = 0; i < this.sendBuffer.length; i++) {
    this.packet(this.sendBuffer[i]);
  }
  this.sendBuffer = [];
};

/**
 * Called upon server disconnect.
 *
 * @api private
 */

Socket.prototype.ondisconnect = function () {
  debug('server disconnect (%s)', this.nsp);
  this.destroy();
  this.onclose('io server disconnect');
};

/**
 * Called upon forced client/server side disconnections,
 * this method ensures the manager stops tracking us and
 * that reconnections don't get triggered for this.
 *
 * @api private.
 */

Socket.prototype.destroy = function () {
  if (this.subs) {
    // clean subscriptions to avoid reconnections
    for (var i = 0; i < this.subs.length; i++) {
      this.subs[i].destroy();
    }
    this.subs = null;
  }

  this.io.destroy(this);
};

/**
 * Disconnects the socket manually.
 *
 * @return {Socket} self
 * @api public
 */

Socket.prototype.close =
Socket.prototype.disconnect = function () {
  if (this.connected) {
    debug('performing disconnect (%s)', this.nsp);
    this.packet({ type: parser.DISCONNECT });
  }

  // remove socket from pool
  this.destroy();

  if (this.connected) {
    // fire events
    this.onclose('io client disconnect');
  }
  return this;
};

/**
 * Sets the compress flag.
 *
 * @param {Boolean} if `true`, compresses the sending data
 * @return {Socket} self
 * @api public
 */

Socket.prototype.compress = function (compress) {
  this.flags = this.flags || {};
  this.flags.compress = compress;
  return this;
};

},{"./on":37,"component-bind":9,"component-emitter":40,"debug":12,"has-binary":27,"socket.io-parser":42,"to-array":45}],39:[function(require,module,exports){
(function (global){

/**
 * Module dependencies.
 */

var parseuri = require('parseuri');
var debug = require('debug')('socket.io-client:url');

/**
 * Module exports.
 */

module.exports = url;

/**
 * URL parser.
 *
 * @param {String} url
 * @param {Object} An object meant to mimic window.location.
 *                 Defaults to window.location.
 * @api public
 */

function url (uri, loc) {
  var obj = uri;

  // default to window.location
  loc = loc || global.location;
  if (null == uri) uri = loc.protocol + '//' + loc.host;

  // relative path support
  if ('string' === typeof uri) {
    if ('/' === uri.charAt(0)) {
      if ('/' === uri.charAt(1)) {
        uri = loc.protocol + uri;
      } else {
        uri = loc.host + uri;
      }
    }

    if (!/^(https?|wss?):\/\//.test(uri)) {
      debug('protocol-less url %s', uri);
      if ('undefined' !== typeof loc) {
        uri = loc.protocol + '//' + uri;
      } else {
        uri = 'https://' + uri;
      }
    }

    // parse
    debug('parse %s', uri);
    obj = parseuri(uri);
  }

  // make sure we treat `localhost:80` and `localhost` equally
  if (!obj.port) {
    if (/^(http|ws)$/.test(obj.protocol)) {
      obj.port = '80';
    } else if (/^(http|ws)s$/.test(obj.protocol)) {
      obj.port = '443';
    }
  }

  obj.path = obj.path || '/';

  var ipv6 = obj.host.indexOf(':') !== -1;
  var host = ipv6 ? '[' + obj.host + ']' : obj.host;

  // define unique id
  obj.id = obj.protocol + '://' + host + ':' + obj.port;
  // define href
  obj.href = obj.protocol + '://' + host + (loc && loc.port === obj.port ? '' : (':' + obj.port));

  return obj;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"debug":12,"parseuri":34}],40:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],41:[function(require,module,exports){
(function (global){
/*global Blob,File*/

/**
 * Module requirements
 */

var isArray = require('isarray');
var isBuf = require('./is-buffer');

/**
 * Replaces every Buffer | ArrayBuffer in packet with a numbered placeholder.
 * Anything with blobs or files should be fed through removeBlobs before coming
 * here.
 *
 * @param {Object} packet - socket.io event packet
 * @return {Object} with deconstructed packet and list of buffers
 * @api public
 */

exports.deconstructPacket = function(packet){
  var buffers = [];
  var packetData = packet.data;

  function _deconstructPacket(data) {
    if (!data) return data;

    if (isBuf(data)) {
      var placeholder = { _placeholder: true, num: buffers.length };
      buffers.push(data);
      return placeholder;
    } else if (isArray(data)) {
      var newData = new Array(data.length);
      for (var i = 0; i < data.length; i++) {
        newData[i] = _deconstructPacket(data[i]);
      }
      return newData;
    } else if ('object' == typeof data && !(data instanceof Date)) {
      var newData = {};
      for (var key in data) {
        newData[key] = _deconstructPacket(data[key]);
      }
      return newData;
    }
    return data;
  }

  var pack = packet;
  pack.data = _deconstructPacket(packetData);
  pack.attachments = buffers.length; // number of binary 'attachments'
  return {packet: pack, buffers: buffers};
};

/**
 * Reconstructs a binary packet from its placeholder packet and buffers
 *
 * @param {Object} packet - event packet with placeholders
 * @param {Array} buffers - binary buffers to put in placeholder positions
 * @return {Object} reconstructed packet
 * @api public
 */

exports.reconstructPacket = function(packet, buffers) {
  var curPlaceHolder = 0;

  function _reconstructPacket(data) {
    if (data && data._placeholder) {
      var buf = buffers[data.num]; // appropriate buffer (should be natural order anyway)
      return buf;
    } else if (isArray(data)) {
      for (var i = 0; i < data.length; i++) {
        data[i] = _reconstructPacket(data[i]);
      }
      return data;
    } else if (data && 'object' == typeof data) {
      for (var key in data) {
        data[key] = _reconstructPacket(data[key]);
      }
      return data;
    }
    return data;
  }

  packet.data = _reconstructPacket(packet.data);
  packet.attachments = undefined; // no longer useful
  return packet;
};

/**
 * Asynchronously removes Blobs or Files from data via
 * FileReader's readAsArrayBuffer method. Used before encoding
 * data as msgpack. Calls callback with the blobless data.
 *
 * @param {Object} data
 * @param {Function} callback
 * @api private
 */

exports.removeBlobs = function(data, callback) {
  function _removeBlobs(obj, curKey, containingObject) {
    if (!obj) return obj;

    // convert any blob
    if ((global.Blob && obj instanceof Blob) ||
        (global.File && obj instanceof File)) {
      pendingBlobs++;

      // async filereader
      var fileReader = new FileReader();
      fileReader.onload = function() { // this.result == arraybuffer
        if (containingObject) {
          containingObject[curKey] = this.result;
        }
        else {
          bloblessData = this.result;
        }

        // if nothing pending its callback time
        if(! --pendingBlobs) {
          callback(bloblessData);
        }
      };

      fileReader.readAsArrayBuffer(obj); // blob -> arraybuffer
    } else if (isArray(obj)) { // handle array
      for (var i = 0; i < obj.length; i++) {
        _removeBlobs(obj[i], i, obj);
      }
    } else if (obj && 'object' == typeof obj && !isBuf(obj)) { // and object
      for (var key in obj) {
        _removeBlobs(obj[key], key, obj);
      }
    }
  }

  var pendingBlobs = 0;
  var bloblessData = data;
  _removeBlobs(bloblessData);
  if (!pendingBlobs) {
    callback(bloblessData);
  }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./is-buffer":43,"isarray":30}],42:[function(require,module,exports){

/**
 * Module dependencies.
 */

var debug = require('debug')('socket.io-parser');
var json = require('json3');
var Emitter = require('component-emitter');
var binary = require('./binary');
var isBuf = require('./is-buffer');

/**
 * Protocol version.
 *
 * @api public
 */

exports.protocol = 4;

/**
 * Packet types.
 *
 * @api public
 */

exports.types = [
  'CONNECT',
  'DISCONNECT',
  'EVENT',
  'ACK',
  'ERROR',
  'BINARY_EVENT',
  'BINARY_ACK'
];

/**
 * Packet type `connect`.
 *
 * @api public
 */

exports.CONNECT = 0;

/**
 * Packet type `disconnect`.
 *
 * @api public
 */

exports.DISCONNECT = 1;

/**
 * Packet type `event`.
 *
 * @api public
 */

exports.EVENT = 2;

/**
 * Packet type `ack`.
 *
 * @api public
 */

exports.ACK = 3;

/**
 * Packet type `error`.
 *
 * @api public
 */

exports.ERROR = 4;

/**
 * Packet type 'binary event'
 *
 * @api public
 */

exports.BINARY_EVENT = 5;

/**
 * Packet type `binary ack`. For acks with binary arguments.
 *
 * @api public
 */

exports.BINARY_ACK = 6;

/**
 * Encoder constructor.
 *
 * @api public
 */

exports.Encoder = Encoder;

/**
 * Decoder constructor.
 *
 * @api public
 */

exports.Decoder = Decoder;

/**
 * A socket.io Encoder instance
 *
 * @api public
 */

function Encoder() {}

/**
 * Encode a packet as a single string if non-binary, or as a
 * buffer sequence, depending on packet type.
 *
 * @param {Object} obj - packet object
 * @param {Function} callback - function to handle encodings (likely engine.write)
 * @return Calls callback with Array of encodings
 * @api public
 */

Encoder.prototype.encode = function(obj, callback){
  debug('encoding packet %j', obj);

  if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
    encodeAsBinary(obj, callback);
  }
  else {
    var encoding = encodeAsString(obj);
    callback([encoding]);
  }
};

/**
 * Encode packet as string.
 *
 * @param {Object} packet
 * @return {String} encoded
 * @api private
 */

function encodeAsString(obj) {
  var str = '';
  var nsp = false;

  // first is type
  str += obj.type;

  // attachments if we have them
  if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
    str += obj.attachments;
    str += '-';
  }

  // if we have a namespace other than `/`
  // we append it followed by a comma `,`
  if (obj.nsp && '/' != obj.nsp) {
    nsp = true;
    str += obj.nsp;
  }

  // immediately followed by the id
  if (null != obj.id) {
    if (nsp) {
      str += ',';
      nsp = false;
    }
    str += obj.id;
  }

  // json data
  if (null != obj.data) {
    if (nsp) str += ',';
    str += json.stringify(obj.data);
  }

  debug('encoded %j as %s', obj, str);
  return str;
}

/**
 * Encode packet as 'buffer sequence' by removing blobs, and
 * deconstructing packet into object with placeholders and
 * a list of buffers.
 *
 * @param {Object} packet
 * @return {Buffer} encoded
 * @api private
 */

function encodeAsBinary(obj, callback) {

  function writeEncoding(bloblessData) {
    var deconstruction = binary.deconstructPacket(bloblessData);
    var pack = encodeAsString(deconstruction.packet);
    var buffers = deconstruction.buffers;

    buffers.unshift(pack); // add packet info to beginning of data list
    callback(buffers); // write all the buffers
  }

  binary.removeBlobs(obj, writeEncoding);
}

/**
 * A socket.io Decoder instance
 *
 * @return {Object} decoder
 * @api public
 */

function Decoder() {
  this.reconstructor = null;
}

/**
 * Mix in `Emitter` with Decoder.
 */

Emitter(Decoder.prototype);

/**
 * Decodes an ecoded packet string into packet JSON.
 *
 * @param {String} obj - encoded packet
 * @return {Object} packet
 * @api public
 */

Decoder.prototype.add = function(obj) {
  var packet;
  if ('string' == typeof obj) {
    packet = decodeString(obj);
    if (exports.BINARY_EVENT == packet.type || exports.BINARY_ACK == packet.type) { // binary packet's json
      this.reconstructor = new BinaryReconstructor(packet);

      // no attachments, labeled binary but no binary data to follow
      if (this.reconstructor.reconPack.attachments === 0) {
        this.emit('decoded', packet);
      }
    } else { // non-binary full packet
      this.emit('decoded', packet);
    }
  }
  else if (isBuf(obj) || obj.base64) { // raw binary data
    if (!this.reconstructor) {
      throw new Error('got binary data when not reconstructing a packet');
    } else {
      packet = this.reconstructor.takeBinaryData(obj);
      if (packet) { // received final buffer
        this.reconstructor = null;
        this.emit('decoded', packet);
      }
    }
  }
  else {
    throw new Error('Unknown type: ' + obj);
  }
};

/**
 * Decode a packet String (JSON data)
 *
 * @param {String} str
 * @return {Object} packet
 * @api private
 */

function decodeString(str) {
  var p = {};
  var i = 0;

  // look up type
  p.type = Number(str.charAt(0));
  if (null == exports.types[p.type]) return error();

  // look up attachments if type binary
  if (exports.BINARY_EVENT == p.type || exports.BINARY_ACK == p.type) {
    var buf = '';
    while (str.charAt(++i) != '-') {
      buf += str.charAt(i);
      if (i == str.length) break;
    }
    if (buf != Number(buf) || str.charAt(i) != '-') {
      throw new Error('Illegal attachments');
    }
    p.attachments = Number(buf);
  }

  // look up namespace (if any)
  if ('/' == str.charAt(i + 1)) {
    p.nsp = '';
    while (++i) {
      var c = str.charAt(i);
      if (',' == c) break;
      p.nsp += c;
      if (i == str.length) break;
    }
  } else {
    p.nsp = '/';
  }

  // look up id
  var next = str.charAt(i + 1);
  if ('' !== next && Number(next) == next) {
    p.id = '';
    while (++i) {
      var c = str.charAt(i);
      if (null == c || Number(c) != c) {
        --i;
        break;
      }
      p.id += str.charAt(i);
      if (i == str.length) break;
    }
    p.id = Number(p.id);
  }

  // look up json data
  if (str.charAt(++i)) {
    p = tryParse(p, str.substr(i));
  }

  debug('decoded %s as %j', str, p);
  return p;
}

function tryParse(p, str) {
  try {
    p.data = json.parse(str);
  } catch(e){
    return error();
  }
  return p; 
};

/**
 * Deallocates a parser's resources
 *
 * @api public
 */

Decoder.prototype.destroy = function() {
  if (this.reconstructor) {
    this.reconstructor.finishedReconstruction();
  }
};

/**
 * A manager of a binary event's 'buffer sequence'. Should
 * be constructed whenever a packet of type BINARY_EVENT is
 * decoded.
 *
 * @param {Object} packet
 * @return {BinaryReconstructor} initialized reconstructor
 * @api private
 */

function BinaryReconstructor(packet) {
  this.reconPack = packet;
  this.buffers = [];
}

/**
 * Method to be called when binary data received from connection
 * after a BINARY_EVENT packet.
 *
 * @param {Buffer | ArrayBuffer} binData - the raw binary data received
 * @return {null | Object} returns null if more binary data is expected or
 *   a reconstructed packet object if all buffers have been received.
 * @api private
 */

BinaryReconstructor.prototype.takeBinaryData = function(binData) {
  this.buffers.push(binData);
  if (this.buffers.length == this.reconPack.attachments) { // done with buffer list
    var packet = binary.reconstructPacket(this.reconPack, this.buffers);
    this.finishedReconstruction();
    return packet;
  }
  return null;
};

/**
 * Cleans up binary packet reconstruction variables.
 *
 * @api private
 */

BinaryReconstructor.prototype.finishedReconstruction = function() {
  this.reconPack = null;
  this.buffers = [];
};

function error(data){
  return {
    type: exports.ERROR,
    data: 'parser error'
  };
}

},{"./binary":41,"./is-buffer":43,"component-emitter":10,"debug":12,"json3":44}],43:[function(require,module,exports){
(function (global){

module.exports = isBuf;

/**
 * Returns true if obj is a buffer or an arraybuffer.
 *
 * @api private
 */

function isBuf(obj) {
  return (global.Buffer && global.Buffer.isBuffer(obj)) ||
         (global.ArrayBuffer && obj instanceof ArrayBuffer);
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],44:[function(require,module,exports){
(function (global){
/*! JSON v3.3.2 | http://bestiejs.github.io/json3 | Copyright 2012-2014, Kit Cambridge | http://kit.mit-license.org */
;(function () {
  // Detect the `define` function exposed by asynchronous module loaders. The
  // strict `define` check is necessary for compatibility with `r.js`.
  var isLoader = typeof define === "function" && define.amd;

  // A set of types used to distinguish objects from primitives.
  var objectTypes = {
    "function": true,
    "object": true
  };

  // Detect the `exports` object exposed by CommonJS implementations.
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  // Use the `global` object exposed by Node (including Browserify via
  // `insert-module-globals`), Narwhal, and Ringo as the default context,
  // and the `window` object in browsers. Rhino exports a `global` function
  // instead.
  var root = objectTypes[typeof window] && window || this,
      freeGlobal = freeExports && objectTypes[typeof module] && module && !module.nodeType && typeof global == "object" && global;

  if (freeGlobal && (freeGlobal["global"] === freeGlobal || freeGlobal["window"] === freeGlobal || freeGlobal["self"] === freeGlobal)) {
    root = freeGlobal;
  }

  // Public: Initializes JSON 3 using the given `context` object, attaching the
  // `stringify` and `parse` functions to the specified `exports` object.
  function runInContext(context, exports) {
    context || (context = root["Object"]());
    exports || (exports = root["Object"]());

    // Native constructor aliases.
    var Number = context["Number"] || root["Number"],
        String = context["String"] || root["String"],
        Object = context["Object"] || root["Object"],
        Date = context["Date"] || root["Date"],
        SyntaxError = context["SyntaxError"] || root["SyntaxError"],
        TypeError = context["TypeError"] || root["TypeError"],
        Math = context["Math"] || root["Math"],
        nativeJSON = context["JSON"] || root["JSON"];

    // Delegate to the native `stringify` and `parse` implementations.
    if (typeof nativeJSON == "object" && nativeJSON) {
      exports.stringify = nativeJSON.stringify;
      exports.parse = nativeJSON.parse;
    }

    // Convenience aliases.
    var objectProto = Object.prototype,
        getClass = objectProto.toString,
        isProperty, forEach, undef;

    // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
    var isExtended = new Date(-3509827334573292);
    try {
      // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
      // results for certain dates in Opera >= 10.53.
      isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 &&
        // Safari < 2.0.2 stores the internal millisecond time value correctly,
        // but clips the values returned by the date methods to the range of
        // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
        isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
    } catch (exception) {}

    // Internal: Determines whether the native `JSON.stringify` and `parse`
    // implementations are spec-compliant. Based on work by Ken Snyder.
    function has(name) {
      if (has[name] !== undef) {
        // Return cached feature test result.
        return has[name];
      }
      var isSupported;
      if (name == "bug-string-char-index") {
        // IE <= 7 doesn't support accessing string characters using square
        // bracket notation. IE 8 only supports this for primitives.
        isSupported = "a"[0] != "a";
      } else if (name == "json") {
        // Indicates whether both `JSON.stringify` and `JSON.parse` are
        // supported.
        isSupported = has("json-stringify") && has("json-parse");
      } else {
        var value, serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
        // Test `JSON.stringify`.
        if (name == "json-stringify") {
          var stringify = exports.stringify, stringifySupported = typeof stringify == "function" && isExtended;
          if (stringifySupported) {
            // A test function object with a custom `toJSON` method.
            (value = function () {
              return 1;
            }).toJSON = value;
            try {
              stringifySupported =
                // Firefox 3.1b1 and b2 serialize string, number, and boolean
                // primitives as object literals.
                stringify(0) === "0" &&
                // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
                // literals.
                stringify(new Number()) === "0" &&
                stringify(new String()) == '""' &&
                // FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
                // does not define a canonical JSON representation (this applies to
                // objects with `toJSON` properties as well, *unless* they are nested
                // within an object or array).
                stringify(getClass) === undef &&
                // IE 8 serializes `undefined` as `"undefined"`. Safari <= 5.1.7 and
                // FF 3.1b3 pass this test.
                stringify(undef) === undef &&
                // Safari <= 5.1.7 and FF 3.1b3 throw `Error`s and `TypeError`s,
                // respectively, if the value is omitted entirely.
                stringify() === undef &&
                // FF 3.1b1, 2 throw an error if the given value is not a number,
                // string, array, object, Boolean, or `null` literal. This applies to
                // objects with custom `toJSON` methods as well, unless they are nested
                // inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
                // methods entirely.
                stringify(value) === "1" &&
                stringify([value]) == "[1]" &&
                // Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
                // `"[null]"`.
                stringify([undef]) == "[null]" &&
                // YUI 3.0.0b1 fails to serialize `null` literals.
                stringify(null) == "null" &&
                // FF 3.1b1, 2 halts serialization if an array contains a function:
                // `[1, true, getClass, 1]` serializes as "[1,true,],". FF 3.1b3
                // elides non-JSON values from objects and arrays, unless they
                // define custom `toJSON` methods.
                stringify([undef, getClass, null]) == "[null,null,null]" &&
                // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
                // where character escape codes are expected (e.g., `\b` => `\u0008`).
                stringify({ "a": [value, true, false, null, "\x00\b\n\f\r\t"] }) == serialized &&
                // FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
                stringify(null, value) === "1" &&
                stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
                // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
                // serialize extended years.
                stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
                // The milliseconds are optional in ES 5, but required in 5.1.
                stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
                // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
                // four-digit years instead of six-digit years. Credits: @Yaffle.
                stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
                // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
                // values less than 1000. Credits: @Yaffle.
                stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
            } catch (exception) {
              stringifySupported = false;
            }
          }
          isSupported = stringifySupported;
        }
        // Test `JSON.parse`.
        if (name == "json-parse") {
          var parse = exports.parse;
          if (typeof parse == "function") {
            try {
              // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
              // Conforming implementations should also coerce the initial argument to
              // a string prior to parsing.
              if (parse("0") === 0 && !parse(false)) {
                // Simple parsing test.
                value = parse(serialized);
                var parseSupported = value["a"].length == 5 && value["a"][0] === 1;
                if (parseSupported) {
                  try {
                    // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
                    parseSupported = !parse('"\t"');
                  } catch (exception) {}
                  if (parseSupported) {
                    try {
                      // FF 4.0 and 4.0.1 allow leading `+` signs and leading
                      // decimal points. FF 4.0, 4.0.1, and IE 9-10 also allow
                      // certain octal literals.
                      parseSupported = parse("01") !== 1;
                    } catch (exception) {}
                  }
                  if (parseSupported) {
                    try {
                      // FF 4.0, 4.0.1, and Rhino 1.7R3-R4 allow trailing decimal
                      // points. These environments, along with FF 3.1b1 and 2,
                      // also allow trailing commas in JSON objects and arrays.
                      parseSupported = parse("1.") !== 1;
                    } catch (exception) {}
                  }
                }
              }
            } catch (exception) {
              parseSupported = false;
            }
          }
          isSupported = parseSupported;
        }
      }
      return has[name] = !!isSupported;
    }

    if (!has("json")) {
      // Common `[[Class]]` name aliases.
      var functionClass = "[object Function]",
          dateClass = "[object Date]",
          numberClass = "[object Number]",
          stringClass = "[object String]",
          arrayClass = "[object Array]",
          booleanClass = "[object Boolean]";

      // Detect incomplete support for accessing string characters by index.
      var charIndexBuggy = has("bug-string-char-index");

      // Define additional utility methods if the `Date` methods are buggy.
      if (!isExtended) {
        var floor = Math.floor;
        // A mapping between the months of the year and the number of days between
        // January 1st and the first of the respective month.
        var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        // Internal: Calculates the number of days between the Unix epoch and the
        // first day of the given month.
        var getDay = function (year, month) {
          return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
        };
      }

      // Internal: Determines if a property is a direct property of the given
      // object. Delegates to the native `Object#hasOwnProperty` method.
      if (!(isProperty = objectProto.hasOwnProperty)) {
        isProperty = function (property) {
          var members = {}, constructor;
          if ((members.__proto__ = null, members.__proto__ = {
            // The *proto* property cannot be set multiple times in recent
            // versions of Firefox and SeaMonkey.
            "toString": 1
          }, members).toString != getClass) {
            // Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
            // supports the mutable *proto* property.
            isProperty = function (property) {
              // Capture and break the object's prototype chain (see section 8.6.2
              // of the ES 5.1 spec). The parenthesized expression prevents an
              // unsafe transformation by the Closure Compiler.
              var original = this.__proto__, result = property in (this.__proto__ = null, this);
              // Restore the original prototype chain.
              this.__proto__ = original;
              return result;
            };
          } else {
            // Capture a reference to the top-level `Object` constructor.
            constructor = members.constructor;
            // Use the `constructor` property to simulate `Object#hasOwnProperty` in
            // other environments.
            isProperty = function (property) {
              var parent = (this.constructor || constructor).prototype;
              return property in this && !(property in parent && this[property] === parent[property]);
            };
          }
          members = null;
          return isProperty.call(this, property);
        };
      }

      // Internal: Normalizes the `for...in` iteration algorithm across
      // environments. Each enumerated key is yielded to a `callback` function.
      forEach = function (object, callback) {
        var size = 0, Properties, members, property;

        // Tests for bugs in the current environment's `for...in` algorithm. The
        // `valueOf` property inherits the non-enumerable flag from
        // `Object.prototype` in older versions of IE, Netscape, and Mozilla.
        (Properties = function () {
          this.valueOf = 0;
        }).prototype.valueOf = 0;

        // Iterate over a new instance of the `Properties` class.
        members = new Properties();
        for (property in members) {
          // Ignore all properties inherited from `Object.prototype`.
          if (isProperty.call(members, property)) {
            size++;
          }
        }
        Properties = members = null;

        // Normalize the iteration algorithm.
        if (!size) {
          // A list of non-enumerable properties inherited from `Object.prototype`.
          members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
          // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
          // properties.
          forEach = function (object, callback) {
            var isFunction = getClass.call(object) == functionClass, property, length;
            var hasProperty = !isFunction && typeof object.constructor != "function" && objectTypes[typeof object.hasOwnProperty] && object.hasOwnProperty || isProperty;
            for (property in object) {
              // Gecko <= 1.0 enumerates the `prototype` property of functions under
              // certain conditions; IE does not.
              if (!(isFunction && property == "prototype") && hasProperty.call(object, property)) {
                callback(property);
              }
            }
            // Manually invoke the callback for each non-enumerable property.
            for (length = members.length; property = members[--length]; hasProperty.call(object, property) && callback(property));
          };
        } else if (size == 2) {
          // Safari <= 2.0.4 enumerates shadowed properties twice.
          forEach = function (object, callback) {
            // Create a set of iterated properties.
            var members = {}, isFunction = getClass.call(object) == functionClass, property;
            for (property in object) {
              // Store each property name to prevent double enumeration. The
              // `prototype` property of functions is not enumerated due to cross-
              // environment inconsistencies.
              if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
                callback(property);
              }
            }
          };
        } else {
          // No bugs detected; use the standard `for...in` algorithm.
          forEach = function (object, callback) {
            var isFunction = getClass.call(object) == functionClass, property, isConstructor;
            for (property in object) {
              if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
                callback(property);
              }
            }
            // Manually invoke the callback for the `constructor` property due to
            // cross-environment inconsistencies.
            if (isConstructor || isProperty.call(object, (property = "constructor"))) {
              callback(property);
            }
          };
        }
        return forEach(object, callback);
      };

      // Public: Serializes a JavaScript `value` as a JSON string. The optional
      // `filter` argument may specify either a function that alters how object and
      // array members are serialized, or an array of strings and numbers that
      // indicates which properties should be serialized. The optional `width`
      // argument may be either a string or number that specifies the indentation
      // level of the output.
      if (!has("json-stringify")) {
        // Internal: A map of control characters and their escaped equivalents.
        var Escapes = {
          92: "\\\\",
          34: '\\"',
          8: "\\b",
          12: "\\f",
          10: "\\n",
          13: "\\r",
          9: "\\t"
        };

        // Internal: Converts `value` into a zero-padded string such that its
        // length is at least equal to `width`. The `width` must be <= 6.
        var leadingZeroes = "000000";
        var toPaddedString = function (width, value) {
          // The `|| 0` expression is necessary to work around a bug in
          // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
          return (leadingZeroes + (value || 0)).slice(-width);
        };

        // Internal: Double-quotes a string `value`, replacing all ASCII control
        // characters (characters with code unit values between 0 and 31) with
        // their escaped equivalents. This is an implementation of the
        // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
        var unicodePrefix = "\\u00";
        var quote = function (value) {
          var result = '"', index = 0, length = value.length, useCharIndex = !charIndexBuggy || length > 10;
          var symbols = useCharIndex && (charIndexBuggy ? value.split("") : value);
          for (; index < length; index++) {
            var charCode = value.charCodeAt(index);
            // If the character is a control character, append its Unicode or
            // shorthand escape sequence; otherwise, append the character as-is.
            switch (charCode) {
              case 8: case 9: case 10: case 12: case 13: case 34: case 92:
                result += Escapes[charCode];
                break;
              default:
                if (charCode < 32) {
                  result += unicodePrefix + toPaddedString(2, charCode.toString(16));
                  break;
                }
                result += useCharIndex ? symbols[index] : value.charAt(index);
            }
          }
          return result + '"';
        };

        // Internal: Recursively serializes an object. Implements the
        // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
        var serialize = function (property, object, callback, properties, whitespace, indentation, stack) {
          var value, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, result;
          try {
            // Necessary for host object support.
            value = object[property];
          } catch (exception) {}
          if (typeof value == "object" && value) {
            className = getClass.call(value);
            if (className == dateClass && !isProperty.call(value, "toJSON")) {
              if (value > -1 / 0 && value < 1 / 0) {
                // Dates are serialized according to the `Date#toJSON` method
                // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
                // for the ISO 8601 date time string format.
                if (getDay) {
                  // Manually compute the year, month, date, hours, minutes,
                  // seconds, and milliseconds if the `getUTC*` methods are
                  // buggy. Adapted from @Yaffle's `date-shim` project.
                  date = floor(value / 864e5);
                  for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);
                  for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);
                  date = 1 + date - getDay(year, month);
                  // The `time` value specifies the time within the day (see ES
                  // 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
                  // to compute `A modulo B`, as the `%` operator does not
                  // correspond to the `modulo` operation for negative numbers.
                  time = (value % 864e5 + 864e5) % 864e5;
                  // The hours, minutes, seconds, and milliseconds are obtained by
                  // decomposing the time within the day. See section 15.9.1.10.
                  hours = floor(time / 36e5) % 24;
                  minutes = floor(time / 6e4) % 60;
                  seconds = floor(time / 1e3) % 60;
                  milliseconds = time % 1e3;
                } else {
                  year = value.getUTCFullYear();
                  month = value.getUTCMonth();
                  date = value.getUTCDate();
                  hours = value.getUTCHours();
                  minutes = value.getUTCMinutes();
                  seconds = value.getUTCSeconds();
                  milliseconds = value.getUTCMilliseconds();
                }
                // Serialize extended years correctly.
                value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) +
                  "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
                  // Months, dates, hours, minutes, and seconds should have two
                  // digits; milliseconds should have three.
                  "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
                  // Milliseconds are optional in ES 5.0, but required in 5.1.
                  "." + toPaddedString(3, milliseconds) + "Z";
              } else {
                value = null;
              }
            } else if (typeof value.toJSON == "function" && ((className != numberClass && className != stringClass && className != arrayClass) || isProperty.call(value, "toJSON"))) {
              // Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
              // `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
              // ignores all `toJSON` methods on these objects unless they are
              // defined directly on an instance.
              value = value.toJSON(property);
            }
          }
          if (callback) {
            // If a replacement function was provided, call it to obtain the value
            // for serialization.
            value = callback.call(object, property, value);
          }
          if (value === null) {
            return "null";
          }
          className = getClass.call(value);
          if (className == booleanClass) {
            // Booleans are represented literally.
            return "" + value;
          } else if (className == numberClass) {
            // JSON numbers must be finite. `Infinity` and `NaN` are serialized as
            // `"null"`.
            return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
          } else if (className == stringClass) {
            // Strings are double-quoted and escaped.
            return quote("" + value);
          }
          // Recursively serialize objects and arrays.
          if (typeof value == "object") {
            // Check for cyclic structures. This is a linear search; performance
            // is inversely proportional to the number of unique nested objects.
            for (length = stack.length; length--;) {
              if (stack[length] === value) {
                // Cyclic structures cannot be serialized by `JSON.stringify`.
                throw TypeError();
              }
            }
            // Add the object to the stack of traversed objects.
            stack.push(value);
            results = [];
            // Save the current indentation level and indent one additional level.
            prefix = indentation;
            indentation += whitespace;
            if (className == arrayClass) {
              // Recursively serialize array elements.
              for (index = 0, length = value.length; index < length; index++) {
                element = serialize(index, value, callback, properties, whitespace, indentation, stack);
                results.push(element === undef ? "null" : element);
              }
              result = results.length ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
            } else {
              // Recursively serialize object members. Members are selected from
              // either a user-specified list of property names, or the object
              // itself.
              forEach(properties || value, function (property) {
                var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
                if (element !== undef) {
                  // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
                  // is not the empty string, let `member` {quote(property) + ":"}
                  // be the concatenation of `member` and the `space` character."
                  // The "`space` character" refers to the literal space
                  // character, not the `space` {width} argument provided to
                  // `JSON.stringify`.
                  results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
                }
              });
              result = results.length ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
            }
            // Remove the object from the traversed object stack.
            stack.pop();
            return result;
          }
        };

        // Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
        exports.stringify = function (source, filter, width) {
          var whitespace, callback, properties, className;
          if (objectTypes[typeof filter] && filter) {
            if ((className = getClass.call(filter)) == functionClass) {
              callback = filter;
            } else if (className == arrayClass) {
              // Convert the property names array into a makeshift set.
              properties = {};
              for (var index = 0, length = filter.length, value; index < length; value = filter[index++], ((className = getClass.call(value)), className == stringClass || className == numberClass) && (properties[value] = 1));
            }
          }
          if (width) {
            if ((className = getClass.call(width)) == numberClass) {
              // Convert the `width` to an integer and create a string containing
              // `width` number of space characters.
              if ((width -= width % 1) > 0) {
                for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
              }
            } else if (className == stringClass) {
              whitespace = width.length <= 10 ? width : width.slice(0, 10);
            }
          }
          // Opera <= 7.54u2 discards the values associated with empty string keys
          // (`""`) only if they are used directly within an object member list
          // (e.g., `!("" in { "": 1})`).
          return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
        };
      }

      // Public: Parses a JSON source string.
      if (!has("json-parse")) {
        var fromCharCode = String.fromCharCode;

        // Internal: A map of escaped control characters and their unescaped
        // equivalents.
        var Unescapes = {
          92: "\\",
          34: '"',
          47: "/",
          98: "\b",
          116: "\t",
          110: "\n",
          102: "\f",
          114: "\r"
        };

        // Internal: Stores the parser state.
        var Index, Source;

        // Internal: Resets the parser state and throws a `SyntaxError`.
        var abort = function () {
          Index = Source = null;
          throw SyntaxError();
        };

        // Internal: Returns the next token, or `"$"` if the parser has reached
        // the end of the source string. A token may be a string, number, `null`
        // literal, or Boolean literal.
        var lex = function () {
          var source = Source, length = source.length, value, begin, position, isSigned, charCode;
          while (Index < length) {
            charCode = source.charCodeAt(Index);
            switch (charCode) {
              case 9: case 10: case 13: case 32:
                // Skip whitespace tokens, including tabs, carriage returns, line
                // feeds, and space characters.
                Index++;
                break;
              case 123: case 125: case 91: case 93: case 58: case 44:
                // Parse a punctuator token (`{`, `}`, `[`, `]`, `:`, or `,`) at
                // the current position.
                value = charIndexBuggy ? source.charAt(Index) : source[Index];
                Index++;
                return value;
              case 34:
                // `"` delimits a JSON string; advance to the next character and
                // begin parsing the string. String tokens are prefixed with the
                // sentinel `@` character to distinguish them from punctuators and
                // end-of-string tokens.
                for (value = "@", Index++; Index < length;) {
                  charCode = source.charCodeAt(Index);
                  if (charCode < 32) {
                    // Unescaped ASCII control characters (those with a code unit
                    // less than the space character) are not permitted.
                    abort();
                  } else if (charCode == 92) {
                    // A reverse solidus (`\`) marks the beginning of an escaped
                    // control character (including `"`, `\`, and `/`) or Unicode
                    // escape sequence.
                    charCode = source.charCodeAt(++Index);
                    switch (charCode) {
                      case 92: case 34: case 47: case 98: case 116: case 110: case 102: case 114:
                        // Revive escaped control characters.
                        value += Unescapes[charCode];
                        Index++;
                        break;
                      case 117:
                        // `\u` marks the beginning of a Unicode escape sequence.
                        // Advance to the first character and validate the
                        // four-digit code point.
                        begin = ++Index;
                        for (position = Index + 4; Index < position; Index++) {
                          charCode = source.charCodeAt(Index);
                          // A valid sequence comprises four hexdigits (case-
                          // insensitive) that form a single hexadecimal value.
                          if (!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)) {
                            // Invalid Unicode escape sequence.
                            abort();
                          }
                        }
                        // Revive the escaped character.
                        value += fromCharCode("0x" + source.slice(begin, Index));
                        break;
                      default:
                        // Invalid escape sequence.
                        abort();
                    }
                  } else {
                    if (charCode == 34) {
                      // An unescaped double-quote character marks the end of the
                      // string.
                      break;
                    }
                    charCode = source.charCodeAt(Index);
                    begin = Index;
                    // Optimize for the common case where a string is valid.
                    while (charCode >= 32 && charCode != 92 && charCode != 34) {
                      charCode = source.charCodeAt(++Index);
                    }
                    // Append the string as-is.
                    value += source.slice(begin, Index);
                  }
                }
                if (source.charCodeAt(Index) == 34) {
                  // Advance to the next character and return the revived string.
                  Index++;
                  return value;
                }
                // Unterminated string.
                abort();
              default:
                // Parse numbers and literals.
                begin = Index;
                // Advance past the negative sign, if one is specified.
                if (charCode == 45) {
                  isSigned = true;
                  charCode = source.charCodeAt(++Index);
                }
                // Parse an integer or floating-point value.
                if (charCode >= 48 && charCode <= 57) {
                  // Leading zeroes are interpreted as octal literals.
                  if (charCode == 48 && ((charCode = source.charCodeAt(Index + 1)), charCode >= 48 && charCode <= 57)) {
                    // Illegal octal literal.
                    abort();
                  }
                  isSigned = false;
                  // Parse the integer component.
                  for (; Index < length && ((charCode = source.charCodeAt(Index)), charCode >= 48 && charCode <= 57); Index++);
                  // Floats cannot contain a leading decimal point; however, this
                  // case is already accounted for by the parser.
                  if (source.charCodeAt(Index) == 46) {
                    position = ++Index;
                    // Parse the decimal component.
                    for (; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                    if (position == Index) {
                      // Illegal trailing decimal.
                      abort();
                    }
                    Index = position;
                  }
                  // Parse exponents. The `e` denoting the exponent is
                  // case-insensitive.
                  charCode = source.charCodeAt(Index);
                  if (charCode == 101 || charCode == 69) {
                    charCode = source.charCodeAt(++Index);
                    // Skip past the sign following the exponent, if one is
                    // specified.
                    if (charCode == 43 || charCode == 45) {
                      Index++;
                    }
                    // Parse the exponential component.
                    for (position = Index; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                    if (position == Index) {
                      // Illegal empty exponent.
                      abort();
                    }
                    Index = position;
                  }
                  // Coerce the parsed value to a JavaScript number.
                  return +source.slice(begin, Index);
                }
                // A negative sign may only precede numbers.
                if (isSigned) {
                  abort();
                }
                // `true`, `false`, and `null` literals.
                if (source.slice(Index, Index + 4) == "true") {
                  Index += 4;
                  return true;
                } else if (source.slice(Index, Index + 5) == "false") {
                  Index += 5;
                  return false;
                } else if (source.slice(Index, Index + 4) == "null") {
                  Index += 4;
                  return null;
                }
                // Unrecognized token.
                abort();
            }
          }
          // Return the sentinel `$` character if the parser has reached the end
          // of the source string.
          return "$";
        };

        // Internal: Parses a JSON `value` token.
        var get = function (value) {
          var results, hasMembers;
          if (value == "$") {
            // Unexpected end of input.
            abort();
          }
          if (typeof value == "string") {
            if ((charIndexBuggy ? value.charAt(0) : value[0]) == "@") {
              // Remove the sentinel `@` character.
              return value.slice(1);
            }
            // Parse object and array literals.
            if (value == "[") {
              // Parses a JSON array, returning a new JavaScript array.
              results = [];
              for (;; hasMembers || (hasMembers = true)) {
                value = lex();
                // A closing square bracket marks the end of the array literal.
                if (value == "]") {
                  break;
                }
                // If the array literal contains elements, the current token
                // should be a comma separating the previous element from the
                // next.
                if (hasMembers) {
                  if (value == ",") {
                    value = lex();
                    if (value == "]") {
                      // Unexpected trailing `,` in array literal.
                      abort();
                    }
                  } else {
                    // A `,` must separate each array element.
                    abort();
                  }
                }
                // Elisions and leading commas are not permitted.
                if (value == ",") {
                  abort();
                }
                results.push(get(value));
              }
              return results;
            } else if (value == "{") {
              // Parses a JSON object, returning a new JavaScript object.
              results = {};
              for (;; hasMembers || (hasMembers = true)) {
                value = lex();
                // A closing curly brace marks the end of the object literal.
                if (value == "}") {
                  break;
                }
                // If the object literal contains members, the current token
                // should be a comma separator.
                if (hasMembers) {
                  if (value == ",") {
                    value = lex();
                    if (value == "}") {
                      // Unexpected trailing `,` in object literal.
                      abort();
                    }
                  } else {
                    // A `,` must separate each object member.
                    abort();
                  }
                }
                // Leading commas are not permitted, object property names must be
                // double-quoted strings, and a `:` must separate each property
                // name and value.
                if (value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":") {
                  abort();
                }
                results[value.slice(1)] = get(lex());
              }
              return results;
            }
            // Unexpected token encountered.
            abort();
          }
          return value;
        };

        // Internal: Updates a traversed object member.
        var update = function (source, property, callback) {
          var element = walk(source, property, callback);
          if (element === undef) {
            delete source[property];
          } else {
            source[property] = element;
          }
        };

        // Internal: Recursively traverses a parsed JSON object, invoking the
        // `callback` function for each value. This is an implementation of the
        // `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
        var walk = function (source, property, callback) {
          var value = source[property], length;
          if (typeof value == "object" && value) {
            // `forEach` can't be used to traverse an array in Opera <= 8.54
            // because its `Object#hasOwnProperty` implementation returns `false`
            // for array indices (e.g., `![1, 2, 3].hasOwnProperty("0")`).
            if (getClass.call(value) == arrayClass) {
              for (length = value.length; length--;) {
                update(value, length, callback);
              }
            } else {
              forEach(value, function (property) {
                update(value, property, callback);
              });
            }
          }
          return callback.call(source, property, value);
        };

        // Public: `JSON.parse`. See ES 5.1 section 15.12.2.
        exports.parse = function (source, callback) {
          var result, value;
          Index = 0;
          Source = "" + source;
          result = get(lex());
          // If a JSON string contains multiple tokens, it is invalid.
          if (lex() != "$") {
            abort();
          }
          // Reset the parser state.
          Index = Source = null;
          return callback && getClass.call(callback) == functionClass ? walk((value = {}, value[""] = result, value), "", callback) : result;
        };
      }
    }

    exports["runInContext"] = runInContext;
    return exports;
  }

  if (freeExports && !isLoader) {
    // Export for CommonJS environments.
    runInContext(root, freeExports);
  } else {
    // Export for web browsers and JavaScript engines.
    var nativeJSON = root.JSON,
        previousJSON = root["JSON3"],
        isRestored = false;

    var JSON3 = runInContext(root, (root["JSON3"] = {
      // Public: Restores the original value of the global `JSON` object and
      // returns a reference to the `JSON3` object.
      "noConflict": function () {
        if (!isRestored) {
          isRestored = true;
          root.JSON = nativeJSON;
          root["JSON3"] = previousJSON;
          nativeJSON = previousJSON = null;
        }
        return JSON3;
      }
    }));

    root.JSON = {
      "parse": JSON3.parse,
      "stringify": JSON3.stringify
    };
  }

  // Export for asynchronous module loaders.
  if (isLoader) {
    define(function () {
      return JSON3;
    });
  }
}).call(this);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],45:[function(require,module,exports){
module.exports = toArray

function toArray(list, index) {
    var array = []

    index = index || 0

    for (var i = index || 0; i < list.length; i++) {
        array[i - index] = list[i]
    }

    return array
}

},{}],46:[function(require,module,exports){
(function (global){
/*! https://mths.be/wtf8 v1.0.0 by @mathias */
;(function(root) {

	// Detect free variables `exports`
	var freeExports = typeof exports == 'object' && exports;

	// Detect free variable `module`
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code,
	// and use it as `root`
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	var stringFromCharCode = String.fromCharCode;

	// Taken from https://mths.be/punycode
	function ucs2decode(string) {
		var output = [];
		var counter = 0;
		var length = string.length;
		var value;
		var extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	// Taken from https://mths.be/punycode
	function ucs2encode(array) {
		var length = array.length;
		var index = -1;
		var value;
		var output = '';
		while (++index < length) {
			value = array[index];
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
		}
		return output;
	}

	/*--------------------------------------------------------------------------*/

	function createByte(codePoint, shift) {
		return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
	}

	function encodeCodePoint(codePoint) {
		if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
			return stringFromCharCode(codePoint);
		}
		var symbol = '';
		if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
			symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
		}
		else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
			symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
			symbol += createByte(codePoint, 6);
		}
		else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
			symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
			symbol += createByte(codePoint, 12);
			symbol += createByte(codePoint, 6);
		}
		symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
		return symbol;
	}

	function wtf8encode(string) {
		var codePoints = ucs2decode(string);
		var length = codePoints.length;
		var index = -1;
		var codePoint;
		var byteString = '';
		while (++index < length) {
			codePoint = codePoints[index];
			byteString += encodeCodePoint(codePoint);
		}
		return byteString;
	}

	/*--------------------------------------------------------------------------*/

	function readContinuationByte() {
		if (byteIndex >= byteCount) {
			throw Error('Invalid byte index');
		}

		var continuationByte = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		if ((continuationByte & 0xC0) == 0x80) {
			return continuationByte & 0x3F;
		}

		// If we end up here, it’s not a continuation byte.
		throw Error('Invalid continuation byte');
	}

	function decodeSymbol() {
		var byte1;
		var byte2;
		var byte3;
		var byte4;
		var codePoint;

		if (byteIndex > byteCount) {
			throw Error('Invalid byte index');
		}

		if (byteIndex == byteCount) {
			return false;
		}

		// Read the first byte.
		byte1 = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		// 1-byte sequence (no continuation bytes)
		if ((byte1 & 0x80) == 0) {
			return byte1;
		}

		// 2-byte sequence
		if ((byte1 & 0xE0) == 0xC0) {
			var byte2 = readContinuationByte();
			codePoint = ((byte1 & 0x1F) << 6) | byte2;
			if (codePoint >= 0x80) {
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 3-byte sequence (may include unpaired surrogates)
		if ((byte1 & 0xF0) == 0xE0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
			if (codePoint >= 0x0800) {
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 4-byte sequence
		if ((byte1 & 0xF8) == 0xF0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			byte4 = readContinuationByte();
			codePoint = ((byte1 & 0x0F) << 0x12) | (byte2 << 0x0C) |
				(byte3 << 0x06) | byte4;
			if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
				return codePoint;
			}
		}

		throw Error('Invalid WTF-8 detected');
	}

	var byteArray;
	var byteCount;
	var byteIndex;
	function wtf8decode(byteString) {
		byteArray = ucs2decode(byteString);
		byteCount = byteArray.length;
		byteIndex = 0;
		var codePoints = [];
		var tmp;
		while ((tmp = decodeSymbol()) !== false) {
			codePoints.push(tmp);
		}
		return ucs2encode(codePoints);
	}

	/*--------------------------------------------------------------------------*/

	var wtf8 = {
		'version': '1.0.0',
		'encode': wtf8encode,
		'decode': wtf8decode
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define(function() {
			return wtf8;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = wtf8;
		} else { // in Narwhal or RingoJS v0.7.0-
			var object = {};
			var hasOwnProperty = object.hasOwnProperty;
			for (var key in wtf8) {
				hasOwnProperty.call(wtf8, key) && (freeExports[key] = wtf8[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.wtf8 = wtf8;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],47:[function(require,module,exports){
'use strict';

var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split('')
  , length = 64
  , map = {}
  , seed = 0
  , i = 0
  , prev;

/**
 * Return a string representing the specified number.
 *
 * @param {Number} num The number to convert.
 * @returns {String} The string representation of the number.
 * @api public
 */
function encode(num) {
  var encoded = '';

  do {
    encoded = alphabet[num % length] + encoded;
    num = Math.floor(num / length);
  } while (num > 0);

  return encoded;
}

/**
 * Return the integer value specified by the given string.
 *
 * @param {String} str The string to convert.
 * @returns {Number} The integer value represented by the string.
 * @api public
 */
function decode(str) {
  var decoded = 0;

  for (i = 0; i < str.length; i++) {
    decoded = decoded * length + map[str.charAt(i)];
  }

  return decoded;
}

/**
 * Yeast: A tiny growing id generator.
 *
 * @returns {String} A unique id.
 * @api public
 */
function yeast() {
  var now = encode(+new Date());

  if (now !== prev) return seed = 0, prev = now;
  return now +'.'+ encode(seed++);
}

//
// Map each character to its index.
//
for (; i < length; i++) map[alphabet[i]] = i;

//
// Expose the `yeast`, `encode` and `decode` functions.
//
yeast.encode = encode;
yeast.decode = decode;
module.exports = yeast;

},{}],48:[function(require,module,exports){
var io = require('socket.io-client');


var Player = require('./node_modules/broadway-player/Player/Player');
var player = new Player({
    useWorker: true,
    workerFile: './node_modules/broadway-player/Player/Decoder.js',
});

player.canvas.id = 'videoCanvas';
player.canvas.width = 640;
player.canvas.height = 368;
$('#main').append(player.canvas);
$('#videoCanvas').css('background-color', 'white');
$('#videoCanvas').css('border', '1px solid black');


var toUint8Array = function (parStr) {
    var raw = atob(parStr);
    var array = new Uint8Array(new ArrayBuffer(raw.length));

    Array.prototype.forEach.call(raw, function (data, index) {
        array[index] = raw.charCodeAt(index);
    });

    return array;
};

socket.on('data', function (data) {
    player.decode(toUint8Array(data));
});
},{"./node_modules/broadway-player/Player/Player":7,"socket.io-client":35}],49:[function(require,module,exports){

},{}],50:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[48]);
