export default function SectionHeading({ title, subtitle, action, as: Tag = 'h2' }) {
  return (
    <div className="section-head">
      <Tag className="section-head__title">{title}</Tag>
      {subtitle && <p className="section-head__sub">{subtitle}</p>}
      {action && <div className="section-head__action">{action}</div>}
    </div>
  );
}
