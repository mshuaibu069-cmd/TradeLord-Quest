import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from './supabase';
import { signIn, signOut as signOutUser, signUp } from './src/services/auth';
import { getCurrentProfile } from './src/services/profile';
import { registerDeviceForPush } from './src/services/notifications';
import {
  createSupportTicket,
  getMySupportTickets,
  getPrivacySettings,
  updatePrivacySettings,
  requestAccountDeletion,
} from './src/services/support';
import {
  FALLBACK_MARKETS,
  getDemoMarkets,
  getVirtualPositions,
  placeVirtualOrder,
} from './src/services/trading';

const C = {
  bg: '#080B12',
  card: '#111827',
  card2: '#0D1420',
  border: '#263244',
  text: '#FFFFFF',
  muted: '#94A0B0',
  faint: '#657184',
  accent: '#D9B44A',
  accentText: '#08101C',
  success: '#72D6A1',
  danger: '#FF7B7B',
};

const NAV = [
  { key: 'home', label: 'Home', icon: '⌂' },
  { key: 'trade', label: 'Trade', icon: '↗' },
  { key: 'academy', label: 'Academy', icon: '▣' },
  { key: 'news', label: 'News', icon: '◉' },
  { key: 'ai', label: 'AI Teacher', icon: 'AI' },
  { key: 'more', label: 'More', icon: '☰' },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [mode, setMode] = useState('signIn');
  const [screen, setScreen] = useState('home');
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [showPoweredBy, setShowPoweredBy] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowPoweredBy(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const result = await supabase.auth.getSession();
      if (!mounted) return;

      if (result.error) setMessage(result.error.message);
      setSession(result.data.session);

      if (result.data.session) {
        try {
          setProfile(await getCurrentProfile());
          registerDeviceForPush(result.data.session.user.id).catch(() => {});
        } catch (error) {
          setMessage(error.message);
        }
      }

      setLoading(false);
    }

    boot();

    const listener = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);

      if (nextSession) {
        try {
          setProfile(await getCurrentProfile());
          registerDeviceForPush(nextSession.user.id).catch(() => {});
        } catch (error) {
          setMessage(error.message);
        }
      } else {
        setProfile(null);
        setScreen('home');
      }
    });

    return () => {
      mounted = false;
      listener.data.subscription.unsubscribe();
    };
  }, []);

  async function refreshProfile() {
    if (!session) return;
    try {
      setProfile(await getCurrentProfile());
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function authSubmit() {
    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      setMessage('Enter your email and password.');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }

    setWorking(true);
    setMessage('');

    try {
      if (mode === 'signIn') {
        await signIn(email, password);
      } else {
        const data = await signUp(email, password);
        if (!data.session) {
          setMessage('Account created. Check your email, then sign in.');
          setMode('signIn');
        }
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setWorking(false);
    }
  }

  async function logout() {
    setWorking(true);
    try {
      await signOutUser();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setWorking(false);
    }
  }

  if (showPoweredBy) {
    return <PoweredByScreen />;
  }

  if (loading) {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator size="large" />
        <Text style={s.loading}>Loading TradeLord Quest…</Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={s.container}>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.authContent}>
            <View style={s.authBrand}>
              <View style={s.logoMark}><Text style={s.logoMarkText}>TL</Text></View>
              <Text style={s.logo}>TradeLord Quest</Text>
              <Text style={s.tagline}>Learn. Practice. Compete.</Text>
            </View>

            <View style={s.authCard}>
              <Text style={s.title}>{mode === 'signIn' ? 'Welcome back' : 'Create your account'}</Text>
              <Text style={s.subtitle}>
                {mode === 'signIn'
                  ? 'Sign in to continue your trading-learning journey.'
                  : 'Start learning with virtual money. No real-money trading.'}
              </Text>

              <TextInput
                style={s.input}
                placeholder="Email"
                placeholderTextColor={C.faint}
                autoCapitalize="none"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(email) => setForm({ ...form, email })}
              />

              <TextInput
                style={s.input}
                placeholder="Password"
                placeholderTextColor={C.faint}
                secureTextEntry
                value={form.password}
                onChangeText={(password) => setForm({ ...form, password })}
              />

              {!!message && <Text style={s.message}>{message}</Text>}

              <Pressable style={s.primaryButton} onPress={authSubmit} disabled={working}>
                {working ? <ActivityIndicator color={C.accentText} /> : <Text style={s.primaryText}>{mode === 'signIn' ? 'Sign In' : 'Create Account'}</Text>}
              </Pressable>

              <Pressable
                style={s.switchButton}
                onPress={() => {
                  setMessage('');
                  setMode(mode === 'signIn' ? 'signUp' : 'signIn');
                }}
              >
                <Text style={s.switchText}>
                  {mode === 'signIn'
                    ? 'New to TradeLord Quest? Create an account'
                    : 'Already have an account? Sign in'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const common = {
    profile,
    onBack: () => setScreen('home'),
    setScreen,
    refreshProfile,
    session,
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.flex}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          {screen === 'home' && <HomeScreen {...common} />}
          {screen === 'trade' && <TradeScreen {...common} />}
          {screen === 'academy' && <AcademyScreen {...common} />}
          {screen === 'challenges' && <ChallengesScreen {...common} />}
          {screen === 'news' && <NewsScreen {...common} />}
          {screen === 'ai' && <AiScreen {...common} />}
          {screen === 'more' && <MoreScreen {...common} />}
          {screen === 'rewards' && <RewardsScreen {...common} />
          {screen === 'premium' && <PremiumScreen {...common} />}
          {screen === 'account' && <AccountScreen {...common} onSignOut={logout} working={working} />}
          {screen === 'support' && <SupportScreen {...common} />}
          {screen === 'privacy' && <PrivacyScreen {...common} />}
          {screen === 'terms' && <TermsScreen {...common} />}
        </ScrollView>

        {NAV.some((item) => item.key === screen) && (
          <View style={s.bottomNav}>
            {NAV.map((item) => (
              <Pressable key={item.key} style={s.navItem} onPress={() => setScreen(item.key)}>
                <Text style={[s.navIcon, screen === item.key && s.active]}>{item.icon}</Text>
                <Text style={[s.navLabel, screen === item.key && s.active]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function PoweredByScreen() {
  return (
    <SafeAreaView style={s.poweredScreen}>
      <View style={s.poweredContent}>
        <View style={s.poweredMark}><Text style={s.poweredMarkText}>V</Text></View>
        <Text style={s.poweredText}>Powered by</Text>
        <Text style={s.poweredBrand}>VEQORO</Text>
      </View>
    </SafeAreaView>
  );
}

function HomeScreen({ session, profile, setScreen }) {
  const balance = Number(profile?.virtual_balance ?? 10000);
  const points = Number(profile?.points ?? 0);
  const streak = Number(profile?.streak_days ?? 0);
  const displayName = profile?.display_name || profile?.username || session.user.email || 'Trader';

  return (
    <>
      <View style={s.headerRow}>
        <View style={s.headerLeft}>
          <Text style={s.eyebrow}>TRADELORD QUEST</Text>
          <Text style={s.greeting}>Welcome, {String(displayName).split('@')[0]}</Text>
        </View>
        <Pressable onPress={() => setScreen('account')}><Text style={s.accountButton}>Account</Text></Pressable>
      </View>

      <Text style={s.tagline}>Learn. Practice. Compete.</Text>

      <View style={s.balanceCard}>
        <Text style={s.cardLabel}>Virtual Balance</Text>
        <Text style={s.balance}>
          {'$' + balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <Text style={s.demoLabel}>DEMO MONEY • EDUCATIONAL SIMULATOR</Text>
      </View>

      <View style={s.statsRow}>
        <View style={s.statCard}><Text style={s.cardLabel}>Points</Text><Text style={s.statValue}>★ {points.toLocaleString()}</Text></View>
        <View style={s.statCard}><Text style={s.cardLabel}>Streak</Text><Text style={s.statValue}>🔥 {streak} Days</Text></View>
      </View>

      <Text style={s.section}>Continue learning</Text>
      <MenuCard icon="↗" title="Demo Trading" subtitle="Practice with virtual money" onPress={() => setScreen('trade')} />
      <MenuCard icon="▣" title="Trading Academy" subtitle="Learn the fundamentals step by step" onPress={() => setScreen('academy')} />
      <MenuCard icon="AI" title="AI Teacher" subtitle="Secure AI interface — backend next" onPress={() => setScreen('ai')} />
      <MenuCard icon="★" title="Challenges" subtitle="Practice structured trading tasks" onPress={() => setScreen('challenges')} />
      <MenuCard icon="◉" title="Market News" subtitle="Demo market brief while live feed is prepared" onPress={() => setScreen('news')} />
      <MenuCard icon="✦" title="Points & Rewards" subtitle="Track progression and future unlocks" onPress={() => setScreen('rewards')} />
      <MenuCard icon="◆" title="Premium" subtitle="More learning features and no ads" onPress={() => setScreen('premium')} />
    </>
  );
}

function TradeScreen({ profile, onBack, refreshProfile }) {
  const [markets, setMarkets] = useState(FALLBACK_MARKETS);
  const [selected, setSelected] = useState(FALLBACK_MARKETS[0]);
  const [side, setSide] = useState('buy');
  const [quantity, setQuantity] = useState('0.01');
  const [positions, setPositions] = useState([]);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const marketData = await getDemoMarkets();
        const positionData = await getVirtualPositions();
        if (!active) return;
        setMarkets(marketData.length ? marketData : FALLBACK_MARKETS);
        setSelected(marketData.find((m) => m.symbol === selected.symbol) || marketData[0] || FALLBACK_MARKETS[0]);
        setPositions(positionData);
      } catch (error) {
        if (active) setStatus(error.message);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  async function reloadPositions() {
    setPositions(await getVirtualPositions());
  }

  const qty = Number(quantity);
  const price = Number(selected?.price || 0);
  const value = Number.isFinite(qty) ? qty * price : 0;
  const priceText = price.toLocaleString(undefined, {
    minimumFractionDigits: price < 10 ? 3 : 2,
    maximumFractionDigits: price < 10 ? 5 : 2,
  });

  async function trade() {
    if (!Number.isFinite(qty) || qty <= 0) {
      setStatus('Enter a quantity greater than zero.');
      return;
    }

    setWorking(true);
    setStatus('');

    try {
      const result = await placeVirtualOrder(selected.symbol, side, qty);
      await reloadPositions();
      await refreshProfile();

      const newBalance = Number(result?.new_balance || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      setStatus(
        (side === 'buy' ? 'Bought ' : 'Sold ') +
        qty +
        ' ' +
        selected.symbol +
        ' at $' +
        Number(result?.filled_price || price).toLocaleString() +
        '. New demo balance: $' +
        newBalance
      );
    } catch (error) {
      setStatus(error.message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <ScreenHeader title="Demo Trading" onBack={onBack} />
      <Text style={s.helperText}>Server-held demo prices. No real-money trading.</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.assetRow}>
        {markets.map((market) => (
          <Pressable
            key={market.symbol}
            style={[s.assetChip, selected?.symbol === market.symbol && s.assetChipActive]}
            onPress={() => setSelected(market)}
          >
            <Text style={[s.assetChipText, selected?.symbol === market.symbol && s.assetChipTextActive]}>{market.symbol}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={s.quoteCard}>
        <Text style={s.cardLabel}>{selected?.display_name}</Text>
        <Text style={s.quotePrice}>{'$' + priceText}</Text>
        <Text style={s.faintText}>Demo quote • {selected?.asset_type}</Text>
      </View>

      <View style={s.tradeSideRow}>
        <Pressable style={[s.sideButton, side === 'buy' && s.buyActive]} onPress={() => setSide('buy')}>
          <Text style={[s.sideText, side === 'buy' && s.sideActive]}>BUY</Text>
        </Pressable>
        <Pressable style={[s.sideButton, side === 'sell' && s.sellActive]} onPress={() => setSide('sell')}>
          <Text style={[s.sideText, side === 'sell' && s.sideActive]}>SELL</Text>
        </Pressable>
      </View>

      <Text style={s.fieldLabel}>Quantity</Text>
      <TextInput
        style={s.input}
        keyboardType="decimal-pad"
        value={quantity}
        onChangeText={setQuantity}
        placeholder="0.01"
        placeholderTextColor={C.faint}
      />

      <View style={s.tradeSummary}>
        <Text style={s.summaryLabel}>Estimated value</Text>
        <Text style={s.summaryValue}>
          {'$' + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>

      {!!status && <Text style={[s.message, (status.indexOf('Bought') === 0 || status.indexOf('Sold') === 0) && s.success]}>{status}</Text>}

      <Pressable style={s.primaryButton} onPress={trade} disabled={working}>
        {working ? <ActivityIndicator color={C.accentText} /> : <Text style={s.primaryText}>{side === 'buy' ? 'Place Demo Buy' : 'Place Demo Sell'}</Text>}
      </Pressable>

      <Text style={s.section}>Your positions</Text>
      {positions.length === 0 ? (
        <EmptyState text="No open demo positions yet." />
      ) : (
        positions.map((position) => (
          <View key={position.symbol} style={s.listRow}>
            <View style={s.listGrow}>
              <Text style={s.listTitle}>{position.symbol}</Text>
              <Text style={s.listSubtitle}>
                Qty {Number(position.quantity).toLocaleString()} • Avg {'$' + Number(position.avg_price).toLocaleString()}
              </Text>
            </View>
            <Text style={s.listValue}>Open</Text>
          </View>
        ))
      )}
    </>
  );
}

function AcademyScreen({ onBack }) {
  const lessons = [
    ['1. What moves a market?', 'Learn supply, demand, buyers, sellers, and why price changes.'],
    ['2. Reading a candle', 'Understand open, high, low, and close without assuming the next candle.'],
    ['3. Risk before reward', 'Learn why position size and loss limits matter more than chasing wins.'],
    ['4. Trading psychology', 'Recognize fear, greed, revenge trading, and overconfidence.'],
  ];
  const [selected, setSelected] = useState(0);

  return (
    <>
      <ScreenHeader title="Trading Academy" onBack={onBack} />
      <Text style={s.helperText}>Short lessons designed for practice inside the simulator.</Text>
      {lessons.map((lesson, i) => (
        <Pressable key={lesson[0]} style={[s.lessonCard, selected === i && s.lessonActive]} onPress={() => setSelected(i)}>
          <Text style={s.lessonNumber}>LESSON {i + 1}</Text>
          <Text style={s.lessonTitle}>{lesson[0]}</Text>
        </Pressable>
      ))}
      <View style={s.lessonDetail}>
        <Text style={s.detailTitle}>{lessons[selected][0]}</Text>
        <Text style={s.bodyText}>{lessons[selected][1]}</Text>
      </View>
      <View style={s.infoCallout}>
        <Text style={s.infoTitle}>Next backend pass</Text>
        <Text style={s.bodyText}>Saved lesson progress, quizzes, and server-side point awards come after this foundation is stable.</Text>
      </View>
    </>
  );
}

function ChallengesScreen({ profile, onBack }) {
  const [started, setStarted] = useState(null);
  const challenges = [
    ['Market Basics', 'Explain why price can rise while some traders sell.', 25],
    ['Risk Check', 'Choose a position size without risking the whole demo balance.', 40],
    ['Trend Practice', 'Identify a trend before placing a demo trade.', 50],
  ];

  return (
    <>
      <ScreenHeader title="Challenges" onBack={onBack} />
      <View style={s.balanceMini}>
        <Text style={s.cardLabel}>Current points</Text>
        <Text style={s.statValue}>★ {Number(profile?.points ?? 0).toLocaleString()}</Text>
      </View>
      {challenges.map((challenge) => (
        <View key={challenge[0]} style={s.challengeCard}>
          <View style={s.challengeTop}>
            <Text style={s.challengeTitle}>{challenge[0]}</Text>
            <Text style={s.reward}>+{challenge[2]} pts</Text>
          </View>
          <Text style={s.bodyText}>{challenge[1]}</Text>
          <Pressable style={s.secondaryButton} onPress={() => setStarted(challenge[0])}>
            <Text style={s.secondaryText}>{started === challenge[0] ? 'Challenge started' : 'Start challenge'}</Text>
          </Pressable>
        </View>
      ))}
    </>
  );
}

function NewsScreen({ onBack }) {
  const briefs = [
    ['Why news moves price', 'News changes expectations about future value and risk.'],
    ['Interest rates', 'Borrowing costs can affect demand across markets.'],
    ['Crypto volatility', 'Crypto markets can move quickly as participation and sentiment change.'],
    ['Company earnings', 'Earnings reports can change how investors value a company.'],
  ];

  return (
    <>
      <ScreenHeader title="Market News" onBack={onBack} />
      <View style={s.infoCallout}>
        <Text style={s.infoTitle}>Demo market brief</Text>
        <Text style={s.bodyText}>These are educational summaries. Live news will use an authorized feed with attribution before release.</Text>
      </View>
      {briefs.map((item) => (
        <View key={item[0]} style={s.listRow}>
          <View style={s.listGrow}>
            <Text style={s.listTitle}>{item[0]}</Text>
            <Text style={s.listSubtitle}>{item[1]}</Text>
          </View>
        </View>
      ))}
    </>
  );
}

function MoreScreen({ onBack, setScreen }) {
  return (
    <>
      <ScreenHeader title="More" onBack={onBack} />
      <Text style={s.helperText}>The bottom navigation stays focused on the six areas you use most. The rest is here.</Text>

      <Text style={s.section}>Your tools</Text>
      <MenuCard icon="★" title="Challenges & Competition" subtitle="Challenges, competitions, leaderboards, and rewards" onPress={() => setScreen('challenges')} />
      <MenuCard icon="✦" title="Points & Rewards" subtitle="Track points, streaks, and progression" onPress={() => setScreen('rewards')} />
      <MenuCard icon="◆" title="Premium" subtitle="More AI, advanced learning, and no ads" onPress={() => setScreen('premium')} />

      <Text style={s.section}>Account & protection</Text>
      <MenuCard icon="●" title="Profile & Account" subtitle="Account details, sign out, and deletion request" onPress={() => setScreen('account')} />
      <MenuCard icon="?" title="Help & Complaints" subtitle="Report bugs, privacy, security, billing, or account problems" onPress={() => setScreen('support')} />
      <MenuCard icon="✓" title="Privacy & Security" subtitle="Data controls, security monitoring, and your rights" onPress={() => setScreen('privacy')} />
      <MenuCard icon="§" title="Terms & Rules" subtitle="Service rules and educational-simulator limits" onPress={() => setScreen('terms')} />

      <View style={s.infoCallout}>
        <Text style={s.infoTitle}>Six-item navigation</Text>
        <Text style={s.bodyText}>Home, Trade, Academy, News, AI Teacher, and More stay visible. Other sections remain available from More instead of crowding the bottom bar.</Text>
      </View>
    </>
  );
}

function RewardsScreen({ profile, onBack }) {
  return (
    <>
      <ScreenHeader title="Points & Rewards" onBack={onBack} />
      <View style={s.balanceMini}>
        <Text style={s.cardLabel}>Points</Text>
        <Text style={s.bigMetric}>★ {Number(profile?.points ?? 0).toLocaleString()}</Text>
      </View>
      <View style={s.infoCallout}>
        <Text style={s.infoTitle}>No cash withdrawals</Text>
        <Text style={s.bodyText}>TradeLord Quest points are virtual progression points, not money.</Text>
      </View>
      <Text style={s.section}>Planned earning routes</Text>
      <Text style={s.bodyText}>Lessons, quizzes, challenges, competitions, streaks, and referrals can award points. Server-side rules will control the real rewards.</Text>
    </>
  );
}

function PremiumScreen({ onBack }) {
  return (
    <>
      <ScreenHeader title="Premium" onBack={onBack} />
      <Text style={s.helperText}>Reference launch pricing. Purchases are not connected yet.</Text>
      <Plan title="Africa reference" monthly="$5.99 / month" yearly="$49.99 / year" />
      <Plan title="Rest-of-world reference" monthly="$6.99 / month" yearly="$54.99 / year" />
      <View style={s.infoCallout}>
        <Text style={s.infoTitle}>Purchase layer comes later</Text>
        <Text style={s.bodyText}>Google Play Billing and subscription verification must be connected server-side before these become real purchases.</Text>
      </View>
    </>
  );
}

function Plan({ title, monthly, yearly }) {
  return (
    <View style={s.planCard}>
      <Text style={s.planTitle}>{title}</Text>
      <Text style={s.planPrice}>{monthly}</Text>
      <Text style={s.planYearly}>{yearly}</Text>
      <Text style={s.bodyText}>More AI Teacher access, advanced lessons, advanced analysis, premium challenges, and no ads.</Text>
    </View>
  );
}

function AiScreen({ onBack }) {
  const [question, setQuestion] = useState('');
  const [prepared, setPrepared] = useState(false);

  return (
    <>
      <ScreenHeader title="AI Teacher" onBack={onBack} />
      <View style={s.infoCallout}>
        <Text style={s.infoTitle}>Secure AI design</Text>
        <Text style={s.bodyText}>The mobile app will not contain an OpenAI API key. The final teacher will use a secure server endpoint and server-side usage limits.</Text>
      </View>
      <Text style={s.fieldLabel}>Your question</Text>
      <TextInput
        style={[s.input, s.textArea]}
        multiline
        value={question}
        onChangeText={(value) => { setQuestion(value); setPrepared(false); }}
        placeholder="Example: What does RSI measure?"
        placeholderTextColor={C.faint}
      />
      <Pressable style={s.secondaryButton} onPress={() => setPrepared(Boolean(question.trim()))}>
        <Text style={s.secondaryText}>Prepare question</Text>
      </Pressable>
      {prepared && (
        <View style={s.lessonDetail}>
          <Text style={s.detailTitle}>Question prepared</Text>
          <Text style={s.bodyText}>{question.trim()}</Text>
          <Text style={s.helperText}>Live AI answering waits for the secure backend connection.</Text>
        </View>
      )}
    </>
  );
}

function AccountScreen({ session, profile, onBack, onSignOut, working, setScreen }) {
  const [deleteWorking, setDeleteWorking] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');

  async function submitDeletionRequest() {
    setDeleteWorking(true);
    setDeleteMessage('');
    try {
      await requestAccountDeletion('User requested account and associated data deletion.');
      setDeleteMessage('Deletion request submitted. We will process it securely.');
    } catch (error) {
      setDeleteMessage(error.message);
    } finally {
      setDeleteWorking(false);
    }
  }

  return (
    <>
      <ScreenHeader title="Account" onBack={onBack} />
      <View style={s.accountCard}>
        <Text style={s.cardLabel}>Email</Text>
        <Text style={s.accountValue}>{session.user.email}</Text>
        <Text style={[s.cardLabel, s.accountGap]}>Display name</Text>
        <Text style={s.accountValue}>{profile?.display_name || 'Not set'}</Text>
        <Text style={[s.cardLabel, s.accountGap]}>Starting demo balance</Text>
        <Text style={s.accountValue}>$10,000.00</Text>
      </View>

      <Text style={s.section}>Help & protection</Text>
      <MenuCard icon="?" title="Help & Complaints" subtitle="Report bugs, billing, privacy, security, or account problems" onPress={() => setScreen('support')} />
      <MenuCard icon="✓" title="Privacy & Security" subtitle="See what data is used and control available settings" onPress={() => setScreen('privacy')} />
      <MenuCard icon="§" title="Terms & Rules" subtitle="Important rules, limits, and responsibilities" onPress={() => setScreen('terms')} />

      <View style={s.infoCallout}>
        <Text style={s.infoTitle}>Account deletion</Text>
        <Text style={s.bodyText}>You can request deletion of your account and associated data. Some records may need limited retention for security, fraud prevention, or legal obligations.</Text>
        {!!deleteMessage && <Text style={[s.message, s.success, { marginTop: 10 }]}>{deleteMessage}</Text>}
        <Pressable style={s.secondaryButton} onPress={submitDeletionRequest} disabled={deleteWorking}>
          {deleteWorking ? <ActivityIndicator /> : <Text style={s.secondaryText}>Request account deletion</Text>}
        </Pressable>
      </View>

      <Pressable style={s.dangerButton} onPress={onSignOut} disabled={working}>
        {working ? <ActivityIndicator /> : <Text style={s.dangerText}>Sign out</Text>}
      </Pressable>
    </>
  );
}

function SupportScreen({ onBack }) {
  const [category, setCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState([]);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState('');

  async function loadTickets() {
    try {
      setTickets(await getMySupportTickets());
    } catch (error) {
      setStatus(error.message);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function submit() {
    if (subject.trim().length < 3 || message.trim().length < 5) {
      setStatus('Please enter a short subject and explain the problem.');
      return;
    }

    setWorking(true);
    setStatus('');
    try {
      const ticket = await createSupportTicket({ category, subject, message });
      setSubject('');
      setMessage('');
      setStatus('Complaint received. The support agent will triage it automatically. Harder cases can be escalated for human decision, and you can be notified when the status changes.');
      await loadTickets();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <ScreenHeader title="Help & Complaints" onBack={onBack} />
      <View style={s.infoCallout}>
        <Text style={s.infoTitle}>Automatic support</Text>
        <Text style={s.bodyText}>Your complaint is stored securely. A server-side support agent can triage routine issues, notify you when there is an update, and escalate security, privacy, billing, deletion, or legal/regulatory cases for human review.</Text>
        <Text style={[s.bodyText, { marginTop: 8 }]}>We do not need to watch your private activity to provide support. Security monitoring is limited to signals needed to protect the service and investigate abuse.</Text>
      </View>

      <Text style={s.fieldLabel}>Problem type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.assetRow}>
        {['general','bug','billing','privacy','security','account','content'].map((item) => (
          <Pressable key={item} style={[s.assetChip, category === item && s.assetChipActive]} onPress={() => setCategory(item)}>
            <Text style={[s.assetChipText, category === item && s.assetChipTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={s.fieldLabel}>Subject</Text>
      <TextInput style={s.input} value={subject} onChangeText={setSubject} placeholder="What happened?" placeholderTextColor={C.faint} />

      <Text style={s.fieldLabel}>Details</Text>
      <TextInput
        style={[s.input, s.textArea]}
        multiline
        value={message}
        onChangeText={setMessage}
        placeholder="Explain the problem clearly."
        placeholderTextColor={C.faint}
      />

      {!!status && <Text style={s.message}>{status}</Text>}

      <Pressable style={s.primaryButton} onPress={submit} disabled={working}>
        {working ? <ActivityIndicator color={C.accentText} /> : <Text style={s.primaryText}>Send complaint</Text>}
      </Pressable>

      <Text style={s.section}>Your previous complaints</Text>
      {tickets.length === 0 ? (
        <EmptyState text="No complaints submitted yet." />
      ) : (
        tickets.map((ticket) => (
          <View key={ticket.id} style={s.listRow}>
            <View style={s.listGrow}>
              <Text style={s.listTitle}>{ticket.subject}</Text>
              <Text style={s.listSubtitle}>{ticket.category} • {ticket.status} • {ticket.priority}</Text>
              {!!ticket.ai_recommendation && <Text style={s.listSubtitle}>Support note: {ticket.ai_recommendation}</Text>}
            </View>
          </View>
        ))
      )}
    </>
  );
}

function PrivacyScreen({ onBack }) {
  const [settings, setSettings] = useState(null);
  const [status, setStatus] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    getPrivacySettings().then(setSettings).catch((error) => setStatus(error.message));
  }, []);

  async function save(next) {
    setWorking(true);
    setStatus('');
    try {
      const updated = await updatePrivacySettings(next);
      setSettings(updated);
      setStatus('Privacy settings saved.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setWorking(false);
    }
  }

  const supportAi = settings?.support_ai_enabled ?? true;
  const analytics = settings?.product_analytics_enabled ?? false;

  return (
    <>
      <ScreenHeader title="Privacy & Security" onBack={onBack} />
      <View style={s.infoCallout}>
        <Text style={s.infoTitle}>What we protect</Text>
        <Text style={s.bodyText}>TradeLord Quest should collect only data needed for accounts, learning, support, security, and features you choose. Passwords are handled by Supabase Auth; app secrets and AI keys must stay server-side.</Text>
      </View>

      <View style={s.settingRow}>
        <View style={s.settingText}>
          <Text style={s.listTitle}>Automatic support assistant</Text>
          <Text style={s.listSubtitle}>Allows complaint text to be processed for support triage.</Text>
        </View>
        <Pressable style={[s.toggle, supportAi && s.toggleOn]} onPress={() => save({ support_ai_enabled: !supportAi })} disabled={working}>
          <Text style={s.toggleText}>{supportAi ? 'ON' : 'OFF'}</Text>
        </Pressable>
      </View>

      <View style={s.settingRow}>
        <View style={s.settingText}>
          <Text style={s.listTitle}>Product analytics</Text>
          <Text style={s.listSubtitle}>Optional usage analytics for improving the product.</Text>
        </View>
        <Pressable style={[s.toggle, analytics && s.toggleOn]} onPress={() => save({ product_analytics_enabled: !analytics })} disabled={working}>
          <Text style={s.toggleText}>{analytics ? 'ON' : 'OFF'}</Text>
        </Pressable>
      </View>

      <View style={s.infoCallout}>
        <Text style={s.infoTitle}>Security monitoring</Text>
        <Text style={s.bodyText}>We may record limited security events such as failed sign-ins, abuse signals, and system errors to protect accounts and the service. This is not a promise that hacking is impossible.</Text>
        <Text style={[s.bodyText, { marginTop: 8 }]}>Privacy version: {settings?.privacy_version || '2026-10-02'}</Text>
      </View>

      {!!status && <Text style={s.message}>{status}</Text>}

      <Text style={s.section}>Your rights</Text>
      <Text style={s.bodyText}>You can ask about your data, request correction or deletion, and raise a privacy complaint. Nigerian privacy rules include rights to be informed, access, rectification, objection, restriction, portability, and erasure.</Text>
    </>
  );
}

function TermsScreen({ onBack }) {
  return (
    <>
      <ScreenHeader title="Terms & Rules" onBack={onBack} />
      <View style={s.infoCallout}>
        <Text style={s.infoTitle}>Educational simulator</Text>
        <Text style={s.bodyText}>TradeLord Quest uses virtual money. It is not a broker, exchange, bank, investment service, or promise of profit. AI explanations are educational and are not personalized financial advice.</Text>
      </View>

      <Text style={s.detailTitle}>User responsibilities</Text>
      <Text style={s.bodyText}>Do not abuse the service, attempt to bypass security, create fraudulent accounts, manipulate competitions, submit unlawful content, or interfere with other users.</Text>

      <Text style={s.detailTitle}>Service limits</Text>
      <Text style={s.bodyText}>We may rate-limit, flag, suspend, or investigate activity when necessary to protect users, the service, or competitions. High-impact actions should use human review where appropriate.</Text>

      <Text style={s.detailTitle}>AI support</Text>
      <Text style={s.bodyText}>Support automation may classify complaints and prepare responses. Users should be told when automation is used, and sensitive or high-impact cases should be escalated.</Text>

      <Text style={s.detailTitle}>Privacy</Text>
      <Text style={s.bodyText}>The final public privacy policy will describe data collection, sharing, retention, security, international processing, user rights, and deletion procedures in detail.</Text>
    </>
  );
}

function ScreenHeader({ title, onBack }) {
  return (
    <View style={s.screenHeader}>
      <Pressable onPress={onBack} style={s.backButton}><Text style={s.backText}>‹</Text></Pressable>
      <Text style={s.screenTitle}>{title}</Text>
      <View style={s.headerSpacer} />
    </View>
  );
}

function MenuCard({ icon, title, subtitle, onPress }) {
  return (
    <Pressable style={s.menuCard} onPress={onPress}>
      <View style={s.menuIconBox}><Text style={s.menuIcon}>{icon}</Text></View>
      <View style={s.menuText}>
        <Text style={s.menuTitle}>{title}</Text>
        <Text style={s.menuSubtitle}>{subtitle}</Text>
      </View>
      <Text style={s.chevron}>›</Text>
    </Pressable>
  );
}

function EmptyState({ text }) {
  return <View style={s.emptyState}><Text style={s.faintText}>{text}</Text></View>;
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  loading: { color: C.muted, marginTop: 12 },

  authContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  authBrand: { marginBottom: 24 },
  logoMark: { width: 58, height: 58, borderRadius: 17, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logoMarkText: { color: C.accentText, fontSize: 20, fontWeight: '900' },
  logo: { color: '#F5D76E', fontSize: 30, fontWeight: '800' },
  tagline: { color: C.muted, fontSize: 14, marginTop: 5, marginBottom: 25 },
  authCard: { backgroundColor: C.card, borderRadius: 22, padding: 22, borderWidth: 1, borderColor: C.border },
  title: { color: C.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: C.muted, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 20 },
  input: { backgroundColor: '#0B111C', color: C.text, borderWidth: 1, borderColor: '#2A3547', borderRadius: 13, paddingHorizontal: 15, minHeight: 52, marginBottom: 12, fontSize: 15 },
  textArea: { minHeight: 120, paddingTop: 14, textAlignVertical: 'top' },
  message: { color: C.accent, lineHeight: 20, marginBottom: 12 },
  success: { color: C.success },
  primaryButton: { minHeight: 52, borderRadius: 13, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginTop: 4, paddingHorizontal: 18 },
  primaryText: { color: C.accentText, fontSize: 16, fontWeight: '800' },
  switchButton: { paddingTop: 18, alignItems: 'center' },
  switchText: { color: '#AEB8C6', fontSize: 13, textAlign: 'center' },

  content: { padding: 20, paddingBottom: 34 },
  poweredScreen: { flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' },
  poweredContent: { alignItems: 'center', justifyContent: 'center' },
  poweredMark: { width: 70, height: 70, borderRadius: 20, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  poweredMarkText: { color: '#FFFFFF', fontSize: 36, fontWeight: '300', letterSpacing: -2 },
  poweredText: { color: '#9CA3AF', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' },
  poweredBrand: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', letterSpacing: 3, marginTop: 5 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  headerLeft: { flex: 1, paddingRight: 12 },
  eyebrow: { color: C.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  greeting: { color: C.text, fontSize: 25, fontWeight: '800', marginTop: 4 },
  accountButton: { color: C.muted, fontSize: 13 },

  balanceCard: { backgroundColor: C.card, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: C.border },
  cardLabel: { color: C.muted, fontSize: 13 },
  balance: { color: C.text, fontSize: 35, fontWeight: '800', marginTop: 8 },
  demoLabel: { color: C.faint, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 9 },
  statsRow: { flexDirection: 'row', marginTop: 14 },
  statCard: { flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 17, borderWidth: 1, borderColor: C.border, marginRight: 12 },
  statValue: { color: C.text, fontSize: 20, fontWeight: '800', marginTop: 7 },
  section: { color: C.text, fontSize: 20, fontWeight: '800', marginTop: 27, marginBottom: 12 },

  menuCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 15, borderWidth: 1, borderColor: '#202938', marginBottom: 10 },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  menuIcon: { color: C.accent, fontSize: 19, fontWeight: '900' },
  menuText: { flex: 1 },
  menuTitle: { color: C.text, fontSize: 16, fontWeight: '700' },
  menuSubtitle: { color: '#7F8A9A', fontSize: 12, marginTop: 3 },
  chevron: { color: C.faint, fontSize: 27, marginLeft: 8 },

  bottomNav: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.card, paddingTop: 7, paddingBottom: Platform.OS === 'android' ? 8 : 12 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 5 },
  navIcon: { color: C.faint, fontSize: 19, fontWeight: '800' },
  navLabel: { color: C.faint, fontSize: 10, marginTop: 2 },
  active: { color: C.accent },

  screenHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 12 },
  backButton: { width: 44, minHeight: 44, justifyContent: 'center' },
  backText: { color: C.text, fontSize: 34, lineHeight: 38 },
  screenTitle: { flex: 1, color: C.text, fontSize: 25, fontWeight: '800' },
  headerSpacer: { width: 44 },
  helperText: { color: C.muted, fontSize: 13, lineHeight: 20, marginBottom: 14 },
  bodyText: { color: C.muted, fontSize: 14, lineHeight: 21 },
  faintText: { color: C.faint, fontSize: 12 },

  assetRow: { paddingBottom: 12 },
  assetChip: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, paddingHorizontal: 15, minHeight: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  assetChipActive: { borderColor: C.accent, backgroundColor: '#1C1B13' },
  assetChipText: { color: C.muted, fontWeight: '700' },
  assetChipTextActive: { color: C.accent },
  quoteCard: { backgroundColor: C.card, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: C.border },
  quotePrice: { color: C.text, fontSize: 35, fontWeight: '800', marginVertical: 7 },
  tradeSideRow: { flexDirection: 'row', marginTop: 14, marginBottom: 14 },
  sideButton: { flex: 1, minHeight: 50, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginRight: 8, backgroundColor: C.card },
  buyActive: { borderColor: C.success, backgroundColor: '#102017' },
  sellActive: { borderColor: C.danger, backgroundColor: '#211111' },
  sideText: { color: C.muted, fontWeight: '900' },
  sideActive: { color: C.text },
  fieldLabel: { color: C.muted, fontSize: 13, marginBottom: 7, marginTop: 4 },
  tradeSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.card2, borderRadius: 14, padding: 15, marginBottom: 12 },
  summaryLabel: { color: C.muted, fontSize: 13 },
  summaryValue: { color: C.text, fontWeight: '800', fontSize: 15 },

  listRow: { backgroundColor: C.card, borderRadius: 15, padding: 15, borderWidth: 1, borderColor: C.border, marginBottom: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listGrow: { flex: 1, paddingRight: 10 },
  listTitle: { color: C.text, fontWeight: '800', fontSize: 15 },
  listSubtitle: { color: C.muted, fontSize: 12, marginTop: 4, lineHeight: 18 },
  listValue: { color: C.accent, fontSize: 12, fontWeight: '800' },
  emptyState: { borderWidth: 1, borderColor: C.border, borderRadius: 15, padding: 18, backgroundColor: C.card },

  lessonCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 15, padding: 16, marginBottom: 9 },
  lessonActive: { borderColor: C.accent },
  lessonNumber: { color: C.accent, fontSize: 10, fontWeight: '800' },
  lessonTitle: { color: C.text, fontSize: 16, fontWeight: '800', marginTop: 5 },
  lessonDetail: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 19, marginTop: 5 },
  detailTitle: { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 8 },

  infoCallout: { backgroundColor: '#121A25', borderLeftWidth: 3, borderLeftColor: C.accent, borderRadius: 12, padding: 15, marginBottom: 14 },
  infoTitle: { color: C.text, fontWeight: '800', marginBottom: 5 },
  balanceMini: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 17, marginBottom: 12 },
  bigMetric: { color: C.text, fontSize: 30, fontWeight: '800', marginTop: 6 },

  challengeCard: { backgroundColor: C.card, borderRadius: 17, borderWidth: 1, borderColor: C.border, padding: 17, marginBottom: 11 },
  challengeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  challengeTitle: { color: C.text, fontSize: 16, fontWeight: '800' },
  reward: { color: C.accent, fontSize: 12, fontWeight: '900' },
  secondaryButton: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.card2, justifyContent: 'center', alignItems: 'center', marginTop: 12, paddingHorizontal: 14 },
  secondaryText: { color: C.text, fontSize: 14, fontWeight: '800' },

  planCard: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 19, marginBottom: 12 },
  planTitle: { color: C.text, fontSize: 17, fontWeight: '800' },
  planPrice: { color: C.accent, fontSize: 27, fontWeight: '900', marginTop: 7 },
  planYearly: { color: C.muted, fontSize: 14, marginTop: 3, marginBottom: 10 },

  accountCard: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 19 },
  accountValue: { color: C.text, fontSize: 16, fontWeight: '700', marginTop: 5 },
  accountGap: { marginTop: 18 },
  dangerButton: { minHeight: 52, borderRadius: 13, borderWidth: 1, borderColor: '#5A2929', backgroundColor: '#1D1010', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  dangerText: { color: C.danger, fontSize: 15, fontWeight: '900' },
  settingRow: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  settingText: { flex: 1, paddingRight: 12 },
  toggle: { minWidth: 58, minHeight: 38, borderRadius: 19, borderWidth: 1, borderColor: C.border, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' },
  toggleOn: { borderColor: C.success, backgroundColor: '#102017' },
  toggleText: { color: C.muted, fontWeight: '900', fontSize: 11 },
});
