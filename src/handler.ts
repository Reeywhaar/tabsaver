import { sleep, parseQuery } from "./utils";

async function main() {
  const query = parseQuery(window.location.search);
  if ("containerRemoved" in query) {
    showContainerRemoved(query.url);
  } else {
    showRestricted(query.url);
  }
}

function copyToClipboard(text: string) {
  const input = document.createElement("input");
  input.setAttribute("value", text);
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
}

let notificationCounter = 0;
function notify(text: string) {
  const el = document.querySelector(".notification") as HTMLDivElement;
  el.innerText = text;
  notificationCounter++;
  sleep(6000).then(() => {
    notificationCounter--;
    if (notificationCounter < 1) {
      el.innerText = "";
    }
  });
}

function createLink(href: string, text: string) {
  const a = document.createElement("a");
  a.href = href;
  a.innerText = text;
  return a;
}

function getTemplate(selector: string) {
  return (
    document.querySelector(selector) as HTMLTemplateElement
  ).content.cloneNode(true);
}

function loadTemplate(selector: string) {
  document.body.appendChild(getTemplate(selector));
}

function showRestricted(url: string) {
  loadTemplate("#restricted");
  document.title = url;
  const urlEl = document.querySelector(".url") as HTMLDivElement;
  const link = createLink(url, url);
  urlEl.appendChild(link);
  link.addEventListener("click", (e) => {
    e.preventDefault();
    copyToClipboard(url);
    notify("Copied to Clipboard");
  });
}

function showContainerRemoved(url: string) {
  loadTemplate("#container-removed");
  document.title = url;
  const urlEl = document.querySelector(".url") as HTMLDivElement;
  const link = createLink(url, url);
  urlEl.appendChild(link);
  link.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.replace(url);
  });
}

main().catch((e) => console.error(e));
