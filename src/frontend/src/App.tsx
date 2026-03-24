import { Toaster } from "@/components/ui/sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Dashboard from "./components/Dashboard";
import LoginScreen from "./components/LoginScreen";
import ProfileSetup from "./components/ProfileSetup";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

function AppContent() {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const isAuthenticated = !!identity;

  const profileQuery = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: false,
  });

  const isProfileLoading = actorFetching || profileQuery.isLoading;
  const showProfileSetup =
    isAuthenticated &&
    !isProfileLoading &&
    profileQuery.isFetched &&
    profileQuery.data === null;

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showProfileSetup) {
    return <ProfileSetup />;
  }

  return <Dashboard userName={profileQuery.data?.name ?? "User"} />;
}

export default function App() {
  return (
    <>
      <AppContent />
      <Toaster />
    </>
  );
}
