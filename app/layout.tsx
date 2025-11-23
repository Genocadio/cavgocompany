import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { ApolloProviderWrapper } from "@/components/apollo-provider"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Bus Admin Dashboard",
  description: "Admin dashboard for bus fare collection system",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ApolloProviderWrapper>{children}</ApolloProviderWrapper>
        </AuthProvider>
        <Toaster position="top-right" richColors closeButton expand={false} duration={4000} />
      </body>
    </html>
  )
}
