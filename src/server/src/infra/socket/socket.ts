import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import prisma from "@/infra/database/database.config";
import { getAllowedOrigins } from "../../config/cors";

export class SocketManager {
  private io: SocketIOServer;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: getAllowedOrigins(),
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.io.use(async (socket, next) => {
      try {
        const tokenCookie = socket.handshake.headers.cookie
          ?.split(";")
          .map((cookie) => cookie.trim())
          .find((cookie) => cookie.startsWith("accessToken="));
        if (!tokenCookie) return next(new Error("Unauthorized"));
        const token = decodeURIComponent(tokenCookie.slice("accessToken=".length));
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
        if (typeof decoded === "string" || typeof decoded.id !== "string") {
          return next(new Error("Unauthorized"));
        }
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, role: true },
        });
        if (!user) return next(new Error("Unauthorized"));
        socket.data.user = user;
        socket.data.expiresAt = decoded.exp ? decoded.exp * 1000 : 0;
        next();
      } catch {
        next(new Error("Unauthorized"));
      }
    });

    this.io.on("connection", (socket: Socket) => {
      const isActive = () =>
        !socket.data.expiresAt || Date.now() < socket.data.expiresAt;
      const isAdmin = () =>
        ["ADMIN", "SUPERADMIN"].includes(socket.data.user.role);
      const isInChat = (chatId: unknown): chatId is string =>
        isActive() && typeof chatId === "string" && socket.rooms.has(`chat:${chatId}`);
      const canSignal = (chatId: unknown, to: unknown): to is string =>
        isInChat(chatId) && typeof to === "string" &&
        !!this.io.sockets.sockets.get(to)?.rooms.has(`chat:${chatId}`);

      socket.on("joinChat", async (chatId: unknown) => {
        if (!isActive() || typeof chatId !== "string" || !chatId) return;
        try {
          const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            select: { userId: true },
          });
          if (chat && (chat.userId === socket.data.user.id || isAdmin())) {
            await socket.join(`chat:${chatId}`);
          }
        } catch {
          socket.emit("chatError", { message: "Unable to join chat" });
        }
      });

      socket.on("joinAdmin", () => {
        if (isActive() && isAdmin()) socket.join("admin");
      });
      socket.on("callOffer", (payload) => {
        const { chatId, offer } = payload ?? {};
        if (isInChat(chatId)) {
          socket.to(`chat:${chatId}`).emit("callOffer", { offer, from: socket.id });
        }
      });
      socket.on("callAnswer", (payload) => {
        const { chatId, answer, to } = payload ?? {};
        if (canSignal(chatId, to)) socket.to(to).emit("callAnswer", { answer });
      });
      socket.on("iceCandidate", (payload) => {
        const { chatId, candidate, to } = payload ?? {};
        if (canSignal(chatId, to)) socket.to(to).emit("iceCandidate", { candidate });
      });
      socket.on("endCall", (payload) => {
        const { chatId } = payload ?? {};
        if (isInChat(chatId)) socket.to(`chat:${chatId}`).emit("callEnded");
      });

      if (socket.data.expiresAt) {
        const expiryTimer = setTimeout(
          () => socket.disconnect(true),
          Math.max(0, socket.data.expiresAt - Date.now())
        );
        socket.on("disconnect", () => clearTimeout(expiryTimer));
      }
    });
  }

  getIO(): SocketIOServer {
    return this.io;
  }
}
