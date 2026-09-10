import React, { useContext, useState } from "react";
import { Platform, Pressable, Share, Text, View } from "react-native";
import Icon from "../../assets/workshop/Share.svg";
import { useWorkshopStyles, useWords } from "./ui";
import { useTheme } from "../../context/ThemeContext";
import { LanguageContext } from "../../localization/LanguageContext";
import { createStyles } from './ShareButton.styles';

export function ShareButton({ title, description, getUrl, url }) {
  const { theme } = useTheme();
  const { t } = useContext(LanguageContext);
  const s = useWorkshopStyles();
  const styles = createStyles(theme);
  const w = useWords();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const share = async () => {
    setBusy(true);
    setMessage("");
    try {
      const resolvedUrl = url || await getUrl?.();
      if (!resolvedUrl) throw new Error('Share URL is unavailable');
      const text = [title, description, resolvedUrl].filter(Boolean).join("\n\n");
      if (Platform.OS === "web" && !navigator.share) {
        await navigator.clipboard.writeText(resolvedUrl);
        setMessage(t('shareLinkCopied'));
      } else if (Platform.OS === "web") await navigator.share({ title, text, url: resolvedUrl });
      else await Share.share({ title, message: text, url: resolvedUrl });
    } catch (error) {
      if (error.name !== "AbortError") setMessage(t('shareFailed'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={w.share}
        disabled={busy}
        onPress={share}
        style={[s.iconButton, busy && styles.busy]}
      >
        <Icon width={24} height={24} />
      </Pressable>
      {!!message && (
        <Text
          style={[s.muted, styles.message]}
          onPress={() => setMessage("")}
        >
          {message}
        </Text>
      )}
    </View>
  );
}
