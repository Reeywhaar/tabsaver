import {sleep} from "./utils.js";

function getURL(){
	return decodeURIComponent(window.location.search.substr(5));
}

function copyToClipboard(text){
	const input = document.createElement("input");
	input.setAttribute("value", text);
	document.body.appendChild(input);
	input.select();
	document.execCommand("copy");
	document.body.removeChild(input);
}

let notificationCounter = 0;
function notify(text){
	const el = document.querySelector(".notification");
	el.innerText = text;
	notificationCounter++;
	sleep(6000).then(() => {
		notificationCounter--;
		if(notificationCounter < 1){
			el.innerText = "";
		};
	});
}

function createLink(href, text){
	const a = document.createElement("a");
	a.href = href;
	a.innerText = text;
	return a;
}

async function main(){
	const urlEl = document.querySelector(".url");
	const link = createLink(getURL(), getURL())
	urlEl.appendChild(link);
	link.addEventListener("click", (e) => {
		e.preventDefault();
		copyToClipboard(getURL());
		notify("Copied to Clipboard");
	});
	document.title = getURL();
}

main().catch(e => console.error(e));