import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { FiMap, FiLogIn } from 'react-icons/fi';
import { MdMail, MdLock } from "react-icons/md";
import { useToast } from "@/components/ui/use-toast";
import '../../styles/Login.css'

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    console.log('Login attempt with:', formData)
    
    let role = null;
    let path = null;

    if (formData.email.includes('admin')) {
      role = 'super-admin';
      path = '/dashboard/admin';
    } else if (formData.email.includes('faculty')) {
      role = 'admin';
      path = '/dashboard/faculty';
    } else if (formData.email.includes('student')) {
      role = 'student';
      path = '/dashboard/student';
    } else if (formData.email.includes('industry')) {
      role = 'industry_partner';
      path = '/dashboard/industry';
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Use an email with admin, faculty, student, or industry to test.",
        variant: "destructive"
      });
      return;
    }

    const userData = { email: formData.email, role, token: 'mock-jwt-token' };
    localStorage.setItem('user', JSON.stringify(userData));
    
    toast({
      title: "Login Successful",
      description: `Welcome back! Redirecting to ${role} dashboard...`,
    });

    window.location.href = path;
  }

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="container-fluid px-3 px-lg-4">
          <a className="navbar-logo" href="#">
            <div className="navbar-logo-icon">
              <span className="navbar-logo-icon">
                          <FiMap />
                        </span>
            </div>
            <div className="navbar-logo-text">
              <span className="navbar-logo-main">
                Project<span className="navbar-logo-accent">Mayaa</span>
              </span>
              <span className="navbar-logo-tagline">
                Engineering • Business • Innovation
              </span>
            </div>
          </a>
        </div>
      </nav>

      {/* Login Section */}
      <div className="login-container">
        <div className="login-card">
          <div className="project-heading">
            <h1 className="project-title">Access Your Dashboard</h1>
            <p className="project-subtitle">Project Mayaa · Secure Engineering Portal</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <label className="form-label" htmlFor="email">Email</label>
            <div className="input-group-custom">
           <MdMail className="input-icon" />
              <input 
                type="email" 
                className="input-field" 
                id="email" 
                placeholder="Enter your email" 
                value={formData.email}
                onChange={handleChange}
                required 
              />
            </div>

            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-group-custom">
              <MdLock className="input-icon" />
              <input 
                type="password" 
                className="input-field" 
                id="password" 
                placeholder="• • • • • • • •" 
                value={formData.password}
                onChange={handleChange}
                required 
              />
            </div>

            <button type="submit" className="btn-login">Log in</button>

            <div className="helper-row">
              <a href="#" className="helper-link">Forgot password?</a>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default Login