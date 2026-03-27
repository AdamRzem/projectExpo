import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.iconWrap}>
        <IconSymbol size={34} color="#2563EB" name="sparkles" />
      </View>
      <ThemedText type="title" style={styles.title}>
        Action Center
      </ThemedText>
      <ThemedText style={styles.description}>
        Keep important shortcuts here so your main tabs stay clean and focused.
      </ThemedText>

      <View style={styles.actionList}>
        <View style={styles.actionItem}>
          <IconSymbol size={18} color="#2563EB" name="slider.horizontal.3" />
          <ThemedText type="defaultSemiBold">Preferences</ThemedText>
        </View>
        <View style={styles.actionItem}>
          <IconSymbol size={18} color="#2563EB" name="bell.badge.fill" />
          <ThemedText type="defaultSemiBold">Notifications</ThemedText>
        </View>
      </View>

      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="defaultSemiBold" style={styles.linkText}>
          Done
        </ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconWrap: {
    height: 72,
    width: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(37, 99, 235, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontFamily: Fonts.rounded,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    opacity: 0.75,
    marginBottom: 16,
  },
  actionList: {
    width: '100%',
    gap: 10,
    marginBottom: 18,
  },
  actionItem: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120, 120, 120, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  link: {
    borderRadius: 999,
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  linkText: {
    color: '#FFFFFF',
  },
});
