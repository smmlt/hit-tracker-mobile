import { apiRequest } from './api';
import { createMediaFormData } from './mediaFormData';

const upload = async (path, asset, token) => apiRequest(path, {
  method: 'POST',
  body: await createMediaFormData(asset),
}, token, 'Image upload failed');

export const contentMediaService = {
  uploadExerciseImage: (id, asset, token) => upload(`/exercises/${id}/image`, asset, token),
  uploadProgramImage: (id, asset, token) => upload(`/workout-programs/${id}/image`, asset, token),
};
