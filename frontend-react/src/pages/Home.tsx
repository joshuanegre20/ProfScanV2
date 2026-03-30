import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "rgba(255, 255, 255, 0.95)",
        border: hovered ? "1px solid rgba(0, 51, 102, 0.2)" : "1px solid rgba(0, 51, 102, 0.1)",
        borderRadius: "16px",
        padding: "2rem 1.5rem",
        textAlign: "center",
        boxShadow: hovered 
          ? "0 20px 25px -12px rgba(0, 0, 0, 0.15)" 
          : "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.3s ease",
        cursor: "default",
      }}
    >
      {icon && (
        <div
          style={{
            fontSize: "2.5rem",
            marginBottom: "1rem",
            display: "inline-block",
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          marginBottom: "0.75rem",
          color: "#003366",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "0.875rem",
          color: "#4b5563",
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
    </div>
  );
};

const Home: React.FC = () => {
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [dominantColor, setDominantColor] = React.useState<string>("#003366");
  const navigate = useNavigate();

  React.useEffect(() => {
    // Get logo from API
    axios
      .get(`${import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"}/api/logo`, { responseType: "blob" })
      .then((res) => {
        const url = URL.createObjectURL(res.data);
        setLogoUrl(url);
        
        // Extract dominant color from logo
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
          if (imageData) {
            let r = 0, g = 0, b = 0;
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
            }
            const pixelCount = data.length / 4;
            r = Math.floor(r / pixelCount);
            g = Math.floor(g / pixelCount);
            b = Math.floor(b / pixelCount);
            setDominantColor(`rgb(${r}, ${g}, ${b})`);
          }
        };
        img.src = url;
      })
      .catch((err) => {
        console.error("Failed to load logo:", err);
      });
  }, []);

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        margin: 0,
        background: `linear-gradient(135deg, ${dominantColor} 0%, ${dominantColor}CC 50%, ${dominantColor}99 100%)`,
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingLeft: "1.5rem",
        paddingRight: "1.5rem",
        boxSizing: "border-box",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle Pattern Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle at 20% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
                            radial-gradient(circle at 80% 70%, rgba(255, 215, 0, 0.05) 0%, transparent 50%)`,
          pointerEvents: "none",
        }}
      />

      {/* Decorative Academic Icons */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "5%",
          fontSize: "100px",
          opacity: 0.03,
          pointerEvents: "none",
        }}
      >
        📚
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          right: "5%",
          fontSize: "100px",
          opacity: 0.03,
          pointerEvents: "none",
        }}
      >
        🎓
      </div>

      {/* Logo & School Name */}
      <div style={{ marginTop: "3rem", textAlign: "center", position: "relative", zIndex: 1 }}>
        {logoUrl ? (
          <div style={{ position: "relative", display: "inline-block" }}>
            <div
              style={{
                position: "absolute",
                inset: "-10px",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${dominantColor}40 0%, transparent 70%)`,
              }}
            />
            <img
              src={logoUrl}
              alt="Trinidad Municipal College"
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                display: "block",
                margin: "0 auto 1rem auto",
                
                background: "#ffffff",
                padding: "4px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
              }}
            />
          </div>
        ) : (
          <div
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.2)",
              margin: "0 auto 1rem auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
            }}
          >
            📚
          </div>
        )}

        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
            letterSpacing: "-0.02em",
          }}
        >
          Trinidad Municipal College
        </h1>
        
        <p
          style={{
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontStyle: "italic",
            fontSize: "1rem",
            color: "rgba(255, 255, 255, 0.95)",
            marginTop: "0.5rem",
            letterSpacing: "0.5px",
            position: "relative",
            display: "inline-block",
            paddingBottom: "0.5rem",
            borderBottom: "2px solid #ffd700",
          }}
        >
          A Tradition of Excellence
        </p>
      </div>

      {/* Hero Section */}
      <div
        style={{
          maxWidth: "48rem",
          textAlign: "center",
          marginTop: "3rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h1
          style={{
            fontSize: "clamp(2.5rem, 6vw, 3.5rem)",
            fontWeight: 700,
            marginBottom: "1.5rem",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
          }}
        >
          Welcome to{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #ffd700 0%, #fbbf24 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            ProfScan
          </span>
        </h1>

        <p
          style={{
            color: "rgba(255, 255, 255, 0.9)",
            fontSize: "1.125rem",
            lineHeight: 1.75,
            marginBottom: "2rem",
          }}
        >
          An IoT-based instructor attendance monitoring system using QR code
          scanning, ESP32 technology, and a real-time web dashboard.
        </p>

        {/* CTA Button */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem" }}>
          <button
            onClick={handleLogin}
            style={{
              background: "#ffd700",
              color: "#003366",
              border: "none",
              padding: "0.875rem 2.5rem",
              borderRadius: "12px",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 10px 20px -5px rgba(0, 0, 0, 0.2)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 15px 25px -8px rgba(0, 0, 0, 0.3)";
              e.currentTarget.style.background = "#fbbf24";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(0, 0, 0, 0.2)";
              e.currentTarget.style.background = "#ffd700";
            }}
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "2rem",
          marginTop: "5rem",
          maxWidth: "80rem",
          width: "100%",
          position: "relative",
          zIndex: 1,
        }}
      >
        <FeatureCard
          icon="📱"
          title="QR Code Verification"
          description="Each instructor uses a unique QR code for fast and secure attendance checking with real-time validation."
        />
        <FeatureCard
          icon="🔌"
          title="ESP32 IoT Device"
          description="Real-time scanning with LED feedback, buzzer alerts, and OLED display for instant status updates."
        />
        <FeatureCard
          icon="📊"
          title="Web Dashboard"
          description="Monitor attendance records, view timestamps, and generate reports through our Laravel-powered system."
        />
        <FeatureCard
          icon="📈"
          title="Analytics & Reports"
          description="Comprehensive attendance analytics, export capabilities, and detailed performance reports."
        />
      </div>

      {/* Footer */}
      <footer
        style={{
          marginTop: "5rem",
          marginBottom: "2rem",
          paddingTop: "2rem",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          textAlign: "center",
          width: "100%",
          maxWidth: "80rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        <p
          style={{
            fontSize: "0.875rem",
            color: "rgba(255, 255, 255, 0.7)",
          }}
        >
          © {new Date().getFullYear()} Trinidad Municipal College · ProfScan
        </p>
        <p
          style={{
            fontSize: "0.75rem",
            color: "rgba(255, 255, 255, 0.5)",
            marginTop: "0.5rem",
          }}
        >
          Empowering education through innovative technology
        </p>
      </footer>
    </div>
  );
};

export default Home;