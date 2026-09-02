// ============================================
// ZhanOfficial — Block Blast DnD Engine v2.1
// Premium UI Edition
// ============================================

const GRID_SIZE = 8;
let grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
let score = 0;
let selectedBlockIndex = null;
let isDragging = false;
let ghostRow = -1;
let ghostCol = -1;
let ghostValid = false;

const BLOCK_SHAPES = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[1, 0], [1, 0], [1, 1]],
    [[0, 1, 0], [1, 1, 1]],
    [[1, 1, 0], [0, 1, 1]],
    [[1, 0], [1, 1]],
    [[1, 1, 1]],
    [[1]]
];

let currentBlocks = [];

const gridEl = document.getElementById('grid');
const inventoryEl = document.getElementById('inventory');
const scoreDisplay = document.getElementById('score-display');
const statusMsg = document.getElementById('status-msg');
const resetBtn = document.getElementById('reset-btn');

// ----- Helper Functions -----
function getRandomShape() {
    return BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)].map(row => [...row]);
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
            cell.className = 'cell';
            if (grid[r][c]) cell.classList.add('filled');
            
            if (ghostRow !== -1 && ghostCol !== -1 && selectedBlockIndex !== null) {
                const shape = currentBlocks[selectedBlockIndex];
                for (let sr = 0; sr < shape.length; sr++) {
                    for (let sc = 0; sc < shape[0].length; sc++) {
                        if (shape[sr][sc]) {
                            const gr = ghostRow + sr;
                            const gc = ghostCol + sc;
                            if (gr === r && gc === c && !grid[r][c]) {
                                cell.classList.add('ghost');
                                cell.classList.add(ghostValid ? 'ghost-valid' : 'ghost-invalid');
                            }
                        }
                    }
                }
            }
            
            cell.dataset.row = r;
            cell.dataset.col = c;
            gridEl.appendChild(cell);
        }
    }
}

// ----- Render Inventory -----
function renderInventory() {
    inventoryEl.innerHTML = '';
    currentBlocks.forEach((shape, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'block-option';
        wrapper.draggable = true;
        wrapper.addEventListener('dragstart', (e) => handleDragStart(e, idx));
        wrapper.addEventListener('dragend', handleDragEnd);

        const preview = document.createElement('div');
        preview.className = 'block-preview';
        preview.style.gridTemplateColumns = `repeat(${shape[0].length}, 34px)`;
        preview.style.gridTemplateRows = `repeat(${shape.length}, 34px)`;

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[0].length; c++) {
                const cell = document.createElement('div');
                cell.className = 'preview-cell' + (shape[r][c] ? ' filled' : '');
                preview.appendChild(cell);
            }
        }

        wrapper.appendChild(preview);
        inventoryEl.appendChild(wrapper);
    });
}

// ----- Drag Handlers -----
function handleDragStart(e, idx) {
    selectedBlockIndex = idx;
    isDragging = true;
    ghostRow = -1;
    ghostCol = -1;
    
    const shape = currentBlocks[idx];
    e.dataTransfer.setData('text/plain', JSON.stringify({ index: idx, shape }));
    e.dataTransfer.effectAllowed = 'move';
    
    const dragGhost = document.createElement('div');
    dragGhost.style.display = 'grid';
    dragGhost.style.gap = '3px';
    dragGhost.style.padding = '8px';
    dragGhost.style.background = 'rgba(78, 205, 196, 0.15)';
    dragGhost.style.borderRadius = '12px';
    dragGhost.style.border = '2px solid #4ecdc4';
    dragGhost.style.gridTemplateColumns = `repeat(${shape[0].length}, 32px)`;
    dragGhost.style.gridTemplateRows = `repeat(${shape.length}, 32px)`;
    
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
            const cell = document.createElement('div');
            cell.style.width = '32px';
            cell.style.height = '32px';
            cell.style.background = shape[r][c] ? '#4ecdc4' : 'transparent';
            cell.style.borderRadius = '6px';
            cell.style.border = shape[r][c] ? '1px solid #6ee7de' : 'none';
            dragGhost.appendChild(cell);
        }
    }
    
    document.body.appendChild(dragGhost);
    e.dataTransfer.setDragImage(dragGhost, 20, 20);
    setTimeout(() => document.body.removeChild(dragGhost), 0);
    
    setStatus('🔷 Dragging block...', '');
}

function handleDragEnd(e) {
    isDragging = false;
    ghostRow = -1;
    ghostCol = -1;
    ghostValid = false;
    updateUI();
}

