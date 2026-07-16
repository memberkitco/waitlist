"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Loader2, Copy, Check, X, ArrowRight } from "lucide-react";

// --- Type Definitions ---

export type FormState = "idle" | "submitting" | "error" | "success";
export type CopyState = "idle" | "copied" | "failed";

export interface CalculatorResult {
  monthlyRevenue: number;
  annualSavings: number;
  formattedSavings: string;
}

// --- Utility Functions ---

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return false;
  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return (
    domain.includes(".") &&
    domain.indexOf(".") > 0 &&
    domain.lastIndexOf(".") < domain.length - 1
  );
}

export function calculateAnnualSavings(monthlyRevenue: number): number {
  const avgOrderValue = 30;
  const transactionsPerMonth = monthlyRevenue / avgOrderValue;
  const monthlyFees = monthlyRevenue * 0.10 + transactionsPerMonth * 0.50;
  return Math.round(monthlyFees * 12);
}

export function formatUSD(amount: number): string {
  return "$" + amount.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function generateReferralId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export async function simulateSubmission(email?: string): Promise<{ position: number; alreadyRegistered?: boolean }> {
  if (!email) {
    // Fallback for tests
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return { position: Math.floor(Math.random() * 500) + 100 };
  }

  const res = await fetch("/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to join waitlist");
  }

  return {
    position: data.position,
    alreadyRegistered: data.message === "already_registered",
  };
}

// --- Animation Variants ---

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] as const },
  },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const },
  },
};

// --- Rotating Text Hook ---

function useRotatingText(words: string[], interval = 2500) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [words.length, interval]);
  return words[index];
}

// --- Interactive Grid Background ---

function GridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const spacing = 60;
    const mouse = mouseRef.current;
    const radius = 180;

    for (let x = 0; x < canvas.width; x += spacing) {
      for (let y = 0; y < canvas.height; y += spacing) {
        const dx = x - mouse.x;
        const dy = y - (mouse.y + window.scrollY);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const intensity = dist < radius ? 1 - dist / radius : 0;
        const size = 1 + intensity * 3;
        const alpha = 0.08 + intensity * 0.4;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 213, 71, ${alpha})`;
        ctx.fill();
      }
    }
    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Defer canvas init to avoid blocking LCP
    const initTimeout = setTimeout(() => {
      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = document.documentElement.scrollHeight;
      };
      resize();
      window.addEventListener("resize", resize);

      const handleMouse = (e: MouseEvent) => {
        mouseRef.current = { x: e.clientX, y: e.clientY };
      };
      window.addEventListener("mousemove", handleMouse);

      draw();
    }, 1000); // Defer 1s to not block LCP

    return () => {
      clearTimeout(initTimeout);
      cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}

// --- Main Page Component ---

export default function WaitlistPage() {
  const [sliderValue, setSliderValue] = useState<number>(5000);
  const [email, setEmail] = useState<string>("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSignedUp, setIsSignedUp] = useState<boolean>(false);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [referralCount, setReferralCount] = useState<number>(0);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const referralIdRef = useRef<string>(generateReferralId());

  const rotatingWord = useRotatingText([
    "templates.",
    "courses.",
    "code.",
    "guides.",
    "SaaS starters.",
  ]);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#fafafa] overflow-x-hidden relative">
      <GridBackground />

      {/* ===== FLOATING NAV ===== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1f1f1f] py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <img src="/logo.svg" alt="memberkit.co" className="w-7 h-7" />
            <span className="text-sm font-bold tracking-tight text-[#fafafa] group-hover:text-[#F5D547] transition-colors">
              MEMBERKIT
            </span>
          </a>

          {/* CTA button — appears after scroll */}
          <a
            href="#join"
            className={`inline-flex items-center gap-2 bg-[#F5D547] text-[#0a0a0a] font-bold text-xs uppercase tracking-wider px-5 py-2.5 hover:bg-[#ffe566] transition-all duration-300 ${
              scrolled ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
            }`}
          >
            Join Waitlist
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <motion.div
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative z-10 min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-20 max-w-7xl mx-auto"
      >
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.p variants={fadeInUp} className="text-xs font-mono uppercase tracking-[0.4em] text-[#F5D547] mb-6">
            [ The All-In-One Creator Commerce Platform ]
          </motion.p>

          <motion.h1
            variants={fadeInUp}
            className="text-[clamp(2.8rem,7vw,6.5rem)] font-black leading-[0.92] tracking-tighter"
          >
            <span className="block">Sell digital</span>
            <span className="block">
              <AnimatePresence mode="wait">
                <motion.span
                  key={rotatingWord}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="inline-block text-[#F5D547]"
                >
                  {rotatingWord}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="block text-[#666]">Get paid instantly.</span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="mt-8 text-lg md:text-xl text-[#888] max-w-xl leading-relaxed">
            Replace your fragmented stack of 5–10 tools with one AI-powered platform.
            Zero platform fees. Instant payouts. Built for next-gen digital creators.
          </motion.p>

          <motion.div variants={fadeInUp} className="mt-10 flex flex-wrap items-center gap-4">
            <a href="#join" className="group inline-flex items-center gap-3 bg-[#F5D547] text-[#0a0a0a] font-bold px-7 py-4 text-sm uppercase tracking-wider hover:bg-[#ffe566] transition-colors">
              Join Waitlist
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#what" className="inline-flex items-center gap-2 text-[#888] hover:text-[#fafafa] font-medium text-sm uppercase tracking-wider transition-colors">
              Learn More ↓
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-5 h-8 border-2 border-[#333] rounded-full flex items-start justify-center p-1"
          >
            <div className="w-1 h-2 bg-[#F5D547] rounded-full" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ===== WHAT IS IT — Product Explanation ===== */}
      <section id="what" className="relative z-10 px-6 md:px-12 lg:px-20 py-32 max-w-7xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.p variants={fadeInUp} className="text-xs font-mono uppercase tracking-[0.4em] text-[#F5D547] mb-4">
            [ 01 — What We Build ]
          </motion.p>
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tight max-w-4xl">
            Everything creators need.<br />
            <span className="text-[#666]">Nothing they don&apos;t.</span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-6 text-[#888] text-lg max-w-2xl leading-relaxed">
            Stop patching together Gumroad, ConvertKit, Linktree, and five other SaaS tools.
            We built the entire creator business stack — storefront, payments, email, analytics, AI — in one place.
          </motion.p>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1"
        >
          {[
            { num: "01", title: "Digital Storefront", desc: "Host and sell templates, courses, code boilerplates — any digital product. Custom domains, landing pages, and checkout built-in." },
            { num: "02", title: "AI Copilot", desc: "Generates landing pages from a description. Optimizes pricing using platform data. Surfaces daily actionable revenue insights." },
            { num: "03", title: "Instant Payouts", desc: "Sell a $5 product, access your $5 immediately. No weekly batches. No $100 minimums. Your money moves when you do." },
            { num: "04", title: "Living Products", desc: "Push version updates and all previous buyers get notified automatically. Turn static files into maintained, high-value assets." },
            { num: "05", title: "Email & Audience", desc: "Native email marketing, subscriber management, and link-in-bio pages. Replace ConvertKit and Linktree entirely." },
            { num: "06", title: "Revenue Splitting", desc: "Co-create with partners. Set percentage splits at the product level. Funds route automatically — no manual invoicing." },
          ].map((feature) => (
            <motion.div
              key={feature.num}
              variants={scaleIn}
              className="bg-[#111] border border-[#1f1f1f] p-8 hover:border-[#F5D547]/40 hover:bg-[#0f0f0f] transition-all duration-300 group"
            >
              <span className="text-xs font-mono text-[#F5D547] opacity-60 group-hover:opacity-100 transition-opacity">
                [{feature.num}]
              </span>
              <h3 className="mt-4 text-lg font-bold tracking-tight">{feature.title}</h3>
              <p className="mt-3 text-sm text-[#777] leading-relaxed group-hover:text-[#999] transition-colors">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== HOW IT WORKS — Steps ===== */}
      <section className="relative z-10 px-6 md:px-12 lg:px-20 py-32 max-w-7xl mx-auto border-t border-[#1f1f1f]">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.p variants={fadeInUp} className="text-xs font-mono uppercase tracking-[0.4em] text-[#F5D547] mb-4">
            [ 02 — How It Works ]
          </motion.p>
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tight max-w-3xl">
            From sign up to<br />
            <span className="text-[#F5D547]">first sale in minutes.</span>
          </motion.h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            { step: "01", title: "Upload Your Product", desc: "Drop your files, write a two-sentence description. The AI Copilot generates your entire product page." },
            { step: "02", title: "Share & Sell", desc: "Custom domain, link-in-bio, email sequences — all native. Every buyer gets a referral link automatically." },
            { step: "03", title: "Get Paid Instantly", desc: "Revenue hits your account the moment someone buys. Collaborate? Splits route automatically to each creator." },
          ].map((item) => (
            <motion.div key={item.step} variants={fadeInUp} className="relative">
              <span className="text-[5rem] font-black text-[#1a1a1a] absolute -top-6 -left-2 select-none pointer-events-none" style={{ WebkitTextStroke: "1px #333" }}>
                {item.step}
              </span>
              <div className="relative pt-16">
                <h3 className="text-xl font-bold tracking-tight">{item.title}</h3>
                <p className="mt-3 text-sm text-[#777] leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== FEE CALCULATOR ===== */}
      <section className="relative z-10 px-6 md:px-12 lg:px-20 py-32 max-w-7xl mx-auto border-t border-[#1f1f1f]">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
        >
          <motion.div variants={fadeInUp}>
            <p className="text-xs font-mono uppercase tracking-[0.4em] text-[#F5D547] mb-4">
              [ 03 — Fee Calculator ]
            </p>
            <h2 className="text-3xl md:text-5xl font-black leading-[0.95] tracking-tight">
              See what legacy<br />platforms <span className="text-[#F5D547]">take from you.</span>
            </h2>
            <p className="mt-6 text-[#888] text-base leading-relaxed max-w-md">
              Gumroad charges 10% + $0.50 per transaction. Drag the slider to see how much that costs you every year.
            </p>
          </motion.div>

          <motion.div variants={scaleIn} className="bg-[#111] border border-[#1f1f1f] p-8 md:p-10">
            <label htmlFor="revenue-slider" className="text-xs font-mono uppercase tracking-[0.2em] text-[#666]">
              Monthly Revenue
            </label>
            <p className="text-4xl md:text-5xl font-black mt-2 mb-6">
              {formatUSD(sliderValue)}
            </p>
            <input
              id="revenue-slider"
              type="range"
              min={500}
              max={50000}
              step={100}
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="w-full cursor-pointer"
              aria-label="Monthly revenue slider"
              aria-valuemin={500}
              aria-valuemax={50000}
              aria-valuenow={sliderValue}
              aria-valuetext={formatUSD(sliderValue)}
            />
            <div className="flex justify-between text-xs text-[#444] mt-2 font-mono">
              <span>$500</span>
              <span>$50,000</span>
            </div>
            <div className="mt-8 pt-6 border-t border-[#1f1f1f]">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#666]">You Save Per Year</p>
              <p className="text-5xl md:text-6xl font-black text-[#F5D547] mt-2">
                {formatUSD(calculateAnnualSavings(sliderValue))}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ===== FIRST 500 CTA ===== */}
      <section className="relative z-10 border-t border-[#1f1f1f]">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="px-6 md:px-12 lg:px-20 py-32 max-w-7xl mx-auto"
        >
          <div className="bg-[#F5D547] text-[#0a0a0a] p-10 md:p-16 relative overflow-hidden">
            <span className="absolute -right-8 -bottom-8 text-[10rem] md:text-[16rem] font-black opacity-[0.07] leading-none select-none pointer-events-none" aria-hidden="true">
              500
            </span>
            <div className="relative z-10">
              <p className="text-xs font-mono uppercase tracking-[0.3em] mb-4 opacity-70">[ Limited — First 500 Creators ]</p>
              <h2 className="text-3xl md:text-5xl font-black leading-[0.95] tracking-tight max-w-2xl uppercase">
                Lifetime Starter Tier. Zero transaction fees for 90 days.
              </h2>
              <p className="mt-6 text-[#0a0a0a]/70 max-w-lg text-base leading-relaxed">
                The first 500 get $29/mo value forever free, AI Copilot early access, and founding creator status to shape the roadmap.
              </p>

              <div className="mt-8 inline-flex items-center gap-3 bg-[#0a0a0a] px-5 py-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F5D547] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F5D547]"></span>
                </span>
                <span className="text-sm text-[#888] font-mono">
                  <span className="font-bold text-[#fafafa]">347</span> / 500 spots remaining
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== JOIN FORM / REFERRAL ===== */}
      <section id="join" className="relative z-10 px-6 md:px-12 lg:px-20 py-32 max-w-7xl mx-auto border-t border-[#1f1f1f]">
        <AnimatePresence mode="wait">
          {!isSignedUp ? (
            <motion.div
              key="form"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
              viewport={{ once: true }}
              className="max-w-xl mx-auto text-center"
            >
              <motion.p variants={fadeInUp} className="text-xs font-mono uppercase tracking-[0.4em] text-[#F5D547] mb-4">
                [ 04 — Join the Waitlist ]
              </motion.p>
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-black leading-[0.95] tracking-tight uppercase">
                Claim your <span className="text-[#F5D547]">spot.</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="mt-4 text-[#888] mb-10">
                500 founding spots. Lifetime perks. No credit card required.
              </motion.p>

              <motion.form
                variants={fadeInUp}
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!isValidEmail(email)) {
                    setFormState("error");
                    setErrorMessage("Please enter a valid email address");
                    return;
                  }
                  setFormState("submitting");
                  setErrorMessage("");
                  try {
                    const timeout = new Promise<never>((_, reject) =>
                      setTimeout(() => reject(new Error("timeout")), 10000)
                    );
                    const result = await Promise.race([simulateSubmission(email), timeout]);
                    setFormState("success");
                    setIsSignedUp(true);
                    setWaitlistPosition(result.position);
                  } catch {
                    setFormState("error");
                    setErrorMessage("Something went wrong. Please try again.");
                  }
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formState === "error") { setFormState("idle"); setErrorMessage(""); }
                  }}
                  placeholder="you@example.com"
                  disabled={formState === "submitting"}
                  className="flex-1 px-5 py-4 bg-[#111] border border-[#1f1f1f] text-[#fafafa] placeholder-[#555] focus:outline-none focus:border-[#F5D547] transition-colors disabled:opacity-50 font-mono text-sm"
                  aria-label="Email address"
                  aria-invalid={formState === "error"}
                  aria-describedby={formState === "error" ? "form-error" : undefined}
                />
                <button
                  type="submit"
                  disabled={formState === "submitting"}
                  className="px-8 py-4 bg-[#F5D547] text-[#0a0a0a] font-bold uppercase tracking-wider text-sm hover:bg-[#ffe566] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {formState === "submitting" ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Joining...</span></>
                  ) : (
                    <><span>Join</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </motion.form>
              {formState === "error" && errorMessage && (
                <p id="form-error" className="text-[#ff6b6b] text-sm mt-3 font-mono" role="alert">{errorMessage}</p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="referral"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="max-w-xl mx-auto"
            >
              <motion.div variants={fadeInUp} className="bg-[#111] border border-[#1f1f1f] p-8 md:p-10 text-center">
                <p className="text-2xl md:text-3xl font-black uppercase mb-2">
                  {waitlistPosition !== null
                    ? <>You are <span className="text-[#F5D547]">#{waitlistPosition}</span></>
                    : <>You&apos;re in</>}
                </p>
                <p className="text-[#888] text-sm mb-8">
                  Refer 3 creators to skip the queue and unlock 6 months of Pro Tier ($594 value).
                </p>
                <div className="flex items-center gap-2 mb-6">
                  <input
                    type="text"
                    readOnly
                    value={`https://creatorplatform.com/ref/${referralIdRef.current}`}
                    className="flex-1 px-4 py-3 bg-[#0a0a0a] border border-[#1f1f1f] text-[#888] text-xs truncate font-mono"
                    aria-label="Referral link"
                  />
                  <button
                    onClick={async () => {
                      const link = `https://creatorplatform.com/ref/${referralIdRef.current}`;
                      try {
                        await navigator.clipboard.writeText(link);
                        setCopyState("copied");
                        setTimeout(() => setCopyState("idle"), 2000);
                      } catch {
                        setCopyState("failed");
                        setTimeout(() => setCopyState("idle"), 2000);
                      }
                    }}
                    className={`px-5 py-3 font-bold text-xs uppercase tracking-wide transition-colors flex items-center gap-2 ${
                      copyState === "copied" ? "bg-[#F5D547] text-[#0a0a0a]"
                        : copyState === "failed" ? "bg-[#ff6b6b] text-white"
                        : "bg-[#222] text-[#fafafa] hover:bg-[#333]"
                    }`}
                    aria-label={copyState === "copied" ? "Copied" : copyState === "failed" ? "Failed to copy" : "Copy referral link"}
                  >
                    {copyState === "copied" ? (<><Check className="w-4 h-4" /><span>Copied!</span></>)
                      : copyState === "failed" ? (<><X className="w-4 h-4" /><span>Failed</span></>)
                      : (<><Copy className="w-4 h-4" /><span>Copy</span></>)}
                  </button>
                </div>
                <div className="mb-3">
                  <div className="w-full h-1.5 bg-[#0a0a0a] border border-[#1f1f1f] overflow-hidden">
                    <div className="h-full bg-[#F5D547] transition-all duration-300" style={{ width: `${(referralCount / 3) * 100}%` }} role="progressbar" aria-valuenow={referralCount} aria-valuemin={0} aria-valuemax={3} aria-label="Referral progress" />
                  </div>
                </div>
                <p className="text-[#555] text-xs font-mono uppercase tracking-wider">{referralCount}/3 referrals completed</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-10 px-6 md:px-12 lg:px-20 py-12 max-w-7xl mx-auto border-t border-[#1f1f1f]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#444]">
            © {new Date().getFullYear()} Creator Commerce Platform
          </p>
          <p className="text-xs text-[#444] font-mono">
            Built for creators who choose freedom and motion.
          </p>
        </div>
      </footer>
    </main>
  );
}
