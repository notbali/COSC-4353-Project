import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add authentication logic here
    //alert(`Username: ${username}\nPassword: ${password}`);
  };

  const handleSignup = () => {
    navigate("/registration");
  };

  const handleGoogleSignIn = () => {
    // Temporary placeholder for Google Sign-In
    alert("Google Sign-In coming soon!");
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
        <h2 style={{ textAlign: "center" }}>Welcome Back!</h2>
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
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button type="submit" style={{ flex: 1, padding: 10, marginLeft: 10 }}>Login</button>
            <button type="button" style={{ flex: 1, padding: 10, marginLeft: 10 }} onClick={handleSignup}>Sign Up</button>
          </div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            style={{
              width: "100%",
              padding: 10,
              background: "#4285F4",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" style={{ marginRight: 8 }}>
              <g>
                <path fill="#4285F4" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.3-5.7 7-11.3 7-6.6 0-12-5.4-12-12s5.4-12 12-12c2.6 0 5 .8 7 2.3l5.7-5.7C33.5 5.1 28.9 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 20-8.9 20-20 0-1.3-.1-2.7-.4-4z"/>
                <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 13 24 13c2.6 0 5 .8 7 2.3l5.7-5.7C33.5 5.1 28.9 3 24 3c-7.2 0-13.4 4.1-16.7 10.1z"/>
                <path fill="#FBBC05" d="M24 43c5.4 0 10-1.8 13.7-4.9l-6.3-5.2c-2 1.4-4.5 2.1-7.4 2.1-5.5 0-10.2-3.7-11.8-8.7l-6.6 5.1C7.9 39.1 15.4 43 24 43z"/>
                <path fill="#EA4335" d="M43.6 20.5h-1.9V20H24v8h11.3c-0.7 2-2.1 3.7-3.9 4.9l6.3 5.2C41.8 38.2 44 31.2 44 24c0-1.3-.1-2.7-.4-4z"/>
              </g>
            </svg>
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;