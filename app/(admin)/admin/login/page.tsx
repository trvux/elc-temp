"use client";

import { useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";

import { loginAction, loginSchema, type LoginInput } from "@/modules/auth";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/components/ui/field";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const form = useForm<LoginInput>({
    resolver: standardSchemaResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
    // onTouched: no error shown while first typing into a field, but once a
    // field has been visited once it re-validates live on every keystroke —
    // the standard pattern for login forms (validate late, then live).
    mode: "onTouched",
  });

  async function onSubmit(values: LoginInput) {
    setLoading(true);
    const result = await loginAction(values);
    // On success loginAction redirects server-side and never returns here.
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Đăng nhập Quản trị</CardTitle>
          <CardDescription className="text-center">
            Đăng nhập bằng tên đăng nhập hoặc email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                control={form.control}
                name="identifier"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="identifier">Tên đăng nhập hoặc email</FieldLabel>
                    <Input id="identifier" autoComplete="username" autoFocus {...field} />
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
                    <Input id="password" type="password" autoComplete="current-password" {...field} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <div className="flex justify-end -mt-2">
                <Link href="/admin/forgot-password" className="text-sm text-muted-foreground hover:text-primary">
                  Quên mật khẩu?
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
