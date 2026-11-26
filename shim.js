// Cầu nối cho bản PWA: thay google.script.run bằng JSONP gọi tới Apps Script,
// và đăng ký service worker để ứng dụng mở được khi mất mạng.
// Trang gốc (Apps Script) không dùng file này. Chỉ bản cài trên điện thoại dùng.
(function () {
  var EXEC = window.PCCC_EXEC || "";
  var TIMEOUT_MS = 15000;
  var seq = 0;
  var MSG_OFFLINE = "Không có mạng, chưa lưu được. Kiểm tra mạng rồi thử lại.";
  var MSG_NET = "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.";

  function call(fn, params, onOk, onFail) {
    function fail(msg) { if (onFail) onFail(new Error(msg)); }
    if (!EXEC || EXEC.indexOf("PASTE_") === 0) {
      return fail("Chưa cấu hình địa chỉ máy chủ.");
    }
    if (navigator.onLine === false) return fail(MSG_OFFLINE);

    var name = "__pccc_cb" + (++seq) + "_" + Date.now().toString(36);
    var parts = ["api=1", "fn=" + encodeURIComponent(fn), "callback=" + name];
    Object.keys(params).forEach(function (k) {
      var v = params[k];
      if (v !== undefined && v !== null) {
        parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(String(v)));
      }
    });

    var s = document.createElement("script");
    var done = false;
    var timer = setTimeout(function () { finish(MSG_NET); }, TIMEOUT_MS);

    function finish(msg, data) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      // Giữ hàm callback dạng rỗng để nếu máy chủ trả về muộn thì không báo lỗi trên trang.
      window[name] = function () {};
      if (s.parentNode) s.parentNode.removeChild(s);
      if (msg) fail(msg);
      else if (onOk) onOk(data);
    }

    window[name] = function (body) {
      if (body && body.ok) finish(null, body.data);
      else finish((body && body.error) || "Lỗi không rõ từ máy chủ.");
    };
    s.onerror = function () { finish(MSG_NET); };
    s.src = EXEC + "?" + parts.join("&");
    document.head.appendChild(s);
  }

  // Mỗi lần gọi tạo một chuỗi mới, giống google.script.run.
  function runner(ok, fail) {
    return {
      withSuccessHandler: function (f) { return runner(f, fail); },
      withFailureHandler: function (f) { return runner(ok, f); },
      getState: function (plate, nguoi, token) {
        call("getState", { plate: plate, nguoi: nguoi, token: token }, ok, fail);
      },
      setRoster: function (plate, nguoi, ten, token) {
        call("setRoster", { plate: plate, nguoi: nguoi, ten: ten, token: token }, ok, fail);
      },
      setItem: function (plate, nguoi, stt, status, note, token) {
        call("setItem", { plate: plate, nguoi: nguoi, stt: stt, status: status, note: note, token: token }, ok, fail);
      },
      confirmCheck: function (plate, nguoi, token) {
        call("confirmCheck", { plate: plate, nguoi: nguoi, token: token }, ok, fail);
      }
    };
  }

  window.google = { script: { run: runner(null, null) } };

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function () {});
    });
  }
})();
