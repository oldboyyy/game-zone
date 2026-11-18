"use client";

import { localizeLabel } from "@/app/lib/i18n/ru";
import formatDate from "@/app/utils/formatDate";
import { getStatusColor } from "@/app/utils/getStatusColor";

const TransactionOverview = ({ transaction }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 transition-all duration-200 hover:shadow-md">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold mb-4">Обзор транзакции</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
            <div>
              <p className="text-sm text-gray-500">ID транзакции</p>
              <p className="font-mono">{transaction.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Номер заказа</p>
              <p className="font-mono">{transaction.orderId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Дата транзакции</p>
              <p>{formatDate(transaction.transactionDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Последнее обновление</p>
              <p>{formatDate(transaction.updatedAt)}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-sm text-gray-500 mb-1">Текущий статус</p>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              transaction.status
            )}`}
          >
            {localizeLabel(transaction.status)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TransactionOverview;
