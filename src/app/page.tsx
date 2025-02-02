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

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);
  
    try {
      const cacheBuster = `&cache=${Date.now()}`;
      const url = `${process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL}?${cacheBuster}`;
      const response = await axios.post(
        url,
        JSON.stringify(data), // Send as raw string
        {
          headers: {
            "Content-Type": "text/plain", // Bypass CORS preflight
          },
        }
      );
  
      if (response.data.success) {
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setSubmitError(error.response?.data?.message || 'Submission failed');
      } else {
        setSubmitError('Submission failed');
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
            render = {({ field }) => (
              <RatingGroup.Root name={field.name} value={field.value} onValueChange={({ value }) => field.onChange(value)} defaultValue={5}>
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
                      <Text fontSize="xl">{emojiMap[index+1]}</Text>
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
      <Button colorPalette="green"
        variant="surface"
        type="submit"
        w="100%"
        bg="colorpalette.950"
        color="white"
        loading={isSubmitting}
        disabled={isSubmitting}>
          Submit
      </Button>
      {submitSuccess && (
        <Text color="green.500" fontSize="sm">
          ✓ Submitted successfully!
        </Text>
      )}

      {submitError && (
        <Text color="red.500" fontSize="sm">
          ⚠️ {submitError}
        </Text>
      )}
      </VStack>
    </Center>
    </form>
  );
}
