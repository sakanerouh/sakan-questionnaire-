import type { AppLocale } from "@/i18n/routing";

export const nextStepsCopy = {
  en: {
    title: "Continue your journey | Sakan eRouh",
    description: "Explore three ways to continue after your SakanBody audit, at your own pace or with personalised support.",
    eyebrow: "Your next chapter",
    heading: "You’ve already begun to change how",
    headingAccent: "you see yourself.",
    introduction: "Your audit is the first step towards practising new choices in everyday life.",
    optionsHeading: "Here are three ways to continue.",
    portraitAlt: "Imane sitting with her laptop, smiling warmly",
    languagesLabel: "Choose your language",
    whatsappNote: "Each option opens a conversation on WhatsApp.",
    closing: "You’ve started. Choose how you’d like to continue.",
    inviteTitle: "Your audit is a beginning.",
    inviteBody: "Continue at your own pace, make sense of your report together, or explore a personalised 90-day journey.",
    inviteCta: "Choose your next step",
    cards: [
      {
        id: "practice",
        eyebrow: "01 · At your own pace",
        title: "Read, reflect and practise",
        body: "Revisit your report. Use its reflection prompts and practices to explore how you see yourself and try new choices at your own pace.",
        cta: "Talk about your practice",
        message: "Hello Imane, I’ve completed my SakanBody audit and would like to ask about continuing my practice at my own pace.",
        image: "/next-steps/reflect.webp",
        details: [],
        badge: "",
      },
      {
        id: "clarity",
        eyebrow: "02 · A session for clarity",
        title: "Make sense of your report",
        body: "In an Embodiment Call, we decode your report together and choose where to begin your own practice.",
        cta: "Book a 1:1 call",
        message: "Hello Imane, I’d like to book a 45-minute Embodiment Call (€111) to explore my SakanBody audit report.",
        image: "/next-steps/clarity.webp",
        details: ["45 minutes", "€111", "English or Arabic"],
        badge: "",
      },
      {
        id: "journey",
        eyebrow: "03 · A clear pathway, together",
        title: "Change how you see yourself",
        body: "Eight private sessions over 90 days, with a personalised pathway, your Cracking the Shield workbook and guided body practices. We turn insight into choices you practise in everyday life.",
        cta: "Explore the 90-day journey",
        message: "Hello Imane, I’d like to learn more about the personalised 90-day journey with eight private sessions.",
        image: "/next-steps/journey.webp",
        details: ["8 private sessions · Practices between sessions"],
        badge: "90 days · Personalised 1:1",
      },
    ],
  },
  ar: {
    title: "واصلي رحلتكِ | سكن الروح",
    description: "اكتشفي ثلاث طرق لمواصلة الرحلة بعد تقييم SakanBody، على إيقاعكِ الخاص أو بمرافقة فردية.",
    eyebrow: "خطوتكِ التالية",
    heading: "لقد بدأتِ بالفعل رحلة تغيير",
    headingAccent: "نظرتكِ عن نفسكِ.",
    introduction: "تقييمكِ هو الخطوة الأولى نحو ممارسة اختيارات جديدة في حياتكِ اليومية.",
    optionsHeading: "إليكِ ثلاث طرق لمواصلة الرحلة",
    portraitAlt: "إيمان جالسة مع حاسوبها المحمول وتبتسم بودّ",
    languagesLabel: "اختاري اللغة",
    whatsappNote: "يفتح كل خيار محادثة عبر واتساب.",
    closing: "لقد بدأتِ. اختاري كيف تودّين مواصلة الرحلة.",
    inviteTitle: "تقييمكِ هو البداية.",
    inviteBody: "واصلي على إيقاعكِ الخاص، أو افهمي تقريركِ بعمق في جلسة فردية، أو اكتشفي رحلة تسعين يومًا مصمّمة لكِ.",
    inviteCta: "اختاري خطوتكِ التالية",
    cards: [
      {
        id: "practice",
        eyebrow: "٠١ · على إيقاعكِ الخاص",
        title: "اقرئي، تأمّلي، ومارسي",
        body: "عودي إلى تقريركِ، واستخدمي أسئلة التأمّل والممارسات لاستكشاف نظرتكِ إلى نفسكِ وتجربة اختيارات جديدة، على إيقاعكِ الخاص.",
        cta: "تواصلي حول ممارستكِ",
        message: "مرحبًا إيمان، أكملتُ تقييم SakanBody وأودّ الاستفسار عن مواصلة الممارسة على إيقاعي الخاص.",
        image: "/next-steps/reflect.webp",
        details: [],
        badge: "",
      },
      {
        id: "clarity",
        eyebrow: "٠٢ · جلسة للوضوح",
        title: "افهمي تقريركِ بعمق",
        body: "في جلسة فردية، نفكّ معًا رموز تقريركِ، وأرشدكِ إلى نقطة البداية لمواصلة الممارسة بنفسكِ.",
        cta: "احجزي جلستكِ الفردية",
        message: "مرحبًا إيمان، أودّ حجز جلسة فردية مدّتها ٤٥ دقيقة بسعر ١١١ يورو لفهم تقرير تقييمي بعمق.",
        image: "/next-steps/clarity.webp",
        details: ["٤٥ دقيقة", "١١١ يورو", "العربية أو الإنجليزية"],
        badge: "",
      },
      {
        id: "journey",
        eyebrow: "٠٣ · مسار واضح، نمضي فيه معًا",
        title: "غيّري نظرتكِ إلى نفسكِ",
        body: "ثماني جلسات فردية على مدى ٩٠ يومًا، ضمن مسار مصمّم لكِ، مع دفتر «شقّ الدرع» وممارسات جسدية موجّهة. نحوّل الفهم إلى اختيارات تمارسينها في حياتكِ اليومية.",
        cta: "اكتشفي رحلة التسعين يومًا",
        message: "مرحبًا إيمان، أودّ معرفة المزيد عن رحلة التسعين يومًا المصمّمة لي مع ثماني جلسات فردية.",
        image: "/next-steps/journey.webp",
        details: ["٨ جلسات فردية · ممارسات بين الجلسات"],
        badge: "٩٠ يومًا · مرافقة فردية",
      },
    ],
  },
};

export function getNextStepsCopy(locale: AppLocale) {
  return nextStepsCopy[locale === "ar" ? "ar" : "en"];
}

export function nextStepsWhatsAppUrl(message: string) {
  return `https://wa.me/212764131039?text=${encodeURIComponent(message)}`;
}
