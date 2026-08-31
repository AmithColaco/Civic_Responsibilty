import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast'; // Floating side alert handler
import { API_BASE_URL } from '../config';
import './login.css';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [loading, setLoading] = useState(false);

    // Manage dynamic side popup messages
    const [toast, setToast] = useState({ message: '', type: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                // Skips redirection if credentials or validation steps fail
                throw new Error(data.message || 'Invalid email or password.');
            }

            // ==========================================
            // SUCCESSFUL VALIDATION & ROUTING PROTOCOL
            // ==========================================

            // 1. Store the valid session signature in browser app storage
            localStorage.setItem('token', data.token);

            // 2. Trigger side-mounted confirmation toast alert
            setToast({ message: 'Authentication successful! Loading dashboard...', type: 'success' });

            // 3. Gracefully slide into the dashboard control viewport
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);

        } catch (err) {
            // Drop errors safely onto the side toast overlay layer
            setToast({ message: err.message || 'Unable to reach the authentication server.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            {/* Pop-up container layer mounted dynamically inside the screen bounds */}
            <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ message: '', type: '' })}
            />

            <div className="auth-card">
                <div className="auth-header">
                    <Link to="/" className="auth-logo-link">
                        <h1 className="auth-logo">CivicSense</h1>
                    </Link>
                    <p className="auth-subtitle">Sign in to report new issues or manage your tracking dashboard</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group-item">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="name@example.com"
                            required
                        />
                    </div>

                    <div className="form-group-item">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? 'Authenticating...' : 'Login'}
                    </button>
                </form>

                <div className="auth-footer-redirect">
                    <span>Don't have an account yet? </span>
                    <Link to="/register" className="auth-redirect-link">Register here</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;