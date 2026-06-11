'use client';

import Image from 'next/image';

interface BannerSectionProps {
  countryName: string;
  leaderName: string;
  countryMotto: string;
  flagUrl: string;
  bannerUrl: string;
  approval: number;
  confidence: number;
}

export default function BannerSection({
  countryName,
  leaderName,
  countryMotto,
  flagUrl,
  bannerUrl,
  approval,
  confidence,
}: BannerSectionProps) {
  return (
    <div className="space-y-4">
      <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden border border-purple-500/20">
        <Image
          src={
            bannerUrl ||
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop'
          }
          alt={countryName}
          fill
          className="object-cover"
          priority
        />

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900/80"></div>

        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-4">
          <div className="w-16 h-16 rounded-lg border-2 border-white/30 overflow-hidden bg-gray-700 flex-shrink-0">
            <Image
              src={
                flagUrl ||
                'https://via.placeholder.com/64?text=Bandeira'
              }
              alt={`Bandeira de ${countryName}`}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 text-white">
            <h2 className="text-3xl md:text-4xl font-bold">{countryName}</h2>
            <p className="text-sm text-gray-300 mt-1">Líder: {leaderName}</p>
            <p className="text-xs text-purple-300 italic mt-2">"{countryMotto}"</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800/50 border border-purple-500/20 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-blue-400">APROVAÇÃO</label>
            <span className="text-sm font-bold text-white">{approval}%</span>
          </div>
          <div className="w-full h-6 bg-gray-700 rounded-full overflow-hidden border border-blue-500/20">
            <div
              className={`h-full transition-all flex items-center justify-center text-xs font-bold text-white ${
                approval >= 70
                  ? 'bg-gradient-to-r from-green-600 to-green-500'
                  : approval >= 40
                  ? 'bg-gradient-to-r from-yellow-600 to-yellow-500'
                  : 'bg-gradient-to-r from-red-600 to-red-500'
              }`}
              style={{ width: `${approval}%` }}
            >
              {approval > 15 && <span>{approval}%</span>}
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-purple-500/20 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-green-400">CONFIANÇA</label>
            <span className="text-sm font-bold text-white">{confidence}%</span>
          </div>
          <div className="w-full h-6 bg-gray-700 rounded-full overflow-hidden border border-green-500/20">
            <div
              className={`h-full transition-all flex items-center justify-center text-xs font-bold text-white ${
                confidence >= 70
                  ? 'bg-gradient-to-r from-green-600 to-green-500'
                  : confidence >= 40
                  ? 'bg-gradient-to-r from-yellow-600 to-yellow-500'
                  : 'bg-gradient-to-r from-red-600 to-red-500'
              }`}
              style={{ width: `${confidence}%` }}
            >
              {confidence > 15 && <span>{confidence}%</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}