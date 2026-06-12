"use client";

import { use } from "react";
import ChatDetailView from "@/components/chats/ChatDetailView";

export default function ChatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ChatDetailView chatId={id} />;
}
