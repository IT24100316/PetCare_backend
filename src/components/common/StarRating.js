import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const StarRating = ({ rating, maxStars = 5, onRatingChange }) => {
  const stars = [];

  for (let i = 1; i <= maxStars; i++) {
    const isFilled = i <= rating;
    stars.push(
      <TouchableOpacity 
        key={i} 
        disabled={!onRatingChange}
        onPress={() => onRatingChange && onRatingChange(i)}
      >
        <Text style={[styles.star, isFilled ? styles.starFilled : styles.starEmpty]}>
          {isFilled ? '★' : '☆'}
        </Text>
      </TouchableOpacity>
    );
  }

  return <View style={styles.container}>{stars}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 30,
    marginHorizontal: 2,
  },
  starFilled: {
    color: '#fbbf24', // Yellow for filled stars
  },
  starEmpty: {
    color: '#d1d5db', // Gray for empty stars
  }
});

export default StarRating;
