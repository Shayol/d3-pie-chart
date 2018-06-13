var PATH_TO_ICON = "/images/icons/cat-color/";

var width = 500,
    height = 340,
    outerRadius = 114,
    innerRadius = 66.5,
    labelR = outerRadius + 28,
    iconWidth = 16,
    iconHeight = 16;

function getColor(keyword) {
    var prefix = 'CatColor-'
    var classes
    var color
    var sheets = document.styleSheets
    Object.keys(sheets).forEach(function (key) {
        if (sheets[key].title === 'color') {
            classes = sheets[key].rules
        }
    })
    for (var x = 0; x < classes.length; x++) {
        if (classes[x].selectorText.includes(prefix + keyword)) {
            (classes[x].style.color) ? color = classes[x].style.color : color = false;
        }

    }
    return color
}

// function getColor(keyword) {
//     var prefix = 'CatColor-';
//     var classes;
//     var color;
//     var sheets = document.styleSheets;
//     console.log(sheets);

//     Object.keys(sheets).forEach(function (key) {
//         var rules = sheets[key].rules;
//         console.log(rules);
//         Object.keys(rules).forEach(function(rulesKey) {
//             if (rules[rulesKey].selectorText.includes(prefix + keyword)) {
//                 color = rules[rulesKey].style.color;
//             }
//         }); 

//     });
//     return color;
// }


