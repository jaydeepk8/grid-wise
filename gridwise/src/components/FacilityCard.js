"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function FacilityCard({
  id,
  imageSrc,
  category,
  name,
}) {
  const router = useRouter();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white/40 overflow-hidden">

      <div className="relative h-48 overflow-hidden">
        <Image
          src={imageSrc}
          alt={name}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-6">

        <div className="mb-5">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
            {category}
          </p>
          <h3 className="text-xl text-[#2d3a2d] font-semibold">
            {name}
          </h3>
        </div>

        <button
          onClick={() => router.push(`/facility/${id}`)}
          className="w-full py-3 bg-[#f1f4f1] hover:bg-[#4a6741] hover:text-white text-[#4a6741] font-semibold text-sm rounded-2xl transition-all"
        >
          View Details →
        </button>

      </div>
    </div>
  );
}