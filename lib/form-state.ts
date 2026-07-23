export type FormActionState = {
  status: "idle" | "success" | "error";
  message: string;
  listingId?: string;
  slug?: string;
  reviewRequested?: boolean;
  submissionId?: string;
};

export const initialFormActionState: FormActionState = {
  status: "idle",
  message: "",
};
