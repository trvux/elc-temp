"use server";

import { AskQuestionInput, ProductQuestion, QuestionStatus } from "../domain";

const GO_API_URL = process.env.GO_API_URL;

interface GoQuestionResponse {
  id: string;
  product_id: string;
  asker_name: string;
  asker_email: string | null;
  question_text: string;
  answer_text: string | null;
  status: string;
  is_published: boolean;
  answered_at: string | null;
  created_at: string;
}

interface GoErrorResponse {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

function mapGoQuestion(row: GoQuestionResponse): ProductQuestion {
  return {
    id: row.id,
    productId: row.product_id,
    askerName: row.asker_name,
    askerEmail: row.asker_email,
    questionText: row.question_text,
    answerText: row.answer_text,
    status: row.status as QuestionStatus,
    isPublished: row.is_published,
    answeredAt: row.answered_at,
    createdAt: row.created_at,
  };
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as GoErrorResponse;
    return body.message || fallback;
  } catch {
    return fallback;
  }
}

// Public, published-only read — GET /questions/product/{productId} never
// requires auth, see internal/product-qa/presentation/routes.go.
export async function getProductQuestionsAction(productId: string) {
  if (!GO_API_URL) {
    return { data: [] as ProductQuestion[], error: null };
  }
  try {
    const res = await fetch(`${GO_API_URL}/questions/product/${encodeURIComponent(productId)}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { data: [], error: await extractErrorMessage(res, "Không thể tải câu hỏi") };
    }

    const rows = (await res.json()) as GoQuestionResponse[] | null;
    return { data: (rows ?? []).map(mapGoQuestion), error: null };
  } catch (error) {
    console.error("getProductQuestionsAction error:", error);
    return { data: [], error: "Không thể tải câu hỏi" };
  }
}

// Public write — no bearer token, guest submission (rate-limited + honeypot
// server-side), matches internal/product-qa's Ask handler.
export async function askProductQuestionAction(productId: string, input: AskQuestionInput) {
  if (!GO_API_URL) {
    return { data: null, error: "GO_API_URL is not configured" };
  }
  try {
    const res = await fetch(`${GO_API_URL}/questions/product/${encodeURIComponent(productId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        asker_name: input.askerName,
        asker_email: input.askerEmail || null,
        question_text: input.questionText,
      }),
    });
    if (!res.ok) {
      return { data: null, error: await extractErrorMessage(res, "Không thể gửi câu hỏi") };
    }

    const row = (await res.json()) as GoQuestionResponse;
    return { data: mapGoQuestion(row), error: null };
  } catch (error) {
    console.error("askProductQuestionAction error:", error);
    return { data: null, error: "Không thể gửi câu hỏi" };
  }
}
