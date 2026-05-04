import { useState } from "react";

interface CastCardProps {
  name: string;
  role?: string;
  avatarUrl?: string;
}

export function CastCard({ name, role, avatarUrl }: CastCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const initial = name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="flex flex-col items-center w-20 shrink-0 text-center gap-2">
      <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-700 border-2 border-zinc-600 flex items-center justify-center">
        {avatarUrl && !imgFailed ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="text-lg font-bold text-zinc-200">{initial}</span>
        )}
      </div>
      <p className="text-xs font-medium leading-tight text-white line-clamp-2">{name}</p>
      {role && <p className="text-[10px] text-gray-500 line-clamp-1">{role}</p>}
    </div>
  );
}
