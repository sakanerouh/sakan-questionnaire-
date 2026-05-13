"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Swal from "sweetalert2";
import { ArrowRight, CreditCard } from "lucide-react";
import { useQuestionnaireStore } from "@/lib/questionnaireStore";

const emailSchema = z.object({
  email: z.string().email("Enter a valid email so your report can be associated with you."),
});

type EmailForm = z.infer<typeof emailSchema>;

export function PaymentWall({ reportId }: { reportId: string }) {
  const [loading, setLoading] = useState(false);
  const { sessionId, email, setEmail } = useQuestionnaireStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailForm>({
    defaultValues: { email },
  });

  const onSubmit = async (values: EmailForm) => {
    const parsed = emailSchema.safeParse(values);
    if (!parsed.success) return;

    setLoading(true);
    setEmail(parsed.data.email);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          reportId,
          email: parsed.data.email,
        }),
      });
      const data = (await response.json()) as { url?: string; demo?: boolean };

      if (!response.ok || !data.url) {
        throw new Error("Checkout could not be created.");
      }

      if (data.demo) {
        await Swal.fire({
          title: "Demo unlock",
          text: "Stripe keys are not configured locally, so this opens the report in demo mode.",
          icon: "info",
          confirmButtonColor: "#7C3C60",
          background: "#fffaf2",
          color: "#352317",
        });
      }

      window.location.assign(data.url);
    } catch {
      Swal.fire({
        title: "The payment door did not open.",
        text: "Please try again in a moment.",
        icon: "warning",
        confirmButtonColor: "#7C3C60",
        background: "#fffaf2",
        color: "#352317",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="sakan-gradient-deep rounded-[8px] border border-[#DDA8C8]/45 p-6 text-[#fffaf2] shadow-[0_28px_80px_rgba(124,60,96,0.28)] sm:p-8"
    >
      <CreditCard className="h-7 w-7 text-[#f8d7ea]" aria-hidden />
      <h2 className="mt-5 text-3xl font-semibold">Unlock your full report</h2>
      <p className="mt-4 text-base leading-7 text-[#f8ead7]">
        Your full SakanBody Audit includes your protection pattern, shadow personality,
        dream sabotage pattern, nervous system update, practices, and identity inquiry.
      </p>
      <label className="mt-6 block">
        <span className="text-sm font-semibold text-[#f8d7ea]">Email for your report</span>
        <input
          {...register("email", { required: true })}
          type="email"
          placeholder="you@example.com"
          className="mt-2 h-12 w-full rounded-[8px] border border-white/20 bg-white/10 px-4 text-[#fffaf2] outline-none placeholder:text-[#edd3e2] focus:border-[#DDA8C8]"
        />
      </label>
      {errors.email && <p className="mt-2 text-sm text-[#f0c7c3]">{errors.email.message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#fffaf2] px-6 py-3 text-sm font-semibold text-[#7C3C60] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Opening checkout..." : "Unlock My Full Report"}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
      <p className="mt-4 text-xs leading-5 text-[#dcc7a8]">
        This is a self-reflection tool, not a medical diagnosis or therapy.
      </p>
    </form>
  );
}
