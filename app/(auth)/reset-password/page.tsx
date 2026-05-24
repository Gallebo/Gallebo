import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthFooterLink, AuthFieldFooter } from "@/components/auth/auth-form-styles";

export const metadata = { title: "Set new password — Gallebo" };

export default function ResetPasswordPage() {
  return (
    <AuthSplitLayout
      eyebrow="New password"
      title="Choose a new password."
      subtitle="Pick a strong password you have not used elsewhere. You will use it the next time you sign in."
      panelTag="GALLEBO / EASA / ACCOUNT"
      quote="A fresh password and I was booking the return leg before the coffee cooled — simple, secure, done."
      attribution="Ivana R. · Passenger · Rijeka · 15 flights"
      footer={
        <AuthFieldFooter>
          <AuthFooterLink href="/login">Back to sign in</AuthFooterLink>
        </AuthFieldFooter>
      }
    >
      <ResetPasswordForm />
    </AuthSplitLayout>
  );
}
