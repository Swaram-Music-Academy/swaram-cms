import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { TablesInsert, TablesUpdate } from "@/lib/api/types";
import { supabase } from "@/lib/supabase";
import { courseFns, courseKeys } from "@/query/courses";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { CgSpinner } from "react-icons/cg";
import { useNavigate, useParams } from "react-router-dom";

type CourseUpdate = TablesUpdate<"courses">;
type FeeStructure = TablesInsert<"fee_structures">;
export default function EditCourse() {
  // Use the id to fetch course details
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: courseDetails, isLoading: isCourseLoading } = useQuery({
    queryKey: courseKeys.getCourseById(id as string),
    queryFn: () => courseFns.getCourseByIdFn(id!),
  });

  const [coursePayload, setCoursePayload] = useState<CourseUpdate>({});
  const [isLoading, setIsLoading] = useState(false);
  const [updateDiff, setUpdateDiff] = useState(false);

  useEffect(() => {
    if (courseDetails) {
      setCoursePayload({
        name: courseDetails.name,
        duration_years: courseDetails.duration_years,
        description: courseDetails.description,
      });
    }
  }, [courseDetails]);

  const handleCourseInput = ({
    key,
    value,
  }: {
    key: keyof CourseUpdate;
    value: string;
  }) => {
    setCoursePayload((prev) => ({ ...prev, [key]: value }));
    if (!updateDiff) setUpdateDiff(true);
  };

  const handleFormSubmit = async () => {
    // Data is updated or error is toasted.
    setIsLoading(true);

    const newYears = coursePayload.duration_years!;
    const oldYears = courseDetails!.duration_years!;
    const { error } = await supabase
      .from("courses")
      .update({
        ...coursePayload,
      })
      .eq("id", id!);

    if (error) {
      toast({
        title: "Error Occurred",
        description: "Error occurred adding new course, please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (newYears > oldYears) {
      const newEntries: FeeStructure[] = Array.from(
        { length: newYears - oldYears },
        (_, i) => ({
          course_id: id!,
          year_number: oldYears + i + 1,
        })
      );
      const { error: insertError } = await supabase
        .from("fee_structures")
        .insert(newEntries);
      if (insertError) {
        toast({
          title: "Error Occurred",
          description:
            "Error occurred updating fee structure, please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    } else if (newYears < oldYears) {
      const { error: deleteError } = await supabase
        .from("fee_structures")
        .delete()
        .eq("course_id", id!)
        .gt("year_number", newYears);
      if (deleteError) {
        toast({
          title: "Error Occurred",
          description:
            "Error occurred updating fee structure, please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }
    setIsLoading(false);
    navigate("/courses");
  };

  return (
    <>
      {isCourseLoading ? (
        <Loader />
      ) : (
        <>
          {courseDetails && (
            <>
              <div className="flex gap-4 items-center mb-8">
                <ChevronLeft
                  className="cursor-pointer"
                  onClick={() => navigate(-1)}
                />
                <h1 className="text-3xl font-bold">Edit Course Details</h1>
              </div>
              <div className="flex flex-col lg:flex-row gap-8">
                <Card className="lg:w-1/2">
                  <CardHeader>
                    <h3 className="text-xl font-medium">General Details</h3>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={handleFormSubmit}
                      className="flex flex-col gap-4"
                    >
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="name">Course Name</Label>
                        <Input
                          type="text"
                          id="name"
                          name="name"
                          value={coursePayload.name}
                          onChange={(e) => {
                            const { value } = e.currentTarget;
                            handleCourseInput({ key: "name", value });
                          }}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="duration_years">Duration Years</Label>
                        <Input
                          type="number"
                          min={1}
                          id="duration_years"
                          name="duration_years"
                          onChange={(e) => {
                            const { value } = e.currentTarget;
                            handleCourseInput({ key: "duration_years", value });
                          }}
                          value={coursePayload.duration_years}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          onChange={(e) => {
                            const { value } = e.currentTarget;
                            handleCourseInput({ key: "description", value });
                          }}
                          value={coursePayload.description || ""}
                        />
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
              <div className="flex mt-4 justify-end w-full gap-2">
                {updateDiff && (
                  <Button
                    variant="default"
                    onClick={handleFormSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <CgSpinner className="animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                )}
                <Button variant="ghost">Cancel</Button>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
