import Loader from "@/components/Loader";
import { studentFns, studentKeys } from "@/query/students";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GeneralDetailsCard from "./components/GeneralDetailsCard";
import { AddressUpdate, EditPersonalDetails } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { avatarNameGen } from "@/lib/utils/stub";
import AddressCard from "./components/AddressCard";

export default function EditStudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, error, isLoading } = useQuery({
    queryKey: studentKeys.getStudentById(id!),
    queryFn: () => studentFns.getStudentByIdFn(id!),
  });
  const { toast } = useToast();
  const [updateDiff, setUpdateDiff] = useState(false);
  const [editPayload, setEditPayload] = useState<
    EditPersonalDetails | undefined
  >();
  const [editAddressPayload, setAddressPayload] = useState<
    AddressUpdate | undefined
  >();
  useEffect(() => {
    if (data) {
      setAddressPayload({
        id: data.addresses?.id || "",
        unit: data.addresses?.unit || "",
        line_1: data.addresses?.line_1 || "",
        line_2: data.addresses?.line_2 || "",
        city: data.addresses?.city || "",
        state: data.addresses?.state || "",
        country: data.addresses?.country || "",
        zipcode: data.addresses?.zipcode || "",
      });
      setEditPayload({
        first_name: data.first_name,
        middle_name: data.middle_name,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth,
        admission_date: data.admission_date,
        gender: data.gender,
      });
    }
  }, [data]);

  // Handlers
  const handleChange = (field: string, value: string | File | Date) => {
    setEditPayload((prev) => ({ ...prev, [field]: value }));
    if (!updateDiff) setUpdateDiff(true);
  };
  const handleAddressChange = (field: string, value: string | File | Date) => {
    setAddressPayload((prev) => ({ ...prev, [field]: value }));
    if (!updateDiff) setUpdateDiff(true);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editPayload || !data) {
      return;
    }
    //  Do validation
    if (editPayload.first_name === "" || editPayload.last_name === "") {
      //  Show toast error
      toast({
        title: "Invalid Submission",
        description: "Please fill in all required fields.",
      });
      return;
    }

    let newAvatarUrl = data.avatar_url;
    if (editPayload.avatarFile) {
      const filename = avatarNameGen({
        firstName: editPayload.first_name!,
        lastName: editPayload.last_name!,
      });

      await supabase.storage.from("students").remove([data.avatar_url!]);
      //  Upload avatar if changes
      const { error } = await supabase.storage
        .from("students")
        .upload(filename, editPayload.avatarFile, {
          contentType: editPayload.avatarFile.type,
        });
      if (error) {
        toast({
          title: "Avatar Upload Error",
          description:
            "Error occurred while uploading avatar. Please try again.",
          variant: "destructive",
        });
        return;
      }
      newAvatarUrl = filename;
    }
    //  Update details
    const { error: addressError } = await supabase.from("addresses").upsert({
      id: editAddressPayload?.id || "",
      unit: editAddressPayload?.unit || "",
      line_1: editAddressPayload?.line_1 || "",
      line_2: editAddressPayload?.line_2 ?? "",
      city: editAddressPayload?.city || "",
      state: editAddressPayload?.state || "",
      country: editAddressPayload?.country || "",
      zipcode: editAddressPayload?.zipcode || "",
    });
    if (addressError) {
      toast({
        title: "Error occurred",
        description: "Error occurred while trying to update address record",
      });
      return;
    }

    const { error } = await supabase
      .from("students")
      .update({
        first_name: editPayload.first_name,
        middle_name: editPayload.middle_name,
        last_name: editPayload.last_name,
        gender: editPayload.gender,
        date_of_birth: editPayload.date_of_birth,
        admission_date: editPayload.admission_date,
        avatar_url: newAvatarUrl,
      })
      .eq("id", data.id);
    if (error) {
      toast({
        title: "Error occurred",
        description: "Error occurred while trying to update details",
      });
      return;
    }
    //  Navigate back
    navigate(-1);
  };
  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {error && (
            <div className="w-full h-full flex items-center justify-center">
              Something went wrong. Please try again
            </div>
          )}
          {editPayload && (
            <>
              <div className="flex gap-4 items-center mb-8">
                <ChevronLeft
                  className="cursor-pointer"
                  onClick={() => navigate(-1)}
                />
                <h1 className="text-3xl font-medium">Edit Student Details</h1>
              </div>
              <form className="flex flex-col gap-8" onSubmit={submitForm}>
                <GeneralDetailsCard
                  formData={editPayload}
                  onChange={handleChange}
                />
                <AddressCard
                  addressData={editAddressPayload!}
                  onChange={handleAddressChange}
                />
                <div className="flex justify-end gap-4">
                  {updateDiff && (
                    <Button type="submit" className="self-start">
                      Save Changes
                    </Button>
                  )}

                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </div>
              </form>
            </>
          )}
        </>
      )}
    </>
  );
}
