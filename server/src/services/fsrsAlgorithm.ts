/**
 * THUẬT TOÁN FSRS v4 (Free Spaced Repetition Scheduler)
 * Triển khai chuẩn hóa cho WebFlashCard (Tiếng Trung & Tiếng Anh)
 * 
 * Các mức đánh giá:
 * 1 = Again (Lại - Quên từ)
 * 2 = Hard (Khó - Nhớ khó khăn)
 * 3 = Good (Tốt - Nhớ bình thường)
 * 4 = Easy (Dễ - Nhớ rất rõ)
 */

export type Rating = 1 | 2 | 3 | 4;
export type State = 'new' | 'learning' | 'review' | 'relearning';

export interface CardFSRSState {
  state: State;
  due: Date;
  stability: number;   // S: Độ bền trí nhớ (ngày)
  difficulty: number;  // D: Độ khó của thẻ (1.0 - 10.0)
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReview?: Date | null;
}

export interface FSRSReviewResult {
  nextState: State;
  nextDue: Date;
  nextStability: number;
  nextDifficulty: number;
  scheduledDays: number;
  intervalText: string;
}

// 17 Tham số trọng số tối ưu mặc định của FSRS v4
const DEFAULT_WEIGHTS = [
  0.4, 0.6, 2.4, 5.8,   // w0..w3: Initial stabilities for ratings 1, 2, 3, 4
  4.93, 0.94,            // w4..w5: Initial difficulty
  0.86, 0.01,            // w6..w7: Difficulty update & Mean reversion
  1.49, 0.14, 0.94,      // w8..w10: Stability update on recall
  2.18, 0.05, 0.34, 1.26,// w11..w14: Stability update on forget (lapse)
  0.29, 2.61,            // w15..w16: Hard penalty & Easy bonus
];

const DECAY = -0.5;
const FACTOR = 19 / 81; // ~0.23457

export class FSRS {
  private weights: number[];
  private targetRetention: number;

  constructor(weights = DEFAULT_WEIGHTS, targetRetention = 0.90) {
    this.weights = weights;
    this.targetRetention = targetRetention;
  }

  // Tính Retrievability R (xác suất nhớ tại thời điểm t ngày trôi qua)
  public retrievability(elapsedDays: number, stability: number): number {
    if (stability <= 0) return 0;
    return Math.pow(1 + FACTOR * (elapsedDays / stability), DECAY);
  }

  // Khởi tạo Difficulty ban đầu
  private initDifficulty(rating: Rating): number {
    const d = this.weights[4] - (rating - 3) * this.weights[5];
    return Math.min(10, Math.max(1, d));
  }

  // Khởi tạo Stability ban đầu
  private initStability(rating: Rating): number {
    return Math.max(0.1, this.weights[rating - 1]);
  }

  // Cập nhật Difficulty tiếp theo
  private nextDifficulty(currentD: number, rating: Rating): number {
    const deltaD = -this.weights[6] * (rating - 3);
    const nextD = currentD + deltaD * ((10 - currentD) / 9);
    // Mean reversion về độ khó mặc định ban đầu của Good (rating 3)
    const meanReversion = this.weights[7] * this.initDifficulty(3) + (1 - this.weights[7]) * nextD;
    return Math.min(10, Math.max(1, meanReversion));
  }

  // Cập nhật Stability khi nhớ được (rating 2, 3, 4)
  private nextRecallStability(currentD: number, currentS: number, r: number, rating: Rating): number {
    let modifier = 1.0;
    if (rating === 2) modifier = this.weights[15]; // Phạt giảm tốc độ tăng
    if (rating === 4) modifier = this.weights[16]; // Thưởng Easy bonus

    const s =
      currentS *
      (1 +
        Math.exp(this.weights[8]) *
          (11 - currentD) *
          Math.pow(currentS, -this.weights[9]) *
          (Math.exp((1 - r) * this.weights[10]) - 1) *
          modifier);

    return Math.max(0.1, s);
  }

  // Cập nhật Stability khi bị quên (rating 1 - Again)
  private nextForgetStability(currentD: number, currentS: number, r: number): number {
    const s =
      this.weights[11] *
      Math.pow(currentD, -this.weights[12]) *
      (Math.pow(currentS + 1, this.weights[13]) - 1) *
      Math.exp((1 - r) * this.weights[14]);

    return Math.min(Math.max(0.1, s), currentS);
  }

  // Tính khoảng cách ngày tiếp theo theo mục tiêu retention mong muốn
  public nextIntervalDays(stability: number): number {
    const interval = (stability / FACTOR) * (Math.pow(this.targetRetention, 1 / DECAY) - 1);
    return Math.max(1, Math.round(interval));
  }

