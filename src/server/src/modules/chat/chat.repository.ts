import prisma from "@/infra/database/database.config";
import { Chat, ChatMessage } from "@prisma/client";

const publicUser = { select: { id: true, name: true, avatar: true, role: true } };

export class ChatRepository {
  constructor() {}

  async createChat(userId: string): Promise<Chat> {
    return prisma.chat.create({
      data: {
        userId,
        status: "OPEN",
      },
      include: { user: publicUser, messages: { include: { sender: publicUser } } },
    });
  }

  async finduserChats(userId: string): Promise<Chat[]> {
    return prisma.chat.findMany({
      where: { userId },
      include: { user: publicUser, messages: { include: { sender: publicUser } } },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findChatById(id: string): Promise<Chat | null> {
    return prisma.chat.findUnique({
      where: { id },
      include: { user: publicUser, messages: { include: { sender: publicUser } } },
    });
  }

  async findChatsByUser(userId: string): Promise<Chat[]> {
    return prisma.chat.findMany({
      where: { userId },
      include: { user: publicUser, messages: { include: { sender: publicUser } } },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findAllChats(status?: "OPEN" | "RESOLVED"): Promise<Chat[]> {
    return prisma.chat.findMany({
      where: status ? { status } : {},
      include: { messages: { include: { sender: publicUser } } },
    });
  }

  async createMessage(
    chatId: string,
    senderId: string,
    content: string | null,
    type: "TEXT" | "IMAGE" | "VOICE" = "TEXT",
    url?: string
  ): Promise<ChatMessage> {
    return prisma.chatMessage.create({
      data: {
        chatId,
        senderId,
        content,
        type,
        url,
        createdAt: new Date(),
      },
      include: { sender: publicUser },
    });
  }

  async updateChatStatus(
    chatId: string,
    status: "OPEN" | "RESOLVED"
  ): Promise<Chat> {
    return prisma.chat.update({
      where: { id: chatId },
      data: { status },
      include: { user: publicUser, messages: { include: { sender: publicUser } } },
    });
  }
}
