/* Work tab strip: number, colour and title of each work (same text as the work pages). */
export type WorkId = 'w01' | 'w02' | 'w03' | 'w04' | 'w05' | 'w06' | 'w07';

export interface Work {
  id: WorkId;
  num: string;
  bg: string;   // CSS colour of the work's block, e.g. var(--c07)
  fg: string;   // text colour on that block
  en: string;
  zh: string;
}

export const WORK_IDS: readonly WorkId[] = ['w01', 'w02', 'w03', 'w04', 'w05', 'w06', 'w07'];
export const isWorkId = (s: string): s is WorkId => (WORK_IDS as readonly string[]).includes(s);

export const WORKS: readonly Work[] = [
  { id: 'w01', num: '01', bg: 'var(--c07)', fg: 'var(--c07-fg)', en: 'Coastal Line Tales – Time Boils Water', zh: '海線物語–時間煮水' },
  { id: 'w02', num: '02', bg: 'var(--c01)', fg: 'var(--c01-fg)', en: 'Blessing, Island and Home', zh: '祝福、島嶼與家' },
  { id: 'w03', num: '03', bg: 'var(--c02)', fg: 'var(--c02-fg)', en: 'Embedment and Disengagement - I', zh: '鑲嵌與脫開 - I' },
  { id: 'w04', num: '04', bg: 'var(--c03)', fg: 'var(--c03-fg)', en: 'Embedment and Disengagement - II', zh: '鑲嵌與脫開 - II' },
  { id: 'w05', num: '05', bg: 'var(--c04)', fg: 'var(--c04-fg)', en: 'Listening to the Body', zh: '聽見身體' },
  { id: 'w06', num: '06', bg: 'var(--c05)', fg: 'var(--c05-fg)', en: 'The Chaos and the Bloom', zh: '渾沌與綻放' },
  { id: 'w07', num: '07', bg: 'var(--c06)', fg: 'var(--c06-fg)', en: 'Other', zh: '其他' },
];
