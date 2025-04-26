const margin = { top: 50, right: 20, bottom: 20, left: 30 };

const colorScale = d3.scaleOrdinal()
    .domain(["Antena1", "Antena2", "Antena3", "Antena4", "Antena5", "Antena6", "Antena7", "Antena8", "Antena9", "Antena10"])
    .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"]);

let filteredData = [];

function splitContinuousSegments(data, maxGapMillis) {
    const segments = [];
    let currentSegment = [data[0]];
    for (let i = 1; i < data.length; i++) {
        const gap = data[i].date - data[i - 1].date;
        if (gap <= maxGapMillis) {
            currentSegment.push(data[i]);
        } else {
            segments.push({ data: currentSegment, isContinuous: true });
            segments.push({ data: [data[i - 1], data[i]], isContinuous: false });
            currentSegment = [data[i]];
        }
    }
    if (currentSegment.length > 0) segments.push({ data: currentSegment, isContinuous: true });
    return segments;
}

function formatValue(label, value) {
    return `${label}: ${value.toFixed(2)} dBm`;
}

function formatDate(date) {
    return date.toLocaleString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function drawChart(aapl, startTime, endTime, minValue, maxValue, detailed, selectedAntennas) {
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    const maxGapMillis = 15 * 60 * 1000;
    const x = d3.scaleTime().domain([startTime, endTime]).range([0, width]);

    if (document.getElementById("auto").checked) {
        minValue = d3.min(aapl, d => d.close) - 1;
        maxValue = d3.max(aapl, d => d.close) + 1;
    }

    const y = d3.scaleLinear().domain([maxValue, minValue]).nice().range([margin.top, height - margin.bottom]);
    const line = d3.line().x(d => x(d.date)).y(d => y(d.close));
    const dataByAntenna = d3.group(aapl, d => d.antenna);

    d3.select("#container").select("svg").remove();
    const svg = d3.select("#container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("style", "max-width: 100%;");

    dataByAntenna.forEach((antennaData, antenna) => {
        const segments = splitContinuousSegments(antennaData, maxGapMillis);
        segments.forEach(segment => {
            svg.append("path")
                .datum(segment.data)
                .attr("fill", "none")
                .attr("stroke", colorScale(antenna))
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", segment.isContinuous ? "0" : "5,5")
                .attr("d", line);
        });
    });

    if (selectedAntennas.length === 1) {
        const bisect = d3.bisector(d => d.date).center;
        const tooltip = svg.append("g");
        svg.on("pointerenter pointermove", event => {
            const i = bisect(aapl, x.invert(d3.pointer(event)[0]));
            const d = aapl[i];
            tooltip.style("display", null).attr("transform", `translate(${x(d.date)},${y(d.close)})`);
            tooltip.select("circle").attr("cx", 0).attr("cy", 0);
            const path = tooltip.selectAll("path").data([{}]).join("path")
                .attr("fill", "white").attr("opacity", 1).attr("stroke", "black");

            const textLines = [
                `Data: ${formatDate(d.date)}`,
                formatValue("Śr", d.close),
            ];
            if (detailed === 0) {
                textLines.push(formatValue("Maks", d.max ?? d.close));
                textLines.push(formatValue("Min", d.min ?? d.close));
            }

            const text = tooltip.selectAll("text").data([{}]).join("text").call(text =>
                text.selectAll("tspan")
                    .data(textLines)
                    .join("tspan")
                    .attr("x", 0)
                    .attr("y", (_, i) => `${i * 1.1}em`)
                    .attr("font-weight", (_, i) => i ? null : "bold")
                    .text(d => d)
            );
            size(text, path);
        }).on("pointerleave", () => tooltip.style("display", "none"))
          .on("touchstart", event => event.preventDefault());
    }

    function size(text, path) {
        const { x, y, width: w, height: h } = text.node().getBBox();
        text.attr("transform", `translate(${-w / 2},${15 - y})`);
        path.attr("d", `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
    }

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(height / 40))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - margin.left - margin.right)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", -margin.left)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text("Wartość w dBm"));

    addLegend(svg, Array.from(dataByAntenna.keys()), colorScale);
}



fetch(`http://127.0.0.1:5000/get_antennas`)
.then(response => response.json())
.then(data => {
    const selectContainer = document.getElementById('select-container');

    data.content.forEach(antenna => {
        const wrapper = document.createElement('div');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'Antena'; 
        checkbox.id = antenna;
        checkbox.value = antenna;

        const label = document.createElement('label');
        label.htmlFor = antenna;
        label.textContent = antenna;

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        });

        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        selectContainer.appendChild(wrapper);
    });
});


//Button - Fetch JSON Data and Update Chart
document.getElementById("fetch-data").addEventListener("click", () => {

    const checkboxes = document.querySelectorAll('input[name="Antena"]');
    const selectedAntennas = [];

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedAntennas.push(checkbox.value.toLowerCase());
        }
    });


    const startTime = new Date(document.getElementById('start').value);
    const endTime = new Date(document.getElementById('end').value);

    var Time = new Date(endTime.getTime() - startTime.getTime());
    var detailed = Time / 1000 / 60 / 60 / 24 >= 1.5 ? 0 : 1;

    const minValue = Number(document.getElementById('min').value);
    const maxValue = Number(document.getElementById('max').value);


    if (isNaN(startTime) || isNaN(endTime)) {
        alert('Podaj prawidłowy przedział czasowy.');
        return;
    }
    if (startTime >= endTime) {
        alert('Data początkowa musi być wcześniejsza niż data końcowa.');
        return;
    }
    if (selectedAntennas.length === 0) {
        alert('Wybierz co najmniej jedną antenę.');
        return;
    }

        // Function to convert date to string format, that does not change the time zone
        function fromDateToString(date){
            date = new Date(+date);
            date.setTime(date.getTime() - (date.getTimezoneOffset() * 60000));
            let dateAsString =  date.toISOString().substr(0, 19);
            return dateAsString;
        }


        const promises = selectedAntennas.map(antenna => {
            const name = antenna;
            return fetch(`http://127.0.0.1:5000/get_real_data?antenna=${name}&start_time=${fromDateToString(startTime)}&stop_time=${fromDateToString(endTime)}&detailed=${detailed}`)
                .then(response => response.json())
                .then(result => {

                    const intervalMs = 3125;
                    let antennaData = [];

                    for (const [startDateStr, values] of Object.entries(result)) {
                        const startDate = new Date(startDateStr);

                        if (detailed === 0) {
                            const { avg, max, min } = values;
                            antennaData.push({
                                date: startDate,
                                close: avg,
                                max: max,
                                min: min,
                                antenna: antenna
                            });
                            if(selectedAntennas.length === 1) {
                            }

                        } else {
                            const { avg, max, min, value } = values;

                            if (!Array.isArray(value)) {
                                console.warn(`Oczekiwano tablicy wartości dla ${antenna}, otrzymano:`, value);
                                continue;
                            }

                            const partialData = value.map((val, idx) => {
                                if (val !== null && val !== undefined && !isNaN(val) && val <= 200 && val >= -200) {
                                    return {
                                        date: new Date(startDate.getTime() + idx * intervalMs),
                                        close: parseFloat(val),
                                        antenna: antenna
                                    };
                                } else {
                                    return null;
                                }
                            }).filter(d => d !== null);

                            antennaData = antennaData.concat(partialData);

                        }
                    }

                
                    if (antennaData.length === 0) {
                        console.warn(`Brak prawidłowych danych w tablicy dla ${antenna}.`);
                        alert(`Brak prawidłowych danych dla ${antenna}.`);
                        return [];
                    }
                
                    return antennaData
                })
                .catch(error => {
                    console.error(`Error fetching data for ${antenna}:`, error);
                    alert(`Wystąpił problem z pobieraniem danych dla ${antenna}.`);
                    return [];
                });
        });


        Promise.all(promises)
        .then(results => {
            const aapl = results.flat();
            console.log(aapl);

            // Filtering the data by date
            filteredData = aapl.filter(d => d.date >= startTime && d.date <= endTime);

            if (filteredData.length === 0) {
                alert('Brak danych do wyświetlenia dla wybranego przedziału czasowego.');
                return;
            }
            drawChart(filteredData, startTime, endTime, minValue, maxValue, detailed, selectedAntennas);

            if (selectedAntennas.length === 1) {
                if (detailed === 0) {
                    // Dane już zawierają avg, min, max — wystarczy je wyciągnąć
                    const avg = d3.mean(filteredData, d => d.close);
                    const max = d3.max(filteredData, d => d.max);
                    const min = d3.min(filteredData, d => d.min);
            
                    document.getElementById('avg').textContent = `Średnia: ${avg.toFixed(2)} dBm`;
                    document.getElementById('max-label').textContent = `Maks: ${max.toFixed(2)} dBm`;
                    document.getElementById('min-label').textContent = `Min: ${min.toFixed(2)} dBm`;
                } else {
                    // detailed === 1: dane to surowe próbki, liczymy statystyki z wartości close
                    const avg = d3.mean(filteredData, d => d.close);
                    const max = d3.max(filteredData, d => d.close);
                    const min = d3.min(filteredData, d => d.close);
            
                    document.getElementById('avg').textContent = `Średnia: ${avg.toFixed(2)} dBm`;
                    document.getElementById('max-label').textContent = `Maks: ${max.toFixed(2)} dBm`;
                    document.getElementById('min-label').textContent = `Min: ${min.toFixed(2)} dBm`;
                }
            }
            else{
                document.getElementById('avg').textContent = `Średnia: -`;
                document.getElementById('max-label').textContent = `Maks: -`;
                document.getElementById('min-label').textContent = `Min: -`;
            }

            const container = document.getElementById('container');
            const resizeObserver = new ResizeObserver(() => {
                if (filteredData.length > 0) {
                    const startTime = new Date(document.getElementById('start').value);
                    const endTime = new Date(document.getElementById('end').value);
                    const minValue = Number(document.getElementById('min').value);
                    const maxValue = Number(document.getElementById('max').value);
                    drawChart(filteredData, startTime, endTime, minValue, maxValue, detailed, selectedAntennas);
                }
});
resizeObserver.observe(container);
        })
        .catch(error => {
            console.error("Error fetching data:", error);
        });
});
document.getElementById("export-data").addEventListener("click", () => {
    // Checking whether there is something to export
    if (!filteredData || filteredData.length === 0) {
        alert('Brak danych do eksportu.');
        return;
    }

    //Converting to CSV
    function convertToCSV(data) {
        const header = ["Data", "Wartosc (dBm)", "Antena"];
        const rows = data.map(d => {
            return [
                d.date.toISOString(), 
                d.close,
                d.antenna
            ].join(";");
        });
        return [header.join(";"), ...rows].join("\n");
    }

    const csvData = convertToCSV(filteredData);

    // Creating blob object with csv data
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "data.csv";
    link.click();

    //Clearing the data
    URL.revokeObjectURL(url);
});
// Button to export the data as JSON
document.getElementById("export-json").addEventListener("click", () => {
    if (!filteredData || filteredData.length === 0) {
        alert("Brak danych do eksportu.");
        return;
    }

    const jsonBlob = new Blob([JSON.stringify(filteredData, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const link = document.createElement("a");
    link.href = jsonUrl;
    link.download = 'data.json';
    link.click();
});

function addLegend(svg, antennas, colorScale) {

    const width = container.offsetWidth;

    const legend = svg.append("g")
        .attr("transform", `translate(${width - margin.right - 100}, ${margin.top})`)
        .attr("class", "legend");

    antennas.forEach((antenna, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`);

        // Add rectangle with color
        legendRow.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", colorScale(antenna));

        // Add text next to the rectangle
        legendRow.append("text")
            .attr("x", 16)
            .attr("y", 10)
            .attr("dy", "0.32em")
            .attr("fill", "currentColor")
            .style("font-size", "12px")
            .text(antenna);
    });
    
}
