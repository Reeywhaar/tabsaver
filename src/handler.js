import { sleep, parseQuery } from "./utils.js";

function copyToClipboard(text) {
  const input = document.createElement("input");
  input.setAttribute("value", text);
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
}

let notificationCounter = 0;
function notify(text) {
  const el = document.querySelector(".notification");
  el.innerText = text;
  notificationCounter++;
  sleep(6000).then(() => {
    notificationCounter--;
    if (notificationCounter < 1) {
      el.innerText = "";
    }
  });
}

function createLink(href, text) {
  const a = document.createElement("a");
  a.href = href;
  a.innerText = text;
  return a;
}

function getTemplate(selector) {
  return document.querySelector(selector).content.cloneNode(true);
}

function loadTemplate(selector) {
  document.body.appendChild(getTemplate(selector));
}

function showRestricted(url) {
  loadTemplate("#restricted");
  document.title = url;
  const urlEl = document.querySelector(".url");
  const link = createLink(url, url);
  urlEl.appendChild(link);
  link.addEventListener("click", (e) => {
    e.preventDefault();
    copyToClipboard(url);
    notify("Copied to Clipboard");
  });
}

function showContainerRemoved(url) {
  loadTemplate("#container-removed");
  document.title = url;
  const urlEl = document.querySelector(".url");
  const link = createLink(url, url);
  urlEl.appendChild(link);
  link.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.replace(url);
  });
}

async function main() {
  const query = parseQuery(window.location.search);
  if ("containerRemoved" in query) {
    showContainerRemoved(query.url);
  } else {
    showRestricted(query.url);
  }
}

main().catch((e) => console.error(e));
