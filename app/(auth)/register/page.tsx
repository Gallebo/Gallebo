import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { RegisterForm } from "@/components/auth/register-form";
import { AuthFooterLink, AuthFieldFooter } from "@/components/auth/auth-form-styles";

export const metadata = { title: "Sign up — Gallebo" };

export default function RegisterPage() {
  return (
    <AuthSplitLayout
      eyebrow="Sign up"
      title="Join Gallebo."
      subtitle="Create an account to book shared flights or publish your own routes as a pilot."
      panelTag="GALLEBO / EASA / PILOT"
      quote="Cost-sharing changed how I fly — empty seats become shared adventures, and every landing feels like arriving with friends."
      attribution="Ana K. · Passenger · Split · 28 flights"
      footer={
        <AuthFieldFooter>
          Already have an account?{" "}
          <AuthFooterLink href="/login">Log in</AuthFooterLink>
        </AuthFieldFooter>
      }
    >
      <RegisterForm />
    </AuthSplitLayout>
  );
}
