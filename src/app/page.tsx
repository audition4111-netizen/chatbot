import { ChatPanel } from "@/components/chat/chat-panel";
import { PromoBanner } from "@/components/chat/promo-banner";

export default function Page() {
  return (
    <main className="flex min-h-dvh flex-col">
      <PromoBanner />
      <ChatPanel />
    </main>
  );
}
