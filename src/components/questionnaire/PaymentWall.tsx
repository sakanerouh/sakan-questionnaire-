"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Swal from "sweetalert2";
import { ArrowRight, CreditCard } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { useQuestionnaireStore } from "@/lib/questionnaireStore";

type EmailForm = { email: string };

export function PaymentWall({ reportId }: { reportId: string }) {
  const [loading, setLoading] = useState(false);
  const locale = useLocale() as AppLocale;
  const t = useTranslations("payment");
  const emailSchema = z.object({ email: z.string().email(t("emailInvalid")) });
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
          locale,
        }),
      });
      const data = (await response.json()) as { error?: string; url?: string; demo?: boolean };

      if (!response.ok || !data.url) {
        throw new Error(t("checkoutError"));
      }

      if (data.demo) {
        await Swal.fire({
          title: t("demoTitle"),
          text: t("demoText"),
          icon: "info",
          confirmButtonColor: "#7C3C60",
          background: "#fffaf2",
          color: "#352317",
        });
      }

      window.location.assign(data.url);
    } catch (error) {
      Swal.fire({
        title: t("paymentErrorTitle"),
        text: error instanceof Error ? error.message : t("tryAgain"),
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
      <h2 className="mt-5 text-3xl font-semibold">{t("title")}</h2>
      <p className="mt-4 text-base leading-7 text-[#f8ead7]">
        {t("body")}
      </p>
      <label className="mt-6 block">
        <span className="text-sm font-semibold text-[#f8d7ea]">{t("emailLabel")}</span>
        <input
          {...register("email", { required: true })}
          type="email"
          placeholder={t("emailPlaceholder")}
          className="mt-2 h-12 w-full rounded-[8px] border border-white/20 bg-white/10 px-4 text-[#fffaf2] outline-none placeholder:text-[#edd3e2] focus:border-[#DDA8C8]"
        />
      </label>
      {errors.email && <p className="mt-2 text-sm text-[#f0c7c3]">{errors.email.message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#fffaf2] px-6 py-3 text-sm font-semibold text-[#7C3C60] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? t("openingCheckout") : t("unlock")}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
      <p className="mt-4 text-xs leading-5 text-[#dcc7a8]">
        {t("disclaimer")}
      </p>
    </form>
  );
}
