"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Episode } from "@kinexel/webtoon-db";

import type { EpisodeFormState } from "@/app/actions/episodes";
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

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "저장 중…" : label}
    </Button>
  );
}

export function EpisodeForm({ action, episode, submitLabel }: Props) {
  const [state, formAction] = useActionState<EpisodeFormState, FormData>(action, {});
  const fe = state.fieldErrors ?? {};
  const v = state.values;

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">제목</Label>
        <Input id="title" name="title" defaultValue={v?.title ?? episode.title} />
        <FieldError message={fe.title} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>회차 썸네일</Label>
        <ImageUrlField
          name="thumbnailUrl"
          prefix="episodes/thumbnail"
          defaultValue={v?.thumbnailUrl ?? episode.thumbnailUrl ?? ""}
        />
        <FieldError message={fe.thumbnailUrl} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">설명</Label>
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
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
