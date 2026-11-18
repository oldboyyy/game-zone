import stripe from "@/infra/payment/stripe";
import AppError from "@/shared/errors/AppError";

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/150";

function safeImage(images: string[] = []): string {
  return images?.[0] || PLACEHOLDER_IMAGE;
}

function validImage(url: string): string {
  return url.length <= 2048 ? url : PLACEHOLDER_IMAGE;
}

export class CheckoutService {
  constructor() {}

  async createStripeSession(cart: any, userId: string) {
    if (!userId || cart?.userId !== userId) {
      throw new AppError(403, "Checkout cart does not belong to this user");
    }
    if (!Array.isArray(cart.cartItems) || cart.cartItems.length === 0) {
      throw new AppError(400, "Cart is empty");
    }
    // Validate stock for all cart items
    for (const item of cart.cartItems) {
      if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0 ||
          !item.variant || !Number.isFinite(item.variant.price) || item.variant.price < 0 ||
          !Number.isSafeInteger(Math.round(item.variant.price * 100)) ||
          !Number.isInteger(item.variant.stock) || item.variant.stock < 0) {
        throw new AppError(400, "Invalid checkout item");
      }
      if (item.variant.stock < item.quantity) {
        throw new AppError(
          400,
          `Insufficient stock for variant ${item.variant.sku}: only ${item.variant.stock} available`
        );
      }
    }

    const lineItems = cart.cartItems.map((item: any) => {
      const imageUrl = validImage(safeImage(item.variant.product.images));

      return {
        price_data: {
          currency: "kzt",
          product_data: {
            name: `${item.variant.product.name} (${item.variant.sku})`,
            images: [imageUrl],
            metadata: { variantId: item.variantId },
          },
          unit_amount: Math.round(item.variant.price * 100),
        },
        quantity: item.quantity,
      };
    });

    const isProduction = process.env.NODE_ENV === "production";

    const clientUrl = isProduction
      ? process.env.CLIENT_URL_PROD
      : process.env.CLIENT_URL_DEV;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["KZ"],
      },
      locale: "ru",
      mode: "payment",
      success_url: `${clientUrl}/orders`,
      cancel_url: `${clientUrl}/cancel`,
      metadata: { userId, cartId: cart.id },
    });

    return session;
  }
}
