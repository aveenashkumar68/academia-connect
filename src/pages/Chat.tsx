import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";

interface ChatMessage {
  id: string;
  message: string;
  sender_id: string;
  receiver_id: string;
  created_at: string | null;
}

interface UserProfile {
  id: string;
  full_name: string | null;
}

export default function Chat() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load users
  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name")
      .neq("id", user?.id ?? "")
      .then(({ data }) => setUsers(data ?? []));
  }, [user]);

  // Load messages when selecting a user
  useEffect(() => {
    if (!selectedUser || !user) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });
      setMessages(data ?? []);
    };
    loadMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${selectedUser.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as ChatMessage;
          if (
            (msg.sender_id === user.id && msg.receiver_id === selectedUser.id) ||
            (msg.sender_id === selectedUser.id && msg.receiver_id === user.id)
          ) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedUser, user]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !user) return;
    await supabase.from("chat_messages").insert({
      message: newMessage.trim(),
      sender_id: user.id,
      receiver_id: selectedUser.id,
    });
    setNewMessage("");
  };

  return (
    <DashboardLayout title="Chat" description="Real-time messaging">
      <div className="flex h-[calc(100vh-10rem)] gap-4 rounded-xl border border-border/50 bg-card overflow-hidden">
        {/* User list */}
        <div className="w-64 shrink-0 border-r border-border/50">
          <div className="p-3 border-b border-border/50">
            <p className="font-display text-sm font-semibold text-foreground">Contacts</p>
          </div>
          <ScrollArea className="h-[calc(100%-3rem)]">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/50 ${
                  selectedUser?.id === u.id ? "bg-accent" : ""
                }`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {u.full_name?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm font-medium text-foreground">
                  {u.full_name ?? "Unknown"}
                </span>
              </button>
            ))}
            {users.length === 0 && (
              <p className="p-4 text-center text-xs text-muted-foreground">No contacts yet</p>
            )}
          </ScrollArea>
        </div>

        {/* Chat area */}
        <div className="flex flex-1 flex-col">
          {selectedUser ? (
            <>
              <div className="border-b border-border/50 px-4 py-3">
                <p className="font-medium text-foreground">{selectedUser.full_name}</p>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                            isMine
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-secondary text-secondary-foreground rounded-bl-md"
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>
              <form onSubmit={sendMessage} className="flex gap-2 border-t border-border/50 p-3">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-muted-foreground">Select a contact to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
