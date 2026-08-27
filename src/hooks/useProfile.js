import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { profileService } from '../services/profileService';

export function useProfile(autoLoad = false) {
  const { logout, updateUserData, userData, userToken } = useContext(AuthContext);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userToken) return null;
    setIsLoading(true);
    setError(null);
    try {
      const profile = await profileService.get(userToken);
      await updateUserData(profile);
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
    try {
      const profile = await profileService.update(changes, userToken);
      await updateUserData(profile);
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

  return { error, isLoading, profile: userData, refresh, save };
}
