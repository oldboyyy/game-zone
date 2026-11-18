import {
  Prisma,
  PAYMENT_STATUS,
  TRANSACTION_STATUS,
  CART_STATUS,
} from "@prisma/client";
import stripe from "@/infra/payment/stripe";
import AppError from "@/shared/errors/AppError";
import redisClient from "@/infra/cache/redis";
import { makeLogsService } from "../logs/logs.factory";
import { CartService } from "../cart/cart.service";
import { CartRepository } from "../cart/cart.repository";

import prisma from "@/infra/database/database.config";
import Stripe from "stripe";

export class WebhookService {
  private logsService = makeLogsService();
  private repo = new CartRepository();
  private cartService = new CartService(this.repo);

  async handleCheckoutCompletion(session: any) {
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items"],
    });

    if (fullSession.payment_status !== "paid") {
      throw new AppError(400, "Checkout session is not paid");
    }
    const existingOrder = await prisma.order.findFirst({
      where: { id: fullSession.id },
    });

    if (existingOrder) {
      await this.logsService.info("Webhook - Duplicate event ignored", {
        sessionId: session.id,
      });
      return {
        order: existingOrder,
        payment: null,
        transaction: null,
        shipment: null,
        address: null,
      };
    }

    const userId = fullSession?.metadata?.userId;
    const cartId = fullSession?.metadata?.cartId;
    if (!userId || !cartId) {
      throw new AppError(400, "Missing userId or cartId in session metadata");
    }

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { cartItems: { include: { variant: { include: { product: true } } } } },
    });
    if (!cart || cart.userId !== userId) {
      throw new AppError(400, "Checkout cart not found for this user");
    }

    // Stripe holds the purchased quantities and prices, even if the cart changes.
    const lines = await stripe.checkout.sessions.listLineItems(fullSession.id, {
      limit: 100,
      expand: ["data.price.product"],
    }).autoPagingToArray({ limit: 10000 });
    const purchasedItems = lines.map((line) => {
      const product = line.price?.product as Stripe.Product | undefined;
      const variantId = product && typeof product === "object" && !("deleted" in product) ? product.metadata?.variantId : undefined;
      const quantity = line.quantity;
      const unitAmount = line.price?.unit_amount;
      if (!variantId || !quantity || !Number.isSafeInteger(quantity) || quantity <= 0 ||
          unitAmount == null || unitAmount < 0) {
        throw new AppError(400, "Invalid checkout line item");
      }
      return { variantId, quantity, price: unitAmount / 100 };
    });
    const amount = purchasedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (!purchasedItems.length || Math.abs(amount - (fullSession.amount_total ?? 0) / 100) > 0.01) {
      throw new AppError(400, "Amount mismatch between purchased items and session");
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create Order and OrderItems
      const order = await tx.order.create({
        data: {
          id: fullSession.id,
          userId,
          amount,
          orderItems: {
            create: purchasedItems.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });

      // Create Address
      let address;
      const customerAddress = fullSession.collected_information?.shipping_details?.address;
      if (customerAddress) {
        address = await tx.address.create({
          data: {
            orderId: order.id,
            userId,
            city: customerAddress.city || "N/A",
            state: customerAddress.state || "N/A",
            country: customerAddress.country || "N/A",
            zip: customerAddress.postal_code || "N/A",
            street: [customerAddress.line1, customerAddress.line2].filter(Boolean).join(", ") || "N/A",
          },
        });
      }

      // Create Payment
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          userId,
          method: fullSession.payment_method_types?.[0] || "unknown",
          amount,
          status: PAYMENT_STATUS.PAID,
        },
      });

      // Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          orderId: order.id,
          status: TRANSACTION_STATUS.PENDING,
          transactionDate: new Date(),
        },
      });

      // Payment does not mean dispatch. Staff create the shipment with real tracking details.
      const shipment = null;

      // Conditional decrements prevent concurrent checkouts from overselling.
      for (const item of purchasedItems) {
        const updated = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count !== 1) {
          throw new AppError(409, "Insufficient stock for purchased variant");
        }
        const variant = await tx.productVariant.findUniqueOrThrow({
          where: { id: item.variantId },
          select: { productId: true },
        });
        await tx.product.update({
          where: { id: variant.productId },
          data: { salesCount: { increment: item.quantity } },
        });

        // Preserve products or extra quantities added after checkout started.
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id, variantId: item.variantId, quantity: { lte: item.quantity } },
        });
        await tx.cartItem.updateMany({
          where: { cartId: cart.id, variantId: item.variantId, quantity: { gt: item.quantity } },
          data: { quantity: { decrement: item.quantity } },
        });
      }
      const remainingItems = await tx.cartItem.count({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { status: remainingItems ? CART_STATUS.ACTIVE : CART_STATUS.CONVERTED },
      });

      return { order, payment, transaction, shipment, address };
    }).catch(async (error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const order = await prisma.order.findUnique({ where: { id: fullSession.id } });
        if (order) return { order, payment: null, transaction: null, shipment: null, address: null };
      }
      throw error;
    });

    // Post-transaction actions
    await redisClient.del("dashboard:year-range");
    const keys = await redisClient.keys("dashboard:stats:*");
    if (keys.length > 0) await redisClient.del(keys);

    await this.cartService.logCartEvent(cart.id, "CHECKOUT_COMPLETED", userId);

    await this.logsService.info("Webhook - Order processed successfully", {
      userId,
      orderId: result.order.id,
      amount,
    });

    return result;
  }
}
