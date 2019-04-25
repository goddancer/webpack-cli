import COOKIE from 'js-cookie';
import urlParser from '@youyu/url-parser';
import crypto from 'crypto';
import MD5 from 'blueimp-md5';

const isChrome = !!navigator.userAgent.match(/((?:android.+)crmo|crios|chrome)\/([\w.]+)/i);
const isSafari = !!(navigator.userAgent.match(/version\/([\w.]+).+?(mobile\s?safari|safari)/i) || //Desktop Safari, Mobile Safari
navigator.userAgent.match(/(iphone|ipad).*applewebkit.*mobile/i)); //iOS WebView
// const isMobile = !!navigator.appVersion.match(/(android|iphone)/gi)

const REG_LEGAL_LOGIN_RNDKEY = /^[a-f0-9]{64}$/;

function forEach(obj, fn) {
  if (obj.length >= 0) {
    for (let i = 0, j = obj.length; i < j; i++) {
      fn(obj[i], i);
    }
  } else {
    for (let k in obj) {
      if (obj.hasOwnProperty(k)) {
        fn(obj[k], k);
      }
    }
  }
}

let SSO_BASE,
    ENV,
    CachedLoginRndKey,
    IframeWaitingStack = null,
    handleSafariSandBox = () => {
  let hash = location.hash,
      idx = hash.lastIndexOf("#"),
      rndkey = hash.substr(idx + 1);

  if (idx > -1 && rndkey.match(REG_LEGAL_LOGIN_RNDKEY)) {
    if (isSafari && !isChrome) {
      setLoginRandomKey(rndkey);
    }

    let realUrl = location.href.replace("#" + rndkey, "");

    if (realUrl.indexOf("#") < 0) {
      realUrl += "#"; // replace url from a.com/path#abc to a.com/path will cause a reload
    }

    location.replace(realUrl);
  }
},
    setEnv = () => {
  let domain = location.hostname,
      currentEnv = "live",
      domainPostfix = ".youyu.cn",
      regMap = {
    dev: /\.reotest\.com$/,
    qa: /-qa(\d)?\.youyu\.(?:cn|hk)$/,
    stage: /-stage\.youyu\.(?:cn|hk)$/,
    dev2: /\.yfftest\.com$/,
    dr: /-dr\.youyu\.(cn|hk)$/,
    live: /\.youyu\.(?:cn|hk)$/
  };

  for (let env in regMap) {
    if (regMap.hasOwnProperty(env)) {
      let result = domain.match(regMap[env]);

      if (result) {
        domainPostfix = result[0];

        if (env === "qa") {
          currentEnv = env + (result[1] || "");
        } else {
          currentEnv = env;
        }

        break;
      }
    }
  }

  SSO_BASE = `sso${domainPostfix}`;
  ENV = currentEnv;

  try {
    document.domain = domainPostfix.substr(domainPostfix.indexOf(".") + 1);
  } catch (ignore) {// ignore
  }

  handleSafariSandBox();
},
    getFullUrl = (subdomain, path) => {
  return `${location.protocol}//${SSO_BASE.replace("sso", subdomain)}${path ? path : ""}`;
},
    loadIframe = () => new Promise((resolve, reject) => {
  let src = `//${SSO_BASE}/proxy.htm`,
      iframe = document.querySelector('iframe[src$="' + src + '"]');

  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.name = `${SSO_BASE}_proxy`;
    iframe.src = src;
    iframe.style.display = "none";
    IframeWaitingStack = IframeWaitingStack || [];
    IframeWaitingStack.push([resolve, reject]);

    iframe.onload = function () {
      forEach(IframeWaitingStack, r => r[0](iframe));
      IframeWaitingStack = null;
    };

    iframe.onerror = function () {
      forEach(IframeWaitingStack, r => r[1](iframe));
      document.body.removeChild(iframe);
      IframeWaitingStack = [];
    };

    document.body.appendChild(iframe);
  } else {
    if (IframeWaitingStack) {
      IframeWaitingStack.push([resolve, reject]);
    } else {
      resolve(iframe);
    }
  }
}),
    setLoginRandomKey = (loginRndkey, setToSso) => {
  CachedLoginRndKey = loginRndkey;
  return new Promise(resolve => {
    try {
      if (loginRndkey !== null) {
        localStorage.setItem("loginRndkey", loginRndkey);
      } else {
        localStorage.removeItem("loginRndkey");
      }

      if (setToSso) {
        // Chrome is a kind of Safari
        // but Chrome don't have cross subdomain issue
        // only Safari from Apple (iPhone, iPad, Desktop Safari) hava cross-subdomain limit
        loadIframe().then(iframe => {
          if (loginRndkey !== null) {
            iframe.contentWindow.localStorage.setItem("rndkey", loginRndkey);
          } else {
            iframe.contentWindow.localStorage.removeItem("rndkey");
          }

          resolve();
        });
      } else {
        resolve();
      }
    } catch (ignore) {
      // reject(err)
      // 这种情况下，很可能是 safari 的隐身模式，setLoginRandomKey 会失败
      // 用户刷新页面就没有登录态了，但是，不影响当前页面的使用，仍然 resolve
      resolve();
    }
  });
},
    getLoginRandomKey = () => new Promise(resolve => {
  if (CachedLoginRndKey) {
    resolve(CachedLoginRndKey);
    return;
  }

  let localRndKey = localStorage.getItem("loginRndkey");

  if (isSafari && !isChrome && ENV !== "local" && ENV !== "dev") {
    resolve(localRndKey);
  } else {
    loadIframe().then(iframe => {
      let ssoRndKey = iframe.contentWindow.localStorage.getItem("rndkey"); // TODO 如果不一致，可以考虑通过访问接口来判断正确

      if (!localRndKey) {
        //主要信任本地 key
        resolve(ssoRndKey);
      } else {
        resolve(localRndKey);
      }
    }).catch(() => {
      resolve(localRndKey);
    });
  }
}),
    getSession = () => ({
  session: COOKIE.get("session"),
  uin: COOKIE.get("uin")
}),
    isLogin = () => new Promise((resolve, reject) => {
  getLoginRandomKey().then(loginRndkey => {
    const {
      session,
      uin
    } = getSession();

    if (!session || !loginRndkey || !uin) {
      logout().then(reject);
    } else {
      setLoginRandomKey(loginRndkey, true);
      resolve({
        uin,
        session,
        loginRndkey
      });
    }
  }, reject);
}),

/*
 * signUp => logout, 注册登陆。默认会先执行logout清空登陆态
 * @param { string } redirectUrl - 注册后需要重定向返回的链接，可以携带query参数
 * @param { boolean } isLogin - 预留参数
 * @param { object= } options - 可选载荷。不写时等同于login => logout
 * @param { string= } options.sendQueryStr - 可选参数。业务层拟定query-string，优先级高于sendQuery
 * @param { object= } options.sendQuery - 可选参数。发送给登陆页的参数
 * @param { object= } options.backQuery - 可选参数。重定向时携带的参数
 * */
logout = (redirectUrl, isLogin, options) => {
  options = options || {};
  options.sendQuery = options.sendQuery || {};
  options.backQuery = options.backQuery || {};
  let parse = urlParser.parse(redirectUrl),
      urlQuery = urlParser.getMapByUrlStr(parse.search),
      backQuery = Object.assign(urlQuery, options.backQuery),
      domain = "." + document.domain,
      sRedirect,
      outUrl;

  if (Object.keys(backQuery).length > 0) {
    sRedirect = `${parse.protocol}//${parse.host}${parse.pathname}?${urlParser.getUrlByMap(backQuery)}`;
    sRedirect = `redirect=${encodeURIComponent(sRedirect)}`;
  } else {
    sRedirect = `${parse.protocol}//${parse.host}${parse.pathname}`;
    sRedirect = `redirect=${encodeURIComponent(sRedirect)}`;
  }

  if (options.sendQueryStr) {
    outUrl = getFullUrl("m", `/signup/?${options.sendQueryStr}&${sRedirect}#!/signup`);
  } else if (Object.keys(options.sendQuery).length > 0) {
    outUrl = getFullUrl("m", `/signup/?${urlParser.getUrlByMap(options.sendQuery)}&${sRedirect}#!/signup`);
  } else {
    outUrl = getFullUrl("m", `/signup/?${sRedirect}#!/login`);
  } // outUrl = isMobile ?
  // getFullUrl('m', `/signup/?${sRedirect}#!/login`) :
  // getFullUrl('login', `/login/#!/${isLogin ? 'login' : 'logout'}?${sRedirect}`)


  COOKIE.remove("session", {
    domain: domain
  });
  COOKIE.remove("uin", {
    domain: domain
  });
  return new Promise(resolve => {
    let done = () => {
      if (redirectUrl) {
        setTimeout(() => {
          location.href = outUrl;
        }, 1);
      }
    };

    setLoginRandomKey(null, true).then(() => {
      done();
      resolve();
    }, () => {
      done();
      resolve();
    });
  });
},
    login = redirectUrl => logout(redirectUrl, true),
    signUp = (redirectUrl, options) => logout(redirectUrl, true, options),
    init = () => {
  setEnv();
};

var yfBasicLogin = {
  // rollup-tree-shaking pure
  setEnv,
  getSession,
  getFullUrl,
  setLoginRandomKey,
  getLoginRandomKey,
  isLogin,
  login,
  logout,
  signUp,
  init
};

function createCommonjsModule(fn, module) {
  return module = {
    exports: {}
  }, fn(module, module.exports), module.exports;
}

