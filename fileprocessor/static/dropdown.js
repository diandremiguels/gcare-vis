// These represent the underlying node, edges, and position information determining the output diagram.
let nodes = {};
let edges = {};
let elkgraph = {};

$(document).ready(function() {
    // Populate first dropdown with filter types from the backend
    $.ajax({
        url: '/get-filter-types/',
        type: 'GET',
        success: function(response) {
            const firstDropdown = $('#firstDropdown');
            response.filter_types.forEach(function(type) {
                firstDropdown.append(new Option(type, type));
            });
        }
    });

    // Populate second dropdown based on the selection in the first dropdown
    $('#firstDropdown').change(function() {
        const filterType = $(this).val();
        if (filterType) {
            if (filterType !== "Any") {
                $.ajax({
                    url: '/get-filter-options/',
                    type: 'GET',
                    data: { 'filter_type': filterType },
                    success: function(response) {
                        const secondDropdown = $('#secondDropdown');
                        secondDropdown.empty().append(new Option('Select Filter Option', ''));
                        response.options.forEach(function(option) {
                            secondDropdown.append(new Option(option, option));
                        });
                        secondDropdown.prop('disabled', false);  // enable second dropdown
                    }
                });
            } else {
                // If we select 'Any', then we want to skip the second dropdown and fill the third
                $.ajax({
                    url: '/get-filtered-files/',
                    type: 'GET',
                    data: { 'filter_option': "Any", 'sort_option': "Any" },
                    success: function(response) {
                        const thirdDropdown = $('#thirdDropdown');
                        const secondDropdown = $('#secondDropdown');
                        secondDropdown.empty();
                        thirdDropdown.empty().append(new Option('Select File', ''));
                        response.files.forEach(function(file) {
                            thirdDropdown.append(new Option(file, file));
                        });
                        secondDropdown.prop('disabled', true); // disable second dropdown
                        thirdDropdown.prop('disabled', false);  // enable third dropdown
                    }
                });
            }
            
        } else {
            $('#secondDropdown').empty().append(new Option('Select Filter Option', ''));
            $('#secondDropdown').prop('disabled', true);  // disable second dropdown
        }
    });

    // Populate third dropdown based on the selection in the second dropdown
    $('#secondDropdown').change(function() {
        const filterOption = $('#firstDropdown').val();
        const sortOption = $(this).val();
        
        if (filterOption && sortOption) {
            $.ajax({
                url: '/get-filtered-files/',
                type: 'GET',
                data: { 'filter_option': filterOption, 'sort_option': String(sortOption) },
                success: function(response) {
                    const thirdDropdown = $('#thirdDropdown');
                    thirdDropdown.empty().append(new Option('Select File', ''));
                    response.files.forEach(function(file) {
                        thirdDropdown.append(new Option(file, file));
                    });
                    thirdDropdown.prop('disabled', false);  // enable third dropdown
                }
            });
        } else {
            $('#thirdDropdown').empty().append(new Option('Select File', ''));
            $('#thirdDropdown').prop('disabled', true);  // disable third dropdown
        }
    });

    // Whenever we select something from the third dropdown, update the input box to use those file contents.
    $('#thirdDropdown').change(function() {
        const selectedFile = $('#thirdDropdown').val();
        if (selectedFile) {
            $.ajax({
                url: '/obtain-file-contents/',
                type: 'GET',
                data: { 'selected_file': selectedFile },
                success: function(response) {
                    updateContent(response.contents);
                }
            });
        }
    })

    // When we click 'Visualize', visualize the graph represented by the text content of the file.
    $('#submitButton').click(function() {
        const text = extractTextFromInput();
        if (text) {
            $.ajax({
                url: '/convert-file-to-graph',
                type: 'GET',
                data: { 'selected_file': text },
                success: function(response) {
                    const graph = response.graph;
                    nodes = response.nodes;
                    edges = response.edges;
                    elkgraph = response.graph;
                    const elk = new ELK({workerUrl: "static/elkjs/lib/elk-worker.min.js"});
                    elk.layout(graph).then(layoutedGraph => {
                        // Clear previous SVG contents
                        d3.select("svg").selectAll("*").remove();
                        const svg = d3.select("svg");

                        // Calculate the bounding box of the graph (minimum and maximum x and y values)
                        const xMin = d3.min(layoutedGraph.children, d => d.x);
                        const xMax = d3.max(layoutedGraph.children, d => d.x + d.width);
                        const yMin = d3.min(layoutedGraph.children, d => d.y);
                        const yMax = d3.max(layoutedGraph.children, d => d.y + d.height);

                        // Calculate the width and height of the graph
                        const graphWidth = xMax - xMin;
                        console.log(graphWidth);
                        const graphHeight = yMax - yMin;

                        // Get the size of the SVG
                        const svgWidth = svg.node().getBoundingClientRect().width;
                        console.log(svgWidth);
                        const svgHeight = svg.node().getBoundingClientRect().height;

                        // Calculate the scaling factors for width and height
                        const scaleX = graphWidth > svgWidth ? svgWidth / parseFloat(graphWidth) : 1;
                        console.log(scaleX);
                        const scaleY = graphHeight > svgHeight ? svgHeight / parseFloat(graphHeight) : 1;
                        const scale = Math.min(scaleX, scaleY) * 0.8; // Take the smaller scale factor and add a constant factor so it's a little smaller than the box
                        // const scale = 1
                        const graphGroup = svg.append("g");

                        // Draw edges
                        graphGroup.selectAll("line")
                            .data(layoutedGraph.edges)
                            .enter()
                            .append("line")
                            .attr("x1", d => {
                                const src = layoutedGraph.children.find(n => n.id === d.sources[0]);
                                return (src.x + src.width / 2) * scale; // Scale edge positions
                            })
                            .attr("y1", d => {
                                const src = layoutedGraph.children.find(n => n.id === d.sources[0]);
                                return (src.y + src.height / 2) * scale; // Scale edge positions
                            })
                            .attr("x2", d => {
                                const tgt = layoutedGraph.children.find(n => n.id === d.targets[0]);
                                return (tgt.x + tgt.width / 2) * scale; // Scale edge positions
                            })
                            .attr("y2", d => {
                                const tgt = layoutedGraph.children.find(n => n.id === d.targets[0]);
                                return (tgt.y + tgt.height / 2) * scale; // Scale edge positions
                            })
                            .attr("stroke", "gray")
                            .attr("stroke-width", "6px")
                            .attr("class", "edge")
                            .attr("min", function() {
                                const id = d3.select(this).datum().id;
                                const edge = edges.find(obj => obj.id === id);
                                const range = edge.char_range;
                                return range[0];
                            })
                            .attr("max", function() {
                                const id = d3.select(this).datum().id;
                                const edge = edges.find(obj => obj.id === id);
                                const range = edge.char_range;
                                return range[1];
                            })
                            .on("mouseover", function() {
                                const scrollPosition = $('.user-input').scrollTop();
                                d3.select(this).attr("stroke", "orange"); // Change color on hover
                                const id = d3.select(this).datum().id;
                                // now, highlight the text corresponding to this element.
                                // First, find the element in the nodes json with the corresponding id.
                                const edge = edges.find(obj => obj.id === id);
                                // Then, just grab the correct character range
                                const range = edge.char_range;
                                // Finally, update the highlight within text area
                                highlightSpans(range[0], range[1]);
                                $('.user-input').scrollTop(scrollPosition);
                            })
                            .on("mouseout", function() {
                                const scrollPosition = $('.user-input').scrollTop();
                                d3.select(this).attr("stroke", "gray"); // Reset color when mouse leaves
                                removeSpanHighlights();
                                $('.user-input').scrollTop(scrollPosition);
                            });

                        // Draw nodes (no scaling, since we're only scaling edges)
                        graphGroup.selectAll("circle")
                            .data(layoutedGraph.children)
                            .enter()
                            .append("circle")
                            .attr("cx", d => (d.x + d.width / 2) * scale)
                            .attr("cy", d => (d.y + d.height / 2) * scale)
                            .attr("r", 15)
                            .attr("fill", "steelblue")
                            .attr("class", "node")
                            .attr("min", function() {
                                const id = d3.select(this).datum().id;
                                const node = nodes.find(obj => obj.id === Number(id));
                                const range = node.char_range;
                                return range[0];
                            })
                            .attr("max", function() {
                                const id = d3.select(this).datum().id;
                                const node = nodes.find(obj => obj.id === Number(id));
                                const range = node.char_range;
                                return range[1];
                            })
                            .on("mouseover", function() {
                                const scrollPosition = $('.user-input').scrollTop();
                                d3.select(this).attr("fill", "orange"); // Change color on hover
                                const id = d3.select(this).datum().id;
                                // now, highlight the text corresponding to this element.
                                // First, find the element in the nodes json with the corresponding id.
                                const node = nodes.find(obj => obj.id === Number(id));
                                // Then, just grab the correct character range
                                const range = node.char_range;
                                // Finally, update the highlight within text area
                                highlightSpans(range[0], range[1]);
                                $('.user-input').scrollTop(scrollPosition);
                            })
                            .on("mouseout", function() {
                                const scrollPosition = $('.user-input').scrollTop();
                                d3.select(this).attr("fill", "steelblue"); // Reset color when mouse leaves
                                removeSpanHighlights();
                                $('.user-input').scrollTop(scrollPosition);
                            });

                        // Add node labels (no scaling for labels)
                        graphGroup.selectAll("text")
                            .data(layoutedGraph.children)
                            .enter()
                            .append("text")
                            .text(d => d.id)
                            .attr("x", d => (d.x + d.width / 2) * scale)
                            .attr("y", d => (d.y + d.height / 2 + 5) * scale)
                            .attr("text-anchor", "middle")
                            .attr('pointer-events', 'none')
                            .style("fill", "white");

                        const labelWithPos = layoutedGraph.children.map(pos => {
                            const node = nodes.find(n => Number(n.id) === Number(pos.id));
                            return {
                                ...pos,
                                labels: node ? node.labels : []
                            };
                        });

                        graphGroup.selectAll("text.label")
                            .data(labelWithPos)
                            .enter()
                            .append("text")
                            .attr("x", d => (d.x + d.width / 2) * scale) // Position label horizontally
                            .attr("y", d => (d.y + d.height / 2) * scale - 20) // Position label vertically above the circle
                            .attr("text-anchor", "middle") // Center the label horizontally
                            .attr("class", "node-label")
                            .attr("min", function() {
                                const labelData = d3.select(this).datum();
                                const ranges = (labelData.labels || [])
                                    .map(label => label.char_range)
                                    .filter(r => Array.isArray(r) && r[0] !== -1 && r[1] !== -1);
                                const min = Math.min(...ranges.map(r => r[0]));
                                return min;
                            })
                            .attr("max", function() {
                                const labelData = d3.select(this).datum();
                                const ranges = (labelData.labels || [])
                                    .map(label => label.char_range)
                                    .filter(r => Array.isArray(r) && r[0] !== -1 && r[1] !== -1);
                                const max = Math.max(...ranges.map(r => r[1]));
                                return max;
                            })
                            .text(d => d.labels.filter(label => label.value !== -1).map(l => l.value).join(", "))  // Display the additional labels
                            .on("mouseover", function() {
                                const scrollPosition = $('.user-input').scrollTop();
                                d3.select(this).attr("fill", "orange"); // Change color on hover
                                const currentLabelObject = d3.select(this).datum();
                                const validRanges = currentLabelObject.labels
                                    .map(label => label.char_range)
                                    .filter(range => Array.isArray(range) && range[0] !== -1 && range[1] !== -1);
                                highlights = []
                                if (validRanges.length !== 0) {
                                    const minStart = Math.min(...validRanges.map(r => r[0]));
                                    const maxEnd = Math.max(...validRanges.map(r => r[1]));
                                    highlights = [minStart, maxEnd]
                                }
                                highlightSpans(highlights[0], highlights[1]);
                                $('.user-input').scrollTop(scrollPosition);
                            })
                            .on("mouseout", function() {
                                const scrollPosition = $('.user-input').scrollTop();
                                d3.select(this).attr("fill", "black"); // Reset color when mouse leaves
                                removeSpanHighlights();
                                $('.user-input').scrollTop(scrollPosition);
                            });

                            const edgeLabels = [];
                            layoutedGraph.edges.forEach(edge => {
                                if (edge.labels && edge.labels.length > 0) {
                                        edge.labels.forEach(label => {
                                        edgeLabels.push({
                                            id: edge.id,
                                            text: label.text,
                                            x: label.x,
                                            y: label.y
                                        });
                                    });
                                }
                            });

                            const edgeLabelWithPos = edgeLabels.map(pos => {
                                const edge = edges.find(e => e.id === pos.id);
                                return {
                                    ...pos,
                                    labels: edge ? edge.label : [],
                                    char_range: edge.label.char_range
                                };
                            });


                            graphGroup.selectAll("text.edge-label")
                                .data(edgeLabelWithPos)
                                .enter()
                                .append("text")
                                .attr("class", "edge-label")
                                .attr("x", d => d.x * scale)
                                .attr("y", d => d.y * scale - 15)
                                .attr("text-anchor", "middle")
                                .attr("alignment-baseline", "middle")
                                .text(d => d.text === "0" ? "" : d.text)
                                .attr("fill", "black")
                                .attr("class", "edge-label")
                                .attr("min", function(d) {
                                    const labelObject = d3.select(this).datum();
                                    return labelObject.char_range[0];
                                })
                                .attr("max", function(d) {
                                    const labelObject = d3.select(this).datum();
                                    return labelObject.char_range[1];
                                })
                                .on("mouseover", function() {
                                    const scrollPosition = $('.user-input').scrollTop();
                                    d3.select(this).attr("fill", "orange"); // Change color on hover
                                    const currentLabelObject = d3.select(this).datum();
                                    highlights = [currentLabelObject.char_range[0], currentLabelObject.char_range[1]]
                                    highlightSpans(highlights[0], highlights[1]);
                                    $('.user-input').scrollTop(scrollPosition);
                                })
                                .on("mouseout", function() {
                                    const scrollPosition = $('.user-input').scrollTop();
                                    d3.select(this).attr("fill", "black"); // Reset color when mouse leaves
                                    removeSpanHighlights();
                                    $('.user-input').scrollTop(scrollPosition);
                                });
                            });
                            attachSpanEvents();
                        } 
                    });
                } else {
                    alert('Please input valid text.');
                }
            });
        });