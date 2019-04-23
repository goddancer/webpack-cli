// vim: tabstop=2 shiftwidth=2 expandtab

/**
 * @fileOverview url 解析
 * @author <a href="mailto:sid.liu@reorientgroup.com">sid</a>
 * @example
 *   var result1 = UrlParser.parse();
 *   var result2 = UrlParser.parse(someUrl);
 */

function forEach(obj, fn) {
  if (!obj) {
    return;
  }
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

function assign(target, source, ...sources) {
  forEach(source, (v, k) => {
    target[k] = v;
  });
  if (sources.length) {
    let nextSource = sources.shift();
    assign(target, nextSource, ...sources);
  }
  return target;
}

var UrlParser = {
  //REG_HASH : /#(.*)$/,
  //REG_SEARCH : /\?([^#]*)($|#)/,
  REG_ILLEGAL: /[\?#]/g,
  REG_AMP: /&(?!amp;)/,

  /**
   * 解析Url，返回url参数对象
   * @param  {str} url url链接
   * @return {object}     [description]
   * @example
   *   parse('http://t.qq.com/mb/qzone/set.html?type=1#tab=index&anthor=config');
   *   return {
   *             type : 1,
   *             tab : index,
   *             anthor : config
   *           }
   */
  parse: function(url) {
    var url2Parse = url || location.href,
      el,
      values = {},
      result = {};

    if (url2Parse) {
      el = document.createElement("a");
      el.href = url2Parse;
      forEach(
        ["protocol", "hostname", "port", "pathname", "search", "hash", "host"],
        function(key) {
          result[key] = el[key];
        }
      );
      assign(
        values,
        this.getMapByUrlStr(result.search),
        this.getMapByUrlStr(result.hash)
      );
    }
    result.values = values;

    return result;
  },

  getMapByUrlStr: function(str) {
    var i,
      value,
      result = {};

    str = str.replace(this.REG_ILLEGAL, "");

    str = str.split(UrlParser.REG_AMP);

    i = str.length;
    while (i--) {
      value = str[i];
      if (value) {
        value = value.split("=");
        let key = this.decode(value[0]);
        if (value.length === 2) {
          result[key] = value[1] ? this.decode(value[1]) : "";
        } else {
          result[key] = true;
        }
      }
    }

    return result;
  },

  getUrlByMap: function(map) {
    var url = [],
      encode = this.encode;

    forEach(map, function(v, k) {
      url.push(encode(k) + "=" + encode(v));
    });

    url.sort((a, b) => a.split("=")[0] > b.split("=")[0]);

    return url.join("&");
  },

  encode: function(str) {
    return encodeURIComponent(str).replace(/%20/g, "+");
  },

  decode: function(str) {
    return decodeURIComponent(str.replace(/\+/g, " "));
  }
};

export default UrlParser;
