import "bootstrap/dist/css/bootstrap.min.css";
import React, { useState, useEffect, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
//  import { safeGtag } from "./utils/analytics";

// ✅ Context
import AuthProvider, { AuthContext } from "./LoginSystem/context/AuthContext";
import ProtectedRoute from "./LoginSystem/protectedroutes/ProtectedRoute"

// ✅ Landing Pages
import Navbar from "./Website/components/Navbar";
import Hero from "./Website/components/Hero";
// import Banner from "./Website/components/Banner";
import Benefit from "./Website/components/Benefit";
// import Preparation from "./Website/components/Preparation";
import Whychooseus from "./Website/components/Whychooseus";
import Testimonial from "./Website/components/Testimonial";
import Contact from "./Website/components/Contact";
import Training from "./Website/components/Training";
import MockExam from "./Website/components/MockExam";
import About from "./Website/components/About";
import Footer from "./Website/components/Footer";
import Contactus from "./Website/components/Contactus";
import PrivacyPolicy from "./Website/components/Privacy Policy";
import TermsAndConditions from "./Website/components/TermsAndConditions";
import RefundPolicy from "./Website/components/Refund Policy";
import JoinNowForm from "./Website/components/Joinnow";
// import WhatsAppChat from "./Website/components/Whatsappchat";
import FlashMain from "./Website/FlashcardApp/FlashMain";
import Acp from "./Website/components/Acp";
import Pmp from "./Website/components/Pmp";
import PdfDocs from "./Website/components/PdfDocs";

// ✅ Docs & Quiz
// import Docs from "./Website/components/ProjectDocs/pages/Docs";
import InstructionPage from "./Website/DragAndDropQuiz/Components/InstructionPage";
import DragAndDropQuiz1 from "./Website/DragAndDropQuiz/Set1/DragAndDropQuiz1";
import DragAndDropQuiz2 from "./Website/DragAndDropQuiz/Set2/DragAndDropQuiz2";
import DragAndDropQuiz3 from "./Website/DragAndDropQuiz/Set3/DragAndDropQuiz3";


// Login Functionality
import Login from "./LoginSystem/Login";
import Register from "./LoginSystem/Register";
import ForgotPassword from "./LoginSystem/ForgotPassword";
import ResetPassword from "./LoginSystem/ResetPassword";
import VerifyEmail from "./LoginSystem/VerifyEmail";
import InviteAccept from "./LoginSystem/InviteAccept";
import FirstLogin from "./LoginSystem/FirstLogin";
import StudentDashboard from "./WebStudent/Dashboard/StudentDashboard";
import AdminDashboard from "./WebAdmin/Dashboard/AdminDashboard";
import SuperAdminDashboard from "./WebAdmin/SuperAdmin/SuperAdminDashboard";
import TeacherDashboard from "./WebAdmin/Teacher/TeacherDashboard";
import AdminMockTestList from "./WebAdmin/AdminModule/Mocktest/AdminMockTestList";
import AdminMockTestCreate from "./WebAdmin/AdminModule/Mocktest/AdminMockTestCreate";
import AdminMockTestQuestionEditor from "./WebAdmin/AdminModule/Mocktest/AdminMockTestQuestionEditor";
import AdminMockTestSettings from "./WebAdmin/AdminModule/Mocktest/AdminMockTestSettings";
import EditorQuestions from "./WebAdmin/AdminModule/Mocktest/EditorQuestions";
import StudentMockTestList from "./WebStudent/Pages/Mocktest/StudentMockTestList";
import ExamShell from "./WebStudent/StudentModule/Mocktest/ExamShell";
import StudentAttempts from "./WebStudent/StudentModule/Mocktest/StudentAttempts";
import ExamShellSections from "./WebStudent/StudentModule/Mocktest/ExamShellSections";
import StudentResult from "./WebStudent/StudentModule/Mocktest/StudentResult";
import StudentSolutions from "./WebStudent/StudentModule/Mocktest/StudentSolutions";
// ✅ Q-Bank Modules (Admin + Student)

// ---- Admin Q-Bank Components
import AdminQBankUpload from "./WebAdmin/AdminModule/Q-Bank/AdminQBankUpload";
import AdminQBankList from "./WebAdmin/AdminModule/Q-Bank/AdminQBankList";
import AdminQBankEdit from "./WebAdmin/AdminModule/Q-Bank/AdminQBankEdit";
import AdminQBankSettings from "./WebAdmin/AdminModule/Q-Bank/QBsetting";
// import AdminQBankDetails from "./WebAdmin/AdminModule/Q-Bank/AdminQBankDetails"; // (commented route)

// ---- Student Q-Bank Components
import StudentQBankList from "./WebStudent/StudentModule/Q-Bank/StudentQBankList";
import StudentQBankDetailsPage from "./WebStudent/StudentModule/Q-Bank/StudentQBankDetailsPage";
import StudentQBankFilterForm from "./WebStudent/StudentModule/Q-Bank/StudentQBankFilterForm";
import StudentQBankHistory from "./WebStudent/StudentModule/Q-Bank/StudentQBankHistory";
import StudentQBankSession from "./WebStudent/StudentModule/Q-Bank/StudentQBankSession";
import StudentQBankLatestExplanationPage from "./WebStudent/StudentModule/Q-Bank/StudentQBankLatestExplanationPage";
import StudentQBankSolutions from "./WebStudent/StudentModule/Q-Bank/StudentQBankSolutions";

// Course Components
// ✅ ADD: CoursesPage import (your given path)
import CoursesPage from "./WebStudent/Pages/Course/LMS/LMS_Pages/CoursesPage";
import CreateCourse from "./WebStudent/Pages/Course/LMS/LMS_Pages/CreateCourse";
import CourseBuilder from "./WebStudent/Pages/Course/LMS/LMS_Pages/CourseBuilder";
import SectionBuilder from "./WebStudent/Pages/Course/LMS/LMS_Pages/SectionBuilder";

// // Web/src/App.js
import AddSection from "./WebStudent/Pages/Course/LMS/AddSection";
// import AddLessonPage from "./WebAdmin/AdminModule/Course/page/LMS/LMS_Pages/AddLessonPage";


// already imports...
import LessonPlayerPage from "./WebStudent/Pages/Course/LMS/LMS_Pages/LessonPlayerPage";


// import LessonPreviewWrapper from "./WebAdmin/AdminModule/Course/page/LMS/LessonPreviewWrapper";
import CourseSettingsPage from "./WebStudent/Pages/Course/LMS/CourseSettingsPage";

import StudentCourseListPage from "./WebStudent/Pages/Course/LMS/StudentCourseListPage";
import StudentCourseDetailPage from "./WebStudent/Pages/Course/LMS/StudentCourseDetailPage";

import AddLessonPage from "./WebStudent/Pages/Course/LMS/LMS_Pages/AddLessonPage";

import LessonPreviewWrapper from "./WebStudent/Pages/Course/LMS/LessonPreviewWrapper"


import EBookEditor from "./WebAdmin/AdminModule/E-Books/Admin/EBookEditor"
import EBookReader from "./WebAdmin/AdminModule/E-Books/Student/EBookReader"
import StudentBookshelf from "./WebStudent/StudentModule/E-book/Student/StudentBookshelf";

import AdminEBookList from "./WebAdmin/AdminModule/E-Books/Admin/AdminEBookList"
import Title from "./WebAdmin/AdminModule/E-Books/Admin/Title"
import EBookSettings from "./WebAdmin/AdminModule/E-Books/Admin/EBookSettings"

import AdminAddUser from "./WebAdmin/Dashboard/AdminAddUser";
import AddUser from "./WebAdmin/Dashboard/AddUser";
import AdminLearnerProfile from "./WebStudent/Pages/AdminLearnerProfile";
import MyEnrollments from "./WebStudent/Pages/MyEnrollments";
import AdminAddProduct from "./WebAdmin/AdminModule/AdminAddProduct";
import BulkCreateUsers from "./WebAdmin/Dashboard/BulkCreateUsers";


const AppContent = () => {
  const location = useLocation();
  const hideNavbarRoutes = [
    "/login", "/register", "/forgot-password", "/add-user", "/users",
    "/admin-dashboard", "/student-dashboard", "/teacher-dashboard",
    "/superadmin-dashboard", "/create-admin", "/all-admins",
    "/superadmin/accounts", "/profile", "/mock-test", "/buy-test",
    "/create-mock-test", "/test-overview", "/exam", "final-report",
  ];
  const hideOnReset = location.pathname.startsWith("/reset-password");
  const shouldHideNavbar =
    hideNavbarRoutes.some(route => location.pathname.startsWith(route)) || hideOnReset;

  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    const fired = { 25: false, 50: false, 75: false, 100: false };
    const handleScroll = () => {
      const scrollTop = window.scrollY + window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const scrolledPercent = Math.round((scrollTop / docHeight) * 100);
      [25, 50, 75, 100].forEach((threshold) => {
        if (scrolledPercent >= threshold && !fired[threshold]) {
          fired[threshold] = true;

        }
      });
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const startQuiz = () => setQuizStarted(true);

  return (
    <>
      {!shouldHideNavbar && <Navbar />}

      <Routes>
        {/* 🔹 Landing */}
        <Route
          path="/"
          element={
            <>
              <Hero />
              {/* <Banner /> */}
              <Benefit />
              {/* <Preparation /> */}
              <Whychooseus />
              <Testimonial />
              <Contact />
              <Footer />
            </>
          }
        />
        <Route path="/training" element={<Training />} />
        <Route path="/mock-exam" element={<MockExam />} />
        <Route path="/flashcards" element={<FlashMain />} />
        <Route path="/agile" element={<FlashMain />} />
        <Route path="/process-groups" element={<FlashMain />} />
        <Route path="/project-management-foundation" element={<FlashMain />} />
        <Route path="/knowledge-area" element={<FlashMain />} />
        <Route path="/performance-domain" element={<FlashMain />} />
        <Route path="/acp" element={<Acp />} />
        <Route path="/pmp" element={<Pmp />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contactus />} />

        {/* 🔹 Auth (use lowercase /login to avoid mismatch) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/invite-accept" element={<InviteAccept />} />

        <Route path="/first-login" element={<FirstLogin />} />


        <Route path="/privacypolicy" element={<PrivacyPolicy />} />
        <Route path="/termsandconditions" element={<TermsAndConditions />} />
        <Route path="/refundpolicy" element={<RefundPolicy />} />
        <Route path="/join-us" element={<JoinNowForm />} />

        <Route path="/PdfDocs" element={<PdfDocs />} />

        {/* 🔹 Docs + Quiz */}
        <Route path="/drag-and-drop" element={<InstructionPage startQuiz={startQuiz} />} />
        <Route path="/drag-and-drop/set1" element={<DragAndDropQuiz1 />} />
        <Route path="/drag-and-drop/set2" element={<DragAndDropQuiz2 />} />
        {/* <Route path="/drag-and-drop/set3" element={<DragAndDropQuiz3 />} /> */}
        {/* <Route path="/docs/*" element={<Docs />} /> */}


        {/* Student Routes */}
        <Route path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
  path="/student/enrollments"
  element={
    <ProtectedRoute allowedRoles={["student"]}>
      <MyEnrollments />
    </ProtectedRoute>
  }
/>
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />



        {/* ------------------ Admin Routes ------------------ */}
        <Route
          path="/admin/mocktests"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin", "Admin", "Teacher"]}>
              <AdminMockTestList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mocktests/create"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin", "Admin", "Teacher"]}>
              <AdminMockTestCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mocktests/editor/:mockTestId/settings"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin", "Admin", "Teacher"]}>
              <AdminMockTestSettings />
            </ProtectedRoute>
          }
        />

        {/* <Route path="/admin/mocktests/editor/:mockTestId/questions" element={<AdminMockTestQuestionEditor />} />
<Route
  path="/admin/mocktests/editor/:mockTestId/questions"
  element={<EditorQuestions />}
/> */}


        {/* SECTION-WISE OVERVIEW (what your card should open) */}
        <Route
          path="/admin/mocktests/editor/:mockTestId/sections"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin", "Admin", "Teacher"]}>
              <EditorQuestions />
            </ProtectedRoute>
          }
        />

        {/* OPTIONAL: a separate path for the detailed question editor */}
        <Route
          path="/admin/mocktests/editor/:mockTestId/questions"
          element={
            <ProtectedRoute allowedRoles={["SuperAdmin", "Admin", "Teacher"]}>
              <AdminMockTestQuestionEditor />
            </ProtectedRoute>
          }
        />



        {/* Student side mocktest routes */}

        <Route
          path="/student/mocktests"
          element={
            <ProtectedRoute>
              <StudentMockTestList />
            </ProtectedRoute>
          }
        />


        <Route
          path="/student/attempt/:attemptId"
          element={
            <ProtectedRoute>
              <ExamShell />
            </ProtectedRoute>
          }
        />


        <Route path="/student/attempts"
          element={
            <ProtectedRoute>
              <StudentAttempts />
            </ProtectedRoute>
          } />
        <Route path="/student/attempts/:mockTestId"
          element={
            <ProtectedRoute>
              <StudentAttempts />
            </ProtectedRoute>} />

        <Route path="/student/mocktests/:mockTestId/exam"
          element={
            <ProtectedRoute>
              <ExamShellSections />
            </ProtectedRoute>
          } />
        <Route
          path="/student/results/:attemptId"
          element={
            <ProtectedRoute>
              <StudentResult />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/solutions/:attemptId"
          element={
            <ProtectedRoute>
              <StudentSolutions />
            </ProtectedRoute>
          }
        />



        {/* 🔹 Admin Q-Bank Routes */}
        <Route
          path="/admin/qbank/upload"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminQBankUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/qbank/list"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminQBankList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/qbank/edit/:bankId"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminQBankEdit />
            </ProtectedRoute>
          }
        />
        {/* 🔹 Admin Q-Bank Settings Page */}
        <Route
          path="/admin/qbank/:bankId/qbsetting"
          element={<AdminQBankSettings />}
        />

        {/* 🔹 Student Q-Bank Routes */}
        <Route
          path="/student/qbank"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentQBankList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/qbank/details/:bankId"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentQBankDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/qbank/filter"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentQBankFilterForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/qbank/history"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentQBankHistory />
            </ProtectedRoute>
          }
        />
        console.log("🔴 [ROUTER] Rendering route /student/qbank/session");

        <Route
          path="/student/qbank/session/:sessionId"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentQBankSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/qbank/:bankId/explanation/latest"
          element={<StudentQBankLatestExplanationPage />}
        />

        <Route
  path="/student/qbank/solutions"
  element={<StudentQBankSolutions />}
