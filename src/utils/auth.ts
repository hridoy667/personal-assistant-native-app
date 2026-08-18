// src/utils/auth.ts
import { jwtDecode } from 'jwt-decode';
import { tokenStorage } from '@/lib/client';

export interface DecodedTokenPayload {
  sub: string;
  name: string;
  avatarUrl: string | null;
  district: string;
  timezone?: string;
  timzone?: string;
  latitude: number | null;
  longitude: number | null;
  exp?: number;
}

export async function getUserFromToken(): Promise<DecodedTokenPayload | null> {
  try {
    const accessToken = await tokenStorage.getAccessToken();
    if (!accessToken) return null;
    return jwtDecode<DecodedTokenPayload>(accessToken);
  } catch {
    return null;
  }
}