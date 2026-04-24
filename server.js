const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

function isValidEdge(edge) {
    return /^[A-Z]->[A-Z]$/.test(edge);
}

function buildTree(node, graph, path = new Set()) {
    if (path.has(node)) {
        return { hasCycle: true, tree: {}, depth: 0 };
    }

    const nextPath = new Set(path);
    nextPath.add(node);

    const children = graph[node] || [];
    const tree = {};
    let maxChildDepth = 0;

    for (const child of children) {
        const result = buildTree(child, graph, nextPath);

        if (result.hasCycle) {
            return { hasCycle: true, tree: {}, depth: 0 };
        }

        tree[child] = result.tree;
        maxChildDepth = Math.max(maxChildDepth, result.depth);
    }

    return {
        hasCycle: false,
        tree,
        depth: 1 + maxChildDepth
    };
}

function collectComponent(startNode, graph, visited) {
    const stack = [startNode];

    while (stack.length) {
        const node = stack.pop();
        if (visited.has(node)) continue;

        visited.add(node);

        for (const child of graph[node] || []) {
            if (!visited.has(child)) {
                stack.push(child);
            }
        }
    }
}

function findComponentEntry(node, childToParent) {
    const seen = new Set();
    let current = node;

    while (childToParent.has(current)) {
        if (seen.has(current)) {
            return node;
        }

        seen.add(current);
        current = childToParent.get(current);
    }

    return current;
}

app.post("/bfhl", (req, res) => {
    const input = Array.isArray(req.body.data) ? req.body.data : [];

    const invalidEntries = [];
    const duplicateSet = new Set();
    const seen = new Set();
    const validEdges = [];

    for (const rawEntry of input) {
        const entry = String(rawEntry).trim();

        if (!isValidEdge(entry)) {
            invalidEntries.push(entry);
            continue;
        }

        if (seen.has(entry)) {
            duplicateSet.add(entry);
            continue;
        }

        seen.add(entry);
        validEdges.push(entry);
    }

    const graph = {};
    const nodes = new Set();
    const nodeOrder = [];
    const childSet = new Set();
    const childToParent = new Map();

    for (const edge of validEdges) {
        const [parent, child] = edge.split("->");

        if (!nodes.has(parent)) {
            nodes.add(parent);
            nodeOrder.push(parent);
        }

        if (!nodes.has(child)) {
            nodes.add(child);
            nodeOrder.push(child);
        }

        if (!graph[parent]) graph[parent] = [];
        if (!graph[child]) graph[child] = [];

        // If a child appears under multiple parents, keep the first parent only.
        if (!childToParent.has(child)) {
            graph[parent].push(child);
            childToParent.set(child, parent);
            childSet.add(child);
        }
    }

    const hierarchies = [];
    const processed = new Set();

    let totalTrees = 0;
    let totalCycles = 0;
    let maxDepth = 0;
    let largestRoot = "";

    for (const node of nodeOrder) {
        if (processed.has(node)) continue;

        const entryNode = findComponentEntry(node, childToParent);
        const result = buildTree(entryNode, graph);
        collectComponent(entryNode, graph, processed);

        if (result.hasCycle) {
            totalCycles += 1;
            hierarchies.push({
                root: entryNode,
                tree: {},
                has_cycle: true
            });
            continue;
        }

        totalTrees += 1;

        if (
            result.depth > maxDepth ||
            (result.depth === maxDepth && (largestRoot === "" || entryNode < largestRoot))
        ) {
            maxDepth = result.depth;
            largestRoot = entryNode;
        }

        hierarchies.push({
            root: entryNode,
            tree: { [entryNode]: result.tree },
            depth: result.depth
        });
    }

    res.json({
        user_id: "sswetha2099",
        email_id: "ss7776@srmist.edu.in",
        college_roll_number: "RA2311003020287",
        hierarchies,
        invalid_entries: invalidEntries,
        duplicate_edges: [...duplicateSet],
        summary: {
            total_trees: totalTrees,
            total_cycles: totalCycles,
            largest_tree_root: largestRoot
        }
    });
});

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
