"use client"
import { Button } from "@/components/ui/button"
import { VStack, Center, RatingGroup, Text } from "@chakra-ui/react"
import React, { useState } from "react"
import axios from "axios"

import { zodResolver } from "@hookform/resolvers/zod"
import { Field } from "@/components/ui/field"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

const formSchema = z.object({
  rating: z.number({ required_error: "Rating is required" }).min(1).max(10),
})
type FormValues = z.infer<typeof formSchema>
const emojiMap: Record<string, string> = {
  1: "😴",
  2: "🥱",
  3: "😒",
  4: "🫥",
  5: "😐",
  6: "🙂",
  7: "😀",
  8: "😎",
  9: "🤩",
  10: "🥳",
}

export default function Home() {
  const { 
    handleSubmit, 
    formState: { errors },
    control 
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [geoLocation, setGeoLocation] = useState<{ lat: number | null, lng: number | null }>({ lat: null, lng: null });
  const [geoError, setGeoError] = useState<string | null>(null);

  const getLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
      }
      
      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const onSubmit = handleSubmit(async (formData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setGeoError(null);
    setGeoLocation({ lat: null, lng: null });

    try {
      // Get user's location
      const position = await getLocation();
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      setGeoLocation(coords);

      // Prepare submission data
      const submissionData = {
        ...formData,
        ...coords
      };

      // Submit to Google Sheets
      const cacheBuster = `&cache=${Date.now()}`;
      const url = `${process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL}?${cacheBuster}`;
      
      const response = await axios.post(
        url,
        JSON.stringify(submissionData),
        {
          headers: {
            "Content-Type": "text/plain",
          },
        }
      );

      if (response.data.success) {
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        setGeoError('Location sharing was blocked - submitted rating without location');
        // Submit without location data
        await axios.post(
          `${process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL}`,
          JSON.stringify(formData),
          { headers: { "Content-Type": "text/plain" } }
        );
      } else if (axios.isAxiosError(error)) {
        setSubmitError(error.response?.data?.message || 'Submission failed');
      } else {
        setSubmitError('An unexpected error occurred');
      }
      setTimeout(() => setSubmitError(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <Center h="100vh" fontStyle={"mono"}>
        <VStack justify={"flex-start"}>
          <Field
            label="Rating"
            invalid={!!errors.rating}
            errorText={errors.rating?.message}
          >
            <Controller
              control={control}
              name="rating"
              render={({ field }) => (
                <RatingGroup.Root 
                  name={field.name} 
                  value={field.value} 
                  onValueChange={({ value }) => field.onChange(value)} 
                  defaultValue={5}
                >
                  <RatingGroup.Control>
                    {Array.from({ length: 10 }).map((_, index) => (
                      <RatingGroup.Item
                        key={index}
                        index={index + 1}
                        minW="9"
                        filter={{ base: "grayscale(1)", _checked: "revert" }}
                        transition="scale 0.1s"
                        _hover={{ scale: "1.1" }}
                      >
                        <VStack>
                          <Text fontSize="xl">{emojiMap[index + 1]}</Text>
                          <Text fontSize="sm" color="green.800">
                            {index + 1}
                          </Text>
                        </VStack>
                      </RatingGroup.Item>
                    ))}
                  </RatingGroup.Control>
                </RatingGroup.Root>
              )}
            />
          </Field>

          <Button 
            colorPalette="green"
            variant="surface"
            type="submit"
            w="100%"
            bg="colorpalette.950"
            color="white"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Submit
          </Button>

          {submitSuccess && (
            <Text color="green.500" fontSize="sm">
              ✅ Submitted successfully!
              {geoLocation.lat && ` (Location: ${geoLocation.lat.toFixed(4)}, ${geoLocation.lng?.toFixed(4)})`}
            </Text>
          )}

          {submitError && (
            <Text color="red.500" fontSize="sm">
              ⚠️ {submitError}
            </Text>
          )}

          {geoError && (
            <Text color="orange.500" fontSize="sm">
              ⚠️ {geoError}
            </Text>
          )}
        </VStack>
      </Center>
    </form>
  );
}