import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useProfile } from '../hooks/useProfile';
import { adminService } from '../services/adminService';
import { AuthContext } from '../context/AuthContext';
import { ContentManagement } from '../components/admin/ContentManagement';

const contentRoles = ['moderator', 'admin', 'super_admin'];
const roles = ['user', 'helper', 'moderator', 'admin', 'super_admin'];
const roleLabels = {
  user: 'User',
  helper: 'Helper',
  moderator: 'Moderator',
  admin: 'Admin',
  super_admin: 'Super admin',
};

export default function AdminScreen() {
  const { userToken } = useContext(AuthContext);
  const { profile, isLoading: profileLoading } = useProfile(true);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [message, setMessage] = useState(null);
  const [section, setSection] = useState('users');
  const [deletingUserId, setDeletingUserId] = useState(null);

  const canOpenAdmin = contentRoles.includes(profile?.role);
  const canManageUsers = ['admin', 'super_admin'].includes(profile?.role);
  const isSuperAdmin = profile?.role === 'super_admin';
  const availableRoles = useMemo(
    () => roles.filter((role) => isSuperAdmin || role !== 'super_admin'),
    [isSuperAdmin],
  );
  const sections = useMemo(
    () => (canManageUsers ? ['users', 'programs', 'exercises'] : ['programs', 'exercises']),
    [canManageUsers],
  );

  useEffect(() => {
    if (!sections.includes(section)) setSection(sections[0]);
  }, [section, sections]);

  const loadUsers = useCallback(async (targetPage = 1) => {
    if (!canManageUsers) return;

    setIsLoadingUsers(true);
    setMessage(null);
    try {
      const data = await adminService.listUsers({ search, page: targetPage }, userToken);
      setUsers(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [canManageUsers, search, userToken]);

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  const updateRole = async (userId, role) => {
    setMessage(null);
    try {
      const data = await adminService.updateRole(userId, role, userToken);
      setUsers((currentUsers) => currentUsers.map((user) => (
        user.id === userId ? data.user : user
      )));
      setMessage('Role updated');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteUser = async (user) => {
    if (deletingUserId !== user.id) {
      setDeletingUserId(user.id);
      return;
    }

    setMessage(null);
    try {
      await adminService.deleteUser(user.id, userToken);
      setUsers((currentUsers) => currentUsers.filter((item) => item.id !== user.id));
      setTotal((currentTotal) => Math.max(0, currentTotal - 1));
      setDeletingUserId(null);
      setMessage('User deleted');
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (profileLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#fb923c" /></View>;
  }

  if (!canOpenAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Access denied</Text>
        <Text style={styles.muted}>This account does not have access to the admin panel.</Text>
      </View>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / 25));

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>HIT TRACKER</Text>
      <Text style={styles.title}>Admin panel</Text>
      <Text style={styles.muted}>Signed in as {roleLabels[profile.role]}</Text>
      <View style={styles.sectionTabs}>
        {sections.map((item) => (
          <Pressable key={item} onPress={() => { setDeletingUserId(null); setSection(item); }} style={[styles.sectionTab, section === item && styles.sectionTabActive]}>
            <Text style={[styles.sectionTabText, section === item && styles.sectionTabTextActive]}>{item[0].toUpperCase() + item.slice(1)}</Text>
          </Pressable>
        ))}
      </View>

      {section === 'users' && canManageUsers ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.sectionTitle}>Users</Text>
              <Text style={styles.muted}>{total} total</Text>
            </View>
            <Pressable style={styles.secondaryButton} onPress={() => loadUsers(page)}>
              <Text style={styles.secondaryButtonText}>Refresh</Text>
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Search email or username"
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
              onSubmitEditing={() => setSearch(searchInput.trim())}
            />
            <Pressable style={styles.primaryButton} onPress={() => setSearch(searchInput.trim())}>
              <Text style={styles.primaryButtonText}>Search</Text>
            </Pressable>
          </View>

          {isLoadingUsers ? <ActivityIndicator color="#fb923c" style={styles.loader} /> : users.map((user) => {
            const protectedUser = !isSuperAdmin && user.role === 'super_admin';
            const isCurrentUser = user.id === profile.id;

            return (
              <View key={user.id} style={styles.userRow}>
                <View style={styles.userInfo}>
                  <Text style={styles.username}>{user.username}{isCurrentUser ? ' (you)' : ''}</Text>
                  <Text style={styles.email}>{user.email}</Text>
                </View>
                {protectedUser || isCurrentUser ? (
                  <Text style={styles.roleBadge}>{roleLabels[user.role]}</Text>
                ) : (
                  <View style={styles.userActions}>
                    <View style={styles.roleOptions}>
                      {availableRoles.map((role) => (
                        <Pressable
                          key={role}
                          onPress={() => updateRole(user.id, role)}
                          style={[styles.roleOption, user.role === role && styles.roleOptionActive]}
                        >
                          <Text style={[styles.roleOptionText, user.role === role && styles.roleOptionTextActive]}>
                            {roleLabels[role]}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <Pressable onPress={() => deleteUser(user)} style={[styles.deleteButton, deletingUserId === user.id && styles.deleteButtonConfirm]}>
                      <Text style={styles.deleteButtonText}>{deletingUserId === user.id ? 'Confirm delete' : 'Delete user'}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}

          {!isLoadingUsers && users.length === 0 && <Text style={styles.muted}>No users found.</Text>}
          {message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.pagination}>
            <Pressable
              disabled={page === 1}
              style={[styles.secondaryButton, page === 1 && styles.disabledButton]}
              onPress={() => loadUsers(page - 1)}
            >
              <Text style={styles.secondaryButtonText}>Previous</Text>
            </Pressable>
            <Text style={styles.muted}>Page {page} / {totalPages}</Text>
            <Pressable
              disabled={page === totalPages}
              style={[styles.secondaryButton, page === totalPages && styles.disabledButton]}
              onPress={() => loadUsers(page + 1)}
            >
              <Text style={styles.secondaryButtonText}>Next</Text>
            </Pressable>
          </View>
        </View>
      ) : <ContentManagement section={section} userToken={userToken} />}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', padding: 24 },
  page: { flexGrow: 1, backgroundColor: '#0f172a', padding: 32, gap: 14 },
  eyebrow: { color: '#fb923c', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: '#f8fafc', fontSize: 30, fontWeight: '800' },
  muted: { color: '#94a3b8', fontSize: 14 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, gap: 14, maxWidth: 1000 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '700' },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchInput: { flex: 1, color: '#f8fafc', backgroundColor: '#0f172a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  primaryButton: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f97316', borderRadius: 8, paddingHorizontal: 16 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { alignItems: 'center', justifyContent: 'center', borderColor: '#475569', borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  secondaryButtonText: { color: '#e2e8f0', fontWeight: '600' },
  disabledButton: { opacity: 0.4 },
  loader: { marginVertical: 24 },
  userRow: { borderTopColor: '#334155', borderTopWidth: 1, gap: 10, paddingTop: 14 },
  userInfo: { gap: 2 },
  username: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  email: { color: '#94a3b8', fontSize: 13 },
  roleOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  userActions: { gap: 10 },
  roleOption: { backgroundColor: '#334155', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  roleOptionActive: { backgroundColor: '#f97316' },
  roleOptionText: { color: '#cbd5e1', fontSize: 12, fontWeight: '600' },
  roleOptionTextActive: { color: '#fff' },
  roleBadge: { alignSelf: 'flex-start', color: '#e2e8f0', backgroundColor: '#334155', borderRadius: 999, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6 },
  deleteButton: { alignSelf: 'flex-start', backgroundColor: '#991b1b', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  deleteButtonConfirm: { backgroundColor: '#dc2626' },
  deleteButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  message: { color: '#fed7aa', fontSize: 14 },
  pagination: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  sectionTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  sectionTab: { backgroundColor: '#334155', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  sectionTabActive: { backgroundColor: '#f97316' },
  sectionTabText: { color: '#cbd5e1', fontWeight: '700' },
  sectionTabTextActive: { color: '#fff' },
});
