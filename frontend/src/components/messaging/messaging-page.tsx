/**
 * @file messaging-page.tsx
 * Shared internal messaging component for staff communication.
 * Channels between Super Admin, Instructors, and Admins.
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Hash, Users, Search } from "lucide-react";

interface Message {
  id: string;
  sender: string;
  role: string;
  text: string;
  time: string;
}

interface Channel {
  id: string;
  name: string;
  type: "group" | "direct";
  unread: number;
  lastMessage: string;
  members?: string[];
}

const ROLE_COLORS: Record<string, string> = {
  "Super Admin": "bg-surface-800",
  Instructor: "bg-accent-600",
  Admin: "bg-purple-600",
  Assessor: "bg-amber-600",
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

interface Props {
  currentUser: string;
  currentRole: string;
}

const MOCK_CHANNELS: Channel[] = [
  { id: "ch-general", name: "General", type: "group", unread: 2, lastMessage: "Meeting at 3pm tomorrow", members: ["All Staff"] },
  { id: "ch-curriculum", name: "Curriculum Updates", type: "group", unread: 0, lastMessage: "Module 3 approved", members: ["Instructors", "Admins"] },
  { id: "ch-assessments", name: "Assessment Review", type: "group", unread: 1, lastMessage: "New capstone submissions", members: ["Instructors", "Assessors"] },
  { id: "ch-platform", name: "Platform Issues", type: "group", unread: 0, lastMessage: "Deployment complete", members: ["Admins", "Super Admin"] },
  { id: "dm-amina", name: "Dr. Amina Osei", type: "direct", unread: 1, lastMessage: "Can you review the grading rubric?" },
  { id: "dm-nana", name: "Nana Adjei", type: "direct", unread: 0, lastMessage: "Enrollment report sent" },
  { id: "dm-esi", name: "Esi Owusu", type: "direct", unread: 0, lastMessage: "Revenue dashboard updated" },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  "ch-general": [
    { id: "m1", sender: "Esi Owusu", role: "Super Admin", text: "Team, we have a platform review meeting tomorrow at 3pm. Please prepare your updates.", time: "Yesterday, 4:30 PM" },
    { id: "m2", sender: "Dr. Amina Osei", role: "Instructor", text: "I'll have the Module 3 completion stats ready.", time: "Yesterday, 4:45 PM" },
    { id: "m3", sender: "Nana Adjei", role: "Admin", text: "Enrollment numbers for this week are looking strong. I'll share the report.", time: "Yesterday, 5:10 PM" },
    { id: "m4", sender: "Esi Owusu", role: "Super Admin", text: "Great. Also, let's discuss the new track launch timeline.", time: "Today, 9:00 AM" },
  ],
  "ch-curriculum": [
    { id: "m5", sender: "Dr. Amina Osei", role: "Instructor", text: "Module 3 for AI Engineering has been updated with the new assessment questions.", time: "Today, 10:15 AM" },
    { id: "m6", sender: "Nana Adjei", role: "Admin", text: "Reviewed and approved. Publishing now.", time: "Today, 10:30 AM" },
  ],
  "ch-assessments": [
    { id: "m7", sender: "Dr. Amina Osei", role: "Instructor", text: "We have 5 new capstone submissions pending review from Pod Zambezi.", time: "Today, 11:00 AM" },
    { id: "m8", sender: "Esi Owusu", role: "Super Admin", text: "Please prioritize these — the certification deadline is next week.", time: "Today, 11:15 AM" },
  ],
  "ch-platform": [
    { id: "m9", sender: "Nana Adjei", role: "Admin", text: "The latest deployment is complete. All services are healthy.", time: "Today, 8:00 AM" },
  ],
  "dm-amina": [
    { id: "m10", sender: "Dr. Amina Osei", role: "Instructor", text: "Can you review the grading rubric I updated for the Data Science track?", time: "Today, 9:30 AM" },
  ],
  "dm-nana": [
    { id: "m11", sender: "Nana Adjei", role: "Admin", text: "Here's the enrollment report for this quarter. Let me know if you need changes.", time: "Yesterday, 3:00 PM" },
  ],
  "dm-esi": [
    { id: "m12", sender: "Esi Owusu", role: "Super Admin", text: "Revenue dashboard has been updated with the latest payment data.", time: "Today, 8:30 AM" },
  ],
};

export function MessagingPage({ currentUser, currentRole }: Props) {
  const [channels] = useState(MOCK_CHANNELS);
  const [activeChannel, setActiveChannel] = useState(MOCK_CHANNELS[0].id);
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChannelData = channels.find((c) => c.id === activeChannel);
  const activeMessages = messages[activeChannel] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const newMsg: Message = {
      id: `m-${Date.now()}`,
      sender: currentUser,
      role: currentRole,
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), newMsg],
    }));
    setInput("");
  }

  const filteredChannels = search
    ? channels.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : channels;

  const groupChannels = filteredChannels.filter((c) => c.type === "group");
  const directChannels = filteredChannels.filter((c) => c.type === "direct");

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-card border border-surface-200 bg-surface-0 shadow-card overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-surface-200 flex flex-col shrink-0">
        <div className="p-3 border-b border-surface-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search channels..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-surface-200 bg-surface-50 text-body-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {groupChannels.length > 0 && (
            <div className="px-3 pt-3 pb-1">
              <p className="text-caption font-medium text-surface-400 uppercase tracking-wide">Channels</p>
            </div>
          )}
          {groupChannels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className={`flex items-center gap-2 w-full px-3 py-2 text-left transition-colors ${activeChannel === ch.id ? "bg-brand-50 text-brand-700" : "text-surface-700 hover:bg-surface-50"}`}
            >
              <Hash className="w-4 h-4 text-surface-400 shrink-0" />
              <span className="text-body-sm truncate flex-1">{ch.name}</span>
              {ch.unread > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{ch.unread}</span>
              )}
            </button>
          ))}

          {directChannels.length > 0 && (
            <div className="px-3 pt-4 pb-1">
              <p className="text-caption font-medium text-surface-400 uppercase tracking-wide">Direct Messages</p>
            </div>
          )}
          {directChannels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className={`flex items-center gap-2 w-full px-3 py-2 text-left transition-colors ${activeChannel === ch.id ? "bg-brand-50 text-brand-700" : "text-surface-700 hover:bg-surface-50"}`}
            >
              <div className="w-6 h-6 rounded-full bg-surface-300 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                {getInitials(ch.name)}
              </div>
              <span className="text-body-sm truncate flex-1">{ch.name}</span>
              {ch.unread > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{ch.unread}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-200 shrink-0">
          {activeChannelData?.type === "group" ? (
            <Hash className="w-5 h-5 text-surface-500" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface-300 flex items-center justify-center text-xs font-bold text-white">
              {getInitials(activeChannelData?.name || "")}
            </div>
          )}
          <div>
            <p className="text-body-sm font-medium text-surface-900">{activeChannelData?.name}</p>
            {activeChannelData?.members && (
              <p className="text-caption text-surface-400 flex items-center gap-1">
                <Users className="w-3 h-3" /> {activeChannelData.members.join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {activeMessages.map((msg) => {
            const isMe = msg.sender === currentUser;
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${ROLE_COLORS[msg.role] || "bg-surface-500"}`}>
                  {getInitials(msg.sender)}
                </div>
                <div className={`max-w-[70%] ${isMe ? "text-right" : ""}`}>
                  <div className="flex items-baseline gap-2 mb-0.5">
                    {!isMe && <span className="text-caption font-medium text-surface-900">{msg.sender}</span>}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      msg.role === "Super Admin" ? "bg-surface-100 text-surface-600" :
                      msg.role === "Instructor" ? "bg-accent-50 text-accent-700" :
                      "bg-purple-50 text-purple-700"
                    }`}>{msg.role}</span>
                    <span className="text-caption text-surface-400">{msg.time}</span>
                  </div>
                  <div className={`inline-block rounded-xl px-4 py-2 text-body-sm ${
                    isMe ? "bg-brand-600 text-white rounded-tr-sm" : "bg-surface-100 text-surface-800 rounded-tl-sm"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="px-4 py-3 border-t border-surface-200 flex gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${activeChannelData?.type === "group" ? "#" : ""}${activeChannelData?.name || ""}...`}
            className="flex-1 rounded-lg border border-surface-200 bg-surface-50 px-4 py-2 text-body-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors">
            <Send className="w-4 h-4" /> Send
          </button>
        </form>
      </div>
    </div>
  );
}
