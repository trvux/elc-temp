"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";
import { Camera, Spinner } from "@phosphor-icons/react";

import {
  AuthUser,
  changePasswordAction,
  ChangePasswordInput,
  changePasswordSchema,
  updateProfileAction,
  UpdateProfileInput,
  updateProfileSchema,
} from "@/modules/auth";
import { PasswordChecklist } from "@/shared/components/molecules/auth/password-checklist";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Separator } from "@/shared/components/ui/separator";
import { convertToWebP } from "@/shared/lib/image";
import { uploadImageFile } from "@/shared/lib/upload-image";

export default function AccountForm({ user }: { user: AuthUser }) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const displayName = user.name || user.username;

  const profileForm = useForm<UpdateProfileInput>({
    resolver: standardSchemaResolver(updateProfileSchema),
    defaultValues: { name: user.name, email: user.email, avatarUrl: user.avatarUrl },
    mode: "onTouched",
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: standardSchemaResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
    mode: "onTouched",
  });
  const newPassword = passwordForm.watch("newPassword");

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp tin hình ảnh");
      return;
    }

    setUploadingAvatar(true);
    try {
      const webpFile = await convertToWebP(file);
      const url = await uploadImageFile(webpFile, "avatars", webpFile.name);
      setAvatarUrl(url);
      profileForm.setValue("avatarUrl", url, { shouldDirty: true });
      toast.success("Đã tải ảnh lên — nhấn Lưu thay đổi để hoàn tất");
    } catch (err) {
      console.error("[AccountForm] avatar upload error:", err);
      toast.error("Không thể tải ảnh lên, vui lòng thử lại");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function onSubmitProfile(values: UpdateProfileInput) {
    setSavingProfile(true);
    const { error } = await updateProfileAction(values);
    setSavingProfile(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Đã cập nhật thông tin tài khoản");
  }

  async function onSubmitPassword(values: ChangePasswordInput) {
    setChangingPassword(true);
    // On success, changePasswordAction redirects server-side to /admin/login
    // and never returns here — only a failure path reaches this line.
    const result = await changePasswordAction(values);
    setChangingPassword(false);
    if (result?.error) {
      toast.error(result.error);
    }
  }

  return (
    <div className="max-w-2xl pb-20 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tài khoản của tôi</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý thông tin cá nhân và mật khẩu đăng nhập.
        </p>
      </div>

      <Card className="overflow-hidden border-border/40 shadow-sm rounded-2xl">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-lg font-bold tracking-tight">Thông tin cá nhân</CardTitle>
          <CardDescription className="text-sm">
            Tên hiển thị, email và ảnh đại diện của bạn.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <form onSubmit={profileForm.handleSubmit(onSubmitProfile)}>
            <FieldGroup>
              <div className="relative w-fit">
                <Avatar className="h-20 w-20 rounded-full border">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="rounded-full text-lg">
                    {displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  {uploadingAvatar ? (
                    <Spinner className="size-3.5 animate-spin" />
                  ) : (
                    <Camera className="size-3.5" />
                  )}
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={uploadingAvatar}
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>

              <Controller
                control={profileForm.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="name">Tên hiển thị</FieldLabel>
                    <Input id="name" {...field} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={profileForm.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" type="email" {...field} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/40 shadow-sm rounded-2xl">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-lg font-bold tracking-tight">Đổi mật khẩu</CardTitle>
          <CardDescription className="text-sm">
            Sau khi đổi mật khẩu, bạn sẽ cần đăng nhập lại trên mọi thiết bị.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)}>
            <FieldGroup>
              <Controller
                control={passwordForm.control}
                name="currentPassword"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="currentPassword">Mật khẩu hiện tại</FieldLabel>
                    <Input id="currentPassword" type="password" autoComplete="current-password" {...field} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={passwordForm.control}
                name="newPassword"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="newPassword">Mật khẩu mới</FieldLabel>
                    <Input id="newPassword" type="password" autoComplete="new-password" {...field} />
                    <PasswordChecklist password={newPassword} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" variant="destructive" disabled={changingPassword}>
                  {changingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
