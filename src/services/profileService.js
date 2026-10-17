// EN: Provides the current-user profile contract, including profile updates, avatar lifecycle, and account deletion.
// UK: Надає контракт профілю поточного користувача, включно з оновленням, життєвим циклом аватара та видаленням акаунта.
import { apiRequest } from './api';
import { createAvatarFormData } from './avatarFormData';

const identityContractHeaders = { 'X-Profile-Contract': 'v2' };

export const profileService = {
  get: (token) => apiRequest('/users/me', {
    headers: identityContractHeaders,
  }, token, 'Profile request failed'),
  checkUsername: (username, token, signal) => apiRequest(
    `/users/me/username-availability?username=${encodeURIComponent(username)}`,
    { signal },
    token,
    'Username availability check failed',
  ),
  update: (profile, token) => apiRequest('/users/me', {
    method: 'PATCH',
    headers: identityContractHeaders,
    body: JSON.stringify(profile),
  }, token, 'Profile request failed'),
  updateUsername: (username, token) => apiRequest('/users/me/username', {
    method: 'PATCH',
    body: JSON.stringify({ username }),
  }, token, 'Username update failed'),
  uploadAvatar: async (asset, token) => apiRequest('/users/me/avatar', {
    method: 'POST',
    headers: identityContractHeaders,
    body: await createAvatarFormData(asset),
  }, token, 'Avatar upload failed'),
  removeAvatar: (token) => apiRequest('/users/me/avatar', {
    method: 'DELETE',
    headers: identityContractHeaders,
  }, token, 'Avatar removal failed'),
};
