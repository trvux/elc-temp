import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { TypographySmall } from "@/shared/components/ui/typography";

import { ProductQuestion } from "../../domain";
import { AskQuestionForm } from "./AskQuestionForm";

interface QuestionsPanelProps {
  productId: string;
  questions: ProductQuestion[];
}

// Pure presentational — questions are fetched once by the caller (also
// needed there for FAQPage JSON-LD, so fetching again here would be
// redundant). Renders published Q&A as a scannable FAQ-style Accordion,
// reading more naturally than a flat list of question/answer pairs.
export function QuestionsPanel({ productId, questions }: QuestionsPanelProps) {
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {questions.length > 0 ? (
        <Accordion type="single" collapsible>
          {questions.map((q) => (
            <AccordionItem key={q.id} value={q.id}>
              <AccordionTrigger>{q.questionText}</AccordionTrigger>
              <AccordionContent>{q.answerText}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <TypographySmall className="text-muted-foreground">
          Chưa có câu hỏi nào cho sản phẩm này — hãy là người đầu tiên đặt câu hỏi.
        </TypographySmall>
      )}

      <div className="pt-4 border-t border-border/40">
        <AskQuestionForm productId={productId} />
      </div>
    </div>
  );
}
