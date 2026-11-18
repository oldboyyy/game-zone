"use client";
import dynamic from "next/dynamic";
import StatsCard from "@/app/components/organisms/StatsCard";
import Dropdown from "@/app/components/molecules/Dropdown";
import DateRangePicker from "@/app/components/molecules/DateRangePicker";
import {
  BarChart2,
  CreditCard,
  DollarSign,
  ShoppingCart,
  Users,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
import { Controller, useForm } from "react-hook-form";
import React, { useState } from "react";
import useFormatPrice from "@/app/hooks/ui/useFormatPrice";
import { useLazyExportAnalyticsQuery } from "@/app/store/apis/AnalyticsApi";
import { useQuery } from "@apollo/client";
import { GET_ALL_ANALYTICS } from "@/app/gql/Dashboard";
import CustomLoader from "@/app/components/feedback/CustomLoader";
import ListCard from "@/app/components/organisms/ListCard";
import { withAuth } from "@/app/components/HOC/WithAuth";

// Dynamically import charting components with SSR disabled
const AreaChart = dynamic(
  () => import("@/app/components/charts/AreaChartComponent"),
  { ssr: false }
);
const BarChart = dynamic(
  () => import("@/app/components/charts/BarChartComponent"),
  { ssr: false }
);
const DonutChart = dynamic(
  () => import("@/app/components/charts/DonutChartComponent"),
  { ssr: false }
);
const RevenueOverTimeChart = dynamic(
  () => import("@/app/components/charts/RevenueOverTimeChart"),
  { ssr: false }
);

interface FormData {
  timePeriod: string;
  year?: string;
  startDate?: string;
  endDate?: string;
  useCustomRange: boolean;
}

const AnalyticsDashboard = () => {
  const { control, watch } = useForm<FormData>({
    defaultValues: {
      timePeriod: "allTime",
      useCustomRange: false,
      year: new Date().getFullYear().toString(),
    },
  });
  const formatPrice = useFormatPrice();

  const timePeriodOptions = [
    { label: "Последние 7 дней", value: "last7days" },
    { label: "Последний месяц", value: "lastMonth" },
    { label: "Последний год", value: "lastYear" },
    { label: "За всё время", value: "allTime" },
  ];

  const { timePeriod, year, startDate, endDate, useCustomRange } = watch();

  const queryParams = {
    timePeriod: timePeriod || "allTime",
    year: useCustomRange ? undefined : year ? parseInt(year, 10) : undefined,
    startDate: useCustomRange && startDate ? startDate : undefined,
    endDate: useCustomRange && endDate ? endDate : undefined,
  };

  const { data, loading, error } = useQuery(GET_ALL_ANALYTICS, {
    variables: { params: queryParams },
  });

  const [exportType, setExportType] = useState<string>("all");
  const [exportFormat] = useState<string>("csv");

  console.log("Analytics data => ", data);
  console.log("error loading analytics => ", error);

  const minYear = data?.yearRange?.minYear || 2020;
  const maxYear = data?.yearRange?.maxYear || 2020;

  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => ({
    label: (minYear + i).toString(),
    value: (minYear + i).toString(),
  }));

  const [, { isLoading: isExporting, error: exportError }] =
    useLazyExportAnalyticsQuery();

  console.log("export error => ", exportError);

  const handleExport = async () => {};

  if (loading) {
    return <CustomLoader />;
  }

  if (error) {
    console.error("GraphQL Error:", error);
    return <div>Ошибка загрузки аналитики</div>;
  }

  // Chart and list data
  const mostSoldProducts = {
    labels: data?.productPerformance?.slice(0, 10).map((p) => p.name) || [],
    data: data?.productPerformance?.slice(0, 10).map((p) => p.quantity) || [],
  };

  const salesByProduct = {
    categories: data?.productPerformance?.map((p) => p.name) || [],
    data: data?.productPerformance?.map((p) => p.revenue) || [],
  };

  const interactionByType = {
    labels: ["Views", "Clicks", "Others"],
    data: [
      data?.interactionAnalytics?.byType?.views || 0,
      data?.interactionAnalytics?.byType?.clicks || 0,
      data?.interactionAnalytics?.byType?.others || 0,
    ],
  };

  const topItems =
    data?.productPerformance?.slice(0, 10).map((p) => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      revenue: formatPrice(p.revenue),
    })) || [];

  const topUsers =
    data?.userAnalytics?.topUsers?.slice(0, 10).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      orderCount: u.orderCount,
      totalSpent: formatPrice(u.totalSpent),
      engagementScore: u.engagementScore,
    })) || [];

  const mostViewedProducts =
    data?.interactionAnalytics?.mostViewedProducts?.slice(0, 10).map((p) => ({
      id: p.productId,
      name: p.productName,
      viewCount: p.viewCount,
    })) || [];

  const exportTypeOptions = [
    { label: "Все данные", value: "all" },
    { label: "Обзор", value: "overview" },
    { label: "Товары", value: "товаров" },
    { label: "Пользователи", value: "users" },
  ];

  const exportFormatOptions = [
    { label: "CSV", value: "csv" },
    { label: "PDF", value: "pdf" },
    { label: "XLSX", value: "xlsx" },
  ];

  return (
    <motion.div
      className="p-4 min-h-screen space-y-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Аналитика магазина</h1>
        <div className="flex items-center gap-4">
          <Controller
            name="timePeriod"
            control={control}
            render={({ field }) => (
              <Dropdown
                onChange={field.onChange}
                options={timePeriodOptions}
                value={field.value}
                label="Период"
                className="min-w-[150px] max-w-[200px]"
              />
            )}
          />
          <Controller
            name="year"
            control={control}
            render={({ field }) => (
              <Dropdown
                onChange={field.onChange}
                options={yearOptions}
                value={field.value ?? "all"}
                label="Year"
                className="min-w-[150px] max-w-[200px]"
                disabled={useCustomRange}
              />
            )}
          />
          <DateRangePicker
            label="Произвольный период"
            control={control}
            startName="startDate"
            endName="endDate"
          />
          <Dropdown
            options={exportTypeOptions}
            value={exportType}
            onChange={(value) => value !== null && setExportType(value)}
            label="Тип экспорта"
            className="min-w-[150px] max-w-[200px]"
          />
          <Dropdown
            options={exportFormatOptions}
            value={exportFormat}
            onChange={(value) => setExportType(value ?? "")}
            label="Формат экспорта"
            className="min-w-[150px] max-w-[200px]"
          />
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="w-5 h-5" />
            {isExporting ? "Exporting..." : "Экспорт"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <StatsCard
          title="Общая выручка"
          value={formatPrice(data?.revenueAnalytics?.totalRevenue || 0)}
          percentage={data?.revenueAnalytics?.changes?.revenue}
          caption="к предыдущему периоду"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatsCard
          title="Всего заказов"
          value={data?.orderAnalytics?.totalOrders || 0}
          percentage={data?.orderAnalytics?.changes?.orders}
          caption="к предыдущему периоду"
          icon={<ShoppingCart className="w-5 h-5" />}
        />
        <StatsCard
          title="Всего продаж"
          value={data?.orderAnalytics?.totalSales || 0}
          percentage={data?.orderAnalytics?.changes?.sales}
          caption="к предыдущему периоду"
          icon={<BarChart2 className="w-5 h-5" />}
        />
        <StatsCard
          title="Средний чек"
          value={formatPrice(data?.orderAnalytics?.averageOrderValue || 0)}
          percentage={data?.orderAnalytics?.changes?.averageOrderValue}
          caption="к предыдущему периоду"
          icon={<CreditCard className="w-5 h-5" />}
        />
        <StatsCard
          title="Всего пользователей"
          value={data?.userAnalytics?.totalUsers || 0}
          percentage={data?.userAnalytics?.changes?.users}
          caption="к предыдущему периоду"
          icon={<Users className="w-5 h-5" />}
        />
        <StatsCard
          title="Ценность покупателя"
          value={formatPrice(data?.userAnalytics?.lifetimeValue || 0)}
          percentage={data?.userAnalytics?.repeatPurchaseRate}
          caption="доля повторных покупок"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatsCard
          title="Вовлечённость"
          value={data?.userAnalytics?.engagementScore?.toFixed(2) || 0}
          percentage={data?.userAnalytics?.repeatPurchaseRate}
          caption="доля повторных покупок"
          icon={<BarChart2 className="w-5 h-5" />}
        />
        <StatsCard
          title="Всего действий"
          value={data?.interactionAnalytics?.totalInteractions || 0}
          percentage={0} // ! HARD CODED
          caption="все действия"
          icon={<BarChart2 className="w-5 h-5" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
        <AreaChart
          title="Динамика заказов"
          data={data?.revenueAnalytics?.monthlyTrends?.orders || []}
          categories={data?.revenueAnalytics?.monthlyTrends?.labels || []}
          color="#ec4899"
          percentageChange={data?.orderAnalytics?.changes?.orders}
        />
        <AreaChart
          title="Динамика выручки"
          data={data?.revenueAnalytics?.monthlyTrends?.revenue || []}
          categories={data?.revenueAnalytics?.monthlyTrends?.labels || []}
          color="#22c55e"
          percentageChange={data?.revenueAnalytics?.changes?.revenue}
        />
        <AreaChart
          title="Динамика продаж"
          data={data?.revenueAnalytics?.monthlyTrends?.sales || []}
          categories={data?.revenueAnalytics?.monthlyTrends?.labels || []}
          color="#3b82f6"
          percentageChange={data?.orderAnalytics?.changes?.sales}
        />
        <AreaChart
          title="Динамика пользователей"
          data={data?.revenueAnalytics?.monthlyTrends?.users || []}
          categories={data?.revenueAnalytics?.monthlyTrends?.labels || []}
          color="#f59e0b"
          percentageChange={data?.userAnalytics?.changes?.users}
        />
        <AreaChart
          title="Динамика просмотров"
          data={data?.userAnalytics?.interactionTrends?.views || []}
          categories={data?.userAnalytics?.interactionTrends?.labels || []}
          color="#8b5cf6"
          percentageChange={data?.interactionAnalytics?.changes?.views}
        />
        <DonutChart
          title="10 самых продаваемых товаров"
          data={mostSoldProducts.data}
          labels={mostSoldProducts.labels}
        />
        <DonutChart
          title="Действия по типам"
          data={interactionByType.data}
          labels={interactionByType.labels}
        />
        <RevenueOverTimeChart startDate="2023-01-01" endDate="2023-12-31" />
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2Gap-2">
        <ListCard
          title="Популярные товары"
          viewAllLink="/shop"
          items={topItems}
          itemType="product"
        />
        <ListCard
          title="Активные покупатели"
          viewAllLink="/dashboard/users"
          items={topUsers}
          itemType="user"
        />
        <ListCard
          title="Самые просматриваемые товары"
          viewAllLink="/shop"
          items={mostViewedProducts}
          itemType="product"
        />
        <BarChart
          title="Продажи по товарам"
          data={salesByProduct.data}
          categories={salesByProduct.categories}
          color="#4CAF50"
        />
      </div>
    </motion.div>
  );
};

export default withAuth(AnalyticsDashboard);
