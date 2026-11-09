import { startNewChat } from "@/features/home/action/start-new-chat";
import { redirect } from "next/navigation";

export default async function Home() {
  const conversationId = await startNewChat();

  redirect(`/c/${conversationId}`);
}
