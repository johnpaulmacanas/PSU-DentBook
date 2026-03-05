import './Page.css'

export function LoginPage() {
  return (
    <div className="page-root">
      <div className="page-card center">
        <h1 className="page-title">DentaStream Login</h1>
        <p className="page-subtitle">Sign in to access PSU DentBook clinic tools.</p>
        <form className="form-grid">
          <label>
            <span>Email</span>
            <input type="email" placeholder="dentist@clinic.com" />
          </label>
          <label>
            <span>Password</span>
            <input type="password" placeholder="••••••••" />
          </label>
          <button type="button" className="primary-button" disabled>
            Demo only – hook up auth later
          </button>
        </form>
      </div>
    </div>
  )
}
