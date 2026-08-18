"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";

import { resetPasswordAction, resetPasswordSchema } from "@/modules/auth";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { PasswordChecklist } from "@/shared/components/molecules/auth/password-checklist";

const formSchema = resetPasswordSchema.pick({ password: true });
type FormValues = { password: string };

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: { password: "" },
    mode: "onTouched",
  });
  const password = form.watch("password");

  async function onSubmit(values: FormValues) {
    setLoading(true);
    const { error } = await resetPasswordAction({ token, password: values.password });
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    setDone(true);
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Liên kết không hợp lệ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Liên kết đặt lại mật khẩu bị thiếu hoặc không hợp lệ.
            </p>
            <Link href="/admin/forgot-password" className="text-sm text-primary hover:underline">
              Yêu cầu liên kết mới
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Đặt lại mật khẩu</CardTitle>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">Mật khẩu đã được đặt lại thành công.</p>
              <Button asChild className="w-full">
                <Link href="/admin/login">Đăng nhập</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Controller
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor="password">Mật khẩu mới</FieldLabel>
                      <Input id="password" type="password" autoComplete="new-password" autoFocus {...field} />
                      <PasswordChecklist password={password} />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                </Button>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
