"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { XCircle, ShoppingCart, Headphones } from "lucide-react";

const PaymentFailed = () => {
  const router = useRouter();

  const handleRedirect = (url: string) => {
    router.push(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center min-h-screen bg-red-100 p-4"
    >
      {/* Error Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-red-600 mb-6"
      >
        <XCircle size={80} />
      </motion.div>

      {/* Error Message */}
      <h1 className="text-center text-3xl font-semibold text-red-700 mb-4">
        Ошибка оплаты
      </h1>

      <p className="text-center text-lg text-gray-700 mb-6">
        Не удалось выполнить оплату. Повторите попытку или обратитесь в поддержку.
      </p>

      {/* Helpful Links */}
      <div className="flex space-x-6">
        <button
          onClick={() => handleRedirect("/orders")}
          className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <ShoppingCart size={18} />
          <span>Посмотреть заказы</span>
        </button>
        <button
          onClick={() => handleRedirect("/support")}
          className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <Headphones size={18} />
          <span>Связаться с поддержкой</span>
        </button>
      </div>
    </motion.div>
  );
};

export default PaymentFailed;
