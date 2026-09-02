"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { googleLoginAction } from "../actions";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

function isGoogleReady(): boolean {
  // `google` chỉ tồn tại như 1 biến global sau khi script GIS
  // (accounts.google.com/gsi/client, load trong app/layout.tsx) chạy xong —
  // dùng typeof để tránh ReferenceError khi tham chiếu 1 identifier chưa
  // từng được khai báo.
  return typeof google !== "undefined" && !!google.accounts?.oauth2;
}

// Dùng OAuth 2.0 Authorization Code flow qua initCodeClient (popup UX) — bấm
// nút thật (không phải hidden-button hack) nên không dính lỗi FedCM abort của
// flow ID-token/One Tap. prompt: "consent" ép Google luôn hiện lại màn xác
// nhận account mỗi lần login, không chỉ lần đầu.
//
// googleLoginAction KHÔNG redirect() server-side — nó chỉ trả {user, error}
// (xem comment trong actions.ts về lý do: redirect() bên trong 1 action gọi
// qua useMutation bị react-query bắt như 1 lỗi thật). Điều hướng theo role
// làm ở đây, phía client, sau khi mutation resolve.
export function useGoogleLogin() {
  const router = useRouter();
  const clientRef = useRef<google.accounts.oauth2.CodeClient | null>(null);
  const [ready, setReady] = useState(false);
  // Riêng với lỗi cấu hình (thiếu client_id, initCodeClient ném lỗi vì
  // config sai) — khác lỗi "chưa sẵn sàng" (script GIS chưa load xong, còn
  // đang polling): cái này không bao giờ tự hết, phải hiện ra cho biết thay
  // vì để nút disable mãi mãi không rõ lý do.
  const [configError, setConfigError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: (code: string) => googleLoginAction(code, window.location.origin),
    onSuccess: (result) => {
      if (result.user) {
        // router.refresh() bên cạnh push() — chỉ push() thôi thì Router Cache
        // của Next.js có thể tái dùng RSC payload cũ của layout đích (sidebar
        // admin chẳng hạn) nếu nó đã từng được fetch trước đó trong session
        // này, hiện dữ liệu cũ (thiếu avatar mới sync) dù revalidatePath đã
        // chạy phía server.
        router.push(result.user.role === "member" ? "/" : "/admin");
        router.refresh();
      }
    },
  });

  useEffect(() => {
    let cancelled = false;

    function tryInit() {
      if (cancelled || clientRef.current) return;

      if (!GOOGLE_CLIENT_ID) {
        setConfigError("Chưa cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID");
        return;
      }

      if (!isGoogleReady()) {
        setTimeout(tryInit, 100);
        return;
      }

      // `prompt` thiếu trong type CodeClientConfig của package
      // @types/google.accounts (thư viện thực tế vẫn hỗ trợ) — gán qua biến
      // đã type để né excess-property-check.
      const config: google.accounts.oauth2.CodeClientConfig & {
        prompt?: "" | "none" | "consent" | "select_account";
      } = {
        client_id: GOOGLE_CLIENT_ID,
        scope: "openid email profile",
        ux_mode: "popup",
        prompt: "consent",
        callback: (response) => loginMutation.mutate(response.code),
      };
      try {
        clientRef.current = google.accounts.oauth2.initCodeClient(config);
        setReady(true);
      } catch (err) {
        // initCodeClient validate config đồng bộ — client_id sai định dạng/
        // domain chưa được authorize trong Google Cloud Console ném lỗi ở
        // đây, trước khi user kịp bấm gì cả.
        console.error("[useGoogleLogin] initCodeClient failed:", err);
        setConfigError("Không thể khởi tạo đăng nhập Google — kiểm tra lại Client ID/domain đã authorize");
      }
    }

    tryInit();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function signIn() {
    clientRef.current?.requestCode();
  }

  return { signIn, ready, configError, isPending: loginMutation.isPending, result: loginMutation.data };
}
