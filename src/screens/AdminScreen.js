import React, { useCallback, useContext, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { createStyles } from './AdminScreen.styles.js';
import { SafeAreaView } from "react-native-safe-area-context";
import { useProfile } from "../hooks/useProfile";
import { adminService } from "../services/adminService";
import { AuthContext } from "../context/AuthContext";
import { LanguageContext } from "../localization/LanguageContext";
import { ContentManagement } from "../components/admin/ContentManagement";
import { ConfirmDialog } from "../components/feedback";
import { Button, Feedback, Field, Sheet, useWorkshopStyles } from "../components/workshop/ui";
import { useTheme } from "../context/ThemeContext";

import { palette } from '../constants/colors';
const roles = ["user", "helper", "moderator", "admin", "super_admin"];
const colors = {
  user: palette.gray,
  helper: palette.blueHelper,
  moderator: palette.purpleHelper,
  admin: palette.orange,
  super_admin: palette.accent,
};

export default function AdminScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const s = useWorkshopStyles();
  const { userToken } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const roleLabel = (roleName) => t(`role_${roleName}`);
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
  const [onlineOnly, setOnlineOnly] = useState(false);
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
          { search, page: targetPage, online: onlineOnly },
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
    [canUsers, onlineOnly, search, userToken],
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
      setMessage(t('roleUpdated'));
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
      setMessage(t('userDeleted'));
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
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  if (!canContent)
    return (
      <View style={[s.screen, styles.center]}>
        <Text style={s.title}>{t('accessDenied')}</Text>
        <Feedback error={profileError} onRetry={refreshProfile} />
      </View>
    );
  const totalPages = Math.max(1, Math.ceil(total / 25));
  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.top}>
          <View style={styles.headingGroup}>
            <Text style={styles.brand}>HIT TRACKER / {t('adminPanel').toUpperCase()}</Text>
            <Text style={styles.title}>{t('adminPanel')}</Text>
            <Text style={s.muted}>
              {t('manageCommunity')}
            </Text>
          </View>
          <View style={styles.identity}>
            <View
              style={[styles.dot, { backgroundColor: colors[profile.role] }]}
            />
            <Text style={s.muted}>
              {t('signedInAs', { role: roleLabel(profile.role) })}
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
                  section === item && { color: theme.onPrimary, fontWeight: "700" },
                ]}
              >
                {t(item)}
              </Text>
            </Pressable>
          ))}
        </View>
        {section === "users" ? (
          <View style={styles.usersSection}>
            <View style={s.header}>
              <View>
                <Text style={s.title}>{t('users')}</Text>
                <Text style={s.muted}>{t('accountsRoles', { count: total })}</Text>
              </View>
              <Button secondary onPress={() => loadUsers(page)}>
                {t('refresh')}
              </Button>
            </View>
            <View style={[s.row, { alignItems: "flex-end" }]}>
              <Field
                style={styles.searchField}
                label={t('searchEmailUsername')}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => setSearch(query.trim())}
              />
              <Button onPress={() => setSearch(query.trim())}>{t('search')}</Button>
              <Button secondary={!onlineOnly} onPress={() => setOnlineOnly((value) => !value)}>
                {t('online')}
              </Button>
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
                          {(user.displayName || user.username || "?").slice(0, 2).toUpperCase()}
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
                        <Text style={s.muted}>{roleLabel(user.role)}</Text>
                      </View>
                    </View>
                    <Text style={s.heading}>
                      {user.displayName || `@${user.username}`}
                      {user.id === profile.id ? ` · ${t('you')}` : ""}
                    </Text>
                    <Text selectable style={s.muted}>
                      {user.username ? `@${user.username} · ` : ""}{user.email}
                    </Text>
                    <View style={styles.presence}>
                      <View style={[styles.dot, { backgroundColor: user.online ? palette.greenOnline : palette.gray }]} />
                      <Text style={s.muted}>{user.online ? t('online') : t('offline')}</Text>
                    </View>
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
                        {t('manage')}
                      </Button>
                    </View>
                  </View>
                );
              })}
            </View>
            {!loading && !users.length && (
              <Text style={s.muted}>{t('noUsersFound')}</Text>
            )}
            <View style={s.header}>
              <Button
                secondary
                disabled={page === 1 || loading}
                onPress={() => loadUsers(page - 1)}
              >
                {t('previous')}
              </Button>
              <Text style={s.muted}>
                {page} / {totalPages}
              </Text>
              <Button
                secondary
                disabled={page >= totalPages || loading}
                onPress={() => loadUsers(page + 1)}
              >
                {t('next')}
              </Button>
            </View>
          </View>
        ) : (
          <ContentManagement key={section} section={section} />
        )}
      </ScrollView>
      {selected && (
        <Sheet
          title={t('manageUser', { name: selected.username ? `@${selected.username}` : selected.displayName || selected.email })}
          onClose={() => !busy && setSelected(null)}
        >
          <Text style={s.muted}>{selected.email}</Text>
          <Text style={s.heading}>{t('role')}</Text>
          <View style={s.row}>
            {roles
              .filter((key) => isSuper || key !== "super_admin")
              .map((key) => (
                <Button
                  key={key}
                  secondary={role !== key}
                  disabled={busy}
                  onPress={() => setRole(key)}
                >
                  {roleLabel(key)}
                </Button>
              ))}
          </View>
          <Text style={s.muted}>
            {t('adminAccessHint')}
          </Text>
          <Feedback error={error} />
          <Button
            disabled={busy || role === selected.role}
            onPress={updateRole}
          >
            {t('saveRole')}
          </Button>
          <Button
            secondary
            disabled={busy}
            onPress={() => setConfirmDelete(true)}
          >
            {t('deleteUser')}
          </Button>
        </Sheet>
      )}
      <ConfirmDialog
        visible={confirmDelete}
        title={t('deleteNamedUser', { name: selected?.username ? `@${selected.username}` : selected?.displayName || selected?.email })}
        message={t('deleteUserMessage')}
        cancelLabel={t('cancel')}
        confirmLabel={busy ? t('deleting') : t('deleteUser')}
        onCancel={() => !busy && setConfirmDelete(false)}
        onConfirm={deleteUser}
      />
    </SafeAreaView>
  );
}
