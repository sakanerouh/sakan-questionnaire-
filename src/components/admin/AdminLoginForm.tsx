"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AdminLoginForm({ locale }: { locale: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const sendLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Admin authentication is not configured.");
      setSending(false);
      return;
    }

    const redirectTo = `${window.location.origin}/auth/confirm?next=/${locale}/admin`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
    });
    setMessage(
      error
        ? "This email is not authorized or the login email could not be sent."
        : "Check your inbox for the one-time admin login link.",
    );
    setSending(false);
  };

  return (
    <form onSubmit={sendLink} className="mt-8 space-y-5">
      <div>
        <label htmlFor="admin-email" className="text-sm font-semibold text-[#28301C]">
          Admin email
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 min-h-12 w-full rounded-xl border border-[#C6C7BD] bg-white px-4 text-[#28301C] outline-none focus:border-[#82542A]"
          placeholder="you@example.com"
        />
      </div>
      <button
        type="submit"
        disabled={sending}
        className="min-h-12 w-full rounded-xl bg-[#28301C] px-5 font-semibold text-[#FBF9F8] disabled:opacity-60"
      >
        {sending ? "Sending…" : "Email me a secure login link"}
      </button>
      {message && <p role="status" className="text-sm leading-6 text-[#82542A]">{message}</p>}
      <p className="text-xs leading-5 text-[#76786F]">
        There is no public signup. Only pre-invited active administrators can continue.
      </p>
    </form>
  );
}

