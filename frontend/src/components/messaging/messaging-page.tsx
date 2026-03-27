"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Hash, Users, Search, Plus, X, UserPlus, ChevronRight } from "lucide-react";

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
  participants?: Participant[];
}

interface Participant {
  name: string;
  role: string;
  online?: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  "Super Admin": "bg-surface-800",
  Instructor: "bg-accent-600",
  Admin: "bg-purple-600",
  Assessor: "bg-amber-600",
  Learner: "bg-brand-600",
  Corporate: "bg-amber-600",
};

const ROLE_BADGE_STYLES: Record<string, string> = {
  "Super Admin": "bg-surface-100 text-surface-600",
  Instructor: "bg-accent-50 text-accent-700",
  Admin: "bg-purple-50 text-purple-700",
  Assessor: "bg-amber-50 text-amber-700",
  Learner: "bg-brand-50 text-brand-700",
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

interface Props {
  currentUser: string;
  currentRole: string;
}

/** Directory of all platform users available for messaging, filtered by role access */
const ALL_CONTACTS: Participant[] = [
  { name: "Esi Owusu", role: "Super Admin", online: true },
  { name: "Dr. Amina Osei", role: "Instructor", online: true },
  { name: "Prof. Kweku Mensah", role: "Instructor", online: false },
  { name: "Nana Adjei", role: "Admin", online: true },
  { name: "Akua Boateng", role: "Admin", online: false },
  { name: "Kofi Mensah", role: "Learner", online: true },
  { name: "Ama Darko", role: "Learner", online: true },
  { name: "Yaw Asante", role: "Learner", online: false },
  { name: "Efua Owusu", role: "Learner", online: true },
  { name: "Kwame Asante", role: "Corporate", online: false },
];

/** Role-based access: who can each role message? */
function getAccessibleContacts(currentRole: string, currentUser: string): Participant[] {
  return ALL_CONTACTS.filter((c) => {
    if (c.name === currentUser) return false;
    switch (currentRole) {
      case "Super Admin": return true; // can message everyone
      case "Admin": return true; // can message everyone
      case "Instructor":
        return ["Super Admin", "Admin", "Instructor", "Assessor", "Learner"].includes(c.role);
      case "Learner":
        return ["Instructor", "Admin"].includes(c.role);
      case "Corporate":
        return ["Admin", "Super Admin"].includes(c.role);
      default: return false;
    }
  });
}

const MOCK_CHANNELS: Channel[] = [
  {
    id: "ch-general", name: "General", type: "group", unread: 2, lastMessage: "Meeting at 3pm tomorrow",
    members: ["All Staff"],
    participants: [
      { name: "Esi Owusu", role: "Super Admin", online: true },
      { name: "Dr. Amina Osei", role: "Instructor", online: true },
      { name: "Nana Adjei", role: "Admin", online: true },
    ],
  },
  {
    id: "ch-curriculum", name: "Curriculum Updates", type: "group", unread: 0, lastMessage: "Module 3 approved",
    members: ["Instructors", "Admins"],
    participants: [
      { name: "Dr. Amina Osei", role: "Instructor", online: true },
      { name: "Prof. Kweku Mensah", role: "Instructor", online: false },
      { name: "Nana Adjei", role: "Admin", online: true },
    ],
  },
  {
    id: "ch-assessments", name: "Assessment Review", type: "group", unread: 1, lastMessage: "New capstone submissions",
    members: ["Instructors", "Assessors"],
    participants: [
      { name: "Dr. Amina Osei", role: "Instructor", online: true },
      { name: "Esi Owusu", role: "Super Admin", online: true },
    ],
  },
  {
    id: "ch-learner-support", name: "Learner Support", type: "group", unread: 0, lastMessage: "Kofi needs help with Module 2",
    members: ["Instructors", "Learners"],
    participants: [
      { name: "Dr. Amina Osei", role: "Instructor", online: true },
      { name: "Kofi Mensah", role: "Learner", online: true },
      { name: "Ama Darko", role: "Learner", online: true },
    ],
  },
  { id: "dm-amina", name: "Dr. Amina Osei", type: "direct", unread: 1, lastMessage: "Can you review the grading rubric?" },
  { id: "dm-nana", name: "Nana Adjei", type: "direct", unread: 0, lastMessage: "Enrollment report sent" },
  { id: "dm-esi", name: "Esi Owusu", type: "direct", unread: 0, lastMessage: "Revenue dashboard updated" },
  { id: "dm-kofi", name: "Kofi Mensah", type: "direct", unread: 0, lastMessage: "Question about Module 2 lab" },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  "ch-general": [
    { id: "m1", sender: "Esi Owusu", role: "Super Admin", text: "Team, we have a platform review meeting tomorrow at 3pm. Please prepare your updates.", time: "Yesterday, 4:30 PM" },
    { id: "m2", sender: "Dr. Amina Osei", role: "Instructor", text: "I'll have the Module 3 completion stats ready.", time: "Yesterday, 4:45 PM" },
    { id: "m3", sender: "Nana Adjei", role: "Admin", text: "Enrollment numbers for this week are looking strong. I'll share the report.", time: "Yesterday, 5:10 PM" },
  ],
  "ch-curriculum": [
    { id: "m5", sender: "Dr. Amina Osei", role: "Instructor", text: "Module 3 for AI Engineering has been updated with the new assessment questions.", time: "Today, 10:15 AM" },
    { id: "m6", sender: "Nana Adjei", role: "Admin", text: "Reviewed and approved. Publishing now.", time: "Today, 10:30 AM" },
  ],
  "ch-assessments": [
    { id: "m7", sender: "Dr. Amina Osei", role: "Instructor", text: "We have 5 new capstone submissions pending review from Pod Zambezi.", time: "Today, 11:00 AM" },
  ],
  "ch-learner-support": [
    { id: "m13", sender: "Kofi Mensah", role: "Learner", text: "I'm stuck on the REST API lab in Module 2. The test cases keep failing.", time: "Today, 2:00 PM" },
    { id: "m14", sender: "Dr. Amina Osei", role: "Instructor", text: "Check your endpoint path — it should be /api/v1/users, not /users. The test expects the full prefix.", time: "Today, 2:15 PM" },
    { id: "m15", sender: "Kofi Mensah", role: "Learner", text: "That fixed it, thank you!", time: "Today, 2:20 PM" },
  ],
  "dm-amina": [
    { id: "m10", sender: "Dr. Amina Osei", role: "Instructor", text: "Can you review the grading rubric I updated for the Data Science track?", time: "Today, 9:30 AM" },
  ],
  "dm-nana": [
    { id: "m11", sender: "Nana Adjei", role: "Admin", text: "Here's the enrollment report for this quarter.", time: "Yesterday, 3:00 PM" },
  ],
  "dm-esi": [
    { id: "m12", sender: "Esi Owusu", role: "Super Admin", text: "Revenue dashboard has been updated with the latest payment data.", time: "Today, 8:30 AM" },
  ],
  "dm-kofi": [
    { id: "m16", sender: "Kofi Mensah", role: "Learner", text: "Hi, I had a question about the Module 2 performance gate requirements.", time: "Today, 1:00 PM" },
  ],
};

export function MessagingPage({ currentUser, currentRole }: Props) {
  const [channels, setChannels] = useState(MOCK_CHANNELS);
  const [activeChannel, setActiveChannel] = useState(MOCK_CHANNELS[0].id);
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [showNewConvo, setShowNewConvo] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [newConvoSearch, setNewConvoSearch] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<Participant[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChannelData = channels.find((c) => c.id === activeChannel);
  const activeMessages = messages[activeChannel] || [];
  const contacts = getAccessibleContacts(currentRole, currentUser);

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
    setMessages((prev) => ({ ...prev, [activeChannel]: [...(prev[activeChannel] || []), newMsg] }));
    setInput("");
  }

  function toggleContact(contact: Participant) {
    setSelectedContacts((prev) =>
      prev.some((c) => c.name === contact.name)
        ? prev.filter((c) => c.name !== contact.name)
        : [...prev, contact]
    );
  }

  function startConversation() {
    if (selectedContacts.length === 0) return;
    const isGroup = selectedContacts.length > 1;
    const channelId = `ch-new-${Date.now()}`;
    const channelName = isGroup
      ? (newGroupName.trim() || selectedContacts.map((c) => c.name.split(" ")[0]).join(", "))
      : selectedContacts[0].name;

    const newChannel: Channel = {
      id: channelId,
      name: channelName,
      type: isGroup ? "group" : "direct",
      unread: 0,
      lastMessage: "",
      participants: [...selectedContacts, { name: currentUser, role: currentRole, online: true }],
      members: isGroup ? Array.from(new Set([...selectedContacts.map((c) => c.role + "s"), currentRole + "s"])) : undefined,
    };

    setChannels((prev) => [newChannel, ...prev]);
    setMessages((prev) => ({ ...prev, [channelId]: [] }));
    setActiveChannel(channelId);
    setShowNewConvo(false);
    setSelectedContacts([]);
    setNewGroupName("");
    setNewConvoSearch("");
  }

  function addParticipantToChannel(contact: Participant) {
    if (!activeChannelData || activeChannelData.type !== "group") return;
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === activeChannel
          ? { ...ch, participants: [...(ch.participants || []), contact] }
          : ch
      )
    );
  }

  const filteredChannels = search
    ? channels.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : channels;

  const groupChannels = filteredChannels.filter((c) => c.type === "group");
  const directChannels = filteredChannels.filter((c) => c.type === "direct");

  const filteredContacts = newConvoSearch
    ? contacts.filter((c) => c.name.toLowerCase().includes(newConvoSearch.toLowerCase()) || c.role.toLowerCase().includes(newConvoSearch.toLowerCase()))
    : contacts;

  // Group contacts by role for the picker
  const contactsByRole = filteredContacts.reduce<Record<string, Participant[]>>((acc, c) => {
    (acc[c.role] = acc[c.role] || []).push(c);
    return acc;
  }, {});

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl border border-surface-200 bg-surface-0 shadow-card overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-surface-200 flex flex-col shrink-0">
        <div className="p-3 border-b border-surface-200 space-y-2">
          <button
            onClick={() => setShowNewConvo(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 py-2.5 text-body-sm font-semibold text-white hover:bg-brand-700 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> New Conversation
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-surface-200 bg-surface-50 text-body-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {groupChannels.length > 0 && (
            <div className="px-3 pt-3 pb-1">
              <p className="text-caption font-medium text-surface-400 uppercase tracking-wide">Channels</p>
            </div>
          )}
          {groupChannels.map((ch) => (
            <button key={ch.id} onClick={() => { setActiveChannel(ch.id); setShowParticipants(false); }}
              className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-left transition-colors ${activeChannel === ch.id ? "bg-brand-50 text-brand-700" : "text-surface-700 hover:bg-surface-50"}`}>
              <Hash className="w-4 h-4 text-surface-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-body-sm truncate block">{ch.name}</span>
                <span className="text-caption text-surface-400 truncate block">{ch.lastMessage}</span>
              </div>
              {ch.unread > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{ch.unread}</span>}
            </button>
          ))}

          {directChannels.length > 0 && (
            <div className="px-3 pt-4 pb-1">
              <p className="text-caption font-medium text-surface-400 uppercase tracking-wide">Direct Messages</p>
            </div>
          )}
          {directChannels.map((ch) => (
            <button key={ch.id} onClick={() => { setActiveChannel(ch.id); setShowParticipants(false); }}
              className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-left transition-colors ${activeChannel === ch.id ? "bg-brand-50 text-brand-700" : "text-surface-700 hover:bg-surface-50"}`}>
              <div className="relative shrink-0">
                <div className="w-7 h-7 rounded-full bg-surface-300 flex items-center justify-center text-[9px] font-bold text-white">
                  {getInitials(ch.name)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-body-sm truncate block">{ch.name}</span>
                <span className="text-caption text-surface-400 truncate block">{ch.lastMessage}</span>
              </div>
              {ch.unread > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{ch.unread}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 shrink-0">
          <div className="flex items-center gap-3">
            {activeChannelData?.type === "group" ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50">
                <Hash className="w-4 h-4 text-brand-600" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-surface-300 flex items-center justify-center text-xs font-bold text-white">
                {getInitials(activeChannelData?.name || "")}
              </div>
            )}
            <div>
              <p className="text-body-sm font-semibold text-surface-900">{activeChannelData?.name}</p>
              {activeChannelData?.participants && (
                <p className="text-caption text-surface-400">
                  {activeChannelData.participants.length} participant{activeChannelData.participants.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
          {activeChannelData?.type === "group" && (
            <button onClick={() => setShowParticipants(!showParticipants)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-caption font-medium transition-all ${showParticipants ? "bg-brand-50 text-brand-700" : "text-surface-500 hover:bg-surface-50 hover:text-surface-700"}`}>
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">{activeChannelData.participants?.length || 0}</span>
            </button>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
              {activeMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 mb-3">
                    <Send className="w-5 h-5 text-surface-400" />
                  </div>
                  <p className="text-body-sm text-surface-500">No messages yet. Start the conversation.</p>
                </div>
              )}
              {activeMessages.map((msg) => {
                const isMe = msg.sender === currentUser;
                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${ROLE_COLORS[msg.role] || "bg-surface-500"}`}>
                      {getInitials(msg.sender)}
                    </div>
                    <div className={`max-w-[70%] ${isMe ? "text-right" : ""}`}>
                      <div className={`flex items-baseline gap-2 mb-0.5 ${isMe ? "justify-end" : ""}`}>
                        {!isMe && <span className="text-caption font-medium text-surface-900">{msg.sender}</span>}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ROLE_BADGE_STYLES[msg.role] || "bg-surface-100 text-surface-600"}`}>{msg.role}</span>
                        <span className="text-caption text-surface-400">{msg.time}</span>
                      </div>
                      <div className={`inline-block rounded-xl px-4 py-2.5 text-body-sm leading-relaxed ${
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
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                placeholder={`Message ${activeChannelData?.type === "group" ? "#" : ""}${activeChannelData?.name || ""}...`}
                className="flex-1 rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
              />
              <button type="submit" className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-body-sm font-medium text-white hover:bg-brand-700 transition-all active:scale-[0.98]">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Participants panel (group channels only) */}
          {showParticipants && activeChannelData?.type === "group" && (
            <div className="w-64 border-l border-surface-200 flex flex-col shrink-0 animate-slide-down">
              <div className="px-4 py-3 border-b border-surface-200 flex items-center justify-between">
                <p className="text-body-sm font-semibold text-surface-900">Participants</p>
                <button onClick={() => setShowParticipants(false)} className="p-1 rounded-lg hover:bg-surface-100 text-surface-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
                {activeChannelData.participants?.map((p) => (
                  <div key={p.name} className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-surface-50 transition-colors">
                    <div className="relative">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${ROLE_COLORS[p.role] || "bg-surface-500"}`}>
                        {getInitials(p.name)}
                      </div>
                      {p.online && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent-500 ring-2 ring-surface-0" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-surface-900 truncate">{p.name}</p>
                      <p className="text-caption text-surface-400">{p.role}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Add participant */}
              <div className="p-3 border-t border-surface-200">
                <AddParticipantDropdown
                  contacts={contacts.filter((c) => !activeChannelData.participants?.some((p) => p.name === c.name))}
                  onAdd={addParticipantToChannel}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConvo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/50 backdrop-blur-sm" onClick={() => setShowNewConvo(false)}>
          <div className="w-full max-w-md rounded-2xl border border-surface-200 bg-surface-0 shadow-card-active animate-scale-in mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
              <h2 className="text-heading-sm text-surface-900">New Conversation</h2>
              <button onClick={() => setShowNewConvo(false)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Selected contacts */}
              {selectedContacts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedContacts.map((c) => (
                    <span key={c.name} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-caption font-medium text-brand-700">
                      {c.name}
                      <button onClick={() => toggleContact(c)} className="hover:text-brand-900 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Group name (if multiple selected) */}
              {selectedContacts.length > 1 && (
                <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group name (optional)"
                  className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-body-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
                />
              )}

              {/* Search contacts */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input type="text" value={newConvoSearch} onChange={(e) => setNewConvoSearch(e.target.value)}
                  placeholder="Search by name or role..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-body-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 transition-all"
                />
              </div>

              {/* Contact list grouped by role */}
              <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-3">
                {Object.entries(contactsByRole).map(([role, roleContacts]) => (
                  <div key={role}>
                    <p className="text-caption font-medium text-surface-400 uppercase tracking-wide mb-1 px-1">{role}s</p>
                    <div className="space-y-0.5">
                      {roleContacts.map((contact) => {
                        const isSelected = selectedContacts.some((c) => c.name === contact.name);
                        return (
                          <button key={contact.name} onClick={() => toggleContact(contact)}
                            className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-left transition-all ${isSelected ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-surface-50"}`}>
                            <div className="relative">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${ROLE_COLORS[contact.role] || "bg-surface-500"}`}>
                                {getInitials(contact.name)}
                              </div>
                              {contact.online && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent-500 ring-2 ring-surface-0" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-body-sm font-medium text-surface-900">{contact.name}</p>
                              <p className="text-caption text-surface-400">{contact.role}{contact.online ? " · Online" : ""}</p>
                            </div>
                            {isSelected && (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {Object.keys(contactsByRole).length === 0 && (
                  <p className="text-center text-body-sm text-surface-400 py-4">No contacts found</p>
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-surface-200 flex justify-end gap-3">
              <button onClick={() => setShowNewConvo(false)} className="rounded-xl border border-surface-200 px-4 py-2.5 text-body-sm text-surface-700 hover:bg-surface-50 transition-all">
                Cancel
              </button>
              <button onClick={startConversation} disabled={selectedContacts.length === 0}
                className="rounded-xl bg-brand-600 px-4 py-2.5 text-body-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
                {selectedContacts.length > 1 ? "Create Group" : "Start Chat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Small dropdown to add a participant to an existing group channel */
function AddParticipantDropdown({ contacts, onAdd }: { contacts: Participant[]; onAdd: (c: Participant) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filtered = search ? contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())) : contacts;

  if (contacts.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-surface-300 px-3 py-2 text-caption font-medium text-surface-500 hover:border-brand-400 hover:text-brand-600 transition-all">
        <UserPlus className="w-3.5 h-3.5" /> Add participant
      </button>
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-surface-200 bg-surface-0 shadow-card-active animate-slide-down overflow-hidden">
          <div className="p-2">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
              className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-1.5 text-caption text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-1 focus:ring-brand-500/20"
            />
          </div>
          <div className="max-h-40 overflow-y-auto">
            {filtered.map((c) => (
              <button key={c.name} onClick={() => { onAdd(c); setOpen(false); setSearch(""); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-surface-50 transition-colors">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${ROLE_COLORS[c.role] || "bg-surface-500"}`}>
                  {getInitials(c.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-caption font-medium text-surface-900 truncate">{c.name}</p>
                  <p className="text-[10px] text-surface-400">{c.role}</p>
                </div>
                <ChevronRight className="w-3 h-3 text-surface-300" />
              </button>
            ))}
            {filtered.length === 0 && <p className="px-3 py-2 text-caption text-surface-400">No contacts available</p>}
          </div>
        </div>
      )}
    </div>
  );
}
