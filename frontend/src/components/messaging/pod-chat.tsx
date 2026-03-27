/**
 * @file pod-chat.tsx
 * Pod communication hub for learners — simulates real workplace team chat.
 * Channels: #general, #standup, #code-review, #help, plus DMs to pod members.
 * Supports emoji picker, reactions, and message threading.
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Hash, Smile, ThumbsUp, Heart, PartyPopper, Flame, Star } from "lucide-react";

interface Reaction {
  emoji: string;
  users: string[];
}

interface Message {
  id: string;
  sender: string;
  role: string;
  text: string;
  time: string;
  reactions: Reaction[];
}

interface Channel {
  id: string;
  name: string;
  type: "channel" | "dm";
  description?: string;
}

interface PodMember {
  id: string;
  name: string;
  role: string;
  online: boolean;
}

const QUICK_EMOJIS = ["👍", "❤️", "🎉", "🔥", "⭐", "😂", "🤔", "👀", "💯", "🚀", "✅", "👏"];

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  { label: "Reactions", emojis: ["👍", "👎", "❤️", "🎉", "🔥", "⭐", "😂", "🤔", "👀", "💯", "🚀", "✅", "👏", "💪", "🙌"] },
  { label: "Faces", emojis: ["😀", "😃", "😄", "😁", "😅", "🤣", "😊", "😇", "🙂", "😉", "😌", "😍", "🤩", "😎", "🤓"] },
  { label: "Work", emojis: ["💻", "📊", "📈", "🎯", "📝", "📋", "🔧", "⚙️", "🧪", "🔬", "📚", "🎓", "🏆", "🥇", "📌"] },
  { label: "Hands", emojis: ["👋", "🤝", "🙏", "✊", "🤞", "🤟", "👊", "✋", "🖐️", "👌", "🤏", "✌️", "🤘", "🫡", "🫶"] },
];

interface Props {
  podName: string;
  members: PodMember[];
  currentUser: string;
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const ROLE_COLORS: Record<string, string> = {
  "Product Manager": "bg-brand-600",
  "AI Engineer": "bg-accent-600",
  "Data Scientist": "bg-purple-600",
  "Cybersecurity Specialist": "bg-amber-600",
  "Industry Specialist": "bg-surface-700",
};

export function PodChat({ podName, members, currentUser }: Props) {
  const channels: Channel[] = [
    { id: "general", name: "general", type: "channel", description: "Team-wide announcements and discussions" },
    { id: "standup", name: "daily-standup", type: "channel", description: "Share what you're working on today" },
    { id: "code-review", name: "code-review", type: "channel", description: "Request and give code reviews" },
    { id: "help", name: "help", type: "channel", description: "Ask questions and get help from teammates" },
    ...members.filter((m) => m.name !== currentUser).map((m) => ({
      id: `dm-${m.id}`, name: m.name, type: "dm" as const,
    })),
  ];

  const [activeChannel, setActiveChannel] = useState("general");
  const [input, setInput] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({
    general: [
      { id: "g1", sender: "Amara Okafor", role: "Product Manager", text: "Hey team! 👋 Let's sync on the sprint deliverables. Who's available for a quick standup?", time: "9:00 AM", reactions: [{ emoji: "👍", users: ["Kwame Asante", "Fatima Bello"] }] },
      { id: "g2", sender: "Kwame Asante", role: "AI Engineer", text: "I'm in! Just finished the model training pipeline 🚀", time: "9:05 AM", reactions: [{ emoji: "🔥", users: ["Amara Okafor"] }, { emoji: "💯", users: ["Fatima Bello"] }] },
      { id: "g3", sender: "Fatima Bello", role: "Data Scientist", text: "Same here. The data preprocessing is done. Ready for integration testing 📊", time: "9:08 AM", reactions: [] },
      { id: "g4", sender: "Chidi Nwosu", role: "Cybersecurity Specialist", text: "I'll join too. Need to discuss the security review findings 🛡️", time: "9:12 AM", reactions: [] },
    ],
    standup: [
      { id: "s1", sender: "Amara Okafor", role: "Product Manager", text: "📋 **Today's standup:**\n\nYesterday: Finalized sprint backlog\nToday: Review prototype with assessor\nBlockers: None", time: "8:30 AM", reactions: [{ emoji: "✅", users: ["Kwame Asante"] }] },
      { id: "s2", sender: "Kwame Asante", role: "AI Engineer", text: "Yesterday: Completed model training\nToday: API integration + unit tests\nBlockers: Waiting on data schema from Fatima", time: "8:35 AM", reactions: [] },
    ],
    "code-review": [
      { id: "c1", sender: "Kwame Asante", role: "AI Engineer", text: "Can someone review my PR for the prediction endpoint? It's ready for merge 🔍", time: "10:00 AM", reactions: [{ emoji: "👀", users: ["Fatima Bello"] }] },
      { id: "c2", sender: "Fatima Bello", role: "Data Scientist", text: "Looking at it now. The data validation looks solid 👏", time: "10:20 AM", reactions: [{ emoji: "❤️", users: ["Kwame Asante"] }] },
    ],
    help: [
      { id: "h1", sender: "Zara Mwangi", role: "Industry Specialist", text: "Does anyone know how to format the governance checklist? 🤔", time: "11:00 AM", reactions: [] },
      { id: "h2", sender: "Amara Okafor", role: "Product Manager", text: "Check the template in the shared resources folder. I'll send you the link 📎", time: "11:05 AM", reactions: [{ emoji: "🙏", users: ["Zara Mwangi"] }] },
    ],
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const activeMessages = allMessages[activeChannel] || [];
  const activeChannelData = channels.find((c) => c.id === activeChannel);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false);
        setReactionPickerFor(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      sender: currentUser,
      role: members.find((m) => m.name === currentUser)?.role || "Learner",
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      reactions: [],
    };
    setAllMessages((prev) => ({ ...prev, [activeChannel]: [...(prev[activeChannel] || []), msg] }));
    setInput("");
  }

  function insertEmoji(emoji: string) {
    setInput((prev) => prev + emoji);
    setEmojiOpen(false);
  }

  function toggleReaction(messageId: string, emoji: string) {
    setAllMessages((prev) => {
      const channelMsgs = [...(prev[activeChannel] || [])];
      const msgIdx = channelMsgs.findIndex((m) => m.id === messageId);
      if (msgIdx === -1) return prev;
      const msg = { ...channelMsgs[msgIdx], reactions: [...channelMsgs[msgIdx].reactions] };
      const rxIdx = msg.reactions.findIndex((r) => r.emoji === emoji);
      if (rxIdx >= 0) {
        const rx = { ...msg.reactions[rxIdx], users: [...msg.reactions[rxIdx].users] };
        if (rx.users.includes(currentUser)) {
          rx.users = rx.users.filter((u) => u !== currentUser);
          if (rx.users.length === 0) msg.reactions.splice(rxIdx, 1);
          else msg.reactions[rxIdx] = rx;
        } else {
          rx.users.push(currentUser);
          msg.reactions[rxIdx] = rx;
        }
      } else {
        msg.reactions.push({ emoji, users: [currentUser] });
      }
      channelMsgs[msgIdx] = msg;
      return { ...prev, [activeChannel]: channelMsgs };
    });
    setReactionPickerFor(null);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-card border border-surface-200 bg-surface-0 shadow-card overflow-hidden">
      {/* Sidebar */}
      <div className="w-60 border-r border-surface-200 flex flex-col shrink-0 bg-surface-50">
        <div className="px-4 py-3 border-b border-surface-200">
          <p className="text-body-sm font-medium text-surface-900">{podName}</p>
          <p className="text-caption text-surface-400">{members.length} members</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-3 pt-3 pb-1">
            <p className="text-caption font-medium text-surface-400 uppercase tracking-wide">Channels</p>
          </div>
          {channels.filter((c) => c.type === "channel").map((ch) => (
            <button key={ch.id} onClick={() => setActiveChannel(ch.id)} className={`flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors ${activeChannel === ch.id ? "bg-brand-50 text-brand-700" : "text-surface-600 hover:bg-surface-100"}`}>
              <Hash className="w-3.5 h-3.5 text-surface-400 shrink-0" />
              <span className="text-body-sm truncate">{ch.name}</span>
            </button>
          ))}

          <div className="px-3 pt-4 pb-1">
            <p className="text-caption font-medium text-surface-400 uppercase tracking-wide">Team Members</p>
          </div>
          {members.map((m) => (
            <button key={m.id} onClick={() => setActiveChannel(`dm-${m.id}`)} className={`flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors ${activeChannel === `dm-${m.id}` ? "bg-brand-50 text-brand-700" : "text-surface-600 hover:bg-surface-100"}`}>
              <div className="relative shrink-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${ROLE_COLORS[m.role] || "bg-surface-500"}`}>
                  {getInitials(m.name)}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-50 ${m.online ? "bg-green-500" : "bg-surface-300"}`} />
              </div>
              <div className="min-w-0">
                <p className="text-body-sm truncate">{m.name}</p>
                <p className="text-[10px] text-surface-400 truncate">{m.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-surface-200 shrink-0">
          <div className="flex items-center gap-2">
            {activeChannelData?.type === "channel" ? <Hash className="w-4 h-4 text-surface-500" /> : null}
            <p className="text-body-sm font-medium text-surface-900">{activeChannelData?.name}</p>
          </div>
          {activeChannelData?.description && <p className="text-caption text-surface-400 mt-0.5">{activeChannelData.description}</p>}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {activeMessages.map((msg) => {
            const isMe = msg.sender === currentUser;
            return (
              <div key={msg.id} className="group">
                <div className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${ROLE_COLORS[msg.role] || "bg-surface-500"}`}>
                    {getInitials(msg.sender)}
                  </div>
                  <div className={`max-w-[75%] ${isMe ? "text-right" : ""}`}>
                    <div className={`flex items-baseline gap-2 mb-0.5 ${isMe ? "justify-end" : ""}`}>
                      {!isMe && <span className="text-caption font-medium text-surface-900">{msg.sender}</span>}
                      <span className="text-[10px] text-surface-400">{msg.role}</span>
                      <span className="text-[10px] text-surface-400">{msg.time}</span>
                    </div>
                    <div className={`inline-block rounded-2xl px-4 py-2 text-body-sm whitespace-pre-wrap ${isMe ? "bg-brand-600 text-white rounded-tr-sm" : "bg-surface-100 text-surface-800 rounded-tl-sm"}`}>
                      {msg.text}
                    </div>
                    {/* Reactions */}
                    {msg.reactions.length > 0 && (
                      <div className={`flex gap-1 mt-1 flex-wrap ${isMe ? "justify-end" : ""}`}>
                        {msg.reactions.map((rx) => (
                          <button key={rx.emoji} onClick={() => toggleReaction(msg.id, rx.emoji)} className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-caption transition-colors ${rx.users.includes(currentUser) ? "border-brand-300 bg-brand-50 text-brand-700" : "border-surface-200 bg-surface-0 text-surface-600 hover:bg-surface-50"}`}>
                            <span>{rx.emoji}</span>
                            <span className="text-[10px]">{rx.users.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Add reaction button */}
                  <div className="relative self-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setReactionPickerFor(reactionPickerFor === msg.id ? null : msg.id)} className="p-1 rounded text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors">
                      <Smile className="w-4 h-4" />
                    </button>
                    {reactionPickerFor === msg.id && (
                      <div ref={emojiRef} className="absolute bottom-full mb-1 left-0 bg-surface-0 border border-surface-200 rounded-lg shadow-lg p-2 flex gap-1 flex-wrap w-48 z-20">
                        {QUICK_EMOJIS.map((e) => (
                          <button key={e} onClick={() => toggleReaction(msg.id, e)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-100 text-lg transition-colors">{e}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {activeMessages.length === 0 && (
            <div className="text-center py-12 text-body-sm text-surface-400">
              No messages yet. Start the conversation!
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-surface-200 shrink-0">
          <form onSubmit={sendMessage} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
                placeholder={`Message ${activeChannelData?.type === "channel" ? "#" : ""}${activeChannelData?.name || ""}...`}
                rows={1}
                className="w-full rounded-lg border border-surface-200 bg-surface-50 pl-4 pr-10 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
              />
              {/* Emoji button */}
              <div className="absolute right-2 bottom-2" ref={emojiRef}>
                <button type="button" onClick={() => setEmojiOpen(!emojiOpen)} className="p-1 rounded text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors">
                  <Smile className="w-4 h-4" />
                </button>
                {emojiOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-72 bg-surface-0 border border-surface-200 rounded-lg shadow-lg z-20">
                    <div className="p-2 max-h-48 overflow-y-auto">
                      {EMOJI_CATEGORIES.map((cat) => (
                        <div key={cat.label} className="mb-2">
                          <p className="text-[10px] font-medium text-surface-400 uppercase tracking-wide mb-1 px-1">{cat.label}</p>
                          <div className="flex flex-wrap gap-0.5">
                            {cat.emojis.map((e) => (
                              <button key={e} type="button" onClick={() => insertEmoji(e)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-100 text-lg transition-colors">{e}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 transition-colors shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
