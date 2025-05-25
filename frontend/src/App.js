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
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardHome = lazy(() => import("./pages/Dashboard/DashboardHome"));
const MyProducts = lazy(() => import("./pages/Dashboard/MyProducts"));
const MyOrders = lazy(() => import("./pages/Dashboard/MyOrders"));
const Profile = lazy(() => import("./pages/Dashboard/Profile"));
const CategoriesPage = lazy(() => import("./pages/Categories"));
const HowItWorksPage = lazy(() => import("./components/HowItWorks"));
const CategoryProducts = lazy(() => import("./pages/CategoryProducts"));

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
    <Dashboard>
      <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
    </Dashboard>
  </PrivateRoute>
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
            path="/categories"
            element={
              <PublicLayout>
                <CategoriesPage />
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
                <HowItWorksPage />
              </PublicLayout>
            }
          />
          <Route
            path="/create"
            element={
              <PublicLayout>
                <CreateProduct />
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
            path="/kyc-info"
            element={
              <PublicLayout>
                <KYCInfo />
              </PublicLayout>
            }
          />
          <Route
            path="/kyc-form"
            element={
              <PublicLayout>
                <KYCForm />
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

          {/* Dashboard routes (protected) */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="products" element={<MyProducts />} />
            <Route path="orders" element={<MyOrders />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* 404 Page */}
          <Route
            path="*"
            element={
              <PublicLayout>
                <div className="min-h-screen flex items-center justify-center">
                  <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
                </div>
              </PublicLayout>
            }
          />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
