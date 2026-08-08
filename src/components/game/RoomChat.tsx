import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { fetchMessages, sendMessage, type RoomMessage } from "@/services/roomService";
import { cn } from "@/lib/utils";

const EMOJIS = ["👏", "🔥", "😂", "😮", "💡", "🎯", "🥳", "😭"];

export function RoomChat({
  roomId,
  userId,
  displayName,
  className,
}: {
  roomId: string;
  userId: string | null;
  displayName: string;
  className?: string;
}) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetchMessages(roomId).then(setMessages);
    const channel = supabase
      .channel(`room-messages-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as unknown as RoomMessage]),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const post = async (kind: "chat" | "emoji", body: string) => {
    if (!userId || !body.trim()) return;
    await sendMessage({ roomId, userId, displayName, kind, body: body.trim() });
  };

  return (
    <section className={cn("flex min-h-0 flex-col rounded-2xl border border-border bg-card/85 p-3", className)}>
      <h3 className="font-display text-[0.68rem] font-black uppercase tracking-[0.2em] text-foreground">
        Table talk
      </h3>
      <div ref={listRef} className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1 text-[0.72rem]">
        {messages.length === 0 && <p className="text-muted-foreground">No messages yet.</p>}
        {messages.map((m) => (
          <p key={m.id} className={cn("break-words", m.kind === "emoji" && "text-xl leading-tight")}>
            <span className="mr-1 font-black text-gold">{m.display_name}</span>
            <span className="text-foreground">{m.body}</span>
          </p>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            disabled={!userId}
            onClick={() => void post("emoji", e)}
            className="rounded-md border border-border px-1.5 py-0.5 text-sm hover:border-gold disabled:opacity-40"
          >
            {e}
          </button>
        ))}
      </div>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void post("chat", draft);
          setDraft("");
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={userId ? "Say something…" : "Sign in to chat"}
          disabled={!userId}
          aria-label="Chat message"
        />
        <Button type="submit" size="sm" disabled={!userId}>
          Send
        </Button>
      </form>
    </section>
  );
}
