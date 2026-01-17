import ProfileLayoutClient from "@/components/my/ProfileLayoutClient";

export default function UserProfileLayout({ children }: { children: React.ReactNode }) {
  return <ProfileLayoutClient>{children}</ProfileLayoutClient>;
}
