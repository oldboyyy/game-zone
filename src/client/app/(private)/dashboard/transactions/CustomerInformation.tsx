"use client";

import { localizeLabel } from "@/app/lib/i18n/ru";
import { User } from "lucide-react";

const CustomerInformation = ({ user }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-md">
      <div className="flex items-center mb-4">
        <User className="mr-2 text-blue-600" size={20} />
        <h2 className="text-lg font-semibold">Данные покупателя</h2>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-500">Имя покупателя</p>
          <p>{user.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Электронная почта</p>
          <p>{user.email}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">ID покупателя</p>
          <p className="font-mono">{user.id}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Роль</p>
          <p className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {localizeLabel(user.role)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerInformation;
