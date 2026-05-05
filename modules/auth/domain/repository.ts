import { AuthUser, LoginInput } from "./types";

export interface AuthRepository {
    getCurrentUser(): Promise<AuthUser | null>;

    login(
        input: LoginInput,
    ): Promise<{ user: AuthUser | null; error: string | null }>;

    logout(): Promise<{ error: string | null }>;
}
