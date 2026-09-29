import { supabase } from '../../supabase';

export async function getCurrentProfile() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, virtual_balance, points, streak_days, premium_until, created_at')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateDisplayName(displayName) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error('You must be signed in.');

  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', user.id)
    .select('id, username, display_name, virtual_balance, points, streak_days, premium_until, created_at')
    .single();

  if (error) throw error;
  return data;
}
