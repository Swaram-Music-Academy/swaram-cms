import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressRecord } from "@/lib/types";

interface AddressCardProps {
  addressData: AddressRecord;
  onChange: (field: string, value: string) => void;
}

export default function AddressCard({
  addressData,
  onChange,
}: AddressCardProps) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-2xl font-medium">Address Details</h3>
      </CardHeader>
      <CardContent>
        <div className="lg:max-w-[50%] grid grid-cols-6 gap-4">
          <div className="col-span-1 flex flex-col gap-2">
            <Label htmlFor="unit">Unit</Label>
            <Input
              type="text"
              value={addressData.unit || ""}
              onChange={(e) => onChange("unit", e.target.value)}
            />
          </div>
          <div className="col-span-5 flex flex-col gap-2">
            <Label
              className="after:content-['_*'] after:text-red-600"
              htmlFor="line1"
            >
              Line 1
            </Label>
            <Input
              type="text"
              value={addressData.line_1}
              onChange={(e) => onChange("line_1", e.target.value)}
            />
          </div>
          <div className="col-span-6 flex flex-col gap-2">
            <Label htmlFor="line2">Line 2</Label>
            <Input
              type="text"
              value={addressData.line_2 || ""}
              onChange={(e) => onChange("line_2", e.target.value)}
            />
          </div>
          <div className="col-span-3 flex flex-col gap-2">
            <Label
              className="after:content-['_*'] after:text-red-600"
              htmlFor="city"
            >
              City
            </Label>
            <Input
              type="text"
              value={addressData.city}
              onChange={(e) => onChange("city", e.target.value)}
            />
          </div>
          <div className="col-span-3 flex flex-col gap-2">
            <Label
              className="after:content-['_*'] after:text-red-600"
              htmlFor="state"
            >
              State
            </Label>
            <Input
              type="text"
              value={addressData.state}
              onChange={(e) => onChange("state", e.target.value)}
            />
          </div>
          <div className="col-span-4 flex flex-col gap-2">
            <Label
              className="after:content-['_*'] after:text-red-600"
              htmlFor="country"
            >
              Country
            </Label>
            <Input
              type="text"
              value={addressData.country}
              onChange={(e) => onChange("country", e.target.value)}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-2">
            <Label
              className="after:content-['_*'] after:text-red-600"
              htmlFor="zipcode"
            >
              Zipcode
            </Label>
            <Input
              type="text"
              value={addressData.zipcode}
              onChange={(e) => onChange("zipcode", e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
