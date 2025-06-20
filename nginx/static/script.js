const margin = { top: 50, right: 20, bottom: 20, left: 30 };

const colorScale = d3.scaleOrdinal()
    .domain(["Antena1", "Antena2", "Antena3", "Antena4", "Antena5", "Antena6", "Antena7", "Antena8", "Antena9", "Antena10"])
    .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"]);

let filteredData = [];

document.addEventListener('DOMContentLoaded', function() {
    const autoCheckbox = document.getElementById("auto");
    const minInput = document.getElementById("min");
    const maxInput = document.getElementById("max");

    function handleAutoChange() {
        if (autoCheckbox.checked) {
            minInput.disabled = true;
            minInput.style.borderColor = "lightgray";
            maxInput.disabled = true;
            maxInput.style.borderColor = "lightgray";
        } else {
            minInput.disabled = false;
            minInput.style.borderColor = "";
            maxInput.disabled = false;
            maxInput.style.borderColor = "";
        }
       
    }
    
    avgValueInput.checked = true;
    autoCheckbox.checked = true;
    handleAutoChange();
    
    autoCheckbox.addEventListener("change", handleAutoChange);
});

const maxValueInput = document.getElementById("maxv");
const avgValueInput = document.getElementById("avgv");
var choosenValue = "avg";

maxValueInput.addEventListener("change", () => {
    if (maxValueInput.checked) {
        avgValueInput.checked = false;
        choosenValue = "max";

    }
});

