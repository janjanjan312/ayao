"use client";

import { useState, useRef, useEffect } from "react";
import { mockNotes } from "@/lib/data";

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = "user" | "assistant";

interface NoteCard {
  id: string;
  author: string;
  time: string;
  likes: string;
  location: string;
  tag: string;
  content: string;
}

interface Message {
  role: Role;
  content: string;
  cards?: NoteCard[];
  compareData?: { a: string; b: string };
  showExport?: boolean;
  isTyping?: boolean;
  buttons?: { label: string; value: string }[][];
  isProfile?: boolean;
}

interface UserProfile {
  travel: string;
  style: string;
  crowd: string;
}

// ─── Demo steps for right panel ──────────────────────────────────────────────

const DEMO_STEPS = [
  {
    step: 1,
    title: "画像建立",
    ability: "收藏夹数据 + 偏好选择",
    why: "• 读取收藏夹，沉淀长期偏好画像\n• NLP 从笔记中抽取兴趣标签\n• 对话中实时补充画像",
    advantage: "画像优势",
    color: "#FF2442",
  },
  {
    step: 2,
    title: "实时社区洞察",
    ability: "24小时博主实时反馈",
    why: "• 获取实时社区信息，通用AI平台无法触达\n• 多模态 RAG：向量召回 + 时间加权\n• 垂类 SFT/DPO：会追问、识别画像矛盾",
    advantage: "实时性",
    color: "#2196F3",
  },
  {
    step: 3,
    title: "识别矛盾，聚焦方向",
    ability: "识别信息矛盾，聚焦具体行程方向",
    why: "• 识别前后矛盾信息，提供解决方案\n• 社区共识：笔记加权聚合为推荐 / 避雷票数\n• 收集用户偏好，聚焦到少数选项",
    advantage: "专家思维",
    color: "#FF2442",
  },
  {
    step: 4,
    title: "输出行程规划",
    ability: "每个推荐都有笔记来源",
    why: "• 推荐到具体POI点位，结合本地生活生态\n• 多步 Agent + 门店POI 链接",
    advantage: "生态联动",
    color: "#2ECC71",
  },
  {
    step: 5,
    title: "细节调整，导出为笔记草稿",
    ability: "随时修改，持续优化行程",
    why: "• 根据反馈持续迭代，结构化输出\n• 一键保存到草稿箱，便于查看和笔记发布",
    advantage: "持续对话",
    color: "#2196F3",
  },
];

// ─── Message Renderer ────────────────────────────────────────────────────────

