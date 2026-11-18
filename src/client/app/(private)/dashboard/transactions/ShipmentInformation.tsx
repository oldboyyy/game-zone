"use client";

import formatDate from "@/app/utils/formatDate";
import { Truck } from "lucide-react";

const ShipmentInformation = ({ shipment }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-md">
      <div className="flex items-center mb-4">
        <Truck className="mr-2 text-blue-600" size={20} />
        <h2 className="text-lg font-semibold">Данные доставки</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
        <div>
          <p className="text-sm text-gray-500">ID отправления</p>
          <p className="font-mono">{shipment.id.substring(0, 8)}...</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Перевозчик</p>
          <p>{shipment.carrier}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Трек-номер</p>
          <p className="font-mono">{shipment.trackingNumber}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Дата отправки</p>
          <p>{formatDate(shipment.shippedDate)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Ожидаемая доставка</p>
          <p>{formatDate(shipment.deliveryDate)}</p>
        </div>
      </div>
    </div>
  );
};

export default ShipmentInformation;
