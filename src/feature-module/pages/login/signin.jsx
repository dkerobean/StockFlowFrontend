import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Image from "../../../core/img/image";
import { all_routes } from "../../../Router/all_routes";

// --- Import react-toastify ---
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import default CSS

const Signin = () => {
  const route = all_routes;
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // We'll use toasts for errors, so the separate error state is less critical
  // const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

const backgroundStyle = {
    // Set the background image URL
    backgroundImage: "url('assets/img/authentication/verify-img.png')",

    // Add other necessary background properties (often defined in .bg-img)
    // These ensure the image covers the area nicely. Adjust as needed.
    backgroundSize: 'cover',          // Makes the image cover the entire container
    backgroundPosition: 'center center', // Centers the image
    backgroundRepeat: 'no-repeat',    // Prevents the image from tiling
    minHeight: '100vh'                // Optional: Ensures the div takes at least full viewport height
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    // --- Frontend Validation ---
    if (!email || !password) {
      // Use toast for validation feedback
      toast.warn("Please enter both email and password.");
      setLoading(false);
      return;
    }

    // --- Log Environment Variable (Keep for debugging if needed) ---
    console.log("API URL:", process.env.REACT_APP_API_URL);
    if (!process.env.REACT_APP_API_URL) {
        toast.error("API URL is not configured. Please check setup.");
        setLoading(false);
        return; // Stop if URL is missing
    }

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const body = JSON.stringify({ email, password });

      // --- Make API call (Ensure endpoint is correct - /auth/signin) ---
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/login`,
        body,
        config
      );

      // --- Success Case ---
      if (res.data && res.data.token) {
        // Store the token
        localStorage.setItem("token", res.data.token);
        if (res.data.user) {
            localStorage.setItem('user', JSON.stringify(res.data.user));
        }

        // --- Success Toast ---
        toast.success("Sign in successful!");

        // Short delay before redirect to allow toast to be seen (optional)
        setTimeout(() => {
            navigate(route.dashboard);
        }, 1500); // Adjust delay as needed

      } else {
         // Handle unexpected success response without a token
         toast.error("Login failed: Invalid response from server.");
      }

    } catch (err) {
        // --- Error Handling ---
        console.error("Sign-in error:", err);

        if (err.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error("Error data:", err.response.data);
            console.error("Error status:", err.response.status);
            console.error("Error headers:", err.response.headers);

            // --- Use specific backend message if available ---
            if (err.response.data && err.response.data.message) {
                // e.g., "Invalid credentials.", "User not found.", etc.
                toast.error(err.response.data.message);
            } else if (err.response.status === 401) {
                 toast.error("Incorrect email or password."); // Generic 401
            } else if (err.response.status === 404) {
                toast.error("Login endpoint not found on the server.");
            }
             else {
                // Other server-side errors (500, etc.)
                toast.error("An error occurred on the server. Please try again later.");
            }
        } else if (err.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser
            console.error("Error request:", err.request);
            toast.error("Network error: Could not connect to the server.");
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error', err.message);
            toast.error("An unexpected error occurred. Please try again.");
        }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    const eyeIcon = document.querySelector('.toggle-password');
    if (eyeIcon) {
       eyeIcon.classList.toggle('fa-eye');
       eyeIcon.classList.toggle('fa-eye-slash');
    }
  };

  return (
    <div className="main-wrapper">
      {/* --- Add ToastContainer --- */}
      {/* You can configure position, autoClose time, etc. */}
      <ToastContainer
          position="top-right"
          autoClose={3000} // Close after 3 seconds
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light" // Or "dark" or "colored"
        />

      <div className="account-content">
        <div
            className="login-wrapper bg-img" // Keep existing classes
            style={backgroundStyle}                      // Apply the inline style object
        >

          <div className="login-content">
            <form onSubmit={handleSignIn}>
              <div className="login-userset">
                {/* ... Logo, Headings ... */}
                 <div className="login-logo logo-normal">
                  <Image src="/assets/img/logo.png" alt="img" />
                </div>
                <Link to={route.dashboard} className="login-logo logo-white">
                  <Image src="assets/img/logo-white.png" alt="" />
                </Link>
                <div className="login-userheading">
                  <h3>Sign In</h3>
                  <h4>
                    Access the Dreamspos panel using your email and passcode.
                  </h4>
                </div>

                {/* --- Remove the old error display --- */}
                {/* {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )} */}

                {/* ... Email Input ... */}
                 <div className="form-login mb-3">
                  <label className="form-label">Email Address</label>
                  <div className="form-addons">
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <Image
                      src="assets/img/icons/mail.svg"
                      alt="img"
                    />
                  </div>
                </div>
                {/* ... Password Input ... */}
                <div className="form-login mb-3">
                  <label className="form-label">Password</label>
                  <div className="pass-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="pass-input form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <span
                        className={`fas toggle-password ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}
                        onClick={togglePasswordVisibility}
                        style={{ cursor: 'pointer' }}
                    />
                  </div>
                </div>
                {/* ... Remember Me / Forgot Password ... */}
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
                {/* ... Submit Button ... */}
                 <div className="form-login">
                  <button
                    type="submit"
                    className="btn btn-login"
                    disabled={loading}
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </button>
                </div>
                {/* ... Sign up link / Social Links / Copyright ... */}
                <div className="signinform">
                  <h4>
                    New on our platform?
                    <Link to={route.register} className="hover-a">
                      {" "}
                      Create an account
                    </Link>
                  </h4>
                </div>
                <div className="form-setlogin or-text">
                  <h4>OR</h4>
                </div>
                <div className="form-sociallink">
                  <ul className="d-flex">
                    <li><Link to="#" className="facebook-logo"><Image src="assets/img/icons/facebook-logo.svg" alt="Facebook" /></Link></li>
                    <li><Link to="#"><Image src="assets/img/icons/google.png" alt="Google" /></Link></li>
                    <li><Link to="#" className="apple-logo"><Image src="assets/img/icons/apple-logo.svg" alt="Apple" /></Link></li>
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