const chessboard = document.getElementById('chessboard');
const turnIndicator = document.getElementById('turnIndicator');

const boardSize = 8;
let board = [];
let selectedPiece = null;
let validMoves = [];
let currentTurn = 'white';

// Unicode chess pieces for easy display
const pieceSymbols = {
  'white': {
    'king': '♔',
    'queen': '♕',
    'rook': '♖',
    'bishop': '♗',
    'knight': '♘',
    'pawn': '♙'
  },
  'black': {
    'king': '♚',
    'queen': '♛',
    'rook': '♜',
    'bishop': '♝',
    'knight': '♞',
    'pawn': '♟'
  }
};

// Initialize board with starting positions
function initBoard() {
  board = [];

  // 8 rows x 8 cols
  for (let r = 0; r < boardSize; r++) {
    const row = [];
    for (let c = 0; c < boardSize; c++) {
      row.push(null);
    }
    board.push(row);
  }

  // Setup pawns
  for (let c = 0; c < boardSize; c++) {
    board[1][c] = { type: 'pawn', color: 'black', moved: false };
    board[6][c] = { type: 'pawn', color: 'white', moved: false };
  }

  // Setup other pieces
  const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  for (let c = 0; c < boardSize; c++) {
    board[0][c] = { type: backRank[c], color: 'black', moved: false };
    board[7][c] = { type: backRank[c], color: 'white', moved: false };
  }
}

// Render board UI
function renderBoard() {
  chessboard.innerHTML = '';
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const square = document.createElement('div');
      square.classList.add('square');
      if ((r + c) % 2 === 0) square.classList.add('light');
      else square.classList.add('dark');

      square.dataset.row = r;
      square.dataset.col = c;

      const piece = board[r][c];
      if (piece) {
        square.textContent = pieceSymbols[piece.color][piece.type];
        square.style.color = piece.color === 'white' ? '#fff' : '#000';
        if (piece.color === 'white') {
          square.style.textShadow = '0 0 2px black';
        } else {
          square.style.textShadow = '0 0 1px white';
        }
      }

      if (selectedPiece && selectedPiece.row === r && selectedPiece.col === c) {
        square.classList.add('highlight');
      }

      // Highlight valid moves
      if (validMoves.some(m => m.row === r && m.col === c)) {
        square.classList.add('highlight');
      }

      square.addEventListener('click', () => onSquareClick(r, c));

      chessboard.appendChild(square);
    }
  }
}

// Check if position is inside the board
function inBounds(r, c) {
  return r >= 0 && r < boardSize && c >= 0 && c < boardSize;
}

// Returns true if piece belongs to current player
function isCurrentPlayerPiece(piece) {
  return piece && piece.color === currentTurn;
}

// Get valid moves for piece at row,col
function getValidMoves(r, c) {
  const piece = board[r][c];
  if (!piece || piece.color !== currentTurn) return [];

  const moves = [];

  switch (piece.type) {
    case 'pawn':
      moves.push(...getPawnMoves(r, c, piece));
      break;
    case 'rook':
      moves.push(...getLineMoves(r, c, [[1,0], [-1,0], [0,1], [0,-1]]));
      break;
    case 'bishop':
      moves.push(...getLineMoves(r, c, [[1,1], [1,-1], [-1,1], [-1,-1]]));
      break;
    case 'queen':
      moves.push(...getLineMoves(r, c, [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]]));
      break;
    case 'king':
      moves.push(...getKingMoves(r, c));
      break;
    case 'knight':
      moves.push(...getKnightMoves(r, c));
      break;
  }

  return moves;
}

// Pawn moves (including capture)
function getPawnMoves(r, c, piece) {
  const moves = [];
  const dir = piece.color === 'white' ? -1 : 1;
  const startRow = piece.color === 'white' ? 6 : 1;

  // Forward move
  if (inBounds(r + dir, c) && !board[r + dir][c]) {
    moves.push({ row: r + dir, col: c });

    // Double move from start
    if (r === startRow && !board[r + 2*dir][c]) {
      moves.push({ row: r + 2*dir, col: c });
    }
  }

  // Captures
  for (let dc of [-1, 1]) {
    const nr = r + dir;
    const nc = c + dc;
    if (inBounds(nr, nc) && board[nr][nc] && board[nr][nc].color !== piece.color) {
      moves.push({ row: nr, col: nc });
    }
  }

  return moves;
}

// Moves in straight lines (rook, bishop, queen)
function getLineMoves(r, c, directions) {
  const moves = [];
  const piece = board[r][c];

  for (let [dr, dc] of directions) {
    let nr = r + dr;
    let nc = c + dc;
    while (inBounds(nr, nc)) {
      if (!board[nr][nc]) {
        moves.push({ row: nr, col: nc });
      } else {
        if (board[nr][nc].color !== piece.color) {
          moves.push({ row: nr, col: nc });
        }
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  return moves;
}

// Knight moves
function getKnightMoves(r, c) {
  const moves = [];
  const piece = board[r][c];
  const jumps = [
    [2,1],[2,-1],[-2,1],[-2,-1],
    [1,2],[1,-2],[-1,2],[-1,-2]
  ];

  for (let [dr, dc] of jumps) {
    const nr = r + dr;
    const nc = c + dc;
    if (inBounds(nr, nc) && (!board[nr][nc] || board[nr][nc].color !== piece.color)) {
      moves.push({ row: nr, col: nc });
    }
  }
  return moves;
}

// King moves (one step all directions)
function getKingMoves(r, c) {
  const moves = [];
  const piece = board[r][c];
  const steps = [
    [1,0],[-1,0],[0,1],[0,-1],
    [1,1],[1,-1],[-1,1],[-1,-1]
  ];

  for (let [dr, dc] of steps) {
    const nr = r + dr;
    const nc = c + dc;
    if (inBounds(nr, nc) && (!board[nr][nc] || board[nr][nc].color !== piece.color)) {
      moves.push({ row: nr, col: nc });
    }
  }
  return moves;
}

// Handle square click
function onSquareClick(r, c) {
  const clickedPiece = board[r][c];

  // If selecting a piece of current player
  if (clickedPiece && clickedPiece.color === currentTurn) {
    selectedPiece = { row: r, col: c };
    validMoves = getValidMoves(r, c);
  }
  // If selecting a valid move
  else if (selectedPiece && validMoves.some(m => m.row === r && m.col === c)) {
    movePiece(selectedPiece.row, selectedPiece.col, r, c);
    selectedPiece = null;
    validMoves = [];
    switchTurn();
  } else {
    // Clicking elsewhere clears selection
    selectedPiece = null;
    validMoves = [];
  }

  renderBoard();
}

// Move piece on board
function movePiece(sr, sc, dr, dc) {
  board[dr][dc] = board[sr][sc];
  board[dr][dc].moved = true;
  board[sr][sc] = null;
}

// Switch player turn
function switchTurn() {
  currentTurn = currentTurn === 'white' ? 'black' : 'white';
  turnIndicator.textContent = `Turn: ${capitalize(currentTurn)}`;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Init
initBoard();
renderBoard();
