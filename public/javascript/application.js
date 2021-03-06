var ParseGraph = function(){
  var svg = d3.select(".dependency_graph svg");
  var $svg = $('.dependency_graph svg');

  if(!svg.size()){
    return false;
  }

  var width = $svg.width(),
      height = $svg.height(),
      constants = JSON.parse(svg.attr('data-constants')),
      occurences = JSON.parse(svg.attr('data-occurences')),
      drag = d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);

  var zoom = d3.zoom()
        .on("zoom", function () {
          container.attr("transform", d3.event.transform);
        });

  svg.call(zoom)
    .on("dblclick.zoom", null);

  var container = svg.append('g');

  var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("forceCollide", d3.forceCollide(function(){ return 80; }));

  simulation
    .nodes(constants)
    .on("tick", ticked);

  simulation.force("link")
    .links(occurences);

  var link = container.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(occurences)
        .enter().append("path")
        .attr("class", 'link')
        .attr("marker-end", "url(#occurence)");

  var node = container.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(constants)
        .enter().append("g")
        .call(drag)
        .on("dblclick", dblclick);

  var circle = node
        .append("circle")
        .attr("r", 6);

  var text = node
        .append("text")
        .attr("x", 8)
        .attr("y", ".31em")
        .text(function(d) { return d.id; });

  container.append("defs").selectAll("marker")
    .data(['occurence'])
    .enter().append("marker")
    .attr("id", function(d) { return d; })
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -1.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5");

  function ticked() {
    link.attr("d", linkArc);
    node.attr("transform", transform);
  }

  function linkArc(d) {
    var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr =  0;
    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
  }

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d3.select(this).classed("fixed", true);
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
  }

  function dblclick(d) {
    d3.select(this).classed("fixed", false);
    d.fx = null;
    d.fy = null;
  }

  function transform(d) {
    return "translate(" + d.x + "," + d.y + ")";
  }


  node.on('mouseover', function(d) {
    var relatives = [];
    link.style('opacity', function(l) {
      if (d === l.source || d === l.target){
        relatives.push(l.source);
        relatives.push(l.target);
        return 1;
      }else{
        return 0.1;
      }
    });
    node.style('opacity', function(n) {
      if( n == d || relatives.indexOf(n) > -1 ){
        return 1;
      }else{
        return 0.1;
      }
    });
  });

  node.on('mouseout', function() {
    link.style('opacity', 1);
    node.style('opacity', 1);
  });

  return true;

};

$(function(){ParseGraph();});
