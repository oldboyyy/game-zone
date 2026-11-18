import AppError from "@/shared/errors/AppError";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import productPerformance from "./resolvers/productPerformance";
import yearRange from "./resolvers/yearRange";
import customerAnalytics from "./resolvers/userAnalytics";
import interactionAnalytics from "./resolvers/interactionAnalytics";
import { searchDashboardResolver } from "./resolvers/searchDashboard";
import orderAnalytics from "./resolvers/orderAnalytics";
import revenueAnalytics from "./resolvers/revenueAnalytics";
import userAnalytics from "./resolvers/userAnalytics";
import abandonedCartAnalytics from "./resolvers/abandonedCartAnalytics";

export interface Context {
  prisma: PrismaClient;
  req: Request;
  res: Response;
}

export const analyticsResolvers = {
  Query: {
    ...orderAnalytics.Query,
    ...revenueAnalytics.Query,
    ...userAnalytics.Query,
    ...yearRange.Query,
    ...customerAnalytics.Query,
    ...interactionAnalytics.Query,
    ...productPerformance.Query,
    ...searchDashboardResolver.Query,
    ...abandonedCartAnalytics.Query,
  },
};
// Apply the same staff boundary to every analytics field, including aliased queries.
for (const [name, resolver] of Object.entries(analyticsResolvers.Query)) {
  (analyticsResolvers.Query as Record<string, Function>)[name] = (...args: any[]) => {
    const context = args[2] as Context;
    const role = context.req.user?.role;
    if (!role || !["ADMIN", "SUPERADMIN"].includes(role)) {
      throw new AppError(403, "Недостаточно прав для просмотра аналитики");
    }
    return (resolver as Function)(...args);
  };
}
