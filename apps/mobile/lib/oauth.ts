import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export type OAuthProvider = 'google';

function extractTokens(url: string): { error: string | null; access_token?: string; refresh_token?: string } {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) return { error: errorCode };
  if (params.error_description) return { error: params.error_description };
  const { access_token, refresh_token } = params;
  if (!access_token || !refresh_token) return { error: 'No session tokens returned' };
  return { error: null, access_token, refresh_token };
}

async function completeSessionFromUrl(url: string): Promise<{ error: string | null }> {
  const tokens = extractTokens(url);
  if (tokens.error || !tokens.access_token || !tokens.refresh_token) return { error: tokens.error };
  const { error } = await supabase.auth.setSession({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });
  return { error: error?.message ?? null };
}

// Belt-and-suspenders alongside signInWithOAuth's own await on
// openAuthSessionAsync below: that promise only resolves if the native
// auth-session APIs recognize the browser's navigation to `appRedirect` as
// "the flow is done" and close themselves. Under Expo Go specifically,
// that interception is not fully reliable (it's really designed around an
// app owning its own registered URL scheme, not Expo Go's shared `exp://`
// wrapper) — if it doesn't fire, the OS still hands the tapped link to the
// app as a perfectly normal deep link, which this global listener catches
// independently and uses to finish signing in regardless of whether the
// browser-session promise above ever resolved.
Linking.getInitialURL().then((url) => {
  if (url?.includes('access_token')) completeSessionFromUrl(url);
});
Linking.addEventListener('url', ({ url }) => {
  if (url.includes('access_token')) completeSessionFromUrl(url);
});

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
    // User cancelled/dismissed the browser, or (under Expo Go) the OS
    // handed the tapped link to the app as a plain deep link instead of
    // resolving this promise — either way, the global listener above
    // will have already completed the session if the URL carried tokens.
    return { error: null };
  }

  return completeSessionFromUrl(result.url);
}
