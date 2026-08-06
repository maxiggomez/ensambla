import { SignIn } from "@clerk/nextjs";

import { getAuthContext, getAuthMode } from "@/lib/auth";
import { DEV_USERS } from "@/lib/auth/mock-users";

import { DevUserPicker } from "../dev-user-picker";

export default async function SignInPage() {
  if (getAuthMode() === "mock") {
    const { userId } = await getAuthContext();
    return <DevUserPicker users={DEV_USERS} currentUserId={userId} />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignIn />
    </main>
  );
}
