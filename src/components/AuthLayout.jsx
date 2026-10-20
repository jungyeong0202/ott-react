import './AuthLayout.css';

export const AuthLayout = ({ title, description, children }) => (
  <section className="auth-page">
    <div className="auth-panel">
      <h2 className="auth-title">{title}</h2>
      <p className="auth-description">{description}</p>
      {children}
    </div>
  </section>
);
