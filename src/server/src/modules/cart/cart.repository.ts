import AppError from "@/shared/errors/AppError";
import { Prisma } from "@prisma/client";
import prisma from "@/infra/database/database.config";

export class CartRepository {
  async getCartByUserId(userId: string) {
    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        cartItems: { include: { variant: { include: { product: true } } } },
      },
    });

    return cart;
  }

  async getCartBySessionId(sessionId: string) {
    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        cartItems: { include: { variant: { include: { product: true } } } },
      },
    });

    return cart;
  }

  async createCart(data: { userId?: string; sessionId?: string }) {
    const cart = await prisma.cart.create({
      data,
      include: {
        cartItems: { include: { variant: { include: { product: true } } } },
      },
    });

    return cart;
  }

  async findCartItem(cartId: string, variantId: string) {
    const item = await prisma.cartItem.findFirst({
      where: { cartId, variantId },
    });

    return item;
  }

  async addItemToCart(data: {
    cartId: string;
    variantId: string;
    quantity: number;
  }) {
    try {
      // Validate stock
      const variant = await prisma.productVariant.findUnique({
        where: { id: data.variantId },
        select: { stock: true },
      });

      if (!variant) {
        throw new AppError(404, "Variant not found");
      }
      if (variant.stock < data.quantity) {
        throw new AppError(400, `Insufficient stock: only ${variant.stock} available`);
      }

      const item = await prisma.cartItem.create({ data });

      return item;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError(409, "Item already exists in cart");
      }
      throw error;
    }
  }

  async updateCartItemQuantity(itemId: string, quantity: number) {
    // Validate stock
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { variant: true },
    });

    if (!cartItem) {
      throw new AppError(404, "Cart item not found");
    }
    if (cartItem.variant.stock < quantity) {
      throw new AppError(400,
        `Insufficient stock: only ${cartItem.variant.stock} available`
      );
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return updatedItem;
  }

  async removeCartItem(itemId: string) {
    const result = await prisma.cartItem.delete({ where: { id: itemId } });

    return result;
  }

  async mergeCarts(sessionCartId: string, userCartId: string) {
    if (sessionCartId === userCartId) return;
    return prisma.$transaction(async (tx) => {
      const sessionItems = await tx.cartItem.findMany({
        where: { cartId: sessionCartId },
        include: { variant: true },
      });

      for (const item of sessionItems) {
        const existingItem = await tx.cartItem.findFirst({
          where: { cartId: userCartId, variantId: item.variantId },
        });

        if (existingItem) {
          const newQuantity = existingItem.quantity + item.quantity;

          if (item.variant.stock < newQuantity) {
            throw new AppError(400,
              `Insufficient stock for variant ${item.variantId}: only ${item.variant.stock} available`
            );
          }
          await tx.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQuantity },
          });
        } else {
          if (item.variant.stock < item.quantity) {
            throw new AppError(400,
              `Insufficient stock for variant ${item.variantId}: only ${item.variant.stock} available`
            );
          }
          await tx.cartItem.create({
            data: {
              cartId: userCartId,
              variantId: item.variantId,
              quantity: item.quantity,
            },
          });
        }
      }
      await tx.cart.delete({ where: { id: sessionCartId } });
    });
  }

  async deleteCart(id: string) {
    const result = await prisma.cart.delete({ where: { id } });

    return result;
  }

  async clearCart(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const cart = await client.cart.findFirst({
      where: { userId },
    });

    if (!cart) {
      return;
    }

    const result = await client.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return result;
  }
}
