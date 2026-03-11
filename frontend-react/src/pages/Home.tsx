import React from "react";
import axios from "axios";

interface FeatureCardProps {
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "rgba(255, 255, 255, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: "0.75rem",
        padding: "1.5rem",
        textAlign: "center",
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)",
        transform: hovered ? "scale(1.05)" : "scale(1)",
        transition: "transform 0.2s ease",
      }}
    >
      <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem", color: "#fff" }}>
        {title}
      </h3>
      <p style={{ fontSize: "0.875rem", color: "#bfdbfe" }}>{description}</p>
    </div>
  );
};

const Home: React.FC = () => {
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Use plain axios with full URL — no token needed, public route
    axios
      .get("http://127.0.0.1:8000/api/logo", { responseType: "blob" })
      .then((res) => {
        const url = URL.createObjectURL(res.data);
        setLogoUrl(url);
      })
      .catch((err) => {
        console.error("Failed to load logo:", err);
      });
  }, []);

  const handleLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        margin: 0,
        background: "linear-gradient(to bottom, #1e3a8a, #312e81, #000)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingLeft: "1.5rem",
        paddingRight: "1.5rem",
        boxSizing: "border-box",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >

      {/* LOGO & SCHOOL NAME */}
      <div style={{ marginTop: "3.5rem", textAlign: "center" }}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Trinidad Municipal College"
            style={{
              width: "7rem",
              display: "block",
              margin: "0 auto 1rem auto",
              filter: "drop-shadow(0 10px 8px rgba(0,0,0,0.4))",
            }}
          />
        ) : (
          // placeholder while loading
          <div
            style={{
              width: "7rem",
              height: "7rem",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              margin: "0 auto 1rem auto",
            }}
          />
        )}

        <h2 style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "0.025em" }}>
          Trinidad Municipal College
        </h2>
        <p style={{ fontStyle: "italic", color: "#bfdbfe", marginTop: "0.25rem" }}>
          A Tradition of Excellence
        </p>
      </div>

      {/* HERO SECTION */}
      <div style={{ maxWidth: "48rem", textAlign: "center", marginTop: "3rem" }}>
        <h1
          style={{
            fontSize: "clamp(2.25rem, 5vw, 3rem)",
            fontWeight: 700,
            marginBottom: "1rem",
            lineHeight: 1.2,
          }}
        >
          Welcome to{" "}
          <span style={{ color: "#60a5fa" }}>ProfScan</span>
        </h1>

        <p style={{ color: "#bfdbfe", fontSize: "1rem", lineHeight: 1.75, marginBottom: "2rem" }}>
          An IoT-based instructor attendance monitoring system using QR code
          scanning, ESP32 technology, and a real-time web dashboard.
        </p>

        {/* BUTTON */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem" }}>
          <button
            onClick={handleLogin}
            onMouseEnter={e => (e.currentTarget.style.background = "#1d4ed8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#2563eb")}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              padding: "0.75rem 2rem",
              borderRadius: "0.5rem",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)",
              transition: "background 0.2s ease",
            }}
          >
            Login
          </button>
        </div>
      </div>

      {/* FEATURES */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "2rem",
          marginTop: "5rem",
          maxWidth: "72rem",
          width: "100%",
        }}
      >
        <FeatureCard
          title="QR Code Verification"
          description="Each instructor uses a unique QR code for fast and secure attendance checking."
        />
        <FeatureCard
          title="ESP32 IoT Device"
          description="Real-time scanning with LED, buzzer, and OLED display feedback."
        />
        <FeatureCard
          title="Web Dashboard"
          description="Monitor attendance records and timestamps through a Laravel-powered system."
        />
      </div>

      {/* FOOTER */}
      <footer
        style={{
          marginTop: "5rem",
          marginBottom: "1.5rem",
          fontSize: "0.875rem",
          color: "#93c5fd",
          opacity: 0.8,
        }}
      >
        © {new Date().getFullYear()} Trinidad Municipal College · ProfScan
      </footer>
    </div>
  );
};

export default Home;