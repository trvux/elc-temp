import {User} from "@supabase/supabase-js";
import {z} from "zod";

export type AuthUser = User;

export const loginSchema = z.object({
    email: z.email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export interface AuthResponse {
    user: AuthUser | null;
    error: string | null;
}