// ----- Grid Drop -----
gridEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (selectedBlockIndex === null || !currentBlocks[selectedBlockIndex]) return;
    
    const rect = gridEl.getBoundingClientRect();
    const cellSize = 52 + 5;
    const col = Math.floor((e.clientX - rect.left) / cellSize);
    const row = Math.floor((e.clientY - rect.top) / cellSize);
    
    const shape = currentBlocks[selectedBlockIndex];
    const rows = shape.length;
    const cols = shape[0].length;
    
    ghostRow = Math.max(0, Math.min(GRID_SIZE - rows, row - Math.floor(rows / 2)));
    ghostCol = Math.max(0, Math.min(GRID_SIZE - cols, col - Math.floor(cols / 2)));
    ghostValid = canPlaceBlock(selectedBlockIndex, ghostRow, ghostCol);
    
    updateUI();
});

gridEl.addEventListener('drop', (e) => {
    e.preventDefault();
    if (selectedBlockIndex === null) {
        setStatus('⚠️ Select a block first!', 'error');
        return;
    }
    if (ghostRow === -1 || ghostCol === -1) {
        setStatus('❌ Drop on the grid, bro!', 'error');
        return;
    }
    if (!ghostValid) {
        setStatus('❌ Can\'t place there!', 'error');
        ghostRow = -1;
        ghostCol = -1;
        updateUI();
        return;
    }
    
    placeBlock(selectedBlockIndex, ghostRow, ghostCol);
    clearLines();
    currentBlocks.splice(selectedBlockIndex, 1);
    selectedBlockIndex = null;
    ghostRow = -1;
    ghostCol = -1;
    ghostValid = false;
    
    if (currentBlocks.length === 0) generateBlocks();
    if (!hasValidMoves()) {
        setStatus('💀 GAME OVER! No moves left. 🔄 New Game?', 'gameover');
    } else {
        setStatus('✅ Block placed! Keep going! 🎯', 'success');
    }
    updateUI();
});

// ----- Core Logic -----
function canPlaceBlock(index, row, col) {
    const shape = currentBlocks[index];
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
            if (shape[r][c]) {
                const nr = row + r, nc = col + c;
                if (nr >= GRID_SIZE || nc >= GRID_SIZE || grid[nr][nc]) return false;
            }
        }
    }
    return true;
}

function placeBlock(index, row, col) {
    const shape = currentBlocks[index];
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
            if (shape[r][c]) grid[row + r][col + c] = 1;
        }
    }
}

function clearLines() {
    let cleared = 0;
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (grid[r].every(c => c)) {
            grid.splice(r, 1);
            grid.unshift(Array(GRID_SIZE).fill(0));
            cleared++;
            r++;
        }
    }
    for (let c = GRID_SIZE - 1; c >= 0; c--) {
        if (grid.every(row => row[c])) {
            for (let r = 0; r < GRID_SIZE; r++) {
                grid[r].splice(c, 1);
                grid[r].push(0);
            }
            cleared++;
            c++;
        }
    }
    if (cleared > 0) {
        const points = cleared * 10 + (cleared > 1 ? (cleared - 1) * 15 : 0);
        score += points;
        setStatus(`🎉 Cleared ${cleared} lines! +${points} pts`, 'success');
    }
}

function hasValidMoves() {
    for (let bi = 0; bi < currentBlocks.length; bi++) {
        const shape = currentBlocks[bi];
        for (let r = 0; r <= GRID_SIZE - shape.length; r++) {
            for (let c = 0; c <= GRID_SIZE - shape[0].length; c++) {
                if (canPlaceBlock(bi, r, c)) return true;
            }
        }
    }
    return false;
}

// ----- UI Helpers -----
function setStatus(msg, type = '') {
    statusMsg.textContent = msg;
    statusMsg.className = type;
}

function updateUI() {
    renderGrid();
    renderInventory();
    scoreDisplay.textContent = score;
}

function resetGame() {
    grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    score = 0;
    selectedBlockIndex = null;
    ghostRow = -1;
    ghostCol = -1;
    ghostValid = false;
    generateBlocks();
    setStatus('🔄 New game! Drag blocks to the grid.', '');
    updateUI();
}

// ----- Init -----
generateBlocks();
updateUI();
setStatus('🎯 Drag a block from inventory to the grid!', '');
resetBtn.addEventListener('click', resetGame);
