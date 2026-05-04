import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useWatchHistory } from "@/hooks/use-local-state";
import { ArrowLeft, Clock, Trash2, X, Film, Tv } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function groupByDate(items: ReturnType<typeof useWatchHistory>['history']) {
  const groups: Record<string, typeof items> = {};
  for (const item of items) {
    const key = formatDate(item.watchedAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

export default function WatchHistory() {
  const { history, removeFromHistory, clearHistory } = useWatchHistory();

  const grouped = groupByDate(history);
  const dateKeys = Object.keys(grouped);

  return (
    <Layout>
      <div className="pt-24 px-6 md:px-14 max-w-screen-2xl mx-auto w-full min-h-screen pb-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 transition-all"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white">Watch History</h1>
              <p className="text-gray-400 text-sm mt-1">{history.length} item{history.length !== 1 ? 's' : ''} watched</p>
            </div>
          </div>

          {history.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all watch history?')) clearHistory();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-red-900/40 hover:border-red-600/50 text-gray-300 hover:text-red-400 text-sm font-medium transition-all"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Clock className="h-16 w-16 text-zinc-700 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Watch History</h3>
            <p className="text-gray-500 text-sm mb-6">Movies and shows you watch will appear here.</p>
            <Link href="/">
              <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">
                Browse Content
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {dateKeys.map(dateKey => (
              <div key={dateKey}>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {dateKey}
                </h2>
                <div className="space-y-3">
                  {grouped[dateKey].map((item, i) => {
                    const type = item.type;
                    const episodeLabel = item.season && item.episode
                      ? `S${item.season}E${item.episode}`
                      : null;

                    return (
                      <div
                        key={`${item.id}-${i}`}
                        className="flex items-center gap-4 bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 hover:border-zinc-600 transition-all group"
                      >
                        <div className="w-12 h-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                          {item.poster ? (
                            <img
                              src={item.poster}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {type === 'tv' ? <Tv className="h-5 w-5 text-zinc-600" /> : <Film className="h-5 w-5 text-zinc-600" />}
                            </div>
                          )}
                        </div>

                        <Link
                          href={`/${type}/${item.id}`}
                          className="flex-1 min-w-0 hover:text-red-400 transition-colors"
                        >
                          <p className="text-white font-semibold text-sm line-clamp-1">{item.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                              "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border",
                              type === 'tv' ? "text-blue-400 border-blue-400/30 bg-blue-400/10" : "text-red-400 border-red-400/30 bg-red-400/10"
                            )}>
                              {type === 'tv' ? 'TV' : 'Movie'}
                            </span>
                            {episodeLabel && (
                              <span className="text-xs text-gray-400 font-medium">{episodeLabel}</span>
                            )}
                            <span className="text-xs text-gray-500">{formatTime(item.watchedAt)}</span>
                          </div>
                        </Link>

                        <button
                          onClick={() => removeFromHistory(item.id, item.season, item.episode)}
                          className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0"
                          title="Remove from history"
                        >
                          <X className="h-3.5 w-3.5 text-white" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
