"use client";

import { MessageCircleOff } from "lucide-react";
import MainLayout from "@/app/components/templates/MainLayout";

interface DemoFeatureUnavailableProps {
  featureName?: string;
  useDashboardLayout?: boolean;
}

export default function DemoFeatureUnavailable({
  featureName = "Онлайн-чат",
  useDashboardLayout = false,
}: DemoFeatureUnavailableProps) {
  const content = (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <MessageCircleOff className="mb-4 h-12 w-12 text-amber-600" aria-hidden />
      <h1 className="text-xl font-semibold text-gray-900">{featureName} недоступен</h1>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">
        Для онлайн-чата нужен работающий сервер. В деморежиме доступны другие разделы магазина.
      </p>
    </div>
  );

  if (useDashboardLayout) {
    return content;
  }

  return <MainLayout>{content}</MainLayout>;
}
