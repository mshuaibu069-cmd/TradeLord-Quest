import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from './supabase';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [mode, setMode] = useState('signIn');
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;
      if (error) setMessage(error.message);
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (nextSession) await loadProfile(nextSession.user.id);
      else setProfile(null);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  async function loadProfile(userId) {
    const { data, error } = await supabase.from('profiles')
      .select('id, username, display_name, virtual_balance, points, streak_days, premium_until, created_at')
      .eq('id', userId).single();
    if (error) { setMessage(error.message); return; }
    setProfile(data);
  }

  async function submitAuth() {
    const email = form.email.trim();
    const password = form.password;
    if (!email || !password) return setMessage('Enter your email and password.');
    if (password.length < 6) return setMessage('Password must be at least 6 characters.');
    setWorking(true); setMessage('');
    if (mode === 'signIn') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else if (!data.session) {
        setMessage('Account created. Check your email to confirm your account, then sign in.');
        setMode('signIn');
      }
    }
    setWorking(false);
  }

  async function signOut() {
    setWorking(true);
    const { error } = await supabase.auth.signOut();
    setWorking(false);
    if (error) setMessage(error.message);
  }

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" /><Text style={styles.loadingText}>Loading TradeLord Quest…</Text></SafeAreaView>;

  if (!session) return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.authContent}>
          <View style={styles.logoMark}><Text style={styles.logoMarkText}>TL</Text></View>
          <Text style={styles.logo}>TradeLord Quest</Text>
          <Text style={styles.tagline}>Learn. Practice. Compete.</Text>
          <View style={styles.authCard}>
            <Text style={styles.title}>{mode === 'signIn' ? 'Welcome back' : 'Create your account'}</Text>
            <Text style={styles.subtitle}>{mode === 'signIn' ? 'Sign in to continue your trading-learning journey.' : 'Start learning with virtual money. No real-money trading.'}</Text>
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#6B7280" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={(email) => setForm({ ...form, email })} />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#6B7280" secureTextEntry value={form.password} onChangeText={(password) => setForm({ ...form, password })} />
            {!!message && <Text style={styles.message}>{message}</Text>}
            <TouchableOpacity style={styles.primaryButton} onPress={submitAuth} disabled={working}>
              {working ? <ActivityIndicator color="#08101C" /> : <Text style={styles.primaryText}>{mode === 'signIn' ? 'Sign In' : 'Create Account'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.switchButton} onPress={() => { setMessage(''); setMode(mode === 'signIn' ? 'signUp' : 'signIn'); }}>
              <Text style={styles.switchText}>{mode === 'signIn' ? 'New to TradeLord Quest? Create an account' : 'Already have an account? Sign in'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  const balance = Number(profile?.virtual_balance ?? 10000);
  const points = Number(profile?.points ?? 0);
  const streak = Number(profile?.streak_days ?? 0);
  const displayName = profile?.display_name || profile?.username || session.user.email || 'Trader';
  const balanceText = '$' + balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.homeContent}>
        <View style={styles.headerRow}>
          <View><Text style={styles.eyebrow}>TRADELORD QUEST</Text><Text style={styles.greeting}>Welcome, {displayName.split('@')[0]}</Text></View>
          <TouchableOpacity onPress={signOut} disabled={working}><Text style={styles.signOut}>Sign out</Text></TouchableOpacity>
        </View>
        <Text style={styles.tagline}>Learn. Practice. Compete.</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.cardLabel}>Virtual Balance</Text>
          <Text style={styles.balance}>{balanceText}</Text>
          <Text style={styles.demoLabel}>DEMO MONEY • EDUCATIONAL SIMULATOR</Text>
        </View>
        <View style={styles.statsRow}>
          <StatCard label="⭐ Points" value={points.toLocaleString()} />
          <StatCard label="🔥 Streak" value={streak + ' Days'} />
        </View>
        <Text style={styles.section}>Continue learning</Text>
        <MenuCard icon="📈" title="Demo Trading" subtitle="Practice with virtual money" />
        <MenuCard icon="🎓" title="Trading Academy" subtitle="Learn step by step" />
        <MenuCard icon="🤖" title="AI Teacher" subtitle="Get explanations and guidance" />
        <MenuCard icon="🏆" title="Competition" subtitle="Complete challenges and earn points" />
        <MenuCard icon="📰" title="Market News" subtitle="Learn what moves markets" />
        <MenuCard icon="🎁" title="Points & Rewards" subtitle="Track your progress" />
        <MenuCard icon="💎" title="Premium" subtitle="Unlock more learning features" />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value }) {
  return <View style={styles.statCard}><Text style={styles.cardLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text></View>;
}

function MenuCard({ icon, title, subtitle }) {
  return <TouchableOpacity style={styles.menuCard}><Text style={styles.menuIcon}>{icon}</Text><View style={styles.menuText}><Text style={styles.menuTitle}>{title}</Text><Text style={styles.menuSubtitle}>{subtitle}</Text></View><Text style={styles.chevron}>›</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  flex:{flex:1}, container:{flex:1,backgroundColor:'#080B12'}, center:{flex:1,backgroundColor:'#080B12',alignItems:'center',justifyContent:'center'},
  loadingText:{color:'#9AA4B2',marginTop:12}, authContent:{flexGrow:1,justifyContent:'center',padding:24}, homeContent:{padding:20,paddingBottom:40},
  logoMark:{width:58,height:58,borderRadius:17,backgroundColor:'#D9B44A',alignItems:'center',justifyContent:'center',marginBottom:14},
  logoMarkText:{color:'#08101C',fontSize:20,fontWeight:'900'}, logo:{color:'#F5D76E',fontSize:30,fontWeight:'800'},
  tagline:{color:'#8D98A8',fontSize:14,marginTop:5,marginBottom:25}, authCard:{backgroundColor:'#111827',borderRadius:22,padding:22,borderWidth:1,borderColor:'#263244'},
  title:{color:'#FFFFFF',fontSize:24,fontWeight:'800'}, subtitle:{color:'#9AA4B2',fontSize:14,lineHeight:21,marginTop:8,marginBottom:20},
  input:{backgroundColor:'#0B111C',color:'#FFFFFF',borderWidth:1,borderColor:'#2A3547',borderRadius:13,paddingHorizontal:15,height:52,marginBottom:12,fontSize:15},
  message:{color:'#F5D76E',lineHeight:20,marginBottom:12}, primaryButton:{height:52,borderRadius:13,backgroundColor:'#D9B44A',alignItems:'center',justifyContent:'center',marginTop:4},
  primaryText:{color:'#08101C',fontSize:16,fontWeight:'800'}, switchButton:{paddingTop:18,alignItems:'center'}, switchText:{color:'#AEB8C6',fontSize:13,textAlign:'center'},
  headerRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:10}, eyebrow:{color:'#D9B44A',fontSize:11,fontWeight:'800',letterSpacing:1.4},
  greeting:{color:'#FFFFFF',fontSize:25,fontWeight:'800',marginTop:4}, signOut:{color:'#9AA4B2',fontSize:13},
  balanceCard:{backgroundColor:'#111827',borderRadius:20,padding:22,borderWidth:1,borderColor:'#263244'}, cardLabel:{color:'#9AA4B2',fontSize:13},
  balance:{color:'#FFFFFF',fontSize:35,fontWeight:'800',marginTop:8}, demoLabel:{color:'#657184',fontSize:10,fontWeight:'700',letterSpacing:1,marginTop:9},
  statsRow:{flexDirection:'row',gap:12,marginTop:14}, statCard:{flex:1,backgroundColor:'#111827',borderRadius:16,padding:17,borderWidth:1,borderColor:'#263244'},
  statValue:{color:'#FFFFFF',fontSize:20,fontWeight:'800',marginTop:7}, section:{color:'#FFFFFF',fontSize:20,fontWeight:'800',marginTop:27,marginBottom:12},
  menuCard:{flexDirection:'row',alignItems:'center',backgroundColor:'#111827',borderRadius:16,padding:15,borderWidth:1,borderColor:'#202938',marginBottom:10},
  menuIcon:{fontSize:23,width:40}, menuText:{flex:1}, menuTitle:{color:'#FFFFFF',fontSize:16,fontWeight:'700'}, menuSubtitle:{color:'#7F8A9A',fontSize:12,marginTop:3}, chevron:{color:'#657184',fontSize:27,marginLeft:8}
});