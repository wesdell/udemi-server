import path from "node:path";

import { Response, Request } from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import { getAuth } from "@clerk/express";

dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

if (process.env.STRIPE_SECRET_KEY!) {
  throw new Error("Stripe secret key is required but was not found");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const createStripePaymentIntent = async (req: Request, res: Response): Promise<void> => {
  const auth = getAuth(req);

  if (!auth.userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  let { amount } = req.body;
  if (!amount || amount === 0) {
    amount = 50;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never"
      }
    });

    res
      .status(200)
      .json({
        message: "",
        data: {
          clientSecret: paymentIntent.client_secret
        }
      });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error creating stripe payment intent",
        error
      });
  }
};
