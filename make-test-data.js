const fs = require("fs");

function getRandomInt(min = 0, max = 10) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

const links = [
	"http://vyrtsev.com",
	"http://ya.ru",
	"http://google.com",
	"http://amazon.com",
	"http://facebook.com",
	"http://dddd.com",
	"http://wikipedia.org",
	"http://hn.yc.com",
	"http://habr.com",
];

const words = [
	"rubber",
	"silk",
	"material",
	"watermelon",
	"dkdkkd",
	"zipper",
	"stream",
	"heal",
	"strobe",
	"terror",
	"gotham",
	"art",
	"small",
	"screet",
	"doogle",
	"bimbo",
];

function* getRandomLinks(n) {
	const linksLength = links.length;
	for (let i = 0; i < n; i++) {
		yield links[getRandomInt(0, linksLength - 1)];
	}
}

function* getRandomWord(n) {
	const wordsLength = words.length;
	for (let i = 0; i < n; i++) {
		yield words[getRandomInt(0, wordsLength - 1)];
	}
}

function generateTabset() {
	const name = Array.from(getRandomWord(getRandomInt(4, 7))).join(" ");
	const links = Array.from(getRandomLinks(getRandomInt(3, 20))).map(x => {
		return {
			url: x,
			pinned: getRandomInt(0, 4) === 0 ? false : true,
		};
	});
	return {
		key: name,
		data: links,
	};
}

async function main() {
	const data = new Array(50).fill(0).map(x => generateTabset());
	console.log(JSON.stringify(data, null, "\t"));
}

main().catch(e => console.error(e));
