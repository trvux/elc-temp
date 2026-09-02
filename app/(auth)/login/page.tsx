import { AuthLayout } from "@/shared/components/organisms/layout/auth/auth-layout";
import { LoginForm } from "@/modules/auth/presentation/components/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
