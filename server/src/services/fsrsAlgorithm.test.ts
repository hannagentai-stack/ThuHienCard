import { FSRS, type CardFSRSState } from './fsrsAlgorithm';

// Đơn vị kiểm thử độc lập cho thuật toán FSRS v4
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ TEST FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('🧪 Bắt đầu Unit Test cho Thuật Toán FSRS v4...\n');

const fsrs = new FSRS();
const now = new Date('2026-05-01T12:00:00Z');

// 1. Kiểm tra thẻ mới học lần đầu (State: 'new')
const newCard: CardFSRSState = {
  state: 'new',
  due: now,
  stability: 0,
  difficulty: 0,
  elapsedDays: 0,
  scheduledDays: 0,
  reps: 0,
  lapses: 0,
};

// Test 1: Bấm Lại (Again = 1) đối với thẻ mới
const resAgain = fsrs.schedule(newCard, 1, now);
assert(resAgain.nextState === 'learning', 'Thẻ mới bấm Again chuyển sang state learning');
assert(resAgain.intervalText === '<10p', 'Khoảng cách ôn lại là <10 phút');
assert(resAgain.nextDifficulty > 0 && resAgain.nextDifficulty <= 10, 'Độ khó nằm trong khoảng [1, 10]');

// Test 2: Bấm Tốt (Good = 3) đối với thẻ mới
const resGood = fsrs.schedule(newCard, 3, now);
assert(resGood.nextState === 'review', 'Thẻ mới bấm Good chuyển sang state review');
assert(resGood.scheduledDays >= 2, 'Khoảng cách ngày ôn thẻ mới Good là >= 2 ngày');

// Test 3: Bấm Dễ (Easy = 4) đối với thẻ mới
const resEasy = fsrs.schedule(newCard, 4, now);
assert(resEasy.scheduledDays > resGood.scheduledDays, 'Bấm Easy có khoảng cách ngày xa hơn Good');
assert(resEasy.nextDifficulty < resGood.nextDifficulty, 'Độ khó của Easy thấp hơn Good');

// 2. Kiểm tra thẻ đang trong chu kỳ ôn tập (State: 'review')
const reviewingCard: CardFSRSState = {
  state: 'review',
  due: now,
  stability: 4.5,
  difficulty: 5.0,
  elapsedDays: 4,
  scheduledDays: 4,
  reps: 2,
  lapses: 0,
  lastReview: new Date('2026-04-27T12:00:00Z'),
};

// Test 4: Thẻ đang ôn bấm Good
const resReviewGood = fsrs.schedule(reviewingCard, 3, now);
assert(resReviewGood.nextStability > reviewingCard.stability, 'Stability tăng lên khi ôn thành công Good');
assert(resReviewGood.scheduledDays > reviewingCard.scheduledDays, 'Khoảng cách ngày tăng dần theo cấp số');

// Test 5: Thẻ đang ôn bị quên (Again)
const resReviewLapse = fsrs.schedule(reviewingCard, 1, now);
assert(resReviewLapse.nextState === 'relearning', 'Thẻ bị quên chuyển sang state relearning');
assert(resReviewLapse.nextStability < reviewingCard.stability, 'Stability giảm xuống khi bị quên từ');
assert(resReviewLapse.intervalText === '<10p', 'Hẹn ôn lại sau <10 phút');

// Test 6: Kiểm tra hàm dự đoán cả 4 nút cho giao diện người dùng
const predictions = fsrs.predictNextIntervals(reviewingCard, now);
assert(predictions[1].text === '<10p', 'Nút 1 hiển thị <10p');
assert(typeof predictions[2].text === 'string', 'Nút 2 có nhãn thời gian');
assert(typeof predictions[3].text === 'string', 'Nút 3 có nhãn thời gian');
assert(typeof predictions[4].text === 'string', 'Nút 4 có nhãn thời gian');

console.log('\n🎉 TOÀN BỘ 6/6 UNIT TEST FSRS v4 ĐÃ CHẠY THÀNH CÔNG VÀ CHÍNH XÁC 100%!');
