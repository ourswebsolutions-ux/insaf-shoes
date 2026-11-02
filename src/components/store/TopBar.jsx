import Icon from '@/components/Icon';

export default function TopBar({ topbar }) {
  return (
    <div className="topbar">
      <div className="container topbar__inner">
        <span className="topbar__item topbar__item--left">
          <Icon name="truck" size={18} /> {topbar.left}
        </span>
        <span className="topbar__item topbar__item--center">
          <Icon name="shield" size={17} /> {topbar.center}
        </span>
        <span className="topbar__item topbar__item--right">
          <Icon name="headset" size={17} /> {topbar.right}
        </span>
      </div>
    </div>
  );
}
