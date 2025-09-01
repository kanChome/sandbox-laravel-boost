import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

const ROWS = 20;
const COLS = 10;
const CELL_SIZE = 30;
const TICK_SPEED = 500;

const TETROMINOS = {
    I: {
        shape: [[1, 1, 1, 1]],
        color: 'bg-cyan-500',
    },
    O: {
        shape: [
            [1, 1],
            [1, 1],
        ],
        color: 'bg-yellow-500',
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
        ],
        color: 'bg-purple-500',
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
        ],
        color: 'bg-green-500',
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
        ],
        color: 'bg-red-500',
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
        ],
        color: 'bg-blue-500',
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
        ],
        color: 'bg-orange-500',
    },
};

type TetrominoType = keyof typeof TETROMINOS;
type Board = (string | null)[][];

interface Piece {
    type: TetrominoType;
    x: number;
    y: number;
    shape: number[][];
    color: string;
}

export default function Tetris() {
    const [board, setBoard] = useState<Board>(() =>
        Array(ROWS)
            .fill(null)
            .map(() => Array(COLS).fill(null)),
    );
    const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const tickRef = useRef<NodeJS.Timeout | null>(null);

    const createPiece = useCallback((): Piece => {
        const types = Object.keys(TETROMINOS) as TetrominoType[];
        const type = types[Math.floor(Math.random() * types.length)];
        const tetromino = TETROMINOS[type];

        return {
            type,
            x: Math.floor(COLS / 2) - Math.floor(tetromino.shape[0].length / 2),
            y: 0,
            shape: tetromino.shape,
            color: tetromino.color,
        };
    }, []);

    const rotateMatrix = (matrix: number[][]): number[][] => {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols)
            .fill(null)
            .map(() => Array(rows).fill(0));

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }

        return rotated;
    };

    const isValidMove = useCallback((piece: Piece, board: Board, dx = 0, dy = 0): boolean => {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const newX = piece.x + x + dx;
                    const newY = piece.y + y + dy;

                    if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && board[newY][newX])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }, []);

    const lockPiece = useCallback((piece: Piece, board: Board): Board => {
        const newBoard = board.map((row) => [...row]);

        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardY = piece.y + y;
                    const boardX = piece.x + x;
                    if (boardY >= 0) {
                        newBoard[boardY][boardX] = piece.color;
                    }
                }
            }
        }

        return newBoard;
    }, []);

    const clearLines = useCallback((board: Board): { board: Board; linesCleared: number } => {
        const newBoard: Board = [];
        let linesCleared = 0;

        for (let y = 0; y < ROWS; y++) {
            if (board[y].every((cell) => cell !== null)) {
                linesCleared++;
            } else {
                newBoard.push(board[y]);
            }
        }

        while (newBoard.length < ROWS) {
            newBoard.unshift(Array(COLS).fill(null));
        }

        return { board: newBoard, linesCleared };
    }, []);

    const movePiece = useCallback(
        (dx: number, dy: number) => {
            if (!currentPiece || gameOver || isPaused) return;

            if (isValidMove(currentPiece, board, dx, dy)) {
                setCurrentPiece({
                    ...currentPiece,
                    x: currentPiece.x + dx,
                    y: currentPiece.y + dy,
                });
            } else if (dy > 0) {
                const newBoard = lockPiece(currentPiece, board);
                const { board: clearedBoard, linesCleared } = clearLines(newBoard);

                setBoard(clearedBoard);
                setScore((prev) => prev + linesCleared * 100);

                const nextPiece = createPiece();
                if (!isValidMove(nextPiece, clearedBoard)) {
                    setGameOver(true);
                    setIsPlaying(false);
                } else {
                    setCurrentPiece(nextPiece);
                }
            }
        },
        [currentPiece, board, gameOver, isPaused, isValidMove, lockPiece, clearLines, createPiece],
    );

    const rotatePiece = useCallback(() => {
        if (!currentPiece || gameOver || isPaused) return;

        const rotatedShape = rotateMatrix(currentPiece.shape);
        const rotatedPiece = { ...currentPiece, shape: rotatedShape };

        if (isValidMove(rotatedPiece, board)) {
            setCurrentPiece(rotatedPiece);
        }
    }, [currentPiece, board, gameOver, isPaused, isValidMove]);

    const dropPiece = useCallback(() => {
        if (!currentPiece || gameOver || isPaused) return;

        let dropDistance = 0;
        while (isValidMove(currentPiece, board, 0, dropDistance + 1)) {
            dropDistance++;
        }

        movePiece(0, dropDistance);
    }, [currentPiece, board, gameOver, isPaused, isValidMove, movePiece]);

    const startGame = useCallback(() => {
        setBoard(
            Array(ROWS)
                .fill(null)
                .map(() => Array(COLS).fill(null)),
        );
        setScore(0);
        setGameOver(false);
        setIsPaused(false);
        setIsPlaying(true);
        setCurrentPiece(createPiece());
    }, [createPiece]);

    const togglePause = useCallback(() => {
        if (gameOver || !isPlaying) return;
        setIsPaused((prev) => !prev);
    }, [gameOver, isPlaying]);

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!isPlaying || gameOver) return;

            switch (e.key) {
                case 'ArrowLeft':
                    movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    rotatePiece();
                    break;
                case ' ':
                    e.preventDefault();
                    dropPiece();
                    break;
                case 'p':
                case 'P':
                    togglePause();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [movePiece, rotatePiece, dropPiece, togglePause, isPlaying, gameOver]);

    useEffect(() => {
        if (isPlaying && !gameOver && !isPaused) {
            tickRef.current = setInterval(() => {
                movePiece(0, 1);
            }, TICK_SPEED);
        } else {
            if (tickRef.current) {
                clearInterval(tickRef.current);
                tickRef.current = null;
            }
        }

        return () => {
            if (tickRef.current) {
                clearInterval(tickRef.current);
            }
        };
    }, [movePiece, isPlaying, gameOver, isPaused]);

    const renderBoard = () => {
        const displayBoard = board.map((row) => [...row]);

        if (currentPiece) {
            for (let y = 0; y < currentPiece.shape.length; y++) {
                for (let x = 0; x < currentPiece.shape[y].length; x++) {
                    if (currentPiece.shape[y][x]) {
                        const boardY = currentPiece.y + y;
                        const boardX = currentPiece.x + x;
                        if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                            displayBoard[boardY][boardX] = currentPiece.color;
                        }
                    }
                }
            }
        }

        return displayBoard;
    };

    return (
        <AppLayout>
            <Head title="Tetris" />

            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 py-8 dark:bg-gray-900">
                <div className="rounded-lg bg-white p-8 shadow-xl dark:bg-gray-800">
                    <h1 className="mb-6 text-center text-3xl font-bold text-gray-800 dark:text-gray-100">TETRIS</h1>

                    <div className="flex gap-8">
                        <div className="flex flex-col">
                            <div
                                className="relative border-4 border-gray-700 bg-gray-900 dark:border-gray-600 dark:bg-black"
                                style={{
                                    width: COLS * CELL_SIZE + 8,
                                    height: ROWS * CELL_SIZE + 8,
                                }}
                            >
                                <div className="absolute inset-0 p-1">
                                    {renderBoard().map((row, y) => (
                                        <div key={y} className="flex">
                                            {row.map((cell, x) => (
                                                <div
                                                    key={`${y}-${x}`}
                                                    className={`border border-gray-700 dark:border-gray-800 ${
                                                        cell || 'bg-gray-800 dark:bg-gray-900'
                                                    }`}
                                                    style={{
                                                        width: CELL_SIZE,
                                                        height: CELL_SIZE,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    ))}
                                </div>

                                {(gameOver || isPaused) && (
                                    <div className="bg-opacity-75 absolute inset-0 flex items-center justify-center bg-black">
                                        <div className="text-2xl font-bold text-white">{gameOver ? 'GAME OVER' : 'PAUSED'}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-700">
                                <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">Score</h2>
                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{score}</p>
                            </div>

                            <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-700">
                                <h2 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-100">Controls</h2>
                                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                    <p>← → : Move</p>
                                    <p>↓ : Soft Drop</p>
                                    <p>↑ : Rotate</p>
                                    <p>Space : Hard Drop</p>
                                    <p>P : Pause</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                {!isPlaying || gameOver ? (
                                    <button
                                        onClick={startGame}
                                        className="rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-600"
                                    >
                                        {gameOver ? 'New Game' : 'Start Game'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={togglePause}
                                        className="rounded-lg bg-yellow-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-yellow-600"
                                    >
                                        {isPaused ? 'Resume' : 'Pause'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