function renderSegment(seg: string, isUser: boolean, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|(@[\w一-鿿]+))/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = regex.exec(seg)) !== null) {
    if (m.index > last) parts.push(seg.slice(last, m.index));
    if (m[2]) {
      parts.push(<strong key={keyPrefix + m.index} style={{ fontWeight: 700 }}>{m[2]}</strong>);
    } else if (m[3]) {
      parts.push(
        <span key={keyPrefix + m.index} style={{ color: isUser ? "rgba(255,255,255,0.9)" : "#FF2442", fontWeight: 600 }}>
          {m[3]}
        </span>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < seg.length) parts.push(seg.slice(last));
  return parts;
}

function renderText(text: string, isUser: boolean) {
  return text.split("\n").map((line, li) => {
    const parts: React.ReactNode[] = [];
    // Split on 「...」using indexOf for reliable bracket detection
    const OPEN = "「";
    const CLOSE = "」";
    let cursor = 0;
    let key = 0;
    while (cursor < line.length) {
      const open = line.indexOf(OPEN, cursor);
      if (open === -1) {
        parts.push(...renderSegment(line.slice(cursor), isUser, `${li}-${key++}`));
        break;
      }
      // text before bracket
      if (open > cursor) {
        parts.push(...renderSegment(line.slice(cursor, open), isUser, `${li}-${key++}`));
      }
      const close = line.indexOf(CLOSE, open + 1);
      if (close === -1) {
        parts.push(...renderSegment(line.slice(open), isUser, `${li}-${key++}`));
        break;
      }
      const placeName = line.slice(open + 1, close);
      parts.push(
        <span key={`${li}-place-${key++}`} style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          background: isUser ? "rgba(255,255,255,0.15)" : "#FFF0F2",
          color: isUser ? "white" : "#FF2442",
          borderRadius: 6,
          padding: "1px 7px",
          fontSize: "0.92em",
          fontWeight: 600,
          border: isUser ? "1px solid rgba(255,255,255,0.25)" : "1px solid #FFD0D6",
          margin: "0 3px",
        }}>
          📍 {placeName}
        </span>
      );
      cursor = close + 1;
    }
    return <p key={li} style={{ margin: li > 0 ? "4px 0 0" : 0 }}>{parts}</p>;
  });
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function NoteCardUI({ card }: { card: NoteCard }) {
  const tagColors: Record<string, string> = {
    避雷: "#FF2442",
    推荐: "#2ECC71",
    实时: "#2196F3",
  };
  const tagBg: Record<string, string> = {
    避雷: "#FFF0F2",
    推荐: "#F0FBF4",
    实时: "#FFF4EF",
  };

  return (
    <div
      style={{
        background: "#EEEEEE",
        borderRadius: 14,
        padding: "12px 14px",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Tag */}
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: tagColors[card.tag] || "#FF2442",
          flexShrink: 0,
          display: "inline-block",
        }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: "#555", letterSpacing: 0.2 }}>
          {card.tag}
        </span>
      </span>

      {/* Content */}
      <div style={{
        fontSize: 12,
        color: "#333",
        lineHeight: 1.65,
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        flex: 1,
      }}>
        {card.content}
      </div>

      {/* Author row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
        <img
          src={`/avatars/${card.id}.jpg`}
          alt={card.author}
          style={{
            width: 22, height: 22, borderRadius: "50%",
            objectFit: "cover", flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.author}</div>
          <div style={{ fontSize: 10, color: "#AAAAAA" }}>{card.time}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
          <span style={{ fontSize: 11 }}>❤️</span>
          <span style={{ fontSize: 11, color: "#AAAAAA", fontWeight: 500 }}>{card.likes}</span>
        </div>
      </div>
    </div>
  );
}


function CompareCard({ a, b }: { a: string; b: string }) {
  return (
    <div style={{
      background: "#EEEEEE",
      borderRadius: 14,
      padding: "12px 14px",
      width: "100%",
      height: "100%",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F5A623", display: "inline-block", flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: "#555" }}>社区对比</span>
      </span>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, justifyContent: "center" }}>
        {/* Recommended */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>{a}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: "#FF2442",
                background: "#FFF0F2", borderRadius: 20, padding: "1px 7px",
              }}>推荐</span>
            </div>
            <div style={{ fontSize: 11, color: "#888" }}>社区好评更高</div>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#FF2442", lineHeight: 1, paddingTop: 2 }}>87%</span>
        </div>

        <div style={{ height: 1, background: "#DDDDDD", margin: "2px 0" }} />

        {/* Alternative */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#AAAAAA", marginBottom: 3 }}>{b}</div>
            <div style={{ fontSize: 11, color: "#CCCCCC" }}>人流相对较多</div>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#CCCCCC", lineHeight: 1, paddingTop: 2 }}>31%</span>
        </div>
      </div>
    </div>
  );
}

function ExportButton() {
  const [exported, setExported] = useState(false);
  return (
    <button
      onClick={() => setExported(true)}
      style={{
        marginTop: 12,
        background: exported ? "#2ECC71" : "linear-gradient(135deg, #FF2442, #FF6B7A)",
        color: "white",
        border: "none",
        borderRadius: 24,
        padding: "10px 24px",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "'Noto Sans SC', sans-serif",
        transition: "all 0.3s ease",
      }}
    >
      {exported ? "✓ 已生成笔记草稿" : "📝 一键导出为笔记"}
    </button>
  );
}

