export type Gender = 'male' | 'female' | 'none';

export interface Student {
  id: string;
  name: string;
  gender: Gender;
  isFixedFront: boolean; // 시력이 안 좋거나 특별한 이유로 앞자리 고정
  isFixedBack: boolean;  // 특별한 이유로 뒷자리 고정
  separationGroup?: string; // 분리 배치해야 하는 학생들끼리 같은 그룹 이름/단어 부여
}

export type SeatStatus = 'available' | 'disabled' | 'occupied';

export interface Seat {
  id: string;
  row: number;
  col: number;
  status: SeatStatus;
  studentId?: string; // occupied 일 경우 학생 ID
}

export interface GridConfig {
  rows: number;
  cols: number;
}
