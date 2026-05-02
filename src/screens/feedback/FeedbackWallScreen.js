import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { getAverageRatings, getAllFeedback, deleteFeedback } from '../../api/feedbackApi';
import { AuthContext } from '../../context/AuthContext';

const C = {
  primary: '#006850', primaryContainer: '#148367', onPrimaryContainer: '#effff6',
  primaryFixedDim: '#78d8b8', secondary: '#8e4e14', secondaryContainer: '#ffab69',
  surface: '#faf9f8', surfaceHigh: '#e9e8e7', surfaceLow: '#f4f3f2',
  surfaceLowest: '#ffffff', onSurface: '#1a1c1c', onSurfaceVariant: '#3e4944',
  outline: '#6e7a74', outlineVariant: '#bdc9c3', emeraldDark: '#052E25',
  error: '#ba1a1a',
};

const FILTERS = ['All', 'Vet', 'Grooming', 'Boarding', 'PetShop'];

const SERVICE_CONFIG = {
  All:      { icon: 'apps',             color: C.primary,       bg: C.onPrimaryContainer },
  Vet:      { icon: 'medical-services', color: '#15803d',       bg: '#f0fdf4' },
  Grooming: { icon: 'content-cut',      color: '#7e22ce',       bg: '#fdf4ff' },
  Boarding: { icon: 'home-filled',      color: '#c2410c',       bg: '#fff7ed' },
  PetShop:  { icon: 'store',            color: '#a16207',       bg: '#fefce8' },
};

const StarRow = ({ rating, size = 14 }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={size} color={i <= rating ? '#f59e0b' : C.outlineVariant} />
    ))}
  </View>
);

