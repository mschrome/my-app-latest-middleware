
// ============================================================
// Next.js Middleware compiled for EdgeOne Pages Edge Function
// Generated at: 2026-01-06T12:22:02.351Z
// ============================================================


// ============================================================
// Node.js Polyfills for Edge Runtime
// ============================================================


// === Headers Polyfill for EdgeOne ===
// EdgeOne Headers 构造函数不接受 undefined 参数，需要包装处理
(function() {
  const OriginalHeaders = globalThis.Headers;
  
  // 检查是否需要 polyfill
  let needsPatch = false;
  try {
    new OriginalHeaders(undefined);
  } catch (e) {
    needsPatch = true;
  }
  
  if (needsPatch) {
    // 使用 Proxy 包装 Headers 构造函数
    globalThis.Headers = new Proxy(OriginalHeaders, {
      construct(target, args) {
        // 如果第一个参数是 undefined 或 null，传入空对象
        if (args[0] === undefined || args[0] === null) {
          return new target({});
        }
        return new target(...args);
      },
      get(target, prop, receiver) {
        return Reflect.get(target, prop, receiver);
      }
    });
    console.log('[Polyfill] Headers constructor patched for EdgeOne compatibility');
  }
})();



// === Response Polyfill for EdgeOne ===
// 确保 Response 构造函数能正确处理各种参数
(function() {
  const OriginalResponse = globalThis.Response;
  
  // 清理 ResponseInit 参数，只保留 EdgeOne 支持的属性
  function cleanResponseInit(init) {
    if (init === undefined || init === null) {
      return {};
    }
    if (typeof init !== 'object') {
      return init;
    }
    // 只保留 EdgeOne 支持的属性: status, statusText, headers
    const cleanInit = {};
    if (init.status !== undefined) cleanInit.status = init.status;
    if (init.statusText !== undefined) cleanInit.statusText = init.statusText;
    if (init.headers !== undefined) cleanInit.headers = init.headers;
    return cleanInit;
  }
  
  // 包装 Response.redirect 静态方法
  // EdgeOne 的 Response.redirect 只接受字符串，不接受 URL 对象
  const originalRedirect = OriginalResponse.redirect;
  const patchedRedirect = function(url, status) {
    // 如果 url 是 URL 对象，转换为字符串
    const urlString = (url && typeof url === 'object' && url.toString) ? url.toString() : url;
    return originalRedirect.call(OriginalResponse, urlString, status);
  };
  
  // 创建 cookies 对象的工厂函数
  function createResponseCookies(response) {
    const cookieStore = new Map();
    return {
      get: (name) => cookieStore.get(name),
      getAll: () => Array.from(cookieStore.values()),
      has: (name) => cookieStore.has(name),
      set: (nameOrOptions, value, options) => {
        let cookieName, cookieValue, cookieOptions;
        if (typeof nameOrOptions === 'object') {
          cookieName = nameOrOptions.name;
          cookieValue = nameOrOptions.value;
          cookieOptions = nameOrOptions;
        } else {
          cookieName = nameOrOptions;
          cookieValue = value;
          cookieOptions = options || {};
        }
        cookieStore.set(cookieName, { name: cookieName, value: cookieValue, ...cookieOptions });
        // 同步到 Set-Cookie header
        const cookieParts = [cookieName + '=' + encodeURIComponent(cookieValue)];
        if (cookieOptions.path) cookieParts.push('Path=' + cookieOptions.path);
        if (cookieOptions.domain) cookieParts.push('Domain=' + cookieOptions.domain);
        if (cookieOptions.maxAge) cookieParts.push('Max-Age=' + cookieOptions.maxAge);
        if (cookieOptions.expires) cookieParts.push('Expires=' + cookieOptions.expires.toUTCString());
        if (cookieOptions.httpOnly) cookieParts.push('HttpOnly');
        if (cookieOptions.secure) cookieParts.push('Secure');
        if (cookieOptions.sameSite) cookieParts.push('SameSite=' + cookieOptions.sameSite);
        response.headers.append('Set-Cookie', cookieParts.join('; '));
      },
      delete: (name) => {
        cookieStore.delete(name);
        response.headers.append('Set-Cookie', name + '=; Max-Age=0; Path=/');
      },
      clear: () => cookieStore.clear(),
      [Symbol.iterator]: () => cookieStore.values(),
      size: cookieStore.size
    };
  }
  
  // 使用 Proxy 包装 Response 构造函数
  globalThis.Response = new Proxy(OriginalResponse, {
    construct(target, args) {
      // args[0] = body, args[1] = init
      const body = args[0];
      const init = cleanResponseInit(args[1]);
      const response = new target(body, init);
      
      // 为 response 添加 cookies 属性（NextResponse 兼容）
      if (!response.cookies) {
        Object.defineProperty(response, 'cookies', {
          value: createResponseCookies(response),
          writable: true,
          enumerable: true
        });
      }
      
      return response;
    },
    get(target, prop, receiver) {
      // 拦截 redirect 静态方法
      if (prop === 'redirect') {
        return patchedRedirect;
      }
      // 其他静态方法直接从原始 Response 获取
      return Reflect.get(target, prop, receiver);
    }
  });
})();



// === Buffer Polyfill ===
const Buffer = (function() {
  class BufferPolyfill extends Uint8Array {
    static isBuffer(obj) {
      return obj instanceof BufferPolyfill || obj instanceof Uint8Array;
    }

    static from(value, encodingOrOffset, length) {
      if (typeof value === 'string') {
        const encoding = encodingOrOffset || 'utf8';
        if (encoding === 'base64') {
          const binaryString = atob(value);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return new BufferPolyfill(bytes);
        } else if (encoding === 'hex') {
          const bytes = new Uint8Array(value.length / 2);
          for (let i = 0; i < value.length; i += 2) {
            bytes[i / 2] = parseInt(value.substr(i, 2), 16);
          }
          return new BufferPolyfill(bytes);
        } else {
          // utf8
          const encoder = new TextEncoder();
          return new BufferPolyfill(encoder.encode(value));
        }
      }
      if (Array.isArray(value) || value instanceof Uint8Array) {
        return new BufferPolyfill(value);
      }
      if (value instanceof ArrayBuffer) {
        return new BufferPolyfill(new Uint8Array(value, encodingOrOffset, length));
      }
      throw new TypeError('Invalid argument type for Buffer.from');
    }

    static alloc(size, fill, encoding) {
      const buf = new BufferPolyfill(size);
      if (fill !== undefined) {
        if (typeof fill === 'number') {
          buf.fill(fill);
        } else if (typeof fill === 'string') {
          const fillBuf = BufferPolyfill.from(fill, encoding);
          for (let i = 0; i < size; i++) {
            buf[i] = fillBuf[i % fillBuf.length];
          }
        }
      }
      return buf;
    }

    static allocUnsafe(size) {
      return new BufferPolyfill(size);
    }

    static concat(list, totalLength) {
      if (totalLength === undefined) {
        totalLength = list.reduce((acc, buf) => acc + buf.length, 0);
      }
      const result = new BufferPolyfill(totalLength);
      let offset = 0;
      for (const buf of list) {
        result.set(buf, offset);
        offset += buf.length;
      }
      return result;
    }

    static byteLength(string, encoding) {
      if (typeof string !== 'string') {
        return string.length || string.byteLength || 0;
      }
      if (encoding === 'base64') {
        return Math.ceil(string.length * 3 / 4);
      }
      return new TextEncoder().encode(string).length;
    }

    toString(encoding = 'utf8', start = 0, end = this.length) {
      const slice = this.subarray(start, end);
      if (encoding === 'base64') {
        let binary = '';
        for (let i = 0; i < slice.length; i++) {
          binary += String.fromCharCode(slice[i]);
        }
        return btoa(binary);
      } else if (encoding === 'hex') {
        return Array.from(slice)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      } else {
        // utf8
        return new TextDecoder().decode(slice);
      }
    }

    write(string, offset = 0, length, encoding = 'utf8') {
      const buf = BufferPolyfill.from(string, encoding);
      const bytesToWrite = Math.min(buf.length, length || this.length - offset);
      this.set(buf.subarray(0, bytesToWrite), offset);
      return bytesToWrite;
    }

    copy(target, targetStart = 0, sourceStart = 0, sourceEnd = this.length) {
      const slice = this.subarray(sourceStart, sourceEnd);
      target.set(slice, targetStart);
      return slice.length;
    }

    slice(start, end) {
      return new BufferPolyfill(this.subarray(start, end));
    }

    equals(otherBuffer) {
      if (this.length !== otherBuffer.length) return false;
      for (let i = 0; i < this.length; i++) {
        if (this[i] !== otherBuffer[i]) return false;
      }
      return true;
    }

    compare(otherBuffer) {
      const len = Math.min(this.length, otherBuffer.length);
      for (let i = 0; i < len; i++) {
        if (this[i] < otherBuffer[i]) return -1;
        if (this[i] > otherBuffer[i]) return 1;
      }
      if (this.length < otherBuffer.length) return -1;
      if (this.length > otherBuffer.length) return 1;
      return 0;
    }

    indexOf(value, byteOffset = 0, encoding) {
      if (typeof value === 'string') {
        value = BufferPolyfill.from(value, encoding);
      }
      if (typeof value === 'number') {
        for (let i = byteOffset; i < this.length; i++) {
          if (this[i] === value) return i;
        }
        return -1;
      }
      outer: for (let i = byteOffset; i <= this.length - value.length; i++) {
        for (let j = 0; j < value.length; j++) {
          if (this[i + j] !== value[j]) continue outer;
        }
        return i;
      }
      return -1;
    }

    includes(value, byteOffset, encoding) {
      return this.indexOf(value, byteOffset, encoding) !== -1;
    }

    // 读写方法
    readUInt8(offset = 0) { return this[offset]; }
    readUInt16BE(offset = 0) { return (this[offset] << 8) | this[offset + 1]; }
    readUInt16LE(offset = 0) { return this[offset] | (this[offset + 1] << 8); }
    readUInt32BE(offset = 0) {
      return (this[offset] * 0x1000000) + ((this[offset + 1] << 16) | (this[offset + 2] << 8) | this[offset + 3]);
    }
    readUInt32LE(offset = 0) {
      return ((this[offset + 3] * 0x1000000) + ((this[offset + 2] << 16) | (this[offset + 1] << 8) | this[offset])) >>> 0;
    }
    readInt8(offset = 0) { return this[offset] > 127 ? this[offset] - 256 : this[offset]; }
    readInt16BE(offset = 0) { const val = this.readUInt16BE(offset); return val > 0x7FFF ? val - 0x10000 : val; }
    readInt16LE(offset = 0) { const val = this.readUInt16LE(offset); return val > 0x7FFF ? val - 0x10000 : val; }
    readInt32BE(offset = 0) { return (this[offset] << 24) | (this[offset + 1] << 16) | (this[offset + 2] << 8) | this[offset + 3]; }
    readInt32LE(offset = 0) { return this[offset] | (this[offset + 1] << 8) | (this[offset + 2] << 16) | (this[offset + 3] << 24); }

    writeUInt8(value, offset = 0) { this[offset] = value & 0xFF; return offset + 1; }
    writeUInt16BE(value, offset = 0) { this[offset] = (value >> 8) & 0xFF; this[offset + 1] = value & 0xFF; return offset + 2; }
    writeUInt16LE(value, offset = 0) { this[offset] = value & 0xFF; this[offset + 1] = (value >> 8) & 0xFF; return offset + 2; }
    writeUInt32BE(value, offset = 0) {
      this[offset] = (value >>> 24) & 0xFF;
      this[offset + 1] = (value >>> 16) & 0xFF;
      this[offset + 2] = (value >>> 8) & 0xFF;
      this[offset + 3] = value & 0xFF;
      return offset + 4;
    }
    writeUInt32LE(value, offset = 0) {
      this[offset] = value & 0xFF;
      this[offset + 1] = (value >>> 8) & 0xFF;
      this[offset + 2] = (value >>> 16) & 0xFF;
      this[offset + 3] = (value >>> 24) & 0xFF;
      return offset + 4;
    }

    toJSON() {
      return { type: 'Buffer', data: Array.from(this) };
    }
  }

  return BufferPolyfill;
})();

globalThis.Buffer = Buffer;



// === Process Polyfill ===
const process = globalThis.process || {
  env: {},
  version: 'v18.0.0',
  versions: { node: '18.0.0' },
  platform: 'linux',
  arch: 'x64',
  pid: 1,
  ppid: 0,
  title: 'edge-runtime',
  argv: [],
  execArgv: [],
  execPath: '/usr/bin/node',
  cwd: () => '/',
  chdir: () => {},
  exit: () => {},
  kill: () => {},
  umask: () => 0o22,
  hrtime: (time) => {
    const now = performance.now();
    const sec = Math.floor(now / 1000);
    const nsec = Math.floor((now % 1000) * 1e6);
    if (time) {
      return [sec - time[0], nsec - time[1]];
    }
    return [sec, nsec];
  },
  nextTick: (callback, ...args) => {
    queueMicrotask(() => callback(...args));
  },
  emitWarning: (warning) => {
    console.warn(warning);
  },
  binding: () => ({}),
  _linkedBinding: () => ({}),
  on: () => process,
  off: () => process,
  once: () => process,
  emit: () => false,
  addListener: () => process,
  removeListener: () => process,
  removeAllListeners: () => process,
  listeners: () => [],
  listenerCount: () => 0,
  prependListener: () => process,
  prependOnceListener: () => process,
  eventNames: () => [],
  setMaxListeners: () => process,
  getMaxListeners: () => 10,
  stdout: { write: (s) => console.log(s) },
  stderr: { write: (s) => console.error(s) },
  stdin: { read: () => null },
  memoryUsage: () => ({
    rss: 0,
    heapTotal: 0,
    heapUsed: 0,
    external: 0,
    arrayBuffers: 0
  }),
  cpuUsage: () => ({ user: 0, system: 0 }),
  uptime: () => 0,
  getuid: () => 0,
  getgid: () => 0,
  geteuid: () => 0,
  getegid: () => 0,
  getgroups: () => [],
  setuid: () => {},
  setgid: () => {},
  seteuid: () => {},
  setegid: () => {},
  setgroups: () => {},
  features: {
    inspector: false,
    debug: false,
    uv: false,
    ipv6: true,
    tls_alpn: true,
    tls_sni: true,
    tls_ocsp: false,
    tls: true
  }
};

// 确保 process.env 可以被赋值
if (!globalThis.process) {
  globalThis.process = process;
}



// === AsyncLocalStorage Polyfill ===
const AsyncLocalStorage = (function() {
  // 使用 WeakMap 存储异步上下文
  const asyncContexts = new WeakMap();
  let currentContext = null;

  class AsyncLocalStoragePolyfill {
    constructor() {
      this._enabled = true;
      this._store = undefined;
    }

    disable() {
      this._enabled = false;
    }

    getStore() {
      if (!this._enabled) return undefined;
      return this._store;
    }

    run(store, callback, ...args) {
      if (!this._enabled) {
        return callback(...args);
      }
      const previousStore = this._store;
      this._store = store;
      try {
        return callback(...args);
      } finally {
        this._store = previousStore;
      }
    }

    exit(callback, ...args) {
      if (!this._enabled) {
        return callback(...args);
      }
      const previousStore = this._store;
      this._store = undefined;
      try {
        return callback(...args);
      } finally {
        this._store = previousStore;
      }
    }

    enterWith(store) {
      if (!this._enabled) return;
      this._store = store;
    }

    static bind(fn) {
      return fn;
    }

    static snapshot() {
      return (fn, ...args) => fn(...args);
    }
  }

  return AsyncLocalStoragePolyfill;
})();

// 模拟 node:async_hooks 模块
const async_hooks = {
  AsyncLocalStorage,
  createHook: () => ({
    enable: () => {},
    disable: () => {}
  }),
  executionAsyncId: () => 0,
  triggerAsyncId: () => 0,
  executionAsyncResource: () => ({}),
  AsyncResource: class AsyncResource {
    constructor(type) { this.type = type; }
    runInAsyncScope(fn, thisArg, ...args) { return fn.call(thisArg, ...args); }
    emitDestroy() { return this; }
    asyncId() { return 0; }
    triggerAsyncId() { return 0; }
    bind(fn) { return fn; }
    static bind(fn) { return fn; }
  }
};

globalThis.AsyncLocalStorage = AsyncLocalStorage;



// === Crypto Polyfill ===
const crypto = globalThis.crypto || {};

// 确保 getRandomValues 可用
if (!crypto.getRandomValues) {
  crypto.getRandomValues = (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
}

// 添加 randomBytes 方法（Node.js 风格）
crypto.randomBytes = (size) => {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes);
};

