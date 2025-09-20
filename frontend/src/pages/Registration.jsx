import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Registration() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    // Add registration logic here
    alert(`Registered:\nUsername: ${username}\nEmail: ${email}`);
    navigate("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #c7bb51ff 0%, #2193b0 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ maxWidth: 400, width: "100%", padding: 24, border: "1px solid #000000ff", borderRadius: 8, background: "#fff" }}>
        <h2 style={{ textAlign: "center" }}>Create Account</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label>
              Username:
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 4, marginLeft: -10 }}
                required
              />
            </label>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>
              Email:
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 4, marginLeft: -10 }}
                required
              />
            </label>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>
              Password:
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 4, marginLeft: -10 }}
                required
              />
            </label>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>
              Confirm Password:
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 4, marginLeft: -10 }}
                required
              />
            </label>
          </div>
          <button type="submit" style={{ width: "100%", padding: 10 }}>Register</button>
        </form>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            type="button"
            style={{ background: "none", border: "none", color: "#2193b0", cursor: "pointer", textDecoration: "underline" }}
            onClick={() => navigate("/login")}
          >
            Already have an account? Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Registration;