/>

<Route
  path="/admin/users"
  element={
    <ProtectedRoute allowedRoles={["admin", "SuperAdmin"]}>
      <AdminAddUser />
    </ProtectedRoute>
  }
/>


<Route
  path="/admin/users/add"
  element={
    <ProtectedRoute allowedRoles={["admin", "SuperAdmin"]}>
      <AddUser />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/users/:sub"
  element={
    <ProtectedRoute allowedRoles={["admin", "SuperAdmin"]}>
      <AdminLearnerProfile />
    </ProtectedRoute>
  }
/>


<Route
  path="/admin/users/:sub/add-product"
  element={
    <ProtectedRoute allowedRoles={["admin", "SuperAdmin"]}>
      <AdminAddProduct />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/users/bulk-create"
  element={
    <ProtectedRoute allowedRoles={["admin", "SuperAdmin"]}>
      <BulkCreateUsers />
    </ProtectedRoute>
  }
/>

{/* =================== E-BOOK ROUTES (added) =================== */}
        {/* Settings */}
        <Route
          path="/admin/ebooks/settings/:ebookid"
          element={
            <ProtectedRoute>
              <EBookSettings />
            </ProtectedRoute>
          }
        />
        {/* Title step (moved to avoid duplicate path) */}
        <Route
          path="/admin/ebooks/create/title"
          element={
            <ProtectedRoute>
              <Title />
            </ProtectedRoute>
          }
        />
        {/* Create */}
        <Route
          path="/admin/ebooks/create"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Teacher", "SuperAdmin"]}>
              <EBookEditor />
            </ProtectedRoute>
          }
        />
        {/* Edit */}
        <Route
          path="/admin/ebooks/edit/:ebookid"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Teacher", "SuperAdmin"]}>
              <EBookEditor />
            </ProtectedRoute>
          }
        />
        {/* Admin list */}
        <Route
          path="/admin/ebooks"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Teacher", "SuperAdmin"]}>
              <AdminEBookList />
            </ProtectedRoute>
          }
        />

         <Route
          path="/admin/ebook/create"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Teacher", "SuperAdmin"]}>
              <AdminEBookList />
            </ProtectedRoute>
          }
        />
        {/* Reader by slug (via query params) */}
        <Route
          path="/ebooks/read"
          element={
            <ProtectedRoute allowedRoles={["Student", "Admin", "Teacher", "SuperAdmin"]}>
              <EBookReader />
            </ProtectedRoute>
          }
        />
        {/* Reader by id */}
        <Route
          path="/ebooks/read/:ebookid"
          element={
            <ProtectedRoute allowedRoles={["Student", "Admin", "Teacher", "SuperAdmin"]}>
              <EBookReader />
            </ProtectedRoute>
          }
        />
        {/* Student bookshelf */}
        <Route
          path="/ebooks"
          element={
            <ProtectedRoute allowedRoles={["Student", "Admin", "Teacher", "SuperAdmin"]}>
              <StudentBookshelf />
            </ProtectedRoute>
          }
        />
        {/* ================= END E-BOOK ROUTES ================= */}

 {/* Course list (role-protected) */}
