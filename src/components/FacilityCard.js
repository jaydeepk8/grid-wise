"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function FacilityCard({
  imageSrc,
  status,
  statusColor,
  category,
  name,
  score,
  dailyLoad,
  source,
}) {
  const router = useRouter();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white/40 overflow-hidden">

      {/* Image section */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={imageSrc}
          alt={name}
          fill
          className="object-cover"
          priority
        />

        {/* Status badge */}
        <div
          className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/90 ${statusColor}`}
        >
          {status}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
              {category}
            </p>
            <h3 className="text-xl text-[#2d3a2d] font-semibold">
              {name}
            </h3>
          </div>

          {/* Score ring */}
          <div className="relative w-12 h-12">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="#f1f4f1"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="#4a6741"
                strokeWidth="3"
                strokeDasharray="100"
                strokeDashoffset={100 - score}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#4a6741]">
              {score}
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm border-t border-[#e2e8e2]/60 pt-4">
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-bold">
              Daily Load
            </p>
            <p className="font-medium text-[#2d3a2d]">
              {dailyLoad}
            </p>
          </div>

          <div>
            <p className="text-slate-400 text-[10px] uppercase font-bold">
              Main Source
            </p>
            <p className="font-medium text-[#2d3a2d]">
              {source}
            </p>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={() => router.push("/insights")}
          className="w-full py-3 bg-[#f1f4f1] hover:bg-[#4a6741] hover:text-white text-[#4a6741] font-semibold text-sm rounded-2xl transition-all"
        >
          View Details →
        </button>

      </div>
    </div>
  );
}
