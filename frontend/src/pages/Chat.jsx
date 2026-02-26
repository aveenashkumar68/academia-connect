import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import api from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { toast } from "sonner";
import {
  MessageSquare, Search, Send, Users, ArrowLeft, Circle
} from "lucide-react";

export default function Chat() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showContacts, setShowContacts] = useState(true); // mobile toggle
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeout = useRef(null);
  const selectedUserRef = useRef(null);

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    try {
      const { data } = await api.get("/chat/users");
      setContacts(data);
    } catch {
      toast.error("Failed to load contacts");
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  // Connect socket + fetch contacts on mount
  useEffect(() => {
    if (!user?._id) return;
    fetchContacts();

    const socket = connectSocket(user._id);
    socketRef.current = socket;

    socket.on("online_users", (users) => setOnlineUsers(users));

    socket.on("new_message", (msg) => {
      setMessages((prev) => {
        // avoid duplicates
        if (prev.find((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Refresh contact list for last message preview
      fetchContacts();
    });

    socket.on("user_typing", ({ senderId }) => {
      if (selectedUserRef.current?._id === senderId) setTyping(true);
    });
    socket.on("user_stop_typing", () => setTyping(false));

    return () => {
      socket.off("online_users");
      socket.off("new_message");
      socket.off("user_typing");
      socket.off("user_stop_typing");
      disconnectSocket();
    };
  }, [user, fetchContacts]);

  // Keep ref in sync with state
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Load messages when selecting a user
  useEffect(() => {
    if (!selectedUser) return;
    setLoadingMessages(true);
    (async () => {
      try {
        const { data } = await api.get(`/chat/messages/${selectedUser._id}`);
        setMessages(data);
      } catch {
        toast.error("Failed to load messages");
      } finally {
        setLoadingMessages(false);
      }
    })();
    // Refresh contacts to clear unread count
    fetchContacts();
  }, [selectedUser, fetchContacts]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const { data } = await api.post("/chat/messages", {
        receiverId: selectedUser._id,
        content: newMessage.trim(),
      });
      setMessages((prev) => [...prev, data]);
      // Emit via socket for real-time delivery
      socketRef.current?.emit("send_message", data);
      setNewMessage("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      fetchContacts();
    } catch {
      toast.error("Failed to send message");
    }
  };

  // Typing indicator
  const handleTyping = () => {
    if (!selectedUser) return;
    socketRef.current?.emit("typing", { senderId: user._id, receiverId: selectedUser._id });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit("stop_typing", { senderId: user._id, receiverId: selectedUser._id });
    }, 1500);
  };

  // Textarea auto-resize + Enter to send
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e) => {
    setNewMessage(e.target.value);
    handleTyping();
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  };

  const isOnline = (userId) => onlineUsers.includes(userId);
  const roleLabel = (r) =>
    r === "super-admin" ? "Super Admin" : r === "admin" ? "Faculty" : r === "student" ? "Student" : r?.replace("_", " ") || "";
  const initials = (name, email) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : email?.charAt(0).toUpperCase() || "U";
  const fmtTime = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const filteredContacts = contacts.filter((c) =>
    (c.name || c.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectContact = (contact) => {
    setSelectedUser(contact);
    setShowContacts(false); // switch to chat on mobile
  };

  return (
    <DashboardLayout title="Chat">
      <div className="flex h-[calc(100vh-7rem)] sm:h-[calc(100vh-8rem)] rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">

        {/* Contact List Sidebar */}
        <div className={`${showContacts ? "flex" : "hidden"} md:flex flex-col w-full md:w-80 lg:w-[340px] shrink-0 border-r border-border/50 bg-card`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-base text-primary">Campus Connect</h2>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto">
            {loadingContacts ? (
              <p className="text-center py-10 text-sm text-muted-foreground">Loading contacts...</p>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No contacts found</p>
              </div>
            ) : (
              filteredContacts.map((c) => (
                <button
                  key={c._id}
                  onClick={() => selectContact(c)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 border-l-[3px] ${selectedUser?._id === c._id
                    ? "bg-muted/50 border-primary"
                    : "border-transparent"
                    }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {c.profilePicture ? (
                      <img src={c.profilePicture} alt="" className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {initials(c.name, c.email)}
                      </div>
                    )}
                    {/* Online dot */}
                    <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${isOnline(c._id) ? "bg-green-500" : "bg-muted-foreground/40"
                      }`} />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                      {c.lastMessage && (
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                          {fmtTime(c.lastMessage.time)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-muted-foreground truncate">
                        {c.lastMessage
                          ? `${c.lastMessage.isMine ? "You: " : ""}${c.lastMessage.content}`
                          : roleLabel(c.role)}
                      </p>
                      {c.unreadCount > 0 && (
                        <span className="ml-2 shrink-0 h-5 min-w-[20px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1.5">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${!showContacts ? "flex" : "hidden"} md:flex flex-col flex-1 min-w-0`}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3">
                {/* Back button (mobile) */}
                <button
                  onClick={() => setShowContacts(true)}
                  className="md:hidden p-1 -ml-1 text-muted-foreground hover:text-foreground transition"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                {/* Avatar */}
                <div className="relative shrink-0">
                  {selectedUser.profilePicture ? (
                    <img src={selectedUser.profilePicture} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                      {initials(selectedUser.name, selectedUser.email)}
                    </div>
                  )}
                  <div className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card ${isOnline(selectedUser._id) ? "bg-green-500" : "bg-muted-foreground/40"
                    }`} />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{selectedUser.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedUser.department ? `${selectedUser.department} • ` : ""}
                    {typing ? (
                      <span className="text-green-500 font-medium">typing...</span>
                    ) : isOnline(selectedUser._id) ? (
                      <span className="text-green-500">Online</span>
                    ) : (
                      "Offline"
                    )}
                  </p>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-muted/20 space-y-3">
                {loadingMessages ? (
                  <p className="text-center text-sm text-muted-foreground py-10">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => {
                      const isMine = msg.sender === user?._id || msg.sender?._id === user?._id;
                      // Date separator
                      const msgDate = new Date(msg.createdAt).toLocaleDateString();
                      const prevDate = i > 0 ? new Date(messages[i - 1].createdAt).toLocaleDateString() : null;
                      const showDate = msgDate !== prevDate;

                      return (
                        <div key={msg._id || i}>
                          {showDate && (
                            <div className="text-center my-4">
                              <span className="bg-muted px-3 py-1 rounded-full text-[11px] text-muted-foreground">
                                {msgDate === new Date().toLocaleDateString() ? "Today" : msgDate}
                              </span>
                            </div>
                          )}
                          <div className={`flex gap-2.5 max-w-[75%] ${isMine ? "ml-auto flex-row-reverse" : ""}`}>
                            <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${isMine ? "bg-primary" : "bg-green-600"
                              }`}>
                              {isMine
                                ? initials(user?.name, user?.email)
                                : initials(selectedUser.name, selectedUser.email)}
                            </div>
                            <div>
                              <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMine
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-card border border-border/50 text-foreground rounded-bl-md shadow-sm"
                                }`}>
                                {msg.content}
                              </div>
                              <p className={`text-[10px] mt-1 ${isMine ? "text-right" : "text-left"
                                } text-muted-foreground`}>
                                {fmtTime(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={scrollRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="p-3 sm:p-4 border-t border-border/50 bg-card">
                <div className="flex items-end gap-2 sm:gap-3">
                  <div className="flex-1 border border-border rounded-2xl px-4 py-2 flex items-end gap-2 bg-muted/20 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition">
                    <textarea
                      ref={textareaRef}
                      value={newMessage}
                      onChange={handleTextareaInput}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message..."
                      rows={1}
                      className="flex-1 bg-transparent border-none outline-none resize-none text-sm py-1 max-h-[100px] placeholder:text-muted-foreground"
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                    className="shrink-0 h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Empty state — no user selected */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-10 w-10 text-primary/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Campus Connect</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Select a contact to start messaging. Your conversations are private and secure.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}