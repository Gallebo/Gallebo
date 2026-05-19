import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Profile } from "@/lib/types/profile";

export function ProfileCard({
  profile,
  email,
}: {
  profile: Profile;
  email: string;
}) {
  const name =
    profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : email;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
        <p className="text-sm text-muted-foreground">{email}</p>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Badge variant="secondary">{profile.status}</Badge>
        {profile.role ? <Badge>{profile.role}</Badge> : null}
      </CardContent>
    </Card>
  );
}
