"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function FacilityCard({
  id,
  imageSrc,
  status,
  statusColor,
  category,
  name,
  score,
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
          priority
        />

       
        <div
          className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/90 ${statusColor}`}
        >
          {status}
        </div>
      </div>

      
      <div className="p-6">

        
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
              {category}
            </p>
            <h3 className="text-xl text-[#2d3a2d] font-semibold">
              {name}
            </h3>
          </div>
        </div>

       
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm border-t border-[#e2e8e2]/60 pt-4">
          <div>
          </div>
          <div>
          </div>
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