d3.json("data.json", { crossOrigin: "anonymous" }).then(function (raw_data) {

    // random colors when no color provided

    var color = d3.scaleOrdinal(["#3f51b5", "#009688", "#039be5", "#d2d588",
        "#795548", "#ff6f00", "#e91e63", "#607d8b",
        "#7cb342", "#e53935"]);

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    var g = svg.append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var lineG = svg.append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")

    var key = function (d) { return d.data.keyword; }

    var pie = d3.pie().value(function (d) {
        return d.value;
    });

    var pieArc = d3.arc()
        .outerRadius(outerRadius)
        .innerRadius(innerRadius);

    var lineArc1 = d3.arc()
        .outerRadius(outerRadius + 2)
        .innerRadius(outerRadius + 2);

    var lineArc2 = d3.arc()
        .outerRadius(outerRadius + 19)
        .innerRadius(outerRadius + 19);

    function iconLink(keyword) {
        return PATH_TO_ICON + keyword + ".svg";
    }


    function fetchData(raw_data, parent = '') {

        result = raw_data.filter(item => item.parent === parent);

        result.forEach(function (item) {
            if (item.keyword) {
                item.icon_path = iconLink(item.keyword);
            }

            if (item.keyword && getColor(item.keyword)) {
                item.color = getColor("food");
            }
        });

        return result;
    }

    function change(data) {

        // calculate total value

        var totalValue = d3.sum(data, function (d) { return d.value; });

        var total = g.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", ".35em")
            .attr("class", "pie-total")
            .text(totalValue + " €");

        //calculate percent for baloon - also used to calc animation

        function calcPerc(value) {
            return Math.round(value / totalValue * 100);
        }

        // remove ballons and total when data refreshed 

        function removeNodes() {
            total.remove();
            d3.select(".d3-tip").remove();
        }

        // called when slice of pie, icon on pie or label is clicked

        function clickAction(d) {
            if (fetchData(raw_data, d.data.keyword).length) {
                //total and baloons removed on every 'change' function call 
                removeNodes();
                change(fetchData(raw_data, d.data.keyword));
            }
        }

        //start making donut chart

        var newArcs = g.selectAll(".arc")
            .data(pie(data), key);


        var arcs = newArcs.enter().append("g")
            .attr("class", "arc");


        //add color to slices

        var slices = arcs.append("path")
            .attr("d", pieArc)
            .attr("fill", function (d, i) { return d.data.color || color(i); })
            .attr("stroke", "#fff")
            .attr("class", "slice");


        //add animation to slices on load
        slices.transition("load")
            .duration(function (d, i) {
                return calcPerc(d.data.value) * 20;
            })
            .attrTween('d', function (d) {
                var i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
                return function (t) {
                    d.endAngle = i(t);
                    return pieArc(d);
                }
            });

        slices.on("click", function (d, i) {
            clickAction(d);
        })
            .on("mouseover", function (d) {
                if (fetchData(raw_data, d.data.keyword).length) {

                    //chnage opacity and cursor of slice on hover
                    var parent = d3.select(this).node().parentNode;
                    parent.style.opacity = "0.5";;
                    parent.style.cursor = "zoom-in";
                }
            })
            .on("mouseleave", function (d) {
                var parent = d3.select(this).node().parentNode;
                parent.style.opacity = "1";
                parent.style.cursor = "default";
            })

        newArcs.exit()
            .remove();

        // check if slice is big enough for icon

        var slicesWithIcons = arcs.filter(function (d, i) {
            var angle = d.endAngle - d.startAngle;

            if (d.data.icon_path && angle > 0.38) {
                return true;
            }
            return false;
        });


        //add icons
        slicesWithIcons.each(function (d) {

            var self = d3.select(this);

            //inside d3.svg endAngle changes
            var endAngle = d.endAngle;

            //get icon
            d3.svg(d.data.icon_path, { crossOrigin: "anonymous" }).then(function (svg) {

                var svgNode = document.importNode(svg.documentElement, true);

                self.append(function (d) {
                    return svgNode;
                })
                    .attr("width", iconWidth).attr("height", iconHeight)
                    .attr("class", "icon")
                    .attr("x", function (d) {
                        d.endAngle = endAngle;

                        var x = pieArc.centroid(d)[0] - iconWidth / 2;
                        return x;
                    })
                    .attr("y", function (d) {
                        var y = pieArc.centroid(d)[1] - iconHeight / 2;
                        return y;
                    })
                    .on("mouseover", function (d) {
                        if (fetchData(raw_data, d.data.keyword).length) {
                            self.style("cursor", "zoom-in");
                            self.style("opacity", "0.5");
                        }
                    })
                    .on("click", function (d) {
                        clickAction(d);
                    })
                    .selectAll("path").style("fill", "#fff");

            })
                .catch(function (err) {
                    console.log('Error on icon load', err);
                });

        });

        //add baloons(tooltips) 

        var tool_tip = d3.tip()
            .attr("class", "d3-tip")
            .offset([-15, 0])
            .html(function (d) {
                return "<a href='#' class='pie-baloon-link'><div class='pie-baloon-transactions'>" + d.data.transactions + " transactions </div>"
                    + "<div class='pie-baloon-amount'>"
                    + d.data.value + " €</div>"
                    + "<div>" + calcPerc(d.data.value) + "%</div></a>";
            });
        g.call(tool_tip);

        // add labels                         
        var labels = arcs.append("text")
            .attr("transform", function (d) {
                var c = pieArc.centroid(d),
                    x = c[0],
                    y = c[1],
                    // pythagorean theorem for hypotenuse
                    h = Math.sqrt(x * x + y * y);
                return "translate(" + (x / h * labelR) + ',' +
                    (y / h * labelR) + ")";
            })
            .attr("dy", ".35em")
            .attr("text-anchor", function (d) {
                // are we past the center?
                return (d.endAngle + d.startAngle) / 2 > Math.PI ?
                    "end" : "start";
            })
            .text(function (d, i) { return d.data.label; })
            .attr("class", "pie-label")

            // baloons show up on mouseover 

            .on('mouseover', function (d) {

                tool_tip.show(d);
                var baloon = document.querySelector(".d3-tip");

                baloon.addEventListener('mouseleave', function (d) {
                    tool_tip.hide();
                });
            })

            //baloon hides 
            .on('mouseout', function (d) {
                var coordinates = [0, 0];
                coordinates = d3.mouse(this);

                var y = coordinates[1];
                if (y > -1) {
                    tool_tip.hide(d);
                }
            })
            .on("click", function (d) {
                clickAction(d);
            });

        // make lines 

        var polyline = lineG.selectAll("line")
            .data(pie(data), key)

        polyline.enter()
            .append("line").attr("x1", function (d) {
                return lineArc1.centroid(d)[0];
            })
            .attr("y1", function (d) {
                return lineArc1.centroid(d)[1];
            })
            .attr("x2", function (d) {
                return lineArc2.centroid(d)[0];
            })
            .attr("y2", function (d) {
                return lineArc2.centroid(d)[1];
            })
            .attr("stroke-width", 2);

        polyline.exit()
            .remove();

    }

    change(fetchData(raw_data));

})
    .catch(function (err) {
        console.log('Fetch Error', err);
    });