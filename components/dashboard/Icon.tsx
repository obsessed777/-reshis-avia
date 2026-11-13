export default function Icon({ name }: { name: 'plane' | 'chart' | 'stack' | 'seat' | 'arrow' }) {
  const paths = {
    plane: <path d='m2 16 8-2 3-9 2-1 1 9 5 1 1 2-7 1-2 3-2 1v-4l-7 1-2-2Z' />,
    chart: <path d='M4 20v-5M9 20V9M14 20V12M19 20V4' />,
    stack: <path d='m3 8 9-5 9 5-9 5-9-5ZM3 12l9 5 9-5M3 16l9 5 9-5' />,
    seat: <path d='M6 4h3l2 10h7a2 2 0 0 1 2 2v1H9L6 4ZM6 20h14' />,
    arrow: <path d='M4 12h16M14 6l6 6-6 6' />,
  };
  return <svg aria-hidden='true' width='23' height='23' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>{paths[name]}</svg>;
}
