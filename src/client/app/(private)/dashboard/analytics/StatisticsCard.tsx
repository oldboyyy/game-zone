"use client";
import StatsCard from "@/app/components/organisms/StatsCard";
import useFormatPrice from "@/app/hooks/ui/useFormatPrice";
import {
  BarChart2,
  CreditCard,
  DollarSign,
  ShoppingCart,
  Users,
} from "lucide-react";
import React from "react";

const StatisticsCard = ({ data }) => {
  const formatPrice = useFormatPrice();
  return (
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
  );
};

export default StatisticsCard;
