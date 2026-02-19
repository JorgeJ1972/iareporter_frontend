import { PublicClientApplication, type AuthenticationResult, type PopupRequest } from "@azure/msal-browser";

const DEFAULT_SCOPES = (import.meta.env.VITE_AZURE_AD_SCOPES ?? "openid profile email")
  .split(" ")
  .map((scope: string) => scope.trim())
  .filter((scope: string | any[]) => scope.length > 0);

const CLIENT_ID = import.meta.env.VITE_AZURE_AD_CLIENT_ID ?? "d1574034-c6ad-497f-90f3-2312e6773ea7";
const TENANT_ID = import.meta.env.VITE_AZURE_AD_TENANT_ID ?? "93f33571-550f-43cf-b09f-cd331338d086";
const AUTHORITY =
  import.meta.env.VITE_AZURE_AD_AUTHORITY ?? `https://login.microsoftonline.com/${TENANT_ID}`;
const REDIRECT_URI = import.meta.env.VITE_AZURE_AD_REDIRECT_URI ?? window.location.origin;

const loginRequest: PopupRequest = {
  scopes: DEFAULT_SCOPES,
};

let msalInstance: PublicClientApplication | null = null;

const ensureMsalInstance = async (): Promise<PublicClientApplication> => {
  if (!CLIENT_ID || !AUTHORITY) {
    throw new Error("AZURE_AD_NOT_CONFIGURED");
  }

  if (!msalInstance) {
    msalInstance = new PublicClientApplication({
      auth: {
        clientId: CLIENT_ID,
        authority: AUTHORITY,
        redirectUri: REDIRECT_URI,
      },
      cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false,
      },
    });
    await msalInstance.initialize();
  }
  return msalInstance;
};

export const loginWithAzurePopup = async (): Promise<AuthenticationResult> => {
  const instance = await ensureMsalInstance();
  const result = await instance.loginPopup(loginRequest);
  if (result.account) {
    instance.setActiveAccount(result.account);
  }
  return result;
};

export const getActiveAzureAccountEmail = (): string | undefined => {
  const instance = msalInstance ?? null;
  const account = instance?.getActiveAccount() ?? instance?.getAllAccounts()[0];
  return account?.username;
};

export const logoutAzure = async (): Promise<void> => {
  const instance = msalInstance;
  if (!instance) {
    return;
  }
  await instance.logoutPopup({});
};