avgValueInput.addEventListener("change", () => {
    if (avgValueInput.checked) {
        maxValueInput.checked = false;
        choosenValue = "avg";
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const now = new Date();
    var userTimezoneOffset = now.getTimezoneOffset() * 60000;
    now.setTime(now.getTime() - userTimezoneOffset);
    const endDate = new Date(now);
    
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

   
    
    function formatDateForInput(date) {
        return date.toISOString().slice(0, 16);
    }
    
    document.getElementById('start').value = formatDateForInput(sevenDaysAgo);
    document.getElementById('end').value = formatDateForInput(endDate);
    
    document.getElementById('start').max = formatDateForInput(now);
    document.getElementById('end').max = formatDateForInput(now);
});

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
    var line = d3.line();
    if(avgValueInput.checked) {
        line = d3.line().x(d => x(d.date)).y(d => y(d.close));
    }
    else {
        line = d3.line().x(d => x(d.date)).y(d => y(d.max));
    }
        
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
            ];
            if (detailed === 0) {
                textLines.push(formatValue("Śr", d.close));
                textLines.push(formatValue("Maks", d.max ?? d.close));
                textLines.push(formatValue("Min", d.min ?? d.close));
            }
            else {
                textLines.push(formatValue("Wartość", d.close));
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
            size(text, path, event, d);
        }).on("pointerleave", () => tooltip.style("display", "none"))
          .on("touchstart", event => event.preventDefault());
    }

    function size(text, path, event, d) {
        const bbox = text.node().getBBox();
        const w = bbox.width;
        const h = bbox.height;
        const mouseY = d3.pointer(event)[1];
    
        let tooltipOffsetY;
        let arrowDirection;
        let arrowOffset;
        const yValue = y.invert(mouseY);
        
        if (yValue < d.close) {
            tooltipOffsetY = -(h + 20); 
            arrowDirection = -1; 
            arrowOffset = -5;
        } else {
            tooltipOffsetY = 20; 
            arrowDirection = 1; 
            arrowOffset = 5;
        }
    
        text.attr("transform", `translate(${-w / 2},${tooltipOffsetY + 10})`); 
        let arrowPath;
        
        if(arrowDirection === 1) {
            arrowPath = `
            M${-w / 2 - 10},${arrowOffset}
            H-5
            l5,${arrowDirection * -5}
            l5,${arrowDirection * 5}
            H${w / 2 + 10}
            v${h + 20}
            h-${w + 20}
            z
        `
        } else {    
            arrowPath = `
            M${-w / 2 - 10},${arrowOffset}
            H-5
            l5,${arrowDirection *-5}
            l5,${arrowDirection * 5}
            H${w / 2 + 10}
            v-${h + 30}
            h-${w + 20}
            z
        `
        };
    
        path.attr("d", arrowPath);
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



fetch(`${window.location.origin}/get_antennas`)
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

    // --- Clear cache if date range does not overlap ---
    function isOverlap(aStart, aEnd, bStart, bEnd) {
        return aStart <= bEnd && bStart <= aEnd;
    }

    const lastRange = JSON.parse(localStorage.getItem('lastDateRange'));
    if (lastRange) {
        const lastStart = new Date(lastRange.start);
        const lastEnd = new Date(lastRange.end);
        if (!isOverlap(startTime, endTime, lastStart, lastEnd)) {
            // Remove only antennaData_* keys
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('antennaData_')) {
                    localStorage.removeItem(key);
                }
            });
        }
    }
    // Save current range
    localStorage.setItem('lastDateRange', JSON.stringify({ start: startTime.toISOString(), end: endTime.toISOString() }));

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

    function fromDateToString(date){
        date = new Date(+date);
        date.setTime(date.getTime() - (date.getTimezoneOffset() * 60000));
        let dateAsString =  date.toISOString().substr(0, 19);
        return dateAsString;
    }

    // --- LocalStorage cache helpers ---
    function getCacheKey(antenna, start, end, detailed) {
        return `antennaData_${antenna}_${start}_${end}_${detailed}`;
    }
    function saveToCache(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            // If storage is full, ignore
        }
    }
    function loadFromCache(key) {
        const item = localStorage.getItem(key);
        if (!item) return null;
        try {
            return JSON.parse(item);
        } catch {
            return null;
        }
    }
    // ---

    const promises = selectedAntennas.map(antenna => {
        const name = antenna;
        const startStr = fromDateToString(startTime);
        const endStr = fromDateToString(endTime);
        const cacheKey = getCacheKey(name, startStr, endStr, detailed);

        // Try to load from cache
        const cached = loadFromCache(cacheKey);
        if (cached && Array.isArray(cached) && cached.length > 0) {
            // Convert date strings back to Date objects
            return Promise.resolve(cached.map(d => ({
                ...d,
                date: new Date(d.date)
            })));
        }

        // Not cached, fetch from server
        return fetch(`${window.location.origin}/get_real_data?antenna=${name}&start_time=${startStr}&stop_time=${endStr}&detailed=${detailed}`)
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
                    } else {
                        const { value } = values;
                        if (!Array.isArray(value)) continue;
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
                    alert(`Brak prawidłowych danych dla ${antenna}.`);
                    return [];
                }

                // Save to cache (dates as ISO strings)
                saveToCache(cacheKey, antennaData.map(d => ({
                    ...d,
                    date: d.date.toISOString()
                })));

                return antennaData;
            })
            .catch(error => {
                alert(`Wystąpił problem z pobieraniem danych dla ${antenna}.`);
                return [];
            });
    });

    Promise.all(promises)
    .then(results => {
        const aapl = results.flat();

        filteredData = aapl.filter(d => d.date >= startTime && d.date <= endTime);

        if (filteredData.length === 0) {
            alert('Brak danych do wyświetlenia dla wybranego przedziału czasowego.');
            return;
        }
        drawChart(filteredData, startTime, endTime, minValue, maxValue, detailed, selectedAntennas);

        if (detailed === 0) {
            document.getElementById('alert').textContent = `Używasz trybu uśredniającego`;
        }
        else {
            document.getElementById('alert').textContent = ``;
        }

        if (selectedAntennas.length === 1) {
            if (detailed === 0) {
                const avg = d3.mean(filteredData, d => d.close);
                const max = d3.max(filteredData, d => d.max);
                const min = d3.min(filteredData, d => d.min);

                document.getElementById('avg').textContent = `Średnia: ${avg.toFixed(2)} dBm`;
                document.getElementById('max-label').textContent = `Maks: ${max.toFixed(2)} dBm`;
                document.getElementById('min-label').textContent = `Min: ${min.toFixed(2)} dBm`;
            } else {
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

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "data.csv";
    link.click();

    URL.revokeObjectURL(url);
});

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

        legendRow.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", colorScale(antenna));

        legendRow.append("text")
            .attr("x", 16)
            .attr("y", 10)
            .attr("dy", "0.32em")
            .attr("fill", "currentColor")
            .style("font-size", "12px")
            .text(antenna);
    });
    
}
