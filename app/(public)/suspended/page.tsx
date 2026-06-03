export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Account Suspended</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Your account has been suspended. Please contact us at{" "}
        <a href="mailto:support@gallebo.app" className="text-primary underline">
          support@gallebo.app
        </a>
      </p>
      <a href="/" className="text-primary underline">
        Back to home
      </a>
    </div>
  );
}

export const metadata = {
  title: "Account Suspended - Gallebo",
  robots: { index: false },
};