// 添加 randomUUID 方法
if (!crypto.randomUUID) {
  crypto.randomUUID = () => {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  };
}

// 添加 createHash 方法（简化版）
crypto.createHash = (algorithm) => {
  const data = [];
  return {
    update(chunk, encoding) {
      if (typeof chunk === 'string') {
        chunk = new TextEncoder().encode(chunk);
      }
      data.push(chunk);
      return this;
    },
    async digest(encoding) {
      const buffer = Buffer.concat(data);
      const hashBuffer = await crypto.subtle.digest(
        algorithm.toUpperCase().replace('SHA', 'SHA-'),
        buffer
      );
      const result = Buffer.from(hashBuffer);
      if (encoding === 'hex') {
        return result.toString('hex');
      } else if (encoding === 'base64') {
        return result.toString('base64');
      }
      return result;
    }
  };
};

// 添加 createHmac 方法（简化版）
crypto.createHmac = (algorithm, key) => {
  const data = [];
  return {
    update(chunk, encoding) {
      if (typeof chunk === 'string') {
        chunk = new TextEncoder().encode(chunk);
      }
      data.push(chunk);
      return this;
    },
    async digest(encoding) {
      const keyData = typeof key === 'string' ? new TextEncoder().encode(key) : key;
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: algorithm.toUpperCase().replace('SHA', 'SHA-') },
        false,
        ['sign']
      );
      const buffer = Buffer.concat(data);
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, buffer);
      const result = Buffer.from(signature);
      if (encoding === 'hex') {
        return result.toString('hex');
      } else if (encoding === 'base64') {
        return result.toString('base64');
      }
      return result;
    }
  };
};

// 时间安全比较
crypto.timingSafeEqual = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
};

globalThis.crypto = crypto;


// === Additional Globals ===
if (typeof globalThis.self === 'undefined') {
  globalThis.self = globalThis;
}

// === Node.js 路径相关全局变量 ===
// 边缘环境不支持 __dirname 和 __filename，提供模拟值
if (typeof __dirname === 'undefined') {
  globalThis.__dirname = '/';
}
if (typeof __filename === 'undefined') {
  globalThis.__filename = '/index.js';
}

// === module 和 exports 兼容 ===
// 某些 CommonJS 代码可能引用这些变量
if (typeof module === 'undefined') {
  globalThis.module = { exports: {} };
}
if (typeof exports === 'undefined') {
  globalThis.exports = globalThis.module.exports;
}

// 模拟 node:buffer 模块
const nodeBuffer = { Buffer };

// 模拟 node:async_hooks 模块导出
const nodeAsyncHooks = async_hooks;



// ============================================================
// Next.js Compatibility Layer
// ============================================================


// ============================================================
// Global Environment for Next.js Middleware
// ============================================================

// _ENTRIES 对象 - Next.js middleware 注册入口
// 必须同时定义在 globalThis 和 self 上，因为 webpack runtime 可能检查任一作用域
// 使用 var 声明以便 webpack runtime 可以在当前作用域找到它
var _ENTRIES = {};
globalThis._ENTRIES = _ENTRIES;
self._ENTRIES = _ENTRIES;

// 确保 _ENTRIES 在所有可能的作用域中都可访问
// webpack runtime 使用 typeof _ENTRIES 检查，这会检查当前作用域链
if (typeof window !== 'undefined') {
  window._ENTRIES = _ENTRIES;
}

// 设置 self 指向 globalThis
if (typeof self === 'undefined') {
  globalThis.self = globalThis;
}

// 设置 NEXT_PHASE 环境变量
process.env.NEXT_PHASE = process.env.NEXT_PHASE || '';

// 注意：__import_unsupported 由 Next.js middleware 代码自带定义，不需要在这里定义
// 否则会因为 configurable: false 导致重复定义报错

// 模拟 __BUILD_MANIFEST
globalThis.__BUILD_MANIFEST = undefined;

// 模拟 __incrementalCache
globalThis.__incrementalCache = null;

// 模拟 __serverComponentsHmrCache
globalThis.__serverComponentsHmrCache = null;

// 模拟 performance（如果不存在）
if (typeof performance === 'undefined') {
  globalThis.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    getEntriesByName: () => [],
    getEntriesByType: () => [],
    clearMarks: () => {},
    clearMeasures: () => {}
  };
}

// 模拟 queueMicrotask（如果不存在）
if (typeof queueMicrotask === 'undefined') {
  globalThis.queueMicrotask = (callback) => {
    Promise.resolve().then(callback);
  };
}

// 模拟 structuredClone（如果不存在）
if (typeof structuredClone === 'undefined') {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// 模拟 AbortController（如果不存在）
if (typeof AbortController === 'undefined') {
  globalThis.AbortController = class AbortController {
    constructor() {
      this.signal = { aborted: false, reason: undefined };
    }
    abort(reason) {
      this.signal.aborted = true;
      this.signal.reason = reason;
    }
  };
}

// 模拟 Event 和 EventTarget（如果不存在）
if (typeof EventTarget === 'undefined') {
  globalThis.EventTarget = class EventTarget {
    constructor() { this._listeners = {}; }
    addEventListener(type, listener) {
      (this._listeners[type] = this._listeners[type] || []).push(listener);
    }
    removeEventListener(type, listener) {
      if (this._listeners[type]) {
        this._listeners[type] = this._listeners[type].filter(l => l !== listener);
      }
    }
    dispatchEvent(event) {
      if (this._listeners[event.type]) {
        this._listeners[event.type].forEach(listener => listener(event));
      }
      return true;
    }
  };
}

if (typeof Event === 'undefined') {
  globalThis.Event = class Event {
    constructor(type, options = {}) {
      this.type = type;
      this.bubbles = options.bubbles || false;
      this.cancelable = options.cancelable || false;
    }
  };
}



// ============================================================
// Webpack Runtime Environment (简化版)
// ============================================================

// Webpack 模块缓存
const __webpack_module_cache__ = {};

// Webpack 模块定义
const __webpack_modules__ = {};

// Webpack require 函数
function __webpack_require__(moduleId) {
  // 检查缓存
  const cachedModule = __webpack_module_cache__[moduleId];
  if (cachedModule !== undefined) {
    return cachedModule.exports;
  }
  
  // 创建新模块并缓存
  const module = __webpack_module_cache__[moduleId] = {
    id: moduleId,
    loaded: false,
    exports: {}
  };
  
  // 执行模块函数
  __webpack_modules__[moduleId].call(
    module.exports,
    module,
    module.exports,
    __webpack_require__
  );
  
  // 标记为已加载
  module.loaded = true;
  
  return module.exports;
}

// 标记为 ES 模块
__webpack_require__.r = (exports) => {
  if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
  }
  Object.defineProperty(exports, '__esModule', { value: true });
};

// 定义 getter 导出
__webpack_require__.d = (exports, definition) => {
  for (const key in definition) {
    if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
      Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
    }
  }
};

// hasOwnProperty 简写
__webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

// 获取默认导出
__webpack_require__.n = (module) => {
  const getter = module && module.__esModule
    ? () => module['default']
    : () => module;
  __webpack_require__.d(getter, { a: getter });
  return getter;
};

// 全局对象
__webpack_require__.g = globalThis;

// 公共路径
__webpack_require__.p = '';

// 模块工厂引用
__webpack_require__.m = __webpack_modules__;

// 模块缓存引用
__webpack_require__.c = __webpack_module_cache__;

// 兼容 CommonJS
__webpack_require__.nmd = (module) => {
  module.paths = [];
  if (!module.children) module.children = [];
  return module;
};

// ============================================================
// Node.js 模块 Polyfill
// ============================================================

const nodeModules = {
  'node:buffer': { Buffer },
  'node:async_hooks': async_hooks,
  'node:crypto': crypto,
  'node:process': process,
  'node:url': { URL, URLSearchParams },
  'node:util': {
    promisify: (fn) => (...args) => new Promise((resolve, reject) => {
      fn(...args, (err, result) => err ? reject(err) : resolve(result));
    }),
    deprecate: (fn) => fn,
    inspect: (obj) => JSON.stringify(obj, null, 2),
    types: {
      isPromise: (val) => val instanceof Promise,
      isDate: (val) => val instanceof Date,
      isRegExp: (val) => val instanceof RegExp,
    }
  },
  'node:events': {
    EventEmitter: class EventEmitter {
      constructor() { this._events = {}; }
      on(event, listener) { (this._events[event] = this._events[event] || []).push(listener); return this; }
      off(event, listener) { 
        if (this._events[event]) {
          this._events[event] = this._events[event].filter(l => l !== listener);
        }
        return this;
      }
      emit(event, ...args) {
        if (this._events[event]) {
          this._events[event].forEach(listener => listener(...args));
          return true;
        }
        return false;
      }
      once(event, listener) {
        const onceListener = (...args) => {
          this.off(event, onceListener);
          listener(...args);
        };
        return this.on(event, onceListener);
      }
      removeAllListeners(event) {
        if (event) delete this._events[event];
        else this._events = {};
        return this;
      }
      listeners(event) { return this._events[event] || []; }
      listenerCount(event) { return (this._events[event] || []).length; }
    }
  },
  'node:path': {
    join: (...parts) => parts.join('/').replace(/\/+/g, '/'),
    resolve: (...parts) => parts.join('/').replace(/\/+/g, '/'),
    basename: (path, ext) => {
      const base = path.split('/').pop() || '';
      return ext && base.endsWith(ext) ? base.slice(0, -ext.length) : base;
    },
    dirname: (path) => path.split('/').slice(0, -1).join('/') || '/',
    extname: (path) => {
      const base = path.split('/').pop() || '';
      const idx = base.lastIndexOf('.');
      return idx > 0 ? base.slice(idx) : '';
    },
    parse: (path) => ({
      root: path.startsWith('/') ? '/' : '',
      dir: path.split('/').slice(0, -1).join('/'),
      base: path.split('/').pop() || '',
      ext: '',
      name: ''
    }),
    sep: '/',
    delimiter: ':'
  }
};

// ============================================================
// webpackChunk 加载器 (简化版 - 单 chunk 场景)
// ============================================================

// webpackChunk 回调处理函数
const webpackJsonpCallback = (data) => {
  const [chunkIds, moreModules, runtime] = data;
  
  console.log('[webpack] Processing chunk:', chunkIds);
  console.log('[webpack] Module IDs:', Object.keys(moreModules));
  
  // 注册模块
  for (const moduleId in moreModules) {
    if (__webpack_require__.o(moreModules, moduleId)) {
      __webpack_modules__[moduleId] = moreModules[moduleId];
    }
  }
  
  console.log('[webpack] Registered modules:', Object.keys(__webpack_modules__));
  
  // 执行 runtime（注册 _ENTRIES）
  if (runtime) {
    console.log('[webpack] Executing runtime...');
    try {
      runtime(__webpack_require__);
      console.log('[webpack] Runtime executed, _ENTRIES:', Object.keys(_ENTRIES));
      // 检查 entry 内容
      const entry = _ENTRIES['middleware_src/middleware'];
      if (entry) {
        console.log('[webpack] Entry type:', typeof entry);
        console.log('[webpack] Entry keys:', Object.keys(entry));
        console.log('[webpack] Entry.default type:', typeof entry.default);
      }
    } catch (e) {
      console.error('[webpack] Runtime error:', e);
    }
  }
};

// 初始化 webpackChunk 全局数组
// 注意：webpack bundle 会执行 (self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push(...)
// 这个赋值表达式会先检查是否存在，如果存在就使用现有的
// 关键：赋值表达式 (a=b||c) 返回的是赋值后的值，然后在这个值上调用 .push()
// 所以即使我们设置了带重写 push 的数组，赋值后返回的是同一个数组，push 仍然是重写的

// 如果已有数据，先保存
const existingChunks = self.webpackChunk_N_E || [];

// 创建一个特殊的数组，其 push 方法被重写
const chunkArray = [...existingChunks];  // 复制已有数据
const originalPush = Array.prototype.push;

// 重写 push 方法
chunkArray.push = function(...args) {
  console.log('[webpack] push called with', args.length, 'chunks');
  for (const data of args) {
    webpackJsonpCallback(data);
  }
  return originalPush.apply(this, args);
};

// 处理已存在的 chunks（如果有的话）
existingChunks.forEach(webpackJsonpCallback);

// 设置全局数组
// 使用 getter/setter 来确保即使被"赋值"也返回我们的数组
let _webpackChunk = chunkArray;
Object.defineProperty(self, 'webpackChunk_N_E', {
  get() {
    return _webpackChunk;
  },
  set(value) {
    // 忽略赋值，始终返回我们的数组
    // webpack bundle 的 (self.webpackChunk_N_E=self.webpackChunk_N_E||[]) 会触发这个 setter
    // 但我们不改变 _webpackChunk，所以后续的 .push() 仍然是我们重写的
    console.log('[webpack] Attempted to set webpackChunk_N_E, ignored');
    return _webpackChunk;
  },
  configurable: true
});





// ============================================================
// Original Next.js Middleware Code
// ============================================================

