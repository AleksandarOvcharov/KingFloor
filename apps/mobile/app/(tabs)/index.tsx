import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Building2, CheckCircle2, Megaphone, Vote } from 'lucide-react-native';
import { useSession } from '../../hooks/useSession';
import { useBuilding } from '../../hooks/useBuilding';
import { useJoinBuilding } from '../../hooks/useJoinBuilding';
import { useFees } from '../../hooks/useFees';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { usePolls } from '../../hooks/usePolls';
import { useTheme } from '../../hooks/useTheme';
import { useI18n, tFormat } from '../../hooks/useI18n';
import type { ColorTokens } from '../../lib/theme';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Badge } from '../../components/ui';

export default function HomeScreen() {
  const { session, loading: sessionLoading } = useSession();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { membership, loading: membershipLoading, error: membershipError, refetch: refetchMembership } = useBuilding();

  const hasBuilding = !!membership;
  const { fees, totals, loading: feesLoading, refetch: refetchFees } = useFees(hasBuilding);
  const { announcements, loading: announcementsLoading, refetch: refetchAnnouncements } = useAnnouncements(hasBuilding);
  const { polls, loading: pollsLoading, refetch: refetchPolls, castVote } = usePolls(hasBuilding);

  const refreshing = membershipLoading || feesLoading || announcementsLoading || pollsLoading;
  const refreshAll = () => {
    refetchMembership();
    refetchFees();
    refetchAnnouncements();
    refetchPolls();
  };

  if (sessionLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.centered}>
        <Building2 color={colors.primary} size={40} style={styles.heroIcon} />
        <Text style={styles.title}>{t.dashboard.signInRequired}</Text>
        <Text style={styles.subtitle}>{t.dashboard.signInRequiredDescription}</Text>
        <Pressable style={styles.button} onPress={() => router.push('/sign-in')}>
          <Text style={styles.buttonText}>{t.common.signIn}</Text>
        </Pressable>
      </View>
    );
  }

  if (membershipLoading && !membership) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!membership) {
    return <JoinBuildingView colors={colors} styles={styles} onJoined={refetchMembership} />;
  }

  const outstandingFees = fees.filter((f) => f.status !== 'paid');

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={colors.primary} />}
    >
      {membershipError ? <Text style={styles.errorText}>{membershipError}</Text> : null}

      <Card>
        <CardHeader>
          <View style={styles.rowBetween}>
            <View style={styles.rowGap}>
              <Building2 color={colors.primary} size={20} />
              <CardTitle>{membership.building.name}</CardTitle>
            </View>
            <Badge variant="secondary">
              {membership.role === 'admin' ? t.building.roleAdmin : t.building.roleResident}
            </Badge>
          </View>
          {membership.building.address ? <CardDescription>{membership.building.address}</CardDescription> : null}
        </CardHeader>
        {membership.unit ? (
          <CardContent>
            <Text style={styles.label}>{t.building.myUnit}</Text>
            <Text style={styles.value}>{membership.unit.number}</Text>
          </CardContent>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.building.feesTitle}</CardTitle>
        </CardHeader>
        <CardContent style={styles.gapContent}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.label}>{t.building.totalCollected}</Text>
              <Text style={styles.valueGood}>{totals.collected.toFixed(2)} €</Text>
            </View>
            <View>
              <Text style={styles.label}>{t.building.totalOutstanding}</Text>
              <Text style={styles.valueBad}>{totals.outstanding.toFixed(2)} €</Text>
            </View>
          </View>
          {outstandingFees.length === 0 ? (
            <Text style={styles.subtitleLeft}>{t.building.noFeesYet}</Text>
          ) : (
            outstandingFees.slice(0, 6).map((fee) => (
              <View key={fee.id} style={styles.feeRow}>
                <Text style={styles.feeRowPeriod}>{fee.period}</Text>
                <Text style={styles.feeRowAmount}>{fee.amount.toFixed(2)} €</Text>
                <Badge variant={fee.status === 'overdue' ? 'destructive' : 'outline'}>
                  {fee.status === 'overdue' ? t.building.feeStatusOverdue : t.building.feeStatusUnpaid}
                </Badge>
              </View>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <View style={styles.rowGap}>
            <Megaphone color={colors.primary} size={18} />
            <CardTitle>{t.building.announcementsTitle}</CardTitle>
          </View>
        </CardHeader>
        <CardContent style={styles.gapContent}>
          {announcements.length === 0 ? (
            <Text style={styles.subtitleLeft}>{t.building.noAnnouncementsYet}</Text>
          ) : (
            announcements.slice(0, 5).map((a) => (
              <View key={a.id} style={styles.announcementItem}>
                <View style={styles.rowBetween}>
                  <Text style={styles.announcementTitle}>{a.title}</Text>
                  {a.pinned ? <Badge variant="secondary">{t.building.pinnedBadge}</Badge> : null}
                </View>
                <Text style={styles.subtitleLeft}>{a.body}</Text>
              </View>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <View style={styles.rowGap}>
            <Vote color={colors.primary} size={18} />
            <CardTitle>{t.building.pollsTitle}</CardTitle>
          </View>
        </CardHeader>
        <CardContent style={styles.gapContent}>
          {polls.length === 0 ? (
            <Text style={styles.subtitleLeft}>{t.building.noPollsYet}</Text>
          ) : !membership.unit ? (
            <Text style={styles.subtitleLeft}>{t.building.needUnitToVote}</Text>
          ) : (
            polls.map((poll) => (
              <PollCard key={poll.id} poll={poll} styles={styles} t={t} onVote={castVote} />
            ))
          )}
        </CardContent>
      </Card>
    </ScrollView>
  );
}

function PollCard({
  poll,
  styles,
  t,
  onVote,
}: {
  poll: import('@workspace/shared').Poll;
  styles: ReturnType<typeof createStyles>;
  t: ReturnType<typeof useI18n>['t'];
  onVote: (pollId: string, optionId: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [voting, setVoting] = useState<string | null>(null);

  const handleVote = async (optionId: string) => {
    setVoting(optionId);
    await onVote(poll.id, optionId);
    setVoting(null);
  };

  return (
    <View style={styles.pollItem}>
      <View style={styles.rowBetween}>
        <Text style={styles.announcementTitle}>{poll.title}</Text>
        <Badge variant={poll.status === 'open' ? 'outline' : 'secondary'}>
          {poll.status === 'open' ? t.building.pollStatusOpen : t.building.pollClosed}
        </Badge>
      </View>
      {poll.description ? <Text style={styles.subtitleLeft}>{poll.description}</Text> : null}
      <Text style={styles.subtitleLeft}>{tFormat(t.building.votesCount, { count: String(poll.total_votes ?? 0) })}</Text>
      <View style={styles.gapContent}>
        {poll.options.map((option) => {
          const isMine = poll.my_vote_option_id === option.id;
          return (
            <Button
              key={option.id}
              variant={isMine ? 'default' : 'outline'}
              size="sm"
              disabled={poll.status !== 'open' || voting !== null}
              loading={voting === option.id}
              onPress={() => handleVote(option.id)}
              style={styles.pollOptionButton}
            >
              {isMine ? `✓ ${option.label}` : option.label}
            </Button>
          );
        })}
      </View>
    </View>
  );
}

function JoinBuildingView({
  colors,
  styles,
  onJoined,
}: {
  colors: ColorTokens;
  styles: ReturnType<typeof createStyles>;
  onJoined: () => void;
}) {
  const { t } = useI18n();
  const { result, loading, lookup, join, reset } = useJoinBuilding();
  const [code, setCode] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const handleLookup = async () => {
    setError(null);
    const res = await lookup(code.trim());
    if (!res.success) setError(res.error ?? 'Error');
  };

  const handleJoin = async () => {
    if (!selectedUnitId) return;
    setJoining(true);
    setError(null);
    const res = await join(code.trim(), selectedUnitId);
    setJoining(false);
    if (!res.success) {
      setError(res.error ?? 'Error');
      return;
    }
    onJoined();
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Card>
        <CardHeader>
          <CardTitle>{t.building.joinTitle}</CardTitle>
          <CardDescription>{t.building.joinDescription}</CardDescription>
        </CardHeader>
        <CardContent style={styles.gapContent}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {!result ? (
            <>
              <Text style={styles.label}>{t.building.joinCodeLabel}</Text>
              <Input
                value={code}
                onChangeText={setCode}
                placeholder={t.building.joinCodePlaceholder}
                autoCapitalize="characters"
              />
              <Button onPress={handleLookup} loading={loading} disabled={!code.trim()}>
                {t.building.findBuilding}
              </Button>
            </>
          ) : (
            <>
              <Text style={styles.announcementTitle}>{result.building.name}</Text>
              {result.building.address ? <Text style={styles.subtitleLeft}>{result.building.address}</Text> : null}

              <Text style={styles.label}>{t.building.selectUnitLabel}</Text>
              {result.units.length === 0 ? (
                <Text style={styles.subtitleLeft}>{t.building.noUnitsAvailable}</Text>
              ) : (
                <View style={styles.gapContent}>
                  {result.units.map((unit) => (
                    <Pressable
                      key={unit.id}
                      onPress={() => setSelectedUnitId(unit.id)}
                      style={[styles.unitOption, selectedUnitId === unit.id && styles.unitOptionSelected]}
                    >
                      <Text style={styles.value}>{unit.number}</Text>
                      {selectedUnitId === unit.id ? <CheckCircle2 color={colors.primary} size={18} /> : null}
                    </Pressable>
                  ))}
                </View>
              )}

              <Button onPress={handleJoin} loading={joining} disabled={!selectedUnitId}>
                {t.building.joinSubmit}
              </Button>
              <Button
                variant="ghost"
                onPress={() => {
                  reset();
                  setSelectedUnitId(null);
                  setError(null);
                }}
              >
                {t.building.changeCode}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </ScrollView>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      gap: 16,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    heroIcon: {
      marginBottom: 4,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.foreground,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginTop: 4,
      textAlign: 'center',
    },
    subtitleLeft: {
      fontSize: 13,
      color: colors.mutedForeground,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 32,
      marginTop: 20,
    },
    buttonText: {
      color: colors.primaryForeground,
      fontSize: 15,
      fontWeight: '600',
    },
    errorText: {
      color: colors.destructive,
      fontSize: 13,
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowGap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    gapContent: {
      gap: 10,
    },
    label: {
      fontSize: 12,
      color: colors.mutedForeground,
    },
    value: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
    },
    valueGood: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.success,
    },
    valueBad: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.destructive,
    },
    feeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    feeRowPeriod: {
      fontSize: 13,
      color: colors.foreground,
      flex: 1,
    },
    feeRowAmount: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.foreground,
      marginRight: 10,
    },
    announcementItem: {
      gap: 4,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    announcementTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.foreground,
    },
    pollItem: {
      gap: 8,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    pollOptionButton: {
      justifyContent: 'flex-start',
    },
    unitOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    unitOptionSelected: {
      borderColor: colors.primary,
    },
  });
}
