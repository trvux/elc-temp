"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";
import type { z } from "zod";

import { acceptInviteAction, acceptInviteSchema } from "@/modules/auth";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { PasswordChecklist } from "@/shared/components/molecules/auth/password-checklist";

const formSchema = acceptInviteSchema.pick({
  username: true,
  password: true,
  name: true,
  phone: true,
});
type FormValues = z.infer<typeof formSchema>;

export default function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: { username: "", password: "", name: "", phone: "" },
    mode: "onTouched",
  });
  const password = form.watch("password");

  async function onSubmit(values: FormValues) {
    setLoading(true);
    const { error } = await acceptInviteAction({ ...values, token });
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
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Liên kết mời không hợp lệ hoặc đã bị thiếu.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Tạo tài khoản quản trị</CardTitle>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">Tài khoản đã được tạo thành công.</p>
              <Button asChild className="w-full">
                <Link href="/admin/login">Đăng nhập</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Controller
                  control={form.control}
                  name="username"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor="username">Tên đăng nhập</FieldLabel>
                      <Input id="username" autoComplete="username" autoFocus {...field} />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                      <Input id="password" type="password" autoComplete="new-password" {...field} />
                      <PasswordChecklist password={password} />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor="name">Họ tên (không bắt buộc)</FieldLabel>
                      <Input id="name" {...field} />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="phone"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor="phone">Số điện thoại (không bắt buộc)</FieldLabel>
                      <Input id="phone" {...field} />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Đang tạo..." : "Tạo tài khoản"}
                </Button>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
