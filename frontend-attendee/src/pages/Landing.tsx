import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();

  const handleRegister = () => {
    navigate('/events');
  };

  return (
    <Layout>
      <div className="landing-page">
        <div className="distorted-shape-1"></div>
        <div className="distorted-shape-2"></div>
        <div className="distorted-shape-3"></div>
        <div className="landing-content">
          <div className="landing-left">
            <div className="decorative-shapes">
              <div className="shape shape-circle"></div>
              <div className="shape shape-oval"></div>
            </div>
            
            <h1 className="landing-title">
              <span className="title-main">Be Part of Something</span>
              <span className="title-accent">Amazing</span>
            </h1>
            
            <p className="landing-description">
              Explore and register for a wide range of events—from cosplay showcases and creative meetups to gaming tournaments and community hobby events. One platform, many events, endless ways to join the fun.
            </p>
            
            <div className="landing-actions">
              <button className="btn-register-now" onClick={handleRegister}>
                REGISTER NOW
              </button>
            </div>
          </div>

          <div className="landing-right">
            <div className="background-gradient"></div>
            <div className="landing-images">
              <div className="image-container image-1">
                <img 
                  src="/images/landing-1.jpg" 
                  alt="Event 1" 
                  className="landing-image"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="image-container image-2">
                <img 
                  src="/images/landing-2.jpg" 
                  alt="Event 2" 
                  className="landing-image"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="image-container image-3">
                <img 
                  src="/images/landing-3.jpg" 
                  alt="Event 3" 
                  className="landing-image"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Landing;
