import { X, Play, Download } from "lucide-react";
import { Stream } from "@/lib/api-types";
import { cn } from "@/lib/utils";

interface QualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  streams: Stream[];
  title: string;
  mode: 'stream' | 'download';
  onSelectStream?: (stream: Stream) => void;
  episodeLabel?: string;
}

function formatSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)}GB`;
  }
  return `${Math.round(mb)}MB`;
}

function getQualityLabel(stream: Stream, index: number): string {
  if (stream.resolutions) return stream.resolutions;
  if (stream.format) return stream.format.toUpperCase();
  return `Quality ${index + 1}`;
}

export function QualityModal({ isOpen, onClose, streams, title, mode, onSelectStream, episodeLabel }: QualityModalProps) {
  if (!isOpen) return null;

  const displayTitle = episodeLabel ? `${title} - ${episodeLabel}` : title;

  const handleStreamClick = (stream: Stream) => {
    if (mode === 'stream') {
      if (onSelectStream) {
        onSelectStream(stream);
      }
      onClose();
    }
  };

  const handleDownloadClick = (stream: Stream) => {
    const url = stream.downloadUrl || stream.proxyUrl || stream.url;
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${displayTitle}.mp4`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-zinc-800">
          <h3 className="text-white font-bold text-base">
            {mode === 'stream' ? 'Select Quality to Stream' : 'Select Quality to Download'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-zinc-800">
          <p className="text-gray-300 text-sm font-medium line-clamp-2">{displayTitle}</p>
        </div>

        <div className="py-2 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {streams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No streams available</p>
            </div>
          ) : (
            streams.map((stream, i) => {
              const quality = getQualityLabel(stream, i);
              const size = formatSize(stream.size || stream.fileSize);
              const format = stream.format?.toUpperCase() || 'MP4';

              return (
                <button
                  key={stream.id || i}
                  onClick={() => mode === 'stream' ? handleStreamClick(stream) : handleDownloadClick(stream)}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 transition-colors text-left group",
                    "hover:bg-zinc-800 border-b border-zinc-800/50 last:border-0"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                    mode === 'stream'
                      ? "bg-red-600/20 text-red-400 group-hover:bg-red-600 group-hover:text-white"
                      : "bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white"
                  )}>
                    {mode === 'stream'
                      ? <Play className="h-4 w-4 fill-current" />
                      : <Download className="h-4 w-4" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">{quality}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {size && <span className="text-gray-400 text-xs">{size}</span>}
                      {size && <span className="text-gray-600 text-xs">·</span>}
                      <span className="text-gray-400 text-xs">{format}</span>
                    </div>
                  </div>
                  <div className={cn(
                    "text-xs font-semibold px-2 py-1 rounded-md",
                    mode === 'stream' ? "text-red-400 bg-red-600/10" : "text-blue-400 bg-blue-600/10"
                  )}>
                    {mode === 'stream' ? 'Play' : 'DL'}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
