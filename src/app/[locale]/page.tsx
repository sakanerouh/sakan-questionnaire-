import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LandingPage } from "@/components/LandingPage";
import { localizedMetadata } from "@/i18n/metadata";
import { Link } from "@/i18n/navigation";
import { normalizeLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = normalizeLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "metadata.home" });
  return localizedMetadata({ locale, title: t("title"), description: t("description") });
}

export default async function Home({ params }: Props) {
  const locale = normalizeLocale((await params).locale);
  setRequestLocale(locale);
  return (
    <>
      <LandingPage />
      {process.env.NODE_ENV === "development" && (
        <nav
          aria-label="Developer shortcuts"
          dir="ltr"
          className="fixed right-4 bottom-4 z-50 rounded-xl border border-[#d9caba] bg-[#fffaf2] p-3 font-mono text-[#233c32] shadow-lg"
        >
          <p className="mb-1 text-[10px] uppercase tracking-wider text-[#766b5d]">Developer shortcut</p>
          <Link
            href="/next-steps"
            className="inline-flex min-h-9 items-center gap-3 rounded-md px-2 text-sm underline underline-offset-4 hover:bg-[#eee7db] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96c2d]"
          >
            Next steps page <span aria-hidden="true">→</span>
          </Link>
        </nav>
      )}
    </>
  );
}
