import express from 'express';

import { createStripePaymentIntent, createTransaction } from '../controllers/TransactionController';

const router = express.Router();

router.post("/stripe/payment-intent", createStripePaymentIntent);
router.post("/", createTransaction);

export default router;
