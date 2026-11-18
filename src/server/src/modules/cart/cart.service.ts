import AppError from "@/shared/errors/AppError";
import { CartRepository } from "./cart.repository";
import prisma from "@/infra/database/database.config";
import { CART_EVENT } from "@prisma/client";

export class CartService {
  constructor(private cartRepository: CartRepository) {}

  async getOrCreateCart(userId?: string, sessionId?: string) {
    let cart;

    if (userId) {
      cart = await this.cartRepository.getCartByUserId(userId);

      if (!cart) {
        cart = await this.cartRepository.createCart({ userId });
      }
    } else if (sessionId) {
      cart = await this.cartRepository.getCartBySessionId(sessionId);

      if (!cart) {
        cart = await this.cartRepository.createCart({ sessionId });
      }
    } else {
      throw new AppError(400, "User ID or Session ID is required");
    }

    return cart;
  }

  async logCartEvent(
    cartId: string,
    eventType: CART_EVENT,
    userId?: string
  ): Promise<void> {
    await prisma.cartEvent.create({
      data: {
        userId,
        cartId,
        eventType,
      },
    });
  }

  async getAbandonedCartMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalAbandonedCarts: number;
    abandonmentRate: number;
    potentialRevenueLost: number;
  }> {
    const cartEvents = await prisma.cartEvent.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        cart: {
          include: { cartItems: { include: { variant: true } } },
        },
        user: true,
      },
    });

    const cartEventsByCartId = cartEvents.reduce((acc: any, event) => {
      if (!acc[event.cartId]) acc[event.cartId] = [];
      acc[event.cartId].push(event);
      return acc;
    }, {});

    let totalCarts = 0;
    let totalAbandonedCarts = 0;
    let potentialRevenueLost = 0;

    for (const cartId in cartEventsByCartId) {
      const events = cartEventsByCartId[cartId];
      const hasAddToCart = events.some((e: any) => e.eventType === "ADD");
      const hasCheckoutCompleted = events.some(
        (e: any) => e.eventType === "CHECKOUT_COMPLETED"
      );

      const cart = events[0].cart;
      if (!cart || !cart.cartItems || cart.cartItems.length === 0) continue;

      totalCarts++;

      if (hasAddToCart && !hasCheckoutCompleted) {
        const addToCartEvent = events.find((e: any) => e.eventType === "ADD");
        const oneHourLater = new Date(
          addToCartEvent.timestamp.getTime() + 60 * 60 * 1000
        );
        const now = new Date();

        if (now > oneHourLater) {
          totalAbandonedCarts++;
          potentialRevenueLost += cart.cartItems.reduce(
            (sum: number, item: any) =>
              sum + item.quantity * item.variant.price,
            0
          );
        }
      }
    }

    const abandonmentRate =
      totalCarts > 0 ? (totalAbandonedCarts / totalCarts) * 100 : 0;

    return {
      totalAbandonedCarts,
      abandonmentRate,
      potentialRevenueLost,
    };
  }

  async getCartCount(userId?: string, sessionId?: string) {
    const cart = await this.getOrCreateCart(userId, sessionId);
    const count = cart.cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return count;
  }

  async addToCart(
    variantId: string,
    quantity: number,
    userId?: string,
    sessionId?: string
  ) {
    if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 2147483647) {
      throw new AppError(400, "Quantity must be greater than 0");
    }

    if (typeof variantId !== "string" || !variantId.trim()) {
      throw new AppError(400, "Variant ID is required");
    }
    const cart = await this.getOrCreateCart(userId, sessionId);

    const existingItem = await this.cartRepository.findCartItem(
      cart.id,
      variantId
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      const updatedItem = await this.cartRepository.updateCartItemQuantity(
        existingItem.id,
        newQuantity
      );

      await this.logCartEvent(cart.id, "ADD", userId);

      return updatedItem;
    }
    const item = await this.cartRepository.addItemToCart({
      cartId: cart.id,
      variantId,
      quantity,
    });

    await this.logCartEvent(cart.id, "ADD", userId);

    return item;
  }

  async updateCartItemQuantity(itemId: string, quantity: number, userId?: string, sessionId?: string) {
    if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 2147483647) {
      throw new AppError(400, "Quantity must be greater than 0");
    }

    await this.assertItemOwner(itemId, userId, sessionId);
    const result = this.cartRepository.updateCartItemQuantity(itemId, quantity);

    return result;
  }

  async removeFromCart(itemId: string, userId?: string, sessionId?: string) {
    await this.assertItemOwner(itemId, userId, sessionId);
    const result = this.cartRepository.removeCartItem(itemId);

    return result;
  }

  private async assertItemOwner(itemId: string, userId?: string, sessionId?: string) {
    const cart = userId
      ? await this.cartRepository.getCartByUserId(userId)
      : sessionId
        ? await this.cartRepository.getCartBySessionId(sessionId)
        : null;
    if (!cart || !cart.cartItems.some((item) => item.id === itemId)) {
      throw new AppError(404, "Cart item not found");
    }
  }

  async mergeCartsOnLogin(sessionId: string, userId: string | undefined) {
    if (!userId) throw new AppError(401, "Please log in to merge carts");
    const sessionCart = await this.cartRepository.getCartBySessionId(sessionId);

    if (!sessionCart) {
      return;
    }

    const userCart = await this.getOrCreateCart(userId);

    await this.cartRepository.mergeCarts(sessionCart.id, userCart.id);
  }
}
