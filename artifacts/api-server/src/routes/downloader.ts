import { Router } from "express";

const router = Router();

const SILVA = "https://api.silvatech.co.ke/download";
const KEITH = "https://apiskeith.vercel.app/download";
const JERRY = "https://jerrycoder.oggyapi.workers.dev";

const FETCH_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://www.google.com/",
};

router.get("/dl/proxy", async (req, res) => {
  const { url, name } = req.query as Record<string, string>;
  if (!url) { res.status(400).json({ error: "Missing url" }); return; }
  try {
    const upstream = await fetch(decodeURIComponent(url), {
      headers: {
        "User-Agent": FETCH_HEADERS["User-Agent"],
        "Referer": "https://www.google.com/",
      },
    });
    if (!upstream.ok) throw new Error(`Upstream ${upstream.status}`);
    const ct = upstream.headers.get("content-type") ?? "application/octet-stream";
    const cl = upstream.headers.get("content-length");
    const ext = ct.includes("audio") ? "mp3" : ct.includes("video") ? "mp4" : ct.includes("image") ? "jpg" : "mp4";
    const filename = (name ? decodeURIComponent(name) : "download").replace(/[^a-z0-9_\-. ]/gi, "_");
    res.setHeader("Content-Type", ct);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.${ext}"`);
    if (cl) res.setHeader("Content-Length", cl);
    res.setHeader("Access-Control-Allow-Origin", "*");
    const body = upstream.body as any;
    if (body && body.pipe) {
      body.pipe(res);
    } else if (body) {
      const reader = (body as ReadableStream).getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { res.end(); break; }
          res.write(Buffer.from(value));
        }
      };
      await pump();
    } else {
      const buf = await upstream.arrayBuffer();
      res.end(Buffer.from(buf));
    }
  } catch (err: any) {
    if (!res.headersSent) res.status(500).json({ error: err.message || "Proxy failed" });
  }
});

async function proxyFetch(url: string): Promise<any> {
  const res = await fetch(url, { headers: FETCH_HEADERS });
  if (!res.ok) throw new Error(`Upstream error: ${res.status} ${res.statusText}`);
  return res.json();
}

router.get("/dl/download", async (req, res) => {
  const { platform, url, variant } = req.query as Record<string, string>;

  if (!platform || !url) {
    res.status(400).json({ error: "Missing platform or url" });
    return;
  }

  try {
    const enc = encodeURIComponent(url);
    let data: any;

    switch (platform) {
      case "youtube":
        if (variant === "mp3") {
          data = await proxyFetch(`${SILVA}/ytmp3?url=${enc}`);
          if (!data?.status) throw new Error(data?.message || data?.error || "Could not fetch audio");
          const r = data.result;
          const audioUrl = r.dl_link || r.direct_audio_url || r.download_url || "";
          if (!audioUrl) throw new Error("No audio link returned");
          res.json({ ok: true, title: r.title, thumbnail: r.thumbnail, channel: r.channel, links: [{ label: "Download MP3", url: audioUrl, type: "audio" }] });
        } else {
          data = await proxyFetch(`${SILVA}/ytmp4?url=${enc}`);
          if (!data?.status) throw new Error(data?.message || data?.error || "Could not fetch video");
          const r = data.result;
          const videoUrl = r.direct_video_url || r.download_url || r.dl_link || r.watch_url || r.embed_url || "";
          if (!videoUrl) throw new Error("No video link returned");
          res.json({ ok: true, title: r.title, thumbnail: r.thumbnail, channel: r.channel, links: [{ label: "Download MP4", url: videoUrl, type: "video" }] });
        }
        return;

      case "tiktok":
        data = await proxyFetch(`${SILVA}/tiktokdl?url=${enc}`);
        if (!data?.status) throw new Error(data?.message || data?.error || "Could not fetch TikTok video");
        {
          const r = data.result;
          const dlUrl = r.download_url || r.play_url || r.video_url || r.dl_link || r.video || "";
          if (!dlUrl) throw new Error("No download link returned");
          res.json({ ok: true, title: r.title || r.caption, thumbnail: r.thumbnail || r.cover, links: [{ label: "Download Video", url: dlUrl, type: "video" }] });
        }
        return;

      case "twitter":
        data = await proxyFetch(`${SILVA}/twitter?url=${enc}`);
        if (!data?.status) throw new Error(data?.message || data?.error || "Could not fetch Twitter video");
        {
          const r = data.result;
          const links: { label: string; url: string; type: string }[] = [];
          if (r.audio && !r.audio.includes("undefined") && !r.audio.includes("null")) links.push({ label: "Download Video", url: r.audio, type: "video" });
          if (r.video && !r.video.includes("undefined")) links.push({ label: "Download HD Video", url: r.video, type: "video" });
          if (r.download_url && !r.download_url.includes("undefined")) links.push({ label: "Download", url: r.download_url, type: "video" });
          if (links.length === 0) throw new Error("No download link returned — tweet may have no video");
          res.json({ ok: true, title: r.desc || r.title, thumbnail: r.thumbnail, links });
        }
        return;

      case "instagram":
        data = await proxyFetch(`${KEITH}/instadl?url=${enc}`);
        if (!data?.status) throw new Error(data?.message || data?.error || "Could not fetch Instagram content");
        {
          const r = data.result;
          const dlUrl = r.download_url || r.video_url || r.url || r.media_url || r.image_url || "";
          if (!dlUrl) throw new Error("No download link returned — try a public post link");
          res.json({ ok: true, title: r.title, thumbnail: r.thumbnail, links: [{ label: "Download", url: dlUrl, type: "media" }] });
        }
        return;

      case "facebook":
        data = await proxyFetch(`${KEITH}/fbdown?url=${enc}`);
        if (!data?.status) throw new Error(data?.message || data?.error || "Could not fetch Facebook video");
        {
          const r = data.result;
          const links: { label: string; url: string; type: string }[] = [];
          if (r.hd) links.push({ label: "Download HD", url: r.hd, type: "video" });
          if (r.sd) links.push({ label: "Download SD", url: r.sd, type: "video" });
          if (r.download_url) links.push({ label: "Download", url: r.download_url, type: "video" });
          if (links.length === 0) throw new Error("No download link returned — try a public Facebook video");
          res.json({ ok: true, title: r.title, thumbnail: r.thumbnail, links });
        }
        return;

      case "snapchat":
        data = await proxyFetch(`${JERRY}/snap?url=${enc}`);
        {
          const medias: any[] = data?.medias || [];
          if (medias.length === 0) throw new Error("No media found — try a public Snap story or spotlight link");
          const links = medias
            .filter((m: any) => m.url)
            .map((m: any, i: number) => ({
              label: m.type === "video" ? `Download Video ${i + 1}${m.quality ? ` (${m.quality})` : ""}` : `Download Image ${i + 1}${m.quality ? ` (${m.quality})` : ""}`,
              url: m.url,
              type: m.type === "video" ? "video" : "image",
              thumb: m.thumbnail,
            }));
          if (links.length === 0) throw new Error("No download links found");
          res.json({ ok: true, title: data.title, thumbnail: data.thumbnail || links[0]?.thumb, links });
        }
        return;

      default:
        res.status(400).json({ error: "Unknown platform" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch" });
  }
});

export default router;
