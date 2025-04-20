// Declare the chart dimensions and margins.
const width = 928;
const height = 500;
const marginTop = 20;
const marginRight = 30;
const marginBottom = 30;
const marginLeft = 40;
const selectedAntennas = [];


// colorScale for each antenna
const colorScale = d3.scaleOrdinal()
    .domain(["Antena1", "Antena2", "Antena3", "Antena4", "Antena5", "Antena6", "Antena7", "Antena8", "Antena9", "Antena10"]) 
    .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"]);

let filteredData = []; 

// Function to iterate the antennas selected by the user
function iterateSelectedAntennas(selectedAntennas, callback) {
    if (selectedAntennas && Array.isArray(selectedAntennas)) {
      for (const antenna of selectedAntennas) {
        callback(antenna);
      }
    }
  }
// Function to set the maximum date to current time
function setMaxDate() {
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 16);
    document.getElementById('start').max = formattedDate;
    document.getElementById('end').max = formattedDate;
}
window.onload = setMaxDate;

// Function to divide the data to segments in order to differentiate the missing and valid parts 
function splitContinuousSegments(data, maxGapMillis) {
    const segments = [];
    let currentSegment = [data[0]];

    for (let i = 1; i < data.length; i++) {
        const gap = data[i].date - data[i - 1].date;
        if (gap <= maxGapMillis) {
            currentSegment.push(data[i]);
        } else {
            segments.push({ data: currentSegment, isContinuous: true });
            currentSegment = [data[i]];
            segments.push({ data: [data[i - 1], data[i]], isContinuous: false });
        }
    }

    if (currentSegment.length > 0) {
        segments.push({ data: currentSegment, isContinuous: true });
    }

    return segments;
}

// Function to draw the chart with JSON data
function drawChart(aapl, startTime, endTime, minValue, maxValue) {

    // Max gap is set to 5 mninutes
    const maxGapMillis = 5 * 60 * 1000; 
    const segments = splitContinuousSegments(aapl, maxGapMillis);

    // Map data if needed
    const aaplMissing = aapl.map(d => ({
        ...d,
        close: d.date.getUTCMonth() < 3 ? NaN : d.close
    }));

    // Declare the x (horizontal position) scale.
    const x = d3.scaleTime() 
    .domain([startTime, endTime])
    .range([0, width]);

    // Declare the y (vertical position) scale.
    const y = d3.scaleLinear()
        .domain([maxValue,minValue])
        .nice()
        .range([marginTop,height - marginBottom ]);

    // Declare the line generator.
    const line= d3.line()
    .x(d => x((d.date)))  
    .y(d => y(d.close));

    // Group data by antenna (assuming aapl has an 'antenna' property)
    const dataByAntenna = d3.group(aapl, d => d.antenna);


    // Clear existing SVG if any
    d3.select("#container").select("svg").remove();

    // Create the SVG container.
    const svg = d3.select("#container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");


    // Draw paths for each antenna separately
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


// Adding X and Y axes
svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

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
        checkbox.name = 'Antena'; //
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

    console.log(selectedAntennas);

    const startTime = new Date(document.getElementById('start').value);
    const endTime = new Date(document.getElementById('end').value);

    const minValue = Number(document.getElementById('min').value);
    const maxValue = Number(document.getElementById('max').value);



    // Checking whether the correct time period is chosen

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

    alert(`Wybrany przedział czasowy: ${startTime.toLocaleString()} - ${endTime.toLocaleString()}`);


        // Function to convert date to string format, that does not change the time zone
        function fromDateToString(date){
            date = new Date(+date);
            date.setTime(date.getTime() - (date.getTimezoneOffset() * 60000));
            let dateAsString =  date.toISOString().substr(0, 19);
            return dateAsString;
        }


        const promises = selectedAntennas.map(antenna => {
            const name = antenna;
            return fetch(`http://127.0.0.1:5000/get_real_data?antenna=${name}&start_time=${fromDateToString(startTime)}&stop_time=${fromDateToString(endTime)}`)
                .then(response => response.json())
                .then(result => {

                    const intervalMs = 3125;
                    let antennaData = [];
                
                    for (const [startDateStr, values] of Object.entries(result)) {
                        const startDate = new Date(startDateStr);
                
                        if (!Array.isArray(values)) {
                            console.warn(`Oczekiwano tablicy wartości dla ${antenna}, otrzymano:`, values);
                            continue;
                        }
                
                        const partialData = values.map((val, idx) => {
                            console.log(val)
                            if (val !== null && val !== undefined && !isNaN(val) && val <= 50 && val >= -150) {
                                return {
                                    date: new Date(startDate.getTime() + idx * intervalMs),
                                    close: parseFloat(val),
                                    antenna: antenna,
                                };
                            } else {
                                console.warn(`Nieprawidłowa wartość dla ${antenna} w indeksie ${idx} (data początkowa ${startDateStr}):`, val);
                                return null;
                            }
                        }).filter(d => d !== null);
                
                        antennaData = antennaData.concat(partialData);
                    }
                
                    if (antennaData.length === 0) {
                        console.warn(`Brak prawidłowych danych w tablicy dla ${antenna}.`);
                        alert(`Brak prawidłowych danych dla ${antenna}.`);
                        return [];
                    }
                
                    return antennaData;
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

            // Filtering the data by date
            const filteredData = aapl.filter(d => d.date >= startTime && d.date <= endTime);
            console.log(filteredData);

            if (filteredData.length === 0) {
                alert('Brak danych do wyświetlenia dla wybranego przedziału czasowego.');
                return;
            }
            console.log(filteredData);
            drawChart(filteredData, startTime, endTime, minValue, maxValue);
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
    const legend = svg.append("g")
        .attr("transform", `translate(${width - marginRight - 100}, ${marginTop})`)
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