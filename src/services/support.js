import { supabase } from '../../supabase';

export async function createSupportTicket({ category, subject, message }) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error('You must be signed in.');

  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: user.id,
      category,
      subject: subject.trim(),
      message: message.trim(),
    })
    .select('id, category, subject, message, status, priority, ai_summary, ai_recommendation, created_at')
    .single();

  if (error) throw error;

  // The agent runs server-side with JWT verification. The mobile app never holds
  // an AI/service-role secret.
  try {
    await supabase.functions.invoke('support-agent', { body: { ticket_id: data.id } });
  } catch (_) {
    // A support-agent outage must never prevent the complaint from being submitted.
  }

  return data;
}

export async function getMySupportTickets() {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('id, category, subject, message, status, priority, ai_summary, ai_recommendation, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getPrivacySettings() {
  const { data, error } = await supabase
    .from('user_privacy_settings')
    .select('support_ai_enabled, product_analytics_enabled, security_monitoring_acknowledged, privacy_version, terms_version')
    .single();

  if (error) throw error;
  return data;
}

export async function updatePrivacySettings(values) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error('You must be signed in.');

  // Only allow the two user-editable switches exposed by the privacy screen.
  // In particular, never accept user_id or policy/version fields from the caller.
  const safeValues = {};
  if (typeof values?.support_ai_enabled === 'boolean') {
    safeValues.support_ai_enabled = values.support_ai_enabled;
  }
  if (typeof values?.product_analytics_enabled === 'boolean') {
    safeValues.product_analytics_enabled = values.product_analytics_enabled;
  }
  if (Object.keys(safeValues).length === 0) {
    throw new Error('No valid privacy setting was provided.');
  }

  const { data, error } = await supabase
    .from('user_privacy_settings')
    .upsert({ ...safeValues, user_id: user.id })
    .select('support_ai_enabled, product_analytics_enabled, security_monitoring_acknowledged, privacy_version, terms_version')
    .single();

  if (error) throw error;
  return data;
}

export async function requestAccountDeletion(reason) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error('You must be signed in.');

  const { data, error } = await supabase
    .from('account_deletion_requests')
    .insert({ user_id: user.id, reason: reason?.trim() || null })
    .select('id, status, created_at')
    .single();

  if (error) throw error;
  return data;
}
