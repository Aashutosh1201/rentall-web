import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import CreateProduct from "./pages/CreateProduct";
import ProductList from "./pages/ProductList";
import KYCInfo from "./pages/KYCInfo";
import KYCForm from "./pages/KYCForm";
import ProductDetails from "./pages/ProductDetails";
import Rent from "./pages/Rent";
import Cart from "./pages/Cart";
import PaymentCallback from "./components/PaymentCallback";
import RentalHistory from "./pages/RentalHistory";

// Lazy load components
const Hero = lazy(() => import("./components/Hero"));
const HowItWorks = lazy(() => import("./components/HowItWorks"));
const Categories = lazy(() => import("./pages/Categories"));
const FeaturedProducts = lazy(() => import("./components/FeaturedProducts"));
const WhyRentAll = lazy(() => import("./components/WhyRentAll"));
const CustomerReviews = lazy(() => import("./components/CustomerReviews"));
const CTASection = lazy(() => import("./components/CTASection"));
const FaqSection = lazy(() => import("./components/FaqSection"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CategoryProducts = lazy(() => import("./pages/CategoryProducts"));

// Dashboard component (your new combined dashboard)
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));

// Layout Components
const PublicLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-grow pt-20">
      <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
    </main>
    <Footer />
  </div>
);

const DashboardLayout = ({ children }) => (
  <PrivateRoute>
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
    </div>
  </PrivateRoute>
);

// Home page component
const Home = () => (
  <>
    <Hero />
    <HowItWorks />
    <Categories />
    <FeaturedProducts />
    <WhyRentAll />
    <CustomerReviews />
    <FaqSection />
    <CTASection />
  </>
);

// 404 Component
const NotFound = () => (
  <PublicLayout>
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Page Not Found</p>
        <a
          href="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  </PublicLayout>
);

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <Home />
              </PublicLayout>
            }
          />

          <Route
            path="/products"
            element={
              <PublicLayout>
                <ProductList />
              </PublicLayout>
            }
          />

          <Route
            path="/product/:id"
            element={
              <PublicLayout>
                <ProductDetails />
              </PublicLayout>
            }
          />

          <Route
            path="/categories"
            element={
              <PublicLayout>
                <Categories />
              </PublicLayout>
            }
          />

          <Route
            path="/categories/:category"
            element={
              <PublicLayout>
                <CategoryProducts />
              </PublicLayout>
            }
          />

          <Route
            path="/how-it-works"
            element={
              <PublicLayout>
                <HowItWorks />
              </PublicLayout>
            }
          />

          <Route
            path="/create"
            element={
              <PublicLayout>
                <PrivateRoute>
                  <CreateProduct />
                </PrivateRoute>
              </PublicLayout>
            }
          />

          {/* Authentication routes */}
          <Route
            path="/login"
            element={
              <PublicLayout>
                <Login />
              </PublicLayout>
            }
          />

          <Route
            path="/register"
            element={
              <PublicLayout>
                <Register redirectTo="/kyc-info" />
              </PublicLayout>
            }
          />

          <Route
            path="/forgot-password"
            element={
              <PublicLayout>
                <ForgotPassword />
              </PublicLayout>
            }
          />

          <Route
            path="/reset-password/:token"
            element={
              <PublicLayout>
                <ResetPassword />
              </PublicLayout>
            }
          />

          {/* KYC routes */}
          <Route
            path="/kyc-info"
            element={
              <PublicLayout>
                <PrivateRoute>
                  <KYCInfo />
                </PrivateRoute>
              </PublicLayout>
            }
          />

          <Route
            path="/kyc-form"
            element={
              <PublicLayout>
                <PrivateRoute>
                  <KYCForm />
                </PrivateRoute>
              </PublicLayout>
            }
          />

          {/* Protected routes */}
          <Route
            path="/rent/:id"
            element={
              <PublicLayout>
                <PrivateRoute>
                  <Rent />
                </PrivateRoute>
              </PublicLayout>
            }
          />

          <Route
            path="/cart"
            element={
              <PublicLayout>
                <PrivateRoute>
                  <Cart />
                </PrivateRoute>
              </PublicLayout>
            }
          />

          <Route
            path="/rentals"
            element={
              <PublicLayout>
                <PrivateRoute>
                  <RentalHistory />
                </PrivateRoute>
              </PublicLayout>
            }
          />

          {/* Dashboard route - simplified since you have a combined component */}
          <Route
            path="/dashboard/*"
            element={
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            }
          />

          {/* Payment callback (no layout needed) */}
          <Route path="/payment/callback" element={<PaymentCallback />} />

          {/* 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
