import express from 'express';

import { updateClerkUser } from '../controllers/ClerkUserController';

const router = express.Router();

router.put("/:userId", updateClerkUser);

export default router;
