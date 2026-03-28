(function () {
  'use strict';

  var toastEl = document.getElementById('toast');

  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 2200);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () {
        toast('Copied');
      });
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      toast('Copied');
    } catch (e) {
      toast('Copy failed');
    }
    document.body.removeChild(ta);
  }

  function baseDir() {
    return new URL('.', location.href).href;
  }

  function shortLinkUrl(code) {
    var c = String(code || '').trim().toLowerCase();
    return new URL('go.html#' + encodeURIComponent(c), baseDir()).href;
  }

  function getShortlinks() {
    var o = {};
    try {
      o = JSON.parse(localStorage.getItem('shortlinks') || '{}');
    } catch (e) {}
    return o && typeof o === 'object' ? o : {};
  }

  function setShortlinks(obj) {
    localStorage.setItem('shortlinks', JSON.stringify(obj, null, 2));
  }

  function renderLinkList() {
    var listEl = document.getElementById('linkList');
    if (!listEl) return;
    var custom = getShortlinks();
    fetch('links.json', { cache: 'no-store' })
      .then(function (r) {
        return r.ok ? r.json() : {};
      })
      .then(function (builtIn) {
        var merged = Object.assign({}, builtIn || {}, custom);
        var keys = Object.keys(merged).sort();
        if (!keys.length) {
          listEl.innerHTML = '<p class="muted small">No links yet. Add one above or edit links.json in the repo.</p>';
          return;
        }
        listEl.innerHTML =
          '<ul style="margin:0;padding-left:1.2rem;font-size:0.9rem">' +
          keys
            .map(function (k) {
              var fromStorage = Object.prototype.hasOwnProperty.call(custom, k);
              var u = merged[k];
              var full = shortLinkUrl(k);
              return (
                '<li style="margin-bottom:0.35rem"><code>' +
                escapeHtml(k) +
                '</code> → ' +
                (fromStorage ? '<span class="muted">(browser)</span> ' : '') +
                '<a href="' +
                escapeAttr(u) +
                '">' +
                escapeHtml(full) +
                '</a></li>'
              );
            })
            .join('') +
          '</ul>';
      })
      .catch(function () {
        listEl.innerHTML = '<p class="muted">Could not load links.json.</p>';
      });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
  }

  var slCode = document.getElementById('slCode');
  var slUrl = document.getElementById('slUrl');
  var slOut = document.getElementById('slOut');
  var btnSaveLink = document.getElementById('btnSaveLink');
  var btnCopyShort = document.getElementById('btnCopyShort');
  var btnExportLinks = document.getElementById('btnExportLinks');
  var btnClearCustom = document.getElementById('btnClearCustom');

  function updateSlOut() {
    if (!slOut || !slCode) return;
    var c = slCode.value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (c !== slCode.value) slCode.value = c;
    slOut.textContent = c ? shortLinkUrl(c) : '(enter a short code)';
  }

  if (slCode) {
    slCode.addEventListener('input', updateSlOut);
    updateSlOut();
  }

  if (btnSaveLink && slCode && slUrl) {
    btnSaveLink.addEventListener('click', function () {
      var code = slCode.value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
      var url = slUrl.value.trim();
      if (!code) {
        toast('Enter a short code');
        return;
      }
      try {
        var u = new URL(url);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error();
      } catch (e) {
        toast('Enter a valid http(s) URL');
        return;
      }
      var all = getShortlinks();
      all[code] = url;
      setShortlinks(all);
      slUrl.value = '';
      toast('Saved in this browser');
      renderLinkList();
      updateSlOut();
    });
  }

  if (btnCopyShort && slOut) {
    btnCopyShort.addEventListener('click', function () {
      var t = slOut.textContent;
      if (t && t.indexOf('http') === 0) copyText(t);
      else toast('Nothing to copy');
    });
  }

  if (btnExportLinks) {
    btnExportLinks.addEventListener('click', function () {
      copyText(JSON.stringify(getShortlinks(), null, 2));
      toast('Custom links JSON copied');
    });
  }

  if (btnClearCustom) {
    btnClearCustom.addEventListener('click', function () {
      if (confirm('Remove all browser-only short links?')) {
        localStorage.removeItem('shortlinks');
        toast('Cleared');
        renderLinkList();
      }
    });
  }

  var pwLen = document.getElementById('pwLen');
  var pwOut = document.getElementById('pwOut');
  var btnGenPw = document.getElementById('btnGenPw');
  var btnCopyPw = document.getElementById('btnCopyPw');

  function genPassword(len) {
    var n = Math.max(8, Math.min(128, parseInt(len, 10) || 16));
    var chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}';
    var arr = new Uint8Array(n);
    crypto.getRandomValues(arr);
    var s = '';
    for (var i = 0; i < n; i++) s += chars[arr[i] % chars.length];
    return s;
  }

  if (btnGenPw && pwOut) {
    btnGenPw.addEventListener('click', function () {
      pwOut.textContent = genPassword(pwLen && pwLen.value);
    });
  }
  if (btnCopyPw && pwOut) {
    btnCopyPw.addEventListener('click', function () {
      if (pwOut.textContent) copyText(pwOut.textContent);
    });
  }

  var b64In = document.getElementById('b64In');
  var b64Out = document.getElementById('b64Out');
  document.getElementById('btnB64Enc') &&
    document.getElementById('btnB64Enc').addEventListener('click', function () {
      try {
        b64Out.value = btoa(unescape(encodeURIComponent(b64In.value)));
      } catch (e) {
        b64Out.value = 'Error: ' + e.message;
      }
    });
  document.getElementById('btnB64Dec') &&
    document.getElementById('btnB64Dec').addEventListener('click', function () {
      try {
        b64Out.value = decodeURIComponent(escape(atob(b64In.value.trim())));
      } catch (e) {
        b64Out.value = 'Error: invalid Base64';
      }
    });

  var urlEncIn = document.getElementById('urlEncIn');
  var urlEncOut = document.getElementById('urlEncOut');
  document.getElementById('btnUrlEnc') &&
    document.getElementById('btnUrlEnc').addEventListener('click', function () {
      urlEncOut.value = encodeURIComponent(urlEncIn.value);
    });
  document.getElementById('btnUrlDec') &&
    document.getElementById('btnUrlDec').addEventListener('click', function () {
      try {
        urlEncOut.value = decodeURIComponent(urlEncIn.value);
      } catch (e) {
        urlEncOut.value = 'Error: invalid encoding';
      }
    });

  var epochIn = document.getElementById('epochIn');
  var epochHuman = document.getElementById('epochHuman');
  var btnNow = document.getElementById('btnNow');
  var btnEpochToHuman = document.getElementById('btnEpochToHuman');
  var btnHumanToEpoch = document.getElementById('btnHumanToEpoch');

  if (btnNow && epochIn) {
    btnNow.addEventListener('click', function () {
      epochIn.value = Math.floor(Date.now() / 1000);
    });
  }
  if (btnEpochToHuman && epochIn && epochHuman) {
    btnEpochToHuman.addEventListener('click', function () {
      var sec = parseInt(epochIn.value, 10);
      if (isNaN(sec)) {
        epochHuman.value = '';
        return;
      }
      epochHuman.value = new Date(sec * 1000).toISOString();
    });
  }
  if (btnHumanToEpoch && epochIn && epochHuman) {
    btnHumanToEpoch.addEventListener('click', function () {
      var d = Date.parse(epochHuman.value);
      if (isNaN(d)) {
        epochIn.value = '';
        return;
      }
      epochIn.value = Math.floor(d / 1000);
    });
  }

  var loremN = document.getElementById('loremN');
  var loremOut = document.getElementById('loremOut');
  var LOREM =
    'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum';
  document.getElementById('btnLorem') &&
    document.getElementById('btnLorem').addEventListener('click', function () {
      var n = Math.max(1, Math.min(50, parseInt(loremN && loremN.value, 10) || 3));
      var words = LOREM.split(/\s+/);
      var out = [];
      for (var i = 0; i < n * 12; i++) out.push(words[i % words.length]);
      loremOut.value = out.join(' ').replace(/^\w/, function (c) {
        return c.toUpperCase();
      }) + '.';
    });

  var colorPick = document.getElementById('colorPick');
  var colorHex = document.getElementById('colorHex');
  function syncColorFromPicker() {
    if (!colorPick || !colorHex) return;
    colorHex.value = colorPick.value;
  }
  function syncPickerFromHex() {
    if (!colorPick || !colorHex) return;
    var v = colorHex.value.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) colorPick.value = v;
  }
  if (colorPick) colorPick.addEventListener('input', syncColorFromPicker);
  if (colorHex) colorHex.addEventListener('input', syncPickerFromHex);
  syncColorFromPicker();

  var jsonIn = document.getElementById('jsonIn');
  document.getElementById('btnJsonFmt') &&
    document.getElementById('btnJsonFmt').addEventListener('click', function () {
      try {
        jsonIn.value = JSON.stringify(JSON.parse(jsonIn.value), null, 2);
        toast('Formatted');
      } catch (e) {
        toast('Invalid JSON');
      }
    });

  var qrText = document.getElementById('qrText');
  var btnQr = document.getElementById('btnQr');
  var qrCanvas = document.getElementById('qrCanvas');
  if (btnQr && qrCanvas && typeof QRCode !== 'undefined') {
    btnQr.addEventListener('click', function () {
      var text = (qrText && qrText.value.trim()) || shortLinkUrl((slCode && slCode.value.trim()) || 'demo');
      QRCode.toCanvas(
        qrCanvas,
        text,
        { width: 200, margin: 2, color: { dark: '#000000', light: '#ffffff' } },
        function (err) {
          if (err) toast('QR failed');
          else toast('QR updated');
        }
      );
    });
  }

  var themeBtn = document.getElementById('themeToggle');
  function applyTheme(dark) {
    document.body.classList.toggle('light', !dark);
    if (themeBtn) themeBtn.textContent = dark ? 'Light mode' : 'Dark mode';
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch (e) {}
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var goingDark = document.body.classList.contains('light');
      applyTheme(goingDark);
    });
    try {
      var t = localStorage.getItem('theme');
      if (t === 'light') applyTheme(false);
      else applyTheme(true);
    } catch (e) {
      applyTheme(true);
    }
  }

  renderLinkList();
})();
