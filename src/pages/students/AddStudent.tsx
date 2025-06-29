import { Button } from "@/components/ui/button";
import { AddressInsert, AddressRecord, PersonalDetails } from "@/lib/types";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GeneralDetailsCard from "./components/GeneralDetailsCard";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import Loader from "@/components/Loader";
import { avatarNameGen } from "@/lib/utils/stub";
import AddressCard from "./components/AddressCard";

export default function AddStudent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails>({
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "Male",
    date_of_birth: null,
    admission_date: format(new Date(), "yyyy-MM-dd"),
    avatarFile: null,
  });

  const [addressDetails, setAddressDetails] = useState<AddressRecord>({
    unit: "",
    line_1: "",
    line_2: "",
    city: "",
    state: "",
    country: "",
    zipcode: "",
  });

  const handleChange = (field: string, value: string | File | Date) => {
    setPersonalDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setAddressDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Check if all required fields are filled
    if (
      !personalDetails.first_name ||
      !personalDetails.last_name ||
      !personalDetails.gender
    ) {
      toast({
        title: "Invalid Submission",
        description: "Please fill in all required fields.",
      });
      setIsLoading(false);
      return;
    }
    // Check if avatarFile is selected
    if (!personalDetails.avatarFile) {
      toast({
        title: "Invalid Submission",
        description: "Please upload an avatar.",
      });
      setIsLoading(false);
      return;
    }
    // Check if date_of_birth is selected
    if (!personalDetails.date_of_birth) {
      toast({
        title: "Invalid Submission",
        description: "Please select a date of birth.",
      });
      setIsLoading(false);
      return;
    }
    // Check if admission_date is selected
    if (!personalDetails.admission_date) {
      toast({
        title: "Invalid Submission",
        description: "Please select an admission date.",
      });
      setIsLoading(false);
      return;
    }

    // Validate Address Fields
    if (
      !addressDetails.line_1 ||
      !addressDetails.city ||
      !addressDetails.country ||
      !addressDetails.state ||
      !addressDetails.zipcode
    ) {
      toast({
        title: "Invalid Submission",
        description: "Please fill in all address fields.",
      });
      setIsLoading(false);
      return;
    }

    const { data: insertAddress, error: addressError } = await supabase
      .from("addresses")
      .insert(addressDetails as AddressInsert)
      .select()
      .single();
    if (addressError) {
      toast({
        title: "Error occurred.",
        description:
          "Error occurred while adding address record. Please try again later.",
      });
      setIsLoading(false);
      return;
    }

    const addressId = insertAddress!.id;

    const fileName = avatarNameGen({
      firstName: personalDetails.first_name,
      lastName: personalDetails.last_name,
    });
    const { data, error } = await supabase.storage
      .from("students")
      .upload(fileName, personalDetails.avatarFile);
    if (error) {
      toast({
        title: "Upload Error",
        description: "Error uploading file. Please try again.",
      });
      setIsLoading(false);
      return;
    }
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .upsert({
        first_name: personalDetails.first_name,
        middle_name: personalDetails.middle_name,
        last_name: personalDetails.last_name,
        avatar_url: data.path,
        gender: personalDetails.gender,
        date_of_birth: personalDetails.date_of_birth,
        address_id: addressId,
        admission_date: personalDetails.admission_date,
      })
      .select();
    if (studentError) {
      console.error("Error inserting student data:", studentError);
      alert("Error saving student data. Please try again.");
      // Remove the uploaded file if student data insertion fails
      await supabase.storage.from("students").remove([data.path]);
      setIsLoading(false);
      return;
    }
    const studentId = studentData[0].id;
    setIsLoading(false);
    navigate(`/students/${studentId}`);
  };

  return (
    <>
      <div className="flex gap-4 items-center mb-8">
        <ChevronLeft className="cursor-pointer" onClick={() => navigate(-1)} />
        <h1 className="text-3xl font-bold">New Registration</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <GeneralDetailsCard
          formData={personalDetails}
          onChange={handleChange}
        />
        <AddressCard
          addressData={addressDetails}
          onChange={handleAddressChange}
        />
        <Button type="submit" className="self-start" disabled={isLoading}>
          {isLoading ? <Loader /> : "Add Student"}
        </Button>
      </form>
    </>
  );
}
