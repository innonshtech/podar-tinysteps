"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Protected from "@/components/common/Protected";
import {
  Mail,
  Send,
  Users,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  RefreshCw,
  User,
  AtSign,
  Loader2,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────── */
type SendMode = "single" | "teachers" | "parents" | "all_teachers" | "all_parents";

interface TeacherOption {
  _id: string;
  name: string;
  email: string;
}

interface ParentOption {
  name: string;
  email: string;
}

interface CommunicationLog {
  _id: string;
  subject: string;
  recipientType: string;
  recipientLabels: string[];
  status: string;
  sentCount: number;
  createdAt: string;
}

/* ─── Helpers ────────────────────────────────────────────────── */
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function recipientTypeLabel(type: string) {
  switch (type) {
    case "single": return "Single Email";
    case "teachers": return "Selected Teachers";
    case "parents": return "Selected Parents";
    case "all_teachers": return "All Teachers";
    case "all_parents": return "All Parents";
    default: return type;
  }
}

/* ─── Multi-Select Checkbox List ─────────────────────────────── */
function MultiSelectList<T extends { name: string; email: string }>({
  items,
  selectedEmails,
  onToggle,
  onSelectAll,
  onClearAll,
  placeholder,
}: {
  items: T[];
  selectedEmails: Set<string>;
  onToggle: (email: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(query.toLowerCase()) ||
      i.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Select All / Clear All */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSelectAll}
          className="text-xs font-semibold text-red-600 hover:text-red-700 underline"
        >
          Select All ({filtered.length})
        </button>
        <span className="text-gray-300">|</span>
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-semibold text-gray-500 hover:text-gray-700 underline"
        >
          Clear
        </button>
        <span className="ml-auto text-xs text-gray-500 font-medium">
          {selectedEmails.size} selected
        </span>
      </div>

      {/* List */}
      <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            No results found
          </div>
        ) : (
          filtered.map((item) => {
            const checked = selectedEmails.has(item.email);
            return (
              <label
                key={item.email}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  checked ? "bg-red-50" : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(item.email)}
                  className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{item.email}</p>
                </div>
                {checked && (
                  <CheckCircle2 className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ─── Simple HTML Toolbar ─────────────────────────────────────── */
function HtmlToolbar({ onInsert }: { onInsert: (tag: string, closeTag: string) => void }) {
  const buttons = [
    { label: "B", open: "<strong>", close: "</strong>", title: "Bold" },
    { label: "I", open: "<em>", close: "</em>", title: "Italic" },
    { label: "U", open: "<u>", close: "</u>", title: "Underline" },
    { label: "• List", open: "<ul>\n  <li>", close: "</li>\n</ul>", title: "Bullet list" },
    { label: "H2", open: "<h2>", close: "</h2>", title: "Heading" },
    { label: "HR", open: "<hr/>", close: "", title: "Divider" },
  ];
  return (
    <div className="flex flex-wrap gap-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-t-xl border-b-0">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          type="button"
          title={btn.title}
          onClick={() => onInsert(btn.open, btn.close)}
          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function CommunicationsManagement({
  isAdmin = false,
}: {
  isAdmin?: boolean;
}) {
  const [sendMode, setSendMode] = useState<SendMode>("single");
  const [customEmail, setCustomEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Recipients data
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [parents, setParents] = useState<ParentOption[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);

  // Selected sets
  const [selectedTeacherEmails, setSelectedTeacherEmails] = useState<Set<string>>(new Set());
  const [selectedParentEmails, setSelectedParentEmails] = useState<Set<string>>(new Set());

  // Logs
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [statsCount, setStatsCount] = useState(0);

  // Textarea ref for HTML toolbar
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ── Fetch recipients & logs on mount ── */
  useEffect(() => {
    fetchRecipients();
    fetchLogs();
  }, []);

  const fetchRecipients = async () => {
    setRecipientsLoading(true);
    try {
      const res = await fetch("/api/communications/recipients");
      const data = await res.json();
      if (data.success) {
        setTeachers(data.teachers || []);
        setParents(data.parents || []);
      }
    } catch {}
    setRecipientsLoading(false);
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch("/api/communications/logs?limit=8");
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setStatsCount(data.pagination?.total || 0);
      }
    } catch {}
    setLogsLoading(false);
  };

  /* ── HTML toolbar insert ── */
  const handleToolbarInsert = useCallback(
    (openTag: string, closeTag: string) => {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = body.slice(start, end);
      const newValue =
        body.slice(0, start) + openTag + selected + closeTag + body.slice(end);
      setBody(newValue);
      setTimeout(() => {
        el.focus();
        el.selectionStart = start + openTag.length + selected.length + closeTag.length;
        el.selectionEnd = el.selectionStart;
      }, 0);
    },
    [body]
  );

  /* ── Teacher toggles ── */
  const toggleTeacher = (email: string) => {
    setSelectedTeacherEmails((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };
  const selectAllTeachers = () =>
    setSelectedTeacherEmails(new Set(teachers.map((t) => t.email)));
  const clearTeachers = () => setSelectedTeacherEmails(new Set());

  /* ── Parent toggles ── */
  const toggleParent = (email: string) => {
    setSelectedParentEmails((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };
  const selectAllParents = () =>
    setSelectedParentEmails(new Set(parents.map((p) => p.email)));
  const clearParents = () => setSelectedParentEmails(new Set());

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setToast(null);

    try {
      const payload: any = { sendMode, subject, body };

      if (sendMode === "single") {
        payload.customEmail = customEmail;
      } else if (sendMode === "teachers") {
        payload.selectedTeacherIds = teachers
          .filter((t) => selectedTeacherEmails.has(t.email))
          .map((t) => t._id);
      } else if (sendMode === "parents") {
        payload.selectedParentEmails = Array.from(selectedParentEmails);
      }

      const res = await fetch("/api/communications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to send email");

      setToast({
        type: "success",
        message: data.message || "Email sent successfully!",
      });

      // Reset form
      setCustomEmail("");
      setSubject("");
      setBody("");
      setSelectedTeacherEmails(new Set());
      setSelectedParentEmails(new Set());

      // Refresh logs
      fetchLogs();
    } catch (error: any) {
      setToast({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Recipient count badge ── */
  const recipientCount = (() => {
    if (sendMode === "single") return customEmail ? 1 : 0;
    if (sendMode === "teachers") return selectedTeacherEmails.size;
    if (sendMode === "parents") return selectedParentEmails.size;
    if (sendMode === "all_teachers") return teachers.length;
    if (sendMode === "all_parents") return parents.length;
    return 0;
  })();

  /* ── Mode tabs ── */
  const modes: { id: SendMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: "single",
      label: "Single Email",
      icon: <AtSign className="w-4 h-4" />,
      desc: "Send to one email address",
    },
    {
      id: "teachers",
      label: "Select Teachers",
      icon: <GraduationCap className="w-4 h-4" />,
      desc: "Pick individual teachers",
    },
    {
      id: "parents",
      label: "Select Parents",
      icon: <Users className="w-4 h-4" />,
      desc: "Pick individual parents",
    },
    {
      id: "all_teachers",
      label: "All Teachers",
      icon: <GraduationCap className="w-4 h-4" />,
      desc: `${teachers.length} teachers`,
    },
    {
      id: "all_parents",
      label: "All Parents",
      icon: <Users className="w-4 h-4" />,
      desc: `${parents.length} parents`,
    },
  ];

  return (
    <Protected module="communications">
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <Breadcrumbs
          items={[
            {
              label: "Dashboard",
              href: isAdmin ? "/dashboard" : "/teacher-dashboard",
            },
            { label: "Communications" },
          ]}
        />

        {/* Header */}
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Communications
              </h1>
              <p className="text-gray-500 text-sm">
                Send emails to parents, teachers, or custom addresses
              </p>
            </div>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`mb-6 flex items-center gap-3 px-5 py-4 rounded-xl border text-sm font-medium ${
              toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Left: Compose ── */}
          <div className="xl:col-span-2 space-y-5">
            {/* Send Mode Selector */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-red-500" />
                Send To
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {modes.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSendMode(mode.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      sendMode === mode.id
                        ? "border-red-400 bg-red-50 text-red-700 shadow-sm"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:border-red-300 hover:bg-red-50/50"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        sendMode === mode.id
                          ? "bg-red-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {mode.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{mode.label}</p>
                      <p className="text-xs opacity-70 truncate">{mode.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Input Area */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              {recipientsLoading ? (
                <div className="flex items-center gap-3 py-6 text-gray-500 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading recipients…</span>
                </div>
              ) : sendMode === "single" ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <AtSign className="w-4 h-4 text-red-500" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="custom-email-input"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50"
                    placeholder="recipient@example.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    required
                  />
                </div>
              ) : sendMode === "teachers" ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-red-500" />
                    Select Teachers
                    {teachers.length === 0 && (
                      <span className="text-xs text-orange-500 font-normal ml-2">
                        (No teachers found in DB)
                      </span>
                    )}
                  </label>
                  <MultiSelectList
                    items={teachers}
                    selectedEmails={selectedTeacherEmails}
                    onToggle={toggleTeacher}
                    onSelectAll={selectAllTeachers}
                    onClearAll={clearTeachers}
                    placeholder="Search teachers by name or email…"
                  />
                </div>
              ) : sendMode === "parents" ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-red-500" />
                    Select Parents
                    {parents.length === 0 && (
                      <span className="text-xs text-orange-500 font-normal ml-2">
                        (No parent emails found — add emails to students)
                      </span>
                    )}
                  </label>
                  <MultiSelectList
                    items={parents}
                    selectedEmails={selectedParentEmails}
                    onToggle={toggleParent}
                    onSelectAll={selectAllParents}
                    onClearAll={clearParents}
                    placeholder="Search parents by name or email…"
                  />
                </div>
              ) : sendMode === "all_teachers" ? (
                <div className="flex items-center gap-4 py-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      Send to All Teachers
                    </p>
                    <p className="text-sm text-gray-500">
                      {teachers.length} teacher{teachers.length !== 1 ? "s" : ""} will receive this email
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 py-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      Send to All Parents
                    </p>
                    <p className="text-sm text-gray-500">
                      {parents.length} unique parent email{parents.length !== 1 ? "s" : ""} will receive this email
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Compose Form */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-500" />
                  Compose Message
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-5">
                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email-subject-input"
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50"
                    placeholder="Enter email subject…"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                {/* Body with HTML toolbar */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message Body <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-gray-400 ml-2">
                      (HTML supported)
                    </span>
                  </label>
                  <HtmlToolbar onInsert={handleToolbarInsert} />
                  <textarea
                    id="email-body-textarea"
                    ref={textareaRef}
                    className="w-full px-4 py-3 border border-gray-200 rounded-b-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[200px] font-mono bg-gray-50 resize-y"
                    placeholder="Type your message here… HTML tags are supported."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                  />
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-gray-100">
                  {/* Recipient count badge */}
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                      recipientCount > 0
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-gray-100 text-gray-500 border border-gray-200"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    {recipientCount > 0
                      ? `${recipientCount} recipient${recipientCount !== 1 ? "s" : ""} selected`
                      : "No recipients selected"}
                  </div>

                  <button
                    id="send-email-btn"
                    type="submit"
                    disabled={isSubmitting || recipientCount === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none w-full sm:w-auto justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Email
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Right Sidebar ── */}
          <div className="space-y-5">
            {/* Stats */}
            {isAdmin && (
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white shadow-lg shadow-red-200">
                <p className="text-sm font-medium opacity-80 mb-1">Total Emails Sent</p>
                <p className="text-4xl font-bold">{statsCount}</p>
                <p className="text-xs opacity-70 mt-1">All time via SMTP</p>
              </div>
            )}

            {/* Communication Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-blue-900 text-sm">Tips</h3>
              </div>
              <ul className="space-y-2 text-xs text-blue-800 list-disc pl-4">
                <li>Keep subject lines clear and concise</li>
                <li>Double-check recipients before sending</li>
                <li>Avoid sending after 8 PM unless urgent</li>
                <li>HTML formatting is supported in the body</li>
                <li>Use "All Parents" for school-wide announcements</li>
              </ul>
            </div>

            {/* Recent Sends */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Recent Sends
                </h3>
                <button
                  type="button"
                  onClick={fetchLogs}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? "animate-spin" : ""}`} />
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {logsLoading ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">
                    No emails sent yet
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log._id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                      <p className="font-semibold text-gray-800 text-xs truncate mb-0.5">
                        {log.subject}
                      </p>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 truncate">
                          {recipientTypeLabel(log.recipientType)}
                          {log.sentCount > 0 && (
                            <span className="ml-1 text-gray-400">
                              · {log.sentCount}
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold ${
                              log.status === "Sent"
                                ? "text-green-600"
                                : log.status === "Partial"
                                ? "text-orange-500"
                                : "text-red-500"
                            }`}
                          >
                            {log.status}
                          </span>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {timeAgo(log.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Protected>
  );
}
