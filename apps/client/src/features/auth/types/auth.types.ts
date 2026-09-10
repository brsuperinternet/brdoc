export interface ILogin {
  email: string;
  password: string;
}

export interface IRegister {
  email: string;
  name?: string;
  password: string;
}

export interface ISetupWorkspace {
  email: string;
  name: string;
  password: string;
  workspaceName?: string;
}

export interface IChangePassword {
  newPassword: string;
  oldPassword: string;
}

export interface IForgotPassword {
  email: string;
}

export interface IPasswordReset {
  newPassword: string;
  token?: string;
}

export interface IVerifyUserToken {
  token: string;
  type: string;
}

export interface ICollabToken {
  token?: string;
}

export interface ILoginResponse {
  isMfaEnforced?: boolean;
  mfaToken?: string;
  requiresMfaSetup?: boolean;
  userHasMfa?: boolean;
}
