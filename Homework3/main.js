function createMultiLinePlot(data) {
    const margin = { top: 40, right: 20, bottom: 60, left: 100 };
    const width = 800 - margin.left - margin.right;
    const height = 360 - margin.top - margin.bottom;

    const svg = d3.select("#overview-chart-container")
                  .append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", `translate(${margin.left},${margin.top})`);

    data.forEach(d => { d.Price = +d.Price;});

    const nestedData = d3.nest()
                         .key(d => d.Label)
                         .entries(data);

    const xScale = d3.scaleLinear()
                     .domain([0, d3.max(data, d => d.Price)])
                     .range([0, width]);

    const yScale = d3.scaleLinear()
                     .domain([1.0, d3.max(data, d => d.Rank)])
                     .range([height, 0]);

    const line = d3.line()
                   .defined(d => !isNaN(d.AvgRank))
                   .x(d => xScale(d.Price))
                   .y(d => yScale(d.AvgRank));

    nestedData.forEach((group, i) => {
        const label = group.key;
        const values = group.values;
        const priceRanges = d3.range(0, d3.max(data, d => d.Price) + 10, 10);
        const avgRanks = priceRanges.map(price => {
            const filteredData = values.filter(d => d.Price >= price && d.Price < price + 10);
            const avgRank = d3.mean(filteredData, d => d.Rank);
            return { Price: price, AvgRank: avgRank };
        });

        const filteredAvgRanks = avgRanks.filter(d => !isNaN(d.AvgRank));

        svg.append("path")
           .datum(filteredAvgRanks)
           .classed("line", true) // Add the .line class here
           .attr("fill", "none")
           .attr("stroke", ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#8c510a"][i % 6])
           .attr("stroke-width", 2)
           .attr("d", line);

        const legendBoxWidth = 80;
        const legendBoxHeight = nestedData.length * 20 + 20;
        svg.append("rect")
           .attr("x", width - 170)
           .attr("y", 60)
           .attr("width", legendBoxWidth)
           .attr("height", legendBoxHeight)
           .attr("fill", "none")
           .attr("stroke", "black")
           .attr("stroke-width", 1);

        svg.append("text")
           .attr("x", width - 160)
           .attr("y", 80 + 20 * i)
           .attr("dy", "0.35em")
           .style("font-size", "12px")
           .style("fill", ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#8c510a"][i % 6])
           .text(label);
    });

    const xAxis = svg.append("g")
       .attr("transform", `translate(0,${height})`)
       .call(d3.axisBottom(xScale).tickValues(d3.range(0, d3.max(data, d => d.Price) + 10, 10)));

    svg.append("g")
       .call(d3.axisLeft(yScale));

    svg.append("text")
       .attr("x", width / 2)
       .attr("y", height + margin.top)
       .attr("text-anchor", "middle")
       .text("Price Range");

    svg.append("text")
       .attr("transform", "rotate(-90)")
       .attr("x", -height / 2)
       .attr("y", -margin.left / 2)
       .attr("dy", "1em")
       .attr("text-anchor", "middle")
       .text("Average Rank");

    svg.append("text")
       .attr("x", width / 2)
       .attr("y", -margin.top / 2)
       .attr("text-anchor", "middle")
       .style("font-size", "1.2em")
       .text("Average Rank vs Price Range by Label");

    // Add brushing
    const brush = d3.brushX()
                   .extent([[0, 0], [width, height]])
                   .on("end", brushed);

    svg.append("g")
       .attr("class", "brush")
       .call(brush);

function brushed() {
    const selection = d3.event.selection;
    if (selection) {
        var [x0, x1] = selection.map(xScale.invert);
        console.log(x0, x1);
        x0 = Math.floor(x0/10)*10;
        x1 = Math.ceil(x1/10)*10;
        xScale.domain([x0, x1]);
        console.log(x0, x1);
        
        // Update the x-axis with new tick values based on the updated xScale domain
        xAxis.call(d3.axisBottom(xScale).ticks(Math.floor((x1 - x0) / 10)));

        // Redraw the lines based on the new xScale
        svg.selectAll(".line")
           .attr("d", d => {
               const filteredData = d.filter(datum => datum.Price >= x0 && datum.Price <= x1);
               return line(filteredData);
           });
    }
}

    // Revert when double-clicked
    svg.on("dblclick", function() {
      xScale.domain([0, d3.max(data, d => d.Price)]);
      xAxis.call(d3.axisBottom(xScale).tickValues(d3.range(0, d3.max(data, d => d.Price) + 10, 10)));
      svg.selectAll(".line").attr("d", line);
    });
}




function createPieChart(data) {
    // Count the occurrences of each label
    var labelCounts = {};
    data.forEach(function(d) {
        var label = d.Label;
        labelCounts[label] = (labelCounts[label] || 0) + 1;
    });

    // Convert label counts to an array of objects
    var labelData = Object.keys(labelCounts).map(function(label) {
        return { label: label, count: labelCounts[label] };
    });

    // Calculate total count of labels
    var totalCount = d3.sum(labelData, function(d) { return d.count; });

    // Set up dimensions for the pie chart
    var width = 400;
    var height = 400;
    var margin = { top: 70, right: 10, bottom: 10, left: 100 }; // Increased top margin for title
    var radius = Math.min(width, height) * 0.36;

    // Create SVG element
    var svg = d3.select("#pie-chart-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    // Define color scale
    var color = d3.scaleOrdinal()
        .domain(labelData.map(function(d) { return d.label; }))
        .range(["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#8c510a"]);

    // Define pie layout
    var pie = d3.pie()
        .value(function(d) { return d.count; });

    // Generate arcs
    var arcs = pie(labelData);

    // Draw slices
    var arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    // Add slices
    var slices = svg.selectAll("path")
        .data(arcs)
        .enter().append("g");

    slices.append("path")
        .attr("fill", function(d) { return color(d.data.label); })
        .attr("d", arc)
        .on("mouseover", function(d) {
            // Make the hovered slice slightly larger
            d3.select(this)
                .transition()
                .duration(200)
                .attr("d", d3.arc()
                    .innerRadius(0)
                    .outerRadius(radius * 1.1)
                );
            // Display percentage information in a tooltip
            var percentage = (d.data.count / totalCount) * 100;
            var tooltip = d3.select("#pie-chart-container").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0)
                .style("position", "absolute")
                .style("pointer-events", "none")
                .style("background-color", "rgba(255, 255, 255, 0.8)")
                .style("border", "1px solid #999")
                .style("border-radius", "4px")
                .style("padding", "4px 8px")
                .style("font-size", "12px")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px")
                .html(percentage.toFixed(1) + "%");
            tooltip.transition()
                .duration(200)
                .style("opacity", 1);
        })
        .on("mouseout", function() {
            // Restore the original size of the slice
            d3.select(this)
                .transition()
                .duration(200)
                .attr("d", arc);
            // Remove the tooltip
            d3.select("#pie-chart-container").select(".tooltip").remove();
        });

    // Add static labels
    slices.append("text")
        .attr("transform", function(d) {
            var pos = arc.centroid(d);
            return "translate(" + pos + ")";
        })
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .text(function(d) { return d.data.label; });

    // Add title
    svg.append("text")
        .attr("x", 0)
        .attr("y", 0 - 2.5 * margin.top)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .text("Percentages of Labels");
}
function createBarChart(data) {
    // Aggregate data for each $10 increment up to $90
    var priceData = [];
    for (var i = 60; i <= 95; i += 5) {
        var filteredData = data.filter(function(d) {
            return d.Price >= i && d.Price < i + 5;
        });

        if (filteredData.length > 0) {
            var averageRank = d3.mean(filteredData, function(d) { return +d.Rank; });
            priceData.push({ priceRange: "$" + i + " - $" + (i + 4), averageRank: averageRank });
        }
    }

    // Set up dimensions for the bar graph
    var margin = { top: 60, right: 10, bottom: 80, left: 40 }; // Increased top margin for title
    var width = 420 - margin.left - margin.right;
    var height = 320 - margin.top - margin.bottom;

    // Create SVG element
    const svg = d3.select('#bar-chart-container')
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Define scales
    var x = d3.scaleBand()
              .domain(priceData.map(function(d) { return d.priceRange; }))
              .range([0, width])
              .padding(0.1);

    var y = d3.scaleLinear()
              .domain([0, d3.max(priceData, function(d) { return d.averageRank; })])
              .nice()
              .range([height, 0]);

    // Function to create bars with animation
    function createBars() {
        // Draw bars
        svg.selectAll(".bar")
            .data(priceData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return x(d.priceRange); })
            .attr("width", x.bandwidth())
            .attr("y", height) // Set initial y position below the chart
            .attr("height", 0) // Set initial height to 0
            .attr("fill", "RosyBrown")
            .transition() // Apply transition
            .delay(function(d, i) { return i * 300; }) // Delay each bar based on its index
            .duration(500) // Duration of each bar animation
            .attr("y", function(d) { return y(d.averageRank); }) // Transition to final y position
            .attr("height", function(d) { return height - y(d.averageRank); }) // Transition to final height
            .end() // After animation ends
            .then(function() {
                // After animation completes, pause before starting over
                setTimeout(function() {
                    // Remove existing bars
                    svg.selectAll(".bar").remove();
                    // Start over
                    createBars();
                }, 3000); // Pause duration
            });
    }

    // Call function to create bars with animation
    createBars();

    // Add x-axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .attr("dx", "-0.8em") // Adjust the horizontal positioning
        .attr("dy", "0.15em"); // Adjust the vertical positioning

    // Add y-axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - 1.2*margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Average Rank");

    // Add x-axis label
    svg.append("text")
        .attr("transform", "translate(" + (width / 2) + " ," + (height + margin.top + 10) + ")")
        .style("text-anchor", "middle")
        .text("Price Range");

    // Add title
    svg.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .text("Average Rank by Price Range");
}
    d3.csv('cosmetics.csv').then(data => {
      createMultiLinePlot(data);
      createPieChart(data);
      createBarChart(data);
    });
