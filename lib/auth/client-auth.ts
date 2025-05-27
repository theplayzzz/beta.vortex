import { useUser } from '@clerk/nextjs';

export function useCurrentUser() {
  const { user, isLoaded, isSignedIn } = useUser();
  
  if (!isLoaded) {
    return { user: null, isLoading: true, isSignedIn: false };
  }
  
  if (!isSignedIn || !user) {
    return { user: null, isLoading: false, isSignedIn: false };
  }
  
  return {
    user: {
      id: user.id,
      clerkId: user.id,
      email: user.primaryEmailAddress?.emailAddress || '',
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.imageUrl,
      creditBalance: 0 // Será buscado da API se necessário
    },
    isLoading: false,
    isSignedIn: true
  };
} 