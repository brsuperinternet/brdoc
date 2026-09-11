export interface UserSpaceRole {
  role: string;
  userId: string;
}

interface SpaceUserInfo {
  avatarUrl: string;
  email: string;
  id: string;
  name: string;
  type: "user";
}

interface SpaceGroupInfo {
  id: string;
  isDefault: boolean;
  memberCount: number;
  name: string;
  type: "group";
}

export type MemberInfo = SpaceUserInfo | SpaceGroupInfo;
