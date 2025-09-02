import { useSession } from "@/auth/SessionContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { reportKeys, reportsFns } from "@/query/reports";
import { useQuery } from "@tanstack/react-query";
import {
  LucideBook,
  LucideCircleCheckBig,
  LucideUser,
  LucideUsers,
} from "lucide-react";
import { FiUser, FiBook, FiDollarSign, FiChevronRight } from "react-icons/fi";
import { Link } from "react-router-dom";
function generateGreeting(name: string) {
  let greeting = `Welcome, ${name}`;
  const currentTime = new Date();
  const hours = currentTime.getHours();
  if (hours >= 5 && hours < 12) {
    greeting = `Good morning, ${name}`;
  } else if (hours >= 12 && hours < 18) {
    greeting = `Good afternoon, ${name}`;
  } else if (hours >= 18 && hours < 22) {
    greeting = `Good evening, ${name}`;
  } else {
    greeting = `Good night, ${name}`;
  }
  return greeting;
}

type QuickLink = {
  title: string;
  url: string;
  Icon: (className?: string) => React.ReactNode;
};

const quickLinks: QuickLink[] = [
  {
    title: "Students",
    url: "/students",
    Icon: (className) => <FiUser className={className} />,
  },
  {
    title: "Courses",
    url: "/courses",
    Icon: (className) => <FiBook className={className} />,
  },
  {
    title: "Fees Report",
    url: "/fee-reports",
    Icon: (className) => <FiDollarSign className={className} />,
  },
];

export default function HomePage() {
  const { session } = useSession();
  const name = session?.user.user_metadata.display_name;

  const { data, isLoading } = useQuery({
    queryKey: reportKeys.getDashboardMetrics(),
    queryFn: () => reportsFns.getDashboardMetrics(),
  });

  return (
    <>
      <div className="select-none w-full bg-gradient-to-br p-6 from-primary to-rose-500 rounded-xl flex flex-col text-white items-center">
        <h1 className="text-3xl md:text-4xl mt-4 mb-2 text-center">
          {generateGreeting(name)}
        </h1>
        <p className="mb-4 text-base text-center text-white/85 w-[80%]">
          Here are some quick links to get you started.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 w-full mt-8 mb-2">
          {quickLinks.map((link) => (
            <Link className="hover:!text-white" to={link.url} key={link.title}>
              <div className="transition bg-white/20 hover:bg-white/25 rounded p-2 flex items-center gap-4 group">
                <div className="w-10 h-10 rounded bg-white/30 p-2">
                  {link.Icon("text-white/70 w-full h-full")}
                </div>
                <p>{link.title}</p>
                <FiChevronRight className=" transition h-5 w-5 text-white ml-auto mr-2 group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-stretch gap-4 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <p className="text-muted-foreground">Total Students</p>
              <div className="ml-auto bg-red-400/20 p-2 rounded-full">
                <LucideUser size={20} className="text-red-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 rounded w-20" />
            ) : (
              <p className="text-3xl font-semibold">{data?.totalStudents}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <p className="text-muted-foreground">Total Courses</p>
              <div className="ml-auto bg-red-400/20 p-2 rounded-full">
                <LucideBook size={20} className="text-red-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 rounded w-20" />
            ) : (
              <p className="text-3xl font-semibold">{data?.totalCourses}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <p className="text-muted-foreground">Total Batches</p>
              <div className="ml-auto bg-red-400/20 p-2 rounded-full">
                <LucideUsers size={20} className="text-red-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 rounded w-20" />
            ) : (
              <p className="text-3xl font-semibold">{data?.totalBatches}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <p className="text-muted-foreground">Total Enrollments</p>
              <div className="ml-auto bg-red-400/20 p-2 rounded-full">
                <LucideCircleCheckBig size={20} className="text-red-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 rounded w-20" />
            ) : (
              <p className="text-3xl font-semibold">{data?.totalEnrollments}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
