const s = require("@reeywhaar/svgmaker");

const size = 128;
const piece = n => size/128*n;
const prop = (x, n) => x/128*n;
const borderWidth = piece(14);
const smallWidth = size-(borderWidth*2);
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
		s.e("rect", {
			width: size,
			height: piece(110),
			fill: colors.white,
			rx: radius,
			ry: radius,
			y: piece(9),
		}),
		s.e("rect", {
			width: smallWidth,
			height: piece(70),
			fill: colors.black,
			rx: innerRadius,
			ry: innerRadius,
			x: borderWidth,
			y: borderWidth+piece(21),
		}),
		s.e("rect", {
			width: smallWidth,
			height: piece(20),
			fill: colors.black,
			rx: smallRadius,
			ry: smallRadius,
			x: borderWidth,
			y: borderWidth+piece(21),
		}),
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

console.log(svg.toString());