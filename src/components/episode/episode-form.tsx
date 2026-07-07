"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Episode } from "@kinexel/webtoon-db";

import type { EpisodeFormState } from "@/app/actions/episodes";
import { useI18n } from "@/components/i18n-provider";
import { ImageUrlField } from "@/components/image-url-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  action: (state: EpisodeFormState, formData: FormData) => Promise<EpisodeFormState>;
  episode: Episode;
  submitLabel: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function EpisodeForm({ action, episode, submitLabel }: Props) {
  const [state, formAction] = useActionState<EpisodeFormState, FormData>(action, {});
  const { dict } = useI18n();
  const fe = state.fieldErrors ?? {};
  const v = state.values;

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">{dict.episodeForm.title}</Label>
        <Input id="title" name="title" defaultValue={v?.title ?? episode.title} />
        <FieldError message={fe.title} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>{dict.episodeForm.thumbnail}</Label>
        <ImageUrlField
          name="thumbnailUrl"
          prefix="episodes/thumbnail"
          defaultValue={v?.thumbnailUrl ?? episode.thumbnailUrl ?? ""}
        />
        <FieldError message={fe.thumbnailUrl} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">{dict.episodeForm.description}</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={v?.description ?? episode.description ?? ""}
        />
      </div>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <div>
        <SubmitButton label={submitLabel} pendingLabel={dict.common.saving} />
      </div>
    </form>
  );
}
