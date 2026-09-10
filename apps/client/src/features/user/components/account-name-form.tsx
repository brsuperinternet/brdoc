import { Button, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { userAtom } from "@/features/user/atoms/current-user-atom.ts";
import { updateUser } from "@/features/user/services/user-service.ts";
import { IUser } from "@/features/user/types/user.types.ts";

const formSchema = z.object({
  name: z.string().min(1).max(40),
});

type FormValues = z.infer<typeof formSchema>;

export default function AccountNameForm() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useAtom(userAtom);

  const form = useForm<FormValues>({
    initialValues: {
      name: user?.name,
    },
    validate: zod4Resolver(formSchema),
  });

  async function handleSubmit(data: Partial<IUser>) {
    setIsLoading(true);

    try {
      const updatedUser = await updateUser(data);
      setUser(updatedUser);
      notifications.show({
        message: t("Updated successfully"),
      });
    } catch (err) {
      console.log(err);
      notifications.show({
        color: "red",
        message: t("Failed to update data"),
      });
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        id="name"
        label={t("Name")}
        placeholder={t("Your name")}
        variant="filled"
        {...form.getInputProps("name")}
      />
      <Button disabled={isLoading} loading={isLoading} mt="sm" type="submit">
        {t("Save")}
      </Button>
    </form>
  );
}

/*
<div className={classes.controls}>
          <TextInput
            placeholder="Your email"
            classNames={{ input: classes.input, root: classes.inputWrapper }}
          />
          <Button className={classes.control}>Subscribe</Button>
        </div>
*/
