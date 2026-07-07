import LoginForm from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="grid-container py-24 md:py-48">
      <div className="grid-matrix">
        <div className="md:col-start-4 md:col-span-6 lg:col-start-5 lg:col-span-4">
          <h1 className="font-serif text-2xl tracking-wide">Administration</h1>
          <p className="mt-4 font-sans text-[11px] uppercase tracking-widest text-ink/50">
            Accès réservé à l&rsquo;atelier
          </p>
        </div>
      </div>
      <div className="grid-matrix mt-8">
        <LoginForm />
      </div>
    </div>
  );
}
