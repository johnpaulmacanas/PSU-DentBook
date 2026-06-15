import { useNavigate } from 'react-router-dom'
import './WelcomePage.css'

import clinicImg from '../../static/images/clinic.png'
import handTeethImg from '../../static/images/handteeth.png'
import logoImg from '../../static/images/dentastrem.png'
import registerImg from '../../static/images/register.png'
import loginImg from '../../static/images/login.png'
import staffLoginImg from '../../static/images/stafflogin.png'

export function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="welcome-root">
      <div className="welcome-card">
        <header className="welcome-header">
          <h1 className="welcome-title">
            <span className="welcome-title-prefix">Welcome to</span>
            <span className="welcome-title-main">DentaStream</span>
          </h1>
        </header>

        <img src={logoImg} alt="DentaStream" className="welcome-logo" />

        <div className="welcome-staff-wrapper">
          <button
            type="button"
            className="welcome-staff-login"
            onClick={() => navigate('/login')}
          >
            <img src={staffLoginImg} alt="Staff login" className="welcome-staff-icon" />
            <span className="welcome-staff-text">VIEW OFFERED SERVICES</span>
          </button>
        </div>

        <div className="welcome-options">
          <button
            type="button"
            className="welcome-option-card left"
            onClick={() => navigate('/patient')}
          >
            <div className="welcome-option-body">
              <div className="welcome-option-text">
                <span className="welcome-option-line">I am a NEW</span>
                <span className="welcome-option-line">Patient</span>
              </div>
              <img src={registerImg} alt="New patient" className="welcome-option-icon" />
            </div>
          </button>

          <button
            type="button"
            className="welcome-option-card right"
            onClick={() => navigate('/login')}
          >
            <div className="welcome-option-body">
              <div className="welcome-option-text">
                <span className="welcome-option-line">Already a</span>
                <span className="welcome-option-line">Patient</span>
              </div>
              <img src={loginImg} alt="Existing patient" className="welcome-option-icon" />
            </div>
          </button>
        </div>

        <p className="welcome-subtitle">PLEASE SELECT TO CONTINUE</p>

        <img src={clinicImg} alt="Dental clinic" className="welcome-illustration clinic" />
        <img src={handTeethImg} alt="Tooth in hand" className="welcome-illustration hand" />
      </div>
    </div>
  )
}
