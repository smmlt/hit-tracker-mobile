import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import { createProfileRequestGuard } from '../utils/profileRequestGuard';

const profileRequestGuard = createProfileRequestGuard();

export function useProfile(autoLoad = false) {
  const { logout, updateUserData, userData, userToken } = useContext(AuthContext);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userToken) return null;
    setIsLoading(true);
    setError(null);
    const readVersion = profileRequestGuard.beginRead();
    try {
      const profile = await profileService.get(userToken);
      if (profileRequestGuard.shouldApplyRead(readVersion)) {
        await updateUserData(profile);
      }
      return profile;
    } catch (requestError) {
      if (requestError.status === 401) await logout();
      else setError(requestError.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [logout, updateUserData, userToken]);

  const save = useCallback(async (changes) => {
    setIsLoading(true);
    setError(null);
    const mutationVersion = profileRequestGuard.beginMutation();
    try {
      const profile = await profileService.update(changes, userToken);
      if (profileRequestGuard.completeMutation(mutationVersion)) {
        await updateUserData(profile);
      }
      return profile;
    } catch (requestError) {
      if (requestError.status === 401) await logout();
      else setError(requestError.message);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, [logout, updateUserData, userToken]);

  const saveUsername = useCallback(async (username) => {
    setIsLoading(true);
    setError(null);
    const mutationVersion = profileRequestGuard.beginMutation();
    try {
      const profile = await profileService.updateUsername(username, userToken);
      if (profileRequestGuard.completeMutation(mutationVersion)) {
        await updateUserData(profile);
      }
      return profile;
    } catch (requestError) {
      if (requestError.status === 401) await logout();
      else setError(requestError.message);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, [logout, updateUserData, userToken]);

  const uploadAvatar = useCallback(async (asset) => {
    setIsLoading(true);
    setError(null);
    const mutationVersion = profileRequestGuard.beginMutation();
    try {
      const profile = await profileService.uploadAvatar(asset, userToken);
      if (profileRequestGuard.completeMutation(mutationVersion)) {
        await updateUserData(profile);
      }
      return profile;
    } catch (requestError) {
      if (requestError.status === 401) await logout();
      else setError(requestError.message);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, [logout, updateUserData, userToken]);

  const removeAvatar = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const mutationVersion = profileRequestGuard.beginMutation();
    try {
      const profile = await profileService.removeAvatar(userToken);
      if (profileRequestGuard.completeMutation(mutationVersion)) {
        await updateUserData(profile);
      }
      return profile;
    } catch (requestError) {
      if (requestError.status === 401) await logout();
      else setError(requestError.message);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, [logout, updateUserData, userToken]);

  useEffect(() => {
    if (autoLoad) refresh();
  }, [autoLoad, refresh]);

  return {
    error,
    isLoading,
    profile: userData,
    refresh,
    removeAvatar,
    save,
    saveUsername,
    uploadAvatar,
  };
}
