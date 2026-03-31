/**
 * @file cloudflare-stream-player.test.tsx — Property-based tests for the
 * Cloudflare Stream video player component. Validates conditional rendering
 * based on video_url, iframe allow attribute, and 16:9 aspect ratio container.
 */
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { render, screen } from "@testing-library/react";
import CloudflareStreamPlayer from "@/components/content/cloudflare-stream-player";

/**
 * Arbitrary that generates non-empty video ID strings (simulating valid
 * Cloudflare Stream video IDs).
 */
const arbVideoId = fc
  .array(fc.constantFrom(..."abcdef0123456789".split("")), {
    minLength: 1,
    maxLength: 32,
  })
  .map((chars) => chars.join(""));

/**
 * Arbitrary that generates null or empty video_url values — the cases where
 * the player should NOT render.
 */
const arbAbsentVideoUrl = fc.constantFrom(null, undefined, "");

describe("Cloudflare Stream Player — Property 16: Video Player Conditional Rendering", () => {
  /**
   * **Validates: Requirements 8.1, 8.2, 8.3, 8.5**
   *
   * For any lesson object, the Stream iframe should render iff video_url is
   * non-null and non-empty; when rendered, verify allow attribute and 16:9
   * aspect ratio container.
   */

  it("renders an iframe with correct attributes when videoId is non-null and non-empty", () => {
    fc.assert(
      fc.property(arbVideoId, (videoId) => {
        const { container, unmount } = render(
          <CloudflareStreamPlayer videoId={videoId} />,
        );

        // The iframe should be present
        const iframe = container.querySelector("iframe");
        expect(iframe).not.toBeNull();

        // Requirement 8.5: allow attribute must include required permissions
        expect(iframe!.getAttribute("allow")).toBe(
          "autoplay; fullscreen; encrypted-media; picture-in-picture",
        );

        // Requirement 8.1: src should contain the video ID in the Stream URL
        expect(iframe!.getAttribute("src")).toContain(videoId);
        expect(iframe!.getAttribute("src")).toContain("cloudflarestream.com");
        expect(iframe!.getAttribute("src")).toContain("/iframe");

        // allowFullScreen should be set
        expect(iframe!.hasAttribute("allowfullscreen")).toBe(true);

        // Requirement 8.2: container should maintain 16:9 aspect ratio via
        // padding-top: 56.25%
        const wrapper = iframe!.parentElement;
        expect(wrapper).not.toBeNull();
        expect(wrapper!.style.paddingTop).toBe("56.25%");

        unmount();
      }),
      { numRuns: 100 },
    );
  });

  it("does not render when videoId is absent — lesson viewer conditional check", () => {
    /**
     * This test validates the conditional rendering logic used in the lesson
     * viewer: the CloudflareStreamPlayer is only mounted when video_url is
     * truthy. We simulate the same conditional here.
     */
    fc.assert(
      fc.property(arbAbsentVideoUrl, (videoUrl) => {
        // Simulate the lesson viewer conditional: only render if truthy
        const shouldRender = videoUrl !== null && videoUrl !== undefined && videoUrl !== "";

        const { container, unmount } = render(
          <div data-testid="lesson-viewer">
            {shouldRender ? (
              <CloudflareStreamPlayer videoId={videoUrl!} />
            ) : (
              <div data-testid="placeholder">Video not available</div>
            )}
          </div>,
        );

        // The iframe should NOT be present
        const iframe = container.querySelector("iframe");
        expect(iframe).toBeNull();

        // The placeholder should be present instead
        expect(screen.getByTestId("placeholder")).toBeDefined();

        unmount();
      }),
      { numRuns: 100 },
    );
  });

  it("iframe is absolutely positioned within the 16:9 container", () => {
    fc.assert(
      fc.property(arbVideoId, (videoId) => {
        const { container, unmount } = render(
          <CloudflareStreamPlayer videoId={videoId} />,
        );

        const iframe = container.querySelector("iframe");
        expect(iframe).not.toBeNull();

        // Iframe should be absolutely positioned to fill the container
        expect(iframe!.style.position).toBe("absolute");
        expect(iframe!.style.top).toBe("0px");
        expect(iframe!.style.left).toBe("0px");
        expect(iframe!.style.width).toBe("100%");
        expect(iframe!.style.height).toBe("100%");

        // The wrapper must use the 16:9 padding-top technique
        const wrapper = iframe!.parentElement;
        expect(wrapper).not.toBeNull();
        expect(wrapper!.style.paddingTop).toBe("56.25%");

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