(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[550],{117:(a,b,c)=>{"use strict";let d;c.r(b),c.d(b,{default:()=>bh});var e={};async function f(){return"_ENTRIES"in globalThis&&_ENTRIES.middleware_instrumentation&&await _ENTRIES.middleware_instrumentation}c.r(e),c.d(e,{config:()=>bd,middleware:()=>bc});let g=null;async function h(){if("phase-production-build"===process.env.NEXT_PHASE)return;g||(g=f());let a=await g;if(null==a?void 0:a.register)try{await a.register()}catch(a){throw a.message=`An error occurred while loading instrumentation hook: ${a.message}`,a}}async function i(...a){let b=await f();try{var c;await (null==b||null==(c=b.onRequestError)?void 0:c.call(b,...a))}catch(a){console.error("Error in instrumentation.onRequestError:",a)}}let j=null;function k(){return j||(j=h()),j}function l(a){return`The edge runtime does not support Node.js '${a}' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime`}process!==c.g.process&&(process.env=c.g.process.env,c.g.process=process),Object.defineProperty(globalThis,"__import_unsupported",{value:function(a){let b=new Proxy(function(){},{get(b,c){if("then"===c)return{};throw Object.defineProperty(Error(l(a)),"__NEXT_ERROR_CODE",{value:"E394",enumerable:!1,configurable:!0})},construct(){throw Object.defineProperty(Error(l(a)),"__NEXT_ERROR_CODE",{value:"E394",enumerable:!1,configurable:!0})},apply(c,d,e){if("function"==typeof e[0])return e[0](b);throw Object.defineProperty(Error(l(a)),"__NEXT_ERROR_CODE",{value:"E394",enumerable:!1,configurable:!0})}});return new Proxy({},{get:()=>b})},enumerable:!1,configurable:!1}),k();class m extends Error{constructor({page:a}){super(`The middleware "${a}" accepts an async API directly with the form:
  
  export function middleware(request, event) {
    return NextResponse.redirect('/new-location')
  }
  
  Read more: https://nextjs.org/docs/messages/middleware-new-signature
  `)}}class n extends Error{constructor(){super(`The request.page has been deprecated in favour of \`URLPattern\`.
  Read more: https://nextjs.org/docs/messages/middleware-request-page
  `)}}class o extends Error{constructor(){super(`The request.ua has been removed in favour of \`userAgent\` function.
  Read more: https://nextjs.org/docs/messages/middleware-parse-user-agent
  `)}}let p="_N_T_",q={shared:"shared",reactServerComponents:"rsc",serverSideRendering:"ssr",actionBrowser:"action-browser",apiNode:"api-node",apiEdge:"api-edge",middleware:"middleware",instrument:"instrument",edgeAsset:"edge-asset",appPagesBrowser:"app-pages-browser",pagesDirBrowser:"pages-dir-browser",pagesDirEdge:"pages-dir-edge",pagesDirNode:"pages-dir-node"};function r(a){var b,c,d,e,f,g=[],h=0;function i(){for(;h<a.length&&/\s/.test(a.charAt(h));)h+=1;return h<a.length}for(;h<a.length;){for(b=h,f=!1;i();)if(","===(c=a.charAt(h))){for(d=h,h+=1,i(),e=h;h<a.length&&"="!==(c=a.charAt(h))&&";"!==c&&","!==c;)h+=1;h<a.length&&"="===a.charAt(h)?(f=!0,h=e,g.push(a.substring(b,d)),b=h):h=d+1}else h+=1;(!f||h>=a.length)&&g.push(a.substring(b,a.length))}return g}function s(a){let b={},c=[];if(a)for(let[d,e]of a.entries())"set-cookie"===d.toLowerCase()?(c.push(...r(e)),b[d]=1===c.length?c[0]:c):b[d]=e;return b}function t(a){try{return String(new URL(String(a)))}catch(b){throw Object.defineProperty(Error(`URL is malformed "${String(a)}". Please use only absolute URLs - https://nextjs.org/docs/messages/middleware-relative-urls`,{cause:b}),"__NEXT_ERROR_CODE",{value:"E61",enumerable:!1,configurable:!0})}}({...q,GROUP:{builtinReact:[q.reactServerComponents,q.actionBrowser],serverOnly:[q.reactServerComponents,q.actionBrowser,q.instrument,q.middleware],neutralTarget:[q.apiNode,q.apiEdge],clientOnly:[q.serverSideRendering,q.appPagesBrowser],bundled:[q.reactServerComponents,q.actionBrowser,q.serverSideRendering,q.appPagesBrowser,q.shared,q.instrument,q.middleware],appPages:[q.reactServerComponents,q.serverSideRendering,q.appPagesBrowser,q.actionBrowser]}});let u=Symbol("response"),v=Symbol("passThrough"),w=Symbol("waitUntil");class x{constructor(a,b){this[v]=!1,this[w]=b?{kind:"external",function:b}:{kind:"internal",promises:[]}}respondWith(a){this[u]||(this[u]=Promise.resolve(a))}passThroughOnException(){this[v]=!0}waitUntil(a){if("external"===this[w].kind)return(0,this[w].function)(a);this[w].promises.push(a)}}class y extends x{constructor(a){var b;super(a.request,null==(b=a.context)?void 0:b.waitUntil),this.sourcePage=a.page}get request(){throw Object.defineProperty(new m({page:this.sourcePage}),"__NEXT_ERROR_CODE",{value:"E394",enumerable:!1,configurable:!0})}respondWith(){throw Object.defineProperty(new m({page:this.sourcePage}),"__NEXT_ERROR_CODE",{value:"E394",enumerable:!1,configurable:!0})}}function z(a){return a.replace(/\/$/,"")||"/"}function A(a){let b=a.indexOf("#"),c=a.indexOf("?"),d=c>-1&&(b<0||c<b);return d||b>-1?{pathname:a.substring(0,d?c:b),query:d?a.substring(c,b>-1?b:void 0):"",hash:b>-1?a.slice(b):""}:{pathname:a,query:"",hash:""}}function B(a,b){if(!a.startsWith("/")||!b)return a;let{pathname:c,query:d,hash:e}=A(a);return""+b+c+d+e}function C(a,b){if(!a.startsWith("/")||!b)return a;let{pathname:c,query:d,hash:e}=A(a);return""+c+b+d+e}function D(a,b){if("string"!=typeof a)return!1;let{pathname:c}=A(a);return c===b||c.startsWith(b+"/")}let E=new WeakMap;function F(a,b){let c;if(!b)return{pathname:a};let d=E.get(b);d||(d=b.map(a=>a.toLowerCase()),E.set(b,d));let e=a.split("/",2);if(!e[1])return{pathname:a};let f=e[1].toLowerCase(),g=d.indexOf(f);return g<0?{pathname:a}:(c=b[g],{pathname:a=a.slice(c.length+1)||"/",detectedLocale:c})}let G=/(?!^https?:\/\/)(127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}|\[::1\]|localhost)/;function H(a,b){return new URL(String(a).replace(G,"localhost"),b&&String(b).replace(G,"localhost"))}let I=Symbol("NextURLInternal");class J{constructor(a,b,c){let d,e;"object"==typeof b&&"pathname"in b||"string"==typeof b?(d=b,e=c||{}):e=c||b||{},this[I]={url:H(a,d??e.base),options:e,basePath:""},this.analyze()}analyze(){var a,b,c,d,e;let f=function(a,b){var c,d;let{basePath:e,i18n:f,trailingSlash:g}=null!=(c=b.nextConfig)?c:{},h={pathname:a,trailingSlash:"/"!==a?a.endsWith("/"):g};e&&D(h.pathname,e)&&(h.pathname=function(a,b){if(!D(a,b))return a;let c=a.slice(b.length);return c.startsWith("/")?c:"/"+c}(h.pathname,e),h.basePath=e);let i=h.pathname;if(h.pathname.startsWith("/_next/data/")&&h.pathname.endsWith(".json")){let a=h.pathname.replace(/^\/_next\/data\//,"").replace(/\.json$/,"").split("/");h.buildId=a[0],i="index"!==a[1]?"/"+a.slice(1).join("/"):"/",!0===b.parseData&&(h.pathname=i)}if(f){let a=b.i18nProvider?b.i18nProvider.analyze(h.pathname):F(h.pathname,f.locales);h.locale=a.detectedLocale,h.pathname=null!=(d=a.pathname)?d:h.pathname,!a.detectedLocale&&h.buildId&&(a=b.i18nProvider?b.i18nProvider.analyze(i):F(i,f.locales)).detectedLocale&&(h.locale=a.detectedLocale)}return h}(this[I].url.pathname,{nextConfig:this[I].options.nextConfig,parseData:!0,i18nProvider:this[I].options.i18nProvider}),g=function(a,b){let c;if((null==b?void 0:b.host)&&!Array.isArray(b.host))c=b.host.toString().split(":",1)[0];else{if(!a.hostname)return;c=a.hostname}return c.toLowerCase()}(this[I].url,this[I].options.headers);this[I].domainLocale=this[I].options.i18nProvider?this[I].options.i18nProvider.detectDomainLocale(g):function(a,b,c){if(a)for(let f of(c&&(c=c.toLowerCase()),a)){var d,e;if(b===(null==(d=f.domain)?void 0:d.split(":",1)[0].toLowerCase())||c===f.defaultLocale.toLowerCase()||(null==(e=f.locales)?void 0:e.some(a=>a.toLowerCase()===c)))return f}}(null==(b=this[I].options.nextConfig)||null==(a=b.i18n)?void 0:a.domains,g);let h=(null==(c=this[I].domainLocale)?void 0:c.defaultLocale)||(null==(e=this[I].options.nextConfig)||null==(d=e.i18n)?void 0:d.defaultLocale);this[I].url.pathname=f.pathname,this[I].defaultLocale=h,this[I].basePath=f.basePath??"",this[I].buildId=f.buildId,this[I].locale=f.locale??h,this[I].trailingSlash=f.trailingSlash}formatPathname(){var a;let b;return b=function(a,b,c,d){if(!b||b===c)return a;let e=a.toLowerCase();return!d&&(D(e,"/api")||D(e,"/"+b.toLowerCase()))?a:B(a,"/"+b)}((a={basePath:this[I].basePath,buildId:this[I].buildId,defaultLocale:this[I].options.forceLocale?void 0:this[I].defaultLocale,locale:this[I].locale,pathname:this[I].url.pathname,trailingSlash:this[I].trailingSlash}).pathname,a.locale,a.buildId?void 0:a.defaultLocale,a.ignorePrefix),(a.buildId||!a.trailingSlash)&&(b=z(b)),a.buildId&&(b=C(B(b,"/_next/data/"+a.buildId),"/"===a.pathname?"index.json":".json")),b=B(b,a.basePath),!a.buildId&&a.trailingSlash?b.endsWith("/")?b:C(b,"/"):z(b)}formatSearch(){return this[I].url.search}get buildId(){return this[I].buildId}set buildId(a){this[I].buildId=a}get locale(){return this[I].locale??""}set locale(a){var b,c;if(!this[I].locale||!(null==(c=this[I].options.nextConfig)||null==(b=c.i18n)?void 0:b.locales.includes(a)))throw Object.defineProperty(TypeError(`The NextURL configuration includes no locale "${a}"`),"__NEXT_ERROR_CODE",{value:"E597",enumerable:!1,configurable:!0});this[I].locale=a}get defaultLocale(){return this[I].defaultLocale}get domainLocale(){return this[I].domainLocale}get searchParams(){return this[I].url.searchParams}get host(){return this[I].url.host}set host(a){this[I].url.host=a}get hostname(){return this[I].url.hostname}set hostname(a){this[I].url.hostname=a}get port(){return this[I].url.port}set port(a){this[I].url.port=a}get protocol(){return this[I].url.protocol}set protocol(a){this[I].url.protocol=a}get href(){let a=this.formatPathname(),b=this.formatSearch();return`${this.protocol}//${this.host}${a}${b}${this.hash}`}set href(a){this[I].url=H(a),this.analyze()}get origin(){return this[I].url.origin}get pathname(){return this[I].url.pathname}set pathname(a){this[I].url.pathname=a}get hash(){return this[I].url.hash}set hash(a){this[I].url.hash=a}get search(){return this[I].url.search}set search(a){this[I].url.search=a}get password(){return this[I].url.password}set password(a){this[I].url.password=a}get username(){return this[I].url.username}set username(a){this[I].url.username=a}get basePath(){return this[I].basePath}set basePath(a){this[I].basePath=a.startsWith("/")?a:`/${a}`}toString(){return this.href}toJSON(){return this.href}[Symbol.for("edge-runtime.inspect.custom")](){return{href:this.href,origin:this.origin,protocol:this.protocol,username:this.username,password:this.password,host:this.host,hostname:this.hostname,port:this.port,pathname:this.pathname,search:this.search,searchParams:this.searchParams,hash:this.hash}}clone(){return new J(String(this),this[I].options)}}var K=c(724);let L=Symbol("internal request");class M extends Request{constructor(a,b={}){let c="string"!=typeof a&&"url"in a?a.url:String(a);t(c),a instanceof Request?super(a,b):super(c,b);let d=new J(c,{headers:s(this.headers),nextConfig:b.nextConfig});this[L]={cookies:new K.RequestCookies(this.headers),nextUrl:d,url:d.toString()}}[Symbol.for("edge-runtime.inspect.custom")](){return{cookies:this.cookies,nextUrl:this.nextUrl,url:this.url,bodyUsed:this.bodyUsed,cache:this.cache,credentials:this.credentials,destination:this.destination,headers:Object.fromEntries(this.headers),integrity:this.integrity,keepalive:this.keepalive,method:this.method,mode:this.mode,redirect:this.redirect,referrer:this.referrer,referrerPolicy:this.referrerPolicy,signal:this.signal}}get cookies(){return this[L].cookies}get nextUrl(){return this[L].nextUrl}get page(){throw new n}get ua(){throw new o}get url(){return this[L].url}}class N{static get(a,b,c){let d=Reflect.get(a,b,c);return"function"==typeof d?d.bind(a):d}static set(a,b,c,d){return Reflect.set(a,b,c,d)}static has(a,b){return Reflect.has(a,b)}static deleteProperty(a,b){return Reflect.deleteProperty(a,b)}}let O=Symbol("internal response"),P=new Set([301,302,303,307,308]);function Q(a,b){var c;if(null==a||null==(c=a.request)?void 0:c.headers){if(!(a.request.headers instanceof Headers))throw Object.defineProperty(Error("request.headers must be an instance of Headers"),"__NEXT_ERROR_CODE",{value:"E119",enumerable:!1,configurable:!0});let c=[];for(let[d,e]of a.request.headers)b.set("x-middleware-request-"+d,e),c.push(d);b.set("x-middleware-override-headers",c.join(","))}}class R extends Response{constructor(a,b={}){super(a,b);let c=this.headers,d=new Proxy(new K.ResponseCookies(c),{get(a,d,e){switch(d){case"delete":case"set":return(...e)=>{let f=Reflect.apply(a[d],a,e),g=new Headers(c);return f instanceof K.ResponseCookies&&c.set("x-middleware-set-cookie",f.getAll().map(a=>(0,K.stringifyCookie)(a)).join(",")),Q(b,g),f};default:return N.get(a,d,e)}}});this[O]={cookies:d,url:b.url?new J(b.url,{headers:s(c),nextConfig:b.nextConfig}):void 0}}[Symbol.for("edge-runtime.inspect.custom")](){return{cookies:this.cookies,url:this.url,body:this.body,bodyUsed:this.bodyUsed,headers:Object.fromEntries(this.headers),ok:this.ok,redirected:this.redirected,status:this.status,statusText:this.statusText,type:this.type}}get cookies(){return this[O].cookies}static json(a,b){let c=Response.json(a,b);return new R(c.body,c)}static redirect(a,b){let c="number"==typeof b?b:(null==b?void 0:b.status)??307;if(!P.has(c))throw Object.defineProperty(RangeError('Failed to execute "redirect" on "response": Invalid status code'),"__NEXT_ERROR_CODE",{value:"E529",enumerable:!1,configurable:!0});let d="object"==typeof b?b:{},e=new Headers(null==d?void 0:d.headers);return e.set("Location",t(a)),new R(null,{...d,headers:e,status:c})}static rewrite(a,b){let c=new Headers(null==b?void 0:b.headers);return c.set("x-middleware-rewrite",t(a)),Q(b,c),new R(null,{...b,headers:c})}static next(a){let b=new Headers(null==a?void 0:a.headers);return b.set("x-middleware-next","1"),Q(a,b),new R(null,{...a,headers:b})}}function S(a,b){let c="string"==typeof b?new URL(b):b,d=new URL(a,b),e=d.origin===c.origin;return{url:e?d.toString().slice(c.origin.length):d.toString(),isRelative:e}}let T="Next-Router-Prefetch",U=["RSC","Next-Router-State-Tree",T,"Next-HMR-Refresh","Next-Router-Segment-Prefetch"];class V extends Error{constructor(){super("Headers cannot be modified. Read more: https://nextjs.org/docs/app/api-reference/functions/headers")}static callable(){throw new V}}class W extends Headers{constructor(a){super(),this.headers=new Proxy(a,{get(b,c,d){if("symbol"==typeof c)return N.get(b,c,d);let e=c.toLowerCase(),f=Object.keys(a).find(a=>a.toLowerCase()===e);if(void 0!==f)return N.get(b,f,d)},set(b,c,d,e){if("symbol"==typeof c)return N.set(b,c,d,e);let f=c.toLowerCase(),g=Object.keys(a).find(a=>a.toLowerCase()===f);return N.set(b,g??c,d,e)},has(b,c){if("symbol"==typeof c)return N.has(b,c);let d=c.toLowerCase(),e=Object.keys(a).find(a=>a.toLowerCase()===d);return void 0!==e&&N.has(b,e)},deleteProperty(b,c){if("symbol"==typeof c)return N.deleteProperty(b,c);let d=c.toLowerCase(),e=Object.keys(a).find(a=>a.toLowerCase()===d);return void 0===e||N.deleteProperty(b,e)}})}static seal(a){return new Proxy(a,{get(a,b,c){switch(b){case"append":case"delete":case"set":return V.callable;default:return N.get(a,b,c)}}})}merge(a){return Array.isArray(a)?a.join(", "):a}static from(a){return a instanceof Headers?a:new W(a)}append(a,b){let c=this.headers[a];"string"==typeof c?this.headers[a]=[c,b]:Array.isArray(c)?c.push(b):this.headers[a]=b}delete(a){delete this.headers[a]}get(a){let b=this.headers[a];return void 0!==b?this.merge(b):null}has(a){return void 0!==this.headers[a]}set(a,b){this.headers[a]=b}forEach(a,b){for(let[c,d]of this.entries())a.call(b,d,c,this)}*entries(){for(let a of Object.keys(this.headers)){let b=a.toLowerCase(),c=this.get(b);yield[b,c]}}*keys(){for(let a of Object.keys(this.headers)){let b=a.toLowerCase();yield b}}*values(){for(let a of Object.keys(this.headers)){let b=this.get(a);yield b}}[Symbol.iterator](){return this.entries()}}let X=Object.defineProperty(Error("Invariant: AsyncLocalStorage accessed in runtime where it is not available"),"__NEXT_ERROR_CODE",{value:"E504",enumerable:!1,configurable:!0});class Y{disable(){throw X}getStore(){}run(){throw X}exit(){throw X}enterWith(){throw X}static bind(a){return a}}let Z="undefined"!=typeof globalThis&&globalThis.AsyncLocalStorage;function $(){return Z?new Z:new Y}let _=$(),aa=$();class ab extends Error{constructor(){super("Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#options")}static callable(){throw new ab}}class ac{static seal(a){return new Proxy(a,{get(a,b,c){switch(b){case"clear":case"delete":case"set":return ab.callable;default:return N.get(a,b,c)}}})}}let ad=Symbol.for("next.mutated.cookies");class ae{static wrap(a,b){let c=new K.ResponseCookies(new Headers);for(let b of a.getAll())c.set(b);let d=[],e=new Set,f=()=>{let a=_.getStore();if(a&&(a.pathWasRevalidated=!0),d=c.getAll().filter(a=>e.has(a.name)),b){let a=[];for(let b of d){let c=new K.ResponseCookies(new Headers);c.set(b),a.push(c.toString())}b(a)}},g=new Proxy(c,{get(a,b,c){switch(b){case ad:return d;case"delete":return function(...b){e.add("string"==typeof b[0]?b[0]:b[0].name);try{return a.delete(...b),g}finally{f()}};case"set":return function(...b){e.add("string"==typeof b[0]?b[0]:b[0].name);try{return a.set(...b),g}finally{f()}};default:return N.get(a,b,c)}}});return g}}function af(a){if("action"!==function(a){let b=aa.getStore();switch(!b&&function(a){throw Object.defineProperty(Error(`\`${a}\` was called outside a request scope. Read more: https://nextjs.org/docs/messages/next-dynamic-api-wrong-context`),"__NEXT_ERROR_CODE",{value:"E251",enumerable:!1,configurable:!0})}(a),b.type){case"request":default:return b;case"prerender":case"prerender-client":case"prerender-ppr":case"prerender-legacy":throw Object.defineProperty(Error(`\`${a}\` cannot be called inside a prerender. This is a bug in Next.js.`),"__NEXT_ERROR_CODE",{value:"E401",enumerable:!1,configurable:!0});case"cache":throw Object.defineProperty(Error(`\`${a}\` cannot be called inside "use cache". Call it outside and pass an argument instead. Read more: https://nextjs.org/docs/messages/next-request-in-use-cache`),"__NEXT_ERROR_CODE",{value:"E37",enumerable:!1,configurable:!0});case"unstable-cache":throw Object.defineProperty(Error(`\`${a}\` cannot be called inside unstable_cache. Call it outside and pass an argument instead. Read more: https://nextjs.org/docs/app/api-reference/functions/unstable_cache`),"__NEXT_ERROR_CODE",{value:"E69",enumerable:!1,configurable:!0})}}(a).phase)throw new ab}var ag=function(a){return a.handleRequest="BaseServer.handleRequest",a.run="BaseServer.run",a.pipe="BaseServer.pipe",a.getStaticHTML="BaseServer.getStaticHTML",a.render="BaseServer.render",a.renderToResponseWithComponents="BaseServer.renderToResponseWithComponents",a.renderToResponse="BaseServer.renderToResponse",a.renderToHTML="BaseServer.renderToHTML",a.renderError="BaseServer.renderError",a.renderErrorToResponse="BaseServer.renderErrorToResponse",a.renderErrorToHTML="BaseServer.renderErrorToHTML",a.render404="BaseServer.render404",a}(ag||{}),ah=function(a){return a.loadDefaultErrorComponents="LoadComponents.loadDefaultErrorComponents",a.loadComponents="LoadComponents.loadComponents",a}(ah||{}),ai=function(a){return a.getRequestHandler="NextServer.getRequestHandler",a.getServer="NextServer.getServer",a.getServerRequestHandler="NextServer.getServerRequestHandler",a.createServer="createServer.createServer",a}(ai||{}),aj=function(a){return a.compression="NextNodeServer.compression",a.getBuildId="NextNodeServer.getBuildId",a.createComponentTree="NextNodeServer.createComponentTree",a.clientComponentLoading="NextNodeServer.clientComponentLoading",a.getLayoutOrPageModule="NextNodeServer.getLayoutOrPageModule",a.generateStaticRoutes="NextNodeServer.generateStaticRoutes",a.generateFsStaticRoutes="NextNodeServer.generateFsStaticRoutes",a.generatePublicRoutes="NextNodeServer.generatePublicRoutes",a.generateImageRoutes="NextNodeServer.generateImageRoutes.route",a.sendRenderResult="NextNodeServer.sendRenderResult",a.proxyRequest="NextNodeServer.proxyRequest",a.runApi="NextNodeServer.runApi",a.render="NextNodeServer.render",a.renderHTML="NextNodeServer.renderHTML",a.imageOptimizer="NextNodeServer.imageOptimizer",a.getPagePath="NextNodeServer.getPagePath",a.getRoutesManifest="NextNodeServer.getRoutesManifest",a.findPageComponents="NextNodeServer.findPageComponents",a.getFontManifest="NextNodeServer.getFontManifest",a.getServerComponentManifest="NextNodeServer.getServerComponentManifest",a.getRequestHandler="NextNodeServer.getRequestHandler",a.renderToHTML="NextNodeServer.renderToHTML",a.renderError="NextNodeServer.renderError",a.renderErrorToHTML="NextNodeServer.renderErrorToHTML",a.render404="NextNodeServer.render404",a.startResponse="NextNodeServer.startResponse",a.route="route",a.onProxyReq="onProxyReq",a.apiResolver="apiResolver",a.internalFetch="internalFetch",a}(aj||{}),ak=function(a){return a.startServer="startServer.startServer",a}(ak||{}),al=function(a){return a.getServerSideProps="Render.getServerSideProps",a.getStaticProps="Render.getStaticProps",a.renderToString="Render.renderToString",a.renderDocument="Render.renderDocument",a.createBodyResult="Render.createBodyResult",a}(al||{}),am=function(a){return a.renderToString="AppRender.renderToString",a.renderToReadableStream="AppRender.renderToReadableStream",a.getBodyResult="AppRender.getBodyResult",a.fetch="AppRender.fetch",a}(am||{}),an=function(a){return a.executeRoute="Router.executeRoute",a}(an||{}),ao=function(a){return a.runHandler="Node.runHandler",a}(ao||{}),ap=function(a){return a.runHandler="AppRouteRouteHandlers.runHandler",a}(ap||{}),aq=function(a){return a.generateMetadata="ResolveMetadata.generateMetadata",a.generateViewport="ResolveMetadata.generateViewport",a}(aq||{}),ar=function(a){return a.execute="Middleware.execute",a}(ar||{});let as=["Middleware.execute","BaseServer.handleRequest","Render.getServerSideProps","Render.getStaticProps","AppRender.fetch","AppRender.getBodyResult","Render.renderDocument","Node.runHandler","AppRouteRouteHandlers.runHandler","ResolveMetadata.generateMetadata","ResolveMetadata.generateViewport","NextNodeServer.createComponentTree","NextNodeServer.findPageComponents","NextNodeServer.getLayoutOrPageModule","NextNodeServer.startResponse","NextNodeServer.clientComponentLoading"],at=["NextNodeServer.findPageComponents","NextNodeServer.createComponentTree","NextNodeServer.clientComponentLoading"];function au(a){return null!==a&&"object"==typeof a&&"then"in a&&"function"==typeof a.then}let{context:av,propagation:aw,trace:ax,SpanStatusCode:ay,SpanKind:az,ROOT_CONTEXT:aA}=d=c(717);class aB extends Error{constructor(a,b){super(),this.bubble=a,this.result=b}}let aC=(a,b)=>{(function(a){return"object"==typeof a&&null!==a&&a instanceof aB})(b)&&b.bubble?a.setAttribute("next.bubble",!0):(b&&a.recordException(b),a.setStatus({code:ay.ERROR,message:null==b?void 0:b.message})),a.end()},aD=new Map,aE=d.createContextKey("next.rootSpanId"),aF=0,aG={set(a,b,c){a.push({key:b,value:c})}};class aH{getTracerInstance(){return ax.getTracer("next.js","0.0.1")}getContext(){return av}getTracePropagationData(){let a=av.active(),b=[];return aw.inject(a,b,aG),b}getActiveScopeSpan(){return ax.getSpan(null==av?void 0:av.active())}withPropagatedContext(a,b,c){let d=av.active();if(ax.getSpanContext(d))return b();let e=aw.extract(d,a,c);return av.with(e,b)}trace(...a){var b;let[c,d,e]=a,{fn:f,options:g}="function"==typeof d?{fn:d,options:{}}:{fn:e,options:{...d}},h=g.spanName??c;if(!as.includes(c)&&"1"!==process.env.NEXT_OTEL_VERBOSE||g.hideSpan)return f();let i=this.getSpanContext((null==g?void 0:g.parentSpan)??this.getActiveScopeSpan()),j=!1;i?(null==(b=ax.getSpanContext(i))?void 0:b.isRemote)&&(j=!0):(i=(null==av?void 0:av.active())??aA,j=!0);let k=aF++;return g.attributes={"next.span_name":h,"next.span_type":c,...g.attributes},av.with(i.setValue(aE,k),()=>this.getTracerInstance().startActiveSpan(h,g,a=>{let b="performance"in globalThis&&"measure"in performance?globalThis.performance.now():void 0,d=()=>{aD.delete(k),b&&process.env.NEXT_OTEL_PERFORMANCE_PREFIX&&at.includes(c||"")&&performance.measure(`${process.env.NEXT_OTEL_PERFORMANCE_PREFIX}:next-${(c.split(".").pop()||"").replace(/[A-Z]/g,a=>"-"+a.toLowerCase())}`,{start:b,end:performance.now()})};j&&aD.set(k,new Map(Object.entries(g.attributes??{})));try{if(f.length>1)return f(a,b=>aC(a,b));let b=f(a);if(au(b))return b.then(b=>(a.end(),b)).catch(b=>{throw aC(a,b),b}).finally(d);return a.end(),d(),b}catch(b){throw aC(a,b),d(),b}}))}wrap(...a){let b=this,[c,d,e]=3===a.length?a:[a[0],{},a[1]];return as.includes(c)||"1"===process.env.NEXT_OTEL_VERBOSE?function(){let a=d;"function"==typeof a&&"function"==typeof e&&(a=a.apply(this,arguments));let f=arguments.length-1,g=arguments[f];if("function"!=typeof g)return b.trace(c,a,()=>e.apply(this,arguments));{let d=b.getContext().bind(av.active(),g);return b.trace(c,a,(a,b)=>(arguments[f]=function(a){return null==b||b(a),d.apply(this,arguments)},e.apply(this,arguments)))}}:e}startSpan(...a){let[b,c]=a,d=this.getSpanContext((null==c?void 0:c.parentSpan)??this.getActiveScopeSpan());return this.getTracerInstance().startSpan(b,c,d)}getSpanContext(a){return a?ax.setSpan(av.active(),a):void 0}getRootSpanAttributes(){let a=av.active().getValue(aE);return aD.get(a)}setRootSpanAttribute(a,b){let c=av.active().getValue(aE),d=aD.get(c);d&&d.set(a,b)}}let aI=(()=>{let a=new aH;return()=>a})(),aJ="__prerender_bypass";Symbol("__next_preview_data"),Symbol(aJ);class aK{constructor(a,b,c,d){var e;let f=a&&function(a,b){let c=W.from(a.headers);return{isOnDemandRevalidate:c.get("x-prerender-revalidate")===b.previewModeId,revalidateOnlyGenerated:c.has("x-prerender-revalidate-if-generated")}}(b,a).isOnDemandRevalidate,g=null==(e=c.get(aJ))?void 0:e.value;this._isEnabled=!!(!f&&g&&a&&g===a.previewModeId),this._previewModeId=null==a?void 0:a.previewModeId,this._mutableCookies=d}get isEnabled(){return this._isEnabled}enable(){if(!this._previewModeId)throw Object.defineProperty(Error("Invariant: previewProps missing previewModeId this should never happen"),"__NEXT_ERROR_CODE",{value:"E93",enumerable:!1,configurable:!0});this._mutableCookies.set({name:aJ,value:this._previewModeId,httpOnly:!0,sameSite:"none",secure:!0,path:"/"}),this._isEnabled=!0}disable(){this._mutableCookies.set({name:aJ,value:"",httpOnly:!0,sameSite:"none",secure:!0,path:"/",expires:new Date(0)}),this._isEnabled=!1}}function aL(a,b){if("x-middleware-set-cookie"in a.headers&&"string"==typeof a.headers["x-middleware-set-cookie"]){let c=a.headers["x-middleware-set-cookie"],d=new Headers;for(let a of r(c))d.append("set-cookie",a);for(let a of new K.ResponseCookies(d).getAll())b.set(a)}}var aM=c(802),aN=c.n(aM);class aO extends Error{constructor(a,b){super("Invariant: "+(a.endsWith(".")?a:a+".")+" This is a bug in Next.js.",b),this.name="InvariantError"}}class aP{constructor(a,b){this.cache=new Map,this.sizes=new Map,this.totalSize=0,this.maxSize=a,this.calculateSize=b||(()=>1)}set(a,b){if(!a||!b)return;let c=this.calculateSize(b);if(c>this.maxSize)return void console.warn("Single item size exceeds maxSize");this.cache.has(a)&&(this.totalSize-=this.sizes.get(a)||0),this.cache.set(a,b),this.sizes.set(a,c),this.totalSize+=c,this.touch(a)}has(a){return!!a&&(this.touch(a),!!this.cache.get(a))}get(a){if(!a)return;let b=this.cache.get(a);if(void 0!==b)return this.touch(a),b}touch(a){let b=this.cache.get(a);void 0!==b&&(this.cache.delete(a),this.cache.set(a,b),this.evictIfNecessary())}evictIfNecessary(){for(;this.totalSize>this.maxSize&&this.cache.size>0;)this.evictLeastRecentlyUsed()}evictLeastRecentlyUsed(){let a=this.cache.keys().next().value;if(void 0!==a){let b=this.sizes.get(a)||0;this.totalSize-=b,this.cache.delete(a),this.sizes.delete(a)}}reset(){this.cache.clear(),this.sizes.clear(),this.totalSize=0}keys(){return[...this.cache.keys()]}remove(a){this.cache.has(a)&&(this.totalSize-=this.sizes.get(a)||0,this.cache.delete(a),this.sizes.delete(a))}clear(){this.cache.clear(),this.sizes.clear(),this.totalSize=0}get size(){return this.cache.size}get currentSize(){return this.totalSize}}c(356).Buffer,new aP(0x3200000,a=>a.size),process.env.NEXT_PRIVATE_DEBUG_CACHE&&console.debug.bind(console,"DefaultCacheHandler:"),process.env.NEXT_PRIVATE_DEBUG_CACHE&&((a,...b)=>{console.log(`use-cache: ${a}`,...b)}),Symbol.for("@next/cache-handlers");let aQ=Symbol.for("@next/cache-handlers-map"),aR=Symbol.for("@next/cache-handlers-set"),aS=globalThis;function aT(){if(aS[aQ])return aS[aQ].entries()}async function aU(a,b){if(!a)return b();let c=aV(a);try{return await b()}finally{let b=function(a,b){let c=new Set(a.pendingRevalidatedTags),d=new Set(a.pendingRevalidateWrites);return{pendingRevalidatedTags:b.pendingRevalidatedTags.filter(a=>!c.has(a)),pendingRevalidates:Object.fromEntries(Object.entries(b.pendingRevalidates).filter(([b])=>!(b in a.pendingRevalidates))),pendingRevalidateWrites:b.pendingRevalidateWrites.filter(a=>!d.has(a))}}(c,aV(a));await aX(a,b)}}function aV(a){return{pendingRevalidatedTags:a.pendingRevalidatedTags?[...a.pendingRevalidatedTags]:[],pendingRevalidates:{...a.pendingRevalidates},pendingRevalidateWrites:a.pendingRevalidateWrites?[...a.pendingRevalidateWrites]:[]}}async function aW(a,b){if(0===a.length)return;let c=[];b&&c.push(b.revalidateTag(a));let d=function(){if(aS[aR])return aS[aR].values()}();if(d)for(let b of d)c.push(b.expireTags(...a));await Promise.all(c)}async function aX(a,b){let c=(null==b?void 0:b.pendingRevalidatedTags)??a.pendingRevalidatedTags??[],d=(null==b?void 0:b.pendingRevalidates)??a.pendingRevalidates??{},e=(null==b?void 0:b.pendingRevalidateWrites)??a.pendingRevalidateWrites??[];return Promise.all([aW(c,a.incrementalCache),...Object.values(d),...e])}let aY=Object.defineProperty(Error("Invariant: AsyncLocalStorage accessed in runtime where it is not available"),"__NEXT_ERROR_CODE",{value:"E504",enumerable:!1,configurable:!0});class aZ{disable(){throw aY}getStore(){}run(){throw aY}exit(){throw aY}enterWith(){throw aY}static bind(a){return a}}let a$="undefined"!=typeof globalThis&&globalThis.AsyncLocalStorage,a_=a$?new a$:new aZ;class a0{constructor({waitUntil:a,onClose:b,onTaskError:c}){this.workUnitStores=new Set,this.waitUntil=a,this.onClose=b,this.onTaskError=c,this.callbackQueue=new(aN()),this.callbackQueue.pause()}after(a){if(au(a))this.waitUntil||a1(),this.waitUntil(a.catch(a=>this.reportTaskError("promise",a)));else if("function"==typeof a)this.addCallback(a);else throw Object.defineProperty(Error("`after()`: Argument must be a promise or a function"),"__NEXT_ERROR_CODE",{value:"E50",enumerable:!1,configurable:!0})}addCallback(a){var b;this.waitUntil||a1();let c=aa.getStore();c&&this.workUnitStores.add(c);let d=a_.getStore(),e=d?d.rootTaskSpawnPhase:null==c?void 0:c.phase;this.runCallbacksOnClosePromise||(this.runCallbacksOnClosePromise=this.runCallbacksOnClose(),this.waitUntil(this.runCallbacksOnClosePromise));let f=(b=async()=>{try{await a_.run({rootTaskSpawnPhase:e},()=>a())}catch(a){this.reportTaskError("function",a)}},a$?a$.bind(b):aZ.bind(b));this.callbackQueue.add(f)}async runCallbacksOnClose(){return await new Promise(a=>this.onClose(a)),this.runCallbacks()}async runCallbacks(){if(0===this.callbackQueue.size)return;for(let a of this.workUnitStores)a.phase="after";let a=_.getStore();if(!a)throw Object.defineProperty(new aO("Missing workStore in AfterContext.runCallbacks"),"__NEXT_ERROR_CODE",{value:"E547",enumerable:!1,configurable:!0});return aU(a,()=>(this.callbackQueue.start(),this.callbackQueue.onIdle()))}reportTaskError(a,b){if(console.error("promise"===a?"A promise passed to `after()` rejected:":"An error occurred in a function passed to `after()`:",b),this.onTaskError)try{null==this.onTaskError||this.onTaskError.call(this,b)}catch(a){console.error(Object.defineProperty(new aO("`onTaskError` threw while handling an error thrown from an `after` task",{cause:a}),"__NEXT_ERROR_CODE",{value:"E569",enumerable:!1,configurable:!0}))}}}function a1(){throw Object.defineProperty(Error("`after()` will not work correctly, because `waitUntil` is not available in the current environment."),"__NEXT_ERROR_CODE",{value:"E91",enumerable:!1,configurable:!0})}function a2(a){let b,c={then:(d,e)=>(b||(b=a()),b.then(a=>{c.value=a}).catch(()=>{}),b.then(d,e))};return c}class a3{onClose(a){if(this.isClosed)throw Object.defineProperty(Error("Cannot subscribe to a closed CloseController"),"__NEXT_ERROR_CODE",{value:"E365",enumerable:!1,configurable:!0});this.target.addEventListener("close",a),this.listeners++}dispatchClose(){if(this.isClosed)throw Object.defineProperty(Error("Cannot close a CloseController multiple times"),"__NEXT_ERROR_CODE",{value:"E229",enumerable:!1,configurable:!0});this.listeners>0&&this.target.dispatchEvent(new Event("close")),this.isClosed=!0}constructor(){this.target=new EventTarget,this.listeners=0,this.isClosed=!1}}function a4(){return{previewModeId:process.env.__NEXT_PREVIEW_MODE_ID||"",previewModeSigningKey:process.env.__NEXT_PREVIEW_MODE_SIGNING_KEY||"",previewModeEncryptionKey:process.env.__NEXT_PREVIEW_MODE_ENCRYPTION_KEY||""}}let a5=Symbol.for("@next/request-context");async function a6(a,b,c){let d=[],e=c&&c.size>0;for(let b of(a=>{let b=["/layout"];if(a.startsWith("/")){let c=a.split("/");for(let a=1;a<c.length+1;a++){let d=c.slice(0,a).join("/");d&&(d.endsWith("/page")||d.endsWith("/route")||(d=`${d}${!d.endsWith("/")?"/":""}layout`),b.push(d))}}return b})(a))b=`${p}${b}`,d.push(b);if(b.pathname&&!e){let a=`${p}${b.pathname}`;d.push(a)}return{tags:d,expirationsByCacheKind:function(a){let b=new Map,c=aT();if(c)for(let[d,e]of c)"getExpiration"in e&&b.set(d,a2(async()=>e.getExpiration(...a)));return b}(d)}}class a7 extends M{constructor(a){super(a.input,a.init),this.sourcePage=a.page}get request(){throw Object.defineProperty(new m({page:this.sourcePage}),"__NEXT_ERROR_CODE",{value:"E394",enumerable:!1,configurable:!0})}respondWith(){throw Object.defineProperty(new m({page:this.sourcePage}),"__NEXT_ERROR_CODE",{value:"E394",enumerable:!1,configurable:!0})}waitUntil(){throw Object.defineProperty(new m({page:this.sourcePage}),"__NEXT_ERROR_CODE",{value:"E394",enumerable:!1,configurable:!0})}}let a8={keys:a=>Array.from(a.keys()),get:(a,b)=>a.get(b)??void 0},a9=(a,b)=>aI().withPropagatedContext(a.headers,b,a8),ba=!1;async function bb(a){var b;let d,e;if(!ba&&(ba=!0,"true"===process.env.NEXT_PRIVATE_TEST_PROXY)){let{interceptTestApis:a,wrapRequestHandler:b}=c(905);a(),a9=b(a9)}await k();let f=void 0!==globalThis.__BUILD_MANIFEST;a.request.url=a.request.url.replace(/\.rsc($|\?)/,"$1");let g=a.bypassNextUrl?new URL(a.request.url):new J(a.request.url,{headers:a.request.headers,nextConfig:a.request.nextConfig});for(let a of[...g.searchParams.keys()]){let b=g.searchParams.getAll(a),c=function(a){for(let b of["nxtP","nxtI"])if(a!==b&&a.startsWith(b))return a.substring(b.length);return null}(a);if(c){for(let a of(g.searchParams.delete(c),b))g.searchParams.append(c,a);g.searchParams.delete(a)}}let h=process.env.__NEXT_BUILD_ID||"";"buildId"in g&&(h=g.buildId||"",g.buildId="");let i=function(a){let b=new Headers;for(let[c,d]of Object.entries(a))for(let a of Array.isArray(d)?d:[d])void 0!==a&&("number"==typeof a&&(a=a.toString()),b.append(c,a));return b}(a.request.headers),j=i.has("x-nextjs-data"),l="1"===i.get("RSC");j&&"/index"===g.pathname&&(g.pathname="/");let m=new Map;if(!f)for(let a of U){let b=a.toLowerCase(),c=i.get(b);null!==c&&(m.set(b,c),i.delete(b))}let n=new a7({page:a.page,input:(function(a){let b="string"==typeof a,c=b?new URL(a):a;return c.searchParams.delete("_rsc"),b?c.toString():c})(g).toString(),init:{body:a.request.body,headers:i,method:a.request.method,nextConfig:a.request.nextConfig,signal:a.request.signal}});j&&Object.defineProperty(n,"__isData",{enumerable:!1,value:!0}),!globalThis.__incrementalCacheShared&&a.IncrementalCache&&(globalThis.__incrementalCache=new a.IncrementalCache({CurCacheHandler:a.incrementalCacheHandler,minimalMode:!0,fetchCacheKeyPrefix:"",dev:!1,requestHeaders:a.request.headers,getPrerenderManifest:()=>({version:-1,routes:{},dynamicRoutes:{},notFoundRoutes:[],preview:a4()})}));let o=a.request.waitUntil??(null==(b=function(){let a=globalThis[a5];return null==a?void 0:a.get()}())?void 0:b.waitUntil),p=new y({request:n,page:a.page,context:o?{waitUntil:o}:void 0});if((d=await a9(n,()=>{if("/middleware"===a.page||"/src/middleware"===a.page){let b=p.waitUntil.bind(p),c=new a3;return aI().trace(ar.execute,{spanName:`middleware ${n.method} ${n.nextUrl.pathname}`,attributes:{"http.target":n.nextUrl.pathname,"http.method":n.method}},async()=>{try{var d,f,g,i,j,k;let l=a4(),m=await a6("/",n.nextUrl,null),o=(j=n.nextUrl,k=a=>{e=a},function(a,b,c,d,e,f,g,h,i,j,k){function l(a){c&&c.setHeader("Set-Cookie",a)}let m={};return{type:"request",phase:a,implicitTags:f,url:{pathname:d.pathname,search:d.search??""},rootParams:e,get headers(){return m.headers||(m.headers=function(a){let b=W.from(a);for(let a of U)b.delete(a.toLowerCase());return W.seal(b)}(b.headers)),m.headers},get cookies(){if(!m.cookies){let a=new K.RequestCookies(W.from(b.headers));aL(b,a),m.cookies=ac.seal(a)}return m.cookies},set cookies(value){m.cookies=value},get mutableCookies(){if(!m.mutableCookies){let a=function(a,b){let c=new K.RequestCookies(W.from(a));return ae.wrap(c,b)}(b.headers,g||(c?l:void 0));aL(b,a),m.mutableCookies=a}return m.mutableCookies},get userspaceMutableCookies(){return m.userspaceMutableCookies||(m.userspaceMutableCookies=function(a){let b=new Proxy(a,{get(a,c,d){switch(c){case"delete":return function(...c){return af("cookies().delete"),a.delete(...c),b};case"set":return function(...c){return af("cookies().set"),a.set(...c),b};default:return N.get(a,c,d)}}});return b}(this.mutableCookies)),m.userspaceMutableCookies},get draftMode(){return m.draftMode||(m.draftMode=new aK(i,b,this.cookies,this.mutableCookies)),m.draftMode},renderResumeDataCache:h??null,isHmrRefresh:j,serverComponentsHmrCache:k||globalThis.__serverComponentsHmrCache}}("action",n,void 0,j,{},m,k,void 0,l,!1,void 0)),q=function({page:a,fallbackRouteParams:b,renderOpts:c,requestEndedState:d,isPrefetchRequest:e,buildId:f,previouslyRevalidatedTags:g}){var h;let i={isStaticGeneration:!c.shouldWaitOnAllReady&&!c.supportsDynamicResponse&&!c.isDraftMode&&!c.isPossibleServerAction,page:a,fallbackRouteParams:b,route:(h=a.split("/").reduce((a,b,c,d)=>b?"("===b[0]&&b.endsWith(")")||"@"===b[0]||("page"===b||"route"===b)&&c===d.length-1?a:a+"/"+b:a,"")).startsWith("/")?h:"/"+h,incrementalCache:c.incrementalCache||globalThis.__incrementalCache,cacheLifeProfiles:c.cacheLifeProfiles,isRevalidate:c.isRevalidate,isBuildTimePrerendering:c.nextExport,hasReadableErrorStacks:c.hasReadableErrorStacks,fetchCache:c.fetchCache,isOnDemandRevalidate:c.isOnDemandRevalidate,isDraftMode:c.isDraftMode,requestEndedState:d,isPrefetchRequest:e,buildId:f,reactLoadableManifest:(null==c?void 0:c.reactLoadableManifest)||{},assetPrefix:(null==c?void 0:c.assetPrefix)||"",afterContext:function(a){let{waitUntil:b,onClose:c,onAfterTaskError:d}=a;return new a0({waitUntil:b,onClose:c,onTaskError:d})}(c),dynamicIOEnabled:c.experimental.dynamicIO,dev:c.dev??!1,previouslyRevalidatedTags:g,refreshTagsByCacheKind:function(){let a=new Map,b=aT();if(b)for(let[c,d]of b)"refreshTags"in d&&a.set(c,a2(async()=>d.refreshTags()));return a}(),runInCleanSnapshot:a$?a$.snapshot():function(a,...b){return a(...b)}};return c.store=i,i}({page:"/",fallbackRouteParams:null,renderOpts:{cacheLifeProfiles:null==(f=a.request.nextConfig)||null==(d=f.experimental)?void 0:d.cacheLife,experimental:{isRoutePPREnabled:!1,dynamicIO:!1,authInterrupts:!!(null==(i=a.request.nextConfig)||null==(g=i.experimental)?void 0:g.authInterrupts)},supportsDynamicResponse:!0,waitUntil:b,onClose:c.onClose.bind(c),onAfterTaskError:void 0},requestEndedState:{ended:!1},isPrefetchRequest:n.headers.has(T),buildId:h??"",previouslyRevalidatedTags:[]});return await _.run(q,()=>aa.run(o,a.handler,n,p))}finally{setTimeout(()=>{c.dispatchClose()},0)}})}return a.handler(n,p)}))&&!(d instanceof Response))throw Object.defineProperty(TypeError("Expected an instance of Response to be returned"),"__NEXT_ERROR_CODE",{value:"E567",enumerable:!1,configurable:!0});d&&e&&d.headers.set("set-cookie",e);let q=null==d?void 0:d.headers.get("x-middleware-rewrite");if(d&&q&&(l||!f)){let b=new J(q,{forceLocale:!0,headers:a.request.headers,nextConfig:a.request.nextConfig});f||b.host!==n.nextUrl.host||(b.buildId=h||b.buildId,d.headers.set("x-middleware-rewrite",String(b)));let{url:c,isRelative:e}=S(b.toString(),g.toString());!f&&j&&d.headers.set("x-nextjs-rewrite",c),l&&e&&(g.pathname!==b.pathname&&d.headers.set("x-nextjs-rewritten-path",b.pathname),g.search!==b.search&&d.headers.set("x-nextjs-rewritten-query",b.search.slice(1)))}let r=null==d?void 0:d.headers.get("Location");if(d&&r&&!f){let b=new J(r,{forceLocale:!1,headers:a.request.headers,nextConfig:a.request.nextConfig});d=new Response(d.body,d),b.host===g.host&&(b.buildId=h||b.buildId,d.headers.set("Location",b.toString())),j&&(d.headers.delete("Location"),d.headers.set("x-nextjs-redirect",S(b.toString(),g.toString()).url))}let s=d||R.next(),t=s.headers.get("x-middleware-override-headers"),u=[];if(t){for(let[a,b]of m)s.headers.set(`x-middleware-request-${a}`,b),u.push(a);u.length>0&&s.headers.set("x-middleware-override-headers",t+","+u.join(","))}return{response:s,waitUntil:("internal"===p[w].kind?Promise.all(p[w].promises).then(()=>{}):void 0)??Promise.resolve(),fetchMetrics:n.fetchMetrics}}function bc(a){return new Response("Hello, world!")}let bd={matcher:"/about/:path*"};Object.values({NOT_FOUND:404,FORBIDDEN:403,UNAUTHORIZED:401});let be={...e},bf=be.middleware||be.default,bg="/src/middleware";if("function"!=typeof bf)throw Object.defineProperty(Error(`The Middleware "${bg}" must export a \`middleware\` or a \`default\` function`),"__NEXT_ERROR_CODE",{value:"E120",enumerable:!1,configurable:!0});function bh(a){return bb({...a,page:bg,handler:async(...a)=>{try{return await bf(...a)}catch(e){let b=a[0],c=new URL(b.url),d=c.pathname+c.search;throw await i(e,{path:d,method:b.method,headers:Object.fromEntries(b.headers.entries())},{routerKind:"Pages Router",routePath:"/middleware",routeType:"middleware",revalidateReason:void 0}),e}}})}},201:(a,b,c)=>{"use strict";Object.defineProperty(b,"__esModule",{value:!0}),!function(a,b){for(var c in b)Object.defineProperty(a,c,{enumerable:!0,get:b[c]})}(b,{getTestReqInfo:function(){return g},withRequest:function(){return f}});let d=new(c(521)).AsyncLocalStorage;function e(a,b){let c=b.header(a,"next-test-proxy-port");if(!c)return;let d=b.url(a);return{url:d,proxyPort:Number(c),testData:b.header(a,"next-test-data")||""}}function f(a,b,c){let f=e(a,b);return f?d.run(f,c):c()}function g(a,b){let c=d.getStore();return c||(a&&b?e(a,b):void 0)}},356:a=>{"use strict";a.exports=nodeBuffer},521:a=>{"use strict";a.exports=nodeAsyncHooks},552:(a,b,c)=>{"use strict";var d=c(356).Buffer;Object.defineProperty(b,"__esModule",{value:!0}),!function(a,b){for(var c in b)Object.defineProperty(a,c,{enumerable:!0,get:b[c]})}(b,{handleFetch:function(){return h},interceptFetch:function(){return i},reader:function(){return f}});let e=c(201),f={url:a=>a.url,header:(a,b)=>a.headers.get(b)};async function g(a,b){let{url:c,method:e,headers:f,body:g,cache:h,credentials:i,integrity:j,mode:k,redirect:l,referrer:m,referrerPolicy:n}=b;return{testData:a,api:"fetch",request:{url:c,method:e,headers:[...Array.from(f),["next-test-stack",function(){let a=(Error().stack??"").split("\n");for(let b=1;b<a.length;b++)if(a[b].length>0){a=a.slice(b);break}return(a=(a=(a=a.filter(a=>!a.includes("/next/dist/"))).slice(0,5)).map(a=>a.replace("webpack-internal:///(rsc)/","").trim())).join("    ")}()]],body:g?d.from(await b.arrayBuffer()).toString("base64"):null,cache:h,credentials:i,integrity:j,mode:k,redirect:l,referrer:m,referrerPolicy:n}}}async function h(a,b){let c=(0,e.getTestReqInfo)(b,f);if(!c)return a(b);let{testData:h,proxyPort:i}=c,j=await g(h,b),k=await a(`http://localhost:${i}`,{method:"POST",body:JSON.stringify(j),next:{internal:!0}});if(!k.ok)throw Object.defineProperty(Error(`Proxy request failed: ${k.status}`),"__NEXT_ERROR_CODE",{value:"E146",enumerable:!1,configurable:!0});let l=await k.json(),{api:m}=l;switch(m){case"continue":return a(b);case"abort":case"unhandled":throw Object.defineProperty(Error(`Proxy request aborted [${b.method} ${b.url}]`),"__NEXT_ERROR_CODE",{value:"E145",enumerable:!1,configurable:!0})}let{status:n,headers:o,body:p}=l.response;return new Response(p?d.from(p,"base64"):null,{status:n,headers:new Headers(o)})}function i(a){return c.g.fetch=function(b,c){var d;return(null==c||null==(d=c.next)?void 0:d.internal)?a(b,c):h(a,new Request(b,c))},()=>{c.g.fetch=a}}},717:(a,b,c)=>{"use strict";c.r(b),c.d(b,{DiagConsoleLogger:()=>I,DiagLogLevel:()=>d,INVALID_SPANID:()=>al,INVALID_SPAN_CONTEXT:()=>an,INVALID_TRACEID:()=>am,ProxyTracer:()=>aF,ProxyTracerProvider:()=>aH,ROOT_CONTEXT:()=>G,SamplingDecision:()=>g,SpanKind:()=>h,SpanStatusCode:()=>i,TraceFlags:()=>f,ValueType:()=>e,baggageEntryMetadataFromString:()=>E,context:()=>aO,createContextKey:()=>F,createNoopMeter:()=>aa,createTraceState:()=>aN,default:()=>a2,defaultTextMapGetter:()=>ab,defaultTextMapSetter:()=>ac,diag:()=>aP,isSpanContextValid:()=>aA,isValidSpanId:()=>az,isValidTraceId:()=>ay,metrics:()=>aS,propagation:()=>a_,trace:()=>a1});var d,e,f,g,h,i,j="object"==typeof globalThis?globalThis:"object"==typeof self?self:"object"==typeof window?window:"object"==typeof c.g?c.g:{},k="1.9.0",l=/^(\d+)\.(\d+)\.(\d+)(-(.+))?$/,m=function(a){var b=new Set([a]),c=new Set,d=a.match(l);if(!d)return function(){return!1};var e={major:+d[1],minor:+d[2],patch:+d[3],prerelease:d[4]};if(null!=e.prerelease)return function(b){return b===a};function f(a){return c.add(a),!1}return function(a){if(b.has(a))return!0;if(c.has(a))return!1;var d=a.match(l);if(!d)return f(a);var g={major:+d[1],minor:+d[2],patch:+d[3],prerelease:d[4]};if(null!=g.prerelease||e.major!==g.major)return f(a);if(0===e.major)return e.minor===g.minor&&e.patch<=g.patch?(b.add(a),!0):f(a);return e.minor<=g.minor?(b.add(a),!0):f(a)}}(k),n=Symbol.for("opentelemetry.js.api."+k.split(".")[0]);function o(a,b,c,d){void 0===d&&(d=!1);var e,f=j[n]=null!=(e=j[n])?e:{version:k};if(!d&&f[a]){var g=Error("@opentelemetry/api: Attempted duplicate registration of API: "+a);return c.error(g.stack||g.message),!1}if(f.version!==k){var g=Error("@opentelemetry/api: Registration of version v"+f.version+" for "+a+" does not match previously registered API v"+k);return c.error(g.stack||g.message),!1}return f[a]=b,c.debug("@opentelemetry/api: Registered a global for "+a+" v"+k+"."),!0}function p(a){var b,c,d=null==(b=j[n])?void 0:b.version;if(d&&m(d))return null==(c=j[n])?void 0:c[a]}function q(a,b){b.debug("@opentelemetry/api: Unregistering a global for "+a+" v"+k+".");var c=j[n];c&&delete c[a]}var r=function(a,b){var c="function"==typeof Symbol&&a[Symbol.iterator];if(!c)return a;var d,e,f=c.call(a),g=[];try{for(;(void 0===b||b-- >0)&&!(d=f.next()).done;)g.push(d.value)}catch(a){e={error:a}}finally{try{d&&!d.done&&(c=f.return)&&c.call(f)}finally{if(e)throw e.error}}return g},s=function(a,b,c){if(c||2==arguments.length)for(var d,e=0,f=b.length;e<f;e++)!d&&e in b||(d||(d=Array.prototype.slice.call(b,0,e)),d[e]=b[e]);return a.concat(d||Array.prototype.slice.call(b))},t=function(){function a(a){this._namespace=a.namespace||"DiagComponentLogger"}return a.prototype.debug=function(){for(var a=[],b=0;b<arguments.length;b++)a[b]=arguments[b];return u("debug",this._namespace,a)},a.prototype.error=function(){for(var a=[],b=0;b<arguments.length;b++)a[b]=arguments[b];return u("error",this._namespace,a)},a.prototype.info=function(){for(var a=[],b=0;b<arguments.length;b++)a[b]=arguments[b];return u("info",this._namespace,a)},a.prototype.warn=function(){for(var a=[],b=0;b<arguments.length;b++)a[b]=arguments[b];return u("warn",this._namespace,a)},a.prototype.verbose=function(){for(var a=[],b=0;b<arguments.length;b++)a[b]=arguments[b];return u("verbose",this._namespace,a)},a}();function u(a,b,c){var d=p("diag");if(d)return c.unshift(b),d[a].apply(d,s([],r(c),!1))}!function(a){a[a.NONE=0]="NONE",a[a.ERROR=30]="ERROR",a[a.WARN=50]="WARN",a[a.INFO=60]="INFO",a[a.DEBUG=70]="DEBUG",a[a.VERBOSE=80]="VERBOSE",a[a.ALL=9999]="ALL"}(d||(d={}));var v=function(a,b){var c="function"==typeof Symbol&&a[Symbol.iterator];if(!c)return a;var d,e,f=c.call(a),g=[];try{for(;(void 0===b||b-- >0)&&!(d=f.next()).done;)g.push(d.value)}catch(a){e={error:a}}finally{try{d&&!d.done&&(c=f.return)&&c.call(f)}finally{if(e)throw e.error}}return g},w=function(a,b,c){if(c||2==arguments.length)for(var d,e=0,f=b.length;e<f;e++)!d&&e in b||(d||(d=Array.prototype.slice.call(b,0,e)),d[e]=b[e]);return a.concat(d||Array.prototype.slice.call(b))},x=function(){function a(){function a(a){return function(){for(var b=[],c=0;c<arguments.length;c++)b[c]=arguments[c];var d=p("diag");if(d)return d[a].apply(d,w([],v(b),!1))}}var b=this;b.setLogger=function(a,c){if(void 0===c&&(c={logLevel:d.INFO}),a===b){var e,f,g,h=Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");return b.error(null!=(e=h.stack)?e:h.message),!1}"number"==typeof c&&(c={logLevel:c});var i=p("diag"),j=function(a,b){function c(c,d){var e=b[c];return"function"==typeof e&&a>=d?e.bind(b):function(){}}return a<d.NONE?a=d.NONE:a>d.ALL&&(a=d.ALL),b=b||{},{error:c("error",d.ERROR),warn:c("warn",d.WARN),info:c("info",d.INFO),debug:c("debug",d.DEBUG),verbose:c("verbose",d.VERBOSE)}}(null!=(f=c.logLevel)?f:d.INFO,a);if(i&&!c.suppressOverrideMessage){var k=null!=(g=Error().stack)?g:"<failed to generate stacktrace>";i.warn("Current logger will be overwritten from "+k),j.warn("Current logger will overwrite one already registered from "+k)}return o("diag",j,b,!0)},b.disable=function(){q("diag",b)},b.createComponentLogger=function(a){return new t(a)},b.verbose=a("verbose"),b.debug=a("debug"),b.info=a("info"),b.warn=a("warn"),b.error=a("error")}return a.instance=function(){return this._instance||(this._instance=new a),this._instance},a}(),y=function(a,b){var c="function"==typeof Symbol&&a[Symbol.iterator];if(!c)return a;var d,e,f=c.call(a),g=[];try{for(;(void 0===b||b-- >0)&&!(d=f.next()).done;)g.push(d.value)}catch(a){e={error:a}}finally{try{d&&!d.done&&(c=f.return)&&c.call(f)}finally{if(e)throw e.error}}return g},z=function(a){var b="function"==typeof Symbol&&Symbol.iterator,c=b&&a[b],d=0;if(c)return c.call(a);if(a&&"number"==typeof a.length)return{next:function(){return a&&d>=a.length&&(a=void 0),{value:a&&a[d++],done:!a}}};throw TypeError(b?"Object is not iterable.":"Symbol.iterator is not defined.")},A=function(){function a(a){this._entries=a?new Map(a):new Map}return a.prototype.getEntry=function(a){var b=this._entries.get(a);if(b)return Object.assign({},b)},a.prototype.getAllEntries=function(){return Array.from(this._entries.entries()).map(function(a){var b=y(a,2);return[b[0],b[1]]})},a.prototype.setEntry=function(b,c){var d=new a(this._entries);return d._entries.set(b,c),d},a.prototype.removeEntry=function(b){var c=new a(this._entries);return c._entries.delete(b),c},a.prototype.removeEntries=function(){for(var b,c,d=[],e=0;e<arguments.length;e++)d[e]=arguments[e];var f=new a(this._entries);try{for(var g=z(d),h=g.next();!h.done;h=g.next()){var i=h.value;f._entries.delete(i)}}catch(a){b={error:a}}finally{try{h&&!h.done&&(c=g.return)&&c.call(g)}finally{if(b)throw b.error}}return f},a.prototype.clear=function(){return new a},a}(),B=Symbol("BaggageEntryMetadata"),C=x.instance();function D(a){return void 0===a&&(a={}),new A(new Map(Object.entries(a)))}function E(a){return"string"!=typeof a&&(C.error("Cannot create baggage metadata from unknown type: "+typeof a),a=""),{__TYPE__:B,toString:function(){return a}}}function F(a){return Symbol.for(a)}var G=new function a(b){var c=this;c._currentContext=b?new Map(b):new Map,c.getValue=function(a){return c._currentContext.get(a)},c.setValue=function(b,d){var e=new a(c._currentContext);return e._currentContext.set(b,d),e},c.deleteValue=function(b){var d=new a(c._currentContext);return d._currentContext.delete(b),d}},H=[{n:"error",c:"error"},{n:"warn",c:"warn"},{n:"info",c:"info"},{n:"debug",c:"debug"},{n:"verbose",c:"trace"}],I=function(){for(var a=0;a<H.length;a++)this[H[a].n]=function(a){return function(){for(var b=[],c=0;c<arguments.length;c++)b[c]=arguments[c];if(console){var d=console[a];if("function"!=typeof d&&(d=console.log),"function"==typeof d)return d.apply(console,b)}}}(H[a].c)},J=function(){var a=function(b,c){return(a=Object.setPrototypeOf||({__proto__:[]})instanceof Array&&function(a,b){a.__proto__=b}||function(a,b){for(var c in b)Object.prototype.hasOwnProperty.call(b,c)&&(a[c]=b[c])})(b,c)};return function(b,c){if("function"!=typeof c&&null!==c)throw TypeError("Class extends value "+String(c)+" is not a constructor or null");function d(){this.constructor=b}a(b,c),b.prototype=null===c?Object.create(c):(d.prototype=c.prototype,new d)}}(),K=function(){function a(){}return a.prototype.createGauge=function(a,b){return W},a.prototype.createHistogram=function(a,b){return X},a.prototype.createCounter=function(a,b){return V},a.prototype.createUpDownCounter=function(a,b){return Y},a.prototype.createObservableGauge=function(a,b){return $},a.prototype.createObservableCounter=function(a,b){return Z},a.prototype.createObservableUpDownCounter=function(a,b){return _},a.prototype.addBatchObservableCallback=function(a,b){},a.prototype.removeBatchObservableCallback=function(a){},a}(),L=function(){},M=function(a){function b(){return null!==a&&a.apply(this,arguments)||this}return J(b,a),b.prototype.add=function(a,b){},b}(L),N=function(a){function b(){return null!==a&&a.apply(this,arguments)||this}return J(b,a),b.prototype.add=function(a,b){},b}(L),O=function(a){function b(){return null!==a&&a.apply(this,arguments)||this}return J(b,a),b.prototype.record=function(a,b){},b}(L),P=function(a){function b(){return null!==a&&a.apply(this,arguments)||this}return J(b,a),b.prototype.record=function(a,b){},b}(L),Q=function(){function a(){}return a.prototype.addCallback=function(a){},a.prototype.removeCallback=function(a){},a}(),R=function(a){function b(){return null!==a&&a.apply(this,arguments)||this}return J(b,a),b}(Q),S=function(a){function b(){return null!==a&&a.apply(this,arguments)||this}return J(b,a),b}(Q),T=function(a){function b(){return null!==a&&a.apply(this,arguments)||this}return J(b,a),b}(Q),U=new K,V=new M,W=new O,X=new P,Y=new N,Z=new R,$=new S,_=new T;function aa(){return U}!function(a){a[a.INT=0]="INT",a[a.DOUBLE=1]="DOUBLE"}(e||(e={}));var ab={get:function(a,b){if(null!=a)return a[b]},keys:function(a){return null==a?[]:Object.keys(a)}},ac={set:function(a,b,c){null!=a&&(a[b]=c)}},ad=function(a,b){var c="function"==typeof Symbol&&a[Symbol.iterator];if(!c)return a;var d,e,f=c.call(a),g=[];try{for(;(void 0===b||b-- >0)&&!(d=f.next()).done;)g.push(d.value)}catch(a){e={error:a}}finally{try{d&&!d.done&&(c=f.return)&&c.call(f)}finally{if(e)throw e.error}}return g},ae=function(a,b,c){if(c||2==arguments.length)for(var d,e=0,f=b.length;e<f;e++)!d&&e in b||(d||(d=Array.prototype.slice.call(b,0,e)),d[e]=b[e]);return a.concat(d||Array.prototype.slice.call(b))},af=function(){function a(){}return a.prototype.active=function(){return G},a.prototype.with=function(a,b,c){for(var d=[],e=3;e<arguments.length;e++)d[e-3]=arguments[e];return b.call.apply(b,ae([c],ad(d),!1))},a.prototype.bind=function(a,b){return b},a.prototype.enable=function(){return this},a.prototype.disable=function(){return this},a}(),ag=function(a,b){var c="function"==typeof Symbol&&a[Symbol.iterator];if(!c)return a;var d,e,f=c.call(a),g=[];try{for(;(void 0===b||b-- >0)&&!(d=f.next()).done;)g.push(d.value)}catch(a){e={error:a}}finally{try{d&&!d.done&&(c=f.return)&&c.call(f)}finally{if(e)throw e.error}}return g},ah=function(a,b,c){if(c||2==arguments.length)for(var d,e=0,f=b.length;e<f;e++)!d&&e in b||(d||(d=Array.prototype.slice.call(b,0,e)),d[e]=b[e]);return a.concat(d||Array.prototype.slice.call(b))},ai="context",aj=new af,ak=function(){function a(){}return a.getInstance=function(){return this._instance||(this._instance=new a),this._instance},a.prototype.setGlobalContextManager=function(a){return o(ai,a,x.instance())},a.prototype.active=function(){return this._getContextManager().active()},a.prototype.with=function(a,b,c){for(var d,e=[],f=3;f<arguments.length;f++)e[f-3]=arguments[f];return(d=this._getContextManager()).with.apply(d,ah([a,b,c],ag(e),!1))},a.prototype.bind=function(a,b){return this._getContextManager().bind(a,b)},a.prototype._getContextManager=function(){return p(ai)||aj},a.prototype.disable=function(){this._getContextManager().disable(),q(ai,x.instance())},a}();!function(a){a[a.NONE=0]="NONE",a[a.SAMPLED=1]="SAMPLED"}(f||(f={}));var al="0000000000000000",am="00000000000000000000000000000000",an={traceId:am,spanId:al,traceFlags:f.NONE},ao=function(){function a(a){void 0===a&&(a=an),this._spanContext=a}return a.prototype.spanContext=function(){return this._spanContext},a.prototype.setAttribute=function(a,b){return this},a.prototype.setAttributes=function(a){return this},a.prototype.addEvent=function(a,b){return this},a.prototype.addLink=function(a){return this},a.prototype.addLinks=function(a){return this},a.prototype.setStatus=function(a){return this},a.prototype.updateName=function(a){return this},a.prototype.end=function(a){},a.prototype.isRecording=function(){return!1},a.prototype.recordException=function(a,b){},a}(),ap=F("OpenTelemetry Context Key SPAN");function aq(a){return a.getValue(ap)||void 0}function ar(){return aq(ak.getInstance().active())}function as(a,b){return a.setValue(ap,b)}function at(a){return a.deleteValue(ap)}function au(a,b){return as(a,new ao(b))}function av(a){var b;return null==(b=aq(a))?void 0:b.spanContext()}var aw=/^([0-9a-f]{32})$/i,ax=/^[0-9a-f]{16}$/i;function ay(a){return aw.test(a)&&a!==am}function az(a){return ax.test(a)&&a!==al}function aA(a){return ay(a.traceId)&&az(a.spanId)}function aB(a){return new ao(a)}var aC=ak.getInstance(),aD=function(){function a(){}return a.prototype.startSpan=function(a,b,c){if(void 0===c&&(c=aC.active()),null==b?void 0:b.root)return new ao;var d,e=c&&av(c);return"object"==typeof(d=e)&&"string"==typeof d.spanId&&"string"==typeof d.traceId&&"number"==typeof d.traceFlags&&aA(e)?new ao(e):new ao},a.prototype.startActiveSpan=function(a,b,c,d){if(!(arguments.length<2)){2==arguments.length?g=b:3==arguments.length?(e=b,g=c):(e=b,f=c,g=d);var e,f,g,h=null!=f?f:aC.active(),i=this.startSpan(a,e,h),j=as(h,i);return aC.with(j,g,void 0,i)}},a}(),aE=new aD,aF=function(){function a(a,b,c,d){this._provider=a,this.name=b,this.version=c,this.options=d}return a.prototype.startSpan=function(a,b,c){return this._getTracer().startSpan(a,b,c)},a.prototype.startActiveSpan=function(a,b,c,d){var e=this._getTracer();return Reflect.apply(e.startActiveSpan,e,arguments)},a.prototype._getTracer=function(){if(this._delegate)return this._delegate;var a=this._provider.getDelegateTracer(this.name,this.version,this.options);return a?(this._delegate=a,this._delegate):aE},a}(),aG=new(function(){function a(){}return a.prototype.getTracer=function(a,b,c){return new aD},a}()),aH=function(){function a(){}return a.prototype.getTracer=function(a,b,c){var d;return null!=(d=this.getDelegateTracer(a,b,c))?d:new aF(this,a,b,c)},a.prototype.getDelegate=function(){var a;return null!=(a=this._delegate)?a:aG},a.prototype.setDelegate=function(a){this._delegate=a},a.prototype.getDelegateTracer=function(a,b,c){var d;return null==(d=this._delegate)?void 0:d.getTracer(a,b,c)},a}();!function(a){a[a.NOT_RECORD=0]="NOT_RECORD",a[a.RECORD=1]="RECORD",a[a.RECORD_AND_SAMPLED=2]="RECORD_AND_SAMPLED"}(g||(g={})),function(a){a[a.INTERNAL=0]="INTERNAL",a[a.SERVER=1]="SERVER",a[a.CLIENT=2]="CLIENT",a[a.PRODUCER=3]="PRODUCER",a[a.CONSUMER=4]="CONSUMER"}(h||(h={})),function(a){a[a.UNSET=0]="UNSET",a[a.OK=1]="OK",a[a.ERROR=2]="ERROR"}(i||(i={}));var aI="[_0-9a-z-*/]",aJ=RegExp("^(?:[a-z]"+aI+"{0,255}|"+("[a-z0-9]"+aI+"{0,240}@[a-z]")+aI+"{0,13})$"),aK=/^[ -~]{0,255}[!-~]$/,aL=/,|=/,aM=function(){function a(a){this._internalState=new Map,a&&this._parse(a)}return a.prototype.set=function(a,b){var c=this._clone();return c._internalState.has(a)&&c._internalState.delete(a),c._internalState.set(a,b),c},a.prototype.unset=function(a){var b=this._clone();return b._internalState.delete(a),b},a.prototype.get=function(a){return this._internalState.get(a)},a.prototype.serialize=function(){var a=this;return this._keys().reduce(function(b,c){return b.push(c+"="+a.get(c)),b},[]).join(",")},a.prototype._parse=function(a){!(a.length>512)&&(this._internalState=a.split(",").reverse().reduce(function(a,b){var c=b.trim(),d=c.indexOf("=");if(-1!==d){var e=c.slice(0,d),f=c.slice(d+1,b.length);aJ.test(e)&&aK.test(f)&&!aL.test(f)&&a.set(e,f)}return a},new Map),this._internalState.size>32&&(this._internalState=new Map(Array.from(this._internalState.entries()).reverse().slice(0,32))))},a.prototype._keys=function(){return Array.from(this._internalState.keys()).reverse()},a.prototype._clone=function(){var b=new a;return b._internalState=new Map(this._internalState),b},a}();function aN(a){return new aM(a)}var aO=ak.getInstance(),aP=x.instance(),aQ=new(function(){function a(){}return a.prototype.getMeter=function(a,b,c){return U},a}()),aR="metrics",aS=(function(){function a(){}return a.getInstance=function(){return this._instance||(this._instance=new a),this._instance},a.prototype.setGlobalMeterProvider=function(a){return o(aR,a,x.instance())},a.prototype.getMeterProvider=function(){return p(aR)||aQ},a.prototype.getMeter=function(a,b,c){return this.getMeterProvider().getMeter(a,b,c)},a.prototype.disable=function(){q(aR,x.instance())},a})().getInstance(),aT=function(){function a(){}return a.prototype.inject=function(a,b){},a.prototype.extract=function(a,b){return a},a.prototype.fields=function(){return[]},a}(),aU=F("OpenTelemetry Baggage Key");function aV(a){return a.getValue(aU)||void 0}function aW(){return aV(ak.getInstance().active())}function aX(a,b){return a.setValue(aU,b)}function aY(a){return a.deleteValue(aU)}var aZ="propagation",a$=new aT,a_=(function(){function a(){this.createBaggage=D,this.getBaggage=aV,this.getActiveBaggage=aW,this.setBaggage=aX,this.deleteBaggage=aY}return a.getInstance=function(){return this._instance||(this._instance=new a),this._instance},a.prototype.setGlobalPropagator=function(a){return o(aZ,a,x.instance())},a.prototype.inject=function(a,b,c){return void 0===c&&(c=ac),this._getGlobalPropagator().inject(a,b,c)},a.prototype.extract=function(a,b,c){return void 0===c&&(c=ab),this._getGlobalPropagator().extract(a,b,c)},a.prototype.fields=function(){return this._getGlobalPropagator().fields()},a.prototype.disable=function(){q(aZ,x.instance())},a.prototype._getGlobalPropagator=function(){return p(aZ)||a$},a})().getInstance(),a0="trace",a1=(function(){function a(){this._proxyTracerProvider=new aH,this.wrapSpanContext=aB,this.isSpanContextValid=aA,this.deleteSpan=at,this.getSpan=aq,this.getActiveSpan=ar,this.getSpanContext=av,this.setSpan=as,this.setSpanContext=au}return a.getInstance=function(){return this._instance||(this._instance=new a),this._instance},a.prototype.setGlobalTracerProvider=function(a){var b=o(a0,this._proxyTracerProvider,x.instance());return b&&this._proxyTracerProvider.setDelegate(a),b},a.prototype.getTracerProvider=function(){return p(a0)||this._proxyTracerProvider},a.prototype.getTracer=function(a,b){return this.getTracerProvider().getTracer(a,b)},a.prototype.disable=function(){q(a0,x.instance()),this._proxyTracerProvider=new aH},a})().getInstance();let a2={context:aO,diag:aP,metrics:aS,propagation:a_,trace:a1}},724:a=>{"use strict";var b=Object.defineProperty,c=Object.getOwnPropertyDescriptor,d=Object.getOwnPropertyNames,e=Object.prototype.hasOwnProperty,f={};function g(a){var b;let c=["path"in a&&a.path&&`Path=${a.path}`,"expires"in a&&(a.expires||0===a.expires)&&`Expires=${("number"==typeof a.expires?new Date(a.expires):a.expires).toUTCString()}`,"maxAge"in a&&"number"==typeof a.maxAge&&`Max-Age=${a.maxAge}`,"domain"in a&&a.domain&&`Domain=${a.domain}`,"secure"in a&&a.secure&&"Secure","httpOnly"in a&&a.httpOnly&&"HttpOnly","sameSite"in a&&a.sameSite&&`SameSite=${a.sameSite}`,"partitioned"in a&&a.partitioned&&"Partitioned","priority"in a&&a.priority&&`Priority=${a.priority}`].filter(Boolean),d=`${a.name}=${encodeURIComponent(null!=(b=a.value)?b:"")}`;return 0===c.length?d:`${d}; ${c.join("; ")}`}function h(a){let b=new Map;for(let c of a.split(/; */)){if(!c)continue;let a=c.indexOf("=");if(-1===a){b.set(c,"true");continue}let[d,e]=[c.slice(0,a),c.slice(a+1)];try{b.set(d,decodeURIComponent(null!=e?e:"true"))}catch{}}return b}function i(a){if(!a)return;let[[b,c],...d]=h(a),{domain:e,expires:f,httponly:g,maxage:i,path:l,samesite:m,secure:n,partitioned:o,priority:p}=Object.fromEntries(d.map(([a,b])=>[a.toLowerCase().replace(/-/g,""),b]));{var q,r,s={name:b,value:decodeURIComponent(c),domain:e,...f&&{expires:new Date(f)},...g&&{httpOnly:!0},..."string"==typeof i&&{maxAge:Number(i)},path:l,...m&&{sameSite:j.includes(q=(q=m).toLowerCase())?q:void 0},...n&&{secure:!0},...p&&{priority:k.includes(r=(r=p).toLowerCase())?r:void 0},...o&&{partitioned:!0}};let a={};for(let b in s)s[b]&&(a[b]=s[b]);return a}}((a,c)=>{for(var d in c)b(a,d,{get:c[d],enumerable:!0})})(f,{RequestCookies:()=>l,ResponseCookies:()=>m,parseCookie:()=>h,parseSetCookie:()=>i,stringifyCookie:()=>g}),a.exports=((a,f,g,h)=>{if(f&&"object"==typeof f||"function"==typeof f)for(let i of d(f))e.call(a,i)||i===g||b(a,i,{get:()=>f[i],enumerable:!(h=c(f,i))||h.enumerable});return a})(b({},"__esModule",{value:!0}),f);var j=["strict","lax","none"],k=["low","medium","high"],l=class{constructor(a){this._parsed=new Map,this._headers=a;let b=a.get("cookie");if(b)for(let[a,c]of h(b))this._parsed.set(a,{name:a,value:c})}[Symbol.iterator](){return this._parsed[Symbol.iterator]()}get size(){return this._parsed.size}get(...a){let b="string"==typeof a[0]?a[0]:a[0].name;return this._parsed.get(b)}getAll(...a){var b;let c=Array.from(this._parsed);if(!a.length)return c.map(([a,b])=>b);let d="string"==typeof a[0]?a[0]:null==(b=a[0])?void 0:b.name;return c.filter(([a])=>a===d).map(([a,b])=>b)}has(a){return this._parsed.has(a)}set(...a){let[b,c]=1===a.length?[a[0].name,a[0].value]:a,d=this._parsed;return d.set(b,{name:b,value:c}),this._headers.set("cookie",Array.from(d).map(([a,b])=>g(b)).join("; ")),this}delete(a){let b=this._parsed,c=Array.isArray(a)?a.map(a=>b.delete(a)):b.delete(a);return this._headers.set("cookie",Array.from(b).map(([a,b])=>g(b)).join("; ")),c}clear(){return this.delete(Array.from(this._parsed.keys())),this}[Symbol.for("edge-runtime.inspect.custom")](){return`RequestCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`}toString(){return[...this._parsed.values()].map(a=>`${a.name}=${encodeURIComponent(a.value)}`).join("; ")}},m=class{constructor(a){var b,c,d;this._parsed=new Map,this._headers=a;let e=null!=(d=null!=(c=null==(b=a.getSetCookie)?void 0:b.call(a))?c:a.get("set-cookie"))?d:[];for(let a of Array.isArray(e)?e:function(a){if(!a)return[];var b,c,d,e,f,g=[],h=0;function i(){for(;h<a.length&&/\s/.test(a.charAt(h));)h+=1;return h<a.length}for(;h<a.length;){for(b=h,f=!1;i();)if(","===(c=a.charAt(h))){for(d=h,h+=1,i(),e=h;h<a.length&&"="!==(c=a.charAt(h))&&";"!==c&&","!==c;)h+=1;h<a.length&&"="===a.charAt(h)?(f=!0,h=e,g.push(a.substring(b,d)),b=h):h=d+1}else h+=1;(!f||h>=a.length)&&g.push(a.substring(b,a.length))}return g}(e)){let b=i(a);b&&this._parsed.set(b.name,b)}}get(...a){let b="string"==typeof a[0]?a[0]:a[0].name;return this._parsed.get(b)}getAll(...a){var b;let c=Array.from(this._parsed.values());if(!a.length)return c;let d="string"==typeof a[0]?a[0]:null==(b=a[0])?void 0:b.name;return c.filter(a=>a.name===d)}has(a){return this._parsed.has(a)}set(...a){let[b,c,d]=1===a.length?[a[0].name,a[0].value,a[0]]:a,e=this._parsed;return e.set(b,function(a={name:"",value:""}){return"number"==typeof a.expires&&(a.expires=new Date(a.expires)),a.maxAge&&(a.expires=new Date(Date.now()+1e3*a.maxAge)),(null===a.path||void 0===a.path)&&(a.path="/"),a}({name:b,value:c,...d})),function(a,b){for(let[,c]of(b.delete("set-cookie"),a)){let a=g(c);b.append("set-cookie",a)}}(e,this._headers),this}delete(...a){let[b,c]="string"==typeof a[0]?[a[0]]:[a[0].name,a[0]];return this.set({...c,name:b,value:"",expires:new Date(0)})}[Symbol.for("edge-runtime.inspect.custom")](){return`ResponseCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`}toString(){return[...this._parsed.values()].map(g).join("; ")}}},802:a=>{(()=>{"use strict";var b={993:a=>{var b=Object.prototype.hasOwnProperty,c="~";function d(){}function e(a,b,c){this.fn=a,this.context=b,this.once=c||!1}function f(a,b,d,f,g){if("function"!=typeof d)throw TypeError("The listener must be a function");var h=new e(d,f||a,g),i=c?c+b:b;return a._events[i]?a._events[i].fn?a._events[i]=[a._events[i],h]:a._events[i].push(h):(a._events[i]=h,a._eventsCount++),a}function g(a,b){0==--a._eventsCount?a._events=new d:delete a._events[b]}function h(){this._events=new d,this._eventsCount=0}Object.create&&(d.prototype=Object.create(null),(new d).__proto__||(c=!1)),h.prototype.eventNames=function(){var a,d,e=[];if(0===this._eventsCount)return e;for(d in a=this._events)b.call(a,d)&&e.push(c?d.slice(1):d);return Object.getOwnPropertySymbols?e.concat(Object.getOwnPropertySymbols(a)):e},h.prototype.listeners=function(a){var b=c?c+a:a,d=this._events[b];if(!d)return[];if(d.fn)return[d.fn];for(var e=0,f=d.length,g=Array(f);e<f;e++)g[e]=d[e].fn;return g},h.prototype.listenerCount=function(a){var b=c?c+a:a,d=this._events[b];return d?d.fn?1:d.length:0},h.prototype.emit=function(a,b,d,e,f,g){var h=c?c+a:a;if(!this._events[h])return!1;var i,j,k=this._events[h],l=arguments.length;if(k.fn){switch(k.once&&this.removeListener(a,k.fn,void 0,!0),l){case 1:return k.fn.call(k.context),!0;case 2:return k.fn.call(k.context,b),!0;case 3:return k.fn.call(k.context,b,d),!0;case 4:return k.fn.call(k.context,b,d,e),!0;case 5:return k.fn.call(k.context,b,d,e,f),!0;case 6:return k.fn.call(k.context,b,d,e,f,g),!0}for(j=1,i=Array(l-1);j<l;j++)i[j-1]=arguments[j];k.fn.apply(k.context,i)}else{var m,n=k.length;for(j=0;j<n;j++)switch(k[j].once&&this.removeListener(a,k[j].fn,void 0,!0),l){case 1:k[j].fn.call(k[j].context);break;case 2:k[j].fn.call(k[j].context,b);break;case 3:k[j].fn.call(k[j].context,b,d);break;case 4:k[j].fn.call(k[j].context,b,d,e);break;default:if(!i)for(m=1,i=Array(l-1);m<l;m++)i[m-1]=arguments[m];k[j].fn.apply(k[j].context,i)}}return!0},h.prototype.on=function(a,b,c){return f(this,a,b,c,!1)},h.prototype.once=function(a,b,c){return f(this,a,b,c,!0)},h.prototype.removeListener=function(a,b,d,e){var f=c?c+a:a;if(!this._events[f])return this;if(!b)return g(this,f),this;var h=this._events[f];if(h.fn)h.fn!==b||e&&!h.once||d&&h.context!==d||g(this,f);else{for(var i=0,j=[],k=h.length;i<k;i++)(h[i].fn!==b||e&&!h[i].once||d&&h[i].context!==d)&&j.push(h[i]);j.length?this._events[f]=1===j.length?j[0]:j:g(this,f)}return this},h.prototype.removeAllListeners=function(a){var b;return a?(b=c?c+a:a,this._events[b]&&g(this,b)):(this._events=new d,this._eventsCount=0),this},h.prototype.off=h.prototype.removeListener,h.prototype.addListener=h.prototype.on,h.prefixed=c,h.EventEmitter=h,a.exports=h},213:a=>{a.exports=(a,b)=>(b=b||(()=>{}),a.then(a=>new Promise(a=>{a(b())}).then(()=>a),a=>new Promise(a=>{a(b())}).then(()=>{throw a})))},574:(a,b)=>{Object.defineProperty(b,"__esModule",{value:!0}),b.default=function(a,b,c){let d=0,e=a.length;for(;e>0;){let f=e/2|0,g=d+f;0>=c(a[g],b)?(d=++g,e-=f+1):e=f}return d}},821:(a,b,c)=>{Object.defineProperty(b,"__esModule",{value:!0});let d=c(574);class e{constructor(){this._queue=[]}enqueue(a,b){let c={priority:(b=Object.assign({priority:0},b)).priority,run:a};if(this.size&&this._queue[this.size-1].priority>=b.priority)return void this._queue.push(c);let e=d.default(this._queue,c,(a,b)=>b.priority-a.priority);this._queue.splice(e,0,c)}dequeue(){let a=this._queue.shift();return null==a?void 0:a.run}filter(a){return this._queue.filter(b=>b.priority===a.priority).map(a=>a.run)}get size(){return this._queue.length}}b.default=e},816:(a,b,c)=>{let d=c(213);class e extends Error{constructor(a){super(a),this.name="TimeoutError"}}let f=(a,b,c)=>new Promise((f,g)=>{if("number"!=typeof b||b<0)throw TypeError("Expected `milliseconds` to be a positive number");if(b===1/0)return void f(a);let h=setTimeout(()=>{if("function"==typeof c){try{f(c())}catch(a){g(a)}return}let d="string"==typeof c?c:`Promise timed out after ${b} milliseconds`,h=c instanceof Error?c:new e(d);"function"==typeof a.cancel&&a.cancel(),g(h)},b);d(a.then(f,g),()=>{clearTimeout(h)})});a.exports=f,a.exports.default=f,a.exports.TimeoutError=e}},c={};function d(a){var e=c[a];if(void 0!==e)return e.exports;var f=c[a]={exports:{}},g=!0;try{b[a](f,f.exports,d),g=!1}finally{g&&delete c[a]}return f.exports}d.ab="//";var e={};(()=>{Object.defineProperty(e,"__esModule",{value:!0});let a=d(993),b=d(816),c=d(821),f=()=>{},g=new b.TimeoutError;class h extends a{constructor(a){var b,d,e,g;if(super(),this._intervalCount=0,this._intervalEnd=0,this._pendingCount=0,this._resolveEmpty=f,this._resolveIdle=f,!("number"==typeof(a=Object.assign({carryoverConcurrencyCount:!1,intervalCap:1/0,interval:0,concurrency:1/0,autoStart:!0,queueClass:c.default},a)).intervalCap&&a.intervalCap>=1))throw TypeError(`Expected \`intervalCap\` to be a number from 1 and up, got \`${null!=(d=null==(b=a.intervalCap)?void 0:b.toString())?d:""}\` (${typeof a.intervalCap})`);if(void 0===a.interval||!(Number.isFinite(a.interval)&&a.interval>=0))throw TypeError(`Expected \`interval\` to be a finite number >= 0, got \`${null!=(g=null==(e=a.interval)?void 0:e.toString())?g:""}\` (${typeof a.interval})`);this._carryoverConcurrencyCount=a.carryoverConcurrencyCount,this._isIntervalIgnored=a.intervalCap===1/0||0===a.interval,this._intervalCap=a.intervalCap,this._interval=a.interval,this._queue=new a.queueClass,this._queueClass=a.queueClass,this.concurrency=a.concurrency,this._timeout=a.timeout,this._throwOnTimeout=!0===a.throwOnTimeout,this._isPaused=!1===a.autoStart}get _doesIntervalAllowAnother(){return this._isIntervalIgnored||this._intervalCount<this._intervalCap}get _doesConcurrentAllowAnother(){return this._pendingCount<this._concurrency}_next(){this._pendingCount--,this._tryToStartAnother(),this.emit("next")}_resolvePromises(){this._resolveEmpty(),this._resolveEmpty=f,0===this._pendingCount&&(this._resolveIdle(),this._resolveIdle=f,this.emit("idle"))}_onResumeInterval(){this._onInterval(),this._initializeIntervalIfNeeded(),this._timeoutId=void 0}_isIntervalPaused(){let a=Date.now();if(void 0===this._intervalId){let b=this._intervalEnd-a;if(!(b<0))return void 0===this._timeoutId&&(this._timeoutId=setTimeout(()=>{this._onResumeInterval()},b)),!0;this._intervalCount=this._carryoverConcurrencyCount?this._pendingCount:0}return!1}_tryToStartAnother(){if(0===this._queue.size)return this._intervalId&&clearInterval(this._intervalId),this._intervalId=void 0,this._resolvePromises(),!1;if(!this._isPaused){let a=!this._isIntervalPaused();if(this._doesIntervalAllowAnother&&this._doesConcurrentAllowAnother){let b=this._queue.dequeue();return!!b&&(this.emit("active"),b(),a&&this._initializeIntervalIfNeeded(),!0)}}return!1}_initializeIntervalIfNeeded(){this._isIntervalIgnored||void 0!==this._intervalId||(this._intervalId=setInterval(()=>{this._onInterval()},this._interval),this._intervalEnd=Date.now()+this._interval)}_onInterval(){0===this._intervalCount&&0===this._pendingCount&&this._intervalId&&(clearInterval(this._intervalId),this._intervalId=void 0),this._intervalCount=this._carryoverConcurrencyCount?this._pendingCount:0,this._processQueue()}_processQueue(){for(;this._tryToStartAnother(););}get concurrency(){return this._concurrency}set concurrency(a){if(!("number"==typeof a&&a>=1))throw TypeError(`Expected \`concurrency\` to be a number from 1 and up, got \`${a}\` (${typeof a})`);this._concurrency=a,this._processQueue()}async add(a,c={}){return new Promise((d,e)=>{let f=async()=>{this._pendingCount++,this._intervalCount++;try{let f=void 0===this._timeout&&void 0===c.timeout?a():b.default(Promise.resolve(a()),void 0===c.timeout?this._timeout:c.timeout,()=>{(void 0===c.throwOnTimeout?this._throwOnTimeout:c.throwOnTimeout)&&e(g)});d(await f)}catch(a){e(a)}this._next()};this._queue.enqueue(f,c),this._tryToStartAnother(),this.emit("add")})}async addAll(a,b){return Promise.all(a.map(async a=>this.add(a,b)))}start(){return this._isPaused&&(this._isPaused=!1,this._processQueue()),this}pause(){this._isPaused=!0}clear(){this._queue=new this._queueClass}async onEmpty(){if(0!==this._queue.size)return new Promise(a=>{let b=this._resolveEmpty;this._resolveEmpty=()=>{b(),a()}})}async onIdle(){if(0!==this._pendingCount||0!==this._queue.size)return new Promise(a=>{let b=this._resolveIdle;this._resolveIdle=()=>{b(),a()}})}get size(){return this._queue.size}sizeBy(a){return this._queue.filter(a).length}get pending(){return this._pendingCount}get isPaused(){return this._isPaused}get timeout(){return this._timeout}set timeout(a){this._timeout=a}}e.default=h})(),a.exports=e})()},890:a=>{(()=>{"use strict";"undefined"!=typeof __nccwpck_require__&&(__nccwpck_require__.ab="//");var b={};(()=>{b.parse=function(b,c){if("string"!=typeof b)throw TypeError("argument str must be a string");for(var e={},f=b.split(d),g=(c||{}).decode||a,h=0;h<f.length;h++){var i=f[h],j=i.indexOf("=");if(!(j<0)){var k=i.substr(0,j).trim(),l=i.substr(++j,i.length).trim();'"'==l[0]&&(l=l.slice(1,-1)),void 0==e[k]&&(e[k]=function(a,b){try{return b(a)}catch(b){return a}}(l,g))}}return e},b.serialize=function(a,b,d){var f=d||{},g=f.encode||c;if("function"!=typeof g)throw TypeError("option encode is invalid");if(!e.test(a))throw TypeError("argument name is invalid");var h=g(b);if(h&&!e.test(h))throw TypeError("argument val is invalid");var i=a+"="+h;if(null!=f.maxAge){var j=f.maxAge-0;if(isNaN(j)||!isFinite(j))throw TypeError("option maxAge is invalid");i+="; Max-Age="+Math.floor(j)}if(f.domain){if(!e.test(f.domain))throw TypeError("option domain is invalid");i+="; Domain="+f.domain}if(f.path){if(!e.test(f.path))throw TypeError("option path is invalid");i+="; Path="+f.path}if(f.expires){if("function"!=typeof f.expires.toUTCString)throw TypeError("option expires is invalid");i+="; Expires="+f.expires.toUTCString()}if(f.httpOnly&&(i+="; HttpOnly"),f.secure&&(i+="; Secure"),f.sameSite)switch("string"==typeof f.sameSite?f.sameSite.toLowerCase():f.sameSite){case!0:case"strict":i+="; SameSite=Strict";break;case"lax":i+="; SameSite=Lax";break;case"none":i+="; SameSite=None";break;default:throw TypeError("option sameSite is invalid")}return i};var a=decodeURIComponent,c=encodeURIComponent,d=/; */,e=/^[\u0009\u0020-\u007e\u0080-\u00ff]+$/})(),a.exports=b})()},905:(a,b,c)=>{"use strict";Object.defineProperty(b,"__esModule",{value:!0}),!function(a,b){for(var c in b)Object.defineProperty(a,c,{enumerable:!0,get:b[c]})}(b,{interceptTestApis:function(){return f},wrapRequestHandler:function(){return g}});let d=c(201),e=c(552);function f(){return(0,e.interceptFetch)(c.g.fetch)}function g(a){return(b,c)=>(0,d.withRequest)(b,e.reader,()=>a(b,c))}}},a=>{var b=a(a.s=117);(_ENTRIES="undefined"==typeof _ENTRIES?{}:_ENTRIES)["middleware_src/middleware"]=b}]);
//# sourceMappingURL=middleware.js.map


// ============================================================
// EdgeOne Pages Edge Function Handler
// ============================================================

/**
 * 从 _ENTRIES 获取 middleware 函数
 * 支持 middleware（旧版）和 proxy（新版）两种格式
 */
async function getMiddleware() {
  const entry = _ENTRIES['middleware_src/middleware'];
  
  
  
  if (!entry) {
    throw new Error('Entry not found: middleware_src/middleware. Available entries: ' + Object.keys(_ENTRIES).join(', '));
  }
  
  // Next.js middleware/proxy 导出的是一个函数
  // entry 可能是: { default: fn } 或 { default: Promise<fn> } 或直接是 fn
  let handler;
  
  // 检查是否有 default 导出
  if (entry.default !== undefined) {
    handler = entry.default;
    
  } else if (typeof entry === 'function') {
    // entry 本身就是函数
    handler = entry;
    
  } else if ('proxy' in entry) {
    handler = entry.proxy;
    
  } else if ('middleware' in entry) {
    handler = entry.middleware;
    
  } else {
    // 尝试获取第一个函数类型的属性
    for (const key of Object.keys(entry)) {
      if (typeof entry[key] === 'function') {
        handler = entry[key];
        
        break;
      }
    }
  }
  
  // 如果 handler 是 Promise，等待它解析
  if (handler && typeof handler.then === 'function') {
    handler = await handler;
    
  }
  
  if (typeof handler !== 'function') {
    
    throw new Error('Handler is not a function. Type: ' + typeof handler + '. Entry keys: ' + Object.keys(entry).join(', '));
  }
  
  return handler;
}

/**
 * 获取 middleware 配置
 */
function getMiddlewareConfig() {
  const entry = _ENTRIES['middleware_src/middleware'];
  return entry?.config || {};
}

/**
 * 检查 URL 是否匹配 matcher 规则
 */
function matchesPath(pathname, matcher) {
  if (!matcher) return true;
  
  const matchers = Array.isArray(matcher) ? matcher : [matcher];
  
  for (const pattern of matchers) {
    if (typeof pattern === 'string') {
      const regexPattern = pattern
        .replace(/\//g, '\\/')
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '.')
        .replace(/\(([^)]+)\)/g, '(?:$1)?');
      
      const regex = new RegExp('^' + regexPattern + '$');
      if (regex.test(pathname)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * 处理 middleware 响应
 */
function handleMiddlewareResponse(response, originalRequest) {
  if (!response) {
    return new Response(null, { status: 500 });
  }

  // 检查是否需要继续到下一步
  const middlewareNext = response.headers.get('x-middleware-next');
  if (middlewareNext === '1') {
    
    return fetch(originalRequest);
  }

  // 检查是否有重写
  const rewriteUrl = response.headers.get('x-middleware-rewrite');
  if (rewriteUrl) {
    
    return fetch(rewriteUrl, {
      method: originalRequest.method,
      headers: originalRequest.headers,
      body: originalRequest.body
    });
  }

  // 返回原始响应
  return response;
}

/**
 * 处理请求的主函数
 */
async function handleRequest(request) {
  
  
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 获取 middleware 配置并检查是否匹配
    const config = getMiddlewareConfig();
    if (!matchesPath(pathname, config.matcher)) {
      
      return fetch(request);
    }

    // 获取 middleware 函数
    const middlewareFn = await getMiddleware();
    
    // 构造 Next.js middleware 期望的请求格式
    const headersObj = {};
    for (const [key, value] of request.headers.entries()) {
      headersObj[key] = value;
    }
    
    const middlewareRequest = {
      request: {
        url: request.url,
        method: request.method,
        headers: headersObj,
        body: request.body,
        nextConfig: {
          basePath: '',
          i18n: null,
          trailingSlash: false
        },
        signal: request.signal || null
      },
      page: '/middleware',
      IncrementalCache: null
    };

    console.log('[Middleware] Calling middleware function...');
    const result = await middlewareFn(middlewareRequest);

    // 调试日志 - 始终输出
    console.log('[Middleware] Result type:', typeof result);
    console.log('[Middleware] Result keys:', result ? Object.keys(result) : 'null');
    if (result && result.response) {
      console.log('[Middleware] response type:', typeof result.response);
      console.log('[Middleware] response instanceof Response:', result.response instanceof Response);
      console.log('[Middleware] response.status:', result.response.status);
      console.log('[Middleware] response.headers:', result.response.headers ? [...result.response.headers.entries()] : 'no headers');
    }

    // 处理响应
    if (result && result.response) {
      console.log('[Middleware] Handling result.response');
      return handleMiddlewareResponse(result.response, request);
    }
    
    if (result instanceof Response) {
      console.log('[Middleware] Result is Response instance');
      return handleMiddlewareResponse(result, request);
    }

    console.log('[Middleware] No valid response returned, result:', JSON.stringify(result));
    return new Response('Middleware did not return a response', { status: 500 });
    
  } catch (error) {
    console.error('[EdgeOne Middleware Error]', error);
    return new Response(
      JSON.stringify({ 
        error: 'Middleware execution failed', 
        message: error.message,
        stack: undefined
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * EdgeOne Function 入口 - addEventListener 格式
 */
addEventListener('fetch', event => {
  return event.respondWith(handleRequest(event.request));
});

