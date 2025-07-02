import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios"; // Import axios
import Image from "../../../core/img/image";
import { all_routes } from "../../../Router/all_routes";

// --- Import react-toastify ---
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import default CSS


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


const Register = () => {
  const route = all_routes;
  const navigate = useNavigate(); // Hook for navigation

  // --- State for form inputs ---
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- State for loading and password visibility ---
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Note: We'll use toasts for errors instead of a dedicated error state

  // --- Handle form submission ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    // --- Frontend Validation ---
    if (!name || !email || !password || !confirmPassword) {
      toast.warn("Please fill in all fields.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      setLoading(false);
      return;
    }
    // Basic email format check (optional but good practice)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        toast.warn("Please enter a valid email address.");
        setLoading(false);
        return;
    }

    // --- API URL Check ---
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

      // Body includes name, email, password (role/locations default on backend)
      const body = JSON.stringify({ name, email, password });

      // --- Make API call to backend register endpoint ---
      // Ensure your authRoutes file maps POST /register to authController.register
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/register`,
        body,
        config
      );

      // --- Success Case (Check structure from your backend controller) ---
      if (res.data && res.data.success === true && res.data.token) {
        // --- Success Toast ---
        toast.success("Registration successful! Redirecting to login...");

        // Optional: You could log the user in directly by storing the token
        // localStorage.setItem("token", res.data.token);
        // localStorage.setItem('user', JSON.stringify(res.data.user));
        // navigate(route.dashboard); // If logging in directly

        // --- Redirect to Signin page after a short delay ---
        setTimeout(() => {
          navigate(route.signin); // Redirect to login page
        }, 2000); // Adjust delay as needed

      } else {
         // Handle cases where API returns success:false or unexpected structure
         const errorMessage = res.data?.error || "Registration failed: Invalid server response.";
         toast.error(errorMessage);
      }

    } catch (err) {
        // --- Error Handling ---
        console.error("Registration error:", err);

        if (err.response) {
            // Server responded with a non-2xx status code
            console.error("Error data:", err.response.data);
            console.error("Error status:", err.response.status);

            // --- Use specific backend error message if available ('error' property) ---
            if (err.response.data && err.response.data.error) {
                // e.g., "Email address already in use.", "Name, email, and password are required."
                toast.error(err.response.data.error);
            } else if (err.response.status === 400) {
                toast.error("Registration failed. Please check your input."); // Generic 400
            } else {
                // Other server-side errors (500, etc.)
                toast.error("An error occurred on the server. Please try again later.");
            }
        } else if (err.request) {
            // Network error
            console.error("Error request:", err.request);
            toast.error("Network error: Could not connect to the server.");
        } else {
            // Other errors
            console.error('Error', err.message);
            toast.error("An unexpected error occurred. Please try again.");
        }
    } finally {
      setLoading(false);
    }
  };

  // --- Password Visibility Toggles ---
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    // Simple class toggle assuming your HTML/CSS handles fa-eye/fa-eye-slash swap
    const eyeIcon = document.querySelector('.toggle-password');
    if (eyeIcon) {
       eyeIcon.classList.toggle('fa-eye');
       eyeIcon.classList.toggle('fa-eye-slash');
    }
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
    const eyeIcon = document.querySelector('.toggle-passwords'); // Use distinct class if needed
     if (eyeIcon) {
       eyeIcon.classList.toggle('fa-eye');
       eyeIcon.classList.toggle('fa-eye-slash');
    }
  };

  return (
    <div className="main-wrapper">
        {/* --- Add ToastContainer --- */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

      <div className="account-content">
        <div
            className="login-wrapper register-wrap bg-img" // Keep existing classes
            style={backgroundStyle}                      // Apply the inline style object
        >
          <div className="login-content">
            {/* --- Use onSubmit on the form --- */}
            <form onSubmit={handleRegister}>
              <div className="login-userset">
                {/* ... Logo ... */}
                 <div className="login-logo logo-normal">
                  <Image src="assets/img/logo.png" alt="img" />
                </div>
                <Link to={route.dashboard} className="login-logo logo-white">
                  <Image src="assets/img/logo-white.png" alt="" />
                </Link>

                <div className="login-userheading">
                  <h3>Register</h3>
                  <h4>Create New StockFlow Account</h4>
                </div>

                {/* --- Name Input --- */}
                <div className="form-login">
                  <label>Name</label>
                  <div className="form-addons">
                    <input
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <Image
                      src="assets/img/icons/user-icon.svg"
                      alt="img"
                    />
                  </div>
                </div>

                {/* --- Email Input --- */}
                <div className="form-login">
                  <label>Email Address</label>
                  <div className="form-addons">
                    <input
                        type="email" // Use type="email"
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

                {/* --- Password Input --- */}
                <div className="form-login">
                  <label>Password</label>
                  <div className="pass-group">
                    <input
                        type={showPassword ? "text" : "password"}
                        className="pass-input form-control" // Added form-control for consistency
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                     />
                    <span
                        className="fas toggle-password fa-eye-slash" // Ensure this class toggles correctly
                        onClick={togglePasswordVisibility}
                        style={{ cursor: 'pointer' }}
                    />
                  </div>
                </div>

                {/* --- Confirm Password Input --- */}
                <div className="form-login">
                  <label>Confirm Password</label> {/* Corrected typo */}
                  <div className="pass-group">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="pass-inputs form-control" // Added form-control, check if 'pass-inputs' class is intended
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                    {/* Use distinct class if needed for the eye icon selector */}
                    <span
                        className="fas toggle-passwords fa-eye-slash"
                        onClick={toggleConfirmPasswordVisibility}
                        style={{ cursor: 'pointer' }}
                    />
                  </div>
                </div>

                 {/* --- Terms Checkbox (Functionality not implemented here) --- */}
                <div className="form-login authentication-check">
                  <div className="row">
                    <div className="col-sm-12"> {/* Changed to col-sm-12 for better layout? */}
                      <div className="custom-control custom-checkbox justify-content-start">
                        <label className="checkboxs ps-4 mb-0 pb-0 line-height-1">
                          <input type="checkbox" required disabled={loading}/> {/* Added required */}
                          <span className="checkmarks" />I agree to the{" "}
                          <Link to="#" className="hover-a">
                            Terms & Privacy
                          </Link>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- Submit Button --- */}
                <div className="form-login">
                  {/* Changed Link to button type="submit" */}
                  <button
                    type="submit"
                    className="btn btn-login"
                    disabled={loading}
                  >
                    {loading ? "Signing Up..." : "Sign Up"}
                  </button>
                </div>

                {/* --- Link to Sign In --- */}
                <div className="signinform">
                  <h4>
                    Already have an account?{" "}
                    <Link to={route.signin} className="hover-a">
                      Sign In Instead
                    </Link>
                  </h4>
                </div>

                {/* ... Social links / OR text / Copyright ... */}
                <div className="form-setlogin or-text"><h4>OR</h4></div>
                 <div className="form-sociallink">
                   <ul className="d-flex">
                     <li><Link to="#" className="facebook-logo"><Image src="assets/img/icons/facebook-logo.svg" alt="Facebook" /></Link></li>
                     <li><Link to="#"><Image src="assets/img/icons/google.png" alt="Google" /></Link></li>
                     <li><Link to="#" className="apple-logo"><Image src="assets/img/icons/apple-logo.svg" alt="Apple" /></Link></li>
                   </ul>
                 </div>
                 <div className="my-4 d-flex justify-content-center align-items-center copyright-text">
                   <p>Copyright © 2023 StockFlow. All rights reserved</p>
                 </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;