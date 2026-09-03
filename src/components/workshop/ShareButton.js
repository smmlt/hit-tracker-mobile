import React, { useState } from "react";
import { Platform, Pressable, Share, Text, View } from "react-native";
import Icon from "../../assets/workshop/Share.svg";
import { s, useWords } from "./ui";

export function ShareButton({ title, description }) {
  const w = useWords();
  const [message, setMessage] = useState("");
  const share = async () => {
    const text = [title, description].filter(Boolean).join("\n\n");
    try {
      if (Platform.OS === "web" && !navigator.share) {
        await navigator.clipboard.writeText(text);
        setMessage(w.shared);
      } else if (Platform.OS === "web") await navigator.share({ title, text });
      else await Share.share({ title, message: text });
    } catch (error) {
      if (error.name !== "AbortError") setMessage(error.message);
    }
  };
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={w.share}
        onPress={share}
        style={s.iconButton}
      >
        <Icon width={24} height={24} />
      </Pressable>
      {!!message && (
        <Text
          style={[
            s.muted,
            {
              position: "absolute",
              right: 0,
              top: 44,
              width: 160,
              backgroundColor: "#292929",
              padding: 6,
              zIndex: 10,
            },
          ]}
          onPress={() => setMessage("")}
        >
          {message}
        </Text>
      )}
    </View>
  );
}
