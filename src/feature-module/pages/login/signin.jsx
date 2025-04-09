import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios"; // Import axios
import ImageWithBasePath from "../../../core/img/imagewithbasebath";
import { all_routes } from "../../../Router/all_routes";

const Signin = () => {
  const route = all_routes;
  const navigate = useNavigate(); // Hook for navigation

  // State for form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // State for loading and errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // State for password visibility (optional, needs JS logic)
  const [showPassword, setShowPassword] = useState(false);

  // Handle form submission
  const handleSignIn = async (e) => {
    e.preventDefault(); // Prevent default form submission (page reload)
    setError(""); // Clear previous errors
    setLoading(true); // Set loading state

    if (!email || !password) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    console.log({
      env: process.env,
      apiUrl: process.env.REACT_APP_API_URL
    });

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const body = JSON.stringify({ email, password });

      // Make API call to backend signin endpoint
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/login`,
        body,
        config
      );

      // Assuming backend sends back { token: '...', user: {...} } on success
      if (res.data.token) {
        // --- Authentication Successful ---

        // Store the token (localStorage persists after browser close)
        localStorage.setItem("token", res.data.token);

        // You might want to store user info as well (be mindful of sensitive data)
        // localStorage.setItem('user', JSON.stringify(res.data.user));

        // Optional: Set token in axios default headers for subsequent requests
        // axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;

        // Redirect to the dashboard
        navigate(route.dashboard);

      } else {
         // Should not happen if backend is well-designed, but handle just in case
         setError("Login failed. Please try again.");
      }

    } catch (err) {
        // --- Authentication Failed or Server Error ---
        console.error("Sign-in error:", err);
        if (err.response && err.response.data && err.response.data.message) {
            // Use error message from backend if available
            setError(err.response.data.message);
        } else if (err.request) {
            // Network error (couldn't reach server)
            setError("Network error. Please check your connection or the server.");
        } else {
            // Other errors
            setError("An unexpected error occurred. Please try again.");
        }
    } finally {
      setLoading(false); // Reset loading state regardless of outcome
    }
  };

  // Simple password toggle logic (add to the eye icon)
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    // Add logic here to change the icon class (e.g., fa-eye / fa-eye-slash)
    // This depends on how your template handles the icon switching.
    // Example:
    const eyeIcon = document.querySelector('.toggle-password');
    if (eyeIcon) {
       eyeIcon.classList.toggle('fa-eye');
       eyeIcon.classList.toggle('fa-eye-slash');
    }
  };


  return (
    <div className="main-wrapper">
      <div className="account-content">
        <div className="login-wrapper bg-img">
          <div className="login-content">
            {/* Use onSubmit on the form */}
            <form onSubmit={handleSignIn}>
              <div className="login-userset">
                <div className="login-logo logo-normal">
                  <ImageWithBasePath src="assets/img/logo.png" alt="img" />
                </div>
                <Link to={route.dashboard} className="login-logo logo-white">
                  <ImageWithBasePath src="assets/img/logo-white.png" alt="" />
                </Link>
                <div className="login-userheading">
                  <h3>Sign In</h3>
                  <h4>
                    Access the Dreamspos panel using your email and passcode.
                  </h4>
                </div>

                {/* Display Error Messages */}
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                <div className="form-login mb-3">
                  <label className="form-label">Email Address</label>
                  <div className="form-addons">
                    <input
                      type="email" // Use type="email" for better semantics/validation
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)} // Update state on change
                      required // Add basic HTML validation
                      disabled={loading} // Disable when loading
                    />
                    <ImageWithBasePath
                      src="assets/img/icons/mail.svg"
                      alt="img"
                    />
                  </div>
                </div>
                <div className="form-login mb-3">
                  <label className="form-label">Password</label>
                  <div className="pass-group">
                    <input
                      type={showPassword ? "text" : "password"} // Toggle type based on state
                      className="pass-input form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)} // Update state on change
                      required // Add basic HTML validation
                      disabled={loading} // Disable when loading
                    />
                    {/* Add onClick to the toggle icon */}
                    <span
                        className={`fas toggle-password ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}
                        onClick={togglePasswordVisibility}
                        style={{ cursor: 'pointer' }} // Make it clear it's clickable
                    />
                  </div>
                </div>
                <div className="form-login authentication-check">
                  <div className="row">
                    <div className="col-12 d-flex align-items-center justify-content-between">
                      <div className="custom-control custom-checkbox">
                        <label className="checkboxs ps-4 mb-0 pb-0 line-height-1">
                          <input type="checkbox" className="form-control" />
                          <span className="checkmarks" />
                          Remember me
                        </label>
                      </div>
                      <div className="text-end">
                        <Link className="forgot-link" to={route.forgotPassword}>
                          Forgot Password?
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-login">
                  {/* Change Link to button type="submit" */}
                  <button
                    type="submit"
                    className="btn btn-login"
                    disabled={loading} // Disable button when loading
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </button>
                </div>
                <div className="signinform">
                  <h4>
                    New on our platform?
                    <Link to={route.register} className="hover-a">
                      {" "}
                      Create an account
                    </Link>
                  </h4>
                </div>
                {/* Social links and copyright remain the same */}
                <div className="form-setlogin or-text">
                  <h4>OR</h4>
                </div>
                <div className="form-sociallink">
                   {/* ... social links ... */}
                   <ul className="d-flex">
                    <li>
                      <Link to="#" className="facebook-logo">
                        <ImageWithBasePath
                          src="assets/img/icons/facebook-logo.svg"
                          alt="Facebook"
                        />
                      </Link>
                    </li>
                    <li>
                      <Link to="#">
                        <ImageWithBasePath
                          src="assets/img/icons/google.png"
                          alt="Google"
                        />
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="apple-logo">
                        <ImageWithBasePath
                          src="assets/img/icons/apple-logo.svg"
                          alt="Apple"
                        />
                      </Link>
                    </li>
                  </ul>
                  <div className="my-4 d-flex justify-content-center align-items-center copyright-text">
                    <p>Copyright © 2023 DreamsPOS. All rights reserved</p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signin;