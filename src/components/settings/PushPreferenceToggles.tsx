import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsRow } from './SettingsRow';

interface PushPreferences {
  mail: boolean;
  messages: boolean;
  mentions: boolean;
  system: boolean;
}

interface Props {
  preferences: PushPreferences;
  onToggle: (key: keyof PushPreferences, value: boolean) => void;
}

export function PushPreferenceToggles({ preferences, onToggle }: Props) {
  const { t } = useTranslation('common');

  const handleMail = useCallback((v: boolean) => onToggle('mail', v), [onToggle]);
  const handleMessages = useCallback((v: boolean) => onToggle('messages', v), [onToggle]);
  const handleMentions = useCallback((v: boolean) => onToggle('mentions', v), [onToggle]);
  const handleSystem = useCallback((v: boolean) => onToggle('system', v), [onToggle]);

  return (
    <>
      <SettingsRow
        variant="toggle"
        label={t('settings.notifications.mail')}
        icon="email-outline"
        value={preferences.mail}
        onValueChange={handleMail}
      />
      <SettingsRow
        variant="toggle"
        label={t('settings.notifications.messages')}
        icon="message-outline"
        value={preferences.messages}
        onValueChange={handleMessages}
      />
      <SettingsRow
        variant="toggle"
        label={t('settings.notifications.mentions')}
        icon="at"
        value={preferences.mentions}
        onValueChange={handleMentions}
      />
      <SettingsRow
        variant="toggle"
        label={t('settings.notifications.system')}
        icon="bell-outline"
        value={preferences.system}
        onValueChange={handleSystem}
        isLast
      />
    </>
  );
}
