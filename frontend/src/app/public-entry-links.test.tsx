/* eslint-disable @next/next/no-img-element */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
    priority: _priority,
    unoptimized: _unoptimized,
    fill: _fill,
    ...props
  }: {
    alt: string;
    src: string;
    priority?: boolean;
    unoptimized?: boolean;
    fill?: boolean;
    [key: string]: unknown;
  }) => <img alt={alt} src={src} {...props} />,
}));

import LandingPage from "./page";
import PricingPage from "./pricing/page";

afterEach(() => {
  cleanup();
});

describe("public Academy entry links", () => {
  it("connects the Academy landing page to pricing and learner authentication", () => {
    render(<LandingPage />);

    expect(
      screen.getAllByRole("link", { name: /pricing/i }).some((link) => link.getAttribute("href") === "/pricing")
    ).toBe(true);
    expect(
      screen
        .getAllByRole("link", { name: /create free account/i })
        .some((link) => link.getAttribute("href") === "/learner/register")
    ).toBe(true);
    expect(
      screen
        .getAllByRole("link", { name: /learner login/i })
        .some((link) => link.getAttribute("href") === "/learner/login")
    ).toBe(true);
  });

  it("keeps pricing connected to both registration and sign-in", () => {
    render(<PricingPage />);

    expect(
      screen.getAllByRole("link", { name: /start free|create free account|get started/i })[0]
    ).toHaveAttribute("href", "/learner/register");
    expect(
      screen
        .getAllByRole("link", { name: /learner login/i })
        .some((link) => link.getAttribute("href") === "/learner/login")
    ).toBe(true);
  });
});
