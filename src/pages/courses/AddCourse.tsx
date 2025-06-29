import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/lib/api/types";
import { supabase } from "@/lib/supabase";
import { ChevronLeft } from "lucide-react";
import { ChangeEventHandler, FormEventHandler, useState } from "react";
import { CgSpinner } from "react-icons/cg";
import { useNavigate } from "react-router-dom";

type Course = Tables<"courses">;

export default function AddCourse() {
  const [details, setDetails] = useState<Partial<Course>>({
    name: "",
    description: "",
    duration_years: 1,
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const handleFormSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Send details to api to create new data
    const { error } = await supabase.from("courses").insert(details);
    if (error) {
      toast({
        title: "Error Occurred",
        description: "Error occurred adding new course, please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
    navigate("/courses");
  };
  const handleInputChange: ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (e) => {
    const target = e.currentTarget;
    const { name, value } = target;
    setDetails((details) => ({
      ...details!,
      [name as keyof Course]: value,
    }));
  };

  return (
    <>
      <div className="flex gap-4 items-center mb-8">
        <ChevronLeft className="cursor-pointer" onClick={() => navigate(-1)} />
        <h1 className="text-3xl font-bold">Add New Course</h1>
      </div>
      <Card className="lg:w-1/2">
        <CardHeader>
          <h3 className="text-2xl font-medium">Course Details</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Course Name</Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={details.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="duration_years">Duration Years</Label>
              <Input
                type="number"
                min={1}
                id="duration_years"
                name="duration_years"
                onChange={handleInputChange}
                value={details.duration_years}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                onChange={handleInputChange}
                value={details.description || ""}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <Button className={"ml-auto"} variant="ghost">
                Cancel
              </Button>
              <Button variant="default" type="submit" disabled={isLoading}>
                {isLoading ? <CgSpinner className="animate-spin" /> : "Add"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
