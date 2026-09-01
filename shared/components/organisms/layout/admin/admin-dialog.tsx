"use client"

import * as React from "react"
import { cn } from "@/shared/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { Button } from "@/shared/components/ui/button"

type AdminDialogSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full" | "screen"

const sizeClasses: Record<AdminDialogSize, string> = {
  xs: "sm:max-w-xs",
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
  "5xl": "sm:max-w-5xl",
  full: "sm:max-w-[calc(100vw-2rem)]",
  screen: "sm:max-w-none w-screen border-none",
}

interface AdminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  size?: AdminDialogSize
  showCloseButton?: boolean
  loading?: boolean
  formId?: string
}

export function AdminDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "lg",
  showCloseButton = true,
  loading = false,
  formId,
}: AdminDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "grid grid-rows-[auto_1fr_auto] gap-0 p-0 overflow-hidden",
          size === "screen" ? "h-screen max-h-screen rounded-none" :
          size === "full" ? "h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]" :
          "max-h-[90vh]",
          sizeClasses[size]
        )}
        aria-describedby={description ? undefined : "dialog-description"}
        showCloseButton={showCloseButton}
      >
        <div className="flex flex-col p-6 pb-2 shrink-0">
          <DialogHeader className="pr-10">
            {title && <DialogTitle className="text-lg font-bold tracking-tight">{title}</DialogTitle>}
            {description && (
              <DialogDescription id="dialog-description" className="text-sm">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        </div>

        <ScrollArea className="min-h-0">
          <div className="p-6 pt-2">
            {children}
          </div>
        </ScrollArea>

        {(footer || formId) && (
          <DialogFooter className="p-6 border-t bg-muted/30 shrink-0">
            {footer ? (
              footer
            ) : (
              <div className="flex justify-end gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Hủy
                </Button>
                {formId && (
                  <Button type="submit" form={formId} disabled={loading}>
                    {loading ? "Đang xử lý..." : "Lưu thay đổi"}
                  </Button>
                )}
              </div>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
