import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AuthContext } from "./AuthContext";
import { apiRequest } from "../services/api";

export const LibraryContext = createContext();
export function LibraryProvider({ children }) {
  const { userToken } = useContext(AuthContext);
  const [exercises, setExercises] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [muscles, setMuscles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const pending = useRef(new Set());
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    if (!userToken) {
      setExercises([]);
      setPrograms([]);
      setMuscles([]);
      setErrors({});
      return;
    }
    setLoading(true);
    const entries = [
      ["exercises", "/exercises", setExercises],
      ["programs", "/workout-programs", setPrograms],
      ["muscles", "/exercises/muscles", setMuscles],
    ];
    const failures = {};
    await Promise.all(
      entries.map(async ([key, path, setter]) => {
        try {
          const data = await apiRequest(path, {}, userToken);
          if (current === generation.current) setter(data);
        } catch (error) {
          failures[key] = error.message;
        }
      }),
    );
    if (current === generation.current) {
      setErrors(failures);
      setLoading(false);
    }
  }, [userToken]);
  useEffect(() => {
    refresh();
    return () => {
      generation.current++;
    };
  }, [refresh]);
  const react = async (kind, id, reaction = "like") => {
    const key = `${kind}:${id}:${reaction}`;
    if (pending.current.has(key)) return;
    pending.current.add(key);
    try {
      const data = await apiRequest(
        `/${kind === "programs" ? "workout-programs" : "exercises"}/${id}/${reaction}`,
        { method: "POST" },
        userToken,
      );
      const setter = kind === "programs" ? setPrograms : setExercises;
      setter((items) =>
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                ...data,
                likesCount:
                  reaction === "like"
                    ? Math.max(
                        0,
                        (item.likesCount || 0) +
                          Number(data.isLiked) -
                          Number(!!item.isLiked),
                      )
                    : item.likesCount,
              }
            : item,
        ),
      );
    } catch (error) {
      setErrors((current) => ({ ...current, [kind]: error.message }));
    } finally {
      pending.current.delete(key);
    }
  };
  return (
    <LibraryContext.Provider
      value={{ exercises, programs, muscles, errors, loading, refresh, react }}
    >
      {children}
    </LibraryContext.Provider>
  );
}
export const useLibrary = () => useContext(LibraryContext);
