import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { FAQ } from "../../domain/types";

interface FAQAccordionProps {
  faqs: FAQ[];
  title?: string;
}

// Renders the same faqs array the page's FAQPage JSON-LD (SEOSchema.
// getFAQPage) is built from — one source of truth, two outputs (visible +
// structured data), see mã 8823.
export function FAQAccordion({ faqs, title = "Câu hỏi thường gặp" }: FAQAccordionProps) {
  if (faqs.length === 0) return null;

  return (
    <section aria-labelledby="faq-heading" className="w-full max-w-4xl mx-auto space-y-4">
      <h2 id="faq-heading" className="type-title">{title}</h2>
      <Accordion type="single" collapsible>
        {faqs.map((faq) => (
          <AccordionItem key={faq.id} value={faq.id}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground whitespace-pre-line">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
