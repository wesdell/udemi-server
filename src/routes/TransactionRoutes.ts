import express from 'express';

import { createStripePaymentIntent, createTransaction, getTransactions } from '../controllers/TransactionController';

const router = express.Router();

router.get("/", getTransactions);

router.post("/stripe/payment-intent", createStripePaymentIntent);
router.post("/", createTransaction);

export default router;
