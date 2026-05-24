import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthFooterLink, AuthFieldFooter } from "@/components/auth/auth-form-styles";

export const metadata = { title: "Forgot password — Gallebo" };

export default function ForgotPasswordPage() {
  return (
    <AuthSplitLayout
      eyebrow="Forgot password"
      title="Reset your password."
      subtitle="Enter the email on your account and we will send you a link to choose a new password."
      panelTag="GALLEBO / EASA / ACCOUNT"
      quote="I locked myself out before a dawn departure — one email, one link, and I was back in the cockpit in minutes."
      attribution="Marko P. · Pilot · Osijek · 47 flights"
      footer={
        <AuthFieldFooter>
          Remember your password?{" "}
          <AuthFooterLink href="/login">Back to sign in</AuthFooterLink>
        </AuthFieldFooter>
      }
    >
      <ForgotPasswordForm />
    </AuthSplitLayout>
  );
}
