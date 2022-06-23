/*
*    main.js
*    Mastering Data Visualization with D3.js
*    6.8 - Line graphs in D3
*/
		
const MARGIN = { LEFT: 50, RIGHT: 100, TOP: 50, BOTTOM: 100 }
const WIDTH = 800 - MARGIN.LEFT - MARGIN.RIGHT
const HEIGHT = 500 - MARGIN.TOP - MARGIN.BOTTOM
let coin = "bitcoin"

const t = d3.transition().duration(100)

const svg = d3.select("#chart-area").append("svg")
  .attr("width", WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
  .attr("height", HEIGHT + MARGIN.TOP + MARGIN.BOTTOM)

const g = svg.append("g")
  .attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`)

// time parser for x-scale
const parseTime = d3.timeParse("%d/%m/%Y")
// for tooltip
const bisectDate = d3.bisector(d => d.date).left

// scales
const x = d3.scaleTime().range([0, WIDTH])
const y = d3.scaleLinear().range([HEIGHT, 0])

// line path generator
const line = d3.line()
	.x(d => x(d.date))
	.y(d => y(d.price_usd))

// axis generators
const xAxisCall = d3.axisBottom()

// axis groups
const xAxis = g.append("g")
	.attr("class", "x axis")
	.attr("transform", `translate(0, ${HEIGHT})`)
	.transition(t)
const yAxis = g.append("g")
	.attr("class", "y axis")
    
// y-axis label
yAxis.append("text")
	.attr("class", "axis-title")
	.attr("transform", "rotate(-90)")
	.attr("y", 6)
	.attr("dy", ".71em")
	.style("text-anchor", "end")
	.attr("fill", "#5D6971")
	.text("Price USD ($)")

d3.json("data/coins.json").then(data => {
	// clean data
	Object.entries(data).forEach(entry => {
		entry[1].forEach(day => {
			day.date = parseTime(day.date)
			day.market_cap = Number(day.market_cap)
			day.price_usd = Number(day.price_usd)
			day["24h_vol"] = Number(day["24h_vol"])
		})
	})

	// Update data whenever selection changes
	$("#coin-select")
		.on("change", () =>{
			coin = $("#coin-select").val()
			update(data)
		})
	

	// add line to chart
		let path = g.append("path")
		.attr("class", "line")
		.attr("fill", "none")
		.attr("stroke", "grey")
		.attr("stroke-width", "3px")
		.attr("d", line(data[coin]))

	/******************************** Tooltip Code ********************************/

	const focus = g.append("g")
		.attr("class", "focus")
		.style("display", "none")

	focus.append("line")
		.attr("class", "x-hover-line hover-line")
		.attr("y1", 0)
		.attr("y2", HEIGHT)

	focus.append("line")
		.attr("class", "y-hover-line hover-line")
		.attr("x1", 0)
		.attr("x2", WIDTH)

	focus.append("circle")
		.attr("r", 7.5)

	focus.append("text")
		.attr("x", 15)
		.attr("dy", ".31em")

	g.append("rect")
		.attr("class", "overlay")
		.attr("width", WIDTH)
		.attr("height", HEIGHT)
		.on("mouseover", () => focus.style("display", null))
		.on("mouseout", () => focus.style("display", "none"))
		.on("mousemove", mousemove)

	function mousemove() {
		const x0 = x.invert(d3.mouse(this)[0])
		const i = bisectDate(data[coin], x0, 1)
		const d0 = data[coin][i - 1]
		const d1 = data[coin][i]
		const d = x0 - d0.date > d1.date - x0 ? d1 : d0
		focus.attr("transform", `translate(${x(d.date)}, ${y(d.price_usd)})`)
		focus.select("text").text(d.price_usd)
		focus.select(".x-hover-line").attr("y2", HEIGHT - y(d.price_usd))
		focus.select(".y-hover-line").attr("x2", -x(d.date))
	}
	
	update(data)
	/******************************** Tooltip Code ********************************/
	function update(data) {
		// set & update scale domains
		x.domain(d3.extent(data[coin], d => d.date))
		y.domain([
			d3.min(data[coin], d => d.price_usd) / 1.005, 
			d3.max(data[coin], d => d.price_usd) * 1.005
		])

		const yAxisCall = d3.axisLeft()
		.ticks(6)

		// generate axis once scales are updated
		xAxis.call(xAxisCall.scale(x))
		yAxis.transition(t).call(yAxisCall.scale(y))

		path.exit().remove()

		path.transition(t).attr("d", line(data[coin]))
	}
})
