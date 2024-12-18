// Declare the chart dimensions and margins.
const width = 928;
const height = 500;
const marginTop = 20;
const marginRight = 30;
const marginBottom = 30;
const marginLeft = 40;

// Function to draw the chart with JSON data
function drawChart(aapl) {
    // Map data if needed
    const aaplMissing = aapl.map(d => ({
        ...d,
        close: d.date.getUTCMonth() < 3 ? NaN : d.close
    }));

    // Declare the x (horizontal position) scale.
    const x = d3.scaleUtc()
        .domain(d3.extent(aapl, d => d.date))
        .range([marginLeft, width - marginRight]);

    // Declare the y (vertical position) scale.
    const y = d3.scaleLinear()
        .domain([0, d3.max(aapl, d => d.close)])
        .nice()
        .range([marginTop,height - marginBottom ]);

    // Declare the line generator.
    const line = d3.line()
        .defined(d => !isNaN(d.close))
        .x(d => x(d.date))
        .y(d => y(d.close));

    // Clear existing SVG if any
    d3.select("#container").select("svg").remove();

    // Create the SVG container.
    const svg = d3.select("#container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    // Add the x-axis.
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

    // Add the y-axis, remove the domain line, add grid lines and a label.
    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y).ticks(height / 40))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - marginLeft - marginRight)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", -marginLeft)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text("Wartość w dB"));

    // Append a path for the background line.
    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1.5)
        .attr("d", line(aaplMissing.filter(d => !isNaN(d.close))));

    // Append a path for the main line.
    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line(aaplMissing));
}


//Button - Fetch JSON Data and Update Chart
document.getElementById("fetch-data").addEventListener("click", () => {
    fetch("http://localhost/data")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Convert JSON data to the format expected by drawChart
            const formattedData = data.map(d => ({
                date: new Date(d.date),  // Assuming data contains 'date' in ISO format
                close: +d.close           // Assuming data contains 'close' as a number
            }));

            // Draw the chart with the fetched JSON data
            drawChart(formattedData);
        })
        .catch(error => {
            console.error("Error fetching data:", error);
        });
});
