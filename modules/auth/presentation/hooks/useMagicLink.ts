"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { requestMagicLinkAction, verifyMagicLinkCodeAction } from "../actions";

export function useRequestMagicLink() {
  return useMutation({
    mutationFn: (email: string) => requestMagicLinkAction({ email }),
  });
}

// verifyMagicLinkCodeAction KHÔNG redirect() server-side — nó chỉ trả
// {user, error}. Điều hướng theo role làm ở đây, phía client, sau khi
// mutation resolve (xem comment trong actions.ts).
export function useVerifyMagicLinkCode() {
  const router = useRouter();
  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) => verifyMagicLinkCodeAction({ email, code }),
    onSuccess: (result) => {
      if (result.user) {
        router.push(result.user.role === "member" ? "/" : "/admin");
        router.refresh();
      }
    },
  });
}
