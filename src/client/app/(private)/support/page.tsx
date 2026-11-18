"use client";
import { useState } from "react";
import {
  useCreateChatMutation,
  useGetUserChatsQuery,
} from "@/app/store/apis/ChatApi";
import ChatContainer from "../(chat)";
import MainLayout from "@/app/components/templates/MainLayout";
import { withAuth } from "@/app/components/HOC/WithAuth";
import DemoFeatureUnavailable from "@/app/components/feedback/DemoFeatureUnavailable";
import { isDemoMode } from "@/app/lib/demo";

const SupportPage = () => {
  if (isDemoMode()) {
    return <DemoFeatureUnavailable featureName="Чат поддержки" />;
  }
  return <LiveSupportPage />;
};

const LiveSupportPage = () => {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  console.log("activeChatId => ", activeChatId);
  const { data: chats, isLoading } = useGetUserChatsQuery(undefined);
  console.log("user chats => ", chats);

  const [createChat, { isLoading: isCreatingChat }] = useCreateChatMutation();

  const handleCreateChat = async () => {
    try {
      const result = await createChat(undefined).unwrap();
      console.log("create chat result => ", result);
      const newChatId = result.chat.id;
      setActiveChatId(newChatId);
    } catch (err) {
      console.error("Failed to create chat:", err);
    }
  };

  return (
    <MainLayout>
      {/* Sidebar with chat list */}
      <div className="flex items-start justify-between p-8">
        <div className="w-[30%] bg-white border-r border-gray-200 p-4 min-h-screen">
          <h2 className="font-semibold text-lg mb-4">Обращения в поддержку</h2>

          {isLoading ? (
            <div>Загружаем обращения…</div>
          ) : chats?.chats?.length === 0 ? (
            <div className="text-gray-500">Обращений пока нет</div>
          ) : (
            <ul className="space-y-2">
              {chats?.chats?.map((chat) => (
                <li
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`p-3 rounded cursor-pointer ${
                    activeChatId === chat.id
                      ? "bg-blue-100 text-blue-800"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="font-medium">
                    Обращение №{chat.id.substring(0, 8)}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        chat.status === "OPEN" ? "bg-green-500" : "bg-gray-400"
                      }`}
                    ></span>
                    {chat.status === "OPEN" ? "Активен" : "Закрыто"}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={handleCreateChat}
            disabled={isCreatingChat}
            className={`mt-4 w-full text-white p-2 rounded transition-colors ${
              isCreatingChat
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isCreatingChat ? "Creating..." : "Новое обращение"}
          </button>
        </div>

        {/* Main chat area */}
        <div className="flex-1">
          {activeChatId ? (
            <ChatContainer chatId={activeChatId} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Выберите обращение или создайте новое
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default withAuth(SupportPage);
