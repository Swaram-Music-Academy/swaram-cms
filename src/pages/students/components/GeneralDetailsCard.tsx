import { ChangeEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditPersonalDetails, PersonalDetails } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Loader from "@/components/Loader";
import DatePicker from "@/components/ui/date-picker";
import { toast } from "@/hooks/use-toast";

interface GeneralDetailsCardProps {
  formData: PersonalDetails | EditPersonalDetails;
  onChange: (field: string, value: string | File | Date) => void;
}

export default function GeneralDetailsCard({
  formData,
  onChange,
}: GeneralDetailsCardProps) {
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraLoader, setCameraLoader] = useState(false);
  const startCamera = async () => {
    setCameraLoader(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.classList.toggle("hidden");
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCapturing(true);
        setAvatarPreview(null);
      }
    } catch (error) {
      // Turn this to toast error
      toast({
        title: "Camera Access Error",
        description: "Unable to access the camera. Please check permissions.",
        variant: "destructive",
      });
      console.error("Camera access denied or unavailable", error);
    }
    setCameraLoader(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext("2d");
    const video = videoRef.current;
    canvasRef.current.width = video.videoWidth;
    canvasRef.current.height = video.videoHeight;
    context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    // Stop the camera
    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach((track) => track.stop());
    setIsCapturing(false);
    videoRef.current.classList.toggle("hidden");

    // Convert to image and file
    const imageDataURL = canvasRef.current.toDataURL("image/png");
    setAvatarPreview(imageDataURL);

    // Convert DataURL to File
    const byteString = atob(imageDataURL.split(",")[1]);
    const mimeString = imageDataURL.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const imageBlob = new Blob([ab], { type: mimeString });
    const file = new File([imageBlob], "captured_image.png", {
      type: mimeString,
    });
    onChange("avatarFile", file);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) return;
            const pngFile = new File(
              [blob],
              file.name.replace(/\.\w+$/, ".png"),
              {
                type: "image/png",
              }
            );

            onChange("avatarFile", pngFile);

            const previewReader = new FileReader();
            previewReader.onloadend = () => {
              setAvatarPreview(previewReader.result as string);
            };
            previewReader.readAsDataURL(pngFile);
          },
          "image/png",
          1.0
        );
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-2xl font-medium">General Details</h3>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col-reverse lg:flex-row gap-4">
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => onChange("first_name", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="middle_name">Middle Name</Label>
              <Input
                id="middle_name"
                value={formData.middle_name || ""}
                onChange={(e) => onChange("middle_name", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => onChange("last_name", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => onChange("gender", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3">
              <Label>Date of Birth</Label>
              <DatePicker
                value={formData.date_of_birth || undefined}
                onValueChange={(date) => onChange("date_of_birth", date)}
                startYear={new Date().getFullYear() - 85}
                endYear={new Date().getFullYear() - 2}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label>Admission Date</Label>
              <DatePicker
                value={formData.admission_date || undefined}
                onValueChange={(date) => onChange("admission_date", date)}
              />
            </div>
          </div>
          <div className="w-full lg:w-1/2 flex flex-col items-center gap-4">
            <video
              ref={videoRef}
              className="absolute z-10 hidden rounded-full overflow-hidden border w-48 h-48 object-cover"
              autoPlay
              muted
            />
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar Preview"
                className="w-48 h-48 object-cover rounded-full"
              />
            ) : (
              <div className="w-48 h-48 rounded-full bg-secondary">
                {cameraLoader ? <Loader /> : ""}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                onClick={() => fileUploadRef.current?.click()}
                variant="ghost"
                className="w-fit"
              >
                Upload Image
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={isCapturing ? capturePhoto : startCamera}
                className="w-fit"
              >
                {isCapturing ? "Take Snapshot" : "Capture Image"}
              </Button>
            </div>
            <Input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileUploadRef}
              onChange={handleImageChange}
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