<Route
  path="/courses"
  element={
    <ProtectedRoute allowedRoles={["admin", "teacher", "student"]}>
      <CoursesPage />
    </ProtectedRoute>
  }
/>

{/* Create course (only staff) */}
<Route
  path="/create-course"
  element={
    <ProtectedRoute allowedRoles={["admin", "teacher"]}>
      <CreateCourse />
    </ProtectedRoute>
  }
/>
<Route
  path="/course-builder/:courseId"
  element={
    <ProtectedRoute allowedRoles={["admin", "teacher"]}>
      <CourseBuilder />
    </ProtectedRoute>
  }
/>

<Route
  path="/course-builder/:courseId"
  element={
    <ProtectedRoute allowedRoles={["admin", "teacher"]}>
      <CourseBuilder />
    </ProtectedRoute>
  }
/>
<Route
  path="/add-section/:testId"
  element={
    <ProtectedRoute allowedRoles={["admin", "teacher"]}>
      <AddSection />
    </ProtectedRoute>
  }
/>

<Route
  path="/course/:courseId/section/:sectionId"
  element={
    <ProtectedRoute allowedRoles={["admin", "teacher"]}>
      <SectionBuilder />
    </ProtectedRoute>
  }
/>

<Route
  path="/course/:courseId/section/:sectionId/lesson/:lessonId"
  element={
    <ProtectedRoute allowedRoles={["admin", "teacher"]}>
      <AddLessonPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/learn/:courseSlug/:sectionId/:lessonId"
  element={
    <ProtectedRoute allowedRoles={["student", "admin", "teacher"]}>
      <LessonPlayerPage />
    </ProtectedRoute>
  }
/>

 <Route
          path="/student/course/:courseSlug/section/:sectionId/lesson/:lessonId"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <LessonPlayerPage />
            </ProtectedRoute>
          }
        />
<Route
  path="/lesson-preview"
  element={
    <ProtectedRoute allowedRoles={["admin", "teacher"]}>
      <LessonPreviewWrapper />
    </ProtectedRoute>
  }
/>

 <Route
          path="/student/courses"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentCourseListPage />
            </ProtectedRoute>
          }
        />

         <Route
          path="/student/course/:courseSlug"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentCourseDetailPage />
            </ProtectedRoute>
          }
        />

        <Route path="/course/settings/:courseId" element={<CourseSettingsPage />} />

        {/* 404 Catch-All */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* <ToastContainer position="top-center" />
      <WhatsAppChat /> */}
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
