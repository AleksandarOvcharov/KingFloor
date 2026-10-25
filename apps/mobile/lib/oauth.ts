import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export type OAuthProvider = 'google' | 'github';

// Mirrors apps/web's signInWithGoogle/signInWithGitHub (hooks/useAuth.ts),
// but native apps can't receive Supabase's HTTP redirect — there's no
// server to land on — so this opens the provider's consent screen in an
// in-app browser tab and waits for Supabase to bounce back to our own
// deep link (exp://<lan-ip>:8081/--/... in Expo Go, hacktemplate://... in
// a standalone build) with the session tokens in the URL, then hands them
// to supabase-js directly via setSession() instead of relying on it to
// parse a redirect (detectSessionInUrl is false on this client).
//
// Supabase's own redirect allow-list can only hold stable URLs — Expo Go's
// deep link changes with every dev session (it's tied to the current LAN
// IP), so it can never be registered there directly. apps/web/app/mobile
// is a small bridge page for exactly this: Supabase is told to land on
// that fixed HTTPS URL (with the real deep link URL-encoded in `?to=`),
// and that page's own JS forwards the tokens on to it. openAuthSessionAsync
// is still given the *real* deep link as its return-URL to watch for — it
// intercepts that scheme regardless of how many HTTP redirects happened
// first, so the bridge's extra hop is invisible to it.
export async function signInWithOAuth(provider: OAuthProvider): Promise<{ error: string | null }> {
  const appRedirect = Linking.createURL('auth/callback');
  const bridgeRedirect = `${API_URL}/mobile?to=${encodeURIComponent(appRedirect)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: bridgeRedirect,
      skipBrowserRedirect: true,
    },
  });
  if (error) return { error: error.message };
  if (!data.url) return { error: 'No auth URL returned' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, appRedirect);
  if (result.type !== 'success') {
    // User cancelled/dismissed the browser — not an error to surface.
    return { error: null };
  }

  const { params, errorCode } = QueryParams.getQueryParams(result.url);
  if (errorCode) return { error: errorCode };
  if (params.error_description) return { error: params.error_description };

  const { access_token, refresh_token } = params;
  if (!access_token || !refresh_token) return { error: 'No session tokens returned' };

  const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
  if (sessionError) return { error: sessionError.message };

  return { error: null };
}
