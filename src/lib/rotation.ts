/** 출연진 순서대로 발표 날짜를 배정합니다. skip 날짜는 휴방으로 건너뛰어요. */
export function planRotation(opts: {
  cast: string[];
  start: string; // YYYY-MM-DD
  every: number;
  rounds: number;
  skip: string[];
  shuffle?: boolean;
  firstNumber: number;
}) {
  const cast = [...opts.cast];
  if (opts.shuffle)
    for (let i = cast.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cast[i], cast[j]] = [cast[j], cast[i]];
    }
  const skip = new Set(opts.skip);
  const day = new Date(`${opts.start}T00:00:00Z`);
  const iso = () => day.toISOString().slice(0, 10);
  const step = () => day.setUTCDate(day.getUTCDate() + Math.max(1, opts.every));
  const out: { number: number; date: string; presenter: string }[] = [];
  let n = opts.firstNumber;
  for (let r = 0; r < opts.rounds; r++)
    for (const presenter of cast) {
      while (skip.has(iso())) step();
      out.push({ number: n++, date: iso(), presenter });
      step();
    }
  return out;
}
