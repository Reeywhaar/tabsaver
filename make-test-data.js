const fs = require("fs");

function getRandomInt(min = 0, max = 10) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const links = [
  "http://vyrtsev.com",
  "http://facebook.com",
  "http://twitter.com",
  "http://google.com",
  "http://youtube.com",
  "http://instagram.com",
  "http://linkedin.com",
  "http://wordpress.org",
  "http://pinterest.com",
  "http://wikipedia.org",
  "http://wordpress.com",
  "http://blogspot.com",
  "http://apple.com",
  "http://adobe.com",
  "http://tumblr.com",
  "http://youtu.be",
  "http://amazon.com",
  "http://goo.gl",
  "http://vimeo.com",
  "http://flickr.com",
  "http://microsoft.com",
  "http://yahoo.com",
  "http://godaddy.com",
  "http://qq.com",
  "http://bit.ly",
  "http://vk.com",
  "http://reddit.com",
  "http://w3.org",
  "http://baidu.com",
  "http://nytimes.com",
  "http://t.co",
  "http://europa.eu",
  "http://buydomains.com",
  "http://wp.com",
  "http://statcounter.com",
  "http://miitbeian.gov.cn",
  "http://jimdo.com",
  "http://blogger.com",
  "http://github.com",
  "http://weebly.com",
  "http://soundcloud.com",
  "http://mozilla.org",
  "http://bbc.co.uk",
  "http://yandex.ru",
  "http://myspace.com",
  "http://google.de",
  "http://addthis.com",
  "http://nih.gov",
  "http://theguardian.com",
  "http://google.co.jp",
  "http://cnn.com",
  "http://stumbleupon.com",
  "http://gravatar.com",
  "http://digg.com",
  "http://addtoany.com",
  "http://creativecommons.org",
  "http://paypal.com",
  "http://yelp.com",
  "http://imdb.com",
  "http://huffingtonpost.com",
  "http://feedburner.com",
  "http://issuu.com",
  "http://wixsite.com",
  "http://wix.com",
  "http://dropbox.com",
  "http://forbes.com",
  "http://miibeian.gov.cn",
  "http://amazonaws.com",
  "http://google.co.uk",
  "http://washingtonpost.com",
  "http://bluehost.com",
  "http://etsy.com",
  "http://go.com",
  "http://msn.com",
  "http://wsj.com",
  "http://ameblo.jp",
  "http://archive.org",
  "http://slideshare.net",
  "http://e-recht24.de",
  "http://weibo.com",
  "http://fc2.com",
  "http://eventbrite.com",
  "http://parallels.com",
  "http://doubleclick.net",
  "http://mail.ru",
  "http://sourceforge.net",
  "http://amazon.co.uk",
  "http://telegraph.co.uk",
  "http://ebay.com",
  "http://amzn.to",
  "http://livejournal.com",
  "http://51.la",
  "http://free.fr",
  "http://yahoo.co.jp",
  "http://dailymail.co.uk",
  "http://reuters.com",
  "http://taobao.com",
  "http://wikimedia.org",
  "http://amazon.de",
  "http://typepad.com",
  "http://hatena.ne.jp",
  "http://bloomberg.com",
  "http://elegantthemes.com",
  "http://eepurl.com",
  "http://usatoday.com",
  "http://about.com",
  "http://medium.com",
  "http://macromedia.com",
  "http://xing.com",
  "http://bing.com",
  "http://time.com",
];

const words = [
  "rubber",
  "silk",
  "material",
  "watermelon",
  "dodecahedron",
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

function toTitleCase(str) {
  return str.substr(0, 1).toLocaleUpperCase() + str.substr(1);
}

function generateTabset() {
  const name = Array.from(getRandomWord(getRandomInt(4, 7)))
    .map((x) => toTitleCase(x))
    .join(" ");
  const links = Array.from(getRandomLinks(getRandomInt(3, 20))).map((x) => {
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
  const data = new Array(50).fill(0).map((x) => generateTabset());
  console.log(JSON.stringify(data, null, "\t"));
}

main().catch((e) => console.error(e));
