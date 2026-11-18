"use client";
import { useInitiateCheckoutMutation } from "@/app/store/apis/CheckoutApi";
import React, { useMemo } from "react";
import { formatPrice } from "@/app/lib/constants/config";
import useToast from "@/app/hooks/ui/useToast";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { isDemoMode } from "@/app/lib/demo";

interface CartSummaryProps {
  subtotal: number;
  shippingRate?: number;
  totalItems: number;
  cartId: string;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  shippingRate = 0,
  totalItems,
}) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const demoMode = isDemoMode();

  const [initiateCheckout, { isLoading }] = useInitiateCheckoutMutation();

  const shippingFee = useMemo(
    () => subtotal * shippingRate,
    [subtotal, shippingRate]
  );
  const total = useMemo(() => subtotal + shippingFee, [subtotal, shippingFee]);

  const handleInitiateCheckout = async () => {
    try {
      const res = (await initiateCheckout(undefined).unwrap()) as {
        sessionId?: string;
        url?: string;
        orderId?: string;
      };

      if (demoMode) {
        showToast("Заказ оформлен в деморежиме", "success");
        router.push(
          `/success?type=order&orderId=${res.orderId ?? "demo-order"}`
        );
        return;
      }

      if (!res.url) {
        showToast("Оплата временно недоступна. Обратитесь в поддержку.", "error");
        return;
      }
      window.location.assign(res.url);
    } catch (error: unknown) {
      const message = (error as { data?: { message?: string } })?.data?.message;
      showToast(message || "Не удалось начать оформление заказа", "error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-lg p-6 sm:p-8 border border-gray-200"
    >
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
        Ваш заказ
      </h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-gray-700">
          <span>Количество товаров</span>
          <span>{totalItems}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Стоимость товаров</span>
          <span className="font-medium text-gray-800">
            {formatPrice(subtotal)}
          </span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Доставка</span>
          <span className="font-medium text-gray-800">
            {formatPrice(shippingFee)}
          </span>
        </div>
        <div className="flex justify-between pt-3 border-t border-gray-200">
          <span className="font-semibold text-gray-800">Итого</span>
          <span className="font-semibold text-gray-800">
            {formatPrice(total)}
          </span>
        </div>
      </div>

      {isAuthenticated ? (
        <button
          disabled={isLoading || totalItems === 0}
          onClick={handleInitiateCheckout}
          className="mt-4 w-full bg-indigo-600 text-white py-2.5 rounded-md font-medium text-sm hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? "Обрабатываем…" : "Оформить заказ"}
        </button>
      ) : (
        <Link
          href="/sign-in"
          className="mt-4 w-full inline-block text-center bg-gray-300 text-gray-800 py-2.5 rounded-md font-medium text-sm hover:bg-gray-400 transition-colors"
        >
          Войти и оформить заказ
        </Link>
      )}
    </motion.div>
  );
};

export default CartSummary;
