import LoginForm from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-ink/[0.03] font-ui">
      <div className="grid-container py-24 md:py-48">
        <div className="grid-matrix">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
