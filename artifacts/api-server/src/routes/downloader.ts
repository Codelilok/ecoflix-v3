import { Router } from "express";

const router = Router();

const CASPER_DL = "https://apis.xcasper.space/api/downloader";
const KEITH = "https://apiskeith.vercel.app/download";
const JERRY = "https://jerrycoder.oggyapi.workers.dev";

const FETCH_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://www.google.com/",
};

async function proxyFetch(url: string): Promise<any> {
  const res = await fetch(url, { headers: FETCH_HEADERS });
  if (!res.ok) throw new Error(`Upstream error: ${res.status} ${res.statusText}`);
  return res.json();
}

function cleanUrl(raw: string): string {
  return raw.replace(/['")\s]+$/, "").trim();
}

function refererFor(url: string): string {
  if (url.includes("twimg.com") || url.includes("twitter.com") || url.includes("x.com")) return "https://x.com/";
  if (url.includes("instagram.com") || url.includes("cdninstagram.com") || url.includes("ssscdn.io")) return "https://www.instagram.com/";
  if (url.includes("tiktok.com") || url.includes("ssstik")) return "https://www.tiktok.com/";
  if (url.includes("snapchat.com") || url.includes("sc-cdn.net")) return "https://www.snapchat.com/";
  return "https://www.google.com/";
}

async function streamUpstream(upstreamUrl: string, filename: string, res: any) {
  const upstream = await fetch(upstreamUrl, {
    headers: { "User-Agent": FETCH_HEADERS["User-Agent"], "Referer": refererFor(upstreamUrl) },
    redirect: "follow",
  });
  if (!upstream.ok) throw new Error(`Upstream returned ${upstream.status}`);
  const ct = upstream.headers.get("content-type") ?? "application/octet-stream";
  if (ct.includes("text/html") || ct.includes("application/json")) {
    throw new Error("Upstream returned a page instead of a media file");
  }
  const cl = upstream.headers.get("content-length");
  const ext = ct.includes("audio") ? "mp3" : ct.includes("video") ? "mp4" : ct.includes("image") ? "jpg" : "mp4";
  const safe = filename.replace(/[^a-z0-9_\-. ]/gi, "_");
  res.setHeader("Content-Type", ct);
  res.setHeader("Content-Disposition", `attachment; filename="${safe}.${ext}"`);
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (cl) res.setHeader("Content-Length", cl);
  const body = upstream.body as any;
  if (body && body.pipe) {
    body.pipe(res);
  } else if (body) {
    const reader = (body as ReadableStream).getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) { res.end(); break; }
      res.write(Buffer.from(value));
    }
  } else {
    res.end(Buffer.from(await upstream.arrayBuffer()));
  }
}

/* ── Proxy: stream any CDN URL through our server ── */
router.get("/dl/proxy", async (req, res) => {
  const { url, name } = req.query as Record<string, string>;
  if (!url) { res.status(400).json({ error: "Missing url" }); return; }
  try {
    await streamUpstream(decodeURIComponent(url), name ? decodeURIComponent(name) : "download", res);
  } catch (err: any) {
    if (!res.headersSent) res.status(500).json({ error: err.message || "Proxy failed" });
  }
});

/* ── YouTube: resolve + stream (type=video uses ytmp6, type=audio uses yt-dl3) ── */
router.get("/dl/yt-stream", async (req, res) => {
  const { url, type } = req.query as Record<string, string>;
  if (!url) { res.status(400).json({ error: "Missing url" }); return; }
  try {
    const endpoint = type === "audio" ? "yt-dl3" : "ytmp6";
    const json = await proxyFetch(`${CASPER_DL}/${endpoint}?url=${encodeURIComponent(url)}`);
    if (!json.success) throw new Error(json.message || "Could not fetch YouTube media");
    // yt-dl3 (audio): json.url = original YT URL, json.download_url = actual mp3 stream
    // ytmp6  (video): json.url = actual mp4 stream URL
    const dlUrl: string = type === "audio"
      ? (json.download_url ?? json.url ?? "")
      : (json.url ?? json.download_url ?? "");
    if (!dlUrl) throw new Error("No download URL returned");
    const title = (json.title ?? "youtube-video").slice(0, 80);
    await streamUpstream(dlUrl, title, res);
  } catch (err: any) {
    if (!res.headersSent) res.status(500).json({ error: err.message || "YouTube stream failed" });
  }
});

