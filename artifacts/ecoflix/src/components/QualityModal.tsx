import { useState } from "react";
import { X, Play, Download, Subtitles, Video, Check } from "lucide-react";
import { Stream } from "@/lib/api-types";
import { cn } from "@/lib/utils";

interface SubtitleItem {
  label?: string;
  language?: string;
  lang?: string;
  url?: string;
  src?: string;
}

interface QualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  streams: Stream[];
  title: string;
  mode: "stream" | "download";
  onSelectStream?: (stream: Stream) => void;
  episodeLabel?: string;
  subtitles?: SubtitleItem[];
}

function formatSize(bytes?: number): string {
  if (!bytes || bytes === 0) return "";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)}GB`;
  return `${Math.round(mb)}MB`;
}

function getQualityLabel(stream: Stream, index: number): string {
  if (stream.resolutions) return `${stream.resolutions}p`;
  if (stream.format) return stream.format.toUpperCase();
  return `Quality ${index + 1}`;
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function QualityModal({
  isOpen,
  onClose,
  streams,
  title,
  mode,
  onSelectStream,
  episodeLabel,
  subtitles = [],
}: QualityModalProps) {
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [downloadStep, setDownloadStep] = useState<"type" | "subtitles" | null>(null);

  if (!isOpen) return null;

  const displayTitle = episodeLabel ? `${title} - ${episodeLabel}` : title;
  const safeFilename = displayTitle.replace(/[^a-z0-9\s\-_.]/gi, "").trim();
  const hasSubtitles = subtitles.length > 0;

  const handleQualitySelect = (stream: Stream) => {
    if (mode === "stream") {
      if (onSelectStream) onSelectStream(stream);
      onClose();
      return;
    }
    setSelectedStream(stream);
    setDownloadStep("type");
  };

  const handleVideoOnly = () => {
    if (!selectedStream) return;
    const url = selectedStream.downloadUrl || selectedStream.proxyUrl || selectedStream.url;
    if (url) triggerDownload(url, `${safeFilename}.mp4`);
    onClose();
    resetState();
  };

  const handleVideoWithSubtitles = () => {
    if (!hasSubtitles) {
      handleVideoOnly();
      return;
    }
    setDownloadStep("subtitles");
  };

  const handleSubtitleDownload = (sub: SubtitleItem) => {
    if (!selectedStream) return;
    const videoUrl = selectedStream.downloadUrl || selectedStream.proxyUrl || selectedStream.url;
    if (videoUrl) triggerDownload(videoUrl, `${safeFilename}.mp4`);
    const subUrl = sub.url || sub.src;
    if (subUrl) {
      setTimeout(() => {
        const label = sub.label || sub.language || sub.lang || "subtitle";
        triggerDownload(subUrl, `${safeFilename}.${label}.vtt`);
      }, 500);
    }
    onClose();
    resetState();
  };

  const resetState = () => {
    setSelectedStream(null);
    setDownloadStep(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleBack = () => {
    if (downloadStep === "subtitles") setDownloadStep("type");
    else if (downloadStep === "type") { setSelectedStream(null); setDownloadStep(null); }
  };

  if (downloadStep === "subtitles") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={handleClose}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-zinc-800">
            <div>
              <button onClick={handleBack} className="text-xs text-gray-500 hover:text-gray-300 mb-1 flex items-center gap-1 transition-colors">
                ← Back
              </button>
              <h3 className="text-white font-bold text-base">Choose Subtitle Language</h3>
            </div>
            <button onClick={handleClose} className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors">
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
          <div className="px-5 py-3 border-b border-zinc-800">
            <p className="text-gray-400 text-xs">Both video and the selected subtitle file will download.</p>
          </div>
          <div className="py-2 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
            {subtitles.map((sub, i) => {
              const label = sub.label || sub.language || sub.lang || `Subtitle ${i + 1}`;
              return (
                <button
                  key={i}
                  onClick={() => handleSubtitleDownload(sub)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zinc-800 border-b border-zinc-800/50 last:border-0 transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-green-600/20 text-green-400 group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <Download className="h-4 w-4" />
                  </div>
                  <span className="text-white font-semibold text-sm">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (downloadStep === "type") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={handleClose}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-zinc-800">
            <div>
              <button onClick={handleBack} className="text-xs text-gray-500 hover:text-gray-300 mb-1 flex items-center gap-1 transition-colors">
                ← Back
              </button>
              <h3 className="text-white font-bold text-base">Download Options</h3>
            </div>
            <button onClick={handleClose} className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors">
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
          <div className="px-5 py-3 border-b border-zinc-800">
            <p className="text-gray-300 text-sm font-medium line-clamp-2">{displayTitle}</p>
            <p className="text-gray-500 text-xs mt-1">{getQualityLabel(selectedStream!, 0)}</p>
          </div>
          <div className="p-5 space-y-3">
            <button
              onClick={handleVideoOnly}
              className="w-full flex items-center gap-4 px-5 py-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 rounded-xl transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Video className="h-4 w-4" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Video Only</p>
                <p className="text-gray-500 text-xs mt-0.5">Download the video file only</p>
              </div>
            </button>

            <button
              onClick={handleVideoWithSubtitles}
              className="w-full flex items-center gap-4 px-5 py-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 rounded-xl transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-600/20 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Subtitles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Video + Subtitles</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {hasSubtitles ? `Choose from ${subtitles.length} subtitle track${subtitles.length !== 1 ? "s" : ""}` : "Download video with subtitle file"}
                </p>
              </div>
              {!hasSubtitles && <span className="ml-auto text-xs text-zinc-600 bg-zinc-800 px-2 py-1 rounded">Same as above</span>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-zinc-800">
          <h3 className="text-white font-bold text-base">
            {mode === "stream" ? "Select Quality to Stream" : "Select Quality to Download"}
          </h3>
          <button onClick={handleClose} className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors">
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
        <div className="px-5 py-3 border-b border-zinc-800">
          <p className="text-gray-300 text-sm font-medium line-clamp-2">{displayTitle}</p>
        </div>
        <div className="py-2 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          {streams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No streams available</p>
            </div>
          ) : (
            streams.map((stream, i) => {
              const quality = getQualityLabel(stream, i);
              const size = formatSize(stream.size || stream.fileSize);
              const format = stream.format?.toUpperCase() || "MP4";
              return (
                <button
                  key={stream.id || i}
                  onClick={() => handleQualitySelect(stream)}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 transition-colors text-left group",
                    "hover:bg-zinc-800 border-b border-zinc-800/50 last:border-0"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                    mode === "stream"
                      ? "bg-red-600/20 text-red-400 group-hover:bg-red-600 group-hover:text-white"
                      : "bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white"
                  )}>
                    {mode === "stream" ? <Play className="h-4 w-4 fill-current" /> : <Download className="h-4 w-4" />}
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
                    mode === "stream" ? "text-red-400 bg-red-600/10" : "text-blue-400 bg-blue-600/10"
                  )}>
                    {mode === "stream" ? "Play" : "DL"}
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
