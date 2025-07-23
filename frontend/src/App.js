import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";
import PostVerificationRoute from "./components/PostVerificationRoute";
import AdminRoute from "./components/AdminRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import CreateProduct from "./pages/CreateProduct";
import KYCInfo from "./pages/KYCInfo";
import KYCForm from "./pages/KYCForm";
import ProductDetails from "./pages/ProductDetails";
import Rent from "./pages/Rent";
import Cart from "./pages/Cart";
import PaymentCallback from "./components/PaymentCallback";
import RentalHistory from "./pages/RentalHistory";
import VerificationPage from "./pages/VerificationPage";
import EmailVerifyHandler from "./components/EmailVerifyHandler";
import RequestProduct from "./pages/RequestProduct";
import RequestsPage from "./pages/RequestsPage";
import RequestDetail from "./pages/RequestDetail";
import MyOffersPage from "./pages/MyOffersPage";
import Profile from "./pages/Profile";
import ViewAllNotifications from "./pages/ViewAllNotifications";
import {
  DashboardHome,
  MyOrders,
  MyProducts,
  DashboardLayout,
} from "./pages/Dashboard/Dashboard";

import { ThemeProvider } from "./context/ThemeContext"; // 🆕 added

// Lazy loaded components
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
const Admin = lazy(() => import("./pages/Admin"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));

const PublicLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen bg-white text-black dark:bg-gray-900 dark:text-white transition-colors duration-300">
    <Navbar />
    <main className="flex-grow pt-20">
      <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
    </main>
    <Footer />
  </div>
);

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

const NotFound = () => (
  <PublicLayout>
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-300">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl mb-8">Page Not Found</p>
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
    <ThemeProvider>
      <Router>
        <ErrorBoundary>
          <Routes>
            <Route
              path="/"
              element={
                <PublicLayout>
                  <Home />
                </PublicLayout>
              }
            />
            <Route path="/verify-account" element={<VerificationPage />} />
            <Route path="/verify-email/:token" element={<EmailVerifyHandler />} />
            <Route
              path="/profile"
              element={
                <PublicLayout>
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                </PublicLayout>
              }
            />
            <Route
              path="/notifications"
              element={
                <PublicLayout>
                  <PrivateRoute>
                    <ViewAllNotifications />
                  </PrivateRoute>
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
            <Route
              path="/request-product"
              element={
                <PublicLayout>
                  <PrivateRoute>
                    <RequestProduct />
                  </PrivateRoute>
                </PublicLayout>
              }
            />
            <Route
              path="/requests"
              element={
                <PublicLayout>
                  <RequestsPage />
                </PublicLayout>
              }
            />
            <Route
              path="/requests/:id"
              element={
                <PublicLayout>
                  <PrivateRoute>
                    <RequestDetail />
                  </PrivateRoute>
                </PublicLayout>
              }
            />
            <Route
              path="/my-offers"
              element={
                <PublicLayout>
                  <PrivateRoute>
                    <MyOffersPage />
                  </PrivateRoute>
                </PublicLayout>
              }
            />
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
            <Route
              path="/kyc-info"
              element={
                <PublicLayout>
                  <PostVerificationRoute>
                    <KYCInfo />
                  </PostVerificationRoute>
                </PublicLayout>
              }
            />
            <Route
              path="/kyc-form"
              element={
                <PublicLayout>
                  <PostVerificationRoute>
                    <KYCForm />
                  </PostVerificationRoute>
                </PublicLayout>
              }
            />
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
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <PrivateRoute>
                    <DashboardLayout />
                  </PrivateRoute>
                </Suspense>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="orders" element={<MyOrders />} />
              <Route path="products" element={<MyProducts />} />
            </Route>
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />
            <Route path="/payment/callback" element={<PaymentCallback />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </Router>
    </ThemeProvider>
  );
}

export default App;