/* ── YouTube metadata: returns both MP4 and MP3 options ── */
router.get("/dl/yt-info", async (req, res) => {
  const { url } = req.query as Record<string, string>;
  if (!url) { res.status(400).json({ error: "Missing url" }); return; }
  try {
    const [videoJson, audioJson] = await Promise.allSettled([
      proxyFetch(`${CASPER_DL}/ytmp6?url=${encodeURIComponent(url)}`),
      proxyFetch(`${CASPER_DL}/yt-dl3?url=${encodeURIComponent(url)}`),
    ]);
    const video = videoJson.status === "fulfilled" && videoJson.value?.success ? videoJson.value : null;
    const audio = audioJson.status === "fulfilled" && audioJson.value?.success ? audioJson.value : null;
    if (!video && !audio) throw new Error("Could not fetch YouTube info");
    const enc = encodeURIComponent(url);
    const links: any[] = [];
    if (video) links.push({ label: `Video MP4 (${video.quality ?? "360p"})`, streamUrl: `/api/dl/yt-stream?url=${enc}&type=video`, type: "video" });
    if (audio) links.push({ label: `Audio MP3 (${audio.quality ?? "128kbps"})`, streamUrl: `/api/dl/yt-stream?url=${enc}&type=audio`, type: "audio" });
    const meta = video ?? audio;
    res.json({ ok: true, title: meta.title, thumbnail: meta.thumbnail, links });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch" });
  }
});

/* ── YouTube Search ── */
router.get("/dl/yt-search", async (req, res) => {
  const { q } = req.query as Record<string, string>;
  if (!q) { res.status(400).json({ error: "Missing q" }); return; }
  try {
    const json = await proxyFetch(`https://apis.xcasper.space/api/search/youtube?query=${encodeURIComponent(q)}`);
    if (!json.success) throw new Error(json.message || "Search failed");
    res.json({ ok: true, videos: json.videos ?? [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Search failed" });
  }
});

/* ── Twitter/X ── */
router.get("/dl/twitter-info", async (req, res) => {
  const { url } = req.query as Record<string, string>;
  if (!url) { res.status(400).json({ error: "Missing url" }); return; }
  try {
    const json = await proxyFetch(`${CASPER_DL}/x?url=${encodeURIComponent(url)}`);
    if (!json.success) throw new Error(json.message || "Could not fetch tweet");
    const media: any[] = json.media ?? [];
    const seen = new Set<string>();
    const links: any[] = [];
    for (const m of media) {
      const clean = cleanUrl(m.downloadUrl ?? "");
      if (!clean || !clean.startsWith("http") || seen.has(clean)) continue;
      seen.add(clean);
      links.push({ label: m.quality ?? "Video", url: clean, type: "video" });
    }
    if (links.length === 0) throw new Error("No video found in this tweet");
    res.json({ ok: true, title: json.text ?? json.title, thumbnail: json.thumbnail, links });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch" });
  }
});

/* ── Facebook ── */
router.get("/dl/facebook-info", async (req, res) => {
  const { url } = req.query as Record<string, string>;
  if (!url) { res.status(400).json({ error: "Missing url" }); return; }
  try {
    const json = await proxyFetch(`${CASPER_DL}/fb?url=${encodeURIComponent(url)}`);
    const downloads: any[] = json.downloads ?? [];
    const links = downloads.filter((d: any) => d.url).map((d: any) => ({ label: d.quality ?? "Video", url: d.url, type: "video" }));
    if (links.length === 0 && json.primaryDownload) links.push({ label: "Download", url: json.primaryDownload, type: "video" });
    if (links.length === 0) throw new Error("No download links found — try a public Facebook video");
    res.json({ ok: true, title: json.title, thumbnail: json.thumbnail, links });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch" });
  }
});

export default router;
