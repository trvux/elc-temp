"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/shared/components/ui/input-otp";

import { useRequestMagicLink, useVerifyMagicLinkCode } from "../hooks/useMagicLink";

export function VerifyCodeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const verifyCodeMutation = useVerifyMagicLinkCode();
  const requestMagicLinkMutation = useRequestMagicLink();

  // verifyMagicLinkCodeAction redirect() server-side khi thành công — chỉ
  // nhánh lỗi (trả về {error}) mới thật sự chạm tới onSuccess bên dưới.
  function handleVerify() {
    setError(null);
    verifyCodeMutation.mutate(
      { email, code },
      {
        onSuccess: (result) => {
          if (result.error) setError(result.error);
        },
      },
    );
  }

  if (!email) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <p className="type-body-sm text-muted-foreground">Thiếu địa chỉ email.</p>
        <Button variant="outline" onClick={() => router.push("/login")}>
          Quay lại đăng nhập
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="type-title">
          Kiểm tra email của bạn
        </h1>
        <p id="verify-description" className="type-body-sm text-muted-foreground">
          Chúng tôi đã gửi mã đến <strong className="text-foreground">{email}</strong>
        </p>
      </div>

      <Card className="ring-0 shadow-none sm:ring-1 sm:shadow-xs">
        <CardContent>
          <form
            className="flex flex-col items-center gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.length === 6 && !verifyCodeMutation.isPending) handleVerify();
            }}
          >
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            autoFocus
            autoComplete="one-time-code"
            aria-label="Mã xác thực 6 chữ số"
            aria-describedby="verify-description"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={code.length < 6 || verifyCodeMutation.isPending}
          >
            {verifyCodeMutation.isPending ? "Đang xác thực..." : "Xác thực email"}
          </Button>

          {error && <p role="alert" className="type-legal text-destructive">{error}</p>}

          <div className="flex w-full justify-between">
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 type-legal text-muted-foreground"
              disabled={requestMagicLinkMutation.isPending}
              onClick={() => requestMagicLinkMutation.mutate(email)}
            >
              {requestMagicLinkMutation.isPending ? "Đang gửi..." : "Gửi lại mã"}
            </Button>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 type-legal text-muted-foreground"
              onClick={() => router.push("/login")}
            >
              Dùng email khác
            </Button>
          </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