  // Định dạng chuỗi hiển thị khoảng cách thời gian trên nút bấm
  public formatInterval(days: number, isMinutes = false, minutes = 10): string {
    if (isMinutes) {
      return `<${minutes}p`;
    }
    if (days < 1) return '<1 ngày';
    if (days === 1) return '1 ngày';
    if (days < 30) return `${days} ngày`;
    if (days < 365) return `${Math.round(days / 30)} tháng`;
    return `${Math.round((days / 365) * 10) / 10} năm`;
  }

  // Tính toán trạng thái và lịch hẹn tiếp theo cho 1 mức đánh giá
  public schedule(card: CardFSRSState, rating: Rating, now = new Date()): FSRSReviewResult {
    let nextState: State = card.state;
    let nextStability = card.stability;
    let nextDifficulty = card.difficulty;
    let scheduledDays = 0;
    let intervalText = '';

    const isNew = card.state === 'new' || card.stability === 0;

    if (isNew) {
      // 1. Thẻ mới học lần đầu
      nextDifficulty = this.initDifficulty(rating);
      nextStability = this.initStability(rating);

      if (rating === 1) {
        nextState = 'learning';
        scheduledDays = 0;
        const nextDue = new Date(now.getTime() + 10 * 60 * 1000); // 10 phút sau
        intervalText = '<10p';
        return { nextState, nextDue, nextStability, nextDifficulty, scheduledDays, intervalText };
      } else if (rating === 2) {
        nextState = 'learning';
        scheduledDays = 1;
        const nextDue = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 ngày
        intervalText = '1 ngày';
        return { nextState, nextDue, nextStability, nextDifficulty, scheduledDays, intervalText };
      } else if (rating === 3) {
        nextState = 'review';
        scheduledDays = Math.max(1, Math.round(nextStability));
        const nextDue = new Date(now.getTime() + scheduledDays * 24 * 60 * 60 * 1000);
        intervalText = this.formatInterval(scheduledDays);
        return { nextState, nextDue, nextStability, nextDifficulty, scheduledDays, intervalText };
      } else {
        // Rating 4: Easy
        nextState = 'review';
        scheduledDays = Math.max(3, Math.round(nextStability * 1.5));
        const nextDue = new Date(now.getTime() + scheduledDays * 24 * 60 * 60 * 1000);
        intervalText = this.formatInterval(scheduledDays);
        return { nextState, nextDue, nextStability, nextDifficulty, scheduledDays, intervalText };
      }
    }

    // 2. Thẻ đã trong chu kỳ Review / Learning / Relearning
    const elapsedDays = Math.max(
      0,
      card.lastReview ? Math.floor((now.getTime() - new Date(card.lastReview).getTime()) / (24 * 60 * 60 * 1000)) : 0
    );

    const r = this.retrievability(elapsedDays, card.stability);
    nextDifficulty = this.nextDifficulty(card.difficulty, rating);

    if (rating === 1) {
      // Quên từ vựng (Lapse)
      nextState = 'relearning';
      nextStability = this.nextForgetStability(nextDifficulty, card.stability, r);
      scheduledDays = 0;
      const nextDue = new Date(now.getTime() + 10 * 60 * 1000); // Ôn lại sau 10 phút
      intervalText = '<10p';
      return { nextState, nextDue, nextStability, nextDifficulty, scheduledDays, intervalText };
    } else {
      // Nhớ được từ vựng (Recall)
      nextState = 'review';
      nextStability = this.nextRecallStability(nextDifficulty, card.stability, r, rating);
      scheduledDays = this.nextIntervalDays(nextStability);

      // Nếu bấm Hard (rating 2), không để khoảng cách nhỏ hơn ngày hiện tại
      if (rating === 2) {
        scheduledDays = Math.max(1, Math.min(scheduledDays, Math.round(card.stability * 1.2)));
      }

      const nextDue = new Date(now.getTime() + scheduledDays * 24 * 60 * 60 * 1000);
      intervalText = this.formatInterval(scheduledDays);
      return { nextState, nextDue, nextStability, nextDifficulty, scheduledDays, intervalText };
    }
  }

  // Dự đoán trước khoảng thời gian của cả 4 nút (để hiển thị trên giao diện người dùng)
  public predictNextIntervals(card: CardFSRSState, now = new Date()): Record<Rating, { days: number; text: string }> {
    const ratings: Rating[] = [1, 2, 3, 4];
    const predictions: any = {};

    for (const r of ratings) {
      const res = this.schedule(card, r, now);
      predictions[r] = {
        days: res.scheduledDays,
        text: res.intervalText,
      };
    }

    return predictions;
  }
}

export const defaultFSRS = new FSRS();
