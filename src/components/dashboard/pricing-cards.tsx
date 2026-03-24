"use client";

import { useState } from "react";
import { Check, Zap, Crown, Star, ArrowRight, ShieldCheck, Mail, Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    id: "free",
    price: "0",
    description: "Perfect for casual monitoring.",
    features: [
      { text: "1 YouTube Monitor Agent", icon: Play },
      { text: "1 Job Finder Agent", icon: Star },
      { text: "100 Credits / Week", icon: Zap },
      { text: "Every 3 Days Delivery", icon: Mail },
      { text: "Email Support", icon: ShieldCheck },
    ],
    limitations: [
      "No Instant 'Run Now'",
      "Fixed Schedule",
    ]
  },
  {
    name: "Expert",
    id: "pro",
    price: "499",
    description: "For serious researchers & lead gen.",
    highlight: true,
    features: [
      { text: "Unlimited Agents", icon: Play },
      { text: "1000 Credits / Week", icon: Zap },
      { text: "Daily / 4-Hour Delivery", icon: Mail },
      { text: "Instant 'Run Now' Enabled", icon: Crown },
      { text: "Priority Support", icon: Star },
      { text: "Advanced Stats", icon: ShieldCheck },
    ],
  }
];

export function PricingCards({ currentTier = 'free' }: { currentTier?: 'free'|'pro' }) {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="space-y-12">
      {/* Toggle */}
      <div className="flex justify-center">
        <div className="bg-white/5 p-1.5 rounded-2xl border border-white/10 flex items-center gap-1 shadow-2xl">
          <button 
            onClick={() => setIsYearly(false)}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              !isYearly ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:text-white"
            )}
          >
            Monthly
          </button>
          <button 
            onClick={() => setIsYearly(true)}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              isYearly ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:text-white"
            )}
          >
            Yearly
            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md">-20%</span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={cn(
              "relative glass rounded-[2.5rem] border transition-all duration-700 p-8 md:p-10 flex flex-col group overflow-hidden",
              plan.highlight 
                ? "border-indigo-500/30 bg-gradient-to-br from-indigo-500/[0.05] to-transparent scale-[1.02] shadow-[0_0_50px_-12px_rgba(79,70,229,0.3)]" 
                : "border-white/5 hover:border-white/10 shadow-2xl"
            )}
          >
            {/* Background Decorations */}
            {plan.highlight && (
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[80px] pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700" />
            )}

            <div className="space-y-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black font-outfit tracking-tighter text-white">{plan.name}</h3>
                  <p className="text-sm text-gray-500 font-bold mt-1 tracking-tight">{plan.description}</p>
                </div>
                {plan.highlight && (
                  <div className="p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/30">
                    <Crown className="w-6 h-6 text-indigo-400" />
                  </div>
                )}
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black font-outfit text-white tracking-tighter">
                   {isYearly ? Math.floor(parseInt(plan.price) * 0.8 * 12) : plan.price} BDT
                </span>
                <span className="text-gray-500 font-bold tracking-tight text-lg">
                  /{isYearly ? 'year' : 'month'}
                </span>
              </div>

              {/* Action Button */}
              <button
                disabled={currentTier === plan.id}
                className={cn(
                  "w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs transition-all duration-500",
                  currentTier === plan.id
                    ? "bg-white/5 text-gray-400 border border-white/10 cursor-default"
                    : plan.highlight
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 group-hover:translate-y-[-2px]"
                      : "bg-white/5 hover:bg-white/10 text-white border border-white/5"
                )}
              >
                {currentTier === plan.id ? "Current Plan" : "Get Started"}
                {currentTier !== plan.id && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>

              {/* Features List */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">What's Included</p>
                <div className="grid gap-4">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-bold text-gray-300 flex items-center gap-2">
                         <feature.icon className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                         {feature.text}
                      </span>
                    </div>
                  ))}
                  {plan.limitations?.map((limit, i) => (
                    <div key={i} className="flex items-center gap-3 opacity-40 grayscale">
                      <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-500">
                        <div className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-bold text-gray-500 line-through decoration-gray-600">{limit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-gray-500 text-sm font-bold max-w-2xl mx-auto italic">
          Localized for Bangladesh. Secure payments via bKash, SSLCommerz, or Card coming soon.
        </p>
      </div>
    </div>
  );
}
