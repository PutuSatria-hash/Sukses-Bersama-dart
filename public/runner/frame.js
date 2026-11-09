"use strict";
/* global require */

function dartPrint(message) {
  parent.postMessage(
    {
      sender: "latih-frame",
      type: "stdout",
      message: String(message),
    },
    "*",
  );
}

window.onerror = function (message, _url, _line, _column, error) {
  var detail = error == null ? "" : ", error: " + error;
  parent.postMessage(
    {
      sender: "latih-frame",
      type: "jserr",
      message: String(message) + detail,
    },
    "*",
  );
  return false;
};

window.addEventListener("message", function (event) {
  var data = event.data;
  if (data == null || data.command !== "execute") return;
  if (typeof data.js !== "string" || data.js === "") return;
  (0, eval)(data.js);
});

parent.postMessage({ sender: "latih-frame", type: "ready" }, "*");

