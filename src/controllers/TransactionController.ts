import { Response, Request } from "express";
import Stripe from "stripe";
import { getAuth } from "@clerk/express";
import { Course, Transaction, UserCourseProgress } from "../models";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Stripe secret key is required but was not found");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  const auth = getAuth(req);

  if (!auth.userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { userId } = req.query;

  try {
    const transactions = userId
      ? await Transaction.query("userId").eq(userId).exec()
      : await Transaction.scan().exec();

    res
      .status(200)
      .json({
        message: "Transaction retrieved successfully",
        data: transactions
      });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error retrieving transactions",
        error
      });
  }
};

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
      .status(201)
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

export const createTransaction = async (req: Request, res: Response): Promise<void> => {
  const auth = getAuth(req);

  if (!auth.userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { userId, courseId, transactionId, amount, paymentProvider } = req.body;

  try {
    const course = await Course.get(courseId);

    const newTransaction = new Transaction({
      dateTime: new Date().toISOString(),
      userId,
      courseId,
      transactionId,
      amount,
      paymentProvider
    });
    await newTransaction.save();

    const initialProgress = new UserCourseProgress({
      userId,
      courseId,
      enrollmentDate: new Date().toISOString(),
      overallProgress: 0,
      sections: course.sections.map((section: any) => ({
        sectionId: section.sectionId,
        chapters: section.chapters.map((chapter: any) => ({
          chapterId: chapter.chapterId,
          completed: false
        }))
      })),
      lastAccessedTimestamp: new Date().toISOString()
    });
    await initialProgress.save();

    await Course.update(
      { courseId },
      {
        $ADD: {
          enrollments: [{ userId }]
        }
      }
    );

    res
      .status(201)
      .json({
        message: "Purchase course successfully",
        data: {
          transaction: newTransaction,
          courseProgress: initialProgress
        }
      });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error creating transaction and enrrollment",
        error
      });
  }
};
