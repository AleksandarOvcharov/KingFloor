import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'github';

// Mirrors apps/web's signInWithGoogle/signInWithGitHub (hooks/useAuth.ts),
// but native apps can't receive Supabase's HTTP redirect — there's no
// server to land on — so this opens the provider's consent screen in an
// in-app browser tab and waits for Supabase to bounce back to our own
// `hacktemplate://` deep link with the session tokens in the URL, then
// hands them to supabase-js directly via setSession() instead of relying
// on it to parse a redirect (detectSessionInUrl is false on this client).
export async function signInWithOAuth(provider: OAuthProvider): Promise<{ error: string | null }> {
  const redirectTo = Linking.createURL('auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) return { error: error.message };
  if (!data.url) return { error: 'No auth URL returned' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
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