var sjcl_1 = createCommonjsModule(function (module) {
  var sjcl = {
    cipher: {},
    hash: {},
    keyexchange: {},
    mode: {},
    misc: {},
    codec: {},
    exception: {
      corrupt: function (a) {
        this.toString = function () {
          return "CORRUPT: " + this.message;
        };

        this.message = a;
      },
      invalid: function (a) {
        this.toString = function () {
          return "INVALID: " + this.message;
        };

        this.message = a;
      },
      bug: function (a) {
        this.toString = function () {
          return "BUG: " + this.message;
        };

        this.message = a;
      },
      notReady: function (a) {
        this.toString = function () {
          return "NOT READY: " + this.message;
        };

        this.message = a;
      }
    }
  };

  sjcl.cipher.aes = function (a) {
    this.s[0][0][0] || this.O();
    var b,
        c,
        d,
        e,
        f = this.s[0][4],
        g = this.s[1];
    b = a.length;
    var h = 1;
    if (4 !== b && 6 !== b && 8 !== b) throw new sjcl.exception.invalid("invalid aes key size");
    this.b = [d = a.slice(0), e = []];

    for (a = b; a < 4 * b + 28; a++) {
      c = d[a - 1];
      if (0 === a % b || 8 === b && 4 === a % b) c = f[c >>> 24] << 24 ^ f[c >> 16 & 255] << 16 ^ f[c >> 8 & 255] << 8 ^ f[c & 255], 0 === a % b && (c = c << 8 ^ c >>> 24 ^ h << 24, h = h << 1 ^ 283 * (h >> 7));
      d[a] = d[a - b] ^ c;
    }

    for (b = 0; a; b++, a--) c = d[b & 3 ? a : a - 4], e[b] = 4 >= a || 4 > b ? c : g[0][f[c >>> 24]] ^ g[1][f[c >> 16 & 255]] ^ g[2][f[c >> 8 & 255]] ^ g[3][f[c & 255]];
  };

  sjcl.cipher.aes.prototype = {
    encrypt: function (a) {
      return t(this, a, 0);
    },
    decrypt: function (a) {
      return t(this, a, 1);
    },
    s: [[[], [], [], [], []], [[], [], [], [], []]],
    O: function () {
      var a = this.s[0],
          b = this.s[1],
          c = a[4],
          d = b[4],
          e,
          f,
          g,
          h = [],
          k = [],
          l,
          n,
          m,
          p;

      for (e = 0; 0x100 > e; e++) k[(h[e] = e << 1 ^ 283 * (e >> 7)) ^ e] = e;

      for (f = g = 0; !c[f]; f ^= l || 1, g = k[g] || 1) for (m = g ^ g << 1 ^ g << 2 ^ g << 3 ^ g << 4, m = m >> 8 ^ m & 255 ^ 99, c[f] = m, d[m] = f, n = h[e = h[l = h[f]]], p = 0x1010101 * n ^ 0x10001 * e ^ 0x101 * l ^ 0x1010100 * f, n = 0x101 * h[m] ^ 0x1010100 * m, e = 0; 4 > e; e++) a[e][f] = n = n << 24 ^ n >>> 8, b[e][m] = p = p << 24 ^ p >>> 8;

      for (e = 0; 5 > e; e++) a[e] = a[e].slice(0), b[e] = b[e].slice(0);
    }
  };

  function t(a, b, c) {
    if (4 !== b.length) throw new sjcl.exception.invalid("invalid aes block size");
    var d = a.b[c],
        e = b[0] ^ d[0],
        f = b[c ? 3 : 1] ^ d[1],
        g = b[2] ^ d[2];
    b = b[c ? 1 : 3] ^ d[3];
    var h,
        k,
        l,
        n = d.length / 4 - 2,
        m,
        p = 4,
        r = [0, 0, 0, 0];
    h = a.s[c];
    a = h[0];
    var q = h[1],
        v = h[2],
        w = h[3],
        x = h[4];

    for (m = 0; m < n; m++) h = a[e >>> 24] ^ q[f >> 16 & 255] ^ v[g >> 8 & 255] ^ w[b & 255] ^ d[p], k = a[f >>> 24] ^ q[g >> 16 & 255] ^ v[b >> 8 & 255] ^ w[e & 255] ^ d[p + 1], l = a[g >>> 24] ^ q[b >> 16 & 255] ^ v[e >> 8 & 255] ^ w[f & 255] ^ d[p + 2], b = a[b >>> 24] ^ q[e >> 16 & 255] ^ v[f >> 8 & 255] ^ w[g & 255] ^ d[p + 3], p += 4, e = h, f = k, g = l;

    for (m = 0; 4 > m; m++) r[c ? 3 & -m : m] = x[e >>> 24] << 24 ^ x[f >> 16 & 255] << 16 ^ x[g >> 8 & 255] << 8 ^ x[b & 255] ^ d[p++], h = e, e = f, f = g, g = b, b = h;

    return r;
  }

  sjcl.bitArray = {
    bitSlice: function (a, b, c) {
      a = sjcl.bitArray.$(a.slice(b / 32), 32 - (b & 31)).slice(1);
      return void 0 === c ? a : sjcl.bitArray.clamp(a, c - b);
    },
    extract: function (a, b, c) {
      var d = Math.floor(-b - c & 31);
      return ((b + c - 1 ^ b) & -32 ? a[b / 32 | 0] << 32 - d ^ a[b / 32 + 1 | 0] >>> d : a[b / 32 | 0] >>> d) & (1 << c) - 1;
    },
    concat: function (a, b) {
      if (0 === a.length || 0 === b.length) return a.concat(b);
      var c = a[a.length - 1],
          d = sjcl.bitArray.getPartial(c);
      return 32 === d ? a.concat(b) : sjcl.bitArray.$(b, d, c | 0, a.slice(0, a.length - 1));
    },
    bitLength: function (a) {
      var b = a.length;
      return 0 === b ? 0 : 32 * (b - 1) + sjcl.bitArray.getPartial(a[b - 1]);
    },
    clamp: function (a, b) {
      if (32 * a.length < b) return a;
      a = a.slice(0, Math.ceil(b / 32));
      var c = a.length;
      b = b & 31;
      0 < c && b && (a[c - 1] = sjcl.bitArray.partial(b, a[c - 1] & 2147483648 >> b - 1, 1));
      return a;
    },
    partial: function (a, b, c) {
      return 32 === a ? b : (c ? b | 0 : b << 32 - a) + 0x10000000000 * a;
    },
    getPartial: function (a) {
      return Math.round(a / 0x10000000000) || 32;
    },
    equal: function (a, b) {
      if (sjcl.bitArray.bitLength(a) !== sjcl.bitArray.bitLength(b)) return !1;
      var c = 0,
          d;

      for (d = 0; d < a.length; d++) c |= a[d] ^ b[d];

      return 0 === c;
    },
    $: function (a, b, c, d) {
      var e;
      e = 0;

      for (void 0 === d && (d = []); 32 <= b; b -= 32) d.push(c), c = 0;

      if (0 === b) return d.concat(a);

      for (e = 0; e < a.length; e++) d.push(c | a[e] >>> b), c = a[e] << 32 - b;

      e = a.length ? a[a.length - 1] : 0;
      a = sjcl.bitArray.getPartial(e);
      d.push(sjcl.bitArray.partial(b + a & 31, 32 < b + a ? c : d.pop(), 1));
      return d;
    },
    f: function (a, b) {
      return [a[0] ^ b[0], a[1] ^ b[1], a[2] ^ b[2], a[3] ^ b[3]];
    },
    byteswapM: function (a) {
      var b, c;

      for (b = 0; b < a.length; ++b) c = a[b], a[b] = c >>> 24 | c >>> 8 & 0xff00 | (c & 0xff00) << 8 | c << 24;

      return a;
    }
  };
  sjcl.codec.utf8String = {
    fromBits: function (a) {
      var b = "",
          c = sjcl.bitArray.bitLength(a),
          d,
          e;

      for (d = 0; d < c / 8; d++) 0 === (d & 3) && (e = a[d / 4]), b += String.fromCharCode(e >>> 8 >>> 8 >>> 8), e <<= 8;

      return decodeURIComponent(escape(b));
    },
    toBits: function (a) {
      a = unescape(encodeURIComponent(a));
      var b = [],
          c,
          d = 0;

      for (c = 0; c < a.length; c++) d = d << 8 | a.charCodeAt(c), 3 === (c & 3) && (b.push(d), d = 0);

      c & 3 && b.push(sjcl.bitArray.partial(8 * (c & 3), d));
      return b;
    }
  };
  sjcl.codec.hex = {
    fromBits: function (a) {
      var b = "",
          c;

      for (c = 0; c < a.length; c++) b += ((a[c] | 0) + 0xf00000000000).toString(16).substr(4);

      return b.substr(0, sjcl.bitArray.bitLength(a) / 4);
    },
    toBits: function (a) {
      var b,
          c = [],
          d;
      a = a.replace(/\s|0x/g, "");
      d = a.length;
      a = a + "00000000";

      for (b = 0; b < a.length; b += 8) c.push(parseInt(a.substr(b, 8), 16) ^ 0);

      return sjcl.bitArray.clamp(c, 4 * d);
    }
  };
  sjcl.codec.base32 = {
    B: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
    X: "0123456789ABCDEFGHIJKLMNOPQRSTUV",
    BITS: 32,
    BASE: 5,
    REMAINING: 27,
    fromBits: function (a, b, c) {
      var d = sjcl.codec.base32.BASE,
          e = sjcl.codec.base32.REMAINING,
          f = "",
          g = 0,
          h = sjcl.codec.base32.B,
          k = 0,
          l = sjcl.bitArray.bitLength(a);
      c && (h = sjcl.codec.base32.X);

      for (c = 0; f.length * d < l;) f += h.charAt((k ^ a[c] >>> g) >>> e), g < d ? (k = a[c] << d - g, g += e, c++) : (k <<= d, g -= d);

      for (; f.length & 7 && !b;) f += "=";

      return f;
    },
    toBits: function (a, b) {
      a = a.replace(/\s|=/g, "").toUpperCase();
      var c = sjcl.codec.base32.BITS,
          d = sjcl.codec.base32.BASE,
          e = sjcl.codec.base32.REMAINING,
          f = [],
          g,
          h = 0,
          k = sjcl.codec.base32.B,
          l = 0,
          n,
          m = "base32";
      b && (k = sjcl.codec.base32.X, m = "base32hex");

      for (g = 0; g < a.length; g++) {
        n = k.indexOf(a.charAt(g));

        if (0 > n) {
          if (!b) try {
            return sjcl.codec.base32hex.toBits(a);
          } catch (p) {}
          throw new sjcl.exception.invalid("this isn't " + m + "!");
        }

        h > e ? (h -= e, f.push(l ^ n >>> h), l = n << c - h) : (h += d, l ^= n << c - h);
      }

      h & 56 && f.push(sjcl.bitArray.partial(h & 56, l, 1));
      return f;
    }
  };
  sjcl.codec.base32hex = {
    fromBits: function (a, b) {
      return sjcl.codec.base32.fromBits(a, b, 1);
    },
    toBits: function (a) {
      return sjcl.codec.base32.toBits(a, 1);
    }
  };
  sjcl.codec.base64 = {
    B: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
    fromBits: function (a, b, c) {
      var d = "",
          e = 0,
          f = sjcl.codec.base64.B,
          g = 0,
          h = sjcl.bitArray.bitLength(a);
      c && (f = f.substr(0, 62) + "-_");

      for (c = 0; 6 * d.length < h;) d += f.charAt((g ^ a[c] >>> e) >>> 26), 6 > e ? (g = a[c] << 6 - e, e += 26, c++) : (g <<= 6, e -= 6);

      for (; d.length & 3 && !b;) d += "=";

      return d;
    },
    toBits: function (a, b) {
      a = a.replace(/\s|=/g, "");
      var c = [],
          d,
          e = 0,
          f = sjcl.codec.base64.B,
          g = 0,
          h;
      b && (f = f.substr(0, 62) + "-_");

      for (d = 0; d < a.length; d++) {
        h = f.indexOf(a.charAt(d));
        if (0 > h) throw new sjcl.exception.invalid("this isn't base64!");
        26 < e ? (e -= 26, c.push(g ^ h >>> e), g = h << 32 - e) : (e += 6, g ^= h << 32 - e);
      }

      e & 56 && c.push(sjcl.bitArray.partial(e & 56, g, 1));
      return c;
    }
  };
  sjcl.codec.base64url = {
    fromBits: function (a) {
      return sjcl.codec.base64.fromBits(a, 1, 1);
    },
    toBits: function (a) {
      return sjcl.codec.base64.toBits(a, 1);
    }
  };

  sjcl.hash.sha256 = function (a) {
    this.b[0] || this.O();
    a ? (this.F = a.F.slice(0), this.A = a.A.slice(0), this.l = a.l) : this.reset();
  };

  sjcl.hash.sha256.hash = function (a) {
    return new sjcl.hash.sha256().update(a).finalize();
  };

  sjcl.hash.sha256.prototype = {
    blockSize: 512,
    reset: function () {
      this.F = this.Y.slice(0);
      this.A = [];
      this.l = 0;
      return this;
    },
    update: function (a) {
      "string" === typeof a && (a = sjcl.codec.utf8String.toBits(a));
      var b,
          c = this.A = sjcl.bitArray.concat(this.A, a);
      b = this.l;
      a = this.l = b + sjcl.bitArray.bitLength(a);
      if (0x1fffffffffffff < a) throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits");

      if ("undefined" !== typeof Uint32Array) {
        var d = new Uint32Array(c),
            e = 0;

        for (b = 512 + b - (512 + b & 0x1ff); b <= a; b += 512) u(this, d.subarray(16 * e, 16 * (e + 1))), e += 1;

        c.splice(0, 16 * e);
      } else for (b = 512 + b - (512 + b & 0x1ff); b <= a; b += 512) u(this, c.splice(0, 16));

      return this;
    },
    finalize: function () {
      var a,
          b = this.A,
          c = this.F,
          b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(1, 1)]);

      for (a = b.length + 2; a & 15; a++) b.push(0);

      b.push(Math.floor(this.l / 0x100000000));

      for (b.push(this.l | 0); b.length;) u(this, b.splice(0, 16));

      this.reset();
      return c;
    },
    Y: [],
    b: [],
    O: function () {
      function a(a) {
        return 0x100000000 * (a - Math.floor(a)) | 0;
      }

      for (var b = 0, c = 2, d, e; 64 > b; c++) {
        e = !0;

        for (d = 2; d * d <= c; d++) if (0 === c % d) {
          e = !1;
          break;
        }

        e && (8 > b && (this.Y[b] = a(Math.pow(c, 0.5))), this.b[b] = a(Math.pow(c, 1 / 3)), b++);
      }
    }
  };

  function u(a, b) {
    var c,
        d,
        e,
        f = a.F,
        g = a.b,
        h = f[0],
        k = f[1],
        l = f[2],
        n = f[3],
        m = f[4],
        p = f[5],
        r = f[6],
        q = f[7];

    for (c = 0; 64 > c; c++) 16 > c ? d = b[c] : (d = b[c + 1 & 15], e = b[c + 14 & 15], d = b[c & 15] = (d >>> 7 ^ d >>> 18 ^ d >>> 3 ^ d << 25 ^ d << 14) + (e >>> 17 ^ e >>> 19 ^ e >>> 10 ^ e << 15 ^ e << 13) + b[c & 15] + b[c + 9 & 15] | 0), d = d + q + (m >>> 6 ^ m >>> 11 ^ m >>> 25 ^ m << 26 ^ m << 21 ^ m << 7) + (r ^ m & (p ^ r)) + g[c], q = r, r = p, p = m, m = n + d | 0, n = l, l = k, k = h, h = d + (k & l ^ n & (k ^ l)) + (k >>> 2 ^ k >>> 13 ^ k >>> 22 ^ k << 30 ^ k << 19 ^ k << 10) | 0;

    f[0] = f[0] + h | 0;
    f[1] = f[1] + k | 0;
    f[2] = f[2] + l | 0;
    f[3] = f[3] + n | 0;
    f[4] = f[4] + m | 0;
    f[5] = f[5] + p | 0;
    f[6] = f[6] + r | 0;
    f[7] = f[7] + q | 0;
  }

  sjcl.mode.ccm = {
    name: "ccm",
    G: [],
    listenProgress: function (a) {
      sjcl.mode.ccm.G.push(a);
    },
    unListenProgress: function (a) {
      a = sjcl.mode.ccm.G.indexOf(a);
      -1 < a && sjcl.mode.ccm.G.splice(a, 1);
    },
    fa: function (a) {
      var b = sjcl.mode.ccm.G.slice(),
          c;

      for (c = 0; c < b.length; c += 1) b[c](a);
    },
    encrypt: function (a, b, c, d, e) {
      var f,
          g = b.slice(0),
          h = sjcl.bitArray,
          k = h.bitLength(c) / 8,
          l = h.bitLength(g) / 8;
      e = e || 64;
      d = d || [];
      if (7 > k) throw new sjcl.exception.invalid("ccm: iv must be at least 7 bytes");

      for (f = 2; 4 > f && l >>> 8 * f; f++);

      f < 15 - k && (f = 15 - k);
      c = h.clamp(c, 8 * (15 - f));
      b = sjcl.mode.ccm.V(a, b, c, d, e, f);
      g = sjcl.mode.ccm.C(a, g, c, b, e, f);
      return h.concat(g.data, g.tag);
    },
    decrypt: function (a, b, c, d, e) {
      e = e || 64;
      d = d || [];
      var f = sjcl.bitArray,
          g = f.bitLength(c) / 8,
          h = f.bitLength(b),
          k = f.clamp(b, h - e),
          l = f.bitSlice(b, h - e),
          h = (h - e) / 8;
      if (7 > g) throw new sjcl.exception.invalid("ccm: iv must be at least 7 bytes");

      for (b = 2; 4 > b && h >>> 8 * b; b++);

      b < 15 - g && (b = 15 - g);
      c = f.clamp(c, 8 * (15 - b));
      k = sjcl.mode.ccm.C(a, k, c, l, e, b);
      a = sjcl.mode.ccm.V(a, k.data, c, d, e, b);
      if (!f.equal(k.tag, a)) throw new sjcl.exception.corrupt("ccm: tag doesn't match");
      return k.data;
    },
    na: function (a, b, c, d, e, f) {
      var g = [],
          h = sjcl.bitArray,
          k = h.f;
      d = [h.partial(8, (b.length ? 64 : 0) | d - 2 << 2 | f - 1)];
      d = h.concat(d, c);
      d[3] |= e;
      d = a.encrypt(d);
      if (b.length) for (c = h.bitLength(b) / 8, 65279 >= c ? g = [h.partial(16, c)] : 0xffffffff >= c && (g = h.concat([h.partial(16, 65534)], [c])), g = h.concat(g, b), b = 0; b < g.length; b += 4) d = a.encrypt(k(d, g.slice(b, b + 4).concat([0, 0, 0])));
      return d;
    },
    V: function (a, b, c, d, e, f) {
      var g = sjcl.bitArray,
          h = g.f;
      e /= 8;
      if (e % 2 || 4 > e || 16 < e) throw new sjcl.exception.invalid("ccm: invalid tag length");
      if (0xffffffff < d.length || 0xffffffff < b.length) throw new sjcl.exception.bug("ccm: can't deal with 4GiB or more data");
      c = sjcl.mode.ccm.na(a, d, c, e, g.bitLength(b) / 8, f);

      for (d = 0; d < b.length; d += 4) c = a.encrypt(h(c, b.slice(d, d + 4).concat([0, 0, 0])));

      return g.clamp(c, 8 * e);
    },
    C: function (a, b, c, d, e, f) {
      var g,
          h = sjcl.bitArray;
      g = h.f;
      var k = b.length,
          l = h.bitLength(b),
          n = k / 50,
          m = n;
      c = h.concat([h.partial(8, f - 1)], c).concat([0, 0, 0]).slice(0, 4);
      d = h.bitSlice(g(d, a.encrypt(c)), 0, e);
      if (!k) return {
        tag: d,
        data: []
      };

      for (g = 0; g < k; g += 4) g > n && (sjcl.mode.ccm.fa(g / k), n += m), c[3]++, e = a.encrypt(c), b[g] ^= e[0], b[g + 1] ^= e[1], b[g + 2] ^= e[2], b[g + 3] ^= e[3];

      return {
        tag: d,
        data: h.clamp(b, l)
      };
    }
  };
  void 0 === sjcl.beware && (sjcl.beware = {});

  sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."] = function () {
    sjcl.mode.cbc = {
      name: "cbc",
      encrypt: function (a, b, c, d) {
        if (d && d.length) throw new sjcl.exception.invalid("cbc can't authenticate data");
        if (128 !== sjcl.bitArray.bitLength(c)) throw new sjcl.exception.invalid("cbc iv must be 128 bits");
        var e = sjcl.bitArray,
            f = e.f,
            g = e.bitLength(b),
            h = 0,
            k = [];
        if (g & 7) throw new sjcl.exception.invalid("pkcs#5 padding only works for multiples of a byte");

        for (d = 0; h + 128 <= g; d += 4, h += 128) c = a.encrypt(f(c, b.slice(d, d + 4))), k.splice(d, 0, c[0], c[1], c[2], c[3]);

        g = 0x1010101 * (16 - (g >> 3 & 15));
        c = a.encrypt(f(c, e.concat(b, [g, g, g, g]).slice(d, d + 4)));
        k.splice(d, 0, c[0], c[1], c[2], c[3]);
        return k;
      },
      decrypt: function (a, b, c, d) {
        if (d && d.length) throw new sjcl.exception.invalid("cbc can't authenticate data");
        if (128 !== sjcl.bitArray.bitLength(c)) throw new sjcl.exception.invalid("cbc iv must be 128 bits");
        if (sjcl.bitArray.bitLength(b) & 127 || !b.length) throw new sjcl.exception.corrupt("cbc ciphertext must be a positive multiple of the block size");
        var e = sjcl.bitArray,
            f = e.f,
            g,
            h = [];

        for (d = 0; d < b.length; d += 4) g = b.slice(d, d + 4), c = f(c, a.decrypt(g)), h.splice(d, 0, c[0], c[1], c[2], c[3]), c = g;

        g = h[d - 1] & 255;
        if (0 === g || 16 < g) throw new sjcl.exception.corrupt("pkcs#5 padding corrupt");
        c = 0x1010101 * g;
        if (!e.equal(e.bitSlice([c, c, c, c], 0, 8 * g), e.bitSlice(h, 32 * h.length - 8 * g, 32 * h.length))) throw new sjcl.exception.corrupt("pkcs#5 padding corrupt");
        return e.bitSlice(h, 0, 32 * h.length - 8 * g);
      }
    };
  };

  sjcl.mode.ocb2 = {
    name: "ocb2",
    encrypt: function (a, b, c, d, e, f) {
      if (128 !== sjcl.bitArray.bitLength(c)) throw new sjcl.exception.invalid("ocb iv must be 128 bits");
      var g,
          h = sjcl.mode.ocb2.S,
          k = sjcl.bitArray,
          l = k.f,
          n = [0, 0, 0, 0];
      c = h(a.encrypt(c));
      var m,
          p = [];
      d = d || [];
      e = e || 64;

      for (g = 0; g + 4 < b.length; g += 4) m = b.slice(g, g + 4), n = l(n, m), p = p.concat(l(c, a.encrypt(l(c, m)))), c = h(c);

      m = b.slice(g);
      b = k.bitLength(m);
      g = a.encrypt(l(c, [0, 0, 0, b]));
      m = k.clamp(l(m.concat([0, 0, 0]), g), b);
      n = l(n, l(m.concat([0, 0, 0]), g));
      n = a.encrypt(l(n, l(c, h(c))));
      d.length && (n = l(n, f ? d : sjcl.mode.ocb2.pmac(a, d)));
      return p.concat(k.concat(m, k.clamp(n, e)));
    },
    decrypt: function (a, b, c, d, e, f) {
      if (128 !== sjcl.bitArray.bitLength(c)) throw new sjcl.exception.invalid("ocb iv must be 128 bits");
      e = e || 64;
      var g = sjcl.mode.ocb2.S,
          h = sjcl.bitArray,
          k = h.f,
          l = [0, 0, 0, 0],
          n = g(a.encrypt(c)),
          m,
          p,
          r = sjcl.bitArray.bitLength(b) - e,
          q = [];
      d = d || [];

      for (c = 0; c + 4 < r / 32; c += 4) m = k(n, a.decrypt(k(n, b.slice(c, c + 4)))), l = k(l, m), q = q.concat(m), n = g(n);

      p = r - 32 * c;
      m = a.encrypt(k(n, [0, 0, 0, p]));
      m = k(m, h.clamp(b.slice(c), p).concat([0, 0, 0]));
      l = k(l, m);
      l = a.encrypt(k(l, k(n, g(n))));
      d.length && (l = k(l, f ? d : sjcl.mode.ocb2.pmac(a, d)));
      if (!h.equal(h.clamp(l, e), h.bitSlice(b, r))) throw new sjcl.exception.corrupt("ocb: tag doesn't match");
      return q.concat(h.clamp(m, p));
    },
    pmac: function (a, b) {
      var c,
          d = sjcl.mode.ocb2.S,
          e = sjcl.bitArray,
          f = e.f,
          g = [0, 0, 0, 0],
          h = a.encrypt([0, 0, 0, 0]),
          h = f(h, d(d(h)));

      for (c = 0; c + 4 < b.length; c += 4) h = d(h), g = f(g, a.encrypt(f(h, b.slice(c, c + 4))));

      c = b.slice(c);
      128 > e.bitLength(c) && (h = f(h, d(h)), c = e.concat(c, [-2147483648, 0, 0, 0]));
      g = f(g, c);
      return a.encrypt(f(d(f(h, d(h))), g));
    },
    S: function (a) {
      return [a[0] << 1 ^ a[1] >>> 31, a[1] << 1 ^ a[2] >>> 31, a[2] << 1 ^ a[3] >>> 31, a[3] << 1 ^ 135 * (a[0] >>> 31)];
    }
  };
  sjcl.mode.gcm = {
    name: "gcm",
    encrypt: function (a, b, c, d, e) {
      var f = b.slice(0);
      b = sjcl.bitArray;
      d = d || [];
      a = sjcl.mode.gcm.C(!0, a, f, d, c, e || 128);
      return b.concat(a.data, a.tag);
    },
    decrypt: function (a, b, c, d, e) {
      var f = b.slice(0),
          g = sjcl.bitArray,
          h = g.bitLength(f);
      e = e || 128;
      d = d || [];
      e <= h ? (b = g.bitSlice(f, h - e), f = g.bitSlice(f, 0, h - e)) : (b = f, f = []);
      a = sjcl.mode.gcm.C(!1, a, f, d, c, e);
      if (!g.equal(a.tag, b)) throw new sjcl.exception.corrupt("gcm: tag doesn't match");
      return a.data;
    },
    ka: function (a, b) {
      var c,
          d,
          e,
          f,
          g,
          h = sjcl.bitArray.f;
      e = [0, 0, 0, 0];
      f = b.slice(0);

      for (c = 0; 128 > c; c++) {
        (d = 0 !== (a[Math.floor(c / 32)] & 1 << 31 - c % 32)) && (e = h(e, f));
        g = 0 !== (f[3] & 1);

        for (d = 3; 0 < d; d--) f[d] = f[d] >>> 1 | (f[d - 1] & 1) << 31;

        f[0] >>>= 1;
        g && (f[0] ^= -0x1f000000);
      }

      return e;
    },
    j: function (a, b, c) {
      var d,
          e = c.length;
      b = b.slice(0);

      for (d = 0; d < e; d += 4) b[0] ^= 0xffffffff & c[d], b[1] ^= 0xffffffff & c[d + 1], b[2] ^= 0xffffffff & c[d + 2], b[3] ^= 0xffffffff & c[d + 3], b = sjcl.mode.gcm.ka(b, a);

      return b;
    },
    C: function (a, b, c, d, e, f) {
      var g,
          h,
          k,
          l,
          n,
          m,
          p,
          r,
          q = sjcl.bitArray;
      m = c.length;
      p = q.bitLength(c);
      r = q.bitLength(d);
      h = q.bitLength(e);
      g = b.encrypt([0, 0, 0, 0]);
      96 === h ? (e = e.slice(0), e = q.concat(e, [1])) : (e = sjcl.mode.gcm.j(g, [0, 0, 0, 0], e), e = sjcl.mode.gcm.j(g, e, [0, 0, Math.floor(h / 0x100000000), h & 0xffffffff]));
      h = sjcl.mode.gcm.j(g, [0, 0, 0, 0], d);
      n = e.slice(0);
      d = h.slice(0);
      a || (d = sjcl.mode.gcm.j(g, h, c));

      for (l = 0; l < m; l += 4) n[3]++, k = b.encrypt(n), c[l] ^= k[0], c[l + 1] ^= k[1], c[l + 2] ^= k[2], c[l + 3] ^= k[3];

      c = q.clamp(c, p);
      a && (d = sjcl.mode.gcm.j(g, h, c));
      a = [Math.floor(r / 0x100000000), r & 0xffffffff, Math.floor(p / 0x100000000), p & 0xffffffff];
      d = sjcl.mode.gcm.j(g, d, a);
      k = b.encrypt(e);
      d[0] ^= k[0];
      d[1] ^= k[1];
      d[2] ^= k[2];
      d[3] ^= k[3];
      return {
        tag: q.bitSlice(d, 0, f),
        data: c
      };
    }
  };

  sjcl.misc.hmac = function (a, b) {
    this.W = b = b || sjcl.hash.sha256;
    var c = [[], []],
        d,
        e = b.prototype.blockSize / 32;
    this.w = [new b(), new b()];
    a.length > e && (a = b.hash(a));

    for (d = 0; d < e; d++) c[0][d] = a[d] ^ 909522486, c[1][d] = a[d] ^ 1549556828;

    this.w[0].update(c[0]);
    this.w[1].update(c[1]);
    this.R = new b(this.w[0]);
  };

  sjcl.misc.hmac.prototype.encrypt = sjcl.misc.hmac.prototype.mac = function (a) {
    if (this.aa) throw new sjcl.exception.invalid("encrypt on already updated hmac called!");
    this.update(a);
    return this.digest(a);
  };

  sjcl.misc.hmac.prototype.reset = function () {
    this.R = new this.W(this.w[0]);
    this.aa = !1;
  };

  sjcl.misc.hmac.prototype.update = function (a) {
    this.aa = !0;
    this.R.update(a);
  };

  sjcl.misc.hmac.prototype.digest = function () {
    var a = this.R.finalize(),
        a = new this.W(this.w[1]).update(a).finalize();
    this.reset();
    return a;
  };

  sjcl.misc.pbkdf2 = function (a, b, c, d, e) {
    c = c || 1e4;
    if (0 > d || 0 > c) throw new sjcl.exception.invalid("invalid params to pbkdf2");
    "string" === typeof a && (a = sjcl.codec.utf8String.toBits(a));
    "string" === typeof b && (b = sjcl.codec.utf8String.toBits(b));
    e = e || sjcl.misc.hmac;
    a = new e(a);
    var f,
        g,
        h,
        k,
        l = [],
        n = sjcl.bitArray;

    for (k = 1; 32 * l.length < (d || 1); k++) {
      e = f = a.encrypt(n.concat(b, [k]));

      for (g = 1; g < c; g++) for (f = a.encrypt(f), h = 0; h < f.length; h++) e[h] ^= f[h];

      l = l.concat(e);
    }

    d && (l = n.clamp(l, d));
    return l;
  };

  sjcl.prng = function (a) {
    this.c = [new sjcl.hash.sha256()];
    this.m = [0];
    this.P = 0;
    this.H = {};
    this.N = 0;
    this.U = {};
    this.Z = this.g = this.o = this.ha = 0;
    this.b = [0, 0, 0, 0, 0, 0, 0, 0];
    this.i = [0, 0, 0, 0];
    this.L = void 0;
    this.M = a;
    this.D = !1;
    this.K = {
      progress: {},
      seeded: {}
    };
    this.u = this.ga = 0;
    this.I = 1;
    this.J = 2;
    this.ca = 0x10000;
    this.T = [0, 48, 64, 96, 128, 192, 0x100, 384, 512, 768, 1024];
    this.da = 3e4;
    this.ba = 80;
  };

  sjcl.prng.prototype = {
    randomWords: function (a, b) {
      var c = [],
          d;
      d = this.isReady(b);
      var e;
      if (d === this.u) throw new sjcl.exception.notReady("generator isn't seeded");

      if (d & this.J) {
        d = !(d & this.I);
        e = [];
        var f = 0,
            g;
        this.Z = e[0] = new Date().valueOf() + this.da;

        for (g = 0; 16 > g; g++) e.push(0x100000000 * Math.random() | 0);

        for (g = 0; g < this.c.length && (e = e.concat(this.c[g].finalize()), f += this.m[g], this.m[g] = 0, d || !(this.P & 1 << g)); g++);

        this.P >= 1 << this.c.length && (this.c.push(new sjcl.hash.sha256()), this.m.push(0));
        this.g -= f;
        f > this.o && (this.o = f);
        this.P++;
        this.b = sjcl.hash.sha256.hash(this.b.concat(e));
        this.L = new sjcl.cipher.aes(this.b);

        for (d = 0; 4 > d && (this.i[d] = this.i[d] + 1 | 0, !this.i[d]); d++);
      }

      for (d = 0; d < a; d += 4) 0 === (d + 1) % this.ca && y(this), e = z(this), c.push(e[0], e[1], e[2], e[3]);

      y(this);
      return c.slice(0, a);
    },
    setDefaultParanoia: function (a, b) {
      if (0 === a && "Setting paranoia=0 will ruin your security; use it only for testing" !== b) throw new sjcl.exception.invalid("Setting paranoia=0 will ruin your security; use it only for testing");
      this.M = a;
    },
    addEntropy: function (a, b, c) {
      c = c || "user";
      var d,
          e,
          f = new Date().valueOf(),
          g = this.H[c],
          h = this.isReady(),
          k = 0;
      d = this.U[c];
      void 0 === d && (d = this.U[c] = this.ha++);
      void 0 === g && (g = this.H[c] = 0);
      this.H[c] = (this.H[c] + 1) % this.c.length;

      switch (typeof a) {
        case "number":
          void 0 === b && (b = 1);
          this.c[g].update([d, this.N++, 1, b, f, 1, a | 0]);
          break;

        case "object":
          c = Object.prototype.toString.call(a);

          if ("[object Uint32Array]" === c) {
            e = [];

            for (c = 0; c < a.length; c++) e.push(a[c]);

            a = e;
          } else for ("[object Array]" !== c && (k = 1), c = 0; c < a.length && !k; c++) "number" !== typeof a[c] && (k = 1);

          if (!k) {
            if (void 0 === b) for (c = b = 0; c < a.length; c++) for (e = a[c]; 0 < e;) b++, e = e >>> 1;
            this.c[g].update([d, this.N++, 2, b, f, a.length].concat(a));
          }

          break;

        case "string":
          void 0 === b && (b = a.length);
          this.c[g].update([d, this.N++, 3, b, f, a.length]);
          this.c[g].update(a);
          break;

        default:
          k = 1;
      }

      if (k) throw new sjcl.exception.bug("random: addEntropy only supports number, array of numbers or string");
      this.m[g] += b;
      this.g += b;
      h === this.u && (this.isReady() !== this.u && A("seeded", Math.max(this.o, this.g)), A("progress", this.getProgress()));
    },
    isReady: function (a) {
      a = this.T[void 0 !== a ? a : this.M];
      return this.o && this.o >= a ? this.m[0] > this.ba && new Date().valueOf() > this.Z ? this.J | this.I : this.I : this.g >= a ? this.J | this.u : this.u;
    },
    getProgress: function (a) {
      a = this.T[a ? a : this.M];
      return this.o >= a ? 1 : this.g > a ? 1 : this.g / a;
    },
    startCollectors: function () {
      if (!this.D) {
        this.a = {
          loadTimeCollector: B(this, this.ma),
          mouseCollector: B(this, this.oa),
          keyboardCollector: B(this, this.la),
          accelerometerCollector: B(this, this.ea),
          touchCollector: B(this, this.qa)
        };
        if (window.addEventListener) window.addEventListener("load", this.a.loadTimeCollector, !1), window.addEventListener("mousemove", this.a.mouseCollector, !1), window.addEventListener("keypress", this.a.keyboardCollector, !1), window.addEventListener("devicemotion", this.a.accelerometerCollector, !1), window.addEventListener("touchmove", this.a.touchCollector, !1);else if (document.attachEvent) document.attachEvent("onload", this.a.loadTimeCollector), document.attachEvent("onmousemove", this.a.mouseCollector), document.attachEvent("keypress", this.a.keyboardCollector);else throw new sjcl.exception.bug("can't attach event");
        this.D = !0;
      }
    },
    stopCollectors: function () {
      this.D && (window.removeEventListener ? (window.removeEventListener("load", this.a.loadTimeCollector, !1), window.removeEventListener("mousemove", this.a.mouseCollector, !1), window.removeEventListener("keypress", this.a.keyboardCollector, !1), window.removeEventListener("devicemotion", this.a.accelerometerCollector, !1), window.removeEventListener("touchmove", this.a.touchCollector, !1)) : document.detachEvent && (document.detachEvent("onload", this.a.loadTimeCollector), document.detachEvent("onmousemove", this.a.mouseCollector), document.detachEvent("keypress", this.a.keyboardCollector)), this.D = !1);
    },
    addEventListener: function (a, b) {
      this.K[a][this.ga++] = b;
    },
    removeEventListener: function (a, b) {
      var c,
          d,
          e = this.K[a],
          f = [];

      for (d in e) e.hasOwnProperty(d) && e[d] === b && f.push(d);

      for (c = 0; c < f.length; c++) d = f[c], delete e[d];
    },
    la: function () {
      C(this, 1);
    },
    oa: function (a) {
      var b, c;

      try {
        b = a.x || a.clientX || a.offsetX || 0, c = a.y || a.clientY || a.offsetY || 0;
      } catch (d) {
        c = b = 0;
      }

      0 != b && 0 != c && this.addEntropy([b, c], 2, "mouse");
      C(this, 0);
    },
    qa: function (a) {
      a = a.touches[0] || a.changedTouches[0];
      this.addEntropy([a.pageX || a.clientX, a.pageY || a.clientY], 1, "touch");
      C(this, 0);
    },
    ma: function () {
      C(this, 2);
    },
    ea: function (a) {
      a = a.accelerationIncludingGravity.x || a.accelerationIncludingGravity.y || a.accelerationIncludingGravity.z;

      if (window.orientation) {
        var b = window.orientation;
        "number" === typeof b && this.addEntropy(b, 1, "accelerometer");
      }

      a && this.addEntropy(a, 2, "accelerometer");
      C(this, 0);
    }
  };

  function A(a, b) {
    var c,
        d = sjcl.random.K[a],
        e = [];

    for (c in d) d.hasOwnProperty(c) && e.push(d[c]);

    for (c = 0; c < e.length; c++) e[c](b);
  }

  function C(a, b) {
    "undefined" !== typeof window && window.performance && "function" === typeof window.performance.now ? a.addEntropy(window.performance.now(), b, "loadtime") : a.addEntropy(new Date().valueOf(), b, "loadtime");
  }

  function y(a) {
    a.b = z(a).concat(z(a));
    a.L = new sjcl.cipher.aes(a.b);
  }

  function z(a) {
    for (var b = 0; 4 > b && (a.i[b] = a.i[b] + 1 | 0, !a.i[b]); b++);

    return a.L.encrypt(a.i);
  }

  function B(a, b) {
    return function () {
      b.apply(a, arguments);
    };
  }

  sjcl.random = new sjcl.prng(6);

  a: try {
    var D, E, F, G;

    if (G = module.exports) {
      var H;

      try {
        H = crypto;
      } catch (a) {
        H = null;
      }

      G = E = H;
    }

    if (G && E.randomBytes) D = E.randomBytes(128), D = new Uint32Array(new Uint8Array(D).buffer), sjcl.random.addEntropy(D, 1024, "crypto['randomBytes']");else if ("undefined" !== typeof window && "undefined" !== typeof Uint32Array) {
      F = new Uint32Array(32);
      if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(F);else if (window.msCrypto && window.msCrypto.getRandomValues) window.msCrypto.getRandomValues(F);else break a;
      sjcl.random.addEntropy(F, 1024, "crypto['getRandomValues']");
    }
  } catch (a) {
    "undefined" !== typeof window && window.console && (console.log("There was an error collecting entropy from the browser:"), console.log(a));
  }

  sjcl.json = {
    defaults: {
      v: 1,
      iter: 1e4,
      ks: 128,
      ts: 64,
      mode: "ccm",
      adata: "",
      cipher: "aes"
    },
    ja: function (a, b, c, d) {
      c = c || {};
      d = d || {};
      var e = sjcl.json,
          f = e.h({
        iv: sjcl.random.randomWords(4, 0)
      }, e.defaults),
          g;
      e.h(f, c);
      c = f.adata;
      "string" === typeof f.salt && (f.salt = sjcl.codec.base64.toBits(f.salt));
      "string" === typeof f.iv && (f.iv = sjcl.codec.base64.toBits(f.iv));
      if (!sjcl.mode[f.mode] || !sjcl.cipher[f.cipher] || "string" === typeof a && 100 >= f.iter || 64 !== f.ts && 96 !== f.ts && 128 !== f.ts || 128 !== f.ks && 192 !== f.ks && 0x100 !== f.ks || 2 > f.iv.length || 4 < f.iv.length) throw new sjcl.exception.invalid("json encrypt: invalid parameters");
      "string" === typeof a ? (g = sjcl.misc.cachedPbkdf2(a, f), a = g.key.slice(0, f.ks / 32), f.salt = g.salt) : sjcl.ecc && a instanceof sjcl.ecc.elGamal.publicKey && (g = a.kem(), f.kemtag = g.tag, a = g.key.slice(0, f.ks / 32));
      "string" === typeof b && (b = sjcl.codec.utf8String.toBits(b));
      "string" === typeof c && (f.adata = c = sjcl.codec.utf8String.toBits(c));
      g = new sjcl.cipher[f.cipher](a);
      e.h(d, f);
      d.key = a;
      f.ct = "ccm" === f.mode && sjcl.arrayBuffer && sjcl.arrayBuffer.ccm && b instanceof ArrayBuffer ? sjcl.arrayBuffer.ccm.encrypt(g, b, f.iv, c, f.ts) : sjcl.mode[f.mode].encrypt(g, b, f.iv, c, f.ts);
      return f;
    },
    encrypt: function (a, b, c, d) {
      var e = sjcl.json,
          f = e.ja.apply(e, arguments);
      return e.encode(f);
    },
    ia: function (a, b, c, d) {
      c = c || {};
      d = d || {};
      var e = sjcl.json;
      b = e.h(e.h(e.h({}, e.defaults), b), c, !0);
      var f, g;
      f = b.adata;
      "string" === typeof b.salt && (b.salt = sjcl.codec.base64.toBits(b.salt));
      "string" === typeof b.iv && (b.iv = sjcl.codec.base64.toBits(b.iv));
      if (!sjcl.mode[b.mode] || !sjcl.cipher[b.cipher] || "string" === typeof a && 100 >= b.iter || 64 !== b.ts && 96 !== b.ts && 128 !== b.ts || 128 !== b.ks && 192 !== b.ks && 0x100 !== b.ks || !b.iv || 2 > b.iv.length || 4 < b.iv.length) throw new sjcl.exception.invalid("json decrypt: invalid parameters");
      "string" === typeof a ? (g = sjcl.misc.cachedPbkdf2(a, b), a = g.key.slice(0, b.ks / 32), b.salt = g.salt) : sjcl.ecc && a instanceof sjcl.ecc.elGamal.secretKey && (a = a.unkem(sjcl.codec.base64.toBits(b.kemtag)).slice(0, b.ks / 32));
      "string" === typeof f && (f = sjcl.codec.utf8String.toBits(f));
      g = new sjcl.cipher[b.cipher](a);
      f = "ccm" === b.mode && sjcl.arrayBuffer && sjcl.arrayBuffer.ccm && b.ct instanceof ArrayBuffer ? sjcl.arrayBuffer.ccm.decrypt(g, b.ct, b.iv, b.tag, f, b.ts) : sjcl.mode[b.mode].decrypt(g, b.ct, b.iv, f, b.ts);
      e.h(d, b);
      d.key = a;
      return 1 === c.raw ? f : sjcl.codec.utf8String.fromBits(f);
    },
    decrypt: function (a, b, c, d) {
      var e = sjcl.json;
      return e.ia(a, e.decode(b), c, d);
    },
    encode: function (a) {
      var b,
          c = "{",
          d = "";

      for (b in a) if (a.hasOwnProperty(b)) {
        if (!b.match(/^[a-z0-9]+$/i)) throw new sjcl.exception.invalid("json encode: invalid property name");
        c += d + '"' + b + '":';
        d = ",";

        switch (typeof a[b]) {
          case "number":
          case "boolean":
            c += a[b];
            break;

          case "string":
            c += '"' + escape(a[b]) + '"';
            break;

          case "object":
            c += '"' + sjcl.codec.base64.fromBits(a[b], 0) + '"';
            break;

          default:
            throw new sjcl.exception.bug("json encode: unsupported type");
        }
      }

      return c + "}";
    },
    decode: function (a) {
      a = a.replace(/\s/g, "");
      if (!a.match(/^\{.*\}$/)) throw new sjcl.exception.invalid("json decode: this isn't json!");
      a = a.replace(/^\{|\}$/g, "").split(/,/);
      var b = {},
          c,
          d;

      for (c = 0; c < a.length; c++) {
        if (!(d = a[c].match(/^\s*(?:(["']?)([a-z][a-z0-9]*)\1)\s*:\s*(?:(-?\d+)|"([a-z0-9+\/%*_.@=\-]*)"|(true|false))$/i))) throw new sjcl.exception.invalid("json decode: this isn't json!");
        null != d[3] ? b[d[2]] = parseInt(d[3], 10) : null != d[4] ? b[d[2]] = d[2].match(/^(ct|adata|salt|iv)$/) ? sjcl.codec.base64.toBits(d[4]) : unescape(d[4]) : null != d[5] && (b[d[2]] = "true" === d[5]);
      }

      return b;
    },
    h: function (a, b, c) {
      void 0 === a && (a = {});
      if (void 0 === b) return a;

      for (var d in b) if (b.hasOwnProperty(d)) {
        if (c && void 0 !== a[d] && a[d] !== b[d]) throw new sjcl.exception.invalid("required parameter overridden");
        a[d] = b[d];
      }

      return a;
    },
    sa: function (a, b) {
      var c = {},
          d;

      for (d in a) a.hasOwnProperty(d) && a[d] !== b[d] && (c[d] = a[d]);

      return c;
    },
    ra: function (a, b) {
      var c = {},
          d;

      for (d = 0; d < b.length; d++) void 0 !== a[b[d]] && (c[b[d]] = a[b[d]]);

      return c;
    }
  };
  sjcl.encrypt = sjcl.json.encrypt;
  sjcl.decrypt = sjcl.json.decrypt;
  sjcl.misc.pa = {};

  sjcl.misc.cachedPbkdf2 = function (a, b) {
    var c = sjcl.misc.pa,
        d;
    b = b || {};
    d = b.iter || 1e3;
    c = c[a] = c[a] || {};
    d = c[d] = c[d] || {
      firstSalt: b.salt && b.salt.length ? b.salt.slice(0) : sjcl.random.randomWords(2, 0)
    };
    c = void 0 === b.salt ? d.firstSalt : b.salt;
    d[c] = d[c] || sjcl.misc.pbkdf2(a, c, b.iter);
    return {
      key: d[c].slice(0),
      salt: c.slice(0)
    };
  };

  module.exports && (module.exports = sjcl);
});
sjcl_1.beware["CBC mode is dangerous because it doesn't protect message integrity."]();
const VERSION = "2.0.0";
const AVER = 1;
const ERR_MAP = {
  "-100": "Not Login",
  "-101": "No tradeRndkey",
  "-102": "No loginRndkey",
  "-103": "Current user has no trade account",
  "-200": "API error",
  "-300": "API Timeout",
  "-400": "Decrypt Fail",
  "-9999": "Unknow Error"
};

function getByStr(scope, propChain) {
  let bAry = propChain.split("."),
      d = scope;

  for (let i = 0, j = bAry.length; i < j; ++i) {
    if (!d) {
      return d;
    }

    d = d[bAry[i]];
  }

  return d;
}

function forEach$1(obj, fn) {
  if (obj.length >= 0) {
    for (let i = 0, j = obj.length; i < j; i++) {
      fn(obj[i], i);
    }
  } else {
    for (let k in obj) {
      if (obj.hasOwnProperty(k)) {
        fn(obj[k], k);
      }
    }
  }
}

function find(obj, fn) {
  for (let i = 0, j = obj.length; i < j; i++) {
    if (fn(obj[i], i)) {
      return obj[i];
    }
  }
}

function filter(obj, fn) {
  let result = [];

  if (!obj) {
    return result;
  }

  for (let i = 0, j = obj.length; i < j; i++) {
    if (fn(obj[i], i)) {
      result.push(obj[i]);
    }
  }

  return result;
}

function assign(target, source, ...sources) {
  forEach$1(source, (v, k) => {
    target[k] = v;
  });

  if (sources.length) {
    let nextSource = sources.shift();
    assign(target, nextSource, ...sources);
  }

  return target;
}

function getErrMsg(code, desc, raw) {
  let result = {
    code: code,
    msg: ERR_MAP[code],
    desc,
    raw
  };

  if (raw && raw.url) {
    result.url = raw.url;
  }

  return result;
}

let modEncrypt = function () {
  const IV = "72ba90dbddbe8b4913edac9e65302c8f";

  let strToBits = str => sjcl_1.codec.hex.toBits(str),
      getIntBytes = function (x, digits = 4) {
    let bytes = [],
        i = digits;

    do {
      bytes[--i] = x & 255;
      x = x >> 8;
    } while (i);

    return bytes.reverse();
  },
      hmacSHA256 = function (key) {
    let hasher = new sjcl_1.misc.hmac(key, sjcl_1.hash.sha256);

    this.encrypt = function () {
      return hasher.encrypt.apply(hasher, arguments);
    };
  },
      pbkdf2Encrypt = function (str, salt, iteration = 10000) {
    return sjcl_1.misc.pbkdf2(strToBits(str), strToBits(salt), iteration, 256, hmacSHA256);
  },
      generateRandomKey = function (length) {
    let arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, "a", "b", "c", "d", "e", "f"],
        str = "";

    for (let i = 0; i < length * 2; i++) {
      str += arr[Math.floor(Math.random() * 16)];
    }

    return str;
  },
      bytes2hex = function (arr) {
    let str = "";

    for (let i = 0; i < arr.length; i++) {
      let h = (arr[i] & 0xff).toString(16);

      if (h.length < 2) {
        str += "0";
      }

      str += h;
    }

    return str;
  },
      aesEncrypt = function (str, key, iv = IV, sourceEncode = "utf8String") {
    let aes = new sjcl_1.cipher.aes(sjcl_1.codec.hex.toBits(key)),
        encrypted;
    str = sjcl_1.codec[sourceEncode].toBits(str);
    encrypted = sjcl_1.mode.cbc.encrypt(aes, str, sjcl_1.codec.hex.toBits(iv));
    return sjcl_1.codec.base64.fromBits(encrypted);
  },
      aesDecrypt = function (cipherText, key, iv = IV, sourceEncode = "base64") {
    let aes = new sjcl_1.cipher.aes(sjcl_1.codec.hex.toBits(key)),
        decrypted,
        result;
    cipherText = sjcl_1.codec[sourceEncode].toBits(cipherText);

    try {
      decrypted = sjcl_1.mode.cbc.decrypt(aes, cipherText, sjcl_1.codec.hex.toBits(iv));
      result = sjcl_1.codec.utf8String.fromBits(decrypted);
    } catch (e) {
      result = JSON.stringify(getErrMsg(-400, e.message));
    }

    return result;
  },
      getRndKeyAndAuth = function (uin, pwd, salt, randomKey = generateRandomKey(32)) {
    let S1 = sjcl_1.codec.hex.fromBits(pbkdf2Encrypt(MD5(pwd), salt)),
        S2 = sjcl_1.codec.hex.fromBits(pbkdf2Encrypt(bytes2hex(getIntBytes(uin, 4)) + S1, salt)),
        A1 = sjcl_1.codec.hex.fromBits(sjcl_1.mode.cbc.encrypt(new sjcl_1.cipher.aes(strToBits(S2)), strToBits(bytes2hex(getIntBytes(0, 4)) + bytes2hex(getIntBytes(uin, 4)) + S1 + bytes2hex(getIntBytes(Math.floor(+new Date() / 1000), 8)) + randomKey), strToBits(IV)));
    return {
      auth: A1,
      rndkey: randomKey
    };
  },

  /*will be deprecated, use getAuthOfTrade instead*/
  getTradeAuth = function (pwd, tradeRndKey, loginRndkey, uin, salt) {
    const {
      auth
    } = getRndKeyAndAuth(uin, pwd, salt, tradeRndKey);
    return getAuthOfTrade(auth, loginRndkey);
  },
      getAuthOfTrade = function (tradeAuth, loginRndkey) {
    return sjcl_1.codec.hex.fromBits(sjcl_1.mode.cbc.encrypt(new sjcl_1.cipher.aes(sjcl_1.codec.hex.toBits(loginRndkey)), sjcl_1.codec.hex.toBits(tradeAuth), sjcl_1.codec.hex.toBits(IV)));
  },
      tradeEncrypt = function (rawStr, tradePwd, {
    v2 = false
  }) {
    return new Promise((resolve, reject) => {
      let doResolve = (theTradeRndkey, auth) => {
        resolve({
          clientSession: JSON.stringify({
            tradeRndkey: theTradeRndkey
          }),
          auth,
          encryptedRequest: aesEncrypt(rawStr, theTradeRndkey),
          aver: AVER
        });
      };

      yfBasicLogin.isLogin().then(loginData => {
        const {
          loginRndkey,
          uin
        } = loginData;

        if (v2) {
          yfAuth.getCustomerInfo(uin).then(o => {
            let cdata = o && o.customer;

            if (cdata && cdata.customerid && cdata.salt) {
              const {
                auth,
                rndkey
              } = getRndKeyAndAuth(cdata.customerid, tradePwd, cdata.salt);
              const authOfTrade = getAuthOfTrade(auth, loginRndkey);
              doResolve(rndkey, authOfTrade);
            } else {
              reject(getErrMsg(-103));
            }
          }, reject);
        } else {
          yfAuth.getSalt2(uin).then(function (salt2) {
            if (salt2) {
              const {
                auth,
                rndkey
              } = getRndKeyAndAuth(uin, tradePwd, salt2);
              const authOfTrade = getAuthOfTrade(auth, loginRndkey);
              doResolve(rndkey, authOfTrade);
            } else {
              reject(getErrMsg(-103));
            }
          }).catch(function (err) {
            if (err.code && err.msg) {
              reject(err);
            } else {
              reject(getErrMsg(-103, err));
            }
          });
        }
      }, () => {
        yfBasicLogin.logout(false);
        reject(getErrMsg(-100));
      });
    });
  };

  return {
    SJCL: sjcl_1,
    aesEncrypt,
    aesDecrypt,
    pbkdf2Encrypt,
    generateRandomKey,
    getTradeAuth,
    getAuthOfTrade,
    tradeEncrypt,
    getRndKeyAndAuth
  };
}();

let modRequest = function () {
  let HttpAdaptor = function (url, options) {
    return fetch(url, options);
  },
      UUID = () => {
    let d = new Date().getTime();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      let r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == "x" ? r : r & 0x7 | 0x8).toString(16);
    });
  },
      defaultHeader = (userHeader = {}) => {
    let lowerKey = {};
    forEach$1(userHeader, (v, k) => {
      lowerKey[k.toLowerCase()] = v;
    });
    return assign({
      "x-product": "h5||version=2.0.0",
      "x-requestid": UUID(),
      "x-device": "iOS||browser=Mobile Safari||brover=11||lang=zh-CN||channel=null"
    }, lowerKey);
  },
      setHttpAdaptor = adaptor => HttpAdaptor = adaptor,
      sendRequest = (url, options = {}) => new Promise((resolve, reject) => {
    options.uin = options.uin || yfBasicLogin.getSession().uin;
    options.timeout = options.timeout || 15000;
    options.method = options.method || "GET";
    options.headers = defaultHeader(options.headers);

    if (!("credentials" in options)) {
      options.credentials = "include";
    }

    if (!options.pre) {
      options.pre = function (url, opt) {
        if (opt.method.toLowerCase() === "post" && !opt.body && opt.data) {
          let fd = new FormData();
          forEach$1(opt.data, (v, k) => {
            fd.append(k, v);
          });
          opt.body = fd; //opt.body = JSON.stringify(opt.data)
        }

        return Promise.resolve(opt);
      };
    }

    if (!options.getResBody) {
      options.getResBody = function (res) {
        const contentType = res.headers.get("Content-Type").split(";");

        if (contentType[0] === "application/json") {
          // 错误返回明文对象
          return res.json();
        } else {
          return res.text();
        }
      };
    }

    options.pre(url, options).then(o => {
      options = o;
      url = options.url || url;

      const doRequest = function () {
        // 超时报错
        let STO = setTimeout(function () {
          reject(getErrMsg(-300, "", {
            url
          }));
        }, options.timeout),
            newUrl = url;

        if (options.data && options.method === "GET") {
          let urlParams = [];
          forEach$1(options.data, (v, k) => {
            urlParams.push(encodeURIComponent(k) + "=" + encodeURIComponent(v));
          });

          if (urlParams.length > 0) {
            urlParams = urlParams.join("&");

            if (newUrl.indexOf("?") > -1) {
              newUrl += "&";
            } else {
              newUrl += "?";
            }
          }

          newUrl += urlParams;
        }

        HttpAdaptor(newUrl, options).then(res => {
          clearTimeout(STO);
          return options.getResBody(res, reject);
        }).then(res => {
          if (options.decryptRes) {
            res = options.decryptRes(res);
          }

          if (typeof res === "string") {
            resolve(res);
          } // if (url.indexOf('query/planlist') > -1) {
          // res = {"code":30004,"msg":"QueryPlanSummary cash management server error "}
          // }


          if (res.code === 0) {
            resolve(res.data);
          } else {
            switch (res.code) {
              case 7014:
                reject(getErrMsg(-200, "Trade password Locked", res));
                break;

              case 7003:
                reject(getErrMsg(-200, "Trade password Incorrect", res));
                break;

              case 7020:
                yfBasicLogin.logout(false);
                reject(getErrMsg(-100));
                break;

              case -12:
                reject(getErrMsg(-200, "invalid stockCode", res));
                break;

              default:
                if (options.needRedo && options.needRedo(res)) {
                  setTimeout(doRequest, 100);
                } else {
                  res.url = newUrl;
                  reject(getErrMsg(-200, res.msg, res));
                }

            }
          }
        }).catch(err => {
          let errMsg;
          clearTimeout(STO);

          if (err instanceof Error) {
            let map = {
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;"
            };
            errMsg = err.stack.replace(/[&<>'"]/g, o => map[o]);
          } else {
            errMsg = err.toString();
          }

          reject(getErrMsg(-200, errMsg, {
            url: newUrl,
            error: err
          }));
        });
      }; // 发起首次请求


      doRequest();
    }, o => {
      reject(o);
    });
  }),
      ssoRequest = (url, options = {}) => {
    let decodeRndKey;
    options.data = options.data || {};
    options.headers = options.headers || {};

    options.pre = (url, options) => new Promise((resolve, reject) => {
      let dataAsString = JSON.stringify(options.data);
      options.headers = assign(options.headers, {
        "Content-Type": "text/encrypted;aver=" + AVER
      });

      if (options.pwd) {
        modEncrypt.tradeEncrypt(dataAsString, options.pwd, {
          v2: url.indexOf("/v2/") > -1
        }).then(o => {
          options.pwd = undefined;
          options.body = o.encryptedRequest;

          if (o.auth) {
            options.headers["x-auth2"] = o.auth;
          }

          decodeRndKey = JSON.parse(o.clientSession).tradeRndkey;
          resolve(options);
        }, reject);
      } else {
        yfBasicLogin.getLoginRandomKey().then(rndkey => {
          if (!rndkey) {
            yfBasicLogin.logout(false);
            reject(getErrMsg(-102));
            return;
          }

          decodeRndKey = rndkey;

          if (options.method === "POST") {
            options.body = modEncrypt.aesEncrypt(dataAsString, rndkey);
          }

          resolve(options);
        });
      }
    });

    options.decryptRes = function (res) {
      if (typeof res === "string") {
        return JSON.parse(modEncrypt.aesDecrypt(res, decodeRndKey));
      } else {
        return res;
      }
    };

    return sendRequest(url, options);
  },
      wapiRequest = (url, options) => {
    let decodeRndKey;
    options.data = options.data || {};
    options.headers = options.headers || {};

    options.pre = (url, options) => new Promise((resolve, reject) => {
      let data = options.data,
          body = {},
          pwd = options.pwd;

      if (pwd) {
        data.aver = 1;
        data.aver2 = 1;
      }

      if (options.method === "POST") {
        data.trackID = options.headers["X-requestid"];
        let dataAsString = JSON.stringify(data);

        if (pwd) {
          modEncrypt.tradeEncrypt(dataAsString, options.pwd, {
            v2: url.indexOf("/v2/") > -1
          }).then(o => {
            pwd = options.pwd = undefined;
            body.data = o.encryptedRequest;

            if (o.auth) {
              body.auth = o.auth;
            }

            decodeRndKey = JSON.parse(o.clientSession).tradeRndkey;
            options.body = JSON.stringify(body);
            resolve(options);
          }, reject);
        } else {
          yfBasicLogin.getLoginRandomKey().then(rndkey => {
            if (!rndkey) {
              yfBasicLogin.logout(false);
              reject(getErrMsg(-102));
            }

            decodeRndKey = rndkey;
            body.data = modEncrypt.aesEncrypt(dataAsString, rndkey);
            options.body = JSON.stringify(body);
            resolve(options);
          });
        }
      } else {
        resolve(options);
      }
    });

    options.getResBody = res => {
      let thenable = res.text();
      return thenable.then(t => {
        return JSON.parse(t);
      });
    };

    options.decryptRes = function (res) {
      if (res && res.code === 0 && res.data) {
        let data = res.data; // 返回数据为字符串，则需要解密

        if (typeof data === "string") {
          res.data = JSON.parse(modEncrypt.aesDecrypt(data, decodeRndKey));
        }
      }

      return res;
    };

    return sendRequest(url, options);
  };

  return {
    setHttpAdaptor,
    sendRequest,
    ssoRequest,
    wapiRequest
  };
}();

let yfAuth = function () {
  let CachedCustomerInfo = {},
      CachedClientInfo = {},
      getSalt2 = uin => new Promise((resolve, reject) => {
    modRequest.ssoRequest(yfBasicLogin.getFullUrl("uc", `/v1/users/${uin}/tradeinfo?aver2=1`), {
      method: "GET",
      uin
    }).then(res => {
      if (res.salt2) {
        resolve(res.salt2);
      } else {
        reject(res);
      }
    }, reject);
  }),
      getCustomerInfo = (uin, {
    force = false
  } = {}) => {
    if (CachedCustomerInfo[uin] && !force) {
      return Promise.resolve(CachedCustomerInfo[uin]);
    }

    return new Promise((resolve, reject) => {
      modRequest.ssoRequest(yfBasicLogin.getFullUrl("uc", `/v2/users/${uin}/customer`), {
        method: "GET",
        data: {}
      }).then(data => {
        CachedCustomerInfo[uin] = data;
        resolve(data);
      }, reject);
    });
  },
      getAccountInfo = (business, uin = yfBasicLogin.getSession().uin, {
    force = false
  } = {}) => {
    if (CachedClientInfo[uin] && !force) {
      return Promise.resolve(CachedClientInfo[uin]);
    }

    return new Promise((resolve, reject) => {
      let isWm = business === "wm";
      modRequest.ssoRequest(yfBasicLogin.getFullUrl("uc", `/v2/users/${uin}/application/status`), {
        method: "GET"
      }).then(baseInfo => {
        let result = {
          baseInfo
        };
        modRequest.ssoRequest(yfBasicLogin.getFullUrl("uc", `/v2/users/${uin}/accounts/${isWm ? "wm" : "broker25"}`), {
          method: "GET",
          data: {}
        }).then(resp => {
          let allClients = resp && resp.clients,
              {
            clientInfo,
            accountInfo
          } = getActiveClientInfo(allClients, isWm);
          result.clientInfo = clientInfo;
          result.accountInfo = accountInfo;
          result.allClients = allClients;
          getCustomerInfo(uin).then(customerInfo => {
            result.customerInfo = customerInfo.customer;
            CachedClientInfo[uin] = result;
            resolve(result);
          }, () => {
            result.customerInfo = {};
            CachedClientInfo[uin] = result;
            resolve(result);
          });
        }, reject);
      }, reject);
    });
  },
      getActiveClientInfo = function (clients, isWm, clientid = "") {
    let activeClients = filter(clients, o => {
      return o.status === 1; // 见 currency-manage/src/data/consts,
      // CLIENT STATUS, 1 CLIENT_STATUS_ACTIVE
    }),
        activeClient,
        theAccount = {};
    activeClient = activeClients.length > 1 ? find(activeClients, o => {
      // 默认返回个人户, 见 currency-manage/src/data/consts, CLIENT TYPE
      return clientid ? o.clientid === clientid : o.type === 1;
    }) : activeClients[0];

    if (activeClient) {
      theAccount = find(activeClient.accounts, o => {
        return o.biztype === (isWm ? 2 : 1); // 见 currency-manage/src/data/consts,
        // PRODUCT TYPE
      }) || {};

      if (isWm) {
        theAccount.subacctid = getByStr(theAccount, "fnzacct.subaccthierarchyid");
      } else {
        let subAccounts = getByStr(theAccount, "hsacct.subaccounts");

        if (subAccounts) {
          let subaccount = find(subAccounts, // ICP 是内部账户，不对外使用， 拿当前可用的 cash or margin 账户
          // 见 currency-manage/src/data/consts, ACCOUNT STATUS
          o => o.fundaccounttype !== "ICP" && o.status === 1);
          theAccount.subacctid = subaccount && subaccount.fundaccount;
        }
      }
    } else {
      activeClient = {};
    }

    return {
      clientInfo: activeClient,
      accountInfo: theAccount
    };
  };

  let exposedApi = {
    version: VERSION,
    encrypt: modEncrypt,
    request: modRequest,
    getSalt2,
    getCustomerInfo,
    getAccountInfo,
    getActiveClientInfo
  };
  forEach$1(["setEnv", "getSession", "getFullUrl", "setLoginRandomKey", "getLoginRandomKey", "isLogin", "login", "logout", "signUp", "init"], o => {
    exposedApi[o] = yfBasicLogin[o];
  });
  return exposedApi;
}();

yfAuth.init();

yfBasicLogin.setEnv(); // import { hola2 } from "./1/c";
// hola2();
