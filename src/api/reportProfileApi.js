import api from './client';

export async function reportProfile({name, email, reporterProfileId, profileId, reason, details}, signal) {
  if (!profileId || !name?.trim() || !email?.trim() || !reason || !details?.trim()) {
    throw new Error('Add your name, email, reason and details before submitting.');
  }
  const {data} = await api.post('/contact-us', {
    name: name.trim(), email: email.trim(), profile_id: reporterProfileId || undefined,
    subject: 'Report a concern',
    message: `Reported profile: ${profileId}\nReason: ${reason}\n\n${details.trim()}`,
  }, {signal});
  if (data?.success !== true) throw new Error(data?.message || 'Your report was not confirmed. Please try again.');
}
