"use client";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { useState } from "react";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Field, FieldContent, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";

export interface CardServiceProps {
  title?: string;
  price?: string;
  image?: string;
  description?: string;
  badges?: string[];
  slug?: string;
}

export function CardService({
  title,
  price,
  image,
  description,
  badges,
  slug,
}: CardServiceProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Vui lòng nhập đầy đủ họ tên và số điện thoại");
      return;
    }

    toast.success("Gửi yêu cầu đặt lịch thành công! ELC sẽ liên hệ sớm nhất.");
    setOpen(false);
    setName("");
    setPhone("");
    setFile(null);
  };

  const imageSrc = image || "/placeholder.png";

  const renderImage = () => {
    const imgEl = (
      <img
        src={imageSrc}
        alt={title}
        className="relative z-20 aspect-video w-full object-cover"
        loading="lazy"
      />
    );

    if (slug) {
      return (
        <Link
          href={`/dich-vu/${slug}`}
          className="block relative z-20 overflow-hidden"
        >
          {imgEl}
        </Link>
      );
    }
    return imgEl;
  };

  const renderTitle = () => {
    if (slug) {
      return (
        <Link
          href={`/dich-vu/${slug}`}
          className="hover:text-primary transition-colors"
        >
          {title}
        </Link>
      );
    }
    return title;
  };

  return (
    <Card className="relative mx-auto w-full max-w-sm pt-0 overflow-hidden flex flex-col h-full group">
      {/* Thumbnail overlay at top */}
      <div className="relative aspect-video w-full overflow-hidden">
        <div className="absolute inset-0 z-30 bg-black/35 pointer-events-none" />
        {renderImage()}
      </div>

      {/* Info details */}
      <CardHeader className="flex-1">
        <CardTitle className="text-lg leading-tight">{renderTitle()}</CardTitle>

        {/* Display badges if exists */}
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {badges.map((badge, idx) => (
              <Badge
                key={idx}
                variant="secondary"
              >
                {badge}
              </Badge>
            ))}
          </div>
        )}

        {description && (
          <CardDescription className="mt-2 line-clamp-2">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      {/* Footer controls */}
      <CardFooter className="mt-auto flex flex-col gap-2 w-full">
        {/* Price block designed as a secondary button-like element */}
        <div
          className="flex h-9 w-full items-center justify-center rounded-md bg-secondary px-3 text-sm font-semibold text-secondary-foreground truncate"
          title={price}
        >
          {price}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Đặt lịch</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Đặt lịch dịch vụ</DialogTitle>
                <DialogDescription>
                  Vui lòng cung cấp thông tin để chúng tôi liên hệ hỗ trợ bạn
                  dịch vụ <strong>{title}</strong>.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Field>
                  <FieldLabel>Họ và tên</FieldLabel>
                  <FieldContent>
                    <Input
                      placeholder="Nhập tên của bạn"
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setName(e.target.value)
                      }
                      required
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel>Số điện thoại</FieldLabel>
                  <FieldContent>
                    <Input
                      type="tel"
                      placeholder="Nhập số điện thoại"
                      value={phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPhone(e.target.value)
                      }
                      required
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel>Hình ảnh (nếu có)</FieldLabel>
                  <FieldContent>
                    <Input
                      type="file"
                      accept="image/*"
                      className="cursor-pointer"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setFile(e.target.files[0]);
                        }
                      }}
                    />
                  </FieldContent>
                </Field>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full sm:w-auto">
                  Gửi yêu cầu
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
