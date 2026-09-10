import { useAtom } from "jotai";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom.ts";
import { UserRole } from "@/lib/types.ts";

export const useUserRole = () => {
  const [currentUser] = useAtom(currentUserAtom);

  const isAdmin =
    currentUser?.user?.role === UserRole.ADMIN ||
    currentUser?.user?.role === UserRole.OWNER;

  const isOwner = currentUser?.user?.role === UserRole.OWNER;

  const isMember = currentUser?.user?.role === UserRole.MEMBER;

  return { isAdmin, isMember, isOwner };
};

export default useUserRole;
