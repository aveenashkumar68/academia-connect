import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* ───── Forgot Password Modal State ───── */
  const [fpOpen, setFpOpen] = useState(false);
  const [fpStep, setFpStep] = useState(1); // 1=email, 2=otp, 3=newPwd, 4=success
  const [fpEmail, setFpEmail] = useState("");
  const [fpOtp, setFpOtp] = useState(["", "", "", "", "", ""]);
  const [fpResetToken, setFpResetToken] = useState("");
  const [fpNewPwd, setFpNewPwd] = useState("");
  const [fpConfirmPwd, setFpConfirmPwd] = useState("");
  const [fpShowPwd, setFpShowPwd] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpCountdown, setFpCountdown] = useState(0);
  const otpRefs = useRef([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("reason") === "session_expired") {
      toast.error("Session expired or logged in from another device. Please login again.", {
        id: "session-expired-toast"
      });
      navigate("/login", { replace: true });
    }
  }, [location, navigate]);

  /* ───── Countdown timer for resend OTP ───── */
  useEffect(() => {
    if (fpCountdown <= 0) return;
    const timer = setTimeout(() => setFpCountdown(fpCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [fpCountdown]);

  /* ───── Login handler ───── */
  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data);
      toast.success("Login successful!");
      const role = data.role;
      const roleRoutes = {
        "super-admin": "/dashboard/admin",
        "admin": "/dashboard/faculty",
        "student": "/dashboard/student"
      };
      navigate(roleRoutes[role] || "/dashboard/student");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  /* ═══════════════════════════════════════════
     Forgot Password Handlers
     ═══════════════════════════════════════════ */

  const openForgotPassword = () => {
    setFpOpen(true);
    setFpStep(1);
    setFpEmail("");
    setFpOtp(["", "", "", "", "", ""]);
    setFpResetToken("");
    setFpNewPwd("");
    setFpConfirmPwd("");
    setFpShowPwd(false);
    setFpLoading(false);
    setFpCountdown(0);
  };

  const closeForgotPassword = () => {
    setFpOpen(false);
  };

  /* Step 1: Send OTP */
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!fpEmail.trim()) return toast.error("Please enter your email");
    setFpLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: fpEmail.trim() });
      toast.success("OTP sent to your email");
      setFpStep(2);
      setFpCountdown(60);
      // Auto-focus first OTP input
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setFpLoading(false);
    }
  };

  /* Step 1b: Resend OTP */
  const handleResendOtp = async () => {
    if (fpCountdown > 0) return;
    setFpLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: fpEmail.trim() });
      toast.success("New OTP sent to your email");
      setFpOtp(["", "", "", "", "", ""]);
      setFpCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setFpLoading(false);
    }
  };

  /* OTP input handlers */
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // Only digits
    const newOtp = [...fpOtp];
    newOtp[index] = value;
    setFpOtp(newOtp);
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !fpOtp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...fpOtp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setFpOtp(newOtp);
    // Focus the input after the last pasted digit
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
  };

  /* Step 2: Verify OTP */
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const otpStr = fpOtp.join("");
    if (otpStr.length !== 6) return toast.error("Please enter the complete 6-digit OTP");
    setFpLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", { email: fpEmail.trim(), otp: otpStr });
      setFpResetToken(data.resetToken);
      toast.success("OTP verified!");
      setFpStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed");
    } finally {
      setFpLoading(false);
    }
  };

  /* Step 3: Reset Password */
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    if (fpNewPwd.length < 6) return toast.error("Password must be at least 6 characters");
    if (fpNewPwd !== fpConfirmPwd) return toast.error("Passwords do not match");
    setFpLoading(true);
    try {
      await api.post("/auth/reset-password", { resetToken: fpResetToken, newPassword: fpNewPwd });
      toast.success("Password reset successfully!");
      setFpStep(4);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setFpLoading(false);
    }
  };

  /* Password strength */
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: 1, label: "Weak", color: "#ef4444" };
    if (score <= 2) return { level: 2, label: "Fair", color: "#f59e0b" };
    if (score <= 3) return { level: 3, label: "Good", color: "#10b981" };
    return { level: 4, label: "Strong", color: "#059669" };
  };
  const pwdStrength = getPasswordStrength(fpNewPwd);

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */

  return (
    <div className="login-page-wrapper">
      {/* Navbar */}
      <nav className="login-navbar">
        <div className="login-navbar-inner">
          <a className="login-navbar-logo" href="/">
            <div className="login-navbar-logo-icon">
              <i className="fas fa-map"></i>
            </div>
            <div className="login-navbar-logo-text">
              <span className="login-navbar-logo-main">
                Project<span className="login-navbar-logo-accent">Mayaa</span>
              </span>
              <span className="login-navbar-logo-tagline">
                Engineering • Business • Innovation
              </span>
            </div>
          </a>
        </div>
      </nav>

      {/* Login Card */}
      <div className="login-container">
        <div className="login-card">
          <div className="login-card-header">
            <h1 className="login-card-title">Access Your Dashboard</h1>
            <p className="login-card-subtitle">Project Mayaa · Secure Engineering Portal</p>
          </div>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <label className="login-label" htmlFor="login-email">Email</label>
            <div className="login-input-group">
              <span className="material-symbols-outlined login-input-icon">mail</span>
              <input
                type="email"
                id="login-email"
                className="login-input-field"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <label className="login-label" htmlFor="login-password">Password</label>
            <div className="login-input-group">
              <span className="material-symbols-outlined login-input-icon">lock</span>
              <input
                type={showPassword ? "text" : "password"}
                id="login-password"
                className="login-input-field"
                placeholder="• • • • • • • •"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>

            {/* Forgot password */}
            <div className="login-helper-row">
              <button type="button" className="login-helper-link" onClick={openForgotPassword}>
                Forgot Password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner"></span>
                  Signing in…
                </>
              ) : "Log in"}
            </button>
          </form>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          Forgot Password Modal
          ═══════════════════════════════════════════ */}
      {fpOpen && (
        <div className="fp-overlay" onClick={closeForgotPassword}>
          <div className="fp-modal" onClick={e => e.stopPropagation()}>
            {/* Close button */}
            <button className="fp-close" onClick={closeForgotPassword} aria-label="Close">
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Step indicator */}
            <div className="fp-steps">
              {[1, 2, 3].map(s => (
                <div key={s} className="fp-step-wrapper">
                  <div className={`fp-step-dot ${fpStep >= s ? "fp-step-active" : ""} ${fpStep > s ? "fp-step-done" : ""}`}>
                    {fpStep > s ? (
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                    ) : s}
                  </div>
                  {s < 3 && <div className={`fp-step-line ${fpStep > s ? "fp-step-line-active" : ""}`} />}
                </div>
              ))}
            </div>
            <p className="fp-step-label">
              {fpStep === 1 && "Enter your email"}
              {fpStep === 2 && "Verify OTP"}
              {fpStep === 3 && "Set new password"}
              {fpStep === 4 && "Password reset!"}
            </p>

            {/* ─── Step 1: Email ─── */}
            {fpStep === 1 && (
              <form onSubmit={handleSendOtp} className="fp-form">
                <div className="fp-icon-circle">
                  <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#10B981" }}>mail_lock</span>
                </div>
                <h2 className="fp-title">Forgot Password?</h2>
                <p className="fp-desc">Enter your registered email address and we'll send you a verification code.</p>

                <label className="fp-label" htmlFor="fp-email">Email Address</label>
                <div className="login-input-group">
                  <span className="material-symbols-outlined login-input-icon">mail</span>
                  <input
                    type="email"
                    id="fp-email"
                    className="login-input-field"
                    placeholder="you@example.com"
                    value={fpEmail}
                    onChange={e => setFpEmail(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                <button type="submit" className="fp-btn" disabled={fpLoading}>
                  {fpLoading ? <><span className="login-spinner"></span> Sending…</> : "Send OTP"}
                </button>
              </form>
            )}

            {/* ─── Step 2: OTP ─── */}
            {fpStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="fp-form">
                <div className="fp-icon-circle">
                  <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#10B981" }}>pin</span>
                </div>
                <h2 className="fp-title">Enter Verification Code</h2>
                <p className="fp-desc">
                  A 6-digit code was sent to <strong>{fpEmail}</strong>
                </p>

                <div className="fp-otp-row" onPaste={handleOtpPaste}>
                  {fpOtp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className={`fp-otp-input ${digit ? "fp-otp-filled" : ""}`}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                <div className="fp-resend-row">
                  {fpCountdown > 0 ? (
                    <span className="fp-resend-timer">Resend in {fpCountdown}s</span>
                  ) : (
                    <button type="button" className="fp-resend-btn" onClick={handleResendOtp} disabled={fpLoading}>
                      Resend OTP
                    </button>
                  )}
                </div>

                <button type="submit" className="fp-btn" disabled={fpLoading || fpOtp.join("").length !== 6}>
                  {fpLoading ? <><span className="login-spinner"></span> Verifying…</> : "Verify OTP"}
                </button>
              </form>
            )}

            {/* ─── Step 3: New Password ─── */}
            {fpStep === 3 && (
              <form onSubmit={handleResetPassword} className="fp-form">
                <div className="fp-icon-circle">
                  <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#10B981" }}>lock_reset</span>
                </div>
                <h2 className="fp-title">Create New Password</h2>
                <p className="fp-desc">Your new password must be at least 6 characters long.</p>

                <label className="fp-label" htmlFor="fp-new-pwd">New Password</label>
                <div className="login-input-group">
                  <span className="material-symbols-outlined login-input-icon">lock</span>
                  <input
                    type={fpShowPwd ? "text" : "password"}
                    id="fp-new-pwd"
                    className="login-input-field"
                    placeholder="Enter new password"
                    value={fpNewPwd}
                    onChange={e => setFpNewPwd(e.target.value)}
                    autoFocus
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setFpShowPwd(v => !v)}
                  >
                    <span className="material-symbols-outlined">
                      {fpShowPwd ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>

                {/* Password strength bar */}
                {fpNewPwd && (
                  <div className="fp-strength">
                    <div className="fp-strength-bar">
                      {[1, 2, 3, 4].map(seg => (
                        <div
                          key={seg}
                          className="fp-strength-seg"
                          style={{ background: pwdStrength.level >= seg ? pwdStrength.color : "#e2e8f0" }}
                        />
                      ))}
                    </div>
                    <span className="fp-strength-label" style={{ color: pwdStrength.color }}>
                      {pwdStrength.label}
                    </span>
                  </div>
                )}

                <label className="fp-label" htmlFor="fp-confirm-pwd">Confirm Password</label>
                <div className="login-input-group">
                  <span className="material-symbols-outlined login-input-icon">lock</span>
                  <input
                    type={fpShowPwd ? "text" : "password"}
                    id="fp-confirm-pwd"
                    className="login-input-field"
                    placeholder="Confirm new password"
                    value={fpConfirmPwd}
                    onChange={e => setFpConfirmPwd(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                {fpConfirmPwd && fpNewPwd !== fpConfirmPwd && (
                  <p className="fp-mismatch">Passwords do not match</p>
                )}

                <button type="submit" className="fp-btn" disabled={fpLoading || fpNewPwd.length < 6 || fpNewPwd !== fpConfirmPwd}>
                  {fpLoading ? <><span className="login-spinner"></span> Resetting…</> : "Reset Password"}
                </button>
              </form>
            )}

            {/* ─── Step 4: Success ─── */}
            {fpStep === 4 && (
              <div className="fp-form fp-success">
                <div className="fp-success-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#fff" }}>check_circle</span>
                </div>
                <h2 className="fp-title">Password Reset!</h2>
                <p className="fp-desc">
                  Your password has been changed successfully. A confirmation email has been sent to <strong>{fpEmail}</strong>.
                </p>
                <button type="button" className="fp-btn" onClick={closeForgotPassword}>
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}