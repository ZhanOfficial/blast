// ============================================
// ZhanOfficial — Block Blast Engine v1.0
// ============================================

// ----- Game State -----
const GRID_SIZE = 8;
let grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
let score = 0;
let selectedBlockIndex = null;

// Predefined block shapes (each is a 2D array)
const BLOCK_SHAPES = [
    // I-shape (4x1)
    [[1, 1, 1, 1]],
    // Square (2x2)
    [[1, 1],
     [1, 1]],
    // L-shape (3x2)
    [[1, 0],
     [1, 0],
     [1, 1]],
    // T-shape (3x3)
    [[0, 1, 0],
     [1, 1, 1]],
    // Z-shape (3x3)
    [[1, 1, 0],
     [0, 1, 1]],
    // Small L (2x2)
    [[1, 0],
     [1, 1]],
    // Line 3
    [[1, 1, 1]],
    // Dot
    [[1]]
];

// Current block options (3 random shapes)
let currentBlocks = [];

// ----- DOM References -----
const gridEl = document.getElementById('grid');
const inventoryEl = document.getElementById('inventory');
const scoreDisplay = document.getElementById('score-display');
const statusMsg = document.getElementById('status-msg');
const resetBtn = document.getElementById('reset-btn');

// ----- Helper Functions -----
function getRandomShape() {
    const idx = Math.floor(Math.random() * BLOCK_SHAPES.length);
    return BLOCK_SHAPES[idx].map(row => [...row]);
}

function generateBlocks() {
    currentBlocks = [];
    for (let i = 0; i < 3; i++) {
        currentBlocks.push(getRandomShape());
    }
}

// ----- Render Grid -----
function renderGrid() {
    gridEl.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell' + (grid[r][c] ? ' filled' : '');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', () => handleCellClick(r, c));
            gridEl.appendChild(cell);
        }
    }
}

// ----- Render Inventory -----
function renderInventory() {
    inventoryEl.innerHTML = '';
    currentBlocks.forEach((shape, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'block-option' + (selectedBlockIndex === idx ? ' selected' : '');
        wrapper.dataset.index = idx;

        const preview = document.createElement('div');
        preview.className = 'block-preview';
        const rows = shape.length;
        const cols = shape[0].length;
        preview.style.gridTemplateColumns = `repeat(${cols}, 28px)`;
        preview.style.gridTemplateRows = `repeat(${rows}, 28px)`;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'preview-cell' + (shape[r][c] ? ' filled' : '');
                preview.appendChild(cell);
            }
        }

        wrapper.appendChild(preview);
        wrapper.addEventListener('click', () => selectBlock(idx));
        inventoryEl.appendChild(wrapper);
    });
}

// ----- Select Block -----
function selectBlock(index) {
    if (selectedBlockIndex === index) {
        selectedBlockIndex = null;
        statusMsg.textContent = 'Block deselected.';
    } else {
        selectedBlockIndex = index;
        statusMsg.textContent = `Block ${index+1} selected. Click grid to place.`;
    }
    renderInventory();
}

// ----- Place Block on Grid -----
function handleCellClick(row, col) {
    if (selectedBlockIndex === null) {
        statusMsg.textContent = '⚠️ Select a block first!';
        return;
    }

    const shape = currentBlocks[selectedBlockIndex];
    const rows = shape.length;
    const cols = shape[0].length;

    // Check if block fits at (row, col) — top-left anchor
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (shape[r][c]) {
                const nr = row + r;
                const nc = col + c;
                if (nr >= GRID_SIZE || nc >= GRID_SIZE || grid[nr][nc] === 1) {
                    statusMsg.textContent = '❌ Can\'t place there!';
                    return;
                }
            }
        }
    }

    // Place the block
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (shape[r][c]) {
                grid[row + r][col + c] = 1;
            }
        }
    }

    // Clear filled lines
    clearLines();

    // Remove the used block
    currentBlocks.splice(selectedBlockIndex, 1);
    selectedBlockIndex = null;

    // If no blocks left, generate new ones
    if (currentBlocks.length === 0) {
        generateBlocks();
    }

    // Check if game over
    if (!hasValidMoves()) {
        statusMsg.textContent = '💀 GAME OVER! No moves left. Hit New Game.';
        // disable placement? we'll let reset handle it
    } else {
        statusMsg.textContent = '✅ Block placed! Keep going.';
    }

    updateUI();
}

// ----- Clear Full Lines -----
function clearLines() {
    let linesCleared = 0;
    // Check rows
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (grid[r].every(cell => cell === 1)) {
            grid.splice(r, 1);
            grid.unshift(Array(GRID_SIZE).fill(0));
            linesCleared++;
            r++; // re-check same row index
        }
    }

    // Check columns
    for (let c = GRID_SIZE - 1; c >= 0; c--) {
        let full = true;
        for (let r = 0; r < GRID_SIZE; r++) {
            if (grid[r][c] === 0) { full = false; break; }
        }
        if (full) {
            for (let r = 0; r < GRID_SIZE; r++) {
                grid[r].splice(c, 1);
                grid[r].push(0);
            }
            linesCleared++;
            c++; // re-check same column
        }
    }

    if (linesCleared > 0) {
        const points = linesCleared * 10 + (linesCleared > 1 ? (linesCleared - 1) * 15 : 0);
        score += points;
        statusMsg.textContent = `🎉 Cleared ${linesCleared} lines! +${points} pts`;
    }
}

// ----- Check Valid Moves -----
function hasValidMoves() {
    for (let bi = 0; bi < currentBlocks.length; bi++) {
        const shape = currentBlocks[bi];
        const rows = shape.length;
        const cols = shape[0].length;
        for (let r = 0; r <= GRID_SIZE - rows; r++) {
            for (let c = 0; c <= GRID_SIZE - cols; c++) {
                let fits = true;
                for (let sr = 0; sr < rows; sr++) {
                    for (let sc = 0; sc < cols; sc++) {
                        if (shape[sr][sc] && grid[r + sr][c + sc] === 1) {
                            fits = false;
                            break;
                        }
                    }
                    if (!fits) break;
                }
                if (fits) return true;
            }
        }
    }
    return false;
}

// ----- Update UI -----
function updateUI() {
    renderGrid();
    renderInventory();
    scoreDisplay.textContent = score;
}

// ----- Reset Game -----
function resetGame() {
    grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    score = 0;
    selectedBlockIndex = null;
    generateBlocks();
    statusMsg.textContent = '🔄 New game! Place your blocks.';
    updateUI();
}

// ----- Init -----
generateBlocks();
updateUI();
statusMsg.textContent = '🎯 Select a block, then click the grid!';
resetBtn.addEventListener('click', resetGame);
