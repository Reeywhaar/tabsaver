const s = require("@reeywhaar/svgmaker");

const size = 128;
const piece = n => size/128*n;
const prop = (x, n) => x/128*n;
const borderWidth = piece(12);
const smallWidth = size-(borderWidth*2);
const height = piece(110);
const topHeight = piece(26);
const innerheight = height - topHeight - borderWidth;
const radius = piece(18);
const innerRadius = prop(radius, 60);
const smallRadius = prop(radius, 20);
const circleRadius = piece(6);
const circleOffsetX = piece(76);
const circleOffsetY = piece(22);
const circleGap = piece(4);
const colors = {
	white: "#fff",
	black: "#000",
}

function format(str, ...replacements){
	return str.replace(/\{\}/g, x => replacements.shift());
}

function* range(max){
	for(let i = 0; i < max; i++) yield i;
}

const circle = x => s.e("circle", {
	fill: colors.black,
	r: circleRadius,
	cy: circleOffsetY,
	cx: x,
});

const circles = () => Array.from(range(3)).map(x => circle(
	circleOffsetX+((circleGap+circleRadius*2)*x)
));

const mask = s.e(
	"mask",
	{
		id: "icon",
	},
	[
		s.e("rect", {
			width: "100%",
			height: "100%",
			fill: colors.black
		}),
		s.rrect(
			0,
			(piece(128) - height)/2,
			size,
			height,
			radius,
			radius,
			radius,
			radius,
			{
				fill: colors.white,
			},
		),
		s.rrect(
			borderWidth,
			topHeight + (piece(128) - height)/2,
			smallWidth,
			innerheight,
			smallRadius,
			smallRadius,
			innerRadius,
			innerRadius,
			{
				fill: colors.black,
			},
		),
		...circles(),
	]
)

const svg = s.svgFile(
	size,
	size,
	{},
	[
		s.e("defs", {}, [mask]),
		s.e("rect", {
			width: "100%",
			height: "100%",
			fill: "context-fill #4c4c4c",
			"fill-opacity":"context-fill-opacity",
			mask:"url(#icon)",
		})
	]
)

module.exports = svg;
