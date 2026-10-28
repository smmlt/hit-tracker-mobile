/**
 * Provides the administrator flow for loading users and managing observability and catalog content, with role checks from the profile/authentication state. / Реалізує адміністративний потік завантаження користувачів і керування спостережуваністю та каталогом із перевіркою ролі через стан профілю й автентифікації.
 */
import React, { useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { createStyles } from './AdminScreen.styles.js';
import { SafeAreaView } from "react-native-safe-area-context";
import { useProfile } from "../hooks/useProfile";
import { adminService } from "../services/adminService";
import { AuthContext } from "../context/AuthContext";
import { LanguageContext } from "../localization/LanguageContext";
import { ContentManagement } from "../components/admin/ContentManagement";
import { AdminUserDetails } from "../components/admin/AdminUserDetails";
import { AdminObservability } from "../components/admin/AdminObservability";
import { AdminNotifications, ADMIN_NOTIFICATION_DRAFT_KEY, ADMIN_NOTIFICATION_DRAFT_TTL_MS } from "../components/admin/AdminNotifications";
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

/** EN: Verifies staff access and coordinates user, notification, observability, and catalog administration. UK: Перевіряє доступ персоналу та координує керування користувачами, сповіщеннями, спостережуваністю й каталогом. */
export default function AdminScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const compactLayout = width < 600;
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const s = useWorkshopStyles();
  const { userToken } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  /** EN: Returns the localized display label for an account role. UK: Повертає локалізовану назву ролі облікового запису. */
  const roleLabel = (roleName) => t(`role_${roleName}`);
  const {
    profile,
    isLoading: profileLoading,
    error: profileError,
    refresh: refreshProfile,
  } = useProfile(false);
  const [accessState, setAccessState] = useState("checking");
  const [verifiedRole, setVerifiedRole] = useState(null);
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
  const [detailUser, setDetailUser] = useState(null);
  const [detailsRevision, setDetailsRevision] = useState(0);
  const [notificationTarget, setNotificationTarget] = useState(null);
  const [notificationComposerRevision, setNotificationComposerRevision] = useState(0);
  const [hasNotificationDraft, setHasNotificationDraft] = useState(false);
  const handleDraftStateChange = useCallback(/* EN: Mirrors whether the notification composer has a recoverable draft. UK: Відображає, чи має редактор сповіщень чернетку, яку можна відновити. */ (value) => setHasNotificationDraft(value), []);
  const canContent = ["moderator", "admin", "super_admin"].includes(verifiedRole);
  const canUsers = ["admin", "super_admin"].includes(verifiedRole);
  const isSystemOwner = profile?.isSystemOwner === true;
  const sections = canUsers
    ? ["users", "notifications", "system", "programs", "exercises"]
    : ["programs", "exercises"];
  const verifyAccess = useCallback(/* EN: Refreshes the profile and derives server-authoritative admin access. UK: Оновлює профіль і визначає підтверджений сервером адміністративний доступ. */ async () => {
    setAccessState("checking");
    const freshProfile = await refreshProfile();
    const nextRole = freshProfile?.role || null;
    setVerifiedRole(nextRole);
    setAccessState(
      ["moderator", "admin", "super_admin"].includes(nextRole)
        ? "allowed"
        : "denied",
    );
  }, [refreshProfile]);
  useEffect(/* EN: Verifies access on entry and whenever profile refresh behavior changes. UK: Перевіряє доступ під час входу та після зміни механізму оновлення профілю. */ () => {
    verifyAccess();
  }, [verifyAccess]);
  useEffect(/* EN: Checks whether this administrator has a non-expired saved notification draft. UK: Перевіряє, чи має цей адміністратор незастарілу збережену чернетку сповіщення. */ () => {
    if (!profile?.id) return undefined;
    let active = true;
    AsyncStorage.getItem(ADMIN_NOTIFICATION_DRAFT_KEY(profile.id)).then(/* EN: Validates draft age before showing the resume reminder. UK: Перевіряє вік чернетки перед показом нагадування про відновлення. */ (raw) => {
      if (!active) return;
      if (!raw) { setHasNotificationDraft(false); return; }
      try { setHasNotificationDraft(Date.now() - JSON.parse(raw).updatedAt <= ADMIN_NOTIFICATION_DRAFT_TTL_MS); } catch (_) { setHasNotificationDraft(false); }
    });
    return /* EN: Prevents a late storage result from updating an unmounted screen. UK: Не дозволяє пізньому результату сховища оновити демонтований екран. */ () => { active = false; };
  }, [profile?.id]);
  useEffect(/* EN: Redirects moderators away from sections reserved for administrators. UK: Перенаправляє модераторів із розділів, призначених лише для адміністраторів. */ () => {
    if (!canUsers && ["users", "notifications", "system"].includes(section)) setSection("programs");
  }, [canUsers, section]);
  const loadUsers = useCallback(
    /* EN: Loads one filtered user page only after administrative access is confirmed. UK: Завантажує одну відфільтровану сторінку користувачів лише після підтвердження адміністративного доступу. */ async (targetPage = 1) => {
      if (accessState !== "allowed" || !canUsers) return;
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
    [accessState, canUsers, onlineOnly, search, userToken],
  );
  useEffect(/* EN: Refreshes the user list when its memoized filters or access state change. UK: Оновлює список користувачів після зміни збережених фільтрів або стану доступу. */ () => {
    loadUsers();
  }, [loadUsers]);
  /** EN: Persists the selected role and refreshes list and detail views consistently. UK: Зберігає вибрану роль та узгоджено оновлює список і деталі користувача. */
  const updateRole = async () => {
    setBusy(true);
    setError("");
    try {
      await adminService.updateRole(selected.id, role, userToken);
      await loadUsers(page);
      setDetailUser(/* EN: Updates the open detail record only when it is the edited user. UK: Оновлює відкритий запис деталей лише для редагованого користувача. */ (current) => current?.id === selected.id ? { ...current, role } : current);
      setDetailsRevision(/* EN: Forces dependent security details to reload after a role change. UK: Примушує залежні дані безпеки оновитися після зміни ролі. */ (current) => current + 1);
      setSelected(null);
      setMessage(t('roleUpdated'));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  /** EN: Deletes the selected account, closes related views, and reloads a valid page. UK: Видаляє вибраний обліковий запис, закриває пов’язані подання та перезавантажує чинну сторінку. */
  const deleteUser = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await adminService.deleteUser(selected.id, userToken);
      setConfirmDelete(false);
      setDetailUser(/* EN: Closes details if they display the deleted account. UK: Закриває деталі, якщо вони показують видалений обліковий запис. */ (current) => current?.id === selected.id ? null : current);
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
  if (accessState === "checking" || (profileLoading && !profile))
    return (
      <View style={[s.screen, styles.center]}>
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  if (accessState !== "allowed" || !canContent)
    return (
      <View style={[s.screen, styles.center]}>
        <Text style={s.title}>{t('accessDenied')}</Text>
        <Feedback error={profileError} onRetry={verifyAccess} />
      </View>
    );
  const totalPages = Math.max(1, Math.ceil(total / 25));
  /** EN: Opens role management for a user and clears stale action errors. UK: Відкриває керування роллю користувача та очищає застарілі помилки дій. */
  const openManage = (user) => {
    setSelected(user);
    setRole(user.role);
    setError("");
  };
  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.top, compactLayout && styles.compactTop]}>
          <View style={styles.headingGroup}>
            <Text style={styles.brand}>HIT TRACKER / {t('adminPanel').toUpperCase()}</Text>
            <Text style={styles.title}>{t('adminPanel')}</Text>
            <Text style={s.muted}>
              {t('manageCommunity')}
            </Text>
          </View>
          <View style={[styles.topActions, compactLayout && styles.compactTopActions]}>
            <Button secondary onPress={/* EN: Replaces the admin route with the main application. UK: Замінює адміністративний маршрут основним застосунком. */ () => navigation.replace('MainApp')}>{t('backToApp')}</Button>
            <View style={styles.identity}>
              <View
              style={[styles.dot, { backgroundColor: colors[verifiedRole] }]}
              />
              <Text style={[s.muted, styles.identityText]}>
                {t('signedInAs', { role: roleLabel(verifiedRole) })}
              </Text>
            </View>
          </View>
        </View>
        {hasNotificationDraft && (
          <Pressable accessibilityRole="button" accessibilityLabel={t('adminNotificationDraftReminder')} onPress={/* EN: Reopens the general notification composer and requests draft hydration. UK: Повторно відкриває загальний редактор сповіщень і запускає відновлення чернетки. */ () => { setSection('notifications'); setNotificationTarget(null); setNotificationComposerRevision(/* EN: Remounts the composer so it reloads the saved draft. UK: Перемонтовує редактор, щоб він повторно завантажив збережену чернетку. */ (value) => value + 1); }} style={styles.draftReminder}>
            <Text style={s.text}>{t('adminNotificationDraftReminder')}</Text>
          </Pressable>
        )}
        <View style={styles.tabs}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabRow}
          >
            {sections.map(/* EN: Renders one role-appropriate administration tab. UK: Відображає одну доступну для ролі вкладку адміністрування. */ (item) => (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: section === item }}
                key={item}
                style={[styles.tab, section === item && styles.activeTab]}
                onPress={/* EN: Switches sections and clears state owned by the previous section. UK: Перемикає розділ і очищає стан, що належав попередньому розділу. */ () => {
                  setSection(item);
                  setNotificationTarget(null);
                  setDetailUser(null);
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
          </ScrollView>
        </View>
        {detailUser ? (
          <AdminUserDetails
            userId={detailUser.id}
            revision={detailsRevision}
            onBack={/* EN: Returns from user details to the user grid. UK: Повертає з деталей користувача до сітки користувачів. */ () => setDetailUser(null)}
            onManage={openManage}
            onNotify={/* EN: Opens the notification composer targeted to this user. UK: Відкриває редактор сповіщення, адресованого цьому користувачеві. */ (user) => {
              setNotificationTarget(user.id);
              setDetailUser(null);
              setSection('notifications');
            }}
            manageDisabled={detailUser.id === profile.id || (!isSystemOwner && detailUser.role === "super_admin")}
            canSecurityActions={verifiedRole === "super_admin" && detailUser.id !== profile.id && !detailUser.isSystemOwner && (isSystemOwner || detailUser.role !== "super_admin")}
            onSecurityChanged={/* EN: Refreshes presence and security-sensitive account state after an action. UK: Оновлює присутність і чутливий стан облікового запису після безпекової дії. */ () => loadUsers(page)}
          />
        ) : section === "users" ? (
          <View style={styles.usersSection}>
            <View style={s.header}>
              <View>
                <Text style={s.title}>{t('users')}</Text>
                <Text style={s.muted}>{t('accountsRoles', { count: total })}</Text>
              </View>
              <Button secondary onPress={/* EN: Reloads the current user page without changing filters. UK: Повторно завантажує поточну сторінку користувачів без зміни фільтрів. */ () => loadUsers(page)}>
                {t('refresh')}
              </Button>
            </View>
            <View style={[s.row, { alignItems: "flex-end" }]}>
              <Field
                style={styles.searchField}
                label={t('searchEmailUsername')}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={/* EN: Commits the trimmed search query from the keyboard. UK: Застосовує очищений пошуковий запит із клавіатури. */ () => setSearch(query.trim())}
              />
              <Button onPress={/* EN: Applies the current user search query. UK: Застосовує поточний запит пошуку користувачів. */ () => setSearch(query.trim())}>{t('search')}</Button>
              <Button secondary={!onlineOnly} onPress={/* EN: Toggles the online-only user filter. UK: Перемикає фільтр лише активних користувачів. */ () => setOnlineOnly(/* EN: Inverts the previous online-only filter value. UK: Інвертує попереднє значення фільтра активності. */ (value) => !value)}>
                {t('online')}
              </Button>
            </View>
            <Feedback
              loading={loading}
              error={!selected && error}
              onRetry={/* EN: Retries loading the current filtered page. UK: Повторює завантаження поточної відфільтрованої сторінки. */ () => loadUsers(page)}
            />
            {!!message && (
              <Text accessibilityRole="alert" style={s.muted}>
                {message}
              </Text>
            )}
            <View style={styles.grid}>
              {users.map(/* EN: Renders one account card with role, presence, and protection state. UK: Відображає картку облікового запису з роллю, присутністю та станом захисту. */ (user) => {
                const protectedUser =
                  user.id === profile.id ||
                  (!isSystemOwner && user.role === "super_admin");
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={user.id}
                    onPress={/* EN: Opens the selected user's administrative details. UK: Відкриває адміністративні деталі вибраного користувача. */ () => setDetailUser(user)}
                    style={/* EN: Adds visual feedback while the user card is pressed. UK: Додає візуальний відгук під час натискання картки користувача. */ ({ pressed }) => [styles.userCard, pressed && styles.userCardPressed]}
                  >
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
                        onPress={/* EN: Opens role management without also opening the surrounding detail card. UK: Відкриває керування роллю без одночасного відкриття зовнішньої картки деталей. */ (event) => {
                          event?.stopPropagation?.();
                          openManage(user);
                        }}
                      >
                        {t('manage')}
                      </Button>
                    </View>
                  </Pressable>
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
                onPress={/* EN: Loads the previous user page. UK: Завантажує попередню сторінку користувачів. */ () => loadUsers(page - 1)}
              >
                {t('previous')}
              </Button>
              <Text style={s.muted}>
                {page} / {totalPages}
              </Text>
              <Button
                secondary
                disabled={page >= totalPages || loading}
                onPress={/* EN: Loads the next user page. UK: Завантажує наступну сторінку користувачів. */ () => loadUsers(page + 1)}
              >
                {t('next')}
              </Button>
            </View>
          </View>
        ) : section === "notifications" ? (
          <AdminNotifications key={`${notificationTarget || 'all'}:${notificationComposerRevision}`} initialUserId={notificationTarget} profileId={profile.id} userToken={userToken} onDraftStateChange={handleDraftStateChange} />
        ) : section === "system" ? (
          <AdminObservability userToken={userToken} />
        ) : (
          <ContentManagement key={section} section={section} />
        )}
      </ScrollView>
      {selected && (
        <Sheet
          title={t('manageUser', { name: selected.username ? `@${selected.username}` : selected.displayName || selected.email })}
          onClose={/* EN: Closes role management only when no mutation is running. UK: Закриває керування роллю лише за відсутності активної зміни. */ () => !busy && setSelected(null)}
        >
          <Text style={s.muted}>{selected.email}</Text>
          <Text style={s.heading}>{t('role')}</Text>
          <View style={s.row}>
            {roles
              .filter(/* EN: Hides the super-admin role from non-owner administrators. UK: Приховує роль super_admin від адміністраторів, які не є власниками системи. */ (key) => isSystemOwner || key !== "super_admin")
              .map(/* EN: Renders one assignable role choice. UK: Відображає один доступний варіант ролі. */ (key) => (
                <Button
                  key={key}
                  secondary={role !== key}
                  disabled={busy}
                  onPress={/* EN: Selects this role for the pending update. UK: Вибирає цю роль для майбутнього оновлення. */ () => setRole(key)}
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
            onPress={/* EN: Opens destructive confirmation for the selected account. UK: Відкриває підтвердження видалення вибраного облікового запису. */ () => setConfirmDelete(true)}
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
        onCancel={/* EN: Cancels deletion unless the request is already running. UK: Скасовує видалення, якщо запит ще не виконується. */ () => !busy && setConfirmDelete(false)}
        onConfirm={deleteUser}
      />
    </SafeAreaView>
  );
}
