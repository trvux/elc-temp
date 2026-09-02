"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { GoogleIcon } from "@/shared/components/molecules/auth/google-icon";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";

import { useGoogleLogin } from "../hooks/useGoogleLogin";
import { useRequestMagicLink } from "../hooks/useMagicLink";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const googleLogin = useGoogleLogin();
  const requestMagicLinkMutation = useRequestMagicLink();

  // googleLogin.result chỉ có giá trị khi có lỗi (thành công thì action đã
  // redirect() server-side, promise không bao giờ "resolve" theo nghĩa render
  // lại UI này) — hiện lỗi ra nếu có.
  const googleError = googleLogin.result?.error;

  function handleContinueWithEmail() {
    setError(null);
    requestMagicLinkMutation.mutate(email, {
      onSuccess: (result) => {
        if (result.error) {
          setError(result.error);
          return;
        }
        router.push(`/login/verify?email=${encodeURIComponent(email)}`);
      },
    });
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-2xl font-medium tracking-tight text-balance sm:text-4xl sm:whitespace-nowrap">
          Mát lành mọi không gian
        </h1>
        <p className="text-sm text-muted-foreground">
          Máy lạnh, khí tươi & dự án trọn gói cho ngôi nhà của bạn
        </p>
      </div>

      <Card className="w-full max-w-sm shadow-sm">
        <CardContent className="flex flex-col gap-4">
          <Button
            variant="outline"
            size="lg"
            className="w-full shadow-sm"
            disabled={!googleLogin.ready || googleLogin.isPending || !!googleLogin.configError}
            onClick={googleLogin.signIn}
          >
            <GoogleIcon className="size-4" />
            {googleLogin.isPending ? "Đang đăng nhập..." : "Tiếp tục với Google"}
          </Button>
          {googleLogin.configError && (
            <p className="text-xs text-destructive">{googleLogin.configError}</p>
          )}

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">HOẶC</span>
            <Separator className="flex-1" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="sr-only">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Nhập email của bạn"
              className="h-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button
            size="lg"
            className="w-full shadow-md"
            disabled={!email || requestMagicLinkMutation.isPending}
            onClick={handleContinueWithEmail}
          >
            {requestMagicLinkMutation.isPending ? "Đang gửi..." : "Tiếp tục với email"}
          </Button>

          {(error || googleError) && (
            <p className="text-xs text-destructive">{error || googleError}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
