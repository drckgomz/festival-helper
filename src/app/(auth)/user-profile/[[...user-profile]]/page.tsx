// src/app/(auth)/user-profile/[[...user-profile]]/page.tsx
import { UserProfile } from "@clerk/nextjs";

export default function UserProfilePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <UserProfile routing="path" path="/user-profile" />
    </div>
  );
}
