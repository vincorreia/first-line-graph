/*
*    main.js
*    Mastering Data Visualization with D3.js
*    6.8 - Line graphs in D3
*/
// time parser for x-scale
const parseTime = d3.timeParse("%d/%m/%Y")
const formatTime = d3.timeFormat("%d/%m/%Y")
const MARGIN = { LEFT: 100, RIGHT: 100, TOP: 50, BOTTOM: 100 }
const WIDTH = 800 - MARGIN.LEFT - MARGIN.RIGHT
const HEIGHT = 500 - MARGIN.TOP - MARGIN.BOTTOM
let coin = "bitcoin"
let information = "price_usd"
let label_text = "Price in Dollars"

const svg = d3.select("#chart-area").append("svg")
  .attr("width", WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
  .attr("height", HEIGHT + MARGIN.TOP + MARGIN.BOTTOM)

const g = svg.append("g")
  .attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`)


// for tooltip
const bisectDate = d3.bisector(d => d.date).left

// scales
const x = d3.scaleTime().range([0, WIDTH])
const y = d3.scaleLinear().range([HEIGHT, 0])

// line path generator
const line = d3.line()
	.x(d => x(d.date))
	.y(d => y(d[information]))

// axis groups
const xAxis = g.append("g")
	.attr("class", "x axis")
	.attr("transform", `translate(0, ${HEIGHT})`)
const yAxis = g.append("g")
	.attr("class", "y axis")
    
// y-axis label
const yLabel = yAxis.append("text")
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
			day[information] = Number(day[information])
			day["24h_vol"] = Number(day["24h_vol"])
		})
	})

	// Update data whenever selection changes
	$("#coin-select")
		.on("change", () =>{
			coin = $("#coin-select").val()
			update(data)
		})
	
	$("#var-select")
		.on("change", () => {
			information = $("#var-select").val()
			label_text = $("#var-select option:selected").text()
			update(data)
		})
	// Create date slider, user is able use it to show only an specific date range
	$("#date-slider").slider({
		range: true,
		max: parseTime("31/10/2017").getTime(),
		min: parseTime("12/5/2013").getTime(),
		step: 86400000,
		values: [
			parseTime("12/5/2013").getTime(),
			parseTime("31/10/2017").getTime()
		],
		slide: (event, ui) => {
			$("#dateLabel1").text(formatTime(new Date(ui.values[0])))
			$("#dateLabel2").text(formatTime(new Date(ui.values[1])))
			update(data)
		}
	})
	// add line to chart
		let path = g.append("path")
		.attr("class", "line")
		.attr("fill", "none")
		.attr("stroke", "grey")
		.attr("stroke-width", "3px")
		.attr("d", line(data[coin]))

	update(data)
	function update(data) {
		const t = d3.transition().duration(100)
		const sliderValues = $("#date-slider").slider("values")

		let filteredData = data[coin].filter(d => d.date <= sliderValues[1] && d.date >= sliderValues[0])
		// set & update scale domains
		
		x.domain(d3.extent(filteredData, d => d.date))
		y.domain([
			d3.min(filteredData, d => d[information]) / 1.005, 
			d3.max(filteredData, d => d[information]) * 1.005
		])
		// axis generators
		const xAxisCall = d3.axisBottom()
		const yAxisCall = d3.axisLeft()
		.ticks(6)
		
		// generate axis once scales are updated
		xAxisCall.scale(x)
		xAxis.transition(t).call(xAxisCall)
		yAxis.transition(t).call(yAxisCall.scale(y))

		// update Y label to the current information shown
		yLabel.text(label_text)

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
			const i = bisectDate(filteredData, x0, 1)
			const d0 = filteredData[i - 1]
			const d1 = filteredData[i]
			const d = x0 - d0.date > d1.date - x0 ? d1 : d0
			focus.attr("transform", `translate(${x(d.date)}, ${y(d[information])})`)
			focus.select("text").text(d[information])
			focus.select(".x-hover-line").attr("y2", HEIGHT - y(d[information]))
			focus.select(".y-hover-line").attr("x2", -x(d.date))
		}


		/******************************** Tooltip Code ********************************/
		// remove previous generated line on the graph
		path.exit().remove()

		// create new line on the graph with updated information.
		path.transition(t).attr("d", line(filteredData))
	}
})
