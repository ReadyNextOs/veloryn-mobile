import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet } from '@/api/client';
import { clearAllSecure } from '@/lib/secureStorage';
import { resetClient } from '@/api/client';
import { authLogoutEmitter } from '@/lib/authEvents';

interface MobileToken {
  id: string;
  device_name: string | null;
  platform: string | null;
  last_used_at: string | null;
  is_current: boolean;
  created_at: string;
}

interface MobileTokensResponse {
  data: MobileToken[];
}

const TOKENS_QUERY_KEY = ['auth', 'mobile-tokens'] as const;

export function DevicesList() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  const { data: tokens, isLoading } = useQuery<MobileToken[], Error>({
    queryKey: TOKENS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiGet<MobileTokensResponse>('/api/auth/mobile-tokens');
      return res.data;
    },
    staleTime: 60 * 1000,
  });

  const revokeMutation = useMutation<void, Error, { tokenId: string; isCurrent: boolean }>({
    mutationFn: async ({ tokenId }) => {
      await apiDelete<void>(`/api/auth/mobile-tokens/${tokenId}`);
    },
    onSuccess: async (_data, { isCurrent }) => {
      if (isCurrent) {
        // Current device logout
        resetClient();
        await clearAllSecure();
        authLogoutEmitter.emit('auth:logout');
      } else {
        await queryClient.invalidateQueries({ queryKey: TOKENS_QUERY_KEY });
      }
    },
  });

  const handleRevoke = useCallback((token: MobileToken) => {
    revokeMutation.mutate({ tokenId: token.id, isCurrent: token.is_current });
  }, [revokeMutation]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const otherDevices = tokens?.filter((t) => !t.is_current) ?? [];

  if (otherDevices.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('settings.devices.empty')}</Text>
      </View>
    );
  }

  return (
    <>
      {otherDevices.map((token, idx) => (
        <View
          key={token.id}
          style={[
            styles.deviceRow,
            idx < otherDevices.length - 1 && styles.rowBorder,
          ]}
        >
          <MaterialCommunityIcons
            name="cellphone"
            size={20}
            color="rgba(0,0,0,0.5)"
            style={styles.icon}
          />
          <View style={styles.info}>
            <Text style={styles.deviceName} numberOfLines={1}>
              {token.device_name ?? token.platform ?? 'Urządzenie'}
            </Text>
            {token.last_used_at ? (
              <Text style={styles.lastUsed} numberOfLines={1}>
                {new Date(token.last_used_at).toLocaleDateString()}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.revokeBtn}
            onPress={() => handleRevoke(token)}
            disabled={revokeMutation.isPending}
          >
            <Text style={styles.revokeBtnText}>{t('settings.devices.revoke')}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  loading: { padding: 16 },
  loadingText: { fontSize: 14, color: 'rgba(0,0,0,0.5)' },
  empty: {
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  icon: {
    marginRight: 10,
  },
  info: {
    flex: 1,
  },
  deviceName: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.87)',
  },
  lastUsed: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
    marginTop: 2,
  },
  revokeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d32f2f',
  },
  revokeBtnText: {
    fontSize: 13,
    color: '#d32f2f',
    fontWeight: '500',
  },
});
