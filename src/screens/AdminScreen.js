import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useProfile } from "../hooks/useProfile";
import { adminService } from "../services/adminService";
import { AuthContext } from "../context/AuthContext";
import { ContentManagement } from "../components/admin/ContentManagement";
import { ConfirmDialog } from "../components/feedback";
import { Button, Feedback, Field, Sheet, s } from "../components/workshop/ui";

const labels = {
  user: "User",
  helper: "Helper",
  moderator: "Moderator",
  admin: "Admin",
  super_admin: "Super admin",
};
const colors = {
  user: "#838384",
  helper: "#6CB4EE",
  moderator: "#B8A0FF",
  admin: "#F98300",
  super_admin: "#F00D22",
};

export default function AdminScreen() {
  const { userToken } = useContext(AuthContext);
  const {
    profile,
    isLoading: profileLoading,
    error: profileError,
    refresh: refreshProfile,
  } = useProfile(true);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [section, setSection] = useState("users");
  const [selected, setSelected] = useState(null);
  const [role, setRole] = useState("user");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const canContent = ["moderator", "admin", "super_admin"].includes(
    profile?.role,
  );
  const canUsers = ["admin", "super_admin"].includes(profile?.role);
  const isSuper = profile?.role === "super_admin";
  const sections = canUsers
    ? ["users", "programs", "exercises"]
    : ["programs", "exercises"];
  useEffect(() => {
    if (!canUsers && section === "users") setSection("programs");
  }, [canUsers, section]);
  const loadUsers = useCallback(
    async (targetPage = 1) => {
      if (!canUsers) return;
      setLoading(true);
      setError("");
      try {
        const data = await adminService.listUsers(
          { search, page: targetPage },
          userToken,
        );
        setUsers(data.items);
        setTotal(data.total);
        setPage(data.page);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [canUsers, search, userToken],
  );
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  const updateRole = async () => {
    setBusy(true);
    setError("");
    try {
      await adminService.updateRole(selected.id, role, userToken);
      await loadUsers(page);
      setSelected(null);
      setMessage("Role updated");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const deleteUser = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await adminService.deleteUser(selected.id, userToken);
      setConfirmDelete(false);
      setSelected(null);
      await loadUsers(users.length === 1 && page > 1 ? page - 1 : page);
      setMessage("User deleted");
    } catch (e) {
      setError(e.message);
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  };
  if (profileLoading && !profile)
    return (
      <View style={[s.screen, styles.center]}>
        <ActivityIndicator color="#F00D22" />
      </View>
    );
  if (!canContent)
    return (
      <View style={[s.screen, styles.center]}>
        <Text style={s.title}>Access denied</Text>
        <Feedback error={profileError} onRetry={refreshProfile} />
      </View>
    );
  const totalPages = Math.max(1, Math.ceil(total / 25));
  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.top}>
          <View style={{ gap: 6 }}>
            <Text style={styles.brand}>HIT TRACKER / ADMIN</Text>
            <Text style={styles.title}>Admin panel</Text>
            <Text style={s.muted}>
              Manage your community and training library.
            </Text>
          </View>
          <View style={styles.identity}>
            <View
              style={[styles.dot, { backgroundColor: colors[profile.role] }]}
            />
            <Text style={s.muted}>
              Signed in as <Text style={s.text}>{labels[profile.role]}</Text>
            </Text>
          </View>
        </View>
        <View style={styles.tabs}>
          {sections.map((item) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: section === item }}
              key={item}
              style={[styles.tab, section === item && styles.activeTab]}
              onPress={() => {
                setSection(item);
                setMessage("");
                setError("");
              }}
            >
              <Text
                style={[
                  s.text,
                  section === item && { color: "#FFF", fontWeight: "700" },
                ]}
              >
                {item[0].toUpperCase() + item.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
        {section === "users" ? (
          <View style={{ gap: 20 }}>
            <View style={s.header}>
              <View>
                <Text style={s.title}>Users</Text>
                <Text style={s.muted}>{total} accounts · roles & access</Text>
              </View>
              <Button secondary onPress={() => loadUsers(page)}>
                Refresh
              </Button>
            </View>
            <View style={[s.row, { alignItems: "flex-end" }]}>
              <Field
                style={{ flex: 1, minWidth: 160 }}
                label="Search email or username"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => setSearch(query.trim())}
              />
              <Button onPress={() => setSearch(query.trim())}>Search</Button>
            </View>
            <Feedback
              loading={loading}
              error={!selected && error}
              onRetry={() => loadUsers(page)}
            />
            {!!message && (
              <Text accessibilityRole="alert" style={s.muted}>
                {message}
              </Text>
            )}
            <View style={styles.grid}>
              {users.map((user) => {
                const protectedUser =
                  user.id === profile.id ||
                  (!isSuper && user.role === "super_admin");
                return (
                  <View key={user.id} style={styles.userCard}>
                    <View style={s.header}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {(user.username || "?").slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.roleBadge,
                          { borderColor: colors[user.role] },
                        ]}
                      >
                        <View
                          style={[
                            styles.dot,
                            { backgroundColor: colors[user.role] },
                          ]}
                        />
                        <Text style={s.muted}>{labels[user.role]}</Text>
                      </View>
                    </View>
                    <Text style={s.heading}>
                      @{user.username}
                      {user.id === profile.id ? " · you" : ""}
                    </Text>
                    <Text selectable style={s.muted}>
                      {user.email}
                    </Text>
                    <View style={styles.cardBottom}>
                      <Text style={s.muted}>ID #{user.id}</Text>
                      <Button
                        secondary
                        disabled={protectedUser}
                        onPress={() => {
                          setSelected(user);
                          setRole(user.role);
                          setError("");
                        }}
                      >
                        Manage
                      </Button>
                    </View>
                  </View>
                );
              })}
            </View>
            {!loading && !users.length && (
              <Text style={s.muted}>No users found.</Text>
            )}
            <View style={s.header}>
              <Button
                secondary
                disabled={page === 1 || loading}
                onPress={() => loadUsers(page - 1)}
              >
                Previous
              </Button>
              <Text style={s.muted}>
                {page} / {totalPages}
              </Text>
              <Button
                secondary
                disabled={page >= totalPages || loading}
                onPress={() => loadUsers(page + 1)}
              >
                Next
              </Button>
            </View>
          </View>
        ) : (
          <ContentManagement key={section} section={section} />
        )}
      </ScrollView>
      {selected && (
        <Sheet
          title={`Manage @${selected.username}`}
          onClose={() => !busy && setSelected(null)}
        >
          <Text style={s.muted}>{selected.email}</Text>
          <Text style={s.heading}>Role</Text>
          <View style={s.row}>
            {Object.keys(labels)
              .filter((key) => isSuper || key !== "super_admin")
              .map((key) => (
                <Button
                  key={key}
                  secondary={role !== key}
                  disabled={busy}
                  onPress={() => setRole(key)}
                >
                  {labels[key]}
                </Button>
              ))}
          </View>
          <Text style={s.muted}>
            Access is checked by the server. Your own account and protected
            roles cannot be deleted here.
          </Text>
          <Feedback error={error} />
          <Button
            disabled={busy || role === selected.role}
            onPress={updateRole}
          >
            Save role
          </Button>
          <Button
            secondary
            disabled={busy}
            onPress={() => setConfirmDelete(true)}
          >
            Delete user
          </Button>
        </Sheet>
      )}
      <ConfirmDialog
        visible={confirmDelete}
        title={`Delete @${selected?.username}?`}
        message="This permanently deletes the account and its related personal data. This cannot be undone."
        cancelLabel="Cancel"
        confirmLabel={busy ? "Deleting…" : "Delete user"}
        onCancel={() => !busy && setConfirmDelete(false)}
        onConfirm={deleteUser}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  center: { justifyContent: "center", alignItems: "center", padding: 24 },
  page: {
    padding: 20,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
    gap: 28,
  },
  top: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    paddingTop: 16,
  },
  brand: {
    color: "#F00D22",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: { color: "#EFEFEF", fontSize: 32, fontWeight: "700" },
  identity: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: "#292929",
    padding: 12,
    borderRadius: 10,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#454545",
    gap: 8,
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: { borderBottomColor: "#F00D22", backgroundColor: "#F00D2210" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  userCard: {
    flexBasis: 300,
    flexGrow: 1,
    backgroundColor: "#202123",
    borderWidth: 1,
    borderColor: "#37383B",
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F00D221A",
  },
  avatarText: { color: "#FF5666", fontWeight: "700", fontSize: 16 },
  roleBadge: {
    borderWidth: 1,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cardBottom: {
    borderTopWidth: 1,
    borderTopColor: "#37383B",
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
