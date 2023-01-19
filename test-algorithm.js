// Test algorithm
function switchADA() {
    if ($('#ada')[0].checked) {
        $('.exception').each(function() {this.checked = false;})
    }
}

function filterAccess() {
    console.log('filter clicked')
    $('#ada').indeterminate = false;
    $('.exception').each(function() {
        if (this.checked) {
            $('#ada')[0].checked = false;
            $('#ada')[0].indeterminate = true;
            console.log('indeterminate')
            return;
        }
    })
}

function find_route() {
    const allow_steps = $('#allowSteps')[0].checked;
    const allow_stairs = $('#allowStairs')[0].checked;
    const allow_manual_doors = $('#allowDoors')[0].checked;
    const allow_non_wc_elevators = $('#allowElevators')[0].checked;

    class Node {
        constructor(id, edges, length, route, ada, steps, stairs, manual_doors) {
            this.id = id;
            this.edges = edges;
            this.length = length;
            this.route = route;
            this.ada = ada;
            this.steps = steps;
            this.stairs = stairs;
            this.manual_doors = manual_doors;
        }

        allowNode(allow_steps, allow_stairs, allow_manual_doors) {
            if (this.ada) {return true;}
            if (this.steps && !allow_steps) {return false;}
            if (this.stairs && !allow_steps) {return false;}
            if (this.stairs && !allow_stairs) {return false;}
            if (this.manual_doors && !allow_manual_doors) {return false;}
            return true;
        }  
    }

    class Edge {
        constructor(id, length, ada, steps, stairs, non_wc_elevators) {
            this.id = id;
            this.length = length;
            this.ada = ada;
            this.steps = steps;
            this.stairs = stairs;
            this.non_wc_elevators = non_wc_elevators;
        }

        allowEdge(allow_steps, allow_stairs, allow_non_wc_elevators) {
            if (this.ada) {return true;}
            if (this.steps && !allow_steps) {return false;}
            if (this.stairs && !allow_steps) {return false;}
            if (this.stairs && !allow_stairs) {return false;}
            if (this.non_wc_elevators && !allow_non_wc_elevators) {return false;}
            return true;
        }
    }

    // define edges
    let UVAUVB = new Edge('UVAUVB', 2, false, false, true, false);
    let UVAWXC = new Edge('UVAWXC', 9, true, false, false, false);
    let UVBUWY = new Edge('UVBUWY', 6, true, false, false, false);
    let UWYWXB = new Edge('UWYWXB', 7, true, false, false, false);
    let UWYYZB = new Edge('UWYYZB', 6, true, false, false, false);
    let WXAWXB = new Edge('WXAWXB', 3, true, false, false, false);
    let WXAWXC = new Edge('WXAWXC', 1, true, false, false, false);
    let WXAYZA = new Edge('WXAYZA', 17, false, true, false, false);
    let WXBWXC = new Edge('WXBWXC', 3, true, false, false, false);
    let YZAYZB = new Edge('YZAYZB', 2, true, false, false, false);

    // define nodes
    let UVA = new Node('UVA', [UVAWXC, UVAUVB], Math.min(), [], true, false, false, false);
    let UVB = new Node('UVB', [UVBUWY, UVAUVB], Math.min(), [], true, false, false, false);
    let UWY = new Node('UWY', [UVBUWY, UWYWXB, UWYYZB], Math.min(), [], true, false, false, false);
    let WXA = new Node('WXA', [WXAWXB, WXAWXC, WXAYZA], Math.min(), [], false, true, false, false);
    let WXB = new Node('WXB', [WXAWXB, WXBWXC, UWYWXB], Math.min(), [], false, false, false, true);
    let WXC = new Node('WXC', [UVAWXC, WXAWXC, WXBWXC], Math.min(), [], true, false, false, false);
    let YZA = new Node('YZA', [WXAYZA, YZAYZB], Math.min(), false, false, false, true);
    let YZB = new Node('YZB', [YZAYZB, UWYYZB], Math.min(), true, false, false, false);

    // get out of order from database

    // get accessible nodes
    const all_nodes = [UVA, UVB, UWY, WXA, WXB, WXC, YZA, YZB];
    let accessible_nodes = [];
    all_nodes.forEach(node => {
        if(node.allowNode(allow_steps, allow_stairs, allow_manual_doors)) {accessible_nodes.push(node);}
    });
    console.log(accessible_nodes);

    // get accessible edges
    const all_edges = [UVAUVB, UVAWXC, UVBUWY, UWYWXB, UWYYZB, WXAWXB, WXAWXC, WXAYZA, WXBWXC, YZAYZB];
    let accessible_edges = [];
    all_edges.forEach(edge => {
        if(edge.allowEdge(allow_steps, allow_stairs, allow_non_wc_elevators)) {accessible_edges.push(edge);}
    });
    console.log(accessible_edges);


    // Check for stored shortest path, if so check if still accessible

    // Shortest Path Algorithm
    if ($('#start')[0].value == 'no-start' || $('#end')[0].value == 'no-end') {
        console.log('Starting or destination not selected');
        return
    }

    let start;
    all_nodes.forEach(node => {
        if (node.id == $('#start')[0].value) {start = node}
    })
    let end;
    all_nodes.forEach(node => {
        if (node.id == $('#end')[0].value) {end = node}
    })
    let unvisited = accessible_nodes;
    let visited = [];


    function find_neighbor(node, edge) {
        let neighbor = node;
        const node1 = edge.id.slice(0, 3);
        const node2 = edge.id.slice(3, 6);
        let neighbor_id = (node.id == node1) ? node2 : node1;
        accessible_nodes.forEach(item => {
            if (item.id == neighbor_id) {neighbor = item;}
        })
        if (neighbor == node) {return `neighbor ${edge} not valid`}
        return neighbor;
    }

    function next_node() {
        let min_length = Math.min();
        var min_node;
        unvisited.forEach(node => {
            if (node.length < min_length) {
                min_length = node.length;
                min_node = node;
            }
        })
        return min_node
    }

    function dijkstra_step(node) {
        if (node == start) {
            node.length = 0;
            node.route = [start.id];
        }
        var neighbor;
        node.edges.forEach(edge => {
            if (typeof find_neighbor(node, edge) != 'string' && accessible_edges.includes(edge)) {
                neighbor = find_neighbor(node, edge);
                if (node.length + edge.length < neighbor.length) {
                    neighbor.length = node.length + edge.length;
                    neighbor.route = [];
                    node.route.forEach(item => {neighbor.route.push(item)});
                    neighbor.route.push(edge.id);
                    neighbor.route.push(neighbor.id);
                }
            }
        })

        // set up next step
        unvisited.splice(unvisited.indexOf(node), 1);
        visited.push(node);

        if (unvisited.length > 0) {
            dijkstra_step(next_node());
        }
    }

    if(!accessible_nodes.includes(start)) {
        console.log('Warning: starting location does not meet accessibility needs');
    }
    else if(!accessible_nodes.includes(end)) {
        console.log('Warning: ending location does not meet accessibility needs');
    }
    else {
        dijkstra_step(start);
        console.log('Shortest path distance is: ' + end.length);
        console.log('Shortest path is: ' + end.route);
        end.route.forEach(part => {
            $("#"+part).css("fill", "red");
            var li = document.createElement('li');
            li.appendChild(document.createTextNode(part));
            document.getElementById("directions").appendChild(li);
        })
    }
}
// if no route - run next best file