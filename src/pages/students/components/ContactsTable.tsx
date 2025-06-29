import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Enums } from "@/lib/api/types";
import { supabase } from "@/lib/supabase";
import { QueryData } from "@supabase/supabase-js";
import { Edit, SaveIcon, Trash, X } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const contactsQuery = supabase
  .from("students_contacts")
  .select(`*, contacts(*)`)
  .single();

type StudentContact = QueryData<typeof contactsQuery>;
interface ContactEntry {
  name: string;
  relation: Enums<"relation"> | "";
  phone: string;
  whatsapp: string;
  email: string;
  occupation?: string;
}

interface ContactEntryWithId extends ContactEntry {
  contactId: string;
}

const relations: Enums<"relation">[] = ["Self", "Mother", "Father", "Guardian"];
export default function ContactsTable({
  studentContacts,
  onDataChange,
}: {
  studentContacts: StudentContact[] | undefined;
  onDataChange: () => void;
}) {
  const { toast } = useToast();
  const { id } = useParams();
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState<ContactEntry>({
    name: "",
    relation: "",
    phone: "",
    whatsapp: "",
    email: "",
    occupation: "",
  });

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string>("");
  const [editingContact, setEditingContact] = useState<ContactEntryWithId>({
    name: "",
    relation: "",
    phone: "",
    whatsapp: "",
    email: "",
    occupation: "",
    contactId: "",
  });

  const submitNewEntry = async () => {
    // Validate the contact entries
    if (!newContact.name) {
      toast({
        title: "Missing Fields",
        description: "Please enter a contact name.",
      });
      return;
    }
    if (!newContact.relation) {
      toast({
        title: "Missing Fields",
        description: "Please select a relation.",
      });
      return;
    }
    if (!newContact.phone || !/^[+\d]+$/.test(newContact.phone)) {
      toast({
        title: "Missing Fields",
        description: "Please enter a valid contact number.",
      });
      return;
    }
    if (
      newContact.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newContact.email)
    ) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    // Insert fields into tables
    const { data, error } = await supabase
      .from("contacts")
      .upsert({
        contact_name: newContact.name,
        phone: newContact.phone,
        whatsapp_num: newContact.whatsapp,
        email: newContact.email,
      })
      .select("id");
    if (error) {
      toast({
        title: "Error Occurred",
        description: "Error occurred while adding contact, please try again.",
      });
      return;
    }
    const contactId = data[0].id;
    const { error: contactError } = await supabase
      .from("students_contacts")
      .insert({
        student_id: id!, // Assuming student_id is available in the first contact
        contact_id: contactId,
        relationship: newContact.relation,
        occupation: newContact.occupation,
      });
    if (contactError) {
      toast({
        title: "Error Occurred",
        description: "Error occurred while adding contact, please try again.",
      });
      return;
    }
    // Reset the new contact state
    setNewContact({
      name: "",
      relation: "",
      phone: "",
      whatsapp: "",
      email: "",
      occupation: "",
    });
    setIsAddingContact(false);
    // Call the onDataChange function to refetch the contacts
    toast({
      title: "Contact Added",
      description: "New contact has been added successfully.",
    });
    onDataChange();
  };

  //Handler to edit a contact entry
  const editContactEntry = (studentContact: StudentContact) => {
    setIsEditingContact(true);
    setEditingContactId(studentContact.id);
    setEditingContact({
      name: studentContact.contacts.contact_name,
      relation: studentContact.relationship as Enums<"relation">,
      phone: studentContact.contacts.phone,
      whatsapp: studentContact.contacts.whatsapp_num || "",
      email: studentContact.contacts.email || "",
      occupation: studentContact.occupation || "",
      contactId: studentContact.contact_id,
    });
  };

  const submitEditedEntry = async () => {
    // Validate the edited contact entries
    if (!editingContact.name) {
      toast({
        title: "Missing Fields",
        description: "Please enter a contact name.",
      });
      return;
    }
    if (!editingContact.relation) {
      toast({
        title: "Missing Fields",
        description: "Please select a relation.",
      });
      return;
    }
    if (!editingContact.phone || !/^[+\d]+$/.test(editingContact.phone)) {
      toast({
        title: "Missing Fields",
        description: "Please enter a valid contact number.",
      });
      return;
    }
    if (
      editingContact.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingContact.email)
    ) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
      });
      return;
    }
    // Update the contact in the contacts table
    const { error } = await supabase
      .from("contacts")
      .update({
        contact_name: editingContact.name,
        phone: editingContact.phone,
        whatsapp_num: editingContact.whatsapp,
        email: editingContact.email,
      })
      .eq("id", editingContact.contactId);
    if (error) {
      toast({
        title: "Error Occurred",
        description: "Error occurred while updating contact, please try again.",
      });
      return;
    }
    // Update the contact in the students_contacts table
    const { error: contactError } = await supabase
      .from("students_contacts")
      .update({
        relationship: editingContact.relation,
        occupation: editingContact.occupation,
      })
      .eq("id", editingContactId);
    if (contactError) {
      toast({
        title: "Error Occurred",
        description: "Error occurred while updating contact, please try again.",
      });
      return;
    }
    // Reset the editing state
    setIsEditingContact(false);
    setEditingContactId("");
    setEditingContact({
      name: "",
      relation: "",
      phone: "",
      whatsapp: "",
      email: "",
      occupation: "",
      contactId: "",
    });
    // Call the onDataChange function to refetch the contacts
    toast({
      title: "Contact Updated",
      description: "Contact has been updated successfully.",
    });
    onDataChange();
  };

  // Handler to delete a contact entry
  const deleteContactEntry = async (studentContactId: string) => {
    const { error } = await supabase
      .from("students_contacts")
      .delete()
      .eq("id", studentContactId);
    if (error) {
      toast({
        title: "Error Occurred",
        description: "Error occurred while deleting contact, please try again.",
      });
      return;
    }
    toast({
      title: "Contact Deleted",
      description: "Contact has been deleted successfully.",
    });
    // Call the onDataChange function to refetch the contacts
    onDataChange();
  };

  return (
    <div className="flex flex-col gap-2 mt-16">
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-medium">Contact Details</h4>
        <Button
          variant={"link"}
          onClick={() => setIsAddingContact((prev) => !prev)}
        >
          Add New Contact
        </Button>
      </div>
      {/* Contact Details Table */}
      <div className="border border-muted rounded overflow-hidden mb-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact Name</TableHead>
              <TableHead>Relation</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Whatsapp Number</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Occupation</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!studentContacts || !studentContacts.length ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="h-32 w-full flex items-center justify-center">
                    No contact records found.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {studentContacts.map((studentContact) => (
                  <TableRow key={studentContact.id}>
                    <TableCell>
                      {isEditingContact &&
                      editingContactId === studentContact.id ? (
                        <Input
                          placeholder="Contact Name"
                          value={editingContact.name}
                          onChange={(e) =>
                            setEditingContact((prev) => ({
                              ...prev,
                              name: e.currentTarget.value,
                            }))
                          }
                        />
                      ) : (
                        studentContact.contacts.contact_name
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditingContact &&
                      editingContactId === studentContact.id ? (
                        <Select
                          defaultValue={editingContact.relation}
                          onValueChange={(value: Enums<"relation">) =>
                            setEditingContact((prev) => ({
                              ...prev,
                              relation: value,
                            }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Relation" />
                          </SelectTrigger>
                          <SelectContent>
                            {relations.map((relation) => (
                              <SelectItem key={relation} value={relation}>
                                {relation}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        studentContact.relationship
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditingContact &&
                      editingContactId === studentContact.id ? (
                        <Input
                          placeholder="Phone Number"
                          type="tel"
                          value={editingContact.phone}
                          onChange={(e) =>
                            setEditingContact((prev) => ({
                              ...prev,
                              phone: e.currentTarget.value,
                            }))
                          }
                        />
                      ) : (
                        <a href={`tel:${studentContact.contacts.phone}`}>
                          {studentContact.contacts.phone}
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditingContact &&
                      editingContactId === studentContact.id ? (
                        <Input
                          placeholder="Whatsapp Number"
                          type="tel"
                          value={editingContact.whatsapp}
                          onChange={(e) =>
                            setEditingContact((prev) => ({
                              ...prev,
                              whatsapp: e.currentTarget.value,
                            }))
                          }
                        />
                      ) : (
                        <a
                          href={`https://wa.me/${studentContact.contacts.whatsapp_num}`}
                        >
                          {studentContact.contacts.whatsapp_num || "-"}
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditingContact &&
                      editingContactId === studentContact.id ? (
                        <Input
                          placeholder="Email"
                          type="email"
                          value={editingContact.email}
                          onChange={(e) =>
                            setEditingContact((prev) => ({
                              ...prev,
                              email: e.currentTarget.value,
                            }))
                          }
                        />
                      ) : (
                        studentContact.contacts.email || "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditingContact &&
                      editingContactId === studentContact.id ? (
                        <Input
                          placeholder="Occupation"
                          type="text"
                          value={editingContact.occupation}
                          onChange={(e) =>
                            setEditingContact((prev) => ({
                              ...prev,
                              occupation: e.currentTarget.value,
                            }))
                          }
                        />
                      ) : (
                        studentContact.occupation || "-"
                      )}
                    </TableCell>
                    <TableCell className="flex gap-2 items-center">
                      <Button
                        size={"icon"}
                        variant={"ghost"}
                        onClick={() => {
                          if (
                            isEditingContact &&
                            editingContactId === studentContact.id
                          ) {
                            // save the edited contact
                            submitEditedEntry();
                            return;
                          }
                          editContactEntry(studentContact);
                        }}
                      >
                        {isEditingContact &&
                        editingContactId === studentContact.id ? (
                          <SaveIcon />
                        ) : (
                          <Edit />
                        )}
                      </Button>
                      <Button
                        size={"icon"}
                        variant={"destructive-alt"}
                        onClick={() => deleteContactEntry(studentContact.id)}
                      >
                        <Trash />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
            {isAddingContact && (
              <TableRow>
                <TableCell>
                  {/* Contact Name, Table: contacts */}
                  <Input
                    placeholder="Contact Name"
                    value={newContact.name}
                    onChange={(e) =>
                      setNewContact((prev) => ({
                        ...prev,
                        name: e.currentTarget.value,
                      }))
                    }
                  />
                </TableCell>
                <TableCell>
                  {/* Relation, Table: students_contacts */}
                  <Select
                    defaultValue={newContact.occupation}
                    onValueChange={(value: Enums<"relation">) =>
                      setNewContact((prev) => ({ ...prev, relation: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Relation" />
                    </SelectTrigger>
                    <SelectContent>
                      {relations.map((relation) => (
                        <SelectItem key={relation} value={relation}>
                          {relation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {/* Phone Number, Table: contacts */}
                  <Input
                    placeholder="Phone Number"
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) =>
                      setNewContact((prev) => ({
                        ...prev,
                        phone: e.currentTarget.value,
                      }))
                    }
                  />
                </TableCell>
                <TableCell>
                  {/* Whatsapp Number, Table: contacts */}
                  <Input
                    placeholder="Whatsapp Number"
                    type="tel"
                    value={newContact.whatsapp}
                    onChange={(e) =>
                      setNewContact((prev) => ({
                        ...prev,
                        whatsapp: e.currentTarget.value,
                      }))
                    }
                  />
                </TableCell>
                <TableCell>
                  {/* Email, Table: contacts */}
                  <Input
                    placeholder="Email"
                    type="text"
                    value={newContact.email}
                    onChange={(e) =>
                      setNewContact((prev) => ({
                        ...prev,
                        email: e.currentTarget.value,
                      }))
                    }
                  />
                </TableCell>
                <TableCell>
                  {/* Occupation, Table: students_contacts */}
                  <Input
                    placeholder="Occupation"
                    type="text"
                    value={newContact.occupation}
                    onChange={(e) =>
                      setNewContact((prev) => ({
                        ...prev,
                        occupation: e.currentTarget.value,
                      }))
                    }
                  />
                </TableCell>
                <TableCell className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size={"icon"}
                    onClick={submitNewEntry}
                  >
                    <SaveIcon />
                  </Button>
                  <Button
                    size={"icon"}
                    variant="destructive-alt"
                    onClick={() => setIsAddingContact(false)}
                  >
                    <X />
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
