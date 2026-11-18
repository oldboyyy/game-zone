"use client";
import { Controller, UseFormReturn } from "react-hook-form";
import { Tag } from "lucide-react";
import Dropdown from "@/app/components/molecules/Dropdown";
import { ProductFormData } from "./product.types";
import CheckBox from "@/app/components/atoms/CheckBox";
import VariantForm from "./VariantForm";

interface ProductFormProps {
  form: UseFormReturn<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
  categories?: { label: string; value: string }[];
  categoryAttributes?: {
    id: string;
    name: string;
    isRequired: boolean;
    values: { id: string; value: string; slug: string }[];
  }[];
  isLoading?: boolean;
  error?: any;
  submitLabel?: string;
}

const ProductForm: React.FC<ProductFormProps> = ({
  form,
  onSubmit,
  categories = [],
  categoryAttributes = [],
  isLoading,
  error,
  submitLabel = "Сохранить",
}) => {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;

  return (
    <form
      encType="multipart/form-data"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Название товара
          </label>
          <div className="relative">
            <Controller
              name="name"
              control={control}
              rules={{ required: "Введите имя" }}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
                  placeholder="Например: игровая мышь"
                />
              )}
            />
            <Tag className="absolute left-3 top-3.5 text-gray-400" size={18} />
          </div>
          {errors.name && (
            <p className="text-red-500 text-xs mt-1 pl-10">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Категория
          </label>
          <Controller
            name="categoryId"
            control={control}
            rules={{ required: "Выберите категорию" }}
            render={({ field }) => (
              <Dropdown
                onChange={(value) => {
                  field.onChange(value);
                  setValue("variants", []); // Reset variants when category changes
                }}
                options={categories}
                value={field.value}
                label="Например: игровые мыши"
                className="py-[14px]"
              />
            )}
          />
          {errors.categoryId && (
            <p className="text-red-500 text-xs mt-1">
              {errors.categoryId.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Метки товара
        </label>
        <div className="grid grid-cols-2 gap-4">
          <CheckBox
            name="isNew"
            control={control}
            label="Новинка"
            defaultValue={false}
          />
          <CheckBox
            name="isBestSeller"
            control={control}
            label="Хит продаж"
            defaultValue={false}
          />
          <CheckBox
            name="isFeatured"
            control={control}
            label="Рекомендуем"
            defaultValue={false}
          />
          <CheckBox
            name="isTrending"
            control={control}
            label="Популярное"
            defaultValue={false}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Описание
        </label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              className="px-4 py-3 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
              placeholder="Опишите особенности товара…"
              rows={3}
            />
          )}
        />
      </div>

      <VariantForm form={form} categoryAttributes={categoryAttributes} />

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-600 text-sm font-medium">
            {error.data?.message || "Произошла ошибка"}
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className={`px-6 py-3 text-white rounded-lg shadow-md font-medium flex items-center justify-center min-w-24 ${
            isLoading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          } transition-all duration-200`}
        >
          {isLoading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
