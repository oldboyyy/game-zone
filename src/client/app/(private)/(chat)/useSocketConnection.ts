import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_BASE_URL } from "@/app/lib/constants/config";
import { isDemoMode } from "@/app/lib/demo";

export const useSocketConnection = (chatId: string) => {
  console.log("chatId to connect => ", chatId);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (isDemoMode()) return;
    // Get server URL based on environment
    const connection = io(SOCKET_BASE_URL, { withCredentials: true });

    setSocket(connection);

    // Join specific chat room
    connection.on("connect", () => {
      connection.emit("joinChat", chatId);
    });

    // Clean up on component unmount
    return () => {
      connection.disconnect();
    };
  }, [chatId]);

  return socket;
};
