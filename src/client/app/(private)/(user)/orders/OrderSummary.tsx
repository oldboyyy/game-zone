"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import useFormatPrice from "@/app/hooks/ui/useFormatPrice";
import formatDate from "@/app/utils/formatDate";
import { Calendar, Package, ShoppingBag } from "lucide-react";
import ToggleableText from "@/app/components/atoms/ToggleableText";

const OrderSummary = ({ order }) => {
  const formatPrice = useFormatPrice();
  const shippingCost = 75.0;
  const platformFees = 94.0;
  const subtotal = order.amount;
  const total = useMemo(() => {
    return formatPrice(subtotal + shippingCost + platformFees);
  }, [subtotal, shippingCost, platformFees, formatPrice]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
    >
      <h2 className="font-bold text-gray-800 mb-4">Детали заказа</h2>

      {/* Order Details Section */}
      <div className="border-b border-gray-100 pb-4 mb-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Package size={16} />
            <span className="font-medium text-gray-800">Трек-номер:</span>
            <ToggleableText
              content={order?.shipment?.trackingNumber || "Недоступно"}
              truncateLength={10}
            />
          </div>
          <div className="flex items-center space-x-2">
            <ShoppingBag size={16} />
            <span className="font-medium text-gray-800">Номер заказа:</span>
            <ToggleableText content={order?.id} truncateLength={10} />
          </div>
          <div className="flex items-center space-x-2">
            <Calendar size={16} />
            <span className="font-medium text-gray-800">
              Дата оформления {formatDate(order.orderDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Summary Section */}
      <div className="space-y-3">
        <div className="flex justify-between text-gray-700">
          <p>Цена товара</p>
          <div className="flex items-center space-x-4">
            <span className="text-gray-500">
              {order.orderItems.length} Товары
            </span>
            <span className="font-medium text-gray-800">
              {formatPrice(subtotal)}
            </span>
          </div>
        </div>
        <div className="flex justify-between text-gray-700">
          <p>Стоимость доставки</p>
          <span className="font-medium text-gray-800">
            {formatPrice(shippingCost)}
          </span>
        </div>
        <div className="flex justify-between text-gray-700">
          <p>Сервисный сбор</p>
          <span className="font-medium text-gray-800">
            {formatPrice(platformFees)}
          </span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-100">
          <p className="font-semibold text-gray-800">Итого</p>
          <span className="font-semibold text-gray-800">{total}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderSummary;
