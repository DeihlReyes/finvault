"use client";
"use no memo";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateProfileSchema } from "@/lib/validators/user";
import type { Resolver } from "react-hook-form";
import { z } from "zod";
type ProfileInput = z.output<typeof updateProfileSchema>;
import { updateProfile } from "@/actions/user";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "../ui/select";

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

type Props = {
  initialValues: {
    displayName: string | null;
    currency: string;
    timezone: string;
  };
};

export function ProfileForm({ initialValues }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ProfileInput>({
    resolver: zodResolver(updateProfileSchema) as Resolver<ProfileInput>,
    defaultValues: {
      displayName: initialValues.displayName ?? "",
      currency: initialValues.currency,
      timezone: initialValues.timezone,
    },
  });

  async function onSubmit(data: ProfileInput) {
    setServerError(null);
    const fd = new FormData();
    if (data.displayName) fd.append("displayName", data.displayName);
    fd.append("currency", data.currency);
    fd.append("timezone", data.timezone);

    const result = await updateProfile(null, fd);
    if (result.success) {
      toast.success("Profile updated!");
      form.reset(data);
    } else {
      setServerError(result.error ?? "Something went wrong.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="Your name"
                  className="h-9 w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default currency</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  maxLength={3}
                  placeholder="USD"
                  className="h-9 w-full uppercase"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <FormControl>
                <Select {...field}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {COMMON_TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <div className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">
            {serverError}
          </div>
        )}

        <Button
          type="submit"
          disabled={form.formState.isSubmitting || !form.formState.isDirty}
          className="w-full h-10"
        >
          {form.formState.isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </Form>
  );
}
