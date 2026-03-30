"use client";
/**
 * @file cloudflare-stream-player.tsx — Responsive Cloudflare Stream video player.
 * Renders an iframe embed using the customer-specific Stream URL with 16:9
 * aspect ratio. Used by the lesson viewer to display AI Avatar lesson videos
 * when a video_url (Stream video ID) is available.
 */

interface CloudflareStreamPlayerProps {
  /** Cloudflare Stream video ID */
  videoId: string;
}

const STREAM_CUSTOMER_CODE = process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE ?? "";

/**
 * Responsive Cloudflare Stream iframe player.
 * Maintains 16:9 aspect ratio via padding-top technique.
 */
export default function CloudflareStreamPlayer({ videoId }: CloudflareStreamPlayerProps) {
  const src = `https://customer-${STREAM_CUSTOMER_CODE}.cloudflarestream.com/${videoId}/iframe`;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ paddingTop: "56.25%" }}
    >
      <iframe
        src={src}
        title="Lesson video"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: "none",
        }}
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
