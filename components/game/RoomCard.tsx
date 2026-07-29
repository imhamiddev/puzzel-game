"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Share2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface RoomCardProps {
  code: string;
  inviteUrl: string;
}

export default function RoomCard({ code, inviteUrl }: RoomCardProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be unavailable; ignore silently
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "به مسابقه پازل من بپیوند!", url: inviteUrl });
      } catch {
        // user cancelled share sheet
      }
    } else {
      copy();
    }
  };

  return (
    <Card strong className="text-center">
      <p className="text-sm text-white/50 mb-2">کد اتاق</p>
      <motion.p
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-bold tracking-[0.2em] text-gradient mb-5"
      >
        {code}
      </motion.p>

      <div className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 mb-4 overflow-hidden">
        <p className="text-sm text-white/60 truncate flex-1 text-left">{inviteUrl}</p>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={copy} fullWidth icon={copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}>
          {copied ? "کپی شد!" : "کپی لینک"}
        </Button>
        <Button variant="primary" onClick={share} fullWidth icon={<Share2 className="h-5 w-5" />}>
          اشتراک‌گذاری
        </Button>
      </div>
    </Card>
  );
}
