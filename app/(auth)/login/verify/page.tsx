import { Suspense } from "react";

import { AuthLayout } from "@/shared/components/organisms/layout/auth/auth-layout";
import { VerifyCodeForm } from "@/modules/auth/presentation/components/VerifyCodeForm";

export default function VerifyPage() {
  return (
    <AuthLayout>
      <Suspense>
        <VerifyCodeForm />
      </Suspense>
    </AuthLayout>
  );
}
