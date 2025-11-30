"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:shadow-lg",
          title: "group-[.toast]:text-inherit",
          description: "group-[.toast]:!text-inherit group-[.toast]:!opacity-90",
          success:
            "group-[.toaster]:!bg-emerald-600 group-[.toaster]:!text-white group-[.toaster]:!border-emerald-600 dark:group-[.toaster]:!bg-emerald-500 dark:group-[.toaster]:!border-emerald-500 [&_svg]:!text-white",
          error:
            "group-[.toaster]:!bg-red-600 group-[.toaster]:!text-white group-[.toaster]:!border-red-600 dark:group-[.toaster]:!bg-red-500 dark:group-[.toaster]:!border-red-500 [&_svg]:!text-white",
          warning:
            "group-[.toaster]:!bg-amber-500 group-[.toaster]:!text-white group-[.toaster]:!border-amber-500 dark:group-[.toaster]:!bg-amber-400 dark:group-[.toaster]:!border-amber-400 [&_svg]:!text-white",
          info: "group-[.toaster]:!bg-blue-600 group-[.toaster]:!text-white group-[.toaster]:!border-blue-600 dark:group-[.toaster]:!bg-blue-500 dark:group-[.toaster]:!border-blue-500 [&_svg]:!text-white",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
