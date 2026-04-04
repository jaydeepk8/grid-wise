"use client";

import { useEffect, useState } from "react";
import { facilityConfig } from "@/lib/facilityConfig";

export default function AIInsights({ facilityId = "hospital", uploadedData = null, isReset = false }) {
  const [insights, setInsights] = useState([]);
  const [aiInsight, setAiInsight] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const config = facilityConfig[facilityId];

  if (!config.hasData) return (
    <div className="bg-white rounded-2xl p-6 shadow-sm h-full flex flex-col items-center justify-center text-center">
      <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">lightbulb</span>
      <p className="text-slate-400 font-medium">No insights yet</p>
    </div>
  );

  useEffect(() => {
    if (isReset) { setInsights([]); setAiInsight(""); return; }
    if (uploadedData) { setInsights(uploadedData.insights || []); return; }

    async function fetchInsights() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            datetime: new Date().toISOString(),
            facility_type: config.facilityType,
          }),
        });
        const result = await res.json();
        setInsights(result.insights || []);
      } catch (error) {
        console.error("AIInsights fetch error:", error);
      }
    }
    fetchInsights();
  }, [facilityId, !!uploadedData, isReset]);

  async function generateAIInsight() {
    if (!insights.length) return;
    setLoadingAI(true);
    setAiInsight("");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are an energy management expert. Based on these real-time energy insights for a ${config.name}, provide a concise 2-3 sentence expert analysis with actionable advice:

Insights:
${insights.join("\n")}

Give practical, specific advice for facility managers. Be direct and professional.`
          }]
        })
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      setAiInsight(text);
    } catch (err) {
      setAiInsight("Unable to generate AI analysis at this time.");
    } finally {
      setLoadingAI(false);
    }
  }

  if (isReset) return (
    <div className="bg-white rounded-2xl p-6 shadow-sm h-full flex flex-col items-center justify-center text-center">
      <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">upload_file</span>
      <p className="text-slate-400 font-medium">Upload data to see predictions</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4 text-black">AI Insights</h3>

      {/* Rule-based insights */}
      <ul className="space-y-3 text-black font-normal text-sm flex-1">
        {insights.length === 0 ? (
          <li className="text-slate-400">Loading insights...</li>
        ) : (
          insights.map((point, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2 text-green-600 font-bold">•</span>
              {point}
            </li>
          ))
        )}
      </ul>

      {/* Claude AI Analysis */}
      {insights.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          {!aiInsight && !loadingAI && (
            <button
              onClick={generateAIInsight}
              className="w-full flex items-center justify-center gap-2 bg-[#f1f4f1] hover:bg-[#eef3ec] text-[#4a6741] text-xs font-semibold py-2.5 rounded-xl transition"
            >
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Get Claude AI Analysis
            </button>
          )}

          {loadingAI && (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
              <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
              Claude is analyzing...
            </div>
          )}

          {aiInsight && (
            <div className="bg-[#eef3ec] rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-[#4a6741] text-sm">auto_awesome</span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#4a6741]">Claude AI Analysis</p>
              </div>
              <p className="text-xs text-[#2d3a2d] leading-relaxed">{aiInsight}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}