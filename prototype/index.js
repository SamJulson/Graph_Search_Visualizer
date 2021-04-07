"use strict";

const gridPadding = 2;
const gridSpacing = 30;
const cellSize = 29;
const gridWidth = 15;
const gridHeight = 15;
const canvasWidth = gridPadding * 2 + (gridWidth - 1) * gridSpacing + cellSize;
const canvasHeight = gridPadding * 2 + (gridHeight - 1) * gridSpacing + cellSize;
const diagonals = true;

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    equals(p) {
        return p.x == this.x && p.y == this.y;
    }
}

class QElement {
    constructor(element, priority) {
        this.element = element;
        this.priority = priority;
    }
}

class PriorityQueue {

    constructor() {
        this.items = [];
    }

    enqueue(element, priority) {
        let qElement = new QElement(element, priority);
        let contain = false;

        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].priority > qElement.priority) {
                this.items.splice(i, 0, qElement);
                contain = true;
                break;
            }
        }

        if (!contain) {
            this.items.push(qElement);
        }
    }

    dequeue() {
        if (this.isEmpty()) return;
        return this.items.shift().element;
    }

    front() {
        if (this.isEmpty()) return;
        return this.items[0];
    }

    has(element) {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].element.equals(element)) return true;
        }
        return false;
    }

    rear() {
        if (this.isEmpty()) return;
        return this.items[this.items.length-1];
    }

    isEmpty() {
        return this.items.length == 0;
    }
}

let canvas = null;
let canvasX = null;
let canvasY = null;
let ctx = null;
let grid = [];
for (let i = 0; i < gridHeight; i++) {
    let row = [];
    for (let j = 0; j < gridWidth; j++) {
        row.push(0);        
    }
    grid.push(row);
}
let path = [new Point(0, 0)];
let start = new Point(0, 0);
let end = new Point(gridWidth - 1, gridHeight - 1);
let controlStart = true;

function draw() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.save();

    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.translate(gridPadding,gridPadding);
    ctx.save();

    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {

            // Draw cell color
            if (i == start.y && j == start.x) {
                ctx.fillStyle = 'red';
            } else if (i == end.y && j == end.x) {
                ctx.fillStyle = 'green';
            } else if (grid[i][j] == 0) {
                ctx.fillStyle = 'lightgray';
            } else {
                ctx.fillStyle = 'dimgray';
            }

            ctx.fillRect(0, 0, cellSize, cellSize);
            ctx.translate(gridSpacing, 0);
        }
        ctx.restore();
        ctx.translate(0,gridSpacing);
        ctx.save();
    }

    ctx.restore();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 2;
    ctx.translate(gridPadding + cellSize / 2, gridPadding + cellSize / 2);
    ctx.beginPath();
    if (path && path.length > 0) {
        ctx.moveTo(path[0].x * gridSpacing, path[0].y * gridSpacing);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x * gridSpacing, path[i].y * gridSpacing);
        }
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.restore();
}

function init() {
    canvas = document.getElementById("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    ctx = canvas.getContext('2d');
}

function main() {
    init();
    update();
}

function update() {
    if (diagonals) {
        path = A_Star(start, end, diagonalDistance, diagonalDistance);
    } else {
        path = A_Star(start, end, manhattanDistance, manhattanDistance);
    }
    draw();
}

window.onmousedown = (e) => {
    switch (e.button) {
        case 0:
            if (e.x > canvasWidth || e.y > canvasHeight) return;
            // TODO: accurately calculate grid area
            let gridHitX = Math.floor((e.x - gridPadding) / gridSpacing)
            let gridHitY = Math.floor((e.y - gridPadding) / gridSpacing)
        
            if (gridHitX == start.x && gridHitY == start.y) return;
            if (gridHitX == end.x && gridHitY == end.y) return;
        
            if (grid[gridHitY][gridHitX] == 0) {
                grid[gridHitY][gridHitX] = 1;
            } else {
                grid[gridHitY][gridHitX] = 0;
            }
            break;
        case 1:
            for (let i = 0; i < gridHeight; i++) {
                for (let j = 0; j < gridWidth; j++) {
                    grid[i][j] = 0;        
                }
            }
            break;
    }
    update();
}

function move(x, y) {
    if (controlStart) {
        let move = new Point(start.x + x, start.y + y);
        if (!validMove(move, move, end)) return;
        start = move;
    } else {
        let move = new Point(end.x + x, end.y + y);
        if (!validMove(move, start, move)) return;
        end = move;
    }
    update();
}

function A_Star(start, end, h, d) {
    let openSet = new PriorityQueue();
    openSet.enqueue(start, h(start, end))
    let cameFrom = new Map(); 
    let gScore = new Map();
    gScore.set(start, 0);

    while (!openSet.isEmpty()) {
        let current = openSet.dequeue();
        if (current.equals(end)) {
            let total_path = [current];
            while (cameFrom.has(current)) {
                current = cameFrom.get(current);
                total_path.unshift(current);
            }
            return total_path
        }
        
        let neighbors = adjacentCells(current);

        for (let i = 0; i < neighbors.length; i++) {
            let neighbor = neighbors[i];
            let tentative_gScore = gScore.get(current) + d(current, neighbor);
            if (!gScore.has(neighbor) || tentative_gScore < gScore.get(neighbor)) {
                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentative_gScore);
                if (!openSet.has(neighbor)) {
                    openSet.enqueue(neighbor, gScore[neighbor] + h(neighbor, end))
                }
            }
        }
    }
    return [];
}

// Point, Point -> Number
function manhattanDistance(start, end) {
    return Math.abs(end.x - start.x) + Math.abs(end.y - start.y);
}

function diagonalDistance(start, end) {
    let dx = Math.abs(end.x - start.x);
    let dy = Math.abs(end.y - start.y);
    // Producing octal distance
    return (dx + dy) + (Math.SQRT2 - 2*1) * Math.min(dx, dy);
}

// Point, Point, Point -> Boolean
function validMove(p, start, end) {
    return validCell(p) && !(start.equals(end))
}

// Point -> Boolean
function validCell(p) {
    if (p.x < 0 || p.x > gridWidth - 1) return false;
    if (p.y < 0 || p.y > gridHeight - 1) return false;
    if (grid[p.y][p.x] == 1) return false;
    return true;
}

// Point -> [Point, ...]
function adjacentCells(p) {
    let result = [];
    let np = new Point(p.x+1, p.y);
    if (validCell(np)) result.push(np);
    np = new Point(p.x-1, p.y);
    if (validCell(np)) result.push(np);
    np = new Point(p.x, p.y+1);
    if (validCell(np)) result.push(np);
    np = new Point(p.x, p.y-1);
    if (validCell(np)) result.push(np);
    if (diagonals) {
        np = new Point(p.x-1, p.y-1);
        if (validCell(np)) result.push(np);
        np = new Point(p.x+1, p.y+1);
        if (validCell(np)) result.push(np);
        np = new Point(p.x+1, p.y-1);
        if (validCell(np)) result.push(np);
        np = new Point(p.x-1, p.y+1);
        if (validCell(np)) result.push(np);
    }
    return result;
}