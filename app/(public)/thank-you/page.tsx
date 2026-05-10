import {
  TypographyH1,
  TypographyLead,
  TypographyP,
} from "@/shared/components/ui/typography";
import { RedirectTimer } from "./redirect-timer";

export const metadata = {
  title: "Cảm ơn bạn đã liên hệ - ELC",
  description:
    "Yêu cầu của bạn đã được ghi nhận thành công. ELC sẽ liên hệ lại với bạn trong thời gian sớm nhất.",
  robots: {
    index: false,
  },
};

export default function ThankYouPage() {
  return (
    <div className="flex flex-col items-center justify-center px-4 text-center min-h-screen">
      <div className="max-w-2xl space-y-8">
        <div className="space-y-4">
          <TypographyH1>Cảm ơn bạn đã liên hệ đến</TypographyH1>
          <TypographyH1>Điện Máy ELC</TypographyH1>
          <TypographyLead>
            Hãy để lại lời nhắn. Chúng tôi sẽ phản hồi ngay.
          </TypographyLead>
          <RedirectTimer />
        </div>

        <div className="pt-10">
          <TypographyP>Hỗ trợ kỹ thuật 24/7</TypographyP>
          <a
            href="tel:0789978898"
            className="mt-2 block text-2xl font-bold text-primary"
          >
            0789 978 898
          </a>
        </div>
      </div>
    </div>
  );
}
