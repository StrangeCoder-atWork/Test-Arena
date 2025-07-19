import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface Question {
  id: string;
  text: string;
  options: string[];
}

interface Props {
  q: Question;
  index: number;
  current: number;
  answers: string[];
  perTime: number;
  perQLimit: number;
  select: (opt: string) => void;
  navigateQ: (delta: number) => void;
  styles: any;
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

const QuestionCard: React.FC<Props> = React.memo(
  ({ q, index, current, answers, perTime, perQLimit, select, navigateQ, styles }) => {
    return (
      <View style={styles.qArea}>
        <Text style={styles.qTitle}>{q.text}</Text>

        {q.options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[
              styles.optionBtn,
              answers[index] === opt && styles.optionSelected,
            ]}
            onPress={() => select(opt)}
          >
            <Text
              style={[
                styles.optionTxt,
                answers[index] === opt && styles.optionSelectedTxt,
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}

        <Text
          style={[
            styles.perTime,
            perTime > perQLimit && styles.perTimeExceeded,
            { fontSize: 18 }, // 🔎 bigger timer
          ]}
        >
          ⏱ {index === current ? formatTime(perTime) : ''}
        </Text>

        {/* 🔽 Navigation buttons just below the timer */}
        {index === current && (
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={() => navigateQ(-1)}
              disabled={current === 0}
              style={styles.navBtn}
            >
              <Text style={styles.navText}>◀ Prev</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigateQ(1)}
              disabled={current === answers.length - 1}
              style={styles.navBtn}
            >
              <Text style={styles.navText}>Next ▶</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
);

export default React.memo(QuestionCard, (prev, next) => {
  return (
    prev.index === next.index &&
    prev.answers[prev.index] === next.answers[next.index] &&
    prev.perTime === next.perTime
  );
});