const FeedbackWallScreen = () => {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('All');
  const [feedbacks, setFeedbacks] = useState([]);
  const [averageRatings, setAverageRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user } = useContext(AuthContext);

  const fetchAverages = async () => {
    try {
      const data = await getAverageRatings();
      setAverageRatings(data);
    } catch {
      // silent — averages are supplementary
    }
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const serviceType = filter === 'All' ? null : filter;
      const data = await getAllFeedback(serviceType);
      setFeedbacks(Array.isArray(data) ? data : data.feedbacks || []);
    } catch {
      Alert.alert('Error', 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isFocused) fetchAverages(); }, [isFocused]);
  useEffect(() => { if (isFocused) fetchFeedbacks(); }, [isFocused, filter]);

  const getOverallAvg = () => {
    if (!Array.isArray(averageRatings) || averageRatings.length === 0) return '0.0';
    if (filter === 'All') {
      let sum = 0, count = 0;
      averageRatings.forEach(item => { sum += item.averageRating * item.totalFeedbacks; count += item.totalFeedbacks; });
      return count === 0 ? '0.0' : (sum / count).toFixed(1);
    }
    const cat = averageRatings.find(item => item._id === filter);
    return cat ? Number(cat.averageRating).toFixed(1) : '0.0';
  };

  const avg = getOverallAvg();
  const sc = SERVICE_CONFIG[filter] || SERVICE_CONFIG.All;

  const handleDelete = (id) => {
    Alert.alert('Delete Review', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteFeedback(id);
            fetchFeedbacks();
            fetchAverages();
          } catch (e) {
            Alert.alert('Error', e?.response?.data?.message || 'Failed to delete review');
          }
        } 
      }
    ]);
  };

  const renderFeedback = ({ item }) => {
    const itemSC = SERVICE_CONFIG[item.serviceType] || SERVICE_CONFIG.All;
    const dateStr = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
      
    const isOwner = item.userId?._id === user?._id || item.userId === user?._id;
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const isWithinWindow = item.createdAt ? (Date.now() - new Date(item.createdAt).getTime()) <= THREE_DAYS_MS : false;
    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.serviceIconBubble, { backgroundColor: itemSC.bg }]}>
            <MaterialIcons name={itemSC.icon} size={16} color={itemSC.color} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.cardServiceType}>{item.serviceType}</Text>
            <Text style={styles.cardUserName}>{item.userId?.name || 'Anonymous'}</Text>
          </View>
          <View style={styles.cardRatingBadge}>
            <Ionicons name="star" size={11} color="#f59e0b" />
            <Text style={styles.cardRatingNum}>{item.rating}</Text>
          </View>
        </View>

        {/* Stars */}
        <View style={styles.cardStarsRow}>
          <StarRow rating={item.rating} size={13} />
          {dateStr ? <Text style={styles.cardDate}>{dateStr}</Text> : null}
        </View>

        {/* Comment */}
        {item.comment ? (
          <View style={styles.commentBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={12} color={C.outline} style={{ marginTop: 1 }} />
            <Text style={styles.commentText}>"{item.comment}"</Text>
          </View>
        ) : null}
        
        {/* Actions */}
        {isOwner && isWithinWindow && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('SubmitFeedback', { editFeedback: item })}>
              <Ionicons name="pencil" size={14} color={C.primary} />
              <Text style={styles.actionBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item._id)}>
              <Ionicons name="trash" size={14} color={C.error} />
              <Text style={styles.actionBtnTextDel}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Community Reviews</Text>
          <Text style={styles.headerTitle}>Feedback Wall</Text>
        </View>
        <TouchableOpacity
          style={styles.writeBtn}
          onPress={() => navigation.navigate('SubmitFeedback')}
        >
          <Ionicons name="create-outline" size={16} color={C.primary} />
          <Text style={styles.writeBtnText}>Write a Review</Text>
        </TouchableOpacity>
      </View>

      {/* Overall Score Hero */}
      <View style={styles.scoreHero}>
        <View style={styles.scoreBigBox}>
          <Text style={styles.scoreNum}>{avg}</Text>
          <Text style={styles.scoreLabel}>/ 5.0</Text>
        </View>
        <View style={styles.scoreRight}>
          <StarRow rating={Math.round(Number(avg))} size={18} />
          <Text style={styles.scoreTag}>
            {filter === 'All' ? 'Overall Rating' : `${filter} Rating`}
          </Text>
          <Text style={styles.scoreMeta}>{feedbacks.length} review{feedbacks.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.chipsRow}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={f => f}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
          renderItem={({ item }) => {
            const fsc = SERVICE_CONFIG[item] || SERVICE_CONFIG.All;
            const active = filter === item;
            return (
              <TouchableOpacity
                style={[styles.chip, active && styles.chipActive, active && { borderColor: fsc.color }]}
                onPress={() => setFilter(item)}
                activeOpacity={0.75}
              >
                <MaterialIcons name={fsc.icon} size={13} color={active ? fsc.color : C.outline} />
                <Text style={[styles.chipText, active && { color: fsc.color, fontWeight: '800' }]}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 60, flex: 1 }} />
      ) : feedbacks.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="rate-review" size={56} color={C.outlineVariant} />
          <Text style={styles.emptyTitle}>No reviews yet</Text>
          <Text style={styles.emptySubtitle}>Be the first to share your experience!</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('SubmitFeedback')}>
            <Text style={styles.emptyBtnText}>Leave a Review</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={feedbacks}
          keyExtractor={(item, index) => item._id?.toString() || index.toString()}
          renderItem={renderFeedback}
          contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom + 28, 40) }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface },

  /* Header */
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  headerSub: { fontSize: 11, fontWeight: '700', color: C.primary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: C.onSurface, letterSpacing: -0.5 },
  writeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.onPrimaryContainer, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  writeBtnText: { color: C.primary, fontWeight: '700', fontSize: 13 },

  /* Score Hero */
  scoreHero: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 16, backgroundColor: C.surfaceLowest, borderRadius: 20, padding: 20, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3, gap: 20 },
  scoreBigBox: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  scoreNum: { fontSize: 52, fontWeight: '800', color: C.onSurface, lineHeight: 56 },
  scoreLabel: { fontSize: 18, fontWeight: '600', color: C.outline, marginBottom: 8 },
  scoreRight: { flex: 1, gap: 6 },
  scoreTag: { fontSize: 14, fontWeight: '700', color: C.onSurface, marginTop: 4 },
  scoreMeta: { fontSize: 12, color: C.outline, fontWeight: '500' },

  /* Filters */
  chipsRow: { marginBottom: 8 },
  chipsContent: { paddingHorizontal: 16, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: C.surfaceHigh, borderWidth: 1.5, borderColor: 'transparent' },
  chipActive: { backgroundColor: C.surfaceLowest },
  chipText: { fontSize: 13, fontWeight: '600', color: C.outline },

  /* List */
  list: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },

  /* Card */
  card: { backgroundColor: C.surfaceLowest, borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  serviceIconBubble: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardServiceType: { fontSize: 14, fontWeight: '800', color: C.onSurface },
  cardUserName: { fontSize: 12, color: C.outline, marginTop: 1 },
  cardRatingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fef9c3', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99 },
  cardRatingNum: { fontSize: 12, fontWeight: '800', color: '#92400e' },
  cardStarsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardDate: { fontSize: 11, color: C.outlineVariant, fontWeight: '500' },
  commentBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: C.surfaceLow, borderRadius: 10, padding: 12 },
  commentText: { flex: 1, fontSize: 13, color: C.onSurfaceVariant, fontStyle: 'italic', lineHeight: 19 },

  /* Empty */
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60, gap: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: C.onSurface, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: C.outline, textAlign: 'center', paddingHorizontal: 40 },
  emptyBtn: { marginTop: 16, backgroundColor: C.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 99, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  /* Actions */
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.surfaceHigh },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: C.surfaceLow },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: C.primary },
  actionBtnTextDel: { fontSize: 12, fontWeight: '700', color: C.error },
});

export default FeedbackWallScreen;
