"use client";
import { Controller, UseFormReturn } from "react-hook-form";
import { UserPlus, Mail, User, Lock } from "lucide-react";

export interface CreateAdminFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface CreateAdminFormProps {
  form: UseFormReturn<CreateAdminFormData>;
  onSubmit: (data: CreateAdminFormData) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const CreateAdminForm: React.FC<CreateAdminFormProps> = ({
  form,
  onSubmit,
  isLoading,
  submitLabel = "Создать администратора",
}) => {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = form;

  const password = watch("password");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Полное имя
        </label>
        <div className="relative">
          <Controller
            name="name"
            control={control}
            rules={{
              required: "Введите имя",
              minLength: {
                value: 3,
                message: "Имя должно содержать минимум 3 символа",
              },
            }}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                placeholder="Иван Иванов"
              />
            )}
          />
          <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
        </div>
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Электронная почта
        </label>
        <div className="relative">
          <Controller
            name="email"
            control={control}
            rules={{
              required: "Введите электронную почту",
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: "Неверный формат почты",
              },
            }}
            render={({ field }) => (
              <input
                {...field}
                type="email"
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                placeholder="john.doe@example.com"
              />
            )}
          />
          <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
        </div>
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Пароль
        </label>
        <div className="relative">
          <Controller
            name="password"
            control={control}
            rules={{
              required: "Введите пароль",
              minLength: {
                value: 6,
                message: "Пароль должен содержать минимум 6 символов",
              },
            }}
            render={({ field }) => (
              <input
                {...field}
                type="password"
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                placeholder="Введите пароль"
              />
            )}
          />
          <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
        </div>
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Подтвердите пароль
        </label>
        <div className="relative">
          <Controller
            name="confirmPassword"
            control={control}
            rules={{
              required: "Подтвердите пароль",
              validate: (value) =>
                value === password || "Пароли не совпадают",
            }}
            render={({ field }) => (
              <input
                {...field}
                type="password"
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                placeholder="Подтвердите пароль"
              />
            )}
          />
          <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
        </div>
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Role Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <UserPlus className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            Аккаунт администратора
          </span>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          Пользователь получит права администратора для управления пользователями и настройками.
        </p>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className={`px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-300 flex items-center space-x-2 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>{isLoading ? "Creating..." : submitLabel}</span>
        </button>
      </div>
    </form>
  );
};

export default CreateAdminForm;
