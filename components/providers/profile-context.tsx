"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import type { DocumentSnapshot, FirestoreError } from "firebase/firestore";
import { User } from "firebase/auth";
import { UserProfile } from "@/lib/db/users";
import { logger, maskIdentifier } from "@/lib/logger";

/**
 * ProfileContext - User profile state
 *
 * Separated from auth to prevent re-renders when profile updates.
 * Only components that need profile data subscribe to this.
 */

interface ProfileContextType {
  profile: UserProfile | null;
  profileError: string | null;
  profileNotFound: boolean;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  profileError: null,
  profileNotFound: false,
});

interface ProfileProviderProps {
  children: ReactNode;
  user: User | null;
}

export function ProfileProvider({ children, user }: Readonly<ProfileProviderProps>) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const previousProfileRef = useRef<UserProfile | null>(null);

  /**
   * Shallow equality check for profile data
   */
  const isProfileEqual = (a: UserProfile | null, b: UserProfile | null): boolean => {
    if (a === b) return true;
    if (!a || !b) return false;

    const keysA = Object.keys(a) as Array<keyof UserProfile>;
    const keysB = Object.keys(b) as Array<keyof UserProfile>;

    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => a[key] === b[key]);
  };

  const handleProfileSnapshot = useCallback((docSnap: DocumentSnapshot) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as UserProfile;

      if (!isProfileEqual(data, previousProfileRef.current)) {
        previousProfileRef.current = data;
        setProfile(data);
        setProfileNotFound(false);
      }
    } else {
      if (previousProfileRef.current !== null) {
        previousProfileRef.current = null;
        setProfile(null);
        setProfileNotFound(true);
      }
    }
    setProfileError(null);
  }, []);

  const handleProfileError = useCallback(
    (currentUserId: string) => (error: FirestoreError) => {
      logger.error("Error fetching user profile", {
        userId: maskIdentifier(currentUserId),
        error,
      });
      setProfileError("Failed to load profile");
    },
    []
  );

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileError(null);
      setProfileNotFound(false);
      previousProfileRef.current = null;
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const setupListener = async () => {
      try {
        const [firestore, firebase] = await Promise.all([
          import("firebase/firestore"),
          import("@/lib/firebase"),
        ]);

        unsubscribe = firestore.onSnapshot(
          firestore.doc(firebase.db, "users", user.uid),
          handleProfileSnapshot,
          handleProfileError(user.uid)
        );
      } catch (error) {
        logger.error("Error setting up profile listener", {
          userId: maskIdentifier(user.uid),
          error,
        });
        setProfileError("Failed to start profile listener");
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, handleProfileSnapshot, handleProfileError]);

  return (
    <ProfileContext.Provider value={{ profile, profileError, profileNotFound }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
