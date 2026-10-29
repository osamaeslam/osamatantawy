import React, { useState, useEffect } from "react";
import { MessageCircle, X, Send, Phone, CheckCircle2 } from "lucide-react";

interface Props {
  phoneNumber: string; // رقم الخط الساخن أو رقم البوت
}

export const WhatsAppChatWidget: React.FC<Props> = ({ phoneNumber }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; sender: "bot" | "user" }[]>([
    { text: "أهلاً! كيف يمكنني مساعدتك في طلبات طنطاوي جروب؟", sender: "bot" },
  ]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && input.trim()) {
        sendMessage();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [input]);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { text: input, sender: "user" }]);
    setInput("");
    // यहां يتم استدعاء 웹 هوك البوت في مرحلة لاحقة
    setMessages((prev) => [
      ...prev,
      { text: "جارٍ معالجة رسالتك...", sender: "bot" },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* زر الفتح العائم */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl transition hover:scale-105 group"
          aria-label="تحدث مع مبيعات طنطاوي جروب واتساب"
          title="تحدث مع مبيعات طنطاوي جروب واتساب"
        >
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse" />
          <MessageCircle size={28} />
        </button>
      )}

      {/* نافذة الدردشة */}
      {isOpen && (
        <div className="flex flex-col h-[520px] w-[340px] bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
                <MessageCircle size={22} />
              </div>
              <div>
                <h3 className="font-black text-sm">مبيعات طنطاوي جروب</h3>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                  <span className="w-2 h-2 bg-yellow-300 rounded-full inline-block animate-ping" />
                  <span>متصل الآن • رد فوري</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 p-1.5 rounded-full hover:bg-emerald-700 transition"
              aria-label="إغلاق الدردشة"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Direct WhatsApp App Link */}
          <div className="bg-emerald-50 px-3 py-2 border-b border-emerald-100 flex items-center justify-between text-xs">
            <span className="text-emerald-950 font-bold">تفضل التحدث في تطبيق واتساب؟</span>
            <a
              href={`https://wa.me/201521800000?text=${encodeURIComponent('السلام عليكم فريق مبيعات طنطاوي جروب، أود الاستفسار عن الأجهزة المنزلية المتاحة والمعاينة المجانية')}`}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition shadow-xs"
            >
              فتح واتساب 📲
            </a>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[80%] p-3 rounded-lg ${
                  m.sender === "user"
                    ? "bg-blue-500 text-white ml-auto rounded-tr-none"
                    : "bg-white text-gray-900 mr-auto rounded-tl-none border border-gray-100"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-200 bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب رسالتك..."
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="bg-green-500 text-white p-2 rounded-lg disabled:bg-gray-300 hover:bg-green-600 transition"
              aria-label="إرسال"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};