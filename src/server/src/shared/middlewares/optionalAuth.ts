import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import AppError from "../errors/AppError";
import prisma from "@/infra/database/database.config";
import { User } from "../types/userTypes";

const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {

  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    return next();
  }

  try {
    const secret = process.env.ACCESS_TOKEN_SECRET!;
    if (!secret) {
      throw new Error("Access token secret is not defined");
    }

    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET!
    ) as User;

    const user = await prisma.user.findUnique({
      where: { id: String(decoded.id) },
      select: { id: true, role: true },
    });

    if (user) {
      req.user = user;
    } else {
      return next(new AppError(401, "User no longer exists"));
    }
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError(401, "Invalid access token, please log in"));
    }
    return next(error);
  }
  next();
};

export default optionalAuth;