function FreeInput({ onSend, loading, currentStep }: { onSend: (text: string) => void; loading: boolean; currentStep: number }) {
  const [value, setValue] = useState("");
  const handleSend = () => {
    const text = value.trim();
    if (!text || loading) return;
    setValue("");
    onSend(text);
  };
  return (
    <>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        placeholder={currentStep === 4 ? "试试：我第一天也想去咖啡店或者书店..." : "继续问阿遥..."}
        style={{
          flex: 1,
          background: "#F5F0EE",
          borderRadius: 24,
          padding: "12px 18px",
          fontSize: 14,
          color: "#1A1A1A",
          border: "1.5px solid var(--border)",
          outline: "none",
          fontFamily: "'Noto Sans SC', sans-serif",
        }}
      />
      <button
        onClick={handleSend}
        disabled={loading || !value.trim()}
        style={{
          background: loading || !value.trim() ? "#EEE" : "linear-gradient(135deg, #FF2442, #FF6B7A)",
          color: loading || !value.trim() ? "#AAA" : "white",
          border: "none",
          borderRadius: 24,
          padding: "12px 20px",
          fontWeight: 700,
          fontSize: 14,
          cursor: loading || !value.trim() ? "not-allowed" : "pointer",
          fontFamily: "'Noto Sans SC', sans-serif",
          whiteSpace: "nowrap",
          boxShadow: loading || !value.trim() ? "none" : "0 4px 12px rgba(255,36,66,0.3)",
          transition: "all 0.2s",
        }}
      >
        发送 →
      </button>
    </>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}

// ─── Right Panel ──────────────────────────────────────────────────────────────

function RightPanel({ currentStep, visible }: { currentStep: number; visible: boolean }) {
  if (!visible) return null;

  const activeStep = DEMO_STEPS.find((s) => s.step === currentStep);

  return (
    <div
      className="slide-in-right"
      style={{
        width: 360,
        minWidth: 360,
        height: "100vh",
        background: "white",
        borderLeft: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "24px 28px 18px",
          borderBottom: "1px solid var(--border)",
          background: "#FAFAFA",
        }}
      >
        <div style={{ fontSize: 10, color: "#BBBBBB", fontWeight: 600, letterSpacing: 1.2, marginBottom: 6 }}>
          DEMO GUIDE
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A" }}>阿遥 · 旅行决策专家</div>
        <a
          href="/product-intro.html"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginTop: 8, fontSize: 12, color: "#FF2442", display: "inline-flex", alignItems: "center", gap: 4, opacity: 0.85, textDecoration: "none" }}
        >
          点击查看详细产品介绍 →
        </a>
      </div>

      {/* Steps */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px 20px" }}>
        {DEMO_STEPS.map((s) => {
          const isActive = s.step === currentStep;
          const isPast = s.step < currentStep;
          return (
            <div
              key={s.step}
              style={{
                marginBottom: 10,
                padding: isActive ? "18px 20px" : "12px 16px",
                borderRadius: 18,
                background: isActive ? s.color + "0D" : isPast ? "#F7F7F7" : "transparent",
                border: isActive ? `1.5px solid ${s.color}40` : "1.5px solid transparent",
                transition: "all 0.4s ease",
                opacity: isPast ? 0.45 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: isActive ? 12 : 0 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: isActive ? s.color : isPast ? "#D0D0D0" : "#EFEFEF",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isPast ? "✓" : s.step}
                </div>
                <div style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? s.color : isPast ? "#AAA" : "#888" }}>
                  {s.title}
                </div>
              </div>

              {isActive && (
                <div className="fade-in-up" style={{ paddingLeft: 36 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 8, lineHeight: 1.5 }}>
                    {s.ability}
                  </div>
                  <div style={{ fontSize: 12, color: "#777", lineHeight: 1.8, marginBottom: 12, whiteSpace: "pre-line" }}>
                    {s.why}
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: s.color + "15",
                      color: s.color,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 12px",
                      borderRadius: 20,
                    }}
                  >
                    💡 {s.advantage}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Profile Buttons ──────────────────────────────────────────────────────────

const PROFILE_OPTIONS = [
  [
    { label: "🧍 独自出发", value: "独自出行" },
    { label: "👫 和另一半", value: "情侣出行" },
    { label: "👨‍👩‍👧 带家人", value: "家庭出行" },
  ],
  [
    { label: "👯 朋友组团", value: "朋友组团" },
    { label: "🌿 自然户外", value: "自然户外" },
    { label: "🏘️ 古镇人文", value: "古镇人文" },
  ],
  [
    { label: "🍜 吃喝探店", value: "吃喝探店" },
    { label: "⚡ 什么都要", value: "什么都要" },
    { label: "😌 躲人第一", value: "躲人优先" },
  ],
  [
    { label: "🤷 无所谓", value: "人流无所谓" },
    { label: "📸 热门打卡OK", value: "热门打卡OK" },
  ],
];

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "我是阿遥，你的小红书旅行搭子。\n告诉我你想去哪，我来帮你搞定剩下的事。",
    },
  ]);

  const [userProfile, setUserProfile] = useState<UserProfile>({ travel: "", style: "", crowd: "" });
  const [profileSelections, setProfileSelections] = useState<string[]>(["", "", ""]);
  const [showProfile, setShowProfile] = useState(false);
  const [profileConfirmed, setProfileConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [panelVisible, setPanelVisible] = useState(true);
  const [apiMessages, setApiMessages] = useState<{ role: string; content: string }[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Hardcoded user inputs for demo
  const DEMO_INPUTS = [
    "我想去云南",
    "五一去合适吗？",
    "5天，想看洱海骑行，能接受盘山路",
    "以大理为基地吧",
  ];
  const [demoIndex, setDemoIndex] = useState(0);

  // Stray inline note refs like [n1], [n1, n2], (n1) — model sometimes leaks them
  const INLINE_NOTE_REF_RE = /[\[\(（]\s*n\d+(?:\s*[,，、]\s*n\d+)*\s*[\]\)）]/g;

  const parseResponse = (text: string, cards: NoteCard[], compare: { a: string; b: string } | null, showExport: boolean) => {
    const clean = text
      .replace(/\[CARDS:[^\]]+\]/g, "")
      .replace(/\[COMPARE:[^\]]+\]/g, "")
      .replace(/\[SHOW_EXPORT\]/g, "")
      .replace(INLINE_NOTE_REF_RE, "")
      .replace(/[ \t]+([。，、！？；：])/g, "$1")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
    return { clean, cards, compare, showExport };
  };

  const extractMetadata = (text: string) => {
    const cardMatch = text.match(/\[CARDS:([^\]]+)\]/);
    const compareMatch = text.match(/\[COMPARE:([^\]]+)\]/);
    const showExport = text.includes("[SHOW_EXPORT]");

    let cards: NoteCard[] = [];
    if (cardMatch) {
      const ids = cardMatch[1].split(/[,，]/).map((s) => s.trim());
      cards = ids.map((id) => mockNotes.find((n) => n.id === id)).filter(Boolean) as NoteCard[];
    } else {
      // Fallback: pull IDs from stray inline refs like [n1, n2]
      const inlineIds = new Set<string>();
      Array.from(text.matchAll(INLINE_NOTE_REF_RE)).forEach((m) => {
        m[0]
          .replace(/[\[\(（\]\)）]/g, "")
          .split(/[,，、]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((id) => inlineIds.add(id));
      });
      cards = Array.from(inlineIds)
        .map((id) => mockNotes.find((n) => n.id === id))
        .filter(Boolean) as NoteCard[];
    }

    let compare: { a: string; b: string } | null = null;
    if (compareMatch) {
      const parts = compareMatch[1].split(/[,，]/);
      compare = { a: parts[0]?.trim(), b: parts[1]?.trim() };
    }

    return { cards, compare, showExport };
  };

  const sendMessage = async (userText: string) => {
    if (loading) return;
    if (currentStep === 4) setCurrentStep(5);

    // Add user message
    const newUserMsg: Message = { role: "user", content: userText };
    setMessages((prev) => [...prev, newUserMsg]);

    // Typing indicator
    setMessages((prev) => [...prev, { role: "assistant", content: "", isTyping: true }]);
    setLoading(true);

    const newApiMessages = [...apiMessages, { role: "user", content: userText }];
    setApiMessages(newApiMessages);

    try {
      const profileStr = `出行方式：${userProfile.travel || "未知"}，旅行风格：${userProfile.style || "未知"}，人流偏好：${userProfile.crowd || "未知"}`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newApiMessages, userProfile: profileStr }),
      });

      const data = await res.json();
      const text = data.text || "抱歉，出了点问题 🥲";

      const { cards, compare, showExport } = extractMetadata(text);
      const { clean } = parseResponse(text, cards, compare, showExport);

      if (showExport) setCurrentStep((prev) => (prev < 4 ? 4 : prev));

      const assistantMsg: Message = {
        role: "assistant",
        content: clean,
        cards: cards.length > 0 ? cards : undefined,
        compareData: compare || undefined,
        showExport,
      };

      setApiMessages((prev) => [...prev, { role: "assistant", content: text }]);
      setMessages((prev) => [...prev.filter((m) => !m.isTyping), assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => !m.isTyping),
        { role: "assistant", content: "网络出了点问题，请稍后再试 🥲" },
      ]);
    }

    setLoading(false);
  };

  const handleDemoClick = async () => {
    if (demoIndex >= DEMO_INPUTS.length) return;
    const text = DEMO_INPUTS[demoIndex];
    setDemoIndex((i) => i + 1);

    if (demoIndex === 0) {
      // "我想去云南" → show profile
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setTimeout(() => {
        setShowProfile(true);
        setCurrentStep(1);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "我看到你收藏夹里刚好有 12 篇云南相关笔记，帮你整合进来～\n先快速告诉我你的风格：",
            isProfile: true,
          },
        ]);
      }, 600);
    } else {
      if (demoIndex === 1) setCurrentStep(2); // 五一 → 实时洞察
      if (demoIndex === 2) setCurrentStep(3); // 5天骑行 → 识别矛盾，聚焦方向
      // demoIndex 3 "以大理为基地吧" 依然在 step 3，等 AI 输出 [SHOW_EXPORT] 触发 step 4
      await sendMessage(text);
    }
  };

  const handleProfileSelect = (groupIndex: number, value: string) => {
    const newSel = [...profileSelections];
    newSel[groupIndex] = value;
    setProfileSelections(newSel);

    if (groupIndex === 0) setUserProfile((p) => ({ ...p, travel: value }));
    if (groupIndex === 1) setUserProfile((p) => ({ ...p, style: value }));
    if (groupIndex === 2) setUserProfile((p) => ({ ...p, crowd: value }));
  };

  const handleProfileConfirm = () => {
    if (!profileSelections[0] || !profileSelections[1] || !profileSelections[2]) return;
    setProfileConfirmed(true);
    setShowProfile(false);
    const confirmText = `明白了！${profileSelections[0]}、偏${profileSelections[1]}、${profileSelections[2]}——画像记下来了 🗺️\n\n想什么时候去呢？`;
    setMessages((prev) => [...prev, { role: "assistant", content: confirmText }]);
  };

  const allProfileSelected = profileSelections.every((s) => s !== "");

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--cream)" }}>
      {/* ── Left: Chat ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
            background: "white",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <img
            src="/ayao.jpg"
            alt="阿遥"
            style={{
              width: 40, height: 40, borderRadius: "50%",
              objectFit: "cover", flexShrink: 0,
              boxShadow: "0 4px 12px rgba(255,36,66,0.2)",
            }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1A1A1A" }}>阿遥</div>
            <div style={{ fontSize: 12, color: "#9B8B8B" }}>一个帮你翻了几千篇笔记、最懂你品味的旅行搭子</div>
          </div>


          {/* Toggle panel */}
          <button
            onClick={() => setPanelVisible((v) => !v)}
            style={{
              marginLeft: "auto",
              background: panelVisible ? "#FF2442" : "#F5F0EE",
              color: panelVisible ? "white" : "#666",
              border: "none",
              borderRadius: 20,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Noto Sans SC', sans-serif",
              transition: "all 0.2s",
            }}
          >
            {panelVisible ? "隐藏解说" : "显示解说"}
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className="fade-in-up"
              style={{
                display: "flex",
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              {msg.role === "assistant" && (
                <img
                  src="/ayao.jpg"
                  alt="阿遥"
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    objectFit: "cover", flexShrink: 0, marginTop: 2,
                  }}
                />
              )}

              <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Bubble */}
                <div
                  style={{
                    background: msg.role === "user" ? "#FF2442" : "white",
                    color: msg.role === "user" ? "white" : "#1A1A1A",
                    padding: "12px 16px",
                    borderRadius: msg.role === "user" ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                    fontSize: 14,
                    lineHeight: 1.7,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    whiteSpace: "pre-wrap",
                    border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                  }}
                >
                  {msg.isTyping ? <TypingIndicator /> : renderText(msg.content, msg.role === "user")}
                </div>

                {/* Profile buttons */}
                {msg.isProfile && !profileConfirmed && (
                  <div className="fade-in-up">
                    {PROFILE_OPTIONS.map((group, gi) => (
                      <div key={gi} style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                        {group.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleProfileSelect(gi, opt.value)}
                            style={{
                              background: profileSelections[gi] === opt.value ? "#FF2442" : "white",
                              color: profileSelections[gi] === opt.value ? "white" : "#444",
                              border: profileSelections[gi] === opt.value ? "2px solid #FF2442" : "2px solid #EDE5E3",
                              borderRadius: 20,
                              padding: "6px 14px",
                              fontSize: 13,
                              cursor: "pointer",
                              fontFamily: "'Noto Sans SC', sans-serif",
                              fontWeight: 500,
                              transition: "all 0.2s",
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    ))}
                    <button
                      onClick={handleProfileConfirm}
                      disabled={!allProfileSelected}
                      style={{
                        marginTop: 4,
                        background: allProfileSelected ? "linear-gradient(135deg, #FF2442, #FF6B7A)" : "#EEE",
                        color: allProfileSelected ? "white" : "#AAA",
                        border: "none",
                        borderRadius: 20,
                        padding: "8px 24px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: allProfileSelected ? "pointer" : "not-allowed",
                        fontFamily: "'Noto Sans SC', sans-serif",
                        transition: "all 0.2s",
                      }}
                    >
                      确认我的风格 ✓
                    </button>
                  </div>
                )}

                {/* Note cards + Compare card in one row */}
                {(msg.cards || msg.compareData) && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: 11, color: "#9B8B8B", marginBottom: 6, letterSpacing: 0.5 }}>
                      📝 笔记来源
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "stretch" }}>
                      {msg.compareData && (
                        <div style={{ flex: "1 1 0", minWidth: 0 }}>
                          <CompareCard a={msg.compareData.a} b={msg.compareData.b} />
                        </div>
                      )}
                      {msg.cards && msg.cards.slice(0, 3).map((card) => (
                        <div key={card.id} style={{ flex: "1 1 0", minWidth: 0 }}>
                          <NoteCardUI card={card} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Export button */}
                {msg.showExport && <ExportButton />}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Demo input bar */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            background: "white",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          {demoIndex < DEMO_INPUTS.length ? (
            <>
              <div
                style={{
                  flex: 1,
                  background: "#F5F0EE",
                  borderRadius: 24,
                  padding: "12px 18px",
                  fontSize: 14,
                  color: "#9B8B8B",
                  border: "1.5px solid var(--border)",
                }}
              >
                {DEMO_INPUTS[demoIndex]}
              </div>
              <button
                onClick={handleDemoClick}
                disabled={loading || (demoIndex > 0 && !profileConfirmed && demoIndex === 1)}
                className={demoIndex === 0 && !loading ? "send-pulse" : ""}
                style={{
                  background: loading ? "#EEE" : "linear-gradient(135deg, #FF2442, #FF6B7A)",
                  color: loading ? "#AAA" : "white",
                  border: "none",
                  borderRadius: 24,
                  padding: "12px 20px",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "'Noto Sans SC', sans-serif",
                  whiteSpace: "nowrap",
                  boxShadow: loading ? "none" : "0 4px 12px rgba(255,36,66,0.3)",
                  transition: "all 0.2s",
                }}
              >
                发送 →
              </button>
            </>
          ) : (
            <FreeInput onSend={sendMessage} loading={loading} currentStep={currentStep} />
          )}
        </div>
      </div>

      {/* ── Right: Panel ── */}
      <RightPanel currentStep={currentStep} visible={panelVisible} />
    </div>
  );
}
