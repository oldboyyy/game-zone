"use client";

import { localizeLabel } from "@/app/lib/i18n/ru";
import useFormatPrice from "@/app/hooks/ui/useFormatPrice";
import formatDate from "@/app/utils/formatDate";
import { CreditCard } from "lucide-react";

const PaymentInformation = ({ payment }) => {
  const format = useFormatPrice();
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-md">
      <div className="flex items-center mb-4">
        <CreditCard className="mr-2 text-blue-600" size={20} />
        <h2 className="text-lg font-semibold">Данные платежа</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
        <div>
          <p className="text-sm text-gray-500">ID платежа</p>
          <p className="font-mono">{payment.id.substring(0, 8)}...</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Способ оплаты</p>
          <p className="capitalize">{payment.method}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Сумма</p>
          <p className="font-medium">{format(payment.amount)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Статус</p>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              payment.status === "PAID"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {localizeLabel(payment.status)}
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-500">Создано</p>
          <p>{formatDate(payment.createdAt)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Обновлено</p>
          <p>{formatDate(payment.updatedAt)}</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentInformation;
