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
};

export default function ThankYouPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-2xl space-y-8">
        <div className="space-y-4">
          <TypographyH1>Cảm ơn bạn đã tin tưởng ELC</TypographyH1>
          <TypographyLead>
            Thông tin của bạn đã được chuyển đến bộ phận chuyên trách. Chúng tôi
            sẽ phản hồi ngay.
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
