"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={10000} swipeDirection="right">
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} duration={10000}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
            <div
              className="toast-countdown absolute bottom-0 left-0 h-1 w-full origin-left bg-[#155bcb] group-[.destructive]:bg-[#e52207]"
              aria-hidden="true"
            />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
