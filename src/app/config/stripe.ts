import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
});

export const stripeConfig = stripe;

export const createPaymentIntent = async (
    amount: number,
    currency: string = "usd",
    metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency,
            metadata,
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return paymentIntent;
    } catch (error) {
        console.error("Stripe payment intent error:", error);
        throw new Error("Failed to create payment intent");
    }
};

export const confirmPaymentIntent = async (
    paymentIntentId: string
): Promise<Stripe.PaymentIntent> => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        return paymentIntent;
    } catch (error) {
        console.error("Stripe confirm payment error:", error);
        throw new Error("Failed to confirm payment");
    }
};

export const createRefund = async (
    paymentIntentId: string,
    amount?: number
): Promise<Stripe.Refund> => {
    try {
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: amount ? amount * 100 : undefined,
        });

        return refund;
    } catch (error) {
        console.error("Stripe refund error:", error);
        throw new Error("Failed to create refund");
    }
};

export const createCustomer = async (
    email: string,
    name?: string
): Promise<Stripe.Customer> => {
    try {
        const customer = await stripe.customers.create({
            email,
            name,
        });

        return customer;
    } catch (error) {
        console.error("Stripe create customer error:", error);
        throw new Error("Failed to create customer");
    }
};

export const getCustomer = async (customerId: string): Promise<Stripe.Customer> => {
    try {
        const customer = await stripe.customers.retrieve(customerId);

        if (customer.deleted) {
            throw new Error("Customer has been deleted");
        }

        return customer as Stripe.Customer;
    } catch (error) {
        console.error("Stripe get customer error:", error);
        throw new Error("Failed to retrieve customer");
    }
};

export const constructWebhookEvent = (
    payload: string | Buffer,
    signature: string,
    secret: string
): Stripe.Event => {
    try {
        const event = stripe.webhooks.constructEvent(payload, signature, secret);
        return event;
    } catch (error: any) {
        console.error("Stripe webhook error:", error);
        throw new Error(`Webhook Error: ${error.message}`);
    }
};
