import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as GamesController from './games.controller';
import { completeTetrisSchema, completeWordPuzzleSchema, startWordPuzzleSchema } from './games.schema';

const router = Router();

router.post('/word-puzzle/start', authenticateToken, validate(startWordPuzzleSchema), GamesController.startWordPuzzle);
router.post('/word-puzzle/:sessionId/complete', authenticateToken, validate(completeWordPuzzleSchema), GamesController.completeWordPuzzle);
router.post('/tetris/start', authenticateToken, GamesController.startTetris);
router.post('/tetris/:sessionId/complete', authenticateToken, validate(completeTetrisSchema), GamesController.completeTetris);

export default router;
