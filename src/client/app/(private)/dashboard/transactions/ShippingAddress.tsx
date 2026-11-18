"use client";

import { MapPin } from "lucide-react";

const ShippingAddress = ({ address }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-md">
      <div className="flex items-center mb-4">
        <MapPin className="mr-2 text-blue-600" size={20} />
        <h2 className="text-lg font-semibold">Адрес доставки</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-6">
        <div>
          <p className="text-sm text-gray-500">Улица</p>
          <p>{address.street}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Город</p>
          <p>{address.city}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Область</p>
          <p>{address.state}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Страна</p>
          <p>{address.country}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Почтовый индекс</p>
          <p>{address.zip}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">ID адреса</p>
          <p className="font-mono">{address.id.substring(0, 8)}...</p>
        </div>
      </div>
    </div>
  );
};

export default ShippingAddress;
