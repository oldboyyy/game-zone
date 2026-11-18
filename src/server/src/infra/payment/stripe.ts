import Stripe from "stripe";
import AppError from "@/shared/errors/AppError";

let client: Stripe | undefined;
const stripe = new Proxy({} as Stripe, {
  get(_target, property) {
    if (!process.env.STRIPE_SECRET_KEY) throw new AppError(503, "Оплата временно недоступна: Stripe не настроен");
    client ??= new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-03-31.basil" });
    const value = Reflect.get(client, property);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default stripe;
