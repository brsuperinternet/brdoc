import { ILoginResponse } from "@/features/auth/types/auth.types.ts";
import api from "@/lib/api-client.ts";

interface ILdapLogin {
  password: string;
  providerId: string;
  username: string;
  workspaceId: string;
}

export async function ldapLogin(data: ILdapLogin): Promise<ILoginResponse> {
  const requestData = {
    password: data.password,
    username: data.username,
  };

  const response = await api.post<ILoginResponse>(
    `/sso/ldap/${data.providerId}/login`,
    requestData
  );

  return response.data;
}
