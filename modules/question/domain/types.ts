export type QuestionStatus = "pending" | "answered" | "rejected";

export interface ProductQuestion {
  id: string;
  productId: string;
  askerName: string;
  askerEmail: string | null;
  questionText: string;
  answerText: string | null;
  status: QuestionStatus;
  isPublished: boolean;
  answeredAt: string | null;
  createdAt: string;
}

export interface AskQuestionInput {
  askerName: string;
  askerEmail?: string;
  questionText: string;
}
