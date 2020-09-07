declare class Admin {
    constructor(user: User);

    createUser(email: string, password: string, attributes?: any): Promise<UserData>;
    deleteUser(user: UserData): Promise<void>;
    getUser(user: UserData): Promise<UserData>;
    listUsers(aud: string): Promise<UserData[]>;
    updateUser(user: UserData, attributes?: any): Promise<void>;
}

export interface GoTrueInit {
    APIUrl?: string;
    audience?: string;
    setCookie?: boolean;
}

declare class GoTrue {
    constructor(init?: GoTrueInit);

    acceptInvite(token: string, password: string, remember?: boolean): Promise<User>;
    acceptInviteExternalUrl(provider: string, token: string): string;
    confirm(token: string, remember?: boolean): Promise<User>;
    createUser(tokenResponse: any, remember?: boolean): Promise<User>;
    currentUser(): User | null;
    login(email: string, password: string, remember?: boolean): Promise<User>;
    loginExternalUrl(provider: string): string;
    recover(token: string, remember?: boolean): Promise<User>;
    requestPasswordRecovery(email: string): Promise<void>;
    settings(): Promise<Settings>;
    signup(email: string, password: string, data?: any): Promise<User>;
    verify(type: string, token: string, remember?: boolean): Promise<User>;
}

export interface Settings {
    autoconfirm: boolean;
    disable_signup: boolean;
    external: {
        bitbucket: boolean;
        email: boolean;
        facebook: boolean;
        github: boolean;
        gitlab: boolean;
        google: boolean;
    }
}

export interface Token {
    access_token: string;
    expires_at: number;
    expires_in: number;
    refresh_token: string;
    token_type: 'bearer';
}

export declare class User implements UserData {
    constructor(api: any, tokenResponse: any, audience: string);

    static removeSavedSession(): void;
    static recoverSession(api: any): User | null;

    admin: Admin;

    // Must be copied from UserData :(

    app_metadata: any;
    aud: string;
    audience: string;
    confirmed_at: string;
    created_at: string;
    email: string;
    id: string;
    role: string;
    token: Token;
    updated_at: string;
    url: string;
    user_metadata: any;

    clearSession(): void;
    getUserData(): Promise<UserData>;
    jwt(forceRefresh?: boolean): Promise<string>;
    logout(): Promise<void>;
    tokenDetails(): Token;
    update(attributes: any): Promise<User>;
}

export interface UserData {
    app_metadata: any;
    aud: string;
    audience: string;
    confirmed_at: string;
    created_at: string;
    email: string;
    id: string;
    role: string;
    token: Token;
    updated_at: string;
    url: string;
    user_metadata: any;
}

export default GoTrue;

declare global {
    interface Window {
        GoTrue: typeof GoTrue;
    }
}
