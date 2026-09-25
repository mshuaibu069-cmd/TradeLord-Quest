import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>👑 TradeLord Quest</Text>

      <Text style={styles.tagline}>
        Learn. Practice. Compete.
      </Text>

      <View style={styles.balanceCard}>
        <Text style={styles.label}>Virtual Balance</Text>
        <Text style={styles.balance}>$10,000.00</Text>
        <Text style={styles.profit}>+$125.40 Today</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.smallCard}>
          <Text style={styles.label}>⭐ Points</Text>
          <Text style={styles.value}>2,480</Text>
        </View>

        <View style={styles.smallCard}>
          <Text style={styles.label}>🔥 Streak</Text>
          <Text style={styles.value}>7 Days</Text>
        </View>
      </View>

      <Text style={styles.section}>Today</Text>

      <View style={styles.menuCard}>
        <Text style={styles.menu}>📈  Demo Trading</Text>
        <Text style={styles.menu}>📰  Market News</Text>
        <Text style={styles.menu}>🎓  Trading Academy</Text>
        <Text style={styles.menu}>🤖  AI Teacher</Text>
        <Text style={styles.menu}>🏆  Competition</Text>
        <Text style={styles.menu}>🎁  Points & Rewards</Text>
        <Text style={styles.menu}>💎  Premium</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080B12',
    padding: 20,
  },

  logo: {
    color: '#FFD700',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 20,
  },

  tagline: {
    color: '#9AA4B2',
    fontSize: 14,
    marginTop: 5,
    marginBottom: 25,
  },

  balanceCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#263244',
  },

  label: {
    color: '#9AA4B2',
    fontSize: 14,
  },

  balance: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: 'bold',
    marginTop: 8,
  },

  profit: {
    color: '#35D07F',
    fontSize: 15,
    marginTop: 8,
  },

  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 15,
  },

  smallCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 15,
    padding: 18,
    borderWidth: 1,
    borderColor: '#263244',
  },

  value: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 7,
  },

  section: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 28,
    marginBottom: 12,
  },

  menuCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 8,
  },

  menu: {
    color: '#FFFFFF',
    fontSize: 17,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#202938',
  },
});
