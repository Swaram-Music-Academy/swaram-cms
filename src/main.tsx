import "./index.css";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "@/routes/App";
import Login from "@/routes/Login";
import AuthGuard from "@/auth/AuthGuard";
import Root from "@/routes/Root";

// Importing Pages
import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/ErrorPage";
import CoursePage from "@/pages/courses/Courses";
import EditCourse from "@/pages/courses/EditCourse";
import AddCourse from "@/pages/courses/AddCourse";
import BatchPage from "@/pages/batches/Batches";
import BatchDetails from "@/pages/batches/BatchDetails";
import AddBatch from "@/pages/batches/AddBatch";
import EditBatch from "@/pages/batches/EditBatch";
import BatchLayout from "@/layout/BatchLayout";
import EditTimings from "@/pages/batches/EditTimings";
import EditBatchCourses from "@/pages/batches/EditBatchCourses";
import Students from "@/pages/students/Students";
import StudentDetails from "@/pages/students/StudentDetails";
import AddStudent from "@/pages/students/AddStudent";
import CourseDetails from "@/pages/courses/CourseDetails";
import EditCourseFees from "@/pages/courses/EditCourseFees";
import EnrollStudent from "@/pages/students/EnrollStudent";
import EditStudentDetails from "@/pages/students/EditStudentDetails";
import AdmissionForm from "@/templates/AdmissionForm";
import FeeReceipt from "@/templates/FeeReceipt";
import FeeDetails from "@/pages/fees/FeeDetails";
import TimeTable from "@/pages/TimeTable";
import FeeReports from "@/pages/feeReports/FeeReports";
import PendingInstallments from "@/pages/pending/Installments";
import PendingRegisterationFees from "@/pages/pending/Registeration";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      // Public Routes
      { path: "login", element: <Login /> },
      {
        // Private Routes
        path: "/",
        element: <AuthGuard />,
        children: [
          {
            path: "/",
            element: <App />,
            children: [
              { path: "/", element: <HomePage /> },
              {
                path: "courses",
                children: [
                  {
                    index: true,
                    element: <CoursePage />,
                  },
                  { path: ":id", element: <CourseDetails /> },
                  { path: "add", element: <AddCourse /> },
                  { path: "edit/:id", element: <EditCourse /> },
                  {
                    path: "edit/:id/fee-structure",
                    element: <EditCourseFees />,
                  },
                ],
              },
              {
                path: "batches",
                element: <BatchLayout />,
                children: [
                  { index: true, element: <BatchPage /> },
                  { path: "add", element: <AddBatch /> },
                  { path: "edit/:id", element: <EditBatch /> },
                  { path: "edit/:id/timings", element: <EditTimings /> },
                  { path: "edit/:id/courses", element: <EditBatchCourses /> },
                  { path: ":id", element: <BatchDetails /> },
                ],
              },
              {
                path: "students",
                children: [
                  { index: true, element: <Students /> },
                  { path: "add", element: <AddStudent /> },
                  { path: "edit/:id", element: <EditStudentDetails /> },
                  { path: ":id", element: <StudentDetails /> },
                ],
              },
              {
                path: "enrollment",
                children: [{ path: ":id", element: <EnrollStudent /> }],
              },
              {
                path: "fees",
                children: [{ path: ":id", element: <FeeDetails /> }],
              },
              {
                path: "time-table",
                index: true,
                element: <TimeTable />,
              },
              {
                path: "fee-reports",
                index: true,
                element: <FeeReports />,
              },
              {
                path: "pending-installments",
                index: true,
                element: <PendingInstallments />,
              },
              {
                path: "pending-registeration",
                index: true,
                element: <PendingRegisterationFees   />,
              },
            ],
          },
          {
            path: "admission-form",
            children: [
              {
                path: ":id",
                element: <AdmissionForm />,
              },
            ],
          },
          {
            path: "receipts",
            children: [
              {
                path: ":id",
                element: <FeeReceipt />,
              },
            ],
          },
        ],
      },
    ],
    errorElement: <NotFoundPage />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
